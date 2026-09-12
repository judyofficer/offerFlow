// 常见名企校招/社招官网及投递进度查询入口字典
export interface CareerPortal {
  match: RegExp;
  name: string;
  url: string;
  tips?: string;
}

export const KNOWN_CAREER_PORTALS: CareerPortal[] = [
  { match: /字节|bytedance|tiktok|抖音/i, name: '字节跳动招聘进度', url: 'https://job.bytedance.com/campus/position/application', tips: '支持直接进入个人中心查看简历与面试流转' },
  { match: /腾讯|tencent/i, name: '腾讯招聘进度', url: 'https://careers.tencent.com/apply.html', tips: '支持登录查看投递进度与事业群状态' },
  { match: /阿里|淘宝|天猫|淘天|alibaba/i, name: '淘天/阿里招聘进度', url: 'https://talent.taotian.com/campus/home', tips: '可查看阿里各业务线投递与面试进展' },
  { match: /蚂蚁|ant\s?group/i, name: '蚂蚁集团招聘进度', url: 'https://talent.antgroup.com/', tips: '进入个人应聘记录查进度' },
  { match: /美团|meituan/i, name: '美团招聘进度', url: 'https://zhaopin.meituan.com/web/campus', tips: '进入应聘记录查看笔试与面试通知' },
  { match: /华为|huawei/i, name: '华为招聘进度', url: 'https://career.huawei.com/', tips: '查看个人应聘状态与笔试综合测评' },
  { match: /拼多多|pinduoduo|pdd/i, name: '拼多多招聘进度', url: 'https://careers.pinduoduo.com/campus/', tips: '进入个人中心查看应聘进度' },
  { match: /京东|jd/i, name: '京东招聘进度', url: 'https://campus.jd.com/', tips: '进入个人中心应聘记录查看进度' },
  { match: /网易|netease/i, name: '网易招聘进度', url: 'https://campus.163.com/app/index', tips: '进入投递记录查看互娱/雷火/互联网状态' },
  { match: /快手|kuaishou/i, name: '快手招聘进度', url: 'https://campus.kuaishou.cn/', tips: '进入应聘记录查看流程节点' },
  { match: /小红书|xiaohongshu|red/i, name: '小红书招聘进度', url: 'https://job.xiaohongshu.com/', tips: '查看小红书校招/社招投递状态' },
  { match: /米哈游|mihoyo/i, name: '米哈游招聘进度', url: 'https://jobs.mihoyo.com/', tips: '进入个人中心查看应聘记录' },
  { match: /招银|招商银行/i, name: '招银网络/招行招聘进度', url: 'https://career.cloud.cmbchina.com/', tips: '进入个人中心查询笔面试安排' },
  { match: /百度|baidu/i, name: '百度招聘进度', url: 'https://talent.baidu.com/', tips: '进入个人中心查看百度投递流程' },
  { match: /蔚来|nio/i, name: '蔚来招聘进度', url: 'https://nio.jobs.feishu.cn/campus', tips: '飞书招聘系统查看进度' },
  { match: /理想|li\s?auto/i, name: '理想汽车招聘进度', url: 'https://lijo.jobs.feishu.cn/', tips: '查看理想汽车应聘记录' },
  { match: /小鹏|xpeng/i, name: '小鹏汽车招聘进度', url: 'https://app.mokahr.com/campus_apply/xiaopeng', tips: 'Moka 系统查看投递状态' },
  { match: /微软|microsoft/i, name: '微软招聘进度', url: 'https://careers.microsoft.com/v2/global/en/home.html', tips: 'Action Center 查看 Application Status' },
  { match: /苹果|apple/i, name: 'Apple 招聘进度', url: 'https://jobs.apple.com/zh-cn/search', tips: 'Apple 个人中心查看投递记录' },
  { match: /shopee|虾皮/i, name: 'Shopee 招聘进度', url: 'https://careers.shopee.cn/', tips: '查看 Shopee 应聘进度' },
  { match: /bilibili|哔哩哔哩|b站/i, name: 'Bilibili 招聘进度', url: 'https://jobs.bilibili.com/campus', tips: '查看 B 站投递与面试流转' },
  { match: /滴滴|didi/i, name: '滴滴招聘进度', url: 'https://talent.didiglobal.com/', tips: '进入个人中心查看应聘进展' },
  { match: /商汤|sensetime/i, name: '商汤科技招聘进度', url: 'https://hr.sensetime.com/', tips: '查看商汤校招应聘记录' },
  { match: /联想|lenovo/i, name: '联想招聘进度', url: 'https://talent.lenovo.com/', tips: '进入个人中心查看投递状态' },
  { match: /顺丰|sf/i, name: '顺丰招聘进度', url: 'https://campus.sf-express.com/', tips: '查看顺丰应聘进展' },
];

export interface ResolvedUrlResult {
  url: string;
  isCustom: boolean;
  portalName?: string;
  tips?: string;
  type: 'custom' | 'matched_official' | 'search_fallback' | 'empty';
}

/**
 * 智能解析岗位对应的进度查询 URL
 * 1. 优先使用用户手动录入的进度查询链接
 * 2. 次优匹配内置名企投递进度查询入口
 * 3. 兜底生成一键企业进度检索链接
 */
export function resolveApplicationUrl(companyName?: string, customUrl?: string): ResolvedUrlResult {
  if (customUrl && customUrl.trim()) {
    const raw = customUrl.trim();
    const formatted = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
    return {
      url: formatted,
      isCustom: true,
      portalName: '进度查询链接',
      type: 'custom',
    };
  }

  if (companyName && companyName.trim()) {
    const trimmedCompany = companyName.trim();
    const matched = KNOWN_CAREER_PORTALS.find(p => p.match.test(trimmedCompany));
    if (matched) {
      return {
        url: matched.url,
        isCustom: false,
        portalName: matched.name,
        tips: matched.tips,
        type: 'matched_official',
      };
    }

    // 兜底智能检索直达
    return {
      url: `https://www.bing.com/search?q=${encodeURIComponent(trimmedCompany + ' 投递进度查询')}`,
      isCustom: false,
      portalName: `${trimmedCompany} 进度检索`,
      tips: '点击在 Bing 检索该企业投递进度查询入口',
      type: 'search_fallback',
    };
  }

  return {
    url: '',
    isCustom: false,
    type: 'empty',
  };
}

/**
 * 安全在新窗口打开目标 URL
 */
export function openCareerUrl(url: string) {
  if (!url) return;
  const target = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
  window.open(target, '_blank', 'noopener,noreferrer');
}
