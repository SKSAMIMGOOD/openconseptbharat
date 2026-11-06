/**
 * Phase 08C — Document Studio Enhancement Engine
 *
 * Privacy-first, 100% in-browser non-destructive image enhancement.
 * Features:
 * - Brightness (-100 to +100)
 * - Contrast (-100 to +100)
 * - Saturation (-100 to +100)
 * - Sharpness (0 to 100, calibrated unsharp mask with coring to protect text & QR codes)
 * - Grayscale (ITU-R BT.709 luminance conversion)
 * - Invert Colors (Negative scan inversion)
 * - Zero network calls, zero server uploads, 100% client-side memory execution.
 */

import type { DocumentEnhancementSettings } from "../../types/document-studio.ts";
import {
  DEFAULT_ENHANCEMENT_SETTINGS,
  isEnhancementActive,
} from "../../types/document-studio.ts";
import { loadImageElement } from "./document-cropper.ts";

/**
 * Pure mathematical pixel processor. Operates on raw RGBA Uint8ClampedArray data.
 * Compatible with Node.js and Browser environments.
 * Non-destructive: returns a new enhanced Uint8ClampedArray.
 */
export function applyPixelEnhancements(
  srcData: Uint8ClampedArray,
  width: number,
  height: number,
  settings: DocumentEnhancementSettings
): Uint8ClampedArray {
  if (!isEnhancementActive(settings)) {
    return new Uint8ClampedArray(srcData);
  }

  const brightness = Math.max(-100, Math.min(100, Number(settings.brightness) || 0));
  const contrast = Math.max(-100, Math.min(100, Number(settings.contrast) || 0));
  const saturation = Math.max(-100, Math.min(100, Number(settings.saturation) || 0));
  const sharpness = Math.max(0, Math.min(100, Number(settings.sharpness) || 0));
  const grayscale = Boolean(settings.grayscale);
  const invert = Boolean(settings.invert);

  const len = width * height * 4;
  const out = new Uint8ClampedArray(srcData);

  const bOffset = brightness * 2.55;
  const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const sMult = 1 + saturation / 100;
  const hasColorAdjust =
    brightness !== 0 || contrast !== 0 || saturation !== 0 || grayscale || invert;

  // 1. Color and Tone Enhancements (Brightness, Contrast, Saturation, Grayscale, Invert)
  if (hasColorAdjust) {
    for (let i = 0; i < len; i += 4) {
      let r = out[i];
      let g = out[i + 1];
      let b = out[i + 2];

      // Grayscale or Saturation
      if (grayscale) {
        // ITU-R BT.709 luminance weights
        const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = l;
        g = l;
        b = l;
      } else if (saturation !== 0) {
        const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = l + sMult * (r - l);
        g = l + sMult * (g - l);
        b = l + sMult * (b - l);
      }

      // Contrast adjustment centered at 128
      if (contrast !== 0) {
        r = cFactor * (r - 128) + 128;
        g = cFactor * (g - 128) + 128;
        b = cFactor * (b - 128) + 128;
      }

      // Brightness offset
      if (brightness !== 0) {
        r += bOffset;
        g += bOffset;
        b += bOffset;
      }

      // Invert
      if (invert) {
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
      }

      // Assignment to Uint8ClampedArray automatically clamps to [0, 255]
      out[i] = r;
      out[i + 1] = g;
      out[i + 2] = b;
      // Alpha out[i+3] remains untouched
    }
  }

  // 2. Sharpness: Document & QR-Safe Unsharp Mask Convolution
  // Calibrated alpha (max 0.60 at 100) and coring threshold (2) to suppress sensor/paper noise
  // and prevent text haloing or QR code module bridging.
  if (sharpness > 0) {
    const alpha = (sharpness / 100) * 0.6;
    const temp = new Uint8ClampedArray(out);
    const rowStride = width * 4;

    for (let y = 0; y < height; y++) {
      const yUp = y > 0 ? (y - 1) * rowStride : y * rowStride;
      const yDown = y < height - 1 ? (y + 1) * rowStride : y * rowStride;
      const yCurr = y * rowStride;

      for (let x = 0; x < width; x++) {
        const xLeft = x > 0 ? (x - 1) * 4 : x * 4;
        const xRight = x < width - 1 ? (x + 1) * 4 : x * 4;
        const xCurr = x * 4;

        const idx = yCurr + xCurr;
        const upIdx = yUp + xCurr;
        const downIdx = yDown + xCurr;
        const leftIdx = yCurr + xLeft;
        const rightIdx = yCurr + xRight;

        if (grayscale) {
          // Optimization: in grayscale, R=G=B, calculate Laplacian once
          const cVal = temp[idx];
          const lap =
            4 * cVal -
            temp[upIdx] -
            temp[downIdx] -
            temp[leftIdx] -
            temp[rightIdx];

          if (lap > 1 || lap < -1) {
            const enhanced = cVal + alpha * lap;
            out[idx] = enhanced;
            out[idx + 1] = enhanced;
            out[idx + 2] = enhanced;
          }
        } else {
          // Red
          const rC = temp[idx];
          const rLap =
            4 * rC -
            temp[upIdx] -
            temp[downIdx] -
            temp[leftIdx] -
            temp[rightIdx];
          if (rLap > 1 || rLap < -1) out[idx] = rC + alpha * rLap;

          // Green
          const gC = temp[idx + 1];
          const gLap =
            4 * gC -
            temp[upIdx + 1] -
            temp[downIdx + 1] -
            temp[leftIdx + 1] -
            temp[rightIdx + 1];
          if (gLap > 1 || gLap < -1) out[idx + 1] = gC + alpha * gLap;

          // Blue
          const bC = temp[idx + 2];
          const bLap =
            4 * bC -
            temp[upIdx + 2] -
            temp[downIdx + 2] -
            temp[leftIdx + 2] -
            temp[rightIdx + 2];
          if (bLap > 1 || bLap < -1) out[idx + 2] = bC + alpha * bLap;
        }
      }
    }
  }

  return out;
}

export interface EnhancedRenderResult {
  blob: Blob;
  previewUrl: string;
}

/**
 * Applies enhancements to a canvas or image source and outputs an enhanced Blob and Object URL.
 * Never modifies the source image or canvas.
 */
export async function renderEnhancedCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
  settings: DocumentEnhancementSettings,
  mimeType: "image/png" | "image/jpeg" = "image/png",
  quality: number = 1.0
): Promise<EnhancedRenderResult> {
  if (typeof document === "undefined" && typeof OffscreenCanvas === "undefined") {
    throw new Error("Canvas support is required for document enhancement rendering.");
  }

  let canvas: HTMLCanvasElement | OffscreenCanvas;
  if (typeof OffscreenCanvas !== "undefined") {
    canvas = new OffscreenCanvas(width, height);
  } else {
    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext("2d") as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D;

  if (!ctx) {
    throw new Error("Failed to initialize canvas context for enhancement.");
  }

  ctx.drawImage(source, 0, 0, width, height);

  if (isEnhancementActive(settings)) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const enhancedData = applyPixelEnhancements(
      imgData.data,
      width,
      height,
      settings
    );
    imgData.data.set(enhancedData);
    ctx.putImageData(imgData, 0, 0);
  }

  let blob: Blob;
  if (canvas instanceof OffscreenCanvas) {
    blob = await canvas.convertToBlob({ type: mimeType, quality });
  } else {
    blob = await new Promise<Blob>((resolve, reject) => {
      (canvas as HTMLCanvasElement).toBlob(
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
  return { blob, previewUrl };
}

/**
 * Convenience helper: Loads a clean unenhanced crop URL, applies enhancements,
 * and returns the enhanced Blob and ephemeral Object URL.
 */
export async function renderEnhancedFromUrl(
  cleanCropUrl: string,
  width: number,
  height: number,
  settings: DocumentEnhancementSettings,
  mimeType: "image/png" | "image/jpeg" = "image/png"
): Promise<EnhancedRenderResult> {
  const img = await loadImageElement(cleanCropUrl);
  return renderEnhancedCanvas(img, width, height, settings, mimeType);
}
