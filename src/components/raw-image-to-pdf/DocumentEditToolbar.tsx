"use client";

import React, { useState } from "react";
import {
  Sliders,
  Eraser,
  Highlighter,
  Stamp,
  Undo2,
  Redo2,
  RotateCcw,
  Sun,
  Contrast,
  Palette,
  Eye,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type {
  AnnotationToolType,
  DocumentEnhancementSettings,
  WatermarkConfig,
  ColorFilterSettings,
} from "@/types/raw-image-to-pdf";
import {
  DEFAULT_WATERMARK_CONFIG,
  COLOR_FILTER_PRESETS,
} from "@/types/raw-image-to-pdf";

export interface DocumentEditToolbarProps {
  activeTool: AnnotationToolType;
  onSelectTool: (tool: AnnotationToolType) => void;
  // Global Enhancements
  globalEnhancements: DocumentEnhancementSettings;
  onUpdateEnhancement: <K extends keyof DocumentEnhancementSettings>(
    key: K,
    val: DocumentEnhancementSettings[K]
  ) => void;
  onResetEnhancements: () => void;
  // Global Color Filter
  globalColorFilter: ColorFilterSettings;
  onUpdateColorFilter: (filter: ColorFilterSettings) => void;
  onResetColorFilter: () => void;
  // Eraser options
  eraserSize: number;
  onChangeEraserSize: (size: number) => void;
  eraserColor: string;
  onChangeEraserColor: (color: string) => void;
  // Highlighter options
  highlighterSize: number;
  onChangeHighlighterSize: (size: number) => void;
  highlighterColor: string;
  onChangeHighlighterColor: (color: string) => void;
  highlighterOpacity: number;
  onChangeHighlighterOpacity: (opacity: number) => void;
  // Watermark options
  watermark: WatermarkConfig | null;
  onUpdateWatermark: (watermark: WatermarkConfig | null) => void;
  // Per-page opt-out for global edits
  applyGlobalEdits?: boolean;
  onToggleApplyGlobalEdits?: (enabled: boolean) => void;
  // History
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResetPageEdits: () => void;
  className?: string;
}

const HIGHLIGHTER_COLORS = [
  { label: "Yellow", value: "#fef08a" },
  { label: "Green", value: "#86efac" },
  { label: "Blue", value: "#7dd3fc" },
  { label: "Pink", value: "#f472b6" },
  { label: "Orange", value: "#fdba74" },
];

const ERASER_COLORS = [
  { label: "White Paper", value: "#ffffff" },
  { label: "Warm Cream", value: "#fefce8" },
  { label: "Cool Slate", value: "#f1f5f9" },
];

export const DocumentEditToolbar: React.FC<DocumentEditToolbarProps> = ({
  activeTool,
  onSelectTool,
  globalEnhancements,
  onUpdateEnhancement,
  onResetEnhancements,
  globalColorFilter,
  onUpdateColorFilter,
  onResetColorFilter,
  eraserSize,
  onChangeEraserSize,
  eraserColor,
  onChangeEraserColor,
  highlighterSize,
  onChangeHighlighterSize,
  highlighterColor,
  onChangeHighlighterColor,
  highlighterOpacity,
  onChangeHighlighterOpacity,
  watermark,
  onUpdateWatermark,
  applyGlobalEdits,
  onToggleApplyGlobalEdits,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onResetPageEdits,
  className,
}) => {
  const [showEnhancePanel, setShowEnhancePanel] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showWatermarkPanel, setShowWatermarkPanel] = useState(false);

  const activeWatermark = watermark || DEFAULT_WATERMARK_CONFIG;

  const handleToolClick = (tool: AnnotationToolType) => {
    if (tool === "enhance") {
      setShowEnhancePanel((prev) => !prev);
      setShowFilterPanel(false);
      setShowWatermarkPanel(false);
      onSelectTool(tool);
    } else if (tool === "filter") {
      setShowFilterPanel((prev) => !prev);
      setShowEnhancePanel(false);
      setShowWatermarkPanel(false);
      onSelectTool(tool);
    } else if (tool === "watermark") {
      setShowWatermarkPanel((prev) => !prev);
      setShowEnhancePanel(false);
      setShowFilterPanel(false);
      onSelectTool(tool);
    } else {
      setShowEnhancePanel(false);
      setShowFilterPanel(false);
      setShowWatermarkPanel(false);
      onSelectTool(activeTool === tool ? "select" : tool);
    }
  };

  return (
    <div className={cn("relative flex flex-col w-full bg-slate-900 border-t border-slate-800 z-30", className)}>
      {/* 1. Contextual Secondary Settings Bar (Visible based on selected tool) */}

      {/* Eraser Settings Bar */}
      {activeTool === "eraser" && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-slate-850 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-300">Eraser Size:</span>
            <input
              type="range"
              min={6}
              max={64}
              value={eraserSize}
              onChange={(e) => onChangeEraserSize(Number(e.target.value))}
              className="w-24 sm:w-36 accent-blue-500 cursor-pointer"
            />
            <span className="text-slate-400 font-mono w-7">{eraserSize}px</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Paper Tone:</span>
            <div className="flex items-center gap-1.5">
              {ERASER_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => onChangeEraserColor(c.value)}
                  className={cn(
                    "w-5 h-5 rounded-full border transition-all",
                    eraserColor === c.value
                      ? "border-blue-500 ring-2 ring-blue-500/40 scale-110"
                      : "border-slate-600 hover:scale-105"
                  )}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Highlighter Settings Bar */}
      {activeTool === "highlighter" && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-slate-850 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-300">Highlighter Size:</span>
            <input
              type="range"
              min={10}
              max={72}
              value={highlighterSize}
              onChange={(e) => onChangeHighlighterSize(Number(e.target.value))}
              className="w-24 sm:w-36 accent-blue-500 cursor-pointer"
            />
            <span className="text-slate-400 font-mono w-7">{highlighterSize}px</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Color:</span>
            <div className="flex items-center gap-1.5">
              {HIGHLIGHTER_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => onChangeHighlighterColor(c.value)}
                  className={cn(
                    "w-5 h-5 rounded-full border transition-all",
                    highlighterColor === c.value
                      ? "border-white ring-2 ring-blue-500 scale-110"
                      : "border-slate-600 hover:scale-105"
                  )}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enhance Sliders Drawer */}
      {showEnhancePanel && (
        <div className="p-4 bg-slate-950/95 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs animate-in slide-in-from-bottom-2 duration-150">
          {/* Brightness */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-300 font-medium">
              <span>Brightness</span>
              <span className="font-mono">{globalEnhancements.brightness > 0 ? `+${globalEnhancements.brightness}` : globalEnhancements.brightness}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={globalEnhancements.brightness}
              onChange={(e) => onUpdateEnhancement("brightness", Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Contrast */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-300 font-medium">
              <span>Contrast</span>
              <span className="font-mono">{globalEnhancements.contrast > 0 ? `+${globalEnhancements.contrast}` : globalEnhancements.contrast}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={globalEnhancements.contrast}
              onChange={(e) => onUpdateEnhancement("contrast", Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Saturation */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-300 font-medium">
              <span>Saturation</span>
              <span className="font-mono">{globalEnhancements.saturation > 0 ? `+${globalEnhancements.saturation}` : globalEnhancements.saturation}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={globalEnhancements.saturation}
              onChange={(e) => onUpdateEnhancement("saturation", Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Sharpness */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-300 font-medium">
              <span>Sharpness</span>
              <span className="font-mono">+{globalEnhancements.sharpness}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={globalEnhancements.sharpness}
              onChange={(e) => onUpdateEnhancement("sharpness", Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Grayscale & Invert Toggles */}
          <div className="flex items-center gap-4 sm:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
              <input
                type="checkbox"
                checked={globalEnhancements.grayscale}
                onChange={(e) => onUpdateEnhancement("grayscale", e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
              />
              <span>B&W / Grayscale</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
              <input
                type="checkbox"
                checked={globalEnhancements.invert}
                onChange={(e) => onUpdateEnhancement("invert", e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700"
              />
              <span>Invert (Negative)</span>
            </label>

            <button
              type="button"
              onClick={onResetEnhancements}
              className="ml-auto px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors"
            >
              Reset All Sliders
            </button>
          </div>
        </div>
      )}

      {/* Color Filter Presets Drawer */}
      {showFilterPanel && (
        <div className="p-3 sm:p-4 bg-slate-950/95 border-b border-slate-800 space-y-3 text-xs animate-in slide-in-from-bottom-2 duration-150">
          {/* Top Row: Title, Active Preset Badge, Intensity Slider, Reset */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-purple-400" />
                Color Filter Presets
              </span>
              {globalColorFilter.preset !== "original" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {COLOR_FILTER_PRESETS.find((p) => p.id === globalColorFilter.preset)?.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Intensity Slider (Visible when active filter is selected) */}
              {globalColorFilter.preset !== "original" && (
                <div className="flex items-center gap-2 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                  <span className="text-slate-400 font-medium">Intensity:</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={globalColorFilter.intensity}
                    onChange={(e) =>
                      onUpdateColorFilter({
                        ...globalColorFilter,
                        intensity: Number(e.target.value),
                      })
                    }
                    className="w-20 sm:w-28 accent-purple-500 cursor-pointer"
                  />
                  <span className="font-mono text-purple-300 w-8 text-right">
                    {globalColorFilter.intensity}%
                  </span>
                </div>
              )}

              {/* Reset to Original Button */}
              <button
                type="button"
                onClick={onResetColorFilter}
                disabled={globalColorFilter.preset === "original" && globalColorFilter.intensity === 100}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Reset to Original / Natural color"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Original</span>
              </button>
            </div>
          </div>

          {/* Preset Swatches Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {COLOR_FILTER_PRESETS.map((preset) => {
              const isSelected = globalColorFilter.preset === preset.id;

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    onUpdateColorFilter({
                      preset: preset.id,
                      intensity: globalColorFilter.intensity || 100,
                    })
                  }
                  className={cn(
                    "group relative flex flex-col items-center p-1.5 rounded-xl border text-center transition-all",
                    isSelected
                      ? "bg-purple-600/20 border-purple-500 text-white ring-2 ring-purple-500/40 shadow-sm"
                      : "bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200"
                  )}
                  title={preset.description}
                >
                  {/* Visual Swatch Preview Box */}
                  <div className="relative w-full aspect-square max-h-12 rounded-lg overflow-hidden bg-slate-800 mb-1.5 flex items-center justify-center border border-slate-700/60 shadow-inner">
                    <div
                      className="w-full h-full flex flex-col items-center justify-center gap-0.5 p-1 transition-all"
                      style={{ filter: preset.previewFilter }}
                    >
                      <div className="w-4/5 h-1.5 bg-gradient-to-r from-blue-400 via-amber-300 to-rose-400 rounded-xs" />
                      <div className="w-3/5 h-1 bg-slate-300 rounded-xs" />
                      <div className="w-4/5 h-1 bg-slate-400 rounded-xs" />
                    </div>

                    {isSelected && (
                      <div className="absolute inset-0 bg-purple-600/30 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow" />
                      </div>
                    )}
                  </div>

                  <span className="text-[11px] font-semibold truncate w-full leading-tight">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Watermark Settings Drawer */}
      {showWatermarkPanel && (
        <div className="p-4 bg-slate-950/95 border-b border-slate-800 space-y-3 text-xs animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enableWatermark"
                checked={Boolean(watermark?.enabled)}
                onChange={(e) =>
                  onUpdateWatermark(
                    e.target.checked
                      ? { ...activeWatermark, enabled: true }
                      : watermark
                      ? { ...watermark, enabled: false }
                      : null
                  )
                }
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 cursor-pointer"
              />
              <label htmlFor="enableWatermark" className="font-semibold text-white cursor-pointer">
                Enable Text Watermark
              </label>
            </div>

            {watermark && watermark.enabled && (
              <button
                type="button"
                onClick={() => onUpdateWatermark(null)}
                className="text-red-400 hover:text-red-300 hover:underline"
              >
                Remove Watermark
              </button>
            )}
          </div>

          {watermark && watermark.enabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
              {/* Text Input */}
              <div className="space-y-1">
                <span className="text-slate-400">Text:</span>
                <input
                  type="text"
                  value={watermark.text}
                  onChange={(e) => onUpdateWatermark({ ...watermark, text: e.target.value })}
                  placeholder="CONFIDENTIAL"
                  className="w-full px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-white font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Font Size */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Font Size:</span>
                  <span className="font-mono">{watermark.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min={16}
                  max={120}
                  value={watermark.fontSize}
                  onChange={(e) => onUpdateWatermark({ ...watermark, fontSize: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Opacity */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Opacity:</span>
                  <span className="font-mono">{Math.round(watermark.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={90}
                  value={Math.round(watermark.opacity * 100)}
                  onChange={(e) => onUpdateWatermark({ ...watermark, opacity: Number(e.target.value) / 100 })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Rotation */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Rotation:</span>
                  <span className="font-mono">{watermark.rotation}°</span>
                </div>
                <input
                  type="range"
                  min={-90}
                  max={90}
                  value={watermark.rotation}
                  onChange={(e) => onUpdateWatermark({ ...watermark, rotation: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Main Primary Compact Editing Toolbar (Requirement 6) */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 overflow-x-auto gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Enhance Button */}
          <button
            type="button"
            onClick={() => handleToolClick("enhance")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0",
              showEnhancePanel
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            )}
            title="Global Document Enhancement (Brightness, Contrast, Sharpness)"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span>Enhance</span>
          </button>

          {/* Color Filter Button */}
          <button
            type="button"
            onClick={() => handleToolClick("filter")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0",
              showFilterPanel || (globalColorFilter && globalColorFilter.preset !== "original")
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            )}
            title="Dedicated Document Color Filter Presets (Auto Color, Grayscale, B&W, Warm, Cool, Vintage, High Contrast)"
          >
            <Palette className="w-3.5 h-3.5 text-purple-400" />
            <span>Filter</span>
          </button>

          {/* Eraser Button */}
          <button
            type="button"
            onClick={() => handleToolClick("eraser")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0",
              activeTool === "eraser"
                ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-400"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            )}
            title="Pixel Retouching Eraser (Erase unwanted marks, stamps, spots)"
          >
            <Eraser className="w-3.5 h-3.5 text-rose-400" />
            <span>Eraser</span>
          </button>

          {/* Highlighter Button */}
          <button
            type="button"
            onClick={() => handleToolClick("highlighter")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0",
              activeTool === "highlighter"
                ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-400"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            )}
            title="Semi-transparent Document Highlighter"
          >
            <Highlighter className="w-3.5 h-3.5 text-amber-400" />
            <span>Highlighter</span>
          </button>

          {/* Watermark Button */}
          <button
            type="button"
            onClick={() => handleToolClick("watermark")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0",
              showWatermarkPanel || (watermark && watermark.enabled)
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            )}
            title="Add or Edit Text Watermark"
          >
            <Stamp className="w-3.5 h-3.5 text-indigo-400" />
            <span>Watermark</span>
          </button>
        </div>

        {/* Right Action Controls: Apply Global Edits, Undo, Redo, Reset */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onToggleApplyGlobalEdits && (
            <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white cursor-pointer select-none bg-slate-850 hover:bg-slate-800 border border-slate-700/80 transition-colors">
              <input
                type="checkbox"
                checked={applyGlobalEdits ?? true}
                onChange={(e) => onToggleApplyGlobalEdits(e.target.checked)}
                className="rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
              />
              <span className="whitespace-nowrap hidden xs:inline">Apply global edits</span>
              <span className="whitespace-nowrap xs:hidden">Global edits</span>
            </label>
          )}

          <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />

          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={cn(
              "p-1.5 rounded-lg text-slate-300 transition-colors",
              canUndo
                ? "hover:bg-slate-800 hover:text-white"
                : "opacity-30 cursor-not-allowed"
            )}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className={cn(
              "p-1.5 rounded-lg text-slate-300 transition-colors",
              canRedo
                ? "hover:bg-slate-800 hover:text-white"
                : "opacity-30 cursor-not-allowed"
            )}
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-800 mx-1" />

          <button
            type="button"
            onClick={onResetPageEdits}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
            title="Reset annotations on this page"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
