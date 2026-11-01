"use client";

import React from "react";
import {
  FileText,
  FileCheck2,
  HardDrive,
  Maximize,
  Ratio,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  Camera,
} from "lucide-react";
import { ValidatedImageFile } from "@/types/image-engine";
import { cn } from "@/lib/utils/cn";

export interface PhotoStudioInfoPanelProps {
  imageFile: ValidatedImageFile | null;
  className?: string;
}

/**
 * Calculates a friendly aspect ratio string from dimensions
 */
function getFriendlyAspectRatio(width: number, height: number): string {
  if (!width || !height) return "1:1";
  const ratio = width / height;

  // Check common photographic and screen ratios with tolerance
  const commonRatios: Array<{ name: string; value: number }> = [
    { name: "1:1 Square", value: 1.0 },
    { name: "3:4 Portrait", value: 3 / 4 }, // 0.75
    { name: "4:3 Standard", value: 4 / 3 }, // 1.333
    { name: "2:3 Portrait", value: 2 / 3 }, // 0.667
    { name: "3:2 Landscape", value: 3 / 2 }, // 1.5
    { name: "9:16 Story", value: 9 / 16 }, // 0.5625
    { name: "16:9 Widescreen", value: 16 / 9 }, // 1.778
    { name: "35:45 Passport", value: 35 / 45 }, // 0.7778
    { name: "45:35 Landscape", value: 45 / 35 }, // 1.2857
    { name: "5:7 Portrait", value: 5 / 7 }, // 0.714
    { name: "7:5 Landscape", value: 7 / 5 }, // 1.4
  ];

  for (const item of commonRatios) {
    if (Math.abs(ratio - item.value) < 0.02) {
      return `${item.name} (${ratio.toFixed(2)}:1)`;
    }
  }

  return `${ratio.toFixed(2)}:1`;
}

/**
 * Formats byte size into human readable string
 */
function formatFileSize(bytes: number): { formatted: string; rawBytes: string } {
  const rawBytes = `${bytes.toLocaleString()} bytes`;
  if (bytes >= 1024 * 1024) {
    return {
      formatted: `${(bytes / (1024 * 1024)).toFixed(2)} MB`,
      rawBytes,
    };
  }
  return {
    formatted: `${(bytes / 1024).toFixed(1)} KB`,
    rawBytes,
  };
}

/**
 * Resolves standard format name
 */
function formatFormatName(mimeOrExt: string): string {
  const lower = mimeOrExt.toLowerCase();
  if (lower.includes("jpeg") || lower.includes("jpg")) return "JPEG / JPG";
  if (lower.includes("png")) return "PNG (Portable Network Graphics)";
  if (lower.includes("webp")) return "WebP (Google Web Picture)";
  return mimeOrExt.toUpperCase();
}

export const PhotoStudioInfoPanel: React.FC<PhotoStudioInfoPanelProps> = ({
  imageFile,
  className,
}) => {
  if (!imageFile) {
    return (
      <div
        className={cn(
          "bg-white rounded-3xl border border-surface-200 p-6 shadow-card space-y-4",
          className
        )}
      >
        <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-600" />
          <span>Image Information</span>
        </h3>
        <p className="text-xs text-surface-500">
          Upload an image to inspect intrinsic pixel dimensions, file size, aspect ratio, and format details.
        </p>
      </div>
    );
  }

  const { width, height } = imageFile.dimensions;
  const megapixels = ((width * height) / 1_000_000).toFixed(1);
  const sizeInfo = formatFileSize(imageFile.size);
  const friendlyRatio = getFriendlyAspectRatio(width, height);
  const formatName = formatFormatName(imageFile.type);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Primary Image Metadata Card */}
      <div className="bg-white rounded-3xl border border-surface-200 p-6 shadow-card space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-surface-100">
          <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-600" />
            <span>Image Information</span>
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-semibold border border-brand-100">
            {megapixels} MP
          </span>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="space-y-3.5 text-xs">
          {/* Filename */}
          <div className="flex items-start justify-between gap-3">
            <span className="text-surface-500 flex items-center gap-1.5 shrink-0">
              <FileCheck2 className="w-3.5 h-3.5 text-surface-400" />
              <span>Filename</span>
            </span>
            <span
              className="font-medium text-surface-900 truncate max-w-[180px] sm:max-w-[200px] text-right"
              title={imageFile.name}
            >
              {imageFile.name}
            </span>
          </div>

          {/* File Format */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-surface-500 flex items-center gap-1.5 shrink-0">
              <Layers className="w-3.5 h-3.5 text-surface-400" />
              <span>Format</span>
            </span>
            <span className="font-semibold text-surface-900 font-mono text-[11px]">
              {formatName}
            </span>
          </div>

          {/* File Size */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-surface-500 flex items-center gap-1.5 shrink-0">
              <HardDrive className="w-3.5 h-3.5 text-surface-400" />
              <span>File Size</span>
            </span>
            <div className="text-right">
              <span className="font-semibold text-surface-900 font-mono">
                {sizeInfo.formatted}
              </span>
              <span className="block text-[10px] text-surface-400 font-mono">
                {sizeInfo.rawBytes}
              </span>
            </div>
          </div>

          {/* Original Width */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-surface-500 flex items-center gap-1.5 shrink-0">
              <Maximize className="w-3.5 h-3.5 text-surface-400" />
              <span>Original Width</span>
            </span>
            <span className="font-semibold text-surface-900 font-mono">
              {width.toLocaleString()} px
            </span>
          </div>

          {/* Original Height */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-surface-500 flex items-center gap-1.5 shrink-0">
              <Maximize className="w-3.5 h-3.5 text-surface-400 rotate-90" />
              <span>Original Height</span>
            </span>
            <span className="font-semibold text-surface-900 font-mono">
              {height.toLocaleString()} px
            </span>
          </div>

          {/* Aspect Ratio */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-surface-500 flex items-center gap-1.5 shrink-0">
              <Ratio className="w-3.5 h-3.5 text-surface-400" />
              <span>Aspect Ratio</span>
            </span>
            <span className="font-semibold text-surface-900 font-mono text-[11px]">
              {friendlyRatio}
            </span>
          </div>
        </div>

        {/* Client Memory Footprint Reassurance */}
        <div className="pt-3 border-t border-surface-100 flex items-center justify-between text-[11px] font-mono text-surface-500">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-brand-500" />
            <span>Master Buffer</span>
          </span>
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ephemeral RAM</span>
          </span>
        </div>
      </div>

      {/* Upcoming Studio Pipeline Roadmap Card */}
      <div className="bg-gradient-to-br from-brand-50/60 to-surface-50 rounded-3xl border border-brand-100/80 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-600" />
          <h4 className="text-xs font-bold text-brand-950 uppercase tracking-wider">
            Future Studio Roadmap
          </h4>
        </div>
        <p className="text-xs text-brand-900/80 leading-relaxed">
          Face alignment guides, chin/crown boundary overlays, background color replacement (white, light blue, grey), and multiple photo print sheet arrangements.
        </p>
      </div>
    </div>
  );
};
