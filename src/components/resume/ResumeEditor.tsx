"use client";

import React, { useState, useRef } from "react";
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
} from "@/types/resume";
import { RESUME_TEMPLATES, SAMPLE_RESUME_DATA, EMPTY_RESUME_DATA } from "@/constants/resume-defaults";
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

export const ResumeEditor: React.FC<ResumeEditorProps> = ({
  data,
  onChange,
  onReset,
  onLoadSample,
  onExportJson,
  onImportJson,
}) => {
  const [activeSection, setActiveSection] = useState<EditorSection>("personal");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper for updating nested personal info
  const handlePersonalChange = (field: keyof ResumeData["personalInfo"], value: string) => {
    onChange({
      ...data,
      personalInfo: {
        ...data.personalInfo,
        [field]: value,
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
    <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 sm:p-7 shadow-card space-y-6">
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

        {/* Template Choice Tabs */}
        <div>
          <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-2">
            Select Resume Template:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {RESUME_TEMPLATES.map((tmpl) => {
              const isSelected = data.templateId === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleTemplateChange(tmpl.id)}
                  className={`text-left p-3 rounded-xl border text-xs transition-all relative ${
                    isSelected
                      ? "border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 shadow-sm"
                      : "border-surface-200 dark:border-surface-700 hover:border-surface-300 bg-surface-50 dark:bg-surface-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-surface-900 dark:text-surface-100">
                      {tmpl.name}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-600" />}
                  </div>
                  <p className="text-[11px] text-surface-500 line-clamp-2">
                    {tmpl.description}
                  </p>
                </button>
              );
            })}
          </div>
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
              {data.experiences.map((exp, index) => (
                <div
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
                        placeholder="e.g. Browser Utility Studio"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-surface-600 mb-1">
                        Project URL / Repository
                      </label>
                      <input
                        type="url"
                        value={proj.projectUrl || ""}
                        onChange={(e) => handleUpdateProject(proj.id, { projectUrl: e.target.value })}
                        placeholder="https://github.com/username/project"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-surface-600 mb-1">
                      Technologies Used
                    </label>
                    <input
                      type="text"
                      value={proj.technologies}
                      onChange={(e) => handleUpdateProject(proj.id, { technologies: e.target.value })}
                      placeholder="e.g. Next.js, TypeScript, WebAssembly, Tailwind CSS"
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
                      placeholder="Describe what you built, architecture choices, and key performance impact..."
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100"
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
                Certifications ({data.certifications?.length || 0})
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
              <div key={c.id} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Certification Name"
                  value={c.name}
                  onChange={(e) => handleUpdateCert(c.id, { name: e.target.value })}
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-surface-800 border border-surface-200 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Issuer (e.g. AWS)"
                  value={c.issuer}
                  onChange={(e) => handleUpdateCert(c.id, { issuer: e.target.value })}
                  className="w-36 px-3 py-1.5 text-xs bg-white dark:bg-surface-800 border border-surface-200 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Year"
                  value={c.date}
                  onChange={(e) => handleUpdateCert(c.id, { date: e.target.value })}
                  className="w-20 px-2 py-1.5 text-xs bg-white dark:bg-surface-800 border border-surface-200 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCert(c.id)}
                  className="p-1.5 text-rose-500 hover:text-rose-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
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
              <div key={l.id} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Language (e.g. English)"
                  value={l.language}
                  onChange={(e) => handleUpdateLanguage(l.id, { language: e.target.value })}
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-surface-800 border border-surface-200 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Proficiency (e.g. Native, Fluent)"
                  value={l.proficiency}
                  onChange={(e) => handleUpdateLanguage(l.id, { proficiency: e.target.value })}
                  className="w-40 px-3 py-1.5 text-xs bg-white dark:bg-surface-800 border border-surface-200 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(l.id)}
                  className="p-1.5 text-rose-500 hover:text-rose-700"
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
                    className="w-20 px-2 py-1.5 text-xs bg-white dark:bg-surface-900 border border-surface-200 rounded-lg"
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
    </div>
  );
};
