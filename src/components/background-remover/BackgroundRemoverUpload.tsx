"use client";

import React, { useRef, useState } from "react";
import {
  UploadCloud,
  FileImage,
  RefreshCw,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface BackgroundRemoverUploadProps {
  originalFile: File | null;
  originalPreviewUrl: string | null;
  dimensions: { width: number; height: number; aspectRatio: number } | null;
  onFileSelect: (file: File) => Promise<boolean>;
  onRemove: () => void;
  disabled?: boolean;
}

export const BackgroundRemoverUpload: React.FC<BackgroundRemoverUploadProps> = ({
  originalFile,
  originalPreviewUrl,
  dimensions,
  onFileSelect,
  onRemove,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await onFileSelect(e.target.files[0]);
    }
    // Reset input value so same file can be selected again
    e.target.value = "";
  };

  return (
    <div className="bg-white rounded-2xl border border-surface-200 p-5 sm:p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-brand-600" />
          <span>Upload Image</span>
        </h3>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          100% Client-Side
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled}
        onChange={handleFileInputChange}
      />

      {!originalFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={cn(
            "relative rounded-xl border-2 border-dashed p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center",
            isDragOver
              ? "border-brand-500 bg-brand-50/50 scale-[0.99]"
              : "border-surface-300 hover:border-brand-400 hover:bg-surface-50/60",
            disabled && "opacity-60 pointer-events-none"
          )}
        >
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 mb-3 shadow-sm">
            <UploadCloud className="w-6 h-6" />
          </div>

          <h4 className="text-sm font-bold text-surface-900 mb-1">
            Drop your image here, or <span className="text-brand-600 underline">browse</span>
          </h4>
          <p className="text-xs text-surface-500 max-w-sm mb-3">
            Supports JPG, JPEG, PNG, and WebP up to 25 MB. Runs strictly inside your browser.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-surface-600">
            <span className="px-2 py-0.5 rounded-md bg-surface-100 font-mono">JPG</span>
            <span className="px-2 py-0.5 rounded-md bg-surface-100 font-mono">PNG</span>
            <span className="px-2 py-0.5 rounded-md bg-surface-100 font-mono">WebP</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 flex items-center gap-3.5">
            {originalPreviewUrl ? (
              <div className="w-14 h-14 rounded-lg overflow-hidden border border-surface-200 shrink-0 bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] [background-size:12px_12px] flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalPreviewUrl}
                  alt={originalFile.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-lg bg-surface-200 flex items-center justify-center text-surface-400 shrink-0">
                <ImageIcon className="w-6 h-6" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-surface-900 truncate" title={originalFile.name}>
                  {originalFile.name}
                </h4>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  Loaded
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-surface-500 mt-1">
                <span>{(originalFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                {dimensions && (
                  <>
                    <span>•</span>
                    <span className="font-mono">
                      {dimensions.width} × {dimensions.height} px
                    </span>
                    <span>•</span>
                    <span>Ratio {dimensions.aspectRatio.toFixed(2)}:1</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-surface-100 hover:bg-surface-200 text-surface-800 border border-surface-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Replace Photo
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
