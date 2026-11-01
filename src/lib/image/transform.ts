import type {
  CropRegion,
  FlipOptions,
  ImageDimensions,
  ImageTransformPipeline,
  ResizeOptions,
  RotateOptions,
} from "../../types/image-engine";

export type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
export type AnyCanvasContext =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D;

/**
 * Creates an OffscreenCanvas if supported, or an HTMLCanvasElement in DOM environments.
 */
export function createCanvasBuffer(width: number, height: number): AnyCanvas {
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));

  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(safeWidth, safeHeight);
  }

  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = safeWidth;
    canvas.height = safeHeight;
    return canvas;
  }

  throw new Error("Canvas is not supported in this runtime environment.");
}

/**
 * Pure calculation helper: Computes target dimensions for resizing,
 * optionally maintaining original aspect ratio.
 */
export function computeResizeDimensions(
  sourceWidth: number,
  sourceHeight: number,
  options: ResizeOptions
): { width: number; height: number } {
  let targetWidth = Math.max(1, Math.round(options.width));
  let targetHeight = Math.max(1, Math.round(options.height));

  if (options.maintainAspectRatio) {
    const sourceRatio = sourceWidth / sourceHeight;
    if (options.width > 0 && (!options.height || options.height <= 0)) {
      targetHeight = Math.max(1, Math.round(targetWidth / sourceRatio));
    } else if (options.height > 0 && (!options.width || options.width <= 0)) {
      targetWidth = Math.max(1, Math.round(targetHeight * sourceRatio));
    } else {
      // Both provided with maintainAspectRatio: fit inside target box
      const widthScale = targetWidth / sourceWidth;
      const heightScale = targetHeight / sourceHeight;
      const scale = Math.min(widthScale, heightScale);
      targetWidth = Math.max(1, Math.round(sourceWidth * scale));
      targetHeight = Math.max(1, Math.round(sourceHeight * scale));
    }
  }

  return { width: targetWidth, height: targetHeight };
}

/**
 * Pure calculation helper: Validates crop boundaries and clamps them strictly within image bounds.
 * Prevents out-of-bounds clipping or NaN coordinates.
 */
export function validateAndClampCrop(
  sourceWidth: number,
  sourceHeight: number,
  crop: CropRegion
): CropRegion {
  let x = Math.max(0, Math.min(Math.round(crop.x), sourceWidth - 1));
  let y = Math.max(0, Math.min(Math.round(crop.y), sourceHeight - 1));

  let width = Math.max(1, Math.round(crop.width));
  let height = Math.max(1, Math.round(crop.height));

  // If crop region exceeds bounds, clamp dimensions
  if (x + width > sourceWidth) {
    width = Math.max(1, sourceWidth - x);
  }
  if (y + height > sourceHeight) {
    height = Math.max(1, sourceHeight - y);
  }

  // Handle aspect ratio constraint if specified
  if (crop.aspectRatioConstraint && crop.aspectRatioConstraint > 0) {
    const targetRatio = crop.aspectRatioConstraint;
    if (width / height > targetRatio) {
      width = Math.max(1, Math.round(height * targetRatio));
    } else {
      height = Math.max(1, Math.round(width / targetRatio));
    }

    // Re-check right and bottom clamping
    if (x + width > sourceWidth) {
      width = sourceWidth - x;
      height = Math.max(1, Math.round(width / targetRatio));
    }
    if (y + height > sourceHeight) {
      height = sourceHeight - y;
      width = Math.max(1, Math.round(height * targetRatio));
    }
  }

  return {
    x,
    y,
    width,
    height,
    aspectRatioConstraint: crop.aspectRatioConstraint,
  };
}

/**
 * Pure calculation helper: Computes new bounding box dimensions when rotating an image by an arbitrary angle.
 */
export function computeRotatedBounds(
  width: number,
  height: number,
  angleDegrees: number
): { width: number; height: number; radians: number } {
  // Normalize angle to [0, 360)
  const normalized = ((angleDegrees % 360) + 360) % 360;

  // Optimized paths for right angles
  if (normalized === 0) {
    return { width, height, radians: 0 };
  }
  if (normalized === 90 || normalized === 270) {
    return { width: height, height: width, radians: (normalized * Math.PI) / 180 };
  }
  if (normalized === 180) {
    return { width, height, radians: Math.PI };
  }

  // Arbitrary angle bounding box
  const radians = (normalized * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));

  const newWidth = Math.max(1, Math.round(width * cos + height * sin));
  const newHeight = Math.max(1, Math.round(width * sin + height * cos));

  return { width: newWidth, height: newHeight, radians };
}

/**
 * Pure image processing engine:
 * Takes any CanvasImageSource and executes an entire transformation pipeline
 * (Crop -> Rotate -> Flip -> Resize -> Background fill) into a pristine new Canvas buffer.
 * The original source is never mutated.
 */
export function transformImage(
  source: CanvasImageSource,
  pipeline: ImageTransformPipeline = {}
): AnyCanvas {
  const sourceWidth =
    "width" in source && typeof source.width === "number"
      ? source.width
      : "naturalWidth" in source
      ? (source as HTMLImageElement).naturalWidth
      : 1;

  const sourceHeight =
    "height" in source && typeof source.height === "number"
      ? source.height
      : "naturalHeight" in source
      ? (source as HTMLImageElement).naturalHeight
      : 1;

  // 1. Resolve crop bounds
  const crop = pipeline.crop
    ? validateAndClampCrop(sourceWidth, sourceHeight, pipeline.crop)
    : { x: 0, y: 0, width: sourceWidth, height: sourceHeight };

  // 2. Resolve rotation bounds
  const rotateAngle = pipeline.rotate?.angle ?? 0;
  const rotatedBounds = computeRotatedBounds(crop.width, crop.height, rotateAngle);

  // 3. Resolve final resize dimensions
  const finalSize = pipeline.resize
    ? computeResizeDimensions(rotatedBounds.width, rotatedBounds.height, pipeline.resize)
    : { width: rotatedBounds.width, height: rotatedBounds.height };

  // 4. Create target canvas
  const canvas = createCanvasBuffer(finalSize.width, finalSize.height);
  const ctx = canvas.getContext("2d") as AnyCanvasContext;

  if (!ctx) {
    throw new Error("Unable to obtain 2D rendering context from canvas.");
  }

  // Configure high-quality interpolation
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = pipeline.resize?.smoothingQuality ?? "high";

  // Optional background color fill (useful for flattening transparency onto solid color e.g. for JPEG)
  if (pipeline.backgroundColor && pipeline.backgroundColor !== "transparent") {
    ctx.fillStyle = pipeline.backgroundColor;
    ctx.fillRect(0, 0, finalSize.width, finalSize.height);
  } else {
    ctx.clearRect(0, 0, finalSize.width, finalSize.height);
  }

  ctx.save();

  // Scale context to target final dimensions relative to rotated bounds
  const scaleX = finalSize.width / rotatedBounds.width;
  const scaleY = finalSize.height / rotatedBounds.height;
  ctx.scale(scaleX, scaleY);

  // Move origin to center of rotated bounds
  ctx.translate(rotatedBounds.width / 2, rotatedBounds.height / 2);

  // Apply rotation
  if (rotatedBounds.radians !== 0) {
    ctx.rotate(rotatedBounds.radians);
  }

  // Apply flips
  const flipH = pipeline.flip?.horizontal ? -1 : 1;
  const flipV = pipeline.flip?.vertical ? -1 : 1;
  if (flipH !== 1 || flipV !== 1) {
    ctx.scale(flipH, flipV);
  }

  // Draw source image cropped around its center
  ctx.drawImage(
    source,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    -crop.width / 2,
    -crop.height / 2,
    crop.width,
    crop.height
  );

  ctx.restore();

  return canvas;
}

/**
 * Convenience single-operation wrapper: Resize image to target dimensions.
 */
export function resizeImage(
  source: CanvasImageSource,
  options: ResizeOptions,
  backgroundColor?: string
): AnyCanvas {
  return transformImage(source, { resize: options, backgroundColor });
}

/**
 * Convenience single-operation wrapper: Crop image to specified region.
 */
export function cropImage(
  source: CanvasImageSource,
  crop: CropRegion,
  backgroundColor?: string
): AnyCanvas {
  return transformImage(source, { crop, backgroundColor });
}

/**
 * Convenience single-operation wrapper: Rotate image by specified degrees.
 */
export function rotateImage(
  source: CanvasImageSource,
  options: RotateOptions,
  backgroundColor?: string
): AnyCanvas {
  return transformImage(source, { rotate: options, backgroundColor });
}

/**
 * Convenience single-operation wrapper: Flip image horizontally or vertically.
 */
export function flipImage(
  source: CanvasImageSource,
  options: FlipOptions,
  backgroundColor?: string
): AnyCanvas {
  return transformImage(source, { flip: options, backgroundColor });
}
