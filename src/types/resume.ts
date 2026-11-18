export type ResumeTemplateId =
  | "modern-professional"
  | "minimal-ats"
  | "classic-corporate"
  | "modern-two-column"
  | "executive"
  | "creative"
  | "student-fresher"
  | "elegant-minimal";

export type PhotoCropShape = "circle" | "rectangle" | "square";
export type PhotoSizePreset = "small" | "standard" | "large";

export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedIn?: string;
  github?: string;
  portfolio?: string;
  twitter?: string;
  photoUrl?: string;
  rawPhotoUrl?: string;
  showPhoto?: boolean;
  photoShape?: PhotoCropShape;
  photoSize?: PhotoSizePreset;
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

export type ResumeFontFamily =
  | "Inter"
  | "Roboto"
  | "Arial"
  | "Lato"
  | "Open Sans"
  | "Georgia"
  | "Merriweather"
  | "Poppins";

export interface ResumeTypography {
  fontFamily: ResumeFontFamily;
  nameSize: number;
  titleSize: number;
  headingSize: number;
  bodySize: number;
  contactSize: number;
  lineSpacing: number;
  sectionSpacing: number;
  paragraphSpacing: number;
}

export interface ResumeThemeColors {
  primaryAccent: string;   // Primary accent colour
  nameColor: string;       // Candidate name colour
  titleColor: string;      // Professional title colour
  headingColor: string;    // Section heading colour
  bodyColor: string;       // Body text colour
  secondaryColor: string;  // Secondary text colour
  dividerColor: string;    // Divider and decorative line colour
}

export interface ResumeColorPreset {
  id: string;
  name: string;
  primary: string;
  colors: ResumeThemeColors;
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
  typography?: ResumeTypography;
  colors?: ResumeThemeColors;
}

export interface ResumeTemplateMeta {
  id: ResumeTemplateId;
  name: string;
  description: string;
  badge: string;
  features: string[];
}
