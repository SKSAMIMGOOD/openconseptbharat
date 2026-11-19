/**
 * Document Studio — Phase 5: Actual Printing and Print-Ready PDF Generation
 *
 * Implements:
 * 1. Print readiness validation (verifies document sides, dimensions, DPI, arrangement)
 * 2. Source resolution adequacy checker (compares source pixels vs required print DPI)
 * 3. Physical dimension to PDF point converter (72 points / inch)
 * 4. High-resolution master canvas rasterizer for physical paper sheet
 * 5. Print-Ready PDF generator using pdf-lib (vector page size, embedded high-DPI image, multi-copy support)
 * 6. Browser native print executor with dynamic @page CSS injection and chrome hiding
 * 7. Clean semantic filename generator
 */

import { PDFDocument, rgb } from "pdf-lib";
import type {
  DocumentSideResult,
  DocumentPrintSettings,
  PrintStudioMode,
  PrintStudioArrangement,
  PrintPaperSize,
  PrintOrientation,
  DocumentPrintLayoutSettings,
  DocumentSourceFile,
} from "../../types/document-studio.ts";
import { isEnhancementActive } from "../../types/document-studio.ts";
import type {
  PrintPaperLayoutResult,
  PrintPlacedItem,
} from "./document-print-studio.ts";
import { resolveActiveSideImage } from "./document-print-studio.ts";
import {
  mapCanvasCropToPdfBoundingBox,
  getRotatedPlacement,
  calculateProportionalCardFit,
  type ProportionalFitResult,
} from "./pdf-coordinate-converter.ts";
import { generateExperimentalPngIntermediatePdf } from "./experimental-png-pipeline.ts";
import {
  createTrackedObjectURL,
  revokeObjectUrlSafely,
  releaseCanvasBuffer,
} from "../utils/memory.ts";

/**
 * Downloads a generated PDF or image Blob to the client disk with tracked Object URL cleanup.
 */
export function downloadPdfBlob(blob: Blob, fileName: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const objectUrl = createTrackedObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    try {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    } catch {}
    revokeObjectUrlSafely(objectUrl);
  }, 1500);
}

export interface PrintValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ResolutionAdequacyResult {
  isAdequate: boolean;
  effectiveDpi: number;
  targetDpi: number;
  recommendedPx: { width: number; height: number };
  actualPx: { width: number; height: number };
  warning?: string;
}

export interface PrintPdfExportResult {
  blob: Blob;
  fileName: string;
  sizeBytes: number;
  pageWidthPt: number;
  pageHeightPt: number;
  pageCount: number;
  format: "application/pdf";
}

/**
 * Validates whether the document studio state is ready for printing or PDF export.
 */
export function validatePrintReadiness(options: {
  mode: PrintStudioMode;
  arrangement: PrintStudioArrangement;
  front: DocumentSideResult;
  back: DocumentSideResult;
  isSingleSided?: boolean;
  layout?: DocumentPrintLayoutSettings;
  dpi?: number;
}): PrintValidationResult {
  const { mode, front, back, isSingleSided = false, layout, dpi } = options;
  const errors: string[] = [];
  const warnings: string[] = [];

  const frontImg = resolveActiveSideImage(front);
  const backImg = resolveActiveSideImage(back);

  const hasFront = Boolean(frontImg.imageUrl);
  const hasBack = Boolean(backImg.imageUrl);

  // 1. Verify required sides per mode
  if (mode === "front-only") {
    if (!hasFront) {
      errors.push(
        "Cannot print: Front side document is missing. Please upload and crop the front side."
      );
    }
  } else if (mode === "back-only") {
    if (isSingleSided) {
      errors.push(
        "Cannot print: This document type is single-sided and does not have a back side."
      );
    } else if (!hasBack) {
      errors.push(
        "Cannot print: Back side document is missing. Please upload and crop the back side."
      );
    }
  } else if (mode === "combined") {
    if (!hasFront && !hasBack) {
      errors.push(
        "Cannot print: Both document sides are missing. Please upload and crop your document."
      );
    } else if (!hasFront) {
      errors.push(
        "Cannot print in Combined mode: Front side document is missing. Upload and crop the front side, or switch to Back Side Only mode."
      );
    } else if (!hasBack && !isSingleSided) {
      errors.push(
        "Cannot print in Combined mode: Back side document is missing. Upload and crop the back side, or switch to Front Side Only mode."
      );
    }
  }

  // 2. Validate dimensions
  if (layout) {
    if (layout.paperSize === "custom") {
      if (!layout.customPaper.width || layout.customPaper.width <= 0) {
        errors.push("Invalid paper dimensions: Custom paper width must be greater than 0.");
      }
      if (!layout.customPaper.height || layout.customPaper.height <= 0) {
        errors.push("Invalid paper dimensions: Custom paper height must be greater than 0.");
      }
    }

    if (
      layout.margins.topMm < 0 ||
      layout.margins.bottomMm < 0 ||
      layout.margins.leftMm < 0 ||
      layout.margins.rightMm < 0
    ) {
      errors.push("Invalid margins: Margins cannot be negative.");
    }
  }

  // 3. Validate DPI
  const effectiveDpi = dpi ?? front.printSettings.dpi ?? 300;
  if (isNaN(effectiveDpi) || effectiveDpi <= 0) {
    errors.push("Invalid DPI: Print DPI must be a positive number.");
  } else if (effectiveDpi < 72) {
    warnings.push("Low DPI setting: Selected DPI is below 72, which may produce blurry print output.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Checks whether the cropped source image has sufficient pixel resolution
 * for the selected physical print dimensions and DPI.
 */
export function checkSourceResolutionAdequacy(
  item: PrintPlacedItem,
  sideResult?: DocumentSideResult | null,
  targetDpi: number = 300
): ResolutionAdequacyResult {
  const targetPxW = Math.round((item.widthMm / 25.4) * targetDpi);
  const targetPxH = Math.round((item.heightMm / 25.4) * targetDpi);

  const actualPxW = sideResult?.croppedDimensions?.width || 0;
  const actualPxH = sideResult?.croppedDimensions?.height || 0;

  const widthInches = item.widthMm / 25.4;
  const effectiveDpi =
    widthInches > 0 && actualPxW > 0
      ? Math.round(actualPxW / widthInches)
      : targetDpi;

  // Inadequate if effective DPI is below 75% of target DPI or actual pixels are significantly lower
  const isAdequate =
    actualPxW >= targetPxW * 0.75 && actualPxH >= targetPxH * 0.75;

  let warning: string | undefined = undefined;
  if (!isAdequate && actualPxW > 0 && actualPxH > 0) {
    warning = `Source image resolution (${actualPxW} × ${actualPxH} px, approx. ${effectiveDpi} DPI) is lower than recommended for ${targetDpi} DPI print output (target ${targetPxW} × ${targetPxH} px). Print output may appear soft.`;
  }

  return {
    isAdequate,
    effectiveDpi,
    targetDpi,
    recommendedPx: { width: targetPxW, height: targetPxH },
    actualPx: { width: actualPxW, height: actualPxH },
    warning,
  };
}

/**
 * Converts physical paper dimensions in millimeters to exact PDF points.
 * Standard: 1 inch = 25.4 mm = 72 points (1 mm = 72 / 25.4 points ≈ 2.83464567 pt).
 */
export function getPaperDimensionsInPoints(
  paperWidthMm: number,
  paperHeightMm: number
): { pageWidthPt: number; pageHeightPt: number } {
  const pageWidthPt = Number(((paperWidthMm / 25.4) * 72).toFixed(4));
  const pageHeightPt = Number(((paperHeightMm / 25.4) * 72).toFixed(4));
  return { pageWidthPt, pageHeightPt };
}

/**
 * Generates a clean, semantic filename for downloaded PDFs or images.
 */
export function generatePrintFileName(
  docType: string = "document",
  paperSize: string = "a4",
  orientation: string = "portrait",
  dpi: number = 300,
  ext: "pdf" | "jpg" | "png" = "pdf"
): string {
  const cleanDoc = docType.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  const cleanPaper = paperSize.toLowerCase();
  const cleanOrient = orientation.toLowerCase();
  return `document-studio-${cleanDoc}-${cleanPaper}-${cleanOrient}-${dpi}dpi.${ext}`;
}

/**
 * Resolves the CSS page size string for the @page rule in @media print.
 */
export function getPageSizeCss(
  paperSize: PrintPaperSize,
  orientation: PrintOrientation,
  paperWidthMm: number,
  paperHeightMm: number
): string {
  if (paperSize === "a4") {
    return orientation === "landscape" ? "A4 landscape" : "A4 portrait";
  }
  if (paperSize === "a5") {
    return orientation === "landscape" ? "A5 landscape" : "A5 portrait";
  }
  if (paperSize === "letter") {
    return orientation === "landscape" ? "letter landscape" : "letter portrait";
  }
  if (paperSize === "4x6") {
    return orientation === "landscape" ? "6in 4in" : "4in 6in";
  }
  return `${paperWidthMm}mm ${paperHeightMm}mm`;
}

/**
 * Helper to safely load an image URL into an HTMLImageElement in the browser.
 */
export function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || typeof Image === "undefined") {
      reject(new Error("loadImageElement requires a browser environment."));
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image from URL: ${url}`));
    img.src = url;
  });
}

/**
 * Converts a hex color string (#000000, #374151) to 0-1 RGB components for pdf-lib.
 */
function hexToRgb01(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  const intVal = parseInt(clean, 16);
  if (isNaN(intVal)) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: ((intVal >> 16) & 255) / 255,
    g: ((intVal >> 8) & 255) / 255,
    b: (intVal & 255) / 255,
  };
}

/**
 * Renders the full-resolution master canvas for the physical paper sheet.
 * Strictly maintains document aspect ratios to prevent distortion or stretching.
 */
export async function renderMasterDocumentCanvas(options: {
  paperLayout: PrintPaperLayoutResult;
  dpi?: number;
}): Promise<HTMLCanvasElement> {
  if (typeof document === "undefined") {
    throw new Error("renderMasterDocumentCanvas requires a browser environment.");
  }

  const { paperLayout, dpi = 300 } = options;

  const sheetWidthPx = Math.round((paperLayout.paperWidthMm / 25.4) * dpi);
  const sheetHeightPx = Math.round((paperLayout.paperHeightMm / 25.4) * dpi);

  const canvas = document.createElement("canvas");
  canvas.width = sheetWidthPx;
  canvas.height = sheetHeightPx;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not acquire 2D canvas context for master print rendering.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // 1. Fill solid white background (no transparency on physical print sheet)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, sheetWidthPx, sheetHeightPx);

  // 2. Render each document side at its exact physical position with rotation and border
  for (const item of paperLayout.items) {
    if (!item.imageUrl) continue;

    try {
      const img = await loadImageElement(item.imageUrl);
      const destX = Math.round((item.xMm / 25.4) * dpi);
      const destY = Math.round((item.yMm / 25.4) * dpi);
      const destW = Math.round((item.widthMm / 25.4) * dpi);
      const destH = Math.round((item.heightMm / 25.4) * dpi);

      ctx.save();

      // Apply 180° rotation for 4x6 foldable back document if specified
      if (item.rotation) {
        const centerX = destX + destW / 2;
        const centerY = destY + destH / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((item.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }

      ctx.drawImage(img, destX, destY, destW, destH);

      // Render document border inside the visible document boundaries if enabled
      if (paperLayout.border?.enabled) {
        const bwPx = (paperLayout.border.thicknessMm / 25.4) * dpi;
        ctx.save();
        ctx.strokeStyle = paperLayout.border.color;
        ctx.lineWidth = bwPx;
        if (paperLayout.border.style === "dashed") {
          ctx.setLineDash([(2.5 / 25.4) * dpi, (1.5 / 25.4) * dpi]);
        } else if (paperLayout.border.style === "dotted") {
          ctx.setLineDash([(0.6 / 25.4) * dpi, (1.2 / 25.4) * dpi]);
        } else {
          ctx.setLineDash([]);
        }
        // Inner stroke strictly inside the document boundaries
        ctx.strokeRect(destX + bwPx / 2, destY + bwPx / 2, destW - bwPx, destH - bwPx);
        ctx.restore();
      }

      ctx.restore();
    } catch (err) {
      console.error(`Failed to draw item ${item.side}:`, err);
    }
  }

  return canvas;
}

/**
 * Non-destructive vector PDF embedding:
 * Preserves the original uploaded PDF as the source of truth, embedding page content
 * directly into the target PDF as Form XObjects clipped to the crop bounding box.
 * Preserves original text operators, embedded fonts, vector graphics, and image objects with zero rasterization.
 */
async function tryGenerateVectorPdf(options: {
  paperLayout: PrintPaperLayoutResult;
  front: DocumentSideResult;
  back: DocumentSideResult;
  source: DocumentSourceFile;
  pageWidthPt: number;
  pageHeightPt: number;
  docName: string;
}): Promise<Uint8Array | null> {
  if (options.source.fileType !== "pdf" || !options.source.file) {
    return null;
  }

  try {
    const fileBytes = new Uint8Array(await options.source.file.arrayBuffer());
    const srcDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const pageIndex = Math.max(0, (options.source.currentPage || 1) - 1);
    if (pageIndex >= srcDoc.getPageCount()) {
      return null;
    }
    const srcPage = srcDoc.getPage(pageIndex);
    const canvasDims = options.source.dimensions || { width: 4961, height: 7016 };

    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(`${options.docName} — Vector Print Studio (Browser Utility Studio)`);
    pdfDoc.setAuthor("Browser Utility Studio (Privacy-First Client Engine)");
    pdfDoc.setCreator("Browser Utility Studio Document Studio");
    pdfDoc.setProducer("pdf-lib Non-Destructive Vector Embedding Engine");

    const copies = Math.max(1, Math.min(20, options.paperLayout.copies || 1));

    // Cache embedded pages so we don't re-embed for each copy
    const embeddedPagesMap = new Map<
      string,
      { embeddedPage: any; fit: ProportionalFitResult; totalClockwise: number }
    >();

    for (const item of options.paperLayout.items) {
      if (!item.isAvailable) continue;
      const sideResult = item.side === "front" ? options.front : options.back;
      if (!sideResult.crop) continue;

      const cacheKey = `${item.side}-${sideResult.rotation}-${item.rotation || 0}-${item.xMm}-${item.yMm}-${item.widthMm}-${item.heightMm}`;
      if (!embeddedPagesMap.has(cacheKey)) {
        const boundingBox = mapCanvasCropToPdfBoundingBox(
          sideResult.crop,
          canvasDims,
          srcPage
        );

        const embeddedPage = await pdfDoc.embedPage(srcPage, boundingBox);

        const targetW = (item.widthMm / 25.4) * 72;
        const targetH = (item.heightMm / 25.4) * 72;
        const targetX = (item.xMm / 25.4) * 72;
        const targetY =
          ((options.paperLayout.paperHeightMm - item.yMm - item.heightMm) / 25.4) * 72;

        const fit = calculateProportionalCardFit(
          embeddedPage.width,
          embeddedPage.height,
          targetW,
          targetH,
          targetX,
          targetY
        );

        const totalClockwise =
          ((sideResult.rotation || 0) + (item.rotation || 0)) % 360;

        embeddedPagesMap.set(cacheKey, { embeddedPage, fit, totalClockwise });
      }
    }

    if (embeddedPagesMap.size === 0) {
      return null;
    }

    for (let c = 0; c < copies; c++) {
      const page = pdfDoc.addPage([options.pageWidthPt, options.pageHeightPt]);

      for (const item of options.paperLayout.items) {
        if (!item.isAvailable) continue;
        const sideResult = item.side === "front" ? options.front : options.back;
        if (!sideResult.crop) continue;

        const cacheKey = `${item.side}-${sideResult.rotation}-${item.rotation || 0}-${item.xMm}-${item.yMm}-${item.widthMm}-${item.heightMm}`;
        const entry = embeddedPagesMap.get(cacheKey);
        if (!entry) continue;

        const placement = getRotatedPlacement(
          entry.fit.x,
          entry.fit.y,
          entry.fit.width,
          entry.fit.height,
          entry.totalClockwise
        );

        page.drawPage(entry.embeddedPage, placement);

        // Render vector border overlay directly into PDF page
        if (options.paperLayout.border?.enabled) {
          const bwPt = (options.paperLayout.border.thicknessMm / 25.4) * 72;
          const { r, g, b } = hexToRgb01(options.paperLayout.border.color);
          let borderDashArray: number[] | undefined = undefined;
          if (options.paperLayout.border.style === "dashed") {
            borderDashArray = [(2.5 / 25.4) * 72, (1.5 / 25.4) * 72];
          } else if (options.paperLayout.border.style === "dotted") {
            borderDashArray = [(0.6 / 25.4) * 72, (1.2 / 25.4) * 72];
          }

          const xPt = (item.xMm / 25.4) * 72;
          const yPt =
            ((options.paperLayout.paperHeightMm - item.yMm - item.heightMm) / 25.4) * 72;
          const wPt = (item.widthMm / 25.4) * 72;
          const hPt = (item.heightMm / 25.4) * 72;

          page.drawRectangle({
            x: xPt + bwPt / 2,
            y: yPt + bwPt / 2,
            width: Math.max(0, wPt - bwPt),
            height: Math.max(0, hPt - bwPt),
            borderWidth: bwPt,
            borderColor: rgb(r, g, b),
            color: undefined,
            borderDashArray,
          });
        }
      }
    }

    return await pdfDoc.save();
  } catch (err) {
    console.warn("Vector PDF embedding notice, falling back to direct image embedding:", err);
    return null;
  }
}

/**
 * Direct High-Resolution Card Embedding:
 * Embeds cropped document card images directly into the PDF at exact physical dimensions
 * with native vector white background and vector borders, avoiding unnecessary full-sheet canvas rasterization.
 */
async function tryGenerateDirectImagePdf(options: {
  paperLayout: PrintPaperLayoutResult;
  front: DocumentSideResult;
  back: DocumentSideResult;
  pageWidthPt: number;
  pageHeightPt: number;
  docName: string;
}): Promise<Uint8Array | null> {
  try {
    const sideBlobs = new Map<"front" | "back", Uint8Array>();

    for (const item of options.paperLayout.items) {
      if (!item.isAvailable) continue;
      const side = item.side;
      if (sideBlobs.has(side)) continue;

      const sideResult = side === "front" ? options.front : options.back;
      const blob = sideResult.enhancedBlob || sideResult.croppedBlob;
      if (!blob) {
        return null;
      }
      const buffer = await blob.arrayBuffer();
      sideBlobs.set(side, new Uint8Array(buffer));
    }

    if (sideBlobs.size === 0) {
      return null;
    }

    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(`${options.docName} — Print Studio (Browser Utility Studio)`);
    pdfDoc.setAuthor("Browser Utility Studio (Privacy-First Client Engine)");
    pdfDoc.setCreator("Browser Utility Studio Document Studio");
    pdfDoc.setProducer("pdf-lib High-Resolution Direct Card Embedding Engine");

    const embeddedImages = new Map<"front" | "back", any>();
    for (const [side, bytes] of Array.from(sideBlobs.entries())) {
      const isPng =
        bytes.length >= 8 &&
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47;
      const embedded = isPng
        ? await pdfDoc.embedPng(bytes)
        : await pdfDoc.embedJpg(bytes);
      embeddedImages.set(side, embedded);
    }

    const copies = Math.max(1, Math.min(20, options.paperLayout.copies || 1));

    for (let c = 0; c < copies; c++) {
      const page = pdfDoc.addPage([options.pageWidthPt, options.pageHeightPt]);

      for (const item of options.paperLayout.items) {
        if (!item.isAvailable) continue;
        const embedded = embeddedImages.get(item.side);
        if (!embedded) continue;

        const targetW = (item.widthMm / 25.4) * 72;
        const targetH = (item.heightMm / 25.4) * 72;
        const targetX = (item.xMm / 25.4) * 72;
        const targetY =
          ((options.paperLayout.paperHeightMm - item.yMm - item.heightMm) / 25.4) * 72;

        const fit = calculateProportionalCardFit(
          embedded.width,
          embedded.height,
          targetW,
          targetH,
          targetX,
          targetY
        );

        const sideResult = item.side === "front" ? options.front : options.back;
        const totalClockwise =
          ((sideResult.rotation || 0) + (item.rotation || 0)) % 360;

        const placement = getRotatedPlacement(
          fit.x,
          fit.y,
          fit.width,
          fit.height,
          totalClockwise
        );

        page.drawImage(embedded, placement);

        // Vector border overlay
        if (options.paperLayout.border?.enabled) {
          const bwPt = (options.paperLayout.border.thicknessMm / 25.4) * 72;
          const { r, g, b } = hexToRgb01(options.paperLayout.border.color);
          let borderDashArray: number[] | undefined = undefined;
          if (options.paperLayout.border.style === "dashed") {
            borderDashArray = [(2.5 / 25.4) * 72, (1.5 / 25.4) * 72];
          } else if (options.paperLayout.border.style === "dotted") {
            borderDashArray = [(0.6 / 25.4) * 72, (1.2 / 25.4) * 72];
          }

          const xPt = (item.xMm / 25.4) * 72;
          const yPt =
            ((options.paperLayout.paperHeightMm - item.yMm - item.heightMm) / 25.4) * 72;
          const wPt = (item.widthMm / 25.4) * 72;
          const hPt = (item.heightMm / 25.4) * 72;

          page.drawRectangle({
            x: xPt + bwPt / 2,
            y: yPt + bwPt / 2,
            width: Math.max(0, wPt - bwPt),
            height: Math.max(0, hPt - bwPt),
            borderWidth: bwPt,
            borderColor: rgb(r, g, b),
            color: undefined,
            borderDashArray,
          });
        }
      }
    }

    return await pdfDoc.save();
  } catch (err) {
    console.warn("Direct image embedding notice, falling back to master canvas:", err);
    return null;
  }
}

/**
 * Generates a print-ready vector-calibrated PDF document using pdf-lib.
 * Embeds high-resolution raster image and sets exact physical page dimensions.
 */
export async function generatePrintReadyPdf(options: {
  paperLayout: PrintPaperLayoutResult;
  front: DocumentSideResult;
  back: DocumentSideResult;
  isSingleSided?: boolean;
  docDef?: { id: string; name: string };
  dpi?: number;
  imageBytes?: Uint8Array;
  masterCanvas?: HTMLCanvasElement | OffscreenCanvas;
  fileName?: string;
  source?: DocumentSourceFile | null;
  pipelineMode?: "standard" | "experimental-png-300" | "experimental-png-600";
}): Promise<PrintPdfExportResult> {
  const {
    paperLayout,
    front,
    back,
    isSingleSided = false,
    docDef,
    dpi = front.printSettings?.dpi || 300,
    fileName: customFileName,
    source,
    pipelineMode = "standard",
  } = options;

  // 0. Experimental Lossless PNG Intermediate Pipeline:
  // Original PDF/Image -> High-Res Rendering -> Existing Crop Coordinates -> Lossless In-Memory PNG -> Direct PDF Embed
  if (pipelineMode === "experimental-png-300" || pipelineMode === "experimental-png-600") {
    const targetDpi = pipelineMode === "experimental-png-600" ? 600 : 300;
    return await generateExperimentalPngIntermediatePdf({
      paperLayout,
      front,
      back,
      source,
      targetDpi,
      docDef,
      isSingleSided,
      fileName: customFileName,
    });
  }

  // 1. Validate readiness
  const validation = validatePrintReadiness({
    mode: paperLayout.items.length === 1 && paperLayout.items[0].side === "back" ? "back-only" : paperLayout.items.length === 1 ? "front-only" : "combined",
    arrangement: "vertical",
    front,
    back,
    isSingleSided,
    dpi,
  });

  if (!validation.isValid) {
    throw new Error(validation.errors[0]);
  }

  // 2. Calculate PDF page points
  const { pageWidthPt, pageHeightPt } = getPaperDimensionsInPoints(
    paperLayout.paperWidthMm,
    paperLayout.paperHeightMm
  );

  const docName = docDef?.name || "Document";

  // 3. High-fidelity non-destructive export pipeline:
  // If neither explicit imageBytes nor masterCanvas was provided, attempt vector or direct embedding first.
  if (!options.imageBytes && !options.masterCanvas) {
    // 3A. Non-destructive Vector PDF Embedding (for PDF uploads without destructive raster filters)
    if (source && source.fileType === "pdf" && source.file) {
      const vectorPdfBytes = await tryGenerateVectorPdf({
        paperLayout,
        front,
        back,
        source,
        pageWidthPt,
        pageHeightPt,
        docName,
      });

      if (vectorPdfBytes) {
        const fileName =
          customFileName ||
          generatePrintFileName(
            docDef?.id || "document",
            paperLayout.paperSize,
            paperLayout.orientation,
            dpi,
            "pdf"
          );

        return {
          blob: new Blob([vectorPdfBytes as any], { type: "application/pdf" }),
          fileName,
          sizeBytes: vectorPdfBytes.length,
          pageWidthPt,
          pageHeightPt,
          pageCount: Math.max(1, Math.min(20, paperLayout.copies || 1)),
          format: "application/pdf",
        };
      }
    }

    // 3B. Direct High-Resolution Card Embedding (for image uploads or raster fallback)
    const directImagePdfBytes = await tryGenerateDirectImagePdf({
      paperLayout,
      front,
      back,
      pageWidthPt,
      pageHeightPt,
      docName,
    });

    if (directImagePdfBytes) {
      const fileName =
        customFileName ||
        generatePrintFileName(
          docDef?.id || "document",
          paperLayout.paperSize,
          paperLayout.orientation,
          dpi,
          "pdf"
        );

      return {
        blob: new Blob([directImagePdfBytes as any], { type: "application/pdf" }),
        fileName,
        sizeBytes: directImagePdfBytes.length,
        pageWidthPt,
        pageHeightPt,
        pageCount: Math.max(1, Math.min(20, paperLayout.copies || 1)),
        format: "application/pdf",
      };
    }
  }

  // 3C. Fallback: Full-sheet master canvas rasterization (for backward compatibility and test harnesses)
  let imageBytes = options.imageBytes;
  let createdCanvas: HTMLCanvasElement | null = null;

  try {
    // Acquire image bytes (from passed buffer, passed canvas, or render fresh canvas)
    if (!imageBytes) {
      const canvas = options.masterCanvas || (await renderMasterDocumentCanvas({ paperLayout, dpi }));
      if (!options.masterCanvas && canvas instanceof HTMLCanvasElement) {
        createdCanvas = canvas;
      }

      // Convert canvas to lossless PNG blob to preserve crisp text, numbers, and QR codes
      const pngBlob: Blob = await new Promise((resolve, reject) => {
        if ("toBlob" in canvas && typeof (canvas as HTMLCanvasElement).toBlob === "function") {
          (canvas as HTMLCanvasElement).toBlob(
            (b) => {
              if (b) resolve(b);
              else reject(new Error("Failed to encode master canvas to PNG blob."));
            },
            "image/png",
            1.0
          );
        } else if ("convertToBlob" in canvas && typeof (canvas as OffscreenCanvas).convertToBlob === "function") {
          (canvas as OffscreenCanvas)
            .convertToBlob({ type: "image/png" })
            .then(resolve)
            .catch(reject);
        } else {
          reject(new Error("Unsupported canvas type for PDF generation."));
        }
      });

      imageBytes = new Uint8Array(await pngBlob.arrayBuffer());
    }

    // 4. Create calibrated PDF Document
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(`${docName} — Print Studio (Browser Utility Studio)`);
    pdfDoc.setAuthor("Browser Utility Studio (Privacy-First Client Engine)");
    pdfDoc.setCreator("Browser Utility Studio Document Studio");
    pdfDoc.setProducer("pdf-lib (In-Browser Execution)");
    pdfDoc.setProducer("pdf-lib (In-Browser Execution)");

    // 5. Embed image preserving format (PNG for lossless raster, JPG fallback)
    const isPng =
      imageBytes.length >= 8 &&
      imageBytes[0] === 0x89 &&
      imageBytes[1] === 0x50 &&
      imageBytes[2] === 0x4e &&
      imageBytes[3] === 0x47;
    const embeddedImage = isPng
      ? await pdfDoc.embedPng(imageBytes)
      : await pdfDoc.embedJpg(imageBytes);

    // 6. Add pages for copies (respects copies setting in PDF output)
    const copies = Math.max(1, Math.min(20, paperLayout.copies || 1));
    for (let c = 0; c < copies; c++) {
      const page = pdfDoc.addPage([pageWidthPt, pageHeightPt]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: pageWidthPt,
        height: pageHeightPt,
      });

      // Render crisp vector border overlay directly into PDF page
      if (paperLayout.border?.enabled) {
        const bwPt = (paperLayout.border.thicknessMm / 25.4) * 72;
        const { r, g, b } = hexToRgb01(paperLayout.border.color);
        let borderDashArray: number[] | undefined = undefined;
        if (paperLayout.border.style === "dashed") {
          borderDashArray = [(2.5 / 25.4) * 72, (1.5 / 25.4) * 72];
        } else if (paperLayout.border.style === "dotted") {
          borderDashArray = [(0.6 / 25.4) * 72, (1.2 / 25.4) * 72];
        }

        for (const item of paperLayout.items) {
          if (!item.isAvailable && !item.imageUrl) continue;
          const xPt = (item.xMm / 25.4) * 72;
          const yPt = ((paperLayout.paperHeightMm - item.yMm - item.heightMm) / 25.4) * 72;
          const wPt = (item.widthMm / 25.4) * 72;
          const hPt = (item.heightMm / 25.4) * 72;

          page.drawRectangle({
            x: xPt + bwPt / 2,
            y: yPt + bwPt / 2,
            width: Math.max(0, wPt - bwPt),
            height: Math.max(0, hPt - bwPt),
            borderWidth: bwPt,
            borderColor: rgb(r, g, b),
            color: undefined,
            borderDashArray,
          });
        }
      }
    }

    // 7. Save document to bytes
    const pdfBytes = await pdfDoc.save();
    const pdfBlob = new Blob([pdfBytes as any], { type: "application/pdf" });

    const fileName =
      customFileName ||
      generatePrintFileName(
        docDef?.id || "document",
        paperLayout.paperSize,
        paperLayout.orientation,
        dpi,
        "pdf"
      );

    return {
      blob: pdfBlob,
      fileName,
      sizeBytes: pdfBlob.size,
      pageWidthPt,
      pageHeightPt,
      pageCount: copies,
      format: "application/pdf",
    };
  } finally {
    if (createdCanvas) {
      releaseCanvasBuffer(createdCanvas);
    }
  }
}

/**
 * Executes browser native printing by:
 * 1. Validating readiness
 * 2. Rendering the full-resolution master canvas
 * 3. Generating a high-quality data URL
 * 4. Injecting the @media print @page CSS rule for exact physical sizing
 * 5. Triggering window.print()
 */
export async function executeBrowserPrint(options: {
  paperLayout: PrintPaperLayoutResult;
  front: DocumentSideResult;
  back: DocumentSideResult;
  isSingleSided?: boolean;
  dpi?: number;
  onBeforePrint?: () => void;
}): Promise<{ success: boolean; dataUrl?: string; dataUrls?: string[]; error?: string }> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { success: false, error: "Browser printing requires a window environment." };
  }

  const {
    paperLayout,
    front,
    back,
    isSingleSided = false,
    dpi = front.printSettings?.dpi || 300,
    onBeforePrint,
  } = options;

  // 1. Validate
  const validation = validatePrintReadiness({
    mode: paperLayout.items.length === 1 && paperLayout.items[0].side === "back" ? "back-only" : paperLayout.items.length === 1 ? "front-only" : "combined",
    arrangement: "vertical",
    front,
    back,
    isSingleSided,
    dpi,
  });

  if (!validation.isValid) {
    return { success: false, error: validation.errors[0] };
  }

  let masterCanvas: HTMLCanvasElement | null = null;

  try {
    // 2. Render master canvas with lossless PNG data URL
    masterCanvas = await renderMasterDocumentCanvas({ paperLayout, dpi });
    const dataUrl = masterCanvas.toDataURL("image/png");

    // 3. Inject calibrated @page CSS
    const pageSizeCss = getPageSizeCss(
      paperLayout.paperSize,
      paperLayout.orientation,
      paperLayout.paperWidthMm,
      paperLayout.paperHeightMm
    );

    let styleEl = document.getElementById("document-studio-print-style") as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "document-studio-print-style";
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `@page { size: ${pageSizeCss}; margin: 0 !important; }`;

    onBeforePrint?.();

    const copies = Math.max(1, Math.min(20, paperLayout.copies || 1));
    const dataUrls = Array.from({ length: copies }, () => dataUrl);

    return { success: true, dataUrl, dataUrls };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to prepare print canvas.",
    };
  } finally {
    if (masterCanvas) {
      releaseCanvasBuffer(masterCanvas);
    }
  }
}
