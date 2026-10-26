import type { ParsedJobResult } from '../utils/urlJobParser';
import { jobServiceNetworkError, jobServiceResponseError } from '../utils/jobServiceErrors';
import { parseJobPage } from '../utils/jobPageParser';

export async function readJobLink(url: string, signal: AbortSignal) {
  const endpoint = import.meta.env.VITE_JOB_PARSER_ENDPOINT || '/api/job-page';
  const isNetlify = typeof window !== 'undefined' && window.location.hostname.endsWith('.netlify.app');
  let response: Response;
  try {
    const target = new URL(endpoint, window.location.origin);
    target.searchParams.set('url', url);
    response = await fetch(target, { signal });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error(jobServiceNetworkError(isNetlify));
  }
  const deploymentError = jobServiceResponseError(response.status, response.headers.get('content-type'), isNetlify);
  if (deploymentError) throw new Error(deploymentError);
  const data = await response.json();
  if (!response.ok || (!data.job && typeof data.html !== 'string')) throw new Error(data.error || '读取职位网页失败，请确认服务已部署后重新解析。');
  const job: ParsedJobResult = data.job || parseJobPage(data.html, data.url || url);
  return { job, text: typeof data.text === 'string' ? data.text : job.jobDescription || '', warning: typeof data.warning === 'string' ? data.warning : undefined };
}
