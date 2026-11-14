import { PDFDocument } from "pdf-lib";
import type {
  PhotoSheetConfig,
  SheetCalculationResult,
  SheetExportOptions,
  SheetExportResult,
} from "../../types/photo-sheet.ts";
import {
  renderMasterSheetCanvas,
  type ImageSourceDrawable,
  type MultiImageSource,
} from "./sheet-renderer.ts";
import { exportCanvasToBlob, downloadImageBlob } from "../image/exporter.ts";
import { releaseCanvasBuffer } from "../utils/memory.ts";
import { generateSheetFileName } from "./sheet-calculator.ts";
export { generateSheetFileName };

/**
 * Exports the photo sheet as a high-resolution PNG or JPEG Blob.
 * Supports both standard A4 and 4x6 paper sheets.
 */
export async function exportSheetAsImage(
  imageSource: MultiImageSource,
  layout: SheetCalculationResult,
  config: PhotoSheetConfig,
  options: SheetExportOptions
): Promise<SheetExportResult> {
  const includeGuides = options.includeCutGuides ?? config.cutGuides.includeInExport;
  const masterCanvas = renderMasterSheetCanvas(
    imageSource,
    layout,
    config.cutGuides,
    includeGuides
  );

  const format = options.format === "image/jpeg" ? "image/jpeg" : "image/png";
  const quality = options.quality ?? 0.95;

  try {
    const blob = await exportCanvasToBlob(masterCanvas, {
      format,
      quality,
      backgroundColor: "#ffffff",
      dpi: layout.dpi,
    });

    const fileName =
      options.fileName ||
      generateSheetFileName(
        config.orientation,
        layout.dpi,
        format === "image/jpeg" ? "jpeg" : "png",
        layout.paperSize
      );

    return {
      blob,
      fileName,
      format,
      widthPx: layout.sheetWidthPx,
      heightPx: layout.sheetHeightPx,
      pageCount: 1,
      sizeBytes: blob.size,
    };
  } finally {
    // Deterministic memory cleanup of high-resolution HTMLCanvasElement or OffscreenCanvas buffer
    releaseCanvasBuffer(masterCanvas);
  }
}

export interface MultiSheetPdfPageInput {
  imageSource: MultiImageSource;
  layout: SheetCalculationResult;
  /** Optional pre-encoded JPEG bytes (bypasses canvas rendering when already available) */
  imageBytes?: Uint8Array;
}

/**
 * Exports a single physical sheet as a print-ready calibrated PDF document using pdf-lib.
 * Delegates to `exportMultiSheetAsPdf` so single- and multi-page exports share identical calibration.
 */
export async function exportSheetAsPdf(
  imageSource: MultiImageSource,
  layout: SheetCalculationResult,
  config: PhotoSheetConfig,
  options: SheetExportOptions
): Promise<SheetExportResult> {
  return exportMultiSheetAsPdf([{ imageSource, layout }], config, options);
}

/**
 * Exports multiple physical sheets as a calibrated multi-page PDF document using pdf-lib.
 * If 1 sheet is provided, outputs a 1-page PDF.
 * If N sheets are provided, outputs an N-page PDF with exact vector boundaries for each sheet.
 *
 * Page dimensions in exact PDF points (not derived from rounded pixels):
 * - A4 Portrait: 595.2756 × 841.8898 points
 * - A4 Landscape: 841.8898 × 595.2756 points
 * - 4x6 Portrait: 288.0 × 432.0 points
 * - 4x6 Landscape: 432.0 × 288.0 points
 */
export async function exportMultiSheetAsPdf(
  pages: MultiSheetPdfPageInput[],
  config: PhotoSheetConfig,
  options: SheetExportOptions
): Promise<SheetExportResult> {
  if (pages.length === 0) {
    throw new Error("No pages provided for multi-sheet PDF export.");
  }

  const firstLayout = pages[0].layout;
  const paperName = firstLayout.paperSize === "a4" ? "A4" : "4x6";
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`${paperName} Photo Sheet — Browser Utility Studio`);
  pdfDoc.setAuthor("Browser Utility Studio (Client-Side)");
  pdfDoc.setCreator("Browser Utility Studio Photo Sheet Generator");
  pdfDoc.setProducer("pdf-lib (In-Browser Execution)");

  for (const pageItem of pages) {
    let imageBytes = pageItem.imageBytes;

    if (!imageBytes) {
      const includeGuides = options.includeCutGuides ?? config.cutGuides.includeInExport;
      const masterCanvas = renderMasterSheetCanvas(
        pageItem.imageSource,
        pageItem.layout,
        config.cutGuides,
        includeGuides
      );

      try {
        const jpegBlob = await exportCanvasToBlob(masterCanvas, {
          format: "image/jpeg",
          quality: options.quality ?? 0.95,
          backgroundColor: "#ffffff",
          dpi: pageItem.layout.dpi,
        });

        imageBytes = new Uint8Array(await jpegBlob.arrayBuffer());
      } finally {
        // Release each page canvas immediately after encoding to minimize peak memory on multi-page jobs
        releaseCanvasBuffer(masterCanvas);
      }
    }

    const embeddedImage = await pdfDoc.embedJpg(imageBytes);

    const page = pdfDoc.addPage([pageItem.layout.pageWidthPt, pageItem.layout.pageHeightPt]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: pageItem.layout.pageWidthPt,
      height: pageItem.layout.pageHeightPt,
    });
  }

  const pdfBytes = await pdfDoc.save();
  const pdfBlob = new Blob([pdfBytes as any], { type: "application/pdf" });

  const fileName =
    options.fileName ||
    generateSheetFileName(config.orientation, firstLayout.dpi, "pdf", firstLayout.paperSize);

  return {
    blob: pdfBlob,
    fileName,
    format: "application/pdf",
    widthPx: firstLayout.sheetWidthPx,
    heightPx: firstLayout.sheetHeightPx,
    pageWidthPt: firstLayout.pageWidthPt,
    pageHeightPt: firstLayout.pageHeightPt,
    pageCount: pages.length,
    sizeBytes: pdfBlob.size,
  };
}

/**
 * Downloads the exported sheet directly to the user's disk.
 */
export function downloadSheet(exportResult: SheetExportResult): void {
  downloadImageBlob(exportResult.blob, exportResult.fileName);
}
