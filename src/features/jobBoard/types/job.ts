export interface JobBookmark {
  id: string;
  companyName: string;
  jobTitle: string;
  url?: string;
  salary?: string;
  location?: string;
  source?: string;
  notes?: string;
  deadline?: string; // 招聘截止日期，格式 YYYY-MM-DD
  createdAt: number;
}
