/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  RotateCcw,
  RotateCw,
  Maximize2,
  Check,
  X,
  Sparkles,
  RefreshCw,
  Sliders,
  Move,
  Info,
  Layers,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type {
  Point2D,
  PerspectiveQuad,
  CornerHandleKey,
  AspectRatioPreset,
  StraightenerSide,
} from "@/types/document-straightener";
import {
  isConvexQuad,
  createDefaultQuad,
  rotatePerspectiveQuad,
  calculateOutputDimensions,
  pointDistance,
} from "@/lib/document/perspective-engine";
import { detectDocumentBoundariesFromImage } from "@/lib/document/perspective-detector";
import { PerspectiveMagnifier } from "./PerspectiveMagnifier";

export interface PerspectiveCropEditorProps {
  side: StraightenerSide;
  sideTitle: string; // e.g. "Front Side" or "Back Side"
  previewUrl: string; // Object URL of source image
  initialQuad?: PerspectiveQuad | null;
  initialRotation?: number;
  initialAspectRatioPreset?: AspectRatioPreset;
  isLoading?: boolean;
  onConfirm: (result: {
    quad: PerspectiveQuad;
    rotation: number;
    aspectRatioPreset: AspectRatioPreset;
  }) => void;
  onCancel: () => void;
  className?: string;
}

export const PerspectiveCropEditor: React.FC<PerspectiveCropEditorProps> = ({
  side,
  sideTitle,
  previewUrl,
  initialQuad,
  initialRotation = 0,
  initialAspectRatioPreset = "auto",
  isLoading = false,
  onConfirm,
  onCancel,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [nativeDims, setNativeDims] = useState<{ width: number; height: number }>({
    width: 1000,
    height: 1000,
  });

  const [rotation, setRotation] = useState<number>(initialRotation);
  const [quad, setQuad] = useState<PerspectiveQuad | null>(initialQuad || null);
  const [aspectPreset, setAspectPreset] = useState<AspectRatioPreset>(initialAspectRatioPreset);
  const [detectionMessage, setDetectionMessage] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Active Drag State
  const [draggingCorner, setDraggingCorner] = useState<CornerHandleKey | null>(null);
  const [dragPointerId, setDragPointerId] = useState<number | null>(null);

  // Container viewport dimensions for coordinate scaling
  const [viewportDims, setViewportDims] = useState<{ width: number; height: number }>({
    width: 800,
    height: 600,
  });

  // Track window/container size
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

  // Load Image Element
  useEffect(() => {
    setImageLoaded(false);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = previewUrl;

    img.onload = async () => {
      imageRef.current = img;
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      setNativeDims({ width: w, height: h });
      setImageLoaded(true);

      // If no initial quad was supplied, run auto-detection or create default
      if (!initialQuad) {
        setIsDetecting(true);
        try {
          const res = await detectDocumentBoundariesFromImage(img);
          if (res.detected) {
            setQuad(res.quad);
            setDetectionMessage(res.message);
          } else {
            setQuad(createDefaultQuad(w, h, 0.12));
            setDetectionMessage(res.message);
          }
        } catch {
          setQuad(createDefaultQuad(w, h, 0.12));
        } finally {
          setIsDetecting(false);
        }
      } else {
        setQuad(initialQuad);
      }
    };

    img.onerror = () => {
      setImageLoaded(false);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [previewUrl, initialQuad]);

  // Compute image placement within viewport (letterboxing / aspect fit)
  const layout = useMemo(() => {
    if (!imageLoaded || viewportDims.width === 0 || viewportDims.height === 0) {
      return { scale: 1, offsetX: 0, offsetY: 0, dispW: 0, dispH: 0 };
    }

    const padding = 24; // Padding around preview
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

  // Handle Dragging
  const handlePointerDown = (corner: CornerHandleKey, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setDraggingCorner(corner);
    setDragPointerId(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingCorner || !quad || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const newPt = displayToImage(screenX, screenY);

    const nextQuad = { ...quad, [draggingCorner]: newPt };

    // Enforce strictly convex, non-self-intersecting quadrilateral
    if (isConvexQuad(nextQuad)) {
      setQuad(nextQuad);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragPointerId !== null) {
      try {
        (e.target as HTMLElement).releasePointerCapture(dragPointerId);
      } catch {}
    }
    setDraggingCorner(null);
    setDragPointerId(null);
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
  };

  // Auto-Detect Trigger
  const handleAutoDetect = async () => {
    if (!imageRef.current) return;
    setIsDetecting(true);
    setDetectionMessage("Analyzing document borders...");
    try {
      const res = await detectDocumentBoundariesFromImage(imageRef.current);
      if (res.detected) {
        // Apply detected quad, rotating if current view is rotated
        if (rotation !== 0) {
          const rotQuad = rotatePerspectiveQuad(res.quad, rotation, nativeDims.width, nativeDims.height);
          setQuad(rotQuad);
        } else {
          setQuad(res.quad);
        }
        setDetectionMessage(res.message);
      } else {
        setDetectionMessage(res.message);
      }
    } catch {
      setDetectionMessage("Automatic detection failed. Use manual corner adjustment.");
    } finally {
      setIsDetecting(false);
    }
  };

  // Reset to default quad
  const handleReset = () => {
    setQuad(createDefaultQuad(currentWidth, currentHeight, 0.1));
    setDetectionMessage("Reset crop boundary to standard inset.");
  };

  // Confirm and Straighten
  const handleConfirm = () => {
    if (!quad || !isConvexQuad(quad)) {
      setDetectionMessage("Please ensure all four corners form a valid, non-overlapping document area.");
      return;
    }

    onConfirm({
      quad,
      rotation,
      aspectRatioPreset: aspectPreset,
    });
  };

  // Output Dimensions calculation for preview badge
  const outputDimensions = useMemo(() => {
    if (!quad) return null;
    return calculateOutputDimensions(quad, aspectPreset);
  }, [quad, aspectPreset]);

  // Active target point for magnifier
  const activeTargetPoint = draggingCorner && quad ? quad[draggingCorner] : null;
  const activeDisplayPoint = draggingCorner && displayQuad ? displayQuad[draggingCorner] : null;

  // Midpoints of quadrilateral edges (for visual capsule markers)
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
        "relative flex flex-col w-full h-[85vh] min-h-[580px] bg-slate-950 text-white rounded-2xl overflow-hidden border border-slate-800 shadow-2xl select-none",
        className
      )}
    >
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-500/30">
              {sideTitle}
            </span>
            <span className="text-sm font-semibold text-slate-200 hidden sm:inline">
              Adjust 4 Document Corners
            </span>
          </div>

          {outputDimensions && (
            <span className="text-xs text-slate-400 font-mono hidden md:inline">
              ({outputDimensions.width} × {outputDimensions.height} px)
            </span>
          )}
        </div>

        {/* Aspect Ratio Preset Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setAspectPreset("auto")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors",
                aspectPreset === "auto"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
              title="Natural aspect ratio calculated from selected quadrilateral"
            >
              Natural
            </button>
            <button
              type="button"
              onClick={() => setAspectPreset("cr80")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors",
                aspectPreset === "cr80"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
              title="ISO ID-1 Standard (85.6 × 53.98 mm) for Aadhaar, PAN, Voter ID"
            >
              ID Card (CR80)
            </button>
            <button
              type="button"
              onClick={() => setAspectPreset("a4")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors hidden sm:inline-block",
                aspectPreset === "a4"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
              title="Standard A4 Document Aspect Ratio (1 : 1.414)"
            >
              A4
            </button>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Cancel"
            aria-label="Cancel crop"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Interactive Cropper Canvas Workspace */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full h-full bg-slate-950 overflow-hidden flex items-center justify-center touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Precision Magnification Loupe Window */}
        <PerspectiveMagnifier
          imageElement={imageRef.current}
          targetPoint={activeTargetPoint}
          displayPoint={activeDisplayPoint}
          activeCorner={draggingCorner}
          isVisible={Boolean(draggingCorner)}
          zoom={3.2}
          size={132}
          containerWidth={viewportDims.width}
          containerHeight={viewportDims.height}
        />

        {/* Informational Message Banner */}
        {detectionMessage && (
          <div className="absolute top-3 inset-x-0 mx-auto max-w-md z-10 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs text-slate-300 text-center shadow-lg backdrop-blur-sm flex items-center justify-center gap-2 pointer-events-none animate-in fade-in duration-150">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">{detectionMessage}</span>
          </div>
        )}

        {/* Image Display */}
        {imageLoaded && (
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
              src={previewUrl}
              alt="Document to Straighten"
              className="w-full h-full object-contain pointer-events-none"
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: "center center",
              }}
            />
          </div>
        )}

        {/* SVG Polygon Overlay & Corner Handles */}
        {displayQuad && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{ width: "100%", height: "100%" }}
          >
            {/* Dark Mask Outside Quadrilateral */}
            <path
              d={`M 0 0 H ${viewportDims.width} V ${viewportDims.height} H 0 Z M ${displayQuad.topLeft.x} ${displayQuad.topLeft.y} L ${displayQuad.topRight.x} ${displayQuad.topRight.y} L ${displayQuad.bottomRight.x} ${displayQuad.bottomRight.y} L ${displayQuad.bottomLeft.x} ${displayQuad.bottomLeft.y} Z`}
              fill="rgba(0, 0, 0, 0.55)"
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

        {/* Edge Midpoint Indicator Capsules (Reference Screenshot Matching) */}
        {edgeMidpoints && (
          <>
            {Object.entries(edgeMidpoints).map(([edgeName, mid]) => (
              <div
                key={edgeName}
                className="absolute z-10 pointer-events-none -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: mid.x,
                  top: mid.y,
                  transform: `translate(-50%, -50%) rotate(${mid.angle}deg)`,
                }}
              >
                <div className="w-6 h-2 rounded-full bg-white border border-blue-500 shadow-sm opacity-90" />
              </div>
            ))}
          </>
        )}

        {/* Draggable Corner Handles */}
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
                  onPointerDown={(e) => handlePointerDown(key, e)}
                  className={cn(
                    "absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing touch-none flex items-center justify-center group",
                    isDragging && "scale-110"
                  )}
                  style={{
                    left: pt.x,
                    top: pt.y,
                    width: 48, // Generous 48px hit area for easy touch manipulation
                    height: 48,
                  }}
                  title={`Drag ${label}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Adjust ${label}`}
                >
                  {/* Outer glow ring when dragging */}
                  {isDragging && (
                    <div className="absolute inset-2 rounded-full bg-blue-500/30 animate-ping pointer-events-none" />
                  )}

                  {/* Corner Target Visual Circle (CamScanner / Reference Style) */}
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-transform shadow-md flex items-center justify-center",
                      isDragging
                        ? "bg-white border-blue-600 scale-125 ring-4 ring-blue-500/50"
                        : "bg-blue-500 border-white hover:scale-115 group-hover:ring-2 group-hover:ring-blue-400"
                    )}
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        isDragging ? "bg-blue-600" : "bg-white"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* 3. Bottom Action Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-t border-slate-800 z-20">
        {/* Left: Rotate & Reset Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleRotate("ccw")}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 active:bg-slate-700 transition-colors border border-slate-800"
            title="Rotate 90° Counter-Clockwise"
            aria-label="Rotate CCW"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleRotate("cw")}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 active:bg-slate-700 transition-colors border border-slate-800"
            title="Rotate 90° Clockwise"
            aria-label="Rotate CW"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleAutoDetect}
            disabled={isDetecting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800 disabled:opacity-50"
            title="Automatically detect card edges"
          >
            <Sparkles className={cn("w-3.5 h-3.5 text-blue-400", isDetecting && "animate-spin")} />
            <span className="hidden sm:inline">Auto-Detect</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors border border-slate-800"
            title="Reset crop corners"
            aria-label="Reset corners"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Cancel & Confirm Straightening */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || !quad}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-md shadow-blue-600/30 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>Straighten & Confirm</span>
          </button>
        </div>
      </div>
    </div>
  );
};
