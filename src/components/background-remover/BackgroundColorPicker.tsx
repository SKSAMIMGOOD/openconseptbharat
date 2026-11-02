"use client";

import React from "react";
import { Palette, Check, Sparkles } from "lucide-react";
import { BackgroundColorOption } from "@/types/background-remover";
import { BACKGROUND_COLOR_PRESETS } from "@/constants/background-remover";
import { cn } from "@/lib/utils/cn";

export interface BackgroundColorPickerProps {
  selectedColor: BackgroundColorOption;
  customHex: string;
  onSelectColor: (color: BackgroundColorOption) => void;
  onCustomHexChange: (hex: string) => void;
  disabled?: boolean;
}

export const BackgroundColorPicker: React.FC<BackgroundColorPickerProps> = ({
  selectedColor,
  customHex,
  onSelectColor,
  onCustomHexChange,
  disabled = false,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-surface-200 p-5 sm:p-6 shadow-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
          <Palette className="w-4 h-4 text-brand-600" />
          <span>Background Backdrop</span>
        </h3>
        <span className="text-[11px] font-medium text-surface-500">
          Original foreground is 100% preserved
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {BACKGROUND_COLOR_PRESETS.map((preset) => {
          const isSelected = selectedColor.id === preset.id;
          const isTransparent = preset.id === "transparent";
          const isCustom = preset.id === "custom";

          return (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectColor(preset)}
              className={cn(
                "relative p-2.5 rounded-xl border text-left transition-all flex flex-col gap-2 group",
                isSelected
                  ? "border-brand-500 bg-brand-50/30 ring-2 ring-brand-500/20"
                  : "border-surface-200 hover:border-surface-300 hover:bg-surface-50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center justify-between">
                {/* Visual Color Preview Swatch */}
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg border border-surface-300/80 shadow-xs flex items-center justify-center shrink-0",
                    isTransparent &&
                      "bg-[linear-gradient(45deg,#cbd5e1_25%,transparent_25%),linear-gradient(-45deg,#cbd5e1_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#cbd5e1_75%),linear-gradient(-45deg,transparent_75%,#cbd5e1_75%)] [background-size:8px_8px]"
                  )}
                  style={{
                    backgroundColor: isTransparent
                      ? "transparent"
                      : isCustom
                      ? customHex
                      : preset.value,
                  }}
                >
                  {isSelected && (
                    <Check
                      className={cn(
                        "w-4 h-4 drop-shadow-sm",
                        preset.id === "white" || (isCustom && customHex.toLowerCase() === "#ffffff")
                          ? "text-surface-900"
                          : "text-white"
                      )}
                    />
                  )}
                </div>

                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-surface-900 truncate">
                  {preset.name}
                </p>
                <p className="text-[10px] text-surface-500 truncate font-mono">
                  {isTransparent ? "Alpha channel" : isCustom ? customHex : preset.value}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Color Input when Custom is selected */}
      {selectedColor.id === "custom" && (
        <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 flex items-center gap-3 animate-in fade-in duration-200">
          <input
            type="color"
            value={customHex}
            disabled={disabled}
            onChange={(e) => onCustomHexChange(e.target.value)}
            className="w-9 h-9 rounded-lg border border-surface-300 cursor-pointer p-0.5 bg-white"
          />
          <div className="flex-1">
            <label className="text-[11px] font-semibold text-surface-600 block mb-0.5">
              Custom Hex Code:
            </label>
            <input
              type="text"
              value={customHex}
              disabled={disabled}
              onChange={(e) => {
                let val = e.target.value;
                if (!val.startsWith("#")) val = "#" + val;
                onCustomHexChange(val);
              }}
              placeholder="#6366F1"
              maxLength={7}
              className="w-full px-2.5 py-1 text-xs font-mono font-semibold rounded-lg border border-surface-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
