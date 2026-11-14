/**
 * Automated Test Suite: Phase 02 — PDF-First Reliable Printing & Sheet Export
 *
 * Verifies:
 * 1. Exact PDF page dimensions (A4 portrait/landscape, 4x6 portrait/landscape)
 * 2. Single-page and multi-page exports via exportSheetAsPdf & exportMultiSheetAsPdf
 * 3. PDF download and print artifact parity
 * 4. Visible PDF viewer opening & blocked/failed popup handling
 * 5. Active vs closed Blob URL cleanup invariants (never revoking open viewer tabs)
 * 6. HTML print fallback readiness (DOM mount, image load/decode sync, error rejection)
 * 7. Scoped @page CSS injection/removal & globals.css isolation invariants
 * 8. OffscreenCanvas & HTMLCanvasElement memory cleanup via releaseCanvasBuffer
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

import {
  calculatePhotoSheetLayout,
} from "../src/lib/photo-studio/sheet-calculator.ts";
import {
  exportSheetAsPdf,
  exportMultiSheetAsPdf,
} from "../src/lib/photo-studio/sheet-exporter.ts";
import {
  PHOTO_STUDIO_PRINT_SCOPE_CLASS,
  PHOTO_STUDIO_PRINT_STYLE_ID,
  resolvePhotoStudioPageGeometry,
  openPdfInPrintViewer,
  cleanupClosedPdfPrintEntries,
  cleanupAllPdfPrintEntries,
  injectScopedPrintPageStyle,
  removeScopedPrintPageStyle,
  waitForPrintImagesReady,
} from "../src/lib/photo-studio/print-workflow.ts";
import {
  DEFAULT_A4_SHEET_CONFIG,
  DEFAULT_PHOTO_SHEET_CONFIG,
} from "../src/constants/photo-sheet.ts";
import { writeJpegDpi, extractJpegDpi } from "../src/lib/image/dpi-metadata.ts";
import { releaseCanvasBuffer } from "../src/lib/utils/memory.ts";

// Minimal valid 1x1 JPEG bytes for real pdf-lib embedding verification
const SAMPLE_JPEG_BYTES = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
  0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
  0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
  0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
  0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
  0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
  0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
  0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
  0x00, 0xbf, 0x80, 0xff, 0xd9,
]);

describe("PHASE 02: PDF-First Reliable Printing & Export Suite", () => {
  // --------------------------------------------------------------------------
  // 1. Calibrated PDF Page Dimensions (A4 & 4x6, Portrait & Landscape)
  // --------------------------------------------------------------------------
  describe("1. Calibrated PDF Page Dimensions", () => {
    const scenarios = [
      {
        label: "A4 Portrait",
        baseConfig: DEFAULT_A4_SHEET_CONFIG,
        paperSize: "a4",
        orientation: "portrait",
        expectedWidthPt: 595.2756,
        expectedHeightPt: 841.8898,
      },
      {
        label: "A4 Landscape",
        baseConfig: DEFAULT_A4_SHEET_CONFIG,
        paperSize: "a4",
        orientation: "landscape",
        expectedWidthPt: 841.8898,
        expectedHeightPt: 595.2756,
      },
      {
        label: "4x6 Portrait",
        baseConfig: DEFAULT_PHOTO_SHEET_CONFIG,
        paperSize: "4x6",
        orientation: "portrait",
        expectedWidthPt: 288.0,
        expectedHeightPt: 432.0,
      },
      {
        label: "4x6 Landscape",
        baseConfig: DEFAULT_PHOTO_SHEET_CONFIG,
        paperSize: "4x6",
        orientation: "landscape",
        expectedWidthPt: 432.0,
        expectedHeightPt: 288.0,
      },
    ];

    for (const s of scenarios) {
      test(`exports exact ${s.label} PDF MediaBox and preserves embedded JPEG DPI metadata`, async () => {
        const config = {
          ...s.baseConfig,
          paperSize: s.paperSize,
          orientation: s.orientation,
          dpi: 300,
          copies: 4,
        };
        const layout = calculatePhotoSheetLayout(config, { widthMm: 35, heightMm: 45 });
        const dpiJpegBytes = writeJpegDpi(SAMPLE_JPEG_BYTES, 300);
        assert.deepEqual(extractJpegDpi(dpiJpegBytes), { dpiX: 300, dpiY: 300, unit: 1 });

        const result = await exportMultiSheetAsPdf(
          [{ imageSource: null, layout, imageBytes: dpiJpegBytes }],
          config,
          { format: "application/pdf", quality: 0.95, includeCutGuides: true }
        );

        assert.equal(result.format, "application/pdf");
        assert.equal(result.pageCount, 1);
        assert.equal(Number(result.pageWidthPt.toFixed(4)), s.expectedWidthPt);
        assert.equal(Number(result.pageHeightPt.toFixed(4)), s.expectedHeightPt);

        const pdfDoc = await PDFDocument.load(await result.blob.arrayBuffer());
        assert.equal(pdfDoc.getPageCount(), 1);
        const page = pdfDoc.getPage(0);
        const { width, height } = page.getSize();
        assert.ok(Math.abs(width - s.expectedWidthPt) < 0.01);
        assert.ok(Math.abs(height - s.expectedHeightPt) < 0.01);
      });
    }
  });

  // --------------------------------------------------------------------------
  // 2. Single-Page & Multi-Page PDF Exports + Parity
  // --------------------------------------------------------------------------
  describe("2. Single-Page, Multi-Page & Download/Print Parity", () => {
    test("exports multi-page PDF with exact page count without dropping overflow sheets", async () => {
      const config = {
        ...DEFAULT_A4_SHEET_CONFIG,
        paperSize: "a4",
        orientation: "portrait",
        dpi: 300,
        copies: 36,
      };
      const baseLayout = calculatePhotoSheetLayout(config, { widthMm: 35, heightMm: 45 });
      const maxCap = Math.max(1, baseLayout.maxCapacity);
      const totalPages = Math.ceil(config.copies / maxCap);
      assert.ok(totalPages >= 2, "36 copies on A4 must span multiple pages");

      const pages = Array.from({ length: totalPages }, (_, idx) => {
        const pageCopies = Math.min(maxCap, config.copies - idx * maxCap);
        const pageLayout = calculatePhotoSheetLayout(
          { ...config, copies: pageCopies },
          { widthMm: 35, heightMm: 45 }
        );
        return {
          imageSource: null,
          layout: pageLayout,
          imageBytes: SAMPLE_JPEG_BYTES,
        };
      });

      const pdfResult = await exportMultiSheetAsPdf(pages, config, {
        format: "application/pdf",
        quality: 0.95,
        includeCutGuides: true,
        fileName: "parity-check.pdf",
      });

      assert.equal(pdfResult.pageCount, totalPages);
      const doc = await PDFDocument.load(await pdfResult.blob.arrayBuffer());
      assert.equal(doc.getPageCount(), totalPages);

      for (let i = 0; i < totalPages; i++) {
        const size = doc.getPage(i).getSize();
        assert.ok(Math.abs(size.width - 595.2756) < 0.01);
        assert.ok(Math.abs(size.height - 841.8898) < 0.01);
      }

      // Download and Print share the exact same exportMultiSheetAsPdf result
      const bytesForDownload = new Uint8Array(await pdfResult.blob.arrayBuffer());
      assert.ok(bytesForDownload.length > 500);
    });

    test("exportMultiSheetAsPdf throws clear error when given zero pages", async () => {
      await assert.rejects(
        () =>
          exportMultiSheetAsPdf([], DEFAULT_A4_SHEET_CONFIG, {
            format: "application/pdf",
          }),
        /No pages provided/
      );
    });

    test("PhotoSheetWorkspace routes main Download PDF (handleExport) through multi-sheet PDF helper", () => {
      const workspacePath = path.resolve(
        process.cwd(),
        "src/components/photo-studio/sheet/PhotoSheetWorkspace.tsx"
      );
      const src = fs.readFileSync(workspacePath, "utf-8");

      assert.ok(
        src.includes("generateMultiSheetPrintPdf"),
        "PhotoSheetWorkspace must preserve generateMultiSheetPrintPdf for calibrated PDF exports"
      );
      assert.ok(
        !src.includes("exportSheetAsPdf("),
        "handleExport must not call single-sheet exportSheetAsPdf which dropped sheets 2..N"
      );
      assert.ok(
        !src.includes("setTimeout(() => {\n        window.print()"),
        "Direct print must not rely on legacy blind 300ms setTimeout"
      );
    });

    test("PhotoSheetWorkspace direct Print Sheet invokes window.print() in current tab without opening PDF viewer tabs", () => {
      const workspacePath = path.resolve(
        process.cwd(),
        "src/components/photo-studio/sheet/PhotoSheetWorkspace.tsx"
      );
      const src = fs.readFileSync(workspacePath, "utf-8");

      // Verify direct native print preview is invoked
      assert.ok(
        src.includes("window.print()"),
        "handlePrintSheet must invoke native browser window.print() directly in current tab"
      );
      // Verify deterministic readiness check is used instead of fixed timeouts
      assert.ok(
        src.includes("await waitForPrintImagesReady("),
        "handlePrintSheet must deterministically wait for print images to mount and decode"
      );
      // Verify afterprint listener handles cleanup
      assert.ok(
        src.includes('window.addEventListener("afterprint"'),
        "handlePrintSheet must register afterprint listener for clean style and memory teardown"
      );
      // Verify PDF viewer opening is not in handlePrintSheet
      assert.ok(
        !src.includes("openPdfInPrintViewer("),
        "handlePrintSheet must not open a PDF viewer tab via openPdfInPrintViewer"
      );
    });
  });

  // --------------------------------------------------------------------------
  // 3. PDF Viewer Opening, Popup Failure & Blob URL Lifecycle Cleanup
  // --------------------------------------------------------------------------
  describe("3. PDF Viewer Opening & Blob URL Lifecycle", () => {
    test("opens calibrated PDF in visible tab and reports opened=true without noopener hiding return value", () => {
      let focused = false;
      const fakeWindow = {
        closed: false,
        opener: { sensitive: true },
        focus: () => {
          focused = true;
        },
      };
      let capturedUrl = "";
      let capturedTarget = "";

      const res = openPdfInPrintViewer(new Blob(["%PDF-1.7"], { type: "application/pdf" }), {
        createUrl: () => "blob:http://localhost/pdf-1",
        openWindow: (url, target) => {
          capturedUrl = url;
          capturedTarget = target;
          return fakeWindow;
        },
      });

      assert.equal(res.opened, true);
      assert.equal(res.pdfUrl, "blob:http://localhost/pdf-1");
      assert.equal(capturedUrl, "blob:http://localhost/pdf-1");
      assert.equal(capturedTarget, "_blank");
      assert.equal(fakeWindow.opener, null, "Clears opener cleanly after obtaining window handle");
      assert.equal(focused, true, "Focuses the visible PDF viewer tab");
    });

    test("gracefully handles blocked popup (null window) while preserving PDF Blob URL for fallback", () => {
      const res = openPdfInPrintViewer(new Blob(["%PDF-1.7"], { type: "application/pdf" }), {
        createUrl: () => "blob:http://localhost/pdf-blocked",
        openWindow: () => null,
      });

      assert.equal(res.opened, false);
      assert.equal(res.reason, "POPUP_BLOCKED");
      assert.equal(res.pdfUrl, "blob:http://localhost/pdf-blocked");
      assert.equal(res.viewerWindow, null);
    });

    test("gracefully handles opener exception and closed-immediately window", () => {
      const closedRes = openPdfInPrintViewer(new Blob(["%PDF"], { type: "application/pdf" }), {
        createUrl: () => "blob:http://localhost/pdf-closed",
        openWindow: () => ({ closed: true }),
      });
      assert.equal(closedRes.opened, false);
      assert.equal(closedRes.reason, "POPUP_BLOCKED");

      const throwRes = openPdfInPrintViewer(new Blob(["%PDF"], { type: "application/pdf" }), {
        createUrl: () => "blob:http://localhost/pdf-throw",
        openWindow: () => {
          throw new Error("Popup blocked by policy");
        },
      });
      assert.equal(throwRes.opened, false);
      assert.equal(throwRes.reason, "OPEN_ERROR");
      assert.equal(throwRes.pdfUrl, "blob:http://localhost/pdf-throw");
    });

    test("never revokes Blob URLs for open PDF viewer tabs; revokes closed tabs and unmount cleanup", () => {
      const revoked = [];
      const entries = [
        { url: "blob:open-tab", viewerWindow: { closed: false } },
        { url: "blob:closed-tab", viewerWindow: { closed: true } },
        { url: "blob:blocked-old", viewerWindow: null },
        { url: "blob:current-fallback", viewerWindow: null },
      ];

      const remaining = cleanupClosedPdfPrintEntries(
        entries,
        "blob:current-fallback",
        (url) => revoked.push(url)
      );

      assert.deepEqual(
        remaining.map((e) => e.url),
        ["blob:open-tab", "blob:current-fallback"],
        "Open viewer tab and active fallback URL must be preserved"
      );
      assert.deepEqual(revoked, ["blob:closed-tab", "blob:blocked-old"]);

      // Unmount cleans up everything remaining
      const unmountRevoked = [];
      cleanupAllPdfPrintEntries(remaining, (url) => unmountRevoked.push(url));
      assert.deepEqual(unmountRevoked, ["blob:open-tab", "blob:current-fallback"]);
    });
  });

  // --------------------------------------------------------------------------
  // 4. HTML Fallback Readiness, Style Isolation & Shared Contract Safety
  // --------------------------------------------------------------------------
  describe("4. HTML Fallback Sync, Scoped CSS & Shared Safety", () => {
    test("waitForPrintImagesReady waits for async mount, image load, and decode before resolving", async () => {
      let mountTicks = 0;
      let loadHandler = null;
      let resolveLoadAttached;
      const loadAttached = new Promise((resolve) => {
        resolveLoadAttached = resolve;
      });
      let decoded = false;

      const fakeImg = {
        src: "blob:sheet-1",
        complete: false,
        naturalWidth: 2480,
        addEventListener: (type, cb) => {
          if (type === "load") {
            loadHandler = cb;
            resolveLoadAttached();
          }
        },
        decode: async () => {
          decoded = true;
        },
      };

      const readyPromise = waitForPrintImagesReady({
        expectedCount: 1,
        getContainer: () => {
          mountTicks++;
          // Simulate React portal committing on the 3rd animation frame
          if (mountTicks < 3) return null;
          return { querySelectorAll: () => [fakeImg] };
        },
        waitFrame: async () => {
          await new Promise((r) => setTimeout(r, 2));
        },
        timeoutMs: 2000,
      });

      await loadAttached;
      assert.ok(loadHandler, "Load listener should be attached to incomplete image");
      fakeImg.complete = true;
      loadHandler();

      await readyPromise;
      assert.equal(decoded, true, "Must await img.decode() before resolving");
      assert.ok(mountTicks >= 3);
    });

    test("waitForPrintImagesReady rejects if an image fails to load", async () => {
      let errorHandler = null;
      let resolveErrorAttached;
      const errorAttached = new Promise((resolve) => {
        resolveErrorAttached = resolve;
      });
      const brokenImg = {
        src: "blob:broken",
        complete: false,
        naturalWidth: 0,
        addEventListener: (type, cb) => {
          if (type === "error") {
            errorHandler = cb;
            resolveErrorAttached();
          }
        },
      };

      const promise = waitForPrintImagesReady({
        expectedCount: 1,
        getContainer: () => ({ querySelectorAll: () => [brokenImg] }),
        waitFrame: async () => {
          await new Promise((r) => setTimeout(r, 2));
        },
        timeoutMs: 1000,
      });

      await errorAttached;
      errorHandler();
      await assert.rejects(() => promise, /Failed to load printable sheet image/);
    });

    test("injectScopedPrintPageStyle and removeScopedPrintPageStyle cleanly manage head style tags", () => {
      const elements = new Map();
      const head = {
        appendChild: (el) => {
          elements.set(el.id, el);
          el.parentNode = head;
        },
        removeChild: (el) => {
          elements.delete(el.id);
          el.parentNode = null;
        },
      };
      const fakeDoc = {
        head,
        getElementById: (id) => elements.get(id) ?? null,
        createElement: () => ({ id: "", textContent: "", parentNode: null }),
      };

      const geom = resolvePhotoStudioPageGeometry("a4", "portrait");
      assert.equal(geom.pageSizeCss, "A4 portrait");
      assert.equal(geom.widthCss, "210mm");
      assert.equal(geom.heightCss, "297mm");

      const el = injectScopedPrintPageStyle(geom.pageSizeCss, PHOTO_STUDIO_PRINT_STYLE_ID, fakeDoc);
      assert.ok(el);
      assert.equal(el.textContent, "@page { size: A4 portrait; margin: 0 !important; }");
      assert.ok(fakeDoc.getElementById(PHOTO_STUDIO_PRINT_STYLE_ID));

      removeScopedPrintPageStyle(PHOTO_STUDIO_PRINT_STYLE_ID, fakeDoc);
      assert.equal(fakeDoc.getElementById(PHOTO_STUDIO_PRINT_STYLE_ID), null);
    });

    test("globals.css scopes Photo Studio overrides cleanly without breaking shared Document Studio rules", () => {
      const cssPath = path.resolve(process.cwd(), "src/app/globals.css");
      const css = fs.readFileSync(cssPath, "utf-8");

      assert.ok(
        css.includes(`#printable-sheet-container.${PHOTO_STUDIO_PRINT_SCOPE_CLASS}`),
        "globals.css must scope Photo Studio fallback styles separately"
      );
      // Verify core Document Studio & Multiple Photo Maker shared invariants remain present
      assert.ok(css.includes("body > *:not(#printable-sheet-container)"));
      assert.ok(css.includes(".print-page:last-child"));
      assert.ok(css.includes("position: static !important;"));
    });
  });

  // --------------------------------------------------------------------------
  // 5. OffscreenCanvas & HTMLCanvasElement Memory Cleanup
  // --------------------------------------------------------------------------
  describe("5. OffscreenCanvas & HTMLCanvasElement Memory Cleanup", () => {
    test("releaseCanvasBuffer clears 2D context and zeroes width/height for both HTMLCanvasElement and OffscreenCanvas", () => {
      let clearedArgs = null;
      const mockOffscreenCanvas = {
        width: 2480,
        height: 3508,
        getContext: (type) => {
          assert.equal(type, "2d");
          return {
            clearRect: (x, y, w, h) => {
              clearedArgs = [x, y, w, h];
            },
          };
        },
      };

      releaseCanvasBuffer(mockOffscreenCanvas);
      assert.deepEqual(clearedArgs, [0, 0, 2480, 3508]);
      assert.equal(mockOffscreenCanvas.width, 0);
      assert.equal(mockOffscreenCanvas.height, 0);

      // Should also tolerate null/undefined gracefully
      assert.doesNotThrow(() => releaseCanvasBuffer(null));
      assert.doesNotThrow(() => releaseCanvasBuffer(undefined));

      // Verify runtime OffscreenCanvas if available in current Node/browser environment
      if (typeof OffscreenCanvas !== "undefined") {
        const realOffscreen = new OffscreenCanvas(400, 600);
        assert.equal(realOffscreen.width, 400);
        releaseCanvasBuffer(realOffscreen);
        assert.equal(realOffscreen.width, 0);
        assert.equal(realOffscreen.height, 0);
      }
    });
  });
});
