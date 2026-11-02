"use client";

import React from "react";
import {
  Printer,
  Grid,
  Scissors,
  Sliders,
  RotateCw,
  Lock,
  Unlock,
  Check,
} from "lucide-react";
import type {
  SheetPaperSize,
  SheetOrientation,
  CutGuideStyle,
  SheetMargins,
  SheetSpacing,
} from "@/types/photo-sheet";
import type { MultiplePhotoConfig } from "@/types/multiple-photo";
import {
  DEFAULT_A4_SHEET_MARGINS,
  DEFAULT_SHEET_MARGINS,
  DEFAULT_A4_SHEET_SPACING,
  DEFAULT_4X6_SHEET_SPACING,
  CUT_GUIDE_STYLES,
  CUT_GUIDE_COLORS,
} from "@/constants/photo-sheet";
import { cn } from "@/lib/utils/cn";

export interface MultiplePhotoSheetControlsProps {
  config: MultiplePhotoConfig;
  onConfigChange: (updater: (prev: MultiplePhotoConfig) => MultiplePhotoConfig) => void;
  className?: string;
}

export const MultiplePhotoSheetControls: React.FC<MultiplePhotoSheetControlsProps> = ({
  config,
  onConfigChange,
  className,
}) => {
  // Switch Paper Size (4x6 vs A4)
  const handlePaperSizeChange = (paperSize: SheetPaperSize) => {
    onConfigChange((prev) => {
      const isA4 = paperSize === "a4";
      return {
        ...prev,
        paperSize,
        orientation: isA4 ? "portrait" : "landscape",
        margins: isA4 ? { ...DEFAULT_A4_SHEET_MARGINS } : { ...DEFAULT_SHEET_MARGINS },
        spacing: isA4 ? { ...DEFAULT_A4_SHEET_SPACING } : { ...DEFAULT_4X6_SHEET_SPACING },
      };
    });
  };

  // Toggle orientation
  const handleOrientationToggle = () => {
    onConfigChange((prev) => ({
      ...prev,
      orientation: prev.orientation === "portrait" ? "landscape" : "portrait",
    }));
  };

  // Columns per row constraint: 'auto' | 1 | 2 | 3 | 4
  const handleColumnsModeChange = (mode: "auto" | 1 | 2 | 3 | 4) => {
    onConfigChange((prev) => ({
      ...prev,
      columnsMode: mode,
    }));
  };

  // Margin updates
  const handleMarginChange = (key: keyof Omit<SheetMargins, "uniform">, val: number) => {
    onConfigChange((prev) => {
      const num = Math.max(0, Math.min(50, val));
      if (prev.margins.uniform) {
        return {
          ...prev,
          margins: {
            topMm: num,
            bottomMm: num,
            leftMm: num,
            rightMm: num,
            uniform: true,
          },
        };
      }
      return {
        ...prev,
        margins: {
          ...prev.margins,
          [key]: num,
        },
      };
    });
  };

  // Spacing updates
  const handleSpacingChange = (key: keyof Omit<SheetSpacing, "uniform">, val: number) => {
    onConfigChange((prev) => {
      const num = Math.max(0, Math.min(30, val));
      if (prev.spacing.uniform) {
        return {
          ...prev,
          spacing: {
            horizontalMm: num,
            verticalMm: num,
            uniform: true,
          },
        };
      }
      return {
        ...prev,
        spacing: {
          ...prev.spacing,
          [key]: num,
        },
      };
    });
  };

  return (
    <div className={cn("bg-white rounded-3xl border border-surface-200 p-5 sm:p-6 shadow-card space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Printer className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-surface-900">
              Print Sheet Layout & Margins
            </h3>
            <p className="text-xs text-surface-500">
              Select paper size, grid columns, spacing, and cutting guides.
            </p>
          </div>
        </div>

        {/* Orientation Toggle Button */}
        <button
          type="button"
          onClick={handleOrientationToggle}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-200 hover:border-brand-300 hover:bg-brand-50/50 text-xs font-semibold text-surface-700 hover:text-brand-700 transition-all shadow-xs"
          title="Toggle Portrait / Landscape orientation"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span className="capitalize">{config.orientation}</span>
        </button>
      </div>

      {/* 1. Paper Size Selector: 4×6 vs A4 */}
      <div>
        <label className="text-xs font-semibold text-surface-700 block mb-2">
          Paper Size
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* A4 Paper Button */}
          <button
            type="button"
            onClick={() => handlePaperSizeChange("a4")}
            className={cn(
              "p-3.5 rounded-2xl border text-left transition-all",
              config.paperSize === "a4"
                ? "border-brand-500 bg-brand-50/70 text-brand-900 ring-1 ring-brand-500 shadow-xs"
                : "border-surface-200 hover:border-surface-300 bg-white text-surface-800"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm">A4 Standard Sheet</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-100 text-surface-600 uppercase">
                210 × 297 mm
              </span>
            </div>
            <p className="text-xs text-surface-500">
              Standard office & home paper. Best for bulk multi-photo sheets (up to 30+ photos).
            </p>
          </button>

          {/* 4×6 Paper Button */}
          <button
            type="button"
            onClick={() => handlePaperSizeChange("4x6")}
            className={cn(
              "p-3.5 rounded-2xl border text-left transition-all",
              config.paperSize === "4x6"
                ? "border-brand-500 bg-brand-50/70 text-brand-900 ring-1 ring-brand-500 shadow-xs"
                : "border-surface-200 hover:border-surface-300 bg-white text-surface-800"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm">4 × 6 Inch Photo Paper</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-100 text-surface-600 uppercase">
                101.6 × 152.4 mm
              </span>
            </div>
            <p className="text-xs text-surface-500">
              Standard 4R photo lab paper. Ideal for home photo printers and studio labs.
            </p>
          </button>
        </div>
      </div>

      {/* 2. Grid Arrangement: Max 4 Photographs Per Row */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-surface-700">
            Columns Per Row (Max 4 Photos Per Row)
          </label>
          <span className="text-[11px] text-surface-500 font-medium">
            Top-aligned, Left-to-Right
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          <button
            type="button"
            onClick={() => handleColumnsModeChange("auto")}
            className={cn(
              "py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all",
              config.columnsMode === "auto"
                ? "border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500"
                : "border-surface-200 hover:border-surface-300 bg-white text-surface-700"
            )}
          >
            Auto (≤4)
          </button>
          {[1, 2, 3, 4].map((colCount) => (
            <button
              key={colCount}
              type="button"
              onClick={() => handleColumnsModeChange(colCount as 1 | 2 | 3 | 4)}
              className={cn(
                "py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all",
                config.columnsMode === colCount
                  ? "border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500"
                  : "border-surface-200 hover:border-surface-300 bg-white text-surface-700"
              )}
            >
              {colCount} {colCount === 1 ? "Col" : "Cols"}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Margins & Spacing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-surface-100">
        {/* Margins */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-surface-700">
              Margins (mm)
            </label>
            <button
              type="button"
              onClick={() =>
                onConfigChange((prev) => ({
                  ...prev,
                  margins: { ...prev.margins, uniform: !prev.margins.uniform },
                }))
              }
              className="text-[11px] text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
            >
              {config.margins.uniform ? (
                <>
                  <Lock className="w-3 h-3" />
                  <span>Uniform ({config.margins.topMm} mm)</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3" />
                  <span>Independent</span>
                </>
              )}
            </button>
          </div>

          {config.margins.uniform ? (
            <div>
              <input
                type="range"
                min="0"
                max="25"
                step="0.5"
                value={config.margins.topMm}
                onChange={(e) => handleMarginChange("topMm", parseFloat(e.target.value))}
                className="w-full accent-brand-600"
              />
              <div className="flex justify-between text-[11px] text-surface-500 font-mono mt-1">
                <span>0 mm</span>
                <span className="font-bold text-surface-900">{config.margins.topMm} mm</span>
                <span>25 mm</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {(["topMm", "bottomMm", "leftMm", "rightMm"] as const).map((side) => (
                <div key={side}>
                  <span className="text-[10px] text-surface-500 uppercase block mb-1">
                    {side.replace("Mm", "")}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    value={config.margins[side]}
                    onChange={(e) => handleMarginChange(side, parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border border-surface-300 text-center"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spacing Between Photos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-surface-700">
              Photo Spacing (mm)
            </label>
            <button
              type="button"
              onClick={() =>
                onConfigChange((prev) => ({
                  ...prev,
                  spacing: { ...prev.spacing, uniform: !prev.spacing.uniform },
                }))
              }
              className="text-[11px] text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
            >
              {config.spacing.uniform ? (
                <>
                  <Lock className="w-3 h-3" />
                  <span>Uniform ({config.spacing.horizontalMm} mm)</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3" />
                  <span>Independent</span>
                </>
              )}
            </button>
          </div>

          {config.spacing.uniform ? (
            <div>
              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={config.spacing.horizontalMm}
                onChange={(e) => handleSpacingChange("horizontalMm", parseFloat(e.target.value))}
                className="w-full accent-brand-600"
              />
              <div className="flex justify-between text-[11px] text-surface-500 font-mono mt-1">
                <span>0 mm</span>
                <span className="font-bold text-surface-900">
                  {config.spacing.horizontalMm} mm
                </span>
                <span>15 mm</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-surface-500 uppercase block mb-1">
                  Horizontal
                </span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={config.spacing.horizontalMm}
                  onChange={(e) =>
                    handleSpacingChange("horizontalMm", parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border border-surface-300 text-center"
                />
              </div>
              <div>
                <span className="text-[10px] text-surface-500 uppercase block mb-1">
                  Vertical
                </span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={config.spacing.verticalMm}
                  onChange={(e) =>
                    handleSpacingChange("verticalMm", parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border border-surface-300 text-center"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Cutting Guides Configuration */}
      <div className="space-y-3 pt-2 border-t border-surface-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-surface-700">
            <Scissors className="w-3.5 h-3.5 text-brand-600" />
            <span>Cutting Guide Markers</span>
          </div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-surface-600 cursor-pointer">
            <input
              type="checkbox"
              checked={config.cutGuides.enabled}
              onChange={(e) =>
                onConfigChange((prev) => ({
                  ...prev,
                  cutGuides: { ...prev.cutGuides, enabled: e.target.checked },
                }))
              }
              className="rounded border-surface-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
            />
            <span>Show Guides</span>
          </label>
        </div>

        {config.cutGuides.enabled && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 animate-fadeIn">
            {CUT_GUIDE_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() =>
                  onConfigChange((prev) => ({
                    ...prev,
                    cutGuides: { ...prev.cutGuides, style: style.id },
                  }))
                }
                className={cn(
                  "p-2 rounded-xl border text-center transition-all",
                  config.cutGuides.style === style.id
                    ? "border-brand-500 bg-brand-50/70 text-brand-900 ring-1 ring-brand-500 shadow-2xs"
                    : "border-surface-200 hover:border-surface-300 bg-white text-surface-700"
                )}
              >
                <span className="text-xs font-bold block">{style.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
