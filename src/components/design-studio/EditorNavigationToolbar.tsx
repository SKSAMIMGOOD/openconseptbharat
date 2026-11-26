"use client";

import React from "react";
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Download,
  Printer,
} from "lucide-react";

export interface EditorNavigationToolbarProps {
  /** Whether Undo is available */
  canUndo: boolean;
  /** Whether Redo is available */
  canRedo: boolean;
  /** Undo action callback */
  onUndo: () => void;
  /** Redo action callback */
  onRedo: () => void;
  /** Current zoom ratio (e.g. 1.0 = 100%) */
  zoom: number;
  /** Zoom in callback */
  onZoomIn: () => void;
  /** Zoom out callback */
  onZoomOut: () => void;
  /** Reset zoom to 100% callback */
  onZoomReset: () => void;
  /** Auto fit to workspace container callback */
  onZoomFit: () => void;
  /** Optional back to gallery callback */
  onBackToGallery?: () => void;
  /** Optional trigger export callback */
  onExport?: () => void;
  /** Optional trigger multi-copy print sheet callback */
  onPrintMultiple?: () => void;
  /** Optional title / document name */
  documentTitle?: string;
  /** Optional container class name */
  className?: string;
}

/**
 * Top navigation toolbar for Design Studio providing accessible Undo, Redo,
 * and Zoom controls with tooltips, keyboard hint badges, and disabled states.
 */
export const EditorNavigationToolbar: React.FC<EditorNavigationToolbarProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomFit,
  onBackToGallery,
  onExport,
  onPrintMultiple,
  documentTitle,
  className = "",
}) => {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div
      className={`flex items-center justify-between px-3 py-2 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 text-surface-700 dark:text-surface-200 ${className}`}
      role="toolbar"
      aria-label="Editor navigation controls"
      data-testid="editor-navigation-toolbar"
    >
      {/* Left: Back to Templates & Document Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onBackToGallery && (
          <button
            type="button"
            onClick={onBackToGallery}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200 transition-colors shadow-xs"
            title="Browse all design templates"
            data-testid="back-to-gallery-btn"
          >
            <span>← Templates</span>
          </button>
        )}
        <span className="text-xs font-semibold text-surface-900 dark:text-white truncate max-w-[160px] sm:max-w-[260px]">
          {documentTitle || "Design Studio"}
        </span>
      </div>

      {/* Center / Right: Undo / Redo & Zoom Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Undo / Redo Group */}
        <div className="flex items-center gap-1 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg p-0.5 shadow-xs">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded hover:bg-surface-100 dark:hover:bg-surface-700 active:bg-surface-200 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Undo (Ctrl+Z)"
            aria-label="Undo last change"
            data-testid="undo-btn"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Undo</span>
          </button>

          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded hover:bg-surface-100 dark:hover:bg-surface-700 active:bg-surface-200 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
            aria-label="Redo last change"
            data-testid="redo-btn"
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Redo</span>
          </button>
        </div>

        <div className="w-px h-4 bg-surface-200 dark:bg-surface-700" />

        {/* Zoom Controls Group */}
        <div className="flex items-center gap-1 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg p-0.5 shadow-xs">
          <button
            type="button"
            onClick={onZoomOut}
            disabled={zoom <= 0.2}
            className="p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-700 active:bg-surface-200 disabled:opacity-40 disabled:pointer-events-none text-surface-600 dark:text-surface-300 transition-colors"
            title="Zoom Out (Ctrl+-)"
            aria-label="Zoom out"
            data-testid="nav-zoom-out-btn"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onZoomReset}
            className="px-2 py-0.5 text-xs font-semibold text-surface-700 dark:text-surface-200 min-w-[48px] text-center hover:bg-surface-100 dark:hover:bg-surface-700 rounded transition-colors"
            title="Reset Zoom to 100%"
            aria-label="Reset zoom to 100 percent"
            data-testid="nav-zoom-percent-btn"
          >
            {zoomPercent}%
          </button>

          <button
            type="button"
            onClick={onZoomIn}
            disabled={zoom >= 4.0}
            className="p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-700 active:bg-surface-200 disabled:opacity-40 disabled:pointer-events-none text-surface-600 dark:text-surface-300 transition-colors"
            title="Zoom In (Ctrl++)"
            aria-label="Zoom in"
            data-testid="nav-zoom-in-btn"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-3.5 bg-surface-200 dark:bg-surface-700 mx-0.5" />

          <button
            type="button"
            onClick={onZoomFit}
            className="p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-700 active:bg-surface-200 text-surface-600 dark:text-surface-300 transition-colors"
            title="Fit Page to Workspace"
            aria-label="Fit page to workspace"
            data-testid="nav-zoom-fit-btn"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Buttons: Multi-Copy Print & Single Export */}
        <div className="flex items-center gap-1.5 ml-1">
          {onPrintMultiple && (
            <button
              type="button"
              onClick={onPrintMultiple}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-800 dark:text-surface-100 border border-surface-200 dark:border-surface-700 shadow-sm transition-all"
              title="Print Multiple Copies on A4 or 4x6 Sheet"
              aria-label="Print multiple copies"
              data-testid="nav-print-multiple-btn"
            >
              <Printer className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
              <span className="hidden sm:inline">Print Copies</span>
            </button>
          )}

          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-sm shadow-primary-500/20 transition-all"
              title="Export & Download Design"
              aria-label="Export design"
              data-testid="nav-export-btn"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditorNavigationToolbar;
