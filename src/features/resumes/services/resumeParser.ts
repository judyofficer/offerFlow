import { useSettingsStore } from '../../settings/store/useSettingsStore';
import type { ResumeContent } from '../types/resume';

/**
 * 判定 PDF 字体是否为粗体（Bold / Semibold / Heavy / Black / 粗体 / 700+）
 */
const isBoldFont = (fontName: string, styles: Record<string, any>): boolean => {
  if (!fontName) return false;
  const style = styles?.[fontName];
  const family = (style && style.fontFamily) || '';
  const combined = `${fontName} ${family}`.toLowerCase();

  return (
    combined.includes('bold') ||
    combined.includes('black') ||
    combined.includes('heavy') ||
    combined.includes('semibold') ||
    combined.includes('semi-bold') ||
    combined.includes('demibold') ||
    combined.includes('demi-bold') ||
    combined.includes('extrabold') ||
    combined.includes('extra-bold') ||
    combined.includes('ultrabold') ||
    combined.includes('ultra-bold') ||
    combined.includes('w6') ||
    combined.includes('w7') ||
    combined.includes('w8') ||
    combined.includes('w9') ||
    combined.includes('700') ||
    combined.includes('800') ||
    combined.includes('900') ||
    combined.includes('simhei') ||
    combined.includes('heiti') ||
    combined.includes('粗') ||
    combined.endsWith('-bd') ||
    combined.endsWith('_bd') ||
    combined.includes('boldmt')
  );
};

/**
 * 从 PDF 单页 items 数组中高精度提取文本并还原原 PDF 的物理加粗标记（**加粗内容**）
 */
const extractPageTextWithBold = (items: any[], styles: Record<string, any>): string => {
  let pageText = '';
  let inBold = false;
  let lastY: number | null = null;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const str = item.str;
    if (str === undefined || str === null) continue;

    // 根据坐标变化或 hasEOL 判断物理换行
    const currentY = item.transform ? item.transform[5] : null;
    const isLineBreak = item.hasEOL || (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5);

    if (isLineBreak && pageText.length > 0) {
      if (inBold) {
        pageText += '**';
        inBold = false;
      }
      pageText += '\n';
    }

    if (!str) {
      lastY = currentY;
      continue;
    }

    const isBold = isBoldFont(item.fontName, styles);

    if (isBold && !inBold) {
      const leadingSpaces = str.match(/^\s*/)[0];
      const trimmedStart = str.slice(leadingSpaces.length);
      pageText += leadingSpaces + '**';
      pageText += trimmedStart;
      inBold = true;
    } else if (!isBold && inBold) {
      pageText += '**';
      inBold = false;
      pageText += str;
    } else {
      pageText += str;
    }

    lastY = currentY;
  }

  if (inBold) {
    pageText += '**';
    inBold = false;
  }

  // 清洗空加粗标记与前后多余空格
  return pageText
    .replace(/\*\*\s*\*\*/g, '')
    .replace(/\*\*([^*]+)\s+\*\*/g, '**$1** ');
};

/**
 * 从 PDF File 对象提取高保真文本（包含原 PDF 真实加粗标记 **...**）
 */
export const extractTextFromPdf = async (file: File): Promise<string> => {
  try {
    // Dynamic import to prevent pdfjs-dist from leaking into the initial entry bundle
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = extractPageTextWithBold(textContent.items, textContent.styles);
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error("PDF Extraction error:", error);
    throw new Error('无法读取 PDF 文件，请确保文件未加密或损坏。');
  }
};

/**
 * 智能规范化 OpenAI 兼容的聊天补全接口 URL
 * 自动处理 Base URL、尾部斜杠并智能补齐 /chat/completions，彻底杜绝 404 错误
 */
const normalizeOpenAIChatUrl = (rawUrl: string, defaultFallback: string): string => {
  let url = (rawUrl || '').trim();
  if (!url) return defaultFallback;

  // 移除末尾所有斜杠
  url = url.replace(/\/+$/, '');

  // 若已经是完整的 chat/completions 端点
  if (url.endsWith('/chat/completions')) {
    return url;
  }

  // 若以 /v1 结尾（例如 https://api.siliconflow.cn/v1）
  if (url.endsWith('/v1')) {
    return `${url}/chat/completions`;
  }

  // 若仅填写了域名（例如 https://api.siliconflow.cn 或 https://api.deepseek.com）
  return `${url}/v1/chat/completions`;
};

/**
 * 调用大语言模型 API 将带有原生加粗标记的简历文本结构化为规范 JSON
 */
export const parseTextWithLLM = async (text: string): Promise<ResumeContent> => {
  const { llmProvider, apiKey, apiUrl, model } = useSettingsStore.getState();

  if (!apiKey) {
    throw new Error('未配置 API Key。请前往【系统设置】配置您的 AI 接口。');
  }

  const systemPrompt = `你是一个顶级的专业简历解析与结构化重塑专家。请提取用户提供的简历原始文本，并将其转换为符合指定结构的严格 JSON 格式。
不要输出任何 Markdown 代码块包裹符（如 \`\`\`json），只输出纯 JSON 字符串。
确保提取的信息尽可能完整详尽，保留原始语意与细节，对于没有的信息留空字符串 "" 或空数组 []。

【🚨 核心加粗保真规则（绝对禁止臆造加粗）】
传入的简历原始文本中，已经通过底层 PDF 解析算法高精度提取并保留了原 PDF 中的真实加粗排版（标记为 **加粗文本**）。
请务必遵循以下铁律：
1. **100% 忠实保留原文本中的 **加粗标记**，将其原样还原在对应的字段中（如专业技能 skills、工作经历 description、项目经历 highlights、自我评价 summary 等）；
2. **绝对不要自行臆造、猜测或强行给未加粗的词汇添加加粗**！原文本中没有加粗的内容必须保持普通文本。

【📋 结构化提取规则】
1. **专业技能 (skills)**：
   - **必须完整保留**原简历中的描述原文本（包含修饰动词、完整句子、标点符号），保留原有的 **加粗标记**，严禁打碎为孤立单词。
2. **项目与工作经历**：
   - 保留原有的段落或分点（如 "- " 引导列表），忠实继承原文本中的 **加粗标记**。

必须严格符合以下 JSON 结构:
{
  "personalInfo": {
    "name": "姓名",
    "email": "邮箱",
    "phone": "电话",
    "github": "GitHub 链接或账号 (可选)",
    "website": "个人网站/博客/作品集链接 (可选)",
    "summary": "自我评价/个人总结 (保留原文及原 **加粗**)",
    "gender": "性别 (可选, 如 男 / 女)",
    "birthDate": "出生年月 (可选, 如 2002.03)",
    "ethnicity": "民族 (可选, 如 汉族)",
    "politicalStatus": "政治面貌 (可选, 如 中共党员 / 共青团员 / 群众)",
    "city": "现居城市 (可选, 如 北京)",
    "intendedCity": "期望求职城市 (可选, 如 北京 / 深圳 / 远程)",
    "intendedRole": "期望职位 (可选, 如 前端开发工程师 / 全栈开发)",
    "customFields": [
      {
        "id": "随机短字符串",
        "label": "微信号 / 期望薪资 / 英语水平 / Gitee 等自定义标签",
        "value": "对应内容值"
      }
    ]
  },
  "education": [
    {
      "id": "随机短字符串",
      "school": "学校名称",
      "degree": "学历 (如 本科 / 硕士 / 大专)",
      "major": "专业名称",
      "startDate": "起始时间 (如 2020.09)",
      "endDate": "毕业/结束时间 (如 2024.06 或 至今)",
      "gpa": "绩点/专业排名 (可选, 如 3.85 / 4.0 (专业前 5%))",
      "courses": "主修课程 (可选, 如 数据结构、计算机网络、操作系统、算法设计与分析)",
      "description": "其他在校经历说明 (可选)"
    }
  ],
  "experience": [
    {
      "id": "随机短字符串",
      "company": "公司/组织名称",
      "title": "职位名称 (如 前端开发实习生)",
      "startDate": "起始时间 (如 2023.03)",
      "endDate": "结束时间 (如 2024.01 或 至今)",
      "description": "工作内容与业绩产出描述 (保留完整段落或列表，保留原 **加粗**)"
    }
  ],
  "projects": [
    {
      "id": "随机短字符串",
      "name": "项目名称",
      "role": "担任角色 (如 独立开发 / 前端负责人 / 核心开发)",
      "startDate": "起始时间 (如 2023.06)",
      "endDate": "结束时间 (如 2023.12 或 至今)",
      "techStack": "技术栈 (如 React 19 + TypeScript + Zustand + Vite + Tailwind CSS)",
      "description": "项目背景与核心功能介绍 (保留完整描述，保留原 **加粗**)",
      "highlights": "项目亮点、技术攻坚与量化成果 (以 - 开头分点，保留原 **加粗**)",
      "link": "在线体验地址 / GitHub 仓库链接 (可选)"
    }
  ],
  "skills": [
    {
      "id": "随机短字符串",
      "category": "技能分类名称 (如 前端基础、框架与交互、工程化与性能、服务端与 AI 等)",
      "items": [
        "该分类下的完整技能描述原句（保留完整句子与标点符号，保留原 **加粗**）"
      ]
    }
  ],
  "campusExperience": [
    {
      "id": "随机短字符串",
      "organization": "所属组织/社团/学生会名称",
      "role": "担任职务/角色 (如 部长 / 负责人 / 技术干事)",
      "startDate": "起始时间 (如 2021.09)",
      "endDate": "结束时间 (如 2022.06)",
      "description": "工作内容与成果 (突出做了什么，保留原 **加粗**)"
    }
  ],
  "awards": [
    {
      "id": "随机短字符串",
      "name": "荣誉/奖项名称 (如 全国大学生数学建模竞赛 省级一等奖)",
      "awarder": "颁发机构/级别 (如 教育部 / 校级 / 学院)",
      "date": "获奖时间 (如 2023.10)",
      "description": "补充说明/排名 (可选)"
    }
  ]
}`;

  let requestBody: any = {};
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const isOpenAICompatible =
    llmProvider === 'openai' ||
    llmProvider === 'deepseek' ||
    llmProvider === 'siliconflow' ||
    llmProvider === 'custom';

  if (isOpenAICompatible) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    requestBody = {
      model: model.trim() || (llmProvider === 'siliconflow' ? 'deepseek-ai/DeepSeek-V3' : 'gpt-4o'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `简历原文：\n${text}` }
      ],
      temperature: 0.1, // Low temp for extraction accuracy
      response_format: { type: 'json_object' }
    };
  } else if (llmProvider === 'gemini') {
    // Gemini API format
    headers['x-goog-api-key'] = apiKey.trim();
    requestBody = {
      contents: [{
        parts: [
          { text: systemPrompt },
          { text: `简历原文：\n${text}` }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    };
  }

  try {
    let finalUrl = apiUrl.trim();
    if (isOpenAICompatible) {
      finalUrl = normalizeOpenAIChatUrl(finalUrl, 'https://api.siliconflow.cn/v1/chat/completions');
    } else if (llmProvider === 'gemini') {
      let base = finalUrl || 'https://generativelanguage.googleapis.com/v1beta/models/';
      if (!base.endsWith('/')) base += '/';
      finalUrl = `${base}${model.trim() || 'gemini-2.5-flash'}:generateContent`;
    }

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const errDetail = err.error?.message || JSON.stringify(err);
      throw new Error(`API 请求失败 (${response.status} ${response.statusText}): ${errDetail} [请求地址: ${finalUrl}]`);
    }

    const data = await response.json();
    let jsonString = '';

    if (isOpenAICompatible) {
      jsonString = data.choices[0].message.content;
    } else if (llmProvider === 'gemini') {
      jsonString = data.candidates[0].content.parts[0].text;
    }

    // Attempt to clean markdown block wrapper if LLM ignores instruction
    jsonString = jsonString.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.substring(7);
    }
    if (jsonString.startsWith('```')) {
      jsonString = jsonString.substring(3);
    }
    if (jsonString.endsWith('```')) {
      jsonString = jsonString.substring(0, jsonString.length - 3);
    }

    const parsed = JSON.parse(jsonString.trim()) as ResumeContent;
    const generateId = () => Math.random().toString(36).substring(2, 9);
    
    // Normalize and inject robust IDs
    if (!parsed.personalInfo) {
      parsed.personalInfo = { name: '', email: '', phone: '', summary: '' };
    }
    if (Array.isArray(parsed.personalInfo.customFields)) {
      parsed.personalInfo.customFields.forEach(cf => { if (!cf.id) cf.id = generateId(); });
    }

    if (Array.isArray(parsed.education)) {
      parsed.education.forEach(i => {
        if (!i.id) i.id = generateId();
        if (Array.isArray(i.customFields)) {
          i.customFields.forEach(cf => { if (!cf.id) cf.id = generateId(); });
        }
      });
    } else {
      parsed.education = [];
    }

    if (Array.isArray(parsed.experience)) {
      parsed.experience.forEach(i => { if (!i.id) i.id = generateId(); });
    } else {
      parsed.experience = [];
    }

    if (Array.isArray(parsed.projects)) {
      parsed.projects.forEach(i => { if (!i.id) i.id = generateId(); });
    } else {
      parsed.projects = [];
    }

    if (Array.isArray(parsed.skills)) {
      parsed.skills = parsed.skills.map(s => {
        const id = s.id || generateId();
        let items: string[] = [];
        if (Array.isArray(s.items)) {
          items = s.items.map(item => String(item).trim()).filter(Boolean);
        } else if (typeof s.items === 'string') {
          items = [String(s.items).trim()];
        }
        return {
          id,
          category: s.category || '专业技能',
          items: items.length > 0 ? items : ['']
        };
      });
    } else {
      parsed.skills = [];
    }

    if (Array.isArray(parsed.campusExperience)) {
      parsed.campusExperience.forEach(i => { if (!i.id) i.id = generateId(); });
    } else {
      parsed.campusExperience = [];
    }

    if (Array.isArray(parsed.awards)) {
      parsed.awards.forEach(i => { if (typeof i === 'object' && i && !i.id) i.id = generateId(); });
    }
    
    return parsed;
  } catch (error: any) {
    console.error("LLM Parse error:", error);
    throw new Error(`简历解析失败：${error.message}`);
  }
};
