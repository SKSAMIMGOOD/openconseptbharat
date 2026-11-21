/**
 * Document Straightener — Perspective Boundary Detector
 *
 * Privacy-first, 100% in-browser document boundary and 4-corner detector.
 * Specifically engineered for mobile phone photographs of ID cards & documents
 * on plain or textured backgrounds (tables, sheets, desks).
 *
 * Adheres to strict honesty policy:
 * Returns high-confidence suggestions when boundaries are distinct.
 * Falls back transparently to manual adjustment when contrast or boundaries are ambiguous.
 */

import type {
  PerspectiveQuad,
  PerspectiveDetectionResult,
  Point2D,
} from "@/types/document-straightener";
import {
  isConvexQuad,
  pointDistance,
  createDefaultQuad,
  polygonArea,
} from "./perspective-engine.ts";

export interface DetectionPixelBuffer {
  data: Uint8ClampedArray | Uint8Array;
  width: number;
  height: number;
}

/**
 * Computes luminance from RGB.
 */
function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Computes Euclidean color distance in RGB space.
 */
function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Samples perimeter pixels around the edges of the image to profile the background.
 */
function sampleBorderBackground(buffer: DetectionPixelBuffer): {
  meanR: number;
  meanG: number;
  meanB: number;
  meanLum: number;
} {
  const { data, width, height } = buffer;
  const borderThickness = Math.max(2, Math.floor(Math.min(width, height) * 0.06));

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumLum = 0;
  let count = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isBorder =
        y < borderThickness ||
        y >= height - borderThickness ||
        x < borderThickness ||
        x >= width - borderThickness;

      if (isBorder) {
        const idx = (y * width + x) << 2;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        sumR += r;
        sumG += g;
        sumB += b;
        sumLum += getLuminance(r, g, b);
        count++;
      }
    }
  }

  return {
    meanR: count > 0 ? sumR / count : 240,
    meanG: count > 0 ? sumG / count : 240,
    meanB: count > 0 ? sumB / count : 240,
    meanLum: count > 0 ? sumLum / count : 240,
  };
}

/**
 * Computes 2D Convex Hull using Andrew's Monotone Chain algorithm.
 */
function computeConvexHull(points: Point2D[]): Point2D[] {
  if (points.length <= 3) return points;

  // Sort points by x, then by y
  const sorted = [...points].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

  const cross = (o: Point2D, a: Point2D, b: Point2D) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  // Lower hull
  const lower: Point2D[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  // Upper hull
  const upper: Point2D[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/**
 * Detects 4 document corners in a downscaled pixel buffer.
 */
export function detectDocumentCorners(
  buffer: DetectionPixelBuffer,
  nativeWidth: number,
  nativeHeight: number
): PerspectiveDetectionResult {
  const { data, width, height } = buffer;
  const totalPixels = width * height;

  if (totalPixels < 100 || nativeWidth < 50 || nativeHeight < 50) {
    return {
      detected: false,
      confidence: 0,
      quad: createDefaultQuad(nativeWidth, nativeHeight),
      message: "Image resolution too low for boundary analysis.",
    };
  }

  // 1. Profile background from perimeter
  const bg = sampleBorderBackground(buffer);

  // 2. Classify foreground candidate pixels
  // Foreground pixels are significantly different in color or luminance from border background
  const foregroundPoints: Point2D[] = [];
  const minColorDiff = 25;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) << 2;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const diff = colorDistance(r, g, b, bg.meanR, bg.meanG, bg.meanB);
      if (diff > minColorDiff) {
        foregroundPoints.push({ x, y });
      }
    }
  }

  const fgRatio = foregroundPoints.length / totalPixels;

  // If foreground area is too small (<5%) or covers entire screen (>95%), background is not sufficiently contrasting
  if (fgRatio < 0.05 || fgRatio > 0.95) {
    return {
      detected: false,
      confidence: 0.2,
      quad: createDefaultQuad(nativeWidth, nativeHeight),
      message: "Background contrast insufficient for automatic edge detection. Manual adjustment active.",
    };
  }

  // 3. Find 4 extremal corners from all foreground points
  // TL: minimizes (x + y)
  // TR: maximizes (x - y)
  // BR: maximizes (x + y)
  // BL: minimizes (x - y)
  let tl = foregroundPoints[0];
  let tr = foregroundPoints[0];
  let br = foregroundPoints[0];
  let bl = foregroundPoints[0];

  let minSum = Infinity;
  let maxSum = -Infinity;
  let maxDiff = -Infinity;
  let minDiff = Infinity;

  for (let i = 0; i < foregroundPoints.length; i++) {
    const p = foregroundPoints[i];
    const sum = p.x + p.y;
    const diff = p.x - p.y;

    if (sum < minSum) {
      minSum = sum;
      tl = p;
    }
    if (sum > maxSum) {
      maxSum = sum;
      br = p;
    }
    if (diff > maxDiff) {
      maxDiff = diff;
      tr = p;
    }
    if (diff < minDiff) {
      minDiff = diff;
      bl = p;
    }
  }

  // 5. Scale coordinates back to native resolution
  const scaleX = nativeWidth / width;
  const scaleY = nativeHeight / height;

  const candidateQuad: PerspectiveQuad = {
    topLeft: { x: Math.round(tl.x * scaleX), y: Math.round(tl.y * scaleY) },
    topRight: { x: Math.round(tr.x * scaleX), y: Math.round(tr.y * scaleY) },
    bottomRight: { x: Math.round(br.x * scaleX), y: Math.round(br.y * scaleY) },
    bottomLeft: { x: Math.round(bl.x * scaleX), y: Math.round(bl.y * scaleY) },
  };

  // 6. Verification and confidence scoring
  if (!isConvexQuad(candidateQuad)) {
    return {
      detected: false,
      confidence: 0.35,
      quad: createDefaultQuad(nativeWidth, nativeHeight),
      message: "Detected polygon was self-intersecting or non-convex. Manual adjustment active.",
    };
  }

  const quadArea = polygonArea([
    candidateQuad.topLeft,
    candidateQuad.topRight,
    candidateQuad.bottomRight,
    candidateQuad.bottomLeft,
  ]);
  const nativeArea = nativeWidth * nativeHeight;
  const areaRatio = quadArea / nativeArea;

  if (areaRatio < 0.08 || areaRatio > 0.96) {
    return {
      detected: false,
      confidence: 0.4,
      quad: createDefaultQuad(nativeWidth, nativeHeight),
      message: "Detected boundary area outside expected card proportions. Manual adjustment active.",
    };
  }

  // Check aspect ratio of opposing sides
  const topW = pointDistance(candidateQuad.topLeft, candidateQuad.topRight);
  const botW = pointDistance(candidateQuad.bottomLeft, candidateQuad.bottomRight);
  const leftH = pointDistance(candidateQuad.topLeft, candidateQuad.bottomLeft);
  const rightH = pointDistance(candidateQuad.topRight, candidateQuad.bottomRight);

  const wRatio = Math.min(topW, botW) / Math.max(topW, botW);
  const hRatio = Math.min(leftH, rightH) / Math.max(leftH, rightH);

  // Confidence metric based on parallelism and area
  const confidence = Math.min(0.95, (wRatio * 0.4 + hRatio * 0.4 + (1 - Math.abs(areaRatio - 0.5)) * 0.2));

  if (confidence < 0.6) {
    return {
      detected: false,
      confidence,
      quad: createDefaultQuad(nativeWidth, nativeHeight),
      message: "Document edges suggested with moderate confidence. Fine-tune corners manually.",
    };
  }

  return {
    detected: true,
    confidence,
    quad: candidateQuad,
    message: "Document corners automatically detected. You can fine-tune any corner.",
  };
}

/**
 * Downsamples an HTMLImageElement or Canvas to a fast analysis buffer (max 400px),
 * then executes detectDocumentCorners.
 */
export async function detectDocumentBoundariesFromImage(
  imageSource: HTMLImageElement | HTMLCanvasElement
): Promise<PerspectiveDetectionResult> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("detectDocumentBoundariesFromImage requires browser DOM");
  }

  const nativeW = "naturalWidth" in imageSource ? imageSource.naturalWidth : imageSource.width;
  const nativeH = "naturalHeight" in imageSource ? imageSource.naturalHeight : imageSource.height;

  const maxDimension = 400;
  const scale = Math.min(1, maxDimension / Math.max(nativeW, nativeH));
  const workW = Math.max(10, Math.round(nativeW * scale));
  const workH = Math.max(10, Math.round(nativeH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = workW;
  canvas.height = workH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not create canvas 2D context");

  ctx.drawImage(imageSource, 0, 0, workW, workH);
  const imageData = ctx.getImageData(0, 0, workW, workH);

  const buffer: DetectionPixelBuffer = {
    data: imageData.data,
    width: workW,
    height: workH,
  };

  canvas.width = 0;
  canvas.height = 0;

  return detectDocumentCorners(buffer, nativeW, nativeH);
}
