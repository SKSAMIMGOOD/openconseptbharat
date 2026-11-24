/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  RotateCcw,
  RotateCw,
  Sparkles,
  RefreshCw,
  Check,
  Undo2,
  Redo2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type {
  Point2D,
  PerspectiveQuad,
  CornerHandleKey,
  EdgeHandleKey,
  AspectRatioPreset,
  RawDocumentPage,
} from "@/types/raw-image-to-pdf";
import {
  isConvexQuad,
  createDefaultQuad,
  rotatePerspectiveQuad,
  calculateOutputDimensions,
  warpPerspectiveCanvas,
} from "@/lib/document/perspective-engine";
import { detectDocumentBoundariesFromImage } from "@/lib/document/perspective-detector";
import { PerspectiveMagnifier } from "@/components/document-straightener/PerspectiveMagnifier";
import { releaseCanvasBuffer } from "@/lib/utils/memory";
import { translateQuadEdge } from "@/lib/raw-image-to-pdf/edge-geometry";

const quadsEqual = (q1: PerspectiveQuad | null, q2: PerspectiveQuad | null): boolean => {
  if (!q1 || !q2) return false;
  return (
    q1.topLeft.x === q2.topLeft.x &&
    q1.topLeft.y === q2.topLeft.y &&
    q1.topRight.x === q2.topRight.x &&
    q1.topRight.y === q2.topRight.y &&
    q1.bottomRight.x === q2.bottomRight.x &&
    q1.bottomRight.y === q2.bottomRight.y &&
    q1.bottomLeft.x === q2.bottomLeft.x &&
    q1.bottomLeft.y === q2.bottomLeft.y
  );
};

export interface RawImageCropEditorProps {
  page: RawDocumentPage;
  pageIndex: number;
  totalPages: number;
  onConfirmCrop: (cropResult: {
    quad: PerspectiveQuad;
    rotation: number;
    aspectRatioPreset: AspectRatioPreset;
    croppedBlob: Blob;
    croppedPreviewUrl: string;
    width: number;
    height: number;
  }) => Promise<void> | void;
  onConfirmOriginal?: () => void;
  onResetCrop?: () => void;
  onCancel: () => void;
  className?: string;
}

export const RawImageCropEditor: React.FC<RawImageCropEditorProps> = ({
  page,
  pageIndex,
  totalPages,
  onConfirmCrop,
  onConfirmOriginal,
  onResetCrop,
  onCancel,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Ephemeral Object URL created strictly for the duration this page is being edited
  const [ephemeralUrl, setEphemeralUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isWarping, setIsWarping] = useState(false);

  const [nativeDims, setNativeDims] = useState<{ width: number; height: number }>({
    width: page.originalWidth || 1200,
    height: page.originalHeight || 1600,
  });

  const [rotation, setRotation] = useState<number>(page.cropConfig?.rotation || page.rotation || 0);
  const [quad, setQuad] = useState<PerspectiveQuad | null>(page.cropConfig?.quad || null);
  const [aspectPreset, setAspectPreset] = useState<AspectRatioPreset>(
    page.cropConfig?.aspectRatioPreset || "auto"
  );
  const [detectionMessage, setDetectionMessage] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Quad History Stack for Undo / Redo
  const [quadHistory, setQuadHistory] = useState<PerspectiveQuad[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex >= 0 && historyIndex < quadHistory.length - 1;

  const pushQuadHistory = useCallback(
    (newQuad: PerspectiveQuad) => {
      setQuadHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, newQuad];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevQuad = quadHistory[historyIndex - 1];
      setQuad(prevQuad);
      setHistoryIndex((prev) => prev - 1);
    }
  }, [historyIndex, quadHistory]);

  const handleRedo = useCallback(() => {
    if (historyIndex < quadHistory.length - 1) {
      const nextQuad = quadHistory[historyIndex + 1];
      setQuad(nextQuad);
      setHistoryIndex((prev) => prev + 1);
    }
  }, [historyIndex, quadHistory]);

  // Active Drag State: Corner Handle vs Edge Midpoint Handle
  const [draggingCorner, setDraggingCorner] = useState<CornerHandleKey | null>(null);
  const [draggingEdge, setDraggingEdge] = useState<EdgeHandleKey | null>(null);
  const [dragPointerId, setDragPointerId] = useState<number | null>(null);

  // Track drag starting coordinates and baseline quad for smooth edge delta calculations
  const dragStartPointerRef = useRef<Point2D | null>(null);
  const dragStartQuadRef = useRef<PerspectiveQuad | null>(null);

  // Container viewport dimensions for coordinate scaling
  const [viewportDims, setViewportDims] = useState<{ width: number; height: number }>({
    width: 800,
    height: 600,
  });

  // Track ephemeral URL creation and guaranteed cleanup on unmount or page change
  useEffect(() => {
    const url = URL.createObjectURL(page.file);
    setEphemeralUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [page.file]);

  // Update container size on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setViewportDims({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Effective dimensions accounting for rotation (90 or 270 deg swaps width & height)
  const isRotated90or270 = rotation % 180 !== 0;
  const currentWidth = isRotated90or270 ? nativeDims.height : nativeDims.width;
  const currentHeight = isRotated90or270 ? nativeDims.width : nativeDims.height;

  // Load Image Element when ephemeralUrl is ready
  useEffect(() => {
    if (!ephemeralUrl) return;

    setImageLoaded(false);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = ephemeralUrl;

    img.onload = async () => {
      imageRef.current = img;
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      setNativeDims({ width: w, height: h });
      setImageLoaded(true);

      // If page already has a saved crop configuration, preserve it!
      if (page.cropConfig) {
        setQuad(page.cropConfig.quad);
        setQuadHistory([page.cropConfig.quad]);
        setHistoryIndex(0);
        setRotation(page.cropConfig.rotation);
        setAspectPreset(page.cropConfig.aspectRatioPreset);
        setDetectionMessage("Restored previous crop settings. Adjust any corner or edge as needed.");
      } else {
        // Run auto-detection on initial edit
        setIsDetecting(true);
        setDetectionMessage("Detecting document borders...");
        try {
          const res = await detectDocumentBoundariesFromImage(img);
          const initialQuad = res.detected ? res.quad : createDefaultQuad(w, h, 0.08);
          setQuad(initialQuad);
          setQuadHistory([initialQuad]);
          setHistoryIndex(0);
          setDetectionMessage(res.message);
        } catch {
          const initialQuad = createDefaultQuad(w, h, 0.08);
          setQuad(initialQuad);
          setQuadHistory([initialQuad]);
          setHistoryIndex(0);
          setDetectionMessage("Position the 4 corners or 4 edges to frame your document.");
        } finally {
          setIsDetecting(false);
        }
      }
    };

    img.onerror = () => {
      setImageLoaded(false);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [ephemeralUrl, page.cropConfig]);

  // Compute image placement within viewport (letterboxing / aspect fit)
  const layout = useMemo(() => {
    if (!imageLoaded || viewportDims.width === 0 || viewportDims.height === 0) {
      return { scale: 1, offsetX: 0, offsetY: 0, dispW: 0, dispH: 0 };
    }

    const padding = 20; // 20px padding around canvas
    const availW = Math.max(100, viewportDims.width - padding * 2);
    const availH = Math.max(100, viewportDims.height - padding * 2);

    const scale = Math.min(availW / currentWidth, availH / currentHeight);
    const dispW = currentWidth * scale;
    const dispH = currentHeight * scale;
    const offsetX = (viewportDims.width - dispW) / 2;
    const offsetY = (viewportDims.height - dispH) / 2;

    return { scale, offsetX, offsetY, dispW, dispH };
  }, [imageLoaded, viewportDims, currentWidth, currentHeight]);

  // Coordinate Conversion Helpers
  const imageToDisplay = useCallback(
    (pt: Point2D): Point2D => {
      return {
        x: pt.x * layout.scale + layout.offsetX,
        y: pt.y * layout.scale + layout.offsetY,
      };
    },
    [layout]
  );

  const displayToImage = useCallback(
    (screenX: number, screenY: number): Point2D => {
      const imgX = (screenX - layout.offsetX) / layout.scale;
      const imgY = (screenY - layout.offsetY) / layout.scale;

      return {
        x: Math.max(0, Math.min(currentWidth, Math.round(imgX))),
        y: Math.max(0, Math.min(currentHeight, Math.round(imgY))),
      };
    },
    [layout, currentWidth, currentHeight]
  );

  // Active quad corners in display coordinates
  const displayQuad = useMemo(() => {
    if (!quad) return null;
    return {
      topLeft: imageToDisplay(quad.topLeft),
      topRight: imageToDisplay(quad.topRight),
      bottomRight: imageToDisplay(quad.bottomRight),
      bottomLeft: imageToDisplay(quad.bottomLeft),
    };
  }, [quad, imageToDisplay]);

  // Handle Corner Dragging
  const handleCornerPointerDown = (corner: CornerHandleKey, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (quad) {
      dragStartQuadRef.current = { ...quad };
    }

    setDraggingCorner(corner);
    setDraggingEdge(null);
    setDragPointerId(e.pointerId);
  };

  // Handle Edge Midpoint Dragging
  const handleEdgePointerDown = (edge: EdgeHandleKey, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const startPt = displayToImage(screenX, screenY);
      dragStartPointerRef.current = startPt;
    }

    if (quad) {
      dragStartQuadRef.current = { ...quad };
    }

    setDraggingEdge(edge);
    setDraggingCorner(null);
    setDragPointerId(e.pointerId);
  };

  // Pointer Move (Dispatches to corner drag or edge drag)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current || !quad) return;

    const rect = containerRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const currentPt = displayToImage(screenX, screenY);

    // 1. Moving an individual corner handle
    if (draggingCorner) {
      const nextQuad = { ...quad, [draggingCorner]: currentPt };
      if (isConvexQuad(nextQuad)) {
        setQuad(nextQuad);
      }
      return;
    }

    // 2. Moving an edge midpoint handle
    if (draggingEdge && dragStartQuadRef.current && dragStartPointerRef.current) {
      const startPt = dragStartPointerRef.current;
      const startQuad = dragStartQuadRef.current;
      const deltaX = currentPt.x - startPt.x;
      const deltaY = currentPt.y - startPt.y;

      const nextQuad = translateQuadEdge({
        startQuad,
        edge: draggingEdge,
        deltaX,
        deltaY,
        imageWidth: currentWidth,
        imageHeight: currentHeight,
      });

      setQuad(nextQuad);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragPointerId !== null) {
      try {
        (e.target as HTMLElement).releasePointerCapture(dragPointerId);
      } catch {}
    }

    // Record quad in undo/redo history if coordinates changed during drag
    if (quad && dragStartQuadRef.current && !quadsEqual(quad, dragStartQuadRef.current)) {
      pushQuadHistory(quad);
    }

    setDraggingCorner(null);
    setDraggingEdge(null);
    setDragPointerId(null);
    dragStartPointerRef.current = null;
    dragStartQuadRef.current = null;
  };

  // Rotation Actions
  const handleRotate = (dir: "cw" | "ccw") => {
    if (!quad) return;
    const delta = dir === "cw" ? 90 : 270;
    const newRot = (rotation + delta) % 360;

    // Rotate quad coordinates to match new orientation
    const rotated = rotatePerspectiveQuad(quad, delta, currentWidth, currentHeight);
    setRotation(newRot);
    setQuad(rotated);
    pushQuadHistory(rotated);
  };

  // Auto-Detect Trigger
  const handleAutoDetect = async () => {
    if (!imageRef.current) return;
    setIsDetecting(true);
    setDetectionMessage("Analyzing document borders...");
    try {
      const res = await detectDocumentBoundariesFromImage(imageRef.current);
      if (res.detected) {
        let newQuad = res.quad;
        if (rotation !== 0) {
          newQuad = rotatePerspectiveQuad(res.quad, rotation, nativeDims.width, nativeDims.height);
        }
        setQuad(newQuad);
        pushQuadHistory(newQuad);
        setDetectionMessage(res.message);
      } else {
        setDetectionMessage(res.message);
      }
    } catch {
      setDetectionMessage("Boundary detection could not find distinct edges. Adjust manually.");
    } finally {
      setIsDetecting(false);
    }
  };

  // Reset to default quad inset
  const handleResetQuad = () => {
    const defaultQuad = createDefaultQuad(currentWidth, currentHeight, 0.08);
    setQuad(defaultQuad);
    pushQuadHistory(defaultQuad);
    setDetectionMessage("Reset crop boundary to standard inset.");
  };

  // Output Dimensions calculation for preview badge
  const outputDimensions = useMemo(() => {
    if (!quad) return null;
    return calculateOutputDimensions(quad, aspectPreset);
  }, [quad, aspectPreset]);

  // Execute full-resolution perspective warp and confirm
  const handleConfirm = async () => {
    if (!quad || !imageRef.current) return;

    if (!isConvexQuad(quad)) {
      setDetectionMessage("Please ensure all four corners form a valid non-overlapping document area.");
      return;
    }

    setIsWarping(true);
    setDetectionMessage("Straightening perspective at full resolution...");

    try {
      const img = imageRef.current;
      const isRotated = rotation % 360 !== 0;
      let sourceCanvas: HTMLCanvasElement | HTMLImageElement = img;

      // If rotation is applied, draw rotated image to an offscreen canvas
      if (isRotated) {
        const normRot = ((rotation % 360) + 360) % 360;
        const is90or270 = normRot === 90 || normRot === 270;
        const rotW = is90or270 ? img.naturalHeight : img.naturalWidth;
        const rotH = is90or270 ? img.naturalWidth : img.naturalHeight;

        const canvas = document.createElement("canvas");
        canvas.width = rotW;
        canvas.height = rotH;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not create intermediate canvas");

        ctx.translate(rotW / 2, rotH / 2);
        ctx.rotate((normRot * Math.PI) / 180);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

        sourceCanvas = canvas;
      }

      // Compute target output dimensions
      const outDims = calculateOutputDimensions(quad, aspectPreset);

      // Perform perspective warp
      const warpResult = await warpPerspectiveCanvas(
        sourceCanvas,
        quad,
        outDims.width,
        outDims.height,
        "image/png"
      );

      // Clean up intermediate rotated canvas if one was created
      if (sourceCanvas instanceof HTMLCanvasElement) {
        releaseCanvasBuffer(sourceCanvas);
      }

      await onConfirmCrop({
        quad,
        rotation,
        aspectRatioPreset: aspectPreset,
        croppedBlob: warpResult.blob,
        croppedPreviewUrl: warpResult.previewUrl,
        width: outDims.width,
        height: outDims.height,
      });
    } catch (err: any) {
      setDetectionMessage(err?.message || "Failed to straighten document.");
    } finally {
      setIsWarping(false);
    }
  };

  // Active target point for magnifier: supports either corner or edge midpoint
  const activeTargetPoint = useMemo((): Point2D | null => {
    if (draggingCorner && quad) {
      return quad[draggingCorner];
    }
    if (draggingEdge && quad) {
      if (draggingEdge === "top") {
        return {
          x: (quad.topLeft.x + quad.topRight.x) / 2,
          y: (quad.topLeft.y + quad.topRight.y) / 2,
        };
      }
      if (draggingEdge === "bottom") {
        return {
          x: (quad.bottomLeft.x + quad.bottomRight.x) / 2,
          y: (quad.bottomLeft.y + quad.bottomRight.y) / 2,
        };
      }
      if (draggingEdge === "left") {
        return {
          x: (quad.topLeft.x + quad.bottomLeft.x) / 2,
          y: (quad.topLeft.y + quad.bottomLeft.y) / 2,
        };
      }
      if (draggingEdge === "right") {
        return {
          x: (quad.topRight.x + quad.bottomRight.x) / 2,
          y: (quad.topRight.y + quad.bottomRight.y) / 2,
        };
      }
    }
    return null;
  }, [draggingCorner, draggingEdge, quad]);

  const activeDisplayPoint = useMemo((): Point2D | null => {
    if (!activeTargetPoint) return null;
    return imageToDisplay(activeTargetPoint);
  }, [activeTargetPoint, imageToDisplay]);

  // Midpoints of quadrilateral edges for positioning the 4 pill-shaped handles
  const edgeMidpoints = useMemo(() => {
    if (!displayQuad) return null;
    return {
      top: {
        x: (displayQuad.topLeft.x + displayQuad.topRight.x) / 2,
        y: (displayQuad.topLeft.y + displayQuad.topRight.y) / 2,
        angle:
          (Math.atan2(
            displayQuad.topRight.y - displayQuad.topLeft.y,
            displayQuad.topRight.x - displayQuad.topLeft.x
          ) *
            180) /
          Math.PI,
      },
      right: {
        x: (displayQuad.topRight.x + displayQuad.bottomRight.x) / 2,
        y: (displayQuad.topRight.y + displayQuad.bottomRight.y) / 2,
        angle:
          (Math.atan2(
            displayQuad.bottomRight.y - displayQuad.topRight.y,
            displayQuad.bottomRight.x - displayQuad.topRight.x
          ) *
            180) /
          Math.PI,
      },
      bottom: {
        x: (displayQuad.bottomRight.x + displayQuad.bottomLeft.x) / 2,
        y: (displayQuad.bottomRight.y + displayQuad.bottomLeft.y) / 2,
        angle:
          (Math.atan2(
            displayQuad.bottomLeft.y - displayQuad.bottomRight.y,
            displayQuad.bottomLeft.x - displayQuad.bottomRight.x
          ) *
            180) /
          Math.PI,
      },
      left: {
        x: (displayQuad.bottomLeft.x + displayQuad.topLeft.x) / 2,
        y: (displayQuad.bottomLeft.y + displayQuad.topLeft.y) / 2,
        angle:
          (Math.atan2(
            displayQuad.topLeft.y - displayQuad.bottomLeft.y,
            displayQuad.topLeft.x - displayQuad.bottomLeft.x
          ) *
            180) /
          Math.PI,
      },
    };
  }, [displayQuad]);

  return (
    <div
      className={cn(
        "relative flex flex-col w-full h-full bg-slate-950 text-white select-none overflow-hidden",
        className
      )}
    >
      {/* 1. Streamlined Compact Header Controls Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-900 border-b border-slate-800 z-20 shrink-0">
        {/* Left: Essential Geometry Tools (Auto Detect, Reset, Undo, Redo) */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Auto-Detect */}
          <button
            type="button"
            onClick={handleAutoDetect}
            disabled={isDetecting || !imageLoaded}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors disabled:opacity-40"
            title="Auto-detect document edges"
          >
            {isDetecting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span className="hidden xs:inline">Auto Detect</span>
          </button>

          {/* Reset Quad */}
          <button
            type="button"
            onClick={handleResetQuad}
            disabled={!imageLoaded}
            className="px-2 sm:px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-40"
            title="Reset crop boundary to standard inset"
          >
            Reset
          </button>

          <div className="h-4 w-[1px] bg-slate-800 mx-0.5 sm:mx-1" />

          {/* Undo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-30 disabled:hover:bg-slate-800"
            title="Undo boundary adjustment"
            aria-label="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          {/* Redo */}
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-30 disabled:hover:bg-slate-800"
            title="Redo boundary adjustment"
            aria-label="Redo"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Rotations (CCW & CW) */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => handleRotate("ccw")}
            disabled={!imageLoaded}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-40"
            title="Rotate 90° Counter-Clockwise"
            aria-label="Rotate CCW"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => handleRotate("cw")}
            disabled={!imageLoaded}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-40"
            title="Rotate 90° Clockwise"
            aria-label="Rotate CW"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Interactive Canvas Workspace */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-0 w-full h-full bg-slate-950 overflow-hidden flex items-center justify-center touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Precision Magnification Loupe Window */}
        <PerspectiveMagnifier
          imageElement={imageRef.current}
          targetPoint={activeTargetPoint}
          displayPoint={activeDisplayPoint}
          activeCorner={draggingCorner}
          isVisible={Boolean(draggingCorner || draggingEdge)}
          zoom={3.2}
          size={132}
          containerWidth={viewportDims.width}
          containerHeight={viewportDims.height}
        />

        {/* Loading overlay when initial image is loading */}
        {!imageLoaded && (
          <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-xs">Preparing document for perspective cropping...</span>
          </div>
        )}

        {/* Image Display */}
        {imageLoaded && ephemeralUrl && (
          <div
            className="absolute transition-transform duration-100 ease-out"
            style={{
              left: layout.offsetX,
              top: layout.offsetY,
              width: layout.dispW,
              height: layout.dispH,
            }}
          >
            <img
              src={ephemeralUrl}
              alt={page.name}
              className="w-full h-full object-contain pointer-events-none"
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: "center center",
              }}
            />
          </div>
        )}

        {/* SVG Polygon Overlay & Connecting Boundary Lines */}
        {displayQuad && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{ width: "100%", height: "100%" }}
          >
            {/* Dark Mask Outside Quadrilateral */}
            <path
              d={`M 0 0 H ${viewportDims.width} V ${viewportDims.height} H 0 Z M ${displayQuad.topLeft.x} ${displayQuad.topLeft.y} L ${displayQuad.topRight.x} ${displayQuad.topRight.y} L ${displayQuad.bottomRight.x} ${displayQuad.bottomRight.y} L ${displayQuad.bottomLeft.x} ${displayQuad.bottomLeft.y} Z`}
              fill="rgba(0, 0, 0, 0.6)"
              fillRule="evenodd"
            />

            {/* Connecting Cyan/Blue Document Boundary Lines */}
            <polygon
              points={`${displayQuad.topLeft.x},${displayQuad.topLeft.y} ${displayQuad.topRight.x},${displayQuad.topRight.y} ${displayQuad.bottomRight.x},${displayQuad.bottomRight.y} ${displayQuad.bottomLeft.x},${displayQuad.bottomLeft.y}`}
              fill="rgba(59, 130, 246, 0.08)"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {/* 4 Interactive Edge Midpoint Handles (Pill-shaped) */}
        {edgeMidpoints && (
          <>
            {(
              [
                { edge: "top", mid: edgeMidpoints.top, title: "Drag top edge vertically (up/down)" },
                { edge: "bottom", mid: edgeMidpoints.bottom, title: "Drag bottom edge vertically (up/down)" },
                { edge: "left", mid: edgeMidpoints.left, title: "Drag left edge horizontally (left/right)" },
                { edge: "right", mid: edgeMidpoints.right, title: "Drag right edge horizontally (left/right)" },
              ] as const
            ).map(({ edge, mid, title }) => {
              const isDragging = draggingEdge === edge;
              const isVerticalMove = edge === "top" || edge === "bottom";

              return (
                <div
                  key={edge}
                  onPointerDown={(e) => handleEdgePointerDown(edge, e)}
                  className={cn(
                    "absolute z-20 -translate-x-1/2 -translate-y-1/2 touch-none flex items-center justify-center group select-none",
                    isVerticalMove ? "cursor-ns-resize" : "cursor-ew-resize",
                    isDragging && "scale-125"
                  )}
                  style={{
                    left: mid.x,
                    top: mid.y,
                    width: 44, // Generous 44px hit-box for easy finger/mouse acquisition
                    height: 44,
                  }}
                  title={title}
                  aria-label={title}
                >
                  {/* Visually distinct pill-shaped handle matching blue theme */}
                  <div
                    className={cn(
                      "rounded-full border-2 transition-all duration-100 shadow-md flex items-center justify-center",
                      isVerticalMove ? "w-7 h-2.5" : "w-2.5 h-7",
                      isDragging
                        ? "bg-blue-600 border-white ring-4 ring-blue-500/50 scale-110"
                        : "bg-white border-blue-600 hover:bg-blue-50 hover:border-blue-500 group-hover:scale-110 group-hover:ring-2 group-hover:ring-blue-400/60"
                    )}
                  >
                    {/* Inner accent indicator line */}
                    <div
                      className={cn(
                        "rounded-full transition-colors",
                        isVerticalMove ? "w-3 h-0.5" : "w-0.5 h-3",
                        isDragging ? "bg-white" : "bg-blue-600"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* 4 Draggable Corner Handles */}
        {displayQuad && (
          <>
            {(
              [
                { key: "topLeft", pt: displayQuad.topLeft, label: "Top Left" },
                { key: "topRight", pt: displayQuad.topRight, label: "Top Right" },
                { key: "bottomRight", pt: displayQuad.bottomRight, label: "Bottom Right" },
                { key: "bottomLeft", pt: displayQuad.bottomLeft, label: "Bottom Left" },
              ] as const
            ).map(({ key, pt, label }) => {
              const isDragging = draggingCorner === key;

              return (
                <div
                  key={key}
                  onPointerDown={(e) => handleCornerPointerDown(key, e)}
                  className={cn(
                    "absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing touch-none flex items-center justify-center group select-none",
                    isDragging && "scale-110"
                  )}
                  style={{
                    left: pt.x,
                    top: pt.y,
                    width: 48,
                    height: 48,
                  }}
                  title={`Drag ${label} corner`}
                  aria-label={`Drag ${label} corner`}
                >
                  {/* Outer Pulsing Ring */}
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full border-2 border-white flex items-center justify-center transition-all duration-100 shadow-md",
                      isDragging
                        ? "bg-blue-600 scale-125 ring-4 ring-blue-500/50"
                        : "bg-blue-500 hover:scale-110 hover:bg-blue-600 group-hover:ring-2 group-hover:ring-white/80"
                    )}
                  >
                    <div className="w-2 h-2 rounded-full bg-white shadow-2xs" />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* 3. Compact Bottom Action Bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3 bg-slate-900 border-t border-slate-800 z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-white whitespace-nowrap">
            Page {pageIndex + 1}/{totalPages}
          </span>

          {outputDimensions && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
              {outputDimensions.width} × {outputDimensions.height} px
            </span>
          )}

          {page.isCropped && onResetCrop && (
            <button
              type="button"
              onClick={onResetCrop}
              disabled={isWarping}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 hover:underline shrink-0"
              title="Discard crop and restore original raw image"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden xs:inline">Discard Crop</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onConfirmOriginal && (
            <button
              type="button"
              onClick={onConfirmOriginal}
              disabled={isWarping || !imageLoaded}
              className="px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors cursor-pointer"
              title="Use original uncropped image for this page"
            >
              Keep Original
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            disabled={isWarping}
            className="px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isWarping || !imageLoaded}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            {isWarping ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden xs:inline">Straightening...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Apply Crop</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
