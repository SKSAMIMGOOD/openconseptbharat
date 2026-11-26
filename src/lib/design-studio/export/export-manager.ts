/**
 * Design Studio — Dedicated Export Manager
 *
 * Orchestrates multi-format exports (PNG, JPEG, PDF) from an engine-independent
 * DesignDocument. Handles dimension calculations, progress tracking, memory release,
 * and zip packaging for multi-page image sets.
 */

import type { DesignDocument } from "../../../types/design-studio.ts";
import type {
  DesignExportOptions,
  DesignExportResult,
  ExportOutputItem,
  ExportProgressEvent,
} from "../../../types/design-export.ts";
import { mmToPixels, mmToPoints } from "../../../constants/design-dimensions.ts";
import { renderPageToCanvas, canvasToBlobAsync } from "./raster-adapter.ts";
import { renderDocumentToPdf } from "./pdf-adapter.ts";
import { releaseCanvasBuffer } from "../../utils/memory.ts";

export class DesignExportManager {
  private isExporting = false;

  /**
   * Returns whether an export operation is currently active.
   */
  public get running(): boolean {
    return this.isExporting;
  }

  /**
   * Executes the export workflow according to options.
   */
  public async export(
    document: DesignDocument,
    options: DesignExportOptions,
    onProgress?: (event: ExportProgressEvent) => void
  ): Promise<DesignExportResult> {
    if (this.isExporting) {
      throw new Error("An export operation is already in progress.");
    }

    this.isExporting = true;
    try {
      if (options.format === "pdf") {
        return await this.exportAsPdf(document, options, onProgress);
      } else {
        return await this.exportAsImages(document, options, onProgress);
      }
    } finally {
      this.isExporting = false;
    }
  }

  /**
   * PDF Export Path
   */
  private async exportAsPdf(
    document: DesignDocument,
    options: DesignExportOptions,
    onProgress?: (event: ExportProgressEvent) => void
  ): Promise<DesignExportResult> {
    const pagesToExport =
      options.pageScope && options.pageScope !== "all"
        ? document.pages.filter((p) => p.id === options.pageScope)
        : document.pages;

    onProgress?.({
      phase: "init",
      currentPageIndex: 0,
      totalPages: pagesToExport.length,
      message: "Preparing print-ready vector PDF document...",
    });

    const pdfBytes = await renderDocumentToPdf(document, {
      pageScope: options.pageScope,
      onProgress: (current, total) => {
        onProgress?.({
          phase: "rendering-page",
          currentPageIndex: current,
          totalPages: total,
          message: `Writing PDF page ${current} of ${total}...`,
        });
      },
    });

    onProgress?.({
      phase: "compiling",
      currentPageIndex: pagesToExport.length,
      totalPages: pagesToExport.length,
      message: "Finalizing PDF file...",
    });

    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
    const cleanDocTitle = (options.baseFileName || document.metadata.title || "design-document")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const isLandscape = document.orientation === "landscape";
    const widthMm = isLandscape ? Math.max(document.dimensions.widthMm, document.dimensions.heightMm) : Math.min(document.dimensions.widthMm, document.dimensions.heightMm);
    const heightMm = isLandscape ? Math.min(document.dimensions.widthMm, document.dimensions.heightMm) : Math.max(document.dimensions.widthMm, document.dimensions.heightMm);

    const item: ExportOutputItem = {
      blob,
      fileName: `${cleanDocTitle}.pdf`,
      mimeType: "application/pdf",
      widthPx: mmToPixels(widthMm, options.dpi || 300),
      heightPx: mmToPixels(heightMm, options.dpi || 300),
      fileSizeBytes: blob.size,
    };

    onProgress?.({
      phase: "done",
      currentPageIndex: pagesToExport.length,
      totalPages: pagesToExport.length,
      message: "PDF export complete.",
    });

    return {
      items: [item],
      format: "pdf",
      totalSizeBytes: blob.size,
    };
  }

  /**
   * Raster Images (PNG / JPEG) Export Path
   */
  private async exportAsImages(
    document: DesignDocument,
    options: DesignExportOptions,
    onProgress?: (event: ExportProgressEvent) => void
  ): Promise<DesignExportResult> {
    const isJpeg = options.format === "jpeg";
    const mimeType = isJpeg ? "image/jpeg" : "image/png";
    const extension = isJpeg ? "jpg" : "png";

    const pagesToExport =
      options.pageScope && options.pageScope !== "all"
        ? document.pages.filter((p) => p.id === options.pageScope)
        : document.pages;

    const total = pagesToExport.length;
    const items: ExportOutputItem[] = [];
    let totalSize = 0;

    const cleanDocTitle = (options.baseFileName || document.metadata.title || "design")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const isLandscape = document.orientation === "landscape";
    const widthMm = isLandscape ? Math.max(document.dimensions.widthMm, document.dimensions.heightMm) : Math.min(document.dimensions.widthMm, document.dimensions.heightMm);
    const heightMm = isLandscape ? Math.min(document.dimensions.widthMm, document.dimensions.heightMm) : Math.max(document.dimensions.widthMm, document.dimensions.heightMm);
    const widthPx = mmToPixels(widthMm, options.dpi);
    const heightPx = mmToPixels(heightMm, options.dpi);

    for (let i = 0; i < total; i++) {
      const page = pagesToExport[i];
      onProgress?.({
        phase: "rendering-page",
        currentPageIndex: i + 1,
        totalPages: total,
        message: `Rendering ${page.name} (${i + 1}/${total}) at ${options.dpi} DPI...`,
      });

      // Render canvas
      const canvas = await renderPageToCanvas(document, page, options.dpi, {
        transparentBackground: !isJpeg && options.transparentBackground,
        backgroundColor: options.backgroundColor || "#ffffff",
      });

      const blob = await canvasToBlobAsync(canvas, mimeType, options.quality ?? 0.95);
      totalSize += blob.size;

      // Clean semantic page label
      const pageSlug = page.name
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      const fileName =
        total === 1
          ? `${cleanDocTitle}.${extension}`
          : `${cleanDocTitle}-${pageSlug || `page-${i + 1}`}.${extension}`;

      items.push({
        blob,
        fileName,
        mimeType,
        pageId: page.id,
        pageName: page.name,
        widthPx,
        heightPx,
        fileSizeBytes: blob.size,
      });

      // Release memory
      releaseCanvasBuffer(canvas);
    }

    onProgress?.({
      phase: "done",
      currentPageIndex: total,
      totalPages: total,
      message: "Image export complete.",
    });

    return {
      items,
      format: options.format,
      totalSizeBytes: totalSize,
    };
  }
}

/** Global singleton instance for easy usage */
export const designExportManager = new DesignExportManager();
