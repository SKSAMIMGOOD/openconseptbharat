"use client";

import React, { useEffect } from "react";
import type {
  DocumentSideResult,
  DocumentTypeDefinition,
} from "@/types/document-studio";
import type { PrintPaperLayoutResult } from "@/lib/document/document-print-studio";
import type { ResolutionAdequacyResult } from "@/lib/document/document-print-pdf";
import { getPaperDimensionsInPoints } from "@/lib/document/document-print-pdf";
import {
  Printer,
  Download,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
  Maximize2,
  FileText,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface DocumentPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  paperLayout: PrintPaperLayoutResult;
  front: DocumentSideResult;
  back: DocumentSideResult;
  docDef: DocumentTypeDefinition;
  onPrint: () => void;
  onDownloadPdf: () => void;
  isPrinting?: boolean;
  isGeneratingPdf?: boolean;
  resolutionCheck?: ResolutionAdequacyResult;
}

export const DocumentPrintPreviewModal: React.FC<DocumentPrintPreviewModalProps> = ({
  isOpen,
  onClose,
  paperLayout,
  front,
  back,
  docDef,
  onPrint,
  onDownloadPdf,
  isPrinting = false,
  isGeneratingPdf = false,
  resolutionCheck,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const points = getPaperDimensionsInPoints(
    paperLayout.paperWidthMm,
    paperLayout.paperHeightMm
  );

  const isPortrait = paperLayout.orientation === "portrait";
  const dpi = front.printSettings?.dpi || 300;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-surface-900/80 backdrop-blur-md animate-in fade-in duration-200 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-preview-modal-title"
      data-testid="print-preview-modal"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white dark:bg-surface-800 rounded-3xl shadow-2xl border border-surface-200 dark:border-surface-700 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50/80 dark:bg-surface-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="print-preview-modal-title"
                  className="text-base sm:text-lg font-bold text-surface-900 dark:text-surface-100"
                >
                  Print & PDF Preview — {docDef.name}
                </h3>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 uppercase">
                  {paperLayout.paperSize.toUpperCase()} • {paperLayout.orientation}
                </span>
              </div>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Final print output verification and calibration
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            data-testid="close-print-preview-modal"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            aria-label="Close Print Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Resolution Alert / Warning (if source resolution is below recommended for DPI) */}
          {resolutionCheck && !resolutionCheck.isAdequate && (
            <div
              data-testid="resolution-warning-banner"
              className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">Source Resolution Warning</span>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  {resolutionCheck.warning ||
                    `Source image (${resolutionCheck.actualPx.width} × ${resolutionCheck.actualPx.height} px) is lower than recommended for ${resolutionCheck.targetDpi} DPI output (${resolutionCheck.recommendedPx.width} × ${resolutionCheck.recommendedPx.height} px). The physical print may appear slightly soft.`}
                </p>
              </div>
            </div>
          )}

          {/* Large Readable Paper Layout Preview Stage */}
          <div className="w-full bg-surface-100 dark:bg-surface-900 rounded-2xl p-4 sm:p-8 border border-surface-200 dark:border-surface-700/80 flex flex-col items-center justify-center min-h-[380px] shadow-inner relative overflow-hidden">
            {/* The Realistic Paper Sheet Container */}
            <div
              data-testid="modal-paper-sheet-container"
              className="relative bg-white text-surface-900 shadow-2xl rounded-sm ring-1 ring-surface-300 dark:ring-surface-700 transition-all duration-300 overflow-hidden select-none"
              style={{
                aspectRatio: `${paperLayout.paperAspectRatio}`,
                width: isPortrait ? "min(100%, 360px)" : "min(100%, 520px)",
                maxHeight: "480px",
              }}
            >
              {/* Margin Zone boundary */}
              <div
                className="absolute pointer-events-none border border-dashed border-blue-400/60 bg-blue-500/[0.02]"
                style={{
                  top: `${(paperLayout.margins.topMm / paperLayout.paperHeightMm) * 100}%`,
                  bottom: `${(paperLayout.margins.bottomMm / paperLayout.paperHeightMm) * 100}%`,
                  left: `${(paperLayout.margins.leftMm / paperLayout.paperWidthMm) * 100}%`,
                  right: `${(paperLayout.margins.rightMm / paperLayout.paperWidthMm) * 100}%`,
                }}
              >
                <span className="absolute top-1 left-1.5 text-[7px] font-mono font-medium text-blue-500/70 select-none">
                  Margin ({paperLayout.printableWidthMm} × {paperLayout.printableHeightMm} mm)
                </span>
              </div>

              {/* Feature 2: 4x6 Fold Line Reference (Horizontal Center Fold) */}
              {paperLayout.isFoldable4x6 && paperLayout.foldLineYMm && (
                <div
                  data-testid="modal-foldable-4x6-fold-line"
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

              {/* Placed Items */}
              {paperLayout.items.map((item) => (
                <div
                  key={item.side}
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
                  <div className="w-full h-full rounded border border-surface-300 bg-surface-50 shadow-xs overflow-hidden flex flex-col relative">
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

                    {/* Feature 1: Vector Document Border inside visible boundaries */}
                    {paperLayout.border?.enabled && (
                      <svg
                        data-testid={`modal-item-border-${item.side}`}
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
              ))}
            </div>

            {/* Paper Dimension Summary Pill below sheet */}
            <div className="mt-3 text-[11px] font-mono text-surface-500 dark:text-surface-400">
              Output Dimensions: {paperLayout.paperWidthMm} × {paperLayout.paperHeightMm} mm ({points.pageWidthPt} × {points.pageHeightPt} pt)
            </div>
          </div>

          {/* Print Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700">
              <span className="text-[10px] text-surface-500 uppercase tracking-wider block font-semibold">
                Paper Size
              </span>
              <span className="font-bold text-surface-900 dark:text-surface-100 mt-0.5 block">
                {paperLayout.paperSize === "4x6" ? "4×6" : paperLayout.paperSize.toUpperCase()} ({paperLayout.orientation})
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700">
              <span className="text-[10px] text-surface-500 uppercase tracking-wider block font-semibold">
                Margins
              </span>
              <span className="font-bold text-surface-900 dark:text-surface-100 mt-0.5 block">
                {paperLayout.margins.topMm} mm
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700">
              <span className="text-[10px] text-surface-500 uppercase tracking-wider block font-semibold">
                Scale
              </span>
              <span className="font-bold text-surface-900 dark:text-surface-100 mt-0.5 block">
                {paperLayout.scalePercentage}% ({paperLayout.scaleMode === "fit" ? "Fit to Page" : paperLayout.scaleMode === "custom" ? "Custom" : "Actual Size"})
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700">
              <span className="text-[10px] text-surface-500 uppercase tracking-wider block font-semibold">
                Quality & Copies
              </span>
              <span className="font-bold text-surface-900 dark:text-surface-100 mt-0.5 block">
                {dpi} DPI • {paperLayout.copies} {paperLayout.copies === 1 ? "Copy" : "Copies"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700">
              <span className="text-[10px] text-surface-500 uppercase tracking-wider block font-semibold">
                Document Border
              </span>
              <span className="font-bold text-surface-900 dark:text-surface-100 mt-0.5 block">
                {paperLayout.border?.enabled
                  ? `${paperLayout.border.thicknessMm}mm ${paperLayout.border.style}`
                  : "Disabled"}
              </span>
            </div>
          </div>

          {/* Browser Native Copies Notice */}
          <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 text-xs text-surface-600 dark:text-surface-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Printer Copies Notice:</strong> Due to browser security constraints, web applications cannot programmatically set your printer hardware copy count. If printing via your browser dialog, please confirm <strong>{paperLayout.copies} {paperLayout.copies === 1 ? "copy" : "copies"}</strong> in the system print settings. When downloading a PDF, all {paperLayout.copies} copies are included as individual pages.
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50/80 dark:bg-surface-800/80">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
          >
            Back to Editor
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Download Print-Ready PDF Button */}
            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={isGeneratingPdf || isPrinting}
              data-testid="modal-download-pdf-button"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-surface-700 hover:bg-surface-100 dark:hover:bg-surface-600 text-surface-800 dark:text-surface-100 font-bold text-xs border border-surface-300 dark:border-surface-600 shadow-xs transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>{isGeneratingPdf ? "Generating PDF..." : "Download Print-Ready PDF"}</span>
            </button>

            {/* Print Document Button */}
            <button
              type="button"
              onClick={onPrint}
              disabled={isPrinting || isGeneratingPdf}
              data-testid="modal-print-button"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? "Preparing..." : "Print Document"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
