import type { ParsedJobResult } from '../utils/urlJobParser';
import { parseJobPage } from '../utils/jobPageParser';

export async function readJobLink(url: string, signal: AbortSignal) {
  const endpoint = import.meta.env.VITE_JOB_PARSER_ENDPOINT || '/api/job-page';
  const response = await fetch(`${endpoint}?url=${encodeURIComponent(url)}`, { signal });
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('当前环境暂不支持读取职位网页，请确认服务已部署后重新解析。');
  const data = await response.json();
  if (!response.ok || (!data.job && typeof data.html !== 'string')) throw new Error(data.error || '读取职位网页失败，请确认服务已部署后重新解析。');
  const job: ParsedJobResult = data.job || parseJobPage(data.html, data.url || url);
  return { job, text: typeof data.text === 'string' ? data.text : job.jobDescription || '', warning: typeof data.warning === 'string' ? data.warning : undefined };
}
