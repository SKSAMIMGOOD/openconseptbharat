"use client";

import React, { useState, useRef } from "react";
import { ResumeData } from "@/types/resume";
import { ModernProfessionalTemplate } from "./templates/ModernProfessionalTemplate";
import { MinimalAtsTemplate } from "./templates/MinimalAtsTemplate";
import { ClassicCorporateTemplate } from "./templates/ClassicCorporateTemplate";
import { ModernTwoColumnTemplate } from "./templates/ModernTwoColumnTemplate";
import { ExecutiveTemplate } from "./templates/ExecutiveTemplate";
import { CreativeTemplate } from "./templates/CreativeTemplate";
import { StudentFresherTemplate } from "./templates/StudentFresherTemplate";
import { ElegantMinimalTemplate } from "./templates/ElegantMinimalTemplate";
import { generateResumePdf, downloadPdfBuffer } from "@/lib/resume/resume-pdf";
import { DEFAULT_TYPOGRAPHY, getTemplateDefaultColors } from "@/constants/resume-defaults";

function getFontFamilyCss(fontFamily?: string): string {
  switch (fontFamily) {
    case "Roboto":
      return "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    case "Arial":
      return "Arial, Helvetica, sans-serif";
    case "Lato":
      return "'Lato', -apple-system, BlinkMacSystemFont, sans-serif";
    case "Open Sans":
      return "'Open Sans', -apple-system, BlinkMacSystemFont, sans-serif";
    case "Georgia":
      return "Georgia, 'Times New Roman', serif";
    case "Merriweather":
      return "'Merriweather', Georgia, 'Times New Roman', serif";
    case "Poppins":
      return "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif";
    case "Inter":
    default:
      return "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  }
}
import {
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Loader2,
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
    if (isExporting) return;
    try {
      setIsExporting(true);
      const pdfBytes = await generateResumePdf(data);
      const fileName = data.personalInfo.fullName
        ? `${data.personalInfo.fullName.trim().replace(/\s+/g, "_")}_Resume.pdf`
        : "Resume.pdf";

      downloadPdfBuffer(pdfBytes, fileName);

      onNotify?.({
        type: "success",
        title: "Download Complete",
        message: "PDF downloaded successfully.",
      });
    } catch (err) {
      console.error("Failed to generate vector resume PDF:", err);
      onNotify?.({
        type: "error",
        title: "Generation Error",
        message: "Failed to generate PDF.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Select active template
  const renderTemplate = () => {
    switch (data.templateId) {
      case "minimal-ats":
        return <MinimalAtsTemplate data={data} />;
      case "classic-corporate":
        return <ClassicCorporateTemplate data={data} />;
      case "modern-two-column":
        return <ModernTwoColumnTemplate data={data} />;
      case "executive":
        return <ExecutiveTemplate data={data} />;
      case "creative":
        return <CreativeTemplate data={data} />;
      case "student-fresher":
        return <StudentFresherTemplate data={data} />;
      case "elegant-minimal":
        return <ElegantMinimalTemplate data={data} />;
      case "modern-professional":
      default:
        return <ModernProfessionalTemplate data={data} />;
    }
  };

  const colors = data.colors || getTemplateDefaultColors(data.templateId);

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

        {/* Action Buttons: Zoom & Single Primary Download PDF Action */}
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

          {/* Single Prominent Action: Download PDF */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 transition-all shadow-sm hover:shadow disabled:opacity-60 disabled:cursor-not-allowed"
            title="Download vector resume PDF"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </>
            )}
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
          <div
            className="resume-typography-root resume-color-root bg-white rounded-md shadow-float border border-surface-300/80 min-h-[1123px] overflow-hidden my-2 select-text"
            style={{
              fontFamily: getFontFamilyCss(data.typography?.fontFamily),
              lineHeight: data.typography?.lineSpacing || DEFAULT_TYPOGRAPHY.lineSpacing,
            }}
          >
            <style
              dangerouslySetInnerHTML={{
                __html: `
                  .resume-typography-root,
                  .resume-typography-root * {
                    font-family: ${getFontFamilyCss(data.typography?.fontFamily)} !important;
                  }
                  .resume-typography-root header h1 {
                    font-size: ${data.typography?.nameSize || DEFAULT_TYPOGRAPHY.nameSize}px !important;
                    line-height: 1.15 !important;
                  }
                  .resume-typography-root header p {
                    font-size: ${data.typography?.titleSize || DEFAULT_TYPOGRAPHY.titleSize}px !important;
                  }
                  .resume-typography-root header a,
                  .resume-typography-root header span {
                    font-size: ${data.typography?.contactSize || DEFAULT_TYPOGRAPHY.contactSize}px !important;
                  }
                  .resume-typography-root h2 {
                    font-size: ${data.typography?.headingSize || DEFAULT_TYPOGRAPHY.headingSize}px !important;
                  }
                  .resume-typography-root p,
                  .resume-typography-root li,
                  .resume-typography-root section span {
                    font-size: ${data.typography?.bodySize || DEFAULT_TYPOGRAPHY.bodySize}px;
                    line-height: ${data.typography?.lineSpacing || DEFAULT_TYPOGRAPHY.lineSpacing};
                  }
                  .resume-typography-root section {
                    margin-bottom: ${data.typography?.sectionSpacing || DEFAULT_TYPOGRAPHY.sectionSpacing}px !important;
                  }
                  .resume-typography-root p + p,
                  .resume-typography-root ul {
                    margin-top: ${data.typography?.paragraphSpacing || DEFAULT_TYPOGRAPHY.paragraphSpacing}px;
                  }

                  /* ============================================================ */
                  /* Dynamic Colour & Theme Styling                               */
                  /* ============================================================ */
                  .resume-color-root header h1 {
                    color: ${colors.nameColor} !important;
                  }
                  .resume-color-root header p {
                    color: ${colors.titleColor} !important;
                  }
                  .resume-color-root h2,
                  .resume-color-root h2 span {
                    color: ${colors.headingColor} !important;
                  }
                  .resume-color-root p,
                  .resume-color-root li {
                    color: ${colors.bodyColor};
                  }
                  .resume-color-root .text-surface-500,
                  .resume-color-root .text-surface-600,
                  .resume-color-root .text-slate-500,
                  .resume-color-root .text-slate-600,
                  .resume-color-root .text-stone-500,
                  .resume-color-root .text-stone-600,
                  .resume-color-root .text-neutral-500,
                  .resume-color-root .text-neutral-600 {
                    color: ${colors.secondaryColor};
                  }
                  .resume-color-root hr,
                  .resume-color-root header {
                    border-color: ${colors.dividerColor} !important;
                  }
                  .resume-color-root h2 {
                    border-color: ${colors.dividerColor} !important;
                  }
                  .resume-color-root .border-brand-600,
                  .resume-color-root .border-brand-500,
                  .resume-color-root .border-slate-800,
                  .resume-color-root .border-slate-900,
                  .resume-color-root .border-violet-500,
                  .resume-color-root .border-teal-600,
                  .resume-color-root .border-stone-300,
                  .resume-color-root .border-neutral-900 {
                    border-color: ${colors.dividerColor} !important;
                  }
                  .resume-color-root svg.lucide {
                    color: ${colors.primaryAccent} !important;
                    stroke: ${colors.primaryAccent} !important;
                  }
                  .resume-color-root .text-brand-600,
                  .resume-color-root .text-brand-700,
                  .resume-color-root .text-violet-600,
                  .resume-color-root .text-violet-700,
                  .resume-color-root .text-teal-600,
                  .resume-color-root .text-teal-700 {
                    color: ${colors.primaryAccent} !important;
                  }
                  .resume-color-root .bg-violet-600,
                  .resume-color-root .bg-brand-600,
                  .resume-color-root .bg-teal-600 {
                    background-color: ${colors.primaryAccent} !important;
                  }
                `,
              }}
            />
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
