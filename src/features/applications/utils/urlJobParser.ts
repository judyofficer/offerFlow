/**
 * 招聘岗位链接与文本智能解析引擎 (URL & Job Text Parser)
 * 
 * 功能：
 * 1. 从用户粘贴的一段文本中自动提取 URL，并清洗格式
 * 2. 识别知名大厂招聘官网（字节、腾讯、阿里、美团等），直接提取公司名称与招聘官网来源
 * 3. 识别主流招聘平台（Boss直聘、牛客、拉勾、猎聘、前程无忧、智联等）
 * 4. 启发式精准提取：岗位名称、公司名称、薪资待遇、工作城市、岗位描述(JD)
 * 5. 支持主流 App 分享格式（如【Boss直聘】、【牛客网】及微信分享卡片文案）
 * 6. 支持基于配置的 LLM API Key 进行 AI 深度文本解析增强
 */

import type { ApplicationPriority } from '../types/application.ts';

export interface ParsedJobResult {
  url?: string;
  companyName?: string;
  jobTitle?: string;
  salary?: string;
  location?: string;
  source?: string;
  priority?: ApplicationPriority;
  jobDescription?: string;
  rawText?: string;
  deadline?: string;
}

// 常见名企关键词与别名列表
const FAMOUS_COMPANIES = [
  '字节跳动', '字节', '腾讯', '阿里巴巴', '阿里', '淘天', '蚂蚁集团', '蚂蚁',
  '美团', '华为', '拼多多', '京东', '网易', '快手', '小红书', '米哈游',
  '招商银行', '招银网络', '百度', '蔚来汽车', '蔚来', '小鹏汽车', '小鹏',
  '理想汽车', '理想', '哔哩哔哩', 'B站', '滴滴', '微软', '苹果', 'Apple',
  'Shopee', '虾皮', '商汤科技', '商汤', '联想', '顺丰', '小米', 'OPPO',
  'vivo', '得物', 'SHEIN', '希音', '大疆', '极氪', '吉利', '比亚迪'
];

// 常见大厂招聘域名特征库
const KNOWN_ENTERPRISE_DOMAINS: Array<{
  domains: string[];
  companyName: string;
  source: string;
  priority?: ApplicationPriority;
}> = [
  { domains: ['bytedance.com', 'tiktok.com'], companyName: '字节跳动', source: '字节跳动招聘官网', priority: 'dream' },
  { domains: ['tencent.com'], companyName: '腾讯', source: '腾讯招聘官网', priority: 'dream' },
  { domains: ['taotian.com', 'alibaba.com', 'aliyun.com'], companyName: '阿里巴巴', source: '阿里招聘官网', priority: 'dream' },
  { domains: ['antgroup.com'], companyName: '蚂蚁集团', source: '蚂蚁招聘官网', priority: 'dream' },
  { domains: ['meituan.com'], companyName: '美团', source: '美团招聘官网', priority: 'dream' },
  { domains: ['huawei.com'], companyName: '华为', source: '华为招聘官网', priority: 'dream' },
  { domains: ['pinduoduo.com'], companyName: '拼多多', source: '拼多多招聘官网', priority: 'dream' },
  { domains: ['jd.com'], companyName: '京东', source: '京东招聘官网', priority: 'dream' },
  { domains: ['163.com', 'netease.com'], companyName: '网易', source: '网易招聘官网', priority: 'dream' },
  { domains: ['kuaishou.com', 'kuaishou.cn'], companyName: '快手', source: '快手招聘官网', priority: 'dream' },
  { domains: ['xiaohongshu.com'], companyName: '小红书', source: '小红书招聘官网', priority: 'dream' },
  { domains: ['mihoyo.com'], companyName: '米哈游', source: '米哈游招聘官网', priority: 'dream' },
  { domains: ['cmbchina.com'], companyName: '招商银行 / 招银网络', source: '招银招聘官网', priority: 'target' },
  { domains: ['baidu.com'], companyName: '百度', source: '百度招聘官网', priority: 'dream' },
  { domains: ['nio.com', 'nio.jobs'], companyName: '蔚来汽车', source: '蔚来招聘官网', priority: 'target' },
  { domains: ['xiaopeng.com', 'xpeng.com'], companyName: '小鹏汽车', source: '小鹏招聘官网', priority: 'target' },
  { domains: ['lixiang.com', 'lijo.jobs'], companyName: '理想汽车', source: '理想招聘官网', priority: 'target' },
  { domains: ['bilibili.com'], companyName: '哔哩哔哩', source: 'B站招聘官网', priority: 'target' },
  { domains: ['didiglobal.com', 'didichuxing.com'], companyName: '滴滴', source: '滴滴招聘官网', priority: 'target' },
  { domains: ['microsoft.com'], companyName: '微软', source: '微软招聘官网', priority: 'dream' },
  { domains: ['apple.com'], companyName: 'Apple', source: 'Apple 招聘官网', priority: 'dream' },
  { domains: ['shopee.com', 'shopee.cn'], companyName: 'Shopee', source: 'Shopee 招聘官网', priority: 'target' },
  { domains: ['sensetime.com'], companyName: '商汤科技', source: '商汤招聘官网', priority: 'target' },
  { domains: ['lenovo.com'], companyName: '联想', source: '联想招聘官网', priority: 'target' },
  { domains: ['sf-express.com'], companyName: '顺丰', source: '顺丰招聘官网', priority: 'target' },
  { domains: ['dji.com'], companyName: '大疆创新', source: '大疆招聘官网', priority: 'dream' },
];

// 常见招聘渠道平台域名特征库
const KNOWN_PLATFORM_DOMAINS: Array<{
  domains: string[];
  sourceName: string;
}> = [
  { domains: ['zhipin.com'], sourceName: 'Boss直聘' },
  { domains: ['nowcoder.com'], sourceName: '牛客网' },
  { domains: ['lagou.com'], sourceName: '拉勾网' },
  { domains: ['liepin.com'], sourceName: '猎聘' },
  { domains: ['51job.com'], sourceName: '前程无忧' },
  { domains: ['zhaopin.com'], sourceName: '智联招聘' },
  { domains: ['maimai.cn'], sourceName: '脉脉' },
  { domains: ['shixiseng.com'], sourceName: '实习僧' },
  { domains: ['iguopin.com'], sourceName: '国聘网' },
  { domains: ['mokahr.com'], sourceName: 'Moka招聘' },
  { domains: ['beisen.com', 'hotjob.cn', 'zhiye.com'], sourceName: '北森招聘' },
  { domains: ['jobs.feishu.cn'], sourceName: '飞书招聘' },
];

// 常见主要城市词库
const COMMON_CITIES = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '西安', '苏州',
  '天津', '长沙', '重庆', '郑州', '青岛', '合肥', '厦门', '大连', '福州', '济南',
  '沈阳', '无锡', '宁波', '东莞', '佛山', '昆明', '南昌', '珠海', '远程', '全国'
];

/**
 * 从文本中提取首个合法 URL，并剥离末尾无意义的标点符号
 */
export function extractUrlFromText(text: string): { url?: string; cleanedText: string } {
  if (!text) return { cleanedText: '' };

  const urlRegex = /(https?:\/\/[^\s"'<>，。！？）】]+)/i;
  const match = text.match(urlRegex);

  if (!match) {
    const bare = text.trim();
    if (/^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:[/?#][^\s]*)?$/i.test(bare)) {
      return { url: `https://${bare}`, cleanedText: '' };
    }
    return { cleanedText: bare };
  }

  let url = match[1].trim();
  // 清洗 URL 末尾可能附带的标点符号
  url = url.replace(/[，。！？）】\],.;]+$/, '');

  // 从文本中扣除该 URL
  const cleanedText = text.replace(match[0], ' ').trim();
  return { url, cleanedText };
}

/**
 * 根据 URL 域名推断所属企业与招聘来源
 */
export function inferFromUrl(url?: string): { companyName?: string; source?: string; priority?: ApplicationPriority } {
  if (!url) return {};

  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const hostname = urlObj.hostname.toLowerCase();

    // 1. 优先匹配名企官网
    for (const ent of KNOWN_ENTERPRISE_DOMAINS) {
      if (ent.domains.some(d => hostname === d || hostname.endsWith(`.${d}`))) {
        return {
          companyName: ent.companyName,
          source: ent.source,
          priority: ent.priority,
        };
      }
    }

    // 2. 匹配招聘平台
    for (const plat of KNOWN_PLATFORM_DOMAINS) {
      if (plat.domains.some(d => hostname === d || hostname.endsWith(`.${d}`))) {
        return {
          source: plat.sourceName,
        };
      }
    }
  } catch {
    // URL 解析失败时安全降级
  }

  return {};
}

/**
 * 本地启发式智能解析：结合 URL 提取、文本正则、名企别名库与中文自然语言特征
 */
export function parseJobLinkOrText(rawInput: string): ParsedJobResult {
  if (!rawInput || !rawInput.trim()) {
    return {};
  }

  const result: ParsedJobResult = { rawText: rawInput.trim() };
  const deadline = rawInput.match(/(?:截止日期|招聘截止|截止时间)\s*[:：]?\s*(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  if (deadline) {
    const value = `${deadline[1]}-${deadline[2].padStart(2, '0')}-${deadline[3].padStart(2, '0')}`;
    const date = new Date(`${value}T12:00:00Z`);
    if (Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value) result.deadline = value;
  }

  // 1. 提取并分离 URL
  const { url, cleanedText } = extractUrlFromText(rawInput);
  if (url) {
    result.url = url;
    // 依据 URL 推断企业与渠道来源
    const urlInfo = inferFromUrl(url);
    if (urlInfo.companyName) result.companyName = urlInfo.companyName;
    if (urlInfo.source) result.source = urlInfo.source;
    if (urlInfo.priority) result.priority = urlInfo.priority;
  }

  let text = cleanedText.replace(/(?:截止日期|招聘截止|截止时间)\s*[:：]?\s*\d{4}[-/.年]\d{1,2}[-/.月]\d{1,2}日?/g, ' ');

  // 2. 清洗社交分享前缀与指引语
  text = text.replace(/(?:我在|大家|分享|推荐|来看看|刚刚看到|发现)[^，,：:\n]*[：:]/g, ' ');
  text = text.replace(/点击(?:查看|投递)[^，,：:\n]*(?:[：:]|\s)/g, ' ');
  text = text.replace(/戳链接[^\s]*/g, ' ');

  // 3. 提取真实大段 JD (避免截取短语)
  const jdSplitRegex = /(?:职位描述|岗位职责|任职要求|任职资格|工作内容|岗位介绍|Job Description)[\s:：]/i;
  const jdIndex = text.search(jdSplitRegex);
  if (jdIndex !== -1) {
    const possibleJd = text.slice(jdIndex).trim();
    if (possibleJd.length > 20) {
      result.jobDescription = possibleJd;
    }
    text = text.slice(0, jdIndex).trim();
  }

  // 4. 提取结构化键值对 (如 "公司: 字节跳动", "职位: 前端开发", "薪资: 25k-40k")
  const kvCompany = text.match(/(?:公司(?:名称)?|企业|雇主|所属公司)\s*[:：]\s*([^\s,，;；\n]+)/i);
  if (kvCompany && kvCompany[1]) {
    result.companyName = kvCompany[1].trim();
    text = text.replace(kvCompany[0], ' ');
  }

  const kvJob = text.match(/(?:岗位(?:名称)?|职位(?:名称)?|应聘岗位|投递职位|职位|岗位)\s*[:：]\s*([^\s,，;；\n]+)/i);
  if (kvJob && kvJob[1]) {
    result.jobTitle = kvJob[1].trim();
    text = text.replace(kvJob[0], ' ');
  }

  const kvSalary = text.match(/(?:薪资待遇?|月薪|年薪|薪酬|薪资)\s*[:：]\s*([^\s,，;；\n]+)/i);
  if (kvSalary && kvSalary[1]) {
    result.salary = kvSalary[1].trim();
    text = text.replace(kvSalary[0], ' ');
  }

  const kvLocation = text.match(/(?:工作地点?|城市|工作城市|工作地区|地点)\s*[:：]\s*([^\s,，;；\n]+)/i);
  if (kvLocation && kvLocation[1]) {
    result.location = kvLocation[1].trim();
    text = text.replace(kvLocation[0], ' ');
  }

  // 5. 提取薪资 (严格优先匹配区间 25-35K·15薪, 20k-40k, 200-300/天 等)
  if (!result.salary) {
    const salaryRegex = /(\d+(?:[kK|wW|万|千])?\s*[-—~至]\s*\d+\s*[kK|wW|万|千](\s*[·*xX]\s*\d+薪?)?)|(\d+\s*[kK|wW|万|千](\s*[·*xX]\s*\d+薪?)?)|(\d+[-—~至]\d+元?\s*[/每]?[天月小时])/;
    const salaryMatch = text.match(salaryRegex);
    if (salaryMatch) {
      result.salary = salaryMatch[0].trim();
      text = text.replace(salaryMatch[0], ' ');
    }
  }

  // 6. 提取工作城市
  if (!result.location) {
    for (const city of COMMON_CITIES) {
      if (text.includes(city)) {
        result.location = city;
        text = text.replace(new RegExp(city, 'g'), ' ');
        break;
      }
    }
  }

  // 7. 处理括号与书名号 【Boss直聘】 / (北京·25-35K)
  const bracketMatch = text.match(/【([^】]+)】/);
  if (bracketMatch) {
    const bracketContent = bracketMatch[1].trim();
    if (/boss|牛客|拉勾|猎聘|智联|51job|前程无忧|脉脉|实习僧/i.test(bracketContent)) {
      if (!result.source) result.source = bracketContent;
      text = text.replace(bracketMatch[0], ' ');
    } else if (/招聘|校招|社招|内推/i.test(bracketContent)) {
      const possibleComp = bracketContent.replace(/招聘|校招|社招|内推/g, '').trim();
      if (possibleComp && !result.companyName) {
        result.companyName = possibleComp;
      }
      text = text.replace(bracketMatch[0], ' ');
    }
  }

  // 8. 优先识别名企名称
  if (!result.companyName) {
    for (const comp of FAMOUS_COMPANIES) {
      const compRegex = new RegExp(`(^|[\\s_·\\-|/])${comp}([\\s_·\\-|/]|正在招聘|诚聘|招聘|$)`, 'i');
      if (compRegex.test(text) || text.includes(comp)) {
        result.companyName = comp === '阿里' ? '阿里巴巴' : (comp === '字节' ? '字节跳动' : (comp === 'B站' ? '哔哩哔哩' : comp));
        text = text.replace(comp, ' ');
        break;
      }
    }
  }

  // 9. 清除“正在招聘”、“诚聘”、“急招”等词汇
  text = text.replace(/正在招聘|诚聘|急招|热招|招聘/g, ' ');

  // 10. 将剩余文本用各种分隔符（包括括号）拆分
  const fragments = text
    .split(/[-|/|,，_·•|\s()（）]+/)
    .map(s => s.trim())
    .filter(s => s.length > 1 && !/^(戳链接|查看职位|点击查看|详情|点击投递|招聘|正在招聘|热招)$/.test(s));

  if (fragments.length > 0) {
    const jobRoleRegex = /工程|开发|技术|前端|后端|全栈|算法|客户端|移动端|架构|测试|运维|安全|数据|产品|设计|运营|专员|经理|总监|管培|实习|专家|AI|NLP|LLM|CV|Java|Python|Golang|React|Vue|iOS|Android/i;
    const companyFeatureRegex = /公司|科技|集团|网络|银行|证券|工作室|信息|互动|工业|健康|电商|汽车/i;

    // 尝试识别岗位名称
    if (!result.jobTitle) {
      const jobIndex = fragments.findIndex(f => jobRoleRegex.test(f));
      if (jobIndex !== -1) {
        result.jobTitle = fragments[jobIndex];
        fragments.splice(jobIndex, 1);
      }
    }

    // 尝试识别公司名称
    if (!result.companyName && fragments.length > 0) {
      const compIndex = fragments.findIndex(f => companyFeatureRegex.test(f));
      if (compIndex !== -1) {
        result.companyName = fragments[compIndex];
        fragments.splice(compIndex, 1);
      } else {
        result.companyName = fragments[0];
        fragments.splice(0, 1);
      }
    }

    // 若还没确定 jobTitle 且还有剩余片段
    if (!result.jobTitle && fragments.length > 0) {
      result.jobTitle = fragments[0];
    }
  }

  // 11. 智能意向梯队推荐
  if (!result.priority) {
    if (result.companyName && /字节|腾讯|阿里|美团|微软|华为|苹果|Google|拼多多|小红书|米哈游/i.test(result.companyName)) {
      result.priority = 'dream';
    } else {
      result.priority = 'target';
    }
  }

  return result;
}

