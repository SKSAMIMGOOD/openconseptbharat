/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useCallback, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileImage,
  Layers,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type {
  RawDocumentPage,
  PerspectiveQuad,
  AspectRatioPreset,
} from "@/types/raw-image-to-pdf";
import { RawImageCropEditor } from "./RawImageCropEditor";

export interface MultiPageCropModalProps {
  isOpen: boolean;
  pages: RawDocumentPage[];
  currentPageIndex: number;
  onSelectPage: (index: number) => void;
  onSaveCrop: (
    pageId: string,
    result: {
      quad: PerspectiveQuad;
      rotation: number;
      aspectRatioPreset: AspectRatioPreset;
      croppedBlob: Blob;
      croppedPreviewUrl: string;
      width: number;
      height: number;
    }
  ) => void;
  onConfirmOriginal: (pageId: string) => void;
  onResetCrop: (pageId: string) => void;
  onClose: () => void;
  onCompleteAll?: () => void;
}

export const MultiPageCropModal: React.FC<MultiPageCropModalProps> = ({
  isOpen,
  pages,
  currentPageIndex,
  onSelectPage,
  onSaveCrop,
  onConfirmOriginal,
  onResetCrop,
  onClose,
  onCompleteAll,
}) => {
  const [incompleteWarning, setIncompleteWarning] = useState(false);

  const currentPage = pages[currentPageIndex] || null;
  const totalPages = pages.length;

  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === totalPages - 1;

  const isPageCompleted = (p: RawDocumentPage) => Boolean(p.isCropped || p.cropConfirmed);
  const completedCount = pages.filter(isPageCompleted).length;
  const allCompleted = pages.length > 0 && pages.every(isPageCompleted);

  const handlePrevPage = useCallback(() => {
    if (currentPageIndex > 0) {
      onSelectPage(currentPageIndex - 1);
    }
  }, [currentPageIndex, onSelectPage]);

  const handleNextPage = useCallback(() => {
    if (currentPageIndex < totalPages - 1) {
      onSelectPage(currentPageIndex + 1);
    }
  }, [currentPageIndex, totalPages, onSelectPage]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleProceedToFinalEdit = useCallback(() => {
    if (allCompleted) {
      if (onCompleteAll) {
        onCompleteAll();
      } else {
        onClose();
      }
    } else {
      setIncompleteWarning(true);
      setTimeout(() => setIncompleteWarning(false), 3500);
    }
  }, [allCompleted, onCompleteAll, onClose]);

  // Handle Keyboard Shortcuts (Escape to close if completed)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Horizontal swipe detection for modal page navigation on mobile
  const swipeStartX = React.useRef<number | null>(null);
  const swipeStartY = React.useRef<number | null>(null);

  const handleSwipeStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
  };

  const handleSwipeEnd = (e: React.TouchEvent) => {
    if (swipeStartX.current === null || swipeStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - swipeStartX.current;
    const deltaY = e.changedTouches[0].clientY - swipeStartY.current;

    // Detect predominantly horizontal swipe (minimum 50px delta)
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0 && currentPageIndex < totalPages - 1) {
        onSelectPage(currentPageIndex + 1);
      } else if (deltaX > 0 && currentPageIndex > 0) {
        onSelectPage(currentPageIndex - 1);
      }
    }

    swipeStartX.current = null;
    swipeStartY.current = null;
  };

  if (!isOpen || !currentPage) {
    return null;
  }

  // After confirming crop or confirming original, advance to next page or complete
  const advanceWorkflow = (currentId: string) => {
    const isNowAllDone = pages.every((p) => p.id === currentId || isPageCompleted(p));

    if (isNowAllDone) {
      // Transition automatically to Step 3: Final Editing Workspace!
      if (onCompleteAll) {
        onCompleteAll();
        return;
      }
    }

    // Advance to next page, prioritizing uncompleted pages
    const nextUncompletedIdx = pages.findIndex(
      (p, idx) => idx > currentPageIndex && p.id !== currentId && !isPageCompleted(p)
    );
    if (nextUncompletedIdx !== -1) {
      onSelectPage(nextUncompletedIdx);
    } else if (currentPageIndex < totalPages - 1) {
      onSelectPage(currentPageIndex + 1);
    } else {
      // Loop from beginning if earlier pages are still uncompleted
      const firstUncompletedIdx = pages.findIndex(
        (p) => p.id !== currentId && !isPageCompleted(p)
      );
      if (firstUncompletedIdx !== -1) {
        onSelectPage(firstUncompletedIdx);
      }
    }
  };

  const handleConfirmCrop = async (cropResult: {
    quad: PerspectiveQuad;
    rotation: number;
    aspectRatioPreset: AspectRatioPreset;
    croppedBlob: Blob;
    croppedPreviewUrl: string;
    width: number;
    height: number;
  }) => {
    onSaveCrop(currentPage.id, cropResult);
    advanceWorkflow(currentPage.id);
  };

  const handleConfirmOriginal = () => {
    onConfirmOriginal(currentPage.id);
    advanceWorkflow(currentPage.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full h-[100dvh] sm:h-[92vh] sm:max-w-6xl sm:max-h-[900px] bg-slate-950 rounded-none sm:rounded-2xl border-0 sm:border sm:border-slate-800 shadow-2xl overflow-hidden">
        {/* Incomplete Warning Banner if user tries to close early */}
        {incompleteWarning && (
          <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 text-amber-200 text-xs flex items-center justify-between gap-2 shrink-0 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Please crop or confirm &quot;Keep Original&quot; for all pages before proceeding ({completedCount} of {totalPages} done).
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIncompleteWarning(false)}
              className="text-xs text-amber-300 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Header: Single compact row on mobile, expanded on desktop */}
        <div
          className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3 bg-slate-900 border-b border-slate-800 z-30 shrink-0"
          onTouchStart={handleSwipeStart}
          onTouchEnd={handleSwipeEnd}
        >
          {/* Title & Page Indicator */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shrink-0">
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate hidden xs:inline">
                  Step 2: Crop All Pages
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
                  Page {currentPageIndex + 1} of {totalPages}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-400 hidden md:inline">
                  ({completedCount}/{totalPages} confirmed)
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate max-w-[90px] sm:max-w-xs hidden sm:block">
                {currentPage.name}
              </p>
            </div>
          </div>

          {/* Page Carousel / Thumbnail Strip */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-0.5 scrollbar-none max-w-[36vw] sm:max-w-md">
            {pages.map((p, idx) => {
              const isActive = idx === currentPageIndex;
              const isCropped = Boolean(p.isCropped);
              const isConfirmedOriginal = Boolean(p.cropConfirmed && !p.isCropped);
              const isDone = isCropped || isConfirmedOriginal;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPage(idx)}
                  className={cn(
                    "relative group flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border text-[11px] sm:text-xs font-medium transition-all shrink-0 cursor-pointer",
                    isActive
                      ? "bg-blue-600/30 border-blue-500 text-white shadow-xs ring-1 ring-blue-500/40"
                      : "bg-slate-850 hover:bg-slate-800 border-slate-700/80 text-slate-400 hover:text-slate-200"
                  )}
                  title={`Go to Page ${idx + 1}: ${p.name}`}
                >
                  {/* Miniature Thumbnail */}
                  <div className="w-4 h-5 sm:w-5 sm:h-6 bg-slate-900 rounded overflow-hidden flex items-center justify-center shrink-0">
                    {p.croppedPreviewUrl || p.thumbnailUrl ? (
                      <img
                        src={p.croppedPreviewUrl || p.thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileImage className="w-3 h-3 text-slate-500" />
                    )}
                  </div>

                  <span className="text-[10px] sm:text-xs">P{idx + 1}</span>

                  {isCropped && (
                    <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
                  )}
                  {isConfirmedOriginal && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                      Orig
                    </span>
                  )}
                  {!isDone && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Crop pending" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Navigation & Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Proceed to Edit Workspace when all pages are completed */}
            {onCompleteAll && (
              <button
                type="button"
                onClick={handleProceedToFinalEdit}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  allCompleted
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-xs"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
                )}
                title={
                  allCompleted
                    ? "Proceed to Final Editing Workspace"
                    : `Complete all pages before proceeding (${completedCount}/${totalPages} done)`
                }
              >
                <span>Done</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handlePrevPage}
              disabled={isFirstPage}
              className={cn(
                "p-1 sm:p-1.5 rounded-lg border text-slate-300 transition-colors",
                isFirstPage
                  ? "opacity-30 cursor-not-allowed border-slate-800 bg-slate-900"
                  : "bg-slate-850 hover:bg-slate-800 border-slate-700 hover:text-white"
              )}
              title="Previous Page"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={isLastPage}
              className={cn(
                "p-1 sm:p-1.5 rounded-lg border text-slate-300 transition-colors",
                isLastPage
                  ? "opacity-30 cursor-not-allowed border-slate-800 bg-slate-900"
                  : "bg-slate-850 hover:bg-slate-800 border-slate-700 hover:text-white"
              )}
              title="Next Page"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="h-4 w-[1px] bg-slate-800 mx-0.5 sm:mx-1" />

            <button
              type="button"
              onClick={handleClose}
              className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close and continue later (Esc)"
              aria-label="Close and continue later"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body: Single Page Perspective Crop Editor */}
        <div className="relative flex-1 min-h-0 w-full h-full overflow-hidden">
          <RawImageCropEditor
            key={currentPage.id}
            page={currentPage}
            pageIndex={currentPageIndex}
            totalPages={totalPages}
            onConfirmCrop={handleConfirmCrop}
            onConfirmOriginal={handleConfirmOriginal}
            onResetCrop={() => onResetCrop(currentPage.id)}
            onCancel={handleClose}
          />
        </div>
      </div>
    </div>
  );
};
