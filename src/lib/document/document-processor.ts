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
export interface PdfJsPageProxy {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void> };
}

export interface PdfJsDocumentProxy {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfJsPageProxy>;
  destroy?: () => Promise<void>;
}

export interface PdfJsLoadingTask {
  promise: Promise<PdfJsDocumentProxy>;
  onPassword?: ((updatePassword: (password: string | Error) => void, reason: number) => void) | null;
  destroy?: () => Promise<void>;
  destroyed?: boolean;
}

export interface PdfJsLibInstance {
  GlobalWorkerOptions?: { workerSrc?: string };
  PasswordResponses?: {
    NEED_PASSWORD: number;
    INCORRECT_PASSWORD: number;
  };
  getDocument: (options: {
    data: Uint8Array;
    stopAtErrors?: boolean;
    password?: string;
  }) => PdfJsLoadingTask;
}

export type PdfErrorCategory =
  | "password-required"
  | "incorrect-password"
  | "unsupported-encryption"
  | "corrupted-pdf"
  | "processing-error";

export interface ClassifiedPdfError {
  category: PdfErrorCategory;
  message: string;
}

export class PdfProcessingError extends Error {
  readonly category: PdfErrorCategory;

  constructor(category: PdfErrorCategory, message: string) {
    super(message);
    this.name = "PdfProcessingError";
    this.category = category;
  }
}

export type SubmitPdfPasswordResult =
  | { status: "unlocked"; pdfDoc: PdfJsDocumentProxy; pageCount: number }
  | { status: "incorrect-password"; message: string }
  | { status: "empty-password"; message: string }
  | { status: "in-progress"; message: string }
  | { status: "cancelled" }
  | { status: "error"; category: PdfErrorCategory; message: string };

export interface PdfDocumentSession {
  readonly isDestroyed: boolean;
  submitPassword: (password: string) => Promise<SubmitPdfPasswordResult>;
  destroy: () => Promise<void>;
}

export type OpenPdfSessionResult =
  | { status: "loaded"; pdfDoc: PdfJsDocumentProxy; pageCount: number }
  | { status: "password-required"; session: PdfDocumentSession };

const DEFAULT_PASSWORD_RESPONSES = {
  NEED_PASSWORD: 1,
  INCORRECT_PASSWORD: 2,
};

/**
 * Classifies PDF.js loading and decryption errors without echoing sensitive inputs.
 */
export function classifyPdfLoadError(
  error: unknown,
  passwordResponses: { NEED_PASSWORD: number; INCORRECT_PASSWORD: number } = DEFAULT_PASSWORD_RESPONSES
): ClassifiedPdfError {
  if (error instanceof PdfProcessingError) {
    return {
      category: error.category,
      message: error.message,
    };
  }

  const errObj =
    typeof error === "object" && error !== null
      ? (error as { name?: unknown; code?: unknown; message?: unknown; details?: unknown })
      : null;

  const name = typeof errObj?.name === "string" ? errObj.name : "";
  const code = typeof errObj?.code === "number" ? errObj.code : undefined;
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof errObj?.message === "string"
      ? errObj.message
      : "";
  const details = typeof errObj?.details === "string" ? errObj.details : "";
  const combined = `${rawMessage} ${details}`.toLowerCase();

  if (
    name === "PasswordException" ||
    code === passwordResponses.NEED_PASSWORD ||
    code === passwordResponses.INCORRECT_PASSWORD
  ) {
    if (
      code === passwordResponses.INCORRECT_PASSWORD ||
      combined.includes("incorrect password")
    ) {
      return {
        category: "incorrect-password",
        message: "Incorrect password. Please try again.",
      };
    }

    return {
      category: "password-required",
      message: "This document requires a password before it can be processed.",
    };
  }

  if (
    combined.includes("unknown encryption method") ||
    combined.includes("unsupported encryption algorithm") ||
    combined.includes("unknown crypto method") ||
    combined.includes("invalid crypt filter") ||
    combined.includes("invalid key length") ||
    combined.includes("unsupported encryption") ||
    combined.includes("unsupported security handler") ||
    combined.includes("encryption is not supported")
  ) {
    return {
      category: "unsupported-encryption",
      message:
        "This PDF uses an unsupported encryption method and cannot be decrypted in your browser.",
    };
  }

  if (
    name === "InvalidPDFException" ||
    name === "MissingPDFException" ||
    name === "FormatError" ||
    combined.includes("invalid pdf") ||
    combined.includes("invalid root") ||
    combined.includes("xref") ||
    combined.includes("startxref") ||
    combined.includes("corrupt") ||
    combined.includes("missing pdf") ||
    combined.includes("size is zero bytes")
  ) {
    return {
      category: "corrupted-pdf",
      message: "The PDF file appears corrupted or cannot be read.",
    };
  }

  return {
    category: "processing-error",
    message: rawMessage || "Failed to process PDF document.",
  };
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
 * Opens a PDF document using PDF.js with interactive password callback support.
 * Keeps the in-memory PDF.js loading task alive across password retries without re-uploading.
 */
export async function openPdfDocumentSession(
  file: File,
  options?: { pdfjsLib?: PdfJsLibInstance }
): Promise<OpenPdfSessionResult> {
  const pdfjs = options?.pdfjsLib ?? (await getPdfJsLibrary());
  const passwordResponses = pdfjs.PasswordResponses ?? DEFAULT_PASSWORD_RESPONSES;
  const arrayBuffer = await file.arrayBuffer();

  type SessionWaiter =
    | {
        mode: "initial";
        resolve: (result: OpenPdfSessionResult) => void;
        reject: (err: unknown) => void;
      }
    | {
        mode: "unlock";
        resolve: (result: SubmitPdfPasswordResult) => void;
      };

  let isDestroyed = false;
  let isSubmitting = false;
  let isSettled = false;
  let preloadedDoc: PdfJsDocumentProxy | null = null;
  let preloadError: unknown = null;
  let pendingUpdatePassword: ((password: string | Error) => void) | null = null;
  let waiter: SessionWaiter | null = null;

  let loadingTask: PdfJsLoadingTask;

  const session: PdfDocumentSession = {
    get isDestroyed() {
      return isDestroyed;
    },
    async submitPassword(password: string): Promise<SubmitPdfPasswordResult> {
      if (isDestroyed) {
        return { status: "cancelled" };
      }

      if (!password || password.trim().length === 0) {
        return {
          status: "empty-password",
          message: "Please enter the PDF password.",
        };
      }

      if (isSubmitting) {
        return {
          status: "in-progress",
          message: "Password verification is already in progress.",
        };
      }

      if (isSettled) {
        if (preloadedDoc) {
          return {
            status: "unlocked",
            pdfDoc: preloadedDoc,
            pageCount: preloadedDoc.numPages,
          };
        }
        const classified = classifyPdfLoadError(preloadError, passwordResponses);
        return {
          status: "error",
          category: classified.category,
          message: classified.message,
        };
      }

      const updatePassword = pendingUpdatePassword;
      if (!updatePassword) {
        return {
          status: "error",
          category: "processing-error",
          message: "PDF password session is unavailable. Please upload the file again.",
        };
      }

      isSubmitting = true;
      pendingUpdatePassword = null;

      return new Promise<SubmitPdfPasswordResult>((resolve) => {
        waiter = { mode: "unlock", resolve };
        try {
          updatePassword(password);
        } catch (err) {
          if (waiter?.mode === "unlock") {
            waiter = null;
            isSubmitting = false;
            const classified = classifyPdfLoadError(err, passwordResponses);
            resolve({
              status: "error",
              category: classified.category,
              message: classified.message,
            });
          }
        }
      });
    },
    async destroy(): Promise<void> {
      if (isDestroyed) return;
      isDestroyed = true;

      const pendingCb = pendingUpdatePassword;
      pendingUpdatePassword = null;

      if (waiter?.mode === "unlock") {
        const active = waiter;
        waiter = null;
        isSubmitting = false;
        active.resolve({ status: "cancelled" });
      } else if (waiter?.mode === "initial") {
        const active = waiter;
        waiter = null;
        active.reject(new PdfProcessingError("processing-error", "PDF loading cancelled."));
      }

      if (pendingCb) {
        try {
          pendingCb(new Error("PDF loading cancelled."));
        } catch {
          // Ignore cancellation callback errors
        }
      }

      try {
        await loadingTask?.destroy?.();
      } catch {
        // Ignore worker teardown errors
      }

      if (preloadedDoc) {
        const doc = preloadedDoc;
        preloadedDoc = null;
        try {
          await doc.destroy?.();
        } catch {
          // Ignore document teardown errors
        }
      }
    },
  };

  const initialPromise = new Promise<OpenPdfSessionResult>((resolve, reject) => {
    waiter = { mode: "initial", resolve, reject };
  });

  loadingTask = pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer),
    stopAtErrors: false,
  });

  loadingTask.onPassword = (updatePassword, reason) => {
    if (isDestroyed) {
      try {
        updatePassword(new Error("PDF loading cancelled."));
      } catch {
        // Ignore
      }
      return;
    }

    pendingUpdatePassword = updatePassword;

    if (waiter?.mode === "initial") {
      const active = waiter;
      waiter = null;
      active.resolve({ status: "password-required", session });
      return;
    }

    if (waiter?.mode === "unlock") {
      const active = waiter;
      waiter = null;
      isSubmitting = false;
      if (reason === passwordResponses.INCORRECT_PASSWORD || reason === passwordResponses.NEED_PASSWORD) {
        active.resolve({
          status: "incorrect-password",
          message: "Incorrect password. Please try again.",
        });
      }
    }
  };

  loadingTask.promise.then(
    (pdfDoc) => {
      isSettled = true;
      preloadedDoc = pdfDoc;
      pendingUpdatePassword = null;

      if (isDestroyed) {
        preloadedDoc = null;
        void pdfDoc.destroy?.();
        if (waiter?.mode === "unlock") {
          const active = waiter;
          waiter = null;
          isSubmitting = false;
          active.resolve({ status: "cancelled" });
        }
        return;
      }

      if (waiter?.mode === "initial") {
        const active = waiter;
        waiter = null;
        active.resolve({
          status: "loaded",
          pdfDoc,
          pageCount: pdfDoc.numPages,
        });
        return;
      }

      if (waiter?.mode === "unlock") {
        const active = waiter;
        waiter = null;
        isSubmitting = false;
        active.resolve({
          status: "unlocked",
          pdfDoc,
          pageCount: pdfDoc.numPages,
        });
      }
    },
    (err) => {
      isSettled = true;
      preloadError = err;
      pendingUpdatePassword = null;

      if (isDestroyed) {
        if (waiter?.mode === "initial") {
          const active = waiter;
          waiter = null;
          active.reject(err);
        } else if (waiter?.mode === "unlock") {
          const active = waiter;
          waiter = null;
          isSubmitting = false;
          active.resolve({ status: "cancelled" });
        }
        return;
      }

      const classified = classifyPdfLoadError(err, passwordResponses);

      if (waiter?.mode === "initial") {
        const active = waiter;
        waiter = null;
        active.reject(new PdfProcessingError(classified.category, classified.message));
        return;
      }

      if (waiter?.mode === "unlock") {
        const active = waiter;
        waiter = null;
        isSubmitting = false;
        if (classified.category === "incorrect-password") {
          active.resolve({
            status: "incorrect-password",
            message: "Incorrect password. Please try again.",
          });
        } else {
          active.resolve({
            status: "error",
            category: classified.category,
            message: classified.message,
          });
        }
      }
    }
  );

  return initialPromise;
}

/**
 * Renders a specified page from an already-loaded PDF.js document proxy to an image Blob.
 */
export async function renderPdfDocumentPageToBlob(
  pdfDoc: PdfJsDocumentProxy,
  pageNumber: number = 1,
  scale: number = 2.0 // 2.0 scale provides crisp rendering for cards & high DPI text
): Promise<{ blob: Blob; width: number; height: number; pageNumber: number }> {
  if (typeof document === "undefined") {
    throw new Error("Client browser environment required for PDF rendering.");
  }

  const totalPages = Math.max(1, pdfDoc.numPages || 1);
  const safePageNum = Math.min(Math.max(1, pageNumber), totalPages);
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
          pageNumber: safePageNum,
        });
      },
      "image/png",
      1.0
    );
  });
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

  const sessionResult = await openPdfDocumentSession(file);
  if (sessionResult.status === "password-required") {
    await sessionResult.session.destroy();
    throw new PdfProcessingError(
      "password-required",
      "This document requires a password before it can be processed."
    );
  }

  try {
    const rendered = await renderPdfDocumentPageToBlob(
      sessionResult.pdfDoc,
      pageNumber,
      scale
    );
    return {
      blob: rendered.blob,
      width: rendered.width,
      height: rendered.height,
    };
  } finally {
    await sessionResult.pdfDoc.destroy?.();
  }
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
    const sessionResult = await openPdfDocumentSession(file);
    if (sessionResult.status === "password-required") {
      await sessionResult.session.destroy();
      throw new PdfProcessingError(
        "password-required",
        "This document requires a password before it can be processed."
      );
    }

    try {
      const rendered = await renderPdfDocumentPageToBlob(
        sessionResult.pdfDoc,
        pageNumber
      );
      const previewUrl = URL.createObjectURL(rendered.blob);

      return {
        file,
        fileType: "pdf",
        previewUrl,
        dimensions: {
          width: rendered.width,
          height: rendered.height,
          aspectRatio: rendered.width / rendered.height,
        },
        fileSizeFormatted,
        fileName,
        pageCount: sessionResult.pageCount,
        currentPage: rendered.pageNumber,
      };
    } finally {
      await sessionResult.pdfDoc.destroy?.();
    }
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
