/**
 * Design Studio — Coordinate & Spatial Geometry Converter
 *
 * Implements mathematically exact projections between:
 * 1. Physical millimeter dimensions (ISO card & paper standards)
 * 2. PostScript points (72 points / inch, vector PDF & canvas coordinate system)
 * 3. Screen display pixels at interactive zoom levels (10% to 500%)
 * 4. High-DPI master raster pixels for print export (150, 300, 600 DPI)
 *
 * All functions are pure, deterministic, and free of UI dependencies.
 */

import { MM_PER_INCH, POINTS_PER_INCH, mmToPoints, pointsToMm } from "../../constants/design-dimensions.ts";
import type { PhysicalDimensions, DesignOrientation } from "../../types/design-studio.ts";

export interface ViewportScaleMetrics {
  /** Width in logical canvas points */
  widthPt: number;
  /** Height in logical canvas points */
  heightPt: number;
  /** Screen width in device CSS pixels at current zoom */
  screenWidthPx: number;
  /** Screen height in device CSS pixels at current zoom */
  screenHeightPx: number;
  /** Zoom scale ratio (e.g. 1.0 = 100%, 1.5 = 150%) */
  zoom: number;
  /** Overall scale multiplier mapping 1 logical pt -> screen CSS px */
  scaleFactor: number;
}

export interface PrintExportMetrics {
  /** Physical width in millimeters */
  widthMm: number;
  /** Physical height in millimeters */
  heightMm: number;
  /** Width in PostScript points (72 pt/inch) */
  pageWidthPt: number;
  /** Height in PostScript points (72 pt/inch) */
  pageHeightPt: number;
  /** Width in master raster pixels at target DPI */
  exportWidthPx: number;
  /** Height in master raster pixels at target DPI */
  exportHeightPx: number;
  /** Pixel ratio for Konva stage export: targetDpi / 72 */
  pixelRatio: number;
  /** Target export resolution */
  targetDpi: number;
}

export interface BleedAndSafeZone {
  /** Outer bleed boundary rect in logical points (for cut tolerance) */
  bleedRectPt: { x: number; y: number; width: number; height: number };
  /** Trim line rect in logical points (the finished card edge) */
  trimRectPt: { x: number; y: number; width: number; height: number };
  /** Safe zone rect in logical points (content inside this boundary will never be cut) */
  safeRectPt: { x: number; y: number; width: number; height: number };
}

/**
 * Calculates page dimensions in PostScript points considering orientation.
 */
export function getPageDimensionsPt(
  dimensions: PhysicalDimensions,
  orientation: DesignOrientation = "landscape"
): { widthPt: number; heightPt: number } {
  const shortMm = Math.min(dimensions.widthMm, dimensions.heightMm);
  const longMm = Math.max(dimensions.widthMm, dimensions.heightMm);

  const isLandscape = orientation === "landscape";
  const widthMm = isLandscape ? longMm : shortMm;
  const heightMm = isLandscape ? shortMm : longMm;

  return {
    widthPt: mmToPoints(widthMm),
    heightPt: mmToPoints(heightMm),
  };
}

/**
 * Computes viewport display metrics for an interactive canvas stage.
 */
export function calculateViewportMetrics(
  dimensions: PhysicalDimensions,
  orientation: DesignOrientation,
  zoom: number = 1.0,
  screenDpi: number = 96
): ViewportScaleMetrics {
  const validZoom = Math.max(0.1, Math.min(5.0, zoom));
  const { widthPt, heightPt } = getPageDimensionsPt(dimensions, orientation);

  // 1 pt = 1/72 inch; screen CSS pixels = (points / 72) * screenDpi
  const baseScale = screenDpi / POINTS_PER_INCH;
  const scaleFactor = baseScale * validZoom;

  return {
    widthPt,
    heightPt,
    screenWidthPx: Math.round(widthPt * scaleFactor),
    screenHeightPx: Math.round(heightPt * scaleFactor),
    zoom: validZoom,
    scaleFactor,
  };
}

/**
 * Computes exact raster pixel dimensions and scale multipliers for high-DPI export.
 */
export function calculatePrintExportMetrics(
  dimensions: PhysicalDimensions,
  orientation: DesignOrientation,
  overrideDpi?: number
): PrintExportMetrics {
  const dpi = overrideDpi || dimensions.targetDpi || 300;
  const shortMm = Math.min(dimensions.widthMm, dimensions.heightMm);
  const longMm = Math.max(dimensions.widthMm, dimensions.heightMm);

  const isLandscape = orientation === "landscape";
  const widthMm = isLandscape ? longMm : shortMm;
  const heightMm = isLandscape ? shortMm : longMm;

  const pageWidthPt = mmToPoints(widthMm);
  const pageHeightPt = mmToPoints(heightMm);

  const exportWidthPx = Math.round((widthMm / MM_PER_INCH) * dpi);
  const exportHeightPx = Math.round((heightMm / MM_PER_INCH) * dpi);

  return {
    widthMm,
    heightMm,
    pageWidthPt,
    pageHeightPt,
    exportWidthPx,
    exportHeightPx,
    pixelRatio: dpi / POINTS_PER_INCH,
    targetDpi: dpi,
  };
}

/**
 * Computes the trim line, bleed margin, and interior safe margin boundaries.
 */
export function calculateBleedAndSafeZone(
  dimensions: PhysicalDimensions,
  orientation: DesignOrientation
): BleedAndSafeZone {
  const { widthPt, heightPt } = getPageDimensionsPt(dimensions, orientation);

  const bleedPt = mmToPoints(dimensions.bleedMm || 0);
  const safeMarginPt = mmToPoints(dimensions.safeMarginMm || 0);

  return {
    trimRectPt: {
      x: 0,
      y: 0,
      width: widthPt,
      height: heightPt,
    },
    bleedRectPt: {
      x: -bleedPt,
      y: -bleedPt,
      width: widthPt + bleedPt * 2,
      height: heightPt + bleedPt * 2,
    },
    safeRectPt: {
      x: safeMarginPt,
      y: safeMarginPt,
      width: Math.max(0, widthPt - safeMarginPt * 2),
      height: Math.max(0, heightPt - safeMarginPt * 2),
    },
  };
}

/**
 * Computes optimal responsive scale to fit a page within a container viewport
 * without any stretching, distortion or out-of-bounds clipping.
 */
export function calculateResponsiveFitScale(
  widthPt: number,
  heightPt: number,
  containerWidthPx: number,
  containerHeightPx: number,
  paddingPx: number = 32
): number {
  if (widthPt <= 0 || heightPt <= 0 || containerWidthPx <= 0 || containerHeightPx <= 0) {
    return 1.0;
  }

  const availW = Math.max(40, containerWidthPx - paddingPx * 2);
  const availH = Math.max(40, containerHeightPx - paddingPx * 2);

  const scaleX = availW / widthPt;
  const scaleY = availH / heightPt;

  const fitScale = Math.min(scaleX, scaleY);
  return Math.max(0.05, Math.min(10.0, fitScale));
}

export interface ImageFitResult {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculates positioned destination rectangle for drawing an image
 * with "contain", "cover", or "fill" strategies.
 */
export function calculateImageFitDimensions(
  destWidth: number,
  destHeight: number,
  srcWidth: number,
  srcHeight: number,
  fit: "contain" | "cover" | "fill" = "contain"
): ImageFitResult {
  if (destWidth <= 0 || destHeight <= 0 || srcWidth <= 0 || srcHeight <= 0) {
    return { x: 0, y: 0, width: Math.max(1, destWidth), height: Math.max(1, destHeight) };
  }

  if (fit === "fill") {
    return { x: 0, y: 0, width: destWidth, height: destHeight };
  }

  const srcAspect = srcWidth / srcHeight;
  const destAspect = destWidth / destHeight;

  if (fit === "contain") {
    if (srcAspect > destAspect) {
      // Image wider than box: width matches, height is smaller and vertically centered
      const w = destWidth;
      const h = destWidth / srcAspect;
      return { x: 0, y: (destHeight - h) / 2, width: w, height: h };
    } else {
      // Image taller than box: height matches, width is smaller and horizontally centered
      const h = destHeight;
      const w = destHeight * srcAspect;
      return { x: (destWidth - w) / 2, y: 0, width: w, height: h };
    }
  }

  // fit === "cover"
  if (srcAspect > destAspect) {
    // Image wider than box: height matches, width is larger and horizontally centered
    const h = destHeight;
    const w = destHeight * srcAspect;
    return { x: (destWidth - w) / 2, y: 0, width: w, height: h };
  } else {
    // Image taller than box: width matches, height is larger and vertically centered
    const w = destWidth;
    const h = destWidth / srcAspect;
    return { x: 0, y: (destHeight - h) / 2, width: w, height: h };
  }
}
