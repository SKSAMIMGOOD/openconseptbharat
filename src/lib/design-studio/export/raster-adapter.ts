/**
 * Design Studio — Raster (PNG / JPG) Rendering Adapter
 *
 * Renders an engine-independent DesignDocument page directly to an HTMLCanvasElement
 * using standard 2D Canvas API at exact physical DPI resolution.
 * Completely independent of the interactive Konva stage.
 */

import type {
  DesignDocument,
  DesignPage,
  DesignElement,
  TextDesignElement,
  ImageDesignElement,
  ShapeDesignElement,
} from "../../../types/design-studio.ts";
import { mmToPixels, mmToPoints } from "../../../constants/design-dimensions.ts";
import { parseColor } from "./color-utils.ts";
import { releaseCanvasBuffer } from "../../utils/memory.ts";

/**
 * Loads an HTMLImageElement from a URL safely.
 */
function loadImageElement(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Renders a single DesignPage onto an offscreen/in-memory canvas at specified DPI.
 */
export async function renderPageToCanvas(
  document: DesignDocument,
  page: DesignPage,
  dpi: number = 300,
  options?: {
    transparentBackground?: boolean;
    backgroundColor?: string;
  }
): Promise<HTMLCanvasElement> {
  const isLandscape = document.orientation === "landscape";
  const physWidthMm = isLandscape ? Math.max(document.dimensions.widthMm, document.dimensions.heightMm) : Math.min(document.dimensions.widthMm, document.dimensions.heightMm);
  const physHeightMm = isLandscape ? Math.min(document.dimensions.widthMm, document.dimensions.heightMm) : Math.max(document.dimensions.widthMm, document.dimensions.heightMm);

  // Logical page size in points (72 DPI)
  const logicalWidthPt = mmToPoints(physWidthMm);
  const logicalHeightPt = mmToPoints(physHeightMm);

  // Physical pixel dimensions
  const pixelWidth = mmToPixels(physWidthMm, dpi);
  const pixelHeight = mmToPixels(physHeightMm, dpi);

  const canvas = window.document.createElement("canvas");
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to obtain 2D canvas context for rendering.");
  }

  // Scaling factor: logical points (72 pt/in) -> raster pixels (dpi px/in)
  const scale = dpi / 72;

  // 1. Render Background
  const bg = page.background;
  if (!options?.transparentBackground) {
    if (bg.type === "solid") {
      ctx.fillStyle = bg.color || "#ffffff";
      ctx.fillRect(0, 0, pixelWidth, pixelHeight);
    } else if (bg.type === "gradient" && bg.gradient) {
      const angleRad = (bg.gradient.angleDegrees * Math.PI) / 180;
      // Calculate linear gradient coordinates
      const cx = pixelWidth / 2;
      const cy = pixelHeight / 2;
      const length = Math.sqrt(pixelWidth * pixelWidth + pixelHeight * pixelHeight);
      const x0 = cx - (Math.cos(angleRad) * length) / 2;
      const y0 = cy - (Math.sin(angleRad) * length) / 2;
      const x1 = cx + (Math.cos(angleRad) * length) / 2;
      const y1 = cy + (Math.sin(angleRad) * length) / 2;

      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      bg.gradient.colorStops.forEach((stop) => {
        grad.addColorStop(Math.min(1, Math.max(0, stop.offset)), stop.color);
      });
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, pixelWidth, pixelHeight);
    } else if (bg.type === "image" && bg.assetId && document.assets[bg.assetId]) {
      const asset = document.assets[bg.assetId];
      const img = await loadImageElement(asset.url);
      if (img) {
        ctx.save();
        if (bg.opacity !== undefined) ctx.globalAlpha = bg.opacity;
        ctx.drawImage(img, 0, 0, pixelWidth, pixelHeight);
        ctx.restore();
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, pixelWidth, pixelHeight);
      }
    } else {
      ctx.fillStyle = options?.backgroundColor || "#ffffff";
      ctx.fillRect(0, 0, pixelWidth, pixelHeight);
    }
  } else {
    // If transparent is requested, clear the rect
    ctx.clearRect(0, 0, pixelWidth, pixelHeight);
  }

  // 2. Render Elements sorted by zIndex
  const sortedElements = [...page.elements]
    .filter((el) => el.visible)
    .sort((a, b) => a.zIndex - b.zIndex);

  for (const el of sortedElements) {
    ctx.save();

    const t = el.transform;
    const elX = t.x * scale;
    const elY = t.y * scale;
    const elW = t.width * (t.scaleX ?? 1) * scale;
    const elH = t.height * (t.scaleY ?? 1) * scale;

    ctx.globalAlpha = Math.min(1, Math.max(0, el.opacity ?? 1));

    // Handle rotation around center if rotation != 0
    if (t.rotation && t.rotation !== 0) {
      const cx = elX + elW / 2;
      const cy = elY + elH / 2;
      ctx.translate(cx, cy);
      ctx.rotate((t.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }

    if (el.type === "shape") {
      renderShape(ctx, el, elX, elY, elW, elH, scale);
    } else if (el.type === "text") {
      renderText(ctx, el, elX, elY, elW, elH, scale);
    } else if (el.type === "image") {
      await renderImage(ctx, el, document, elX, elY, elW, elH);
    }

    ctx.restore();
  }

  return canvas;
}

/**
 * Renders a vector shape element onto the 2D context.
 */
function renderShape(
  ctx: CanvasRenderingContext2D,
  el: ShapeDesignElement,
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number
) {
  ctx.save();
  ctx.fillStyle = el.fill || "transparent";
  ctx.strokeStyle = el.stroke || "transparent";
  ctx.lineWidth = (el.strokeWidth || 0) * scale;

  if (el.strokeDashArray && el.strokeDashArray.length > 0) {
    ctx.setLineDash(el.strokeDashArray.map((v) => v * scale));
  }

  const radius = (el.cornerRadius || 0) * scale;

  ctx.beginPath();
  switch (el.shapeType) {
    case "rect": {
      if (radius > 0 && typeof ctx.roundRect === "function") {
        ctx.roundRect(x, y, w, h, radius);
      } else {
        ctx.rect(x, y, w, h);
      }
      break;
    }
    case "circle":
    case "ellipse": {
      const rx = w / 2;
      const ry = h / 2;
      ctx.ellipse(x + rx, y + ry, rx, ry, 0, 0, Math.PI * 2);
      break;
    }
    case "line":
    case "divider": {
      ctx.moveTo(x, y + h / 2);
      ctx.lineTo(x + w, y + h / 2);
      break;
    }
    case "triangle": {
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      break;
    }
    case "star": {
      // Basic 5-point star
      const cx = x + w / 2;
      const cy = y + h / 2;
      const outerR = Math.min(w, h) / 2;
      const innerR = outerR * 0.45;
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }
    default:
      ctx.rect(x, y, w, h);
  }

  if (el.fill && el.fill !== "transparent") {
    ctx.fill();
  }
  if (el.stroke && el.stroke !== "transparent" && el.strokeWidth > 0) {
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Renders typography element onto the 2D context.
 */
function renderText(
  ctx: CanvasRenderingContext2D,
  el: TextDesignElement,
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number
) {
  ctx.save();

  const fontSizePx = el.fontSize * scale;
  const fontStyle = el.fontStyle === "italic" ? "italic" : "normal";
  const fontWeight = el.fontWeight || "normal";
  const fontFamily = el.fontFamily || "Inter, sans-serif";

  ctx.font = `${fontStyle} ${fontWeight} ${fontSizePx}px ${fontFamily}`;
  ctx.fillStyle = el.fill || "#0f172a";
  ctx.textBaseline = "top";

  // Calculate alignment
  let textAlign: CanvasTextAlign = "left";
  let offsetX = 0;
  if (el.align === "center") {
    textAlign = "center";
    offsetX = w / 2;
  } else if (el.align === "right") {
    textAlign = "right";
    offsetX = w;
  }
  ctx.textAlign = textAlign;

  const rawLines = (el.text || "").split("\n");
  const lineHeightPx = fontSizePx * (el.lineHeight || 1.25);

  let startY = y;
  const totalTextHeight = rawLines.length * lineHeightPx;
  if (el.verticalAlign === "middle") {
    startY = y + Math.max(0, (h - totalTextHeight) / 2);
  } else if (el.verticalAlign === "bottom") {
    startY = y + Math.max(0, h - totalTextHeight);
  }

  // Draw lines
  rawLines.forEach((line, idx) => {
    let lineToDraw = line;
    if (el.textTransform === "uppercase") lineToDraw = line.toUpperCase();
    else if (el.textTransform === "lowercase") lineToDraw = line.toLowerCase();

    const lineY = startY + idx * lineHeightPx;
    ctx.fillText(lineToDraw, x + offsetX, lineY);

    // Optional underline decoration
    if (el.textDecoration === "underline") {
      const textMetrics = ctx.measureText(lineToDraw);
      const textWidth = textMetrics.width;
      let lineStartX = x + offsetX;
      if (textAlign === "center") lineStartX -= textWidth / 2;
      else if (textAlign === "right") lineStartX -= textWidth;

      const underlineY = lineY + fontSizePx * 1.05;
      ctx.lineWidth = Math.max(1, fontSizePx * 0.06);
      ctx.strokeStyle = el.fill || "#0f172a";
      ctx.beginPath();
      ctx.moveTo(lineStartX, underlineY);
      ctx.lineTo(lineStartX + textWidth, underlineY);
      ctx.stroke();
    }
  });

  ctx.restore();
}

/**
 * Renders bitmap/asset image element.
 */
async function renderImage(
  ctx: CanvasRenderingContext2D,
  el: ImageDesignElement,
  doc: DesignDocument,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const asset = doc.assets[el.assetId];
  if (!asset?.url) {
    // Render placeholder frame if missing
    ctx.save();
    ctx.fillStyle = "#f1f5f9";
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
    return;
  }

  const img = await loadImageElement(asset.url);
  if (!img) {
    ctx.save();
    ctx.fillStyle = "#f1f5f9";
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
    return;
  }

  ctx.save();
  // Optional clipping for borderRadius
  if (el.borderRadius && el.borderRadius > 0 && typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, el.borderRadius);
    ctx.clip();
  }

  // Draw image with fit logic
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;

  if (el.fit === "cover") {
    const scale = Math.max(w / imgW, h / imgH);
    const renderW = imgW * scale;
    const renderH = imgH * scale;
    const ox = x + (w - renderW) / 2;
    const oy = y + (h - renderH) / 2;
    ctx.drawImage(img, ox, oy, renderW, renderH);
  } else if (el.fit === "contain") {
    const scale = Math.min(w / imgW, h / imgH);
    const renderW = imgW * scale;
    const renderH = imgH * scale;
    const ox = x + (w - renderW) / 2;
    const oy = y + (h - renderH) / 2;
    ctx.drawImage(img, ox, oy, renderW, renderH);
  } else {
    // Fill/stretch
    ctx.drawImage(img, x, y, w, h);
  }

  ctx.restore();
}

/**
 * Converts rendered canvas into a Blob (PNG or JPEG).
 */
export function canvasToBlobAsync(
  canvas: HTMLCanvasElement,
  mimeType: "image/png" | "image/jpeg",
  quality: number = 0.95
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error(`Failed to encode canvas to ${mimeType}`));
      },
      mimeType,
      quality
    );
  });
}
