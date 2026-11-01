"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Move,
  Info,
} from "lucide-react";
import { ImageDimensions } from "@/types/image-engine";
import { cn } from "@/lib/utils/cn";

export interface ImagePreviewProps {
  imageSource: CanvasImageSource | string | null;
  dimensions?: ImageDimensions;
  fileSize?: number;
  fileName?: string;
  className?: string;
  showHud?: boolean;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  imageSource,
  dimensions,
  fileSize,
  fileName,
  className,
  showHud = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Calculate fit zoom based on container and image aspect bounds
  const calculateFitZoom = useCallback(() => {
    if (!containerRef.current || !dimensions) return 1;
    const container = containerRef.current;
    const padding = 32;
    const availW = Math.max(10, container.clientWidth - padding);
    const availH = Math.max(10, container.clientHeight - padding);

    const scaleW = availW / dimensions.width;
    const scaleH = availH / dimensions.height;
    return Math.min(scaleW, scaleH, 1);
  }, [dimensions]);

  // Fit to screen on initial load or dimension update
  useEffect(() => {
    if (dimensions) {
      const fit = calculateFitZoom();
      setZoom(fit);
      setPan({ x: 0, y: 0 });
    }
  }, [dimensions, calculateFitZoom]);

  // Render image onto canvas
  useEffect(() => {
    let isCancelled = false;
    const canvas = canvasRef.current;
    if (!canvas || !imageSource) return;

    if (dimensions) {
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (typeof imageSource === "string") {
      const img = new Image();
      img.onload = () => {
        if (!isCancelled && canvasRef.current) {
          if (!dimensions && img.naturalWidth) {
            canvasRef.current.width = img.naturalWidth;
            canvasRef.current.height = img.naturalHeight;
          }
          ctx.drawImage(img, 0, 0);
        }
      };
      img.src = imageSource;
    } else {
      ctx.drawImage(imageSource, 0, 0);
    }

    return () => {
      isCancelled = true;
    };
  }, [imageSource, dimensions]);

  // Zoom In / Out Handlers
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(5, Math.round((prev + 0.25) * 100) / 100));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.1, Math.round((prev - 0.25) * 100) / 100));
  };

  const handleFitScreen = () => {
    const fit = calculateFitZoom();
    setZoom(fit);
    setPan({ x: 0, y: 0 });
  };

  const handleResetZoom = () => {
    const fit = calculateFitZoom();
    setZoom(fit);
    setPan({ x: 0, y: 0 });
  };

  const handleActualSize = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    setIsPanning(true);
    startPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - startPanRef.current.x,
      y: e.clientY - startPanRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Touch pan handlers for mobile support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      const touch = e.touches[0];
      startPanRef.current = { x: touch.clientX - pan.x, y: touch.clientY - pan.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPanning || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - startPanRef.current.x,
      y: touch.clientY - startPanRef.current.y,
    });
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  // Format bytes helper for HUD
  const formatBytes = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-[400px] sm:h-[480px] bg-surface-100 rounded-2xl border border-surface-200 overflow-hidden flex items-center justify-center select-none shadow-inner touch-none",
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        cursor: isPanning ? "grabbing" : zoom > calculateFitZoom() ? "grab" : "default",
      }}
    >
      {/* Transparency Checkerboard Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] [background-size:16px_16px] [background-position:0_0,0_8px,8px_-8px,-8px_0px] opacity-60 pointer-events-none" />

      {/* Render Canvas */}
      {imageSource ? (
        <div
          className="transition-transform duration-75 origin-center will-change-transform shadow-card rounded-lg"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <canvas ref={canvasRef} className="block max-w-none" />
        </div>
      ) : (
        <div className="relative z-10 text-center text-surface-400 p-6">
          <Move className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-xs font-medium">No image loaded into preview viewport</p>
        </div>
      )}

      {/* Top Floating Control Bar */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-xl border border-surface-200 shadow-sm text-surface-700">
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={!imageSource || zoom <= 0.15}
          className="p-1.5 rounded-lg hover:bg-surface-100 disabled:opacity-40 transition-colors"
          title="Zoom Out (-25%)"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-[11px] font-mono px-2 min-w-[50px] text-center font-semibold text-surface-800">
          {Math.round(zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={handleZoomIn}
          disabled={!imageSource || zoom >= 5}
          className="p-1.5 rounded-lg hover:bg-surface-100 disabled:opacity-40 transition-colors"
          title="Zoom In (+25%)"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-surface-200 mx-1" />

        <button
          type="button"
          onClick={handleFitScreen}
          disabled={!imageSource}
          className="p-1.5 rounded-lg hover:bg-surface-100 disabled:opacity-40 transition-colors text-xs font-medium"
          title="Fit to Screen"
          aria-label="Fit to Screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleResetZoom}
          disabled={!imageSource}
          className="p-1.5 rounded-lg hover:bg-surface-100 disabled:opacity-40 transition-colors"
          title="Reset Zoom"
          aria-label="Reset Zoom"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleActualSize}
          disabled={!imageSource}
          className="px-2 py-1 rounded-lg hover:bg-surface-100 disabled:opacity-40 transition-colors text-[10px] font-mono font-bold"
          title="1:1 Actual Pixels"
          aria-label="1:1 Actual Pixels"
        >
          100%
        </button>
      </div>

      {/* Bottom Floating Metadata HUD */}
      {showHud && dimensions && (
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-surface-200 shadow-sm text-[11px] text-surface-600 font-mono flex-wrap">
          <Info className="w-3.5 h-3.5 text-brand-600 shrink-0" />
          <span>
            {dimensions.width} × {dimensions.height} px
          </span>
          <span className="text-surface-300">•</span>
          <span>Ratio: {dimensions.aspectRatio.toFixed(2)}:1</span>
          {fileSize !== undefined && (
            <>
              <span className="text-surface-300">•</span>
              <span>{formatBytes(fileSize)}</span>
            </>
          )}
          {fileName && (
            <>
              <span className="text-surface-300 hidden sm:inline">•</span>
              <span className="hidden sm:inline truncate max-w-[150px]">{fileName}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
