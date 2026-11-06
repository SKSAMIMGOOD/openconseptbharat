/**
 * Phase 08B — Document Cropper & Canvas Engine
 *
 * Privacy-first, 100% in-browser Canvas cropping and transformation engine.
 * Features:
 * - High-fidelity offscreen canvas cropping
 * - 90° step rotation (0°, 90°, 180°, 270°) with exact pixel bounds
 * - Full native resolution preservation (never stretches or degrades pixels)
 * - Safe boundary clamping to prevent out-of-bounds black borders or distortions
 * - Asynchronous lossless PNG / high-quality JPEG Blob generation
 * - Ephemeral memory management (URL.revokeObjectURL support)
 */

import type { CropCoordinates } from "@/types/crop";
import type {
  DocumentCropState,
  DocumentDimensions,
} from "@/types/document-studio";
import {
  CR80_TARGET_WIDTH_PX,
  CR80_TARGET_HEIGHT_PX,
  CR80_CORNER_RADIUS_PX,
  calculateCR80Scaling,
  renderCR80NormalizedCrop,
} from "./cr80-normalizer.ts";

export {
  CR80_TARGET_WIDTH_PX,
  CR80_TARGET_HEIGHT_PX,
  CR80_CORNER_RADIUS_PX,
  calculateCR80Scaling,
  renderCR80NormalizedCrop,
};

export const createDefaultCropState = (
  targetAspectRatio: number | null = null
): DocumentCropState => ({
  isCropped: false,
  isCropEditorOpen: false,
  crop: null,
  rotation: 0,
  zoom: 1,
  aspectRatioLocked: true,
  targetAspectRatio,
  croppedPreviewUrl: null,
  croppedDimensions: null,
  autoCropStatus: { status: "idle" },
  activeView: "cropped",
});

export interface DocumentCropRenderOptions {
  crop: CropCoordinates;
  rotation?: number; // 0, 90, 180, 270 degrees
  mimeType?: "image/png" | "image/jpeg";
  quality?: number; // 0.0 - 1.0
  backgroundColor?: string;
  normalizeCR80?: boolean; // When true, standardizes output to ISO CR80 (1011 x 638 px)
  applyCornerRadius?: boolean;
}

export interface DocumentCropRenderResult {
  blob: Blob;
  previewUrl: string;
  dimensions: DocumentDimensions;
  fileSizeFormatted: string;
}

/**
 * Loads an image from an ephemeral Blob/Object URL into an HTMLImageElement.
 */
export function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Browser environment required to load HTMLImageElement."));
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      resolve(img);
    };

    img.onerror = () => {
      reject(new Error("Failed to load document image for cropping."));
    };

    img.src = url;
  });
}

/**
 * Normalizes rotation degrees to standard quadrant angles: 0, 90, 180, 270.
 */
export function normalizeRotation(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/**
 * Calculates the bounding box of an image after 90° step rotation.
 */
export function getRotatedDimensions(
  width: number,
  height: number,
  rotation: number
): { width: number; height: number } {
  const norm = normalizeRotation(rotation);
  if (norm === 90 || norm === 270) {
    return { width: height, height: width };
  }
  return { width, height };
}

/**
 * Transforms a crop rectangle when rotation changes by 90° clockwise or counterclockwise.
 * Ensures the crop rectangle stays centered and clamped within the new orientation.
 */
export function adjustCropForRotation(
  currentCrop: CropCoordinates,
  oldRotatedW: number,
  oldRotatedH: number,
  newRotatedW: number,
  newRotatedH: number,
  targetAspect: number | null = null
): CropCoordinates {
  // If no target aspect or aspect flipped: re-center proportional box in new orientation
  const aspect = targetAspect && targetAspect > 0 ? targetAspect : newRotatedW / newRotatedH;

  let width: number;
  let height: number;

  const maxW = newRotatedW * 0.85;
  const maxH = newRotatedH * 0.85;

  if (maxW / maxH > aspect) {
    height = Math.round(maxH);
    width = Math.round(height * aspect);
  } else {
    width = Math.round(maxW);
    height = Math.round(width / aspect);
  }

  width = Math.max(24, Math.min(newRotatedW, width));
  height = Math.max(24, Math.min(newRotatedH, height));

  const x = Math.max(0, Math.round((newRotatedW - width) / 2));
  const y = Math.max(0, Math.round((newRotatedH - height) / 2));

  return { x, y, width, height };
}

/**
 * Formats bytes into human-readable string.
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Executes canvas cropping and rotation at native image resolution.
 * Strictly browser-only, zero network requests, 100% ephemeral.
 */
export async function renderDocumentCrop(
  source: CanvasImageSource,
  nativeWidth: number,
  nativeHeight: number,
  options: DocumentCropRenderOptions
): Promise<DocumentCropRenderResult> {
  if (typeof document === "undefined" && typeof OffscreenCanvas === "undefined") {
    throw new Error("Canvas support is required for document cropping.");
  }

  const rotation = normalizeRotation(options.rotation ?? 0);
  const crop = options.crop;
  const mimeType = options.mimeType ?? "image/png";
  const quality = options.quality ?? 1.0;
  const backgroundColor = options.backgroundColor ?? "transparent";

  // Rotated coordinate space dimensions
  const rotatedSize = getRotatedDimensions(nativeWidth, nativeHeight, rotation);

  // Clamp crop strictly within rotated dimensions
  const cropX = Math.max(0, Math.min(Math.round(crop.x), rotatedSize.width - 1));
  const cropY = Math.max(0, Math.min(Math.round(crop.y), rotatedSize.height - 1));
  const cropW = Math.max(1, Math.min(Math.round(crop.width), rotatedSize.width - cropX));
  const cropH = Math.max(1, Math.min(Math.round(crop.height), rotatedSize.height - cropY));

  // 1. Render rotated full-resolution buffer
  let rotatedCanvas: HTMLCanvasElement | OffscreenCanvas;
  if (typeof OffscreenCanvas !== "undefined") {
    rotatedCanvas = new OffscreenCanvas(rotatedSize.width, rotatedSize.height);
  } else {
    rotatedCanvas = document.createElement("canvas");
    rotatedCanvas.width = rotatedSize.width;
    rotatedCanvas.height = rotatedSize.height;
  }

  const rotCtx = rotatedCanvas.getContext("2d") as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D;

  if (!rotCtx) {
    throw new Error("Failed to initialize rotated canvas context.");
  }

  rotCtx.imageSmoothingEnabled = true;
  rotCtx.imageSmoothingQuality = "high";

  // Position origin and apply 90° step rotation
  rotCtx.save();
  if (rotation === 90) {
    rotCtx.translate(rotatedSize.width, 0);
    rotCtx.rotate((90 * Math.PI) / 180);
  } else if (rotation === 180) {
    rotCtx.translate(rotatedSize.width, rotatedSize.height);
    rotCtx.rotate((180 * Math.PI) / 180);
  } else if (rotation === 270) {
    rotCtx.translate(0, rotatedSize.height);
    rotCtx.rotate((270 * Math.PI) / 180);
  }

  rotCtx.drawImage(source, 0, 0, nativeWidth, nativeHeight);
  rotCtx.restore();

  // 2. Render final cropped canvas buffer (with optional ISO CR80 normalization)
  const isCR80 = options.normalizeCR80 ?? false;
  const outW = isCR80 ? CR80_TARGET_WIDTH_PX : cropW;
  const outH = isCR80 ? CR80_TARGET_HEIGHT_PX : cropH;
  const cr80Scaling = isCR80 ? calculateCR80Scaling(cropW, cropH) : null;

  let outputCanvas: HTMLCanvasElement | OffscreenCanvas;
  if (typeof OffscreenCanvas !== "undefined") {
    outputCanvas = new OffscreenCanvas(outW, outH);
  } else {
    outputCanvas = document.createElement("canvas");
    outputCanvas.width = outW;
    outputCanvas.height = outH;
  }

  const outCtx = outputCanvas.getContext("2d") as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D;

  if (!outCtx) {
    throw new Error("Failed to initialize output canvas context.");
  }

  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = "high";

  // Fill canvas background
  const effectiveBg = isCR80 && (!backgroundColor || backgroundColor === "transparent")
    ? "#ffffff"
    : backgroundColor;

  if (effectiveBg && effectiveBg !== "transparent") {
    outCtx.fillStyle = effectiveBg;
    outCtx.fillRect(0, 0, outW, outH);
  } else {
    outCtx.clearRect(0, 0, outW, outH);
  }

  // If rounded corners requested for CR80
  if (isCR80 && options.applyCornerRadius) {
    outCtx.save();
    outCtx.beginPath();
    if (typeof outCtx.roundRect === "function") {
      outCtx.roundRect(0, 0, outW, outH, CR80_CORNER_RADIUS_PX);
    } else {
      const r = CR80_CORNER_RADIUS_PX;
      outCtx.moveTo(r, 0);
      outCtx.lineTo(outW - r, 0);
      outCtx.arcTo(outW, 0, outW, r, r);
      outCtx.lineTo(outW, outH - r);
      outCtx.arcTo(outW, outH, outW - r, outH, r);
      outCtx.lineTo(r, outH);
      outCtx.arcTo(0, outH, 0, outH - r, r);
      outCtx.lineTo(0, r);
      outCtx.arcTo(0, 0, r, 0, r);
      outCtx.closePath();
    }
    outCtx.clip();
  }

  // Draw slice from rotated canvas onto cropped output canvas
  if (cr80Scaling) {
    outCtx.drawImage(
      rotatedCanvas,
      cropX,
      cropY,
      cropW,
      cropH,
      cr80Scaling.drawX,
      cr80Scaling.drawY,
      cr80Scaling.drawWidth,
      cr80Scaling.drawHeight
    );
  } else {
    outCtx.drawImage(
      rotatedCanvas,
      cropX,
      cropY,
      cropW,
      cropH,
      0,
      0,
      cropW,
      cropH
    );
  }

  if (isCR80 && options.applyCornerRadius) {
    outCtx.restore();
  }

  // 3. Export to Blob
  let blob: Blob;
  if (outputCanvas instanceof OffscreenCanvas) {
    blob = await outputCanvas.convertToBlob({ type: mimeType, quality });
  } else {
    blob = await new Promise<Blob>((resolve, reject) => {
      (outputCanvas as HTMLCanvasElement).toBlob(
        (b) => {
          if (!b) reject(new Error("Canvas toBlob conversion failed."));
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
      width: outW,
      height: outH,
      aspectRatio: outW / outH,
    },
    fileSizeFormatted: formatBytes(blob.size),
  };
}
