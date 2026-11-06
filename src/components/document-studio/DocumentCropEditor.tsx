"use client";

import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import {
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  X,
  Lock,
  Unlock,
  Move,
  Crop as CropIcon,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { CropCoordinates } from "@/types/crop";
import type { CropHandle } from "@/types/crop-preset";
import type {
  DocumentCropStatus,
  DocumentDimensions,
  DocumentSide,
} from "@/types/document-studio";
import {
  moveCrop,
  resizeCropFromHandle,
  clampCropToBounds,
  MIN_CROP_PIXELS,
} from "@/lib/crop/crop-geometry";
import {
  getRotatedDimensions,
  normalizeRotation,
} from "@/lib/document/document-cropper";

export interface DocumentCropEditorProps {
  side: DocumentSide;
  sideTitle: string;
  previewUrl: string;
  nativeDimensions: DocumentDimensions;
  crop: CropCoordinates;
  otherCrop?: CropCoordinates | null;
  otherSideTitle?: string;
  rotation: number;
  zoom?: number;
  aspectRatioLocked?: boolean;
  targetAspectRatio?: number | null;
  autoCropStatus?: DocumentCropStatus;
  isLoading?: boolean;
  onCropChange?: (crop: CropCoordinates) => void;
  onRotationChange?: (rotation: number) => void;
  onZoomChange?: (zoom: number) => void;
  onAspectRatioLockedChange?: (locked: boolean) => void;
  onApplyCrop: (crop: CropCoordinates, rotation: number) => void;
  onAutoCrop?: () => void;
  onResetCrop?: () => void;
  onClose: () => void;
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
  | {
      type: "pan";
      startX: number;
      startY: number;
      initialScrollLeft: number;
      initialScrollTop: number;
    }
  | {
      type: "select";
      startImgX: number;
      startImgY: number;
    };

const HANDLES: Array<{
  handle: CropHandle;
  cursor: string;
  positionClass: string;
  isCorner: boolean;
}> = [
  { handle: "nw", cursor: "nwse-resize", positionClass: "top-0 left-0 -translate-x-1/2 -translate-y-1/2", isCorner: true },
  { handle: "n", cursor: "ns-resize", positionClass: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2", isCorner: false },
  { handle: "ne", cursor: "nesw-resize", positionClass: "top-0 right-0 translate-x-1/2 -translate-y-1/2", isCorner: true },
  { handle: "e", cursor: "ew-resize", positionClass: "top-1/2 right-0 translate-x-1/2 -translate-y-1/2", isCorner: false },
  { handle: "se", cursor: "nwse-resize", positionClass: "bottom-0 right-0 translate-x-1/2 translate-y-1/2", isCorner: true },
  { handle: "s", cursor: "ns-resize", positionClass: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2", isCorner: false },
  { handle: "sw", cursor: "nesw-resize", positionClass: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2", isCorner: true },
  { handle: "w", cursor: "ew-resize", positionClass: "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2", isCorner: false },
];

export const DocumentCropEditor: React.FC<DocumentCropEditorProps> = ({
  side,
  sideTitle,
  previewUrl,
  nativeDimensions,
  crop,
  otherCrop,
  otherSideTitle,
  rotation: initialRotation,
  zoom: _initialZoom = 1,
  aspectRatioLocked: initialAspectLocked = true,
  targetAspectRatio,
  isLoading = false,
  onApplyCrop,
  onClose,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Local state: crop coordinates and rotation are kept isolated until user confirms
  const [localCrop, setLocalCrop] = useState<CropCoordinates>(() => ({ ...crop }));
  const [localRotation, setLocalRotation] = useState<number>(initialRotation || 0);
  const [aspectRatioLocked, setAspectRatioLocked] = useState<boolean>(initialAspectLocked ?? true);

  // Active Tool: "select" (drawing / adjusting crop) vs "pan" (viewport panning)
  const [activeTool, setActiveTool] = useState<"select" | "pan">("select");

  // Viewport Zoom
  const [zoom, setZoom] = useState<number>(1.0);

  // Space key tracking for quick panning
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);

  // Drag interaction state
  const [dragMode, setDragMode] = useState<DragMode>({ type: "none" });

  // Container dimensions tracked via ResizeObserver
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 700,
  });

  const isFront = side === "front";

  // Prevent body scrolling while modal is open, and handle ESC key to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.code === "Space" && !e.repeat) {
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

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

  // Rotated workspace dimensions
  const rotatedSize = useMemo(() => {
    return getRotatedDimensions(
      nativeDimensions.width,
      nativeDimensions.height,
      localRotation
    );
  }, [nativeDimensions.width, nativeDimensions.height, localRotation]);

  // Base scale calculation:
  // For portrait documents (e.g. A4 / official letters), fitting strictly by height shrinks the width down to ~300px.
  // We expand portrait documents to a generous, readable width (e.g. 780px - 880px on desktop)
  // so the user can easily see details and perform a pixel-perfect crop, scrolling vertically as needed.
  const baseScale = useMemo(() => {
    if (!rotatedSize.width || !rotatedSize.height || !containerSize.width || !containerSize.height) {
      return 1;
    }
    const availW = Math.max(10, containerSize.width - 64);
    const availH = Math.max(10, containerSize.height - 64);

    const isPortrait = rotatedSize.height > rotatedSize.width * 1.15;
    if (isPortrait) {
      // For portrait documents, expand width so details are large and legible (target ~820px on desktop)
      const targetExpandedWidth = Math.min(availW, Math.max(760, availW * 0.72));
      return targetExpandedWidth / rotatedSize.width;
    }

    // For landscape / square documents: fit comfortably inside viewport
    return Math.min(availW / rotatedSize.width, availH / rotatedSize.height);
  }, [rotatedSize.width, rotatedSize.height, containerSize.width, containerSize.height]);

  // Combined scale on screen
  const currentZoom = zoom || 1.0;
  const scale = baseScale * currentZoom;

  // Screen display bounds of the full original document
  const displayW = Math.round(rotatedSize.width * scale);
  const displayH = Math.round(rotatedSize.height * scale);

  // Active crop coordinates clamped safely within rotated document bounds
  const activeCrop = useMemo(() => {
    return clampCropToBounds(
      localCrop,
      rotatedSize.width,
      rotatedSize.height,
      aspectRatioLocked ? targetAspectRatio : null,
      MIN_CROP_PIXELS
    );
  }, [localCrop, rotatedSize.width, rotatedSize.height, aspectRatioLocked, targetAspectRatio]);

  // Screen position of the crop rectangle inside workspaceRef
  const cropBoxScreen = useMemo(() => {
    return {
      left: Math.round(activeCrop.x * scale),
      top: Math.round(activeCrop.y * scale),
      width: Math.max(8, Math.round(activeCrop.width * scale)),
      height: Math.max(8, Math.round(activeCrop.height * scale)),
    };
  }, [activeCrop, scale]);

  // Screen position of the other side's crop rectangle (reference only)
  const otherBoxScreen = useMemo(() => {
    if (!otherCrop) return null;
    return {
      left: Math.round(otherCrop.x * scale),
      top: Math.round(otherCrop.y * scale),
      width: Math.max(8, Math.round(otherCrop.width * scale)),
      height: Math.max(8, Math.round(otherCrop.height * scale)),
    };
  }, [otherCrop, scale]);

  // Draw the full original uploaded document on the background canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !previewUrl || !nativeDimensions.width || !nativeDimensions.height) return;

    let isMounted = true;
    canvas.width = rotatedSize.width;
    canvas.height = rotatedSize.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, rotatedSize.width, rotatedSize.height);

    const drawImageOnCanvas = (img: HTMLImageElement) => {
      if (!isMounted) return;
      imgRef.current = img;

      ctx.save();
      const normRot = normalizeRotation(localRotation);
      if (normRot === 90) {
        ctx.translate(rotatedSize.width, 0);
        ctx.rotate((90 * Math.PI) / 180);
      } else if (normRot === 180) {
        ctx.translate(rotatedSize.width, rotatedSize.height);
        ctx.rotate((180 * Math.PI) / 180);
      } else if (normRot === 270) {
        ctx.translate(0, rotatedSize.height);
        ctx.rotate((270 * Math.PI) / 180);
      }
      ctx.drawImage(img, 0, 0, nativeDimensions.width, nativeDimensions.height);
      ctx.restore();
    };

    if (imgRef.current && imgRef.current.src === previewUrl && imgRef.current.complete) {
      drawImageOnCanvas(imgRef.current);
    } else {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => drawImageOnCanvas(img);
      img.src = previewUrl;
    }

    return () => {
      isMounted = false;
    };
  }, [previewUrl, nativeDimensions.width, nativeDimensions.height, rotatedSize, localRotation]);

  // Convert screen pointer coordinates to native image coordinates
  const getWorkspacePoint = (e: React.PointerEvent) => {
    if (!workspaceRef.current) return { imgX: 0, imgY: 0 };
    const rect = workspaceRef.current.getBoundingClientRect();
    const px = Math.max(0, Math.min(displayW, e.clientX - rect.left));
    const py = Math.max(0, Math.min(displayH, e.clientY - rect.top));
    return {
      imgX: Math.max(0, Math.min(rotatedSize.width, px / scale)),
      imgY: Math.max(0, Math.min(rotatedSize.height, py / scale)),
    };
  };

  // ROTATION CONTROLS (90° steps)
  const handleRotateLeft = () => {
    setLocalRotation((prev) => normalizeRotation(prev - 90));
  };

  const handleRotateRight = () => {
    setLocalRotation((prev) => normalizeRotation(prev + 90));
  };

  // REQUIRED ZOOM & FIT CONTROLS
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(4.0, Math.round((prev + 0.2) * 100) / 100));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.2, Math.round((prev - 0.2) * 100) / 100));
  };

  const handleFitToScreen = () => {
    const availW = Math.max(10, containerSize.width - 64);
    const availH = Math.max(10, containerSize.height - 64);
    const fitAll = Math.min(availW / rotatedSize.width, availH / rotatedSize.height);
    setZoom(Math.round((fitAll / baseScale) * 100) / 100);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      containerRef.current.scrollLeft = 0;
    }
  };

  const handleResetZoom = () => {
    setZoom(1.0);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      containerRef.current.scrollLeft = 0;
    }
  };

  // Mouse wheel: scroll vertically to view document, or zoom when holding Ctrl/Meta key
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      setZoom((prev) => Math.max(0.2, Math.min(4.0, Math.round((prev + delta) * 100) / 100)));
    }
    // Normal wheel scrolling is allowed to scroll the enlarged document up and down naturally
  };

  // POINTER DOWN: Background Canvas Click -> Pan or Rectangular Selection
  const handleContainerPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.button !== 1) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    if (activeTool === "pan" || isSpacePressed || e.shiftKey || e.button === 1) {
      if (containerRef.current) {
        setDragMode({
          type: "pan",
          startX: e.clientX,
          startY: e.clientY,
          initialScrollLeft: containerRef.current.scrollLeft,
          initialScrollTop: containerRef.current.scrollTop,
        });
      }
    } else {
      // Crop Selection tool active: click and drag draws a new rectangular selection
      const pt = getWorkspacePoint(e);
      setDragMode({
        type: "select",
        startImgX: pt.imgX,
        startImgY: pt.imgY,
      });
    }
  };

  // POINTER DOWN: Crop Rectangle Drag (Move)
  const handleCropPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (activeTool === "pan" || isSpacePressed) {
      if (containerRef.current) {
        setDragMode({
          type: "pan",
          startX: e.clientX,
          startY: e.clientY,
          initialScrollLeft: containerRef.current.scrollLeft,
          initialScrollTop: containerRef.current.scrollTop,
        });
      }
    } else {
      setDragMode({
        type: "crop",
        startX: e.clientX,
        startY: e.clientY,
        initialCrop: { ...activeCrop },
      });
    }
  };

  // POINTER DOWN: Handle Drag (Resize)
  const handleHandlePointerDown = (handle: CropHandle, e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setDragMode({
      type: "handle",
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialCrop: { ...activeCrop },
    });
  };

  // POINTER MOVE: Active Drag Routing
  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragMode.type === "none") return;

    if (dragMode.type === "crop") {
      const deltaX = (e.clientX - dragMode.startX) / scale;
      const deltaY = (e.clientY - dragMode.startY) / scale;

      const moved = moveCrop(
        dragMode.initialCrop,
        deltaX,
        deltaY,
        rotatedSize.width,
        rotatedSize.height
      );
      setLocalCrop(moved);
    } else if (dragMode.type === "handle") {
      const deltaX = (e.clientX - dragMode.startX) / scale;
      const deltaY = (e.clientY - dragMode.startY) / scale;

      const aspectConstraint = aspectRatioLocked ? targetAspectRatio : null;

      const resized = resizeCropFromHandle(
        dragMode.initialCrop,
        dragMode.handle,
        deltaX,
        deltaY,
        rotatedSize.width,
        rotatedSize.height,
        aspectConstraint,
        MIN_CROP_PIXELS
      );
      setLocalCrop(resized);
    } else if (dragMode.type === "pan") {
      if (containerRef.current) {
        const deltaX = e.clientX - dragMode.startX;
        const deltaY = e.clientY - dragMode.startY;
        containerRef.current.scrollLeft = dragMode.initialScrollLeft - deltaX;
        containerRef.current.scrollTop = dragMode.initialScrollTop - deltaY;
      }
    } else if (dragMode.type === "select") {
      const cur = getWorkspacePoint(e);
      const rawX = Math.min(dragMode.startImgX, cur.imgX);
      const rawY = Math.min(dragMode.startImgY, cur.imgY);
      let rawW = Math.abs(cur.imgX - dragMode.startImgX);
      let rawH = Math.abs(cur.imgY - dragMode.startImgY);

      if (aspectRatioLocked && targetAspectRatio) {
        if (rawW / Math.max(1, rawH) > targetAspectRatio) {
          rawW = Math.round(rawH * targetAspectRatio);
        } else {
          rawH = Math.round(rawW / targetAspectRatio);
        }
      }

      if (rawW >= MIN_CROP_PIXELS && rawH >= MIN_CROP_PIXELS) {
        setLocalCrop({
          x: Math.round(rawX),
          y: Math.round(rawY),
          width: Math.round(rawW),
          height: Math.round(rawH),
        });
      }
    }
  };

  // POINTER UP: Complete Drag
  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragMode.type !== "none") {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe release
      }
      setDragMode({ type: "none" });
    }
  };

  // REQUIRED CONFIRM CROP ACTION: Updates ONLY the current side
  const handleConfirm = () => {
    onApplyCrop(activeCrop, localRotation);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Manual Crop Editor — ${sideTitle}`}
      className={cn(
        "fixed inset-0 z-50 flex flex-col bg-[#070b14] text-white select-none animate-in fade-in duration-150",
        className
      )}
    >
      {/* 1. Top Header Bar (100% Solid Opaque Background) */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-surface-800 bg-[#0b0f19] text-white shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 border",
              isFront
                ? "bg-brand-500/20 text-brand-300 border-brand-500/40"
                : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
            )}
          >
            {isFront ? "F" : "B"}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                Manual Crop Editor — {sideTitle}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-950 text-brand-300 border border-brand-800">
                Single Enlarged Viewing Area
              </span>
            </div>
            <p className="text-xs text-surface-400 mt-0.5 hidden sm:block">
              Manually select the {sideTitle.toLowerCase()} card on the original document. Confirming updates only the {sideTitle}.
            </p>
          </div>
        </div>

        {/* Right Header Actions: Specs, Rotation & Close Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Document Dimensions Badge */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-surface-400 font-mono px-3 py-1.5 rounded-xl bg-surface-900 border border-surface-800">
            <Info className="w-3.5 h-3.5 text-brand-400" />
            <span>Document: {nativeDimensions.width} × {nativeDimensions.height} px</span>
            <span>•</span>
            <span className="text-brand-300">
              Selection: {activeCrop.width} × {activeCrop.height} px
            </span>
          </div>

          {/* Aspect Ratio Lock Toggle */}
          <button
            type="button"
            onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
              aspectRatioLocked
                ? "bg-brand-950 text-brand-300 border-brand-800"
                : "bg-surface-900 text-surface-400 border-surface-800 hover:text-white"
            )}
            title={aspectRatioLocked ? "Aspect ratio locked to ISO CR80 standard card" : "Freeform crop active"}
            aria-label={aspectRatioLocked ? "Lock Aspect Ratio" : "Unlock Aspect Ratio"}
          >
            {aspectRatioLocked ? (
              <>
                <Lock className="w-3.5 h-3.5 text-brand-400" />
                <span className="hidden sm:inline">CR80 Locked</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Free Crop</span>
              </>
            )}
          </button>

          {/* Rotation Controls */}
          <div className="flex items-center gap-1 bg-surface-900 border border-surface-800 rounded-xl p-1">
            <button
              type="button"
              onClick={handleRotateLeft}
              className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-300 hover:text-white transition-colors"
              title="Rotate 90° Counterclockwise"
              aria-label="Rotate Counterclockwise"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRotateRight}
              className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-300 hover:text-white transition-colors"
              title="Rotate 90° Clockwise"
              aria-label="Rotate Clockwise"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Close / Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-900 hover:bg-surface-800 text-surface-400 hover:text-white transition-colors border border-surface-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ml-1"
            title="Cancel manual cropping (Esc)"
            aria-label="Cancel manual cropping"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Main Single Enlarged Viewing Area (Full Original Uploaded Document, Expanded with Scroll Support) */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onPointerDown={handleContainerPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={cn(
          "relative flex-1 w-full min-h-0 bg-[#070b14] overflow-auto select-none p-4 sm:p-8",
          activeTool === "pan" || isSpacePressed
            ? "cursor-grab active:cursor-grabbing"
            : "cursor-crosshair"
        )}
      >
        {/* Document Workspace Canvas Box */}
        <div
          ref={workspaceRef}
          className="relative mx-auto shadow-2xl transition-all"
          style={{
            width: `${displayW}px`,
            height: `${displayH}px`,
          }}
        >
          {/* Full Document Canvas Layer */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full block pointer-events-none rounded-sm"
          />

          {/* Dark Dimming Mask around Crop Box */}
          {/* Top mask */}
          <div
            className="absolute bg-black/65 pointer-events-none transition-all"
            style={{
              left: 0,
              top: 0,
              width: `${displayW}px`,
              height: `${Math.max(0, cropBoxScreen.top)}px`,
            }}
          />
          {/* Bottom mask */}
          <div
            className="absolute bg-black/65 pointer-events-none transition-all"
            style={{
              left: 0,
              top: `${cropBoxScreen.top + cropBoxScreen.height}px`,
              width: `${displayW}px`,
              height: `${Math.max(0, displayH - (cropBoxScreen.top + cropBoxScreen.height))}px`,
            }}
          />
          {/* Left mask */}
          <div
            className="absolute bg-black/65 pointer-events-none transition-all"
            style={{
              left: 0,
              top: `${cropBoxScreen.top}px`,
              width: `${Math.max(0, cropBoxScreen.left)}px`,
              height: `${cropBoxScreen.height}px`,
            }}
          />
          {/* Right mask */}
          <div
            className="absolute bg-black/65 pointer-events-none transition-all"
            style={{
              left: `${cropBoxScreen.left + cropBoxScreen.width}px`,
              top: `${cropBoxScreen.top}px`,
              width: `${Math.max(0, displayW - (cropBoxScreen.left + cropBoxScreen.width))}px`,
              height: `${cropBoxScreen.height}px`,
            }}
          />

          {/* Other Side Reference Outline (if dual-sided document) */}
          {otherBoxScreen && (
            <div
              className="absolute border-2 border-dashed border-indigo-400/80 bg-indigo-500/10 pointer-events-none rounded-sm transition-all"
              style={{
                left: `${otherBoxScreen.left}px`,
                top: `${otherBoxScreen.top}px`,
                width: `${otherBoxScreen.width}px`,
                height: `${otherBoxScreen.height}px`,
              }}
            >
              <div className="absolute top-1 left-1 bg-indigo-900/95 text-indigo-200 text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm">
                {otherSideTitle || "Other Side (Reference)"}
              </div>
            </div>
          )}

          {/* Interactive Rectangular Crop Frame */}
          <div
            onPointerDown={handleCropPointerDown}
            className="absolute border-2 border-brand-400 shadow-[0_0_0_1px_rgba(0,0,0,0.6)] touch-none"
            style={{
              left: `${cropBoxScreen.left}px`,
              top: `${cropBoxScreen.top}px`,
              width: `${cropBoxScreen.width}px`,
              height: `${cropBoxScreen.height}px`,
              cursor: activeTool === "pan" || isSpacePressed ? "grab" : "move",
            }}
          >
            {/* Rule of Thirds Grid Lines */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30">
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-b border-white" />
              <div className="border-r border-b border-white" />
              <div className="border-r border-b border-white" />
              <div />
            </div>

            {/* Floating HUD Badge attached to Crop Box */}
            <div className="absolute -top-7 left-0 pointer-events-none bg-surface-900/95 backdrop-blur-md px-2.5 py-0.5 rounded text-[11px] font-mono text-white whitespace-nowrap shadow-md border border-white/20">
              {activeCrop.width} × {activeCrop.height} px
            </div>

            {/* 8 Directional Resize Handles */}
            {HANDLES.map(({ handle, cursor, positionClass, isCorner }) => (
              <div
                key={handle}
                onPointerDown={(e) => handleHandlePointerDown(handle, e)}
                className={cn(
                  "absolute bg-white border-2 border-brand-600 rounded-sm shadow-md transition-transform hover:scale-125 z-10 touch-none",
                  isCorner ? "w-3.5 h-3.5" : "w-3 h-3 bg-brand-100",
                  positionClass
                )}
                style={{ cursor }}
                title={`Resize handle (${handle})`}
              />
            ))}
          </div>
        </div>

        {/* Viewport Floating Info Badge (Fixed Bottom-Left) */}
        <div className="fixed bottom-16 left-6 z-20 hidden sm:flex items-center gap-2 bg-[#0b0f19]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px] font-mono text-surface-300 shadow-md">
          <Info className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <span>Zoom: {Math.round(currentZoom * 100)}%</span>
          <span className="text-surface-600">•</span>
          <span>Target: {sideTitle}</span>
          <span className="text-surface-600">•</span>
          <span>Coordinates: ({activeCrop.x}, {activeCrop.y})</span>
        </div>

        {/* Desktop Helper Note (Fixed Bottom-Right) */}
        <div className="fixed bottom-16 right-6 z-20 hidden md:flex items-center gap-1.5 bg-[#0b0f19]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px] font-mono text-surface-400">
          <span>Scroll to view document • Drag box to move • Drag handles to resize • Hold Space to pan</span>
        </div>
      </div>

      {/* 3. Bottom Controls Toolbar Strip (REQUIRED CROP EDITOR CONTROLS, 100% Solid Opaque Background) */}
      <div className="px-4 sm:px-6 py-3 bg-[#0b0f19] border-t border-surface-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 shadow-lg">
        {/* Left: Tools & Zoom Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* REQUIRED CONTROL: Crop selection */}
          <button
            type="button"
            onClick={() => setActiveTool("select")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
              activeTool === "select" && !isSpacePressed
                ? "bg-brand-600 text-white border-brand-500 shadow-xs"
                : "bg-surface-800 text-surface-300 border-surface-700 hover:bg-surface-700 hover:text-white"
            )}
            title="Crop selection (draw or adjust rectangular selection)"
            aria-label="Crop selection"
          >
            <CropIcon className="w-4 h-4" />
            <span>Crop selection</span>
          </button>

          {/* Pan View Tool */}
          <button
            type="button"
            onClick={() => setActiveTool("pan")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
              activeTool === "pan" || isSpacePressed
                ? "bg-brand-600 text-white border-brand-500 shadow-xs"
                : "bg-surface-800 text-surface-300 border-surface-700 hover:bg-surface-700 hover:text-white"
            )}
            title="Pan tool (drag to pan around)"
            aria-label="Pan"
          >
            <Move className="w-4 h-4" />
            <span className="hidden sm:inline">Pan</span>
          </button>

          <div className="h-4 w-px bg-surface-800 mx-1 hidden sm:block" />

          {/* REQUIRED CONTROL: Zoom in */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 4.0}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-200 hover:text-white transition-colors text-xs font-semibold border border-surface-700 disabled:opacity-40"
            title="Zoom in (+20%)"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
            <span className="hidden sm:inline">Zoom in</span>
          </button>

          {/* Current Zoom Percentage */}
          <span className="font-mono text-xs text-surface-400 font-bold px-1.5 min-w-[42px] text-center">
            {Math.round(currentZoom * 100)}%
          </span>

          {/* REQUIRED CONTROL: Zoom out */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 0.2}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-200 hover:text-white transition-colors text-xs font-semibold border border-surface-700 disabled:opacity-40"
            title="Zoom out (-20%)"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
            <span className="hidden sm:inline">Zoom out</span>
          </button>

          <div className="h-4 w-px bg-surface-800 mx-1 hidden sm:block" />

          {/* REQUIRED CONTROL: Fit to screen */}
          <button
            type="button"
            onClick={handleFitToScreen}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-200 hover:text-white transition-colors text-xs font-semibold border border-surface-700"
            title="Fit to screen (fit document completely in view)"
            aria-label="Fit to screen"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Fit to screen</span>
          </button>

          {/* REQUIRED CONTROL: Reset zoom */}
          <button
            type="button"
            onClick={handleResetZoom}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-200 hover:text-white transition-colors text-xs font-semibold border border-surface-700"
            title="Reset zoom to expanded 100% view"
            aria-label="Reset zoom"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset zoom</span>
          </button>
        </div>

        {/* Right: REQUIRED CONTROLS: Cancel & Confirm Crop */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* REQUIRED CONTROL: Cancel */}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-white font-semibold text-xs transition-colors border border-surface-700 hover:border-surface-600"
            title="Cancel manual cropping without applying changes"
            aria-label="Cancel"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>

          {/* REQUIRED CONTROL: Confirm Crop */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-bold text-xs shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-50"
            title={`Confirm and update only the ${sideTitle}`}
            aria-label="Confirm Crop"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Confirm Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
};
