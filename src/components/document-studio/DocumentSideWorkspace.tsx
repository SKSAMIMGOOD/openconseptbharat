"use client";

import React, { useState, useEffect } from "react";
import {
  DocumentSide,
  DocumentSideResult,
  DocumentSourceFile,
  DocumentTypeDefinition,
  isEnhancementActive,
} from "@/types/document-studio";
import { CropCoordinates } from "@/types/crop";
import { cn } from "@/lib/utils/cn";
import { DocumentLightboxModal } from "./DocumentLightboxModal";
import {
  RefreshCw,
  Crop as CropIcon,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Eye,
  Maximize2,
  ChevronDown,
  Sliders,
  Upload,
  Download,
  Sparkles,
  Printer,
} from "lucide-react";

export interface DocumentSideWorkspaceProps {
  side: DocumentSide;
  sideResult: DocumentSideResult;
  sourceFile: DocumentSourceFile;
  docDef: DocumentTypeDefinition;
  otherCrop?: CropCoordinates | null;
  otherSideTitle?: string;
  onOpenCropEditor: (side: DocumentSide) => void;
  onCloseCropEditor: (side: DocumentSide) => void;
  onCropChange: (side: DocumentSide, crop: CropCoordinates) => void;
  onRotationChange: (side: DocumentSide, rotation: number) => void;
  onZoomChange: (side: DocumentSide, zoom: number) => void;
  onAspectRatioLockedChange: (side: DocumentSide, locked: boolean) => void;
  onApplyCrop: (side: DocumentSide, crop: CropCoordinates, rotation: number) => void;
  onAutoCrop: (side: DocumentSide) => void;
  onResetCrop: (side: DocumentSide) => void;
  onReplace?: () => void;
  onToggleView: (side: DocumentSide) => void;
  onRotateSide: (side: DocumentSide, direction: "cw" | "ccw") => void;
  onZoomSide: (side: DocumentSide, delta: number) => void;
  onDownloadSide?: (side: DocumentSide) => void;
  onToggleBeforeAfter?: (side: DocumentSide) => void;
  onOpenEnhancePanel?: (side: DocumentSide) => void;
  onOpenPrintPanel?: (side: DocumentSide) => void;
  className?: string;
}

export const DocumentSideWorkspace: React.FC<DocumentSideWorkspaceProps> = ({
  side,
  sideResult,
  sourceFile,
  docDef,
  otherCrop,
  otherSideTitle,
  onOpenCropEditor,
  onCloseCropEditor,
  onCropChange,
  onRotationChange,
  onZoomChange,
  onAspectRatioLockedChange,
  onApplyCrop,
  onAutoCrop,
  onResetCrop,
  onReplace,
  onToggleView,
  onRotateSide,
  onZoomSide,
  onDownloadSide,
  onToggleBeforeAfter,
  onOpenEnhancePanel,
  onOpenPrintPanel,
  className,
}) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const isFront = side === "front";
  const sideTitle = isFront ? "Front Side" : "Back Side";

  const isCropped = sideResult.isCropped && Boolean(sideResult.croppedPreviewUrl);
  const isViewingOriginal = sideResult.activeView === "original" && isCropped;
  const isViewingBefore = Boolean(sideResult.showBefore) && isCropped;
  const hasActiveEnhancements = isEnhancementActive(sideResult.enhancements);

  const [enhancedLoadFailed, setEnhancedLoadFailed] = useState(false);

  useEffect(() => {
    setEnhancedLoadFailed(false);
  }, [sideResult.enhancedPreviewUrl]);

  // Active preview image URL:
  // When cropped and not viewing full source page:
  // - If viewing Before (or no enhancements active or enhanced load failed): show clean cropped preview
  // - If viewing After and enhancements active: show enhanced preview
  const activePreviewUrl =
    isCropped && !isViewingOriginal
      ? isViewingBefore || !sideResult.enhancedPreviewUrl || !hasActiveEnhancements || enhancedLoadFailed
        ? sideResult.croppedPreviewUrl!
        : sideResult.enhancedPreviewUrl!
      : sourceFile.previewUrl;

  const displayDimensions =
    isCropped && !isViewingOriginal && sideResult.croppedDimensions
      ? sideResult.croppedDimensions
      : sourceFile.dimensions;

  return (
    <>
      {/* Lightbox Modal for enlarged view */}
      <DocumentLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        imageUrl={activePreviewUrl}
        title={`${sideTitle} — ${docDef.name}`}
        subtitle={
          isViewingOriginal
            ? "Full source document view"
            : `Cropped & isolated document side (${displayDimensions ? `${displayDimensions.width}×${displayDimensions.height}px` : ""})`
        }
        dimensions={displayDimensions}
        initialRotation={isViewingOriginal ? sideResult.rotation : 0}
      />

      <div
        className={cn(
          "flex flex-col bg-white dark:bg-surface-800/90 rounded-2xl border border-surface-200 dark:border-surface-700/80 shadow-subtle overflow-hidden transition-all",
          isCropped && "border-surface-300 dark:border-surface-600",
          className
        )}
      >
        {/* Compact Side Header Bar */}
        <div className="px-3.5 py-2 sm:px-4 sm:py-2.5 border-b border-surface-200/80 dark:border-surface-700 flex items-center justify-between gap-3 bg-surface-50/70 dark:bg-surface-800/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                isFront
                  ? "bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300"
                  : "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300"
              )}
            >
              {isFront ? "F" : "B"}
            </div>

            <div className="flex items-center gap-2 truncate">
              <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 truncate">
                {sideTitle}
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-200/70 dark:bg-surface-700 text-surface-700 dark:text-surface-300 shrink-0">
                {docDef.shortName}
              </span>
              {isCropped && (
                <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                  Cropped & Isolated • CR80 (85.60 × 53.98 mm)
                </span>
              )}
              {sideResult.printSettings && (
                <span className="hidden md:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/50 shrink-0 font-mono">
                  {sideResult.printSettings.widthMm.toFixed(1)}×{sideResult.printSettings.heightMm.toFixed(1)} mm • {sideResult.printSettings.dpi} DPI
                </span>
              )}
              {hasActiveEnhancements && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-800 dark:text-brand-300 border border-brand-300 dark:border-brand-800 shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-brand-600 dark:text-brand-400" />
                  <span>Enhanced</span>
                </span>
              )}
              {sideResult.isManualCrop && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 shrink-0">
                  Manual Crop
                </span>
              )}
            </div>
          </div>

          {/* Header Essential Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onDownloadSide && isCropped && (
              <button
                type="button"
                onClick={() => onDownloadSide(side)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100 transition-colors shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                title={`Download ${sideTitle} as standard CR80 card (85.60 × 53.98 mm)`}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save CR80</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenCropEditor(side)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-700 dark:text-brand-300 hover:text-brand-800 bg-brand-50 dark:bg-brand-950/60 border border-brand-200/80 dark:border-brand-800/60 hover:bg-brand-100 transition-colors shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              title={`Adjust crop boundaries for ${sideTitle}`}
            >
              <CropIcon className="w-3.5 h-3.5" />
              <span>Adjust Crop</span>
            </button>

            {onReplace && (
              <button
                type="button"
                onClick={onReplace}
                className="p-1.5 rounded-lg text-surface-600 dark:text-surface-300 hover:bg-surface-200/60 dark:hover:bg-surface-700 transition-colors"
                title="Replace document"
                aria-label="Replace document"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => onResetCrop(side)}
              className="p-1.5 rounded-lg text-surface-600 dark:text-surface-300 hover:bg-surface-200/60 dark:hover:bg-surface-700 transition-colors"
              title={`Reset ${sideTitle} crop`}
              aria-label={`Reset ${sideTitle} crop`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-center">
          {/* Loading State */}
          {sourceFile.isLoading && (
            <div className="py-24 px-4 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4 animate-spin">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-surface-900 dark:text-surface-100">
                Processing {sideTitle}...
              </h4>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 max-w-xs">
                Rendering canvas preview in browser memory.
              </p>
            </div>
          )}

          {/* Standard Isolated Large Crop Preview Mode */}
          {activePreviewUrl && (
            <div className="space-y-2.5">
              {/* Secondary Quick Controls Strip */}
              <div className="flex items-center justify-between gap-2 p-1 sm:p-1.5 rounded-xl bg-surface-50 dark:bg-surface-800/80 border border-surface-200/70 dark:border-surface-700 text-xs">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {/* Rotate Left CCW */}
                  <button
                    type="button"
                    onClick={() => onRotateSide(side, "ccw")}
                    className="p-1.5 rounded-lg bg-white dark:bg-surface-700 hover:bg-surface-100 text-surface-700 dark:text-surface-300 border border-surface-200/80 dark:border-surface-600 transition-colors shadow-2xs"
                    title="Rotate 90° Counterclockwise"
                    aria-label="Rotate Counterclockwise"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  {/* Rotate Right CW */}
                  <button
                    type="button"
                    onClick={() => onRotateSide(side, "cw")}
                    className="p-1.5 rounded-lg bg-white dark:bg-surface-700 hover:bg-surface-100 text-surface-700 dark:text-surface-300 border border-surface-200/80 dark:border-surface-600 transition-colors shadow-2xs"
                    title="Rotate 90° Clockwise"
                    aria-label="Rotate Clockwise"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>

                  <div className="h-3.5 w-px bg-surface-200 dark:bg-surface-700 mx-0.5" />

                  {/* Zoom Out */}
                  <button
                    type="button"
                    onClick={() => onZoomSide(side, -0.2)}
                    className="p-1.5 rounded-lg bg-white dark:bg-surface-700 hover:bg-surface-100 text-surface-700 dark:text-surface-300 border border-surface-200/80 dark:border-surface-600 transition-colors shadow-2xs"
                    title="Zoom Out"
                    aria-label="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>

                  {/* Zoom In */}
                  <button
                    type="button"
                    onClick={() => onZoomSide(side, 0.2)}
                    className="p-1.5 rounded-lg bg-white dark:bg-surface-700 hover:bg-surface-100 text-surface-700 dark:text-surface-300 border border-surface-200/80 dark:border-surface-600 transition-colors shadow-2xs"
                    title="Zoom In"
                    aria-label="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Right: Enhance shortcut, Before/After toggle, Enlarge in Lightbox & View Toggle */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {onOpenEnhancePanel && (
                    <button
                      type="button"
                      onClick={() => onOpenEnhancePanel(side)}
                      className={cn(
                        "px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-2xs",
                        hasActiveEnhancements
                          ? "bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800"
                          : "bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 border-surface-200/80 dark:border-surface-600 hover:bg-surface-100"
                      )}
                      title="Adjust Document Enhancements (Brightness, Contrast, Sharpness...)"
                    >
                      <Sliders className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      <span className="hidden sm:inline">Enhance</span>
                    </button>
                  )}

                  {onOpenPrintPanel && (
                    <button
                      type="button"
                      onClick={() => onOpenPrintPanel(side)}
                      className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-2xs bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 border-surface-200/80 dark:border-surface-600 hover:bg-surface-100"
                      title="Adjust Print Quality & Document Dimensions (DPI, mm, in, px)"
                    >
                      <Printer className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      <span className="hidden sm:inline">Size & DPI</span>
                    </button>
                  )}

                  {hasActiveEnhancements && onToggleBeforeAfter && isCropped && (
                    <button
                      type="button"
                      onClick={() => onToggleBeforeAfter(side)}
                      className={cn(
                        "px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-2xs",
                        isViewingBefore
                          ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 font-bold"
                          : "bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 border-surface-200/80 dark:border-surface-600 hover:bg-surface-100"
                      )}
                      title={
                        isViewingBefore
                          ? "Currently viewing original unenhanced crop (Before). Click to view Enhanced."
                          : "Currently viewing enhanced crop (After). Click to compare with original."
                      }
                    >
                      <Eye className="w-3.5 h-3.5 text-surface-500" />
                      <span>{isViewingBefore ? "Before" : "After"}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 border border-surface-200/80 dark:border-surface-600 hover:bg-surface-100 text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                    title="Enlarge preview in lightbox modal"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    <span className="hidden sm:inline">Enlarge</span>
                  </button>

                  {isCropped && (
                    <button
                      type="button"
                      onClick={() => onToggleView(side)}
                      className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 border border-surface-200/80 dark:border-surface-600 hover:bg-surface-100 text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                      title={isViewingOriginal ? "Switch to Cropped view" : "Switch to Source page view"}
                    >
                      <Eye className="w-3.5 h-3.5 text-surface-500" />
                      <span className="hidden sm:inline">{isViewingOriginal ? "Cropped" : "Full Page"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Compact Document Preview Container (Fits simultaneously on-screen with enhancement panel) */}
              <div
                onClick={() => setIsLightboxOpen(true)}
                className="group relative w-full rounded-2xl border border-surface-200 dark:border-surface-700/80 bg-surface-100/70 dark:bg-surface-900/90 p-2 sm:p-3 flex items-center justify-center min-h-[220px] sm:min-h-[250px] lg:min-h-[270px] max-h-[360px] overflow-hidden cursor-zoom-in transition-all hover:border-brand-300 dark:hover:border-brand-700 shadow-inner"
                title="Click to enlarge in lightbox modal"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activePreviewUrl}
                  alt={`${docDef.name} ${sideTitle} preview`}
                  onError={() => {
                    if (activePreviewUrl === sideResult.enhancedPreviewUrl) {
                      setEnhancedLoadFailed(true);
                    }
                  }}
                  className="max-w-full max-h-[240px] sm:max-h-[280px] w-auto h-auto object-contain rounded-xl shadow-md border border-surface-300/60 dark:border-surface-700 select-none transition-transform duration-200 group-hover:scale-[1.01]"
                  style={{
                    transform:
                      isViewingOriginal && sideResult.rotation !== 0
                        ? `rotate(${sideResult.rotation}deg) scale(${sideResult.zoom || 1})`
                        : `scale(${sideResult.zoom || 1})`,
                  }}
                />

                {/* Status Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap pointer-events-none">
                  {isCropped && !isViewingOriginal ? (
                    isViewingBefore ? (
                      <div className="bg-amber-600/95 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{sideTitle} • Before (Original)</span>
                      </div>
                    ) : hasActiveEnhancements ? (
                      <div className="bg-brand-600/95 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>{sideTitle} • Enhanced (After)</span>
                      </div>
                    ) : (
                      <div className="bg-emerald-600/95 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{sideTitle} Cropped</span>
                      </div>
                    )
                  ) : isCropped && isViewingOriginal ? (
                    <div className="bg-amber-600/95 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>Full Source Page</span>
                    </div>
                  ) : null}

                  {sideResult.rotation !== 0 && (
                    <div className="bg-surface-900/90 text-white text-[10px] font-mono px-2 py-0.5 rounded-full shadow-xs">
                      {sideResult.rotation}°
                    </div>
                  )}
                </div>

                {/* Hover Click-to-Enlarge Pill */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-900/85 backdrop-blur-sm text-white text-xs font-semibold shadow-md">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Click to enlarge</span>
                  </span>
                </div>
              </div>

              {/* Simplified Collapsible Technical Details & Coordinates */}
              <details className="group border border-surface-200/80 dark:border-surface-700/80 rounded-xl overflow-hidden text-xs bg-white dark:bg-surface-800/80 transition-all">
                <summary className="px-3.5 py-2 cursor-pointer font-semibold text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 flex items-center justify-between bg-surface-50/70 dark:bg-surface-800/50 select-none transition-colors">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-surface-700 dark:text-surface-300">
                    <Sliders className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    Technical Details & Coordinates
                  </span>
                  <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-surface-400" />
                </summary>

                <div className="p-3 bg-surface-50/40 dark:bg-surface-900/40 grid grid-cols-2 sm:grid-cols-3 gap-2 border-t border-surface-200/60 dark:border-surface-700/60 text-xs">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-surface-800 border border-surface-200/70 dark:border-surface-700 col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase font-bold text-surface-400 block tracking-wider">
                      Region Coordinates
                    </span>
                    <span className="font-semibold text-surface-800 dark:text-surface-200 block truncate mt-0.5 font-mono text-[11px]">
                      {sideResult.crop
                        ? `x:${sideResult.crop.x}, y:${sideResult.crop.y}`
                        : "—"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-surface-800 border border-surface-200/70 dark:border-surface-700">
                    <span className="text-[10px] uppercase font-bold text-surface-400 block tracking-wider">
                      Dimensions
                    </span>
                    <span className="font-semibold text-surface-800 dark:text-surface-200 block mt-0.5 text-[11px]">
                      {displayDimensions
                        ? `${displayDimensions.width} × ${displayDimensions.height} px`
                        : "—"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-surface-800 border border-surface-200/70 dark:border-surface-700">
                    <span className="text-[10px] uppercase font-bold text-surface-400 block tracking-wider">
                      Aspect Ratio
                    </span>
                    <span className="font-semibold text-surface-800 dark:text-surface-200 block mt-0.5 text-[11px]">
                      {displayDimensions
                        ? `${(displayDimensions.width / displayDimensions.height).toFixed(3)} (ISO ID-1)`
                        : "—"}
                    </span>
                  </div>

                  {sideResult.printSettings && (
                    <div className="p-2.5 rounded-lg bg-white dark:bg-surface-800 border border-surface-200/70 dark:border-surface-700 col-span-2 sm:col-span-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-surface-400 block tracking-wider">
                          Target Print Output ({sideResult.printSettings.dimensionPreset.toUpperCase()})
                        </span>
                        <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">
                          {sideResult.printSettings.dpi} DPI
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[11px]">
                        <span className="font-semibold text-surface-800 dark:text-surface-200">
                          {sideResult.printSettings.widthMm.toFixed(2)} × {sideResult.printSettings.heightMm.toFixed(2)} mm ({(sideResult.printSettings.widthMm / 25.4).toFixed(2)} × {(sideResult.printSettings.heightMm / 25.4).toFixed(2)} in)
                        </span>
                        <span className="font-mono text-surface-500">
                          {sideResult.printSettings.targetWidthPx} × {sideResult.printSettings.targetHeightPx} px
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
