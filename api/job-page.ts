import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleJobRequest, JOB_RESPONSE_HEADERS } from '../server/jobService.ts';
export { validateJobUrl } from '../server/jobService.ts';
export { isPublicIPv4 } from '../server/jobNetwork.ts';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  for (const [name, value] of Object.entries(JOB_RESPONSE_HEADERS)) res.setHeader(name, value);
  if (req.method !== 'GET') res.setHeader('Allow', 'GET');
  const value = new URL(req.url || '/', 'https://offerflow.local').searchParams.get('url');
  const result = await handleJobRequest(req.method || 'GET', value);
  res.writeHead(result.status).end(JSON.stringify(result.body));
}
