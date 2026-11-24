/**
 * Raw Image to Clean PDF — A4 Page Fitting & Multi-Page PDF Compiler
 * Phase 4: A4 Page Fitting & Multi-Page PDF Compiler
 *
 * 100% Client-Side vector-calibrated PDF generation powered by pdf-lib:
 * - A4 default paper size (595.28 × 841.89 pt portrait, 841.89 × 595.28 pt landscape)
 * - Proportional aspect-ratio fitting with zero distortion or stretching
 * - Automatic centering and long-document fitting
 * - Sequential memory-conscious processing (releasing canvas buffers after each page)
 * - Full fidelity preservation: perspective crop, brightness/contrast, color filter,
 *   per-page opt-out, pixel-retouching eraser, highlighter, and watermarks
 */

import { PDFDocument } from "pdf-lib";
import type {
  RawDocumentPage,
  RawImagePdfExportOptions,
  RawImagePdfExportResult,
  A4PageFitGeometry,
  DocumentEnhancementSettings,
  ColorFilterSettings,
} from "../../types/raw-image-to-pdf.ts";
import {
  A4_WIDTH_PT,
  A4_HEIGHT_PT,
  DEFAULT_A4_MARGIN_PT,
  DEFAULT_ENHANCEMENT_SETTINGS,
  NEUTRAL_ENHANCEMENT_SETTINGS,
  DEFAULT_COLOR_FILTER_SETTINGS,
} from "../../types/raw-image-to-pdf.ts";
import { compositeDocumentLayers } from "./annotation-engine.ts";
import { releaseCanvasBuffer } from "../utils/memory.ts";

/**
 * Calculates exact vector PostScript point geometry for fitting any document proportionally
 * inside an A4 page sheet, preserving aspect ratio, centering horizontally and vertically,
 * and maintaining appropriate whitespace margins.
 */
export function calculateA4FitGeometry(
  docWidth: number,
  docHeight: number,
  marginPt = DEFAULT_A4_MARGIN_PT
): A4PageFitGeometry {
  if (docWidth <= 0 || docHeight <= 0) {
    return {
      pageWidthPt: A4_WIDTH_PT,
      pageHeightPt: A4_HEIGHT_PT,
      isLandscape: false,
      contentX: marginPt,
      contentY: marginPt,
      contentWidthPt: Math.max(0, A4_WIDTH_PT - 2 * marginPt),
      contentHeightPt: Math.max(0, A4_HEIGHT_PT - 2 * marginPt),
      scale: 1,
    };
  }

  // Document orientation determines A4 page orientation
  const isLandscape = docWidth > docHeight;
  const pageWidthPt = isLandscape ? A4_HEIGHT_PT : A4_WIDTH_PT; // 841.89 if landscape, 595.28 if portrait
  const pageHeightPt = isLandscape ? A4_WIDTH_PT : A4_HEIGHT_PT; // 595.28 if landscape, 841.89 if portrait

  const maxContentW = Math.max(10, pageWidthPt - 2 * marginPt);
  const maxContentH = Math.max(10, pageHeightPt - 2 * marginPt);

  // Proportional fit scale (never stretch or distort)
  const scale = Math.min(maxContentW / docWidth, maxContentH / docHeight);
  const contentWidthPt = docWidth * scale;
  const contentHeightPt = docHeight * scale;

  // Center horizontally and vertically
  const contentX = (pageWidthPt - contentWidthPt) / 2;
  const contentY = (pageHeightPt - contentHeightPt) / 2;

  return {
    pageWidthPt,
    pageHeightPt,
    isLandscape,
    contentX,
    contentY,
    contentWidthPt,
    contentHeightPt,
    scale,
  };
}

/**
 * Loads an image from a URL into an HTMLImageElement (client-side only).
 */
function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof Image === "undefined") {
      reject(new Error("loadImageElement requires browser DOM environment"));
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load document image for PDF compilation"));
    img.src = src;
  });
}

/**
 * Encodes an HTMLCanvasElement to a Uint8Array of bytes (image/jpeg or image/png).
 */
function canvasToBytes(
  canvas: HTMLCanvasElement,
  mimeType: "image/jpeg" | "image/png",
  quality = 0.95
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error("Canvas toBlob encoding failed"));
          return;
        }
        try {
          const buffer = await blob.arrayBuffer();
          resolve(new Uint8Array(buffer));
        } catch (err) {
          reject(err);
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Compiles an array of RawDocumentPages into one combined, print-ready vector PDF document.
 * Exactly one document per PDF page, sequentially processed to minimize peak browser memory.
 */
export async function compileRawImagesToCleanPdf(
  options: RawImagePdfExportOptions
): Promise<RawImagePdfExportResult> {
  const {
    pages,
    globalEnhancements,
    globalColorFilter,
    quality = 0.95,
    fileName: customFileName,
    onProgress,
  } = options;

  if (!pages || pages.length === 0) {
    throw new Error("No pages available to compile into PDF.");
  }

  // 1. Initialize vector PDF document via pdf-lib
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle("Clean Document — Browser Utility Studio");
  pdfDoc.setAuthor("Browser Utility Studio (100% In-Browser)");
  pdfDoc.setCreator("Raw Image to Clean PDF Compiler");
  pdfDoc.setProducer("pdf-lib Vector Embedding Engine");

  const totalPages = pages.length;

  // 2. Process each page sequentially
  for (let i = 0; i < totalPages; i++) {
    const page = pages[i];
    const pageNum = i + 1;

    onProgress?.({
      currentPage: pageNum,
      totalPages,
      percentage: Math.round(((pageNum - 0.5) / totalPages) * 100),
      statusText: `Compositing page ${pageNum} of ${totalPages}...`,
    });

    let srcUrl = "";
    let isEphemeral = false;

    if (page.isCropped && page.croppedPreviewUrl) {
      srcUrl = page.croppedPreviewUrl;
    } else if (page.isCropped && page.croppedBlob) {
      srcUrl = URL.createObjectURL(page.croppedBlob);
      isEphemeral = true;
    } else {
      srcUrl = URL.createObjectURL(page.file);
      isEphemeral = true;
    }

    let pageCanvas: HTMLCanvasElement | null = null;

    try {
      const img = await loadImageElement(srcUrl);

      const width = page.isCropped
        ? (page.croppedWidth || img.naturalWidth)
        : (page.originalWidth || img.naturalWidth);
      const height = page.isCropped
        ? (page.croppedHeight || img.naturalHeight)
        : (page.originalHeight || img.naturalHeight);

      pageCanvas = document.createElement("canvas");
      pageCanvas.width = width;
      pageCanvas.height = height;

      const ctx = pageCanvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        throw new Error(`Failed to create canvas context for page ${pageNum}`);
      }

      // Check per-page opt-out: if disabled, use neutral default settings
      const isGlobalEditsEnabled = page.applyGlobalEdits ?? true;
      const effectiveEnhancements = isGlobalEditsEnabled
        ? globalEnhancements
        : { ...NEUTRAL_ENHANCEMENT_SETTINGS };
      const effectiveColorFilter = isGlobalEditsEnabled
        ? globalColorFilter
        : { ...DEFAULT_COLOR_FILTER_SETTINGS };

      // Render composite document layers (base image + filters + annotations + watermark)
      compositeDocumentLayers(
        ctx,
        img,
        width,
        height,
        effectiveEnhancements,
        page.annotations || [],
        page.watermark || null,
        effectiveColorFilter
      );

      onProgress?.({
        currentPage: pageNum,
        totalPages,
        percentage: Math.round((pageNum / totalPages) * 100),
        statusText: `Embedding page ${pageNum} of ${totalPages} into A4 vector layout...`,
      });

      // Encode to JPEG bytes (95% quality: high-fidelity document reproduction)
      const imageBytes = await canvasToBytes(pageCanvas, "image/jpeg", quality);

      // Immediately free the high-resolution canvas buffer to maintain minimal peak memory
      releaseCanvasBuffer(pageCanvas);
      pageCanvas = null;

      // Calculate A4 fit geometry
      const fit = calculateA4FitGeometry(width, height);

      // Embed image in PDF
      const embeddedImage = await pdfDoc.embedJpg(imageBytes);

      // Add calibrated page to PDF document
      const pdfPage = pdfDoc.addPage([fit.pageWidthPt, fit.pageHeightPt]);

      // Draw document centered and proportionally scaled
      pdfPage.drawImage(embeddedImage, {
        x: fit.contentX,
        y: fit.contentY,
        width: fit.contentWidthPt,
        height: fit.contentHeightPt,
      });
    } finally {
      if (pageCanvas) {
        releaseCanvasBuffer(pageCanvas);
      }
      if (isEphemeral && srcUrl) {
        URL.revokeObjectURL(srcUrl);
      }
    }
  }

  onProgress?.({
    currentPage: totalPages,
    totalPages,
    percentage: 100,
    statusText: "Finalizing print-ready PDF binary...",
  });

  // 3. Serialize vector PDF binary
  const pdfBytes = await pdfDoc.save();
  const pdfBlob = new Blob([pdfBytes as any], { type: "application/pdf" });

  const fileName =
    customFileName ||
    `clean-document-${Date.now()}-${totalPages}p.pdf`;

  return {
    blob: pdfBlob,
    fileName,
    sizeBytes: pdfBlob.size,
    pageCount: totalPages,
    format: "application/pdf",
  };
}

/**
 * Exports a single page as a high-resolution lossless PNG or JPEG image.
 */
export async function exportSinglePageImage(
  page: RawDocumentPage,
  globalEnhancements: DocumentEnhancementSettings,
  globalColorFilter?: ColorFilterSettings,
  format: "image/png" | "image/jpeg" = "image/png",
  quality = 0.95
): Promise<{ blob: Blob; fileName: string; width: number; height: number; sizeBytes: number }> {
  let srcUrl = "";
  let isEphemeral = false;

  if (page.isCropped && page.croppedPreviewUrl) {
    srcUrl = page.croppedPreviewUrl;
  } else if (page.isCropped && page.croppedBlob) {
    srcUrl = URL.createObjectURL(page.croppedBlob);
    isEphemeral = true;
  } else {
    srcUrl = URL.createObjectURL(page.file);
    isEphemeral = true;
  }

  const canvas = document.createElement("canvas");

  try {
    const img = await loadImageElement(srcUrl);

    const width = page.isCropped
      ? (page.croppedWidth || img.naturalWidth)
      : (page.originalWidth || img.naturalWidth);
    const height = page.isCropped
      ? (page.croppedHeight || img.naturalHeight)
      : (page.originalHeight || img.naturalHeight);

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      throw new Error("Failed to create canvas context for page export");
    }

    const isGlobalEditsEnabled = page.applyGlobalEdits ?? true;
    const effectiveEnhancements = isGlobalEditsEnabled
      ? globalEnhancements
      : { ...NEUTRAL_ENHANCEMENT_SETTINGS };
    const effectiveColorFilter = isGlobalEditsEnabled
      ? globalColorFilter
      : { ...DEFAULT_COLOR_FILTER_SETTINGS };

    compositeDocumentLayers(
      ctx,
      img,
      width,
      height,
      effectiveEnhancements,
      page.annotations || [],
      page.watermark || null,
      effectiveColorFilter
    );

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob encoding failed"))),
        format,
        quality
      );
    });

    const ext = format === "image/png" ? "png" : "jpg";
    const baseName = page.name.replace(/\.[^/.]+$/, "");
    const fileName = `${baseName}-clean.${ext}`;

    return {
      blob,
      fileName,
      width,
      height,
      sizeBytes: blob.size,
    };
  } finally {
    releaseCanvasBuffer(canvas);
    if (isEphemeral && srcUrl) {
      URL.revokeObjectURL(srcUrl);
    }
  }
}

/**
 * Downloads a generated Blob file to the user's disk with automatic cleanup.
 */
export function downloadExportBlob(blob: Blob, fileName: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
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
    URL.revokeObjectURL(url);
  }, 1500);
}
