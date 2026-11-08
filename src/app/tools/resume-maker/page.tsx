"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { TOOLS } from "@/constants/tools";
import { ResumeData } from "@/types/resume";
import { SAMPLE_RESUME_DATA, EMPTY_RESUME_DATA } from "@/constants/resume-defaults";
import {
  loadSavedResume,
  saveResume,
  clearSavedResume,
  exportResumeAsJson,
  importResumeFromJson,
} from "@/lib/resume/resume-storage";
import { ResumeEditor } from "@/components/resume/ResumeEditor";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { NotificationBanner } from "@/components/common/NotificationBanner";
import { useNotification } from "@/hooks/useNotification";
import { Edit3, Eye } from "lucide-react";

export default function ResumeMakerPage() {
  const tool = TOOLS.find((t) => t.id === "resume-maker")!;
  const { notifications, notify, removeNotification } = useNotification();

  // Initialize resume state from localStorage, or sample data on first visit
  const [resumeData, setResumeData] = useState<ResumeData>(SAMPLE_RESUME_DATA);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Mobile view switcher: "edit" vs "preview"
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");

  // Load saved resume from browser storage on mount
  useEffect(() => {
    const saved = loadSavedResume();
    if (saved) {
      setResumeData(saved);
    }
    setIsHydrated(true);
  }, []);

  // Update resume state and persist to local storage
  const handleResumeChange = useCallback((updated: ResumeData) => {
    setResumeData(updated);
    saveResume(updated);
  }, []);

  // Reset to blank resume
  const handleReset = useCallback(() => {
    const confirmed = window.confirm(
      "Are you sure you want to reset your resume? All entered information will be cleared."
    );
    if (!confirmed) return;

    clearSavedResume();
    setResumeData({ ...EMPTY_RESUME_DATA });
    notify({
      type: "info",
      title: "Resume Reset",
      message: "Resume cleared. You can start fresh or load sample data.",
    });
  }, [notify]);

  // Load sample resume data
  const handleLoadSample = useCallback(() => {
    setResumeData({ ...SAMPLE_RESUME_DATA });
    saveResume(SAMPLE_RESUME_DATA);
    notify({
      type: "success",
      title: "Sample Resume Loaded",
      message: "Pre-filled with professional engineering experience, education, and skills.",
    });
  }, [notify]);

  // Export JSON backup
  const handleExportJson = useCallback(() => {
    try {
      const jsonStr = exportResumeAsJson(resumeData);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const name = resumeData.personalInfo.fullName
        ? `${resumeData.personalInfo.fullName.trim().replace(/\s+/g, "_")}_Resume.json`
        : "resume-data.json";
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      notify({
        type: "success",
        title: "JSON Backup Exported",
        message: `Saved local backup file "${name}".`,
      });
    } catch (err) {
      console.error("JSON export error:", err);
      notify({
        type: "error",
        title: "Export Failed",
        message: "Failed to export JSON backup file.",
      });
    }
  }, [resumeData, notify]);

  // Import JSON backup
  const handleImportJson = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const imported = importResumeFromJson(content);
          setResumeData(imported);
          saveResume(imported);
          notify({
            type: "success",
            title: "Resume Imported",
            message: `Successfully loaded resume for "${imported.personalInfo.fullName || "User"}".`,
          });
        } catch (err) {
          console.error("JSON import error:", err);
          notify({
            type: "error",
            title: "Import Error",
            message: "The uploaded file is not a valid resume JSON document.",
          });
        }
      };
      reader.readAsText(file);
    },
    [notify]
  );

  return (
    <ModuleLayout tool={tool}>
      <NotificationBanner notifications={notifications} onDismiss={removeNotification} />

      {/* Mobile Tab Switcher (< lg screens) */}
      <div className="lg:hidden flex items-center justify-center p-1 bg-surface-200/80 dark:bg-surface-800 rounded-xl mb-6 max-w-sm mx-auto">
        <button
          type="button"
          onClick={() => setMobileTab("edit")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === "edit"
              ? "bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 shadow-sm"
              : "text-surface-600 dark:text-surface-400 hover:text-surface-900"
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Details</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === "preview"
              ? "bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 shadow-sm"
              : "text-surface-600 dark:text-surface-400 hover:text-surface-900"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Live Preview</span>
        </button>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Panel: Resume Editor Form (Desktop: 6 cols, Mobile: controlled by mobileTab) */}
        <div
          className={`lg:col-span-6 space-y-6 ${
            mobileTab === "edit" ? "block" : "hidden lg:block"
          }`}
        >
          {isHydrated && (
            <ResumeEditor
              data={resumeData}
              onChange={handleResumeChange}
              onReset={handleReset}
              onLoadSample={handleLoadSample}
              onExportJson={handleExportJson}
              onImportJson={handleImportJson}
            />
          )}
        </div>

        {/* Right Panel: Live Resume Preview (Desktop: 6 cols, Mobile: controlled by mobileTab) */}
        <div
          className={`lg:col-span-6 sticky top-20 ${
            mobileTab === "preview" ? "block" : "hidden lg:block"
          }`}
        >
          {isHydrated && (
            <ResumePreview
              data={resumeData}
              onNotify={(msg) => notify(msg)}
            />
          )}
        </div>
      </div>
    </ModuleLayout>
  );
}
