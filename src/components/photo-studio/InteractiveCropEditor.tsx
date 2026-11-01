"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Move,
  Lock,
  Unlock,
  Grid,
  AlignCenter,
  Scan,
  Hand,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { CropCoordinates } from "@/types/crop";
import type { CropHandle, CropMode } from "@/types/crop-preset";
import {
  moveCrop,
  resizeCropFromHandle,
  centerCropInImage,
  fitCropToImage,
  clampCropToBounds,
  MIN_CROP_PIXELS,
} from "@/lib/crop/crop-geometry";
import { getFriendlyAspectRatioName } from "@/lib/photo-studio/dpi-calculator";

export interface InteractiveCropEditorProps {
  imageSource: CanvasImageSource | string | null;
  naturalWidth: number;
  naturalHeight: number;
  crop: CropCoordinates;
  aspectRatio: number | null;
  cropMode: CropMode;
  backgroundColor?: string;
  presetName?: string;
  onCropChange: (crop: CropCoordinates) => void;
  onCropModeToggle?: (mode: CropMode) => void;
  className?: string;
}

type DragMode =
  | { type: "none" }
  | { type: "crop"; startX: number; startY: number; initialCrop: CropCoordinates }
  | {
      type: "handle";
      handle: CropHandle;
      startX: number;
      startY: number;
      initialCrop: CropCoordinates;
    }
  | { type: "pan"; startX: number; startY: number; initialPan: { x: number; y: number } };

export const InteractiveCropEditor: React.FC<InteractiveCropEditorProps> = ({
  imageSource,
  naturalWidth,
  naturalHeight,
  crop,
  aspectRatio,
  cropMode,
  backgroundColor = "transparent",
  presetName = "Passport Photo",
  onCropChange,
  onCropModeToggle,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport Zoom & Pan
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanToolActive, setIsPanToolActive] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Drag interaction state
  const [dragMode, setDragMode] = useState<DragMode>({ type: "none" });

  // Container dimensions
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 600,
    height: 480,
  });

  // Track container dimensions via ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setContainerSize({
            width: Math.round(entry.contentRect.width),
            height: Math.round(entry.contentRect.height),
          });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Compute base fit scale (fits image inside container with 40px padding)
  const fitScale = useMemo(() => {
    if (!naturalWidth || !naturalHeight || !containerSize.width || !containerSize.height) {
      return 1;
    }
    const availW = Math.max(10, containerSize.width - 48);
    const availH = Math.max(10, containerSize.height - 48);
    const scaleW = availW / naturalWidth;
    const scaleH = availH / naturalHeight;
    return Math.min(scaleW, scaleH);
  }, [naturalWidth, naturalHeight, containerSize]);

  // Combined render scale on screen
  const scale = fitScale * zoom;

  // Screen display bounds of the full image
  const imgDisplayW = naturalWidth * scale;
  const imgDisplayH = naturalHeight * scale;

  // Origin (top-left) of the displayed image inside container
  const originX = (containerSize.width - imgDisplayW) / 2 + pan.x;
  const originY = (containerSize.height - imgDisplayH) / 2 + pan.y;

  // Screen coordinates of the crop frame
  const cropBoxScreen = useMemo(() => {
    return {
      left: originX + crop.x * scale,
      top: originY + crop.y * scale,
      width: Math.max(8, crop.width * scale),
      height: Math.max(8, crop.height * scale),
    };
  }, [originX, originY, crop, scale]);

  // Draw source image onto background canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSource || !naturalWidth || !naturalHeight) return;

    canvas.width = naturalWidth;
    canvas.height = naturalHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, naturalWidth, naturalHeight);

    if (typeof imageSource === "string") {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = imageSource;
    } else {
      ctx.drawImage(imageSource as any, 0, 0);
    }
  }, [imageSource, naturalWidth, naturalHeight]);

  // Zoom Controls
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(5, Math.round((prev + 0.2) * 100) / 100));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.2, Math.round((prev - 0.2) * 100) / 100));
  };

  const handleFitScreen = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleActualPixels = () => {
    if (fitScale > 0) {
      setZoom(Math.round((1 / fitScale) * 100) / 100);
      setPan({ x: 0, y: 0 });
    }
  };

  // Center Crop inside Image
  const handleCenterCrop = () => {
    const centered = centerCropInImage(crop, naturalWidth, naturalHeight);
    onCropChange(centered);
  };

  // Fit Crop to Image boundaries
  const handleFitCrop = () => {
    const fitted = fitCropToImage(naturalWidth, naturalHeight, aspectRatio);
    onCropChange(fitted);
  };

  // Reset Crop Position & Framing
  const handleResetCrop = () => {
    const fitted = fitCropToImage(naturalWidth, naturalHeight, aspectRatio);
    const centered = centerCropInImage(fitted, naturalWidth, naturalHeight);
    onCropChange(centered);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Handle Mouse Wheel for Zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.max(0.2, Math.min(5, Math.round((prev + delta) * 100) / 100)));
  };

  // POINTER DOWN: Crop Frame Drag
  const handleCropPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Left click only
    if (isPanToolActive) return;

    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setDragMode({
      type: "crop",
      startX: e.clientX,
      startY: e.clientY,
      initialCrop: { ...crop },
    });
  };

  // POINTER DOWN: Handle Drag
  const handleHandlePointerDown = (handle: CropHandle, e: React.PointerEvent) => {
    if (e.button !== 0) return;

    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setDragMode({
      type: "handle",
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialCrop: { ...crop },
    });
  };

  // POINTER DOWN: Viewport Pan
  const handleContainerPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.button !== 1) return; // Left or middle click

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    setDragMode({
      type: "pan",
      startX: e.clientX,
      startY: e.clientY,
      initialPan: { ...pan },
    });
  };

  // POINTER MOVE: Active Drag Routing
  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragMode.type === "none") return;

    if (dragMode.type === "crop") {
      const deltaScreenX = e.clientX - dragMode.startX;
      const deltaScreenY = e.clientY - dragMode.startY;
      const deltaImgX = deltaScreenX / scale;
      const deltaImgY = deltaScreenY / scale;

      const moved = moveCrop(
        dragMode.initialCrop,
        deltaImgX,
        deltaImgY,
        naturalWidth,
        naturalHeight
      );
      onCropChange(moved);
    } else if (dragMode.type === "handle") {
      const deltaScreenX = e.clientX - dragMode.startX;
      const deltaScreenY = e.clientY - dragMode.startY;
      const deltaImgX = deltaScreenX / scale;
      const deltaImgY = deltaScreenY / scale;

      const resized = resizeCropFromHandle(
        dragMode.initialCrop,
        dragMode.handle,
        deltaImgX,
        deltaImgY,
        naturalWidth,
        naturalHeight,
        aspectRatio,
        MIN_CROP_PIXELS
      );
      onCropChange(resized);
    } else if (dragMode.type === "pan") {
      const deltaX = e.clientX - dragMode.startX;
      const deltaY = e.clientY - dragMode.startY;
      setPan({
        x: dragMode.initialPan.x + deltaX,
        y: dragMode.initialPan.y + deltaY,
      });
    }
  };

  // POINTER UP / CANCEL: Finish Drag
  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragMode.type !== "none") {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture release safety
      }
      setDragMode({ type: "none" });
    }
  };

  const currentRatio = crop.width / Math.max(1, crop.height);
  const friendlyRatioName = getFriendlyAspectRatioName(currentRatio);

  return (
    <div
      className={cn(
        "bg-white rounded-3xl border border-surface-200 shadow-card overflow-hidden flex flex-col",
        className
      )}
    >
      {/* Top Workspace Toolbar */}
      <div className="bg-surface-50 border-b border-surface-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-surface-700 select-none">
        {/* Left: Preset Label & Aspect Lock */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-surface-900 truncate max-w-[200px]">
            {presetName}
          </span>
          <span className="text-surface-300">•</span>
          <span className="text-[11px] font-mono text-surface-500 font-semibold">
            {friendlyRatioName}
          </span>

          {onCropModeToggle && (
            <button
              type="button"
              onClick={() => onCropModeToggle(cropMode === "fixed" ? "free" : "fixed")}
              className={cn(
                "ml-1 p-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1",
                cropMode === "fixed"
                  ? "bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100"
                  : "bg-surface-100 text-surface-600 border-surface-200 hover:bg-surface-200"
              )}
              title={
                cropMode === "fixed"
                  ? "Aspect Ratio Locked. Click for Freeform Crop."
                  : "Freeform Crop Active. Click to Lock Aspect Ratio."
              }
              aria-label={
                cropMode === "fixed" ? "Unlock Aspect Ratio" : "Lock Aspect Ratio"
              }
            >
              {cropMode === "fixed" ? (
                <Lock className="w-3.5 h-3.5 text-brand-600" />
              ) : (
                <Unlock className="w-3.5 h-3.5 text-surface-500" />
              )}
            </button>
          )}
        </div>

        {/* Center: Alignment & Framing Controls */}
        <div className="flex items-center gap-1 bg-white px-1.5 py-1 rounded-xl border border-surface-200 shadow-xs">
          <button
            type="button"
            onClick={handleCenterCrop}
            className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors text-surface-700"
            title="Center Crop inside Image"
            aria-label="Center Crop"
          >
            <AlignCenter className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleFitCrop}
            className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors text-surface-700"
            title="Fit Crop to Image Area"
            aria-label="Fit Crop to Image"
          >
            <Scan className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              showGrid
                ? "bg-brand-50 text-brand-700 font-bold"
                : "text-surface-700 hover:bg-surface-100"
            )}
            title="Toggle Rule-of-Thirds Grid"
            aria-label="Toggle Grid"
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsPanToolActive(!isPanToolActive)}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              isPanToolActive
                ? "bg-brand-50 text-brand-700 font-bold"
                : "text-surface-700 hover:bg-surface-100"
            )}
            title="Pan View Tool (Drag anywhere to pan)"
            aria-label="Pan View Tool"
          >
            <Hand className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleResetCrop}
            className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors text-surface-700"
            title="Reset Crop Position & Scale"
            aria-label="Reset Position"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Zoom Controls */}
        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-surface-200 shadow-xs font-mono">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 0.25}
            className="p-1 rounded-lg hover:bg-surface-100 disabled:opacity-30 transition-colors text-surface-700"
            title="Zoom Out (-20%)"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="text-[11px] px-1.5 min-w-[45px] text-center font-bold text-surface-800">
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 5}
            className="p-1 rounded-lg hover:bg-surface-100 disabled:opacity-30 transition-colors text-surface-700"
            title="Zoom In (+20%)"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-3.5 bg-surface-200 mx-0.5" />

          <button
            type="button"
            onClick={handleFitScreen}
            className="p-1 rounded-lg hover:bg-surface-100 transition-colors text-surface-700"
            title="Fit to Screen"
            aria-label="Fit to Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleActualPixels}
            className="px-1.5 py-0.5 text-[10px] font-bold rounded-lg hover:bg-surface-100 transition-colors text-surface-700"
            title="100% Actual Pixels"
            aria-label="100% Pixels"
          >
            100%
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Viewport */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onPointerDown={handleContainerPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full h-[400px] sm:h-[480px] lg:h-[520px] bg-surface-950 overflow-hidden select-none touch-none flex items-center justify-center cursor-default"
        style={{
          cursor:
            dragMode.type === "pan" || isPanToolActive
              ? "grabbing"
              : dragMode.type === "crop"
              ? "move"
              : "default",
        }}
      >
        {/* Transparency Checkerboard for transparent PNGs */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] [background-size:16px_16px] [background-position:0_0,0_8px,8px_-8px,-8px_0px] opacity-25 pointer-events-none" />

        {/* Displayed Image Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute block pointer-events-none shadow-2xl"
          style={{
            left: `${originX}px`,
            top: `${originY}px`,
            width: `${imgDisplayW}px`,
            height: `${imgDisplayH}px`,
            imageRendering: zoom > 2 ? "pixelated" : "auto",
          }}
        />

        {/* Darkened Backdrop Overlay with Cutout Path */}
        <svg
          className="absolute inset-0 pointer-events-none w-full h-full"
          width="100%"
          height="100%"
        >
          <path
            fill="rgba(15, 23, 42, 0.65)"
            fillRule="evenodd"
            d={`M 0 0 L ${containerSize.width} 0 L ${containerSize.width} ${
              containerSize.height
            } L 0 ${containerSize.height} Z M ${cropBoxScreen.left} ${
              cropBoxScreen.top
            } L ${cropBoxScreen.left + cropBoxScreen.width} ${cropBoxScreen.top} L ${
              cropBoxScreen.left + cropBoxScreen.width
            } ${cropBoxScreen.top + cropBoxScreen.height} L ${
              cropBoxScreen.left
            } ${cropBoxScreen.top + cropBoxScreen.height} Z`}
          />
        </svg>

        {/* Interactive Crop Frame */}
        <div
          onPointerDown={handleCropPointerDown}
          className="absolute border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)] touch-none select-none z-10 transition-none"
          style={{
            left: `${cropBoxScreen.left}px`,
            top: `${cropBoxScreen.top}px`,
            width: `${cropBoxScreen.width}px`,
            height: `${cropBoxScreen.height}px`,
            cursor: isPanToolActive ? "grab" : "move",
          }}
        >
          {/* Rule of Thirds Grid Lines */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
              <div className="border-r border-b border-white/30 border-dashed" />
              <div className="border-r border-b border-white/30 border-dashed" />
              <div className="border-b border-white/30 border-dashed" />
              <div className="border-r border-b border-white/30 border-dashed" />
              <div className="border-r border-b border-white/30 border-dashed" />
              <div className="border-b border-white/30 border-dashed" />
              <div className="border-r border-white/30 border-dashed" />
              <div className="border-r border-white/30 border-dashed" />
              <div />
            </div>
          )}

          {/* 8 Directional Resize Handles (Touch Target: 32px hit-box) */}
          {/* Corner Handles */}
          <div
            onPointerDown={(e) => handleHandlePointerDown("nw", e)}
            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-surface-900 rounded-sm cursor-nwse-resize shadow-md before:absolute before:-inset-3 before:content-['']"
            title="Resize Top-Left"
          />
          <div
            onPointerDown={(e) => handleHandlePointerDown("ne", e)}
            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-surface-900 rounded-sm cursor-nesw-resize shadow-md before:absolute before:-inset-3 before:content-['']"
            title="Resize Top-Right"
          />
          <div
            onPointerDown={(e) => handleHandlePointerDown("se", e)}
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-surface-900 rounded-sm cursor-nwse-resize shadow-md before:absolute before:-inset-3 before:content-['']"
            title="Resize Bottom-Right"
          />
          <div
            onPointerDown={(e) => handleHandlePointerDown("sw", e)}
            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-surface-900 rounded-sm cursor-nesw-resize shadow-md before:absolute before:-inset-3 before:content-['']"
            title="Resize Bottom-Left"
          />

          {/* Edge Midpoint Handles */}
          <div
            onPointerDown={(e) => handleHandlePointerDown("n", e)}
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-white border border-surface-900 rounded-sm cursor-ns-resize shadow-md before:absolute before:-inset-3 before:content-['']"
            title="Resize Top"
          />
          <div
            onPointerDown={(e) => handleHandlePointerDown("s", e)}
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-white border border-surface-900 rounded-sm cursor-ns-resize shadow-md before:absolute before:-inset-3 before:content-['']"
            title="Resize Bottom"
          />
          <div
            onPointerDown={(e) => handleHandlePointerDown("w", e)}
            className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-4 bg-white border border-surface-900 rounded-sm cursor-ew-resize shadow-md before:absolute before:-inset-3 before:content-['']"
            title="Resize Left"
          />
          <div
            onPointerDown={(e) => handleHandlePointerDown("e", e)}
            className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-4 bg-white border border-surface-900 rounded-sm cursor-ew-resize shadow-md before:absolute before:-inset-3 before:content-['']"
            title="Resize Right"
          />

          {/* Floating Dimensions Tag attached to crop frame */}
          <div className="absolute -top-7 left-0 pointer-events-none bg-surface-900/90 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-white whitespace-nowrap shadow-md border border-white/20">
            {crop.width} × {crop.height} px
          </div>
        </div>

        {/* Viewport Floating HUD (Bottom Left) */}
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 bg-surface-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px] font-mono text-surface-200 shadow-md">
          <Info className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <span>
            Source: {naturalWidth} × {naturalHeight} px
          </span>
          <span className="text-surface-600">•</span>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <span className="text-surface-600 hidden sm:inline">•</span>
          <span className="hidden sm:inline">
            Crop: ({crop.x}, {crop.y}) {crop.width}×{crop.height}
          </span>
        </div>

        {/* Helpful Desktop & Mobile Gesture Hint */}
        <div className="absolute bottom-3 right-3 z-20 hidden md:flex items-center gap-1.5 bg-surface-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 text-[10px] font-mono text-surface-400">
          <span>Drag crop frame to position • Scroll wheel to zoom</span>
        </div>
      </div>
    </div>
  );
};
