export type ResumeTemplateId = "modern-professional" | "minimal-ats" | "classic-corporate";

export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedIn?: string;
  portfolio?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  jobTitle: string;
  location?: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  responsibilities: string;
  achievements?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: string;
  additionalDetails?: string;
}

export interface SkillCategory {
  technical: string[];
  soft: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string;
  projectUrl?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface Language {
  id: string;
  language: string;
  proficiency: string; // e.g. "Native", "Fluent", "Professional", "Conversational"
}

export interface Award {
  id: string;
  title: string;
  issuer: string;
  date: string;
  summary?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  experiences: WorkExperience[];
  education: Education[];
  skills: SkillCategory;
  projects: Project[];
  certifications: Certification[];
  languages: Language[];
  awards: Award[];
  achievements: Achievement[];
  templateId: ResumeTemplateId;
}

export interface ResumeTemplateMeta {
  id: ResumeTemplateId;
  name: string;
  description: string;
  badge: string;
  features: string[];
}
