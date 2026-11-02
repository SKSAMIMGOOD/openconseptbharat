"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  PhotoSheetConfig,
  SheetPaperSize,
  SheetExportFormat,
  SheetCalculationResult,
} from "@/types/photo-sheet";
import {
  DEFAULT_A4_SHEET_CONFIG,
  DEFAULT_PHOTO_SHEET_CONFIG,
} from "@/constants/photo-sheet";
import { calculatePhotoSheetLayout } from "@/lib/photo-studio/sheet-calculator";
import { renderScaledSheetPreview } from "@/lib/photo-studio/sheet-renderer";
import {
  exportSheetAsPdf,
  exportSheetAsImage,
  downloadSheet,
} from "@/lib/photo-studio/sheet-exporter";
import { SheetControlsPanel } from "./SheetControlsPanel";
import { SheetPreviewPanel } from "./SheetPreviewPanel";
import {
  Crop,
  AlertCircle,
  CheckCircle2,
  Printer,
  Sparkles,
  ArrowLeft,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface PhotoSheetWorkspaceProps {
  croppedCanvas: HTMLCanvasElement | OffscreenCanvas | null;
  presetName: string;
  photoDimensionsMm: { width: number; height: number };
  initialPaperSize?: SheetPaperSize;
  initialDpi?: number;
  onNavigateToCrop: () => void;
  className?: string;
}

export const PhotoSheetWorkspace: React.FC<PhotoSheetWorkspaceProps> = ({
  croppedCanvas,
  presetName,
  photoDimensionsMm,
  initialPaperSize = "a4",
  initialDpi,
  onNavigateToCrop,
  className,
}) => {
  // Sheet configuration state - default to A4 (Phase 03E) or initialPaperSize
  const [sheetConfig, setSheetConfig] = useState<PhotoSheetConfig>(() => {
    const base =
      initialPaperSize === "4x6"
        ? { ...DEFAULT_PHOTO_SHEET_CONFIG, paperSize: "4x6" as const }
        : { ...DEFAULT_A4_SHEET_CONFIG, paperSize: "a4" as const };
    if (initialDpi) {
      return { ...base, dpi: initialDpi };
    }
    return base;
  });

  const [exportFormat, setExportFormat] = useState<SheetExportFormat>("application/pdf");
  const [jpegQuality, setJpegQuality] = useState<number>(0.95);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Scaled preview canvas ref
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Sync initialDpi if passed externally
  useEffect(() => {
    if (initialDpi) {
      setSheetConfig((prev) => ({
        ...prev,
        dpi: initialDpi,
      }));
    }
  }, [initialDpi]);

  // Synchronize paper size if initialPaperSize changes externally
  useEffect(() => {
    if (initialPaperSize && sheetConfig.paperSize !== initialPaperSize) {
      if (initialPaperSize === "a4") {
        setSheetConfig((prev) => ({
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: "a4",
          copies: Math.max(prev.copies, 24),
        }));
      } else {
        setSheetConfig((prev) => ({
          ...DEFAULT_PHOTO_SHEET_CONFIG,
          paperSize: "4x6",
          copies: Math.min(prev.copies, 8),
        }));
      }
    }
  }, [initialPaperSize, sheetConfig.paperSize]);

  // Calculate layout whenever config or photo dimensions change
  const layout: SheetCalculationResult = useMemo(() => {
    return calculatePhotoSheetLayout(sheetConfig, {
      widthMm: photoDimensionsMm.width,
      heightMm: photoDimensionsMm.height,
    });
  }, [sheetConfig, photoDimensionsMm]);

  // Render scaled preview canvas in real-time
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    if (!croppedCanvas || layout.totalPhotos === 0 || layout.isOverflowing) {
      // Clear preview canvas
      canvas.width = 600;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 600, 400);
      }
      return;
    }

    renderScaledSheetPreview(
      canvas,
      croppedCanvas,
      layout,
      sheetConfig.cutGuides,
      760
    );
  }, [croppedCanvas, layout, sheetConfig.cutGuides]);

  // Handle Export Download
  const handleExport = useCallback(async () => {
    if (!croppedCanvas || layout.totalPhotos === 0 || layout.isOverflowing) {
      return;
    }

    setIsExporting(true);
    setExportMessage(null);

    const isA4 = (layout.paperSize || "a4") === "a4";
    const paperName = isA4 ? "A4" : "4×6″";
    const pageDimText = isA4 ? "210 × 297 mm" : "6 × 4 inches";

    try {
      if (exportFormat === "application/pdf") {
        const result = await exportSheetAsPdf(
          croppedCanvas,
          layout,
          sheetConfig,
          {
            format: "application/pdf",
            quality: jpegQuality,
            includeCutGuides: sheetConfig.cutGuides.includeInExport,
          }
        );
        downloadSheet(result);
        setExportMessage({
          type: "success",
          text: `Print-ready ${paperName} PDF exported successfully (${result.fileName}). Exact page dimensions: ${pageDimText} (${result.pageWidthPt} × ${result.pageHeightPt} pt).`,
        });
      } else {
        const result = await exportSheetAsImage(
          croppedCanvas,
          layout,
          sheetConfig,
          {
            format: exportFormat,
            quality: jpegQuality,
            includeCutGuides: sheetConfig.cutGuides.includeInExport,
          }
        );
        downloadSheet(result);
        setExportMessage({
          type: "success",
          text: `${paperName} photo sheet exported successfully (${result.widthPx} × ${result.heightPx} px @ ${layout.dpi} DPI).`,
        });
      }
    } catch (err) {
      setExportMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to generate print sheet.",
      });
    } finally {
      setIsExporting(false);
    }
  }, [croppedCanvas, layout, sheetConfig, exportFormat, jpegQuality]);

  // Empty state if user navigated without a cropped photo
  if (!croppedCanvas) {
    return (
      <div className="bg-white rounded-3xl border border-surface-200 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-card space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center mx-auto shadow-sm">
          <Crop className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-surface-900">
            No Cropped Photograph Selected
          </h3>
          <p className="text-sm text-surface-500 max-w-md mx-auto leading-relaxed">
            The A4 photo sheet generator arranges your active cropped photograph from Step 1. Please upload and frame your portrait first.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={onNavigateToCrop}
            className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-600/20 transition-all hover:scale-[1.02]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Step 1: Crop & Framing</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-surface-200 shadow-sm">
        <button
          type="button"
          onClick={onNavigateToCrop}
          className="inline-flex items-center gap-2 text-xs font-bold text-surface-700 hover:text-brand-600 transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Back to Step 1: Crop & Framing</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cropped Photo Ready</span>
          </span>
          <span className="text-surface-300">•</span>
          <span className="text-surface-600">
            {presetName} ({photoDimensionsMm.width} × {photoDimensionsMm.height} mm)
          </span>
        </div>
      </div>

      {/* Export Feedback Banner */}
      {exportMessage && (
        <div
          className={cn(
            "p-4 rounded-2xl border flex items-start gap-3 shadow-sm animate-in fade-in text-xs",
            exportMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-950"
              : "bg-rose-50 border-rose-200 text-rose-950"
          )}
        >
          {exportMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0 font-medium">{exportMessage.text}</div>
          <button
            type="button"
            onClick={() => setExportMessage(null)}
            className="text-xs font-bold hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2-Column Responsive Workspace Grid: LEFT PANEL (5 cols) + RIGHT PANEL (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT PANEL (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          <SheetControlsPanel
            config={sheetConfig}
            layout={layout}
            photoPresetName={presetName}
            photoDimensionsMm={photoDimensionsMm}
            exportFormat={exportFormat}
            jpegQuality={jpegQuality}
            isExporting={isExporting}
            onConfigChange={setSheetConfig}
            onExportFormatChange={setExportFormat}
            onJpegQualityChange={setJpegQuality}
            onExportClick={handleExport}
            onNavigateToCrop={onNavigateToCrop}
          />
        </div>

        {/* RIGHT PANEL (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          <SheetPreviewPanel
            canvasRef={previewCanvasRef}
            config={sheetConfig}
            layout={layout}
            exportFormat={exportFormat}
            isExporting={isExporting}
            onExportClick={handleExport}
          />
        </div>
      </div>
    </div>
  );
};
