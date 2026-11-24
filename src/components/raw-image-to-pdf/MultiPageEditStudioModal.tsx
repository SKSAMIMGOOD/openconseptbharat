/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileImage,
  Layers,
  Sparkles,
  Sliders,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type {
  RawDocumentPage,
  AnnotationStroke,
  AnnotationToolType,
  DocumentEnhancementSettings,
  ColorFilterSettings,
  WatermarkConfig,
} from "@/types/raw-image-to-pdf";
import { DocumentAnnotationCanvas } from "./DocumentAnnotationCanvas";
import { DocumentEditToolbar } from "./DocumentEditToolbar";

export interface MultiPageEditStudioModalProps {
  isOpen: boolean;
  pages: RawDocumentPage[];
  currentPageIndex: number;
  onSelectPage: (index: number) => void;
  // Global Enhancements
  globalEnhancements: DocumentEnhancementSettings;
  onUpdateEnhancement: <K extends keyof DocumentEnhancementSettings>(
    key: K,
    val: DocumentEnhancementSettings[K]
  ) => void;
  onResetEnhancements: () => void;
  // Global Color Filter
  globalColorFilter: ColorFilterSettings;
  onUpdateColorFilter: (filter: ColorFilterSettings) => void;
  onResetColorFilter: () => void;
  // Page Annotations & Watermark
  onAddStroke: (pageId: string, stroke: AnnotationStroke) => void;
  onUndoStroke: (pageId: string) => void;
  onRedoStroke: (pageId: string) => void;
  onClearStrokes: (pageId: string) => void;
  onSetWatermark: (pageId: string, watermark: WatermarkConfig | null) => void;
  // Per-page opt-out for global edits
  onToggleApplyGlobalEdits?: (pageId: string, val?: boolean) => void;
  onClose: () => void;
}

export const MultiPageEditStudioModal: React.FC<MultiPageEditStudioModalProps> = ({
  isOpen,
  pages,
  currentPageIndex,
  onSelectPage,
  globalEnhancements,
  onUpdateEnhancement,
  onResetEnhancements,
  globalColorFilter,
  onUpdateColorFilter,
  onResetColorFilter,
  onAddStroke,
  onUndoStroke,
  onRedoStroke,
  onClearStrokes,
  onSetWatermark,
  onToggleApplyGlobalEdits,
  onClose,
}) => {
  const currentPage = pages[currentPageIndex] || null;
  const totalPages = pages.length;

  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === totalPages - 1;

  // Active Tool State
  const [activeTool, setActiveTool] = useState<AnnotationToolType>("select");

  // Eraser Settings
  const [eraserSize, setEraserSize] = useState<number>(24);
  const [eraserColor, setEraserColor] = useState<string>("#ffffff");

  // Highlighter Settings
  const [highlighterSize, setHighlighterSize] = useState<number>(28);
  const [highlighterColor, setHighlighterColor] = useState<string>("#fef08a");
  const [highlighterOpacity, setHighlighterOpacity] = useState<number>(0.4);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (!e.shiftKey && currentPage) {
          e.preventDefault();
          onUndoStroke(currentPage.id);
        } else if (e.shiftKey && currentPage) {
          e.preventDefault();
          onRedoStroke(currentPage.id);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y" && currentPage) {
        e.preventDefault();
        onRedoStroke(currentPage.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentPage, onClose, onUndoStroke, onRedoStroke]);

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

  if (!isOpen || !currentPage) {
    return null;
  }

  const currentStrokes = currentPage.annotations || [];
  const currentUndoStack = currentPage.undoStack || [];
  const canUndo = currentStrokes.length > 0;
  const canRedo = currentUndoStack.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-6xl h-[94vh] max-h-[920px] bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        {/* Top Header: Title, Page Carousel, Page Nav, Done */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Document Studio & Annotations
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Page {currentPageIndex + 1} of {totalPages}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                {currentPage.name}
              </p>
            </div>
          </div>

          {/* Page Carousel / Thumbnail Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-thin">
            {pages.map((p, idx) => {
              const isActive = idx === currentPageIndex;
              const hasEdits =
                (p.annotations && p.annotations.length > 0) || (p.watermark && p.watermark.enabled);

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPage(idx)}
                  className={cn(
                    "relative group flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium transition-all shrink-0",
                    isActive
                      ? "bg-blue-600/30 border-blue-500 text-white shadow-xs ring-1 ring-blue-500/40"
                      : "bg-slate-850 hover:bg-slate-800 border-slate-700/80 text-slate-400 hover:text-slate-200"
                  )}
                  title={`Edit Page ${idx + 1}: ${p.name}`}
                >
                  <div className="w-5 h-6 bg-slate-900 rounded overflow-hidden flex items-center justify-center shrink-0">
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

                  <span>P{idx + 1}</span>

                  {hasEdits && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Navigation Controls & Close Button */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={isFirstPage}
              className={cn(
                "p-1.5 rounded-lg border text-slate-300 transition-colors",
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
                "p-1.5 rounded-lg border text-slate-300 transition-colors",
                isLastPage
                  ? "opacity-30 cursor-not-allowed border-slate-800 bg-slate-900"
                  : "bg-slate-850 hover:bg-slate-800 border-slate-700 hover:text-white"
              )}
              title="Next Page"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="h-4 w-[1px] bg-slate-800 mx-1" />

            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Done</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Studio (Esc)"
              aria-label="Close Studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Document Preview Stage with Drawing Canvas */}
        <div className="relative flex-1 w-full h-full overflow-hidden">
          <DocumentAnnotationCanvas
            key={currentPage.id}
            page={currentPage}
            activeTool={activeTool}
            eraserSize={eraserSize}
            eraserColor={eraserColor}
            highlighterSize={highlighterSize}
            highlighterColor={highlighterColor}
            highlighterOpacity={highlighterOpacity}
            globalEnhancements={globalEnhancements}
            globalColorFilter={globalColorFilter}
            onAddStroke={(stroke) => onAddStroke(currentPage.id, stroke)}
            onToggleApplyGlobalEdits={(val) =>
              onToggleApplyGlobalEdits?.(currentPage.id, val)
            }
          />
        </div>

        {/* Bottom Compact Editing Toolbar (Requirement 6) */}
        <DocumentEditToolbar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          globalEnhancements={globalEnhancements}
          onUpdateEnhancement={onUpdateEnhancement}
          onResetEnhancements={onResetEnhancements}
          globalColorFilter={globalColorFilter}
          onUpdateColorFilter={onUpdateColorFilter}
          onResetColorFilter={onResetColorFilter}
          applyGlobalEdits={currentPage.applyGlobalEdits ?? true}
          onToggleApplyGlobalEdits={(val) =>
            onToggleApplyGlobalEdits?.(currentPage.id, val)
          }
          eraserSize={eraserSize}
          onChangeEraserSize={setEraserSize}
          eraserColor={eraserColor}
          onChangeEraserColor={setEraserColor}
          highlighterSize={highlighterSize}
          onChangeHighlighterSize={setHighlighterSize}
          highlighterColor={highlighterColor}
          onChangeHighlighterColor={setHighlighterColor}
          highlighterOpacity={highlighterOpacity}
          onChangeHighlighterOpacity={setHighlighterOpacity}
          watermark={currentPage.watermark || null}
          onUpdateWatermark={(wm) => onSetWatermark(currentPage.id, wm)}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={() => onUndoStroke(currentPage.id)}
          onRedo={() => onRedoStroke(currentPage.id)}
          onResetPageEdits={() => {
            onClearStrokes(currentPage.id);
            onSetWatermark(currentPage.id, null);
          }}
        />
      </div>
    </div>
  );
};
