"use client";

import React, { useState } from "react";
import {
  Printer,
  ChevronDown,
  Sparkles,
  Download,
  FileText,
  FileImage,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type {
  RawDocumentPage,
  DocumentEnhancementSettings,
  ColorFilterSettings,
} from "@/types/raw-image-to-pdf";
import {
  compileRawImagesToCleanPdf,
  exportSinglePageImage,
  downloadExportBlob,
} from "@/lib/raw-image-to-pdf/pdf-compiler";

export interface RawImagePrintStudioProps {
  pages: RawDocumentPage[];
  activePageIndex: number;
  globalEnhancements: DocumentEnhancementSettings;
  globalColorFilter?: ColorFilterSettings;
  disabled?: boolean;
  className?: string;
}

export const RawImagePrintStudio: React.FC<RawImagePrintStudioProps> = ({
  pages,
  activePageIndex,
  globalEnhancements,
  globalColorFilter,
  disabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  // Export Format & Quality State
  const [exportFormat, setExportFormat] = useState<"pdf" | "png">("pdf");
  const [exportDpi, setExportDpi] = useState<300 | 600>(600); // 600 DPI default recommended

  // Execution States
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);

  // Progress Feedback
  const [progress, setProgress] = useState<{
    currentPage: number;
    totalPages: number;
    percentage: number;
    statusText: string;
  } | null>(null);

  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const totalPages = pages.length;
  const isBusy = isPrinting || isGeneratingPdf || isGeneratingPng || disabled;

  // Handle Download Print-Ready PDF
  const handleDownloadPdf = async () => {
    if (pages.length === 0 || isBusy) return;

    setIsGeneratingPdf(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    try {
      const result = await compileRawImagesToCleanPdf({
        pages,
        globalEnhancements,
        globalColorFilter,
        quality: exportDpi === 600 ? 0.98 : 0.92,
        onProgress: (p) => setProgress(p),
      });

      downloadExportBlob(result.blob, result.fileName);

      const sizeFormatted =
        result.sizeBytes > 1024 * 1024
          ? `${(result.sizeBytes / (1024 * 1024)).toFixed(2)} MB`
          : `${(result.sizeBytes / 1024).toFixed(1)} KB`;

      setSuccessNotice(
        `Print-ready PDF downloaded: ${result.fileName} (${sizeFormatted}, ${result.pageCount} ${
          result.pageCount === 1 ? "page" : "pages"
        }).`
      );
    } catch (err: any) {
      setErrorNotice(err?.message || "Failed to generate print-ready PDF.");
    } finally {
      setIsGeneratingPdf(false);
      setProgress(null);
    }
  };

  // Handle Download Single-Page PNG
  const handleDownloadPng = async () => {
    if (pages.length === 0 || isBusy) return;

    setIsGeneratingPng(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    try {
      const targetPage = pages[activePageIndex] || pages[0];
      const result = await exportSinglePageImage(
        targetPage,
        globalEnhancements,
        globalColorFilter,
        "image/png",
        1.0
      );

      downloadExportBlob(result.blob, result.fileName);

      const sizeFormatted = `${(result.sizeBytes / 1024).toFixed(1)} KB`;
      setSuccessNotice(
        `High-resolution PNG downloaded: ${result.fileName} (${sizeFormatted}, ${result.width} × ${result.height} px).`
      );
    } catch (err: any) {
      setErrorNotice(err?.message || "Failed to generate PNG image.");
    } finally {
      setIsGeneratingPng(false);
    }
  };

  // Handle Print via Browser
  const handlePrint = async () => {
    if (pages.length === 0 || isBusy) return;

    setIsPrinting(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    try {
      const result = await compileRawImagesToCleanPdf({
        pages,
        globalEnhancements,
        globalColorFilter,
        quality: exportDpi === 600 ? 0.98 : 0.92,
        onProgress: (p) => setProgress(p),
      });

      const blobUrl = URL.createObjectURL(result.blob);
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.src = blobUrl;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          window.open(blobUrl, "_blank");
        }
        setTimeout(() => {
          try {
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
          } catch {}
          URL.revokeObjectURL(blobUrl);
        }, 60000);
      };

      setSuccessNotice(
        `Print dialog launched for ${result.pageCount} ${
          result.pageCount === 1 ? "page" : "pages"
        }.`
      );
    } catch (err: any) {
      setErrorNotice(err?.message || "Failed to prepare document for printing.");
    } finally {
      setIsPrinting(false);
      setProgress(null);
    }
  };

  return (
    <section
      id="print-studio-section"
      data-testid="print-studio-section"
      className={cn(
        "bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-xs transition-all overflow-hidden",
        className
      )}
      aria-label="Raw Image to Clean PDF Print & Export Studio"
    >
      {/* 1. Header Bar with Expand/Collapse */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between cursor-pointer select-none bg-surface-50/70 dark:bg-surface-850 hover:bg-surface-100/70 dark:hover:bg-surface-800/80 transition-colors gap-3"
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/80 dark:border-blue-800/80 shrink-0">
            <Printer className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-surface-900 dark:text-surface-100 tracking-tight">
                Print & Export Studio
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50 uppercase tracking-wider">
                A4 Vector PDF Ready
              </span>
            </div>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
              Compile all edited pages into one print-ready vector-calibrated A4 PDF document
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Settings Summary Badge in Header */}
          <span className="hidden sm:inline-flex text-[11px] font-bold px-2.5 py-1 rounded-lg bg-surface-200/70 dark:bg-surface-800 text-surface-700 dark:text-surface-300 border border-surface-300/60 dark:border-surface-700">
            A4 • {totalPages} {totalPages === 1 ? "Page" : "Pages"} •{" "}
            {exportFormat === "pdf" ? "Multi-Page PDF" : "Lossless PNG"}
          </span>

          <button
            type="button"
            className="p-1 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
            aria-label={isOpen ? "Collapse Print Studio" : "Expand Print Studio"}
          >
            <ChevronDown
              className={cn("w-4 h-4 transition-transform duration-200", isOpen && "rotate-180")}
            />
          </button>
        </div>
      </div>

      {/* 2. Collapsible Body */}
      {isOpen && (
        <div className="p-4 sm:p-5 space-y-4 border-t border-surface-200/80 dark:border-surface-800">
          {/* Action Bar (Print Document, Download PDF, Download PNG) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200/80 dark:border-blue-900/60 shadow-2xs">
            <div>
              <h4 className="text-sm font-extrabold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Print & Export Studio</span>
              </h4>
              <p className="text-xs text-surface-600 dark:text-surface-400 mt-0.5">
                Output physical prints via browser dialog or download vector-sized print-ready PDFs
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Print Document via Browser Print */}
              <button
                type="button"
                onClick={handlePrint}
                disabled={isBusy}
                data-testid="print-document-button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-800 dark:text-surface-200 border border-surface-200 dark:border-surface-700 shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
                title="Print document directly using browser print dialog"
              >
                <Printer className="w-3.5 h-3.5 text-surface-600 dark:text-surface-400" />
                <span>{isPrinting ? "Preparing Print..." : "Print Document"}</span>
              </button>

              {/* Download Primary Action (PDF or PNG) */}
              {exportFormat === "pdf" ? (
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isBusy}
                  data-testid="download-pdf-button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  title="Download combined vector-calibrated A4 PDF"
                >
                  {isGeneratingPdf ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isGeneratingPdf
                      ? "Compiling PDF..."
                      : `Download Combined PDF (${totalPages}p)`}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={isBusy}
                  data-testid="download-png-button"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  title="Download active page as lossless PNG"
                >
                  {isGeneratingPng ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>{isGeneratingPng ? "Generating PNG..." : `Download Page ${activePageIndex + 1} PNG`}</span>
                </button>
              )}
            </div>
          </div>

          {/* Download Format & Resolution Selection Area */}
          <div
            data-testid="download-format-selection-area"
            className="p-4 rounded-xl bg-surface-50/80 dark:bg-surface-850 border border-surface-200/90 dark:border-surface-800 text-xs shadow-2xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-surface-900 dark:text-surface-100 text-sm">
                      Export Format & Quality
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      High-Resolution Export
                    </span>
                  </div>
                  <p className="text-[11px] text-surface-600 dark:text-surface-400 mt-0.5">
                    Recommended for high-quality document downloads. Choose 600 DPI for the best available detail.
                  </p>
                </div>
              </div>

              {/* Format Switcher (PDF vs PNG) */}
              <div className="inline-flex items-center gap-1 p-1 bg-surface-200/70 dark:bg-surface-800 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setExportFormat("pdf")}
                  data-testid="format-select-pdf"
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
                    exportFormat === "pdf"
                      ? "bg-white dark:bg-surface-900 text-blue-700 dark:text-blue-300 shadow-2xs font-extrabold ring-1 ring-blue-500/20"
                      : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100"
                  )}
                  title="PDF Document: Print-ready vector calibrated document"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF Document</span>
                  <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    Rec
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat("png")}
                  data-testid="format-select-png"
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer",
                    exportFormat === "png"
                      ? "bg-white dark:bg-surface-900 text-blue-700 dark:text-blue-300 shadow-2xs font-extrabold ring-1 ring-blue-500/20"
                      : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100"
                  )}
                  title="Lossless PNG: Recommended for high-quality image downloads"
                >
                  <FileImage className="w-3.5 h-3.5" />
                  <span>PNG Image</span>
                </button>
              </div>
            </div>

            {/* Resolution Selector & Dimension Details */}
            <div className="pt-2.5 border-t border-surface-200/70 dark:border-surface-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-surface-700 dark:text-surface-300">
                  Export Resolution:
                </span>
                <div className="inline-flex items-center gap-1 p-0.5 bg-surface-200/60 dark:bg-surface-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setExportDpi(600)}
                    data-testid="dpi-select-600"
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer",
                      exportDpi === 600
                        ? "bg-white dark:bg-surface-900 text-blue-700 dark:text-blue-300 shadow-2xs font-bold ring-1 ring-blue-500/20"
                        : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100"
                    )}
                    title="600 DPI — High quality (recommended for sharp text and clean document lines)"
                  >
                    600 DPI (High Quality - Recommended)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportDpi(300)}
                    data-testid="dpi-select-300"
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer",
                      exportDpi === 300
                        ? "bg-white dark:bg-surface-900 text-blue-700 dark:text-blue-300 shadow-2xs font-bold"
                        : "text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100"
                    )}
                    title="300 DPI — Standard print quality"
                  >
                    300 DPI (Standard)
                  </button>
                </div>
              </div>

              {/* Pixel / Page Dimension Info Pill */}
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-surface-500 dark:text-surface-400">
                <span className="font-semibold text-surface-700 dark:text-surface-300">
                  A4:
                </span>
                <span>595 × 842 pt</span>
                <span className="text-[10px] uppercase font-sans text-surface-400">
                  • {totalPages} {totalPages === 1 ? "page" : "pages"} ({exportFormat.toUpperCase()})
                </span>
              </div>
            </div>
          </div>

          {/* Real-time PDF Compilation Progress Bar */}
          {progress && (
            <div
              data-testid="export-progress-bar"
              className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-2 animate-in fade-in"
            >
              <div className="flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
                <span className="font-semibold flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                  {progress.statusText}
                </span>
                <span className="font-mono font-bold">{progress.percentage}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-blue-200/70 dark:bg-blue-900/50 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Feedback Banner */}
          {errorNotice && (
            <div
              data-testid="print-error-banner"
              className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{errorNotice}</div>
              <button
                type="button"
                onClick={() => setErrorNotice(null)}
                className="text-xs font-bold hover:underline shrink-0 text-rose-700 dark:text-rose-300 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Success Feedback Banner */}
          {successNotice && (
            <div
              data-testid="print-success-banner"
              className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{successNotice}</div>
              <button
                type="button"
                onClick={() => setSuccessNotice(null)}
                className="text-xs font-bold hover:underline shrink-0 text-emerald-700 dark:text-emerald-300 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
