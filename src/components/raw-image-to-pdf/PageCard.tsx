/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  RefreshCw,
  FileImage,
  CheckCircle2,
  Crop,
  Sliders,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { RawDocumentPage } from "@/types/raw-image-to-pdf";

export interface PageCardProps {
  page: RawDocumentPage;
  pageNumber: number;
  totalCount: number;
  isActive: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onReplace: (newFile: File) => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onCrop?: () => void;
  onEdit?: () => void;
  onToggleApplyGlobalEdits?: (enabled: boolean) => void;
  disabled?: boolean;
}

export const PageCard: React.FC<PageCardProps> = ({
  page,
  pageNumber,
  totalCount,
  isActive,
  onSelect,
  onRemove,
  onReplace,
  onMoveLeft,
  onMoveRight,
  onCrop,
  onEdit,
  onToggleApplyGlobalEdits,
  disabled = false,
}) => {
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const handleReplaceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    replaceInputRef.current?.click();
  };

  const handleReplaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onReplace(e.target.files[0]);
    }
    e.target.value = "";
  };

  const handleCropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || !onCrop) return;
    onCrop();
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || !onEdit) return;
    onEdit();
  };

  const isFirst = pageNumber === 1;
  const isLast = pageNumber === totalCount;
  const isCropped = Boolean(page.isCropped);
  const hasEdits = Boolean(
    (page.annotations && page.annotations.length > 0) || (page.watermark && page.watermark.enabled)
  );

  const displayImageSrc =
    page.editedPreviewUrl || (isCropped && page.croppedPreviewUrl) || page.thumbnailUrl;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative flex flex-col bg-white dark:bg-surface-850 rounded-2xl border transition-all duration-150 overflow-hidden shadow-xs hover:shadow-md",
        isActive
          ? "border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-400"
          : "border-surface-200 dark:border-surface-700/80 hover:border-surface-300 dark:hover:border-surface-600"
      )}
    >
      {/* Hidden file input for single image replacement */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleReplaceFile}
        className="hidden"
        disabled={disabled}
      />

      {/* Top Bar: Page Number, Badges & Delete Button */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-surface-50/80 dark:bg-surface-800/80 border-b border-surface-200/60 dark:border-surface-700/60">
        <div className="flex items-center gap-1.5">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-[11px] font-bold shadow-2xs">
            {pageNumber}
          </span>
          <span className="text-xs font-semibold text-surface-900 dark:text-surface-100">
            Page {pageNumber}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isCropped && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>Cropped</span>
            </span>
          )}

          {hasEdits && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Edited</span>
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            disabled={disabled}
            title="Remove this page"
            className="p-1 rounded-md text-surface-400 hover:text-red-600 dark:text-surface-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Thumbnail Area with Clean White-Background Document Layout */}
      <div className="relative w-full aspect-[3/4] bg-white dark:bg-surface-900 flex items-center justify-center overflow-hidden p-3 border-y border-surface-100 dark:border-surface-800">
        {displayImageSrc ? (
          <img
            src={displayImageSrc}
            alt={page.name}
            className="w-full h-full object-contain rounded-sm shadow-xs border border-surface-200/80 dark:border-surface-700/80 bg-white transition-transform duration-200 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-surface-400">
            <FileImage className="w-8 h-8 stroke-1 mb-1" />
            <span className="text-xs">Processing...</span>
          </div>
        )}

        {/* Active Indicator Overlay Pill */}
        {isActive && (
          <div className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 pointer-events-none">
            <CheckCircle2 className="w-3 h-3" />
            <span>Active</span>
          </div>
        )}

        {/* Action Overlay Buttons */}
        <div className="absolute bottom-2 inset-x-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          {onCrop && (
            <button
              type="button"
              onClick={handleCropClick}
              disabled={disabled}
              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900/90 hover:bg-blue-600 text-white text-[11px] font-semibold shadow-md backdrop-blur-xs border border-white/20 flex items-center justify-center gap-1 transition-colors"
              title={isCropped ? "Re-edit perspective crop" : "Perspective crop"}
            >
              <Crop className="w-3 h-3" />
              <span>{isCropped ? "Re-crop" : "Crop"}</span>
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={handleEditClick}
              disabled={disabled}
              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900/90 hover:bg-indigo-600 text-white text-[11px] font-semibold shadow-md backdrop-blur-xs border border-white/20 flex items-center justify-center gap-1 transition-colors"
              title="Enhance, erase, highlight and watermark"
            >
              <Sliders className="w-3 h-3" />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Metadata Info */}
      <div className="px-3.5 py-2 text-left bg-white dark:bg-surface-850 border-t border-surface-100 dark:border-surface-800">
        <p className="text-xs font-medium text-surface-900 dark:text-surface-100 truncate" title={page.name}>
          {page.name}
        </p>
        <div className="flex items-center justify-between text-[11px] text-surface-500 dark:text-surface-400 mt-0.5">
          <span>
            {isCropped && page.croppedWidth && page.croppedHeight
              ? `${page.croppedWidth} × ${page.croppedHeight}`
              : `${page.originalWidth} × ${page.originalHeight}`}
          </span>
          <span>{page.sizeFormatted}</span>
        </div>

        {/* Apply Global Edits Checkbox */}
        <div className="pt-1.5 border-t border-surface-100 dark:border-surface-800/60 mt-1.5 flex items-center justify-between">
          <label
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-[11px] font-medium text-surface-600 dark:text-surface-300 cursor-pointer select-none"
          >
            <input
              type="checkbox"
              checked={page.applyGlobalEdits ?? true}
              onChange={(e) => onToggleApplyGlobalEdits?.(e.target.checked)}
              disabled={disabled}
              className="rounded border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
            />
            <span>Apply global edits</span>
          </label>
        </div>
      </div>

      {/* Bottom Action Controls: Reorder & Replace */}
      <div className="flex items-center justify-between px-2.5 py-2 bg-surface-50 dark:bg-surface-800/60 border-t border-surface-200/60 dark:border-surface-700/60 gap-1">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveLeft();
            }}
            disabled={disabled || isFirst}
            title={isFirst ? "First page" : "Move Left (Earlier in PDF)"}
            className={cn(
              "p-1.5 rounded-md text-surface-600 dark:text-surface-300 transition-colors",
              isFirst
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-surface-200/80 dark:hover:bg-surface-700"
            )}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveRight();
            }}
            disabled={disabled || isLast}
            title={isLast ? "Last page" : "Move Right (Later in PDF)"}
            className={cn(
              "p-1.5 rounded-md text-surface-600 dark:text-surface-300 transition-colors",
              isLast
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-surface-200/80 dark:hover:bg-surface-700"
            )}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleReplaceClick}
          disabled={disabled}
          title="Replace image with another file"
          className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-surface-700 dark:text-surface-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-surface-200/70 dark:hover:bg-surface-700 rounded-md transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Replace</span>
        </button>
      </div>
    </div>
  );
};
