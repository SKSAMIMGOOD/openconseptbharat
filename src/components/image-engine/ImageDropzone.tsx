"use client";

import React, { useState, useRef, useCallback } from "react";
import { UploadCloud, Image as ImageIcon, AlertCircle, FileCheck } from "lucide-react";
import {
  ImageValidationOptions,
  SupportedImageFormat,
  ValidatedImageFile,
} from "@/types/image-engine";
import {
  validateImageFile,
  generateFileFingerprint,
  DEFAULT_ALLOWED_MIMES,
  DEFAULT_MAX_SIZE_MB,
} from "@/lib/image/validator";
import { decodeImage } from "@/lib/image/decoder";
import { createTrackedObjectURL } from "@/lib/utils/memory";
import { cn } from "@/lib/utils/cn";

export interface ImageDropzoneProps {
  onImagesSelected: (images: ValidatedImageFile[]) => void;
  onError?: (error: string) => void;
  options?: ImageValidationOptions;
  multiple?: boolean;
  className?: string;
  label?: string;
  hint?: string;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  onImagesSelected,
  onError,
  options = {},
  multiple = false,
  className,
  label = "Choose an image or drag & drop here",
  hint = "Supports JPG, PNG, WebP up to 25 MB. Processed entirely in browser.",
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const existingFingerprints = useRef<Set<string>>(new Set());

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      if (!fileList || fileList.length === 0) return;

      setIsProcessing(true);
      setLocalError(null);

      const files = Array.from(fileList);
      const validatedList: ValidatedImageFile[] = [];
      const errors: string[] = [];

      for (const file of files) {
        // 1. Validation (MIME, extension, size, magic bytes)
        const validation = await validateImageFile(file, options);
        if (!validation.isValid) {
          errors.push(`${file.name}: ${validation.error}`);
          continue;
        }

        // 2. Duplicate detection
        const fingerprint = await generateFileFingerprint(file);
        if (existingFingerprints.current.has(fingerprint)) {
          errors.push(`${file.name}: This file is already loaded.`);
          continue;
        }

        // 3. Decoding validation (verifies file is not corrupted)
        try {
          const decoded = await decodeImage(file);
          existingFingerprints.current.add(fingerprint);

          const previewUrl = createTrackedObjectURL(file);
          validatedList.push({
            id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            file,
            name: file.name,
            size: file.size,
            type: (validation.detectedFormat || file.type) as SupportedImageFormat,
            dimensions: {
              width: decoded.width,
              height: decoded.height,
              aspectRatio: decoded.aspectRatio,
            },
            previewUrl,
            createdAt: Date.now(),
          });

          // Free decoded bitmap immediately after verification
          decoded.close();
        } catch (decErr) {
          errors.push(`${file.name}: Failed to decode image. File may be corrupted.`);
        }
      }

      setIsProcessing(false);

      if (errors.length > 0) {
        const errorMsg = errors.join("\n");
        setLocalError(errorMsg);
        onError?.(errorMsg);
      }

      if (validatedList.length > 0) {
        onImagesSelected(validatedList);
      }
    },
    [options, onImagesSelected, onError]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={cn("w-full space-y-3", className)}>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleClick();
          }
        }}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-brand-500",
          isDragOver
            ? "border-brand-500 bg-brand-50/50 scale-[1.01]"
            : "border-surface-300 hover:border-brand-400 bg-surface-50/50 hover:bg-surface-50",
          isProcessing && "opacity-60 pointer-events-none"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={options.allowedExtensions?.join(",") ?? ".jpg,.jpeg,.png,.webp"}
          multiple={multiple}
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(e.target.files);
              e.target.value = ""; // reset for re-selecting same file if desired
            }
          }}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
              isDragOver ? "bg-brand-600 text-white" : "bg-white text-brand-600 border border-surface-200"
            )}
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <div>
            <p className="text-sm font-bold text-surface-900">{label}</p>
            <p className="text-xs text-surface-500 mt-1">{hint}</p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono bg-white border border-surface-200 text-surface-600 shadow-xs">
            <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Client Ingestion • 0 Bytes Transmitted</span>
          </div>
        </div>
      </div>

      {localError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="whitespace-pre-line">{localError}</div>
        </div>
      )}
    </div>
  );
};
