import type {
  ExportResult,
  ImageExportOptions,
  SupportedImageFormat,
} from "../../types/image-engine";
import type { AnyCanvas } from "./transform";
import { createTrackedObjectURL, revokeObjectUrlSafely } from "../utils/memory";

/** Default export quality for lossy formats (JPEG/WebP) */
export const DEFAULT_EXPORT_QUALITY = 0.92;

/**
 * Formats a clean semantic filename for download.
 * e.g. "portrait.png" exported as JPEG -> "processed-portrait-1698765432.jpg"
 */
export function generateExportFileName(
  originalName: string = "image",
  format: SupportedImageFormat = "image/png",
  prefix: string = "processed"
): string {
  // Strip any existing extension
  const dotIndex = originalName.lastIndexOf(".");
  const baseName =
    dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
  const cleanBase = baseName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);

  const timestamp = Date.now().toString().slice(-6);

  const extensionMap: Record<SupportedImageFormat, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };

  const ext = extensionMap[format] || ".png";
  return `${prefix}-${cleanBase}-${timestamp}${ext}`;
}

/**
 * Ensures that if an image with transparency is exported to JPEG (which lacks an alpha channel),
 * a solid background color (default white) is flattened beneath it, preventing black or corrupted pixels.
 */
function getExportReadyCanvas(
  canvas: AnyCanvas,
  options: ImageExportOptions
): AnyCanvas {
  const needsFlattening =
    options.format === "image/jpeg" ||
    (options.backgroundColor && options.backgroundColor !== "transparent");

  if (!needsFlattening) {
    return canvas;
  }

  const bgColor = options.backgroundColor || "#ffffff";
  const width = canvas.width;
  const height = canvas.height;

  let flattened: AnyCanvas;
  if (typeof OffscreenCanvas !== "undefined") {
    flattened = new OffscreenCanvas(width, height);
  } else {
    flattened = document.createElement("canvas");
    flattened.width = width;
    flattened.height = height;
  }

  const ctx = flattened.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  if (ctx) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(canvas, 0, 0);
    return flattened;
  }

  return canvas;
}

/**
 * Exports an HTMLCanvasElement or OffscreenCanvas to a high-quality Blob.
 * Handles both DOM canvas and OffscreenCanvas environments cleanly.
 */
export async function exportCanvasToBlob(
  canvas: AnyCanvas,
  options: ImageExportOptions
): Promise<Blob> {
  const targetCanvas = getExportReadyCanvas(canvas, options);
  const format = options.format;
  const quality = Math.max(0.01, Math.min(1.0, options.quality ?? DEFAULT_EXPORT_QUALITY));

  // 1. OffscreenCanvas Path
  if (
    typeof OffscreenCanvas !== "undefined" &&
    targetCanvas instanceof OffscreenCanvas
  ) {
    return targetCanvas.convertToBlob({
      type: format,
      quality: format === "image/png" ? undefined : quality,
    });
  }

  // 2. HTMLCanvasElement Path
  if ("toBlob" in targetCanvas && typeof targetCanvas.toBlob === "function") {
    return new Promise((resolve, reject) => {
      targetCanvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error(`Failed to encode canvas to format "${format}".`));
          }
        },
        format,
        format === "image/png" ? undefined : quality
      );
    });
  }

  throw new Error("Unable to export canvas: Unsupported canvas type in this environment.");
}

/**
 * High-level export helper: converts a canvas to Blob and returns complete export metadata.
 */
export async function exportImage(
  canvas: AnyCanvas,
  options: ImageExportOptions,
  originalFileName?: string
): Promise<ExportResult> {
  const blob = await exportCanvasToBlob(canvas, options);
  const fileName =
    options.fileName ||
    generateExportFileName(originalFileName, options.format);

  return {
    blob,
    fileName,
    format: options.format,
    width: canvas.width,
    height: canvas.height,
    sizeBytes: blob.size,
  };
}

/**
 * Downloads a Blob directly to the client disk with zero server roundtrips.
 * Uses ephemeral object URLs that are tracked and revoked cleanly.
 */
export function downloadImageBlob(blob: Blob, fileName: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const objectUrl = createTrackedObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Safely revoke the URL once download initiation is handed to the browser
  setTimeout(() => {
    revokeObjectUrlSafely(objectUrl);
  }, 1000);
}
