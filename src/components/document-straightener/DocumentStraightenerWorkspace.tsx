/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useRef, useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  UploadCloud,
  RefreshCw,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Crop as CropIcon,
  SlidersHorizontal,
  Printer,
  CheckCircle2,
  FileCheck,
  FileImage,
  ArrowRight,
  Plus,
  Sliders,
  Download,
  Eye,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useDocumentStraightener, DOCUMENT_STRAIGHTENER_DEF } from "@/hooks/useDocumentStraightener";
import { PerspectiveCropEditor } from "./PerspectiveCropEditor";
import { DocumentEnhancementPanel } from "@/components/document-studio/DocumentEnhancementPanel";
import { DocumentPrintSettingsPanel } from "@/components/document-studio/DocumentPrintSettingsPanel";
import { DocumentPrintStudio } from "@/components/document-studio/DocumentPrintStudio";
import { downloadPngBlob } from "@/lib/document/document-print-pdf";
import type { DocumentSide } from "@/types/document-studio";

export const DocumentStraightenerWorkspace: React.FC = () => {
  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);

  const [activeEnhanceSide, setActiveEnhanceSide] = useState<DocumentSide>("front");
  const [isEnhancePanelOpen, setIsEnhancePanelOpen] = useState(false);
  const [activePrintSide, setActivePrintSide] = useState<DocumentSide>("front");
  const [isPrintPanelOpen, setIsPrintPanelOpen] = useState(false);

  const [showingBeforeAfter, setShowingBeforeAfter] = useState<{
    front: boolean;
    back: boolean;
  }>({ front: false, back: false });

  const {
    front,
    back,
    frontSideResult,
    backSideResult,
    activeCropSide,
    showBackPrompt,
    printStudioState,
    isProcessing,
    statusMessage,
    hasAnyPhoto,
    isFrontDone,
    isBackDone,
    isSingleSided,
    uploadSidePhoto,
    confirmSideCrop,
    reopenCropEditor,
    cancelCropEditor,
    skipBackSide,
    setSideEnhancement,
    resetSideEnhancements,
    setSidePrintSettings,
    setPrintStudioMode,
    setPrintStudioArrangement,
    setPrintLayoutSettings,
    clearAll,
  } = useDocumentStraightener();

  // File Upload Handlers
  const handleFrontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadSidePhoto("front", file);
    }
    e.target.value = "";
  };

  const handleBackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadSidePhoto("back", file);
    }
    e.target.value = "";
  };

  // Toggle Before/After for enhancements
  const handleToggleBeforeAfter = (side: DocumentSide) => {
    setShowingBeforeAfter((prev) => ({
      ...prev,
      [side]: !prev[side],
    }));
  };

  // Download individual side image
  const handleDownloadSide = (side: "front" | "back") => {
    const sideState = side === "front" ? front : back;
    const blob = sideState.enhancedBlob || sideState.straightenedBlob;
    if (blob) {
      downloadPngBlob(blob, `straightened-document-${side}.png`);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Header & Privacy Banner */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                <Maximize2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100 tracking-tight flex items-center gap-2">
                  Document Straightener
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Perspective Correction
                  </span>
                </h1>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                  Convert crooked, perspective-distorted WhatsApp & mobile photos into clean, straight rectangular documents.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero-Upload In-Memory Warping</span>
            </div>

            {hasAnyPhoto && (
              <button
                type="button"
                onClick={clearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors border border-rose-200 dark:border-rose-900/60"
                title="Clear all photos and start over"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Start Over</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={frontFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFrontFileChange}
        className="hidden"
      />
      <input
        ref={backFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleBackFileChange}
        className="hidden"
      />

      {/* 2. Modal Perspective Crop Editor */}
      {activeCropSide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-surface-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-5xl">
            <PerspectiveCropEditor
              side={activeCropSide}
              sideTitle={activeCropSide === "front" ? "Front Side Document" : "Back Side Document"}
              previewUrl={
                (activeCropSide === "front" ? front.previewUrl : back.previewUrl) || ""
              }
              initialQuad={activeCropSide === "front" ? front.quad : back.quad}
              initialRotation={
                activeCropSide === "front" ? front.rotation : back.rotation
              }
              initialAspectRatioPreset={
                activeCropSide === "front"
                  ? front.aspectRatioPreset
                  : back.aspectRatioPreset
              }
              isLoading={isProcessing}
              onConfirm={({ quad, rotation, aspectRatioPreset }) => {
                confirmSideCrop(activeCropSide, quad, rotation, aspectRatioPreset);
              }}
              onCancel={cancelCropEditor}
            />
          </div>
        </div>
      )}

      {/* 3. Initial Upload Dropzone View (when Front Side not yet confirmed) */}
      {!isFrontDone && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Front Side Upload Box */}
          <div
            onClick={() => frontFileInputRef.current?.click()}
            className="group relative cursor-pointer flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl border-2 border-dashed border-surface-300 dark:border-surface-700 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-surface-900 transition-all text-center shadow-xs"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-blue-200 dark:border-blue-800">
              <UploadCloud className="w-7 h-7" />
            </div>

            <h3 className="font-bold text-base text-surface-900 dark:text-surface-100">
              Upload Front Side Photograph
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400 max-w-xs mt-1.5 leading-relaxed">
              Select or drop a photo of the document front side. Tilted or crooked photos supported.
            </p>

            <span className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-all">
              <span>Choose Front Photo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Back Side Placeholder Box */}
          <div
            onClick={() => {
              if (!isFrontDone) {
                // Remind user to upload front first
                frontFileInputRef.current?.click();
              } else {
                backFileInputRef.current?.click();
              }
            }}
            className="flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl border-2 border-dashed border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50 text-center opacity-85 hover:opacity-100 transition-opacity cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-400 flex items-center justify-center mb-4 border border-surface-200 dark:border-surface-700">
              <FileImage className="w-7 h-7" />
            </div>

            <h3 className="font-bold text-base text-surface-700 dark:text-surface-300">
              Back Side Photograph (Optional)
            </h3>
            <p className="text-xs text-surface-400 dark:text-surface-500 max-w-xs mt-1.5 leading-relaxed">
              You can upload the back side after straightening the front side, or skip it for single-sided documents.
            </p>

            <span className="mt-5 inline-flex items-center gap-1.5 text-xs text-surface-500 font-medium">
              <span>Step 2 after Front Side</span>
            </span>
          </div>
        </div>
      )}

      {/* 4. Guidance Banner after Front Confirmation (Prompt to Add Back Side or Skip) */}
      {isFrontDone && showBackPrompt && (
        <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 shadow-sm animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-blue-950 dark:text-blue-100">
                  Front side straightened successfully!
                </h4>
                <p className="text-xs text-blue-800 dark:text-blue-300 mt-0.5">
                  Does this document have a back side to straighten? Upload the back photograph or proceed with front side only.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={skipBackSide}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-300 dark:border-blue-700"
              >
                Skip Back Side (Single-Sided)
              </button>
              <button
                type="button"
                onClick={() => backFileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Back Side</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Processed Previews View (Front and Back side cards) */}
      {isFrontDone && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Front Side Card */}
            <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden shadow-sm flex flex-col">
              <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between bg-surface-50/70 dark:bg-surface-800/40">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-surface-900 dark:text-surface-100">
                    Front Side
                  </span>
                  {front.straightenedDimensions && (
                    <span className="text-[11px] font-mono text-surface-500 dark:text-surface-400">
                      {front.straightenedDimensions.width} × {front.straightenedDimensions.height} px
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => reopenCropEditor("front")}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-200/60 dark:hover:bg-surface-700 transition-colors border border-surface-200 dark:border-surface-700"
                    title="Fine-tune the 4 corners for Front side"
                  >
                    <CropIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>Adjust Corners</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => frontFileInputRef.current?.click()}
                    className="p-1 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    title="Replace Front photo"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Image Preview Container */}
              <div className="relative flex-1 p-4 bg-surface-100/60 dark:bg-surface-950/60 flex items-center justify-center min-h-[260px]">
                {front.enhancedPreviewUrl || front.straightenedUrl ? (
                  <img
                    src={
                      showingBeforeAfter.front
                        ? front.straightenedUrl || ""
                        : front.enhancedPreviewUrl || front.straightenedUrl || ""
                    }
                    alt="Straightened Front Side"
                    className="max-h-[300px] w-auto max-w-full rounded-lg shadow-sm border border-surface-200 dark:border-surface-800 object-contain"
                  />
                ) : null}
              </div>

              <div className="p-3 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between text-xs">
                <span className="text-surface-500">
                  {showingBeforeAfter.front ? "Original Warped" : "Enhanced Result"}
                </span>

                <button
                  type="button"
                  onClick={() => handleDownloadSide("front")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Image</span>
                </button>
              </div>
            </div>

            {/* Back Side Card */}
            {isBackDone ? (
              <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 overflow-hidden shadow-sm flex flex-col">
                <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between bg-surface-50/70 dark:bg-surface-800/40">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-surface-900 dark:text-surface-100">
                      Back Side
                    </span>
                    {back.straightenedDimensions && (
                      <span className="text-[11px] font-mono text-surface-500 dark:text-surface-400">
                        {back.straightenedDimensions.width} × {back.straightenedDimensions.height} px
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => reopenCropEditor("back")}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-200/60 dark:hover:bg-surface-700 transition-colors border border-surface-200 dark:border-surface-700"
                      title="Fine-tune the 4 corners for Back side"
                    >
                      <CropIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Adjust Corners</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => backFileInputRef.current?.click()}
                      className="p-1 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                      title="Replace Back photo"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Image Preview Container */}
                <div className="relative flex-1 p-4 bg-surface-100/60 dark:bg-surface-950/60 flex items-center justify-center min-h-[260px]">
                  {back.enhancedPreviewUrl || back.straightenedUrl ? (
                    <img
                      src={
                        showingBeforeAfter.back
                          ? back.straightenedUrl || ""
                          : back.enhancedPreviewUrl || back.straightenedUrl || ""
                      }
                      alt="Straightened Back Side"
                      className="max-h-[300px] w-auto max-w-full rounded-lg shadow-sm border border-surface-200 dark:border-surface-800 object-contain"
                    />
                  ) : null}
                </div>

                <div className="p-3 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between text-xs">
                  <span className="text-surface-500">
                    {showingBeforeAfter.back ? "Original Warped" : "Enhanced Result"}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDownloadSide("back")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Image</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Add Back Side Option Card */
              <div
                onClick={() => backFileInputRef.current?.click()}
                className="group relative cursor-pointer flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-surface-300 dark:border-surface-700 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-surface-900 transition-all text-center min-h-[300px]"
              >
                <div className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-surface-200 dark:border-surface-700">
                  <Plus className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-surface-900 dark:text-surface-100">
                  Add Back Side Photograph
                </h4>
                <p className="text-xs text-surface-500 dark:text-surface-400 max-w-xs mt-1">
                  Upload the reverse side of this document to combine both sides into a single sheet or export.
                </p>
                <span className="mt-4 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800">
                  Select Back Photo
                </span>
              </div>
            )}
          </div>

          {/* 6. Document Enhancement Controls Panel */}
          <DocumentEnhancementPanel
            frontEnhancements={front.enhancements}
            backEnhancements={back.enhancements}
            isDualSide={isBackDone}
            activeSide={activeEnhanceSide}
            onSelectSide={setActiveEnhanceSide}
            onChangeEnhancement={(side, key, value) => {
              setSideEnhancement(side, key, value);
            }}
            onResetEnhancements={(side) => {
              resetSideEnhancements(side);
            }}
            onToggleBeforeAfter={handleToggleBeforeAfter}
            showingBeforeAfter={showingBeforeAfter}
            isOpen={isEnhancePanelOpen}
            onToggleOpen={() => setIsEnhancePanelOpen(!isEnhancePanelOpen)}
          />

          {/* 7. Document Print Settings & Physical Dimensions Panel */}
          <DocumentPrintSettingsPanel
            frontSettings={front.printSettings}
            backSettings={back.printSettings}
            frontDimensions={front.straightenedDimensions}
            backDimensions={back.straightenedDimensions}
            isDualSide={isBackDone}
            activeSide={activePrintSide}
            onSelectSide={setActivePrintSide}
            onChangeSettings={(side, updates) => {
              setSidePrintSettings(side, updates);
            }}
            onApplyToBoth={(updates) => {
              setSidePrintSettings("front", updates);
              if (isBackDone) setSidePrintSettings("back", updates);
            }}
            isOpen={isPrintPanelOpen}
            onToggleOpen={() => setIsPrintPanelOpen(!isPrintPanelOpen)}
          />

          {/* 8. Full Document Print Studio (A4/A5/4x6 Layout, Borders, PDF/PNG Export) */}
          <DocumentPrintStudio
            state={printStudioState}
            front={frontSideResult}
            back={backSideResult}
            docDef={DOCUMENT_STRAIGHTENER_DEF}
            isSingleSided={!isBackDone}
            isFrontActive={true}
            isBackActive={isBackDone}
            onModeChange={setPrintStudioMode}
            onArrangementChange={setPrintStudioArrangement}
            onLayoutChange={setPrintLayoutSettings}
          />
        </div>
      )}
    </div>
  );
};
