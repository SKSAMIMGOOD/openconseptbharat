"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Printer,
  FileText,
  RotateCw,
  Sliders,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Download,
  Layers,
  Sparkles,
  Check,
} from "lucide-react";
import type { DesignDocument } from "@/types/design-studio";
import type {
  PrintSheetConfig,
  PrintSheetLayoutResult,
  PrintPaperSize,
  DuplexFlipEdge,
  CutGuideStyle,
} from "@/types/design-print-sheet";
import {
  calculatePrintSheetLayout,
} from "@/lib/design-studio/print-sheet/sheet-calculation";
import {
  renderPrintSheetToCanvas,
  compilePrintSheetPdf,
} from "@/lib/design-studio/print-sheet/sheet-compiler";
import { downloadImageBlob } from "@/lib/image/exporter";
import { releaseCanvasBuffer } from "@/lib/utils/memory";

export interface MultiCopyPrintSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DesignDocument;
}

export const MultiCopyPrintSheetModal: React.FC<MultiCopyPrintSheetModalProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  // Configuration State
  const [paperSize, setPaperSize] = useState<PrintPaperSize>("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [copies, setCopies] = useState<number>(10);
  const [pageSelection, setPageSelection] = useState<"front-only" | "back-only" | "both-duplex">(
    document.pages.length > 1 ? "both-duplex" : "front-only"
  );
  const [duplexFlipEdge, setDuplexFlipEdge] = useState<DuplexFlipEdge>("long-edge");
  const [rotateCard, setRotateCard] = useState<boolean>(false);
  const [alignment, setAlignment] = useState<"center" | "top-left">("center");

  // Margins (mm)
  const [marginTop, setMarginTop] = useState<number>(10);
  const [marginBottom, setMarginBottom] = useState<number>(10);
  const [marginLeft, setMarginLeft] = useState<number>(10);
  const [marginRight, setMarginRight] = useState<number>(10);

  // Spacing (mm)
  const [spacingH, setSpacingH] = useState<number>(3);
  const [spacingV, setSpacingV] = useState<number>(3);

  // Cut Guides
  const [cutGuidesEnabled, setCutGuidesEnabled] = useState<boolean>(true);
  const [cutGuideStyle, setCutGuideStyle] = useState<CutGuideStyle>("corners");
  const [includeBorder, setIncludeBorder] = useState<boolean>(false);

  // Preview State
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Construct config object
  const config = useMemo<PrintSheetConfig>(() => {
    return {
      paperSize,
      orientation,
      copies,
      pageSelection,
      frontPageId: document.pages[0]?.id,
      backPageId: document.pages[1]?.id || document.pages[0]?.id,
      duplexFlipEdge,
      marginsMm: {
        top: marginTop,
        bottom: marginBottom,
        left: marginLeft,
        right: marginRight,
      },
      spacingMm: {
        horizontal: spacingH,
        vertical: spacingV,
      },
      rotateCard,
      alignment,
      cutGuides: {
        enabled: cutGuidesEnabled,
        style: cutGuideStyle,
        color: "#94a3b8",
        widthPt: 0.75,
        includeBorder,
        borderColor: "#cbd5e1",
      },
      dpi: 300,
    };
  }, [
    paperSize,
    orientation,
    copies,
    pageSelection,
    document,
    duplexFlipEdge,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    spacingH,
    spacingV,
    rotateCard,
    alignment,
    cutGuidesEnabled,
    cutGuideStyle,
    includeBorder,
  ]);

  // Calculate layout geometry
  const layout = useMemo<PrintSheetLayoutResult>(() => {
    return calculatePrintSheetLayout(document, config);
  }, [document, config]);

  // Keep activeSheetIndex in bounds
  useEffect(() => {
    if (activeSheetIndex >= layout.sheets.length) {
      setActiveSheetIndex(Math.max(0, layout.sheets.length - 1));
    }
  }, [layout.sheets.length, activeSheetIndex]);

  // Generate responsive live preview
  useEffect(() => {
    if (!isOpen || layout.capacityPerSheet === 0) {
      setPreviewDataUrl(null);
      return;
    }

    let active = true;
    setIsPreviewLoading(true);
    setError(null);

    // Fast screen rendering at 100 DPI for preview
    const previewConfig = { ...config, dpi: 100 };
    renderPrintSheetToCanvas(document, layout, activeSheetIndex, previewConfig)
      .then((canvas) => {
        if (!active) {
          releaseCanvasBuffer(canvas);
          return;
        }
        const dataUrl = canvas.toDataURL("image/png");
        setPreviewDataUrl(dataUrl);
        releaseCanvasBuffer(canvas);
      })
      .catch((err) => {
        if (active) setError("Could not render sheet preview: " + err.message);
      })
      .finally(() => {
        if (active) setIsPreviewLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, layout, activeSheetIndex, config, document]);

  // Handle PDF Export
  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      setError(null);
      setExportProgress("Compiling print-ready sheets into vector PDF...");

      const pdfBytes = await compilePrintSheetPdf(
        document,
        layout,
        config,
        (current, total) => {
          setExportProgress(`Compiling sheet ${current} of ${total}...`);
        }
      );

      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const cleanTitle = (document.metadata.title || "design-print-sheet")
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "-")
        .replace(/-+/g, "-");

      downloadImageBlob(blob, `${cleanTitle}-print-sheet.pdf`);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to compile print sheet PDF.");
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  if (!isOpen) return null;

  const currentSheet = layout.sheets[activeSheetIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-sheet-modal-title"
    >
      <div className="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 id="print-sheet-modal-title" className="text-base font-bold text-surface-900 dark:text-surface-100">
                Multi-Copy Print Sheet Generator
              </h2>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Print multiple cards on standard paper with cut marks and duplex alignment
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Split */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-surface-200 dark:divide-surface-800">
          {/* Left Column: Live Sheet Visual Preview (7 cols) */}
          <div className="lg:col-span-7 p-5 flex flex-col justify-between bg-surface-50/60 dark:bg-surface-950/40 min-h-[380px]">
            <div>
              {/* Sheet Navigation Header */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider">
                    Sheet Preview
                  </span>
                  {currentSheet && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      currentSheet.isBackSide
                        ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
                        : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                    }`}>
                      {currentSheet.isBackSide ? "Back Side" : "Front Side"}
                    </span>
                  )}
                </div>

                {layout.sheets.length > 1 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      disabled={activeSheetIndex === 0}
                      onClick={() => setActiveSheetIndex((idx) => Math.max(0, idx - 1))}
                      className="p-1 rounded border border-surface-200 dark:border-surface-700 disabled:opacity-30 hover:bg-surface-100"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-semibold px-1">
                      Sheet {activeSheetIndex + 1} of {layout.sheets.length}
                    </span>
                    <button
                      type="button"
                      disabled={activeSheetIndex >= layout.sheets.length - 1}
                      onClick={() => setActiveSheetIndex((idx) => Math.min(layout.sheets.length - 1, idx + 1))}
                      className="p-1 rounded border border-surface-200 dark:border-surface-700 disabled:opacity-30 hover:bg-surface-100"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Sheet Canvas Container */}
              <div className="relative aspect-[3/4] max-h-[460px] bg-surface-200/50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden flex items-center justify-center p-3 shadow-inner">
                {isPreviewLoading ? (
                  <div className="flex flex-col items-center gap-2 text-surface-400">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                    <span className="text-xs">Calculating & rendering sheet...</span>
                  </div>
                ) : previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt="Print sheet preview"
                    className="max-h-full max-w-full object-contain shadow-lg rounded border border-surface-300 dark:border-surface-600 bg-white"
                  />
                ) : (
                  <div className="text-xs text-red-500 text-center px-4">
                    {layout.warning || "Cannot place cards with current dimensions"}
                  </div>
                )}
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-4 gap-2 mt-3 text-center text-xs">
                <div className="p-2 rounded-lg bg-surface-0 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                  <div className="text-[10px] text-surface-400 font-semibold uppercase">Grid</div>
                  <div className="font-bold text-surface-800 dark:text-surface-200 mt-0.5">
                    {layout.columns} × {layout.rows}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-surface-0 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                  <div className="text-[10px] text-surface-400 font-semibold uppercase">Per Sheet</div>
                  <div className="font-bold text-surface-800 dark:text-surface-200 mt-0.5">
                    {layout.capacityPerSheet} Cards
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-surface-0 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                  <div className="text-[10px] text-surface-400 font-semibold uppercase">Total Copies</div>
                  <div className="font-bold text-surface-800 dark:text-surface-200 mt-0.5">
                    {config.copies}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-surface-0 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                  <div className="text-[10px] text-surface-400 font-semibold uppercase">Sheets</div>
                  <div className="font-bold text-surface-800 dark:text-surface-200 mt-0.5">
                    {layout.sheets.length} Pages
                  </div>
                </div>
              </div>
            </div>

            {/* Warning / Feedback Banner */}
            {layout.warning && (
              <div className="mt-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{layout.warning}</span>
              </div>
            )}
          </div>

          {/* Right Column: Controls & Print Calibration (5 cols) */}
          <div className="lg:col-span-5 p-5 flex flex-col justify-between space-y-4 text-xs">
            <div className="space-y-4">
              {/* Paper Selection */}
              <div>
                <label className="block font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                  1. Paper Size & Orientation
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setPaperSize("a4")}
                    className={`p-2 rounded-lg border font-medium text-left transition-colors ${
                      paperSize === "a4"
                        ? "bg-primary-50 dark:bg-primary-950/40 border-primary-500 text-primary-700 dark:text-primary-300"
                        : "border-surface-200 dark:border-surface-700 hover:bg-surface-50"
                    }`}
                  >
                    <div className="font-bold">ISO A4</div>
                    <div className="text-[10px] text-surface-400">210 × 297 mm</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaperSize("4x6")}
                    className={`p-2 rounded-lg border font-medium text-left transition-colors ${
                      paperSize === "4x6"
                        ? "bg-primary-50 dark:bg-primary-950/40 border-primary-500 text-primary-700 dark:text-primary-300"
                        : "border-surface-200 dark:border-surface-700 hover:bg-surface-50"
                    }`}
                  >
                    <div className="font-bold">4 × 6 in</div>
                    <div className="text-[10px] text-surface-400">101.6 × 152.4 mm</div>
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOrientation("portrait")}
                    className={`flex-1 py-1.5 px-2 rounded-lg border font-medium text-center transition-colors ${
                      orientation === "portrait"
                        ? "bg-primary-600 text-white border-primary-600"
                        : "border-surface-200 dark:border-surface-700 hover:bg-surface-50"
                    }`}
                  >
                    Portrait Sheet
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation("landscape")}
                    className={`flex-1 py-1.5 px-2 rounded-lg border font-medium text-center transition-colors ${
                      orientation === "landscape"
                        ? "bg-primary-600 text-white border-primary-600"
                        : "border-surface-200 dark:border-surface-700 hover:bg-surface-50"
                    }`}
                  >
                    Landscape Sheet
                  </button>
                </div>
              </div>

              {/* Copies Count & Rotation */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-surface-200 dark:border-surface-800">
                <div>
                  <label className="block font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1">
                    Copies Required
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={copies}
                    onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-800 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1">
                    Optimize Fill
                  </label>
                  <button
                    type="button"
                    onClick={() => setRotateCard(!rotateCard)}
                    className={`w-full py-1.5 px-2 rounded-lg border flex items-center justify-center gap-1.5 font-medium transition-colors ${
                      rotateCard
                        ? "bg-primary-50 dark:bg-primary-950/40 border-primary-500 text-primary-700 dark:text-primary-300"
                        : "border-surface-200 dark:border-surface-700 hover:bg-surface-50"
                    }`}
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{rotateCard ? "Rotated 90°" : "Default 0°"}</span>
                  </button>
                </div>
              </div>

              {/* Duplex / Page Selection */}
              <div className="pt-2 border-t border-surface-200 dark:border-surface-800">
                <label className="block font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-1.5">
                  Print Sides & Duplex Alignment
                </label>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => setPageSelection("front-only")}
                    className={`py-1 px-2 rounded-lg border text-center transition-colors ${
                      pageSelection === "front-only"
                        ? "bg-primary-600 text-white border-primary-600 font-semibold"
                        : "border-surface-200 dark:border-surface-700"
                    }`}
                  >
                    Front Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageSelection("back-only")}
                    disabled={document.pages.length < 2}
                    className={`py-1 px-2 rounded-lg border text-center transition-colors disabled:opacity-40 ${
                      pageSelection === "back-only"
                        ? "bg-primary-600 text-white border-primary-600 font-semibold"
                        : "border-surface-200 dark:border-surface-700"
                    }`}
                  >
                    Back Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageSelection("both-duplex")}
                    disabled={document.pages.length < 2}
                    className={`py-1 px-2 rounded-lg border text-center transition-colors disabled:opacity-40 ${
                      pageSelection === "both-duplex"
                        ? "bg-primary-600 text-white border-primary-600 font-semibold"
                        : "border-surface-200 dark:border-surface-700"
                    }`}
                  >
                    Both (Duplex)
                  </button>
                </div>

                {pageSelection === "both-duplex" && (
                  <div className="p-2 rounded-lg bg-surface-100 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-surface-600 dark:text-surface-300">
                      Flip Edge:
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDuplexFlipEdge("long-edge")}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          duplexFlipEdge === "long-edge"
                            ? "bg-primary-600 text-white"
                            : "bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300"
                        }`}
                      >
                        Long Edge (Standard)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDuplexFlipEdge("short-edge")}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          duplexFlipEdge === "short-edge"
                            ? "bg-primary-600 text-white"
                            : "bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300"
                        }`}
                      >
                        Short Edge
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Spacing & Cut Guides */}
              <div className="pt-2 border-t border-surface-200 dark:border-surface-800 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-surface-600 dark:text-surface-400 mb-0.5">
                      Card Gap Spacing (mm)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={spacingH}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        setSpacingH(val);
                        setSpacingV(val);
                      }}
                      className="w-full px-2 py-1 rounded border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-surface-600 dark:text-surface-400 mb-0.5">
                      Page Margin (mm)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="40"
                      value={marginLeft}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        setMarginLeft(val);
                        setMarginRight(val);
                        setMarginTop(val);
                        setMarginBottom(val);
                      }}
                      className="w-full px-2 py-1 rounded border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-800"
                    />
                  </div>
                </div>

                {/* Cut Guide Selector */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-surface-700 dark:text-surface-300">
                    <input
                      type="checkbox"
                      checked={cutGuidesEnabled}
                      onChange={(e) => setCutGuidesEnabled(e.target.checked)}
                      className="rounded border-surface-300 text-primary-600"
                    />
                    <span>Print Cut Marks</span>
                  </label>

                  {cutGuidesEnabled && (
                    <select
                      value={cutGuideStyle}
                      onChange={(e) => setCutGuideStyle(e.target.value as CutGuideStyle)}
                      className="px-2 py-0.5 text-[11px] rounded border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-800"
                    >
                      <option value="corners">Corner Ticks</option>
                      <option value="border">Full Grid Lines</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-surface-200 dark:border-surface-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isExporting}
                className="px-3.5 py-1.5 rounded-xl font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExporting || layout.capacityPerSheet === 0}
                className="px-4 py-2 rounded-xl font-semibold bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-md shadow-primary-500/25 flex items-center gap-1.5 transition-all disabled:opacity-40"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{exportProgress || "Compiling..."}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download PDF ({layout.sheets.length} Sheets)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
