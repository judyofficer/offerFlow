import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSfPositionId, parseSfPosition } from '../server/jobAdapters.ts';
import { parseRenderedJobText } from '../src/features/applications/utils/jobPageParser.ts';
import { mergeJobAutofill } from '../src/features/applications/utils/jobAutofill.ts';

const url = 'https://campus.sf-express.com/#/postDetail/2246';
const empty = {companyName:'',jobTitle:'',url:'',salary:'',location:'',source:'',deadline:'',jobDescription:''};

test('从哈希路由取出职位 ID，校验域名及接口返回的同一职位 ID', () => {
  assert.equal(getSfPositionId(new URL(url)), '2246');
  assert.equal(getSfPositionId(new URL('https://campus.sf-express.com.attacker.test/#/postDetail/2246')), undefined);
  assert.equal(getSfPositionId(new URL('https://campus.sf-express.com/#/positionList')), undefined);
  assert.equal(parseSfPosition({id:2247,positionName:'其他职位'},'2246',url), undefined);
});

test('顺丰职位详情使用真实岗位、用人单位、工作城市及职责，不把面试城市当工作地', () => {
  const data = {id:2246,positionName:'AI全栈研发工程师（顺丰科技）',orgSourceName:'顺丰科技',demandCity:'深圳市',recruitCity:'北京,上海',postDuty:'参与前后端开发与代码评审。',jobRequirement:'计算机相关专业，熟悉前后端技术。'};
  const parsed = parseSfPosition(data,'2246',url);
  assert.equal(parsed.jobTitle,data.positionName);
  assert.equal(parsed.companyName,'顺丰科技');
  assert.equal(parsed.location,'深圳市');
  assert.equal(parsed.salary,undefined);
  assert.match(parsed.jobDescription,/岗位职责\n参与前后端开发/);
  assert.match(parsed.jobDescription,/任职要求\n计算机/);
});

test('动态正文必须同时有职位标题和职责证据，截掉推荐职位与页脚', () => {
  const text = '前端开发工程师\n工作地点：深圳市\n薪资：20k-30k\n岗位职责\n负责页面与组件开发，参与性能优化和代码评审，保障功能稳定。\n任职要求\n熟悉前端技术与协作开发。\n推荐职位\n后端工程师';
  const parsed = parseRenderedJobText(['加入我们','前端开发工程师'],text,url);
  assert.equal(parsed.jobTitle,'前端开发工程师');
  assert.equal(parsed.location,'深圳市');
  assert.equal(parsed.salary,'20k-30k');
  assert.doesNotMatch(parsed.jobDescription,/推荐职位|后端工程师/);
  assert.equal(parseRenderedJobText(['企业提供一站式专业人力资源服务'],text,url).jobTitle,undefined);
  assert.equal(parseRenderedJobText(['前端开发工程师'],'招聘首页，公司介绍与招聘流程。',url).jobTitle,undefined);
});

test('真实接口数据可修正自动猜测，手动修改保持不变', () => {
  const first = mergeJobAutofill(empty,{companyName:'顺丰',url},{},true);
  const accurate = mergeJobAutofill(first.fields,{companyName:'顺丰科技',jobTitle:'AI全栈研发工程师'},first.automatic);
  assert.equal(accurate.fields.companyName,'顺丰科技');
  const manual = mergeJobAutofill({...first.fields,companyName:'我手动填写的公司'},{companyName:'顺丰科技'},first.automatic);
  assert.equal(manual.fields.companyName,'我手动填写的公司');
});

test('换链接清理旧的自动岗位字段，保留人工填写，不混入上一岗位的信息', () => {
  const first = mergeJobAutofill(empty,{companyName:'顺丰',jobTitle:'前端工程师',location:'深圳',url},{},true);
  const next = mergeJobAutofill({...first.fields,salary:'人工确认的薪资'},{url:'https://jobs.bytedance.com/1',companyName:'字节跳动'},first.automatic,true);
  assert.equal(next.fields.jobTitle,'');
  assert.equal(next.fields.location,'');
  assert.equal(next.fields.companyName,'字节跳动');
  assert.equal(next.fields.salary,'人工确认的薪资');
});
