"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, File, AlertCircle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./Button";

export interface FileDropzoneProps {
  onFileSelect?: (file: File) => void;
  acceptTypes?: string[];
  maxSizeMB?: number;
  label?: string;
  hint?: string;
  className?: string;
  disabled?: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelect,
  acceptTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  maxSizeMB = 25,
  label = "Upload document or image",
  hint = "Drag and drop your file here, or browse from your device",
  className,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const processFile = (file: File) => {
    setValidationError(null);

    // Size validation
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setValidationError(`File size exceeds ${maxSizeMB} MB limit.`);
      return;
    }

    // Type validation
    if (acceptTypes.length > 0) {
      const isAccepted = acceptTypes.some((type) => {
        if (type.endsWith("/*")) {
          return file.type.startsWith(type.replace("/*", ""));
        }
        return file.type === type;
      });

      if (!isAccepted) {
        setValidationError(`Invalid file format (${file.type || "unknown"}). Allowed: ${acceptTypes.join(", ")}`);
        return;
      }
    }

    setSelectedFileName(file.name);
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const openBrowseDialog = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("w-full flex flex-col gap-2", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openBrowseDialog}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openBrowseDialog();
          }
        }}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center bg-surface-50/50 hover:bg-surface-50 hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
          isDragOver && "border-brand-600 bg-brand-50/50 scale-[0.99]",
          disabled && "opacity-50 cursor-not-allowed hover:border-surface-300 hover:bg-surface-50",
          validationError ? "border-rose-300 bg-rose-50/30" : "border-surface-300"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptTypes.join(",")}
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
          aria-label={label}
        />

        <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4 shadow-sm border border-brand-100">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="text-base font-semibold text-surface-900 mb-1">{label}</h3>
        <p className="text-sm text-surface-600 max-w-md mb-4">{hint}</p>

        <div className="flex items-center gap-2 mb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openBrowseDialog();
            }}
            disabled={disabled}
          >
            Browse Device
          </Button>
        </div>

        {selectedFileName && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-100 text-surface-800 text-xs font-medium border border-surface-200 mb-2">
            <File className="w-3.5 h-3.5 text-brand-600" />
            <span className="truncate max-w-xs">{selectedFileName}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-surface-500 mt-2">
          <span>Max size: {maxSizeMB} MB</span>
          <span>•</span>
          <span>Supported: {acceptTypes.map((t) => t.replace("image/", ".").replace("application/", ".")).join(", ")}</span>
        </div>

        <div className="mt-4 pt-4 border-t border-surface-200/60 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Private Client-Side Processing • Your file never touches a server</span>
        </div>
      </div>

      {validationError && (
        <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
};
