/**
 * Raw Image to Clean PDF — Thumbnail Generator
 * Phase 1: Memory-Safe Thumbnail Generation
 *
 * Decodes images sequentially, renders downscaled lightweight preview thumbnails (<= 480px),
 * and immediately reclaims high-resolution canvas backing memory to prevent OOM on mobile.
 */

import { releaseCanvasBuffer, createTrackedObjectURL, revokeObjectUrlSafely } from "../utils/memory.ts";
import type { RawImageToPdfConfig } from "../../types/raw-image-to-pdf.ts";
import { DEFAULT_RAW_IMAGE_CONFIG } from "../../types/raw-image-to-pdf.ts";

export interface ThumbnailGenerationResult {
  thumbnailUrl: string;
  thumbnailBlob: Blob;
  originalWidth: number;
  originalHeight: number;
  aspectRatio: number;
  sizeFormatted: string;
}

/**
 * Formats byte size into human-readable string (KB or MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${Math.round(kb)} KB`;
  }
  return `${(kb / 1024).toFixed(2)} MB`;
}

/**
 * Loads an HTMLImageElement asynchronously from an ephemeral Object URL.
 */
function loadImageAsync(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Unable to decode image file. File may be corrupted or unsupported."));
    img.src = url;
  });
}

/**
 * Generates a lightweight, memory-efficient preview thumbnail for a single File.
 * Reclaims full-resolution canvas buffers immediately upon encoding.
 */
export async function generateLightweightThumbnail(
  file: File,
  config: Pick<RawImageToPdfConfig, "thumbnailMaxDimension" | "thumbnailQuality"> = DEFAULT_RAW_IMAGE_CONFIG
): Promise<ThumbnailGenerationResult> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Thumbnail generation requires browser DOM environment.");
  }

  // 1. Create temporary ephemeral object URL for original file
  const tempSourceUrl = URL.createObjectURL(file);
  let canvas: HTMLCanvasElement | null = null;

  try {
    const img = await loadImageAsync(tempSourceUrl);
    const origW = img.naturalWidth || img.width;
    const origH = img.naturalHeight || img.height;

    if (origW <= 0 || origH <= 0) {
      throw new Error("Invalid image dimensions detected.");
    }

    const aspectRatio = origW / origH;

    // 2. Compute downscaled thumbnail dimensions
    const maxDim = config.thumbnailMaxDimension || 480;
    const scale = Math.min(1, maxDim / Math.max(origW, origH));
    const thumbW = Math.max(1, Math.round(origW * scale));
    const thumbH = Math.max(1, Math.round(origH * scale));

    // 3. Render onto small temporary canvas
    canvas = document.createElement("canvas");
    canvas.width = thumbW;
    canvas.height = thumbH;

    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    if (!ctx) {
      throw new Error("Failed to acquire 2D canvas context for thumbnail.");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "medium";
    ctx.drawImage(img, 0, 0, thumbW, thumbH);

    // 4. Encode to compact JPEG blob (or PNG if source was PNG with transparency)
    const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const quality = config.thumbnailQuality || 0.82;

    const thumbnailBlob: Blob = await new Promise((resolve, reject) => {
      canvas!.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to encode thumbnail canvas to blob."));
        },
        mimeType,
        quality
      );
    });

    // 5. Track thumbnail Object URL for reliable memory management
    const thumbnailUrl = createTrackedObjectURL(thumbnailBlob);

    return {
      thumbnailUrl,
      thumbnailBlob,
      originalWidth: origW,
      originalHeight: origH,
      aspectRatio,
      sizeFormatted: formatFileSize(file.size),
    };
  } finally {
    // 6. Clean up temporary source URL and release canvas backing buffer
    URL.revokeObjectURL(tempSourceUrl);
    if (canvas) {
      releaseCanvasBuffer(canvas);
      canvas = null;
    }
  }
}
