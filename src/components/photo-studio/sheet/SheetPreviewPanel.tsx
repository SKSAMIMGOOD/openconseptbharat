"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  PhotoSheetConfig,
  SheetCalculationResult,
  SheetExportFormat,
} from "@/types/photo-sheet";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Download,
  Info,
  CheckCircle2,
  Printer,
  FileCheck,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface SheetPreviewPanelProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  config: PhotoSheetConfig;
  layout: SheetCalculationResult;
  exportFormat: SheetExportFormat;
  isExporting: boolean;
  onExportClick: () => void;
  onPrintClick?: () => void;
  onOpenPrintPreview?: () => void;
  className?: string;
}

export const SheetPreviewPanel: React.FC<SheetPreviewPanelProps> = ({
  canvasRef,
  config,
  layout,
  exportFormat,
  isExporting,
  onExportClick,
  onPrintClick,
  onOpenPrintPreview,
  className,
}) => {
  // Preview Zoom & Pan State
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(3.0, Number((prev + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.4, Number((prev - 0.25).toFixed(2))));
  const handleResetZoom = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };
  const handleFitToScreen = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1.0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch pan handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && zoom > 1.0) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y,
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  const isA4 = (layout.paperSize || "a4") === "a4";
  const paperTitle = isA4
    ? `A4 Sheet (${config.orientation === "landscape" ? "297 × 210 mm" : "210 × 297 mm"})`
    : `4×6″ Photo Paper (${config.orientation === "landscape" ? "6 × 4″" : "4 × 6″"})`;

  const formatLabel =
    exportFormat === "application/pdf"
      ? "PDF Document"
      : exportFormat === "image/png"
      ? "PNG Image"
      : "JPEG Photo";

  return (
    <div className={cn("space-y-6", className)}>
      {/* 1. Main Sheet Preview Card */}
      <div className="bg-white rounded-3xl border border-surface-200 p-5 sm:p-6 shadow-card space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-100 pb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" />
              <span>Live Sheet Preview</span>
            </span>
            <h3 className="text-base sm:text-lg font-bold text-surface-900 mt-0.5">
              {paperTitle}
            </h3>
          </div>

          {/* Zoom controls toolbar */}
          <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-xl border border-surface-200">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.4}
              className="p-1.5 rounded-lg hover:bg-white text-surface-700 transition-colors disabled:opacity-40"
              title="Zoom Out (-25%)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold text-surface-700 px-1.5 min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 3.0}
              className="p-1.5 rounded-lg hover:bg-white text-surface-700 transition-colors disabled:opacity-40"
              title="Zoom In (+25%)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleFitToScreen}
              className="p-1.5 rounded-lg hover:bg-white text-surface-700 transition-colors"
              title="Fit to Screen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg hover:bg-white text-surface-700 transition-colors"
              title="Reset Zoom (100%)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Preview Viewport */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={cn(
            "relative w-full aspect-[4/3] sm:aspect-[3/2] max-h-[460px] bg-surface-100 rounded-2xl border border-surface-200 flex items-center justify-center overflow-hidden shadow-inner p-4 select-none",
            zoom > 1.0 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
          )}
        >
          {/* Transparency / Desk Checkerboard */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] [background-size:16px_16px] [background-position:0_0,0_8px,8px_-8px,-8px_0px] opacity-70 pointer-events-none" />

          {/* Live Canvas with photo paper border and drop shadow */}
          <div
            className="relative z-10 transition-transform duration-75 ease-out shadow-2xl rounded-sm overflow-hidden border border-surface-300 ring-1 ring-surface-900/10 flex items-center justify-center bg-white"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
            }}
          >
            <canvas ref={canvasRef} className="block max-h-[400px] max-w-full object-contain" />
          </div>

          {/* Floating HUD: Orientation, Capacity & DPI */}
          <div className="absolute bottom-2.5 left-2.5 z-20 flex flex-wrap items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-surface-200 text-[11px] font-mono text-surface-800 shadow-sm">
            <span className="font-bold text-brand-700">
              {layout.totalPhotos} of {layout.maxCapacity} placed
            </span>
            {layout.copiesExceedCapacity && (
              <span className="text-amber-800 bg-amber-100 font-bold px-1.5 py-0.2 rounded border border-amber-300">
                {layout.requestedCopies} requested
              </span>
            )}
            <span className="text-surface-300">•</span>
            <span className="font-semibold uppercase">{layout.paperSize} {config.orientation}</span>
            <span className="text-surface-300">•</span>
            <span>{layout.dpi} DPI</span>
          </div>
        </div>

        {/* Master Output Dimensions & Metadata Breakdown */}
        <div className="bg-surface-50 rounded-2xl p-4 border border-surface-200/80 space-y-2.5 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-surface-200/60">
            <span className="text-surface-500 font-sans font-medium">Paper Dimensions:</span>
            <span className="font-bold text-surface-900">
              {layout.sheetWidthMm.toFixed(1)} × {layout.sheetHeightMm.toFixed(1)} mm ({layout.sheetWidthInches.toFixed(1)} × {layout.sheetHeightInches.toFixed(1)} in)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-surface-500 font-sans font-medium">Output Pixel Canvas:</span>
            <span className="font-bold text-brand-700">
              {layout.sheetWidthPx} × {layout.sheetHeightPx} px @ {layout.dpi} DPI
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-surface-500 font-sans font-medium">Photo Dimensions:</span>
            <span className="font-semibold text-surface-800">
              {layout.photoWidthMm} × {layout.photoHeightMm} mm ({layout.photoWidthPx} × {layout.photoHeightPx} px)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-surface-500 font-sans font-medium">Grid Arrangement:</span>
            <span className="text-surface-700">
              {layout.activeColumns} cols × {layout.activeRows} rows ({layout.totalPhotos} placed on sheet)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-surface-500 font-sans font-medium">Spacing & Margins:</span>
            <span className="text-surface-700">
              Spacing: {config.spacing.horizontalMm}×{config.spacing.verticalMm}mm • Margins: {config.margins.leftMm}mm
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-surface-500 font-sans font-medium">Cutting Guides:</span>
            <span className="text-surface-700 font-sans">
              {config.cutGuides.enabled ? config.cutGuides.style.replace(/_/g, " ") : "None"}
              {config.cutGuides.enabled && !config.cutGuides.includeInExport && " (preview only)"}
            </span>
          </div>
        </div>

        {/* Primary Action Buttons: Print Sheet & Download Sheet */}
        <div className="pt-2 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {onPrintClick && (
              <button
                type="button"
                onClick={onPrintClick}
                disabled={isExporting || layout.totalPhotos === 0 || layout.isOverflowing}
                className="w-full py-4 px-4 rounded-2xl bg-surface-900 hover:bg-black text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
              >
                <Printer className="w-5 h-5 text-brand-400" />
                <span>Print Sheet</span>
              </button>
            )}

            <button
              type="button"
              onClick={onExportClick}
              disabled={isExporting || layout.totalPhotos === 0 || layout.isOverflowing}
              className={cn(
                "w-full py-4 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-brand-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none",
                !onPrintClick && "sm:col-span-2"
              )}
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Generating {formatLabel.split(" ")[0]}...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>
                    Download {layout.paperSize.toUpperCase()} ({formatLabel.split(" ")[0]})
                  </span>
                </>
              )}
            </button>
          </div>

          {onOpenPrintPreview && (
            <button
              type="button"
              onClick={onOpenPrintPreview}
              disabled={isExporting || layout.totalPhotos === 0 || layout.isOverflowing}
              className="w-full py-2.5 px-4 rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-700 hover:text-surface-900 font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-surface-200"
            >
              <Maximize2 className="w-3.5 h-3.5 text-brand-600" />
              <span>Open 1:1 Print Preview & Settings Guide</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Critical Print Accuracy & Printer Settings Card */}
      <div className="bg-amber-50/70 border border-amber-200/90 rounded-3xl p-5 sm:p-6 space-y-3.5 text-xs text-amber-950 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-amber-900 uppercase tracking-wider text-[11px]">
          <Printer className="w-4 h-4 text-amber-700" />
          <span>Critical Printing Accuracy & Settings Guide</span>
        </div>

        <p className="text-surface-700 font-sans leading-relaxed">
          To ensure your photographs measure their exact physical dimensions ({layout.photoWidthMm} × {layout.photoHeightMm} mm) when printed on {isA4 ? "A4 paper (210 × 297 mm)" : "4×6 inch photo paper"}:
        </p>

        <ul className="space-y-1.5 list-disc list-inside font-sans text-surface-800">
          <li>
            <strong className="font-semibold text-surface-900">Scale / Sizing:</strong> Always set printer dialog scale to{" "}
            <span className="font-mono font-bold text-amber-900">Actual Size (100%)</span>.
          </li>
          <li>
            <strong className="font-semibold text-surface-900">Disable Fit to Page:</strong> Do{" "}
            <strong>NOT</strong> select &quot;Fit to Printable Area&quot;, &quot;Fit to Paper&quot;, or &quot;Shrink to Fit&quot; as this rescales the millimeter dimensions.
          </li>
          <li>
            <strong className="font-semibold text-surface-900">Paper Size:</strong> Select{" "}
            <span className="font-mono font-bold text-amber-900">
              {isA4 ? "A4 (210 × 297 mm)" : "4 × 6 inches (10 × 15 cm / 4R)"}
            </span>{" "}
            in your printer setup dialog.
          </li>
          <li>
            <strong className="font-semibold text-surface-900">Non-Printable Printer Margins:</strong> Most standard desktop printers have a physical paper-feed hardware margin (typically 3mm to 6mm) where ink cannot reach. Ensure your sheet margins match your printer, or enable &quot;Borderless Printing&quot; if supported by your printer model.
          </li>
        </ul>

        <div className="pt-2 border-t border-amber-200/60 text-[11px] text-surface-600 font-mono flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Hardware Advisory: While the PDF export points and pixel dimensions are mathematically exact, individual printer feeder rollers can exhibit minor mechanical tolerances (±0.5 mm). Not all consumer printers support edge-to-edge printing.
          </span>
        </div>
      </div>
    </div>
  );
};
