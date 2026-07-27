export type EventType = 'oa' | 'interview' | 'deadline' | 'other';

export interface ScheduleEvent {
  id: string;
  applicationId?: string; // 关联之前投递的具体岗位
  title: string;          // 例如：字节跳动 一面
  type: EventType;
  date: string;           // 日期 (YYYY-MM-DD)
  time?: string;          // 时间 (HH:mm)
  location?: string;      // 腾讯会议链接或线下地址
  notes?: string;         // 面试准备备忘录
  createdAt: number;
  updatedAt: number;
}

export const EVENT_TYPE_CONFIG: Record<EventType, { label: string; color: string }> = {
  oa: { label: '笔试/机试', color: '#8b5cf6' },
  interview: { label: '面试', color: '#f59e0b' },
  deadline: { label: 'Deadline', color: '#ef4444' },
  other: { label: '其他', color: '#6b7280' },
};
