"use client";

import React, { useState, useId, useCallback, useEffect, useMemo } from "react";
import {
  Ruler,
  Maximize2,
  Lock,
  Unlock,
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  ChevronDown,
  Sparkles,
  Sliders,
  Palette,
  ShieldCheck,
  RotateCcw,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type {
  PhotoPreset,
  DimensionUnit,
  CustomDimensionsInput,
  CropMode,
} from "@/types/crop-preset";
import {
  INITIAL_PHOTO_PRESETS,
  EXTENDED_PHOTO_PRESETS,
  PRESET_DISCLAIMER_TEXT,
} from "@/constants/crop-presets";
import {
  STUDIO_BACKGROUND_OPTIONS,
  DEFAULT_BACKGROUND_COLOR,
  BACKGROUND_TRANSPARENCY_DISCLAIMER,
} from "@/constants/background-options";
import {
  convertUnit,
  validateCustomDimensions,
  calculateAspectRatio,
  formatDimension,
  calculateCustomPhotoPixels,
  MIN_DPI,
  MAX_DPI,
  DEFAULT_CUSTOM_DPI,
  MIN_DIMENSION_MM,
  MAX_DIMENSION_MM,
} from "@/lib/crop/unit-converter";
import { getFriendlyAspectRatioName } from "@/lib/photo-studio/dpi-calculator";
import { usePreferences } from "@/hooks/usePreferences";

export const DPI_QUICK_PRESETS: readonly number[] = [150, 200, 300, 600];

export interface PhotoPresetSelectorProps {
  selectedPreset: PhotoPreset;
  cropMode: CropMode;
  backgroundColor: string;
  dpi: number;
  onPresetChange: (preset: PhotoPreset) => void;
  onCustomDimensionsChange: (custom: CustomDimensionsInput) => void;
  onCropModeToggle: (mode: CropMode) => void;
  onBackgroundColorChange: (color: string) => void;
  onDpiChange: (dpi: number) => void;
  className?: string;
}

export const PhotoPresetSelector: React.FC<PhotoPresetSelectorProps> = ({
  selectedPreset,
  cropMode,
  backgroundColor,
  dpi,
  onPresetChange,
  onCustomDimensionsChange,
  onCropModeToggle,
  onBackgroundColorChange,
  onDpiChange,
  className,
}) => {
  const widthInputId = useId();
  const heightInputId = useId();
  const unitSelectId = useId();
  const dpiInputId = useId();
  const customColorInputId = useId();

  const { settings: userPreferences } = usePreferences();

  // Custom Dimensions local state
  const [customWidth, setCustomWidth] = useState<number>(selectedPreset.width);
  const [customHeight, setCustomHeight] = useState<number>(selectedPreset.height);
  const [customUnit, setCustomUnit] = useState<DimensionUnit>(
    selectedPreset.id === "custom" && userPreferences.defaultUnit
      ? userPreferences.defaultUnit
      : selectedPreset.unit
  );
  const [widthStr, setWidthStr] = useState<string>(String(selectedPreset.width));
  const [heightStr, setHeightStr] = useState<string>(String(selectedPreset.height));
  const [dpiStr, setDpiStr] = useState<string>(String(dpi || DEFAULT_CUSTOM_DPI));
  const [isAspectLocked, setIsAspectLocked] = useState<boolean>(true);
  const [showExtendedPresets, setShowExtendedPresets] = useState<boolean>(false);
  const [customHexColor, setCustomHexColor] = useState<string>("#3B82F6");

  // Keep custom form inputs synced when preset changes externally
  useEffect(() => {
    if (selectedPreset.id !== "custom") {
      setCustomWidth(selectedPreset.width);
      setCustomHeight(selectedPreset.height);
      setCustomUnit(selectedPreset.unit);
      setWidthStr(String(selectedPreset.width));
      setHeightStr(String(selectedPreset.height));
    }
  }, [selectedPreset]);

  // Keep DPI string synced if external DPI changes
  useEffect(() => {
    setDpiStr(String(dpi || DEFAULT_CUSTOM_DPI));
  }, [dpi]);

  // Parse numeric values from string inputs for validation
  const parsedWidth = parseFloat(widthStr);
  const parsedHeight = parseFloat(heightStr);
  const parsedDpi = parseInt(dpiStr, 10);

  // Live validation
  const validation = useMemo(() => {
    return validateCustomDimensions(parsedWidth, parsedHeight, customUnit, parsedDpi);
  }, [parsedWidth, parsedHeight, customUnit, parsedDpi]);

  // Live pixel dimensions and friendly ratio calculation
  const liveCalculation = useMemo(() => {
    const validW = !isNaN(parsedWidth) && parsedWidth > 0 ? parsedWidth : customWidth;
    const validH = !isNaN(parsedHeight) && parsedHeight > 0 ? parsedHeight : customHeight;
    const validDpi = !isNaN(parsedDpi) && parsedDpi > 0 ? parsedDpi : dpi;
    return calculateCustomPhotoPixels(validW, validH, customUnit, validDpi);
  }, [parsedWidth, parsedHeight, customWidth, customHeight, customUnit, parsedDpi, dpi]);

  // Notify parent of updated custom preset
  const updateCustomPreset = useCallback(
    (w: number, h: number, u: DimensionUnit, d: number) => {
      const ratio = calculateAspectRatio(w, h);
      const customPreset: PhotoPreset = {
        id: "custom",
        name: `Custom (${formatDimension(w, u)} × ${formatDimension(h, u)})`,
        width: w,
        height: h,
        unit: u,
        aspectRatio: ratio,
        description: "User-defined custom width, height, and unit.",
        category: "custom",
        isOfficial: false,
      };
      onPresetChange(customPreset);
      onCustomDimensionsChange({
        width: w,
        height: h,
        unit: u,
        dpi: d,
      });
    },
    [onPresetChange, onCustomDimensionsChange]
  );

  // Handle Preset Button Click
  const handleSelectPreset = (preset: PhotoPreset) => {
    if (preset.id === "custom") {
      updateCustomPreset(customWidth, customHeight, customUnit, dpi);
    } else {
      if (preset.id === "compact-1.1x1.35" || preset.id === "a4-compact-27x32") {
        setIsAspectLocked(true);
        if (cropMode !== "fixed") {
          onCropModeToggle("fixed");
        }
      }
      onPresetChange(preset);
      setCustomWidth(preset.width);
      setCustomHeight(preset.height);
      setCustomUnit(preset.unit);
      setWidthStr(String(preset.width));
      setHeightStr(String(preset.height));
    }
  };

  // Handle Unit Change with automatic lossless conversion
  const handleUnitChange = (newUnit: DimensionUnit) => {
    if (newUnit === customUnit) return;

    // Convert dimension numbers accurately without changing actual physical dimensions
    const convertedW = convertUnit(customWidth, customUnit, newUnit, 2);
    const convertedH = convertUnit(customHeight, customUnit, newUnit, 2);

    setCustomUnit(newUnit);
    setCustomWidth(convertedW);
    setCustomHeight(convertedH);
    setWidthStr(String(convertedW));
    setHeightStr(String(convertedH));

    updateCustomPreset(convertedW, convertedH, newUnit, dpi);
  };

  // Handle Width Input Change
  const handleWidthChange = (valStr: string) => {
    setWidthStr(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      setCustomWidth(parsed);

      let targetHeight = customHeight;
      const effectiveRatio =
        selectedPreset.id === "a4-compact-27x32"
          ? 26.94 / 32.33
          : selectedPreset.id === "compact-1.1x1.35"
          ? 1.1 / 1.35
          : isAspectLocked && customWidth > 0 && customHeight > 0
          ? customWidth / customHeight
          : null;

      if (effectiveRatio) {
        targetHeight = Number((parsed / effectiveRatio).toFixed(2));
        setCustomHeight(targetHeight);
        setHeightStr(String(targetHeight));
      }

      updateCustomPreset(parsed, targetHeight, customUnit, dpi);
    }
  };

  // Handle Height Input Change
  const handleHeightChange = (valStr: string) => {
    setHeightStr(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      setCustomHeight(parsed);

      let targetWidth = customWidth;
      const effectiveRatio =
        selectedPreset.id === "a4-compact-27x32"
          ? 26.94 / 32.33
          : selectedPreset.id === "compact-1.1x1.35"
          ? 1.1 / 1.35
          : isAspectLocked && customWidth > 0 && customHeight > 0
          ? customWidth / customHeight
          : null;

      if (effectiveRatio) {
        targetWidth = Number((parsed * effectiveRatio).toFixed(2));
        setCustomWidth(targetWidth);
        setWidthStr(String(targetWidth));
      }

      updateCustomPreset(targetWidth, parsed, customUnit, dpi);
    }
  };

  // Handle DPI Preset Selection
  const handleDpiSelect = (newDpi: number) => {
    setDpiStr(String(newDpi));
    onDpiChange(newDpi);
    if (selectedPreset.id === "custom") {
      onCustomDimensionsChange({
        width: customWidth,
        height: customHeight,
        unit: customUnit,
        dpi: newDpi,
      });
    }
  };

  // Handle Custom DPI numeric input change
  const handleDpiInputChange = (valStr: string) => {
    setDpiStr(valStr);
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed) && parsed >= MIN_DPI && parsed <= MAX_DPI) {
      onDpiChange(parsed);
      if (selectedPreset.id === "custom") {
        onCustomDimensionsChange({
          width: customWidth,
          height: customHeight,
          unit: customUnit,
          dpi: parsed,
        });
      }
    }
  };

  const isCustomActive = selectedPreset.id === "custom";

  return (
    <div
      className={cn(
        "bg-white rounded-3xl border border-surface-200 p-5 sm:p-6 shadow-card space-y-6",
        className
      )}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between gap-3 border-b border-surface-100 pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5" />
            <span>Presets & Framing</span>
          </span>
          <h3 className="text-base sm:text-lg font-bold text-surface-900 mt-0.5">
            Photo Size Presets
          </h3>
        </div>

        {/* Fixed Aspect Ratio vs Free Crop Toggle */}
        <button
          type="button"
          onClick={() => {
            if (
              selectedPreset.id === "a4-compact-27x32" ||
              selectedPreset.id === "compact-1.1x1.35"
            ) {
              // Unlocking ratio on default compact requires switching to Custom Size mode
              updateCustomPreset(customWidth, customHeight, customUnit, dpi);
              onCropModeToggle("free");
              return;
            }
            onCropModeToggle(cropMode === "fixed" ? "free" : "fixed");
          }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-sm",
            cropMode === "fixed"
              ? "bg-brand-50 text-brand-800 border-brand-200 hover:bg-brand-100"
              : "bg-surface-100 text-surface-700 border-surface-200 hover:bg-surface-200"
          )}
          title={
            selectedPreset.id === "a4-compact-27x32"
              ? "Default 27 × 32 mm has a locked aspect ratio. Clicking unlocks into Custom Size mode."
              : selectedPreset.id === "compact-1.1x1.35"
              ? "Default Compact has a locked 11:13.5 ratio. Clicking unlocks into Custom Size mode."
              : cropMode === "fixed"
              ? "Aspect ratio is locked. Click to enable freeform cropping."
              : "Freeform crop active. Click to lock aspect ratio."
          }
          aria-label={
            cropMode === "fixed" ? "Unlock Aspect Ratio" : "Lock Aspect Ratio"
          }
        >
          {cropMode === "fixed" ? (
            <>
              <Lock className="w-3.5 h-3.5 text-brand-600" />
              <span>
                {selectedPreset.id === "a4-compact-27x32"
                  ? "Locked (27:32)"
                  : selectedPreset.id === "compact-1.1x1.35"
                  ? "Locked (11:13.5)"
                  : "Aspect Locked"}
              </span>
            </>
          ) : (
            <>
              <Unlock className="w-3.5 h-3.5 text-surface-500" />
              <span>Free Crop</span>
            </>
          )}
        </button>
      </div>

      {/* 1. Standard Photo Dimension Presets */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-surface-600">
          Standard Photo Dimensions
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {INITIAL_PHOTO_PRESETS.map((preset) => {
            const isSelected = selectedPreset.id === preset.id;
            const displayW = preset.id === "custom" ? customWidth : preset.width;
            const displayH = preset.id === "custom" ? customHeight : preset.height;
            const displayU = preset.id === "custom" ? customUnit : preset.unit;
            const displayRatio =
              preset.id === "custom" ? liveCalculation.aspectRatio : preset.aspectRatio;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={cn(
                  "p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-1.5",
                  isSelected
                    ? "bg-brand-50/70 border-brand-500 ring-2 ring-brand-500/20 shadow-sm"
                    : "bg-surface-50/60 border-surface-200 hover:bg-surface-100/80 hover:border-surface-300"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-surface-900 leading-snug">
                      {preset.id === "custom" ? "Custom Dimensions" : preset.name}
                    </span>
                    {preset.id === "a4-compact-27x32" && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-brand-600 text-white rounded-md shadow-xs">
                        Default
                      </span>
                    )}
                    {preset.id === "compact-1.1x1.35" && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-surface-600 text-white rounded-md shadow-xs">
                        Default (4×6)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    {preset.id === "a4-compact-27x32" && (
                      <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-100 text-emerald-800 rounded-md flex items-center gap-0.5 border border-emerald-200">
                        <Lock className="w-2.5 h-2.5" />
                        <span>27:32</span>
                      </span>
                    )}
                    {preset.id === "compact-1.1x1.35" && (
                      <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-100 text-emerald-800 rounded-md flex items-center gap-0.5 border border-emerald-200">
                        <Lock className="w-2.5 h-2.5" />
                        <span>11:13.5</span>
                      </span>
                    )}
                    {isSelected && (
                      <span className="p-0.5 rounded-full bg-brand-600 text-white shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-surface-500">
                  <span className="font-semibold text-surface-700">
                    {formatDimension(displayW, displayU)} ×{" "}
                    {formatDimension(displayH, displayU)}
                  </span>
                  <span>•</span>
                  <span>{getFriendlyAspectRatioName(displayRatio)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Extended National / Administrative Presets (Accordion) */}
      <div className="border-t border-surface-100 pt-3">
        <button
          type="button"
          onClick={() => setShowExtendedPresets(!showExtendedPresets)}
          className="w-full flex items-center justify-between text-xs font-semibold text-surface-600 hover:text-surface-900 py-1 transition-colors"
        >
          <span>More Country & Administrative Presets</span>
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform text-surface-400",
              showExtendedPresets && "rotate-180 text-brand-600"
            )}
          />
        </button>

        {showExtendedPresets && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in">
            {EXTENDED_PHOTO_PRESETS.map((preset) => {
              const isSelected = selectedPreset.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={cn(
                    "p-2.5 rounded-xl border text-left transition-all text-xs",
                    isSelected
                      ? "bg-brand-50/70 border-brand-500 ring-2 ring-brand-500/20"
                      : "bg-surface-50/60 border-surface-200 hover:bg-surface-100"
                  )}
                >
                  <div className="font-bold text-surface-900 leading-tight">
                    {preset.name}
                  </div>
                  <div className="text-[10px] font-mono text-surface-500 mt-0.5">
                    {formatDimension(preset.width, preset.unit)} ×{" "}
                    {formatDimension(preset.height, preset.unit)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Custom Dimensions & DPI Controls (Phase 03G Core) */}
      <div
        className={cn(
          "rounded-2xl p-4 border space-y-4 transition-all",
          isCustomActive
            ? "bg-brand-50/40 border-brand-300 ring-1 ring-brand-300/40"
            : "bg-surface-50 border-surface-200/80"
        )}
      >
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-surface-700 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-brand-600" />
            <span>Custom Dimensions & DPI</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (
                  selectedPreset.id === "a4-compact-27x32" ||
                  selectedPreset.id === "compact-1.1x1.35"
                ) {
                  updateCustomPreset(customWidth, customHeight, customUnit, dpi);
                  setIsAspectLocked(false);
                  return;
                }
                setIsAspectLocked(!isAspectLocked);
              }}
              className={cn(
                "px-2 py-0.5 rounded-lg text-[10px] font-semibold border flex items-center gap-1 transition-all",
                isAspectLocked
                  ? "bg-white text-brand-700 border-brand-300 shadow-xs"
                  : "bg-surface-100 text-surface-500 border-surface-200"
              )}
              title={
                selectedPreset.id === "a4-compact-27x32"
                  ? "Aspect ratio is locked to 26.94:32.33. Click to switch to Custom Size mode and unlock."
                  : selectedPreset.id === "compact-1.1x1.35"
                  ? "Aspect ratio is locked to 11:13.5. Click to switch to Custom Size mode and unlock."
                  : isAspectLocked
                  ? "Aspect ratio is locked: width & height adjust proportionally"
                  : "Aspect ratio unlocked: width & height can change independently"
              }
            >
              {isAspectLocked ? (
                <>
                  <Lock className="w-2.5 h-2.5" />
                  <span>
                    {selectedPreset.id === "a4-compact-27x32"
                      ? "Locked (27:32)"
                      : selectedPreset.id === "compact-1.1x1.35"
                      ? "Locked (11:13.5)"
                      : "Proportional"}
                  </span>
                </>
              ) : (
                <>
                  <Unlock className="w-2.5 h-2.5" />
                  <span>Independent</span>
                </>
              )}
            </button>
            <span className="text-[11px] font-mono text-brand-700 font-semibold">
              {liveCalculation.friendlyAspectRatio}
            </span>
          </div>
        </div>

        {/* Dimensions Inputs Grid (Width, Height, Unit) */}
        <div className="grid grid-cols-3 gap-3">
          {/* Width Input */}
          <div className="space-y-1">
            <label
              htmlFor={widthInputId}
              className="text-[11px] font-semibold text-surface-600 flex items-center justify-between"
            >
              <span>Width</span>
              <span className="font-mono text-[10px] text-surface-400">
                {customUnit}
              </span>
            </label>
            <input
              id={widthInputId}
              type="number"
              step="any"
              min="0.1"
              max="1000"
              value={widthStr}
              onChange={(e) => handleWidthChange(e.target.value)}
              className={cn(
                "w-full px-3 py-2 text-xs font-mono font-semibold rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all",
                validation.errors.width
                  ? "border-rose-300 text-rose-900 focus:border-rose-500 bg-rose-50/40"
                  : "border-surface-200 text-surface-900 focus:border-brand-500"
              )}
              placeholder="e.g. 35"
              aria-label="Custom width"
            />
          </div>

          {/* Height Input */}
          <div className="space-y-1">
            <label
              htmlFor={heightInputId}
              className="text-[11px] font-semibold text-surface-600 flex items-center justify-between"
            >
              <span>Height</span>
              <span className="font-mono text-[10px] text-surface-400">
                {customUnit}
              </span>
            </label>
            <input
              id={heightInputId}
              type="number"
              step="any"
              min="0.1"
              max="1000"
              value={heightStr}
              onChange={(e) => handleHeightChange(e.target.value)}
              className={cn(
                "w-full px-3 py-2 text-xs font-mono font-semibold rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all",
                validation.errors.height
                  ? "border-rose-300 text-rose-900 focus:border-rose-500 bg-rose-50/40"
                  : "border-surface-200 text-surface-900 focus:border-brand-500"
              )}
              placeholder="e.g. 45"
              aria-label="Custom height"
            />
          </div>

          {/* Unit Selector */}
          <div className="space-y-1">
            <label
              htmlFor={unitSelectId}
              className="text-[11px] font-semibold text-surface-600"
            >
              Unit
            </label>
            <select
              id={unitSelectId}
              value={customUnit}
              onChange={(e) => handleUnitChange(e.target.value as DimensionUnit)}
              className="w-full px-2.5 py-2 text-xs font-semibold rounded-xl border border-surface-200 bg-white text-surface-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer"
            >
              <option value="mm">mm (Millimeters)</option>
              <option value="cm">cm (Centimeters)</option>
              <option value="inch">inches (in)</option>
            </select>
          </div>
        </div>

        {/* DPI Controls (Default 300) */}
        <div className="space-y-2 pt-1 border-t border-surface-200/60">
          <div className="flex items-center justify-between">
            <label
              htmlFor={dpiInputId}
              className="text-[11px] font-semibold text-surface-700 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-brand-600" />
              <span>Print Resolution (DPI)</span>
            </label>
            <span className="text-[11px] font-mono font-bold text-brand-700">
              {dpi} DPI
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {DPI_QUICK_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleDpiSelect(p)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border transition-all",
                  dpi === p
                    ? "bg-brand-600 text-white border-brand-600 shadow-xs"
                    : "bg-white text-surface-700 border-surface-200 hover:bg-surface-100"
                )}
              >
                {p} {p === 300 && "(Default)"}
              </button>
            ))}

            <div className="flex items-center gap-1 ml-auto">
              <span className="text-[10px] text-surface-400">Custom:</span>
              <input
                id={dpiInputId}
                type="number"
                min={MIN_DPI}
                max={MAX_DPI}
                value={dpiStr}
                onChange={(e) => handleDpiInputChange(e.target.value)}
                className={cn(
                  "w-16 px-2 py-0.5 text-xs font-mono rounded-lg border bg-white focus:outline-none focus:ring-1 focus:ring-brand-500",
                  validation.errors.dpi
                    ? "border-rose-300 text-rose-900 bg-rose-50/40"
                    : "border-surface-200"
                )}
                placeholder="300"
                aria-label="Custom DPI"
              />
            </div>
          </div>
        </div>

        {/* Live Dimensions & Pixel Preview HUD */}
        <div className="p-3 rounded-xl bg-white border border-surface-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-medium text-surface-500">
              Physical Dimensions:
            </span>
            <span className="font-mono font-bold text-surface-900">
              {formatDimension(customWidth, customUnit)} ×{" "}
              {formatDimension(customHeight, customUnit)}
              {customUnit !== "mm" && (
                <span className="text-surface-400 font-normal ml-1">
                  ({liveCalculation.widthMm} × {liveCalculation.heightMm} mm)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-surface-100">
            <span className="text-[11px] font-medium text-surface-500">
              Target Pixel Dimensions:
            </span>
            <span className="font-mono font-extrabold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-200">
              {liveCalculation.widthPx} × {liveCalculation.heightPx} px @ {dpi} DPI
            </span>
          </div>
        </div>

        {/* Validation Errors Alert Box */}
        {!validation.isValid && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-bold text-rose-900">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Invalid Custom Dimensions</span>
            </div>
            {validation.errors.width && <p>• {validation.errors.width}</p>}
            {validation.errors.height && <p>• {validation.errors.height}</p>}
            {validation.errors.dpi && <p>• {validation.errors.dpi}</p>}
            {validation.errors.general && <p>• {validation.errors.general}</p>}
          </div>
        )}
      </div>

      {/* 4. Studio Background Color Options */}
      <div className="space-y-3 border-t border-surface-100 pt-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-surface-600 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-brand-600" />
            <span>Studio Background Color</span>
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {STUDIO_BACKGROUND_OPTIONS.map((opt) => {
            const isSelected =
              opt.id === "custom"
                ? backgroundColor === customHexColor
                : backgroundColor === opt.colorValue;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  if (opt.id === "custom") {
                    onBackgroundColorChange(customHexColor);
                  } else {
                    onBackgroundColorChange(opt.colorValue);
                  }
                }}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-xl border text-xs text-left transition-all",
                  isSelected
                    ? "bg-brand-50/70 border-brand-500 ring-2 ring-brand-500/20 font-bold text-brand-950"
                    : "bg-surface-50/60 border-surface-200 hover:bg-surface-100 text-surface-700"
                )}
              >
                {opt.id === "transparent" ? (
                  <span className="w-5 h-5 rounded-lg border border-surface-300 bg-[linear-gradient(45deg,#cbd5e1_25%,transparent_25%),linear-gradient(-45deg,#cbd5e1_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#cbd5e1_75%),linear-gradient(-45deg,transparent_75%,#cbd5e1_75%)] [background-size:6px_6px] [background-position:0_0,0_3px,3px_-3px,-3px_0px] shrink-0" />
                ) : (
                  <span
                    className="w-5 h-5 rounded-lg border border-surface-300 shrink-0 shadow-xs"
                    style={{
                      backgroundColor:
                        opt.id === "custom" ? customHexColor : opt.colorValue,
                    }}
                  />
                )}
                <span className="truncate">{opt.name}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Color Input if Custom is active */}
        <div className="flex items-center gap-3 pt-1">
          <input
            id={customColorInputId}
            type="color"
            value={customHexColor}
            onChange={(e) => {
              setCustomHexColor(e.target.value);
              onBackgroundColorChange(e.target.value);
            }}
            className="w-8 h-8 rounded-lg cursor-pointer border border-surface-200 p-0.5 bg-white"
            title="Pick custom studio color"
          />
          <span className="text-xs font-mono text-surface-600">
            Hex: {customHexColor.toUpperCase()}
          </span>
        </div>

        {/* Transparency Disclaimer Note */}
        <div className="p-3 rounded-2xl bg-surface-50 border border-surface-200/80 text-[11px] text-surface-500 flex items-start gap-2 leading-relaxed">
          <Info className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
          <span>{BACKGROUND_TRANSPARENCY_DISCLAIMER}</span>
        </div>
      </div>

      {/* 5. Official Government Standards Compliance Disclaimer */}
      <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs flex items-start gap-2.5 leading-relaxed">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-amber-950 block">Official Advisory</span>
          <p className="text-[11px] text-amber-800">{PRESET_DISCLAIMER_TEXT}</p>
        </div>
      </div>
    </div>
  );
};
