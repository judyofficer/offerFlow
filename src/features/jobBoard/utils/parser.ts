/**
 * 本地启发式文本解析器
 * 用于从剪贴板的一段混乱文本中提取薪资、地点、岗位等信息
 */

export interface ParsedJobInfo {
  jobTitle: string;
  companyName: string;
  salary: string;
  location: string;
}

const CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆', '苏州', '天津', '长沙'];

export const parseJobText = (text: string): Partial<ParsedJobInfo> => {
  if (!text) return {};
  
  const result: Partial<ParsedJobInfo> = {};
  
  // 0. 截断职位描述等长文本，只保留头部信息
  text = text.split(/(职位描述|岗位职责|任职要求|职位详情|工作内容)/i)[0];
  
  // 1. 提取薪资 (匹配 20-30k, 25k-40k, 20-30K*15, 30k起 等格式)
  // 必须带有 k/万/w/千 或者是 纯数字-纯数字 的格式，避免把 2027 年识别成薪资
  const salaryRegex = /(\d+(k|K|w|W|万|千)(起)?(\s*-\s*\d+(k|K|w|W|万|千)?)?(\s*\*\s*\d+)?)|(\d+\s*-\s*\d+(k|K|w|W|万|千)?(\s*\*\s*\d+)?)/;
  const salaryMatch = text.match(salaryRegex);
  if (salaryMatch) {
    result.salary = salaryMatch[0].trim();
    // 把薪资从原文中抠掉
    text = text.replace(salaryMatch[0], ' ');
  }

  // 2. 提取城市
  for (const city of CITIES) {
    if (text.includes(city)) {
      result.location = city;
      text = text.replace(city, ' ');
      break;
    }
  }

  // 3. 将剩余文本用常见分隔符切片
  const fragments = text.split(/[-|/|,，_\|\s]+/).map(s => s.trim()).filter(s => s.length > 1);
  
  if (fragments.length > 0) {
    // 启发式：含有“公司”、“科技”、“集团”、“网络”的一般是公司名
    const companyIndex = fragments.findIndex(f => /公司|科技|集团|网络|银行|中心|工作室/.test(f));
    
    if (companyIndex !== -1) {
      result.companyName = fragments[companyIndex];
      fragments.splice(companyIndex, 1);
      
      const titleFragment = fragments.find(f => f.length > 1 && f.length < 20);
      if (titleFragment) {
        result.jobTitle = titleFragment;
      }
    } else {
      // 如果没有明显的公司后缀名，尝试按照长度和位置推断
      if (fragments.length >= 2) {
        // 通常岗位名称包含 "工程师", "开发", "产品", "运营", "实习", "校招" 等词汇
        const jobIndex = fragments.findIndex(f => /工程|开发|产品|运营|设计|测试|数据|专员|经理|实习|校招|前端|后端/.test(f));
        if (jobIndex !== -1) {
          result.jobTitle = fragments[jobIndex];
          fragments.splice(jobIndex, 1);
          result.companyName = fragments[0]; // 剩下的第一个作为公司名
        } else {
          result.jobTitle = fragments[0].length <= 15 ? fragments[0] : fragments[1];
          result.companyName = fragments[0].length <= 15 ? fragments[1] : fragments[0];
        }
      } else {
        result.jobTitle = fragments[0];
      }
    }
  }

  return result;
};
