export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  github?: string;
  website?: string;
  summary: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Experience {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  link?: string;
}

export interface Skill {
  id: string;
  category: string;
  items: string[];
}

export interface ResumeContent {
  personalInfo: PersonalInfo;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: Skill[];
}

export interface Resume {
  id: string;
  name: string; // Version name
  createdAt: number;
  updatedAt: number;
  content: ResumeContent;
  sourceFileId?: string;
  sourceFileName?: string;
}
