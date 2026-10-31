export interface PdfRenderOptions {
  scale?: number;
  rotation?: number;
  pageNumber?: number;
}

export interface PdfDocumentMetadata {
  pageCount: number;
  title?: string;
  author?: string;
  creator?: string;
  creationDate?: Date;
  fingerprint?: string;
}

export interface PdfRenderResult {
  pageNumber: number;
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
}
