"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  UploadCloud,
  FileImage,
  FolderOpen,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Camera,
  CheckCircle2,
} from "lucide-react";
import {
  SupportedImageFormat,
  ValidatedImageFile,
} from "@/types/image-engine";
import {
  validateImageFile,
  generateFileFingerprint,
} from "@/lib/image/validator";
import { decodeImage } from "@/lib/image/decoder";
import { createTrackedObjectURL } from "@/lib/utils/memory";
import { cn } from "@/lib/utils/cn";

export interface PhotoStudioUploadProps {
  onImageLoaded: (image: ValidatedImageFile) => void;
  onError: (error: string) => void;
  isDecoding?: boolean;
  maxSizeMB?: number;
  className?: string;
  onDraggingChange?: (isDragging: boolean) => void;
}

export const PhotoStudioUpload: React.FC<PhotoStudioUploadProps> = ({
  onImageLoaded,
  onError,
  isDecoding = false,
  maxSizeMB = 20,
  className,
  onDraggingChange,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadedFingerprints = useRef<Set<string>>(new Set());

  const processFile = useCallback(
    async (file: File) => {
      if (!file) return;

      setUploadError(null);

      // 1. Validation (MIME, extension, size, magic bytes)
      const validation = await validateImageFile(file, {
        maxSizeMB,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
      });

      if (!validation.isValid) {
        const errorMsg = validation.error || "The selected file is not a supported image.";
        setUploadError(errorMsg);
        onError(errorMsg);
        return;
      }

      // 2. Prevent accidental duplicate processing
      const fingerprint = await generateFileFingerprint(file);
      if (loadedFingerprints.current.has(fingerprint)) {
        const errorMsg = `"${file.name}" is already loaded in the workspace.`;
        setUploadError(errorMsg);
        onError(errorMsg);
        return;
      }

      // 3. Decoding and corruption detection
      try {
        const decoded = await decodeImage(file);
        loadedFingerprints.current.add(fingerprint);

        const previewUrl = createTrackedObjectURL(file);
        const validatedImage: ValidatedImageFile = {
          id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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
        };

        // Free bitmap handle used for integrity check; master engine decodes its own
        decoded.close();

        onImageLoaded(validatedImage);
      } catch (decErr) {
        const errorMsg =
          decErr instanceof Error
            ? decErr.message
            : "Failed to decode image data. The file appears to be corrupted or invalid.";
        setUploadError(errorMsg);
        onError(errorMsg);
      }
    },
    [maxSizeMB, onImageLoaded, onError]
  );

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
    onDraggingChange?.(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) {
      setIsDragOver(true);
      onDraggingChange?.(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only deactivate when leaving the outer container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
    onDraggingChange?.(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    onDraggingChange?.(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleBrowseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    inputRef.current?.click();
  };

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Large Drag and Drop Target Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleBrowseClick(e as unknown as React.MouseEvent);
          }
        }}
        className={cn(
          "relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 outline-none select-none",
          isDragOver
            ? "border-brand-600 bg-brand-50/70 scale-[1.01] shadow-glow ring-4 ring-brand-100"
            : "border-surface-300 hover:border-brand-400 bg-white hover:bg-surface-50/70 shadow-card hover:shadow-card-hover",
          isDecoding && "opacity-60 pointer-events-none"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFile(e.target.files[0]);
              e.target.value = ""; // Reset to allow re-selecting
            }
          }}
          className="hidden"
          aria-label="Upload photo"
        />

        <div className="flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto">
          {/* Animated or Highlighted Upload Icon */}
          <div
            className={cn(
              "w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center transition-all duration-300 shadow-sm",
              isDragOver
                ? "bg-brand-600 text-white scale-110 shadow-md"
                : "bg-brand-50 text-brand-600 border border-brand-100/80"
            )}
          >
            {isDecoding ? (
              <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
            ) : isDragOver ? (
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
            ) : (
              <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10" />
            )}
          </div>

          {/* Heading & Drag Instruction */}
          <div className="space-y-1.5">
            <h3 className="text-lg sm:text-xl font-bold text-surface-900 tracking-tight">
              {isDragOver
                ? "Drop your portrait photo here"
                : "Drag & drop your portrait photo here"}
            </h3>
            <p className="text-xs sm:text-sm text-surface-500">
              or use the browse button to select a file from your device
            </p>
          </div>

          {/* Browse Files Button */}
          <button
            type="button"
            onClick={handleBrowseClick}
            disabled={isDecoding}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white shadow-sm hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Browse Files</span>
          </button>

          {/* Format & Size Information Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] font-mono text-surface-600">
            <span className="px-2.5 py-1 rounded-lg bg-surface-100 border border-surface-200">
              Formats: JPG, JPEG, PNG, WebP
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-surface-100 border border-surface-200">
              Max Size: {maxSizeMB} MB
            </span>
          </div>

          {/* Privacy Guarantee Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>100% In-Browser • 0 Bytes Uploaded to Server</span>
          </div>
        </div>
      </div>

      {/* Error Alert Box */}
      {uploadError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-rose-800">Upload Validation Error</h4>
            <p className="text-rose-700 mt-0.5 whitespace-pre-line">{uploadError}</p>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-xs text-rose-500 hover:text-rose-800 font-semibold p-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Upload Guidelines & Best Practices Card */}
      <div className="bg-white rounded-3xl border border-surface-200 p-6 sm:p-8 shadow-card">
        <h4 className="text-sm font-bold text-surface-900 mb-4 flex items-center gap-2">
          <Camera className="w-4 h-4 text-brand-600" />
          <span>Recommended Photo Guidelines for Best Results</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-surface-600">
          <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200/80 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-surface-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Even Studio Lighting</span>
            </div>
            <p className="text-surface-500 leading-relaxed">
              Ensure even illumination across both sides of the face with no harsh shadows or lens glare.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200/80 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-surface-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Neutral Backdrop</span>
            </div>
            <p className="text-surface-500 leading-relaxed">
              Plain white, off-white, or light blue backgrounds are ideal for official passport and visa standards.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200/80 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-surface-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Front-Facing Portrait</span>
            </div>
            <p className="text-surface-500 leading-relaxed">
              Maintain straight-on eye level, neutral expression, closed mouth, and centered head framing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
