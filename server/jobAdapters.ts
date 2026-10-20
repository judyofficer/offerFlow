import { decodeResource, fetchPublicResource } from './jobNetwork.ts';
import { plainText } from '../src/features/applications/utils/jobPageParser.ts';
import type { ParsedJobResult } from '../src/features/applications/utils/urlJobParser.ts';

export function getSfPositionId(url: URL): string | undefined {
  if (url.hostname !== 'campus.sf-express.com') return;
  return url.hash.match(/^#\/(?:postDetail|traineeRecruitDetail)\/(\d+)(?:[/?]|$)/i)?.[1];
}

export function parseSfPosition(data: unknown, positionId: string, url: string): ParsedJobResult | undefined {
  if (!data || typeof data !== 'object') return;
  const item = data as Record<string, unknown>;
  if (String(item.id) !== positionId) return;
  const title = plainText(item.positionName);
  if (!title) return;
  const duties = plainText(item.postDuty);
  const requirements = plainText(item.jobRequirement);
  if (!duties && !requirements) return;
  return {
    url, companyName: plainText(item.orgSourceName) || '顺丰', jobTitle: title,
    location: plainText(item.demandCity) || undefined,
    source: '顺丰招聘官网',
    jobDescription: [duties && `岗位职责\n${duties}`, requirements && `任职要求\n${requirements}`, plainText(item.otherRequirement)].filter(Boolean).join('\n\n'),
  };
}

export async function readJobAdapter(url: URL, signal: AbortSignal): Promise<ParsedJobResult | undefined> {
  const id = getSfPositionId(url);
  if (!id) return;
  const resource = await fetchPublicResource(new URL(`/api/web/position/findById/${id}`, url.origin), signal, { Accept: 'application/json' });
  if (resource.status !== 200 || !/json/i.test(resource.headers['content-type'] || '')) return;
  return parseSfPosition(JSON.parse(decodeResource(resource)), id, url.href);
}
