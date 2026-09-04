import { useSettingsStore } from '../../settings/store/useSettingsStore';
import type { ResumeContent } from '../types/resume';

/**
 * Extract text from a PDF File object
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
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error("PDF Extraction error:", error);
    throw new Error('无法读取 PDF 文件，请确保文件未加密或损坏。');
  }
};

/**
 * Call the configured LLM API to parse resume text into JSON
 */
export const parseTextWithLLM = async (text: string): Promise<ResumeContent> => {
  const { llmProvider, apiKey, apiUrl, model } = useSettingsStore.getState();

  if (!apiKey) {
    throw new Error('未配置 API Key。请前往【系统设置】配置您的 AI 接口。');
  }

  const systemPrompt = `你是一个专业的简历解析助手。请提取以下简历文本，并将其转换为符合指定结构的严格 JSON 格式。
不要输出任何 Markdown 格式代码块，只输出纯 JSON 字符串。
确保提取的经历尽可能详细，对于没有的信息留空字符串。
数组如果为空请返回空数组 []。

【重要高亮规则】
在提取「工作经历(description)」、「项目经历(description)」、「自我评价(summary)」、「校园经历(description)」等长段落文本时，请**主动识别**其中的核心关键词（如：编程语言、开发框架、专业术语、核心业务数据、关键业绩指标等），并使用 Markdown 加粗语法将其包裹（例如：使用 **React** 或 **提升了 30%**）。不要过度加粗，仅高亮最核心的亮点即可。

必须符合以下 JSON 结构:
{
  "personalInfo": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "github": "string (可选)",
    "website": "string (可选)",
    "summary": "string",
    "gender": "string (可选)",
    "birthDate": "string (可选)",
    "ethnicity": "string (可选)",
    "city": "string (可选)",
    "intendedCity": "string (可选)",
    "intendedRole": "string (可选)"
  },
  "education": [
    {
      "id": "随机短字符串",
      "school": "string",
      "degree": "string",
      "major": "string",
      "startDate": "string",
      "endDate": "string",
      "description": "string"
    }
  ],
  "experience": [
    {
      "id": "随机短字符串",
      "company": "string",
      "title": "string",
      "startDate": "string",
      "endDate": "string",
      "description": "string"
    }
  ],
  "projects": [
    {
      "id": "随机短字符串",
      "name": "string",
      "role": "string",
      "startDate": "string",
      "endDate": "string",
      "techStack": "string (可选,如 React / Node)",
      "description": "string (项目介绍)",
      "highlights": "string (项目亮点/成果)",
      "link": "string (可选)"
    }
  ],
  "skills": [
    {
      "id": "随机短字符串",
      "category": "string (例如前端技术、后端技术等)",
      "items": ["string", "string"]
    }
  ],
  "campusExperience": [
    {
      "id": "随机短字符串",
      "organization": "string",
      "role": "string",
      "startDate": "string",
      "endDate": "string",
      "description": "string"
    }
  ],
  "awards": [
    {
      "id": "随机短字符串",
      "name": "string",
      "awarder": "string (颁发机构)",
      "date": "string",
      "description": "string"
    }
  ]
}`;

  let requestBody: any = {};
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Standard OpenAI-compatible body
  if (llmProvider === 'openai' || llmProvider === 'deepseek' || llmProvider === 'custom') {
    headers['Authorization'] = `Bearer ${apiKey}`;
    requestBody = {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `简历原文：\n${text}` }
      ],
      temperature: 0.1, // Low temp for extraction
      response_format: { type: 'json_object' }
    };
  } else if (llmProvider === 'gemini') {
    // Gemini API format
    headers['x-goog-api-key'] = apiKey;
    // URL typically needs to be appended if it's the base URL, assuming apiUrl has the model path
    // For simplicity, we just use a basic payload assuming apiUrl is full
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
    let finalUrl = apiUrl;
    if (llmProvider === 'gemini' && apiUrl.endsWith('/')) {
        finalUrl = `${apiUrl}${model}:generateContent`;
    }

    const response = await fetch(finalUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`API 请求失败: ${response.status} ${response.statusText} ${JSON.stringify(err)}`);
    }

    const data = await response.json();
    let jsonString = '';

    if (llmProvider === 'openai' || llmProvider === 'deepseek' || llmProvider === 'custom') {
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
    
    if (Array.isArray(parsed.education)) parsed.education.forEach(i => i.id = generateId());
    if (Array.isArray(parsed.experience)) parsed.experience.forEach(i => i.id = generateId());
    if (Array.isArray(parsed.projects)) parsed.projects.forEach(i => i.id = generateId());
    if (Array.isArray(parsed.skills)) parsed.skills.forEach(i => i.id = generateId());
    
    return parsed;
  } catch (error: any) {
    console.error("LLM Parse error:", error);
    throw new Error(`简历解析失败：${error.message}`);
  }
};
