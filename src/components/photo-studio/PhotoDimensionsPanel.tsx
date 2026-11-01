"use client";

import React, { useState, useId, useMemo, useCallback } from "react";
import {
  Ruler,
  Maximize2,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Scale,
  Sliders,
  HelpCircle,
  RotateCcw,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ValidatedImageFile } from "@/types/image-engine";
import {
  StandardDpiPreset,
  DpiSelection,
  PhotoDimensionPreset,
} from "@/types/dpi-calculator";
import {
  PHOTO_DIMENSION_PRESETS,
  SUPPORTED_DPI_PRESETS,
  DEFAULT_PHOTO_WIDTH_MM,
  DEFAULT_PHOTO_HEIGHT_MM,
  DEFAULT_DPI,
  MIN_DIMENSION_MM,
  MAX_DIMENSION_MM,
  MIN_DPI,
  MAX_DPI,
} from "@/constants/photo-dimensions";
import {
  calculatePixelDimensions,
  calculateProportionalDimension,
  assessResolutionQuality,
  pixelsToMm,
  getFriendlyAspectRatioName,
} from "@/lib/photo-studio/dpi-calculator";

export interface PhotoDimensionsPanelProps {
  imageFile?: ValidatedImageFile | null;
  className?: string;
  onDimensionsChange?: (dimensions: {
    widthMm: number;
    heightMm: number;
    dpi: number;
    widthPx: number;
    heightPx: number;
  }) => void;
}

export const PhotoDimensionsPanel: React.FC<PhotoDimensionsPanelProps> = ({
  imageFile,
  className,
  onDimensionsChange,
}) => {
  const widthInputId = useId();
  const heightInputId = useId();
  const dpiInputId = useId();
  const presetSelectId = useId();

  // Active form state
  const [selectedPresetId, setSelectedPresetId] = useState<string>("passport_standard");
  const [widthMm, setWidthMm] = useState<number>(DEFAULT_PHOTO_WIDTH_MM);
  const [heightMm, setHeightMm] = useState<number>(DEFAULT_PHOTO_HEIGHT_MM);
  const [dpi, setDpi] = useState<number>(DEFAULT_DPI);
  const [isCustomDpi, setIsCustomDpi] = useState<boolean>(false);
  const [isAspectLocked, setIsAspectLocked] = useState<boolean>(true);
  const [lockedRatio, setLockedRatio] = useState<number>(
    DEFAULT_PHOTO_WIDTH_MM / DEFAULT_PHOTO_HEIGHT_MM
  );

  // Raw string inputs to allow intermediate typing (e.g. typing decimals or backspacing)
  const [widthInputStr, setWidthInputStr] = useState<string>(String(DEFAULT_PHOTO_WIDTH_MM));
  const [heightInputStr, setHeightInputStr] = useState<string>(String(DEFAULT_PHOTO_HEIGHT_MM));
  const [customDpiStr, setCustomDpiStr] = useState<string>(String(DEFAULT_DPI));

  // Compute calculated pixel dimensions via pure calculation engine
  const calculationResult = useMemo(() => {
    return calculatePixelDimensions({
      widthMm,
      heightMm,
      dpi,
      roundingStrategy: "round",
    });
  }, [widthMm, heightMm, dpi]);

  // Compute resolution quality analysis if source image is available
  const qualityAssessment = useMemo(() => {
    if (!imageFile || !calculationResult.isValid) return null;
    return assessResolutionQuality(
      imageFile.dimensions.width,
      imageFile.dimensions.height,
      widthMm,
      heightMm,
      dpi
    );
  }, [imageFile, calculationResult.isValid, widthMm, heightMm, dpi]);

  // Notify parent of dimension updates
  React.useEffect(() => {
    if (calculationResult.isValid && onDimensionsChange) {
      onDimensionsChange({
        widthMm,
        heightMm,
        dpi,
        widthPx: calculationResult.widthPx,
        heightPx: calculationResult.heightPx,
      });
    }
  }, [calculationResult, widthMm, heightMm, dpi, onDimensionsChange]);

  // Preset Selection Handler
  const handlePresetChange = useCallback(
    (presetId: string) => {
      setSelectedPresetId(presetId);
      const preset = PHOTO_DIMENSION_PRESETS.find((p) => p.id === presetId);
      if (preset && preset.id !== "custom") {
        setWidthMm(preset.widthMm);
        setHeightMm(preset.heightMm);
        setWidthInputStr(String(preset.widthMm));
        setHeightInputStr(String(preset.heightMm));
        setDpi(preset.defaultDpi);
        setIsCustomDpi(!SUPPORTED_DPI_PRESETS.includes(preset.defaultDpi as StandardDpiPreset));
        setCustomDpiStr(String(preset.defaultDpi));
        setLockedRatio(preset.widthMm / preset.heightMm);
      }
    },
    []
  );

  // Width Input Change Handler (Width-driven calculation when aspect ratio locked)
  const handleWidthChange = useCallback(
    (valStr: string) => {
      setWidthInputStr(valStr);
      setSelectedPresetId("custom");

      const num = parseFloat(valStr);
      if (!isNaN(num) && num > 0) {
        setWidthMm(num);

        if (isAspectLocked && lockedRatio > 0) {
          const newHeight = calculateProportionalDimension("width", num, lockedRatio);
          setHeightMm(newHeight);
          setHeightInputStr(String(newHeight));
        } else if (!isAspectLocked && heightMm > 0) {
          setLockedRatio(num / heightMm);
        }
      }
    },
    [isAspectLocked, lockedRatio, heightMm]
  );

  // Height Input Change Handler (Height-driven calculation when aspect ratio locked)
  const handleHeightChange = useCallback(
    (valStr: string) => {
      setHeightInputStr(valStr);
      setSelectedPresetId("custom");

      const num = parseFloat(valStr);
      if (!isNaN(num) && num > 0) {
        setHeightMm(num);

        if (isAspectLocked && lockedRatio > 0) {
          const newWidth = calculateProportionalDimension("height", num, lockedRatio);
          setWidthMm(newWidth);
          setWidthInputStr(String(newWidth));
        } else if (!isAspectLocked && widthMm > 0) {
          setLockedRatio(widthMm / num);
        }
      }
    },
    [isAspectLocked, lockedRatio, widthMm]
  );

  // DPI Preset Selection Handler
  const handleDpiPresetSelect = useCallback((selectedDpi: StandardDpiPreset) => {
    setIsCustomDpi(false);
    setDpi(selectedDpi);
    setCustomDpiStr(String(selectedDpi));
  }, []);

  // Custom DPI Input Handler
  const handleCustomDpiChange = useCallback((valStr: string) => {
    setCustomDpiStr(valStr);
    const num = parseInt(valStr, 10);
    if (!isNaN(num) && num > 0) {
      setDpi(num);
    }
  }, []);

  // Aspect Ratio Toggle Handler
  const toggleAspectLock = useCallback(() => {
    setIsAspectLocked((prev) => {
      const next = !prev;
      if (next && widthMm > 0 && heightMm > 0) {
        setLockedRatio(widthMm / heightMm);
      }
      return next;
    });
  }, [widthMm, heightMm]);

  // Sync with uploaded image's intrinsic aspect ratio
  const handleSyncImageRatio = useCallback(() => {
    if (!imageFile) return;
    const imgRatio = imageFile.dimensions.width / imageFile.dimensions.height;
    setLockedRatio(imgRatio);
    setIsAspectLocked(true);
    setSelectedPresetId("custom");

    // Recalculate height based on current width and image aspect ratio
    const newHeight = calculateProportionalDimension("width", widthMm, imgRatio);
    setHeightMm(newHeight);
    setHeightInputStr(String(newHeight));
  }, [imageFile, widthMm]);

  // Reset to default 35 × 45 mm at 300 DPI
  const handleResetDefaults = useCallback(() => {
    handlePresetChange("passport_standard");
  }, [handlePresetChange]);

  return (
    <div
      className={cn(
        "bg-white rounded-3xl border border-surface-200 p-5 sm:p-6 shadow-card space-y-6",
        className
      )}
    >
      {/* Header & Reset Action */}
      <div className="flex items-center justify-between pb-4 border-b border-surface-100">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <Ruler className="w-4 h-4" />
            </span>
            <h3 className="text-sm sm:text-base font-bold text-surface-900">
              Photo Dimensions & Resolution
            </h3>
          </div>
          <p className="text-[11px] text-surface-500">
            Physical millimetre sizing, DPI calibration & pixel calculation
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="text-surface-400 hover:text-surface-700 p-1.5 rounded-lg hover:bg-surface-100 transition-colors"
          title="Reset to 35 × 45 mm at 300 DPI"
          aria-label="Reset dimensions"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 1. Dimension Preset Selector */}
      <div className="space-y-1.5">
        <label
          htmlFor={presetSelectId}
          className="block text-xs font-semibold text-surface-700"
        >
          Standard Photo Preset
        </label>
        <div className="relative">
          <select
            id={presetSelectId}
            value={selectedPresetId}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="w-full text-xs font-medium bg-surface-50 border border-surface-200 text-surface-900 rounded-xl px-3 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all cursor-pointer"
          >
            {PHOTO_DIMENSION_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-surface-400">
            <Sliders className="w-3.5 h-3.5" />
          </div>
        </div>
        {selectedPresetId !== "custom" && (
          <p className="text-[11px] text-surface-500 font-sans">
            {
              PHOTO_DIMENSION_PRESETS.find((p) => p.id === selectedPresetId)
                ?.description
            }
          </p>
        )}
      </div>

      {/* 2. Physical Inputs: Width, Aspect Lock & Height */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-surface-700">
            Physical Dimensions (Millimetres)
          </span>

          {/* Sync with image aspect ratio button */}
          {imageFile && (
            <button
              type="button"
              onClick={handleSyncImageRatio}
              className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 hover:underline flex items-center gap-1"
              title="Lock dimensions to match original photo's aspect ratio"
            >
              <Sparkles className="w-3 h-3" />
              <span>Match Photo Ratio</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-11 gap-2 items-center">
          {/* Width Input (5 cols) */}
          <div className="col-span-5 space-y-1">
            <label
              htmlFor={widthInputId}
              className="text-[11px] font-medium text-surface-600 flex items-center justify-between"
            >
              <span>Width</span>
              <span className="font-mono text-surface-400 text-[10px]">mm</span>
            </label>
            <div className="relative">
              <input
                id={widthInputId}
                type="number"
                step="0.1"
                min={MIN_DIMENSION_MM}
                max={MAX_DIMENSION_MM}
                value={widthInputStr}
                onChange={(e) => handleWidthChange(e.target.value)}
                className={cn(
                  "w-full text-xs font-mono font-semibold bg-surface-50 border rounded-xl px-3 py-2 text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all",
                  calculationResult.errors?.width
                    ? "border-rose-300 bg-rose-50/50"
                    : "border-surface-200"
                )}
                aria-label="Photo width in millimetres"
              />
            </div>
            {calculationResult.errors?.width && (
              <p className="text-[10px] text-rose-600 font-medium">
                {calculationResult.errors.width}
              </p>
            )}
          </div>

          {/* Aspect Ratio Lock Button (1 col) */}
          <div className="col-span-1 flex justify-center pt-5">
            <button
              type="button"
              onClick={toggleAspectLock}
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-brand-500",
                isAspectLocked
                  ? "bg-brand-50 text-brand-600 border border-brand-200 shadow-sm hover:bg-brand-100"
                  : "bg-surface-100 text-surface-400 border border-surface-200 hover:text-surface-600 hover:bg-surface-200"
              )}
              title={
                isAspectLocked
                  ? "Aspect Ratio is LOCKED (changing one dimension recalculates the other)"
                  : "Aspect Ratio is UNLOCKED (independent width and height adjustments)"
              }
              aria-label={
                isAspectLocked ? "Unlock aspect ratio" : "Lock aspect ratio"
              }
              aria-pressed={isAspectLocked}
            >
              {isAspectLocked ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Unlock className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Height Input (5 cols) */}
          <div className="col-span-5 space-y-1">
            <label
              htmlFor={heightInputId}
              className="text-[11px] font-medium text-surface-600 flex items-center justify-between"
            >
              <span>Height</span>
              <span className="font-mono text-surface-400 text-[10px]">mm</span>
            </label>
            <div className="relative">
              <input
                id={heightInputId}
                type="number"
                step="0.1"
                min={MIN_DIMENSION_MM}
                max={MAX_DIMENSION_MM}
                value={heightInputStr}
                onChange={(e) => handleHeightChange(e.target.value)}
                className={cn(
                  "w-full text-xs font-mono font-semibold bg-surface-50 border rounded-xl px-3 py-2 text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all",
                  calculationResult.errors?.height
                    ? "border-rose-300 bg-rose-50/50"
                    : "border-surface-200"
                )}
                aria-label="Photo height in millimetres"
              />
            </div>
            {calculationResult.errors?.height && (
              <p className="text-[10px] text-rose-600 font-medium">
                {calculationResult.errors.height}
              </p>
            )}
          </div>
        </div>

        {/* Aspect Ratio Mode Indicator */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-surface-500 font-mono px-1 gap-1">
          <span>
            Target Ratio:{" "}
            <strong className="text-surface-800">
              {calculationResult.isValid
                ? `${(widthMm / heightMm).toFixed(2)}:1 (${calculationResult.aspectRatioFormatted})`
                : "—"}
            </strong>
          </span>
          <span className="text-[10px] text-surface-400">
            {isAspectLocked ? "🔒 Ratio Locked" : "🔓 Unlocked Freeform"}
          </span>
        </div>
      </div>

      {/* 3. DPI Selector & Custom Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-surface-700">
            Print Resolution (DPI / Dots Per Inch)
          </label>
          <span className="text-[10px] font-mono text-surface-400">
            {dpi === 300
              ? "Recommended Print Quality"
              : dpi === 600
              ? "Ultra-High Archival"
              : dpi === 72
              ? "Screen / Web Only"
              : `${dpi} DPI`}
          </span>
        </div>

        {/* Preset Buttons Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {SUPPORTED_DPI_PRESETS.map((presetDpi) => {
            const isSelected = !isCustomDpi && dpi === presetDpi;
            return (
              <button
                key={presetDpi}
                type="button"
                onClick={() => handleDpiPresetSelect(presetDpi)}
                className={cn(
                  "py-1.5 px-2 rounded-xl text-xs font-mono font-semibold transition-all border text-center focus:outline-none focus:ring-2 focus:ring-brand-500",
                  isSelected
                    ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                    : "bg-surface-50 text-surface-700 border-surface-200 hover:bg-surface-100 hover:border-surface-300"
                )}
                aria-pressed={isSelected}
              >
                {presetDpi}
              </button>
            );
          })}

          {/* Custom DPI Toggle Button */}
          <button
            type="button"
            onClick={() => setIsCustomDpi(true)}
            className={cn(
              "py-1.5 px-2 rounded-xl text-xs font-semibold transition-all border text-center focus:outline-none focus:ring-2 focus:ring-brand-500",
              isCustomDpi
                ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                : "bg-surface-50 text-surface-700 border-surface-200 hover:bg-surface-100 hover:border-surface-300"
            )}
            aria-pressed={isCustomDpi}
          >
            Custom
          </button>
        </div>

        {/* Custom DPI Input Field (shown when Custom is active) */}
        {isCustomDpi && (
          <div className="pt-2 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <input
                id={dpiInputId}
                type="number"
                min={MIN_DPI}
                max={MAX_DPI}
                value={customDpiStr}
                onChange={(e) => handleCustomDpiChange(e.target.value)}
                placeholder="Enter custom DPI (e.g. 240, 400)"
                className="w-full text-xs font-mono font-semibold bg-surface-50 border border-surface-200 rounded-xl px-3 py-2 text-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                aria-label="Custom DPI value"
              />
              <span className="text-xs font-mono text-surface-500 shrink-0">
                DPI
              </span>
            </div>
            {calculationResult.errors?.dpi && (
              <p className="text-[10px] text-rose-600 font-medium mt-1">
                {calculationResult.errors.dpi}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 4. Calculated Output Resolution Display Card */}
      <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200/90 space-y-3">
        <div className="flex items-center justify-between text-xs pb-2 border-b border-surface-200/70">
          <span className="font-bold text-surface-800 flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-brand-600" />
            <span>Calculated Output Pixels</span>
          </span>
          <span className="text-[10px] font-mono text-surface-500">
            Formula: (mm / 25.4) × DPI
          </span>
        </div>

        {calculationResult.isValid ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-xl border border-surface-200/80">
              <span className="block text-[10px] uppercase font-bold text-surface-400 font-mono tracking-wider">
                Output Width
              </span>
              <span className="text-lg sm:text-xl font-extrabold font-mono text-surface-900">
                {calculationResult.widthPx.toLocaleString()}{" "}
                <span className="text-xs font-normal text-surface-500">px</span>
              </span>
              <span className="block text-[10px] text-surface-400 font-mono mt-0.5">
                {widthMm} mm @ {dpi} DPI
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-surface-200/80">
              <span className="block text-[10px] uppercase font-bold text-surface-400 font-mono tracking-wider">
                Output Height
              </span>
              <span className="text-lg sm:text-xl font-extrabold font-mono text-surface-900">
                {calculationResult.heightPx.toLocaleString()}{" "}
                <span className="text-xs font-normal text-surface-500">px</span>
              </span>
              <span className="block text-[10px] text-surface-400 font-mono mt-0.5">
                {heightMm} mm @ {dpi} DPI
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
            Please enter valid physical dimensions and DPI to calculate output pixels.
          </div>
        )}

        {/* Calculation Summary Footer */}
        {calculationResult.isValid && (
          <div className="flex items-center justify-between text-[11px] font-mono text-surface-500 pt-1">
            <span>
              Total Area:{" "}
              <strong className="text-surface-700">
                {(
                  (calculationResult.widthPx * calculationResult.heightPx) /
                  1_000_000
                ).toFixed(2)}{" "}
                MP
              </strong>
            </span>
            <span className="text-surface-400">Nearest Whole Pixel Rounding</span>
          </div>
        )}
      </div>

      {/* 5. Image Resolution Analysis (Integrated with Uploaded Photo) */}
      {imageFile && qualityAssessment ? (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-surface-900 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-brand-600" />
              <span>Image Resolution & Quality Assessment</span>
            </span>
            <span
              className={cn(
                "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border",
                qualityAssessment.badgeVariant === "emerald"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : qualityAssessment.badgeVariant === "amber"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              )}
            >
              {qualityAssessment.title}
            </span>
          </div>

          {/* Comparison Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-200/80">
              <span className="text-[10px] text-surface-400 block font-mono">
                Original Image Pixels
              </span>
              <span className="font-mono font-bold text-surface-800 text-sm">
                {imageFile.dimensions.width} × {imageFile.dimensions.height} px
              </span>
              <span className="text-[10px] text-surface-500 block font-mono mt-0.5">
                {(
                  (imageFile.dimensions.width * imageFile.dimensions.height) /
                  1_000_000
                ).toFixed(1)}{" "}
                Megapixels
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-50 border border-surface-200/80">
              <span className="text-[10px] text-surface-400 block font-mono">
                Effective Print DPI
              </span>
              <span className="font-mono font-bold text-surface-800 text-sm">
                {qualityAssessment.effectiveDpi.effectiveDpi} DPI
              </span>
              <span className="text-[10px] text-surface-500 block font-mono mt-0.5">
                {qualityAssessment.effectiveDpi.limitingAxis !== "balanced"
                  ? `Limited by ${qualityAssessment.effectiveDpi.limitingAxis}`
                  : "Balanced resolution"}
              </span>
            </div>
          </div>

          {/* Quality Assessment Card */}
          <div
            className={cn(
              "p-4 rounded-2xl border text-xs space-y-2",
              qualityAssessment.badgeVariant === "emerald"
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                : qualityAssessment.badgeVariant === "amber"
                ? "bg-amber-50/70 border-amber-200 text-amber-950"
                : "bg-rose-50/70 border-rose-200 text-rose-950"
            )}
          >
            <div className="flex items-start gap-2.5">
              {qualityAssessment.badgeVariant === "emerald" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : qualityAssessment.badgeVariant === "amber" ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <h4 className="font-bold leading-tight">
                  {qualityAssessment.title}
                </h4>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {qualityAssessment.description}
                </p>
              </div>
            </div>

            {/* Disclaimer regarding upscaling */}
            <p className="text-[10px] opacity-75 pt-1 border-t border-current/10 font-sans italic">
              {qualityAssessment.disclaimer}
            </p>
          </div>

          {/* Aspect Ratio Mismatch Alert */}
          {qualityAssessment.aspectRatioMismatch && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h5 className="font-bold text-amber-950">
                  Aspect Ratio Mismatch Detected
                </h5>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Source photo ratio is{" "}
                  <strong>
                    {getFriendlyAspectRatioName(
                      qualityAssessment.sourceAspectRatio
                    )}
                  </strong>
                  , while the requested physical print ratio is{" "}
                  <strong>
                    {getFriendlyAspectRatioName(
                      qualityAssessment.targetAspectRatio
                    )}
                  </strong>{" "}
                  ({qualityAssessment.aspectRatioDeviationPercent}% difference).
                  Direct non-uniform scaling will distort facial features; cropping or framing will be required.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Standalone guide when no photo is uploaded yet */
        <div className="pt-2 border-t border-surface-100 flex items-start gap-2 text-surface-500 text-xs">
          <Info className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Upload a portrait photo to unlock live effective DPI analysis, source-to-target comparison, and optical quality verification.
          </p>
        </div>
      )}
    </div>
  );
};
