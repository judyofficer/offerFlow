import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/job-page.ts';
import { validateJobUrl } from '../server/jobService.ts';
import { inferFromUrl } from '../src/features/applications/utils/urlJobParser.ts';
import { jobServiceNetworkError, jobServiceResponseError } from '../src/features/applications/utils/jobServiceErrors.ts';

const origin = 'https://offerflow1.netlify.app';

test('Netlify 函数使用 Web Request/Response，缺少链接返回 JSON，不返回首页 HTML', async () => {
  const response = await handler(new Request(`${origin}/.netlify/functions/job-page`));
  assert.equal(response.status, 422);
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.equal((await response.json()).error, '请提供有效的职位链接。');
});

test('Netlify 函数保留方法限制和公开地址校验', async () => {
  const post = await handler(new Request(`${origin}/api/job-page`, {method:'POST'}));
  assert.equal(post.status,405);
  assert.equal(post.headers.get('allow'),'GET');
  const invalid = await handler(new Request(`${origin}/api/job-page?url=${encodeURIComponent('https://127.0.0.1/')}`));
  assert.equal(invalid.status,422);
  assert.match((await invalid.json()).error,/暂不支持/);
});

test('支持北森 zhiye.com 招聘子域，仍拒绝伪装域名', () => {
  const url = 'https://360campus.zhiye.com/campus/detail?jobAdId=30af89b8-913a-434f-8e8d-605a1bf71ff8';
  assert.equal(validateJobUrl(url).hostname,'360campus.zhiye.com');
  assert.equal(inferFromUrl(url).source,'北森招聘');
  assert.throws(()=>validateJobUrl('https://360campus.zhiye.com.attacker.test/campus/detail'));
});

test('区分 Netlify 未部署、函数故障和网络/CORS 错误，保留 JSON 业务错误', () => {
  assert.match(jobServiceResponseError(200,'text/html',true),/不能只上传 dist/);
  assert.match(jobServiceResponseError(404,'text/html',true),/HTTP 404/);
  assert.match(jobServiceResponseError(502,'text/plain',true),/函数日志/);
  assert.match(jobServiceNetworkError(true),/跨域/);
  assert.equal(jobServiceResponseError(422,'application/json; charset=utf-8',true),undefined);
});


test('发布目录的 _redirects 优先转发解析接口，防止 SPA 规则吞掉函数请求', () => {
  const rules = readFileSync(new URL('../public/_redirects', import.meta.url),'utf8').trim().split('\n');
  assert.equal(rules[0],'/api/job-page /.netlify/functions/job-page 200!');
  assert.equal(rules.at(-1),'/* /index.html 200');
});
