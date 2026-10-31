import { ExportOptions } from "@/types/processing";
import { ImageAdjustments } from "@/types/image";

/**
 * Creates an offscreen or standard HTML Canvas element with the specified dimensions.
 */
export function createProcessingCanvas(width: number, height: number): HTMLCanvasElement {
  if (typeof document === "undefined") {
    throw new Error("HTML Canvas is only available in a browser environment");
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

/**
 * Applies CSS-based or pixel-level image adjustments to a canvas context.
 */
export function applyImageFilters(
  ctx: CanvasRenderingContext2D,
  adjustments: ImageAdjustments
): void {
  const brightness = 100 + adjustments.brightness;
  const contrast = 100 + adjustments.contrast;
  const saturate = 100 + adjustments.saturation;

  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)`;
}

/**
 * Exports an HTML Canvas to a Blob with specific format and quality settings.
 */
export function exportCanvasToBlob(
  canvas: HTMLCanvasElement,
  options: ExportOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to export canvas buffer to Blob"));
        }
      },
      options.format,
      options.quality ?? 0.92
    );
  });
}

/**
 * Downloads a Blob directly to the user's computer via an ephemeral anchor element.
 */
export function triggerFileDownload(blob: Blob, fileName: string): void {
  if (typeof window === "undefined") return;

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Promptly revoke URL to release browser memory
  setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}
