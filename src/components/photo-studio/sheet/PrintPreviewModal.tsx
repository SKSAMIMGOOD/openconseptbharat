"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  PhotoSheetConfig,
  SheetCalculationResult,
  SheetExportFormat,
} from "@/types/photo-sheet";
import {
  Printer,
  X,
  Download,
  CheckCircle2,
  AlertTriangle,
  Info,
  Maximize2,
  FileCheck,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { renderScaledSheetPreview } from "@/lib/photo-studio/sheet-renderer";

export interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PhotoSheetConfig;
  layout: SheetCalculationResult;
  imageSource: any;
  onPrintNow: () => void;
  onDownloadPdf: () => void;
  isExporting?: boolean;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (pageIndex: number) => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  config,
  layout,
  imageSource,
  onPrintNow,
  onDownloadPdf,
  isExporting = false,
  totalPages = 1,
  currentPage = 0,
  onPageChange,
}) => {
  const modalCanvasRef = useRef<HTMLCanvasElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

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

  // Render scaled preview canvas in modal
  useEffect(() => {
    if (!isOpen || !modalCanvasRef.current || !imageSource) return;

    renderScaledSheetPreview(
      modalCanvasRef.current,
      imageSource,
      layout,
      config.cutGuides,
      960
    );
  }, [isOpen, imageSource, layout, config.cutGuides]);

  if (!isOpen) return null;

  const isA4 = (layout.paperSize || "a4") === "a4";
  const paperName = isA4 ? "A4 Paper" : "4×6″ Photo Paper";
  const dimensionsMmStr = `${layout.sheetWidthMm.toFixed(1)} × ${layout.sheetHeightMm.toFixed(1)} mm`;
  const dimensionsInStr = `${layout.sheetWidthInches.toFixed(1)} × ${layout.sheetHeightInches.toFixed(1)} in`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-surface-900/80 backdrop-blur-md animate-in fade-in duration-200 no-print">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-surface-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 bg-surface-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-surface-900">
                  Print Preview — {paperName}
                </h3>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 uppercase">
                  {config.orientation}
                </span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {layout.dpi} DPI Calibrated
                </span>
              </div>
              <p className="text-xs text-surface-500">
                1:1 Calibrated sheet layout ready for physical printer output
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-surface-400 hover:text-surface-700 hover:bg-surface-200/60 transition-colors"
            title="Close Print Preview (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 2-Column Responsive Layout */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: True Page Layout Viewport (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-surface-100 rounded-2xl border border-surface-200 p-4 sm:p-6 overflow-hidden shadow-inner min-h-[380px] max-h-[580px] relative">
            {/* Background desk pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] [background-size:16px_16px] [background-position:0_0,0_8px,8px_-8px,-8px_0px] opacity-60 pointer-events-none" />

            {/* True Sheet Paper Container with paper shadow */}
            <div className="relative z-10 shadow-2xl rounded-sm border border-surface-300 ring-1 ring-surface-900/10 bg-white max-h-full max-w-full flex items-center justify-center overflow-hidden">
              <canvas
                ref={modalCanvasRef}
                className="block max-h-[500px] max-w-full object-contain"
              />
            </div>

            {/* Viewport Dimension HUD */}
            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-surface-200 text-[11px] font-mono text-surface-800 shadow-sm">
              <span className="font-bold text-brand-700">
                {layout.sheetWidthPx} × {layout.sheetHeightPx} px
              </span>
              <span className="text-surface-300">•</span>
              <span>{dimensionsMmStr}</span>
            </div>

            {/* Multi-Page Navigation Bar if totalPages > 1 */}
            {totalPages > 1 && (
              <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl border border-surface-200 text-xs shadow-sm font-sans">
                <span className="text-[11px] font-semibold text-surface-700 mr-1">
                  Sheet {currentPage + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => onPageChange && onPageChange(Math.max(0, currentPage - 1))}
                  disabled={currentPage <= 0}
                  className="px-2 py-0.5 rounded-lg border border-surface-200 text-[11px] font-bold text-surface-700 hover:bg-surface-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => onPageChange && onPageChange(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="px-2 py-0.5 rounded-lg border border-surface-200 text-[11px] font-bold text-surface-700 hover:bg-surface-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Print Checklist & Actions (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Sheet Specification Summary */}
            <div className="bg-surface-50 rounded-2xl p-4 border border-surface-200 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-surface-200">
                <span className="text-surface-500 font-sans font-medium">Paper Format:</span>
                <span className="font-bold text-surface-900">
                  {layout.paperSize.toUpperCase()} ({dimensionsMmStr})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-surface-500 font-sans font-medium">Sheet Orientation:</span>
                <span className="font-semibold text-surface-800 capitalize">
                  {config.orientation}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-surface-500 font-sans font-medium">Resolution / DPI:</span>
                <span className="font-bold text-brand-700">{layout.dpi} DPI</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-surface-500 font-sans font-medium">Total Print Sheets:</span>
                <span className="font-bold text-brand-700">
                  {totalPages} {totalPages === 1 ? "Sheet" : "Sheets"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-surface-500 font-sans font-medium">Photos on Sheet:</span>
                <span className="font-semibold text-surface-800">
                  {layout.totalPhotos} photos ({layout.activeColumns} cols × {layout.activeRows} rows)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-surface-500 font-sans font-medium">Photo Dimensions:</span>
                <span className="font-semibold text-surface-800">
                  {layout.photoWidthMm} × {layout.photoHeightMm} mm
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-surface-500 font-sans font-medium">Cutting Guides:</span>
                <span className="font-semibold text-surface-800">
                  {config.cutGuides.enabled ? config.cutGuides.style.replace(/_/g, " ") : "None"}
                </span>
              </div>
            </div>

            {/* Critical Printer Calibration Checklist */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-2.5 text-xs text-amber-950">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-amber-900">
                <CheckCircle2 className="w-4 h-4 text-amber-700" />
                <span>Printer Setup Checklist</span>
              </div>

              <ul className="space-y-1.5 list-disc list-inside font-sans text-surface-800">
                <li>
                  <strong>Scale / Size:</strong> Set to{" "}
                  <span className="font-mono font-bold text-amber-900">Actual Size (100%)</span>.
                  Do <strong>NOT</strong> select &quot;Fit to Page&quot;.
                </li>
                <li>
                  <strong>Paper:</strong> Choose{" "}
                  <span className="font-mono font-bold text-amber-900">
                    {isA4 ? "A4 (210 × 297 mm)" : "4×6 inches (10×15 cm)"}
                  </span>.
                </li>
                <li>
                  <strong>Orientation:</strong> Set to{" "}
                  <span className="font-mono font-bold text-amber-900 capitalize">
                    {config.orientation}
                  </span>.
                </li>
                <li>
                  <strong>Headers & Footers:</strong> Uncheck &quot;Headers and Footers&quot; in
                  browser print options.
                </li>
              </ul>
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={onPrintNow}
                disabled={isExporting || layout.totalPhotos === 0}
                className="w-full py-4 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-brand-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Preparing Print Sheet...</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-5 h-5" />
                    <span>Print Sheet Now</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onDownloadPdf}
                disabled={isExporting || layout.totalPhotos === 0}
                className="w-full py-3 px-4 rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-surface-200"
              >
                <Download className="w-4 h-4 text-brand-600" />
                <span>Or Download Print-Ready Vector PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-surface-200 bg-surface-50 text-[11px] text-surface-500 font-mono flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span>Zero-Upload Guarantee: Print synthesis executed 100% locally in browser memory.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-surface-700 hover:text-surface-900 font-sans"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
