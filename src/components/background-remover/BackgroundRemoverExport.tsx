"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  FileImage,
  Camera,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Loader2,
} from "lucide-react";
import { ExportFormat, BackgroundColorOption } from "@/types/background-remover";
import { cn } from "@/lib/utils/cn";

export interface BackgroundRemoverExportProps {
  hasResult: boolean;
  selectedBackground: BackgroundColorOption;
  customHex: string;
  onExport: (format: ExportFormat, quality?: number) => Promise<void>;
  onTransferToPhotoStudio: () => Promise<boolean>;
  disabled?: boolean;
}

export const BackgroundRemoverExport: React.FC<BackgroundRemoverExportProps> = ({
  hasResult,
  selectedBackground,
  customHex,
  onExport,
  onTransferToPhotoStudio,
  disabled = false,
}) => {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);

  const handleDownload = async (format: ExportFormat) => {
    if (disabled || !hasResult) return;
    setIsExporting(format);
    try {
      await onExport(format, 0.95);
    } finally {
      setIsExporting(null);
    }
  };

  const handleHandoff = async () => {
    if (disabled || !hasResult) return;
    setIsTransferring(true);
    try {
      const ok = await onTransferToPhotoStudio();
      if (ok) {
        setTransferSuccess(true);
        setTimeout(() => {
          router.push("/tools/photo-studio");
        }, 300);
      }
    } finally {
      setIsTransferring(false);
    }
  };

  const bgLabel =
    selectedBackground.id === "transparent"
      ? "Transparent"
      : selectedBackground.id === "custom"
      ? customHex
      : selectedBackground.name;

  return (
    <div className="bg-white rounded-2xl border border-surface-200 p-5 sm:p-6 shadow-card space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
          <Download className="w-4 h-4 text-brand-600" />
          <span>Export & Hand-off</span>
        </h3>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          Local Generation
        </span>
      </div>

      {/* Download Action Buttons */}
      <div className="space-y-2.5">
        {/* 1. Transparent PNG */}
        <button
          type="button"
          disabled={!hasResult || disabled || isExporting !== null}
          onClick={() => handleDownload("png_transparent")}
          className={cn(
            "w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between text-xs font-semibold group",
            hasResult
              ? "border-surface-200 bg-surface-50 hover:bg-brand-50 hover:border-brand-300 text-surface-800"
              : "border-surface-100 bg-surface-50/50 text-surface-400 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white border border-surface-200 flex items-center justify-center text-brand-600 shadow-2xs group-hover:border-brand-300">
              {isExporting === "png_transparent" ? (
                <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
              ) : (
                <FileImage className="w-4 h-4 text-brand-600" />
              )}
            </div>
            <div>
              <p className="font-bold text-surface-900">Download Transparent PNG</p>
              <p className="text-[11px] text-surface-500 font-normal">
                Lossless cutout with alpha transparency
              </p>
            </div>
          </div>
          <Download className="w-4 h-4 text-surface-400 group-hover:text-brand-600" />
        </button>

        {/* 2. PNG with Selected Background */}
        <button
          type="button"
          disabled={!hasResult || disabled || isExporting !== null}
          onClick={() => handleDownload("png_background")}
          className={cn(
            "w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between text-xs font-semibold group",
            hasResult
              ? "border-surface-200 bg-surface-50 hover:bg-brand-50 hover:border-brand-300 text-surface-800"
              : "border-surface-100 bg-surface-50/50 text-surface-400 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white border border-surface-200 flex items-center justify-center text-brand-600 shadow-2xs group-hover:border-brand-300">
              {isExporting === "png_background" ? (
                <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
              ) : (
                <Download className="w-4 h-4 text-brand-600" />
              )}
            </div>
            <div>
              <p className="font-bold text-surface-900">
                Download PNG ({bgLabel})
              </p>
              <p className="text-[11px] text-surface-500 font-normal">
                Lossless PNG composited with selected background
              </p>
            </div>
          </div>
          <Download className="w-4 h-4 text-surface-400 group-hover:text-brand-600" />
        </button>

        {/* 3. JPEG with Selected Background */}
        <button
          type="button"
          disabled={!hasResult || disabled || isExporting !== null}
          onClick={() => handleDownload("jpeg_background")}
          className={cn(
            "w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between text-xs font-semibold group",
            hasResult
              ? "border-surface-200 bg-surface-50 hover:bg-brand-50 hover:border-brand-300 text-surface-800"
              : "border-surface-100 bg-surface-50/50 text-surface-400 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white border border-surface-200 flex items-center justify-center text-brand-600 shadow-2xs group-hover:border-brand-300">
              {isExporting === "jpeg_background" ? (
                <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
              ) : (
                <FileImage className="w-4 h-4 text-brand-600" />
              )}
            </div>
            <div>
              <p className="font-bold text-surface-900">
                Download JPEG ({selectedBackground.id === "transparent" ? "White Backdrop" : bgLabel})
              </p>
              <p className="text-[11px] text-surface-500 font-normal">
                High-quality JPEG with solid studio background
              </p>
            </div>
          </div>
          <Download className="w-4 h-4 text-surface-400 group-hover:text-brand-600" />
        </button>
      </div>

      {/* Photo Studio Integration Section */}
      <div className="pt-4 border-t border-surface-200">
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/60 to-brand-50/60 border border-brand-200/80 space-y-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-surface-900">
                Professional Photo Studio Hand-off
              </h4>
              <p className="text-[11px] text-surface-600 leading-normal mt-0.5">
                Transfer this cutout directly into Photo Studio in browser RAM to crop for passport dimensions or generate A4/4×6 print sheets.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={!hasResult || disabled || isTransferring}
            onClick={handleHandoff}
            className={cn(
              "w-full py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2",
              hasResult
                ? "bg-brand-600 hover:bg-brand-700 text-white shadow-xs active:scale-[0.99]"
                : "bg-surface-200 text-surface-400 cursor-not-allowed"
            )}
          >
            {isTransferring ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Staging in Memory...</span>
              </>
            ) : transferSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Opening Photo Studio...</span>
              </>
            ) : (
              <>
                <span>Send to Professional Photo Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
