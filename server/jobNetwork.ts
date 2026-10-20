import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { request } from 'node:https';

export function isPublicIPv4(address: string): boolean {
  if (isIP(address) !== 4) return false;
  const [a, b, c] = address.split('.').map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && [0, 168].includes(b)) || (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && ([18, 19].includes(b) || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113));
}

export interface PublicResource { status: number; headers: Record<string, string>; body: Buffer }

// Every hop, including browser subresources, is resolved once and pinned to a public IP.
export async function fetchPublicResource(url: URL, signal: AbortSignal, headers: Record<string, string> = {}): Promise<PublicResource> {
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) throw new Error('仅支持公开 HTTPS 招聘页面。');
  signal.throwIfAborted();
  const addresses = await lookup(url.hostname, { family: 4, all: true });
  signal.throwIfAborted();
  if (!addresses.length || addresses.some(item => !isPublicIPv4(item.address))) throw new Error('无法读取该招聘链接。');
  return new Promise((resolve, reject) => {
    const req = request(url, {
      signal, family: 4,
      lookup: (_hostname, _options, callback) => callback(null, addresses[0].address, 4),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OfferFlow/1.0; Job reader)', Accept: 'text/html,application/xhtml+xml,application/json', ...headers, 'Accept-Encoding': 'identity' },
    }, response => {
      const responseHeaders: Record<string, string> = {};
      for (const [key, value] of Object.entries(response.headers)) {
        if (typeof value === 'string' && !['transfer-encoding', 'connection', 'content-length'].includes(key)) responseHeaders[key] = value;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      response.on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > 5 * 1024 * 1024) { response.destroy(new Error('页面资源过大，暂时无法读取。')); return; }
        chunks.push(chunk);
      });
      response.on('end', () => resolve({ status: response.statusCode || 502, headers: responseHeaders, body: Buffer.concat(chunks) }));
      response.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

export function decodeResource(resource: PublicResource): string {
  const charset = resource.headers['content-type']?.match(/charset=["']?([\w-]+)/i)?.[1] || 'utf-8';
  try { return new TextDecoder(charset).decode(resource.body); }
  catch { return resource.body.toString('utf8'); }
}
