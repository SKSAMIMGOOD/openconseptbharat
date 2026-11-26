/**
 * Design Studio — Vector-Preserving PDF Rendering Adapter
 *
 * Compiles an engine-independent DesignDocument into a multi-page PDF document
 * using `pdf-lib`. Preserves real physical paper dimensions, vector shapes
 * (rectangles, circles, lines), and native PDF vector typography.
 */

import {
  PDFDocument,
  StandardFonts,
  type PDFPage,
  type PDFFont,
  type RGB,
  type PDFImage,
} from "pdf-lib";
import type {
  DesignDocument,
  DesignPage as StudioDesignPage,
  DesignElement,
  TextDesignElement,
  ImageDesignElement,
  ShapeDesignElement,
} from "../../../types/design-studio.ts";
import { mmToPoints } from "../../../constants/design-dimensions.ts";
import { hexToPdfRgb, parseColor } from "./color-utils.ts";

/**
 * Standard font map for pdf-lib built-in vector typography.
 */
interface FontBundle {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  boldItalic: PDFFont;
  serifRegular: PDFFont;
  serifBold: PDFFont;
  serifItalic: PDFFont;
}

async function loadPdfFonts(pdfDoc: PDFDocument): Promise<FontBundle> {
  const [
    regular,
    bold,
    italic,
    boldItalic,
    serifRegular,
    serifBold,
    serifItalic,
  ] = await Promise.all([
    pdfDoc.embedFont(StandardFonts.Helvetica),
    pdfDoc.embedFont(StandardFonts.HelveticaBold),
    pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
    pdfDoc.embedFont(StandardFonts.TimesRoman),
    pdfDoc.embedFont(StandardFonts.TimesRomanBold),
    pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
  ]);

  return {
    regular,
    bold,
    italic,
    boldItalic,
    serifRegular,
    serifBold,
    serifItalic,
  };
}

/**
 * Selects the appropriate embedded vector font based on element typography.
 */
function resolvePdfFont(
  fonts: FontBundle,
  fontFamily: string,
  fontWeight: string,
  fontStyle: string
): PDFFont {
  const isSerif =
    fontFamily.toLowerCase().includes("serif") ||
    fontFamily.toLowerCase().includes("times") ||
    fontFamily.toLowerCase().includes("playfair") ||
    fontFamily.toLowerCase().includes("merriweather");

  const isBold =
    fontWeight === "bold" ||
    fontWeight === "700" ||
    fontWeight === "800" ||
    fontWeight === "900";
  const isItalic = fontStyle === "italic";

  if (isSerif) {
    if (isBold) return fonts.serifBold;
    if (isItalic) return fonts.serifItalic;
    return fonts.serifRegular;
  }

  if (isBold && isItalic) return fonts.boldItalic;
  if (isBold) return fonts.bold;
  if (isItalic) return fonts.italic;
  return fonts.regular;
}

/**
 * Embeds an asset image into pdf-lib document.
 */
async function embedAssetImage(
  pdfDoc: PDFDocument,
  assetUrl: string
): Promise<PDFImage | null> {
  try {
    let bytes: Uint8Array;
    let mimeType = "";

    if (assetUrl.startsWith("data:")) {
      const match = assetUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) return null;
      mimeType = match[1];
      const binaryString = atob(match[2]);
      bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
    } else {
      const res = await fetch(assetUrl);
      if (!res.ok) return null;
      mimeType = res.headers.get("content-type") || "";
      const buffer = await res.arrayBuffer();
      bytes = new Uint8Array(buffer);
    }

    // Embed PNG or JPG
    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
      return await pdfDoc.embedJpg(bytes);
    } else {
      return await pdfDoc.embedPng(bytes);
    }
  } catch (err) {
    console.warn("Failed to embed image in PDF:", err);
    return null;
  }
}

/**
 * Renders a full multi-page DesignDocument into a PDF Uint8Array.
 */
export async function renderDocumentToPdf(
  doc: DesignDocument,
  options?: {
    pageScope?: "all" | string;
    onProgress?: (current: number, total: number) => void;
  }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fonts = await loadPdfFonts(pdfDoc);

  const isLandscape = doc.orientation === "landscape";
  const physWidthMm = isLandscape
    ? Math.max(doc.dimensions.widthMm, doc.dimensions.heightMm)
    : Math.min(doc.dimensions.widthMm, doc.dimensions.heightMm);
  const physHeightMm = isLandscape
    ? Math.min(doc.dimensions.widthMm, doc.dimensions.heightMm)
    : Math.max(doc.dimensions.widthMm, doc.dimensions.heightMm);

  // Exact PostScript points: (mm / 25.4) * 72
  const pageWidthPt = mmToPoints(physWidthMm);
  const pageHeightPt = mmToPoints(physHeightMm);

  const pagesToExport =
    options?.pageScope && options.pageScope !== "all"
      ? doc.pages.filter((p) => p.id === options.pageScope)
      : doc.pages;

  const total = pagesToExport.length;
  let currentIdx = 0;

  for (const studioPage of pagesToExport) {
    currentIdx++;
    if (options?.onProgress) {
      options.onProgress(currentIdx, total);
    }

    const pdfPage = pdfDoc.addPage([pageWidthPt, pageHeightPt]);

    // 1. Draw Page Background
    const bg = studioPage.background;
    if (bg.type === "solid" && bg.color && bg.color !== "transparent") {
      pdfPage.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidthPt,
        height: pageHeightPt,
        color: hexToPdfRgb(bg.color),
      });
    } else if (bg.type === "image" && bg.assetId && doc.assets[bg.assetId]) {
      const embeddedImg = await embedAssetImage(pdfDoc, doc.assets[bg.assetId].url);
      if (embeddedImg) {
        pdfPage.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width: pageWidthPt,
          height: pageHeightPt,
          opacity: bg.opacity ?? 1,
        });
      }
    }

    // 2. Render Page Elements sorted by zIndex
    const sortedElements = [...studioPage.elements]
      .filter((el) => el.visible)
      .sort((a, b) => a.zIndex - b.zIndex);

    for (const el of sortedElements) {
      const t = el.transform;
      // Flip Y coordinate: PDF origin (0,0) is bottom-left; Canvas origin (0,0) is top-left
      const elWidth = t.width * (t.scaleX ?? 1);
      const elHeight = t.height * (t.scaleY ?? 1);
      const pdfX = t.x;
      const pdfY = pageHeightPt - t.y - elHeight;

      const opacity = Math.min(1, Math.max(0, el.opacity ?? 1));

      if (el.type === "shape") {
        renderPdfShape(pdfPage, el, pdfX, pdfY, elWidth, elHeight, opacity);
      } else if (el.type === "text") {
        renderPdfText(pdfPage, el, fonts, pdfX, pageHeightPt - t.y, elWidth, elHeight, opacity);
      } else if (el.type === "image") {
        await renderPdfImage(pdfDoc, pdfPage, el, doc, pdfX, pdfY, elWidth, elHeight, opacity);
      }
    }
  }

  return await pdfDoc.save();
}

/**
 * Draws vector shape on PDF page.
 */
function renderPdfShape(
  page: PDFPage,
  el: ShapeDesignElement,
  x: number,
  y: number,
  w: number,
  h: number,
  opacity: number
) {
  const hasFill = el.fill && el.fill !== "transparent";
  const hasStroke = el.stroke && el.stroke !== "transparent" && el.strokeWidth > 0;

  if (!hasFill && !hasStroke) return;

  const fillColor = hasFill ? hexToPdfRgb(el.fill) : undefined;
  const strokeColor = hasStroke ? hexToPdfRgb(el.stroke) : undefined;
  const borderWidth = hasStroke ? el.strokeWidth : undefined;

  switch (el.shapeType) {
    case "rect":
    case "triangle":
    case "star": {
      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        color: fillColor,
        borderColor: strokeColor,
        borderWidth,
        opacity,
      });
      break;
    }
    case "circle":
    case "ellipse": {
      const xRadius = w / 2;
      const yRadius = h / 2;
      page.drawEllipse({
        x: x + xRadius,
        y: y + yRadius,
        xScale: xRadius,
        yScale: yRadius,
        color: fillColor,
        borderColor: strokeColor,
        borderWidth,
        opacity,
      });
      break;
    }
    case "line":
    case "divider": {
      page.drawLine({
        start: { x, y: y + h / 2 },
        end: { x: x + w, y: y + h / 2 },
        color: strokeColor || fillColor,
        thickness: borderWidth || 1,
        opacity,
      });
      break;
    }
    default:
      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        color: fillColor,
        borderColor: strokeColor,
        borderWidth,
        opacity,
      });
  }
}

/**
 * Draws vector typography on PDF page.
 */
function renderPdfText(
  page: PDFPage,
  el: TextDesignElement,
  fonts: FontBundle,
  x: number,
  topY: number, // PDF coordinate of top edge
  w: number,
  h: number,
  opacity: number
) {
  const font = resolvePdfFont(fonts, el.fontFamily, el.fontWeight, el.fontStyle);
  const fontSize = el.fontSize;
  const textColor = hexToPdfRgb(el.fill || "#0f172a");
  const lineHeight = fontSize * (el.lineHeight || 1.25);

  const rawLines = (el.text || "").split("\n");
  const totalTextHeight = rawLines.length * lineHeight;

  let startY = topY - fontSize; // baseline offset
  if (el.verticalAlign === "middle") {
    startY = topY - Math.max(0, (h - totalTextHeight) / 2) - fontSize;
  } else if (el.verticalAlign === "bottom") {
    startY = topY - Math.max(0, h - totalTextHeight) - fontSize;
  }

  rawLines.forEach((line, idx) => {
    let lineToDraw = line;
    if (el.textTransform === "uppercase") lineToDraw = line.toUpperCase();
    else if (el.textTransform === "lowercase") lineToDraw = line.toLowerCase();

    // Calculate line width for alignment
    const textWidth = font.widthOfTextAtSize(lineToDraw, fontSize);
    let lineX = x;
    if (el.align === "center") {
      lineX = x + (w - textWidth) / 2;
    } else if (el.align === "right") {
      lineX = x + (w - textWidth);
    }

    const currentY = startY - idx * lineHeight;

    try {
      page.drawText(lineToDraw, {
        x: lineX,
        y: currentY,
        size: fontSize,
        font,
        color: textColor,
        opacity,
      });

      // Underline support
      if (el.textDecoration === "underline") {
        page.drawLine({
          start: { x: lineX, y: currentY - 2 },
          end: { x: lineX + textWidth, y: currentY - 2 },
          color: textColor,
          thickness: Math.max(0.75, fontSize * 0.05),
          opacity,
        });
      }
    } catch {
      // Fallback if glyph encoding issue occurs in standard font
      page.drawText(lineToDraw.replace(/[^\x00-\x7F]/g, "?"), {
        x: lineX,
        y: currentY,
        size: fontSize,
        font: fonts.regular,
        color: textColor,
        opacity,
      });
    }
  });
}

/**
 * Draws raster image asset on PDF page.
 */
async function renderPdfImage(
  pdfDoc: PDFDocument,
  page: PDFPage,
  el: ImageDesignElement,
  doc: DesignDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  opacity: number
) {
  const asset = doc.assets[el.assetId];
  if (!asset?.url) return;

  const embeddedImg = await embedAssetImage(pdfDoc, asset.url);
  if (!embeddedImg) return;

  const imgW = embeddedImg.width;
  const imgH = embeddedImg.height;

  let renderX = x;
  let renderY = y;
  let renderW = w;
  let renderH = h;

  if (el.fit === "contain") {
    const scale = Math.min(w / imgW, h / imgH);
    renderW = imgW * scale;
    renderH = imgH * scale;
    renderX = x + (w - renderW) / 2;
    renderY = y + (h - renderH) / 2;
  } else if (el.fit === "cover") {
    const scale = Math.max(w / imgW, h / imgH);
    renderW = imgW * scale;
    renderH = imgH * scale;
    renderX = x + (w - renderW) / 2;
    renderY = y + (h - renderH) / 2;
  }

  page.drawImage(embeddedImg, {
    x: renderX,
    y: renderY,
    width: renderW,
    height: renderH,
    opacity,
  });
}
