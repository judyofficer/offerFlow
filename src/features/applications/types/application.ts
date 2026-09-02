export type ApplicationStatus = 'wishlist' | 'applied' | 'oa' | 'interview' | 'hr' | 'offer' | 'rejected';

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
  appliedAt: number;
  updatedAt: number;
  resumeId?: string; // Optional reference to the resume used
  notes?: string;
}

export const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string }> = {
  wishlist: { label: '意向岗', color: 'var(--text-secondary)' },
  applied: { label: '已投递', color: 'var(--primary)' },
  oa: { label: '笔试/机试', color: '#8b5cf6' },
  interview: { label: '面试中', color: '#f59e0b' },
  hr: { label: 'HR 面', color: '#ec4899' },
  offer: { label: '已发 Offer', color: '#10b981' },
  rejected: { label: '已淘汰', color: 'var(--danger)' },
};
