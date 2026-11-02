import { PDFDocument } from "pdf-lib";
import type {
  PhotoSheetConfig,
  SheetCalculationResult,
  SheetExportOptions,
  SheetExportResult,
} from "@/types/photo-sheet";
import {
  renderMasterSheetCanvas,
  type ImageSourceDrawable,
  type MultiImageSource,
} from "./sheet-renderer";
import { exportCanvasToBlob, downloadImageBlob } from "@/lib/image/exporter";
import { releaseCanvasBuffer } from "@/lib/utils/memory";
import { generateSheetFileName } from "./sheet-calculator";
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
      sizeBytes: blob.size,
    };
  } finally {
    // Deterministic memory cleanup of high-resolution canvas buffer
    if (masterCanvas instanceof HTMLCanvasElement) {
      releaseCanvasBuffer(masterCanvas);
    }
  }
}

/**
 * Exports the photo sheet as a print-ready vector-sized PDF document using pdf-lib.
 *
 * Page dimensions in exact PDF points (not derived from rounded pixels):
 * - A4 Portrait: 595.2756 × 841.8898 points
 * - A4 Landscape: 841.8898 × 595.2756 points
 * - 4x6 Portrait: 288.0 × 432.0 points
 * - 4x6 Landscape: 432.0 × 288.0 points
 */
export async function exportSheetAsPdf(
  imageSource: MultiImageSource,
  layout: SheetCalculationResult,
  config: PhotoSheetConfig,
  options: SheetExportOptions
): Promise<SheetExportResult> {
  const pageWidthPt = layout.pageWidthPt;
  const pageHeightPt = layout.pageHeightPt;

  const includeGuides = options.includeCutGuides ?? config.cutGuides.includeInExport;

  // Render high-resolution master sheet canvas to embed
  const masterCanvas = renderMasterSheetCanvas(
    imageSource,
    layout,
    config.cutGuides,
    includeGuides
  );

  try {
    // Encode canvas to JPEG buffer for embedding into PDF
    const jpegBlob = await exportCanvasToBlob(masterCanvas, {
      format: "image/jpeg",
      quality: options.quality ?? 0.95,
      backgroundColor: "#ffffff",
    });

    const imageBytes = new Uint8Array(await jpegBlob.arrayBuffer());

    // Create PDF document
    const paperName = layout.paperSize === "a4" ? "A4" : "4x6";
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(`${paperName} Photo Sheet — Browser Utility Studio`);
    pdfDoc.setAuthor("Browser Utility Studio (Client-Side)");
    pdfDoc.setCreator("Browser Utility Studio Photo Sheet Generator");
    pdfDoc.setProducer("pdf-lib (In-Browser Execution)");

    // Add exactly calibrated page using physical PDF points
    const page = pdfDoc.addPage([pageWidthPt, pageHeightPt]);

    // Embed high-resolution JPEG
    const embeddedImage = await pdfDoc.embedJpg(imageBytes);

    // Draw image to fill the exact page boundaries
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: pageWidthPt,
      height: pageHeightPt,
    });

    const pdfBytes = await pdfDoc.save();
    const pdfBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });

    const fileName =
      options.fileName ||
      generateSheetFileName(config.orientation, layout.dpi, "pdf", layout.paperSize);

    return {
      blob: pdfBlob,
      fileName,
      format: "application/pdf",
      widthPx: layout.sheetWidthPx,
      heightPx: layout.sheetHeightPx,
      pageWidthPt,
      pageHeightPt,
      sizeBytes: pdfBlob.size,
    };
  } finally {
    if (masterCanvas instanceof HTMLCanvasElement) {
      releaseCanvasBuffer(masterCanvas);
    }
  }
}

/**
 * Downloads the exported sheet directly to the user's disk.
 */
export function downloadSheet(exportResult: SheetExportResult): void {
  downloadImageBlob(exportResult.blob, exportResult.fileName);
}
