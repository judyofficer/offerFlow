import { handleJobRequest, JOB_RESPONSE_HEADERS } from '../../server/jobService.ts';

export default async function handler(request: Request): Promise<Response> {
  const value = new URL(request.url).searchParams.get('url');
  const result = await handleJobRequest(request.method, value);
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { ...JOB_RESPONSE_HEADERS, ...(result.status === 405 ? { Allow: 'GET' } : {}) },
  });
}
