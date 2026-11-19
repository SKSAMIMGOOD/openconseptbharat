/**
 * ISO/IEC 7810 ID-1 (CR80) Document Normalization Engine
 *
 * Standardizes all four Indian identity documents (PAN, Aadhaar, Ration, Voter ID)
 * to standard physical CR80 wallet card dimensions:
 * - Physical size: 85.60 mm x 53.98 mm
 * - Resolution: 300 DPI
 * - Raster size: 1011 x 638 pixels
 * - Standard aspect ratio: ~1.58577
 *
 * Strict Preservation Rules:
 * - Strictly proportional scaling: NEVER stretches or skews pixels
 * - Preserves font legibility, QR codes, barcode lines, and photographs
 * - Symmetrical letterbox/pillarbox padding using clean background extension
 * - Optional ISO-standard 3.18 mm rounded corner radius (~38 px at 300 DPI)
 * - 100% in-browser Canvas execution with pure math calculations for Node tests
 */

import type { CropCoordinates } from "@/types/crop";
import type { DocumentDimensions } from "@/types/document-studio";

export const CR80_TARGET_WIDTH_PX = 1011;
export const CR80_TARGET_HEIGHT_PX = 638;
export const CR80_TARGET_ASPECT_RATIO = 85.6 / 53.98; // ~1.58577
export const CR80_CORNER_RADIUS_PX = 38; // 3.18 mm at 300 DPI

export interface CR80NormalizationGeometry {
  targetWidth: number; // 1011
  targetHeight: number; // 638
  targetAspectRatio: number; // ~1.58577
  drawX: number;
  drawY: number;
  drawWidth: number;
  drawHeight: number;
  scaleFactor: number;
  padHorizontal: number;
  padVertical: number;
  isStretched: boolean; // Always false
}

export interface CR80NormalizationOptions {
  applyCornerRadius?: boolean;
  backgroundColor?: string; // Default: "#ffffff"
  mimeType?: "image/png" | "image/jpeg";
  quality?: number;
  targetDpi?: number;
}

export interface CR80RenderResult {
  blob: Blob;
  previewUrl: string;
  dimensions: DocumentDimensions;
  geometry: CR80NormalizationGeometry;
}

/**
 * Calculates proportional placement geometry for scaling a cropped region to CR80 dimensions.
 * Pure mathematical computation — fully compatible with both Node.js and Browser environments.
 * Supports standard 300 DPI (1011 x 638 px) by default or arbitrary target DPI (e.g. 600 DPI -> 2022 x 1276 px).
 */
export function calculateCR80Scaling(
  cropWidth: number,
  cropHeight: number,
  targetDpi: number = 300
): CR80NormalizationGeometry {
  const targetWidth = targetDpi === 300 ? CR80_TARGET_WIDTH_PX : Math.round(CR80_TARGET_WIDTH_PX * (targetDpi / 300));
  const targetHeight = targetDpi === 300 ? CR80_TARGET_HEIGHT_PX : Math.round(CR80_TARGET_HEIGHT_PX * (targetDpi / 300));

  if (cropWidth <= 0 || cropHeight <= 0) {
    return {
      targetWidth,
      targetHeight,
      targetAspectRatio: CR80_TARGET_ASPECT_RATIO,
      drawX: 0,
      drawY: 0,
      drawWidth: targetWidth,
      drawHeight: targetHeight,
      scaleFactor: 1,
      padHorizontal: 0,
      padVertical: 0,
      isStretched: false,
    };
  }

  // Calculate proportional scale to fit within target dimensions without clipping
  const scaleX = targetWidth / cropWidth;
  const scaleY = targetHeight / cropHeight;
  const uniformScale = Math.min(scaleX, scaleY);

  const drawWidth = Math.min(targetWidth, Math.round(cropWidth * uniformScale));
  const drawHeight = Math.min(targetHeight, Math.round(cropHeight * uniformScale));

  // Center the proportionally scaled card inside the target frame
  const padHorizontal = Math.max(0, targetWidth - drawWidth);
  const padVertical = Math.max(0, targetHeight - drawHeight);

  const drawX = Math.round(padHorizontal / 2);
  const drawY = Math.round(padVertical / 2);

  return {
    targetWidth,
    targetHeight,
    targetAspectRatio: CR80_TARGET_ASPECT_RATIO,
    drawX,
    drawY,
    drawWidth,
    drawHeight,
    scaleFactor: uniformScale,
    padHorizontal,
    padVertical,
    isStretched: false,
  };
}

/**
 * Normalizes an image or canvas crop to exact ISO CR80 (85.60 x 53.98 mm)
 * preserving high resolution (600 DPI for high-res sources, 300 DPI standard)
 * in browser / offscreen canvas environments.
 */
export async function renderCR80NormalizedCrop(
  sourceImage: CanvasImageSource,
  crop: CropCoordinates,
  options: CR80NormalizationOptions = {}
): Promise<CR80RenderResult> {
  if (typeof document === "undefined" && typeof OffscreenCanvas === "undefined") {
    throw new Error("Canvas environment required for CR80 normalization.");
  }

  const effectiveCropDpi = Math.max((crop.width / 85.60) * 25.4, (crop.height / 53.98) * 25.4);
  const targetDpi = options.targetDpi ?? (effectiveCropDpi >= 450 ? 600 : 300);
  const geometry = calculateCR80Scaling(crop.width, crop.height, targetDpi);
  const targetW = geometry.targetWidth;
  const targetH = geometry.targetHeight;
  const cornerRadiusPx = Math.round((3.18 / 25.4) * targetDpi);
  const bgColor = options.backgroundColor ?? "#ffffff";
  const mimeType = options.mimeType ?? "image/png";
  const quality = options.quality ?? 1.0;
  const applyCorners = options.applyCornerRadius ?? false;

  let canvas: HTMLCanvasElement | OffscreenCanvas;
  if (typeof OffscreenCanvas !== "undefined") {
    canvas = new OffscreenCanvas(targetW, targetH);
  } else {
    canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
  }

  const ctx = canvas.getContext("2d") as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D;

  if (!ctx) {
    throw new Error("Failed to initialize canvas context for CR80 normalization.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // 1. Fill background with specified background color
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, targetW, targetH);

  // 2. If rounded corners requested, apply path clipping
  if (applyCorners) {
    ctx.save();
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(0, 0, targetW, targetH, cornerRadiusPx);
    } else {
      // Manual rounded rect fallback
      const r = cornerRadiusPx;
      const w = targetW;
      const h = targetH;
      ctx.moveTo(r, 0);
      ctx.lineTo(w - r, 0);
      ctx.arcTo(w, 0, w, r, r);
      ctx.lineTo(w, h - r);
      ctx.arcTo(w, h, w - r, h, r);
      ctx.lineTo(r, h);
      ctx.arcTo(0, h, 0, h - r, r);
      ctx.lineTo(0, r);
      ctx.arcTo(0, 0, r, 0, r);
      ctx.closePath();
    }
    ctx.clip();
  }

  // 3. Draw proportionally scaled crop
  ctx.drawImage(
    sourceImage,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    geometry.drawX,
    geometry.drawY,
    geometry.drawWidth,
    geometry.drawHeight
  );

  // Extend top and bottom edges using the card's edge pixels for cards wider than CR80
  // (e.g. Ration Card artwork aspect 1.669, 78.1 x 46.8 mm) to seamlessly fill CR80 height
  // without cropping sides or stretching interior card content.
  if (geometry.padVertical > 0) {
    // Extend top edge upward
    ctx.drawImage(
      sourceImage,
      crop.x,
      crop.y,
      crop.width,
      1,
      geometry.drawX,
      0,
      geometry.drawWidth,
      geometry.drawY
    );
    // Extend bottom edge downward
    const bottomCardY = geometry.drawY + geometry.drawHeight;
    const bottomRemaining = targetH - bottomCardY;
    if (bottomRemaining > 0) {
      ctx.drawImage(
        sourceImage,
        crop.x,
        crop.y + crop.height - 1,
        crop.width,
        1,
        geometry.drawX,
        bottomCardY,
        geometry.drawWidth,
        bottomRemaining
      );
    }
  }

  if (applyCorners) {
    ctx.restore();
  }

  // 4. Export to Blob
  let blob: Blob;
  if (canvas instanceof OffscreenCanvas) {
    blob = await canvas.convertToBlob({ type: mimeType, quality });
  } else {
    blob = await new Promise<Blob>((resolve, reject) => {
      (canvas as HTMLCanvasElement).toBlob(
        (b) => {
          if (!b) reject(new Error("CR80 normalization toBlob failed."));
          else resolve(b);
        },
        mimeType,
        quality
      );
    });
  }

  const previewUrl = URL.createObjectURL(blob);

  return {
    blob,
    previewUrl,
    dimensions: {
      width: targetW,
      height: targetH,
      aspectRatio: targetW / targetH,
    },
    geometry,
  };
}
