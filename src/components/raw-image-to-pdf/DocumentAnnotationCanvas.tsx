/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import type {
  RawDocumentPage,
  AnnotationStroke,
  AnnotationToolType,
  DocumentEnhancementSettings,
  ColorFilterSettings,
  DrawingPoint,
} from "@/types/raw-image-to-pdf";
import {
  getCombinedDocumentFilter,
  renderStrokesToCanvas,
  renderWatermarkToCanvas,
} from "@/lib/raw-image-to-pdf/annotation-engine";

export interface DocumentAnnotationCanvasProps {
  page: RawDocumentPage;
  activeTool: AnnotationToolType;
  eraserSize: number;
  eraserColor: string;
  highlighterSize: number;
  highlighterColor: string;
  highlighterOpacity: number;
  globalEnhancements: DocumentEnhancementSettings;
  globalColorFilter?: ColorFilterSettings;
  onAddStroke: (stroke: AnnotationStroke) => void;
  onToggleApplyGlobalEdits?: (enabled: boolean) => void;
  className?: string;
}

export const DocumentAnnotationCanvas: React.FC<DocumentAnnotationCanvasProps> = ({
  page,
  activeTool,
  eraserSize,
  eraserColor,
  highlighterSize,
  highlighterColor,
  highlighterOpacity,
  globalEnhancements,
  globalColorFilter,
  onAddStroke,
  onToggleApplyGlobalEdits,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);

  // Active Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokePointsRef = useRef<DrawingPoint[]>([]);

  // Viewport Container Dimensions
  const [viewportDims, setViewportDims] = useState<{ width: number; height: number }>({
    width: 800,
    height: 600,
  });

  const [imageLoaded, setImageLoaded] = useState(false);

  // The source image to display: if cropped, prioritize croppedPreviewUrl; otherwise original file
  const [displayUrl, setDisplayUrl] = useState<string>("");
  const isEphemeralUrlRef = useRef(false);

  useEffect(() => {
    if (page.croppedPreviewUrl) {
      setDisplayUrl(page.croppedPreviewUrl);
      isEphemeralUrlRef.current = false;
    } else {
      const url = URL.createObjectURL(page.file);
      setDisplayUrl(url);
      isEphemeralUrlRef.current = true;
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [page.croppedPreviewUrl, page.file]);

  // Determine native dimensions
  const nativeW = page.croppedWidth || page.originalWidth || 1200;
  const nativeH = page.croppedHeight || page.originalHeight || 1600;

  // Track container size
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

  // Compute image placement and scaling (letterbox)
  const layout = useMemo(() => {
    if (viewportDims.width === 0 || viewportDims.height === 0 || nativeW === 0 || nativeH === 0) {
      return { scale: 1, offsetX: 0, offsetY: 0, dispW: 0, dispH: 0 };
    }

    const padding = 20; // 20px padding around canvas
    const availW = Math.max(100, viewportDims.width - padding * 2);
    const availH = Math.max(100, viewportDims.height - padding * 2);

    const scale = Math.min(availW / nativeW, availH / nativeH);
    const dispW = nativeW * scale;
    const dispH = nativeH * scale;
    const offsetX = (viewportDims.width - dispW) / 2;
    const offsetY = (viewportDims.height - dispH) / 2;

    return { scale, offsetX, offsetY, dispW, dispH };
  }, [viewportDims, nativeW, nativeH]);

  // Coordinate Conversion: display screen coords -> native image coords
  const screenToImageCoords = useCallback(
    (screenX: number, screenY: number): DrawingPoint => {
      const imgX = (screenX - layout.offsetX) / layout.scale;
      const imgY = (screenY - layout.offsetY) / layout.scale;

      return {
        x: Math.max(0, Math.min(nativeW, Math.round(imgX))),
        y: Math.max(0, Math.min(nativeH, Math.round(imgY))),
      };
    },
    [layout, nativeW, nativeH]
  );

  // Redraw committed annotations and watermark onto the main annotation canvas
  useEffect(() => {
    const canvas = annotationCanvasRef.current;
    if (!canvas || !imageLoaded) return;

    if (canvas.width !== nativeW || canvas.height !== nativeH) {
      canvas.width = nativeW;
      canvas.height = nativeH;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, nativeW, nativeH);

    // Render committed strokes (eraser and highlighter)
    if (page.annotations && page.annotations.length > 0) {
      renderStrokesToCanvas(ctx, page.annotations);
    }

    // Render watermark if present
    if (page.watermark && page.watermark.enabled) {
      renderWatermarkToCanvas(ctx, page.watermark, nativeW, nativeH);
    }
  }, [page.annotations, page.watermark, nativeW, nativeH, imageLoaded]);

  // Pointer Down (Start drawing)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeTool !== "eraser" && activeTool !== "highlighter") return;
    if (!containerRef.current) return;

    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const rect = containerRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Check if within image bounds
    if (
      screenX < layout.offsetX ||
      screenX > layout.offsetX + layout.dispW ||
      screenY < layout.offsetY ||
      screenY > layout.offsetY + layout.dispH
    ) {
      return;
    }

    const pt = screenToImageCoords(screenX, screenY);
    currentStrokePointsRef.current = [pt];
    setIsDrawing(true);

    // Initial dot draw on live canvas
    const liveCanvas = liveCanvasRef.current;
    if (liveCanvas) {
      if (liveCanvas.width !== nativeW || liveCanvas.height !== nativeH) {
        liveCanvas.width = nativeW;
        liveCanvas.height = nativeH;
      }
      const ctx = liveCanvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, nativeW, nativeH);
        const tempStroke: AnnotationStroke = {
          id: "temp",
          tool: activeTool,
          points: [pt],
          size: activeTool === "eraser" ? eraserSize : highlighterSize,
          color: activeTool === "eraser" ? eraserColor : highlighterColor,
          opacity: activeTool === "eraser" ? 1.0 : highlighterOpacity,
        };
        renderStrokesToCanvas(ctx, [tempStroke]);
      }
    }
  };

  // Pointer Move (Continue drawing)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !containerRef.current) return;
    if (activeTool !== "eraser" && activeTool !== "highlighter") return;

    const rect = containerRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const pt = screenToImageCoords(screenX, screenY);

    currentStrokePointsRef.current.push(pt);

    // Render live stroke
    const liveCanvas = liveCanvasRef.current;
    if (liveCanvas) {
      const ctx = liveCanvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, nativeW, nativeH);
        const tempStroke: AnnotationStroke = {
          id: "temp",
          tool: activeTool,
          points: currentStrokePointsRef.current,
          size: activeTool === "eraser" ? eraserSize : highlighterSize,
          color: activeTool === "eraser" ? eraserColor : highlighterColor,
          opacity: activeTool === "eraser" ? 1.0 : highlighterOpacity,
        };
        renderStrokesToCanvas(ctx, [tempStroke]);
      }
    }
  };

  // Pointer Up (Commit stroke)
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDrawing) return;

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    setIsDrawing(false);

    // Clear live canvas
    const liveCanvas = liveCanvasRef.current;
    if (liveCanvas) {
      const ctx = liveCanvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, nativeW, nativeH);
    }

    if (currentStrokePointsRef.current.length > 0) {
      const completedStroke: AnnotationStroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        tool: activeTool as "eraser" | "highlighter",
        points: [...currentStrokePointsRef.current],
        size: activeTool === "eraser" ? eraserSize : highlighterSize,
        color: activeTool === "eraser" ? eraserColor : highlighterColor,
        opacity: activeTool === "eraser" ? 1.0 : highlighterOpacity,
      };

      onAddStroke(completedStroke);
    }

    currentStrokePointsRef.current = [];
  };

  // Check if current page applies global enhancements and color filters (default true)
  const isGlobalEditsEnabled = page.applyGlobalEdits ?? true;

  // Real-time CSS filter for global enhancements and color filter (only if opted-in)
  const cssFilter = useMemo(
    () =>
      isGlobalEditsEnabled
        ? getCombinedDocumentFilter(globalEnhancements, globalColorFilter)
        : "none",
    [isGlobalEditsEnabled, globalEnhancements, globalColorFilter]
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex-1 w-full h-full bg-slate-950 overflow-hidden flex items-center justify-center select-none touch-none",
        activeTool === "eraser" && "cursor-crosshair",
        activeTool === "highlighter" && "cursor-cell",
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Top Floating Controls: Apply Global Edits Toggle */}
      {onToggleApplyGlobalEdits && (
        <div className="absolute top-3 right-3 z-30 pointer-events-auto">
          <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 shadow-md backdrop-blur-sm text-xs font-medium text-slate-200 cursor-pointer select-none transition-all">
            <input
              type="checkbox"
              checked={isGlobalEditsEnabled}
              onChange={(e) => onToggleApplyGlobalEdits(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
            />
            <span className="text-[11px] sm:text-xs">Apply global edits</span>
          </label>
        </div>
      )}
      {/* Centered Document Stage */}
      {layout.dispW > 0 && layout.dispH > 0 && displayUrl && (
        <div
          className="absolute shadow-2xl rounded-sm overflow-hidden"
          style={{
            left: layout.offsetX,
            top: layout.offsetY,
            width: layout.dispW,
            height: layout.dispH,
          }}
        >
          {/* Base Image Layer (with instantaneous CSS filter enhancements) */}
          <img
            ref={imageRef}
            src={displayUrl}
            alt={page.name}
            className="w-full h-full object-contain pointer-events-none transition-filter duration-75"
            style={{ filter: cssFilter }}
            onLoad={() => setImageLoaded(true)}
          />

          {/* Committed Annotations & Watermark Layer */}
          <canvas
            ref={annotationCanvasRef}
            width={nativeW}
            height={nativeH}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {/* Active Live Stroke Canvas */}
          <canvas
            ref={liveCanvasRef}
            width={nativeW}
            height={nativeH}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        </div>
      )}
    </div>
  );
};
