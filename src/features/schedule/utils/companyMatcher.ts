import type { ScheduleEvent } from '../types/schedule';
import type { Application } from '../../applications/types/application';

/**
 * 获取日程事件关联的目标公司名称
 */
export const getEventCompanyName = (
  event: ScheduleEvent,
  applications: Application[]
): string => {
  // 1. 若有显式关联的投递 ID
  if (event.applicationId) {
    const app = applications.find(a => a.id === event.applicationId);
    if (app?.companyName) {
      return app.companyName;
    }
  }

  // 2. 根据投递库中所有公司的名称进行模糊/前缀匹配
  for (const app of applications) {
    if (app.companyName) {
      const cleanName = app.companyName.split(/[(（]/)[0].trim();
      if (cleanName && cleanName.length >= 2 && event.title.toLowerCase().includes(cleanName.toLowerCase())) {
        return app.companyName;
      }
    }
  }

  // 3. 从标题常见前缀提取（如 "携程 - 笔试" -> "携程"）
  const match = event.title.match(/^([^—\-·\s(（]+)/);
  if (match && match[1].trim()) {
    return match[1].trim();
  }

  return '其他';
};

/**
 * 判断日程是否属于指定公司筛选条件
 */
export const isEventMatchingCompany = (
  event: ScheduleEvent,
  companyFilter: string,
  applications: Application[]
): boolean => {
  if (!companyFilter || companyFilter === 'all') return true;
  const eventCompany = getEventCompanyName(event, applications);
  if (eventCompany === companyFilter) return true;
  
  // 兼容中英文括号/简称匹配 (例如 "携程" 与 "携程 (Ctrip)")
  const cleanFilter = companyFilter.split(/[(（]/)[0].trim().toLowerCase();
  const cleanEventCompany = eventCompany.split(/[(（]/)[0].trim().toLowerCase();
  if (cleanFilter && cleanEventCompany && (cleanFilter === cleanEventCompany || cleanEventCompany.includes(cleanFilter) || cleanFilter.includes(cleanEventCompany))) {
    return true;
  }
  
  return event.title.toLowerCase().includes(cleanFilter);
};
