"use client";

import React, { useRef, useEffect } from "react";
import type { Point2D, CornerHandleKey } from "@/types/document-straightener";

export interface PerspectiveMagnifierProps {
  imageElement: HTMLImageElement | null;
  targetPoint: Point2D | null; // In source native image coordinates
  displayPoint: Point2D | null; // In viewport display coordinates
  activeCorner: CornerHandleKey | null;
  isVisible: boolean;
  zoom?: number; // e.g. 3.0
  size?: number; // Diameter in pixels (e.g. 128)
  containerWidth?: number;
  containerHeight?: number;
}

export const PerspectiveMagnifier: React.FC<PerspectiveMagnifierProps> = ({
  imageElement,
  targetPoint,
  displayPoint,
  activeCorner,
  isVisible,
  zoom = 3.0,
  size = 128,
  containerWidth = 800,
  containerHeight = 600,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Determine smart position: default to top-left.
  // If the finger / corner is in the top-left area, move loupe to top-right.
  const isTargetInTopLeft =
    displayPoint &&
    displayPoint.x < containerWidth * 0.45 &&
    displayPoint.y < containerHeight * 0.45;

  const positionClasses = isTargetInTopLeft
    ? "top-4 right-4"
    : "top-4 left-4";

  useEffect(() => {
    if (!isVisible || !imageElement || !targetPoint || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 2 : 2;
    const canvasSize = size * dpr;

    if (canvas.width !== canvasSize || canvas.height !== canvasSize) {
      canvas.width = canvasSize;
      canvas.height = canvasSize;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    // 1. Circular clipping mask
    const radius = size / 2;
    ctx.beginPath();
    ctx.arc(radius, radius, radius - 1, 0, Math.PI * 2);
    ctx.clip();

    // 2. High-resolution source slice
    const srcRadius = radius / zoom;
    const sx = targetPoint.x - srcRadius;
    const sy = targetPoint.y - srcRadius;
    const sWidth = srcRadius * 2;
    const sHeight = srcRadius * 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Fill neutral background in case sampled region extends beyond image
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, size, size);

    // Draw full resolution original image pixels
    ctx.drawImage(imageElement, sx, sy, sWidth, sHeight, 0, 0, size, size);

    // 3. Draw Crosshair (+) centered at (radius, radius)
    const crossHairSize = 14; // Line half-length
    const center = radius;

    // Crosshair shadow / outline for visibility over any background
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    // Horizontal
    ctx.moveTo(center - crossHairSize - 1, center);
    ctx.lineTo(center + crossHairSize + 1, center);
    // Vertical
    ctx.moveTo(center, center - crossHairSize - 1);
    ctx.lineTo(center, center + crossHairSize + 1);
    ctx.stroke();

    // Main blue crosshair
    ctx.strokeStyle = "#2563eb"; // Brand Blue
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Horizontal line
    ctx.moveTo(center - crossHairSize, center);
    ctx.lineTo(center + crossHairSize, center);
    // Vertical line
    ctx.moveTo(center, center - crossHairSize);
    ctx.lineTo(center, center + crossHairSize);
    ctx.stroke();

    // Center dot indicator
    ctx.fillStyle = "#2563eb";
    ctx.beginPath();
    ctx.arc(center, center, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, [isVisible, imageElement, targetPoint, zoom, size]);

  if (!isVisible || !targetPoint) return null;

  const cornerLabels: Record<CornerHandleKey, string> = {
    topLeft: "Top-Left",
    topRight: "Top-Right",
    bottomRight: "Bottom-Right",
    bottomLeft: "Bottom-Left",
  };

  const cornerName = activeCorner ? cornerLabels[activeCorner] : "Corner";

  return (
    <div
      className={`absolute z-30 pointer-events-none transition-all duration-150 ease-out ${positionClasses}`}
      style={{
        width: size,
        height: size,
      }}
      aria-hidden="true"
    >
      <div className="relative w-full h-full rounded-full ring-4 ring-blue-600/90 shadow-2xl overflow-hidden bg-slate-900 border-2 border-white">
        <canvas
          ref={canvasRef}
          style={{ width: size, height: size }}
          className="w-full h-full block"
        />

        {/* Small corner name pill badge */}
        <div className="absolute bottom-1 inset-x-0 flex justify-center">
          <span className="px-2 py-0.5 rounded-full bg-slate-900/80 text-[10px] font-semibold text-white tracking-wide shadow-sm backdrop-blur-xs">
            {cornerName}
          </span>
        </div>
      </div>
    </div>
  );
};
