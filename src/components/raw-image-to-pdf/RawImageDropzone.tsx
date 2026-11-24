"use client";

import React, { useRef, useState, useCallback } from "react";
import { UploadCloud, Image as ImageIcon, ShieldCheck, AlertCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/common/Button";

export interface RawImageDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  maxBatchSize?: number;
  currentCount?: number;
  maxSizeMB?: number;
  allowedFormats?: string[];
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

export const RawImageDropzone: React.FC<RawImageDropzoneProps> = ({
  onFilesSelected,
  maxBatchSize = 10,
  currentCount = 0,
  maxSizeMB = 5,
  allowedFormats = ["image/jpeg", "image/png", "image/webp"],
  disabled = false,
  compact = false,
  className,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remaining = Math.max(0, maxBatchSize - currentCount);
  const isFull = remaining <= 0;

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled || isFull) return;
      setIsDragOver(true);
    },
    [disabled, isFull]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (disabled || isFull) return;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const filesArray = Array.from(e.dataTransfer.files);
        onFilesSelected(filesArray);
      }
    },
    [disabled, isFull, onFilesSelected]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const filesArray = Array.from(e.target.files);
        onFilesSelected(filesArray);
      }
      // Reset input value to allow re-selecting same files
      e.target.value = "";
    },
    [onFilesSelected]
  );

  const openBrowseDialog = () => {
    if (disabled || isFull) return;
    fileInputRef.current?.click();
  };

  if (compact) {
    return (
      <div className={cn("w-full", className)}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedFormats.join(",")}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isFull}
        />
        <button
          type="button"
          onClick={openBrowseDialog}
          disabled={disabled || isFull}
          className={cn(
            "w-full h-full min-h-[160px] flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed transition-all text-center",
            isDragOver
              ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
              : isFull
              ? "border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50 cursor-not-allowed opacity-60"
              : "border-surface-300 dark:border-surface-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-surface-50 dark:hover:bg-surface-800/60 cursor-pointer"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 shadow-xs">
            <Plus className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
            {isFull ? "Batch Limit Reached" : "Add More Images"}
          </p>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
            {isFull ? `Maximum ${maxBatchSize} images per document` : `${remaining} slot${remaining === 1 ? "" : "s"} remaining`}
          </p>
        </button>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedFormats.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isFull}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openBrowseDialog}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openBrowseDialog();
          }
        }}
        className={cn(
          "relative w-full rounded-2xl border-2 border-dashed p-8 sm:p-12 transition-all flex flex-col items-center justify-center text-center cursor-pointer select-none",
          isDragOver
            ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-4 ring-blue-500/10 shadow-md"
            : "border-surface-300 dark:border-surface-700/80 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-surface-900/60 hover:bg-surface-50/70 dark:hover:bg-surface-850/80 shadow-xs",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50 dark:from-blue-950/70 dark:to-indigo-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 shadow-sm border border-blue-100 dark:border-blue-900/60">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-surface-900 dark:text-surface-100 mb-1">
          Upload Raw Document Images
        </h3>

        <p className="text-sm text-surface-600 dark:text-surface-400 max-w-md mb-4 leading-relaxed">
          Drag and drop multiple photos here, or click to browse. Select up to{" "}
          <strong className="text-surface-900 dark:text-surface-200">{maxBatchSize} images</strong> to clean and combine into a multi-page PDF.
        </p>

        <div className="inline-flex items-center gap-2 mb-4">
          <Button
            type="button"
            variant="primary"
            size="md"
            className="pointer-events-none" // Parent div handles click
          >
            <ImageIcon className="w-4 h-4 mr-1.5" />
            Select Image Files
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-surface-500 dark:text-surface-400 pt-2 border-t border-surface-200/60 dark:border-surface-800/60">
          <span>Supported: <strong>JPG, PNG, WebP</strong></span>
          <span>•</span>
          <span>Max Size: <strong>{maxSizeMB} MB</strong> per image</span>
          <span>•</span>
          <span>Max Batch: <strong>{maxBatchSize} pages</strong></span>
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>100% Client-Side Memory • No Files Uploaded to Any Server</span>
        </div>
      </div>
    </div>
  );
};
