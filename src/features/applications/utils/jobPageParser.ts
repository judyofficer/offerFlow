import { parseJobLinkOrText } from './urlJobParser.ts';
import type { ParsedJobResult } from './urlJobParser.ts';

export function plainText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '')
    .replace(/<\/(?:p|div|li|h[1-6])>|<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '')
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp);|&#(?:x[\da-f]+|\d+);/gi, entity => {
      const named: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&nbsp;': ' ' };
      if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
      const hex = entity.toLowerCase().startsWith('&#x');
      const code = parseInt(entity.slice(hex ? 3 : 2, -1), hex ? 16 : 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
    }).replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
}

type JsonObject = Record<string, unknown>;
const object = (value: unknown): JsonObject => value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : {};

function findPosting(value: unknown, depth = 0): JsonObject | undefined {
  if (!value || depth > 12 || typeof value !== 'object') return;
  const record = object(value);
  const types = Array.isArray(record['@type']) ? record['@type'] : [record['@type']];
  if (types.some(type => type === 'JobPosting' || type === 'https://schema.org/JobPosting')) return record;
  for (const child of Object.values(value)) {
    const found = findPosting(child, depth + 1);
    if (found) return found;
  }
}

export function parseJobPage(html: string, url: string): ParsedJobResult {
  const result = parseJobLinkOrText(url);
  let posting: JsonObject | undefined;
  for (const script of html.matchAll(/<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi)) {
    try { posting = findPosting(JSON.parse(script[1])); } catch { /* Some sites publish invalid JSON-LD. */ }
    if (posting) break;
  }
  if (posting) {
    const org = Array.isArray(posting.hiringOrganization) ? posting.hiringOrganization[0] : posting.hiringOrganization;
    const company = plainText(object(org).name);
    const title = plainText(posting.title);
    if (company) result.companyName = company;
    if (title && isPlausibleJobTitle(title)) result.jobTitle = title;
    const description = plainText(posting.description);
    if (description) result.jobDescription = description;
    const locations = Array.isArray(posting.jobLocation) ? posting.jobLocation : [posting.jobLocation];
    const cities = locations.map(location => {
      const address = object(object(location).address);
      return plainText(address.addressLocality) || plainText(address.addressRegion) || plainText(object(location).name);
    }).filter(Boolean);
    if (cities.length) result.location = [...new Set(cities)].join(' / ');
    else if (posting.jobLocationType === 'TELECOMMUTE') result.location = '远程';
    const salary = object(posting.baseSalary);
    const amount = object(salary.value);
    const number = (v: unknown) => typeof v === 'number' && Number.isFinite(v) ? String(v) : '';
    const fixed = number(amount.value) || number(salary.value);
    const range = number(amount.minValue) && number(amount.maxValue) ? `${amount.minValue}-${amount.maxValue}` : '';
    if (range || fixed) {
      const units: Record<string, string> = { HOUR: '小时', DAY: '天', WEEK: '周', MONTH: '月', YEAR: '年' };
      const currency = salary.currency === 'CNY' ? '元' : plainText(salary.currency);
      const unit = units[String(amount.unitText)] || plainText(amount.unitText);
      result.salary = `${range || fixed}${currency}${unit ? `/${unit}` : ''}`;
    }
    if (typeof posting.validThrough === 'string' && /^\d{4}-\d{2}-\d{2}/.test(posting.validThrough) && Number.isFinite(Date.parse(posting.validThrough))) {
      result.deadline = posting.validThrough.slice(0, 10);
    }
  }

  const meta: Record<string, string> = {};
  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs: Record<string, string> = {};
    for (const attr of tag[0].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
      attrs[attr[1].toLowerCase()] = attr[2] ?? attr[3] ?? attr[4];
    }
    const key = attrs.property || attrs.name;
    if (key && attrs.content) meta[key.toLowerCase()] = plainText(attrs.content);
  }
  const pageTitle = meta['og:title'] || plainText(html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1]);
  const description = meta['og:description'] || meta.description;
  // A site-wide description is not evidence of a specific position.
  if (!/登录|验证|访问受限|安全检查|captcha|access denied|sign in/i.test(pageTitle)) {
    const titleInfo = parseJobLinkOrText(pageTitle || '');
    const fallback = parseJobLinkOrText([pageTitle, description].filter(Boolean).join('\n'));
    if (!result.jobTitle && titleInfo.jobTitle && isPlausibleJobTitle(titleInfo.jobTitle) && ROLE_WORDS.test(titleInfo.jobTitle)) result.jobTitle = titleInfo.jobTitle;
    if (result.jobTitle) {
      if (!result.companyName && titleInfo.companyName && /公司|科技|集团|网络|银行|工作室/.test(titleInfo.companyName)) result.companyName = titleInfo.companyName;
      if (!result.salary && fallback.salary) result.salary = fallback.salary;
      if (!result.location && fallback.location) result.location = fallback.location;
      if (!result.jobDescription && description && /岗位职责|工作职责|职位描述|任职要求|responsibilities|requirements/i.test(description)) result.jobDescription = description;
    }
  }
  return result;
}

const ROLE_WORDS = /工程|开发|前端|后端|全栈|算法|产品|设计|运营|专员|经理|实习|架构|测试|数据|管培|分析|助理|顾问|销售|财务|会计|采购|客服|仓储|运维|研发|analyst|engineer|designer|manager|developer|associate|specialist|intern/i;

export function isPlausibleJobTitle(value: string): boolean {
  return value.length >= 2 && value.length <= 100 && !/[。；;\n]/.test(value) &&
    !/一站式|人力资源服务|招聘流程|校园招聘信息|最新招聘|人才服务|职位列表|加入我们|关于我们|招聘首页|隐私|cookie|access denied|验证码|安全检查/i.test(value);
}

// Only use visible detail headings plus a responsibilities/requirements section as job evidence.
export function parseRenderedJobText(headings: string[], text: string, url: string): ParsedJobResult {
  const result = parseJobLinkOrText(url);
  const marker = /岗位职责|工作职责|职位描述|工作内容|任职要求|任职资格|岗位要求|职责描述|responsibilities|requirements|what you(?:'|’)ll do/i;
  const start = text.search(marker);
  if (start < 0 || /验证码|安全验证|access denied|verify you are human/i.test(text.slice(0, 500))) return result;
  const title = headings.map(item => item.trim()).find(item => isPlausibleJobTitle(item) && ROLE_WORDS.test(item));
  if (!title) return result;
  const end = text.slice(start).search(/立即投递|申请职位|推荐职位|相似职位|相关职位|隐私政策|版权所有|copyright/i);
  const description = text.slice(start, end < 0 ? undefined : start + end).trim().slice(0, 18000);
  if (description.length < 30) return result;
  result.jobTitle = title;
  result.jobDescription = description;
  const location = text.match(/(?:工作地点|工作城市|工作地|Location)\s*[:：]?\s*([^\n]{2,80})/i)?.[1]?.trim();
  if (location && !marker.test(location)) result.location = location;
  const salary = text.match(/(?:薪资范围|薪资待遇|薪资|Salary)\s*[:：]?\s*([^\n]{1,60})/i)?.[1]?.trim();
  if (salary && /\d|面议|negotiable/i.test(salary)) result.salary = salary;
  return result;
}
