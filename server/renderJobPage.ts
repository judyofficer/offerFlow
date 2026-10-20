import { existsSync } from 'node:fs';
import { chromium as playwright } from 'playwright-core';
import { fetchPublicResource } from './jobNetwork.ts';

export async function renderJobPage(url: URL, signal: AbortSignal) {
  const localPaths = [process.env.JOB_BROWSER_EXECUTABLE, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter((value): value is string => Boolean(value));
  let executablePath = localPaths.find(path => existsSync(path));
  let args: string[] = [];
  if (!executablePath && process.platform === 'linux') {
    const { default: chromium } = await import('@sparticuz/chromium');
    executablePath = await chromium.executablePath();
    args = chromium.args;
  }
  if (!executablePath) throw new Error('当前服务尚未配置动态页面读取环境。');
  signal.throwIfAborted();
  const browser = await playwright.launch({ executablePath, args, headless: true, timeout: 10000 });
  const abort = () => { void browser.close().catch(() => {}); };
  signal.addEventListener('abort', abort, { once: true });
  try {
    const context = await browser.newContext({ serviceWorkers: 'block', acceptDownloads: false, locale: 'zh-CN' });
    await context.routeWebSocket('**/*', route => route.close());
    const page = await context.newPage();
    let resources = 0;
    let bytes = 0;
    await context.route('**/*', async route => {
      const request = route.request();
      // No forms, submissions, downloads, images, third-party frames or private network access.
      if (signal.aborted || ++resources > 120 || bytes > 20 * 1024 * 1024 || request.method() !== 'GET' ||
          ['image', 'media', 'font'].includes(request.resourceType()) ||
          (request.isNavigationRequest() && request.frame() !== page.mainFrame())) {
        await route.abort().catch(() => {});
        return;
      }
      try {
        const resource = await fetchPublicResource(new URL(request.url()), signal, { Accept: request.headers().accept || '*/*' });
        bytes += resource.body.length;
        await route.fulfill({ status: resource.status, headers: resource.headers, body: resource.body });
      } catch { await route.abort().catch(() => {}); }
    });
    await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForFunction(`(() => /岗位职责|职位描述|工作职责|任职要求|任职资格|responsibilities|requirements/i.test(document.body?.innerText || '') || /验证码|安全验证|verify you are human/i.test(document.body?.innerText || ''))()`, undefined, { timeout: 10000 }).catch(() => {});
    signal.throwIfAborted();
    return {
      html: (await page.content()).slice(0, 2 * 1024 * 1024),
      text: (await page.locator('body').innerText()).slice(0, 30000),
      headings: await page.locator('h1, h2, h3, [class*="job-name"], [class*="job-title"], [class*="position-name"], [class*="position-title"], [class*="post-name"]').filter({ visible: true }).allTextContents(),
    };
  } finally {
    signal.removeEventListener('abort', abort);
    await browser.close();
  }
}
