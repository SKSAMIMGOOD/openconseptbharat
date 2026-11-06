/**
 * Phase 08A — Document Processing Engine
 * Privacy-first, browser-only client-side document processing.
 * Handles JPG/PNG decoding, multi-page PDF rendering via pdfjs-dist / pdf-lib,
 * file validation, dimension calculation, and ephemeral memory management.
 */

import { PDFDocument } from "pdf-lib";
import type {
  DocumentFileType,
  DocumentDimensions,
} from "@/types/document-studio";

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const ALLOWED_DOCUMENT_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
];

export const MAX_DOCUMENT_FILE_SIZE_MB = 30;

export interface DocumentValidationResult {
  isValid: boolean;
  error?: string;
  fileType?: DocumentFileType;
}

export interface DocumentProcessResult {
  file: File;
  fileType: DocumentFileType;
  previewUrl: string;
  dimensions: DocumentDimensions;
  fileSizeFormatted: string;
  fileName: string;
  pageCount: number;
  currentPage: number;
}

/**
 * Formats file size in bytes to human-readable KB or MB.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Verifies magic bytes of the file to protect against corrupted or spoofed document files.
 */
export async function verifyDocumentMagicBytes(file: File): Promise<boolean> {
  try {
    const buffer = await file.slice(0, 8).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // PDF magic bytes: %PDF- (0x25 0x50 0x44 0x46)
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return true;
    }

    // JPEG magic bytes: 0xFF 0xD8 0xFF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return true;
    }

    // PNG magic bytes: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return true;
    }

    // WebP magic bytes: RIFF....WEBP
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Validates a document or image file before processing.
 */
export async function validateDocumentFile(file: File): Promise<DocumentValidationResult> {
  if (!file) {
    return { isValid: false, error: "No file was selected." };
  }

  // 1. File size check
  const maxBytes = MAX_DOCUMENT_FILE_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      isValid: false,
      error: `File size exceeds the limit of ${MAX_DOCUMENT_FILE_SIZE_MB} MB (Selected: ${formatFileSize(file.size)}).`,
    };
  }

  // 2. Extension check
  const name = file.name.toLowerCase();
  const hasValidExt = ALLOWED_DOCUMENT_EXTENSIONS.some((ext) => name.endsWith(ext));

  // 3. MIME type check
  const hasValidMime =
    ALLOWED_DOCUMENT_MIME_TYPES.includes(file.type) ||
    file.type === "image/jpg" ||
    (file.type === "" && hasValidExt);

  if (!hasValidExt && !hasValidMime) {
    return {
      isValid: false,
      error: `Unsupported file format. Please upload JPG, PNG, or PDF files.`,
    };
  }

  // 4. Magic bytes verification for security & file integrity
  const isMagicValid = await verifyDocumentMagicBytes(file);
  if (!isMagicValid) {
    return {
      isValid: false,
      error: "The file appears corrupted or does not match its declared format.",
    };
  }

  const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
  return {
    isValid: true,
    fileType: isPdf ? "pdf" : "image",
  };
}

/**
 * Safely inspects a PDF file using pdf-lib to extract page count.
 */
export async function getPdfPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    return pdfDoc.getPageCount();
  } catch (err) {
    console.warn("pdf-lib page count inspection failed, falling back to 1", err);
    return 1;
  }
}

/**
 * Dynamically loads and configures PDF.js in browser environments.
 */
interface PdfJsDocumentProxy {
  numPages: number;
  getPage: (pageNumber: number) => Promise<{
    getViewport: (params: { scale: number }) => { width: number; height: number };
    render: (params: {
      canvasContext: CanvasRenderingContext2D;
      viewport: { width: number; height: number };
    }) => { promise: Promise<void> };
  }>;
}

interface PdfJsLibInstance {
  GlobalWorkerOptions?: { workerSrc?: string };
  getDocument: (options: {
    data: Uint8Array;
    stopAtErrors?: boolean;
  }) => { promise: Promise<PdfJsDocumentProxy> };
}

let cachedPdfJs: PdfJsLibInstance | null = null;

export async function getPdfJsLibrary(): Promise<PdfJsLibInstance> {
  if (cachedPdfJs) return cachedPdfJs;

  if (typeof window === "undefined") {
    throw new Error("PDF rendering is only supported in browser environments.");
  }

  // Dynamically import pdfjs-dist standard build
  const importedModule = await import("pdfjs-dist/build/pdf.js");
  const pdfjs = (
    "default" in importedModule && importedModule.default
      ? importedModule.default
      : importedModule
  ) as unknown as PdfJsLibInstance;

  cachedPdfJs = pdfjs;

  if (cachedPdfJs.GlobalWorkerOptions && !cachedPdfJs.GlobalWorkerOptions.workerSrc) {
    // Worker is served locally from public/pdf.worker.min.js
    cachedPdfJs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
  }

  return cachedPdfJs;
}

/**
 * Renders a specified page of a PDF file to an image Blob and returns its dimensions.
 */
export async function renderPdfPageToBlob(
  file: File,
  pageNumber: number = 1,
  scale: number = 2.0 // 2.0 scale provides crisp rendering for cards & high DPI text
): Promise<{ blob: Blob; width: number; height: number }> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Client browser environment required for PDF rendering.");
  }

  const pdfjs = await getPdfJsLibrary();
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer),
    stopAtErrors: false,
  });

  const pdfDoc = await loadingTask.promise;
  const safePageNum = Math.min(Math.max(1, pageNumber), pdfDoc.numPages);
  const page = await pdfDoc.getPage(safePageNum);

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    throw new Error("Failed to initialize canvas 2D context for PDF rendering.");
  }

  // Fill canvas with white background before rendering
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to convert PDF canvas to image blob."));
          return;
        }
        resolve({
          blob,
          width: canvas.width,
          height: canvas.height,
        });
      },
      "image/png",
      1.0
    );
  });
}

/**
 * Extracts dimensions from an image file using an offscreen HTMLImageElement.
 */
export function extractImageDimensions(file: File): Promise<DocumentDimensions> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Browser environment required for image decoding."));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const dimensions: DocumentDimensions = {
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
      };
      URL.revokeObjectURL(objectUrl);
      resolve(dimensions);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to decode image file."));
    };

    img.src = objectUrl;
  });
}

/**
 * Fully processes an uploaded file (Image or PDF) for a document workspace side.
 */
export async function processDocumentFile(
  file: File,
  pageNumber: number = 1
): Promise<DocumentProcessResult> {
  const validation = await validateDocumentFile(file);
  if (!validation.isValid || !validation.fileType) {
    throw new Error(validation.error || "File validation failed.");
  }

  const fileName = file.name;
  const fileSizeFormatted = formatFileSize(file.size);

  if (validation.fileType === "pdf") {
    const pageCount = await getPdfPageCount(file);
    const { blob, width, height } = await renderPdfPageToBlob(file, pageNumber);
    const previewUrl = URL.createObjectURL(blob);

    return {
      file,
      fileType: "pdf",
      previewUrl,
      dimensions: {
        width,
        height,
        aspectRatio: width / height,
      },
      fileSizeFormatted,
      fileName,
      pageCount,
      currentPage: pageNumber,
    };
  } else {
    const dimensions = await extractImageDimensions(file);
    const previewUrl = URL.createObjectURL(file);

    return {
      file,
      fileType: "image",
      previewUrl,
      dimensions,
      fileSizeFormatted,
      fileName,
      pageCount: 1,
      currentPage: 1,
    };
  }
}
