import type { ResumeData } from "../../types/resume.ts";
import { EMPTY_RESUME_DATA } from "../../constants/resume-defaults.ts";

export const RESUME_STORAGE_KEY = "browser_utility_studio_resume_data";

/**
 * Validate and sanitize a candidate ResumeData object.
 * Ensures all required keys exist and arrays are valid.
 */
export function sanitizeResumeData(input: unknown): ResumeData {
  if (!input || typeof input !== "object") {
    return { ...EMPTY_RESUME_DATA };
  }

  const raw = input as Partial<ResumeData>;

  const personalInfo = {
    fullName: typeof raw.personalInfo?.fullName === "string" ? raw.personalInfo.fullName : "",
    jobTitle: typeof raw.personalInfo?.jobTitle === "string" ? raw.personalInfo.jobTitle : "",
    email: typeof raw.personalInfo?.email === "string" ? raw.personalInfo.email : "",
    phone: typeof raw.personalInfo?.phone === "string" ? raw.personalInfo.phone : "",
    location: typeof raw.personalInfo?.location === "string" ? raw.personalInfo.location : "",
    linkedIn: typeof raw.personalInfo?.linkedIn === "string" ? raw.personalInfo.linkedIn : "",
    portfolio: typeof raw.personalInfo?.portfolio === "string" ? raw.personalInfo.portfolio : "",
  };

  const summary = typeof raw.summary === "string" ? raw.summary : "";

  const experiences = Array.isArray(raw.experiences)
    ? raw.experiences.map((exp, idx) => ({
        id: typeof exp.id === "string" ? exp.id : `exp-${idx}-${Date.now()}`,
        company: typeof exp.company === "string" ? exp.company : "",
        jobTitle: typeof exp.jobTitle === "string" ? exp.jobTitle : "",
        location: typeof exp.location === "string" ? exp.location : "",
        startDate: typeof exp.startDate === "string" ? exp.startDate : "",
        endDate: typeof exp.endDate === "string" ? exp.endDate : "",
        current: Boolean(exp.current),
        responsibilities: typeof exp.responsibilities === "string" ? exp.responsibilities : "",
        achievements: typeof exp.achievements === "string" ? exp.achievements : "",
      }))
    : [];

  const education = Array.isArray(raw.education)
    ? raw.education.map((edu, idx) => ({
        id: typeof edu.id === "string" ? edu.id : `edu-${idx}-${Date.now()}`,
        institution: typeof edu.institution === "string" ? edu.institution : "",
        degree: typeof edu.degree === "string" ? edu.degree : "",
        fieldOfStudy: typeof edu.fieldOfStudy === "string" ? edu.fieldOfStudy : "",
        graduationYear: typeof edu.graduationYear === "string" ? edu.graduationYear : "",
        additionalDetails: typeof edu.additionalDetails === "string" ? edu.additionalDetails : "",
      }))
    : [];

  const skills = {
    technical: Array.isArray(raw.skills?.technical)
      ? raw.skills.technical.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      : [],
    soft: Array.isArray(raw.skills?.soft)
      ? raw.skills.soft.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      : [],
  };

  const projects = Array.isArray(raw.projects)
    ? raw.projects.map((proj, idx) => ({
        id: typeof proj.id === "string" ? proj.id : `proj-${idx}-${Date.now()}`,
        title: typeof proj.title === "string" ? proj.title : "",
        description: typeof proj.description === "string" ? proj.description : "",
        technologies: typeof proj.technologies === "string" ? proj.technologies : "",
        projectUrl: typeof proj.projectUrl === "string" ? proj.projectUrl : "",
      }))
    : [];

  const certifications = Array.isArray(raw.certifications)
    ? raw.certifications.map((cert, idx) => ({
        id: typeof cert.id === "string" ? cert.id : `cert-${idx}-${Date.now()}`,
        name: typeof cert.name === "string" ? cert.name : "",
        issuer: typeof cert.issuer === "string" ? cert.issuer : "",
        date: typeof cert.date === "string" ? cert.date : "",
        url: typeof cert.url === "string" ? cert.url : "",
      }))
    : [];

  const languages = Array.isArray(raw.languages)
    ? raw.languages.map((lang, idx) => ({
        id: typeof lang.id === "string" ? lang.id : `lang-${idx}-${Date.now()}`,
        language: typeof lang.language === "string" ? lang.language : "",
        proficiency: typeof lang.proficiency === "string" ? lang.proficiency : "",
      }))
    : [];

  const awards = Array.isArray(raw.awards)
    ? raw.awards.map((award, idx) => ({
        id: typeof award.id === "string" ? award.id : `award-${idx}-${Date.now()}`,
        title: typeof award.title === "string" ? award.title : "",
        issuer: typeof award.issuer === "string" ? award.issuer : "",
        date: typeof award.date === "string" ? award.date : "",
        summary: typeof award.summary === "string" ? award.summary : "",
      }))
    : [];

  const achievements = Array.isArray(raw.achievements)
    ? raw.achievements.map((ach, idx) => ({
        id: typeof ach.id === "string" ? ach.id : `ach-${idx}-${Date.now()}`,
        title: typeof ach.title === "string" ? ach.title : "",
        description: typeof ach.description === "string" ? ach.description : "",
      }))
    : [];

  const validTemplates = ["modern-professional", "minimal-ats", "classic-corporate"];
  const templateId =
    raw.templateId && validTemplates.includes(raw.templateId)
      ? raw.templateId
      : "modern-professional";

  return {
    personalInfo,
    summary,
    experiences,
    education,
    skills,
    projects,
    certifications,
    languages,
    awards,
    achievements,
    templateId,
  };
}

/**
 * Load saved resume data from localStorage. Returns null if empty or corrupted.
 */
export function loadSavedResume(): ResumeData | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(RESUME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return sanitizeResumeData(parsed);
  } catch (err) {
    console.warn("Failed to load saved resume from localStorage:", err);
    return null;
  }
}

/**
 * Persist resume data to localStorage.
 */
export function saveResume(data: ResumeData): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }

  try {
    const clean = sanitizeResumeData(data);
    window.localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(clean));
    return true;
  } catch (err) {
    console.warn("Failed to save resume data to localStorage:", err);
    return false;
  }
}

/**
 * Reset resume data from localStorage.
 */
export function clearSavedResume(): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.removeItem(RESUME_STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to remove saved resume data:", err);
  }
}

/**
 * Export resume data as JSON string for backup/export.
 */
export function exportResumeAsJson(data: ResumeData): string {
  const clean = sanitizeResumeData(data);
  return JSON.stringify(clean, null, 2);
}

/**
 * Import resume data from a JSON string.
 */
export function importResumeFromJson(jsonString: string): ResumeData {
  try {
    const parsed = JSON.parse(jsonString);
    return sanitizeResumeData(parsed);
  } catch (err) {
    throw new Error("Invalid resume JSON format: unable to parse file content.");
  }
}
