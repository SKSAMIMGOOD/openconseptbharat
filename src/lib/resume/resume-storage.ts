import type { ResumeData, PhotoCropShape, PhotoSizePreset, ResumeFontFamily, ResumeTypography, ResumeThemeColors } from "../../types/resume.ts";
import { EMPTY_RESUME_DATA, getTemplateDefaultColors, isValidHexColor } from "../../constants/resume-defaults.ts";

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
    github: typeof raw.personalInfo?.github === "string" ? raw.personalInfo.github : "",
    portfolio: typeof raw.personalInfo?.portfolio === "string" ? raw.personalInfo.portfolio : "",
    twitter: typeof raw.personalInfo?.twitter === "string" ? raw.personalInfo.twitter : "",
    photoUrl: typeof raw.personalInfo?.photoUrl === "string" ? raw.personalInfo.photoUrl : "",
    rawPhotoUrl: typeof raw.personalInfo?.rawPhotoUrl === "string" ? raw.personalInfo.rawPhotoUrl : "",
    showPhoto: Boolean(raw.personalInfo?.showPhoto),
    photoShape: (raw.personalInfo?.photoShape === "rectangle"
      ? "rectangle"
      : raw.personalInfo?.photoShape === "square"
      ? "square"
      : "circle") as PhotoCropShape,
    photoSize: (raw.personalInfo?.photoSize === "small" ||
    raw.personalInfo?.photoSize === "large"
      ? raw.personalInfo.photoSize
      : "standard") as PhotoSizePreset,
    dob: typeof raw.personalInfo?.dob === "string" ? raw.personalInfo.dob : "",
    nationality: typeof raw.personalInfo?.nationality === "string" ? raw.personalInfo.nationality : "",
    maritalStatus: typeof raw.personalInfo?.maritalStatus === "string" ? raw.personalInfo.maritalStatus : "",
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

  const validTemplates = [
    "modern-professional",
    "minimal-ats",
    "classic-corporate",
    "modern-two-column",
    "executive",
    "creative",
    "student-fresher",
    "elegant-minimal",
  ];
  const templateId =
    raw.templateId && validTemplates.includes(raw.templateId)
      ? raw.templateId
      : "modern-professional";

  const validFonts: ResumeFontFamily[] = [
    "Inter",
    "Roboto",
    "Arial",
    "Lato",
    "Open Sans",
    "Georgia",
    "Merriweather",
    "Poppins",
  ];

  const rawTypo = (raw.typography && typeof raw.typography === "object") ? (raw.typography as unknown as Record<string, unknown>) : {};
  const typography: ResumeTypography = {
    fontFamily: (typeof rawTypo.fontFamily === "string" && validFonts.includes(rawTypo.fontFamily as any))
      ? (rawTypo.fontFamily as ResumeFontFamily)
      : "Inter",
    nameSize: typeof rawTypo.nameSize === "number" && !isNaN(rawTypo.nameSize)
      ? Math.max(18, Math.min(32, rawTypo.nameSize))
      : 24,
    titleSize: typeof rawTypo.titleSize === "number" && !isNaN(rawTypo.titleSize)
      ? Math.max(11, Math.min(20, rawTypo.titleSize))
      : 14,
    headingSize: typeof rawTypo.headingSize === "number" && !isNaN(rawTypo.headingSize)
      ? Math.max(11, Math.min(18, rawTypo.headingSize))
      : 13,
    bodySize: typeof rawTypo.bodySize === "number" && !isNaN(rawTypo.bodySize)
      ? Math.max(10, Math.min(15, rawTypo.bodySize))
      : 12,
    contactSize: typeof rawTypo.contactSize === "number" && !isNaN(rawTypo.contactSize)
      ? Math.max(9, Math.min(14, rawTypo.contactSize))
      : 11,
    lineSpacing: typeof rawTypo.lineSpacing === "number" && !isNaN(rawTypo.lineSpacing)
      ? Math.max(1.15, Math.min(1.6, rawTypo.lineSpacing))
      : 1.3,
    sectionSpacing: typeof rawTypo.sectionSpacing === "number" && !isNaN(rawTypo.sectionSpacing)
      ? Math.max(10, Math.min(26, rawTypo.sectionSpacing))
      : 16,
    paragraphSpacing: typeof rawTypo.paragraphSpacing === "number" && !isNaN(rawTypo.paragraphSpacing)
      ? Math.max(3, Math.min(12, rawTypo.paragraphSpacing))
      : 6,
  };

  const defaultThemeColors = getTemplateDefaultColors(templateId);
  let colors: ResumeThemeColors = { ...defaultThemeColors };
  if (raw.colors && typeof raw.colors === "object") {
    const rawCol = raw.colors as unknown as Record<string, unknown>;
    colors = {
      primaryAccent: typeof rawCol.primaryAccent === "string" && isValidHexColor(rawCol.primaryAccent)
        ? rawCol.primaryAccent.trim()
        : defaultThemeColors.primaryAccent,
      nameColor: typeof rawCol.nameColor === "string" && isValidHexColor(rawCol.nameColor)
        ? rawCol.nameColor.trim()
        : defaultThemeColors.nameColor,
      titleColor: typeof rawCol.titleColor === "string" && isValidHexColor(rawCol.titleColor)
        ? rawCol.titleColor.trim()
        : defaultThemeColors.titleColor,
      headingColor: typeof rawCol.headingColor === "string" && isValidHexColor(rawCol.headingColor)
        ? rawCol.headingColor.trim()
        : defaultThemeColors.headingColor,
      bodyColor: typeof rawCol.bodyColor === "string" && isValidHexColor(rawCol.bodyColor)
        ? rawCol.bodyColor.trim()
        : defaultThemeColors.bodyColor,
      secondaryColor: typeof rawCol.secondaryColor === "string" && isValidHexColor(rawCol.secondaryColor)
        ? rawCol.secondaryColor.trim()
        : defaultThemeColors.secondaryColor,
      dividerColor: typeof rawCol.dividerColor === "string" && isValidHexColor(rawCol.dividerColor)
        ? rawCol.dividerColor.trim()
        : defaultThemeColors.dividerColor,
    };
  }

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
    typography,
    colors,
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
