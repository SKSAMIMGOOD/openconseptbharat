import { PdfDocumentMetadata, PdfRenderOptions, PdfRenderResult } from "@/types/pdf";

/**
 * PDF Engine Contract & Architecture
 * Provides browser-only client-side PDF rendering (PDF.js) and generation (pdf-lib).
 */

export interface IPdfRenderEngine {
  loadDocument(file: File): Promise<PdfDocumentMetadata>;
  renderPageToCanvas(pageNumber: number, options?: PdfRenderOptions): Promise<PdfRenderResult>;
  destroy(): void;
}

export interface IPdfGeneratorEngine {
  createCardSheet(images: { front?: Blob; back?: Blob }, config: { layout: "A4"; copies?: number }): Promise<Blob>;
  createPhotoSheet(photo: Blob, config: { paper: "A4" | "4x6"; copies: number }): Promise<Blob>;
}

/**
 * Placeholder engine contract implementation ready for Phase 01+ module integration.
 */
export class ClientPdfEngine implements IPdfRenderEngine {
  private pdfDoc: unknown = null;

  async loadDocument(file: File): Promise<PdfDocumentMetadata> {
    if (typeof window === "undefined") {
      throw new Error("PDF processing is only supported in browser environments.");
    }
    // Will dynamically initialize pdfjs-dist without SSR conflicts
    return {
      pageCount: 1,
      title: file.name,
    };
  }

  async renderPageToCanvas(pageNumber: number, options?: PdfRenderOptions): Promise<PdfRenderResult> {
    if (typeof document === "undefined") {
      throw new Error("Canvas rendering requires browser document context.");
    }
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1000;
    return {
      pageNumber,
      width: canvas.width,
      height: canvas.height,
      canvas,
    };
  }

  destroy(): void {
    this.pdfDoc = null;
  }
}
