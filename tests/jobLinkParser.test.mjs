import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseJobLinkOrText, inferFromUrl, extractUrlFromText } from '../src/features/applications/utils/urlJobParser.ts';
import { parseJobPage } from '../src/features/applications/utils/jobPageParser.ts';
import handler, { validateJobUrl, isPublicIPv4 } from '../api/job-page.ts';

const url = 'https://jobs.bytedance.com/position/123';

test('职位链接识别公司和来源，不把链接 ID 猜成岗位', () => {
  const parsed = parseJobLinkOrText(url);
  assert.equal(parsed.companyName, '字节跳动');
  assert.equal(parsed.source, '字节跳动招聘官网');
  assert.equal(parsed.jobTitle, undefined);
  assert.equal(extractUrlFromText('jobs.bytedance.com/position/123').url, url);
  assert.deepEqual(inferFromUrl('https://bytedance.com.attacker.test/job'), {});
});

test('分享文案补入字段和截止日期，非法日期不使解析崩溃', () => {
  const parsed = parseJobLinkOrText(`【Boss直聘】公司：示例科技 岗位：前端开发工程师 薪资：25k-35k 地点：上海\n招聘截止：2026-11-20\nhttps://www.zhipin.com/job_detail/123.html`);
  assert.equal(parsed.companyName, '示例科技');
  assert.equal(parsed.jobTitle, '前端开发工程师');
  assert.equal(parsed.salary, '25k-35k');
  assert.equal(parsed.location, '上海');
  assert.equal(parsed.source, 'Boss直聘');
  assert.equal(parsed.deadline, '2026-11-20');
  assert.doesNotThrow(() => parseJobLinkOrText('招聘截止：2026-99-99'));
});

test('读取嵌套 JSON-LD 的岗位、公司、城市、薪资、描述和截止日期', () => {
  const html = `<script type="application/ld+json">${JSON.stringify({ '@graph': [{ '@type': ['Thing', 'JobPosting'], title: 'Senior Frontend Engineer', hiringOrganization: {name:'示例科技'}, jobLocation: [{ address: { addressLocality:'上海'} }, {address:{addressLocality:'北京'}}], baseSalary: {currency:'CNY',value:{minValue:25000,maxValue:35000,unitText:'MONTH'}}, description:'<p>开发前端应用 &amp; 工具</p><script>unsafe()</script>', validThrough:'2026-11-20T23:59:00+08:00' }] }).replaceAll('<', '\\u003c')}</script>`;
  const parsed = parseJobPage(html, url);
  assert.equal(parsed.jobTitle, 'Senior Frontend Engineer');
  assert.equal(parsed.companyName, '示例科技');
  assert.equal(parsed.location, '上海 / 北京');
  assert.equal(parsed.salary, '25000-35000元/月');
  assert.equal(parsed.jobDescription, '开发前端应用 & 工具');
  assert.equal(parsed.deadline, '2026-11-20');
});

test('网页 meta 信息降级解析；登录和无数据页面不伪造职位', () => {
  const parsed = parseJobPage(`<title>前端开发工程师 - 示例科技</title><meta content="上海 25-35K" name="description">`, url);
  assert.equal(parsed.jobTitle, '前端开发工程师');
  assert.equal(parsed.location, '上海');
  assert.equal(parsed.salary, '25-35K');
  assert.equal(parseJobPage('<title>安全检查 前端开发工程师</title>', url).jobTitle, undefined);
  assert.equal(parseJobPage('<html></html>', url).jobTitle, undefined);
  assert.doesNotThrow(() => parseJobPage('<script type="application/ld+json">invalid</script>', url));
});

test('读取接口限制可信域名、HTTPS 和公网 IPv4', () => {
  assert.equal(validateJobUrl(url).hostname, 'jobs.bytedance.com');
  for (const value of ['http://jobs.bytedance.com/1','https://127.0.0.1/','https://localhost/','https://bytedance.com.attacker.test/','https://a@jobs.bytedance.com/','https://jobs.bytedance.com:8080/']) {
    assert.throws(() => validateJobUrl(value));
  }
  for (const address of ['127.0.0.1','10.0.0.1','172.16.0.1','192.168.1.1','169.254.169.254','100.64.0.1','::1']) assert.equal(isPublicIPv4(address), false);
  assert.equal(isPublicIPv4('8.8.8.8'), true);
});

test('无效链接接口返回可展示错误，不请求网页', async () => {
  let status, body;
  const response = {setHeader(){}, writeHead(code){status=code;return this;}, end(text){body=JSON.parse(text);}};
  await handler({method:'GET',url:'/api/job-page?url=https://127.0.0.1/'},response);
  assert.equal(status,422);
  assert.match(body.error,/暂不支持/);
});

test('顺丰首页的通用介绍不会再被误当作岗位和 JD', () => {
  const parsed = parseJobPage('<title>顺丰校园招聘</title><meta name="description" content="为应届大学毕业生提供校园招聘信息。为企业提供一站式专业人力资源服务，包括网络招聘、人才测评等。">', 'https://campus.sf-express.com/#/postDetail/2246');
  assert.equal(parsed.jobTitle, undefined);
  assert.equal(parsed.jobDescription, undefined);
});
