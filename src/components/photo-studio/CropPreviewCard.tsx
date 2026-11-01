"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Maximize2,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ZoomIn,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { PhotoPreset } from "@/types/crop-preset";
import type { CropCoordinates } from "@/types/crop";
import type { ImageDimensions } from "@/types/image-engine";
import { renderCropCanvas } from "@/lib/crop/crop-geometry";
import { formatDimension } from "@/lib/crop/unit-converter";
import {
  calculatePixelDimensions,
  assessResolutionQuality,
  getFriendlyAspectRatioName,
} from "@/lib/photo-studio/dpi-calculator";

export interface CropPreviewCardProps {
  imageElement: HTMLImageElement | ImageBitmap | null;
  crop: CropCoordinates;
  preset: PhotoPreset;
  dpi: number;
  backgroundColor: string;
  originalDimensions?: ImageDimensions | null;
  currentZoom: number;
  cropMode: "fixed" | "free";
  className?: string;
}

export const CropPreviewCard: React.FC<CropPreviewCardProps> = ({
  imageElement,
  crop,
  preset,
  dpi,
  backgroundColor,
  originalDimensions,
  currentZoom,
  cropMode,
  className,
}) => {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Physical dimensions & Target print pixels calculation
  const targetWidthMm =
    preset.unit === "inch"
      ? preset.width * 25.4
      : preset.unit === "cm"
      ? preset.width * 10
      : preset.width;

  const targetHeightMm =
    preset.unit === "inch"
      ? preset.height * 25.4
      : preset.unit === "cm"
      ? preset.height * 10
      : preset.height;

  const targetCalculation = calculatePixelDimensions({
    widthMm: targetWidthMm,
    heightMm: targetHeightMm,
    dpi,
    roundingStrategy: "round",
  });

  // Calculate optical print resolution quality
  const qualityAssessment =
    originalDimensions && targetCalculation.isValid
      ? assessResolutionQuality(
          crop.width,
          crop.height,
          targetWidthMm,
          targetHeightMm,
          dpi
        )
      : null;

  // Render live crop slice onto preview canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !imageElement) return;

    try {
      setRenderError(null);

      // Render at a crisp preview size (preserving aspect ratio)
      const previewMax = 320;
      const cropRatio = crop.width / Math.max(1, crop.height);

      let outW: number;
      let outH: number;

      if (cropRatio > 1) {
        outW = previewMax;
        outH = Math.max(1, Math.round(outW / cropRatio));
      } else {
        outH = previewMax;
        outW = Math.max(1, Math.round(outH * cropRatio));
      }

      canvas.width = outW;
      canvas.height = outH;

      const renderedBuffer = renderCropCanvas(
        imageElement,
        crop,
        outW,
        outH,
        backgroundColor
      );

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, outW, outH);
        ctx.drawImage(renderedBuffer as any, 0, 0);
      }
    } catch (err) {
      setRenderError(
        err instanceof Error ? err.message : "Failed to render crop preview"
      );
    }
  }, [imageElement, crop, backgroundColor]);

  const activeAspectRatio = crop.width / Math.max(1, crop.height);
  const friendlyRatio = getFriendlyAspectRatioName(activeAspectRatio);

  return (
    <div
      className={cn(
        "bg-white rounded-3xl border border-surface-200 p-5 sm:p-6 shadow-card space-y-5",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-surface-100 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Crop Preview</span>
          </span>
          <h3 className="text-base sm:text-lg font-bold text-surface-900 mt-0.5">
            Final Composition
          </h3>
        </div>

        <span
          className={cn(
            "px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border",
            cropMode === "fixed"
              ? "bg-brand-50 text-brand-700 border-brand-200"
              : "bg-surface-100 text-surface-700 border-surface-200"
          )}
        >
          {cropMode === "fixed" ? "Fixed Aspect Ratio" : "Free Crop"}
        </span>
      </div>

      {/* Preview Viewport */}
      <div className="relative w-full aspect-[4/5] max-h-[340px] bg-surface-100 rounded-2xl border border-surface-200 flex items-center justify-center overflow-hidden shadow-inner p-4 select-none">
        {/* Transparency Checkerboard */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] [background-size:14px_14px] [background-position:0_0,0_7px,7px_-7px,-7px_0px] opacity-60 pointer-events-none" />

        {/* Live Canvas with photo border effect */}
        {imageElement ? (
          <div className="relative z-10 shadow-xl rounded-md overflow-hidden border-2 border-white ring-1 ring-surface-900/10 max-h-full max-w-full flex items-center justify-center">
            <canvas
              ref={previewCanvasRef}
              className="block max-h-[300px] max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="relative z-10 text-center text-surface-400 p-4">
            <Info className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
            <p className="text-xs">No active image crop</p>
          </div>
        )}

        {/* Background Color Indicator Tag */}
        {backgroundColor !== "transparent" && (
          <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-surface-200 text-[10px] font-mono text-surface-700 shadow-sm">
            <span
              className="w-2.5 h-2.5 rounded-full border border-surface-300 shrink-0"
              style={{ backgroundColor }}
            />
            <span>Backdrop: {backgroundColor}</span>
          </div>
        )}
      </div>

      {renderError && (
        <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
          {renderError}
        </div>
      )}

      {/* Preset & Dimension Badges */}
      <div className="bg-surface-50 rounded-2xl p-4 border border-surface-200/80 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-surface-200/60">
          <span className="text-surface-500 font-sans font-medium">Selected Preset:</span>
          <span className="font-bold text-surface-900 truncate max-w-[190px]">
            {preset.name}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-surface-500 font-sans font-medium">Physical Size:</span>
          <span className="font-semibold text-surface-900">
            {formatDimension(preset.width, preset.unit)} ×{" "}
            {formatDimension(preset.height, preset.unit)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-surface-500 font-sans font-medium">Aspect Ratio:</span>
          <span className="font-semibold text-surface-900">{friendlyRatio}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-surface-500 font-sans font-medium">Crop Region:</span>
          <span className="font-semibold text-surface-800">
            {crop.width} × {crop.height} px
          </span>
        </div>

        {originalDimensions && (
          <div className="flex items-center justify-between">
            <span className="text-surface-500 font-sans font-medium">Original Photo:</span>
            <span className="text-surface-600">
              {originalDimensions.width} × {originalDimensions.height} px
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-surface-500 font-sans font-medium">Target @ {dpi} DPI:</span>
          <span className="font-bold text-brand-700">
            {targetCalculation.widthPx} × {targetCalculation.heightPx} px
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-surface-500 font-sans font-medium">Viewport Zoom:</span>
          <span className="text-surface-700">{Math.round(currentZoom * 100)}%</span>
        </div>
      </div>

      {/* Optical Quality Grade */}
      {qualityAssessment && (
        <div
          className={cn(
            "p-3.5 rounded-2xl border flex items-start gap-3",
            qualityAssessment.badgeVariant === "emerald"
              ? "bg-emerald-50/90 border-emerald-200 text-emerald-950"
              : qualityAssessment.badgeVariant === "amber"
              ? "bg-amber-50/90 border-amber-200 text-amber-950"
              : "bg-rose-50/90 border-rose-200 text-rose-950"
          )}
        >
          {qualityAssessment.badgeVariant === "emerald" && (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          )}
          {qualityAssessment.badgeVariant === "amber" && (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          {qualityAssessment.badgeVariant === "rose" && (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}

          <div className="space-y-0.5 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold">{qualityAssessment.title}</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/70 border border-current">
                {qualityAssessment.scaleFactor <= 1.0
                  ? "100% Optical"
                  : `${Math.round(qualityAssessment.scaleFactor * 100)}% Scaled`}
              </span>
            </div>
            <p className="text-[11px] opacity-90 leading-relaxed font-sans">
              {qualityAssessment.description}
            </p>
          </div>
        </div>
      )}

      {/* Memory Integrity Note */}
      <div className="text-[11px] text-surface-500 font-mono text-center pt-1 border-t border-surface-100 flex items-center justify-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-brand-600 shrink-0" />
        <span>Master source photo is kept 100% unmodified in browser RAM.</span>
      </div>
    </div>
  );
};
