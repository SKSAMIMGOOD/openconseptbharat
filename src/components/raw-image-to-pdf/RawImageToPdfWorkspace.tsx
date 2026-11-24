"use client";

import React from "react";
import {
  FileText,
  ShieldCheck,
  Trash2,
  AlertCircle,
  Plus,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
  Maximize2,
  Crop,
  Sliders,
  CheckCircle2,
  Info,
  Palette,
} from "lucide-react";
import { useRawImageToPdf } from "@/hooks/useRawImageToPdf";
import { RawImageDropzone } from "./RawImageDropzone";
import { PageGalleryGrid } from "./PageGalleryGrid";
import { MultiPageCropModal } from "./MultiPageCropModal";
import { MultiPageEditStudioModal } from "./MultiPageEditStudioModal";
import { RawImagePrintStudio } from "./RawImagePrintStudio";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { cn } from "@/lib/utils/cn";

export const RawImageToPdfWorkspace: React.FC = () => {
  const {
    pages,
    activePageIndex,
    activePage,
    totalPages,
    croppedPagesCount,
    annotatedPagesCount,
    maxBatchSize,
    maxFileSizeMB,
    remainingCapacity,
    isProcessing,
    statusMessage,
    validationErrors,
    addImages,
    removePage,
    replacePage,
    movePageLeft,
    movePageRight,
    setActivePageIndex,
    clearAllPages,
    clearErrors,
    // Phase 2 Cropping
    isCropModalOpen,
    cropActivePageIndex,
    openCropEditor,
    closeCropEditor,
    setCropActivePageIndex,
    savePageCrop,
    resetPageCrop,
    confirmPageOriginal,
    // Workflow State: Upload -> Crop All Pages -> Final Editing Workspace -> Download PDF
    workflowStep,
    setWorkflowStep,
    allPagesCropCompleted,
    completeCropWorkflow,
    // Phase 3 Enhancements & Annotations
    globalEnhancements,
    updateGlobalEnhancement,
    resetGlobalEnhancements,
    globalColorFilter,
    updateGlobalColorFilter,
    resetGlobalColorFilter,
    setPageApplyGlobalEdits,
    addPageStroke,
    undoPageStroke,
    redoPageStroke,
    clearPageStrokes,
    setPageWatermark,
    isEditModalOpen,
    editActivePageIndex,
    openEditStudio,
    closeEditStudio,
    setEditActivePageIndex,
  } = useRawImageToPdf();

  const [incompleteEditNotice, setIncompleteEditNotice] = React.useState<boolean>(false);
  const completedPagesCount = pages.filter((p) => p.isCropped || p.cropConfirmed).length;

  return (
    <div className="w-full space-y-6">
      {/* 1. Header & Privacy Banner */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/80 dark:border-blue-800/80">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">
                  Raw Image to Clean PDF
                </h2>
                <Badge variant="brand" size="sm">
                  Phase 4: A4 Print & Multi-Page PDF Studio
                </Badge>
              </div>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-surface-600 dark:text-surface-400">
              Crop document perspectives, enhance brightness/contrast, erase unwanted marks, highlight text, add watermarks, and compile print-ready A4 PDFs — 100% in browser memory.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200/60 dark:border-emerald-800/60">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>100% In-Browser</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Workflow Step Progress Indicator (Upload -> Crop -> Edit -> Download) */}
      <div className="flex items-center justify-between gap-1.5 p-2.5 sm:p-3 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 shadow-2xs overflow-x-auto text-xs scrollbar-none">
        {/* Step 1: Upload */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors",
            totalPages === 0
              ? "bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/30"
              : "bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400"
          )}
        >
          <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
            1
          </span>
          <span>Upload</span>
        </div>

        <ArrowRight className="w-3.5 h-3.5 text-surface-400 shrink-0" />

        {/* Step 2: Crop All Pages */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors",
            isCropModalOpen || workflowStep === "crop"
              ? "bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/30"
              : allPagesCropCompleted
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
              : completedPagesCount > 0
              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60"
              : "bg-surface-100 dark:bg-surface-800 text-surface-400"
          )}
        >
          <span
            className={cn(
              "w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center font-bold",
              allPagesCropCompleted
                ? "bg-emerald-600"
                : completedPagesCount > 0
                ? "bg-amber-600"
                : "bg-blue-600"
            )}
          >
            2
          </span>
          <span>Crop All Pages</span>
          {allPagesCropCompleted ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : completedPagesCount > 0 ? (
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
              ({completedPagesCount}/{totalPages})
            </span>
          ) : null}
        </div>

        <ArrowRight className="w-3.5 h-3.5 text-surface-400 shrink-0" />

        {/* Step 3: Final Editing Workspace */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors",
            workflowStep === "edit" && !isCropModalOpen
              ? "bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/30"
              : "bg-surface-100 dark:bg-surface-800 text-surface-400"
          )}
        >
          <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
            3
          </span>
          <span>Edit Workspace</span>
        </div>

        <ArrowRight className="w-3.5 h-3.5 text-surface-400 shrink-0" />

        {/* Step 4: Download PDF */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-colors",
            workflowStep === "edit"
              ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60"
              : "bg-surface-100 dark:bg-surface-800 text-surface-400"
          )}
        >
          <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
            4
          </span>
          <span>Download PDF</span>
        </div>
      </div>

      {/* 3. Validation Errors Alert */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl p-4 transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 text-red-800 dark:text-red-300">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">Upload Notice</p>
                <ul className="text-xs list-disc list-inside space-y-0.5">
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
            <button
              type="button"
              onClick={clearErrors}
              className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 3. Processing State Indicator */}
      {isProcessing && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl p-3.5 flex items-center gap-3 text-blue-800 dark:text-blue-300 animate-pulse">
          <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
          <span className="text-xs sm:text-sm font-medium">
            {statusMessage || "Processing images in browser memory..."}
          </span>
        </div>
      )}

      {/* 4. Empty State vs Gallery Workspace */}
      {totalPages === 0 ? (
        <div className="space-y-6">
          <RawImageDropzone
            onFilesSelected={addImages}
            maxBatchSize={maxBatchSize}
            maxSizeMB={maxFileSizeMB}
            currentCount={totalPages}
            disabled={isProcessing}
          />

          {/* Feature Highlight Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5">
                <Crop className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-surface-900 dark:text-surface-100">
                Perspective Cropper & 8 Handles
              </h4>
              <p className="text-xs text-surface-600 dark:text-surface-400 mt-1 leading-relaxed">
                4 draggable corners + 4 edge midpoint handles with auto boundary detection and precision loupe.
              </p>
            </div>

            <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2.5">
                <Sliders className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-surface-900 dark:text-surface-100">
                Global Tone Enhancement
              </h4>
              <p className="text-xs text-surface-600 dark:text-surface-400 mt-1 leading-relaxed">
                Calibrated brightness, contrast, sharpness, grayscale, and invert applied seamlessly across all pages.
              </p>
            </div>

            <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 p-4">
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-surface-900 dark:text-surface-100">
                Eraser, Highlighter & Watermark
              </h4>
              <p className="text-xs text-surface-600 dark:text-surface-400 mt-1 leading-relaxed">
                Retouch unwanted marks, highlight important passages, and stamp custom text watermarks per page.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Non-blocking Cropping Paused Notice */}
          {!allPagesCropCompleted && !isCropModalOpen && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs sm:text-sm font-semibold">
                    Cropping paused. Your images and completed edits are saved. You can continue cropping anytime.
                  </p>
                  <p className="text-xs text-amber-700/90 dark:text-amber-400/90">
                    {completedPagesCount} of {totalPages} pages completed. You can select additional images from different folders or resume cropping when ready.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => openCropEditor()}
                  disabled={isProcessing}
                  className="bg-amber-600 hover:bg-amber-500 text-white shadow-xs"
                >
                  <Crop className="w-3.5 h-3.5 mr-1.5" />
                  <span>Resume Cropping</span>
                </Button>
              </div>
            </div>
          )}

          {/* Incomplete Edit Notice Alert */}
          {incompleteEditNotice && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl p-3 flex items-center justify-between gap-2 text-amber-900 dark:text-amber-200 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  Please crop or confirm &quot;Keep Original&quot; for all pages before proceeding to final editing ({completedPagesCount} of {totalPages} completed).
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIncompleteEditNotice(false)}
                className="text-xs text-amber-700 dark:text-amber-400 hover:underline shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Gallery Top Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-800 px-4 py-3 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-sm font-bold text-surface-900 dark:text-surface-100">
                {allPagesCropCompleted ? "Final Editing Workspace" : "Selected Pages & Upload"}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                {totalPages} of {maxBatchSize} pages
              </span>
              {croppedPagesCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-3 h-3" />
                  {croppedPagesCount} cropped
                </span>
              )}
              {annotatedPagesCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                  <Sparkles className="w-3 h-3" />
                  {annotatedPagesCount} annotated
                </span>
              )}
              {globalColorFilter.preset !== "original" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                  <Palette className="w-3 h-3" />
                  Filter Active
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => openCropEditor(allPagesCropCompleted ? activePageIndex : undefined)}
                disabled={isProcessing}
                className="shadow-xs"
              >
                <Crop className="w-3.5 h-3.5 mr-1.5" />
                <span>
                  {allPagesCropCompleted
                    ? "Re-crop Pages"
                    : completedPagesCount > 0
                    ? "Resume Cropping"
                    : "Crop All Pages"}
                </span>
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (!allPagesCropCompleted) {
                    setIncompleteEditNotice(true);
                    setTimeout(() => setIncompleteEditNotice(false), 4000);
                  } else {
                    openEditStudio(activePageIndex);
                  }
                }}
                disabled={isProcessing}
                className={cn(
                  "shadow-xs text-white",
                  allPagesCropCompleted
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-surface-400 dark:bg-surface-700 hover:bg-surface-500 cursor-not-allowed opacity-80"
                )}
                title={
                  !allPagesCropCompleted
                    ? "Complete cropping for all pages before enhancing & annotating"
                    : "Open Enhance & Annotation Studio"
                }
              >
                <Sliders className="w-3.5 h-3.5 mr-1.5" />
                <span>Enhance & Annotate</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAllPages}
                disabled={isProcessing}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Clear All
              </Button>
            </div>
          </div>

          {/* Responsive Gallery Grid */}
          <PageGalleryGrid
            pages={pages}
            activePageIndex={activePageIndex}
            maxBatchSize={maxBatchSize}
            maxSizeMB={maxFileSizeMB}
            onSelectPage={setActivePageIndex}
            onRemovePage={removePage}
            onReplacePage={replacePage}
            onMoveLeft={movePageLeft}
            onMoveRight={movePageRight}
            onCropPage={(idx) => openCropEditor(idx)}
            onEditPage={(idx) => {
              if (!allPagesCropCompleted) {
                setIncompleteEditNotice(true);
                setTimeout(() => setIncompleteEditNotice(false), 4000);
              } else {
                openEditStudio(idx);
              }
            }}
            onAddMoreFiles={addImages}
            onToggleApplyGlobalEdits={setPageApplyGlobalEdits}
            disabled={isProcessing}
          />

          {/* Phase 4: Print & Export Studio (A4 Multi-Page PDF Compiler) */}
          <RawImagePrintStudio
            pages={pages}
            activePageIndex={activePageIndex}
            globalEnhancements={globalEnhancements}
            globalColorFilter={globalColorFilter}
            disabled={isProcessing || !allPagesCropCompleted}
          />

          {/* Phase 4 Status Banner */}
          <div className="bg-surface-100/80 dark:bg-surface-850 rounded-xl border border-surface-200/80 dark:border-surface-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-surface-900 dark:text-surface-100">
                  Phase 4 A4 Page Fitting & Multi-Page PDF Compiler Ready
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                  All perspective crops, global enhancements, color filters, per-page opt-outs, eraser retouching, highlighter marks, and watermarks are compiled sequentially into a single print-ready A4 PDF document.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-800/60 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Phase 4 Complete
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Phase 2 Multi-Page Perspective Crop Modal */}
      <MultiPageCropModal
        isOpen={isCropModalOpen}
        pages={pages}
        currentPageIndex={cropActivePageIndex}
        onSelectPage={setCropActivePageIndex}
        onSaveCrop={savePageCrop}
        onConfirmOriginal={confirmPageOriginal}
        onResetCrop={resetPageCrop}
        onClose={closeCropEditor}
        onCompleteAll={completeCropWorkflow}
      />

      {/* 6. Phase 3 Multi-Page Document Enhancement & Annotation Modal */}
      <MultiPageEditStudioModal
        isOpen={isEditModalOpen}
        pages={pages}
        currentPageIndex={editActivePageIndex}
        onSelectPage={setEditActivePageIndex}
        globalEnhancements={globalEnhancements}
        onUpdateEnhancement={updateGlobalEnhancement}
        onResetEnhancements={resetGlobalEnhancements}
        globalColorFilter={globalColorFilter}
        onUpdateColorFilter={updateGlobalColorFilter}
        onResetColorFilter={resetGlobalColorFilter}
        onAddStroke={addPageStroke}
        onUndoStroke={undoPageStroke}
        onRedoStroke={redoPageStroke}
        onClearStrokes={clearPageStrokes}
        onSetWatermark={setPageWatermark}
        onToggleApplyGlobalEdits={setPageApplyGlobalEdits}
        onClose={closeEditStudio}
      />
    </div>
  );
};
