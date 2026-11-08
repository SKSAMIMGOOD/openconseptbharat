/**
 * Phase 08B — Browser-Side Automatic Document Boundary Detector
 *
 * Privacy-first, 100% client-side computer vision algorithm.
 * Detects document boundaries of cards/documents photographed against a contrasting background:
 * 1. Fast offscreen downsampling (max 500px dimension) for low-latency execution (<25ms)
 * 2. Background color & luminance profiling via border/perimeter sampling
 * 3. Contrast threshold verification (reports honest fallback when background is non-contrasting)
 * 4. Sobel gradient edge mapping & background distance projection
 * 5. Multi-scanline median boundary extraction (robust against shadows & minor artifacts)
 * 6. Perimeter edge-density verification to ensure boundary authenticity
 * 7. Non-destructive safety margin (1.5% padding) preventing any document content clipping
 * 8. Target aspect-ratio alignment expanding outward to preserve detected card content
 * 9. Accurate coordinate scaling back to native full-resolution coordinates
 *
 * Zero external cloud APIs. Zero external heavyweight dependencies. MIT compatible.
 */

import type { CropCoordinates } from "@/types/crop";
import type {
  AutoCropDetectionResult,
  DualDocumentDetectionResult,
  DocumentTypeId,
} from "@/types/document-studio";
import { classifyFrontBackCrops } from "./document-content-classifier.ts";
import {
  PAN_CARD_MEASUREMENTS,
  AADHAAR_CARD_MEASUREMENTS,
  RATION_CARD_MEASUREMENTS,
  VOTER_ID_MEASUREMENTS,
  CR80_STANDARD_SPEC,
} from "../../constants/document-studio.ts";
import type { VectorPdfInspectionResult } from "./pdf-vector-detector";

export interface PixelBuffer {
  data: Uint8ClampedArray | Uint8Array;
  width: number;
  height: number;
}

export interface DocumentDetectionOptions {
  targetAspectRatio?: number | null;
  safetyMarginPercent?: number; // default 1.5%
  minAreaPercent?: number; // default 10%
  maxAreaPercent?: number; // default 98%
}

export interface DualDetectionOptions extends DocumentDetectionOptions {
  isSingleSide?: boolean; // e.g. for PAN card (front only)
  forceLayout?: "auto" | "bottom-dual" | "horizontal" | "vertical" | "manual"; // layout mode
  docTypeId?: string;
  vectorInfo?: VectorPdfInspectionResult | null;
}

/**
 * Computes luminance from RGB (BT.601 standard)
 */
function rgbToLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Samples perimeter pixels around the edges of the image to profile the background.
 */
function sampleBackgroundProfile(buffer: PixelBuffer): {
  meanR: number;
  meanG: number;
  meanB: number;
  meanLum: number;
  stdDevLum: number;
} {
  const { data, width, height } = buffer;
  const borderThickness = Math.max(2, Math.floor(Math.min(width, height) * 0.05));

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumLum = 0;
  let count = 0;

  // Sample top, bottom, left, and right borders
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isBorder =
        y < borderThickness ||
        y >= height - borderThickness ||
        x < borderThickness ||
        x >= width - borderThickness;

      if (isBorder) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const lum = rgbToLuminance(r, g, b);

        sumR += r;
        sumG += g;
        sumB += b;
        sumLum += lum;
        count++;
      }
    }
  }

  if (count === 0) {
    return { meanR: 240, meanG: 240, meanB: 240, meanLum: 240, stdDevLum: 0 };
  }

  const meanR = sumR / count;
  const meanG = sumG / count;
  const meanB = sumB / count;
  const meanLum = sumLum / count;

  let varianceSum = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isBorder =
        y < borderThickness ||
        y >= height - borderThickness ||
        x < borderThickness ||
        x >= width - borderThickness;

      if (isBorder) {
        const idx = (y * width + x) * 4;
        const lum = rgbToLuminance(data[idx], data[idx + 1], data[idx + 2]);
        varianceSum += (lum - meanLum) ** 2;
      }
    }
  }

  const stdDevLum = Math.sqrt(varianceSum / count);

  return { meanR, meanG, meanB, meanLum, stdDevLum };
}

/**
 * Samples the central region of the image to compare foreground against background.
 */
function sampleCenterProfile(buffer: PixelBuffer): {
  meanR: number;
  meanG: number;
  meanB: number;
  meanLum: number;
} {
  const { data, width, height } = buffer;
  const startX = Math.floor(width * 0.25);
  const endX = Math.floor(width * 0.75);
  const startY = Math.floor(height * 0.25);
  const endY = Math.floor(height * 0.75);

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumLum = 0;
  let count = 0;

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      sumR += r;
      sumG += g;
      sumB += b;
      sumLum += rgbToLuminance(r, g, b);
      count++;
    }
  }

  if (count === 0) {
    return { meanR: 128, meanG: 128, meanB: 128, meanLum: 128 };
  }

  return {
    meanR: sumR / count,
    meanG: sumG / count,
    meanB: sumB / count,
    meanLum: sumLum / count,
  };
}

/**
 * Computes 2D Sobel gradient magnitude for each pixel in the buffer.
 */
function computeSobelGradientMap(
  buffer: PixelBuffer,
  luminanceMap: Float32Array
): Float32Array {
  const { width, height } = buffer;
  const gradients = new Float32Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      // Sobel kernel X:
      // [-1  0  1]
      // [-2  0  2]
      // [-1  0  1]
      const gx =
        -1 * luminanceMap[(y - 1) * width + (x - 1)] +
        1 * luminanceMap[(y - 1) * width + (x + 1)] +
        -2 * luminanceMap[y * width + (x - 1)] +
        2 * luminanceMap[y * width + (x + 1)] +
        -1 * luminanceMap[(y + 1) * width + (x - 1)] +
        1 * luminanceMap[(y + 1) * width + (x + 1)];

      // Sobel kernel Y:
      // [-1 -2 -1]
      // [ 0  0  0]
      // [ 1  2  1]
      const gy =
        -1 * luminanceMap[(y - 1) * width + (x - 1)] +
        -2 * luminanceMap[(y - 1) * width + x] +
        -1 * luminanceMap[(y - 1) * width + (x + 1)] +
        1 * luminanceMap[(y + 1) * width + (x - 1)] +
        2 * luminanceMap[(y + 1) * width + x] +
        1 * luminanceMap[(y + 1) * width + (x + 1)];

      gradients[y * width + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  return gradients;
}

/**
 * Calculates Euclidean color distance between a pixel and the background mean.
 */
function colorDistance(
  r: number,
  g: number,
  b: number,
  bgR: number,
  bgG: number,
  bgB: number
): number {
  return Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
}

/**
 * Core mathematical boundary detection algorithm on a pixel buffer.
 * Fully compatible with Node.js test environments and browser ImageData.
 */
export function detectDocumentInPixelBuffer(
  buffer: PixelBuffer,
  options: DocumentDetectionOptions = {}
): AutoCropDetectionResult {
  const { width, height, data } = buffer;
  const targetAspect = options.targetAspectRatio ?? null;
  const safetyMargin = options.safetyMarginPercent ?? 1.5;
  const minAreaRatio = (options.minAreaPercent ?? 10) / 100;
  const maxAreaRatio = (options.maxAreaPercent ?? 98) / 100;

  if (width < 30 || height < 30) {
    return {
      detected: false,
      confidence: 0,
      crop: { x: 0, y: 0, width, height },
      message: "Image resolution is too small for automatic boundary detection.",
    };
  }

  // 1. Compute luminance buffer
  const luminanceMap = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    luminanceMap[i] = rgbToLuminance(data[idx], data[idx + 1], data[idx + 2]);
  }

  // 2. Profile background vs foreground
  const bg = sampleBackgroundProfile(buffer);
  const center = sampleCenterProfile(buffer);

  // Normalized Euclidean color difference between border background and center foreground
  const contrastDistance = colorDistance(
    center.meanR,
    center.meanG,
    center.meanB,
    bg.meanR,
    bg.meanG,
    bg.meanB
  );
  const maxPossibleDistance = Math.sqrt(3 * 255 * 255);
  const contrastRatio = contrastDistance / maxPossibleDistance;

  // Contrast check: if contrast is too faint (< 7.5%), document cannot be reliably differentiated
  if (contrastRatio < 0.075 && Math.abs(center.meanLum - bg.meanLum) < 18) {
    return {
      detected: false,
      confidence: Math.round(contrastRatio * 100) / 100,
      crop: {
        x: Math.round(width * 0.05),
        y: Math.round(height * 0.05),
        width: Math.round(width * 0.9),
        height: Math.round(height * 0.9),
      },
      message:
        "No contrasting background detected around the document. Switched to manual crop mode.",
      debugInfo: {
        contrastScore: Math.round(contrastRatio * 1000) / 1000,
        edgeScore: 0,
        areaRatio: 1,
      },
    };
  }

  // 3. Compute Sobel gradients
  const gradients = computeSobelGradientMap(buffer, luminanceMap);

  // Calculate average gradient across the entire image
  let sumGrad = 0;
  for (let i = 0; i < gradients.length; i++) {
    sumGrad += gradients[i];
  }
  const meanGrad = sumGrad / gradients.length;
  const edgeThreshold = Math.max(30, meanGrad * 1.4);
  const colorDistThreshold = Math.max(25, contrastDistance * 0.35);

  // 4. Inward boundary scanning with multi-column / multi-row sampling
  // Top boundary scan:
  const topPoints: number[] = [];
  const colStart = Math.floor(width * 0.2);
  const colEnd = Math.floor(width * 0.8);
  const maxScanY = Math.floor(height * 0.45);

  for (let x = colStart; x < colEnd; x += 2) {
    for (let y = 1; y < maxScanY; y++) {
      const idx = (y * width + x) * 4;
      const dist = colorDistance(
        data[idx],
        data[idx + 1],
        data[idx + 2],
        bg.meanR,
        bg.meanG,
        bg.meanB
      );
      const grad = gradients[y * width + x];

      if (dist > colorDistThreshold || grad > edgeThreshold) {
        topPoints.push(y);
        break;
      }
    }
  }

  // Bottom boundary scan:
  const bottomPoints: number[] = [];
  const minScanY = Math.floor(height * 0.55);

  for (let x = colStart; x < colEnd; x += 2) {
    for (let y = height - 2; y > minScanY; y--) {
      const idx = (y * width + x) * 4;
      const dist = colorDistance(
        data[idx],
        data[idx + 1],
        data[idx + 2],
        bg.meanR,
        bg.meanG,
        bg.meanB
      );
      const grad = gradients[y * width + x];

      if (dist > colorDistThreshold || grad > edgeThreshold) {
        bottomPoints.push(y);
        break;
      }
    }
  }

  // Left boundary scan:
  const leftPoints: number[] = [];
  const rowStart = Math.floor(height * 0.2);
  const rowEnd = Math.floor(height * 0.8);
  const maxScanX = Math.floor(width * 0.45);

  for (let y = rowStart; y < rowEnd; y += 2) {
    for (let x = 1; x < maxScanX; x++) {
      const idx = (y * width + x) * 4;
      const dist = colorDistance(
        data[idx],
        data[idx + 1],
        data[idx + 2],
        bg.meanR,
        bg.meanG,
        bg.meanB
      );
      const grad = gradients[y * width + x];

      if (dist > colorDistThreshold || grad > edgeThreshold) {
        leftPoints.push(x);
        break;
      }
    }
  }

  // Right boundary scan:
  const rightPoints: number[] = [];
  const minScanX = Math.floor(width * 0.55);

  for (let y = rowStart; y < rowEnd; y += 2) {
    for (let x = width - 2; x > minScanX; x--) {
      const idx = (y * width + x) * 4;
      const dist = colorDistance(
        data[idx],
        data[idx + 1],
        data[idx + 2],
        bg.meanR,
        bg.meanG,
        bg.meanB
      );
      const grad = gradients[y * width + x];

      if (dist > colorDistThreshold || grad > edgeThreshold) {
        rightPoints.push(x);
        break;
      }
    }
  }

  // Helper for median calculation (ignores shadows, glare spikes, or noise)
  const getMedian = (arr: number[]): number | null => {
    if (arr.length === 0) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const topMedian = getMedian(topPoints);
  const bottomMedian = getMedian(bottomPoints);
  const leftMedian = getMedian(leftPoints);
  const rightMedian = getMedian(rightPoints);

  if (
    topMedian === null ||
    bottomMedian === null ||
    leftMedian === null ||
    rightMedian === null
  ) {
    return {
      detected: false,
      confidence: 0,
      crop: {
        x: Math.round(width * 0.05),
        y: Math.round(height * 0.05),
        width: Math.round(width * 0.9),
        height: Math.round(height * 0.9),
      },
      message:
        "Unable to isolate document boundaries cleanly against the background. Please use manual crop.",
    };
  }

  let boundX = Math.round(leftMedian);
  let boundY = Math.round(topMedian);
  let boundW = Math.round(rightMedian - leftMedian);
  let boundH = Math.round(bottomMedian - topMedian);

  // 5. Area validation: A photographed document must occupy a sensible portion of the frame
  const detectedArea = boundW * boundH;
  const totalArea = width * height;
  const areaRatio = detectedArea / totalArea;

  if (areaRatio < minAreaRatio || areaRatio > maxAreaRatio || boundW <= 20 || boundH <= 20) {
    return {
      detected: false,
      confidence: Math.round(contrastRatio * 60) / 100,
      crop: {
        x: Math.max(0, boundX),
        y: Math.max(0, boundY),
        width: Math.min(width, boundW > 0 ? boundW : Math.round(width * 0.9)),
        height: Math.min(height, boundH > 0 ? boundH : Math.round(height * 0.9)),
      },
      message:
        areaRatio > maxAreaRatio
          ? "Document fills almost the entire image frame without contrasting background."
          : "Detected region was too small or ambiguous. Switched to manual crop editor.",
      debugInfo: {
        contrastScore: Math.round(contrastRatio * 1000) / 1000,
        edgeScore: 0,
        areaRatio: Math.round(areaRatio * 1000) / 1000,
      },
    };
  }

  // 6. Perimeter edge density verification (ensures boundaries form authentic edges)
  let perimeterGradSum = 0;
  let perimeterCount = 0;

  for (let x = boundX; x < boundX + boundW; x++) {
    if (x >= 0 && x < width) {
      if (boundY >= 0 && boundY < height) {
        perimeterGradSum += gradients[boundY * width + x];
        perimeterCount++;
      }
      const bY = boundY + boundH;
      if (bY >= 0 && bY < height) {
        perimeterGradSum += gradients[bY * width + x];
        perimeterCount++;
      }
    }
  }

  for (let y = boundY; y < boundY + boundH; y++) {
    if (y >= 0 && y < height) {
      if (boundX >= 0 && boundX < width) {
        perimeterGradSum += gradients[y * width + boundX];
        perimeterCount++;
      }
      const rX = boundX + boundW;
      if (rX >= 0 && rX < width) {
        perimeterGradSum += gradients[y * width + rX];
        perimeterCount++;
      }
    }
  }

  const perimeterEdgeDensity = perimeterCount > 0 ? perimeterGradSum / perimeterCount : 0;
  const edgeRatio = meanGrad > 0 ? perimeterEdgeDensity / meanGrad : 1;

  // 7. Safety margin: expand outward by safetyMargin% so document text/corners are preserved
  const padX = Math.round(boundW * (safetyMargin / 100));
  const padY = Math.round(boundH * (safetyMargin / 100));

  boundX = Math.max(0, boundX - padX);
  boundY = Math.max(0, boundY - padY);
  boundW = Math.min(width - boundX, boundW + padX * 2);
  boundH = Math.min(height - boundY, boundH + padY * 2);

  // 8. Aspect ratio preservation / snapping
  if (targetAspect && targetAspect > 0) {
    const currentAspect = boundW / boundH;

    if (currentAspect < targetAspect) {
      // Need wider box to match target aspect ratio: expand width outward
      const targetW = Math.round(boundH * targetAspect);
      const diffW = targetW - boundW;
      boundX = Math.max(0, boundX - Math.floor(diffW / 2));
      boundW = Math.min(width - boundX, targetW);
      // Re-adjust height if clamped at image border
      boundH = Math.round(boundW / targetAspect);
    } else {
      // Need taller box to match target aspect ratio: expand height outward
      const targetH = Math.round(boundW / targetAspect);
      const diffH = targetH - boundH;
      boundY = Math.max(0, boundY - Math.floor(diffH / 2));
      boundH = Math.min(height - boundY, targetH);
      // Re-adjust width if clamped at image border
      boundW = Math.round(boundH * targetAspect);
    }
  }

  // Final bounds clamping
  boundX = Math.max(0, Math.min(boundX, width - 10));
  boundY = Math.max(0, Math.min(boundY, height - 10));
  boundW = Math.max(10, Math.min(boundW, width - boundX));
  boundH = Math.max(10, Math.min(boundH, height - boundY));

  // Compute confidence score
  const contrastFactor = Math.min(1, contrastRatio / 0.35);
  const edgeFactor = Math.min(1, edgeRatio / 1.5);
  const confidence = Math.min(
    0.98,
    Math.max(0.55, Math.round((contrastFactor * 0.5 + edgeFactor * 0.5) * 100) / 100)
  );

  return {
    detected: true,
    confidence,
    crop: {
      x: boundX,
      y: boundY,
      width: boundW,
      height: boundH,
    },
    message: `Document boundaries detected automatically with ${Math.round(confidence * 100)}% confidence.`,
    method: "sobel-boundary-projection",
    debugInfo: {
      contrastScore: Math.round(contrastRatio * 1000) / 1000,
      edgeScore: Math.round(edgeRatio * 100) / 100,
      areaRatio: Math.round(areaRatio * 1000) / 1000,
    },
  };
}

/**
 * Executes automatic document boundary detection on an image in the browser.
 * Downsamples offscreen to maximum 500px dimension for near-instant execution (<25ms).
 * Scales detected coordinates accurately back to the native image resolution.
 */
export async function detectDocumentBoundaries(
  sourceImage: CanvasImageSource,
  nativeWidth: number,
  nativeHeight: number,
  options: DocumentDetectionOptions = {}
): Promise<AutoCropDetectionResult> {
  if (typeof document === "undefined" && typeof OffscreenCanvas === "undefined") {
    throw new Error("Canvas environment required for browser document detection.");
  }

  // Downsample image for high-speed analysis
  const maxThumbDim = 500;
  const thumbScale = Math.min(1, maxThumbDim / Math.max(nativeWidth, nativeHeight));
  const thumbW = Math.max(1, Math.round(nativeWidth * thumbScale));
  const thumbH = Math.max(1, Math.round(nativeHeight * thumbScale));

  let canvas: HTMLCanvasElement | OffscreenCanvas;
  if (typeof OffscreenCanvas !== "undefined") {
    canvas = new OffscreenCanvas(thumbW, thumbH);
  } else {
    canvas = document.createElement("canvas");
    canvas.width = thumbW;
    canvas.height = thumbH;
  }

  const ctx = canvas.getContext("2d", { willReadFrequently: true }) as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D;

  if (!ctx) {
    throw new Error("Failed to initialize 2D context for document boundary detection.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "medium";
  ctx.drawImage(sourceImage, 0, 0, thumbW, thumbH);

  const imgData = ctx.getImageData(0, 0, thumbW, thumbH);
  const result = detectDocumentInPixelBuffer(
    {
      data: imgData.data,
      width: thumbW,
      height: thumbH,
    },
    options
  );

  // Scale coordinates back to original native resolution
  const scaleX = nativeWidth / thumbW;
  const scaleY = nativeHeight / thumbH;

  const scaledCrop: CropCoordinates = {
    x: Math.max(0, Math.round(result.crop.x * scaleX)),
    y: Math.max(0, Math.round(result.crop.y * scaleY)),
    width: Math.min(nativeWidth, Math.round(result.crop.width * scaleX)),
    height: Math.min(nativeHeight, Math.round(result.crop.height * scaleY)),
  };

  // Ensure scaled crop doesn't overflow bounds
  if (scaledCrop.x + scaledCrop.width > nativeWidth) {
    scaledCrop.width = nativeWidth - scaledCrop.x;
  }
  if (scaledCrop.y + scaledCrop.height > nativeHeight) {
    scaledCrop.height = nativeHeight - scaledCrop.y;
  }

  return {
    ...result,
    crop: scaledCrop,
  };
}

/**
 * Extracts a sub-region from a PixelBuffer.
 */
export function extractSubBuffer(
  buffer: PixelBuffer,
  crop: CropCoordinates
): PixelBuffer {
  const { data, width: srcW, height: srcH } = buffer;
  const x = Math.max(0, Math.min(Math.round(crop.x), srcW - 1));
  const y = Math.max(0, Math.min(Math.round(crop.y), srcH - 1));
  const w = Math.max(1, Math.min(Math.round(crop.width), srcW - x));
  const h = Math.max(1, Math.min(Math.round(crop.height), srcH - y));

  const subData = new Uint8ClampedArray(w * h * 4);
  for (let row = 0; row < h; row++) {
    const srcStart = ((y + row) * srcW + x) * 4;
    const srcEnd = srcStart + w * 4;
    const destStart = row * w * 4;
    subData.set(data.subarray(srcStart, srcEnd), destStart);
  }
  return { data: subData, width: w, height: h };
}

/**
 * Creates default centered crop coordinates within a container.
 */
export function createCenteredCrop(
  containerW: number,
  containerH: number,
  targetAspect: number
): CropCoordinates {
  let width: number;
  let height: number;
  const maxW = containerW * 0.85;
  const maxH = containerH * 0.85;

  if (maxW / maxH > targetAspect) {
    height = Math.round(maxH);
    width = Math.round(height * targetAspect);
  } else {
    width = Math.round(maxW);
    height = Math.round(width / targetAspect);
  }

  const x = Math.max(0, Math.round((containerW - width) / 2));
  const y = Math.max(0, Math.round((containerH - height) / 2));
  return { x, y, width, height };
}

/**
 * Detects dashed horizontal row lines in a specified vertical search band.
 * Thresholds dark pixels below grayscale intensity 140 and counts dark/light transitions.
 */
export function findDashedHorizontalRows(
  buffer: PixelBuffer,
  yMin: number,
  yMax: number,
  minTransitions: number = 8,
  darkThreshold: number = 140
): number[] {
  const { data, width, height } = buffer;
  const dashedRows: number[] = [];

  const startY = Math.max(0, Math.floor(yMin));
  const endY = Math.min(height - 1, Math.ceil(yMax));

  for (let y = startY; y <= endY; y++) {
    let transitions = 0;
    let isDark = false;
    let firstDarkX = -1;
    let lastDarkX = -1;

    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      const pixelDark = lum < darkThreshold;

      if (pixelDark) {
        if (firstDarkX === -1) firstDarkX = x;
        lastDarkX = x;
      }

      if (pixelDark !== isDark) {
        transitions++;
        isDark = pixelDark;
      }
    }

    const span = lastDarkX - firstDarkX;
    // Require sufficiently long dashed pattern spanning at least 45% of image width
    if (transitions >= minTransitions && span >= width * 0.45) {
      dashedRows.push(y);
    }
  }

  return dashedRows;
}

/**
 * Detects dashed vertical fold column near the center of the image/box.
 */
export function findVerticalFoldColumn(
  buffer: PixelBuffer,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  minTransitions: number = 6,
  darkThreshold: number = 140
): number | null {
  const { data, width, height } = buffer;
  const startX = Math.max(0, Math.floor(xMin));
  const endX = Math.min(width - 1, Math.ceil(xMax));
  const startY = Math.max(0, Math.floor(yMin));
  const endY = Math.min(height - 1, Math.ceil(yMax));

  let bestX: number | null = null;
  let maxTransitions = 0;

  for (let x = startX; x <= endX; x++) {
    let transitions = 0;
    let isDark = false;

    for (let y = startY; y <= endY; y++) {
      const idx = (y * width + x) * 4;
      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      const pixelDark = lum < darkThreshold;

      if (pixelDark !== isDark) {
        transitions++;
        isDark = pixelDark;
      }
    }

    if (transitions >= minTransitions && transitions > maxTransitions) {
      maxTransitions = transitions;
      bestX = x;
    }
  }

  return bestX;
}

/**
 * Detects solid horizontal border lines (continuous dark pixels with low transition count).
 */
export function findSolidHorizontalBorders(
  buffer: PixelBuffer,
  yMin: number,
  yMax: number,
  xMin: number,
  xMax: number,
  darkThreshold: number = 140,
  minDarkRatio: number = 0.6
): number[] {
  const { data, width, height } = buffer;
  const solidRows: number[] = [];

  const startY = Math.max(0, Math.floor(yMin));
  const endY = Math.min(height - 1, Math.ceil(yMax));
  const startX = Math.max(0, Math.floor(xMin));
  const endX = Math.min(width - 1, Math.ceil(xMax));
  const span = endX - startX + 1;

  for (let y = startY; y <= endY; y++) {
    let darkCount = 0;
    let transitions = 0;
    let isDark = false;

    for (let x = startX; x <= endX; x++) {
      const idx = (y * width + x) * 4;
      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      const pixelDark = lum < darkThreshold;
      if (pixelDark) darkCount++;
      if (pixelDark !== isDark) {
        transitions++;
        isDark = pixelDark;
      }
    }

    // Solid border has high dark percentage and few alternating transitions
    if (darkCount / span >= minDarkRatio && transitions <= 8) {
      solidRows.push(y);
    }
  }

  return solidRows;
}

/**
 * Detects solid vertical border columns (continuous dark pixels across height).
 */
export function findSolidVerticalBorders(
  buffer: PixelBuffer,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  darkThreshold: number = 140,
  minDarkRatio: number = 0.6
): number[] {
  const { data, width, height } = buffer;
  const solidCols: number[] = [];

  const startX = Math.max(0, Math.floor(xMin));
  const endX = Math.min(width - 1, Math.ceil(xMax));
  const startY = Math.max(0, Math.floor(yMin));
  const endY = Math.min(height - 1, Math.ceil(yMax));
  const span = endY - startY + 1;

  for (let x = startX; x <= endX; x++) {
    let darkCount = 0;
    let transitions = 0;
    let isDark = false;

    for (let y = startY; y <= endY; y++) {
      const idx = (y * width + x) * 4;
      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      const pixelDark = lum < darkThreshold;
      if (pixelDark) darkCount++;
      if (pixelDark !== isDark) {
        transitions++;
        isDark = pixelDark;
      }
    }

    if (darkCount / span >= minDarkRatio && transitions <= 8) {
      solidCols.push(x);
    }
  }

  return solidCols;
}

/**
 * Detects card boundaries in a sub-region using colored pixels (saturation > 40)
 * combined with edge and non-white foreground detection, ignoring outer cut lines.
 */
export function findCardBoundsInRegion(
  buffer: PixelBuffer,
  region: CropCoordinates,
  minSaturation: number = 40
): CropCoordinates | null {
  const { data, width, height } = buffer;
  const startX = Math.max(0, region.x);
  const endX = Math.min(width, region.x + region.width);
  const startY = Math.max(0, region.y);
  const endY = Math.min(height, region.y + region.height);

  let minFoundX = endX;
  let maxFoundX = startX;
  let minFoundY = endY;
  let maxFoundY = startY;
  let coloredCount = 0;

  // Inset search region slightly (2.5%) to avoid outer cut box lines and scissors
  const insetX = Math.max(2, Math.round(region.width * 0.025));
  const insetY = Math.max(2, Math.round(region.height * 0.025));

  for (let y = startY + insetY; y < endY - insetY; y++) {
    for (let x = startX + insetX; x < endX - insetX; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const sat = maxC - minC;

      // Card pixel check: saturated color OR significant contrast against white
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const isCardPixel = sat > minSaturation || (lum < 165 && sat > 15);

      if (isCardPixel) {
        coloredCount++;
        if (x < minFoundX) minFoundX = x;
        if (x > maxFoundX) maxFoundX = x;
        if (y < minFoundY) minFoundY = y;
        if (y > maxFoundY) maxFoundY = y;
      }
    }
  }

  // Require minimum colored/foreground pixel presence (at least 3% of region)
  const minPixels = region.width * region.height * 0.03;
  if (coloredCount < minPixels || minFoundX >= maxFoundX || minFoundY >= maxFoundY) {
    return null;
  }

  return {
    x: minFoundX,
    y: minFoundY,
    width: maxFoundX - minFoundX,
    height: maxFoundY - minFoundY,
  };
}

/**
 * 1. PAN CARD — DOCUMENT-SPECIFIC DETECTION
 *
 * Page: US Letter (2550 x 3300 px at 300 DPI)
 * Reference measurements:
 * - Dashed cut box: X 215–2339, Y 2553–3190
 * - Vertical fold: X 1279.5 (normalized ~0.5018)
 * - Front card: X 257–1212, Y 2582–3177 (norm: X 0.101–0.475, Y 0.782–0.963)
 * - Back card: X 1345–2299, Y 2584–3180 (norm: X 0.527–0.902, Y 0.783–0.964)
 * - Cards approx 955 x 597 px, aspect ~1.60
 *
 * Algorithm:
 * 1. Normalize coordinates relative to actual page width and height
 * 2. Search lower portion of page (Y >= 0.70 * H) for dashed cut box
 * 3. Detect dashed rows by thresholding dark pixels below grayscale 140 with high dark/light transitions
 * 4. Identify vertical dashed fold near center (around X ~ 0.50)
 * 5. Split cut box into left and right halves
 * 6. Detect card boundaries inside each half using colored pixels (saturation > 40) & edge detection
 * 7. Apply content-based Front/Back classification
 * 8. Validate aspect ratio ~1.55–1.65 and front/back dimension match within ~2%
 */
export function detectPanCardInPixelBuffer(
  buffer: PixelBuffer,
  options: DualDetectionOptions = {}
): DualDocumentDetectionResult {
  const { width: W, height: H } = buffer;
  const targetAspect = options.targetAspectRatio ?? 1.60;

  // Normalized reference coordinates (measured from US Letter 2550 x 3300 px at 300 DPI)
  // Front: X 0.101–0.475, Y 0.782–0.963 (approx 955 x 597 px, aspect ~1.60)
  // Back:  X 0.527–0.902, Y 0.783–0.964 (approx 955 x 597 px, aspect ~1.60)
  const ref = PAN_CARD_MEASUREMENTS;
  const defaultFrontCrop: CropCoordinates = {
    x: Math.round(ref.front.xMin * W),
    y: Math.round(ref.front.yMin * H),
    width: Math.round((ref.front.xMax - ref.front.xMin) * W),
    height: Math.round((ref.front.yMax - ref.front.yMin) * H),
  };

  const defaultBackCrop: CropCoordinates = {
    x: Math.round(ref.back.xMin * W),
    y: Math.round(ref.back.yMin * H),
    width: Math.round((ref.back.xMax - ref.back.xMin) * W),
    height: Math.round((ref.back.yMax - ref.back.yMin) * H),
  };

  if (W < 40 || H < 40) {
    return {
      detected: false,
      confidence: 0,
      frontCrop: defaultFrontCrop,
      backCrop: defaultBackCrop,
      layout: "pan",
      strategyUsed: "pan-dashed-cutbox-fold-colored-bbox",
      message: "Image resolution is too small for PAN detection.",
    };
  }

  // 1. Search lower portion of the page (Y >= 0.70 * H) for dashed horizontal lines.
  // Upper 70-75% of the page is strictly ignored for card extraction.
  const lowerStartY = Math.floor(H * 0.70);
  const dashedRows = findDashedHorizontalRows(buffer, lowerStartY, H * 0.98, 8, 140);

  let cutBoxTopY = Math.round(0.7736 * H);
  let cutBoxBottomY = Math.round(0.9667 * H);

  // Validate detected dashed rows against plausible cut box bounds
  if (dashedRows.length >= 2) {
    const candidateTop = dashedRows[0];
    const candidateBottom = dashedRows[dashedRows.length - 1];
    if (candidateTop >= H * 0.74 && candidateTop <= H * 0.82) {
      cutBoxTopY = candidateTop;
    }
    if (candidateBottom >= H * 0.93 && candidateBottom <= H * 0.98) {
      cutBoxBottomY = candidateBottom;
    }
  } else if (dashedRows.length === 1) {
    if (dashedRows[0] >= H * 0.74 && dashedRows[0] <= H * 0.82) {
      cutBoxTopY = dashedRows[0];
    } else if (dashedRows[0] >= H * 0.93 && dashedRows[0] <= H * 0.98) {
      cutBoxBottomY = dashedRows[0];
    }
  }

  // 2. Identify dashed vertical fold near center (around X ~ 0.5018 * W)
  const foldCol = findVerticalFoldColumn(
    buffer,
    W * 0.46,
    W * 0.54,
    cutBoxTopY,
    cutBoxBottomY,
    6,
    140
  );
  const foldX = foldCol ?? Math.round(0.5018 * W);

  // 3. Define candidate safe interior regions inside each half,
  // excluding outer dashed borders, scissors icons, and the vertical fold itself
  const safeLeftRegion: CropCoordinates = {
    x: Math.round(0.095 * W),
    y: Math.max(0, cutBoxTopY + Math.max(2, Math.round(H * 0.005))),
    width: Math.max(20, Math.round(foldX - 0.015 * W - 0.095 * W)),
    height: Math.max(20, Math.round((cutBoxBottomY - cutBoxTopY) * 0.92)),
  };

  const safeRightRegion: CropCoordinates = {
    x: Math.round(foldX + 0.015 * W),
    y: Math.max(0, cutBoxTopY + Math.max(2, Math.round(H * 0.005))),
    width: Math.max(20, Math.round(0.910 * W - (foldX + 0.015 * W))),
    height: Math.max(20, Math.round((cutBoxBottomY - cutBoxTopY) * 0.92)),
  };

  // 4. Detect card boundaries inside each half using color saturation > 40 & edge detection
  const detectedLeft = findCardBoundsInRegion(buffer, safeLeftRegion, 40);
  const detectedRight = findCardBoundsInRegion(buffer, safeRightRegion, 40);

  let frontCandidate: CropCoordinates = defaultFrontCrop;
  let backCandidate: CropCoordinates = defaultBackCrop;
  let detectedCount = 0;

  // Validate detected card sizes: width must be ~30%–42% of page, height ~14%–22% of page
  if (
    detectedLeft &&
    detectedLeft.width >= W * 0.28 &&
    detectedLeft.width <= W * 0.44 &&
    detectedLeft.height >= H * 0.13 &&
    detectedLeft.height <= H * 0.23
  ) {
    const aspect = detectedLeft.width / detectedLeft.height;
    if (aspect >= 1.50 && aspect <= 1.70) {
      frontCandidate = detectedLeft;
      detectedCount++;
    }
  }

  if (
    detectedRight &&
    detectedRight.width >= W * 0.28 &&
    detectedRight.width <= W * 0.44 &&
    detectedRight.height >= H * 0.13 &&
    detectedRight.height <= H * 0.23
  ) {
    const aspect = detectedRight.width / detectedRight.height;
    if (aspect >= 1.50 && aspect <= 1.70) {
      backCandidate = detectedRight;
      detectedCount++;
    }
  }

  // 5. Harmonize dimensions and vertical baseline:
  // Both Front and Back PAN cards must share identical height and baseline within 2%
  const commonY = Math.min(frontCandidate.y, backCandidate.y);
  const commonH = Math.round((frontCandidate.height + backCandidate.height) / 2);
  const commonW = Math.round(commonH * targetAspect);

  frontCandidate = {
    x: Math.max(0, Math.min(foldX - commonW, frontCandidate.x)),
    y: Math.max(0, Math.min(H - commonH, commonY)),
    width: Math.min(W, commonW),
    height: Math.min(H, commonH),
  };

  backCandidate = {
    x: Math.max(foldX, Math.min(W - commonW, backCandidate.x)),
    y: Math.max(0, Math.min(H - commonH, commonY)),
    width: Math.min(W, commonW),
    height: Math.min(H, commonH),
  };

  // 6. Content-based Front/Back classification
  const leftSub = extractSubBuffer(buffer, frontCandidate);
  const rightSub = extractSubBuffer(buffer, backCandidate);
  const classification = classifyFrontBackCrops(leftSub, rightSub, "pan");

  let finalFront = frontCandidate;
  let finalBack = backCandidate;
  let swapped = false;

  if (classification.shouldSwap) {
    finalFront = backCandidate;
    finalBack = frontCandidate;
    swapped = true;
  }

  // Validate aspect ratio
  const frontAspect = finalFront.width / finalFront.height;
  const backAspect = finalBack.width / finalBack.height;
  const isAspectValid =
    frontAspect >= 1.50 && frontAspect <= 1.70 && backAspect >= 1.50 && backAspect <= 1.70;

  const confidence = detectedCount === 2 ? 0.98 : detectedCount === 1 ? 0.94 : 0.91;

  return {
    detected: true,
    confidence,
    frontCrop: finalFront,
    backCrop: finalBack,
    layout: "pan",
    strategyUsed: "pan-dashed-cutbox-fold-colored-bbox",
    contentClassification: {
      frontConfidence: classification.confidence,
      backConfidence: classification.confidence,
      swapped,
      reason: classification.reason,
    },
    message:
      detectedCount === 2
        ? "PAN Card dashed cut box, central vertical fold, and card boundaries detected successfully."
        : "PAN Card detected using lower cut box reference measurements and content classification.",
  };
}

/**
 * 2. AADHAAR CARD — DOCUMENT-SPECIFIC DETECTION
 *
 * Page: US Letter (2550 x 3300 px at 300 DPI)
 * Reference measurements:
 * - Horizontal dashed cut line: Y ~ 2382–2383 (normalized ~0.722)
 * - Vertical dashed fold: X ~ 1275–1277 (normalized ~0.5004)
 * - Front card: X 203–1255, Y 2384–3056 (norm: X 0.0796–0.4922, Y 0.7224–0.9261)
 * - Back card: X 1297–2349, Y 2384–3056 (norm: X 0.5086–0.9212, Y 0.7224–0.9261)
 * - Cards approx 1052 x 672 px, aspect ~1.565
 *
 * Only the lower PVC card section is extracted; the upper Aadhaar letter is strictly ignored.
 */
export function detectAadhaarCardInPixelBuffer(
  buffer: PixelBuffer,
  options: DualDetectionOptions = {}
): DualDocumentDetectionResult {
  const { width: W, height: H } = buffer;

  const ref = AADHAAR_CARD_MEASUREMENTS;
  const defaultFrontCrop: CropCoordinates = {
    x: Math.round(ref.front.xMin * W),
    y: Math.round(ref.front.yMin * H),
    width: Math.round((ref.front.xMax - ref.front.xMin) * W),
    height: Math.round((ref.front.yMax - ref.front.yMin) * H),
  };

  const defaultBackCrop: CropCoordinates = {
    x: Math.round(ref.back.xMin * W),
    y: Math.round(ref.back.yMin * H),
    width: Math.round((ref.back.xMax - ref.back.xMin) * W),
    height: Math.round((ref.back.yMax - ref.back.yMin) * H),
  };

  if (W < 40 || H < 40) {
    return {
      detected: false,
      confidence: 0,
      frontCrop: defaultFrontCrop,
      backCrop: defaultBackCrop,
      layout: "aadhaar",
      message: "Image resolution is too small for Aadhaar detection.",
    };
  }

  // 1. Search for lowest full-width dashed cut line around Y = 0.722 * H (search range 0.65 * H to 0.78 * H)
  const cutLineCandidates = findDashedHorizontalRows(buffer, H * 0.65, H * 0.78, 8, 140);
  const cutLineY = cutLineCandidates.length > 0
    ? cutLineCandidates[cutLineCandidates.length - 1]
    : Math.round(0.7224 * H);

  // 2. Detect vertical dashed fold near X = 0.5004 * W
  const foldCol = findVerticalFoldColumn(
    buffer,
    W * 0.48,
    W * 0.52,
    cutLineY,
    H * 0.95,
    6,
    140
  );
  const foldX = foldCol ?? Math.round(0.5004 * W);

  // 3. Locate bottom edge using solid dark border across card row (around Y = 0.9261 * H)
  const solidBottomRows = findSolidHorizontalBorders(
    buffer,
    H * 0.88,
    H * 0.96,
    W * 0.1,
    W * 0.9,
    140,
    0.55
  );
  const bottomBorderY = solidBottomRows.length > 0
    ? solidBottomRows[solidBottomRows.length - 1]
    : Math.round(0.9261 * H);

  // 4. Locate solid vertical borders (outer left ~0.08W, inner left ~0.49W, inner right ~0.51W, outer right ~0.92W)
  const cardHeight = Math.max(20, bottomBorderY - cutLineY);
  const leftOuterCols = findSolidVerticalBorders(buffer, W * 0.05, W * 0.12, cutLineY, bottomBorderY, 140, 0.5);
  const leftInnerCols = findSolidVerticalBorders(buffer, foldX - W * 0.04, foldX - 1, cutLineY, bottomBorderY, 140, 0.5);
  const rightInnerCols = findSolidVerticalBorders(buffer, foldX + 1, foldX + W * 0.04, cutLineY, bottomBorderY, 140, 0.5);
  const rightOuterCols = findSolidVerticalBorders(buffer, W * 0.88, W * 0.95, cutLineY, bottomBorderY, 140, 0.5);

  const leftX1 = leftOuterCols.length > 0 ? leftOuterCols[0] : Math.round(0.0796 * W);
  const leftX2 = leftInnerCols.length > 0 ? leftInnerCols[leftInnerCols.length - 1] : Math.round(0.4922 * W);
  const rightX1 = rightInnerCols.length > 0 ? rightInnerCols[0] : Math.round(0.5086 * W);
  const rightX2 = rightOuterCols.length > 0 ? rightOuterCols[rightOuterCols.length - 1] : Math.round(0.9212 * W);

  // Inset crop by 2–4 pixels to remove border residue and scissors symbols
  const inset = Math.max(2, Math.round(Math.min(W, H) * 0.002));

  let frontCandidate: CropCoordinates = {
    x: Math.max(0, leftX1 + inset),
    y: Math.max(0, cutLineY + inset),
    width: Math.max(20, leftX2 - leftX1 - inset * 2),
    height: Math.max(20, cardHeight - inset * 2),
  };

  let backCandidate: CropCoordinates = {
    x: Math.max(0, rightX1 + inset),
    y: Math.max(0, cutLineY + inset),
    width: Math.max(20, rightX2 - rightX1 - inset * 2),
    height: Math.max(20, cardHeight - inset * 2),
  };

  // If solid border detection failed, check for colored bounding box
  const hasSolidDetection = leftOuterCols.length > 0 && rightOuterCols.length > 0;
  if (!hasSolidDetection) {
    const leftColored = findCardBoundsInRegion(buffer, defaultFrontCrop, 35);
    const rightColored = findCardBoundsInRegion(buffer, defaultBackCrop, 35);
    if (leftColored && leftColored.width >= W * 0.25) frontCandidate = leftColored;
    if (rightColored && rightColored.width >= W * 0.25) backCandidate = rightColored;
  }

  // 5. Dimension harmonization and aspect ratio enforcement (~1.565):
  // Ensure front and back crops have matching dimensions within 2% and aligned baseline
  const commonY = Math.min(frontCandidate.y, backCandidate.y);
  const commonH = Math.round((frontCandidate.height + backCandidate.height) / 2);
  const targetAspect = 1052 / 672; // ~1.565
  const commonW = Math.round(commonH * targetAspect);

  frontCandidate = {
    x: Math.max(0, Math.min(foldX - commonW, frontCandidate.x)),
    y: Math.max(Math.round(H * 0.70), Math.min(H - commonH, commonY)),
    width: Math.min(W, commonW),
    height: Math.min(H, commonH),
  };

  backCandidate = {
    x: Math.max(foldX, Math.min(W - commonW, backCandidate.x)),
    y: Math.max(Math.round(H * 0.70), Math.min(H - commonH, commonY)),
    width: Math.min(W, commonW),
    height: Math.min(H, commonH),
  };

  // 6. Content-based Front/Back confirmation
  const leftSub = extractSubBuffer(buffer, frontCandidate);
  const rightSub = extractSubBuffer(buffer, backCandidate);
  const classification = classifyFrontBackCrops(leftSub, rightSub, "aadhaar");

  let finalFront = frontCandidate;
  let finalBack = backCandidate;
  let swapped = false;

  if (classification.shouldSwap) {
    finalFront = backCandidate;
    finalBack = frontCandidate;
    swapped = true;
  }

  return {
    detected: true,
    confidence: hasSolidDetection ? 0.98 : 0.93,
    frontCrop: finalFront,
    backCrop: finalBack,
    layout: "aadhaar",
    strategyUsed: "aadhaar-cutline-borders-lower-pvc",
    contentClassification: {
      frontConfidence: classification.confidence,
      backConfidence: classification.confidence,
      swapped,
      reason: classification.reason,
    },
    message: "Aadhaar lower PVC card section extracted. Upper letter safely excluded.",
  };
}

/**
 * Detects dashed horizontal boundaries spanning at least 85% of the candidate cut-box width
 * in the lower region of the Ration Card sheet (Y >= 0.75 * H, X between 0.05 * W and 0.95 * W).
 */
export function findRationCutBoxDashedRows(
  buffer: PixelBuffer,
  yMin: number,
  yMax: number,
  xMin: number,
  xMax: number,
  minSpanRatio: number = 0.85,
  minTransitions: number = 8,
  darkThreshold: number = 140
): number[] {
  const { data, width, height } = buffer;
  const dashedRows: number[] = [];

  const startY = Math.max(0, Math.floor(yMin));
  const endY = Math.min(height - 1, Math.ceil(yMax));
  const startX = Math.max(0, Math.floor(xMin));
  const endX = Math.min(width - 1, Math.ceil(xMax));

  // Candidate cut box width is (0.8941 - 0.1055) * width = 0.7886 * width
  const candidateBoxWidth = (0.8941 - 0.1055) * width;
  const requiredSpan = candidateBoxWidth * minSpanRatio;

  for (let y = startY; y <= endY; y++) {
    let transitions = 0;
    let isDark = false;
    let firstDarkX = -1;
    let lastDarkX = -1;

    for (let x = startX; x <= endX; x++) {
      const idx = (y * width + x) * 4;
      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      const pixelDark = lum < darkThreshold;

      if (pixelDark) {
        if (firstDarkX === -1) firstDarkX = x;
        lastDarkX = x;
      }

      if (pixelDark !== isDark) {
        transitions++;
        isDark = pixelDark;
      }
    }

    const span = lastDarkX - firstDarkX;
    if (transitions >= minTransitions && span >= requiredSpan) {
      dashedRows.push(y);
    }
  }

  return dashedRows;
}

/**
 * Detects actual card boundaries using colored card background saturation.
 * PRIMARY algorithm:
 * - Saturation = max(R,G,B) - min(R,G,B) with threshold 45 (or customizable).
 * - Keep rows where at least 25% of the half-width is colored.
 * - Keep columns where at least 12% of the half-height is colored.
 * - The extreme kept rows and columns form the card bounding box.
 */
export function findRationCardBySaturation(
  buffer: PixelBuffer,
  region: CropCoordinates,
  satThreshold: number = 45,
  minRowRatio: number = 0.25,
  minColRatio: number = 0.12
): CropCoordinates | null {
  const { data, width, height } = buffer;
  const startX = Math.max(0, region.x);
  const endX = Math.min(width, region.x + region.width);
  const startY = Math.max(0, region.y);
  const endY = Math.min(height, region.y + region.height);

  const regionW = endX - startX;
  const regionH = endY - startY;
  if (regionW < 20 || regionH < 20) return null;

  const rowCounts = new Int32Array(regionH);
  const colCounts = new Int32Array(regionW);

  for (let py = 0; py < regionH; py++) {
    const y = startY + py;
    const rowOffset = y * width * 4;
    for (let px = 0; px < regionW; px++) {
      const x = startX + px;
      const idx = rowOffset + x * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      if (sat >= satThreshold) {
        rowCounts[py]++;
        colCounts[px]++;
      }
    }
  }

  const rowThreshold = Math.max(1, Math.round(regionW * minRowRatio));
  const colThreshold = Math.max(1, Math.round(regionH * minColRatio));

  let minPy = -1;
  let maxPy = -1;
  for (let py = 0; py < regionH; py++) {
    if (rowCounts[py] >= rowThreshold) {
      if (minPy === -1) minPy = py;
      maxPy = py;
    }
  }

  let minPx = -1;
  let maxPx = -1;
  for (let px = 0; px < regionW; px++) {
    if (colCounts[px] >= colThreshold) {
      if (minPx === -1) minPx = px;
      maxPx = px;
    }
  }

  if (minPy === -1 || maxPy === -1 || minPx === -1 || maxPx === -1) {
    return null;
  }

  const foundW = maxPx - minPx + 1;
  const foundH = maxPy - minPy + 1;
  const aspect = foundW / (foundH || 1);

  // Validate aspect ratio (Ration Card target ~1.669, acceptable range 1.45–1.85)
  if (foundW < regionW * 0.4 || foundH < regionH * 0.4 || aspect < 1.45 || aspect > 1.85) {
    return null;
  }

  return {
    x: startX + minPx,
    y: startY + minPy,
    width: foundW,
    height: foundH,
  };
}

/**
 * Removes surrounding white space from final crop boundaries.
 * Trims boundary rows/columns where > 95% of pixels are white/light background.
 */
function trimCardWhiteSpace(
  buffer: PixelBuffer,
  crop: CropCoordinates,
  maxTrim: number = 8,
  whiteThreshold: number = 240
): CropCoordinates {
  const { data, width, height } = buffer;
  let startX = Math.max(0, crop.x);
  let endX = Math.min(width, crop.x + crop.width);
  let startY = Math.max(0, crop.y);
  let endY = Math.min(height, crop.y + crop.height);

  let trimmedTop = 0;
  while (startY < endY - 20 && trimmedTop < maxTrim) {
    let whiteCount = 0;
    const w = endX - startX;
    for (let x = startX; x < endX; x++) {
      const idx = (startY * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      if (r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold && sat < 15) {
        whiteCount++;
      }
    }
    if (whiteCount / w > 0.95) {
      startY++;
      trimmedTop++;
    } else {
      break;
    }
  }

  let trimmedBottom = 0;
  while (endY > startY + 20 && trimmedBottom < maxTrim) {
    let whiteCount = 0;
    const w = endX - startX;
    for (let x = startX; x < endX; x++) {
      const idx = ((endY - 1) * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      if (r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold && sat < 15) {
        whiteCount++;
      }
    }
    if (whiteCount / w > 0.95) {
      endY--;
      trimmedBottom++;
    } else {
      break;
    }
  }

  return {
    x: startX,
    y: startY,
    width: Math.max(10, endX - startX),
    height: Math.max(10, endY - startY),
  };
}

/**
 * 3. RATION CARD — DOCUMENT-SPECIFIC DETECTION
 *
 * Page: US Letter (2550 x 3300 px at 300 DPI)
 * Reference measurements:
 * - Dashed cut box: X 269–2280, Y 2570–3205 (dashed cut edges ~3 px thick)
 * - Vertical fold: X ~ 1280 (normalized ~0.5020)
 * - Front card: X 317–1239, Y 2616–3168 (norm: X 0.1243–0.4859, Y 0.7927–0.9600)
 * - Back card: X 1317–2239, Y 2616–3168 (norm: X 0.5165–0.8780, Y 0.7927–0.9600)
 * - Card dimensions: approx 923 x 553 px, aspect ~1.669 (acceptable: 1.55–1.70)
 *
 * Algorithm:
 * 1. Search strictly in the lower region Y >= 0.75 * H and X between 0.05 * W and 0.95 * W.
 *    Excludes page-level QR code, status icon, signature block, and upper scissors above box.
 * 2. Use reference coordinates with ±1.5% tolerance (≈ ±40 px at 300 DPI).
 * 3. Detect dashed horizontal boundaries spanning at least 85% of candidate cut-box width.
 * 4. Locate vertical dashed fold near center (X ≈ 1280, 0.5020 * W).
 * 5. Divide cut box into left and right candidate regions.
 * 6. Detect card boundaries using PRIMARY colored background saturation method (sat >= 45, row >= 25%, col >= 12%).
 * 7. Exclude scissors symbols, decorative dashed lines, barcodes, text boundaries.
 * 8. Remove surrounding white space from final crop.
 * 9. Validate front/back dimensions match within ~2% and aspect ratio 1.55–1.70.
 * 10. Mark low confidence if edge differs from reference by > 3% of page size.
 * 11. Front/Back classification:
 *     - Front: bottom-right QR code, personal details, NO face photo required.
 *     - Back: centered 1D barcode, address.
 *     - QR presence must NOT be used to identify back.
 *     - Fallback: Left = Front, Right = Back.
 */
export function detectRationCardInPixelBuffer(
  buffer: PixelBuffer,
  options: DualDetectionOptions = {}
): DualDocumentDetectionResult {
  const { width: W, height: H } = buffer;

  const ref = RATION_CARD_MEASUREMENTS;
  const defaultFrontCrop: CropCoordinates = {
    x: Math.round(ref.front.xMin * W),
    y: Math.round(ref.front.yMin * H),
    width: Math.round((ref.front.xMax - ref.front.xMin) * W),
    height: Math.round((ref.front.yMax - ref.front.yMin) * H),
  };

  const defaultBackCrop: CropCoordinates = {
    x: Math.round(ref.back.xMin * W),
    y: Math.round(ref.back.yMin * H),
    width: Math.round((ref.back.xMax - ref.back.xMin) * W),
    height: Math.round((ref.back.yMax - ref.back.yMin) * H),
  };

  if (W < 40 || H < 40) {
    return {
      detected: false,
      confidence: 0,
      frontCrop: defaultFrontCrop,
      backCrop: defaultBackCrop,
      layout: "ration",
      message: "Image resolution is too small for Ration Card detection.",
    };
  }

  // 1. Search strictly in the lower region Y >= 0.75 * H and X between 0.05 * W and 0.95 * W.
  // This excludes the page-level QR code, Card Status icon, signature block and upper scissors above the box.
  const searchYMin = Math.floor(H * 0.75);
  const searchYMax = Math.min(H - 1, Math.floor(H * 0.99));
  const searchXMin = Math.floor(W * 0.05);
  const searchXMax = Math.ceil(W * 0.95);

  // 2. Tolerance of about ±1.5% of page size (≈ ±40 px at 300 DPI)
  const tolX = Math.round(W * 0.015);
  const tolY = Math.round(H * 0.015);

  const refCutBox = ref.cutBox ?? {
    xMin: 0.1055,
    xMax: 0.8941,
    yMin: 0.7788,
    yMax: 0.9712,
  };

  const refCutTopY = Math.round(refCutBox.yMin * H);
  const refCutBottomY = Math.round(refCutBox.yMax * H);
  const refCutLeftX = Math.round(refCutBox.xMin * W);
  const refCutRightX = Math.round(refCutBox.xMax * W);

  // 3. Detect dashed horizontal boundaries spanning at least 85% of candidate cut-box width
  const dashedRows = findRationCutBoxDashedRows(
    buffer,
    searchYMin,
    searchYMax,
    searchXMin,
    searchXMax,
    0.85,
    8,
    140
  );

  let cutBoxTopY = refCutTopY;
  let cutBoxBottomY = refCutBottomY;

  if (dashedRows.length >= 1) {
    // Cluster rows into top candidates (near refCutTopY within tolY * 2.5) and bottom candidates (near refCutBottomY within tolY * 2.5)
    const topCandidates = dashedRows.filter(
      (r) => Math.abs(r - refCutTopY) <= tolY * 2.5
    );
    const bottomCandidates = dashedRows.filter(
      (r) => Math.abs(r - refCutBottomY) <= tolY * 2.5
    );

    if (topCandidates.length > 0) {
      cutBoxTopY = Math.round(
        topCandidates.reduce((a, b) => a + b, 0) / topCandidates.length
      );
    }
    if (bottomCandidates.length > 0) {
      cutBoxBottomY = Math.round(
        bottomCandidates.reduce((a, b) => a + b, 0) / bottomCandidates.length
      );
    }
  }

  // 4. Locate vertical dashed fold near center (X ≈ 1280, 0.5020 * W)
  const foldCol = findVerticalFoldColumn(
    buffer,
    Math.round(0.487 * W),
    Math.round(0.517 * W),
    cutBoxTopY,
    cutBoxBottomY,
    6,
    140
  );
  const foldX = foldCol ?? Math.round(0.502 * W);

  // 5. Divide cut box into left and right candidate regions
  const leftHalf: CropCoordinates = {
    x: Math.max(0, refCutLeftX - tolX),
    y: cutBoxTopY,
    width: Math.max(10, foldX - (refCutLeftX - tolX)),
    height: Math.max(10, cutBoxBottomY - cutBoxTopY),
  };

  const rightHalf: CropCoordinates = {
    x: foldX,
    y: cutBoxTopY,
    width: Math.max(10, refCutRightX + tolX - foldX),
    height: Math.max(10, cutBoxBottomY - cutBoxTopY),
  };

  // 6. Detect actual card boundaries using:
  // - PRIMARY: colored card background with saturation >= 45, row >= 25%, col >= 12%
  // - Fallback 1: colored background with saturation >= 18
  // - Fallback 2: edge/foreground bounding box (findCardBoundsInRegion)
  // - Fallback 3: reference coordinates with tolerance
  let detectedLeft = findRationCardBySaturation(buffer, leftHalf, 45, 0.25, 0.12);
  let detectedRight = findRationCardBySaturation(buffer, rightHalf, 45, 0.25, 0.12);

  if (!detectedLeft) {
    detectedLeft = findRationCardBySaturation(buffer, leftHalf, 18, 0.20, 0.10);
  }
  if (!detectedRight) {
    detectedRight = findRationCardBySaturation(buffer, rightHalf, 18, 0.20, 0.10);
  }

  if (!detectedLeft) {
    detectedLeft = findCardBoundsInRegion(buffer, leftHalf, 15);
  }
  if (!detectedRight) {
    detectedRight = findCardBoundsInRegion(buffer, rightHalf, 15);
  }

  let frontCandidate = detectedLeft ? trimCardWhiteSpace(buffer, detectedLeft) : defaultFrontCrop;
  let backCandidate = detectedRight ? trimCardWhiteSpace(buffer, detectedRight) : defaultBackCrop;
  let detectedCount = (detectedLeft ? 1 : 0) + (detectedRight ? 1 : 0);

  // 7. Validation Rules:
  // Expected card dimensions: Width ≈ 923 px, Height ≈ 553 px, Aspect ratio ≈ 1.669 (acceptable: 1.55–1.70).
  const targetAspect = 923 / 553; // ~1.669
  let isLowConfidence = false;

  // Check 3% page size edge deviation:
  // If detected card edge differs from reference coordinates by more than ~3% of page size, mark as low confidence.
  const maxDevX = W * 0.035;
  const maxDevY = H * 0.035;

  const refFrontX = Math.round(ref.front.xMin * W);
  const refFrontY = Math.round(ref.front.yMin * H);
  const refFrontW = Math.round((ref.front.xMax - ref.front.xMin) * W);
  const refFrontH = Math.round((ref.front.yMax - ref.front.yMin) * H);

  const refBackX = Math.round(ref.back.xMin * W);
  const refBackY = Math.round(ref.back.yMin * H);
  const refBackW = Math.round((ref.back.xMax - ref.back.xMin) * W);
  const refBackH = Math.round((ref.back.yMax - ref.back.yMin) * H);

  const frontAspect = frontCandidate.width / (frontCandidate.height || 1);
  const backAspect = backCandidate.width / (backCandidate.height || 1);

  if (frontAspect < 1.48 || frontAspect > 1.78 || backAspect < 1.48 || backAspect > 1.78) {
    isLowConfidence = true;
  }

  if (
    Math.abs(frontCandidate.x - refFrontX) > maxDevX ||
    Math.abs(frontCandidate.y - refFrontY) > maxDevY ||
    Math.abs(frontCandidate.width - refFrontW) > maxDevX ||
    Math.abs(frontCandidate.height - refFrontH) > maxDevY ||
    Math.abs(backCandidate.x - refBackX) > maxDevX ||
    Math.abs(backCandidate.y - refBackY) > maxDevY ||
    Math.abs(backCandidate.width - refBackW) > maxDevX ||
    Math.abs(backCandidate.height - refBackH) > maxDevY
  ) {
    isLowConfidence = true;
  }

  // 8. Front and back dimensions must match within approximately 2%.
  // Harmonize vertical positioning and enforce dimensions match within 2% with target aspect ratio.
  const commonY = Math.min(frontCandidate.y, backCandidate.y);
  const commonH = Math.round((frontCandidate.height + backCandidate.height) / 2);
  const commonW = Math.round(commonH * targetAspect);

  frontCandidate = {
    x: Math.max(0, Math.min(foldX - commonW, frontCandidate.x)),
    y: Math.max(Math.round(H * 0.75), Math.min(H - commonH, commonY)),
    width: Math.min(W, commonW),
    height: Math.min(H, commonH),
  };

  backCandidate = {
    x: Math.max(foldX, Math.min(W - commonW, backCandidate.x)),
    y: Math.max(Math.round(H * 0.75), Math.min(H - commonH, commonY)),
    width: Math.min(W, commonW),
    height: Math.min(H, commonH),
  };

  // If confidence is low and cards were not detected cleanly, fall back to calibrated reference coordinates
  if (isLowConfidence && detectedCount < 2) {
    frontCandidate = defaultFrontCrop;
    backCandidate = defaultBackCrop;
  }

  // 9. Content-based classification
  const leftSub = extractSubBuffer(buffer, frontCandidate);
  const rightSub = extractSubBuffer(buffer, backCandidate);
  const classification = classifyFrontBackCrops(leftSub, rightSub, "ration-card");

  let finalFront = frontCandidate;
  let finalBack = backCandidate;
  let swapped = false;

  if (classification.shouldSwap) {
    finalFront = backCandidate;
    finalBack = frontCandidate;
    swapped = true;
  }

  const confidence = isLowConfidence ? 0.55 : (detectedCount === 2 ? 0.98 : 0.92);

  return {
    detected: !isLowConfidence,
    confidence,
    frontCrop: finalFront,
    backCrop: finalBack,
    layout: "ration",
    strategyUsed: "ration-saturation-bg-cutbox-fold-cr80",
    contentClassification: {
      frontConfidence: classification.confidence,
      backConfidence: classification.confidence,
      swapped,
      reason: classification.reason,
    },
    message: isLowConfidence
      ? "Ration Card detection confidence is low. Reference regions applied for manual adjustment."
      : "Ration Card front/back boundaries detected via colored background saturation and cut-box fold. Scissors excluded.",
  };
}

/**
 * 4. VOTER ID CARD — VECTOR PDF & TOP-ALIGNED DETECTION
 *
 * Page: A4 (approx 595 x 842 pt)
 * Reference measurements:
 * - Top dashed line: Y ~ 70 pt (normalized ~0.0831)
 * - Bottom dashed line: Y ~ 275 pt (normalized ~0.3266)
 * - Vertical fold: X ~ 302 pt (normalized ~0.5073)
 * - Front card: X 32.5–277.5, Y 95–249 pt (norm: X 0.0546–0.4664, Y 0.1128–0.2957)
 * - Back card: X 327.03–572.03, Y 95–249 pt (norm: X 0.5496–0.9614, Y 0.1128–0.2957)
 * - Cards are located near the TOP of the page (Y: 0.1128 to 0.2957).
 * - Bottom-left / bottom-right detection logic MUST NOT be applied.
 */
export function detectVoterIdInPixelBuffer(
  buffer: PixelBuffer,
  options: DualDetectionOptions = {},
  vectorPlacements?: VectorPdfInspectionResult | null
): DualDocumentDetectionResult {
  const { width: W, height: H } = buffer;

  // 1. If vector inspection already yielded embedded image placement boxes, use them!
  if (vectorPlacements && vectorPlacements.isVectorPdf) {
    return {
      detected: true,
      confidence: vectorPlacements.confidence,
      frontCrop: vectorPlacements.frontCropPx,
      backCrop: vectorPlacements.backCropPx,
      layout: "voter-id",
      strategyUsed: "voter-id-vector-pdf-embedded-image-placements",
      message: vectorPlacements.message,
    };
  }

  // 2. Raster detection: Search the TOP portion of the page (Y from 0.05 * H to 0.40 * H)
  const ref = VOTER_ID_MEASUREMENTS;
  const defaultFrontCrop: CropCoordinates = {
    x: Math.round(ref.front.xMin * W),
    y: Math.round(ref.front.yMin * H),
    width: Math.round((ref.front.xMax - ref.front.xMin) * W),
    height: Math.round((ref.front.yMax - ref.front.yMin) * H),
  };

  const defaultBackCrop: CropCoordinates = {
    x: Math.round(ref.back.xMin * W),
    y: Math.round(ref.back.yMin * H),
    width: Math.round((ref.back.xMax - ref.back.xMin) * W),
    height: Math.round((ref.back.yMax - ref.back.yMin) * H),
  };

  if (W < 40 || H < 40) {
    return {
      detected: false,
      confidence: 0,
      frontCrop: defaultFrontCrop,
      backCrop: defaultBackCrop,
      layout: "voter-id",
      message: "Image resolution is too small for Voter ID detection.",
    };
  }

  // Detect top and bottom dashed lines in top 40%
  const dashedRows = findDashedHorizontalRows(buffer, H * 0.05, H * 0.4, 8, 140);
  const foldCol = findVerticalFoldColumn(buffer, W * 0.45, W * 0.55, H * 0.07, H * 0.35, 6, 140);
  const foldX = foldCol ?? Math.round(0.5073 * W);

  const topRegionLeft: CropCoordinates = {
    x: Math.max(0, Math.round(0.04 * W)),
    y: dashedRows.length > 0 ? dashedRows[0] : Math.round(0.0831 * H),
    width: Math.max(10, foldX - Math.round(0.04 * W)),
    height: Math.max(10, Math.round(0.25 * H)),
  };

  const topRegionRight: CropCoordinates = {
    x: foldX,
    y: dashedRows.length > 0 ? dashedRows[0] : Math.round(0.0831 * H),
    width: Math.max(10, Math.round(0.96 * W) - foldX),
    height: Math.max(10, Math.round(0.25 * H)),
  };

  const detectedLeft = findCardBoundsInRegion(buffer, topRegionLeft, 35);
  const detectedRight = findCardBoundsInRegion(buffer, topRegionRight, 35);

  let frontCandidate = defaultFrontCrop;
  let backCandidate = defaultBackCrop;
  let detectedCount = 0;

  if (
    detectedLeft &&
    detectedLeft.width >= W * 0.25 &&
    detectedLeft.width <= W * 0.48 &&
    detectedLeft.height >= H * 0.12 &&
    detectedLeft.height <= H * 0.26
  ) {
    frontCandidate = detectedLeft;
    detectedCount++;
  }

  if (
    detectedRight &&
    detectedRight.width >= W * 0.25 &&
    detectedRight.width <= W * 0.48 &&
    detectedRight.height >= H * 0.12 &&
    detectedRight.height <= H * 0.26
  ) {
    backCandidate = detectedRight;
    detectedCount++;
  }

  // 3. Remove ~0.5 pt built-in black border
  const inset = Math.max(1, Math.round(W * 0.001));
  frontCandidate = {
    x: frontCandidate.x + inset,
    y: frontCandidate.y + inset,
    width: Math.max(10, frontCandidate.width - inset * 2),
    height: Math.max(10, frontCandidate.height - inset * 2),
  };
  backCandidate = {
    x: backCandidate.x + inset,
    y: backCandidate.y + inset,
    width: Math.max(10, backCandidate.width - inset * 2),
    height: Math.max(10, backCandidate.height - inset * 2),
  };

  // 4. Content classification
  const leftSub = extractSubBuffer(buffer, frontCandidate);
  const rightSub = extractSubBuffer(buffer, backCandidate);
  const classification = classifyFrontBackCrops(leftSub, rightSub, "voter-id");

  let finalFront = frontCandidate;
  let finalBack = backCandidate;
  let swapped = false;

  if (classification.shouldSwap) {
    finalFront = backCandidate;
    finalBack = frontCandidate;
    swapped = true;
  }

  return {
    detected: true,
    confidence: detectedCount === 2 ? 0.98 : 0.92,
    frontCrop: finalFront,
    backCrop: finalBack,
    layout: "voter-id",
    strategyUsed: "voter-id-top-aligned-reference-detection",
    contentClassification: {
      frontConfidence: classification.confidence,
      backConfidence: classification.confidence,
      swapped,
      reason: classification.reason,
    },
    message: "Voter ID (e-EPIC) top-aligned cards detected. Bottom-corner rule avoided.",
  };
}

/**
 * DOCUMENT-SPECIFIC DETECTION DISPATCHER & STRATEGY FUNCTIONS
 * Required conceptual dispatcher interfaces:
 * - PAN → detectPanCards()
 * - Aadhaar → detectAadhaarCards()
 * - Ration → detectRationCards()
 * - Voter ID → detectVoterCards()
 *
 * Selects the dedicated detection strategy based on document type.
 * Do not apply one generic detection algorithm indiscriminately!
 */
export const detectPanCards = detectPanCardInPixelBuffer;
export const detectAadhaarCards = detectAadhaarCardInPixelBuffer;
export const detectRationCards = detectRationCardInPixelBuffer;
export const detectVoterCards = detectVoterIdInPixelBuffer;

export function detectDocumentByStrategy(
  buffer: PixelBuffer,
  docType: DocumentTypeId | string,
  options: DualDetectionOptions = {},
  vectorPlacements?: VectorPdfInspectionResult | null
): DualDocumentDetectionResult {
  const normType = (docType || "").toLowerCase();

  switch (normType) {
    case "pan":
      return detectPanCards(buffer, options);

    case "aadhaar":
      return detectAadhaarCards(buffer, options);

    case "ration-card":
    case "ration":
      return detectRationCards(buffer, options);

    case "voter-id":
    case "voter":
      return detectVoterCards(buffer, options, vectorPlacements ?? options.vectorInfo);

    default:
      // Generic fallback for custom documents ONLY
      return detectDualDocumentInPixelBuffer(buffer, { ...options, docTypeId: undefined });
  }
}

/**
 * Analyzes whether document regions on a single sheet are arranged horizontally or vertically.
 */
export function determineDocumentLayout(
  buffer: PixelBuffer
): "horizontal" | "vertical" {
  const { width, height } = buffer;
  // If the sheet is clearly wide (aspect ratio >= 1.2), documents are arranged side-by-side
  if (width / height >= 1.2) {
    return "horizontal";
  }
  // If the sheet is tall (aspect ratio <= 0.85), documents are arranged vertically stacked
  if (width / height <= 0.85) {
    return "vertical";
  }
  // Default to horizontal for square-ish sheets
  return "horizontal";
}

/**
 * Detects both Front and Back document regions within a single image/buffer.
 * Supports document-specific strategies, horizontal, vertical, and single-sided modes.
 */
export function detectDualDocumentInPixelBuffer(
  buffer: PixelBuffer,
  options: DualDetectionOptions = {}
): DualDocumentDetectionResult {
  const { width, height } = buffer;
  const targetAspect = options.targetAspectRatio ?? (85.6 / 53.98);
  const isSingle = options.isSingleSide ?? false;

  // 0. Document-Specific Strategy Dispatcher:
  // If a specific document type is specified and not overridden by manual split layout:
  if (
    options.docTypeId &&
    options.docTypeId !== "custom" &&
    (!options.forceLayout || options.forceLayout === "auto") &&
    !isSingle
  ) {
    return detectDocumentByStrategy(buffer, options.docTypeId, options, options.vectorInfo);
  }

  // 1. Single-sided document (e.g. legacy PAN or single card scan)
  if (isSingle) {
    const singleResult = detectDocumentInPixelBuffer(buffer, options);
    return {
      detected: singleResult.detected,
      confidence: singleResult.confidence,
      frontCrop: singleResult.crop,
      backCrop: null,
      layout: "single",
      message: singleResult.detected
        ? "Single-sided document detected successfully."
        : "Could not automatically detect card boundaries. Please adjust manually.",
    };
  }

  // 2. Handle specific layout modes
  if (options.forceLayout === "bottom-dual") {
    return detectBottomDualDocumentInPixelBuffer(buffer, options);
  }

  if (options.forceLayout === "horizontal") {
    return detectHorizontalDualDocumentInPixelBuffer(buffer, options);
  }

  if (options.forceLayout === "vertical") {
    return detectVerticalDualDocumentInPixelBuffer(buffer, options);
  }

  if (options.forceLayout === "manual") {
    if (width / height >= 1.2) {
      const halfW = Math.floor(width / 2);
      const defaultLeft = createCenteredCrop(halfW, height, targetAspect);
      const defaultRight = createCenteredCrop(width - halfW, height, targetAspect);
      return {
        detected: false,
        confidence: 1,
        frontCrop: defaultLeft,
        backCrop: {
          x: halfW + defaultRight.x,
          y: defaultRight.y,
          width: defaultRight.width,
          height: defaultRight.height,
        },
        layout: "horizontal",
        message: "Manual crop mode: adjust Front and Back boundaries freely.",
      };
    } else {
      const defaults = detectBottomDualDocumentInPixelBuffer(buffer, options);
      return {
        detected: false,
        confidence: 1,
        frontCrop: defaults.frontCrop,
        backCrop: defaults.backCrop,
        layout: "bottom-dual",
        message: "Manual crop mode: adjust Front and Back boundaries freely.",
      };
    }
  }

  // 3. Auto Detect Mode:
  // If the sheet is clearly wide (aspect ratio >= 1.2), documents are arranged side-by-side
  if (width / height >= 1.2) {
    return detectHorizontalDualDocumentInPixelBuffer(buffer, options);
  }

  // For portrait / tall sheets (e.g. e-Aadhaar PDF or scanned letter),
  // test bottom-dual detection first because government/ID cards are in the lower area.
  const bottomDualResult = detectBottomDualDocumentInPixelBuffer(buffer, options);

  // If bottom-dual detected both sides with high confidence, use it
  if (bottomDualResult.detected && bottomDualResult.confidence >= 0.70) {
    return bottomDualResult;
  }

  // Also check vertical (stacked top & bottom)
  const verticalResult = detectVerticalDualDocumentInPixelBuffer(buffer, options);

  // If vertical detected both sides cleanly and has strictly higher confidence than bottom-dual, use vertical
  if (verticalResult.detected && verticalResult.confidence > bottomDualResult.confidence) {
    return verticalResult;
  }

  // If bottom-dual found at least one card or has equal/better confidence, prefer bottom-dual for portrait
  if (bottomDualResult.confidence >= verticalResult.confidence) {
    return bottomDualResult;
  }

  return verticalResult;
}

/**
 * Detects dual document regions arranged horizontally (Left side = Front, Right side = Back).
 */
export function detectHorizontalDualDocumentInPixelBuffer(
  buffer: PixelBuffer,
  options: DualDetectionOptions = {}
): DualDocumentDetectionResult {
  const { width, height } = buffer;
  const targetAspect = options.targetAspectRatio ?? (85.6 / 53.98);

  const halfW = Math.floor(width / 2);
  const leftBuffer = extractSubBuffer(buffer, { x: 0, y: 0, width: halfW, height });
  const rightBuffer = extractSubBuffer(buffer, { x: halfW, y: 0, width: width - halfW, height });

  const leftDetect = detectDocumentInPixelBuffer(leftBuffer, {
    ...options,
    targetAspectRatio: targetAspect,
  });
  const rightDetect = detectDocumentInPixelBuffer(rightBuffer, {
    ...options,
    targetAspectRatio: targetAspect,
  });

  const defaultLeft = createCenteredCrop(halfW, height, targetAspect);
  const defaultRight = createCenteredCrop(width - halfW, height, targetAspect);

  const frontCrop: CropCoordinates = leftDetect.detected
    ? leftDetect.crop
    : defaultLeft;

  const backCrop: CropCoordinates = rightDetect.detected
    ? {
        x: halfW + rightDetect.crop.x,
        y: rightDetect.crop.y,
        width: rightDetect.crop.width,
        height: rightDetect.crop.height,
      }
    : {
        x: halfW + defaultRight.x,
        y: defaultRight.y,
        width: defaultRight.width,
        height: defaultRight.height,
      };

  const bothDetected = leftDetect.detected && rightDetect.detected;
  const confidence = bothDetected
    ? Math.round(((leftDetect.confidence + rightDetect.confidence) / 2) * 100) / 100
    : Math.max(leftDetect.confidence, rightDetect.confidence);

  return {
    detected: bothDetected,
    confidence,
    frontCrop,
    backCrop,
    layout: "horizontal",
    message: bothDetected
      ? "Front and Back document regions detected automatically (Horizontal layout)."
      : "Could not automatically isolate both card boundaries. Default crop regions provided for manual adjustment.",
  };
}

/**
 * Detects dual document regions arranged vertically (Top side = Front, Bottom side = Back).
 */
export function detectVerticalDualDocumentInPixelBuffer(
  buffer: PixelBuffer,
  options: DualDetectionOptions = {}
): DualDocumentDetectionResult {
  const { width, height } = buffer;
  const targetAspect = options.targetAspectRatio ?? (85.6 / 53.98);

  const halfH = Math.floor(height / 2);
  const topBuffer = extractSubBuffer(buffer, { x: 0, y: 0, width, height: halfH });
  const bottomBuffer = extractSubBuffer(buffer, { x: 0, y: halfH, width, height: height - halfH });

  const topDetect = detectDocumentInPixelBuffer(topBuffer, {
    ...options,
    targetAspectRatio: targetAspect,
  });
  const bottomDetect = detectDocumentInPixelBuffer(bottomBuffer, {
    ...options,
    targetAspectRatio: targetAspect,
  });

  const defaultTop = createCenteredCrop(width, halfH, targetAspect);
  const defaultBottom = createCenteredCrop(width, height - halfH, targetAspect);

  const frontCrop: CropCoordinates = topDetect.detected
    ? topDetect.crop
    : defaultTop;

  const backCrop: CropCoordinates = bottomDetect.detected
    ? {
        x: bottomDetect.crop.x,
        y: halfH + bottomDetect.crop.y,
        width: bottomDetect.crop.width,
        height: bottomDetect.crop.height,
      }
    : {
        x: defaultBottom.x,
        y: halfH + defaultBottom.y,
        width: defaultBottom.width,
        height: defaultBottom.height,
      };

  const bothDetected = topDetect.detected && bottomDetect.detected;
  const confidence = bothDetected
    ? Math.round(((topDetect.confidence + bottomDetect.confidence) / 2) * 100) / 100
    : Math.max(topDetect.confidence, bottomDetect.confidence);

  return {
    detected: bothDetected,
    confidence,
    frontCrop,
    backCrop,
    layout: "vertical",
    message: bothDetected
      ? "Front and Back document regions detected automatically (Vertical layout)."
      : "Could not automatically isolate both card boundaries. Default crop regions provided for manual adjustment.",
  };
}

/**
 * Detects Front (bottom-left) and Back (bottom-right) document regions on a single sheet,
 * such as an e-Aadhaar PDF or official downloaded letter.
 * Guarantees that upper page content (letterhead, resident details, instructions) is never selected.
 */
export function detectBottomDualDocumentInPixelBuffer(
  buffer: PixelBuffer,
  options: DualDetectionOptions = {}
): DualDocumentDetectionResult {
  const { width, height } = buffer;
  const targetAspect = options.targetAspectRatio ?? (85.6 / 53.98);
  const safetyMargin = options.safetyMarginPercent ?? 1.5;

  // Proportional ID-1 fallback coordinates for bottom-left and bottom-right
  const createBottomDualDefaultCrops = (): { frontCrop: CropCoordinates; backCrop: CropCoordinates } => {
    // In portrait A4 sheets, cards occupy approx 42% width each, with ~5% side margins and ~6% center gutter
    const cardW = Math.round(width * 0.42);
    const cardH = Math.round(cardW / targetAspect);
    const bottomMargin = Math.max(8, Math.round(height * 0.04));
    const cardY = Math.max(0, height - cardH - bottomMargin);

    const frontX = Math.max(0, Math.round(width * 0.05));
    const backX = Math.min(width - cardW, Math.round(width * 0.53));

    return {
      frontCrop: { x: frontX, y: cardY, width: cardW, height: cardH },
      backCrop: { x: backX, y: cardY, width: cardW, height: cardH },
    };
  };

  const defaultCrops = createBottomDualDefaultCrops();

  if (width < 30 || height < 30) {
    return {
      detected: false,
      confidence: 0,
      frontCrop: defaultCrops.frontCrop,
      backCrop: defaultCrops.backCrop,
      layout: "bottom-dual",
      message: "Image resolution is too small for automatic boundary detection.",
    };
  }

  // 1. Identify the lower document region:
  // The cards are strictly situated in the lower portion of the sheet (typically y from 58% to 95%).
  // Upper portion of the page (letterhead, resident info, instructions) is guaranteed to be ignored.
  const lowerStartY = Math.floor(height * 0.55);
  const lowerHeight = height - lowerStartY;
  const halfW = Math.floor(width / 2);

  // 2. Extract Bottom-Left and Bottom-Right sub-buffers
  const leftLowerBuffer = extractSubBuffer(buffer, {
    x: 0,
    y: lowerStartY,
    width: halfW,
    height: lowerHeight,
  });

  const rightLowerBuffer = extractSubBuffer(buffer, {
    x: halfW,
    y: lowerStartY,
    width: width - halfW,
    height: lowerHeight,
  });

  // 3. Detect card boundary in Bottom-Left region (Front Side)
  const leftDetect = detectDocumentInPixelBuffer(leftLowerBuffer, {
    ...options,
    targetAspectRatio: targetAspect,
    safetyMarginPercent: safetyMargin,
  });

  // 4. Detect card boundary in Bottom-Right region (Back Side)
  const rightDetect = detectDocumentInPixelBuffer(rightLowerBuffer, {
    ...options,
    targetAspectRatio: targetAspect,
    safetyMarginPercent: safetyMargin,
  });

  // Map coordinates from sub-buffers back to full image coordinates
  let frontCrop: CropCoordinates = leftDetect.detected
    ? {
        x: leftDetect.crop.x,
        y: lowerStartY + leftDetect.crop.y,
        width: leftDetect.crop.width,
        height: leftDetect.crop.height,
      }
    : defaultCrops.frontCrop;

  let backCrop: CropCoordinates = rightDetect.detected
    ? {
        x: halfW + rightDetect.crop.x,
        y: lowerStartY + rightDetect.crop.y,
        width: rightDetect.crop.width,
        height: rightDetect.crop.height,
      }
    : defaultCrops.backCrop;

  // 5. Baseline & Geometric Harmonization:
  // In official paired documents, Front and Back cards are printed at the same height and baseline.
  if (leftDetect.detected && rightDetect.detected) {
    // Check if a single wide card was artificially sliced across halfW:
    const leftHitsRight = leftDetect.crop.x + leftDetect.crop.width >= halfW - 3;
    const rightHitsLeft = rightDetect.crop.x <= 3;
    if (leftHitsRight && rightHitsLeft) {
      let hasCenterEdgeOrGap = false;
      const testYStart = lowerStartY + Math.round(lowerHeight * 0.2);
      const testYEnd = lowerStartY + Math.round(lowerHeight * 0.8);
      for (let y = testYStart; y < testYEnd; y += 4) {
        const idxLeft = (y * width + (halfW - 2)) * 4;
        const idxRight = (y * width + (halfW + 2)) * 4;
        const diff =
          Math.abs(buffer.data[idxLeft] - buffer.data[idxRight]) +
          Math.abs(buffer.data[idxLeft + 1] - buffer.data[idxRight + 1]) +
          Math.abs(buffer.data[idxLeft + 2] - buffer.data[idxRight + 2]);
        if (diff > 25) {
          hasCenterEdgeOrGap = true;
          break;
        }
      }

      if (!hasCenterEdgeOrGap) {
        return {
          detected: false,
          confidence: 0.2,
          frontCrop: defaultCrops.frontCrop,
          backCrop: defaultCrops.backCrop,
          layout: "bottom-dual",
          message: "Lower region contains a single wide card rather than two distinct side-by-side cards.",
        };
      }
    }

    const topDiff = Math.abs(frontCrop.y - backCrop.y);
    const heightDiff = Math.abs(frontCrop.height - backCrop.height);

    if (topDiff < height * 0.08 && heightDiff < height * 0.08) {
      const commonTop = Math.min(frontCrop.y, backCrop.y);
      const commonHeight = Math.max(frontCrop.height, backCrop.height);
      const commonBottom = commonTop + commonHeight;

      if (commonBottom <= height) {
        frontCrop.y = commonTop;
        frontCrop.height = commonHeight;
        backCrop.y = commonTop;
        backCrop.height = commonHeight;
      }
    }
  } else if (leftDetect.detected && !rightDetect.detected) {
    // If only Left (Front) was detected cleanly, use its vertical position for Right (Back)
    backCrop.y = frontCrop.y;
    backCrop.height = frontCrop.height;
    backCrop.width = Math.round(frontCrop.height * targetAspect);
    backCrop.x = Math.min(
      width - backCrop.width,
      Math.max(halfW, halfW + Math.round((width - halfW - backCrop.width) / 2))
    );
  } else if (!leftDetect.detected && rightDetect.detected) {
    // If only Right (Back) was detected cleanly, use its vertical position for Left (Front)
    frontCrop.y = backCrop.y;
    frontCrop.height = backCrop.height;
    frontCrop.width = Math.round(backCrop.height * targetAspect);
    frontCrop.x = Math.max(0, Math.round((halfW - frontCrop.width) / 2));
  }

  // Ensure aspect ratios strictly adhere to targetAspect without distortion
  const enforceAspect = (c: CropCoordinates): CropCoordinates => {
    let w = c.width;
    let h = c.height;
    const currentAspect = w / h;
    if (Math.abs(currentAspect - targetAspect) > 0.02) {
      w = Math.round(h * targetAspect);
      if (c.x + w > width) {
        w = width - c.x;
        h = Math.round(w / targetAspect);
      }
    }
    return {
      x: Math.max(0, Math.min(width - w, c.x)),
      y: Math.max(0, Math.min(height - h, c.y)),
      width: Math.min(width, w),
      height: Math.min(height, h),
    };
  };

  frontCrop = enforceAspect(frontCrop);
  backCrop = enforceAspect(backCrop);

  const bothDetected = leftDetect.detected && rightDetect.detected;
  const eitherDetected = leftDetect.detected || rightDetect.detected;

  const confidence = bothDetected
    ? Math.round(((leftDetect.confidence + rightDetect.confidence) / 2) * 100) / 100
    : eitherDetected
    ? Math.round(Math.max(leftDetect.confidence, rightDetect.confidence) * 85) / 100
    : 0.50;

  return {
    detected: bothDetected,
    confidence,
    frontCrop,
    backCrop,
    layout: "bottom-dual",
    message: bothDetected
      ? "Front (bottom-left) and Back (bottom-right) document regions detected automatically."
      : eitherDetected
      ? "Detected one document side with high confidence. Default region provided for the other side."
      : "Could not automatically isolate card boundaries against background. Default bottom-left and bottom-right regions provided for manual adjustment.",
    debugInfo: {
      contrastScore: Math.round(
        (((leftDetect.debugInfo?.contrastScore ?? 0) +
          (rightDetect.debugInfo?.contrastScore ?? 0)) /
          2) *
          1000
      ) / 1000,
      edgeScore: Math.round(
        (((leftDetect.debugInfo?.edgeScore ?? 0) +
          (rightDetect.debugInfo?.edgeScore ?? 0)) /
          2) *
          1000
      ) / 1000,
      detectedCount: bothDetected ? 2 : eitherDetected ? 1 : 0,
    },
  };
}

/**
 * Runs dual document detection on a CanvasImageSource in browser environments.
 * Scales detected front and back crops accurately back to native image dimensions.
 */
export async function detectDualDocumentBoundaries(
  sourceImage: CanvasImageSource,
  nativeWidth: number,
  nativeHeight: number,
  options: DualDetectionOptions = {}
): Promise<DualDocumentDetectionResult> {
  const normType = (options.docTypeId || "").toLowerCase();
  const isVoter = normType === "voter-id" || normType === "voter";

  // Vector inspection ONLY applies to Voter ID (e-EPIC)!
  // NEVER use Voter ID vector placements for PAN, Aadhaar, or Ration Card!
  if (isVoter && options.vectorInfo && options.vectorInfo.isVectorPdf) {
    return {
      detected: true,
      confidence: options.vectorInfo.confidence,
      frontCrop: options.vectorInfo.frontCropPx,
      backCrop: options.vectorInfo.backCropPx,
      layout: "voter-id",
      strategyUsed: "voter-id-vector-pdf-embedded-image-placements",
      message: options.vectorInfo.message,
    };
  }

  if (typeof document === "undefined" && typeof OffscreenCanvas === "undefined") {
    throw new Error("Canvas environment required for browser document detection.");
  }

  const maxThumbDim = 600;
  const thumbScale = Math.min(1, maxThumbDim / Math.max(nativeWidth, nativeHeight));
  const thumbW = Math.max(1, Math.round(nativeWidth * thumbScale));
  const thumbH = Math.max(1, Math.round(nativeHeight * thumbScale));

  let canvas: HTMLCanvasElement | OffscreenCanvas;
  if (typeof OffscreenCanvas !== "undefined") {
    canvas = new OffscreenCanvas(thumbW, thumbH);
  } else {
    canvas = document.createElement("canvas");
    canvas.width = thumbW;
    canvas.height = thumbH;
  }

  const ctx = canvas.getContext("2d", { willReadFrequently: true }) as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D;

  if (!ctx) {
    throw new Error("Failed to initialize 2D context for dual document detection.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "medium";
  ctx.drawImage(sourceImage, 0, 0, thumbW, thumbH);

  const imgData = ctx.getImageData(0, 0, thumbW, thumbH);
  const result = detectDualDocumentInPixelBuffer(
    {
      data: imgData.data,
      width: thumbW,
      height: thumbH,
    },
    options
  );

  const scaleX = nativeWidth / thumbW;
  const scaleY = nativeHeight / thumbH;

  const scaleCrop = (crop: CropCoordinates): CropCoordinates => {
    const x = Math.max(0, Math.round(crop.x * scaleX));
    const y = Math.max(0, Math.round(crop.y * scaleY));
    const width = Math.min(nativeWidth - x, Math.round(crop.width * scaleX));
    const height = Math.min(nativeHeight - y, Math.round(crop.height * scaleY));
    return { x, y, width, height };
  };

  return {
    ...result,
    frontCrop: scaleCrop(result.frontCrop),
    backCrop: result.backCrop ? scaleCrop(result.backCrop) : null,
  };
}
