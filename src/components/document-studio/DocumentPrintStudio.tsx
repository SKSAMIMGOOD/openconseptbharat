"use client";

import React, { useState, useEffect } from "react";
import type {
  DocumentSideResult,
  DocumentTypeDefinition,
  PrintStudioMode,
  PrintStudioArrangement,
  DocumentPrintStudioState,
  PrintPaperSize,
  PaperDimensionUnit,
  PrintOrientation,
  PrintMarginPreset,
  PrintMargins,
  PrintAlignment,
  PrintScaleMode,
  DocumentPrintLayoutSettings,
  DocumentBorderSettings,
} from "@/types/document-studio";
import {
  DEFAULT_PRINT_LAYOUT_SETTINGS,
  createDefaultPrintLayoutSettings,
  DEFAULT_BORDER_SETTINGS,
} from "@/types/document-studio";
import {
  PRINT_STUDIO_MODES,
  PRINT_STUDIO_ARRANGEMENTS,
  PRINT_PAPER_SIZE_OPTIONS,
  PRINT_ORIENTATION_OPTIONS,
  PRINT_MARGIN_PRESET_OPTIONS,
  PRINT_ALIGNMENT_OPTIONS,
  PRINT_SCALE_OPTIONS,
  resolvePrintStudioLayout,
  sanitizeMarginValue,
  sanitizeScalePercentage,
  sanitizeCopies,
} from "@/lib/document/document-print-studio";
import {
  executeBrowserPrint,
  generatePrintReadyPdf,
  checkSourceResolutionAdequacy,
  downloadPdfBlob,
} from "@/lib/document/document-print-pdf";
import { PrintContainer } from "@/components/common/PrintContainer";
import { DocumentPrintPreviewModal } from "./DocumentPrintPreviewModal";
import { cn } from "@/lib/utils/cn";
import {
  Printer,
  ChevronDown,
  Layers,
  FileText,
  CreditCard,
  Rows,
  Columns,
  Sparkles,
  Info,
  AlertCircle,
  Plus,
  Minus,
  Maximize2,
  Sliders,
  Move,
  File,
  LayoutTemplate,
  Copy,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Square,
} from "lucide-react";

export interface DocumentPrintStudioProps {
  state: DocumentPrintStudioState;
  front: DocumentSideResult;
  back: DocumentSideResult;
  docDef: DocumentTypeDefinition;
  isSingleSided: boolean;
  isFrontActive: boolean;
  isBackActive: boolean;
  onModeChange: (mode: PrintStudioMode) => void;
  onArrangementChange: (arrangement: PrintStudioArrangement) => void;
  onLayoutChange?: (layout: Partial<DocumentPrintLayoutSettings>) => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  className?: string;
}

export const DocumentPrintStudio: React.FC<DocumentPrintStudioProps> = ({
  state,
  front,
  back,
  docDef,
  isSingleSided,
  isFrontActive,
  isBackActive,
  onModeChange,
  onArrangementChange,
  onLayoutChange,
  isOpen: controlledIsOpen,
  onToggleOpen: controlledToggleOpen,
  className,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const toggleOpen = controlledToggleOpen || (() => setInternalIsOpen((v) => !v));

  // Preview Mode: 'sheet' (Paper Layout View) vs 'cards' (Card Details View)
  const [previewView, setPreviewView] = useState<"sheet" | "cards">("sheet");

  // Phase 5 State: Printing, PDF Generation, Preview Modal, Feedback
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [printImageUrls, setPrintImageUrls] = useState<string[]>([]);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Local layout fallback ensuring immediate reactivity even without external state updater
  const [localLayout, setLocalLayout] = useState<DocumentPrintLayoutSettings>(
    () => state.layout || createDefaultPrintLayoutSettings()
  );

  useEffect(() => {
    if (state.layout) {
      setLocalLayout(state.layout);
    }
  }, [state.layout]);

  const activeLayout = state.layout || localLayout;

  const updateLayout = (updates: Partial<DocumentPrintLayoutSettings>) => {
    setLocalLayout((prev) => ({ ...prev, ...updates }));
    if (onLayoutChange) {
      onLayoutChange(updates);
    }
  };

  const mode = state.mode;
  const arrangement = state.arrangement;

  // Resolve layout, active images, dimensions, enhancements, and paper sheet coordinates
  const layoutResolution = resolvePrintStudioLayout({
    mode,
    arrangement,
    front,
    back,
    isSingleSided,
    layout: activeLayout,
  });

  const { paperLayout } = layoutResolution;

  // Resolution adequacy check for source images
  const firstPlacedItem = paperLayout.items[0];
  const firstPlacedSide = firstPlacedItem?.side === "back" ? back : front;
  const resolutionCheck = firstPlacedItem
    ? checkSourceResolutionAdequacy(firstPlacedItem, firstPlacedSide, front.printSettings?.dpi || 300)
    : undefined;

  // Border Settings (Feature 1)
  const activeBorder: DocumentBorderSettings =
    activeLayout.border || DEFAULT_BORDER_SETTINGS;

  const handleBorderChange = (updates: Partial<DocumentBorderSettings>) => {
    updateLayout({
      border: {
        ...activeBorder,
        ...updates,
      },
    });
  };

  // Handlers for Custom Paper
  const handleCustomPaperChange = (field: "width" | "height", valStr: string) => {
    const val = parseFloat(valStr);
    const safeVal = isNaN(val) ? 0 : val;
    updateLayout({
      customPaper: {
        ...activeLayout.customPaper,
        [field]: safeVal,
      },
    });
  };

  const handleCustomUnitChange = (unit: PaperDimensionUnit) => {
    if (unit === activeLayout.customPaper.unit) return;
    const currentW = activeLayout.customPaper.width;
    const currentH = activeLayout.customPaper.height;
    if (unit === "inch") {
      updateLayout({
        customPaper: {
          unit: "inch",
          width: Number((currentW / 25.4).toFixed(2)),
          height: Number((currentH / 25.4).toFixed(2)),
        },
      });
    } else {
      updateLayout({
        customPaper: {
          unit: "mm",
          width: Number((currentW * 25.4).toFixed(2)),
          height: Number((currentH * 25.4).toFixed(2)),
        },
      });
    }
  };

  // Handlers for Custom Margins
  const handleCustomMarginChange = (
    side: keyof PrintMargins,
    valStr: string
  ) => {
    const val = parseFloat(valStr);
    const safeVal = sanitizeMarginValue(val, 200);
    updateLayout({
      marginPreset: "custom",
      margins: {
        ...activeLayout.margins,
        [side]: safeVal,
      },
    });
  };

  // Handlers for Custom Position
  const handleCustomPositionChange = (axis: "xMm" | "yMm", valStr: string) => {
    const val = parseFloat(valStr);
    const safeVal = isNaN(val) ? 0 : val;
    updateLayout({
      alignment: "custom",
      customPosition: {
        ...activeLayout.customPosition,
        [axis]: safeVal,
      },
    });
  };

  // Handler for Copies
  const handleCopiesChange = (val: number) => {
    const safe = sanitizeCopies(val);
    updateLayout({ copies: safe });
  };

  // Phase 5 Action: Browser Native Print
  const handlePrintDocument = async () => {
    setIsPrinting(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    try {
      const result = await executeBrowserPrint({
        paperLayout,
        front,
        back,
        isSingleSided,
        dpi: front.printSettings?.dpi || 300,
      });

      if (!result.success) {
        setErrorNotice(result.error || "Failed to prepare document for printing.");
        setIsPrinting(false);
        return;
      }

      if (result.dataUrls && result.dataUrls.length > 0) {
        setPrintImageUrls(result.dataUrls);
      } else if (result.dataUrl) {
        setPrintImageUrls([result.dataUrl]);
      }

      // Allow DOM to update before invoking native print dialog
      setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 250);
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : "Print execution error.");
      setIsPrinting(false);
    }
  };

  // Phase 5 Action: Download Print-Ready PDF
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    try {
      const result = await generatePrintReadyPdf({
        paperLayout,
        front,
        back,
        isSingleSided,
        docDef,
        dpi: front.printSettings?.dpi || 300,
      });

      downloadPdfBlob(result.blob, result.fileName);
      setSuccessNotice(
        `Print-ready PDF downloaded: ${result.fileName} (${(result.sizeBytes / 1024).toFixed(1)} KB, ${result.pageCount} ${result.pageCount === 1 ? "page" : "pages"}).`
      );
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : "Failed to generate print-ready PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <section
      id="print-studio-section"
      className={cn(
        "bg-white dark:bg-surface-800/90 rounded-2xl border border-surface-200 dark:border-surface-700/80 shadow-subtle transition-all overflow-hidden",
        className
      )}
      aria-label="Document Studio Print Studio"
    >
      {/* 1. Header Bar with Expand/Collapse */}
      <div
        onClick={toggleOpen}
        className="w-full px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between cursor-pointer select-none bg-surface-50/70 dark:bg-surface-800/50 hover:bg-surface-100/70 dark:hover:bg-surface-700/50 transition-colors gap-3"
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleOpen();
          }
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 flex items-center justify-center shrink-0">
            <Printer className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-surface-900 dark:text-surface-100 tracking-tight">
                Print Studio
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50 uppercase tracking-wider">
                Phase 5 Ready
              </span>
            </div>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
              Physical printing and vector-calibrated print-ready PDF generation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Settings Summary Badge in Header */}
          <span className="hidden sm:inline-flex text-[11px] font-bold px-2.5 py-1 rounded-lg bg-surface-200/70 dark:bg-surface-700 text-surface-700 dark:text-surface-300 border border-surface-300/60 dark:border-surface-600">
            {activeLayout.paperSize.toUpperCase()} • {activeLayout.orientation === "portrait" ? "Portrait" : "Landscape"} • {activeLayout.scaleMode === "fit" ? "Fit to Page" : activeLayout.scaleMode === "custom" ? `${activeLayout.customScalePercentage}%` : "100%"}
          </span>

          <button
            type="button"
            className="p-1 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
            aria-label={isOpen ? "Collapse Print Studio" : "Expand Print Studio"}
          >
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </button>
        </div>
      </div>

      {/* 2. Collapsible Body */}
      {isOpen && (
        <div className="p-4 sm:p-6 space-y-6 border-t border-surface-200/80 dark:border-surface-700/80">
          {/* Action Bar (Print, Download PDF, Preview Modal) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-brand-50 to-indigo-50/60 dark:from-brand-950/40 dark:to-indigo-950/30 border border-brand-200/80 dark:border-brand-800/60 shadow-xs">
            <div>
              <h3 className="text-sm font-extrabold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                <Printer className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Print & Export Studio</span>
              </h3>
              <p className="text-xs text-surface-600 dark:text-surface-400 mt-0.5">
                Output physical prints via browser dialog or download vector-sized print-ready PDFs
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Print Preview Modal Trigger */}
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(true)}
                data-testid="open-print-preview-modal-button"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-800 dark:text-surface-200 border border-surface-200 dark:border-surface-700 shadow-2xs transition-all"
                title="Open high-fidelity print preview"
              >
                <Eye className="w-3.5 h-3.5 text-surface-600 dark:text-surface-400" />
                <span>Print Preview</span>
              </button>

              {/* Download Print-Ready PDF */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf || isPrinting}
                data-testid="download-pdf-button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-800 dark:text-surface-200 border border-surface-300 dark:border-surface-600 shadow-2xs transition-all disabled:opacity-50"
                title="Download local vector-calibrated PDF"
              >
                <Download className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>{isGeneratingPdf ? "Generating..." : "Download Print-Ready PDF"}</span>
              </button>

              {/* Print Document */}
              <button
                type="button"
                onClick={handlePrintDocument}
                disabled={isPrinting || isGeneratingPdf}
                data-testid="print-document-button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                title="Print via browser native print dialog"
              >
                <Printer className="w-4 h-4" />
                <span>{isPrinting ? "Preparing Print..." : "Print Document"}</span>
              </button>
            </div>
          </div>

          {/* Feedback Banners */}
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
                className="text-xs font-bold hover:underline shrink-0 text-rose-700 dark:text-rose-300"
              >
                Dismiss
              </button>
            </div>
          )}

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
                className="text-xs font-bold hover:underline shrink-0 text-emerald-700 dark:text-emerald-300"
              >
                Dismiss
              </button>
            </div>
          )}

          {resolutionCheck && !resolutionCheck.isAdequate && (
            <div
              data-testid="resolution-warning-banner"
              className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] leading-relaxed">
                <strong>Resolution Warning:</strong> {resolutionCheck.warning}
              </div>
            </div>
          )}

          {/* =========================================================================
              FEATURE 1: DOCUMENT BORDER CONFIGURATION SECTION
             ========================================================================= */}
          <div
            id="document-border-section"
            data-testid="document-border-section"
            className="p-4 sm:p-5 rounded-xl bg-surface-50/70 dark:bg-surface-800/40 border border-surface-200/80 dark:border-surface-700/60 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-surface-900 dark:text-surface-100 flex items-center gap-2 tracking-tight">
                  <Square className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>DOCUMENT BORDER</span>
                </h3>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                  Surround final cropped document with a crisp vector border (inside visible boundaries)
                </p>
              </div>

              {/* Border Toggle: Enable Border / Disable Border */}
              <div className="inline-flex items-center gap-1 p-1 bg-surface-200/70 dark:bg-surface-700 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => handleBorderChange({ enabled: true })}
                  data-testid="border-toggle-enable"
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs",
                    activeBorder.enabled
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-100"
                  )}
                >
                  Enable Border
                </button>
                <button
                  type="button"
                  onClick={() => handleBorderChange({ enabled: false })}
                  data-testid="border-toggle-disable"
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs",
                    !activeBorder.enabled
                      ? "bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 shadow-2xs font-bold"
                      : "text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-100"
                  )}
                >
                  Disable Border
                </button>
              </div>
            </div>

            {/* Controls only shown when border is enabled */}
            {activeBorder.enabled && (
              <div
                data-testid="border-controls-container"
                className="pt-3 border-t border-surface-200/60 dark:border-surface-700/50 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-150"
              >
                {/* 1. Border Color */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider block">
                    Border Color
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Black */}
                    <button
                      type="button"
                      onClick={() => handleBorderChange({ colorPreset: "black", color: "#000000" })}
                      data-testid="border-color-black"
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-2xs",
                        activeBorder.colorPreset === "black"
                          ? "bg-surface-900 text-white border-surface-900 ring-2 ring-brand-400/30"
                          : "bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-200 border-surface-200 dark:border-surface-600 hover:bg-surface-100"
                      )}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-black border border-white/30" />
                      <span>Black</span>
                    </button>

                    {/* Dark Gray */}
                    <button
                      type="button"
                      onClick={() => handleBorderChange({ colorPreset: "dark-gray", color: "#374151" })}
                      data-testid="border-color-dark-gray"
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-2xs",
                        activeBorder.colorPreset === "dark-gray"
                          ? "bg-surface-700 text-white border-surface-700 ring-2 ring-brand-400/30"
                          : "bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-200 border-surface-200 dark:border-surface-600 hover:bg-surface-100"
                      )}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-600 border border-white/30" />
                      <span>Dark Gray</span>
                    </button>

                    {/* Custom Color with Color Picker */}
                    <div
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shadow-2xs transition-all",
                        activeBorder.colorPreset === "custom"
                          ? "border-brand-500 ring-2 ring-brand-400/20 bg-white dark:bg-surface-700"
                          : "border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700"
                      )}
                    >
                      <input
                        type="color"
                        value={activeBorder.color}
                        onChange={(e) => handleBorderChange({ colorPreset: "custom", color: e.target.value })}
                        data-testid="border-color-picker"
                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                        title="Pick custom color"
                        aria-label="Custom color picker"
                      />
                      <span className="text-[11px] font-mono font-bold text-surface-800 dark:text-surface-200 uppercase">
                        {activeBorder.colorPreset === "custom" ? activeBorder.color : "Custom"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Border Thickness */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider block">
                      Border Thickness
                    </label>
                    <span className="text-[11px] font-mono font-bold text-brand-600 dark:text-brand-400">
                      {activeBorder.thicknessMm} mm
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleBorderChange({ thicknessPreset: "thin", thicknessMm: 0.3 })}
                      data-testid="border-thickness-thin"
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-2xs",
                        activeBorder.thicknessPreset === "thin" && activeBorder.thicknessMm === 0.3
                          ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                          : "bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-200 border-surface-200 dark:border-surface-600 hover:bg-surface-100"
                      )}
                      title="Thin: 0.3 mm"
                    >
                      Thin (0.3mm)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBorderChange({ thicknessPreset: "medium", thicknessMm: 0.5 })}
                      data-testid="border-thickness-medium"
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-2xs",
                        activeBorder.thicknessPreset === "medium" && activeBorder.thicknessMm === 0.5
                          ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                          : "bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-200 border-surface-200 dark:border-surface-600 hover:bg-surface-100"
                      )}
                      title="Medium: 0.5 mm"
                    >
                      Medium (0.5mm)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBorderChange({ thicknessPreset: "thick", thicknessMm: 1.0 })}
                      data-testid="border-thickness-thick"
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-2xs",
                        activeBorder.thicknessPreset === "thick" && activeBorder.thicknessMm === 1.0
                          ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                          : "bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-200 border-surface-200 dark:border-surface-600 hover:bg-surface-100"
                      )}
                      title="Thick: 1.0 mm"
                    >
                      Thick (1.0mm)
                    </button>

                    {/* Custom Thickness Input (0.1–3.0 mm) */}
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0.1"
                        max="3.0"
                        step="0.1"
                        value={activeBorder.thicknessMm}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          const safe = isNaN(val) ? 0.3 : Math.min(3.0, Math.max(0.1, val));
                          handleBorderChange({
                            thicknessPreset: "custom",
                            thicknessMm: Number(safe.toFixed(2)),
                          });
                        }}
                        data-testid="border-thickness-custom-input"
                        className="w-16 px-2 py-1 text-xs rounded-md border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 font-mono text-center focus:outline-none focus:ring-1 focus:ring-brand-500"
                        aria-label="Custom Border Thickness in mm"
                      />
                      <span className="text-[10px] font-semibold text-surface-500">mm</span>
                    </div>
                  </div>
                </div>

                {/* 3. Border Style */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider block">
                    Border Style
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(["solid", "dashed", "dotted"] as const).map((styleOpt) => {
                      const isStyleActive = activeBorder.style === styleOpt;
                      return (
                        <button
                          key={styleOpt}
                          type="button"
                          onClick={() => handleBorderChange({ style: styleOpt })}
                          data-testid={`border-style-${styleOpt}`}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-2xs capitalize",
                            isStyleActive
                              ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                              : "bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-200 border-surface-200 dark:border-surface-600 hover:bg-surface-100"
                          )}
                        >
                          {styleOpt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* =========================================================================
              CONTROLS SECTION
             ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ROW 1A: Print Mode & Combined Arrangement */}
            <div className="p-4 rounded-xl bg-surface-50/70 dark:bg-surface-800/40 border border-surface-200/80 dark:border-surface-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-600" />
                  <span>Print Mode & Arrangement</span>
                </label>
              </div>

              {/* Mode Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {PRINT_STUDIO_MODES.map((option) => {
                  const isActive = mode === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onModeChange(option.id)}
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                        isActive
                          ? "bg-brand-600 text-white shadow-sm ring-2 ring-brand-400/30"
                          : "bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-600 border border-surface-200 dark:border-surface-600"
                      )}
                      title={option.description}
                      data-testid={`print-mode-${option.id}`}
                    >
                      {option.id === "front-only" && <CreditCard className="w-3.5 h-3.5 shrink-0" />}
                      {option.id === "back-only" && <FileText className="w-3.5 h-3.5 shrink-0" />}
                      {option.id === "combined" && <Layers className="w-3.5 h-3.5 shrink-0" />}
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Combined Arrangement Toggle */}
              {mode === "combined" && (
                <div className="pt-2 border-t border-surface-200/60 dark:border-surface-700/50 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-surface-600 dark:text-surface-400">
                    Arrangement:
                  </span>
                  <div className="inline-flex items-center gap-1 p-1 bg-surface-200/70 dark:bg-surface-700 rounded-lg">
                    {PRINT_STUDIO_ARRANGEMENTS.map((arrOption) => {
                      const isArrActive = arrangement === arrOption.id;
                      const Icon = arrOption.id === "vertical" ? Rows : Columns;
                      return (
                        <button
                          key={arrOption.id}
                          type="button"
                          onClick={() => onArrangementChange(arrOption.id)}
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                            isArrActive
                              ? "bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 shadow-2xs font-bold"
                              : "text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-100"
                          )}
                          title={arrOption.description}
                          data-testid={`arrangement-${arrOption.id}`}
                        >
                          <Icon className="w-3 h-3 shrink-0" />
                          <span>{arrOption.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ROW 1B: Paper Size & Orientation */}
            <div className="p-4 rounded-xl bg-surface-50/70 dark:bg-surface-800/40 border border-surface-200/80 dark:border-surface-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider flex items-center gap-1.5">
                  <File className="w-3.5 h-3.5 text-brand-600" />
                  <span>Paper Size & Orientation</span>
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Paper Size selector */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {PRINT_PAPER_SIZE_OPTIONS.map((paperOpt) => {
                    const isSelected = activeLayout.paperSize === paperOpt.id;
                    return (
                      <button
                        key={paperOpt.id}
                        type="button"
                        onClick={() => updateLayout({ paperSize: paperOpt.id })}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs border focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                          isSelected
                            ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                            : "bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-200 border-surface-200 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-600"
                        )}
                        title={paperOpt.description}
                        data-testid={`paper-size-${paperOpt.id}`}
                      >
                        {paperOpt.shortLabel}
                      </button>
                    );
                  })}
                </div>

                {/* Orientation Selector */}
                <div className="inline-flex items-center gap-1 p-1 bg-surface-200/70 dark:bg-surface-700 rounded-lg">
                  {PRINT_ORIENTATION_OPTIONS.map((orientOpt) => {
                    const isOrientActive = activeLayout.orientation === orientOpt.id;
                    return (
                      <button
                        key={orientOpt.id}
                        type="button"
                        onClick={() => updateLayout({ orientation: orientOpt.id })}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                          isOrientActive
                            ? "bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 shadow-2xs font-bold"
                            : "text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-100"
                        )}
                        title={orientOpt.description}
                        data-testid={`orientation-${orientOpt.id}`}
                      >
                        {orientOpt.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Paper Size Inputs */}
              {activeLayout.paperSize === "custom" && (
                <div className="pt-2 border-t border-surface-200/60 dark:border-surface-700/50 grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-surface-500 dark:text-surface-400 block mb-1">
                      Width:
                    </label>
                    <input
                      type="number"
                      step={activeLayout.customPaper.unit === "inch" ? "0.1" : "1"}
                      min="1"
                      value={activeLayout.customPaper.width}
                      onChange={(e) => handleCustomPaperChange("width", e.target.value)}
                      data-testid="custom-paper-width"
                      className="w-full px-2 py-1 text-xs rounded-md border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-surface-500 dark:text-surface-400 block mb-1">
                      Height:
                    </label>
                    <input
                      type="number"
                      step={activeLayout.customPaper.unit === "inch" ? "0.1" : "1"}
                      min="1"
                      value={activeLayout.customPaper.height}
                      onChange={(e) => handleCustomPaperChange("height", e.target.value)}
                      data-testid="custom-paper-height"
                      className="w-full px-2 py-1 text-xs rounded-md border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-surface-500 dark:text-surface-400 block mb-1">
                      Unit:
                    </label>
                    <select
                      value={activeLayout.customPaper.unit}
                      onChange={(e) => handleCustomUnitChange(e.target.value as PaperDimensionUnit)}
                      data-testid="custom-paper-unit"
                      className="w-full px-2 py-1 text-xs rounded-md border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-1 focus:ring-brand-500 font-semibold"
                    >
                      <option value="mm">mm</option>
                      <option value="inch">inches</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Feature 2: Dedicated 4x6 Foldable Front/Back Layout Badge */}
              {paperLayout.isFoldable4x6 && (
                <div
                  data-testid="foldable-4x6-info-badge"
                  className="pt-2 border-t border-surface-200/60 dark:border-surface-700/50 flex items-start gap-1.5 text-[11px] text-brand-700 dark:text-brand-300 bg-brand-50/50 dark:bg-brand-950/30 p-2 rounded-lg border border-brand-200/60 dark:border-brand-800/40"
                >
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand-600" />
                  <span>
                    <strong>Foldable 4×6 Layout:</strong> Front in top half (upright), Back in bottom half (rotated 180° for horizontal center folding and lamination).
                  </span>
                </div>
              )}
            </div>

            {/* ROW 2A: Margins */}
            <div className="p-4 rounded-xl bg-surface-50/70 dark:bg-surface-800/40 border border-surface-200/80 dark:border-surface-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider flex items-center gap-1.5">
                  <LayoutTemplate className="w-3.5 h-3.5 text-brand-600" />
                  <span>Margins</span>
                </label>
                <span className="text-[10px] text-surface-500 dark:text-surface-400 font-mono">
                  {paperLayout.margins.topMm}T • {paperLayout.margins.bottomMm}B • {paperLayout.margins.leftMm}L • {paperLayout.margins.rightMm}R mm
                </span>
              </div>

              {/* Margin Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                {PRINT_MARGIN_PRESET_OPTIONS.map((marginOpt) => {
                  const isMarginActive = activeLayout.marginPreset === marginOpt.id;
                  return (
                    <button
                      key={marginOpt.id}
                      type="button"
                      onClick={() => {
                        if (marginOpt.id === "none") {
                          updateLayout({
                            marginPreset: "none",
                            margins: { topMm: 0, bottomMm: 0, leftMm: 0, rightMm: 0 },
                          });
                        } else if (marginOpt.id === "small") {
                          updateLayout({
                            marginPreset: "small",
                            margins: { topMm: 5, bottomMm: 5, leftMm: 5, rightMm: 5 },
                          });
                        } else if (marginOpt.id === "normal") {
                          updateLayout({
                            marginPreset: "normal",
                            margins: { topMm: 12.7, bottomMm: 12.7, leftMm: 12.7, rightMm: 12.7 },
                          });
                        } else {
                          updateLayout({ marginPreset: "custom" });
                        }
                      }}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs border focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                        isMarginActive
                          ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                          : "bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-200 border-surface-200 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-600"
                      )}
                      title={marginOpt.description}
                      data-testid={`margin-preset-${marginOpt.id}`}
                    >
                      {marginOpt.shortLabel}
                    </button>
                  );
                })}
              </div>

              {/* Custom Margins Configuration */}
              {activeLayout.marginPreset === "custom" && (
                <div className="pt-2 border-t border-surface-200/60 dark:border-surface-700/50 grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-surface-500 dark:text-surface-400 block mb-1">
                      Top (mm):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={activeLayout.margins.topMm}
                      onChange={(e) => handleCustomMarginChange("topMm", e.target.value)}
                      data-testid="custom-margin-top"
                      className="w-full px-2 py-1 text-xs rounded-md border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-surface-500 dark:text-surface-400 block mb-1">
                      Bottom:
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={activeLayout.margins.bottomMm}
                      onChange={(e) => handleCustomMarginChange("bottomMm", e.target.value)}
                      data-testid="custom-margin-bottom"
                      className="w-full px-2 py-1 text-xs rounded-md border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-surface-500 dark:text-surface-400 block mb-1">
                      Left:
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={activeLayout.margins.leftMm}
                      onChange={(e) => handleCustomMarginChange("leftMm", e.target.value)}
                      data-testid="custom-margin-left"
                      className="w-full px-2 py-1 text-xs rounded-md border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-surface-500 dark:text-surface-400 block mb-1">
                      Right:
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={activeLayout.margins.rightMm}
                      onChange={(e) => handleCustomMarginChange("rightMm", e.target.value)}
                      data-testid="custom-margin-right"
                      className="w-full px-2 py-1 text-xs rounded-md border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ROW 2B: Alignment & Custom Position */}
            <div className="p-4 rounded-xl bg-surface-50/70 dark:bg-surface-800/40 border border-surface-200/80 dark:border-surface-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-brand-600" />
                  <span>Document Alignment</span>
                </label>
              </div>

              {/* Alignment Selector */}
              <div className="flex flex-wrap items-center gap-1.5">
                {PRINT_ALIGNMENT_OPTIONS.map((alignOpt) => {
                  const isAlignActive = activeLayout.alignment === alignOpt.id;
                  return (
                    <button
                      key={alignOpt.id}
                      type="button"
                      onClick={() => updateLayout({ alignment: alignOpt.id })}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs border focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                        isAlignActive
                          ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                          : "bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-200 border-surface-200 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-600"
                      )}
                      title={alignOpt.description}
                      data-testid={`alignment-${alignOpt.id}`}
                    >
                      {alignOpt.shortLabel}
                    </button>
                  );
                })}
              </div>

              {/* Custom Position Inputs */}
              {activeLayout.alignment === "custom" && (
                <div className="pt-2 border-t border-surface-200/60 dark:border-surface-700/50 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-surface-500 dark:text-surface-400 block mb-1">
                      Horizontal Offset X (mm):
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={activeLayout.customPosition.xMm}
                      onChange={(e) => handleCustomPositionChange("xMm", e.target.value)}
                      data-testid="custom-position-x"
                      className="w-full px-2 py-1 text-xs rounded-md border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-surface-500 dark:text-surface-400 block mb-1">
                      Vertical Offset Y (mm):
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={activeLayout.customPosition.yMm}
                      onChange={(e) => handleCustomPositionChange("yMm", e.target.value)}
                      data-testid="custom-position-y"
                      className="w-full px-2 py-1 text-xs rounded-md border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ROW 3A: Scale Controls */}
            <div className="p-4 rounded-xl bg-surface-50/70 dark:bg-surface-800/40 border border-surface-200/80 dark:border-surface-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-brand-600" />
                  <span>Document Scale</span>
                </label>
                <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold font-mono">
                  Scale: {paperLayout.scalePercentage}%
                </span>
              </div>

              {/* Scale Options */}
              <div className="flex flex-wrap items-center gap-1.5">
                {PRINT_SCALE_OPTIONS.map((scaleOpt) => {
                  const isScaleActive = activeLayout.scaleMode === scaleOpt.id;
                  return (
                    <button
                      key={scaleOpt.id}
                      type="button"
                      onClick={() => updateLayout({ scaleMode: scaleOpt.id })}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs border focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                        isScaleActive
                          ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                          : "bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-200 border-surface-200 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-600"
                      )}
                      title={scaleOpt.description}
                      data-testid={`scale-mode-${scaleOpt.id}`}
                    >
                      {scaleOpt.shortLabel}
                    </button>
                  );
                })}
              </div>

              {/* Custom Percentage Slider/Input */}
              {activeLayout.scaleMode === "custom" && (
                <div className="pt-2 border-t border-surface-200/60 dark:border-surface-700/50 flex items-center gap-3">
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="5"
                    value={activeLayout.customScalePercentage}
                    onChange={(e) => {
                      const val = sanitizeScalePercentage(e.target.value);
                      updateLayout({ customScalePercentage: val });
                    }}
                    className="flex-1 accent-brand-600"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="10"
                      max="500"
                      value={activeLayout.customScalePercentage}
                      onChange={(e) => {
                        const val = sanitizeScalePercentage(e.target.value);
                        updateLayout({ customScalePercentage: val });
                      }}
                      data-testid="custom-scale-percentage"
                      className="w-16 px-2 py-1 text-xs rounded-md border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 font-mono text-center"
                    />
                    <span className="text-xs font-bold text-surface-500">%</span>
                  </div>
                </div>
              )}
            </div>

            {/* ROW 3B: Copies Controls */}
            <div className="p-4 rounded-xl bg-surface-50/70 dark:bg-surface-800/40 border border-surface-200/80 dark:border-surface-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5 text-brand-600" />
                  <span>Copies</span>
                </label>
                <span className="text-[10px] text-surface-500 dark:text-surface-400">
                  Min: 1 • Max: 20
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-1 p-1 bg-surface-200/70 dark:bg-surface-700 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleCopiesChange(activeLayout.copies - 1)}
                    disabled={activeLayout.copies <= 1}
                    data-testid="copies-decrement"
                    className="w-8 h-8 rounded-lg bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs font-bold transition-all"
                    aria-label="Decrease copies"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={activeLayout.copies}
                    onChange={(e) => handleCopiesChange(parseInt(e.target.value, 10))}
                    data-testid="copies-input"
                    className="w-12 h-8 text-center text-sm font-bold bg-transparent text-surface-900 dark:text-surface-100 focus:outline-none"
                    aria-label="Number of copies"
                  />

                  <button
                    type="button"
                    onClick={() => handleCopiesChange(activeLayout.copies + 1)}
                    disabled={activeLayout.copies >= 20}
                    data-testid="copies-increment"
                    className="w-8 h-8 rounded-lg bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs font-bold transition-all"
                    aria-label="Increase copies"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs text-surface-600 dark:text-surface-400">
                  <span className="font-semibold text-surface-800 dark:text-surface-200">
                    {activeLayout.copies} {activeLayout.copies === 1 ? "Copy" : "Copies"}
                  </span>
                  <p className="text-[10px] text-surface-500">
                    Note: Confirm {activeLayout.copies} in system print dialog.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              3. LAYOUT PREVIEW CANVAS
             ========================================================================= */}
          <div className="space-y-3">
            {/* Preview Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-surface-800 dark:text-surface-200 uppercase tracking-wider">
                  Layout Preview
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-700">
                  {paperLayout.paperWidthMm} × {paperLayout.paperHeightMm} mm ({paperLayout.orientation})
                </span>
              </div>

              {/* View Selector: Paper Sheet View vs Cards Detail View */}
              <div className="inline-flex items-center gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
                <button
                  type="button"
                  onClick={() => setPreviewView("sheet")}
                  data-testid="view-sheet"
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                    previewView === "sheet"
                      ? "bg-white dark:bg-surface-700 text-brand-700 dark:text-brand-300 shadow-2xs font-bold"
                      : "text-surface-600 dark:text-surface-400 hover:text-surface-900"
                  )}
                >
                  Paper Sheet View
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewView("cards")}
                  data-testid="view-cards"
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                    previewView === "cards"
                      ? "bg-white dark:bg-surface-700 text-brand-700 dark:text-brand-300 shadow-2xs font-bold"
                      : "text-surface-600 dark:text-surface-400 hover:text-surface-900"
                  )}
                >
                  Card Details View
                </button>
              </div>
            </div>

            {/* PREVIEW CANVAS */}
            <div
              data-testid="print-sheet-preview"
              className="w-full bg-surface-100/90 dark:bg-surface-900/80 rounded-2xl p-4 sm:p-8 border border-surface-200/90 dark:border-surface-700/80 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden shadow-inner"
            >
              {/* Paper Layout View (Phase 4 Sheet Preview) */}
              {previewView === "sheet" && (
                <div className="w-full flex flex-col items-center justify-center">
                  {/* The Realistic Paper Sheet Container */}
                  <div
                    data-testid="paper-sheet-container"
                    className="relative bg-white text-surface-900 shadow-2xl rounded-sm ring-1 ring-surface-300 dark:ring-surface-700 transition-all duration-300 overflow-hidden select-none"
                    style={{
                      aspectRatio: `${paperLayout.paperAspectRatio}`,
                      width:
                        paperLayout.orientation === "portrait"
                          ? "min(100%, 390px)"
                          : "min(100%, 540px)",
                      maxHeight: "560px",
                    }}
                  >
                    {/* Printable Margins Zone (Dashed boundary) */}
                    <div
                      data-testid="printable-margin-zone"
                      className="absolute pointer-events-none border border-dashed border-blue-400/60 bg-blue-500/[0.02]"
                      style={{
                        top: `${(paperLayout.margins.topMm / paperLayout.paperHeightMm) * 100}%`,
                        bottom: `${(paperLayout.margins.bottomMm / paperLayout.paperHeightMm) * 100}%`,
                        left: `${(paperLayout.margins.leftMm / paperLayout.paperWidthMm) * 100}%`,
                        right: `${(paperLayout.margins.rightMm / paperLayout.paperWidthMm) * 100}%`,
                      }}
                    >
                      {/* Printable Area Watermark */}
                      <span className="absolute top-1 left-1.5 text-[7px] font-mono font-medium text-blue-500/70 select-none">
                        Margin Zone ({paperLayout.printableWidthMm} × {paperLayout.printableHeightMm} mm)
                      </span>
                    </div>

                    {/* Feature 2: 4x6 Center Horizontal Fold Line Reference (Layout Reference only, not printed) */}
                    {paperLayout.isFoldable4x6 && paperLayout.foldLineYMm && (
                      <div
                        data-testid="foldable-4x6-fold-line"
                        className="absolute left-0 right-0 pointer-events-none border-t border-dashed border-amber-500/90 z-20 flex items-center justify-center"
                        style={{
                          top: `${(paperLayout.foldLineYMm / paperLayout.paperHeightMm) * 100}%`,
                        }}
                      >
                        <span className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 text-[8px] font-bold px-2 py-0.5 rounded shadow-2xs -mt-2">
                          Horizontal Fold Line (Center 50%)
                        </span>
                      </div>
                    )}

                    {/* Placed Document Items on Paper */}
                    {paperLayout.items.map((item) => {
                      return (
                        <div
                          key={item.side}
                          data-testid={`sheet-item-${item.side}`}
                          className="absolute transition-all duration-200"
                          style={{
                            left: `${item.xPercent}%`,
                            top: `${item.yPercent}%`,
                            width: `${item.widthPercent}%`,
                            height: `${item.heightPercent}%`,
                            transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
                            transformOrigin: "center center",
                          }}
                        >
                          <div className="w-full h-full rounded border border-surface-300 bg-surface-50 shadow-xs overflow-hidden flex flex-col relative group">
                            {/* Card Badges */}
                            <div className="absolute top-0.5 left-0.5 z-10 flex items-center gap-1 bg-surface-900/80 text-white text-[8px] font-extrabold px-1 py-0.5 rounded shadow-2xs">
                              <span>{item.badge}</span>
                              <span className="text-[7px] opacity-80">{item.title}</span>
                              {item.rotation === 180 && (
                                <span className="text-[6px] bg-amber-500 text-surface-950 font-black px-1 rounded">180°</span>
                              )}
                            </div>

                            <div className="absolute bottom-0.5 right-0.5 z-10 bg-surface-900/80 text-white text-[7px] font-mono px-1 py-0.5 rounded shadow-2xs">
                              {item.widthMm.toFixed(1)} × {item.heightMm.toFixed(1)} mm
                            </div>

                            {/* Document Side Image */}
                            {item.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-contain pointer-events-none select-none"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center bg-surface-100 text-surface-400">
                                <span className="text-xs font-bold">{item.badge}</span>
                                <span className="text-[8px] mt-0.5">Not Available</span>
                              </div>
                            )}

                            {/* Feature 1: Crisp Vector Document Border Inside Visible Boundaries */}
                            {paperLayout.border?.enabled && (
                              <svg
                                data-testid={`sheet-item-border-${item.side}`}
                                className="absolute inset-0 w-full h-full pointer-events-none z-20"
                                viewBox={`0 0 ${item.widthMm} ${item.heightMm}`}
                                preserveAspectRatio="none"
                              >
                                <rect
                                  x={paperLayout.border.thicknessMm / 2}
                                  y={paperLayout.border.thicknessMm / 2}
                                  width={Math.max(0, item.widthMm - paperLayout.border.thicknessMm)}
                                  height={Math.max(0, item.heightMm - paperLayout.border.thicknessMm)}
                                  fill="none"
                                  stroke={paperLayout.border.color}
                                  strokeWidth={paperLayout.border.thicknessMm}
                                  strokeDasharray={
                                    paperLayout.border.style === "dashed"
                                      ? "2.5,1.5"
                                      : paperLayout.border.style === "dotted"
                                      ? "0.6,1.2"
                                      : undefined
                                  }
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Overflow Warning Banner */}
                  {paperLayout.isOverflowing && (
                    <div className="w-full max-w-md mt-4 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>{paperLayout.overflowReason}</span>
                    </div>
                  )}

                  {/* Paper Layout Details Chips */}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] text-surface-500 dark:text-surface-400">
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-2xs">
                      Paper: <strong className="text-surface-700 dark:text-surface-300">{paperLayout.paperSize.toUpperCase()}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-2xs">
                      Orientation: <strong className="text-surface-700 dark:text-surface-300 capitalize">{paperLayout.orientation}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-2xs">
                      Scale: <strong className="text-surface-700 dark:text-surface-300">{paperLayout.scalePercentage}%</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-2xs">
                      Alignment: <strong className="text-surface-700 dark:text-surface-300 capitalize">{paperLayout.alignment}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-2xs">
                      Copies: <strong className="text-surface-700 dark:text-surface-300">{paperLayout.copies}</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Cards Detail View (Phase 3 View) */}
              {previewView === "cards" && (
                <div className="w-full flex items-center justify-center">
                  {mode === "front-only" && (
                    <div className="w-full max-w-lg flex flex-col items-center">
                      <SidePreviewCard
                        sideInfo={layoutResolution.sidesToRender[0]}
                        docName={docDef.name}
                        border={paperLayout.border}
                      />
                    </div>
                  )}

                  {mode === "back-only" && (
                    <div className="w-full max-w-lg flex flex-col items-center">
                      <SidePreviewCard
                        sideInfo={layoutResolution.sidesToRender[0]}
                        docName={docDef.name}
                        border={paperLayout.border}
                      />
                    </div>
                  )}

                  {mode === "combined" && (
                    <div
                      className={cn(
                        "w-full transition-all duration-200",
                        arrangement === "vertical"
                          ? "flex flex-col items-center justify-center gap-8 max-w-lg"
                          : "flex flex-col lg:flex-row items-center justify-center gap-8 max-w-4xl"
                      )}
                    >
                      <div className="w-full flex-1 max-w-md">
                        <SidePreviewCard
                          sideInfo={layoutResolution.sidesToRender[0]}
                          docName={docDef.name}
                          border={paperLayout.border}
                        />
                      </div>

                      <div
                        className={cn(
                          "flex items-center justify-center text-surface-400 dark:text-surface-500 font-mono text-[11px] shrink-0",
                          arrangement === "vertical"
                            ? "w-full my-0 py-1 border-t border-dashed border-surface-300 dark:border-surface-700"
                            : "h-full mx-0 px-1 border-l border-dashed border-surface-300 dark:border-surface-700"
                        )}
                      >
                        <span className="bg-surface-100 dark:bg-surface-900 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-surface-500">
                          {arrangement === "vertical" ? "↕ Vertical Gap" : "↔ Side-by-Side"}
                        </span>
                      </div>

                      <div className="w-full flex-1 max-w-md">
                        <SidePreviewCard
                          sideInfo={layoutResolution.sidesToRender[1]}
                          docName={docDef.name}
                          border={paperLayout.border}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Unified Portaled Printable Container (attached to document.body, isolated from app layout) */}
      <PrintContainer
        pageImages={printImageUrls}
        alt="Printable Document Sheet"
      />

      {/* Phase 5: Final Print Preview Modal */}
      <DocumentPrintPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        paperLayout={paperLayout}
        front={front}
        back={back}
        docDef={docDef}
        onPrint={() => {
          setIsPreviewModalOpen(false);
          handlePrintDocument();
        }}
        onDownloadPdf={() => {
          setIsPreviewModalOpen(false);
          handleDownloadPdf();
        }}
        isPrinting={isPrinting}
        isGeneratingPdf={isGeneratingPdf}
        resolutionCheck={resolutionCheck}
      />
    </section>
  );
};

/**
 * Sub-component: Renders an individual document side card or its informative empty state.
 */
interface SidePreviewCardProps {
  sideInfo: ReturnType<typeof resolvePrintStudioLayout>["sidesToRender"][number];
  docName: string;
  border?: DocumentBorderSettings;
}

const SidePreviewCard: React.FC<SidePreviewCardProps> = ({ sideInfo, docName, border }) => {
  const isFront = sideInfo.side === "front";
  const { isAvailable, imageUrl, printSettings, isEnhanced, emptyReason } = sideInfo;

  const aspectRatio =
    printSettings.widthMm > 0 && printSettings.heightMm > 0
      ? printSettings.widthMm / printSettings.heightMm
      : 85.6 / 53.98;

  if (!isAvailable || !imageUrl) {
    return (
      <div
        className="w-full bg-white dark:bg-surface-800/80 rounded-2xl border-2 border-dashed border-surface-300 dark:border-surface-700 p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-subtle min-h-[220px]"
        data-testid={`empty-state-${sideInfo.side}`}
      >
        <div
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 text-sm font-bold shadow-xs",
            isFront
              ? "bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200/80 dark:border-brand-800/60"
              : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60"
          )}
        >
          {sideInfo.badge}
        </div>
        <h4 className="text-sm font-bold text-surface-800 dark:text-surface-200">
          {sideInfo.title} Not Available
        </h4>
        <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 max-w-xs leading-relaxed">
          {emptyReason || "No cropped image available for this document side."}
        </p>
        <span className="mt-3 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>Upload or crop in editor above</span>
        </span>
      </div>
    );
  }

  return (
    <div
      className="w-full bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-md p-3.5 sm:p-4 flex flex-col gap-3 transition-all hover:shadow-lg"
      data-testid={`preview-card-${sideInfo.side}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-surface-100 dark:border-surface-700/60 pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold shrink-0 shadow-2xs",
              isFront
                ? "bg-brand-600 text-white"
                : "bg-indigo-600 text-white"
            )}
          >
            {sideInfo.badge}
          </span>
          <span className="font-extrabold text-xs text-surface-900 dark:text-surface-100 truncate">
            {sideInfo.title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-600">
            {printSettings.widthMm.toFixed(1)} × {printSettings.heightMm.toFixed(1)} mm
          </span>

          {isEnhanced && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 flex items-center gap-1 shadow-2xs">
              <Sparkles className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
              <span>Enhanced</span>
            </span>
          )}
        </div>
      </div>

      <div
        className="w-full relative rounded-xl overflow-hidden bg-surface-50 dark:bg-surface-900 border border-surface-200/70 dark:border-surface-700/60 shadow-inner flex items-center justify-center"
        style={{
          aspectRatio: `${aspectRatio}`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`${sideInfo.title} print preview`}
          className="w-full h-full object-contain rounded-lg select-none pointer-events-none"
          loading="eager"
        />

        {/* Feature 1: Document Border Preview Overlay */}
        {border?.enabled && (
          <svg
            data-testid={`card-item-border-${sideInfo.side}`}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox={`0 0 ${printSettings.widthMm} ${printSettings.heightMm}`}
            preserveAspectRatio="none"
          >
            <rect
              x={border.thicknessMm / 2}
              y={border.thicknessMm / 2}
              width={Math.max(0, printSettings.widthMm - border.thicknessMm)}
              height={Math.max(0, printSettings.heightMm - border.thicknessMm)}
              fill="none"
              stroke={border.color}
              strokeWidth={border.thicknessMm}
              strokeDasharray={
                border.style === "dashed"
                  ? "2.5,1.5"
                  : border.style === "dotted"
                  ? "0.6,1.2"
                  : undefined
              }
            />
          </svg>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-surface-500 dark:text-surface-400 pt-1">
        <span className="capitalize">
          Preset: <strong className="text-surface-700 dark:text-surface-300 font-semibold">{printSettings.dimensionPreset}</strong>
        </span>
        <span className="font-mono">
          {printSettings.dpi} DPI
        </span>
      </div>
    </div>
  );
};
