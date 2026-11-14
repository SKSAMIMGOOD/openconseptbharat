import type { SheetOrientation, SheetPaperSize } from "../../types/photo-sheet.ts";
import { createTrackedObjectURL, revokeObjectUrlSafely } from "../utils/memory.ts";

export const PHOTO_STUDIO_PRINT_STYLE_ID = "photo-studio-print-page-style";
export const PHOTO_STUDIO_PRINT_SCOPE_CLASS = "photo-studio-print-scope";

export interface SheetPageGeometryCss {
  pageSizeCss: string;
  widthCss: string;
  heightCss: string;
  dimensionsLabel: string;
  paperLabel: string;
}

export interface TrackedPdfPrintEntry {
  url: string;
  viewerWindow: { closed?: boolean } | null;
}

export interface OpenPdfViewerResult {
  opened: boolean;
  pdfUrl: string;
  viewerWindow: Window | null;
  reason?: "UNSUPPORTED_ENV" | "POPUP_BLOCKED" | "OPEN_ERROR";
}

export interface OpenPdfViewerOptions {
  createUrl?: (blob: Blob) => string;
  openWindow?: (url: string, target: string) => Window | null;
}

/**
 * Resolves calibrated @page and physical .print-page CSS dimensions for Photo Studio.
 */
export function resolvePhotoStudioPageGeometry(
  paperSize: SheetPaperSize,
  orientation: SheetOrientation
): SheetPageGeometryCss {
  const isA4 = paperSize === "a4";
  const isLandscape = orientation === "landscape";

  if (isA4) {
    return {
      pageSizeCss: isLandscape ? "A4 landscape" : "A4 portrait",
      widthCss: isLandscape ? "297mm" : "210mm",
      heightCss: isLandscape ? "210mm" : "297mm",
      dimensionsLabel: isLandscape ? "297 × 210 mm" : "210 × 297 mm",
      paperLabel: isLandscape ? "A4 Landscape (297 × 210 mm)" : "A4 Portrait (210 × 297 mm)",
    };
  }

  return {
    pageSizeCss: isLandscape ? "6in 4in" : "4in 6in",
    widthCss: isLandscape ? "6in" : "4in",
    heightCss: isLandscape ? "4in" : "6in",
    dimensionsLabel: isLandscape ? "6 × 4 inches" : "4 × 6 inches",
    paperLabel: isLandscape ? "4×6 Landscape (6 × 4 in)" : "4×6 Portrait (4 × 6 in)",
  };
}

/**
 * Opens a calibrated PDF Blob in a visible browser tab or window so the user
 * can print directly through the browser's native PDF viewer.
 *
 * Intentionally omits `"noopener"` in window features so the return value can
 * reliably detect popup blocking (`null`), then clears `opener` defensively.
 */
export function openPdfInPrintViewer(
  pdfBlob: Blob,
  options: OpenPdfViewerOptions = {}
): OpenPdfViewerResult {
  const createUrl = options.createUrl ?? createTrackedObjectURL;
  const openWindow =
    options.openWindow ??
    (typeof window !== "undefined" ? (url, target) => window.open(url, target) : undefined);

  const pdfUrl = createUrl(pdfBlob);

  if (!openWindow || !pdfUrl) {
    return {
      opened: false,
      pdfUrl,
      viewerWindow: null,
      reason: "UNSUPPORTED_ENV",
    };
  }

  try {
    const viewerWindow = openWindow(pdfUrl, "_blank");
    if (!viewerWindow || viewerWindow.closed) {
      return {
        opened: false,
        pdfUrl,
        viewerWindow: null,
        reason: "POPUP_BLOCKED",
      };
    }

    try {
      // Sever opener access without passing `"noopener"` (which hides blocked popups)
      viewerWindow.opener = null;
    } catch {
      // Ignore cross-context or read-only opener errors
    }

    try {
      viewerWindow.focus?.();
    } catch {
      // Ignore focus restrictions
    }

    return {
      opened: true,
      pdfUrl,
      viewerWindow,
    };
  } catch {
    return {
      opened: false,
      pdfUrl,
      viewerWindow: null,
      reason: "OPEN_ERROR",
    };
  }
}

/**
 * Revokes only PDF blob URLs whose viewer tab has closed (or that were never opened),
 * preserving active URLs so open PDF viewer tabs never break during printing or reload.
 */
export function cleanupClosedPdfPrintEntries(
  entries: TrackedPdfPrintEntry[],
  preserveUrl?: string | null,
  revokeUrl: (url: string) => void = revokeObjectUrlSafely
): TrackedPdfPrintEntry[] {
  const stillActive: TrackedPdfPrintEntry[] = [];

  for (const entry of entries) {
    if (preserveUrl && entry.url === preserveUrl) {
      stillActive.push(entry);
      continue;
    }

    if (entry.viewerWindow && entry.viewerWindow.closed === false) {
      stillActive.push(entry);
      continue;
    }

    revokeUrl(entry.url);
  }

  return stillActive;
}

/**
 * Unconditionally revokes all tracked PDF print URLs (used on workspace unmount).
 */
export function cleanupAllPdfPrintEntries(
  entries: TrackedPdfPrintEntry[],
  revokeUrl: (url: string) => void = revokeObjectUrlSafely
): void {
  for (const entry of entries) {
    revokeUrl(entry.url);
  }
}

/**
 * Injects or updates a scoped <style> element setting exact @page dimensions
 * without modifying physical photo sizing or adding page margins.
 */
export function injectScopedPrintPageStyle(
  pageSizeCss: string,
  styleId: string = PHOTO_STUDIO_PRINT_STYLE_ID,
  doc: Document | undefined = typeof document !== "undefined" ? document : undefined
): HTMLStyleElement | null {
  if (!doc || !doc.head) return null;

  let styleEl = doc.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = doc.createElement("style");
    styleEl.id = styleId;
    doc.head.appendChild(styleEl);
  }
  styleEl.textContent = `@page { size: ${pageSizeCss}; margin: 0 !important; }`;
  return styleEl;
}

/**
 * Removes a scoped @page <style> element so stale rules cannot leak into other tools.
 */
export function removeScopedPrintPageStyle(
  styleId: string = PHOTO_STUDIO_PRINT_STYLE_ID,
  doc: Document | undefined = typeof document !== "undefined" ? document : undefined
): void {
  if (!doc) return;
  const styleEl = doc.getElementById(styleId);
  if (styleEl && styleEl.parentNode) {
    styleEl.parentNode.removeChild(styleEl);
  }
}

/**
 * Yields to the next animation frame (falls back to microtask/timer outside DOM).
 */
export function nextAnimationFrame(): Promise<void> {
  if (typeof requestAnimationFrame === "function") {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }
  return new Promise((resolve) => setTimeout(resolve, 16));
}

export interface ImageLikeForPrint {
  src?: string;
  complete: boolean;
  naturalWidth?: number;
  decode?: () => Promise<void>;
  addEventListener: (type: "load" | "error", listener: () => void, opts?: { once: boolean }) => void;
}

export interface PrintContainerLike {
  querySelectorAll: (selector: "img") => ArrayLike<ImageLikeForPrint>;
}

export interface WaitForPrintImagesOptions {
  expectedCount: number;
  getContainer: () => PrintContainerLike | null;
  waitFrame?: () => Promise<void>;
  timeoutMs?: number;
  now?: () => number;
}

/**
 * Waits deterministically until the print container mounts the expected number
 * of <img> elements, each completes loading, and each finishes async bitmap decoding.
 * Replaces arbitrary fixed 300ms timeouts for HTML print fallback reliability.
 */
export async function waitForPrintImagesReady(
  options: WaitForPrintImagesOptions
): Promise<void> {
  const {
    expectedCount,
    getContainer,
    waitFrame = nextAnimationFrame,
    timeoutMs = 15000,
    now = () => Date.now(),
  } = options;

  if (expectedCount <= 0) {
    throw new Error("No printable sheet pages were queued for rendering.");
  }

  const deadline = now() + timeoutMs;

  // 1. Wait until React commits the portal container and all expected <img> nodes have src set
  let imgs: ImageLikeForPrint[] = [];
  while (now() <= deadline) {
    const container = getContainer();
    if (container) {
      const nodeList = container.querySelectorAll("img");
      if (nodeList.length >= expectedCount) {
        const candidate = Array.from({ length: expectedCount }, (_, idx) => nodeList[idx]);
        if (candidate.every((img) => Boolean(img && img.src))) {
          imgs = candidate;
          break;
        }
      }
    }
    await waitFrame();
  }

  if (imgs.length < expectedCount) {
    throw new Error("Timed out waiting for printable sheet elements to mount.");
  }

  // 2. Await load completion + decode() for every sheet image in parallel
  await Promise.all(
    imgs.map(async (img) => {
      if (!img.complete) {
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error("Timed out waiting for printable sheet image to load."));
          }, Math.max(100, deadline - now()));

          img.addEventListener(
            "load",
            () => {
              clearTimeout(timer);
              resolve();
            },
            { once: true }
          );
          img.addEventListener(
            "error",
            () => {
              clearTimeout(timer);
              reject(new Error("Failed to load printable sheet image into print container."));
            },
            { once: true }
          );
        });
      }

      if (img.naturalWidth === 0) {
        throw new Error("Printable sheet image loaded with zero width.");
      }

      if (typeof img.decode === "function") {
        try {
          await img.decode();
        } catch {
          // Some engines/mocks reject decode() on already-painted data or synthetic images;
          // if complete && naturalWidth > 0, proceed cleanly.
          if (!img.complete || img.naturalWidth === 0) {
            throw new Error("Failed to decode printable sheet image.");
          }
        }
      }
    })
  );

  // 3. Flush two frames so modal teardown & newly decoded bitmaps settle before printing
  await waitFrame();
  await waitFrame();
}
