/**
 * Raw Image to Clean PDF — Document Annotation & Enhancement Compositor
 * Phase 3: Document Enhancement & Annotation Tools
 *
 * Privacy-first, 100% in-browser rendering engine for:
 * - Pixel-retouching eraser (erasing unwanted document marks/stamps/shadows)
 * - Semi-transparent document highlighter (yellow, green, blue, pink, orange)
 * - Configurable text watermarks (opacity, rotation, font size, positioning)
 * - Instantaneous CSS filter computation for real-time preview
 * - Offscreen full-resolution composite rendering
 */

import type {
  AnnotationStroke,
  WatermarkConfig,
  DocumentEnhancementSettings,
  ColorFilterSettings,
} from "../../types/raw-image-to-pdf.ts";
import { applyPixelEnhancements } from "../document/document-enhancer.ts";
import { isEnhancementActive } from "../../types/document-studio.ts";

/**
 * Computes a standard CSS filter string for instantaneous 60fps real-time preview
 * of brightness, contrast, saturation, grayscale, and invert.
 */
export function getEnhancementCssFilter(settings: DocumentEnhancementSettings): string {
  const filters: string[] = [];

  if (settings.brightness !== 0) {
    // -100 maps to 0, 0 maps to 1, +100 maps to 2
    const b = Math.max(0, 1 + settings.brightness / 100);
    filters.push(`brightness(${b.toFixed(2)})`);
  }

  if (settings.contrast !== 0) {
    const c = Math.max(0, 1 + settings.contrast / 100);
    filters.push(`contrast(${c.toFixed(2)})`);
  }

  if (settings.saturation !== 0 && !settings.grayscale) {
    const s = Math.max(0, 1 + settings.saturation / 100);
    filters.push(`saturate(${s.toFixed(2)})`);
  }

  if (settings.grayscale) {
    filters.push("grayscale(100%)");
  }

  if (settings.invert) {
    filters.push("invert(100%)");
  }

  return filters.length > 0 ? filters.join(" ") : "none";
}

/**
 * Computes CSS filter string for Color Filter presets, scaled by intensity (0 to 100).
 * 0% intensity returns "" (neutral).
 * Original preset returns "" (neutral).
 */
export function getColorFilterCss(filter: ColorFilterSettings): string {
  if (!filter || filter.preset === "original" || filter.intensity <= 0) {
    return "";
  }

  const factor = Math.max(0, Math.min(100, filter.intensity)) / 100;

  switch (filter.preset) {
    case "auto": {
      const contrast = (1 + 0.15 * factor).toFixed(2);
      const saturate = (1 + 0.15 * factor).toFixed(2);
      const brightness = (1 + 0.05 * factor).toFixed(2);
      return `contrast(${contrast}) saturate(${saturate}) brightness(${brightness})`;
    }
    case "grayscale": {
      const percent = Math.round(100 * factor);
      return `grayscale(${percent}%)`;
    }
    case "bw": {
      const contrast = (1 + 1.2 * factor).toFixed(2);
      const brightness = (1 + 0.1 * factor).toFixed(2);
      return `grayscale(100%) contrast(${contrast}) brightness(${brightness})`;
    }
    case "warm": {
      const sepia = Math.round(40 * factor);
      const saturate = (1 + 0.2 * factor).toFixed(2);
      const brightness = (1 + 0.02 * factor).toFixed(2);
      return `sepia(${sepia}%) saturate(${saturate}) brightness(${brightness})`;
    }
    case "cool": {
      const deg = Math.round(-20 * factor);
      const saturate = (1 + 0.1 * factor).toFixed(2);
      const brightness = (1 + 0.03 * factor).toFixed(2);
      return `hue-rotate(${deg}deg) saturate(${saturate}) brightness(${brightness})`;
    }
    case "vintage": {
      const sepia = Math.round(60 * factor);
      const contrast = (1 - 0.15 * factor).toFixed(2);
      const saturate = (1 - 0.2 * factor).toFixed(2);
      return `sepia(${sepia}%) contrast(${contrast}) saturate(${saturate})`;
    }
    case "high-contrast": {
      const contrast = (1 + 0.8 * factor).toFixed(2);
      const brightness = (1 - 0.05 * factor).toFixed(2);
      return `contrast(${contrast}) brightness(${brightness})`;
    }
    default:
      return "";
  }
}

/**
 * Combines global document enhancements and color filter presets into one unified CSS filter string.
 */
export function getCombinedDocumentFilter(
  enhancements: DocumentEnhancementSettings,
  colorFilter?: ColorFilterSettings
): string {
  const parts: string[] = [];

  const enhCss = getEnhancementCssFilter(enhancements);
  if (enhCss && enhCss !== "none") {
    parts.push(enhCss);
  }

  if (colorFilter) {
    const filterCss = getColorFilterCss(colorFilter);
    if (filterCss) {
      parts.push(filterCss);
    }
  }

  return parts.length > 0 ? parts.join(" ") : "none";
}

/**
 * Renders an array of annotation strokes (eraser and highlighter) onto a 2D canvas context.
 */
export function renderStrokesToCanvas(
  ctx: CanvasRenderingContext2D,
  strokes: AnnotationStroke[],
  scaleX = 1,
  scaleY = 1
): void {
  for (const stroke of strokes) {
    if (!stroke.points || stroke.points.length === 0) continue;

    ctx.save();

    if (stroke.tool === "eraser") {
      ctx.strokeStyle = stroke.color || "#ffffff";
      ctx.lineWidth = stroke.size * scaleX;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = "source-over";

      ctx.beginPath();
      const firstPt = stroke.points[0];
      ctx.moveTo(firstPt.x * scaleX, firstPt.y * scaleY);

      if (stroke.points.length === 1) {
        // Single dot click
        ctx.lineTo(firstPt.x * scaleX + 0.1, firstPt.y * scaleY + 0.1);
      } else {
        for (let i = 1; i < stroke.points.length; i++) {
          const pt = stroke.points[i];
          ctx.lineTo(pt.x * scaleX, pt.y * scaleY);
        }
      }
      ctx.stroke();
    } else if (stroke.tool === "highlighter") {
      ctx.strokeStyle = stroke.color || "#fef08a";
      ctx.lineWidth = stroke.size * scaleX;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = stroke.opacity || 0.4;
      ctx.globalCompositeOperation = "multiply";

      ctx.beginPath();
      const firstPt = stroke.points[0];
      ctx.moveTo(firstPt.x * scaleX, firstPt.y * scaleY);

      if (stroke.points.length === 1) {
        ctx.lineTo(firstPt.x * scaleX + 0.1, firstPt.y * scaleY + 0.1);
      } else {
        for (let i = 1; i < stroke.points.length; i++) {
          const pt = stroke.points[i];
          ctx.lineTo(pt.x * scaleX, pt.y * scaleY);
        }
      }
      ctx.stroke();
    }

    ctx.restore();
  }
}

/**
 * Renders a text watermark onto a 2D canvas context.
 */
export function renderWatermarkToCanvas(
  ctx: CanvasRenderingContext2D,
  watermark: WatermarkConfig,
  width: number,
  height: number,
  scale = 1
): void {
  if (!watermark.enabled || !watermark.text || !watermark.text.trim()) return;

  const posX = (watermark.xPercent / 100) * width;
  const posY = (watermark.yPercent / 100) * height;
  const scaledFontSize = Math.max(10, Math.round(watermark.fontSize * scale));

  ctx.save();
  ctx.translate(posX, posY);
  ctx.rotate((watermark.rotation * Math.PI) / 180);

  ctx.font = `bold ${scaledFontSize}px sans-serif`;
  ctx.fillStyle = watermark.color || "#64748b";
  ctx.globalAlpha = Math.max(0.05, Math.min(1, watermark.opacity || 0.25));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(watermark.text, 0, 0);
  ctx.restore();
}

/**
 * Renders all document composite layers onto an existing 2D canvas context:
 * 1. Base image with combined CSS filters (brightness, contrast, saturation, color filters)
 * 2. Pixel enhancements (sharpness) if active
 * 3. Annotation strokes (eraser and highlighter)
 * 4. Text watermark
 */
export function compositeDocumentLayers(
  ctx: CanvasRenderingContext2D,
  imageSource: CanvasImageSource,
  width: number,
  height: number,
  enhancements: DocumentEnhancementSettings,
  annotations: AnnotationStroke[] = [],
  watermark: WatermarkConfig | null = null,
  colorFilter?: ColorFilterSettings
): void {
  // 1. Draw base document image with combined filter if active
  const filterString = getCombinedDocumentFilter(enhancements, colorFilter);
  if (filterString && filterString !== "none") {
    try {
      ctx.filter = filterString;
    } catch {}
  }
  ctx.drawImage(imageSource, 0, 0, width, height);
  ctx.filter = "none";

  // 2. Apply pixel enhancements (sharpness, or fallback if ctx.filter unsupported)
  if (isEnhancementActive(enhancements)) {
    // If ctx.filter was applied, only apply sharpness to avoid double-processing color adjustments
    const settingsToApply =
      filterString && filterString !== "none"
        ? {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            sharpness: enhancements.sharpness,
            grayscale: false,
            invert: false,
          }
        : enhancements;

    if (isEnhancementActive(settingsToApply)) {
      const imgData = ctx.getImageData(0, 0, width, height);
      const enhancedData = applyPixelEnhancements(imgData.data, width, height, settingsToApply);
      imgData.data.set(enhancedData);
      ctx.putImageData(imgData, 0, 0);
    }
  }

  // 3. Render annotations (eraser & highlighter)
  if (annotations.length > 0) {
    renderStrokesToCanvas(ctx, annotations);
  }

  // 4. Render watermark if enabled
  if (watermark && watermark.enabled) {
    renderWatermarkToCanvas(ctx, watermark, width, height);
  }
}

/**
 * Composites a source image, global enhancements, eraser/highlighter annotations,
 * and text watermark into an offscreen canvas and returns an ephemeral Blob & URL.
 */
export async function renderCompositeDocumentCanvas(
  imageSource: HTMLImageElement | HTMLCanvasElement,
  width: number,
  height: number,
  enhancements: DocumentEnhancementSettings,
  annotations: AnnotationStroke[] = [],
  watermark: WatermarkConfig | null = null,
  colorFilter?: ColorFilterSettings,
  mimeType: "image/png" | "image/jpeg" = "image/png",
  quality = 0.95
): Promise<{ blob: Blob; previewUrl: string }> {
  if (typeof document === "undefined") {
    throw new Error("renderCompositeDocumentCanvas requires browser DOM Canvas API");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not create canvas 2D context");

  compositeDocumentLayers(
    ctx,
    imageSource,
    width,
    height,
    enhancements,
    annotations,
    watermark,
    colorFilter
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        // Free canvas pixels
        canvas.width = 0;
        canvas.height = 0;

        if (!blob) {
          reject(new Error("Failed to generate composite document image"));
          return;
        }

        const previewUrl = URL.createObjectURL(blob);
        resolve({ blob, previewUrl });
      },
      mimeType,
      quality
    );
  });
}
