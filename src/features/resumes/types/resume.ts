export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  github?: string;
  website?: string;
  summary: string;
  
  // Additional optional info
  gender?: string;
  birthDate?: string;
  ethnicity?: string;
  city?: string;
  intendedCity?: string;
  intendedRole?: string;
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
  techStack?: string;
  description: string;
  highlights?: string;
  link?: string;
}

export interface Skill {
  id: string;
  category: string;
  items: string[];
}

export interface CampusExperience {
  id: string;
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Award {
  id: string;
  name: string;
  awarder: string;
  date: string;
  description: string;
}

export interface ResumeContent {
  personalInfo: PersonalInfo;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: Skill[];
  campusExperience: CampusExperience[];
  awards: Award[];
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
