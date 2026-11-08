"use client";

import React, { useState, useRef } from "react";
import { ResumeData } from "@/types/resume";
import { ModernProfessionalTemplate } from "./templates/ModernProfessionalTemplate";
import { MinimalAtsTemplate } from "./templates/MinimalAtsTemplate";
import { ClassicCorporateTemplate } from "./templates/ClassicCorporateTemplate";
import { generateResumePdf, downloadPdfBuffer } from "@/lib/resume/resume-pdf";
import {
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export interface ResumePreviewProps {
  data: ResumeData;
  onNotify?: (message: { type: "info" | "success" | "warning" | "error"; title: string; message?: string }) => void;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ data, onNotify }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 10, 150));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 10, 60));
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      const pdfBytes = await generateResumePdf(data);
      const fileName = data.personalInfo.fullName
        ? `${data.personalInfo.fullName.trim().replace(/\s+/g, "_")}_Resume.pdf`
        : "Resume.pdf";

      downloadPdfBuffer(pdfBytes, fileName);

      onNotify?.({
        type: "success",
        title: "Vector PDF Generated",
        message: `High-resolution vector PDF "${fileName}" (${(pdfBytes.length / 1024).toFixed(1)} KB) compiled in browser memory.`,
      });
    } catch (err) {
      console.error("Failed to generate vector resume PDF:", err);
      onNotify?.({
        type: "error",
        title: "PDF Generation Failed",
        message: "An error occurred while compiling your resume vector PDF.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  // Select active template
  const renderTemplate = () => {
    switch (data.templateId) {
      case "minimal-ats":
        return <MinimalAtsTemplate data={data} />;
      case "classic-corporate":
        return <ClassicCorporateTemplate data={data} />;
      case "modern-professional":
      default:
        return <ModernProfessionalTemplate data={data} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-100/70 dark:bg-surface-900/60 rounded-2xl border border-surface-200 dark:border-surface-800 p-4 sm:p-5 overflow-hidden">
      {/* Top Preview Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-surface-200/80 dark:border-surface-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-surface-900 dark:text-surface-100 flex items-center gap-1.5">
              <span>Live Resume Preview</span>
              <span className="text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                A4 Vector
              </span>
            </h3>
            <p className="text-[11px] text-surface-500">
              Updates in real-time as you type
            </p>
          </div>
        </div>

        {/* Action Buttons: Zoom & Export */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="inline-flex items-center bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-0.5 shadow-subtle text-xs">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-surface-600 hover:text-surface-900 hover:bg-surface-100 dark:text-surface-400 dark:hover:text-surface-100 dark:hover:bg-surface-700 transition-colors"
              title="Zoom out"
              aria-label="Zoom out preview"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono text-surface-600 dark:text-surface-400 min-w-[42px] text-center">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-surface-600 hover:text-surface-900 hover:bg-surface-100 dark:text-surface-400 dark:hover:text-surface-100 dark:hover:bg-surface-700 transition-colors"
              title="Zoom in"
              aria-label="Zoom in preview"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomReset}
              className="p-1.5 rounded-lg text-surface-600 hover:text-surface-900 hover:bg-surface-100 dark:text-surface-400 dark:hover:text-surface-100 dark:hover:bg-surface-700 transition-colors border-l border-surface-200 dark:border-surface-700"
              title="Reset Zoom to 100%"
              aria-label="Reset zoom"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>

          {/* Browser Print Button */}
          <button
            type="button"
            onClick={handleBrowserPrint}
            className="p-2 rounded-xl bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:text-surface-900 hover:bg-surface-50 border border-surface-200 dark:border-surface-700 shadow-subtle text-xs transition-colors"
            title="Print via browser dialog"
            aria-label="Browser print"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Download Vector PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 transition-all shadow-sm hover:shadow disabled:opacity-60"
            title="Download true vector PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? "Compiling..." : "Download PDF"}</span>
          </button>
        </div>
      </div>

      {/* Scrollable Stage Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex justify-center items-start p-2 sm:p-4 bg-surface-200/50 dark:bg-surface-950/40 rounded-xl"
      >
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "top center",
            transition: "transform 0.15s ease-out",
          }}
          className="w-full max-w-[794px] shrink-0"
        >
          {/* A4 Sheet Frame (Shadow & Pure White Surface) */}
          <div className="bg-white rounded-md shadow-float border border-surface-300/80 min-h-[1123px] overflow-hidden my-2">
            {renderTemplate()}
          </div>
        </div>
      </div>

      {/* Stage Bottom Quality Guarantee */}
      <div className="mt-3 pt-3 border-t border-surface-200/80 dark:border-surface-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-surface-500">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>True Vector Text: Crisp at any zoom, 100% ATS searchable</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <ShieldCheck className="w-3 h-3 text-brand-600" />
          <span>Zero-Upload Guarantee</span>
        </div>
      </div>
    </div>
  );
};
