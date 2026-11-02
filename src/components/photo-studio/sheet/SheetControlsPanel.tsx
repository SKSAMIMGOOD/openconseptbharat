"use client";

import React from "react";
import {
  PhotoSheetConfig,
  SheetOrientation,
  SheetPaperSize,
  CutGuideStyle,
  SheetExportFormat,
  SheetCalculationResult,
} from "@/types/photo-sheet";
import {
  SHEET_DPI_PRESETS,
  CUT_GUIDE_STYLES,
  CUT_GUIDE_COLORS,
  SHEET_PAPER_SIZES,
  SHEET_A4_SHORT_EDGE_INCHES,
  SHEET_A4_LONG_EDGE_INCHES,
  SHEET_4X6_SHORT_EDGE_INCHES,
  SHEET_4X6_LONG_EDGE_INCHES,
  DEFAULT_A4_SHEET_MARGINS,
  DEFAULT_SHEET_MARGINS,
  DEFAULT_A4_SHEET_SPACING,
  DEFAULT_4X6_SHEET_SPACING,
  MAX_A4_COLUMNS,
  MIN_SHEET_DPI,
  MAX_SHEET_DPI,
} from "@/constants/photo-sheet";
import {
  Printer,
  Grid,
  Sliders,
  Scissors,
  Download,
  Info,
  Maximize2,
  Lock,
  Unlock,
  Check,
  AlertTriangle,
  RotateCw,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface SheetControlsPanelProps {
  config: PhotoSheetConfig;
  layout: SheetCalculationResult;
  photoPresetName: string;
  photoDimensionsMm: { width: number; height: number };
  exportFormat: SheetExportFormat;
  jpegQuality: number;
  isExporting: boolean;
  onConfigChange: (updater: (prev: PhotoSheetConfig) => PhotoSheetConfig) => void;
  onExportFormatChange: (format: SheetExportFormat) => void;
  onJpegQualityChange: (quality: number) => void;
  onExportClick: () => void;
  onNavigateToCrop?: () => void;
}

export const SheetControlsPanel: React.FC<SheetControlsPanelProps> = ({
  config,
  layout,
  photoPresetName,
  photoDimensionsMm,
  exportFormat,
  jpegQuality,
  isExporting,
  onConfigChange,
  onExportFormatChange,
  onJpegQualityChange,
  onExportClick,
  onNavigateToCrop,
}) => {
  const currentPaperSize: SheetPaperSize = config.paperSize || "a4";

  // Switch Paper Size (A4 vs 4×6)
  const handlePaperSizeChange = (paperSize: SheetPaperSize) => {
    onConfigChange((prev) => {
      if (paperSize === "a4") {
        return {
          ...prev,
          paperSize: "a4",
          orientation: "portrait",
          paperWidthInches: SHEET_A4_SHORT_EDGE_INCHES,
          paperHeightInches: SHEET_A4_LONG_EDGE_INCHES,
          margins: { ...DEFAULT_A4_SHEET_MARGINS },
          spacing: { ...DEFAULT_A4_SHEET_SPACING },
          centerAlignment: false,
          copies: Math.max(prev.copies, 24),
          manualRows: 6,
          manualCols: 4,
        };
      } else {
        return {
          ...prev,
          paperSize: "4x6",
          orientation: "landscape",
          paperWidthInches: SHEET_4X6_LONG_EDGE_INCHES,
          paperHeightInches: SHEET_4X6_SHORT_EDGE_INCHES,
          margins: { ...DEFAULT_SHEET_MARGINS },
          spacing: { ...DEFAULT_4X6_SHEET_SPACING },
          centerAlignment: true,
          copies: Math.min(prev.copies, 8),
          manualRows: 2,
          manualCols: 4,
        };
      }
    });
  };

  // Toggle orientation
  const handleOrientationChange = (orientation: SheetOrientation) => {
    onConfigChange((prev) => {
      const isA4 = (prev.paperSize || "a4") === "a4";
      let widthInches: number;
      let heightInches: number;

      if (isA4) {
        widthInches = orientation === "landscape" ? SHEET_A4_LONG_EDGE_INCHES : SHEET_A4_SHORT_EDGE_INCHES;
        heightInches = orientation === "landscape" ? SHEET_A4_SHORT_EDGE_INCHES : SHEET_A4_LONG_EDGE_INCHES;
      } else {
        widthInches = orientation === "landscape" ? SHEET_4X6_LONG_EDGE_INCHES : SHEET_4X6_SHORT_EDGE_INCHES;
        heightInches = orientation === "landscape" ? SHEET_4X6_SHORT_EDGE_INCHES : SHEET_4X6_LONG_EDGE_INCHES;
      }

      return {
        ...prev,
        orientation,
        paperWidthInches: widthInches,
        paperHeightInches: heightInches,
      };
    });
  };

  // Set DPI
  const handleDpiSelect = (dpi: number) => {
    onConfigChange((prev) => ({
      ...prev,
      dpi,
    }));
  };

  // Custom DPI input
  const handleCustomDpiChange = (valStr: string) => {
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed) && parsed >= MIN_SHEET_DPI && parsed <= MAX_SHEET_DPI) {
      onConfigChange((prev) => ({
        ...prev,
        dpi: parsed,
      }));
    }
  };

  // Copies change - Do NOT silently reduce requested copy count!
  const handleCopiesChange = (copies: number) => {
    const valid = Math.max(1, Math.min(200, copies));
    onConfigChange((prev) => ({
      ...prev,
      copies: valid,
    }));
  };

  // Layout mode
  const handleLayoutModeChange = (mode: "auto" | "manual") => {
    onConfigChange((prev) => ({
      ...prev,
      layoutMode: mode,
    }));
  };

  // Manual rows/cols
  const handleManualRowsChange = (rows: number) => {
    onConfigChange((prev) => ({
      ...prev,
      manualRows: Math.max(1, Math.min(15, rows)),
    }));
  };

  const handleManualColsChange = (cols: number) => {
    onConfigChange((prev) => ({
      ...prev,
      manualCols: Math.max(1, Math.min(MAX_A4_COLUMNS, cols)),
    }));
  };

  // Center alignment
  const handleCenterToggle = () => {
    onConfigChange((prev) => ({
      ...prev,
      centerAlignment: !prev.centerAlignment,
    }));
  };

  // Spacing
  const handleSpacingChange = (hMm: number, vMm: number) => {
    onConfigChange((prev) => ({
      ...prev,
      spacing: {
        ...prev.spacing,
        horizontalMm: Math.max(0, Math.min(20, hMm)),
        verticalMm: Math.max(0, Math.min(20, vMm)),
      },
    }));
  };

  const handleSpacingLockToggle = () => {
    onConfigChange((prev) => ({
      ...prev,
      spacing: {
        ...prev.spacing,
        uniform: !prev.spacing.uniform,
        verticalMm: !prev.spacing.uniform ? prev.spacing.horizontalMm : prev.spacing.verticalMm,
      },
    }));
  };

  // Margins
  const handleMarginChange = (key: "topMm" | "bottomMm" | "leftMm" | "rightMm", val: number) => {
    const num = Math.max(0, Math.min(30, val));
    onConfigChange((prev) => {
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

  const handleMarginsLockToggle = () => {
    onConfigChange((prev) => ({
      ...prev,
      margins: {
        ...prev.margins,
        uniform: !prev.margins.uniform,
        topMm: !prev.margins.uniform ? prev.margins.leftMm : prev.margins.topMm,
        bottomMm: !prev.margins.uniform ? prev.margins.leftMm : prev.margins.bottomMm,
        rightMm: !prev.margins.uniform ? prev.margins.leftMm : prev.margins.rightMm,
      },
    }));
  };

  // Guide styles
  const handleGuideStyleChange = (style: CutGuideStyle) => {
    onConfigChange((prev) => ({
      ...prev,
      cutGuides: {
        ...prev.cutGuides,
        style,
        enabled: style !== "none",
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* 1. Sheet Configuration Section */}
      <div className="bg-white rounded-3xl border border-surface-200 p-5 sm:p-6 shadow-card space-y-5">
        <div className="flex items-center justify-between border-b border-surface-100 pb-3">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider">
              1. Paper & Sheet Setup
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-semibold border border-brand-200">
            {currentPaperSize === "a4" ? "ISO 216 A4" : "Photo 4×6″ (4R)"}
          </span>
        </div>

        {/* Paper Size Selector (A4 vs 4×6) */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-surface-700 flex items-center justify-between">
            <span>Paper Format</span>
            <span className="text-[11px] text-surface-500 font-normal">
              {currentPaperSize === "a4" ? "210 × 297 mm" : "101.6 × 152.4 mm"}
            </span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SHEET_PAPER_SIZES.map((paper) => (
              <button
                key={paper.id}
                type="button"
                onClick={() => handlePaperSizeChange(paper.id)}
                className={cn(
                  "p-3 rounded-2xl border text-left transition-all relative overflow-hidden",
                  currentPaperSize === paper.id
                    ? "bg-brand-50/70 border-brand-500 text-brand-950 ring-1 ring-brand-500 shadow-sm"
                    : "bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100"
                )}
              >
                <div className="flex items-center gap-2">
                  <FileText className={cn("w-4 h-4 shrink-0", currentPaperSize === paper.id ? "text-brand-600" : "text-surface-500")} />
                  <span className="font-bold text-xs">{paper.shortLabel}</span>
                </div>
                <span className="text-[11px] font-mono text-surface-500 block mt-1">
                  {paper.dimensionsMm}
                </span>
                <span className="text-[10px] text-surface-400 block line-clamp-1 mt-0.5">
                  {paper.id === "a4" ? "High capacity (30+ photos)" : "Photo lab standard (8 photos)"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Orientation Toggle */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-surface-700 flex items-center justify-between">
            <span>Sheet Orientation</span>
            <span className="text-[11px] text-surface-500 font-normal">
              {currentPaperSize === "a4"
                ? config.orientation === "landscape"
                  ? "297 × 210 mm"
                  : "210 × 297 mm"
                : config.orientation === "landscape"
                ? "6.0 × 4.0 inches"
                : "4.0 × 6.0 inches"}
            </span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleOrientationChange("portrait")}
              className={cn(
                "py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all",
                config.orientation === "portrait"
                  ? "bg-brand-50 border-brand-500 text-brand-800 ring-1 ring-brand-500 shadow-sm"
                  : "bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100"
              )}
            >
              <span className="w-3 h-4 rounded-sm border-2 border-current" />
              <span>Portrait {currentPaperSize === "a4" ? "(210 × 297 mm)" : "(4 × 6″)"}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOrientationChange("landscape")}
              className={cn(
                "py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all",
                config.orientation === "landscape"
                  ? "bg-brand-50 border-brand-500 text-brand-800 ring-1 ring-brand-500 shadow-sm"
                  : "bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100"
              )}
            >
              <span className="w-4 h-3 rounded-sm border-2 border-current" />
              <span>Landscape {currentPaperSize === "a4" ? "(297 × 210 mm)" : "(6 × 4″)"}</span>
            </button>
          </div>
        </div>

        {/* DPI Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-surface-700">
              Print Resolution (DPI)
            </label>
            <span className="text-[11px] font-mono text-brand-700 font-bold">
              {config.dpi} DPI
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {SHEET_DPI_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => handleDpiSelect(p.value)}
                className={cn(
                  "py-2 px-1 rounded-xl border text-[11px] font-mono font-bold transition-all text-center",
                  config.dpi === p.value
                    ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                    : "bg-surface-50 text-surface-700 border-surface-200 hover:bg-surface-100"
                )}
                title={p.description}
              >
                {p.value}
              </button>
            ))}
          </div>

          {/* Custom DPI input */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-surface-500 shrink-0">Custom DPI:</span>
            <input
              type="number"
              min={MIN_SHEET_DPI}
              max={MAX_SHEET_DPI}
              value={config.dpi}
              onChange={(e) => handleCustomDpiChange(e.target.value)}
              className="flex-1 px-2.5 py-1 text-xs font-mono rounded-lg border border-surface-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <span className="text-[10px] text-surface-400">({MIN_SHEET_DPI}–{MAX_SHEET_DPI})</span>
          </div>
        </div>

        {/* Photo Dimension Summary from Phase 03C / 03G */}
        <div className="p-3.5 rounded-2xl bg-surface-50 border border-surface-200 space-y-2 text-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] text-surface-500 block font-medium">
                Photo Dimensions & Preset:
              </span>
              <span className="font-bold text-surface-900 block leading-tight">{photoPresetName}</span>
              <span className="text-[10px] text-surface-500 font-mono mt-0.5 block">
                Target: {layout.photoWidthPx} × {layout.photoHeightPx} px @ {layout.dpi} DPI
              </span>
            </div>
            <div className="text-right font-mono shrink-0">
              <span className="text-[11px] text-surface-500 block">Print Size:</span>
              <span className="font-bold text-brand-700 text-xs">
                {photoDimensionsMm.width} × {photoDimensionsMm.height} mm
              </span>
            </div>
          </div>
          {onNavigateToCrop && (
            <div className="pt-2 border-t border-surface-200/60 flex items-center justify-between">
              <span className="text-[11px] text-surface-500">Need custom dimensions?</span>
              <button
                type="button"
                onClick={onNavigateToCrop}
                className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 hover:underline"
              >
                Customize Dimensions & Crop →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Photo Layout & Copies Section */}
      <div className="bg-white rounded-3xl border border-surface-200 p-5 sm:p-6 shadow-card space-y-5">
        <div className="flex items-center justify-between border-b border-surface-100 pb-3">
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider">
              2. Grid & Copies
            </h3>
          </div>
          <span className="text-[11px] font-mono text-surface-600 font-semibold">
            Capacity: {layout.maxCapacity} Max
          </span>
        </div>

        {/* Layout Mode: Auto vs Manual */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-surface-700">Layout Mode</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleLayoutModeChange("auto")}
              className={cn(
                "py-2 px-3 rounded-xl border text-xs font-semibold transition-all",
                config.layoutMode === "auto"
                  ? "bg-brand-50 border-brand-500 text-brand-800 ring-1 ring-brand-500 font-bold"
                  : "bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100"
              )}
            >
              Auto Capacity
            </button>

            <button
              type="button"
              onClick={() => handleLayoutModeChange("manual")}
              className={cn(
                "py-2 px-3 rounded-xl border text-xs font-semibold transition-all",
                config.layoutMode === "manual"
                  ? "bg-brand-50 border-brand-500 text-brand-800 ring-1 ring-brand-500 font-bold"
                  : "bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100"
              )}
            >
              Manual Grid (R × C)
            </button>
          </div>
        </div>

        {/* Manual Grid Rows/Cols Controls */}
        {config.layoutMode === "manual" && (
          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-amber-50/60 border border-amber-200">
            <div>
              <label className="text-[11px] font-semibold text-surface-700 flex items-center justify-between mb-1">
                <span>Columns:</span>
                <span className="text-[10px] text-surface-400 font-mono">(Max 4)</span>
              </label>
              <input
                type="number"
                min={1}
                max={4}
                value={config.manualCols}
                onChange={(e) => handleManualColsChange(parseInt(e.target.value, 10) || 1)}
                className="w-full px-2.5 py-1 text-xs font-mono rounded-lg border border-surface-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-surface-700 block mb-1">
                Rows:
              </label>
              <input
                type="number"
                min={1}
                max={15}
                value={config.manualRows}
                onChange={(e) => handleManualRowsChange(parseInt(e.target.value, 10) || 1)}
                className="w-full px-2.5 py-1 text-xs font-mono rounded-lg border border-surface-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        )}

        {/* Number of Copies Slider & Counter - NO SILENT REDUCTION */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-surface-700">
              Total Copies to Place
            </label>
            <span className="text-xs font-mono font-bold text-brand-700">
              {config.copies} {config.copies === 1 ? "copy requested" : "copies requested"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleCopiesChange(config.copies - 1)}
              disabled={config.copies <= 1}
              className="w-8 h-8 rounded-lg border border-surface-200 bg-surface-50 text-surface-700 font-bold hover:bg-surface-100 disabled:opacity-40"
            >
              -
            </button>
            <input
              type="range"
              min={1}
              max={Math.max(50, (layout.maxCapacity || 30) + 10)}
              value={config.copies}
              onChange={(e) => handleCopiesChange(parseInt(e.target.value, 10) || 1)}
              className="flex-1 accent-brand-600"
            />
            <button
              type="button"
              onClick={() => handleCopiesChange(config.copies + 1)}
              className="w-8 h-8 rounded-lg border border-surface-200 bg-surface-50 text-surface-700 font-bold hover:bg-surface-100"
            >
              +
            </button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-surface-500">
            <span>Direct copy count:</span>
            <input
              type="number"
              min={1}
              max={200}
              value={config.copies}
              onChange={(e) => handleCopiesChange(parseInt(e.target.value, 10) || 1)}
              className="w-20 px-2 py-0.5 text-xs font-mono rounded border border-surface-300 text-right focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Capacity Warning Alert - Clear warning when requested count exceeds sheet capacity */}
        {layout.copiesExceedCapacity && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-2.5 shadow-sm animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block text-amber-900">
                Sheet Capacity Limit Reached
              </span>
              <p className="text-[11px] leading-relaxed text-amber-800">
                You requested <strong>{layout.requestedCopies} copies</strong>, but this {currentPaperSize.toUpperCase()} sheet has room for <strong>{layout.maxCapacity} photos</strong>.
                {" "}<strong>{layout.totalPhotos} photos</strong> will be placed on this sheet. The remaining <strong>{layout.exceededByCount} extra copies</strong> will require an additional sheet.
              </p>
            </div>
          </div>
        )}

        {/* Grid Alignment: Top-aligned for A4, configurable for 4x6 */}
        {currentPaperSize === "4x6" ? (
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-xs font-semibold text-surface-800 block">
                Center Align Grid
              </span>
              <span className="text-[11px] text-surface-500">
                Distribute leftover margins evenly
              </span>
            </div>
            <button
              type="button"
              onClick={handleCenterToggle}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                config.centerAlignment
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-surface-100 text-surface-600 border-surface-200"
              )}
            >
              {config.centerAlignment ? "Centered" : "Top-Left"}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-1 text-xs">
            <div>
              <span className="text-xs font-semibold text-surface-800 block">
                Grid Alignment
              </span>
              <span className="text-[11px] text-surface-500">
                Grows downward row-by-row from top margin
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 font-mono text-[11px] font-bold">
              Top-Left Printable Region
            </span>
          </div>
        )}

        {/* Overflow alert if layout doesn't fit */}
        {layout.isOverflowing && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Layout Overflow Warning</span>
              <span>{layout.overflowReason}</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Spacing & Margins Section */}
      <div className="bg-white rounded-3xl border border-surface-200 p-5 sm:p-6 shadow-card space-y-5">
        <div className="flex items-center justify-between border-b border-surface-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider">
              3. Spacing & Margins (mm)
            </h3>
          </div>
        </div>

        {/* Spacing Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-surface-700">
              Inter-Photo Spacing
            </label>
            <button
              type="button"
              onClick={handleSpacingLockToggle}
              className="text-[11px] text-surface-600 flex items-center gap-1 hover:text-brand-600"
            >
              {config.spacing.uniform ? (
                <>
                  <Lock className="w-3 h-3 text-brand-600" />
                  <span>Equal (H = V)</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3 text-surface-400" />
                  <span>Separate</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-surface-500">
                <span>Horizontal:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={15}
                    step={0.1}
                    value={config.spacing.horizontalMm}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      handleSpacingChange(val, config.spacing.uniform ? val : config.spacing.verticalMm);
                    }}
                    className="w-14 px-1.5 py-0.5 text-xs font-mono font-bold text-right rounded border border-surface-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <span className="text-[10px] text-surface-400">mm</span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={15}
                step={0.1}
                value={config.spacing.horizontalMm}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  handleSpacingChange(val, config.spacing.uniform ? val : config.spacing.verticalMm);
                }}
                className="w-full accent-brand-600"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-surface-500">
                <span>Vertical:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={15}
                    step={0.1}
                    disabled={config.spacing.uniform}
                    value={config.spacing.verticalMm}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      handleSpacingChange(config.spacing.horizontalMm, val);
                    }}
                    className="w-14 px-1.5 py-0.5 text-xs font-mono font-bold text-right rounded border border-surface-300 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-40"
                  />
                  <span className="text-[10px] text-surface-400">mm</span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={15}
                step={0.1}
                disabled={config.spacing.uniform}
                value={config.spacing.verticalMm}
                onChange={(e) => {
                  handleSpacingChange(config.spacing.horizontalMm, parseFloat(e.target.value));
                }}
                className="w-full accent-brand-600 disabled:opacity-40"
              />
            </div>
          </div>

          {/* Quick Spacing Presets */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[10px] text-surface-400 shrink-0">Presets:</span>
            {[
              { val: 0, label: "0 mm (Edge)" },
              { val: 1.0, label: "1.0 mm" },
              { val: 1.5, label: "1.5 mm (Standard)" },
              { val: 2.0, label: "2.0 mm" },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => handleSpacingChange(preset.val, preset.val)}
                className={cn(
                  "px-2 py-0.5 rounded-lg text-[10px] font-mono border transition-all",
                  config.spacing.horizontalMm === preset.val && config.spacing.verticalMm === preset.val
                    ? "bg-brand-50 text-brand-700 border-brand-300 font-bold"
                    : "bg-surface-50 text-surface-600 border-surface-200 hover:bg-surface-100"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Outer Margins Controls */}
        <div className="space-y-3 pt-2 border-t border-surface-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-surface-700">
              Outer Sheet Margins
            </label>
            <button
              type="button"
              onClick={handleMarginsLockToggle}
              className="text-[11px] text-surface-600 flex items-center gap-1 hover:text-brand-600"
            >
              {config.margins.uniform ? (
                <>
                  <Lock className="w-3 h-3 text-brand-600" />
                  <span>Uniform All Sides</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3 text-surface-400" />
                  <span>Custom Sides</span>
                </>
              )}
            </button>
          </div>

          {config.margins.uniform ? (
            <div>
              <div className="flex items-center justify-between text-[11px] text-surface-500 mb-1">
                <span>All Margins:</span>
                <span className="font-mono font-bold text-surface-800">
                  {config.margins.leftMm} mm
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={25}
                step={0.5}
                value={config.margins.leftMm}
                onChange={(e) => handleMarginChange("leftMm", parseFloat(e.target.value))}
                className="w-full accent-brand-600"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-surface-500 block mb-0.5">Top: {config.margins.topMm} mm</span>
                <input
                  type="range"
                  min={0}
                  max={25}
                  value={config.margins.topMm}
                  onChange={(e) => handleMarginChange("topMm", parseFloat(e.target.value))}
                  className="w-full accent-brand-600"
                />
              </div>
              <div>
                <span className="text-surface-500 block mb-0.5">Bottom: {config.margins.bottomMm} mm</span>
                <input
                  type="range"
                  min={0}
                  max={25}
                  value={config.margins.bottomMm}
                  onChange={(e) => handleMarginChange("bottomMm", parseFloat(e.target.value))}
                  className="w-full accent-brand-600"
                />
              </div>
              <div>
                <span className="text-surface-500 block mb-0.5">Left: {config.margins.leftMm} mm</span>
                <input
                  type="range"
                  min={0}
                  max={25}
                  value={config.margins.leftMm}
                  onChange={(e) => handleMarginChange("leftMm", parseFloat(e.target.value))}
                  className="w-full accent-brand-600"
                />
              </div>
              <div>
                <span className="text-surface-500 block mb-0.5">Right: {config.margins.rightMm} mm</span>
                <input
                  type="range"
                  min={0}
                  max={25}
                  value={config.margins.rightMm}
                  onChange={(e) => handleMarginChange("rightMm", parseFloat(e.target.value))}
                  className="w-full accent-brand-600"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Cutting Guides Section */}
      <div className="bg-white rounded-3xl border border-surface-200 p-5 sm:p-6 shadow-card space-y-5">
        <div className="flex items-center justify-between border-b border-surface-100 pb-3">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider">
              4. Cutting Guides
            </h3>
          </div>
          <span className="text-[11px] font-mono text-surface-500">
            {config.cutGuides.enabled ? "Active" : "Disabled"}
          </span>
        </div>

        {/* Guide Style Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-surface-700">Guide Style</label>
          <div className="grid grid-cols-2 gap-2">
            {CUT_GUIDE_STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleGuideStyleChange(s.id)}
                className={cn(
                  "p-2.5 rounded-xl border text-left text-xs transition-all",
                  config.cutGuides.style === s.id && config.cutGuides.enabled
                    ? "bg-brand-50 border-brand-500 text-brand-900 ring-1 ring-brand-500"
                    : "bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100"
                )}
              >
                <span className="font-bold block">{s.label}</span>
                <span className="text-[10px] text-surface-500 line-clamp-1">
                  {s.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {config.cutGuides.enabled && (
          <div className="space-y-3 pt-2 border-t border-surface-100">
            {/* Color Palette */}
            <div>
              <label className="text-xs font-semibold text-surface-700 block mb-1.5">
                Guide Line Color
              </label>
              <div className="flex items-center gap-2">
                {CUT_GUIDE_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => {
                      onConfigChange((prev) => ({
                        ...prev,
                        cutGuides: { ...prev.cutGuides, color: c.hex },
                      }));
                    }}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all",
                      config.cutGuides.color === c.hex
                        ? "border-brand-600 ring-2 ring-brand-200 scale-110"
                        : "border-surface-300 hover:scale-105"
                    )}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                  >
                    {config.cutGuides.color === c.hex && (
                      <Check
                        className={cn(
                          "w-3.5 h-3.5",
                          c.hex === "#000000" ? "text-white" : "text-surface-900"
                        )}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Include in export checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label
                htmlFor="includeGuides"
                className="text-xs text-surface-700 cursor-pointer"
              >
                Include cutting guides in exported file
              </label>
              <input
                id="includeGuides"
                type="checkbox"
                checked={config.cutGuides.includeInExport}
                onChange={(e) => {
                  onConfigChange((prev) => ({
                    ...prev,
                    cutGuides: { ...prev.cutGuides, includeInExport: e.target.checked },
                  }));
                }}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* 5. Export Format Selector */}
      <div className="bg-white rounded-3xl border border-surface-200 p-5 sm:p-6 shadow-card space-y-5">
        <div className="flex items-center justify-between border-b border-surface-100 pb-3">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-surface-900 uppercase tracking-wider">
              5. Export Format
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onExportFormatChange("application/pdf")}
            className={cn(
              "py-3 px-2 rounded-xl border text-center transition-all",
              exportFormat === "application/pdf"
                ? "bg-brand-50 border-brand-500 text-brand-900 ring-1 ring-brand-500 font-bold"
                : "bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100"
            )}
          >
            <span className="block text-xs font-bold">PDF</span>
            <span className="block text-[10px] text-surface-500">Print-Ready</span>
          </button>

          <button
            type="button"
            onClick={() => onExportFormatChange("image/jpeg")}
            className={cn(
              "py-3 px-2 rounded-xl border text-center transition-all",
              exportFormat === "image/jpeg"
                ? "bg-brand-50 border-brand-500 text-brand-900 ring-1 ring-brand-500 font-bold"
                : "bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100"
            )}
          >
            <span className="block text-xs font-bold">JPEG</span>
            <span className="block text-[10px] text-surface-500">Photo Paper</span>
          </button>

          <button
            type="button"
            onClick={() => onExportFormatChange("image/png")}
            className={cn(
              "py-3 px-2 rounded-xl border text-center transition-all",
              exportFormat === "image/png"
                ? "bg-brand-50 border-brand-500 text-brand-900 ring-1 ring-brand-500 font-bold"
                : "bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100"
            )}
          >
            <span className="block text-xs font-bold">PNG</span>
            <span className="block text-[10px] text-surface-500">Lossless</span>
          </button>
        </div>

        {/* JPEG Quality Slider */}
        {exportFormat === "image/jpeg" && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-surface-600">JPEG Quality:</span>
              <span className="font-mono font-bold text-brand-700">
                {Math.round(jpegQuality * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.7}
              max={1.0}
              step={0.01}
              value={jpegQuality}
              onChange={(e) => onJpegQualityChange(parseFloat(e.target.value))}
              className="w-full accent-brand-600"
            />
          </div>
        )}
      </div>
    </div>
  );
};
