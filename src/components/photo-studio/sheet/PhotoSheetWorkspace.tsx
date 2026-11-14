"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  PhotoSheetConfig,
  SheetPaperSize,
  SheetExportFormat,
  SheetExportResult,
  SheetCalculationResult,
} from "@/types/photo-sheet";
import {
  DEFAULT_A4_SHEET_CONFIG,
  DEFAULT_PHOTO_SHEET_CONFIG,
} from "@/constants/photo-sheet";
import { calculatePhotoSheetLayout } from "@/lib/photo-studio/sheet-calculator";
import {
  renderScaledSheetPreview,
  renderMasterSheetCanvas,
} from "@/lib/photo-studio/sheet-renderer";
import {
  exportMultiSheetAsPdf,
  exportSheetAsImage,
  downloadSheet,
} from "@/lib/photo-studio/sheet-exporter";
import { exportCanvasToBlob } from "@/lib/image/exporter";
import {
  PHOTO_STUDIO_PRINT_SCOPE_CLASS,
  PHOTO_STUDIO_PRINT_STYLE_ID,
  injectScopedPrintPageStyle,
  nextAnimationFrame,
  removeScopedPrintPageStyle,
  resolvePhotoStudioPageGeometry,
  waitForPrintImagesReady,
} from "@/lib/photo-studio/print-workflow";
import { SheetControlsPanel } from "./SheetControlsPanel";
import { SheetPreviewPanel } from "./SheetPreviewPanel";
import { PrintPreviewModal } from "./PrintPreviewModal";
import { PrintContainer } from "@/components/common/PrintContainer";
import {
  createTrackedObjectURL,
  releaseCanvasBuffer,
  revokeObjectUrlSafely,
} from "@/lib/utils/memory";
import { usePreferences } from "@/hooks/usePreferences";
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
  onPaperSizeChange?: (paperSize: SheetPaperSize) => void;
  onDpiChange?: (dpi: number) => void;
  className?: string;
}

export const PhotoSheetWorkspace: React.FC<PhotoSheetWorkspaceProps> = ({
  croppedCanvas,
  presetName,
  photoDimensionsMm,
  initialPaperSize = "a4",
  initialDpi,
  onNavigateToCrop,
  onPaperSizeChange,
  onDpiChange,
  className,
}) => {
  const { settings: userPreferences } = usePreferences();

  // Sheet configuration state - default to A4 (Phase 03E) or initialPaperSize
  const [sheetConfig, setSheetConfig] = useState<PhotoSheetConfig>(() => {
    const effectiveDpi = initialDpi || userPreferences.defaultDpi || 300;
    const base =
      initialPaperSize === "4x6"
        ? { ...DEFAULT_PHOTO_SHEET_CONFIG, paperSize: "4x6" as const, dpi: effectiveDpi }
        : { ...DEFAULT_A4_SHEET_CONFIG, paperSize: "a4" as const, dpi: effectiveDpi };
    return base;
  });

  const prevInitialPaperSizeRef = useRef<SheetPaperSize>(initialPaperSize);

  const [exportFormat, setExportFormat] = useState<SheetExportFormat>("application/pdf");
  const [jpegQuality, setJpegQuality] = useState<number>(
    userPreferences.defaultJpegQuality || 0.95
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
    canDownloadPdfFallback?: boolean;
  } | null>(null);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);
  const [modalPageIndex, setModalPageIndex] = useState<number>(0);
  const [printImageUrls, setPrintImageUrls] = useState<string[]>([]);
  const printImageUrlsRef = useRef<string[]>([]);
  printImageUrlsRef.current = printImageUrls;
  const afterPrintCleanupRef = useRef<(() => void) | null>(null);

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

  // Synchronize paper size when initialPaperSize changes externally (e.g. user switched step tabs)
  useEffect(() => {
    if (initialPaperSize && initialPaperSize !== prevInitialPaperSizeRef.current) {
      prevInitialPaperSizeRef.current = initialPaperSize;
      if (initialPaperSize === "a4") {
        setSheetConfig((prev) => ({
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: "a4",
          dpi: prev.dpi,
          copies:
            prev.copies === 12 || prev.copies === 8 || prev.copies === 6 || prev.copies === 24
              ? 56
              : prev.copies,
        }));
      } else {
        setSheetConfig((prev) => ({
          ...DEFAULT_PHOTO_SHEET_CONFIG,
          paperSize: "4x6",
          dpi: prev.dpi,
          copies:
            prev.copies === 56 || prev.copies === 24 || prev.copies === 8 || prev.copies === 6
              ? 12
              : Math.min(prev.copies, 12),
        }));
      }
    }
  }, [initialPaperSize]);

  // Wrapper for config changes that keeps paperSize & DPI synced with parent
  const handleConfigChange = useCallback(
    (updater: (prev: PhotoSheetConfig) => PhotoSheetConfig) => {
      setSheetConfig((prev) => {
        const next = updater(prev);
        const nextPaperSize: SheetPaperSize = next.paperSize || "a4";
        if (nextPaperSize !== prev.paperSize) {
          prevInitialPaperSizeRef.current = nextPaperSize;
          onPaperSizeChange?.(nextPaperSize);
        }
        if (next.dpi !== prev.dpi) {
          onDpiChange?.(next.dpi);
        }
        return next;
      });
    },
    [onPaperSizeChange, onDpiChange]
  );

  // Clean up print image URLs, afterprint listener, and scoped @page style on unmount
  useEffect(() => {
    return () => {
      if (afterPrintCleanupRef.current && typeof window !== "undefined") {
        window.removeEventListener("afterprint", afterPrintCleanupRef.current);
        afterPrintCleanupRef.current = null;
      }
      removeScopedPrintPageStyle(PHOTO_STUDIO_PRINT_STYLE_ID);
      printImageUrlsRef.current.forEach((url) => {
        if (url && url.startsWith("blob:")) {
          revokeObjectUrlSafely(url);
        }
      });
    };
  }, []);

  // Calculate effective photo dimensions and preset name per paper size defaults
  const effectivePhotoDimensions = useMemo(() => {
    if (
      sheetConfig.paperSize === "a4" &&
      (presetName === "27 mm × 32 mm" || presetName === "Default Compact (1.1 × 1.35 in)")
    ) {
      return { width: 26.94, height: 32.33 };
    }
    if (
      sheetConfig.paperSize === "4x6" &&
      (presetName === "27 mm × 32 mm" || presetName === "Default Compact (1.1 × 1.35 in)")
    ) {
      return { width: 27.94, height: 34.29 };
    }
    return photoDimensionsMm;
  }, [sheetConfig.paperSize, presetName, photoDimensionsMm]);

  const effectivePresetName = useMemo(() => {
    if (
      sheetConfig.paperSize === "a4" &&
      (presetName === "Default Compact (1.1 × 1.35 in)" || presetName === "27 mm × 32 mm")
    ) {
      return "27 mm × 32 mm";
    }
    if (
      sheetConfig.paperSize === "4x6" &&
      (presetName === "27 mm × 32 mm" || presetName === "Default Compact (1.1 × 1.35 in)")
    ) {
      return "Default Compact (1.1 × 1.35 in)";
    }
    return presetName;
  }, [sheetConfig.paperSize, presetName]);

  // Calculate layout whenever config or photo dimensions change
  const layout: SheetCalculationResult = useMemo(() => {
    return calculatePhotoSheetLayout(sheetConfig, {
      widthMm: effectivePhotoDimensions.width,
      heightMm: effectivePhotoDimensions.height,
    });
  }, [sheetConfig, effectivePhotoDimensions]);

  // Multi-sheet pagination for Photo Studio:
  // If copies fit on 1 sheet, exactly 1 sheet is generated.
  // If copies exceed sheet capacity, cleanly shift remaining copies to next sheet(s).
  const multiSheetPages = useMemo(() => {
    const maxCap = Math.max(1, layout.maxCapacity);
    const req = Math.max(1, Math.round(sheetConfig.copies) || 1);
    const total = Math.max(1, Math.ceil(req / maxCap));
    const pages = [];
    for (let p = 0; p < total; p++) {
      const pageCopies = Math.min(maxCap, req - p * maxCap);
      const pageLayout = calculatePhotoSheetLayout(
        { ...sheetConfig, copies: pageCopies },
        { widthMm: effectivePhotoDimensions.width, heightMm: effectivePhotoDimensions.height }
      );
      pages.push({ pageIndex: p, totalPages: total, layout: pageLayout });
    }
    return pages;
  }, [sheetConfig, layout.maxCapacity, effectivePhotoDimensions]);

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

  // Shared calibrated PDF generator used by Download PDF and PDF-first Print Sheet
  const generateMultiSheetPrintPdf = useCallback(async (): Promise<SheetExportResult> => {
    if (!croppedCanvas) {
      throw new Error("Cropped photograph is not ready.");
    }
    return exportMultiSheetAsPdf(
      multiSheetPages.map((p) => ({ imageSource: croppedCanvas, layout: p.layout })),
      sheetConfig,
      {
        format: "application/pdf",
        quality: jpegQuality,
        includeCutGuides: sheetConfig.cutGuides.includeInExport,
      }
    );
  }, [croppedCanvas, multiSheetPages, sheetConfig, jpegQuality]);

  // Handle Export Download (multi-page calibrated PDF or high-resolution raster image)
  const handleExport = useCallback(async () => {
    if (!croppedCanvas || layout.totalPhotos === 0 || layout.isOverflowing || isExporting) {
      return;
    }

    setIsExporting(true);
    setExportMessage(null);

    const pageGeometry = resolvePhotoStudioPageGeometry(
      layout.paperSize || "a4",
      sheetConfig.orientation
    );
    const paperName = (layout.paperSize || "a4") === "a4" ? "A4" : "4×6″";

    try {
      if (exportFormat === "application/pdf") {
        const result = await generateMultiSheetPrintPdf();
        downloadSheet(result);
        const totalSheets = result.pageCount ?? multiSheetPages.length;
        setExportMessage({
          type: "success",
          text: `Print-ready ${paperName} PDF exported successfully (${result.fileName}). Exact page dimensions: ${pageGeometry.dimensionsLabel} (${result.pageWidthPt} × ${result.pageHeightPt} pt). Total sheets: ${totalSheets}.`,
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
  }, [
    croppedCanvas,
    layout,
    sheetConfig,
    exportFormat,
    jpegQuality,
    isExporting,
    multiSheetPages.length,
    generateMultiSheetPrintPdf,
  ]);

  // Handle Direct Export as PDF (Calibrated multi-page print document)
  const handleExportPdf = useCallback(async () => {
    if (!croppedCanvas || layout.totalPhotos === 0 || layout.isOverflowing || isExporting) {
      return;
    }

    setIsExporting(true);
    setExportMessage(null);
    const pageGeometry = resolvePhotoStudioPageGeometry(
      layout.paperSize || "a4",
      sheetConfig.orientation
    );
    const paperName = (layout.paperSize || "a4") === "a4" ? "A4" : "4×6″";

    try {
      const result = await generateMultiSheetPrintPdf();
      downloadSheet(result);
      const totalSheets = result.pageCount ?? multiSheetPages.length;
      setExportMessage({
        type: "success",
        text: `Print-ready ${paperName} PDF exported successfully (${result.fileName}). Exact page dimensions: ${pageGeometry.dimensionsLabel} (${result.pageWidthPt} × ${result.pageHeightPt} pt). Total sheets: ${totalSheets}.`,
      });
    } catch (err) {
      setExportMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to generate print PDF.",
      });
    } finally {
      setIsExporting(false);
    }
  }, [
    croppedCanvas,
    layout,
    sheetConfig.orientation,
    isExporting,
    multiSheetPages.length,
    generateMultiSheetPrintPdf,
  ]);

  // Restored Direct Browser Printing Workflow: prepares sheet HTML in print container and invokes window.print()
  const handlePrintSheet = useCallback(async () => {
    if (!croppedCanvas || layout.totalPhotos === 0 || layout.isOverflowing || isExporting) {
      return;
    }

    setIsExporting(true);
    setExportMessage(null);

    if (afterPrintCleanupRef.current && typeof window !== "undefined") {
      window.removeEventListener("afterprint", afterPrintCleanupRef.current);
      afterPrintCleanupRef.current = null;
    }

    printImageUrlsRef.current.forEach((url) => {
      if (url && url.startsWith("blob:")) {
        revokeObjectUrlSafely(url);
      }
    });

    const renderedUrls: string[] = [];

    try {
      // Allow any closing modal (e.g. 1:1 Print Preview modal) to flush before rendering print DOM
      await nextAnimationFrame();
      await nextAnimationFrame();

      for (const page of multiSheetPages) {
        const masterCanvas = renderMasterSheetCanvas(
          croppedCanvas,
          page.layout,
          sheetConfig.cutGuides,
          sheetConfig.cutGuides.includeInExport
        );

        try {
          const jpegBlob = await exportCanvasToBlob(masterCanvas, {
            format: "image/jpeg",
            quality: 0.98,
            backgroundColor: "#ffffff",
            dpi: page.layout.dpi,
          });
          renderedUrls.push(createTrackedObjectURL(jpegBlob));
        } finally {
          releaseCanvasBuffer(masterCanvas);
        }
      }

      const pageGeometry = resolvePhotoStudioPageGeometry(
        layout.paperSize || "a4",
        sheetConfig.orientation
      );

      injectScopedPrintPageStyle(pageGeometry.pageSizeCss, PHOTO_STUDIO_PRINT_STYLE_ID);
      setPrintImageUrls(renderedUrls);

      await waitForPrintImagesReady({
        expectedCount: renderedUrls.length,
        getContainer: () =>
          document.querySelector(
            `#printable-sheet-container.${PHOTO_STUDIO_PRINT_SCOPE_CLASS}`
          ),
      });

      const cleanupAfterPrint = () => {
        if (afterPrintCleanupRef.current && typeof window !== "undefined") {
          window.removeEventListener("afterprint", afterPrintCleanupRef.current);
          afterPrintCleanupRef.current = null;
        }
        removeScopedPrintPageStyle(PHOTO_STUDIO_PRINT_STYLE_ID);
        renderedUrls.forEach((url) => revokeObjectUrlSafely(url));
        setPrintImageUrls([]);
        setIsExporting(false);
      };

      afterPrintCleanupRef.current = cleanupAfterPrint;
      if (typeof window !== "undefined") {
        window.addEventListener("afterprint", cleanupAfterPrint, { once: true });
      }

      // Invoke native browser print dialog in the current tab
      window.print();
      setIsExporting(false);
    } catch (err) {
      console.error("Direct browser print preparation failed:", err);
      removeScopedPrintPageStyle(PHOTO_STUDIO_PRINT_STYLE_ID);
      renderedUrls.forEach((url) => revokeObjectUrlSafely(url));
      setPrintImageUrls([]);
      setExportMessage({
        type: "error",
        text:
          err instanceof Error
            ? `Failed to prepare print preview: ${err.message}. You can download the calibrated PDF instead.`
            : "Failed to prepare print preview. You can download the calibrated PDF instead.",
        canDownloadPdfFallback: true,
      });
      setIsExporting(false);
    }
  }, [croppedCanvas, layout, sheetConfig, isExporting, multiSheetPages]);

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
            The photo sheet generator arranges your active cropped photograph from Step 1. Please upload and frame your portrait first.
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
            {effectivePresetName} ({effectivePhotoDimensions.width} × {effectivePhotoDimensions.height} mm)
          </span>
        </div>
      </div>

      {/* Export & Print Feedback Banner */}
      {exportMessage && (
        <div
          className={cn(
            "p-4 rounded-2xl border flex items-start gap-3 shadow-sm animate-in fade-in text-xs",
            exportMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-950"
              : exportMessage.type === "info"
              ? "bg-amber-50 border-amber-200 text-amber-950"
              : "bg-rose-50 border-rose-200 text-rose-950"
          )}
        >
          {exportMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle
              className={cn(
                "w-4 h-4 shrink-0 mt-0.5",
                exportMessage.type === "info" ? "text-amber-600" : "text-rose-600"
              )}
            />
          )}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="font-medium">{exportMessage.text}</div>
            {exportMessage.canDownloadPdfFallback && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExporting}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  Download Calibrated PDF
                </button>
              </div>
            )}
          </div>
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
            photoPresetName={effectivePresetName}
            photoDimensionsMm={effectivePhotoDimensions}
            exportFormat={exportFormat}
            jpegQuality={jpegQuality}
            isExporting={isExporting}
            onConfigChange={handleConfigChange}
            onExportFormatChange={setExportFormat}
            onJpegQualityChange={setJpegQuality}
            onExportClick={handleExport}
            onPrintClick={handlePrintSheet}
            onOpenPrintPreview={() => setIsPrintPreviewOpen(true)}
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
            onPrintClick={handlePrintSheet}
            onOpenPrintPreview={() => setIsPrintPreviewOpen(true)}
          />
        </div>
      </div>

      {/* Interactive 1:1 Print Preview & Calibration Modal */}
      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        config={sheetConfig}
        layout={multiSheetPages[modalPageIndex]?.layout || layout}
        imageSource={croppedCanvas}
        totalPages={multiSheetPages.length || 1}
        currentPage={modalPageIndex}
        onPageChange={setModalPageIndex}
        onPrintNow={() => {
          setIsPrintPreviewOpen(false);
          handlePrintSheet();
        }}
        onDownloadPdf={() => {
          setIsPrintPreviewOpen(false);
          handleExportPdf();
        }}
        isExporting={isExporting}
      />

      {/* Unified Portaled Printable Container for Direct Browser Printing (scoped to Photo Studio) */}
      <PrintContainer
        pageImages={printImageUrls}
        alt="Photo Sheet"
        scopeClassName={PHOTO_STUDIO_PRINT_SCOPE_CLASS}
        pagePhysicalSize={(() => {
          const geom = resolvePhotoStudioPageGeometry(
            layout.paperSize || "a4",
            sheetConfig.orientation
          );
          return { width: geom.widthCss, height: geom.heightCss };
        })()}
      />
    </div>
  );
};
