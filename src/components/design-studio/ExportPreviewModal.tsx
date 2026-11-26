"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Download,
  FileText,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Loader2,
  Layers,
  Sparkles,
} from "lucide-react";
import type { DesignDocument } from "@/types/design-studio";
import type {
  ExportFormat,
  DesignExportOptions,
  DesignExportResult,
  ExportProgressEvent,
} from "@/types/design-export";
import { EXPORT_DPI_PRESETS } from "@/types/design-export";
import { designExportManager } from "@/lib/design-studio/export/export-manager";
import { renderPageToCanvas } from "@/lib/design-studio/export/raster-adapter";
import { mmToPixels } from "@/constants/design-dimensions";
import { downloadImageBlob } from "@/lib/image/exporter";
import { releaseCanvasBuffer } from "@/lib/utils/memory";

export interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DesignDocument;
  initialFormat?: ExportFormat;
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  isOpen,
  onClose,
  document,
  initialFormat = "png",
}) => {
  const [format, setFormat] = useState<ExportFormat>(initialFormat);
  const [dpi, setDpi] = useState<number>(300);
  const [quality, setQuality] = useState<number>(0.95);
  const [transparentBg, setTransparentBg] = useState<boolean>(false);
  const [backgroundColor, setBackgroundColor] = useState<string>("#ffffff");
  const [pageScope, setPageScope] = useState<"all" | string>("all");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<ExportProgressEvent | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate physical dimensions
  const isLandscape = document.orientation === "landscape";
  const widthMm = isLandscape
    ? Math.max(document.dimensions.widthMm, document.dimensions.heightMm)
    : Math.min(document.dimensions.widthMm, document.dimensions.heightMm);
  const heightMm = isLandscape
    ? Math.min(document.dimensions.widthMm, document.dimensions.heightMm)
    : Math.max(document.dimensions.widthMm, document.dimensions.heightMm);

  const widthInches = (widthMm / 25.4).toFixed(2);
  const heightInches = (heightMm / 25.4).toFixed(2);
  const widthPx = mmToPixels(widthMm, dpi);
  const heightPx = mmToPixels(heightMm, dpi);

  // Generate lightweight preview on modal open or page scope change
  useEffect(() => {
    if (!isOpen) {
      setPreviewDataUrl(null);
      return;
    }

    let active = true;
    setIsPreviewLoading(true);
    setError(null);

    const targetPage =
      pageScope === "all"
        ? document.pages[0]
        : document.pages.find((p) => p.id === pageScope) || document.pages[0];

    // Quick draft render at 96 DPI for preview
    renderPageToCanvas(document, targetPage, 96, {
      transparentBackground: format === "png" && transparentBg,
      backgroundColor: format === "jpeg" ? backgroundColor : undefined,
    })
      .then((canvas) => {
        if (!active) {
          releaseCanvasBuffer(canvas);
          return;
        }
        const dataUrl = canvas.toDataURL("image/png");
        setPreviewDataUrl(dataUrl);
        releaseCanvasBuffer(canvas);
      })
      .catch((err) => {
        if (active) setError("Could not render preview: " + err.message);
      })
      .finally(() => {
        if (active) setIsPreviewLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, pageScope, format, transparentBg, backgroundColor, document]);

  // Handle Download Action
  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);

      const options: DesignExportOptions = {
        format,
        dpi,
        quality,
        transparentBackground: format === "png" && transparentBg,
        backgroundColor: format === "jpeg" ? backgroundColor : undefined,
        pageScope,
        baseFileName: document.metadata.title,
      };

      const result = await designExportManager.export(document, options, (event) => {
        setProgress(event);
      });

      // Trigger browser downloads for exported items
      for (const item of result.items) {
        downloadImageBlob(item.blob, item.fileName);
      }

      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to export document.");
    } finally {
      setIsExporting(false);
      setProgress(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 id="export-modal-title" className="text-lg font-bold text-surface-900 dark:text-surface-100">
                Export Design
              </h2>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                {document.metadata.title || "Untitled Design"} • {document.category}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="p-2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            aria-label="Close export modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split View */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-y-auto divide-y md:divide-y-0 md:divide-x divide-surface-200 dark:divide-surface-800">
          {/* Left Column: Visual Preview & Dimension Stats */}
          <div className="p-6 flex flex-col justify-between bg-surface-50/50 dark:bg-surface-950/30">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
                  Visual Output Preview
                </span>
                <span className="text-xs font-medium text-surface-500 bg-surface-200/60 dark:bg-surface-800 px-2 py-0.5 rounded-full">
                  {pageScope === "all" ? `${document.pages.length} Pages` : "Selected Page"}
                </span>
              </div>

              {/* Canvas Preview Container */}
              <div className="relative aspect-[4/3] bg-surface-200/50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-700/60 overflow-hidden flex items-center justify-center p-3 shadow-inner">
                {isPreviewLoading ? (
                  <div className="flex flex-col items-center gap-2 text-surface-400">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                    <span className="text-xs">Rendering preview...</span>
                  </div>
                ) : previewDataUrl ? (
                  <img
                    src={previewDataUrl}
                    alt="Export preview"
                    className="max-h-full max-w-full object-contain shadow-md rounded border border-surface-300 dark:border-surface-700"
                  />
                ) : (
                  <div className="text-xs text-surface-400">Preview not available</div>
                )}
              </div>

              {/* Physical Dimension Indicators */}
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="p-2.5 rounded-lg bg-surface-0 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700">
                  <div className="text-[10px] uppercase font-bold text-surface-400">Millimeters</div>
                  <div className="text-xs font-semibold text-surface-800 dark:text-surface-200 mt-0.5">
                    {widthMm} × {heightMm} mm
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-0 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700">
                  <div className="text-[10px] uppercase font-bold text-surface-400">Inches</div>
                  <div className="text-xs font-semibold text-surface-800 dark:text-surface-200 mt-0.5">
                    {widthInches}″ × {heightInches}″
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-0 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700">
                  <div className="text-[10px] uppercase font-bold text-surface-400">Pixels ({dpi} DPI)</div>
                  <div className="text-xs font-semibold text-surface-800 dark:text-surface-200 mt-0.5">
                    {widthPx} × {heightPx} px
                  </div>
                </div>
              </div>
            </div>

            {/* Print Note */}
            <div className="mt-4 p-3 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800/50 flex items-start gap-2.5 text-xs text-primary-800 dark:text-primary-300">
              <Sparkles className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
              <span>
                {format === "pdf"
                  ? "Exports print-ready multi-page PDF preserving true vector text, shapes, and embedded assets."
                  : `High-resolution ${format.toUpperCase()} export rendered strictly at ${dpi} DPI.`}
              </span>
            </div>
          </div>

          {/* Right Column: Settings & Configuration */}
          <div className="p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Format Selection */}
              <div>
                <label className="block text-xs font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-2">
                  1. Choose Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat("png")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      format === "png"
                        ? "bg-primary-500 text-white border-primary-600 shadow-md shadow-primary-500/20"
                        : "bg-surface-0 dark:bg-surface-800 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-750"
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>PNG</span>
                    <span className="text-[10px] opacity-75 font-normal">Lossless</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat("jpeg")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      format === "jpeg"
                        ? "bg-primary-500 text-white border-primary-600 shadow-md shadow-primary-500/20"
                        : "bg-surface-0 dark:bg-surface-800 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-750"
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>JPG</span>
                    <span className="text-[10px] opacity-75 font-normal">Compact</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat("pdf")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      format === "pdf"
                        ? "bg-primary-500 text-white border-primary-600 shadow-md shadow-primary-500/20"
                        : "bg-surface-0 dark:bg-surface-800 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-750"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>PDF</span>
                    <span className="text-[10px] opacity-75 font-normal">Vector Print</span>
                  </button>
                </div>
              </div>

              {/* Page Scope Selection */}
              <div>
                <label className="block text-xs font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-2">
                  2. Pages to Export
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPageScope("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      pageScope === "all"
                        ? "bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border-primary-400 dark:border-primary-700"
                        : "bg-surface-0 dark:bg-surface-800 text-surface-600 dark:text-surface-400 border-surface-200 dark:border-surface-700"
                    }`}
                  >
                    All Pages ({document.pages.length})
                  </button>
                  {document.pages.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPageScope(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        pageScope === p.id
                          ? "bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border-primary-400 dark:border-primary-700"
                          : "bg-surface-0 dark:bg-surface-800 text-surface-600 dark:text-surface-400 border-surface-200 dark:border-surface-700"
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution / DPI Options (For raster or rendering scale) */}
              <div>
                <label className="block text-xs font-bold text-surface-700 dark:text-surface-300 uppercase tracking-wider mb-2">
                  3. Resolution & Quality
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {EXPORT_DPI_PRESETS.map((preset) => (
                    <button
                      key={preset.dpi}
                      type="button"
                      onClick={() => setDpi(preset.dpi)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-colors ${
                        dpi === preset.dpi
                          ? "bg-primary-50 dark:bg-primary-950/40 border-primary-500 text-primary-700 dark:text-primary-300"
                          : "bg-surface-0 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400"
                      }`}
                    >
                      <div>{preset.label}</div>
                      <div className="text-[10px] text-surface-400 font-mono mt-0.5">
                        {mmToPixels(widthMm, preset.dpi)} × {mmToPixels(heightMm, preset.dpi)} px
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Format Specific Options */}
              {format === "png" && (
                <div className="pt-2 border-t border-surface-200 dark:border-surface-800">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-surface-700 dark:text-surface-300">
                    <input
                      type="checkbox"
                      checked={transparentBg}
                      onChange={(e) => setTransparentBg(e.target.checked)}
                      className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>Transparent background (exclude backdrop color)</span>
                  </label>
                </div>
              )}

              {format === "jpeg" && (
                <div className="pt-2 border-t border-surface-200 dark:border-surface-800 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-surface-600 dark:text-surface-400 mb-1">
                      JPEG Quality: {Math.round(quality * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.05"
                      value={quality}
                      onChange={(e) => setQuality(parseFloat(e.target.value))}
                      className="w-full accent-primary-600 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-surface-600 dark:text-surface-400">
                      Flatten Color:
                    </label>
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-7 h-7 rounded border border-surface-300 cursor-pointer p-0"
                    />
                    <span className="text-xs font-mono text-surface-500">{backgroundColor}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Progress Message */}
            {isExporting && progress && (
              <div className="p-3 bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 rounded-xl flex items-center gap-2 text-xs text-primary-700 dark:text-primary-300">
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-primary-500" />
                <span>{progress.message}</span>
              </div>
            )}

            {/* Action Footer */}
            <div className="pt-4 border-t border-surface-200 dark:border-surface-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isExporting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                data-testid="confirm-export-btn"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-md shadow-primary-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download {format.toUpperCase()}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
