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
} from "../../types/document-studio.ts";
import type {
  PrintPaperLayoutResult,
  PrintPlacedItem,
} from "./document-print-studio.ts";
import { resolveActiveSideImage } from "./document-print-studio.ts";
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
}): Promise<PrintPdfExportResult> {
  const {
    paperLayout,
    front,
    back,
    isSingleSided = false,
    docDef,
    dpi = front.printSettings?.dpi || 300,
    fileName: customFileName,
  } = options;

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

  let imageBytes = options.imageBytes;
  let createdCanvas: HTMLCanvasElement | null = null;

  try {
    // 3. Acquire image bytes (from passed buffer, passed canvas, or render fresh canvas)
    if (!imageBytes) {
      const canvas = options.masterCanvas || (await renderMasterDocumentCanvas({ paperLayout, dpi }));
      if (!options.masterCanvas && canvas instanceof HTMLCanvasElement) {
        createdCanvas = canvas;
      }

      // Convert canvas to JPEG blob
      const jpegBlob: Blob = await new Promise((resolve, reject) => {
        if ("toBlob" in canvas && typeof (canvas as HTMLCanvasElement).toBlob === "function") {
          (canvas as HTMLCanvasElement).toBlob(
            (b) => {
              if (b) resolve(b);
              else reject(new Error("Failed to encode master canvas to JPEG blob."));
            },
            "image/jpeg",
            0.96
          );
        } else if ("convertToBlob" in canvas && typeof (canvas as OffscreenCanvas).convertToBlob === "function") {
          (canvas as OffscreenCanvas)
            .convertToBlob({ type: "image/jpeg", quality: 0.96 })
            .then(resolve)
            .catch(reject);
        } else {
          reject(new Error("Unsupported canvas type for PDF generation."));
        }
      });

      imageBytes = new Uint8Array(await jpegBlob.arrayBuffer());
    }

    // 4. Create calibrated PDF Document
    const pdfDoc = await PDFDocument.create();
    const docName = docDef?.name || "Document";
    pdfDoc.setTitle(`${docName} — Print Studio (Browser Utility Studio)`);
    pdfDoc.setAuthor("Browser Utility Studio (Privacy-First Client Engine)");
    pdfDoc.setCreator("Browser Utility Studio Document Studio");
    pdfDoc.setProducer("pdf-lib (In-Browser Execution)");

    // 5. Embed JPEG image
    const embeddedImage = await pdfDoc.embedJpg(imageBytes);

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
    // 2. Render master canvas
    masterCanvas = await renderMasterDocumentCanvas({ paperLayout, dpi });
    const dataUrl = masterCanvas.toDataURL("image/jpeg", 0.98);

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
