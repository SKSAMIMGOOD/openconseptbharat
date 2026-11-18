"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  X,
  Circle,
  Square,
  Move,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import type { PhotoCropShape, PhotoSizePreset } from "@/types/resume";
import {
  calculateCropTransform,
  PHOTO_SIZE_PRESETS,
  type PhotoDimensionSpec,
} from "@/lib/resume/resume-photo";

export interface PhotoCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  initialShape?: PhotoCropShape;
  initialSize?: PhotoSizePreset;
  onClose: () => void;
  onSave: (result: {
    photoUrl: string;
    rawPhotoUrl: string;
    shape: PhotoCropShape;
    size: PhotoSizePreset;
  }) => void;
}

export const PhotoCropModal: React.FC<PhotoCropModalProps> = ({
  isOpen,
  imageSrc,
  initialShape = "rectangle",
  initialSize = "standard",
  onClose,
  onSave,
}) => {
  const [mounted, setMounted] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [shape, setShape] = useState<PhotoCropShape>(
    initialShape === "circle" ? "circle" : "rectangle"
  );
  const [sizePreset, setSizePreset] = useState<PhotoSizePreset>(initialSize || "standard");
  const [naturalDim, setNaturalDim] = useState<{ width: number; height: number }>({
    width: 350,
    height: 450,
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);

  // Mark component mounted for safe SSR portal rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Synchronize initial shape and size on open
  useEffect(() => {
    if (isOpen) {
      setShape(initialShape === "circle" ? "circle" : "rectangle");
      setSizePreset(initialSize || "standard");
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, initialShape, initialSize]);

  // Load natural dimensions of the source image
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => {
      setNaturalDim({
        width: img.naturalWidth || 350,
        height: img.naturalHeight || 450,
      });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Pointer drag events for pan
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // Safe ignore
    }
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom((prev) => Math.min(Math.max(1, +(prev + delta).toFixed(2)), 3));
  };

  // Nudge pan buttons
  const nudge = (dx: number, dy: number) => {
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Viewport dimensions
  const viewportWidth = 320;
  const viewportHeight = 320;

  // Selected preset specs
  const activePreset: PhotoDimensionSpec =
    PHOTO_SIZE_PRESETS[sizePreset] || PHOTO_SIZE_PRESETS.standard;

  // Calculate cutout dimensions inside viewport
  const isCircle = shape === "circle";
  const cutoutHeight = 225; // standard base height in viewport
  const cutoutWidth = isCircle ? 200 : Math.round(cutoutHeight * activePreset.aspectRatio);
  const actualCutoutHeight = isCircle ? 200 : cutoutHeight;

  // Perform canvas crop and save
  const handleApply = useCallback(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // High-res output dimensions (12 px/mm for crisp 300+ DPI equivalent quality)
      const scaleMultiplier = 12;
      const outputWidth = isCircle ? 450 : Math.round(activePreset.widthMm * scaleMultiplier);
      const outputHeight = isCircle ? 450 : Math.round(activePreset.heightMm * scaleMultiplier);

      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const transform = calculateCropTransform({
        naturalWidth: img.naturalWidth || naturalDim.width,
        naturalHeight: img.naturalHeight || naturalDim.height,
        cutoutWidth,
        cutoutHeight: actualCutoutHeight,
        zoom,
        pan,
        shape,
        outputWidth,
        outputHeight,
      });

      // Clear canvas
      ctx.clearRect(0, 0, outputWidth, outputHeight);

      // Draw the user-framed image without destructive pixel masking.
      // Keeping full image pixels guarantees clean mutual exclusivity between
      // Circular (clipped via CSS border-radius: 50% in preview and convertDataUrlToCircularPng in PDF)
      // and Rectangular (clean 7:9 portrait with border-radius: 0) without combined mixed shapes.
      ctx.drawImage(
        img,
        transform.drawX,
        transform.drawY,
        transform.drawWidth,
        transform.drawHeight
      );

      const photoUrl = canvas.toDataURL("image/jpeg", 0.95);
      onSave({
        photoUrl,
        rawPhotoUrl: imageSrc,
        shape: isCircle ? "circle" : "rectangle",
        size: sizePreset,
      });

      onClose();
    };
    img.src = imageSrc;
  }, [
    imageSrc,
    naturalDim,
    isCircle,
    activePreset,
    cutoutWidth,
    actualCutoutHeight,
    zoom,
    pan,
    shape,
    sizePreset,
    onSave,
    onClose,
  ]);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  // Viewport scale & display math
  const effectiveCutoutWidth = isCircle ? 200 : cutoutWidth;
  const effectiveCutoutHeight = isCircle ? 200 : actualCutoutHeight;
  const baseScale = Math.max(
    effectiveCutoutWidth / Math.max(naturalDim.width, 1),
    effectiveCutoutHeight / Math.max(naturalDim.height, 1)
  );
  const currentScale = baseScale * zoom;
  const displayedWidth = naturalDim.width * currentScale;
  const displayedHeight = naturalDim.height * currentScale;

  const cutoutX = (viewportWidth - effectiveCutoutWidth) / 2;
  const cutoutY = (viewportHeight - effectiveCutoutHeight) / 2;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-crop-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-800 overflow-hidden flex flex-col max-h-[92vh] relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-200 dark:border-surface-800">
          <div>
            <h3
              id="photo-crop-title"
              className="text-base font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2"
            >
              <span>Profile Photo Dimensions & Crop</span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                {activePreset.widthMm} × {activePreset.heightMm} mm
              </span>
            </h3>
            <p className="text-xs text-surface-500 mt-0.5">
              Standard 7:9 passport aspect ratio with precision positioning
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            aria-label="Close photo editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Dimension Preset & Style Switchers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Size Preset */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-500 mb-1.5">
                Physical Size
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl">
                {(["small", "standard", "large"] as PhotoSizePreset[]).map((presetKey) => {
                  const spec = PHOTO_SIZE_PRESETS[presetKey];
                  const isSelected = sizePreset === presetKey;
                  return (
                    <button
                      key={presetKey}
                      type="button"
                      onClick={() => setSizePreset(presetKey)}
                      className={`px-1.5 py-1.5 rounded-lg text-center transition-all ${
                        isSelected
                          ? "bg-white dark:bg-surface-900 text-brand-700 dark:text-brand-300 font-bold shadow-xs border border-surface-200/80 dark:border-surface-700"
                          : "text-surface-600 dark:text-surface-400 font-medium hover:text-surface-900"
                      }`}
                    >
                      <div className="text-[11px] capitalize">{presetKey}</div>
                      <div className="text-[9px] font-mono opacity-80">
                        {spec.widthMm}×{spec.heightMm}mm
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Style Preset */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-500 mb-1.5">
                Photo Style
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setShape("rectangle")}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    shape !== "circle"
                      ? "bg-white dark:bg-surface-900 text-brand-700 dark:text-brand-300 font-bold shadow-xs border border-surface-200/80 dark:border-surface-700"
                      : "text-surface-600 dark:text-surface-400 hover:text-surface-900"
                  }`}
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Rectangular (7:9)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShape("circle")}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    shape === "circle"
                      ? "bg-white dark:bg-surface-900 text-brand-700 dark:text-brand-300 font-bold shadow-xs border border-surface-200/80 dark:border-surface-700"
                      : "text-surface-600 dark:text-surface-400 hover:text-surface-900"
                  }`}
                >
                  <Circle className="w-3.5 h-3.5" />
                  <span>Circular</span>
                </button>
              </div>
            </div>
          </div>

          {/* Viewport Area */}
          <div className="flex flex-col items-center">
            <div
              ref={viewportRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
              style={{ width: `${viewportWidth}px`, height: `${viewportHeight}px` }}
              className="relative overflow-hidden rounded-2xl bg-neutral-950 select-none cursor-grab active:cursor-grabbing shadow-inner touch-none border-2 border-surface-800"
            >
              {/* The Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt="Crop target"
                draggable={false}
                style={{
                  width: `${displayedWidth}px`,
                  height: `${displayedHeight}px`,
                  transform: `translate(${pan.x + (viewportWidth - displayedWidth) / 2}px, ${
                    pan.y + (viewportHeight - displayedHeight) / 2
                  }px)`,
                  maxWidth: "none",
                  maxHeight: "none",
                }}
                className="absolute pointer-events-none select-none transition-none"
              />

              {/* SVG Cutout Overlay with Framing Guides */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox={`0 0 ${viewportWidth} ${viewportHeight}`}
              >
                <defs>
                  <mask id="crop-cutout-mask">
                    <rect width={viewportWidth} height={viewportHeight} fill="white" />
                    {isCircle ? (
                      <circle
                        cx={viewportWidth / 2}
                        cy={viewportHeight / 2}
                        r={effectiveCutoutWidth / 2}
                        fill="black"
                      />
                    ) : (
                      <rect
                        x={cutoutX}
                        y={cutoutY}
                        width={effectiveCutoutWidth}
                        height={effectiveCutoutHeight}
                        rx={0}
                        fill="black"
                      />
                    )}
                  </mask>
                </defs>

                {/* Translucent Backdrop */}
                <rect
                  width={viewportWidth}
                  height={viewportHeight}
                  fill="rgba(0, 0, 0, 0.72)"
                  mask="url(#crop-cutout-mask)"
                />

                {/* Framing Boundary */}
                {isCircle ? (
                  <>
                    <circle
                      cx={viewportWidth / 2}
                      cy={viewportHeight / 2}
                      r={effectiveCutoutWidth / 2}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.9)"
                      strokeWidth="2"
                    />
                    {/* Subtle portrait center guide */}
                    <ellipse
                      cx={viewportWidth / 2}
                      cy={viewportHeight / 2 - 5}
                      rx={effectiveCutoutWidth * 0.28}
                      ry={effectiveCutoutHeight * 0.36}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.3)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  </>
                ) : (
                  <>
                    <rect
                      x={cutoutX}
                      y={cutoutY}
                      width={effectiveCutoutWidth}
                      height={effectiveCutoutHeight}
                      rx={0}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.9)"
                      strokeWidth="2"
                    />
                    {/* Rule-of-thirds grid lines */}
                    <line
                      x1={cutoutX + effectiveCutoutWidth / 3}
                      y1={cutoutY}
                      x2={cutoutX + effectiveCutoutWidth / 3}
                      y2={cutoutY + effectiveCutoutHeight}
                      stroke="rgba(255, 255, 255, 0.25)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1={cutoutX + (effectiveCutoutWidth * 2) / 3}
                      y1={cutoutY}
                      x2={cutoutX + (effectiveCutoutWidth * 2) / 3}
                      y2={cutoutY + effectiveCutoutHeight}
                      stroke="rgba(255, 255, 255, 0.25)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1={cutoutX}
                      y1={cutoutY + effectiveCutoutHeight / 3}
                      x2={cutoutX + effectiveCutoutWidth}
                      y2={cutoutY + effectiveCutoutHeight / 3}
                      stroke="rgba(255, 255, 255, 0.25)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1={cutoutX}
                      y1={cutoutY + (effectiveCutoutHeight * 2) / 3}
                      x2={cutoutX + effectiveCutoutWidth}
                      y2={cutoutY + (effectiveCutoutHeight * 2) / 3}
                      stroke="rgba(255, 255, 255, 0.25)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    {/* Head position guide oval */}
                    <ellipse
                      cx={viewportWidth / 2}
                      cy={cutoutY + effectiveCutoutHeight * 0.42}
                      rx={effectiveCutoutWidth * 0.28}
                      ry={effectiveCutoutHeight * 0.3}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.35)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  </>
                )}
              </svg>

              {/* Pan Hint Pill */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-white/90 flex items-center gap-1 pointer-events-none">
                <Move className="w-3 h-3" />
                <span>Drag photo to position</span>
              </div>
            </div>

            {/* Position Nudge Controls */}
            <div className="flex items-center gap-1.5 mt-2.5">
              <span className="text-[10px] text-surface-500 font-medium mr-1">Fine Tune:</span>
              <button
                type="button"
                onClick={() => nudge(0, -6)}
                className="p-1 rounded bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200"
                title="Nudge Up"
                aria-label="Nudge Up"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => nudge(0, 6)}
                className="p-1 rounded bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200"
                title="Nudge Down"
                aria-label="Nudge Down"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => nudge(-6, 0)}
                className="p-1 rounded bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200"
                title="Nudge Left"
                aria-label="Nudge Left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => nudge(6, 0)}
                className="p-1 rounded bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200"
                title="Nudge Right"
                aria-label="Nudge Right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Zoom Slider and Controls */}
          <div className="p-3 bg-surface-50 dark:bg-surface-800/60 rounded-xl border border-surface-200 dark:border-surface-700/80">
            <div className="flex items-center justify-between text-xs font-semibold text-surface-700 dark:text-surface-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-brand-600" />
                <span>Zoom Level</span>
              </span>
              <span className="font-mono text-brand-600 dark:text-brand-400 font-bold">
                {zoom.toFixed(2)}x
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
                disabled={zoom <= 1}
                className="p-1.5 rounded-lg bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 disabled:opacity-40 transition-colors border border-surface-200 dark:border-surface-700 shadow-xs"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <div className="flex-1">
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.02"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
                  aria-label="Zoom level"
                />
              </div>

              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
                disabled={zoom >= 3}
                className="p-1.5 rounded-lg bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 disabled:opacity-40 transition-colors border border-surface-200 dark:border-surface-700 shadow-xs"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-lg bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200 transition-colors ml-1 border border-surface-200 dark:border-surface-700 shadow-xs"
                title="Reset zoom and position"
                aria-label="Reset zoom and position"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-surface-50 dark:bg-surface-800/50 border-t border-surface-200 dark:border-surface-800">
          <div className="text-xs text-surface-500 font-medium hidden sm:block">
            Size: <span className="font-semibold text-surface-800 dark:text-surface-200">{activePreset.widthMm} × {activePreset.heightMm} mm</span> • Style: <span className="font-semibold text-surface-800 dark:text-surface-200">{shape === "circle" ? "Circular" : "Rectangular (7:9)"}</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Apply Photo</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
