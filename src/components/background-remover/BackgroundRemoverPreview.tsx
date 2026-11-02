"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Sliders,
  Columns,
  Eye,
  ImageIcon,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import {
  BeforeAfterViewMode,
  BackgroundColorOption,
} from "@/types/background-remover";
import { cn } from "@/lib/utils/cn";

export interface BackgroundRemoverPreviewProps {
  originalUrl: string | null;
  compositeCanvas: HTMLCanvasElement | null;
  dimensions: { width: number; height: number; aspectRatio: number } | null;
  viewMode: BeforeAfterViewMode;
  sliderPosition: number;
  zoom: number;
  pan: { x: number; y: number };
  selectedBackground: BackgroundColorOption;
  customHex: string;
  hasResult: boolean;
  isInferring: boolean;
  onViewModeChange: (mode: BeforeAfterViewMode) => void;
  onSliderPositionChange: (pos: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToScreen: () => void;
  onPanChange: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
}

export const BackgroundRemoverPreview: React.FC<BackgroundRemoverPreviewProps> = ({
  originalUrl,
  compositeCanvas,
  dimensions,
  viewMode,
  sliderPosition,
  zoom,
  pan,
  selectedBackground,
  customHex,
  hasResult,
  isInferring,
  onViewModeChange,
  onSliderPositionChange,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToScreen,
  onPanChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingSliderRef = useRef(false);
  const isPanningRef = useRef(false);
  const lastPanPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState<string | null>(null);

  // Generate data URL from composite canvas whenever it changes
  useEffect(() => {
    if (!compositeCanvas || compositeCanvas.width <= 0 || compositeCanvas.height <= 0) {
      setProcessedImageUrl(null);
      return;
    }
    try {
      const dataUrl = compositeCanvas.toDataURL("image/png");
      setProcessedImageUrl(dataUrl);
      setImageLoadError(null);
    } catch (err) {
      console.error("Failed to generate processed image data URL:", err);
      setImageLoadError("Failed to extract preview cutout buffer.");
    }
  }, [compositeCanvas]);

  useEffect(() => {
    setImageLoadError(null);
  }, [originalUrl]);

  // Handle slider dragging (mouse & touch)
  const handleSliderPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingSliderRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleSliderPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingSliderRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX;
      const x = clientX - rect.left;
      const newPos = Math.max(0, Math.min(100, (x / rect.width) * 100));
      onSliderPositionChange(Number(newPos.toFixed(1)));
    },
    [onSliderPositionChange]
  );

  const handleSliderPointerUp = (e: React.PointerEvent) => {
    if (isDraggingSliderRef.current) {
      isDraggingSliderRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Handle pan dragging when zoomed in
  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (isDraggingSliderRef.current) return;
    if (zoom > 1.0) {
      isPanningRef.current = true;
      lastPanPointRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (!isPanningRef.current) return;
    const dx = e.clientX - lastPanPointRef.current.x;
    const dy = e.clientY - lastPanPointRef.current.y;
    lastPanPointRef.current = { x: e.clientX, y: e.clientY };

    onPanChange((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  };

  const handleContainerMouseUp = () => {
    isPanningRef.current = false;
  };

  return (
    <div className="bg-white rounded-2xl border border-surface-200 shadow-card overflow-hidden flex flex-col">
      {/* Viewport Control Bar */}
      <div className="p-3.5 sm:p-4 border-b border-surface-200 flex flex-wrap items-center justify-between gap-3 bg-surface-50/50">
        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => onViewModeChange("split_slider")}
            className={cn(
              "px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
              viewMode === "split_slider"
                ? "bg-white text-surface-900 shadow-xs"
                : "text-surface-600 hover:text-surface-900"
            )}
            title="Before / After interactive split slider"
          >
            <Sliders className="w-3.5 h-3.5 text-brand-600" />
            <span className="hidden sm:inline">Split Slider</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange("side_by_side")}
            className={cn(
              "px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
              viewMode === "side_by_side"
                ? "bg-white text-surface-900 shadow-xs"
                : "text-surface-600 hover:text-surface-900"
            )}
            title="Side-by-side original and processed"
          >
            <Columns className="w-3.5 h-3.5 text-brand-600" />
            <span className="hidden sm:inline">Side by Side</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange("processed_only")}
            className={cn(
              "px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
              viewMode === "processed_only"
                ? "bg-white text-surface-900 shadow-xs"
                : "text-surface-600 hover:text-surface-900"
            )}
            title="View processed cutout only"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span className="hidden sm:inline">Processed</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange("original_only")}
            className={cn(
              "px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
              viewMode === "original_only"
                ? "bg-white text-surface-900 shadow-xs"
                : "text-surface-600 hover:text-surface-900"
            )}
            title="View original image only"
          >
            <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
            <span className="hidden sm:inline">Original</span>
          </button>
        </div>

        {/* Zoom & Pan Controls */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono font-semibold text-surface-600 px-2 py-1 bg-surface-100 rounded-lg">
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            onClick={onZoomOut}
            className="p-1.5 rounded-lg text-surface-700 hover:bg-surface-200 transition-colors"
            title="Zoom Out (-25%)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onZoomIn}
            className="p-1.5 rounded-lg text-surface-700 hover:bg-surface-200 transition-colors"
            title="Zoom In (+25%)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onFitToScreen}
            className="p-1.5 rounded-lg text-surface-700 hover:bg-surface-200 transition-colors"
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onResetZoom}
            className="p-1.5 rounded-lg text-surface-700 hover:bg-surface-200 transition-colors"
            title="Reset Zoom & Position"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Viewport Stage */}
      <div
        ref={containerRef}
        onMouseDown={handleContainerMouseDown}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleContainerMouseUp}
        onPointerMove={handleSliderPointerMove}
        className={cn(
          "relative w-full h-[360px] sm:h-[480px] lg:h-[540px] overflow-hidden select-none flex items-center justify-center",
          // Checkerboard transparency pattern
          "bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] [background-size:20px_20px] [background-position:0_0,0_10px,10px_-10px,-10px_0px]",
          zoom > 1.0 ? "cursor-grab active:cursor-grabbing" : "cursor-default"
        )}
      >
        {!originalUrl ? (
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm">
            <div className="w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-sm border border-surface-200 flex items-center justify-center text-surface-400 mb-3 shadow-sm">
              <ImageIcon className="w-7 h-7 text-brand-600" />
            </div>
            <h4 className="text-sm font-bold text-surface-800 mb-1">
              No Image Loaded
            </h4>
            <p className="text-xs text-surface-500 leading-relaxed">
              Upload a portrait, product, or ID photo above to isolate foreground subjects with local AI.
            </p>
          </div>
        ) : (
          <div
            className="relative transition-transform duration-75 origin-center max-w-full max-h-full flex items-center justify-center p-2 sm:p-4"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            }}
          >
            {/* Case 1: Split Slider View (Active when Result exists) */}
            {viewMode === "split_slider" && hasResult && processedImageUrl && (
              <div className="relative max-w-full max-h-[340px] sm:max-h-[440px] lg:max-h-[480px] rounded-lg overflow-hidden shadow-md flex items-center justify-center">
                {/* Background Image: Original */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalUrl}
                  alt="Original photo"
                  onError={() => setImageLoadError("Original photo preview failed to load.")}
                  className="max-h-[340px] sm:max-h-[440px] lg:max-h-[480px] w-auto max-w-full object-contain block pointer-events-none select-none"
                />

                {/* Foreground Image: Processed Cutout with clip-path */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none select-none"
                  style={{
                    clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={processedImageUrl}
                    alt="Processed cutout"
                    onError={() => setImageLoadError("Processed cutout preview failed to load.")}
                    className="max-h-[340px] sm:max-h-[440px] lg:max-h-[480px] w-full h-full object-contain block pointer-events-none select-none"
                  />
                </div>

                {/* Draggable Divider Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.4)] z-20 cursor-ew-resize flex items-center justify-center pointer-events-auto"
                  style={{ left: `${sliderPosition}%` }}
                  onPointerDown={handleSliderPointerDown}
                  onPointerUp={handleSliderPointerUp}
                >
                  {/* Handle Knob */}
                  <div className="w-8 h-8 rounded-full bg-white text-surface-800 shadow-lg border border-surface-300 flex items-center justify-center gap-0.5 text-xs">
                    <ChevronLeft className="w-3.5 h-3.5 text-surface-600 -mr-1" />
                    <ChevronRight className="w-3.5 h-3.5 text-surface-600" />
                  </div>
                </div>

                {/* Floating Before / After Badges */}
                <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold z-10 pointer-events-none">
                  Original (Before)
                </div>
                <div className="absolute top-3 right-3 px-2 py-1 rounded bg-brand-600/90 backdrop-blur-xs text-white text-[10px] font-bold z-10 flex items-center gap-1 pointer-events-none">
                  <Sparkles className="w-3 h-3" />
                  AI Cutout (After)
                </div>
              </div>
            )}

            {/* Case 2: Side by Side View */}
            {viewMode === "side_by_side" && (
              <div className="flex items-center gap-3 sm:gap-4 max-w-full max-h-[480px] p-2">
                {/* Left: Original */}
                <div className="relative rounded-lg overflow-hidden border border-surface-200/80 shadow-sm bg-white/40">
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold z-10 pointer-events-none">
                    Original
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={originalUrl}
                    alt="Original"
                    onError={() => setImageLoadError("Original photo preview failed to load.")}
                    className="max-h-[300px] sm:max-h-[400px] max-w-[42vw] lg:max-w-[280px] w-auto object-contain block"
                  />
                </div>

                {/* Right: Processed */}
                <div className="relative rounded-lg overflow-hidden border border-surface-200/80 shadow-sm bg-white/40">
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-brand-600 text-white text-[10px] font-bold z-10 flex items-center gap-1 pointer-events-none">
                    <Sparkles className="w-3 h-3" />
                    Processed
                  </div>
                  {processedImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={processedImageUrl}
                      alt="Processed"
                      onError={() => setImageLoadError("Processed cutout preview failed to load.")}
                      className="max-h-[300px] sm:max-h-[400px] max-w-[42vw] lg:max-w-[280px] w-auto object-contain block"
                    />
                  ) : (
                    <div className="w-36 h-36 sm:w-48 sm:h-48 flex items-center justify-center text-xs text-surface-500 font-medium">
                      Run AI to see cutout
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Case 3: Processed Only View */}
            {viewMode === "processed_only" && (
              <div className="relative max-w-full max-h-[340px] sm:max-h-[440px] lg:max-h-[480px]">
                {processedImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={processedImageUrl}
                    alt="Processed cutout"
                    onError={() => setImageLoadError("Processed cutout preview failed to load.")}
                    className="max-h-[340px] sm:max-h-[440px] lg:max-h-[480px] max-w-full w-auto object-contain rounded-lg shadow-md block"
                  />
                ) : (
                  <div className="p-8 bg-white/80 backdrop-blur-sm rounded-xl text-center">
                    <Sparkles className="w-8 h-8 text-brand-600 mx-auto mb-2 animate-pulse" />
                    <p className="text-xs font-bold text-surface-900">
                      Background not removed yet
                    </p>
                    <p className="text-[11px] text-surface-500 mt-1">
                      Click &quot;Remove Background with AI&quot; in the sidebar
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Case 4: Original Only View or fallback if no result yet in split mode */}
            {(viewMode === "original_only" || (viewMode === "split_slider" && !hasResult)) && (
              <div className="relative max-w-full max-h-[340px] sm:max-h-[440px] lg:max-h-[480px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalUrl}
                  alt="Original"
                  onError={() => setImageLoadError("Original photo preview failed to load.")}
                  className="max-h-[340px] sm:max-h-[440px] lg:max-h-[480px] max-w-full w-auto object-contain rounded-lg shadow-md block"
                />
                {!hasResult && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-surface-900/80 backdrop-blur-sm text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg pointer-events-none">
                    <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                    <span>Click &quot;Remove Background with AI&quot; to begin</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Live Error Alert Overlay inside preview viewport if image loading fails */}
        {imageLoadError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold shadow-md flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{imageLoadError}</span>
          </div>
        )}

        {/* Floating Technical Metadata HUD */}
        {dimensions && (
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-surface-200/80 shadow-sm text-[11px] font-mono text-surface-700 flex items-center gap-3">
            <span>
              {dimensions.width} × {dimensions.height} px
            </span>
            <span>•</span>
            <span>Ratio {dimensions.aspectRatio.toFixed(2)}:1</span>
            <span>•</span>
            <span className="font-sans font-semibold text-brand-700 capitalize">
              {selectedBackground.id === "custom" ? customHex : selectedBackground.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
