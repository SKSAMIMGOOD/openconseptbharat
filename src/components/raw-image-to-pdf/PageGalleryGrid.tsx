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
  Plus,
} from "lucide-react";
import type { RawDocumentPage } from "@/types/raw-image-to-pdf";
import { PageCard } from "./PageCard";
import { RawImageDropzone } from "./RawImageDropzone";
import { cn } from "@/lib/utils/cn";

export interface PageGalleryGridProps {
  pages: RawDocumentPage[];
  activePageIndex: number;
  maxBatchSize: number;
  maxSizeMB?: number;
  onSelectPage: (index: number) => void;
  onRemovePage: (id: string) => void;
  onReplacePage: (id: string, newFile: File) => void;
  onMoveLeft: (index: number) => void;
  onMoveRight: (index: number) => void;
  onCropPage?: (index: number) => void;
  onEditPage?: (index: number) => void;
  onAddMoreFiles: (files: File[]) => void;
  onToggleApplyGlobalEdits?: (pageId: string, enabled: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const PageGalleryGrid: React.FC<PageGalleryGridProps> = ({
  pages,
  activePageIndex,
  maxBatchSize,
  maxSizeMB,
  onSelectPage,
  onRemovePage,
  onReplacePage,
  onMoveLeft,
  onMoveRight,
  onCropPage,
  onEditPage,
  onAddMoreFiles,
  onToggleApplyGlobalEdits,
  disabled = false,
  className,
}) => {
  const canAddMore = pages.length < maxBatchSize;

  // Active page for mobile single-image viewer
  const activePage = pages[activePageIndex] || pages[0] || null;
  const activePreviewUrl =
    activePage &&
    (activePage.editedPreviewUrl || activePage.croppedPreviewUrl || activePage.thumbnailUrl);
  const hasEdits =
    activePage &&
    Boolean(
      (activePage.annotations && activePage.annotations.length > 0) ||
        (activePage.watermark && activePage.watermark.enabled)
    );

  // Hidden file inputs for mobile single-card interactions
  const mobileReplaceInputRef = useRef<HTMLInputElement>(null);
  const mobileAddInputRef = useRef<HTMLInputElement>(null);

  // Swipe gesture state for mobile navigation
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Detect predominantly horizontal swipe (minimum 40px delta)
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0 && activePageIndex < pages.length - 1) {
        onSelectPage(activePageIndex + 1);
      } else if (deltaX > 0 && activePageIndex > 0) {
        onSelectPage(activePageIndex - 1);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleMobileReplaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activePage && e.target.files && e.target.files.length > 0) {
      onReplacePage(activePage.id, e.target.files[0]);
    }
    e.target.value = "";
  };

  const handleMobileAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddMoreFiles(Array.from(e.target.files));
    }
    e.target.value = "";
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* ============================================================== */}
      {/* 1. Mobile Single Image Viewer (< sm screens)                   */}
      {/* ============================================================== */}
      <div className="block sm:hidden space-y-3">
        {/* Hidden File Inputs for Mobile */}
        <input
          ref={mobileReplaceInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleMobileReplaceFile}
          className="hidden"
        />
        <input
          ref={mobileAddInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleMobileAddFiles}
          className="hidden"
        />

        {activePage && (
          <div className="bg-white dark:bg-surface-850 rounded-2xl border border-surface-200 dark:border-surface-700/80 shadow-xs overflow-hidden">
            {/* Top Bar: Page Indicator, Status Badges & Quick Action Icons */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white shadow-2xs">
                  Page {activePageIndex + 1} of {pages.length}
                </span>
                {activePage.isCropped && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-3 h-3" />
                    Cropped
                  </span>
                )}
                {hasEdits && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                    <Sparkles className="w-3 h-3" />
                    Edited
                  </span>
                )}
              </div>

              {/* Page Controls: Reorder, Replace, Delete */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onMoveLeft(activePageIndex)}
                  disabled={disabled || activePageIndex === 0}
                  className="p-1 rounded-lg text-surface-500 hover:text-surface-900 dark:hover:text-white disabled:opacity-30 transition-colors"
                  title="Move Page Earlier"
                  aria-label="Move Page Earlier"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onMoveRight(activePageIndex)}
                  disabled={disabled || activePageIndex === pages.length - 1}
                  className="p-1 rounded-lg text-surface-500 hover:text-surface-900 dark:hover:text-white disabled:opacity-30 transition-colors"
                  title="Move Page Later"
                  aria-label="Move Page Later"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => mobileReplaceInputRef.current?.click()}
                  disabled={disabled}
                  className="p-1 rounded-lg text-surface-500 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-30 transition-colors"
                  title="Replace Image"
                  aria-label="Replace Image"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemovePage(activePage.id)}
                  disabled={disabled}
                  className="p-1 rounded-lg text-surface-500 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-30 transition-colors"
                  title="Remove Page"
                  aria-label="Remove Page"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Main Single Image Display Stage with Clean White-Background Layout & Touch Navigation */}
            <div
              className="relative w-full aspect-[4/3] max-h-72 bg-white dark:bg-surface-900 border-y border-surface-200 dark:border-surface-800 flex items-center justify-center overflow-hidden touch-pan-y"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {activePreviewUrl ? (
                <img
                  src={activePreviewUrl}
                  alt={activePage.name}
                  className="w-full h-full object-contain p-3 drop-shadow-sm"
                />
              ) : (
                <FileImage className="w-12 h-12 text-surface-400" />
              )}

              {/* Prev Page Floating Arrow */}
              {activePageIndex > 0 && (
                <button
                  type="button"
                  onClick={() => onSelectPage(activePageIndex - 1)}
                  disabled={disabled}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white shadow-md backdrop-blur-xs transition-transform active:scale-90"
                  title="Previous Page"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Next Page Floating Arrow */}
              {activePageIndex < pages.length - 1 && (
                <button
                  type="button"
                  onClick={() => onSelectPage(activePageIndex + 1)}
                  disabled={disabled}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white shadow-md backdrop-blur-xs transition-transform active:scale-90"
                  title="Next Page"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Active Page Details & Direct Actions */}
            <div className="p-3 bg-white dark:bg-surface-850 border-t border-surface-200 dark:border-surface-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-surface-500">
                <span className="truncate max-w-[200px]">{activePage.name}</span>
                <span>{activePage.sizeFormatted}</span>
              </div>

              {/* Apply Global Edits Checkbox */}
              <div className="pt-1 border-t border-surface-100 dark:border-surface-800/60 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-medium text-surface-600 dark:text-surface-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={activePage.applyGlobalEdits ?? true}
                    onChange={(e) =>
                      onToggleApplyGlobalEdits?.(activePage.id, e.target.checked)
                    }
                    disabled={disabled}
                    className="rounded border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                  />
                  <span>Apply global edits</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onCropPage?.(activePageIndex)}
                  disabled={disabled}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 hover:bg-blue-100 transition-colors"
                >
                  <Crop className="w-3.5 h-3.5" />
                  <span>Crop Perspective</span>
                </button>

                <button
                  type="button"
                  onClick={() => onEditPage?.(activePageIndex)}
                  disabled={disabled}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100 transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Enhance & Edit</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Horizontal Thumbnail Reel + Compact Add More Button */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          {pages.map((p, idx) => {
            const isCurrent = idx === activePageIndex;
            const thumb = p.croppedPreviewUrl || p.thumbnailUrl;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPage(idx)}
                className={cn(
                  "relative shrink-0 w-16 h-20 rounded-xl overflow-hidden border-2 transition-all p-0.5",
                  isCurrent
                    ? "border-blue-600 ring-2 ring-blue-500/30 scale-105"
                    : "border-surface-200 dark:border-surface-700 opacity-70 hover:opacity-100"
                )}
                title={`Page ${idx + 1}: ${p.name}`}
              >
                {thumb ? (
                  <img src={thumb} alt="" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center rounded-lg">
                    <FileImage className="w-4 h-4 text-surface-400" />
                  </div>
                )}
                <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded text-[10px] font-bold bg-black/70 text-white">
                  P{idx + 1}
                </span>
                {p.isCropped && (
                  <CheckCircle2 className="absolute top-1 right-1 w-3.5 h-3.5 text-emerald-400 drop-shadow" />
                )}
              </button>
            );
          })}

          {canAddMore && (
            <button
              type="button"
              onClick={() => mobileAddInputRef.current?.click()}
              disabled={disabled}
              className="shrink-0 w-16 h-20 rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-700 hover:border-blue-500 flex flex-col items-center justify-center gap-1 text-surface-500 hover:text-blue-600 transition-colors bg-surface-50 dark:bg-surface-900"
              title="Add more images"
            >
              <Plus className="w-5 h-5" />
              <span className="text-[10px] font-bold">+ Add</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. Desktop Grid Layout (sm and up)                             */}
      {/* ============================================================== */}
      <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {pages.map((page, index) => (
          <PageCard
            key={page.id}
            page={page}
            pageNumber={index + 1}
            totalCount={pages.length}
            isActive={index === activePageIndex}
            onSelect={() => onSelectPage(index)}
            onRemove={() => onRemovePage(page.id)}
            onReplace={(newFile) => onReplacePage(page.id, newFile)}
            onMoveLeft={() => onMoveLeft(index)}
            onMoveRight={() => onMoveRight(index)}
            onCrop={() => onCropPage?.(index)}
            onEdit={() => onEditPage?.(index)}
            onToggleApplyGlobalEdits={(val) => onToggleApplyGlobalEdits?.(page.id, val)}
            disabled={disabled}
          />
        ))}

        {/* Add More Slot */}
        {canAddMore && (
          <div className="flex flex-col">
            <RawImageDropzone
              onFilesSelected={onAddMoreFiles}
              maxBatchSize={maxBatchSize}
              maxSizeMB={maxSizeMB}
              currentCount={pages.length}
              disabled={disabled}
              compact
              className="h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
};
