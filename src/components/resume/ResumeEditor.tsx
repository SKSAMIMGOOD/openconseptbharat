"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ResumeData,
  WorkExperience,
  Education,
  Project,
  Certification,
  Language,
  Award,
  Achievement,
  ResumeTemplateId,
  PhotoCropShape,
  PhotoSizePreset,
  ResumeFontFamily,
  ResumeTypography,
  ResumeThemeColors,
  ResumeColorPreset,
} from "@/types/resume";
import {
  RESUME_TEMPLATES,
  SAMPLE_RESUME_DATA,
  EMPTY_RESUME_DATA,
  RESUME_FONT_FAMILIES,
  DEFAULT_TYPOGRAPHY,
  RESUME_COLOR_PRESETS,
  getTemplateDefaultColors,
  isValidHexColor,
} from "@/constants/resume-defaults";
import { PhotoCropModal } from "./PhotoCropModal";
import {
  validatePhotoFile,
  PHOTO_SIZE_PRESETS,
  getPhotoDimensions,
} from "@/lib/resume/resume-photo";
import {
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderGit2,
  Award as AwardIcon,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Download,
  Upload,
  Layers,
  FileText,
  Check,
  Globe,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Twitter,
  Camera,
  Crop,
  AlertCircle,
  Circle,
  Square,
  Type,
  Palette,
} from "lucide-react";

export interface ResumeEditorProps {
  data: ResumeData;
  onChange: (updated: ResumeData) => void;
  onReset: () => void;
  onLoadSample: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
}

type EditorSection =
  | "personal"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "additional";

const HexColorInput: React.FC<{
  label: string;
  description?: string;
  value: string;
  onChange: (hex: string) => void;
}> = ({ label, description, value, onChange }) => {
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.trim();
    if (!raw.startsWith("#") && raw.length > 0) {
      raw = "#" + raw;
    }
    setLocalVal(raw);
    if (isValidHexColor(raw)) {
      onChange(raw);
    }
  };

  const handleBlur = () => {
    if (!isValidHexColor(localVal)) {
      setLocalVal(value);
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    setLocalVal(hex);
    onChange(hex);
  };

  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 gap-3">
      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold text-surface-800 dark:text-surface-200 block truncate">
          {label}
        </span>
        {description && (
          <span className="text-[10px] text-surface-500 block truncate">
            {description}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <label className="relative cursor-pointer shrink-0">
          <input
            type="color"
            value={isValidHexColor(value) ? value : "#000000"}
            onChange={handlePickerChange}
            className="w-7 h-7 rounded-md cursor-pointer border border-surface-300 dark:border-surface-600 p-0 overflow-hidden"
          />
        </label>
        <input
          type="text"
          maxLength={7}
          value={localVal}
          onChange={handleTextChange}
          onBlur={handleBlur}
          placeholder="#000000"
          className="w-20 px-2 py-1 text-xs font-mono font-semibold uppercase rounded-md border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
    </div>
  );
};

export const ResumeEditor: React.FC<ResumeEditorProps> = ({
  data,
  onChange,
  onReset,
  onLoadSample,
  onExportJson,
  onImportJson,
}) => {
  const [activeSection, setActiveSection] = useState<EditorSection>("personal");
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropModalImage, setCropModalImage] = useState<string>("");
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isTypographyOpen, setIsTypographyOpen] = useState(false);
  const [isColorsOpen, setIsColorsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Helper for updating nested personal info
  const handlePersonalChange = <K extends keyof ResumeData["personalInfo"]>(
    field: K,
    value: ResumeData["personalInfo"][K]
  ) => {
    onChange({
      ...data,
      personalInfo: {
        ...data.personalInfo,
        [field]: value,
      },
    });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size limit
    const validation = validatePhotoFile(file);
    if (!validation.valid) {
      setPhotoError(validation.error || "Invalid file format or size.");
      e.target.value = "";
      return;
    }

    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCropModalImage(dataUrl);
        setCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleEditExistingPhoto = () => {
    const currentSrc = data.personalInfo.rawPhotoUrl || data.personalInfo.photoUrl;
    if (currentSrc) {
      setPhotoError(null);
      setCropModalImage(currentSrc);
      setCropModalOpen(true);
    }
  };

  const handleSaveCroppedPhoto = (result: {
    photoUrl: string;
    rawPhotoUrl: string;
    shape: PhotoCropShape;
    size: PhotoSizePreset;
  }) => {
    setPhotoError(null);
    onChange({
      ...data,
      personalInfo: {
        ...data.personalInfo,
        photoUrl: result.photoUrl,
        rawPhotoUrl: result.rawPhotoUrl,
        photoShape: result.shape,
        photoSize: result.size,
        showPhoto: true,
      },
    });
  };

  const handleRemovePhoto = () => {
    setPhotoError(null);
    onChange({
      ...data,
      personalInfo: {
        ...data.personalInfo,
        photoUrl: "",
        rawPhotoUrl: "",
        showPhoto: false,
      },
    });
  };

  const handleShapeChange = (shape: PhotoCropShape) => {
    onChange({
      ...data,
      personalInfo: {
        ...data.personalInfo,
        photoShape: shape,
      },
    });
  };

  const handleSizeChange = (size: PhotoSizePreset) => {
    onChange({
      ...data,
      personalInfo: {
        ...data.personalInfo,
        photoSize: size,
      },
    });
  };

  // Helper for summary
  const handleSummaryChange = (summary: string) => {
    onChange({
      ...data,
      summary,
    });
  };

  // Helper for template change
  const handleTemplateChange = (templateId: ResumeTemplateId) => {
    onChange({
      ...data,
      templateId,
    });
  };

  // Helper for typography updates
  const typography = data.typography || DEFAULT_TYPOGRAPHY;
  const handleTypographyChange = (updates: Partial<ResumeTypography>) => {
    onChange({
      ...data,
      typography: {
        ...(data.typography || DEFAULT_TYPOGRAPHY),
        ...updates,
      },
    });
  };

  const handleResetTypography = () => {
    onChange({
      ...data,
      typography: { ...DEFAULT_TYPOGRAPHY },
    });
  };

  // Helper for colour & theme updates
  const colors = data.colors || getTemplateDefaultColors(data.templateId);

  const handleColorChange = (field: keyof ResumeThemeColors, value: string) => {
    onChange({
      ...data,
      colors: {
        ...(data.colors || getTemplateDefaultColors(data.templateId)),
        [field]: value,
      },
    });
  };

  const handleApplyPreset = (preset: ResumeColorPreset) => {
    onChange({
      ...data,
      colors: {
        ...preset.colors,
      },
    });
  };

  const handleResetColors = () => {
    const defaults = getTemplateDefaultColors(data.templateId);
    onChange({
      ...data,
      colors: { ...defaults },
    });
  };

  // ==========================================
  // EXPERIENCE OPERATIONS
  // ==========================================
  const handleAddExperience = () => {
    const newExp: WorkExperience = {
      id: `exp-${Date.now()}`,
      company: "",
      jobTitle: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      responsibilities: "",
      achievements: "",
    };
    onChange({
      ...data,
      experiences: [newExp, ...data.experiences],
    });
  };

  const handleUpdateExperience = (id: string, updates: Partial<WorkExperience>) => {
    onChange({
      ...data,
      experiences: data.experiences.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp)),
    });
  };

  const handleRemoveExperience = (id: string) => {
    onChange({
      ...data,
      experiences: data.experiences.filter((exp) => exp.id !== id),
    });
  };

  const handleMoveExperience = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= data.experiences.length) return;
    const items = [...data.experiences];
    const [moved] = items.splice(index, 1);
    items.splice(targetIndex, 0, moved);
    onChange({ ...data, experiences: items });
  };

  // ==========================================
  // EDUCATION OPERATIONS
  // ==========================================
  const handleAddEducation = () => {
    const newEdu: Education = {
      id: `edu-${Date.now()}`,
      institution: "",
      degree: "",
      fieldOfStudy: "",
      graduationYear: "",
      additionalDetails: "",
    };
    onChange({
      ...data,
      education: [newEdu, ...data.education],
    });
  };

  const handleUpdateEducation = (id: string, updates: Partial<Education>) => {
    onChange({
      ...data,
      education: data.education.map((edu) => (edu.id === id ? { ...edu, ...updates } : edu)),
    });
  };

  const handleRemoveEducation = (id: string) => {
    onChange({
      ...data,
      education: data.education.filter((edu) => edu.id !== id),
    });
  };

  const handleMoveEducation = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= data.education.length) return;
    const items = [...data.education];
    const [moved] = items.splice(index, 1);
    items.splice(targetIndex, 0, moved);
    onChange({ ...data, education: items });
  };

  // ==========================================
  // SKILLS OPERATIONS
  // ==========================================
  const handleSkillsChange = (type: "technical" | "soft", commaSeparated: string) => {
    const list = commaSeparated
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onChange({
      ...data,
      skills: {
        ...data.skills,
        [type]: list,
      },
    });
  };

  // ==========================================
  // PROJECTS OPERATIONS
  // ==========================================
  const handleAddProject = () => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      title: "",
      description: "",
      technologies: "",
      projectUrl: "",
    };
    onChange({
      ...data,
      projects: [newProj, ...data.projects],
    });
  };

  const handleUpdateProject = (id: string, updates: Partial<Project>) => {
    onChange({
      ...data,
      projects: data.projects.map((proj) => (proj.id === id ? { ...proj, ...updates } : proj)),
    });
  };

  const handleRemoveProject = (id: string) => {
    onChange({
      ...data,
      projects: data.projects.filter((proj) => proj.id !== id),
    });
  };

  const handleMoveProject = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= data.projects.length) return;
    const items = [...data.projects];
    const [moved] = items.splice(index, 1);
    items.splice(targetIndex, 0, moved);
    onChange({ ...data, projects: items });
  };

  // ==========================================
  // ADDITIONAL SECTIONS (CERTIFICATIONS, LANGUAGES, AWARDS, ACHIEVEMENTS)
  // ==========================================
  const handleAddCert = () => {
    const newCert: Certification = {
      id: `cert-${Date.now()}`,
      name: "",
      issuer: "",
      date: "",
      url: "",
    };
    onChange({
      ...data,
      certifications: [...(data.certifications || []), newCert],
    });
  };

  const handleUpdateCert = (id: string, updates: Partial<Certification>) => {
    onChange({
      ...data,
      certifications: data.certifications.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    });
  };

  const handleRemoveCert = (id: string) => {
    onChange({
      ...data,
      certifications: data.certifications.filter((c) => c.id !== id),
    });
  };

  const handleAddLanguage = () => {
    const newLang: Language = {
      id: `lang-${Date.now()}`,
      language: "",
      proficiency: "Fluent",
    };
    onChange({
      ...data,
      languages: [...(data.languages || []), newLang],
    });
  };

  const handleUpdateLanguage = (id: string, updates: Partial<Language>) => {
    onChange({
      ...data,
      languages: data.languages.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    });
  };

  const handleRemoveLanguage = (id: string) => {
    onChange({
      ...data,
      languages: data.languages.filter((l) => l.id !== id),
    });
  };

  const handleAddAward = () => {
    const newAward: Award = {
      id: `award-${Date.now()}`,
      title: "",
      issuer: "",
      date: "",
      summary: "",
    };
    onChange({
      ...data,
      awards: [...(data.awards || []), newAward],
    });
  };

  const handleUpdateAward = (id: string, updates: Partial<Award>) => {
    onChange({
      ...data,
      awards: data.awards.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    });
  };

  const handleRemoveAward = (id: string) => {
    onChange({
      ...data,
      awards: data.awards.filter((a) => a.id !== id),
    });
  };

  const handleAddAchievement = () => {
    const newAch: Achievement = {
      id: `ach-${Date.now()}`,
      title: "",
      description: "",
    };
    onChange({
      ...data,
      achievements: [...(data.achievements || []), newAch],
    });
  };

  const handleUpdateAchievement = (id: string, updates: Partial<Achievement>) => {
    onChange({
      ...data,
      achievements: data.achievements.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    });
  };

  const handleRemoveAchievement = (id: string) => {
    onChange({
      ...data,
      achievements: data.achievements.filter((a) => a.id !== id),
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJson(file);
      e.target.value = "";
    }
  };

  return (
    <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 sm:p-7 shadow-card space-y-6 lg:max-h-[calc(100vh-6.5rem)] lg:overflow-y-auto overscroll-contain">
      {/* 1. TOP TOOLBAR: Template Selector & Actions */}
      <div className="space-y-4 pb-5 border-b border-surface-200 dark:border-surface-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600" />
              <span>Resume Builder</span>
            </h3>
            <p className="text-xs text-surface-500">
              Pick a layout, enter details, and download vector PDF
            </p>
          </div>

          {/* Quick Actions (Sample, Reset, JSON Backup) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onLoadSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors border border-brand-200"
              title="Prepopulate with realistic professional sample data"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-surface-600 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-surface-200"
              title="Reset resume to empty form"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            {/* Hidden File Input for JSON restore */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,application/json"
              className="hidden"
            />
            <button
              type="button"
              onClick={triggerFileInput}
              className="p-1.5 rounded-xl text-surface-600 hover:text-surface-900 hover:bg-surface-100 border border-surface-200"
              title="Import resume from local JSON file"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onExportJson}
              className="p-1.5 rounded-xl text-surface-600 hover:text-surface-900 hover:bg-surface-100 border border-surface-200"
              title="Export backup as JSON file"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Template Choice Tabs with Visual Wireframes */}
        <div>
          <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-2">
            Select Resume Template:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {RESUME_TEMPLATES.map((tmpl) => {
              const isSelected = data.templateId === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleTemplateChange(tmpl.id)}
                  className={`text-left p-2.5 sm:p-3 rounded-xl border text-xs transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? "border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 shadow-sm ring-1 ring-brand-500"
                      : "border-surface-200 dark:border-surface-700 hover:border-surface-300 bg-surface-50 dark:bg-surface-800"
                  }`}
                >
                  {/* Visual Wireframe Preview */}
                  <div className="w-full h-14 bg-white dark:bg-surface-900 rounded-lg border border-surface-200/80 dark:border-surface-700 p-1.5 mb-2 overflow-hidden flex flex-col justify-between shadow-xs pointer-events-none">
                    {tmpl.id === "modern-two-column" ? (
                      <div className="flex h-full gap-1">
                        <div className="w-[34%] bg-brand-50 dark:bg-brand-950/50 rounded-sm p-1 flex flex-col gap-1 border-r border-brand-100 dark:border-brand-900">
                          <div className="w-3 h-3 rounded-full bg-brand-500 shrink-0" />
                          <div className="h-1 w-full bg-brand-300 dark:bg-brand-700 rounded-xs" />
                          <div className="h-1 w-3/4 bg-brand-200 dark:bg-brand-800 rounded-xs" />
                        </div>
                        <div className="flex-1 flex flex-col gap-1 p-0.5">
                          <div className="h-1.5 w-4/5 bg-surface-800 dark:bg-surface-200 rounded-xs" />
                          <div className="h-1 w-1/2 bg-brand-600 rounded-xs" />
                          <div className="h-1 w-full bg-surface-200 dark:bg-surface-700 rounded-xs mt-1" />
                          <div className="h-1 w-5/6 bg-surface-200 dark:bg-surface-700 rounded-xs" />
                        </div>
                      </div>
                    ) : tmpl.id === "executive" ? (
                      <div className="flex flex-col h-full justify-between">
                        <div className="h-2 w-full bg-slate-900 dark:bg-slate-700 rounded-xs mb-1" />
                        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 border-l border-slate-700 pl-1 py-0.5">
                          <div className="h-1 w-3/4 bg-slate-400 rounded-xs" />
                        </div>
                        <div className="flex flex-col gap-0.5 mt-1">
                          <div className="h-1 w-full bg-surface-300 dark:bg-surface-700 rounded-xs" />
                          <div className="h-1 w-4/5 bg-surface-200 dark:bg-surface-700 rounded-xs" />
                        </div>
                      </div>
                    ) : tmpl.id === "creative" ? (
                      <div className="flex flex-col h-full justify-between">
                        <div className="flex items-center justify-between">
                          <div className="h-1.5 w-1/2 bg-violet-600 rounded-xs" />
                          <div className="w-2.5 h-2.5 rounded-full bg-violet-400" />
                        </div>
                        <div className="flex gap-1">
                          <span className="h-1.5 w-4 rounded-full bg-violet-100 dark:bg-violet-900" />
                          <span className="h-1.5 w-5 rounded-full bg-violet-200 dark:bg-violet-800" />
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <div className="h-3 bg-violet-50 dark:bg-violet-950/40 rounded-xs border border-violet-200 dark:border-violet-800" />
                          <div className="h-3 bg-violet-50 dark:bg-violet-950/40 rounded-xs border border-violet-200 dark:border-violet-800" />
                        </div>
                      </div>
                    ) : tmpl.id === "student-fresher" ? (
                      <div className="flex flex-col h-full justify-between">
                        <div className="h-1.5 w-3/5 bg-teal-600 rounded-xs" />
                        <div className="h-3 w-full bg-teal-50 dark:bg-teal-950/40 rounded-xs border border-teal-200 dark:border-teal-800 p-0.5 flex flex-col justify-center">
                          <div className="h-1 w-2/3 bg-teal-700 rounded-xs" />
                        </div>
                        <div className="h-1 w-full bg-surface-200 dark:bg-surface-700 rounded-xs" />
                      </div>
                    ) : tmpl.id === "elegant-minimal" ? (
                      <div className="flex flex-col h-full justify-between p-0.5">
                        <div className="h-1 w-2/5 bg-stone-800 dark:bg-stone-300 rounded-xs" />
                        <div className="h-px w-full bg-stone-200 dark:bg-stone-700 my-0.5" />
                        <div className="h-0.5 w-1/4 bg-stone-400 rounded-xs" />
                        <div className="h-1 w-full bg-stone-100 dark:bg-stone-800 rounded-xs" />
                        <div className="h-1 w-3/4 bg-stone-100 dark:bg-stone-800 rounded-xs" />
                      </div>
                    ) : tmpl.id === "minimal-ats" ? (
                      <div className="flex flex-col h-full justify-between">
                        <div className="h-1 w-1/2 bg-black dark:bg-white rounded-xs" />
                        <div className="h-px w-full bg-black dark:bg-white" />
                        <div className="h-1 w-full bg-neutral-300 dark:bg-neutral-600 rounded-xs" />
                        <div className="h-1 w-4/5 bg-neutral-200 dark:bg-neutral-700 rounded-xs" />
                      </div>
                    ) : tmpl.id === "classic-corporate" ? (
                      <div className="flex flex-col h-full justify-between items-center text-center">
                        <div className="h-1 w-1/2 bg-neutral-900 dark:bg-neutral-100 rounded-xs" />
                        <div className="w-full border-b border-t border-neutral-800 dark:border-neutral-200 py-0.5 my-0.5">
                          <div className="h-0.5 w-1/3 bg-neutral-400 mx-auto" />
                        </div>
                        <div className="h-1 w-4/5 bg-neutral-200 dark:bg-neutral-700 rounded-xs" />
                      </div>
                    ) : (
                      // Modern Professional
                      <div className="flex flex-col h-full justify-between">
                        <div className="h-1.5 w-2/3 bg-brand-600 rounded-xs" />
                        <div className="h-1 w-1/3 bg-brand-400 rounded-xs" />
                        <div className="h-1 w-full bg-surface-200 dark:bg-surface-700 rounded-xs" />
                        <div className="h-1 w-5/6 bg-surface-200 dark:bg-surface-700 rounded-xs" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-surface-900 dark:text-surface-100 truncate pr-1">
                        {tmpl.name}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />}
                    </div>
                    <div className="mb-1.5">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand-100/70 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
                        {tmpl.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-surface-500 line-clamp-2">
                      {tmpl.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsible Typography & Fonts Customization Panel */}
        <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-800">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsTypographyOpen(!isTypographyOpen)}
              className="inline-flex items-center gap-2 text-xs font-bold text-surface-900 dark:text-surface-100 hover:text-brand-600 transition-colors"
            >
              <div className="w-6 h-6 rounded-md bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center border border-brand-100 dark:border-brand-900">
                <Type className="w-3.5 h-3.5" />
              </div>
              <span>Typography & Spacing Controls</span>
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-700">
                {typography.fontFamily} • Line {typography.lineSpacing}
              </span>
              {isTypographyOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-surface-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-surface-400" />
              )}
            </button>

            {isTypographyOpen && (
              <button
                type="button"
                onClick={handleResetTypography}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-surface-500 hover:text-surface-800 dark:hover:text-surface-200 transition-colors"
                title="Reset typography settings to default"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Typography</span>
              </button>
            )}
          </div>

          {isTypographyOpen && (
            <div className="mt-3.5 space-y-4 p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/80 dark:border-surface-700">
              {/* 1. Font Family Grid */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-700 dark:text-surface-300 mb-2">
                  Font Family
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {RESUME_FONT_FAMILIES.map((f) => {
                    const isSelected = typography.fontFamily === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleTypographyChange({ fontFamily: f.id })}
                        style={{ fontFamily: f.cssFont }}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          isSelected
                            ? "border-brand-600 bg-brand-50/70 dark:bg-brand-950/50 ring-1 ring-brand-500"
                            : "border-surface-200 dark:border-surface-700 hover:border-surface-300 bg-white dark:bg-surface-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-surface-900 dark:text-surface-100">
                            {f.name}
                          </span>
                          {isSelected && <Check className="w-3 h-3 text-brand-600" />}
                        </div>
                        <span className="text-[10px] text-surface-500 block font-sans">
                          {f.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Font Size Hierarchy Controls */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-surface-700 dark:text-surface-300">
                    Font Size Hierarchy
                  </label>
                  <span className="text-[10px] text-surface-500">Scale typography elements</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Candidate Name Size */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-surface-700 dark:text-surface-300 font-medium">Candidate Name</span>
                      <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{typography.nameSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="18"
                      max="32"
                      step="1"
                      value={typography.nameSize}
                      onChange={(e) => handleTypographyChange({ nameSize: Number(e.target.value) })}
                      className="w-full accent-brand-600 cursor-pointer"
                    />
                  </div>

                  {/* Professional Title Size */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-surface-700 dark:text-surface-300 font-medium">Professional Title</span>
                      <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{typography.titleSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="11"
                      max="20"
                      step="1"
                      value={typography.titleSize}
                      onChange={(e) => handleTypographyChange({ titleSize: Number(e.target.value) })}
                      className="w-full accent-brand-600 cursor-pointer"
                    />
                  </div>

                  {/* Section Headings Size */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-surface-700 dark:text-surface-300 font-medium">Section Headings</span>
                      <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{typography.headingSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="11"
                      max="18"
                      step="1"
                      value={typography.headingSize}
                      onChange={(e) => handleTypographyChange({ headingSize: Number(e.target.value) })}
                      className="w-full accent-brand-600 cursor-pointer"
                    />
                  </div>

                  {/* Body Text Size */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-surface-700 dark:text-surface-300 font-medium">Body Text</span>
                      <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{typography.bodySize}px</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="15"
                      step="0.5"
                      value={typography.bodySize}
                      onChange={(e) => handleTypographyChange({ bodySize: Number(e.target.value) })}
                      className="w-full accent-brand-600 cursor-pointer"
                    />
                  </div>

                  {/* Contact Info Size */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-surface-700 dark:text-surface-300 font-medium">Contact Information</span>
                      <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{typography.contactSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="9"
                      max="14"
                      step="0.5"
                      value={typography.contactSize}
                      onChange={(e) => handleTypographyChange({ contactSize: Number(e.target.value) })}
                      className="w-full accent-brand-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Spacing Controls */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-surface-700 dark:text-surface-300">
                    Spacing & Layout Rhythm
                  </label>
                  <span className="text-[10px] text-surface-500">Fine-tune vertical proportions</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Line Spacing */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-surface-700 dark:text-surface-300 font-medium">Line Spacing</span>
                      <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{typography.lineSpacing.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="1.15"
                      max="1.6"
                      step="0.05"
                      value={typography.lineSpacing}
                      onChange={(e) => handleTypographyChange({ lineSpacing: Number(e.target.value) })}
                      className="w-full accent-brand-600 cursor-pointer"
                    />
                  </div>

                  {/* Section Spacing */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-surface-700 dark:text-surface-300 font-medium">Section Spacing</span>
                      <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{typography.sectionSpacing}px</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="26"
                      step="1"
                      value={typography.sectionSpacing}
                      onChange={(e) => handleTypographyChange({ sectionSpacing: Number(e.target.value) })}
                      className="w-full accent-brand-600 cursor-pointer"
                    />
                  </div>

                  {/* Paragraph Spacing */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-surface-700 dark:text-surface-300 font-medium">Paragraph Spacing</span>
                      <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{typography.paragraphSpacing}px</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="12"
                      step="1"
                      value={typography.paragraphSpacing}
                      onChange={(e) => handleTypographyChange({ paragraphSpacing: Number(e.target.value) })}
                      className="w-full accent-brand-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Colours & Theme Customization Panel */}
        <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-800">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsColorsOpen(!isColorsOpen)}
              className="inline-flex items-center gap-2 text-xs font-bold text-surface-900 dark:text-surface-100 hover:text-brand-600 transition-colors"
            >
              <div className="w-6 h-6 rounded-md bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center border border-brand-100 dark:border-brand-900">
                <Palette className="w-3.5 h-3.5" />
              </div>
              <span>Colours & Theme</span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-normal px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-700">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                  style={{ backgroundColor: colors.primaryAccent }}
                />
                <span className="font-mono">{colors.primaryAccent.toUpperCase()}</span>
              </span>
              {isColorsOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-surface-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-surface-400" />
              )}
            </button>

            {isColorsOpen && (
              <button
                type="button"
                onClick={handleResetColors}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-surface-500 hover:text-surface-800 dark:hover:text-surface-200 transition-colors"
                title="Reset colours to template defaults"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Colours</span>
              </button>
            )}
          </div>

          {isColorsOpen && (
            <div className="mt-3.5 space-y-4 p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/80 dark:border-surface-700">
              {/* 1. Colour Presets Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-700 dark:text-surface-300">
                    Colour Presets
                  </label>
                  <span className="text-[10px] text-surface-500">8 curated professional palettes</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {RESUME_COLOR_PRESETS.map((preset) => {
                    const isSelected =
                      colors.primaryAccent.toLowerCase() === preset.primary.toLowerCase();
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`p-2 rounded-lg border text-left transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? "border-brand-600 bg-brand-50/70 dark:bg-brand-950/50 ring-1 ring-brand-500"
                            : "border-surface-200 dark:border-surface-700 hover:border-surface-300 bg-white dark:bg-surface-800"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10 shadow-xs"
                            style={{ backgroundColor: preset.primary }}
                          />
                          <span className="text-xs font-semibold text-surface-900 dark:text-surface-100 truncate">
                            {preset.name}
                          </span>
                        </div>
                        {isSelected && <Check className="w-3 h-3 text-brand-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Individual Colour Controls */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-700 dark:text-surface-300">
                    Individual Colour Controls
                  </label>
                  <span className="text-[10px] text-surface-500">Fine-tune HEX or select custom swatches</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <HexColorInput
                    label="Primary Accent"
                    description="Icons, highlights, badges & links"
                    value={colors.primaryAccent}
                    onChange={(hex) => handleColorChange("primaryAccent", hex)}
                  />
                  <HexColorInput
                    label="Candidate Name"
                    description="Full name header in preview & PDF"
                    value={colors.nameColor}
                    onChange={(hex) => handleColorChange("nameColor", hex)}
                  />
                  <HexColorInput
                    label="Professional Title"
                    description="Job title text beneath name"
                    value={colors.titleColor}
                    onChange={(hex) => handleColorChange("titleColor", hex)}
                  />
                  <HexColorInput
                    label="Section Headings"
                    description="Experience, Education, Skills titles"
                    value={colors.headingColor}
                    onChange={(hex) => handleColorChange("headingColor", hex)}
                  />
                  <HexColorInput
                    label="Body Text"
                    description="Paragraphs, bullet descriptions & details"
                    value={colors.bodyColor}
                    onChange={(hex) => handleColorChange("bodyColor", hex)}
                  />
                  <HexColorInput
                    label="Secondary Text"
                    description="Dates, locations, subtitles & contacts"
                    value={colors.secondaryColor}
                    onChange={(hex) => handleColorChange("secondaryColor", hex)}
                  />
                  <div className="sm:col-span-2">
                    <HexColorInput
                      label="Dividers & Decorative Lines"
                      description="Header rules, section underlines & borders"
                      value={colors.dividerColor}
                      onChange={(hex) => handleColorChange("dividerColor", hex)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. SECTION NAVIGATOR TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-surface-100 dark:border-surface-800 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSection("personal")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeSection === "personal"
              ? "bg-brand-600 text-white shadow-sm"
              : "bg-surface-100 text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Personal Info</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("summary")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeSection === "summary"
              ? "bg-brand-600 text-white shadow-sm"
              : "bg-surface-100 text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Summary</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("experience")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeSection === "experience"
              ? "bg-brand-600 text-white shadow-sm"
              : "bg-surface-100 text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Experience ({data.experiences.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("education")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeSection === "education"
              ? "bg-brand-600 text-white shadow-sm"
              : "bg-surface-100 text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300"
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Education ({data.education.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("skills")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeSection === "skills"
              ? "bg-brand-600 text-white shadow-sm"
              : "bg-surface-100 text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300"
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Skills</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("projects")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeSection === "projects"
              ? "bg-brand-600 text-white shadow-sm"
              : "bg-surface-100 text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300"
          }`}
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          <span>Projects ({data.projects.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("additional")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
            activeSection === "additional"
              ? "bg-brand-600 text-white shadow-sm"
              : "bg-surface-100 text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300"
          }`}
        >
          <AwardIcon className="w-3.5 h-3.5" />
          <span>More Sections</span>
        </button>
      </div>

      {/* 3. SECTION CONTENT FORMS */}

      {/* SECTION A: PERSONAL INFO */}
      {activeSection === "personal" && (
        <div className="space-y-4">
          {/* Profile Photo Uploader & Editor */}
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700">
              <input
                type="file"
                ref={photoInputRef}
                onChange={handlePhotoSelect}
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {data.personalInfo.photoUrl ? (
                    <div
                      className={`w-14 h-14 relative group shrink-0 flex items-center justify-center overflow-hidden border-2 border-brand-500 shadow-sm transition-all ${
                        data.personalInfo.photoShape === "circle"
                          ? "rounded-full"
                          : "rounded-none"
                      }`}
                      style={{
                        width: "56px",
                        height: "56px",
                        minWidth: "56px",
                        minHeight: "56px",
                        maxWidth: "56px",
                        maxHeight: "56px",
                        borderRadius: data.personalInfo.photoShape === "circle" ? "50%" : "0",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={data.personalInfo.photoUrl}
                        alt="Profile thumbnail"
                        className={`w-14 h-14 object-cover block ${
                          data.personalInfo.photoShape === "circle" ? "rounded-full" : "rounded-none"
                        }`}
                        style={{
                          width: "56px",
                          height: "56px",
                          maxWidth: "56px",
                          maxHeight: "56px",
                          objectFit: "cover",
                          borderRadius: data.personalInfo.photoShape === "circle" ? "50%" : "0",
                          display: "block",
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className={`w-14 h-14 relative shrink-0 flex items-center justify-center overflow-hidden bg-surface-200 dark:bg-surface-700 text-surface-500 border border-dashed border-surface-300 dark:border-surface-600 transition-all ${
                        data.personalInfo.photoShape === "circle"
                          ? "rounded-full"
                          : "rounded-none"
                      }`}
                      style={{
                        width: "56px",
                        height: "56px",
                        minWidth: "56px",
                        minHeight: "56px",
                        maxWidth: "56px",
                        maxHeight: "56px",
                        borderRadius: data.personalInfo.photoShape === "circle" ? "50%" : "0",
                      }}
                    >
                      <Camera className="w-5 h-5" />
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-bold text-surface-900 dark:text-surface-100 flex items-center gap-1.5">
                      <span>Profile Photo</span>
                      <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400">
                        Optional
                      </span>
                    </div>
                    <div className="text-[11px] text-surface-500 mt-0.5">
                      {data.personalInfo.photoUrl
                        ? `${PHOTO_SIZE_PRESETS[data.personalInfo.photoSize || "standard"].label} • ${
                            data.personalInfo.photoShape === "circle" ? "Circular" : "Rectangular (7:9)"
                          }`
                        : "Upload JPG, PNG, or WebP (max 5 MB)"}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200 transition-colors shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{data.personalInfo.photoUrl ? "Replace Photo" : "Upload Photo"}</span>
                  </button>

                  {data.personalInfo.photoUrl && (
                    <>
                      <button
                        type="button"
                        onClick={handleEditExistingPhoto}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-200 transition-colors shadow-sm"
                        title="Crop, zoom or reposition photo"
                      >
                        <Crop className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                        <span>Crop / Adjust</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors border border-rose-200 dark:border-rose-900/50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Controls when photo is present: Size Presets, Shape Style, & Show Toggle */}
              {data.personalInfo.photoUrl && (
                <div className="mt-4 pt-3.5 border-t border-surface-200/80 dark:border-surface-700/80 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Size Selector */}
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-surface-500 mb-1">
                        Physical Dimensions
                      </span>
                      <div className="grid grid-cols-3 gap-1 bg-surface-200/60 dark:bg-surface-900/60 p-1 rounded-lg">
                        {(["small", "standard", "large"] as PhotoSizePreset[]).map((pKey) => {
                          const spec = PHOTO_SIZE_PRESETS[pKey];
                          const active = (data.personalInfo.photoSize || "standard") === pKey;
                          return (
                            <button
                              key={pKey}
                              type="button"
                              onClick={() => handleSizeChange(pKey)}
                              className={`py-1 px-1.5 rounded text-center transition-all ${
                                active
                                  ? "bg-white dark:bg-surface-800 text-brand-600 dark:text-brand-400 font-bold shadow-xs"
                                  : "text-surface-600 dark:text-surface-400 hover:text-surface-900 text-xs"
                              }`}
                            >
                              <div className="text-[11px] capitalize">{pKey}</div>
                              <div className="text-[9px] font-mono opacity-80">
                                {spec.widthMm}×{spec.heightMm}mm
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Shape Selector */}
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-surface-500 mb-1">
                        Photo Style
                      </span>
                      <div className="grid grid-cols-2 gap-1 bg-surface-200/60 dark:bg-surface-900/60 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => handleShapeChange("rectangle")}
                          className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-semibold transition-all ${
                            data.personalInfo.photoShape !== "circle"
                              ? "bg-white dark:bg-surface-800 text-brand-600 dark:text-brand-400 font-bold shadow-xs"
                              : "text-surface-600 dark:text-surface-400 hover:text-surface-900"
                          }`}
                        >
                          <Square className="w-3 h-3" />
                          <span>Rectangular (7:9)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShapeChange("circle")}
                          className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-semibold transition-all ${
                            data.personalInfo.photoShape === "circle"
                              ? "bg-white dark:bg-surface-800 text-brand-600 dark:text-brand-400 font-bold shadow-xs"
                              : "text-surface-600 dark:text-surface-400 hover:text-surface-900"
                          }`}
                        >
                          <Circle className="w-3 h-3" />
                          <span>Circular</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Enable / Disable toggle */}
                  <div className="pt-2 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-surface-800 dark:text-surface-200 select-none">
                      <input
                        type="checkbox"
                        checked={data.personalInfo.showPhoto ?? true}
                        onChange={(e) => handlePersonalChange("showPhoto", e.target.checked)}
                        className="rounded border-surface-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Show photo on resume</span>
                    </label>

                    <span className="text-[11px] text-surface-500 font-mono">
                      Export: {PHOTO_SIZE_PRESETS[data.personalInfo.photoSize || "standard"].widthMm} × {PHOTO_SIZE_PRESETS[data.personalInfo.photoSize || "standard"].heightMm} mm
                    </span>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {photoError && (
                <div className="mt-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{photoError}</span>
                </div>
              )}
            </div>

            {/* ATS Advisory Banner for Minimal ATS Template */}
            {data.templateId === "minimal-ats" && data.personalInfo.showPhoto && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <span className="font-semibold">ATS Advisory:</span> Profile photos are generally not recommended for ATS-parsed resumes, as some automated systems cannot parse images or may encounter errors. You can keep it disabled for maximum ATS compatibility.
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={data.personalInfo.fullName}
                onChange={(e) => handlePersonalChange("fullName", e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1">
                Professional Title
              </label>
              <input
                type="text"
                value={data.personalInfo.jobTitle}
                onChange={(e) => handlePersonalChange("jobTitle", e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-surface-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                value={data.personalInfo.email}
                onChange={(e) => handlePersonalChange("email", e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-surface-400" />
                <span>Phone Number</span>
              </label>
              <input
                type="tel"
                value={data.personalInfo.phone}
                onChange={(e) => handlePersonalChange("phone", e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-surface-400" />
                <span>Location</span>
              </label>
              <input
                type="text"
                value={data.personalInfo.location}
                onChange={(e) => handlePersonalChange("location", e.target.value)}
                placeholder="e.g. Bengaluru, India"
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1 flex items-center gap-1">
                <Linkedin className="w-3 h-3 text-surface-400" />
                <span>LinkedIn Profile URL</span>
              </label>
              <input
                type="url"
                value={data.personalInfo.linkedIn || ""}
                onChange={(e) => handlePersonalChange("linkedIn", e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1 flex items-center gap-1">
                <Github className="w-3 h-3 text-surface-400" />
                <span>GitHub Profile URL</span>
              </label>
              <input
                type="url"
                value={data.personalInfo.github || ""}
                onChange={(e) => handlePersonalChange("github", e.target.value)}
                placeholder="https://github.com/username"
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1 flex items-center gap-1">
                <Globe className="w-3 h-3 text-surface-400" />
                <span>Portfolio / Website URL</span>
              </label>
              <input
                type="url"
                value={data.personalInfo.portfolio || ""}
                onChange={(e) => handlePersonalChange("portfolio", e.target.value)}
                placeholder="https://yourportfolio.dev"
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1 flex items-center gap-1">
                <Twitter className="w-3 h-3 text-surface-400" />
                <span>Twitter / X Profile URL</span>
              </label>
              <input
                type="url"
                value={data.personalInfo.twitter || ""}
                onChange={(e) => handlePersonalChange("twitter", e.target.value)}
                placeholder="https://twitter.com/username"
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION B: SUMMARY */}
      {activeSection === "summary" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300">
              Professional Summary (Optional)
            </label>
            <span className="text-[11px] text-surface-400 font-mono">
              {data.summary.length} characters
            </span>
          </div>
          <textarea
            rows={5}
            value={data.summary}
            onChange={(e) => handleSummaryChange(e.target.value)}
            placeholder="A concise, impact-oriented summary highlighting your career achievements, core specializations, and professional strengths..."
            className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed resize-y"
          />
          <p className="text-[11px] text-surface-500 leading-normal">
            Tip: Keep your summary between 2-4 sentences with strong action verbs and metrics.
          </p>
        </div>
      )}

      {/* SECTION C: WORK EXPERIENCE */}
      {activeSection === "experience" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">
              Work Experience Entries
            </span>
            <button
              type="button"
              onClick={handleAddExperience}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Position</span>
            </button>
          </div>

          {data.experiences.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-2xl">
              <p className="text-xs text-surface-500 mb-3">No work experience entries added yet.</p>
              <button
                type="button"
                onClick={handleAddExperience}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-surface-100 hover:bg-surface-200 text-surface-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Experience</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {data.experiences.map((exp, index) => (                <div
                  key={exp.id}
                  className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/40 space-y-3 relative group"
                >
                  {/* Item Reorder & Delete Bar */}
                  <div className="flex items-center justify-between pb-2 border-b border-surface-200/60 dark:border-surface-700">
                    <span className="text-xs font-bold text-surface-800 dark:text-surface-200">
                      #{index + 1} {exp.jobTitle || "Untitled Position"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveExperience(index, "up")}
                        disabled={index === 0}
                        className="p-1 rounded text-surface-500 hover:text-surface-900 disabled:opacity-30"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveExperience(index, "down")}
                        disabled={index === data.experiences.length - 1}
                        className="p-1 rounded text-surface-500 hover:text-surface-900 disabled:opacity-30"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveExperience(exp.id)}
                        className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        title="Remove Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-surface-600 mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={exp.jobTitle}
                        onChange={(e) => handleUpdateExperience(exp.id, { jobTitle: e.target.value })}
                        placeholder="e.g. Lead Full-Stack Engineer"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-surface-600 mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => handleUpdateExperience(exp.id, { company: e.target.value })}
                        placeholder="e.g. Apex Cloud Technologies"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-surface-600 mb-1">
                        Start Date
                      </label>
                      <input
                        type="text"
                        value={exp.startDate}
                        onChange={(e) => handleUpdateExperience(exp.id, { startDate: e.target.value })}
                        placeholder="e.g. 2021-03 or Mar 2021"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-surface-600 mb-1">
                        End Date
                      </label>
                      <input
                        type="text"
                        disabled={exp.current}
                        value={exp.current ? "Present" : exp.endDate}
                        onChange={(e) => handleUpdateExperience(exp.id, { endDate: e.target.value })}
                        placeholder="e.g. 2023-08"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 disabled:opacity-50"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <input
                        type="checkbox"
                        id={`current-${exp.id}`}
                        checked={exp.current}
                        onChange={(e) => handleUpdateExperience(exp.id, { current: e.target.checked })}
                        className="rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                      />
                      <label htmlFor={`current-${exp.id}`} className="text-xs text-surface-700 cursor-pointer">
                        Currently working here
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-surface-600 mb-1">
                      Responsibilities & Achievements (One bullet per line)
                    </label>
                    <textarea
                      rows={3}
                      value={exp.responsibilities}
                      onChange={(e) => handleUpdateExperience(exp.id, { responsibilities: e.target.value })}
                      placeholder="• Architected microservices reducing server latency by 35%&#10;• Mentored 6 junior engineers and led daily scrum standups"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 font-mono leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-surface-600 mb-1">
                      Key Highlights / Notable Achievement (Optional)
                    </label>
                    <input
                      type="text"
                      value={exp.achievements || ""}
                      onChange={(e) => handleUpdateExperience(exp.id, { achievements: e.target.value })}
                      placeholder="e.g. Awarded Innovator of the Year for 0-downtime database migration"
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION D: EDUCATION */}
      {activeSection === "education" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">
              Education Entries
            </span>
            <button
              type="button"
              onClick={handleAddEducation}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Education</span>
            </button>
          </div>

          {data.education.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-2xl">
              <p className="text-xs text-surface-500 mb-3">No education entries added yet.</p>
              <button
                type="button"
                onClick={handleAddEducation}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-surface-100 hover:bg-surface-200 text-surface-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Education</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {data.education.map((edu, index) => (
                <div
                  key={edu.id}
                  className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/40 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-surface-200/60 dark:border-surface-700">
                    <span className="text-xs font-bold text-surface-800 dark:text-surface-200">
                      #{index + 1} {edu.degree || "Degree"} {edu.institution ? `– ${edu.institution}` : ""}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveEducation(index, "up")}
                        disabled={index === 0}
                        className="p-1 rounded text-surface-500 hover:text-surface-900 disabled:opacity-30"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveEducation(index, "down")}
                        disabled={index === data.education.length - 1}
                        className="p-1 rounded text-surface-500 hover:text-surface-900 disabled:opacity-30"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveEducation(edu.id)}
                        className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        title="Remove Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-surface-600 mb-1">
                        Institution / University Name
                      </label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => handleUpdateEducation(edu.id, { institution: e.target.value })}
                        placeholder="e.g. National Institute of Technology"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-surface-600 mb-1">
                        Degree
                      </label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => handleUpdateEducation(edu.id, { degree: e.target.value })}
                        placeholder="e.g. Bachelor of Technology (B.Tech)"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-surface-600 mb-1">
                        Field of Study / Major
                      </label>
                      <input
                        type="text"
                        value={edu.fieldOfStudy}
                        onChange={(e) => handleUpdateEducation(edu.id, { fieldOfStudy: e.target.value })}
                        placeholder="e.g. Computer Science and Engineering"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-surface-600 mb-1">
                        Graduation Year / Dates
                      </label>
                      <input
                        type="text"
                        value={edu.graduationYear}
                        onChange={(e) => handleUpdateEducation(edu.id, { graduationYear: e.target.value })}
                        placeholder="e.g. 2021"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-surface-600 mb-1">
                      Additional Details / GPA / Honors (Optional)
                    </label>
                    <input
                      type="text"
                      value={edu.additionalDetails || ""}
                      onChange={(e) => handleUpdateEducation(edu.id, { additionalDetails: e.target.value })}
                      placeholder="e.g. CGPA: 8.9/10, Dean's Honors List"
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION E: SKILLS */}
      {activeSection === "skills" && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1">
              Technical Skills (Comma-separated)
            </label>
            <textarea
              rows={3}
              value={data.skills.technical.join(", ")}
              onChange={(e) => handleSkillsChange("technical", e.target.value)}
              placeholder="e.g. TypeScript, React, Next.js, Node.js, PostgreSQL, Docker, AWS"
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-surface-100 font-mono"
            />
            {data.skills.technical.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {data.skills.technical.map((s, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1">
              Soft Skills / Leadership / Methodologies (Comma-separated)
            </label>
            <textarea
              rows={2}
              value={data.skills.soft.join(", ")}
              onChange={(e) => handleSkillsChange("soft", e.target.value)}
              placeholder="e.g. Team Leadership, Agile Methodology, System Architecture, Cross-functional Collaboration"
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-surface-900 dark:text-surface-100 font-mono"
            />
            {data.skills.soft.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {data.skills.soft.map((s, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-surface-100 text-surface-700 border border-surface-200"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION F: PROJECTS */}
      {activeSection === "projects" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">
              Projects & Portfolios
            </span>
            <button
              type="button"
              onClick={handleAddProject}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          </div>

          {data.projects.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-2xl">
              <p className="text-xs text-surface-500 mb-3">No projects added yet.</p>
              <button
                type="button"
                onClick={handleAddProject}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-surface-100 hover:bg-surface-200 text-surface-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Project</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {data.projects.map((proj, index) => (
                <div
                  key={proj.id}
                  className="p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/40 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-surface-200/60 dark:border-surface-700">
                    <span className="text-xs font-bold text-surface-800 dark:text-surface-200">
                      #{index + 1} {proj.title || "Untitled Project"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveProject(index, "up")}
                        disabled={index === 0}
                        className="p-1 rounded text-surface-500 hover:text-surface-900 disabled:opacity-30"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveProject(index, "down")}
                        disabled={index === data.projects.length - 1}
                        className="p-1 rounded text-surface-500 hover:text-surface-900 disabled:opacity-30"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveProject(proj.id)}
                        className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        title="Remove Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-surface-600 mb-1">
                        Project Title
                      </label>
                      <input
                        type="text"
                        value={proj.title}
                        onChange={(e) => handleUpdateProject(proj.id, { title: e.target.value })}
                        placeholder="e.g. Distributed Task Queue"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-surface-600 mb-1">
                        Project URL / Repository Link
                      </label>
                      <input
                        type="url"
                        value={proj.projectUrl || ""}
                        onChange={(e) => handleUpdateProject(proj.id, { projectUrl: e.target.value })}
                        placeholder="https://github.com/user/project"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-surface-600 mb-1">
                      Technologies Used (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={proj.technologies}
                      onChange={(e) => handleUpdateProject(proj.id, { technologies: e.target.value })}
                      placeholder="e.g. Golang, Redis, Docker, gRPC"
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-surface-600 mb-1">
                      Description & Impact
                    </label>
                    <textarea
                      rows={2}
                      value={proj.description}
                      onChange={(e) => handleUpdateProject(proj.id, { description: e.target.value })}
                      placeholder="High-throughput asynchronous job processing engine processing 50k events/sec..."
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 leading-relaxed"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION G: ADDITIONAL SECTIONS */}
      {activeSection === "additional" && (
        <div className="space-y-6">
          {/* 1. Certifications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-surface-800 dark:text-surface-200">
                Certifications & Licences ({data.certifications?.length || 0})
              </span>
              <button
                type="button"
                onClick={handleAddCert}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-100 hover:bg-surface-200 text-surface-800"
              >
                <Plus className="w-3 h-3" />
                <span>Add Certification</span>
              </button>
            </div>
            {data.certifications?.map((c) => (
              <div key={c.id} className="space-y-2 p-3 bg-surface-50 dark:bg-surface-800 rounded-xl border border-surface-200">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Certificate Name"
                    value={c.name}
                    onChange={(e) => handleUpdateCert(c.id, { name: e.target.value })}
                    className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-surface-900 border border-surface-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Issuer (e.g. AWS)"
                    value={c.issuer}
                    onChange={(e) => handleUpdateCert(c.id, { issuer: e.target.value })}
                    className="w-36 px-3 py-1.5 text-xs bg-white dark:bg-surface-900 border border-surface-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Date"
                    value={c.date}
                    onChange={(e) => handleUpdateCert(c.id, { date: e.target.value })}
                    className="w-20 px-3 py-1.5 text-xs bg-white dark:bg-surface-900 border border-surface-200 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCert(c.id)}
                    className="p-1 text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="url"
                  placeholder="Verification URL (optional)"
                  value={c.url || ""}
                  onChange={(e) => handleUpdateCert(c.id, { url: e.target.value })}
                  className="w-full px-3 py-1 text-xs bg-white dark:bg-surface-900 border border-surface-200 rounded-lg"
                />
              </div>
            ))}
          </div>

          {/* 2. Languages */}
          <div className="space-y-3 pt-3 border-t border-surface-100 dark:border-surface-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-surface-800 dark:text-surface-200">
                Languages ({data.languages?.length || 0})
              </span>
              <button
                type="button"
                onClick={handleAddLanguage}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-100 hover:bg-surface-200 text-surface-800"
              >
                <Plus className="w-3 h-3" />
                <span>Add Language</span>
              </button>
            </div>
            {data.languages?.map((l) => (
              <div key={l.id} className="flex items-center gap-2 p-2 bg-surface-50 dark:bg-surface-800 rounded-xl border border-surface-200">
                <input
                  type="text"
                  placeholder="Language (e.g. English)"
                  value={l.language}
                  onChange={(e) => handleUpdateLanguage(l.id, { language: e.target.value })}
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-surface-900 border border-surface-200 rounded-lg"
                />
                <select
                  value={l.proficiency}
                  onChange={(e) => handleUpdateLanguage(l.id, { proficiency: e.target.value })}
                  className="w-36 px-2.5 py-1.5 text-xs bg-white dark:bg-surface-900 border border-surface-200 rounded-lg"
                >
                  <option value="Native">Native</option>
                  <option value="Fluent">Fluent</option>
                  <option value="Professional Working">Professional Working</option>
                  <option value="Conversational">Conversational</option>
                  <option value="Elementary">Elementary</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(l.id)}
                  className="p-1 text-rose-500 hover:text-rose-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* 3. Awards */}
          <div className="space-y-3 pt-3 border-t border-surface-100 dark:border-surface-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-surface-800 dark:text-surface-200">
                Awards ({data.awards?.length || 0})
              </span>
              <button
                type="button"
                onClick={handleAddAward}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-100 hover:bg-surface-200 text-surface-800"
              >
                <Plus className="w-3 h-3" />
                <span>Add Award</span>
              </button>
            </div>
            {data.awards?.map((a) => (
              <div key={a.id} className="space-y-2 p-3 bg-surface-50 dark:bg-surface-800 rounded-xl border border-surface-200">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Award Title"
                    value={a.title}
                    onChange={(e) => handleUpdateAward(a.id, { title: e.target.value })}
                    className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-surface-900 border border-surface-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Issuer"
                    value={a.issuer}
                    onChange={(e) => handleUpdateAward(a.id, { issuer: e.target.value })}
                    className="w-36 px-3 py-1.5 text-xs bg-white dark:bg-surface-900 border border-surface-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Year"
                    value={a.date}
                    onChange={(e) => handleUpdateAward(a.id, { date: e.target.value })}
                    className="w-20 px-3 py-1.5 text-xs bg-white dark:bg-surface-900 border border-surface-200 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAward(a.id)}
                    className="p-1 text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Summary or details"
                  value={a.summary || ""}
                  onChange={(e) => handleUpdateAward(a.id, { summary: e.target.value })}
                  className="w-full px-3 py-1 text-xs bg-white dark:bg-surface-900 border border-surface-200 rounded-lg"
                />
              </div>
            ))}
          </div>

          {/* 4. Achievements */}
          <div className="space-y-3 pt-3 border-t border-surface-100 dark:border-surface-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-surface-800 dark:text-surface-200">
                Achievements ({data.achievements?.length || 0})
              </span>
              <button
                type="button"
                onClick={handleAddAchievement}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-100 hover:bg-surface-200 text-surface-800"
              >
                <Plus className="w-3 h-3" />
                <span>Add Achievement</span>
              </button>
            </div>
            {data.achievements?.map((ach) => (
              <div key={ach.id} className="space-y-2 p-3 bg-surface-50 dark:bg-surface-800 rounded-xl border border-surface-200">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Achievement Title"
                    value={ach.title}
                    onChange={(e) => handleUpdateAchievement(ach.id, { title: e.target.value })}
                    className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-surface-900 border border-surface-200 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAchievement(ach.id)}
                    className="p-1 text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  rows={2}
                  placeholder="Description..."
                  value={ach.description}
                  onChange={(e) => handleUpdateAchievement(ach.id, { description: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-surface-900 border border-surface-200 rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photo Crop and Adjustment Modal */}
      <PhotoCropModal
        isOpen={cropModalOpen}
        imageSrc={cropModalImage}
        initialShape={data.personalInfo.photoShape || "rectangle"}
        initialSize={data.personalInfo.photoSize || "standard"}
        onClose={() => setCropModalOpen(false)}
        onSave={handleSaveCroppedPhoto}
      />
    </div>
  );
};
