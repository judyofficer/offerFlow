import * as pdfjsLib from 'pdfjs-dist';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import type { ResumeContent } from '../types/resume';

// Set up PDF.js worker securely using CDN matching the installed version to avoid bundler issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Extract text from a PDF File object
 */
export const extractTextFromPdf = async (file: File): Promise<string> => {
  try {
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

必须符合以下 JSON 结构:
{
  "personalInfo": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "summary": "string"
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
      "description": "string",
      "link": "string"
    }
  ],
  "skills": [
    {
      "id": "随机短字符串",
      "category": "string (例如前端技术、后端技术等)",
      "items": ["string", "string"]
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

    return JSON.parse(jsonString.trim()) as ResumeContent;
  } catch (error: any) {
    console.error("LLM Parse error:", error);
    throw new Error(`简历解析失败：${error.message}`);
  }
};
