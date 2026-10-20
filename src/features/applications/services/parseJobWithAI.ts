import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { parseJobLinkOrText } from '../utils/urlJobParser';
import type { ParsedJobResult } from '../utils/urlJobParser';

/**
 * AI 深度结构化提取 (当用户在系统设置配置了 API Key 时可用)
 */
export async function parseJobWithAI(text: string, signal?: AbortSignal): Promise<ParsedJobResult> {
  const { apiKey, apiUrl, model } = useSettingsStore.getState();

  if (!apiKey) {
    throw new Error('未配置 API Key，请先前往【系统设置】配置 AI 接口。');
  }

  // 先用本地解析出 URL 兜底
  const localParsed = parseJobLinkOrText(text);

  const prompt = `请从以下招聘信息/分享文本中精准提取岗位信息。只提取文本明确提供的信息，缺失字段留空，不要猜测链接网页的内容。
只输出纯 JSON 字符串，不要带任何 Markdown 代码块标签（如 \`\`\`json）。
JSON 格式要求如下：
{
  "companyName": "公司名称 (如 字节跳动)",
  "jobTitle": "岗位名称 (如 前端开发工程师)",
  "salary": "薪资范围 (如 25k-40k·16薪，无则填空字符串)",
  "location": "工作城市 (如 北京 / 远程，无则填空字符串)",
  "source": "招聘来源 (如 Boss直聘 / 官网 / 牛客网，无则填空字符串)",
  "priority": "dream 或 target 或 safety",
  "url": "岗位链接或进度查询链接 (无则填空字符串)",
  "jobDescription": "岗位职责与要求 (无则填空字符串)"
}

招聘信息文本：
${text}`;

  const cleanApiUrl = (apiUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const targetUrl = cleanApiUrl.endsWith('/chat/completions') ? cleanApiUrl : `${cleanApiUrl}/chat/completions`;

  const response = await fetch(targetUrl, {
    signal,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '你是一个专业的招聘岗位文本结构化提取器。只返回纯 JSON，严禁多余对话。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI 解析请求失败 (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || '{}';
  const cleanJson = rawContent.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanJson);

  return {
    url: parsed.url || localParsed.url || '',
    companyName: parsed.companyName || localParsed.companyName || '',
    jobTitle: parsed.jobTitle || localParsed.jobTitle || '',
    salary: parsed.salary || localParsed.salary || '',
    location: parsed.location || localParsed.location || '',
    source: parsed.source || localParsed.source || '',
    priority: parsed.priority || localParsed.priority || 'target',
    jobDescription: parsed.jobDescription || localParsed.jobDescription || '',
    rawText: text,
  };
}
