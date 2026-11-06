"use client";

import React, { useState, useEffect } from "react";
import type {
  DocumentSide,
  DocumentPrintSettings,
  DocumentDimensions,
  PrintQualityPreset,
  DocumentDimensionPreset,
  DocumentDimensionUnit,
} from "@/types/document-studio";
import {
  PRINT_QUALITY_PRESET_OPTIONS,
  DOCUMENT_DIMENSION_PRESETS,
  MIN_CUSTOM_DPI,
  MAX_CUSTOM_DPI,
  validateCustomDpi,
  validateDocumentDimensions,
  checkResolutionSufficiency,
  documentUnitToMm,
  mmToDocumentUnit,
} from "@/lib/document/document-dimensions";
import { cn } from "@/lib/utils/cn";
import {
  Printer,
  ChevronDown,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Info,
  Maximize2,
  Sparkles,
  Link2,
} from "lucide-react";

export interface DocumentPrintSettingsPanelProps {
  frontSettings: DocumentPrintSettings;
  backSettings: DocumentPrintSettings;
  frontDimensions: DocumentDimensions | null;
  backDimensions: DocumentDimensions | null;
  isDualSide: boolean;
  activeSide: DocumentSide;
  onSelectSide: (side: DocumentSide) => void;
  onChangeSettings: (
    side: DocumentSide,
    updates: Partial<DocumentPrintSettings>
  ) => void;
  onApplyToBoth?: (updates: Partial<DocumentPrintSettings>) => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  className?: string;
}

const UNIT_OPTIONS: Array<{ id: DocumentDimensionUnit; label: string; short: string }> = [
  { id: "mm", label: "Millimeters (mm)", short: "mm" },
  { id: "inch", label: "Inches (in)", short: "in" },
  { id: "px", label: "Pixels (px)", short: "px" },
];

export const DocumentPrintSettingsPanel: React.FC<DocumentPrintSettingsPanelProps> = ({
  frontSettings,
  backSettings,
  frontDimensions,
  backDimensions,
  isDualSide,
  activeSide,
  onSelectSide,
  onChangeSettings,
  onApplyToBoth,
  isOpen: controlledIsOpen,
  onToggleOpen: controlledToggleOpen,
  className,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const toggleOpen = controlledToggleOpen || (() => setInternalIsOpen((v) => !v));

  // Sync state: when enabled, modifications apply to both Front and Back sides
  const [syncSides, setSyncSides] = useState(true);

  // Active side settings and source dimensions
  const currentSettings = activeSide === "front" ? frontSettings : backSettings;
  const currentDimensions = activeSide === "front" ? frontDimensions : backDimensions;

  // Local state for custom DPI input to allow fluid typing before blur/commit
  const [customDpiText, setCustomDpiText] = useState(
    currentSettings.customDpi?.toString() || "300"
  );
  const [dpiError, setDpiError] = useState<string | null>(null);

  // Local state for width & height text inputs
  const [widthText, setWidthText] = useState(currentSettings.width.toString());
  const [heightText, setHeightText] = useState(currentSettings.height.toString());
  const [dimError, setDimError] = useState<string | null>(null);

  // Sync local text states when external active side or settings change
  useEffect(() => {
    setCustomDpiText(currentSettings.customDpi?.toString() || currentSettings.dpi.toString());
    setDpiError(null);
    setWidthText(currentSettings.width.toString());
    setHeightText(currentSettings.height.toString());
    setDimError(null);
  }, [currentSettings, activeSide]);

  // Handler to dispatch setting updates (optionally syncing both sides)
  const applySettingUpdates = (updates: Partial<DocumentPrintSettings>) => {
    if (syncSides && isDualSide && onApplyToBoth) {
      onApplyToBoth(updates);
    } else if (syncSides && isDualSide) {
      onChangeSettings("front", updates);
      onChangeSettings("back", updates);
    } else {
      onChangeSettings(activeSide, updates);
    }
  };

  // Resolution sufficiency diagnostic
  const resolutionCheck = checkResolutionSufficiency({
    sourceDimensions: currentDimensions,
    targetWidthMm: currentSettings.widthMm,
    targetHeightMm: currentSettings.heightMm,
    selectedDpi: currentSettings.dpi,
    dimensionPreset: currentSettings.dimensionPreset,
  });

  // Quality preset selection
  const handleQualityPresetSelect = (presetId: PrintQualityPreset) => {
    setDpiError(null);
    if (presetId === "custom") {
      applySettingUpdates({
        qualityPreset: "custom",
        dpi: currentSettings.customDpi || 300,
      });
    } else {
      applySettingUpdates({ qualityPreset: presetId });
    }
  };

  // Custom DPI input changes
  const handleCustomDpiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setCustomDpiText(valStr);

    const valResult = validateCustomDpi(valStr);
    if (valResult.isValid) {
      setDpiError(null);
      applySettingUpdates({
        qualityPreset: "custom",
        customDpi: valResult.dpi,
        dpi: valResult.dpi,
      });
    } else {
      setDpiError(valResult.error || "Invalid DPI");
    }
  };

  // Dimension preset selection
  const handleDimensionPresetSelect = (presetId: DocumentDimensionPreset) => {
    setDimError(null);
    applySettingUpdates({ dimensionPreset: presetId });
  };

  // Unit switcher
  const handleUnitSelect = (unit: DocumentDimensionUnit) => {
    if (unit === currentSettings.unit) return;
    setDimError(null);
    applySettingUpdates({ unit });
  };

  // Aspect ratio lock toggle
  const handleToggleAspectRatio = () => {
    applySettingUpdates({
      maintainAspectRatio: !currentSettings.maintainAspectRatio,
      aspectRatio:
        currentSettings.width > 0 && currentSettings.height > 0
          ? currentSettings.width / currentSettings.height
          : currentSettings.aspectRatio,
    });
  };

  // Width input change
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setWidthText(valStr);
    const num = parseFloat(valStr);

    if (isNaN(num) || num <= 0) {
      setDimError("Width must be greater than 0");
      return;
    }

    const valResult = validateDocumentDimensions(
      num,
      currentSettings.height,
      currentSettings.unit,
      currentSettings.dpi
    );

    if (!valResult.isValid && valResult.errors.width) {
      setDimError(valResult.errors.width);
      return;
    }

    setDimError(null);
    applySettingUpdates({ width: num });
  };

  // Height input change
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setHeightText(valStr);
    const num = parseFloat(valStr);

    if (isNaN(num) || num <= 0) {
      setDimError("Height must be greater than 0");
      return;
    }

    const valResult = validateDocumentDimensions(
      currentSettings.width,
      num,
      currentSettings.unit,
      currentSettings.dpi
    );

    if (!valResult.isValid && valResult.errors.height) {
      setDimError(valResult.errors.height);
      return;
    }

    setDimError(null);
    applySettingUpdates({ height: num });
  };

  // Preset display name
  const currentPresetDef = DOCUMENT_DIMENSION_PRESETS[currentSettings.dimensionPreset];
  const presetDisplayName = currentPresetDef ? currentPresetDef.name : "Custom";

  return (
    <div
      className={cn(
        "bg-white dark:bg-surface-800/90 rounded-2xl border border-surface-200 dark:border-surface-700/80 shadow-subtle transition-all overflow-hidden",
        className
      )}
    >
      {/* 1. Compact Panel Header with Side Switcher & Summary */}
      <div
        onClick={toggleOpen}
        className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between cursor-pointer select-none bg-surface-50/70 dark:bg-surface-800/50 hover:bg-surface-100/70 dark:hover:bg-surface-700/50 transition-colors gap-2"
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleOpen();
          }
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 flex items-center justify-center shrink-0">
            <Printer className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-2 truncate">
            <h3 className="text-xs sm:text-sm font-bold text-surface-900 dark:text-surface-100 truncate">
              Print Quality & Dimensions
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/50 shrink-0 font-mono">
              {presetDisplayName} ({currentSettings.widthMm.toFixed(1)}×{currentSettings.heightMm.toFixed(1)} mm) • {currentSettings.dpi} DPI
            </span>
          </div>
        </div>

        {/* Center / Right: Interactive Side Switcher (Dual-Side) + Toggle Chevron */}
        <div className="flex items-center gap-2 shrink-0">
          {isDualSide && (
            <div
              className="inline-flex rounded-lg p-0.5 bg-surface-200/80 dark:bg-surface-700/70 border border-surface-300/70 dark:border-surface-600 text-[11px]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => onSelectSide("front")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5",
                  activeSide === "front"
                    ? "bg-white dark:bg-surface-800 text-brand-700 dark:text-brand-300 shadow-2xs font-bold"
                    : "text-surface-600 dark:text-surface-400 hover:text-surface-900"
                )}
              >
                <span>Front Side</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectSide("back")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5",
                  activeSide === "back"
                    ? "bg-white dark:bg-surface-800 text-brand-700 dark:text-brand-300 shadow-2xs font-bold"
                    : "text-surface-600 dark:text-surface-400 hover:text-surface-900"
                )}
              >
                <span>Back Side</span>
              </button>
            </div>
          )}

          <ChevronDown
            className={cn(
              "w-4 h-4 text-surface-500 transition-transform duration-200 shrink-0",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </div>

      {/* 2. Expanded Settings Body */}
      {isOpen && (
        <div className="p-3.5 sm:p-4 space-y-4 border-t border-surface-200/80 dark:border-surface-700">
          {/* Dual-Side Synchronization Toggle */}
          {isDualSide && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-surface-50 dark:bg-surface-900/40 border border-surface-200/70 dark:border-surface-700 text-xs">
              <div className="flex items-center gap-1.5 text-surface-600 dark:text-surface-300">
                <Link2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                <span className="font-medium">
                  Synchronize Print Settings:
                </span>
                <span className="text-[11px] text-surface-500 hidden sm:inline">
                  {syncSides ? "Front and Back print sizes stay identical" : "Configuring sides independently"}
                </span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-surface-700 dark:text-surface-200">
                <input
                  type="checkbox"
                  checked={syncSides}
                  onChange={(e) => setSyncSides(e.target.checked)}
                  className="rounded border-surface-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                />
                <span>Sync Both Sides</span>
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* SECTION 1: PRINT QUALITY (DPI) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-surface-800 dark:text-surface-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Print Quality (DPI)</span>
                </label>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-700 text-surface-800 dark:text-surface-200">
                  {currentSettings.dpi} DPI Selected
                </span>
              </div>

              {/* DPI Presets Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {PRINT_QUALITY_PRESET_OPTIONS.map((opt) => {
                  const isSelected =
                    currentSettings.qualityPreset === opt.id ||
                    (opt.id !== "custom" && currentSettings.qualityPreset !== "custom" && currentSettings.dpi === opt.dpi);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleQualityPresetSelect(opt.id)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all text-center",
                        isSelected
                          ? "bg-brand-600 text-white border-brand-600 shadow-2xs font-bold"
                          : "bg-surface-50 dark:bg-surface-700/60 text-surface-700 dark:text-surface-300 border-surface-200/80 dark:border-surface-600 hover:bg-surface-100"
                      )}
                      title={opt.description}
                    >
                      <span className="block truncate">{opt.name.replace(" Quality", "")}</span>
                      <span className={cn("text-[10px] block opacity-85", isSelected ? "text-white" : "text-surface-500")}>
                        {opt.id === "custom" ? "Custom" : `${opt.dpi} DPI`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom DPI Input (Visible when Custom is selected or editable) */}
              {currentSettings.qualityPreset === "custom" && (
                <div className="space-y-1 p-2.5 rounded-xl bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="custom-dpi-input" className="font-semibold text-surface-700 dark:text-surface-300">
                      Enter Custom DPI:
                    </label>
                    <span className="text-[10px] text-surface-500">
                      Bounds: {MIN_CUSTOM_DPI} – {MAX_CUSTOM_DPI} DPI
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="custom-dpi-input"
                      type="number"
                      min={MIN_CUSTOM_DPI}
                      max={MAX_CUSTOM_DPI}
                      step={10}
                      value={customDpiText}
                      onChange={handleCustomDpiChange}
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="e.g. 300"
                    />
                    <span className="text-xs font-bold text-surface-500 shrink-0">DPI</span>
                  </div>
                  {dpiError && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                      {dpiError}
                    </p>
                  )}
                </div>
              )}

              <p className="text-[11px] text-surface-500 dark:text-surface-400 flex items-start gap-1">
                <Info className="w-3.5 h-3.5 text-surface-400 shrink-0 mt-0.5" />
                <span>
                  Original image pixels are kept unchanged. DPI specifies layout density for standard physical printing and avoids artificial upscaling.
                </span>
              </p>
            </div>

            {/* SECTION 2: DOCUMENT DIMENSIONS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-surface-800 dark:text-surface-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Document Dimensions</span>
                </label>

                {/* Unit Switcher Tabs */}
                <div className="inline-flex rounded-lg p-0.5 bg-surface-100 dark:bg-surface-700 text-[10px] font-semibold">
                  {UNIT_OPTIONS.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleUnitSelect(u.id)}
                      className={cn(
                        "px-2 py-0.5 rounded-md transition-all",
                        currentSettings.unit === u.id
                          ? "bg-white dark:bg-surface-800 text-brand-700 dark:text-brand-300 shadow-2xs font-bold"
                          : "text-surface-600 dark:text-surface-400 hover:text-surface-900"
                      )}
                      title={`Switch dimensions to ${u.label}`}
                    >
                      {u.short}
                    </button>
                  ))}
                </div>
              </div>

              {/* Document Size Presets Pills */}
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(DOCUMENT_DIMENSION_PRESETS) as DocumentDimensionPreset[]).map((pKey) => {
                  const pDef = DOCUMENT_DIMENSION_PRESETS[pKey];
                  const isSelected = currentSettings.dimensionPreset === pKey;
                  return (
                    <button
                      key={pKey}
                      type="button"
                      onClick={() => handleDimensionPresetSelect(pKey)}
                      className={cn(
                        "px-2.5 py-1 rounded-xl text-xs font-medium border transition-all",
                        isSelected
                          ? "bg-brand-600 text-white border-brand-600 shadow-2xs font-bold"
                          : "bg-surface-50 dark:bg-surface-700/60 text-surface-700 dark:text-surface-300 border-surface-200/80 dark:border-surface-600 hover:bg-surface-100"
                      )}
                      title={pDef.description}
                    >
                      {pDef.name}
                    </button>
                  );
                })}
              </div>

              {/* Dimension Inputs (Width & Height) + Maintain Aspect Ratio */}
              <div className="p-2.5 rounded-xl bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 space-y-2">
                <div className="grid grid-cols-5 gap-2 items-center">
                  {/* Width Input */}
                  <div className="col-span-2 space-y-1">
                    <label htmlFor={`dim-w-${activeSide}`} className="text-[11px] font-semibold text-surface-700 dark:text-surface-300 flex items-center justify-between">
                      <span>Width</span>
                      <span className="text-[10px] text-surface-400 font-mono">({currentSettings.unit})</span>
                    </label>
                    <input
                      id={`dim-w-${activeSide}`}
                      type="number"
                      step={currentSettings.unit === "px" ? 1 : 0.1}
                      min={0.1}
                      value={widthText}
                      onChange={handleWidthChange}
                      className="w-full px-2.5 py-1 text-xs font-mono rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  {/* Aspect Ratio Lock Button */}
                  <div className="col-span-1 flex flex-col items-center justify-center pt-4">
                    <button
                      type="button"
                      onClick={handleToggleAspectRatio}
                      className={cn(
                        "p-1.5 rounded-lg border transition-all",
                        currentSettings.maintainAspectRatio
                          ? "bg-brand-50 text-brand-700 border-brand-300 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800"
                          : "bg-surface-200 dark:bg-surface-700 text-surface-500 border-surface-300 dark:border-surface-600"
                      )}
                      title={
                        currentSettings.maintainAspectRatio
                          ? "Maintain Aspect Ratio (Locked). Proportions preserved."
                          : "Maintain Aspect Ratio (Unlocked). Width & height adjust independently."
                      }
                      aria-label="Toggle maintain aspect ratio"
                    >
                      {currentSettings.maintainAspectRatio ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span className="text-[9px] text-surface-400 mt-0.5">
                      {currentSettings.maintainAspectRatio ? "Locked" : "Free"}
                    </span>
                  </div>

                  {/* Height Input */}
                  <div className="col-span-2 space-y-1">
                    <label htmlFor={`dim-h-${activeSide}`} className="text-[11px] font-semibold text-surface-700 dark:text-surface-300 flex items-center justify-between">
                      <span>Height</span>
                      <span className="text-[10px] text-surface-400 font-mono">({currentSettings.unit})</span>
                    </label>
                    <input
                      id={`dim-h-${activeSide}`}
                      type="number"
                      step={currentSettings.unit === "px" ? 1 : 0.1}
                      min={0.1}
                      value={heightText}
                      onChange={handleHeightChange}
                      className="w-full px-2.5 py-1 text-xs font-mono rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                {dimError && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    {dimError}
                  </p>
                )}

                {/* Target Physical & Pixel Calculation Summary */}
                <div className="pt-2 border-t border-surface-200/80 dark:border-surface-700/80 flex items-center justify-between text-[11px] text-surface-500 font-mono">
                  <span>
                    Print: {currentSettings.widthMm.toFixed(2)} × {currentSettings.heightMm.toFixed(2)} mm ({(currentSettings.widthMm / 25.4).toFixed(2)} × {(currentSettings.heightMm / 25.4).toFixed(2)} in)
                  </span>
                  <span className="font-bold text-surface-700 dark:text-surface-300">
                    {currentSettings.targetWidthPx} × {currentSettings.targetHeightPx} px
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Resolution Sufficiency Warning or Success Badge */}
          {resolutionCheck.hasDimensions && (
            <div className="pt-1">
              {resolutionCheck.isInsufficient ? (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-800 dark:text-amber-300">
                      Source Resolution Insufficient for {currentSettings.dpi} DPI
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      {resolutionCheck.message}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="px-3 py-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium text-[11px]">
                      Source resolution ({resolutionCheck.sourceWidthPx} × {resolutionCheck.sourceHeightPx} px, ~{resolutionCheck.effectiveDpi} DPI) meets target quality.
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                    CR80 High-Res
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
