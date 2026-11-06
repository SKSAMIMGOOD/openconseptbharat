"use client";

import React, { useState } from "react";
import {
  Sun,
  Moon,
  Monitor,
  Check,
  RotateCcw,
  ShieldCheck,
  Printer,
  Ruler,
  FileImage,
  Sliders,
  Palette,
  Eye,
  Cpu,
  AlertTriangle,
  Sparkles,
  Info,
  CheckCircle2,
  HardDrive,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { usePreferences } from "@/hooks/usePreferences";
import {
  THEME_OPTIONS,
  DPI_OPTIONS,
  UNIT_OPTIONS,
  EXPORT_FORMAT_OPTIONS,
  BACKGROUND_COLOR_PRESETS,
  PREVIEW_MODE_OPTIONS,
  PERFORMANCE_OPTIONS,
} from "@/constants/settings";
import {
  AppTheme,
  DefaultDpi,
  DefaultPhotoUnit,
  DefaultExportFormat,
  DefaultPreviewMode,
  PerformancePreference,
} from "@/types/settings";
import { cn } from "@/lib/utils/cn";

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings, isLoaded } = usePreferences();

  // Reset confirmation modal state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  const showFeedback = (message: string) => {
    setSaveBanner(message);
    setTimeout(() => {
      setSaveBanner(null);
    }, 3000);
  };

  const handleThemeChange = (theme: AppTheme) => {
    updateSettings({ theme });
    showFeedback(`Theme updated to ${theme.toUpperCase()}`);
  };

  const handleDpiChange = (defaultDpi: DefaultDpi) => {
    updateSettings({ defaultDpi });
    showFeedback(`Default DPI set to ${defaultDpi} DPI`);
  };

  const handleUnitChange = (defaultUnit: DefaultPhotoUnit) => {
    updateSettings({ defaultUnit });
    showFeedback(`Default unit set to ${defaultUnit}`);
  };

  const handleExportFormatChange = (defaultExportFormat: DefaultExportFormat) => {
    updateSettings({ defaultExportFormat });
    showFeedback(
      `Default export format set to ${
        defaultExportFormat === "image/png" ? "PNG" : "JPEG"
      }`
    );
  };

  const handleJpegQualityChange = (quality: number) => {
    updateSettings({ defaultJpegQuality: quality });
  };

  const handleBackgroundColorChange = (color: string) => {
    updateSettings({ defaultBackgroundColor: color });
    showFeedback(`Default background set to ${color}`);
  };

  const handlePreviewModeChange = (mode: DefaultPreviewMode) => {
    updateSettings({ defaultPreviewMode: mode });
    showFeedback("Default preview mode updated");
  };

  const handlePerformanceChange = (pref: PerformancePreference) => {
    updateSettings({ performancePreference: pref });
    showFeedback("Performance preference updated");
  };

  const handleConfirmReset = () => {
    resetSettings();
    setShowResetConfirm(false);
    showFeedback("All preferences successfully restored to factory defaults");
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col">
        <PageHeader
          title="Application Settings & User Preferences"
          subtitle="Loading your personalized browser preferences..."
          badge="Global Preferences"
          breadcrumbs={[{ label: "Settings" }]}
        />
        <div className="max-w-5xl mx-auto px-4 py-12 text-center text-surface-500">
          <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm">Synchronizing local preferences...</p>
        </div>
      </div>
    );
  }

  const isCustomColor = !BACKGROUND_COLOR_PRESETS.some(
    (p) => p.value.toLowerCase() === settings.defaultBackgroundColor.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col text-surface-900 dark:text-surface-100 transition-colors duration-150">
      <PageHeader
        title="Application Settings & User Preferences"
        subtitle="Customize global defaults for photo cropping, DPI calculations, print sheets, preview modes, and appearance. All preferences are preserved strictly in your browser's localStorage."
        badge="Phase 07: Global Settings"
        breadcrumbs={[{ label: "Settings" }]}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              className="text-surface-700 dark:text-surface-300 border-surface-300 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-surface-500" />
              <span>Reset to Defaults</span>
            </Button>
          </div>
        }
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 flex-1 w-full space-y-10">
        {/* Real-time Save Feedback Alert */}
        {saveBanner && (
          <div
            role="status"
            className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm font-medium flex items-center gap-2.5 shadow-sm animate-in fade-in"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{saveBanner}</span>
          </div>
        )}

        {/* SECTION 1: APPEARANCE */}
        <section aria-labelledby="heading-appearance" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2
                id="heading-appearance"
                className="text-lg font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2"
              >
                <Sun className="w-5 h-5 text-amber-500" />
                <span>Appearance & Theme</span>
              </h2>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Choose between system synchronization, bright daylight, or low-light dark mode.
              </p>
            </div>
            <Badge variant="neutral" size="sm">
              Current: {settings.theme.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {THEME_OPTIONS.map((opt) => {
              const isSelected = settings.theme === opt.value;
              const Icon =
                opt.value === "dark" ? Moon : opt.value === "light" ? Sun : Monitor;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleThemeChange(opt.value)}
                  className={cn(
                    "p-5 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                    isSelected
                      ? "bg-brand-50/50 dark:bg-brand-950/40 border-brand-500 dark:border-brand-500 shadow-sm ring-1 ring-brand-500"
                      : "bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800 hover:border-surface-300 dark:hover:border-surface-700 shadow-subtle"
                  )}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        opt.value === "dark"
                          ? "bg-indigo-900/40 text-indigo-400 border border-indigo-700/50"
                          : opt.value === "light"
                          ? "bg-amber-100 text-amber-700 border border-amber-200"
                          : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 border border-surface-200 dark:border-surface-700"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-surface-900 dark:text-surface-100">
                        {opt.label}
                      </span>
                      {opt.badge && (
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: GENERAL PREFERENCES */}
        <section aria-labelledby="heading-general" className="space-y-6 pt-6 border-t border-surface-200 dark:border-surface-800">
          <div>
            <h2
              id="heading-general"
              className="text-lg font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2"
            >
              <Sliders className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <span>General Photo & Document Preferences</span>
            </h2>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Configure initial defaults for the Photo Studio, Custom Dimensions, DPI Calculator, and Sheet Generator.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Default DPI */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-surface-900 dark:text-surface-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-brand-600" />
                  <span>Default Resolution (DPI)</span>
                </label>
                <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                  {settings.defaultDpi} DPI
                </span>
              </div>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Applied automatically when cropping photos and preparing multi-copy print sheets.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {DPI_OPTIONS.map((dpiOpt) => {
                  const isSelected = settings.defaultDpi === dpiOpt.value;
                  return (
                    <button
                      key={dpiOpt.value}
                      type="button"
                      onClick={() => handleDpiChange(dpiOpt.value)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        isSelected
                          ? "bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-900 dark:text-brand-200 ring-1 ring-brand-500 font-bold"
                          : "bg-surface-50 dark:bg-surface-800/60 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 font-medium"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs">{dpiOpt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-brand-600" />}
                      </div>
                      <span className="text-[10px] text-surface-400 dark:text-surface-500 block mt-1 line-clamp-1">
                        {dpiOpt.badge || "Standard"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* 2. Default Photo Measurement Unit */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-surface-900 dark:text-surface-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-brand-600" />
                  <span>Default Photo Unit</span>
                </label>
                <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                  {settings.defaultUnit}
                </span>
              </div>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Default measurement system for custom passport and visa dimensions.
              </p>

              <div className="grid grid-cols-3 gap-2">
                {UNIT_OPTIONS.map((unitOpt) => {
                  const isSelected = settings.defaultUnit === unitOpt.value;
                  return (
                    <button
                      key={unitOpt.value}
                      type="button"
                      onClick={() => handleUnitChange(unitOpt.value)}
                      className={cn(
                        "p-3 rounded-xl border text-center transition-all",
                        isSelected
                          ? "bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-900 dark:text-brand-200 ring-1 ring-brand-500 font-bold"
                          : "bg-surface-50 dark:bg-surface-800/60 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 font-medium"
                      )}
                    >
                      <div className="text-xs">{unitOpt.label.split(" ")[0]}</div>
                      <span className="text-[10px] text-surface-400 block mt-0.5">
                        ({unitOpt.value})
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* 3. Default Export Format */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-surface-900 dark:text-surface-100 uppercase tracking-wider flex items-center gap-1.5">
                  <FileImage className="w-4 h-4 text-brand-600" />
                  <span>Default Export Format</span>
                </label>
                <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                  {settings.defaultExportFormat === "image/png" ? "PNG" : "JPEG"}
                </span>
              </div>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Default encoding format preselected in export and download dialogs.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {EXPORT_FORMAT_OPTIONS.map((fmt) => {
                  const isSelected = settings.defaultExportFormat === fmt.value;
                  return (
                    <button
                      key={fmt.value}
                      type="button"
                      onClick={() => handleExportFormatChange(fmt.value)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        isSelected
                          ? "bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-900 dark:text-brand-200 ring-1 ring-brand-500 font-bold"
                          : "bg-surface-50 dark:bg-surface-800/60 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 font-medium"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs">{fmt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-brand-600" />}
                      </div>
                      <span className="text-[10px] text-surface-400 block mt-1 line-clamp-1">
                        {fmt.value === "image/png" ? "Alpha transparency" : "Solid backdrop"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* 4. JPEG Quality Setting */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="jpeg-quality-slider"
                  className="text-xs font-bold text-surface-900 dark:text-surface-100 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Sliders className="w-4 h-4 text-brand-600" />
                  <span>JPEG Export Quality</span>
                </label>
                <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                  {Math.round(settings.defaultJpegQuality * 100)}%
                </span>
              </div>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Compression ratio for JPEG exports. 92% offers near-lossless clarity with compact file size.
              </p>

              <div className="space-y-3 pt-1">
                <input
                  id="jpeg-quality-slider"
                  type="range"
                  min="0.70"
                  max="1.00"
                  step="0.01"
                  value={settings.defaultJpegQuality}
                  onChange={(e) => handleJpegQualityChange(parseFloat(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer"
                  aria-label="JPEG Export Quality"
                />

                <div className="flex items-center justify-between gap-1 text-[11px] text-surface-500">
                  <button
                    type="button"
                    onClick={() => handleJpegQualityChange(0.75)}
                    className={cn(
                      "px-2 py-1 rounded-lg border",
                      settings.defaultJpegQuality === 0.75
                        ? "bg-brand-50 border-brand-400 text-brand-700 font-bold"
                        : "border-surface-200 hover:bg-surface-100"
                    )}
                  >
                    75% (Small)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleJpegQualityChange(0.85)}
                    className={cn(
                      "px-2 py-1 rounded-lg border",
                      settings.defaultJpegQuality === 0.85
                        ? "bg-brand-50 border-brand-400 text-brand-700 font-bold"
                        : "border-surface-200 hover:bg-surface-100"
                    )}
                  >
                    85% (Balanced)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleJpegQualityChange(0.92)}
                    className={cn(
                      "px-2 py-1 rounded-lg border",
                      settings.defaultJpegQuality === 0.92
                        ? "bg-brand-50 border-brand-400 text-brand-700 font-bold"
                        : "border-surface-200 hover:bg-surface-100"
                    )}
                  >
                    92% (High)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleJpegQualityChange(0.98)}
                    className={cn(
                      "px-2 py-1 rounded-lg border",
                      settings.defaultJpegQuality === 0.98
                        ? "bg-brand-50 border-brand-400 text-brand-700 font-bold"
                        : "border-surface-200 hover:bg-surface-100"
                    )}
                  >
                    98% (Max)
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* SECTION 3: IMAGE PROCESSING PREFERENCES */}
        <section aria-labelledby="heading-processing" className="space-y-6 pt-6 border-t border-surface-200 dark:border-surface-800">
          <div>
            <h2
              id="heading-processing"
              className="text-lg font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2"
            >
              <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Image Processing & Studio Defaults</span>
            </h2>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Customize default studio background colors, preview comparison views, and hardware acceleration preference.
            </p>
          </div>

          <div className="space-y-6">
            {/* 1. Default Background Color */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-surface-900 dark:text-surface-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-brand-600" />
                  <span>Default Studio Background Color</span>
                </label>
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border border-surface-300 dark:border-surface-600 shadow-sm"
                    style={{
                      backgroundColor:
                        settings.defaultBackgroundColor === "transparent"
                          ? "#ffffff"
                          : settings.defaultBackgroundColor,
                      backgroundImage:
                        settings.defaultBackgroundColor === "transparent"
                          ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                          : undefined,
                      backgroundSize: "6px 6px",
                    }}
                  />
                  <span className="text-xs font-mono font-bold text-surface-700 dark:text-surface-300">
                    {settings.defaultBackgroundColor}
                  </span>
                </div>
              </div>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Applied to cutout portraits in Background Remover and photo canvas framing in Photo Studio.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {BACKGROUND_COLOR_PRESETS.map((preset) => {
                  const isSelected =
                    settings.defaultBackgroundColor.toLowerCase() ===
                    preset.value.toLowerCase();

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleBackgroundColorChange(preset.value)}
                      className={cn(
                        "p-2.5 rounded-xl border flex flex-col items-center gap-2 transition-all text-center",
                        isSelected
                          ? "bg-brand-50 dark:bg-brand-950/60 border-brand-500 ring-1 ring-brand-500 font-bold"
                          : "bg-surface-50 dark:bg-surface-800/60 border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800"
                      )}
                    >
                      <div
                        className="w-8 h-8 rounded-lg border border-surface-300 dark:border-surface-600 shadow-inner flex items-center justify-center"
                        style={{
                          backgroundColor:
                            preset.value === "transparent" ? "#ffffff" : preset.value,
                          backgroundImage:
                            preset.value === "transparent"
                              ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                              : undefined,
                          backgroundSize: "8px 8px",
                        }}
                      >
                        {isSelected && (
                          <Check
                            className={cn(
                              "w-4 h-4",
                              preset.value === "#FFFFFF" || preset.value === "transparent" || preset.value === "#D0E8FF"
                                ? "text-surface-900"
                                : "text-white"
                            )}
                          />
                        )}
                      </div>
                      <span className="text-[11px] truncate max-w-[90px]">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}

                {/* Custom Hex Picker Button */}
                <div
                  className={cn(
                    "p-2.5 rounded-xl border flex flex-col items-center gap-2 transition-all text-center",
                    isCustomColor
                      ? "bg-brand-50 dark:bg-brand-950/60 border-brand-500 ring-1 ring-brand-500 font-bold"
                      : "bg-surface-50 dark:bg-surface-800/60 border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800"
                  )}
                >
                  <input
                    type="color"
                    id="custom-color-picker"
                    value={isCustomColor ? settings.defaultBackgroundColor : "#3B82F6"}
                    onChange={(e) => handleBackgroundColorChange(e.target.value)}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0 bg-transparent"
                    aria-label="Pick custom background hex color"
                  />
                  <label
                    htmlFor="custom-color-picker"
                    className="text-[11px] truncate max-w-[90px] cursor-pointer"
                  >
                    Custom Hex
                  </label>
                </div>
              </div>
            </Card>

            {/* 2. Default Preview Mode */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-surface-900 dark:text-surface-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-brand-600" />
                  <span>Default Preview Mode (Background Remover)</span>
                </label>
                <Badge variant="neutral" size="sm">
                  {settings.defaultPreviewMode}
                </Badge>
              </div>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Determines how segmented cutouts and source images are initially rendered in the inspection workspace.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {PREVIEW_MODE_OPTIONS.map((pm) => {
                  const isSelected = settings.defaultPreviewMode === pm.value;
                  return (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => handlePreviewModeChange(pm.value)}
                      className={cn(
                        "p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2",
                        isSelected
                          ? "bg-brand-50 dark:bg-brand-950/60 border-brand-500 ring-1 ring-brand-500 font-bold"
                          : "bg-surface-50 dark:bg-surface-800/60 border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 font-medium"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-surface-900 dark:text-surface-100">
                          {pm.label}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-brand-600" />}
                      </div>
                      <p className="text-[11px] text-surface-500 dark:text-surface-400 leading-tight">
                        {pm.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* 3. Performance / Execution Provider Preference */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-surface-900 dark:text-surface-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-brand-600" />
                  <span>Image Processing Hardware Acceleration</span>
                </label>
                <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                  {settings.performancePreference.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Select preferred execution backend for in-browser ONNX neural networks and canvas rasterization.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PERFORMANCE_OPTIONS.map((perf) => {
                  const isSelected = settings.performancePreference === perf.value;
                  return (
                    <button
                      key={perf.value}
                      type="button"
                      onClick={() => handlePerformanceChange(perf.value)}
                      className={cn(
                        "p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5",
                        isSelected
                          ? "bg-brand-50 dark:bg-brand-950/60 border-brand-500 ring-1 ring-brand-500 font-bold"
                          : "bg-surface-50 dark:bg-surface-800/60 border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 font-medium"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-surface-900 dark:text-surface-100">
                          {perf.label}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-brand-600" />}
                      </div>
                      <p className="text-[11px] text-surface-500 dark:text-surface-400 leading-tight">
                        {perf.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        </section>

        {/* SECTION 4: PRIVACY & DATA ISOLATION NOTICE */}
        <section aria-labelledby="heading-privacy" className="space-y-4 pt-6 border-t border-surface-200 dark:border-surface-800">
          <div className="p-6 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800 shadow-subtle space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3
                  id="heading-privacy"
                  className="text-base font-bold text-emerald-950 dark:text-emerald-100 tracking-tight"
                >
                  Privacy, Storage & Local Processing Verification
                </h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                  Verified client-side data isolation policy for user preferences and document security.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-emerald-900/90 dark:text-emerald-200/90 pt-2">
              <div className="p-3.5 rounded-xl bg-white/70 dark:bg-surface-900/70 border border-emerald-200/60 dark:border-emerald-800/60 space-y-1">
                <strong className="block text-emerald-950 dark:text-emerald-100 font-bold">
                  1. Local Browser Processing
                </strong>
                <span>
                  All images, PDF documents, and biometric scans are processed strictly in your local browser memory using Canvas, Web Workers, and WebAssembly.
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/70 dark:bg-surface-900/70 border border-emerald-200/60 dark:border-emerald-800/60 space-y-1">
                <strong className="block text-emerald-950 dark:text-emerald-100 font-bold">
                  2. Zero Server Uploads
                </strong>
                <span>
                  Images are not uploaded, transmitted, or logged to any cloud server or third-party endpoint. Your files remain exclusively in volatile device RAM.
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/70 dark:bg-surface-900/70 border border-emerald-200/60 dark:border-emerald-800/60 space-y-1">
                <strong className="block text-emerald-950 dark:text-emerald-100 font-bold">
                  3. Local Preferences Storage
                </strong>
                <span>
                  Application preferences (such as theme, default DPI, and units) are stored locally in your browser&apos;s localStorage. Never image data, blobs, or files.
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/70 dark:bg-surface-900/70 border border-emerald-200/60 dark:border-emerald-800/60 space-y-1">
                <strong className="block text-emerald-950 dark:text-emerald-100 font-bold">
                  4. Browser Data Cleansing
                </strong>
                <span>
                  Clearing your browser cache, site data, or private browsing session will reset these stored preferences back to factory defaults.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: ACTIONS & STATUS */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 border border-brand-200 dark:border-brand-800">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-surface-900 dark:text-surface-100 block">
                Local Storage Persistence Active
              </span>
              <span className="text-[11px] text-surface-500 dark:text-surface-400">
                All preference changes are automatically committed to your browser immediately.
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowResetConfirm(true)}
            className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/60 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            <span>Reset All Preferences</span>
          </Button>
        </section>
      </main>

      {/* Confirmation Modal for Resetting Preferences */}
      {showResetConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3
                id="confirm-modal-title"
                className="text-lg font-bold text-surface-900 dark:text-surface-100 tracking-tight"
              >
                Reset Preferences to Factory Defaults?
              </h3>
              <p className="text-xs text-surface-600 dark:text-surface-400 mt-2 leading-relaxed">
                This will restore all default DPI values, theme settings, measurement units, export formats, and image processing preferences to their original settings.
              </p>
              <p className="text-[11px] text-surface-500 dark:text-surface-500 mt-1 font-mono">
                Storage Key: bus_user_preferences
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-100 dark:border-surface-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResetConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmReset}
              >
                Yes, Reset Defaults
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
