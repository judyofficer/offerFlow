export type ApplicationStatus = 'wishlist' | 'applied' | 'oa' | 'interview' | 'hr' | 'offer' | 'rejected';

export interface Application {
  id: string;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  status: ApplicationStatus;
  appliedAt: number;
  updatedAt: number;
  resumeId?: string; // Optional reference to the resume used
  salary?: string;
  location?: string;
  notes?: string;
}

export const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string }> = {
  wishlist: { label: 'Wishlist', color: 'var(--text-secondary)' },
  applied: { label: 'Applied', color: 'var(--info)' },
  oa: { label: 'Online Assessment', color: 'var(--warning)' },
  interview: { label: 'Interviewing', color: '#8b5cf6' }, // purple
  hr: { label: 'HR Interview', color: '#ec4899' }, // pink
  offer: { label: 'Offer', color: 'var(--success)' },
  rejected: { label: 'Rejected', color: 'var(--danger)' },
};
