/**
 * Design Studio — Multi-Copy Print Sheet PDF & Raster Compiler
 *
 * Compiles calculated N-up card layouts into:
 * 1. Multi-sheet print-ready PDF using `pdf-lib` (preserving vector typography, shapes, cut guides).
 * 2. High-resolution raster preview or PNG sheet export.
 */

import { PDFDocument, rgb, degrees } from "pdf-lib";
import type { DesignDocument, DesignPage } from "../../../types/design-studio.ts";
import type {
  PrintSheetConfig,
  PrintSheetLayoutResult,
  PlacedCardPosition,
} from "../../../types/design-print-sheet.ts";
import { mmToPixels, mmToPoints } from "../../../constants/design-dimensions.ts";
import { renderPageToCanvas } from "../export/raster-adapter.ts";
import { hexToPdfRgb, parseColor } from "../export/color-utils.ts";
import { releaseCanvasBuffer } from "../../utils/memory.ts";

/**
 * Draws cut marks / crop guides around a card cell on a 2D canvas context.
 */
export function drawCanvasCutGuides(
  ctx: CanvasRenderingContext2D,
  card: PlacedCardPosition,
  scale: number,
  config: PrintSheetConfig["cutGuides"]
) {
  if (!config.enabled || config.style === "none") return;

  ctx.save();
  ctx.strokeStyle = config.color || "#94a3b8";
  ctx.lineWidth = Math.max(1, (config.widthPt || 0.75) * scale);

  const x = card.xPt * scale;
  const y = card.yPt * scale;
  const w = card.widthPt * scale;
  const h = card.heightPt * scale;
  const markLen = 4 * scale; // 4 pt crop mark

  if (config.style === "corners") {
    // Top-left
    ctx.beginPath();
    ctx.moveTo(x - markLen, y);
    ctx.lineTo(x, y);
    ctx.moveTo(x, y - markLen);
    ctx.lineTo(x, y);

    // Top-right
    ctx.moveTo(x + w, y - markLen);
    ctx.lineTo(x + w, y);
    ctx.moveTo(x + w + markLen, y);
    ctx.lineTo(x + w, y);

    // Bottom-left
    ctx.moveTo(x - markLen, y + h);
    ctx.lineTo(x, y + h);
    ctx.moveTo(x, y + h + markLen);
    ctx.lineTo(x, y + h);

    // Bottom-right
    ctx.moveTo(x + w, y + h + markLen);
    ctx.lineTo(x + w, y + h);
    ctx.moveTo(x + w + markLen, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.stroke();
  } else if (config.style === "border" || config.style === "full-lines") {
    ctx.strokeRect(x, y, w, h);
  }

  // Optional card border
  if (config.includeBorder) {
    ctx.strokeStyle = config.borderColor || "#cbd5e1";
    ctx.lineWidth = 0.5 * scale;
    ctx.strokeRect(x, y, w, h);
  }

  ctx.restore();
}

/**
 * Renders a single print sheet (e.g. Sheet 1 or Sheet 2) to an HTMLCanvasElement.
 */
export async function renderPrintSheetToCanvas(
  document: DesignDocument,
  layout: PrintSheetLayoutResult,
  sheetIndex: number,
  config: PrintSheetConfig
): Promise<HTMLCanvasElement> {
  const sheet = layout.sheets[sheetIndex] || layout.sheets[0];
  const dpi = config.dpi || 300;
  const scale = dpi / 72;

  const widthPx = mmToPixels(layout.paperWidthMm, dpi);
  const heightPx = mmToPixels(layout.paperHeightMm, dpi);

  const canvas = window.document.createElement("canvas");
  canvas.width = widthPx;
  canvas.height = heightPx;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to obtain 2D canvas context for sheet rendering.");
  }

  // 1. Paper Backdrop (Clean White Sheet)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, widthPx, heightPx);

  if (!sheet) return canvas;

  // 2. Pre-render unique design pages at high DPI
  const pageCanvasCache: Record<string, HTMLCanvasElement> = {};
  const uniquePageIds = Array.from(new Set(sheet.cards.map((c) => c.designPageId)));

  for (const pageId of uniquePageIds) {
    const page = document.pages.find((p) => p.id === pageId) || document.pages[0];
    if (page) {
      pageCanvasCache[pageId] = await renderPageToCanvas(document, page, dpi);
    }
  }

  // 3. Stamp cards onto sheet
  for (const card of sheet.cards) {
    const cardCanvas = pageCanvasCache[card.designPageId];
    if (!cardCanvas) continue;

    const x = card.xPt * scale;
    const y = card.yPt * scale;
    const w = card.widthPt * scale;
    const h = card.heightPt * scale;

    ctx.save();
    if (card.isRotated) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(cardCanvas, -h / 2, -w / 2, h, w);
    } else {
      ctx.drawImage(cardCanvas, x, y, w, h);
    }
    ctx.restore();

    // 4. Cut marks
    drawCanvasCutGuides(ctx, card, scale, config.cutGuides);
  }

  // Clean cache buffers
  Object.values(pageCanvasCache).forEach((c) => releaseCanvasBuffer(c));

  return canvas;
}

/**
 * Compiles the entire multi-sheet layout into a printable PDF binary.
 */
export async function compilePrintSheetPdf(
  document: DesignDocument,
  layout: PrintSheetLayoutResult,
  config: PrintSheetConfig,
  onProgress?: (current: number, total: number) => void
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const totalSheets = layout.sheets.length;

  for (let sIdx = 0; sIdx < totalSheets; sIdx++) {
    onProgress?.(sIdx + 1, totalSheets);
    const sheet = layout.sheets[sIdx];

    const pdfPage = pdfDoc.addPage([layout.paperWidthPt, layout.paperHeightPt]);

    // White paper background
    pdfPage.drawRectangle({
      x: 0,
      y: 0,
      width: layout.paperWidthPt,
      height: layout.paperHeightPt,
      color: rgb(1, 1, 1),
    });

    // Render cards via master raster stamping at high DPI (300 DPI) for crisp reproduction
    // Pre-render pages
    const uniquePageIds = Array.from(new Set(sheet.cards.map((c) => c.designPageId)));
    const embeddedImages: Record<string, any> = {};

    for (const pageId of uniquePageIds) {
      const page = document.pages.find((p) => p.id === pageId) || document.pages[0];
      if (page) {
        const c = await renderPageToCanvas(document, page, config.dpi || 300);
        const dataUrl = c.toDataURL("image/png");
        releaseCanvasBuffer(c);

        const match = dataUrl.match(/^data:image\/png;base64,(.+)$/);
        if (match) {
          const binaryString = atob(match[1]);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          embeddedImages[pageId] = await pdfDoc.embedPng(bytes);
        }
      }
    }

    // Place each card on PDF page (inverting Y: PDF origin is bottom-left)
    for (const card of sheet.cards) {
      const embImg = embeddedImages[card.designPageId];
      if (!embImg) continue;

      const pdfX = card.xPt;
      const pdfY = layout.paperHeightPt - card.yPt - card.heightPt;

      if (card.isRotated) {
        // Rotated 90 degrees clockwise
        pdfPage.drawImage(embImg, {
          x: pdfX + card.widthPt,
          y: pdfY,
          width: card.heightPt,
          height: card.widthPt,
          rotate: degrees(90),
        });
      } else {
        pdfPage.drawImage(embImg, {
          x: pdfX,
          y: pdfY,
          width: card.widthPt,
          height: card.heightPt,
        });
      }

      // Draw PDF Cut Guides
      drawPdfCutGuides(pdfPage, card, layout.paperHeightPt, config.cutGuides);
    }
  }

  return await pdfDoc.save();
}

/**
 * Draws vector cut marks / crop guides directly onto a PDF page.
 */
function drawPdfCutGuides(
  page: any,
  card: PlacedCardPosition,
  pageHeightPt: number,
  config: PrintSheetConfig["cutGuides"]
) {
  if (!config.enabled || config.style === "none") return;

  const pdfX = card.xPt;
  const pdfY = pageHeightPt - card.yPt - card.heightPt;
  const w = card.widthPt;
  const h = card.heightPt;
  const markLen = 4; // 4 pt crop mark
  const guideColor = hexToPdfRgb(config.color || "#94a3b8");
  const lineWidth = config.widthPt || 0.75;

  if (config.style === "corners") {
    // Top-left
    page.drawLine({ start: { x: pdfX - markLen, y: pdfY + h }, end: { x: pdfX, y: pdfY + h }, color: guideColor, thickness: lineWidth });
    page.drawLine({ start: { x: pdfX, y: pdfY + h + markLen }, end: { x: pdfX, y: pdfY + h }, color: guideColor, thickness: lineWidth });

    // Top-right
    page.drawLine({ start: { x: pdfX + w, y: pdfY + h + markLen }, end: { x: pdfX + w, y: pdfY + h }, color: guideColor, thickness: lineWidth });
    page.drawLine({ start: { x: pdfX + w + markLen, y: pdfY + h }, end: { x: pdfX + w, y: pdfY + h }, color: guideColor, thickness: lineWidth });

    // Bottom-left
    page.drawLine({ start: { x: pdfX - markLen, y: pdfY }, end: { x: pdfX, y: pdfY }, color: guideColor, thickness: lineWidth });
    page.drawLine({ start: { x: pdfX, y: pdfY - markLen }, end: { x: pdfX, y: pdfY }, color: guideColor, thickness: lineWidth });

    // Bottom-right
    page.drawLine({ start: { x: pdfX + w, y: pdfY - markLen }, end: { x: pdfX + w, y: pdfY }, color: guideColor, thickness: lineWidth });
    page.drawLine({ start: { x: pdfX + w + markLen, y: pdfY }, end: { x: pdfX + w, y: pdfY }, color: guideColor, thickness: lineWidth });
  } else if (config.style === "border" || config.style === "full-lines") {
    page.drawRectangle({
      x: pdfX,
      y: pdfY,
      width: w,
      height: h,
      borderColor: guideColor,
      borderWidth: lineWidth,
    });
  }

  if (config.includeBorder) {
    page.drawRectangle({
      x: pdfX,
      y: pdfY,
      width: w,
      height: h,
      borderColor: hexToPdfRgb(config.borderColor || "#cbd5e1"),
      borderWidth: 0.5,
    });
  }
}
