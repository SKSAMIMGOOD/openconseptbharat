"use client";

import React, { useState } from "react";
import type {
  DocumentSide,
  DocumentEnhancementSettings,
} from "@/types/document-studio";
import {
  DEFAULT_ENHANCEMENT_SETTINGS,
  isEnhancementActive,
  isEnhancementModified,
} from "@/types/document-studio";
import { cn } from "@/lib/utils/cn";
import {
  SlidersHorizontal,
  SunMedium,
  Sliders,
  Palette,
  Zap,
  RotateCcw,
  Eye,
  ChevronDown,
  Contrast,
  RefreshCw,
} from "lucide-react";

export interface DocumentEnhancementPanelProps {
  frontEnhancements: DocumentEnhancementSettings;
  backEnhancements: DocumentEnhancementSettings;
  isDualSide: boolean;
  activeSide: DocumentSide;
  onSelectSide: (side: DocumentSide) => void;
  onChangeEnhancement: (
    side: DocumentSide,
    key: keyof DocumentEnhancementSettings,
    value: number | boolean
  ) => void;
  onResetEnhancements: (side: DocumentSide) => void;
  onToggleBeforeAfter: (side: DocumentSide) => void;
  showingBeforeAfter: {
    front: boolean;
    back: boolean;
  };
  isOpen?: boolean;
  onToggleOpen?: () => void;
  className?: string;
}

export const DocumentEnhancementPanel: React.FC<DocumentEnhancementPanelProps> = ({
  frontEnhancements,
  backEnhancements,
  isDualSide,
  activeSide,
  onSelectSide,
  onChangeEnhancement,
  onResetEnhancements,
  onToggleBeforeAfter,
  showingBeforeAfter,
  isOpen: controlledIsOpen,
  onToggleOpen: controlledToggleOpen,
  className,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const toggleOpen = controlledToggleOpen || (() => setInternalIsOpen((v) => !v));

  const currentSettings =
    activeSide === "front" ? frontEnhancements : backEnhancements;
  const isCurrentActive = isEnhancementActive(currentSettings);
  const isCurrentModified = isEnhancementModified(currentSettings);
  const isFrontActive = isEnhancementActive(frontEnhancements);
  const isBackActive = isEnhancementActive(backEnhancements);
  const isCurrentShowingBefore = showingBeforeAfter[activeSide];

  const handleSliderChange = (
    key: "brightness" | "contrast" | "saturation" | "sharpness",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChangeEnhancement(activeSide, key, Number(e.target.value));
  };

  const handleToggle = (key: "grayscale" | "invert") => {
    onChangeEnhancement(activeSide, key, !currentSettings[key]);
  };

  return (
    <div
      className={cn(
        "bg-white dark:bg-surface-800/90 rounded-2xl border border-surface-200 dark:border-surface-700/80 shadow-subtle transition-all overflow-hidden",
        className
      )}
    >
      {/* 1. Compact Panel Header with Side Switcher in Header */}
      <div
        onClick={toggleOpen}
        className="w-full px-3.5 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between cursor-pointer select-none bg-surface-50/70 dark:bg-surface-800/50 hover:bg-surface-100/70 dark:hover:bg-surface-700/50 transition-colors gap-2"
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
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-2 truncate">
            <h3 className="text-xs sm:text-sm font-bold text-surface-900 dark:text-surface-100 truncate">
              Document Enhancement
            </h3>
            {(isFrontActive || isBackActive) && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/50 shrink-0">
                Enhanced
              </span>
            )}
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
                {isFrontActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
                )}
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
                {isBackActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
                )}
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

      {/* 2. Compact Expanded Body: 4-Column Sliders + Single Action Row */}
      {isOpen && (
        <div className="p-3 sm:p-3.5 space-y-2.5 border-t border-surface-200/80 dark:border-surface-700">
          {/* Sliders Grid: 2 columns on mobile, 4 columns on desktop in 1 single row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Brightness (-100 to +100, default -6) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor={`brightness-slider-${activeSide}`}
                  className="font-semibold text-surface-700 dark:text-surface-300 flex items-center gap-1.5"
                >
                  <SunMedium className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Brightness</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] font-bold text-surface-800 dark:text-surface-200">
                    {currentSettings.brightness > 0
                      ? `+${currentSettings.brightness}`
                      : currentSettings.brightness}
                  </span>
                  {currentSettings.brightness !== DEFAULT_ENHANCEMENT_SETTINGS.brightness && (
                    <button
                      type="button"
                      onClick={() => onChangeEnhancement(activeSide, "brightness", DEFAULT_ENHANCEMENT_SETTINGS.brightness)}
                      className="text-[10px] text-surface-400 hover:text-brand-600 transition-colors"
                      title={`Reset brightness to ${DEFAULT_ENHANCEMENT_SETTINGS.brightness}`}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
              <input
                id={`brightness-slider-${activeSide}`}
                type="range"
                min={-100}
                max={100}
                step={1}
                value={currentSettings.brightness}
                onChange={(e) => handleSliderChange("brightness", e)}
                className="w-full h-1.5 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
            </div>

            {/* Contrast (-100 to +100, default +33) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor={`contrast-slider-${activeSide}`}
                  className="font-semibold text-surface-700 dark:text-surface-300 flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Contrast</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] font-bold text-surface-800 dark:text-surface-200">
                    {currentSettings.contrast > 0
                      ? `+${currentSettings.contrast}`
                      : currentSettings.contrast}
                  </span>
                  {currentSettings.contrast !== DEFAULT_ENHANCEMENT_SETTINGS.contrast && (
                    <button
                      type="button"
                      onClick={() => onChangeEnhancement(activeSide, "contrast", DEFAULT_ENHANCEMENT_SETTINGS.contrast)}
                      className="text-[10px] text-surface-400 hover:text-brand-600 transition-colors"
                      title={`Reset contrast to +${DEFAULT_ENHANCEMENT_SETTINGS.contrast}`}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
              <input
                id={`contrast-slider-${activeSide}`}
                type="range"
                min={-100}
                max={100}
                step={1}
                value={currentSettings.contrast}
                onChange={(e) => handleSliderChange("contrast", e)}
                className="w-full h-1.5 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
            </div>

            {/* Saturation (-100 to +100, default +33) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor={`saturation-slider-${activeSide}`}
                  className="font-semibold text-surface-700 dark:text-surface-300 flex items-center gap-1.5"
                >
                  <Palette className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span>Saturation</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] font-bold text-surface-800 dark:text-surface-200">
                    {currentSettings.saturation > 0
                      ? `+${currentSettings.saturation}`
                      : currentSettings.saturation}
                  </span>
                  {currentSettings.saturation !== DEFAULT_ENHANCEMENT_SETTINGS.saturation && (
                    <button
                      type="button"
                      onClick={() => onChangeEnhancement(activeSide, "saturation", DEFAULT_ENHANCEMENT_SETTINGS.saturation)}
                      className="text-[10px] text-surface-400 hover:text-brand-600 transition-colors"
                      title={`Reset saturation to +${DEFAULT_ENHANCEMENT_SETTINGS.saturation}`}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
              <input
                id={`saturation-slider-${activeSide}`}
                type="range"
                min={-100}
                max={100}
                step={1}
                value={currentSettings.saturation}
                onChange={(e) => handleSliderChange("saturation", e)}
                className="w-full h-1.5 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
            </div>

            {/* Sharpness (0 to 100, default +33) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor={`sharpness-slider-${activeSide}`}
                  className="font-semibold text-surface-700 dark:text-surface-300 flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Sharpness</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] font-bold text-surface-800 dark:text-surface-200">
                    {currentSettings.sharpness > 0
                      ? `+${currentSettings.sharpness}`
                      : currentSettings.sharpness}
                  </span>
                  {currentSettings.sharpness !== DEFAULT_ENHANCEMENT_SETTINGS.sharpness && (
                    <button
                      type="button"
                      onClick={() => onChangeEnhancement(activeSide, "sharpness", DEFAULT_ENHANCEMENT_SETTINGS.sharpness)}
                      className="text-[10px] text-surface-400 hover:text-brand-600 transition-colors"
                      title={`Reset sharpness to +${DEFAULT_ENHANCEMENT_SETTINGS.sharpness}`}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
              <input
                id={`sharpness-slider-${activeSide}`}
                type="range"
                min={0}
                max={100}
                step={1}
                value={currentSettings.sharpness}
                onChange={(e) => handleSliderChange("sharpness", e)}
                className="w-full h-1.5 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
            </div>
          </div>

          {/* Grayscale, Invert, Compare Before/After, and Reset in single compact bottom strip */}
          <div className="pt-2 border-t border-surface-100 dark:border-surface-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Left Toggles: Grayscale & Invert */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleToggle("grayscale")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all",
                  currentSettings.grayscale
                    ? "bg-surface-900 text-white border-surface-900 dark:bg-surface-100 dark:text-surface-900 shadow-2xs"
                    : "bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-700 hover:bg-surface-100"
                )}
              >
                <Contrast className="w-3 h-3" />
                <span>Grayscale (B&W)</span>
                <span
                  className={cn(
                    "text-[10px] px-1 py-0.2 rounded font-mono",
                    currentSettings.grayscale
                      ? "bg-white/20 text-white dark:bg-surface-900/20 dark:text-surface-900"
                      : "bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400"
                  )}
                >
                  {currentSettings.grayscale ? "ON" : "OFF"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleToggle("invert")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all",
                  currentSettings.invert
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                    : "bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-700 hover:bg-surface-100"
                )}
              >
                <RefreshCw className="w-3 h-3" />
                <span>Invert Colors</span>
                <span
                  className={cn(
                    "text-[10px] px-1 py-0.2 rounded font-mono",
                    currentSettings.invert
                      ? "bg-white/20 text-white"
                      : "bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400"
                  )}
                >
                  {currentSettings.invert ? "ON" : "OFF"}
                </span>
              </button>
            </div>

            {/* Right Actions: Before/After & Reset Side Enhancements */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => onToggleBeforeAfter(activeSide)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all shadow-2xs",
                  isCurrentShowingBefore
                    ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800"
                    : "bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-600 hover:bg-surface-50"
                )}
                title="Toggle between Original (Before) and Enhanced (After) preview"
              >
                <Eye className="w-3 h-3" />
                <span>{isCurrentShowingBefore ? "Viewing Before" : "Compare Before/After"}</span>
              </button>

              <button
                type="button"
                disabled={!isCurrentModified}
                onClick={() => onResetEnhancements(activeSide)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-surface-200 dark:border-surface-700 text-xs font-semibold text-surface-600 dark:text-surface-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title={`Reset ${activeSide === "front" ? "Front" : "Back"} enhancements to default`}
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset {isDualSide ? (activeSide === "front" ? "Front" : "Back") : ""} Enhancements</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
