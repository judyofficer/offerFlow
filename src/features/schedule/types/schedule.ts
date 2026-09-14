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

export const EVENT_TYPE_CONFIG: Record<EventType, { label: string; color: string; bgColor: string; borderColor: string }> = {
  oa: { label: '笔试', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.12)', borderColor: 'rgba(139, 92, 246, 0.28)' },
  interview: { label: '面试', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.28)' },
  deadline: { label: 'Deadline', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.28)' },
  other: { label: '其他', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.12)', borderColor: 'rgba(107, 114, 128, 0.28)' },
};
