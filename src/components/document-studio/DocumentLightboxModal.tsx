"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Maximize2,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import type { DocumentDimensions } from "@/types/document-studio";
import { cn } from "@/lib/utils/cn";

export interface DocumentLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title: string;
  subtitle?: string;
  dimensions?: DocumentDimensions | null;
  initialRotation?: number;
}

export const DocumentLightboxModal: React.FC<DocumentLightboxModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  subtitle,
  dimensions,
  initialRotation = 0,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(initialRotation);

  // Sync initial rotation when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(initialRotation);
    }
  }, [isOpen, initialRotation]);

  // Handle ESC key and lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(3.5, Math.round((prev + 0.25) * 100) / 100));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(0.5, Math.round((prev - 0.25) * 100) / 100));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setRotation(0);
  }, []);

  const handleRotateCw = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleRotateCcw = useCallback(() => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  }, []);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-title"
      className="fixed inset-0 z-50 flex flex-col bg-surface-950/90 dark:bg-black/92 backdrop-blur-md animate-in fade-in duration-150"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 text-white shrink-0 bg-surface-950/40">
        <div className="flex items-center gap-3">
          <div>
            <h2 id="lightbox-title" className="text-sm sm:text-base font-bold tracking-tight text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-surface-400 mt-0.5">{subtitle}</p>
            )}
          </div>

          {dimensions && (
            <span className="hidden sm:inline-flex text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-surface-300">
              {dimensions.width} × {dimensions.height} px
            </span>
          )}
        </div>

        {/* Toolbar & Close Button */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="p-1.5 rounded-lg hover:bg-white/15 disabled:opacity-40 transition-colors"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="w-12 text-center font-mono font-bold text-[11px]">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 3.5}
              className="p-1.5 rounded-lg hover:bg-white/15 disabled:opacity-40 transition-colors"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Rotation Controls */}
          <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={handleRotateCcw}
              className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
              title="Rotate 90° Counterclockwise"
              aria-label="Rotate Counterclockwise"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRotateCw}
              className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
              title="Rotate 90° Clockwise"
              aria-label="Rotate Clockwise"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Reset Zoom/Rotation */}
          {(zoom !== 1 || rotation !== 0) && (
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium transition-colors hidden sm:inline-flex items-center gap-1"
              title="Reset View"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-surface-200 hover:text-white transition-colors ml-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            title="Close Lightbox (Esc)"
            aria-label="Close Lightbox"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Lightbox Viewport */}
      <div
        onClick={onClose}
        className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center cursor-zoom-out select-none"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-full max-h-full flex items-center justify-center cursor-default transition-transform duration-150"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: "center center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className="max-w-[88vw] max-h-[82vh] w-auto h-auto object-contain rounded-lg shadow-2xl border border-white/15 select-none"
            draggable={false}
          />
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="px-4 py-2 border-t border-white/10 text-center text-xs text-surface-400 shrink-0 bg-surface-950/40 flex items-center justify-center gap-3">
        <span>Click outside or press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Esc</kbd> to close</span>
        {rotation !== 0 && (
          <span>• Rotation: {rotation}°</span>
        )}
      </div>
    </div>
  );
};
