"use client";

import React, { useState, useId, useCallback, useEffect } from "react";
import {
  Ruler,
  Maximize2,
  Lock,
  Unlock,
  AlertTriangle,
  Info,
  Check,
  ChevronDown,
  Sparkles,
  Sliders,
  Palette,
  ShieldCheck,
  RotateCcw,
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
} from "@/lib/crop/unit-converter";
import { getFriendlyAspectRatioName } from "@/lib/photo-studio/dpi-calculator";

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
  const customColorInputId = useId();

  // Custom Dimensions local state
  const [customWidth, setCustomWidth] = useState<number>(selectedPreset.width);
  const [customHeight, setCustomHeight] = useState<number>(selectedPreset.height);
  const [customUnit, setCustomUnit] = useState<DimensionUnit>(selectedPreset.unit);
  const [widthStr, setWidthStr] = useState<string>(String(selectedPreset.width));
  const [heightStr, setHeightStr] = useState<string>(String(selectedPreset.height));
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

  // Validation
  const validation = validateCustomDimensions(customWidth, customHeight, customUnit);
  const liveRatio = calculateAspectRatio(customWidth, customHeight);
  const friendlyRatio = getFriendlyAspectRatioName(liveRatio);

  // Handle Preset Button Click
  const handleSelectPreset = (preset: PhotoPreset) => {
    onPresetChange(preset);
    if (preset.id !== "custom") {
      setCustomWidth(preset.width);
      setCustomHeight(preset.height);
      setCustomUnit(preset.unit);
      setWidthStr(String(preset.width));
      setHeightStr(String(preset.height));
    }
  };

  // Handle Unit Change with automatic unit conversion
  const handleUnitChange = (newUnit: DimensionUnit) => {
    if (newUnit === customUnit) return;

    // Automatic unit conversion
    const convertedW = convertUnit(customWidth, customUnit, newUnit, 2);
    const convertedH = convertUnit(customHeight, customUnit, newUnit, 2);

    setCustomUnit(newUnit);
    setCustomWidth(convertedW);
    setCustomHeight(convertedH);
    setWidthStr(String(convertedW));
    setHeightStr(String(convertedH));

    if (selectedPreset.id === "custom") {
      const updatedPreset: PhotoPreset = {
        ...selectedPreset,
        width: convertedW,
        height: convertedH,
        unit: newUnit,
        aspectRatio: convertedW / convertedH,
      };
      onPresetChange(updatedPreset);
      onCustomDimensionsChange({
        width: convertedW,
        height: convertedH,
        unit: newUnit,
      });
    }
  };

  // Handle Width Input Change
  const handleWidthChange = (valStr: string) => {
    setWidthStr(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      setCustomWidth(parsed);
      const newRatio = parsed / (customHeight || 1);
      const customPreset: PhotoPreset = {
        id: "custom",
        name: `Custom (${formatDimension(parsed, customUnit)} × ${formatDimension(
          customHeight,
          customUnit
        )})`,
        width: parsed,
        height: customHeight,
        unit: customUnit,
        aspectRatio: newRatio,
        description: "User-defined custom width and height.",
        category: "custom",
        isOfficial: false,
      };
      onPresetChange(customPreset);
      onCustomDimensionsChange({
        width: parsed,
        height: customHeight,
        unit: customUnit,
      });
    }
  };

  // Handle Height Input Change
  const handleHeightChange = (valStr: string) => {
    setHeightStr(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      setCustomHeight(parsed);
      const newRatio = (customWidth || 1) / parsed;
      const customPreset: PhotoPreset = {
        id: "custom",
        name: `Custom (${formatDimension(customWidth, customUnit)} × ${formatDimension(
          parsed,
          customUnit
        )})`,
        width: customWidth,
        height: parsed,
        unit: customUnit,
        aspectRatio: newRatio,
        description: "User-defined custom width and height.",
        category: "custom",
        isOfficial: false,
      };
      onPresetChange(customPreset);
      onCustomDimensionsChange({
        width: customWidth,
        height: parsed,
        unit: customUnit,
      });
    }
  };

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
          onClick={() => onCropModeToggle(cropMode === "fixed" ? "free" : "fixed")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-sm",
            cropMode === "fixed"
              ? "bg-brand-50 text-brand-800 border-brand-200 hover:bg-brand-100"
              : "bg-surface-100 text-surface-700 border-surface-200 hover:bg-surface-200"
          )}
          title={
            cropMode === "fixed"
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
              <span>Aspect Locked</span>
            </>
          ) : (
            <>
              <Unlock className="w-3.5 h-3.5 text-surface-500" />
              <span>Free Crop</span>
            </>
          )}
        </button>
      </div>

      {/* 1. Initial Standard Presets Grid */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-surface-600">
          Standard Photo Dimensions
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {INITIAL_PHOTO_PRESETS.map((preset) => {
            const isSelected = selectedPreset.id === preset.id;
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
                  <span className="text-xs font-bold text-surface-900 leading-snug">
                    {preset.name}
                  </span>
                  {isSelected && (
                    <span className="p-0.5 rounded-full bg-brand-600 text-white shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-surface-500">
                  <span className="font-semibold text-surface-700">
                    {formatDimension(preset.width, preset.unit)} ×{" "}
                    {formatDimension(preset.height, preset.unit)}
                  </span>
                  <span>•</span>
                  <span>{getFriendlyAspectRatioName(preset.aspectRatio)}</span>
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

      {/* 3. Custom Dimensions Form */}
      <div className="bg-surface-50 rounded-2xl p-4 border border-surface-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-surface-700 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-brand-600" />
            <span>Custom Dimensions & Unit</span>
          </label>
          <span className="text-[11px] font-mono text-brand-700 font-semibold">
            Ratio: {friendlyRatio}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Width Input */}
          <div className="space-y-1">
            <label
              htmlFor={widthInputId}
              className="text-[11px] font-semibold text-surface-600"
            >
              Width
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
                  ? "border-rose-300 text-rose-900 focus:border-rose-500"
                  : "border-surface-200 text-surface-900 focus:border-brand-500"
              )}
              placeholder="Width"
            />
          </div>

          {/* Height Input */}
          <div className="space-y-1">
            <label
              htmlFor={heightInputId}
              className="text-[11px] font-semibold text-surface-600"
            >
              Height
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
                  ? "border-rose-300 text-rose-900 focus:border-rose-500"
                  : "border-surface-200 text-surface-900 focus:border-brand-500"
              )}
              placeholder="Height"
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
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-surface-200 bg-white text-surface-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer"
            >
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="inch">inches</option>
            </select>
          </div>
        </div>

        {/* Validation Errors */}
        {(validation.errors.width || validation.errors.height) && (
          <div className="text-[11px] text-rose-600 font-medium space-y-0.5">
            {validation.errors.width && <p>• {validation.errors.width}</p>}
            {validation.errors.height && <p>• {validation.errors.height}</p>}
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
