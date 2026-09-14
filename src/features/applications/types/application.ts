export type ApplicationStatus = 'wishlist' | 'applied' | 'oa' | 'interview' | 'hr' | 'offer' | 'rejected';

export type ApplicationPriority = 'dream' | 'target' | 'safety';

export interface Application {
  id: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  url?: string;
  salary?: string;
  location?: string;
  source?: string;
  deadline?: string;
  status: ApplicationStatus;
  priority?: ApplicationPriority; // 意向梯队 / 难度 (冲刺/主攻/保底)
  appliedAt: number;
  updatedAt: number;
  resumeId?: string; // Optional reference to the resume used
  notes?: string;
}

export const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bgColor?: string }> = {
  wishlist: { label: '意向岗', color: 'var(--text-secondary)', bgColor: 'rgba(156, 163, 175, 0.12)' },
  applied: { label: '已投递', color: 'var(--primary)', bgColor: 'rgba(59, 130, 246, 0.12)' },
  oa: { label: '笔试', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.12)' },
  interview: { label: '面试中', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.12)' },
  hr: { label: 'HR 面', color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.12)' },
  offer: { label: '已发 Offer', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.12)' },
  rejected: { label: '已淘汰', color: 'var(--danger)', bgColor: 'rgba(239, 68, 68, 0.12)' },
};

export const PRIORITY_CONFIG: Record<ApplicationPriority, {
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  weight: number;
}> = {
  dream: {
    label: '冲刺 (重点)',
    shortLabel: '冲刺',
    color: '#f43f5e',
    bgColor: 'rgba(244, 63, 94, 0.08)',
    borderColor: 'rgba(244, 63, 94, 0.22)',
    weight: 3,
  },
  target: {
    label: '主攻 (核心)',
    shortLabel: '主攻',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.08)',
    borderColor: 'rgba(59, 130, 246, 0.22)',
    weight: 2,
  },
  safety: {
    label: '保底 (稳健)',
    shortLabel: '保底',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.22)',
    weight: 1,
  },
};

