"use client";

import React, { useRef, useState, useCallback } from "react";
import { UploadCloud, AlertCircle, Plus, Image as ImageIcon, ShieldCheck } from "lucide-react";
import { validateFile, getImageDimensions } from "@/lib/validation/file-validator";
import { createTrackedObjectURL, revokeObjectUrlSafely } from "@/lib/utils/memory";
import type { UploadedPhoto } from "@/types/multiple-photo";
import { cn } from "@/lib/utils/cn";

export interface MultiPhotoDropzoneProps {
  onPhotosAdded: (photos: UploadedPhoto[]) => void;
  defaultCopies?: number;
  maxFileSizeMB?: number;
  allowedFormats?: string[];
  disabled?: boolean;
  className?: string;
}

export const MultiPhotoDropzone: React.FC<MultiPhotoDropzoneProps> = ({
  onPhotosAdded,
  defaultCopies = 3,
  maxFileSizeMB = 20,
  allowedFormats = ["image/jpeg", "image/png", "image/webp"],
  disabled = false,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      if (disabled || isProcessing) return;

      setIsProcessing(true);
      const errors: string[] = [];
      const newPhotos: UploadedPhoto[] = [];

      const files = Array.from(fileList);

      for (const file of files) {
        // Validate MIME type and file size
        const validation = validateFile(file, {
          maxSizeMB: maxFileSizeMB,
          allowedMimeTypes: allowedFormats,
        });

        if (!validation.isValid) {
          errors.push(`${file.name}: ${validation.error}`);
          continue;
        }

        try {
          // Extract dimensions and create tracked object URL
          const dimensions = await getImageDimensions(file);
          const previewUrl = createTrackedObjectURL(file);

          // Preload HTMLImageElement for canvas rendering
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Image decode failed"));
            img.src = previewUrl;
          });

          newPhotos.push({
            id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            file,
            name: file.name,
            size: file.size,
            width: dimensions.width,
            height: dimensions.height,
            aspectRatio: dimensions.aspectRatio,
            previewUrl,
            imageElement: img,
            copies: defaultCopies,
          });
        } catch (err) {
          errors.push(
            `${file.name}: Failed to decode image. Please ensure it is a valid JPG, PNG, or WebP file.`
          );
        }
      }

      setValidationErrors(errors);

      if (newPhotos.length > 0) {
        onPhotosAdded(newPhotos);
      }

      setIsProcessing(false);

      // Reset file input value to allow re-uploading the same file if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [disabled, isProcessing, maxFileSizeMB, allowedFormats, defaultCopies, onPhotosAdded]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative group cursor-pointer border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all duration-200",
          isDragging
            ? "border-brand-500 bg-brand-50/60 scale-[0.99]"
            : "border-surface-300 hover:border-brand-400 bg-surface-50/50 hover:bg-surface-50",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 duration-200 shadow-sm",
              isDragging ? "bg-brand-600 text-white" : "bg-brand-100 text-brand-600"
            )}
          >
            {isProcessing ? (
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-bold text-surface-900">
              {isDragging ? "Drop your photos here" : "Upload Multiple Photographs"}
            </h4>
            <p className="text-xs text-surface-600 max-w-sm mx-auto">
              Select or drag and drop multiple JPG, PNG, or WebP portraits. Add more anytime without losing existing images.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-surface-500">
            <span className="px-2 py-0.5 rounded-md bg-white border border-surface-200 font-mono">
              JPG, PNG, WebP
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-surface-200 font-mono">
              Up to {maxFileSizeMB} MB / file
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              100% In-Browser Privacy
            </span>
          </div>
        </div>
      </div>

      {/* Validation Errors Alert */}
      {validationErrors.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1 animate-fadeIn">
          <div className="flex items-center gap-1.5 font-bold text-amber-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Some files could not be added ({validationErrors.length}):</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-2 text-[11px] text-amber-800">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
