"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Download,
  Printer,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type {
  SheetPaperSize,
  SheetOrientation,
  PhotoSheetConfig,
  SheetCalculationResult,
  SheetExportFormat,
  SheetExportResult,
} from "@/types/photo-sheet";
import type {
  UploadedPhoto,
  MultiplePhotoConfig,
  MultiPhotoArrangementResult,
} from "@/types/multiple-photo";
import { renderScaledSheetPreview, renderMasterSheetCanvas } from "@/lib/photo-studio/sheet-renderer";
import {
  exportSheetAsPdf,
  exportSheetAsImage,
  downloadSheet,
} from "@/lib/photo-studio/sheet-exporter";
import { PrintPreviewModal } from "@/components/photo-studio/sheet/PrintPreviewModal";
import { releaseCanvasBuffer, revokeObjectUrlSafely } from "@/lib/utils/memory";
import {
  SHEET_A4_SHORT_EDGE_INCHES,
  SHEET_A4_LONG_EDGE_INCHES,
  SHEET_4X6_SHORT_EDGE_INCHES,
  SHEET_4X6_LONG_EDGE_INCHES,
  DEFAULT_A4_SHEET_MARGINS,
  DEFAULT_SHEET_MARGINS,
  DEFAULT_A4_SHEET_SPACING,
  DEFAULT_4X6_SHEET_SPACING,
} from "@/constants/photo-sheet";
import { unitToMm } from "@/lib/crop/unit-converter";
import {
  calculatePhotoSheetLayout,
  MM_PER_INCH,
} from "@/lib/photo-studio/sheet-calculator";
import { flattenPhotoCopies } from "@/lib/multiple-photo/multiple-photo-engine";
import { cn } from "@/lib/utils/cn";

export interface MultiplePhotoPreviewPanelProps {
  photos: UploadedPhoto[];
  config: MultiplePhotoConfig;
  arrangement: MultiPhotoArrangementResult;
  className?: string;
}

export const MultiplePhotoPreviewPanel: React.FC<MultiplePhotoPreviewPanelProps> = ({
  photos,
  config,
  arrangement,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom and pan state
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Export & Print states
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);
  const [printImageUrl, setPrintImageUrl] = useState<string | null>(null);
  const printImageUrlRef = useRef<string | null>(null);
  printImageUrlRef.current = printImageUrl;

  // Clean up print image URL object URLs on unmount
  useEffect(() => {
    return () => {
      if (printImageUrlRef.current && printImageUrlRef.current.startsWith("blob:")) {
        revokeObjectUrlSafely(printImageUrlRef.current);
      }
    };
  }, []);

  // Zoom handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(3.0, Number((prev + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.4, Number((prev - 0.25).toFixed(2))));
  const handleResetZoom = () => {
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

  // Touch pan handlers
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

  // Build sequential list of ImageSourceDrawables for the canvas renderer
  const imageSources = arrangement.placements.map((p) => p.photo.imageElement || null);

  // Render scaled preview canvas on changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (photos.length === 0 || arrangement.placements.length === 0) {
      // Clear canvas if empty
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    try {
      renderScaledSheetPreview(
        canvas,
        imageSources,
        arrangement.layout,
        config.cutGuides,
        800 // maxPreviewWidth
      );
    } catch (err) {
      console.error("Preview render error:", err);
    }
  }, [photos, arrangement, config.cutGuides, imageSources]);

  // General export executor
  const executeExport = async (
    targetPaperSize: SheetPaperSize,
    format: "pdf" | "png" | "jpeg"
  ) => {
    if (photos.length === 0) {
      setExportMessage({
        type: "error",
        text: "Please upload at least one photograph to generate a sheet.",
      });
      return;
    }

    setIsExporting(true);
    setExportMessage(null);

    try {
      // Build configuration for target paper size
      const isTargetA4 = targetPaperSize === "a4";
      const orientation =
        targetPaperSize === config.paperSize ? config.orientation : isTargetA4 ? "portrait" : "landscape";

      const margins =
        targetPaperSize === config.paperSize
          ? config.margins
          : isTargetA4
          ? { ...DEFAULT_A4_SHEET_MARGINS }
          : { ...DEFAULT_SHEET_MARGINS };

      const spacing =
        targetPaperSize === config.paperSize
          ? config.spacing
          : isTargetA4
          ? { ...DEFAULT_A4_SHEET_SPACING }
          : { ...DEFAULT_4X6_SHEET_SPACING };

      const isManualCols = typeof config.columnsMode === "number";
      const manualCols = isManualCols ? Math.min(4, Math.max(1, config.columnsMode as number)) : 4;
      const flatPhotos = flattenPhotoCopies(photos);
      const manualRows = Math.max(1, Math.ceil(Math.max(1, flatPhotos.length) / manualCols));

      const paperWidthInches = isTargetA4
        ? (orientation === "landscape" ? SHEET_A4_LONG_EDGE_INCHES : SHEET_A4_SHORT_EDGE_INCHES)
        : (orientation === "landscape" ? SHEET_4X6_LONG_EDGE_INCHES : SHEET_4X6_SHORT_EDGE_INCHES);
      const paperHeightInches = isTargetA4
        ? (orientation === "landscape" ? SHEET_A4_SHORT_EDGE_INCHES : SHEET_A4_LONG_EDGE_INCHES)
        : (orientation === "landscape" ? SHEET_4X6_SHORT_EDGE_INCHES : SHEET_4X6_LONG_EDGE_INCHES);

      const exportSheetConfig: PhotoSheetConfig = {
        paperSize: targetPaperSize,
        orientation,
        paperWidthInches,
        paperHeightInches,
        dpi: config.dpi,
        layoutMode: isManualCols ? "manual" : "auto",
        manualCols,
        manualRows,
        copies: Math.max(1, flatPhotos.length),
        centerAlignment: false, // Top-aligned, NO vertical centering
        margins,
        spacing,
        cutGuides: config.cutGuides,
      };

      const photoWidthMm = unitToMm(config.dimensions.width, config.dimensions.unit);
      const photoHeightMm = unitToMm(config.dimensions.height, config.dimensions.unit);

      const targetLayout = calculatePhotoSheetLayout(exportSheetConfig, {
        widthMm: photoWidthMm,
        heightMm: photoHeightMm,
      });

      // Prepare image sources in exact sequential order for target layout
      const exportSources = targetLayout.placements.map((p) => {
        if (p.index < flatPhotos.length) {
          return flatPhotos[p.index].imageElement || null;
        }
        return null;
      });

      let result: SheetExportResult;

      if (format === "pdf") {
        result = await exportSheetAsPdf(exportSources, targetLayout, exportSheetConfig, {
          format: "application/pdf",
          includeCutGuides: config.cutGuides.enabled,
        });
      } else {
        result = await exportSheetAsImage(exportSources, targetLayout, exportSheetConfig, {
          format: format === "jpeg" ? "image/jpeg" : "image/png",
          quality: 0.95,
          includeCutGuides: config.cutGuides.enabled,
        });
      }

      // Download file to disk
      downloadSheet(result);

      const sizeStr = (result.sizeBytes / (1024 * 1024)).toFixed(2);
      setExportMessage({
        type: "success",
        text: `Export successful! Downloaded ${result.fileName} (${sizeStr} MB).`,
      });
    } catch (err: any) {
      console.error("Export error:", err);
      setExportMessage({
        type: "error",
        text: `Export failed: ${err.message || "Unknown error occurred"}`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Direct Sheet Print Trigger (Browser Print Dialog with calibrated @page styling)
  const handlePrintSheet = async () => {
    if (photos.length === 0 || arrangement.placements.length === 0 || isExporting) {
      return;
    }

    setIsExporting(true);
    setExportMessage(null);
    let masterCanvas: any = null;

    try {
      const isTargetA4 = config.paperSize === "a4";
      const orientation = config.orientation;
      const isManualCols = typeof config.columnsMode === "number";
      const manualCols = isManualCols ? Math.min(4, Math.max(1, config.columnsMode as number)) : 4;
      const flatPhotos = flattenPhotoCopies(photos);
      const manualRows = Math.max(1, Math.ceil(Math.max(1, flatPhotos.length) / manualCols));

      const paperWidthInches = isTargetA4
        ? orientation === "landscape"
          ? SHEET_A4_LONG_EDGE_INCHES
          : SHEET_A4_SHORT_EDGE_INCHES
        : orientation === "landscape"
        ? SHEET_4X6_LONG_EDGE_INCHES
        : SHEET_4X6_SHORT_EDGE_INCHES;
      const paperHeightInches = isTargetA4
        ? orientation === "landscape"
          ? SHEET_A4_SHORT_EDGE_INCHES
          : SHEET_A4_LONG_EDGE_INCHES
        : orientation === "landscape"
        ? SHEET_4X6_SHORT_EDGE_INCHES
        : SHEET_4X6_LONG_EDGE_INCHES;

      const printSheetConfig: PhotoSheetConfig = {
        paperSize: config.paperSize,
        orientation,
        paperWidthInches,
        paperHeightInches,
        dpi: config.dpi,
        layoutMode: isManualCols ? "manual" : "auto",
        manualCols,
        manualRows,
        copies: Math.max(1, flatPhotos.length),
        centerAlignment: false,
        margins: config.margins,
        spacing: config.spacing,
        cutGuides: config.cutGuides,
      };

      const photoWidthMm = unitToMm(config.dimensions.width, config.dimensions.unit);
      const photoHeightMm = unitToMm(config.dimensions.height, config.dimensions.unit);

      const targetLayout = calculatePhotoSheetLayout(printSheetConfig, {
        widthMm: photoWidthMm,
        heightMm: photoHeightMm,
      });

      const exportSources = targetLayout.placements.map((p) => {
        if (p.index < flatPhotos.length) {
          return flatPhotos[p.index].imageElement || null;
        }
        return null;
      });

      masterCanvas = renderMasterSheetCanvas(
        exportSources,
        targetLayout,
        config.cutGuides,
        config.cutGuides.includeInExport
      );

      if (printImageUrlRef.current && printImageUrlRef.current.startsWith("blob:")) {
        revokeObjectUrlSafely(printImageUrlRef.current);
      }

      let dataUrl: string;
      if (masterCanvas instanceof HTMLCanvasElement) {
        dataUrl = masterCanvas.toDataURL("image/jpeg", 0.98);
      } else {
        const blob = await masterCanvas.convertToBlob({ type: "image/jpeg", quality: 0.98 });
        dataUrl = URL.createObjectURL(blob);
      }

      setPrintImageUrl(dataUrl);

      const isLandscape = config.orientation === "landscape";
      const pageSizeCss = isTargetA4
        ? isLandscape
          ? "A4 landscape"
          : "A4 portrait"
        : isLandscape
        ? "6in 4in landscape"
        : "4in 6in portrait";

      let styleEl = document.getElementById("dynamic-print-page-style") as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "dynamic-print-page-style";
        document.head.appendChild(styleEl);
      }
      styleEl.innerHTML = `@media print { @page { size: ${pageSizeCss}; margin: 0; } }`;

      setTimeout(() => {
        window.print();
        setIsExporting(false);
      }, 300);
    } catch (err: any) {
      console.error("Print generation failed:", err);
      setExportMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to prepare sheet for printing.",
      });
      setIsExporting(false);
    } finally {
      if (masterCanvas && masterCanvas instanceof HTMLCanvasElement) {
        releaseCanvasBuffer(masterCanvas);
      }
    }
  };

  const printModalConfig: PhotoSheetConfig = useMemo(() => {
    const isTargetA4 = config.paperSize === "a4";
    const orientation = config.orientation;
    const isManualCols = typeof config.columnsMode === "number";
    const manualCols = isManualCols ? Math.min(4, Math.max(1, config.columnsMode as number)) : 4;
    const flatPhotos = flattenPhotoCopies(photos);
    const manualRows = Math.max(1, Math.ceil(Math.max(1, flatPhotos.length) / manualCols));

    const paperWidthInches = isTargetA4
      ? orientation === "landscape"
        ? SHEET_A4_LONG_EDGE_INCHES
        : SHEET_A4_SHORT_EDGE_INCHES
      : orientation === "landscape"
      ? SHEET_4X6_LONG_EDGE_INCHES
      : SHEET_4X6_SHORT_EDGE_INCHES;
    const paperHeightInches = isTargetA4
      ? orientation === "landscape"
        ? SHEET_A4_SHORT_EDGE_INCHES
        : SHEET_A4_LONG_EDGE_INCHES
      : orientation === "landscape"
      ? SHEET_4X6_SHORT_EDGE_INCHES
      : SHEET_4X6_LONG_EDGE_INCHES;

    return {
      paperSize: config.paperSize,
      orientation,
      paperWidthInches,
      paperHeightInches,
      dpi: config.dpi,
      layoutMode: isManualCols ? "manual" : "auto",
      manualCols,
      manualRows,
      copies: Math.max(1, flatPhotos.length),
      centerAlignment: false,
      margins: config.margins,
      spacing: config.spacing,
      cutGuides: config.cutGuides,
    };
  }, [config, photos]);

  const isA4 = config.paperSize === "a4";
  const paperTitle = isA4
    ? `A4 Sheet (${config.orientation === "landscape" ? "297 × 210 mm" : "210 × 297 mm"})`
    : `4×6″ Photo Paper (${config.orientation === "landscape" ? "152.4 × 101.6 mm" : "101.6 × 152.4 mm"})`;

  return (
    <div className={cn("space-y-5", className)}>
      {/* 1. Main Preview Card */}
      <div className="bg-white rounded-3xl border border-surface-200 p-5 sm:p-6 shadow-card space-y-4">
        {/* Preview Header & Zoom Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
              <Printer className="w-4 h-4 text-brand-600" />
              <span>Live Generated Sheet Preview</span>
            </h3>
            <p className="text-xs text-surface-500">{paperTitle} • {config.dpi} DPI</p>
          </div>

          {/* Interactive Zoom Controls */}
          <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.4}
              className="p-1.5 rounded-lg text-surface-600 hover:text-surface-900 hover:bg-white disabled:opacity-40 transition-colors shadow-2xs"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-bold text-surface-800 px-2 min-w-14 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 3.0}
              className="p-1.5 rounded-lg text-surface-600 hover:text-surface-900 hover:bg-white disabled:opacity-40 transition-colors shadow-2xs"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg text-surface-600 hover:text-surface-900 hover:bg-white transition-colors shadow-2xs ml-0.5"
              title="Reset Zoom (100%)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live HUD Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-surface-50 border border-surface-200">
            <span className="text-[10px] text-surface-500 uppercase font-mono block">
              Paper Size
            </span>
            <span className="font-bold text-surface-900">
              {config.paperSize.toUpperCase()} ({config.orientation})
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-50 border border-surface-200">
            <span className="text-[10px] text-surface-500 uppercase font-mono block">
              Photo Size
            </span>
            <span className="font-bold text-surface-900 font-mono">
              {config.dimensions.width} × {config.dimensions.height} {config.dimensions.unit}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-50 border border-surface-200">
            <span className="text-[10px] text-surface-500 uppercase font-mono block">
              Copies Placed
            </span>
            <span className="font-bold text-brand-700 font-mono">
              {arrangement.totalPlacedPhotos} / {arrangement.totalRequestedCopies} copies
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-50 border border-surface-200">
            <span className="text-[10px] text-surface-500 uppercase font-mono block">
              Sheet Capacity
            </span>
            <span className="font-bold text-surface-900 font-mono">
              {arrangement.layout.maxCapacity} photos max
            </span>
          </div>
        </div>

        {/* Capacity Warning Banner */}
        {arrangement.isCapacityExceeded && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-amber-950">
                Sheet Capacity Limit ({arrangement.layout.maxCapacity} Photos)
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                You requested {arrangement.totalRequestedCopies} copies, but this {config.paperSize.toUpperCase()} sheet can hold a maximum of {arrangement.layout.maxCapacity} photos with your margins and spacing. {arrangement.totalPlacedPhotos} copies will be printed, and {arrangement.unplacedCopiesCount} unplaced.
              </p>
            </div>
          </div>
        )}

        {/* Scaled Preview Canvas Viewport */}
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
            "relative w-full h-[360px] sm:h-[460px] rounded-2xl bg-surface-100/70 border border-surface-200 overflow-hidden flex items-center justify-center p-4 transition-colors select-none",
            zoom > 1.0 ? "cursor-grab active:cursor-grabbing" : "cursor-default"
          )}
        >
          {photos.length === 0 ? (
            <div className="text-center space-y-2 p-6 max-w-sm">
              <div className="w-12 h-12 rounded-2xl bg-surface-200/80 text-surface-500 flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-surface-800">
                No Photographs Uploaded
              </h4>
              <p className="text-xs text-surface-500">
                Upload one or more photos above to generate your live print sheet preview in real time.
              </p>
            </div>
          ) : (
            <div
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.15s ease-out",
              }}
              className="relative shadow-xl rounded-sm bg-white"
            >
              <canvas
                ref={canvasRef}
                className="max-h-[320px] sm:max-h-[420px] w-auto h-auto object-contain block rounded-xs"
              />
            </div>
          )}

          {/* Quick Zoom Indicator Floating Pill */}
          {photos.length > 0 && zoom > 1.0 && (
            <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-surface-900/80 text-white text-[10px] font-mono backdrop-blur-xs">
              Pan: Drag to inspect
            </div>
          )}
        </div>
      </div>

      {/* 2. Export Actions Card */}
      <div className="bg-white rounded-3xl border border-surface-200 p-5 sm:p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-surface-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-surface-900">
                Export Print Sheet
              </h4>
              <p className="text-xs text-surface-500">
                Calibrated 1:1 physical vector PDF and high-res raster formats.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Zero-Upload Export
          </span>
        </div>

        {/* Feedback Message */}
        {exportMessage && (
          <div
            className={cn(
              "p-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-fadeIn",
              exportMessage.type === "success"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                : "bg-red-50 text-red-900 border border-red-200"
            )}
          >
            {exportMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{exportMessage.text}</span>
          </div>
        )}

        {/* Direct Print & Preview Action Buttons */}
        <div className="pt-1 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={photos.length === 0 || isExporting}
              onClick={handlePrintSheet}
              className="w-full py-4 px-4 rounded-2xl bg-surface-900 hover:bg-black text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
            >
              <Printer className="w-5 h-5 text-brand-400" />
              <span>Print Sheet</span>
            </button>

            <button
              type="button"
              disabled={photos.length === 0 || isExporting}
              onClick={() => setIsPrintPreviewOpen(true)}
              className="w-full py-4 px-4 rounded-2xl bg-surface-100 hover:bg-surface-200 text-surface-800 font-bold text-sm sm:text-base flex items-center justify-center gap-2 border border-surface-200 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
            >
              <Maximize2 className="w-4 h-4 text-brand-600" />
              <span>1:1 Print Preview</span>
            </button>
          </div>
        </div>

        {/* Primary Download Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Download Current Paper PDF */}
          <button
            type="button"
            disabled={photos.length === 0 || isExporting}
            onClick={() => executeExport(config.paperSize, "pdf")}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed group"
          >
            <Printer className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>
              {isExporting ? "Rendering PDF..." : `Download ${isA4 ? "A4" : "4×6″"} PDF`}
            </span>
          </button>

          {/* Download Alternative Paper PDF */}
          <button
            type="button"
            disabled={photos.length === 0 || isExporting}
            onClick={() => executeExport(isA4 ? "4x6" : "a4", "pdf")}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-surface-100 hover:bg-surface-200 active:bg-surface-300 disabled:opacity-50 text-surface-800 font-bold text-sm transition-all shadow-xs disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4 text-surface-600" />
            <span>
              {isExporting ? "Rendering..." : `Download ${isA4 ? "4×6″" : "A4"} PDF`}
            </span>
          </button>
        </div>

        {/* Secondary Image Exports: PNG & JPEG */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            disabled={photos.length === 0 || isExporting}
            onClick={() => executeExport(config.paperSize, "png")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-surface-200 hover:border-brand-300 hover:bg-brand-50/50 disabled:opacity-50 text-surface-800 hover:text-brand-700 font-semibold text-xs transition-all shadow-xs disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download High-Res PNG ({config.dpi} DPI)</span>
          </button>

          <button
            type="button"
            disabled={photos.length === 0 || isExporting}
            onClick={() => executeExport(config.paperSize, "jpeg")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-surface-200 hover:border-brand-300 hover:bg-brand-50/50 disabled:opacity-50 text-surface-800 hover:text-brand-700 font-semibold text-xs transition-all shadow-xs disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download High-Res JPEG ({config.dpi} DPI)</span>
          </button>
        </div>

        {/* Print Guideline Advice */}
        <div className="p-3.5 rounded-2xl bg-surface-50 border border-surface-200 text-xs text-surface-600 space-y-1">
          <p className="font-bold text-surface-800">
            Printer Calibration Tip for 100% Physical Accuracy:
          </p>
          <p className="text-[11px] leading-relaxed">
            In your printer dialog, always select <span className="font-semibold text-surface-900">Actual Size (100%)</span> and uncheck &quot;Fit to Page&quot; or &quot;Shrink to Printable Area&quot; so photos print at exact physical dimensions.
          </p>
        </div>
      </div>

      {/* Interactive 1:1 Print Preview & Calibration Modal */}
      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        config={printModalConfig}
        layout={arrangement.layout}
        imageSource={imageSources}
        onPrintNow={() => {
          setIsPrintPreviewOpen(false);
          handlePrintSheet();
        }}
        onDownloadPdf={() => {
          setIsPrintPreviewOpen(false);
          executeExport(config.paperSize, "pdf");
        }}
        isExporting={isExporting}
      />

      {/* Hidden-on-Screen Printable Container for High-DPI Physical Print Output */}
      <div id="printable-sheet-container" className="hidden print:flex">
        {printImageUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={printImageUrl}
            alt="Printable Photo Sheet"
            className="w-full h-full object-contain"
          />
        )}
      </div>
    </div>
  );
};
