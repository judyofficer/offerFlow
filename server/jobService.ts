import { decodeResource, fetchPublicResource } from './jobNetwork.ts';
import { readJobAdapter } from './jobAdapters.ts';
import { parseJobPage, parseRenderedJobText } from '../src/features/applications/utils/jobPageParser.ts';

const ALLOWED_DOMAINS = [
  'zhipin.com', 'nowcoder.com', 'lagou.com', 'liepin.com', '51job.com', 'zhaopin.com',
  'maimai.cn', 'shixiseng.com', 'iguopin.com', 'mokahr.com', 'hotjob.cn', 'beisen.com',
  'zhiye.com', 'jobs.feishu.cn', 'bytedance.com', 'tiktok.com', 'tencent.com', 'alibaba.com',
  'taotian.com', 'aliyun.com', 'antgroup.com', 'meituan.com', 'huawei.com',
  'pinduoduo.com', 'jd.com', '163.com', 'netease.com', 'kuaishou.com', 'kuaishou.cn',
  'xiaohongshu.com', 'mihoyo.com', 'cmbchina.com', 'baidu.com', 'nio.com', 'nio.jobs',
  'xiaopeng.com', 'xpeng.com', 'lixiang.com', 'lijo.jobs', 'bilibili.com',
  'didiglobal.com', 'didichuxing.com', 'microsoft.com', 'apple.com', 'shopee.com',
  'shopee.cn', 'sensetime.com', 'lenovo.com', 'sf-express.com', 'dji.com',
];

export function validateJobUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') ||
      !ALLOWED_DOMAINS.some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`))) {
    throw new Error('暂不支持读取此招聘站点。');
  }
  return url;
}

export const JOB_RESPONSE_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'X-Content-Type-Options': 'nosniff',
};

export async function handleJobRequest(method: string, value: string | null) {
  if (method !== 'GET') return { status: 405, body: { error: '仅支持 GET 请求。' } };
  try {
    if (!value || value.length > 4096) throw new Error('请提供有效的职位链接。');
    let url = validateJobUrl(value);
    const signal = AbortSignal.timeout(40000);
    const adapter = await readJobAdapter(url, AbortSignal.any([signal, AbortSignal.timeout(8000)])).catch(() => undefined);
    if (adapter?.jobTitle) {
      return { status: 200, body: { job: adapter, method: 'detail-api', text: adapter.jobDescription, url: url.href } };
    }
    for (let redirects = 0; redirects <= 3; redirects++) {
      const resource = await fetchPublicResource(url, signal);
      if ([301, 302, 303, 307, 308].includes(resource.status) && resource.headers.location) {
        url = validateJobUrl(new URL(resource.headers.location, url).href);
        continue;
      }
      let html = resource.status === 200 && /text\/html|application\/xhtml\+xml/i.test(resource.headers['content-type'] || '') ? decodeResource(resource) : '';
      let job = parseJobPage(html, url.href);
      let text = job.jobDescription || '';
      let method = 'structured-page';
      if (!job.jobTitle || !job.jobDescription) {
        const { renderJobPage } = await import('./renderJobPage.ts');
        const rendered = await renderJobPage(url, signal).catch(() => undefined);
        if (rendered) {
          html = rendered.html;
          const structured = parseJobPage(html, url.href);
          const visible = parseRenderedJobText(rendered.headings, rendered.text, url.href);
          job = { ...job, ...visible, ...structured };
          // Preserve rendered evidence when a page has no JobPosting schema.
          if (!structured.jobTitle && visible.jobTitle) job.jobTitle = visible.jobTitle;
          if (!structured.jobDescription && visible.jobDescription) job.jobDescription = visible.jobDescription;
          text = job.jobTitle ? rendered.text : '';
          method = 'rendered-page';
        }
      }
      if (!job.jobTitle) {
        return { status: 200, body: { job: { ...job, jobDescription: undefined }, url: url.href, method, text: '', warning: '未读取到可核实的职位详情，已保留公司和链接。可点击重新解析；需要登录或验证的页面暂时无法自动读取。' } };
      }
      return { status: 200, body: { job, url: url.href, method, text: text.slice(0, 18000) } };
    }
    throw new Error('招聘链接跳转过多，请使用最终职位详情页链接。');
  } catch (error) {
    const message = error instanceof Error && error.name !== 'AbortError' ? error.message : '读取职位网页超时，请点击重新解析。';
    return { status: 422, body: { error: message } };
  }
}
