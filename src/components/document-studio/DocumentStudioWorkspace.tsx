"use client";

import React, { useRef, useState } from "react";
import { useDocumentStudio } from "@/hooks/useDocumentStudio";
import { DocumentSideWorkspace } from "./DocumentSideWorkspace";
import { DocumentCropEditor } from "./DocumentCropEditor";
import { DocumentStudioControls } from "./DocumentStudioControls";
import { DocumentEnhancementPanel } from "./DocumentEnhancementPanel";
import { DocumentPrintSettingsPanel } from "./DocumentPrintSettingsPanel";
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  MAX_DOCUMENT_FILE_SIZE_MB,
  isSideActive,
} from "@/constants/document-studio";
import type {
  DocumentTypeId,
  SourceLayoutMode,
  DocumentSide,
} from "@/types/document-studio";
import { isEnhancementActive } from "@/types/document-studio";
import { cn } from "@/lib/utils/cn";
import {
  Sparkles,
  ShieldCheck,
  UploadCloud,
  RefreshCw,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Columns,
  Rows,
  Crop as CropIcon,
  ChevronDown,
  Info,
  CheckCircle2,
  SlidersHorizontal,
  Printer,
} from "lucide-react";

const LAYOUT_OPTIONS: Array<{
  id: SourceLayoutMode;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    id: "auto",
    label: "Auto Detect",
    shortLabel: "Auto",
    icon: Sparkles,
    description: "Automatically analyzes image and determines card layout",
  },
  {
    id: "bottom-dual",
    label: "Bottom Left + Bottom Right",
    shortLabel: "Bottom Left + Right",
    icon: Columns,
    description: "Dedicated detection for e-Aadhaar, PAN, and official letters with cards in lower section",
  },
  {
    id: "vertical",
    label: "Top + Bottom",
    shortLabel: "Top + Bottom",
    icon: Rows,
    description: "Stacked cards arranged vertically (Split Vertically)",
  },
  {
    id: "horizontal",
    label: "Left + Right",
    shortLabel: "Left + Right",
    icon: Columns,
    description: "Side-by-side cards on a wide landscape sheet (Split Horizontally)",
  },
  {
    id: "manual",
    label: "Manual Crop",
    shortLabel: "Manual",
    icon: CropIcon,
    description: "Manually adjust crop boundaries on source page",
  },
];

export interface DocumentStudioWorkspaceProps {
  initialDocType?: DocumentTypeId;
  lockDocType?: boolean;
}

export const DocumentStudioWorkspace: React.FC<DocumentStudioWorkspaceProps> = ({
  initialDocType,
  lockDocType = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDocSpecs, setShowDocSpecs] = useState(false);
  const [activeEnhanceSide, setActiveEnhanceSide] = useState<DocumentSide>("front");
  const [isEnhancePanelOpen, setIsEnhancePanelOpen] = useState(false);
  const [activePrintSide, setActivePrintSide] = useState<DocumentSide>("front");
  const [isPrintPanelOpen, setIsPrintPanelOpen] = useState(false);

  const {
    state,
    currentDocDef,
    availableSides,
    hasAnyFile,
    isSingleSided,
    sourceLayoutMode,
    setDocumentType,
    setCustomSidesMode,
    setSourceLayoutMode,
    uploadDocumentFile,
    changePdfPage,
    openCropEditor,
    closeCropEditor,
    setSideCrop,
    setSideRotation,
    setSideZoom,
    setSideAspectRatioLocked,
    toggleSideActiveView,
    rotateSide,
    zoomSide,
    applyCrop,
    runAutoDetection,
    applySplitLayout,
    resetCrop,
    resetBothCrops,
    downloadSideCrop,
    setSideEnhancement,
    resetSideEnhancements,
    toggleSideBeforeAfter,
    setSidePrintSettings,
    setAllPrintSettings,
    clearAll,
  } = useDocumentStudio(initialDocType);

  const isFrontActive = isSideActive("front", currentDocDef, state.customSidesMode);
  const isBackActive = !isSingleSided && isSideActive("back", currentDocDef, state.customSidesMode);
  const isDualSide = isFrontActive && isBackActive;

  const activeCropSide = state.front.isCropEditorOpen
    ? "front"
    : state.back.isCropEditorOpen
    ? "back"
    : null;

  // Single file upload handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadDocumentFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadDocumentFile(e.target.files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerBrowse = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full space-y-6">
      {/* Hidden File Input for single document file */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_DOCUMENT_EXTENSIONS.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="Upload document file containing both sides"
      />

      {/* 1. Initial Empty State: Sidebar + Dropzone */}
      {!hasAnyFile && (
        <div className="flex flex-col lg:flex-row items-start gap-8">
          <aside className="w-full lg:w-88 xl:w-96 shrink-0 order-2 lg:order-1">
            <DocumentStudioControls
              state={state}
              onSelectType={setDocumentType}
              onSelectCustomSides={setCustomSidesMode}
              onClearAll={clearAll}
              hideTypeSelector={lockDocType}
            />
          </aside>

          <section className="flex-1 w-full order-1 lg:order-2 space-y-6">
            <div className="bg-white dark:bg-surface-800/90 rounded-2xl border border-surface-200 dark:border-surface-700/80 p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-surface-900 dark:text-surface-100 tracking-tight">
                    {currentDocDef.name} Workspace
                  </h2>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/50">
                    {isDualSide ? "Auto-Separating Dual Sides" : "Single-Sided Mode"}
                  </span>
                </div>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 max-w-xl">
                  Upload ONE document scan or PDF. Front and back sides are detected, cropped, and separated into standard CR80 format automatically.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 text-xs text-emerald-800 dark:text-emerald-300 font-medium bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Zero Uploads • Ephemeral</span>
              </div>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerBrowse}
              className={cn(
                "w-full bg-white dark:bg-surface-800/90 border-2 border-dashed rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 shadow-subtle min-h-[360px]",
                isDragOver
                  ? "border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 scale-[0.99]"
                  : "border-surface-300 dark:border-surface-700 hover:border-brand-400 hover:bg-surface-50/60 dark:hover:bg-surface-800"
              )}
            >
              <div className="w-16 h-16 rounded-3xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
                <UploadCloud className="w-8 h-8" />
              </div>

              <h3 className="text-base sm:text-lg font-bold text-surface-900 dark:text-surface-100">
                Upload {currentDocDef.name} File
              </h3>
              <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-1.5 max-w-md">
                Select a single scan or PDF containing {isDualSide ? "both Front and Back sides" : "the document"}.
                Both sides are detected and cropped into separate standard CR80 images (85.60 × 53.98 mm) in browser memory.
              </p>

              <div className="mt-6 flex items-center gap-2.5 flex-wrap justify-center text-xs text-surface-500">
                <span className="px-3 py-1 rounded-lg bg-surface-100 dark:bg-surface-700/60 font-medium">
                  PDF, JPG, PNG or WebP
                </span>
                <span>•</span>
                <span>Max {MAX_DOCUMENT_FILE_SIZE_MB} MB</span>
                <span>•</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% In-Browser Private
                </span>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 2. Uploaded Document Active Workspace */}
      {hasAnyFile && (
        <div className="w-full space-y-3.5 sm:space-y-4">
          {/* Top Control Bar */}
          <div className="bg-white dark:bg-surface-800/90 rounded-2xl border border-surface-200 dark:border-surface-700/80 px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Left: Document Info */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-surface-900 dark:text-surface-100 tracking-tight">
                    {currentDocDef.name} Studio
                  </h2>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/50">
                    {isDualSide ? "Front & Back" : "Single-Sided"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-surface-500">
                  <span
                    className="font-semibold text-surface-800 dark:text-surface-200 truncate max-w-[200px]"
                    title={state.source.fileName || ""}
                  >
                    {state.source.fileName}
                  </span>
                  <span>•</span>
                  <span>{state.source.fileSizeFormatted}</span>
                  {state.source.dimensions && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-[11px]">
                        {state.source.dimensions.width}×{state.source.dimensions.height}px
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Multi-page PDF page switcher */}
              {state.source.fileType === "pdf" && state.source.pageCount > 1 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs self-start sm:self-auto">
                  <span className="font-semibold text-surface-700 dark:text-surface-300 text-[11px]">
                    Page {state.source.currentPage}/{state.source.pageCount}
                  </span>
                  <button
                    type="button"
                    disabled={state.source.currentPage <= 1 || state.source.isLoading}
                    onClick={() => changePdfPage(state.source.currentPage - 1)}
                    className="p-1 rounded-md bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 disabled:opacity-40"
                    title="Previous page"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={state.source.currentPage >= state.source.pageCount || state.source.isLoading}
                    onClick={() => changePdfPage(state.source.currentPage + 1)}
                    className="p-1 rounded-md bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 disabled:opacity-40"
                    title="Next page"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Right: Actions & Optional Specs Toggle */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsEnhancePanelOpen((prev) => !prev)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors shadow-2xs",
                  isEnhancementActive(state.front.enhancements) || isEnhancementActive(state.back.enhancements)
                    ? "bg-brand-50 text-brand-700 border-brand-300 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800"
                    : isEnhancePanelOpen
                    ? "bg-surface-200 dark:bg-surface-700 text-surface-900 dark:text-surface-100 border-surface-300 dark:border-surface-600"
                    : "bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-700 hover:bg-surface-100"
                )}
                title="Toggle Document Enhancement panel"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Enhance</span>
                {(isEnhancementActive(state.front.enhancements) || isEnhancementActive(state.back.enhancements)) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsPrintPanelOpen((prev) => !prev)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors shadow-2xs",
                  isPrintPanelOpen
                    ? "bg-surface-200 dark:bg-surface-700 text-surface-900 dark:text-surface-100 border-surface-300 dark:border-surface-600"
                    : "bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-700 hover:bg-surface-100"
                )}
                title="Toggle Print Quality & Document Dimensions panel"
              >
                <Printer className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Print & Size</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDocSpecs((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-surface-600 dark:text-surface-300 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:bg-surface-100 transition-colors"
                title="Toggle document specifications"
              >
                <Info className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Specs & Info</span>
                <ChevronDown className={cn("w-3 h-3 transition-transform", showDocSpecs && "rotate-180")} />
              </button>

              <button
                type="button"
                onClick={runAutoDetection}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors shadow-2xs"
                title="Re-run automatic boundary detection"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Re-detect</span>
              </button>

              <button
                type="button"
                onClick={resetBothCrops}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-surface-700 dark:text-surface-300 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 hover:bg-surface-50 transition-colors"
                title="Reset both Front and Back crops"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Both</span>
              </button>

              <button
                type="button"
                onClick={triggerBrowse}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-surface-700 dark:text-surface-300 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 hover:bg-surface-50 transition-colors"
                title="Replace uploaded document file"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Replace</span>
              </button>

              <button
                type="button"
                onClick={clearAll}
                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/60 transition-colors"
                title="Remove document and reset"
                aria-label="Remove document and reset"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Optional Collapsible Document Specifications Card */}
          {showDocSpecs && (
            <div className="bg-surface-50/80 dark:bg-surface-800/60 rounded-2xl border border-surface-200/80 dark:border-surface-700 p-4 text-xs space-y-3 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-200/60 dark:border-surface-700/60 pb-2">
                <div>
                  <span className="font-bold text-surface-900 dark:text-surface-100">
                    {currentDocDef.name} ({currentDocDef.badge})
                  </span>
                  <p className="text-surface-500 mt-0.5">{currentDocDef.description}</p>
                </div>
                {currentDocDef.targetDimensions && (
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-brand-700 dark:text-brand-300">
                      {currentDocDef.targetDimensions.widthMm} × {currentDocDef.targetDimensions.heightMm} mm
                    </span>
                    <span className="text-[10px] text-surface-400 block">
                      Target ISO ID-1 Standard Form Factor (CR80)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Source Layout Selector Bar */}
          {isDualSide && (
            <div className="bg-white dark:bg-surface-800/90 rounded-2xl border border-surface-200 dark:border-surface-700/80 p-3 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-surface-700 dark:text-surface-300 text-[11px] uppercase tracking-wider">
                  Source Layout:
                </span>
                <span className="text-[11px] text-surface-500">
                  Select arrangement of Front & Back sides on the uploaded page
                </span>
              </div>

              {/* Layout Option Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {LAYOUT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = sourceLayoutMode === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        if (option.id === "manual") {
                          openCropEditor("front");
                        } else {
                          setSourceLayoutMode(option.id);
                        }
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all",
                        isActive
                          ? "bg-brand-600 text-white shadow-xs"
                          : "bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200/80 dark:hover:bg-surface-600"
                      )}
                      title={option.description}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detection Status Alert Banner */}
          {state.autoDetectStatus.status === "success" && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {state.autoDetectStatus.message || "Document regions detected and separated automatically."}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 shrink-0">
                Confidence: {Math.round((state.autoDetectStatus.confidence ?? 0.9) * 100)}%
              </span>
            </div>
          )}

          {state.autoDetectStatus.status === "failed" && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {state.autoDetectStatus.message || "Could not automatically isolate card boundaries. Default regions applied."}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openCropEditor("front")}
                  className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition-colors"
                >
                  Adjust Front Crop
                </button>
                {isDualSide && (
                  <button
                    type="button"
                    onClick={() => openCropEditor("back")}
                    className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition-colors"
                  >
                    Adjust Back Crop
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Collapsible Document Enhancement Panel */}
          <DocumentEnhancementPanel
            frontEnhancements={state.front.enhancements}
            backEnhancements={state.back.enhancements}
            isDualSide={isDualSide}
            activeSide={activeEnhanceSide}
            onSelectSide={setActiveEnhanceSide}
            onChangeEnhancement={setSideEnhancement}
            onResetEnhancements={resetSideEnhancements}
            onToggleBeforeAfter={toggleSideBeforeAfter}
            showingBeforeAfter={{
              front: Boolean(state.front.showBefore),
              back: Boolean(state.back.showBefore),
            }}
            isOpen={isEnhancePanelOpen}
            onToggleOpen={() => setIsEnhancePanelOpen((prev) => !prev)}
          />

          {/* Collapsible Print Quality & Dimensions Panel */}
          <DocumentPrintSettingsPanel
            frontSettings={state.front.printSettings}
            backSettings={state.back.printSettings}
            frontDimensions={state.front.croppedDimensions || state.source.dimensions}
            backDimensions={state.back.croppedDimensions || state.source.dimensions}
            isDualSide={isDualSide}
            activeSide={activePrintSide}
            onSelectSide={setActivePrintSide}
            onChangeSettings={setSidePrintSettings}
            onApplyToBoth={setAllPrintSettings}
            isOpen={isPrintPanelOpen}
            onToggleOpen={() => setIsPrintPanelOpen((prev) => !prev)}
          />

          {/* DOCUMENT PREVIEWS WORKSPACE */}
          <div
            className={
              isDualSide
                ? "grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 w-full"
                : "max-w-2xl mx-auto w-full"
            }
          >
            {/* Front Side Panel */}
            {isFrontActive && (
              <DocumentSideWorkspace
                side="front"
                sideResult={state.front}
                sourceFile={state.source}
                docDef={currentDocDef}
                otherCrop={state.back.crop}
                otherSideTitle="Back Side Region"
                onOpenCropEditor={openCropEditor}
                onCloseCropEditor={closeCropEditor}
                onCropChange={setSideCrop}
                onRotationChange={setSideRotation}
                onZoomChange={setSideZoom}
                onAspectRatioLockedChange={setSideAspectRatioLocked}
                onApplyCrop={applyCrop}
                onAutoCrop={runAutoDetection}
                onResetCrop={resetCrop}
                onReplace={triggerBrowse}
                onToggleView={toggleSideActiveView}
                onRotateSide={rotateSide}
                onZoomSide={zoomSide}
                onDownloadSide={downloadSideCrop}
                onToggleBeforeAfter={toggleSideBeforeAfter}
                onOpenEnhancePanel={(s) => {
                  setActiveEnhanceSide(s);
                  setIsEnhancePanelOpen(true);
                }}
                onOpenPrintPanel={(s) => {
                  setActivePrintSide(s);
                  setIsPrintPanelOpen(true);
                }}
              />
            )}

            {/* Back Side Panel */}
            {isBackActive && (
              <DocumentSideWorkspace
                side="back"
                sideResult={state.back}
                sourceFile={state.source}
                docDef={currentDocDef}
                otherCrop={state.front.crop}
                otherSideTitle="Front Side Region"
                onOpenCropEditor={openCropEditor}
                onCloseCropEditor={closeCropEditor}
                onCropChange={setSideCrop}
                onRotationChange={setSideRotation}
                onZoomChange={setSideZoom}
                onAspectRatioLockedChange={setSideAspectRatioLocked}
                onApplyCrop={applyCrop}
                onAutoCrop={runAutoDetection}
                onResetCrop={resetCrop}
                onReplace={triggerBrowse}
                onToggleView={toggleSideActiveView}
                onRotateSide={rotateSide}
                onZoomSide={zoomSide}
                onDownloadSide={downloadSideCrop}
                onToggleBeforeAfter={toggleSideBeforeAfter}
                onOpenEnhancePanel={(s) => {
                  setActiveEnhanceSide(s);
                  setIsEnhancePanelOpen(true);
                }}
                onOpenPrintPanel={(s) => {
                  setActivePrintSide(s);
                  setIsPrintPanelOpen(true);
                }}
              />
            )}
          </div>

          {/* LARGE MANUAL CROP EDITOR MODAL (Single Enlarged Viewing Area) */}
          {activeCropSide && state.source.previewUrl && state.source.dimensions && (
            <DocumentCropEditor
              side={activeCropSide}
              sideTitle={activeCropSide === "front" ? "Front Side" : "Back Side"}
              previewUrl={state.source.previewUrl}
              nativeDimensions={state.source.dimensions}
              crop={
                state[activeCropSide].crop || {
                  x: 0,
                  y: 0,
                  width: state.source.dimensions.width,
                  height: state.source.dimensions.height,
                }
              }
              otherCrop={activeCropSide === "front" ? state.back.crop : state.front.crop}
              otherSideTitle={activeCropSide === "front" ? "Back Side Region" : "Front Side Region"}
              rotation={state[activeCropSide].rotation}
              zoom={state[activeCropSide].zoom}
              aspectRatioLocked={state[activeCropSide].aspectRatioLocked}
              targetAspectRatio={state[activeCropSide].targetAspectRatio}
              isLoading={state.source.isLoading}
              onApplyCrop={(appliedCrop, appliedRot) => applyCrop(activeCropSide, appliedCrop, appliedRot)}
              onClose={() => closeCropEditor(activeCropSide)}
            />
          )}
        </div>
      )}
    </div>
  );
};
