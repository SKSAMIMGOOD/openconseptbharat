import type { PhotoCropShape, PhotoSizePreset } from "../../types/resume.ts";

export const ALLOWED_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const MAX_PHOTO_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export interface PhotoValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a candidate file or file metadata for profile photo upload.
 */
export function validatePhotoFile(file: {
  type?: string;
  size?: number;
  name?: string;
}): PhotoValidationResult {
  if (!file) {
    return { valid: false, error: "No file was selected." };
  }

  // 1. File size check
  if (typeof file.size === "number" && file.size > MAX_PHOTO_FILE_SIZE) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeInMb} MB) exceeds the 5 MB limit. Please select a smaller photo.`,
    };
  }

  // 2. File type check
  const rawType = (file.type || "").toLowerCase().trim();
  const rawName = (file.name || "").toLowerCase().trim();

  const matchesMime = ALLOWED_PHOTO_MIME_TYPES.some((mime) => rawType === mime);
  const matchesExt =
    rawName.endsWith(".jpg") ||
    rawName.endsWith(".jpeg") ||
    rawName.endsWith(".png") ||
    rawName.endsWith(".webp");

  if (!matchesMime && !matchesExt) {
    return {
      valid: false,
      error: "Unsupported format. Only JPG, PNG, and WebP images are supported.",
    };
  }

  return { valid: true };
}

export interface PhotoDimensionSpec {
  id: PhotoSizePreset;
  label: string;
  widthMm: number;
  heightMm: number;
  widthPt: number;
  heightPt: number;
  previewWidthPx: number;
  previewHeightPx: number;
  aspectRatio: number; // width / height
}

/**
 * Standard Physical Photo Dimensions for Resume / CV Maker
 * Conversion factors:
 * - 1 mm = 72 / 25.4 points ≈ 2.834645669 pt (vector PDF)
 * - 1 mm ≈ 3.7795 px at 96 DPI (screen preview)
 *
 * Presets:
 * 1. Small: 30 × 40 mm (aspect ratio 3:4)
 * 2. Standard: 35 × 45 mm (7:9 portrait aspect ratio - Default Passport Size)
 * 3. Large: 40 × 50 mm (aspect ratio 4:5)
 */
export const PHOTO_SIZE_PRESETS: Record<PhotoSizePreset, PhotoDimensionSpec> = {
  small: {
    id: "small",
    label: "Small (30 × 40 mm)",
    widthMm: 30,
    heightMm: 40,
    widthPt: 30 * (72 / 25.4), // ~85.039 pt
    heightPt: 40 * (72 / 25.4), // ~113.386 pt
    previewWidthPx: Math.round(30 * 3.7795), // 113 px
    previewHeightPx: Math.round(40 * 3.7795), // 151 px
    aspectRatio: 30 / 40, // 0.75
  },
  standard: {
    id: "standard",
    label: "Standard (35 × 45 mm)",
    widthMm: 35,
    heightMm: 45,
    widthPt: 35 * (72 / 25.4), // ~99.213 pt
    heightPt: 45 * (72 / 25.4), // ~127.559 pt
    previewWidthPx: Math.round(35 * 3.7795), // 132 px
    previewHeightPx: Math.round(45 * 3.7795), // 170 px
    aspectRatio: 35 / 45, // 7:9 ≈ 0.7778
  },
  large: {
    id: "large",
    label: "Large (40 × 50 mm)",
    widthMm: 40,
    heightMm: 50,
    widthPt: 40 * (72 / 25.4), // ~113.386 pt
    heightPt: 50 * (72 / 25.4), // ~141.732 pt
    previewWidthPx: Math.round(40 * 3.7795), // 151 px
    previewHeightPx: Math.round(50 * 3.7795), // 189 px
    aspectRatio: 40 / 50, // 0.8
  },
};

export interface ResolvedPhotoDimensions {
  preset: PhotoDimensionSpec;
  widthPt: number;
  heightPt: number;
  previewWidthPx: number;
  previewHeightPx: number;
  widthMm: number;
  heightMm: number;
  isCircle: boolean;
}

/**
 * Resolves the physical and preview dimensions for any photo size preset and shape.
 */
export function getPhotoDimensions(
  sizePreset: PhotoSizePreset = "standard",
  shape: PhotoCropShape = "rectangle"
): ResolvedPhotoDimensions {
  const preset = PHOTO_SIZE_PRESETS[sizePreset] || PHOTO_SIZE_PRESETS.standard;
  const isCircle = shape === "circle";

  if (isCircle) {
    // For circular style, diameter matches the preset width (30 mm, 35 mm, or 40 mm)
    return {
      preset,
      widthPt: preset.widthPt,
      heightPt: preset.widthPt,
      previewWidthPx: preset.previewWidthPx,
      previewHeightPx: preset.previewWidthPx,
      widthMm: preset.widthMm,
      heightMm: preset.widthMm,
      isCircle: true,
    };
  }

  // Rectangular portrait style
  return {
    preset,
    widthPt: preset.widthPt,
    heightPt: preset.heightPt,
    previewWidthPx: preset.previewWidthPx,
    previewHeightPx: preset.previewHeightPx,
    widthMm: preset.widthMm,
    heightMm: preset.heightMm,
    isCircle: false,
  };
}

export interface CropTransformInput {
  naturalWidth: number;
  naturalHeight: number;
  viewportSize?: number;
  cutoutWidth?: number;
  cutoutHeight?: number;
  zoom?: number;
  pan?: { x: number; y: number };
  shape?: PhotoCropShape;
  outputSize?: number;
  outputWidth?: number;
  outputHeight?: number;
}

export interface CropTransformResult {
  outputSize: number;
  outputWidth: number;
  outputHeight: number;
  drawX: number;
  drawY: number;
  drawWidth: number;
  drawHeight: number;
  shape: PhotoCropShape;
}

/**
 * Compute the precise draw dimensions and offsets for drawing the cropped
 * photo onto the output canvas, preserving aspect ratio and preventing distortion.
 */
export function calculateCropTransform(input: CropTransformInput): CropTransformResult {
  const {
    naturalWidth,
    naturalHeight,
    viewportSize = 280,
    zoom = 1,
    pan = { x: 0, y: 0 },
    shape = "rectangle",
    outputSize = 400,
  } = input;

  const isCircle = shape === "circle";

  // Determine cutout width and height
  const defaultCutout = viewportSize * 0.84;
  const rawCutoutWidth = input.cutoutWidth ?? defaultCutout;
  const rawCutoutHeight = input.cutoutHeight ?? defaultCutout;

  const effectiveCutoutWidth = isCircle ? Math.min(rawCutoutWidth, rawCutoutHeight) : rawCutoutWidth;
  const effectiveCutoutHeight = isCircle ? effectiveCutoutWidth : rawCutoutHeight;

  // Fit image to cover the crop cutout area at zoom = 1 without distortion
  const baseScale = Math.max(
    effectiveCutoutWidth / Math.max(naturalWidth, 1),
    effectiveCutoutHeight / Math.max(naturalHeight, 1)
  );

  const currentScale = baseScale * Math.max(zoom, 0.5);
  const displayedWidth = naturalWidth * currentScale;
  const displayedHeight = naturalHeight * currentScale;

  // Determine canvas output dimensions
  const reqOutputWidth = input.outputWidth ?? input.outputSize ?? outputSize;
  const reqOutputHeight = input.outputHeight ?? input.outputSize ?? outputSize;

  const effectiveOutputWidth = isCircle ? Math.min(reqOutputWidth, reqOutputHeight) : reqOutputWidth;
  const effectiveOutputHeight = isCircle ? effectiveOutputWidth : reqOutputHeight;

  // Multiplier to scale from viewport cutout to high-res output canvas
  const multiplier = effectiveOutputHeight / effectiveCutoutHeight;

  const drawWidth = displayedWidth * multiplier;
  const drawHeight = displayedHeight * multiplier;

  // Center of the canvas
  const centerX = effectiveOutputWidth / 2 + pan.x * multiplier;
  const centerY = effectiveOutputHeight / 2 + pan.y * multiplier;

  const drawX = centerX - drawWidth / 2;
  const drawY = centerY - drawHeight / 2;

  return {
    outputSize: effectiveOutputWidth,
    outputWidth: effectiveOutputWidth,
    outputHeight: effectiveOutputHeight,
    drawX,
    drawY,
    drawWidth,
    drawHeight,
    shape,
  };
}

/**
 * Browser-only helper to convert a WebP or other image data URL into a PNG data URL
 * using an offscreen canvas.
 */
export function convertDataUrlToPng(dataUrl: string): Promise<string | null> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width || 350;
          canvas.height = img.naturalHeight || img.height || 450;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Browser-only helper to mask an image into a circle with a transparent background PNG
 * for vector PDF export.
 */
export function convertDataUrlToCircularPng(dataUrl: string): Promise<string | null> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const nw = img.naturalWidth || img.width || 400;
          const nh = img.naturalHeight || img.height || 400;
          const size = Math.min(nw, nh);

          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(null);

          // Clear to transparent
          ctx.clearRect(0, 0, size, size);

          // Circular clip path
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();

          // Center-crop image into the circle
          const scale = Math.max(size / nw, size / nh);
          const drawW = nw * scale;
          const drawH = nh * scale;
          const drawX = (size - drawW) / 2;
          const drawY = (size - drawH) / 2;

          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          resolve(canvas.toDataURL("image/png"));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    } catch {
      resolve(null);
    }
  });
}
