import type {
  PhotoPlacement,
  SheetCalculationResult,
  CutGuidesConfig,
  CutGuideStyle,
} from "@/types/photo-sheet";

import type { AnyCanvas } from "../image/transform";

export type ImageSourceDrawable = HTMLImageElement | HTMLCanvasElement | ImageBitmap | OffscreenCanvas;

export type ImageSourceResolver = (
  placementIndex: number,
  placement: PhotoPlacement
) => ImageSourceDrawable | null | undefined;

export type MultiImageSource =
  | ImageSourceDrawable
  | (ImageSourceDrawable | null | undefined)[]
  | ImageSourceResolver;

/**
 * Calculates the center-crop source rectangle to draw an image into a target aspect ratio
 * without stretching, distortion, or alteration of image aspect ratio.
 */
export function calculateCenterCrop(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number
): { sx: number; sy: number; sWidth: number; sHeight: number } {
  if (srcWidth <= 0 || srcHeight <= 0 || targetWidth <= 0 || targetHeight <= 0) {
    return { sx: 0, sy: 0, sWidth: Math.max(1, srcWidth), sHeight: Math.max(1, srcHeight) };
  }

  const srcRatio = srcWidth / srcHeight;
  const targetRatio = targetWidth / targetHeight;

  if (Math.abs(srcRatio - targetRatio) < 0.0001) {
    return { sx: 0, sy: 0, sWidth: srcWidth, sHeight: srcHeight };
  }

  let sWidth = srcWidth;
  let sHeight = srcHeight;
  let sx = 0;
  let sy = 0;

  if (srcRatio > targetRatio) {
    // Image is wider than target: crop equal parts from left and right
    sWidth = Math.round(srcHeight * targetRatio);
    sx = Math.round((srcWidth - sWidth) / 2);
  } else {
    // Image is taller than target: crop equal parts from top and bottom
    sHeight = Math.round(srcWidth / targetRatio);
    sy = Math.round((srcHeight - sHeight) / 2);
  }

  return { sx, sy, sWidth, sHeight };
}

/**
 * Resolves an individual image source for a placement from a single drawable, array, or resolver function.
 */
export function resolveImageForPlacement(
  source: MultiImageSource,
  index: number,
  placement: PhotoPlacement
): ImageSourceDrawable | null {
  if (typeof source === "function") {
    return source(index, placement) ?? null;
  }
  if (Array.isArray(source)) {
    return source[index] ?? null;
  }
  return source ?? null;
}

/**
 * Draws professional cutting marks on a canvas context.
 * Guarantees that marks do not obscure or paint over internal photo pixels.
 */
export function drawCuttingGuides(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  placements: PhotoPlacement[],
  config: CutGuidesConfig,
  scale: number = 1.0,
  sheetWidthPx: number,
  sheetHeightPx: number
): void {
  if (!config.enabled || config.style === "none" || placements.length === 0) {
    return;
  }

  ctx.save();
  ctx.strokeStyle = config.color;
  ctx.lineWidth = Math.max(1, Math.round(config.thicknessPx * scale));

  if (config.style === "thin_solid") {
    // Thin solid outline around each photo boundary
    ctx.setLineDash([]);
    for (const p of placements) {
      const x = p.xPx * scale;
      const y = p.yPx * scale;
      const w = p.widthPx * scale;
      const h = p.heightPx * scale;
      ctx.strokeRect(x, y, w, h);
    }
  } else if (config.style === "dashed") {
    // Subtle dashed separation lines
    const dashLength = Math.max(3, Math.round(4 * scale));
    ctx.setLineDash([dashLength, dashLength]);
    for (const p of placements) {
      const x = p.xPx * scale;
      const y = p.yPx * scale;
      const w = p.widthPx * scale;
      const h = p.heightPx * scale;
      ctx.strokeRect(x, y, w, h);
    }
  } else if (config.style === "corner_crop_marks") {
    // Professional exterior corner marks (L-shaped tick marks pointing outwards)
    ctx.setLineDash([]);
    const markLength = Math.max(6, Math.round(10 * scale));
    const offset = Math.max(1, Math.round(1 * scale)); // Just outside photo edge

    for (const p of placements) {
      const x = p.xPx * scale;
      const y = p.yPx * scale;
      const w = p.widthPx * scale;
      const h = p.heightPx * scale;

      // Top-Left corner (marks extending up and left)
      ctx.beginPath();
      ctx.moveTo(x - offset, y);
      ctx.lineTo(x - offset - markLength, y);
      ctx.moveTo(x, y - offset);
      ctx.lineTo(x, y - offset - markLength);
      ctx.stroke();

      // Top-Right corner (marks extending up and right)
      ctx.beginPath();
      ctx.moveTo(x + w + offset, y);
      ctx.lineTo(x + w + offset + markLength, y);
      ctx.moveTo(x + w, y - offset);
      ctx.lineTo(x + w, y - offset - markLength);
      ctx.stroke();

      // Bottom-Left corner (marks extending down and left)
      ctx.beginPath();
      ctx.moveTo(x - offset, y + h);
      ctx.lineTo(x - offset - markLength, y + h);
      ctx.moveTo(x, y + h + offset);
      ctx.lineTo(x, y + h + offset + markLength);
      ctx.stroke();

      // Bottom-Right corner (marks extending down and right)
      ctx.beginPath();
      ctx.moveTo(x + w + offset, y + h);
      ctx.lineTo(x + w + offset + markLength, y + h);
      ctx.moveTo(x + w, y + h + offset);
      ctx.lineTo(x + w, y + h + offset + markLength);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Renders the master high-resolution 4x6 photo sheet canvas.
 * Used exclusively for final exports (PNG / JPEG) to avoid slowing down UI interactions.
 */
export function renderMasterSheetCanvas(
  imageSource: MultiImageSource,
  layout: SheetCalculationResult,
  cutGuides: CutGuidesConfig,
  includeGuidesInExport: boolean = true
): HTMLCanvasElement | OffscreenCanvas {
  const width = layout.sheetWidthPx;
  const height = layout.sheetHeightPx;

  let canvas: HTMLCanvasElement | OffscreenCanvas;
  if (typeof OffscreenCanvas !== "undefined") {
    canvas = new OffscreenCanvas(width, height);
  } else {
    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  if (!ctx) {
    throw new Error("Failed to initialize canvas context for photo sheet.");
  }

  // 1. Fill solid photo paper background (pure white)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // 2. High-quality bicubic image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // 3. Draw each photo copy at its exact pixel coordinates without stretching
  for (const p of layout.placements) {
    const src = resolveImageForPlacement(imageSource, p.index, p);
    if (!src) continue;

    const { sx, sy, sWidth, sHeight } = calculateCenterCrop(
      src.width,
      src.height,
      p.widthPx,
      p.heightPx
    );

    ctx.drawImage(
      src,
      sx,
      sy,
      sWidth,
      sHeight,
      p.xPx,
      p.yPx,
      p.widthPx,
      p.heightPx
    );
  }

  // 4. Optionally draw cutting guides if enabled and requested for export
  if (cutGuides.enabled && includeGuidesInExport) {
    drawCuttingGuides(ctx, layout.placements, cutGuides, 1.0, width, height);
  }

  return canvas;
}

/**
 * Renders a scaled preview canvas of the photo sheet for smooth real-time UI interaction.
 * Downsamples layout coordinates to target display width to prevent GPU memory stalls.
 */
export function renderScaledSheetPreview(
  targetCanvas: HTMLCanvasElement,
  imageSource: MultiImageSource,
  layout: SheetCalculationResult,
  cutGuides: CutGuidesConfig,
  maxPreviewWidth: number = 720
): void {
  const aspect = layout.sheetWidthPx / Math.max(1, layout.sheetHeightPx);
  const displayW = Math.min(maxPreviewWidth, layout.sheetWidthPx);
  const displayH = Math.round(displayW / aspect);

  targetCanvas.width = displayW;
  targetCanvas.height = displayH;

  const ctx = targetCanvas.getContext("2d");
  if (!ctx) return;

  const scale = displayW / layout.sheetWidthPx;

  // 1. Fill photo paper background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, displayW, displayH);

  // 2. Smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // 3. Draw photos at scaled preview coordinates without stretching
  for (const p of layout.placements) {
    const src = resolveImageForPlacement(imageSource, p.index, p);
    if (!src) continue;

    const dx = Math.round(p.xPx * scale);
    const dy = Math.round(p.yPx * scale);
    const dw = Math.round(p.widthPx * scale);
    const dh = Math.round(p.heightPx * scale);

    const { sx, sy, sWidth, sHeight } = calculateCenterCrop(
      src.width,
      src.height,
      p.widthPx,
      p.heightPx
    );

    ctx.drawImage(
      src,
      sx,
      sy,
      sWidth,
      sHeight,
      dx,
      dy,
      dw,
      dh
    );
  }

  // 4. Draw preview cutting guides
  if (cutGuides.enabled) {
    drawCuttingGuides(ctx, layout.placements, cutGuides, scale, displayW, displayH);
  }
}
