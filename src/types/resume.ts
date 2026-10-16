export interface ContactInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  portfolio?: string;
}

export interface SkillCategory {
  category: string;
  items: string[];
}

export interface ExperienceItem {
  role: string;
  company: string;
  period: string;
  location?: string;
  bullets: string[];
}

export interface EducationItem {
  degree: string;
  school: string;
  year: string;
}

export interface ProjectItem {
  name: string;
  description?: string;
  tech?: string[];
  bullets?: string[];
}

export interface TailoredResumeData {
  contact: ContactInfo;
  summary: string;
  skills: SkillCategory[];
  experience: ExperienceItem[];
  education: EducationItem[];
  projects?: ProjectItem[];
  certifications?: string[];
}

export interface TailorResponse {
  originalScore: number;
  tailoredScore: number;
  matchRating: 'Exceptional' | 'Strong' | 'Moderate' | 'Needs Improvement';
  matchedKeywords: string[];
  missingKeywordsAdded: string[];
  improvements: string[];
  tailoredResume: TailoredResumeData;
  tailoredResumeText: string;
}

export interface TailorRequest {
  resumeText: string;
  jobDescription: string;
  model?: string;
}
