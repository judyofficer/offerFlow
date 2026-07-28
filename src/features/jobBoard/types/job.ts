export interface JobBookmark {
  id: string;
  companyName: string;
  jobTitle: string;
  url?: string;
  salary?: string;
  location?: string;
  source?: string;
  notes?: string;
  createdAt: number;
}
