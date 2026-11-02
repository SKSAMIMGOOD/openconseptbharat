"use client";

import React from "react";
import { Sliders, Ruler, Eye, Sparkles, Check, Info } from "lucide-react";
import type { DimensionUnit } from "@/types/crop-preset";
import type { MultiplePhotoDimensions } from "@/types/multiple-photo";
import {
  calculatePhotoPixels,
  convertPhotoDimensions,
  MULTI_PHOTO_DPI_PRESETS,
} from "@/lib/multiple-photo/multiple-photo-engine";
import { cn } from "@/lib/utils/cn";

export interface MultiplePhotoDimensionsPanelProps {
  dimensions: MultiplePhotoDimensions;
  dpi: number;
  onDimensionsChange: (updater: (prev: MultiplePhotoDimensions) => MultiplePhotoDimensions) => void;
  onDpiChange: (newDpi: number) => void;
  className?: string;
}

export const MultiplePhotoDimensionsPanel: React.FC<MultiplePhotoDimensionsPanelProps> = ({
  dimensions,
  dpi,
  onDimensionsChange,
  onDpiChange,
  className,
}) => {
  // Output pixel calculation
  const { widthPx, heightPx } = calculatePhotoPixels(
    dimensions.width,
    dimensions.height,
    dimensions.unit,
    dpi
  );

  // Unit switch handler - converts numbers accurately without changing physical size
  const handleUnitSwitch = (newUnit: DimensionUnit) => {
    if (newUnit === dimensions.unit) return;
    onDimensionsChange((prev) => convertPhotoDimensions(prev, newUnit));
  };

  // Quick preset shortcuts
  const applyPreset = (w: number, h: number, u: DimensionUnit) => {
    onDimensionsChange(() => ({
      width: w,
      height: h,
      unit: u,
    }));
  };

  return (
    <div className={cn("bg-white rounded-3xl border border-surface-200 p-5 sm:p-6 shadow-card space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Ruler className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-surface-900">
              Photo Dimensions & DPI Settings
            </h3>
            <p className="text-xs text-surface-500">
              Set physical print dimensions and output resolution.
            </p>
          </div>
        </div>

        {/* Output Resolution Badge */}
        <div className="text-right">
          <span className="text-[10px] text-surface-400 uppercase font-mono block">
            Target Resolution
          </span>
          <span className="text-xs font-bold text-brand-700 font-mono">
            {widthPx} × {heightPx} px
          </span>
        </div>
      </div>

      {/* Quick Dimension Presets */}
      <div>
        <label className="text-xs font-semibold text-surface-700 block mb-2">
          Standard Size Presets
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => applyPreset(1.1, 1.35, "inch")}
            className={cn(
              "p-2.5 rounded-xl border text-left transition-all",
              dimensions.unit === "inch" && dimensions.width === 1.1 && dimensions.height === 1.35
                ? "border-brand-500 bg-brand-50/70 text-brand-900 ring-1 ring-brand-500"
                : "border-surface-200 hover:border-surface-300 bg-surface-50/50 text-surface-800"
            )}
          >
            <span className="text-xs font-bold block">1.1 × 1.35 in</span>
            <span className="text-[10px] text-surface-500 block">Default Photo</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset(35, 45, "mm")}
            className={cn(
              "p-2.5 rounded-xl border text-left transition-all",
              dimensions.unit === "mm" && dimensions.width === 35 && dimensions.height === 45
                ? "border-brand-500 bg-brand-50/70 text-brand-900 ring-1 ring-brand-500"
                : "border-surface-200 hover:border-surface-300 bg-surface-50/50 text-surface-800"
            )}
          >
            <span className="text-xs font-bold block">35 × 45 mm</span>
            <span className="text-[10px] text-surface-500 block">Passport Standard</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset(2, 2, "inch")}
            className={cn(
              "p-2.5 rounded-xl border text-left transition-all",
              dimensions.unit === "inch" && dimensions.width === 2 && dimensions.height === 2
                ? "border-brand-500 bg-brand-50/70 text-brand-900 ring-1 ring-brand-500"
                : "border-surface-200 hover:border-surface-300 bg-surface-50/50 text-surface-800"
            )}
          >
            <span className="text-xs font-bold block">2 × 2 in</span>
            <span className="text-[10px] text-surface-500 block">US Visa / Square</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset(40, 50, "mm")}
            className={cn(
              "p-2.5 rounded-xl border text-left transition-all",
              dimensions.unit === "mm" && dimensions.width === 40 && dimensions.height === 50
                ? "border-brand-500 bg-brand-50/70 text-brand-900 ring-1 ring-brand-500"
                : "border-surface-200 hover:border-surface-300 bg-surface-50/50 text-surface-800"
            )}
          >
            <span className="text-xs font-bold block">40 × 50 mm</span>
            <span className="text-[10px] text-surface-500 block">Studio Portrait</span>
          </button>
        </div>
      </div>

      {/* Dimension Inputs & Unit Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Width Input */}
        <div>
          <label className="text-xs font-semibold text-surface-700 block mb-1.5">
            Photo Width
          </label>
          <div className="relative">
            <input
              type="number"
              step={dimensions.unit === "inch" ? "0.05" : "1"}
              min="0.1"
              max="500"
              value={dimensions.width}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) {
                  onDimensionsChange((prev) => ({ ...prev, width: val }));
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-surface-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 text-sm font-mono font-bold text-surface-900"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-400 font-mono">
              {dimensions.unit}
            </span>
          </div>
        </div>

        {/* Height Input */}
        <div>
          <label className="text-xs font-semibold text-surface-700 block mb-1.5">
            Photo Height
          </label>
          <div className="relative">
            <input
              type="number"
              step={dimensions.unit === "inch" ? "0.05" : "1"}
              min="0.1"
              max="500"
              value={dimensions.height}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) {
                  onDimensionsChange((prev) => ({ ...prev, height: val }));
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-surface-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 text-sm font-mono font-bold text-surface-900"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-400 font-mono">
              {dimensions.unit}
            </span>
          </div>
        </div>

        {/* Unit Selector */}
        <div>
          <label className="text-xs font-semibold text-surface-700 block mb-1.5">
            Measurement Unit
          </label>
          <div className="grid grid-cols-3 gap-1 bg-surface-100 p-1 rounded-xl">
            {(["inch", "cm", "mm"] as DimensionUnit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => handleUnitSwitch(u)}
                className={cn(
                  "py-1.5 text-xs font-bold rounded-lg transition-all",
                  dimensions.unit === u
                    ? "bg-white text-brand-700 shadow-xs"
                    : "text-surface-600 hover:text-surface-900"
                )}
              >
                {u === "inch" ? "Inch" : u === "cm" ? "CM" : "MM"}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-surface-400 mt-1 block">
            Converts without changing physical size
          </span>
        </div>
      </div>

      {/* DPI Selector */}
      <div className="space-y-2 pt-2 border-t border-surface-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-surface-700">
            Print DPI (Dots Per Inch)
          </label>
          <span className="text-[11px] text-brand-700 font-bold font-mono">
            {dpi} DPI Selected
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MULTI_PHOTO_DPI_PRESETS.map((dpiPreset) => (
            <button
              key={dpiPreset}
              type="button"
              onClick={() => onDpiChange(dpiPreset)}
              className={cn(
                "p-3 rounded-xl border text-center transition-all",
                dpi === dpiPreset
                  ? "border-brand-500 bg-brand-50/70 text-brand-900 ring-1 ring-brand-500 shadow-xs"
                  : "border-surface-200 hover:border-surface-300 bg-white text-surface-800"
              )}
            >
              <div className="text-sm font-bold font-mono">{dpiPreset} DPI</div>
              <div className="text-[10px] text-surface-500 mt-0.5">
                {dpiPreset === 150
                  ? "Draft Proof"
                  : dpiPreset === 200
                  ? "Standard Print"
                  : dpiPreset === 300
                  ? "Photo Lab (Default)"
                  : "Ultra Fine Art"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio & Non-Stretching Guarantee Note */}
      <div className="p-3.5 rounded-2xl bg-brand-50/50 border border-brand-100 flex items-start gap-2.5 text-xs text-brand-950">
        <Sparkles className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-brand-900">
            Aspect-Ratio Safe Auto-Cropping
          </p>
          <p className="text-[11px] text-brand-800 leading-relaxed">
            Every photo is center-cropped to the exact aspect ratio of{" "}
            <span className="font-mono font-bold">
              {dimensions.width} : {dimensions.height}
            </span>{" "}
            ({(dimensions.width / dimensions.height).toFixed(2)}). Images are never distorted or stretched.
          </p>
        </div>
      </div>
    </div>
  );
};
