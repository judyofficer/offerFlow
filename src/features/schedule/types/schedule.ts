export type EventType = 'oa' | 'interview' | 'deadline' | 'other';
export type TimeType = 'specific' | 'deadline' | 'all_day';

export interface ScheduleEvent {
  id: string;
  applicationId?: string; // 关联之前投递的具体岗位
  title: string;          // 例如：字节跳动 一面
  type: EventType;
  date: string;           // 日期 (YYYY-MM-DD)，若为时限型日程则为最晚截止日期
  startDate?: string;     // 起始日期 (YYYY-MM-DD)，用于时限日程/作答窗口期
  time?: string;          // 时间 (HH:mm)
  timeType?: TimeType;    // 时间模式：'specific'(固定时刻, 默认) | 'deadline'(时限/截止前完成) | 'all_day'(全天)
  location?: string;      // 腾讯会议链接或笔试系统链接
  notes?: string;         // 面试准备备忘录
  isCompleted?: boolean;  // 是否已完成 (支持笔面试完成打勾)
  isArchived?: boolean;   // 是否已归档 (归档后从主日历和待办中隐藏，随时可在归档箱中回顾复盘)
  archivedAt?: number;    // 归档时间戳
  createdAt: number;
  updatedAt: number;
}

export const EVENT_TYPE_CONFIG: Record<EventType, { label: string; color: string; bgColor: string; borderColor: string }> = {
  oa: { label: '笔试', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.12)', borderColor: 'rgba(139, 92, 246, 0.28)' },
  interview: { label: '面试', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.28)' },
  deadline: { label: 'Deadline', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.28)' },
  other: { label: '其他', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.12)', borderColor: 'rgba(107, 114, 128, 0.28)' },
};
