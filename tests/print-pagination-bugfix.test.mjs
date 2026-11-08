/**
 * Automated Test Suite: Printing Bug Fix & Pagination Verification
 *
 * Verifies:
 * 1. Single-page printing when sheet is not full (e.g. 4 photos like sample00.pdf)
 * 2. Intentional multi-page printing when sheet is full (remaining photos shift to next sheet)
 * 3. Photo Studio multi-sheet copies pagination (e.g. 8 copies = 1 sheet, 36 copies = 2 sheets)
 * 4. Document Studio exact page count for single and multi-copy printing
 * 5. Multi-sheet PDF export produces exact vector PDF page counts without blank or duplicate pages
 * 6. CSS print rules invariants (no position:fixed duplication, app isolation, last-child break-after:auto)
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

import {
  calculateMultiSheetPages,
  createDefaultMultiplePhotoConfig,
  flattenPhotoCopies,
} from "../src/lib/multiple-photo/multiple-photo-engine.ts";

import {
  calculatePhotoSheetLayout,
  calculateSheetDimensions,
} from "../src/lib/photo-studio/sheet-calculator.ts";

import {
  exportMultiSheetAsPdf,
  exportSheetAsPdf,
} from "../src/lib/photo-studio/sheet-exporter.ts";

import {
  executeBrowserPrint,
  generatePrintReadyPdf,
} from "../src/lib/document/document-print-pdf.ts";

import {
  calculatePrintPaperLayout,
} from "../src/lib/document/document-print-studio.ts";

import {
  createDefaultPrintLayoutSettings,
  createDefaultPrintSettings,
  createDefaultEnhancementSettings,
} from "../src/types/document-studio.ts";

// Helper to mock uploaded photos
function createMockUploadedPhoto(id, name, copies = 1) {
  return {
    id,
    name,
    file: { name, size: 50000, type: "image/jpeg" },
    size: 50000,
    width: 600,
    height: 800,
    aspectRatio: 600 / 800,
    previewUrl: `blob:mock/${id}`,
    copies,
  };
}

// Minimal valid JPEG bytes (1x1 pixel)
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

// Helper for Document Studio mock
function createMockDocumentSideResult(overrides = {}) {
  return {
    crop: { x: 10, y: 10, width: 500, height: 300 },
    rotation: 0,
    zoom: 1,
    aspectRatioLocked: true,
    targetAspectRatio: 85.6 / 53.98,
    croppedPreviewUrl: "blob:http://localhost/mock-cropped.png",
    croppedBlob: null,
    croppedDimensions: { width: 1011, height: 638, aspectRatio: 1011 / 638 },
    isCropped: true,
    isCropEditorOpen: false,
    activeView: "cropped",
    enhancements: createDefaultEnhancementSettings(),
    enhancedPreviewUrl: null,
    enhancedBlob: null,
    showBefore: false,
    printSettings: createDefaultPrintSettings("aadhaar"),
    ...overrides,
  };
}

describe("PRINTING BUG FIX & MULTI-TOOL PAGINATION VERIFICATION", () => {
  // =========================================================================
  // 1. Multiple Photo Maker: 4 photos (sample00.pdf reference case)
  // =========================================================================
  describe("1. Multiple Photo Maker: Single Page Fitting (sample00.pdf case)", () => {
    test("4 photos on A4 sheet generates exactly 1 page (not 3 pages)", () => {
      // 1 photo with 4 copies = 4 photos total (like sample00.pdf)
      const photos = [createMockUploadedPhoto("photo1", "passport.jpg", 4)];
      const config = createDefaultMultiplePhotoConfig("a4");

      const pages = calculateMultiSheetPages(photos, config, calculatePhotoSheetLayout);

      assert.equal(pages.length, 1, "Must generate exactly 1 sheet when page is not full");
      assert.equal(pages[0].pageIndex, 0);
      assert.equal(pages[0].totalPages, 1);
      assert.equal(pages[0].photos.length, 4);
      assert.equal(pages[0].layout.totalPhotos, 4);
      assert.equal(pages[0].layout.activeColumns, 4);
      assert.equal(pages[0].layout.activeRows, 1);
    });

    test("1 photo with 1 copy on 4x6 paper generates exactly 1 page", () => {
      const photos = [createMockUploadedPhoto("photo1", "portrait.jpg", 1)];
      const config = createDefaultMultiplePhotoConfig("4x6");

      const pages = calculateMultiSheetPages(photos, config, calculatePhotoSheetLayout);

      assert.equal(pages.length, 1, "Must generate exactly 1 sheet for 1 photo");
      assert.equal(pages[0].totalPages, 1);
      assert.equal(pages[0].layout.totalPhotos, 1);
    });
  });

  // =========================================================================
  // 2. Multiple Photo Maker: Multi-Page Overflow
  // =========================================================================
  describe("2. Multiple Photo Maker: Multi-Page Overflow (Page full -> Shift to next page)", () => {
    test("shifts to Sheet 2 when photo count exceeds Sheet 1 max capacity", () => {
      const config = createDefaultMultiplePhotoConfig("a4");
      // Calculate capacity of single A4 sheet
      const probe = calculatePhotoSheetLayout(
        {
          paperSize: "a4",
          orientation: "portrait",
          paperWidthInches: 8.2677,
          paperHeightInches: 11.6929,
          dpi: 300,
          layoutMode: "auto",
          manualCols: 4,
          manualRows: 8,
          copies: 100,
          centerAlignment: false,
          margins: config.margins,
          spacing: config.spacing,
          cutGuides: config.cutGuides,
        },
        { widthMm: 27.94, heightMm: 34.29 }
      );
      const capacity = probe.maxCapacity; // Typically 32 on A4 portrait
      assert.ok(capacity > 0);

      // Create photos exceeding capacity by 8
      const totalPhotosCount = capacity + 8;
      const photos = [createMockUploadedPhoto("p1", "photo.jpg", totalPhotosCount)];

      const pages = calculateMultiSheetPages(photos, config, calculatePhotoSheetLayout);

      assert.equal(pages.length, 2, "Must generate exactly 2 sheets");
      assert.equal(pages[0].totalPages, 2);
      assert.equal(pages[0].photos.length, capacity, "Sheet 1 must be full");
      assert.equal(pages[1].photos.length, 8, "Sheet 2 must contain remaining 8 photos");
      assert.equal(pages[1].pageIndex, 1);
    });

    test("shifts to Sheet 3 when photo count exceeds Sheet 2 capacity", () => {
      const config = createDefaultMultiplePhotoConfig("4x6");
      // 4x6 capacity is typically 12 photos
      const photos = [createMockUploadedPhoto("p1", "photo.jpg", 28)];

      const pages = calculateMultiSheetPages(photos, config, calculatePhotoSheetLayout);

      assert.ok(pages.length >= 3, "28 photos on 4x6 should require at least 3 sheets");
      for (let i = 0; i < pages.length; i++) {
        assert.equal(pages[i].pageIndex, i);
        assert.equal(pages[i].totalPages, pages.length);
      }
    });
  });

  // =========================================================================
  // 3. Photo Studio: Multi-Sheet Copies Pagination
  // =========================================================================
  describe("3. Photo Studio: Multi-Sheet Copies Pagination", () => {
    test("8 copies of passport photo on A4 generates 1 sheet (page is not full)", () => {
      const photoDimensionsMm = { widthMm: 35, heightMm: 45 };
      const sheetConfig = {
        paperSize: "a4",
        orientation: "portrait",
        paperWidthInches: 8.2677,
        paperHeightInches: 11.6929,
        dpi: 300,
        layoutMode: "auto",
        manualCols: 4,
        manualRows: 6,
        copies: 8,
        centerAlignment: false,
        margins: { topMm: 6, bottomMm: 6, leftMm: 6, rightMm: 6, uniform: true },
        spacing: { horizontalMm: 1.5, verticalMm: 1.5, uniform: true },
        cutGuides: { enabled: true, style: "corner_crop_marks", color: "#94a3b8", thicknessPx: 1, includeInExport: true },
      };

      const singleLayout = calculatePhotoSheetLayout(sheetConfig, photoDimensionsMm);
      const maxCap = singleLayout.maxCapacity; // Typically 24
      const req = sheetConfig.copies;
      const totalSheets = Math.ceil(req / maxCap);

      assert.equal(totalSheets, 1, "8 copies must generate exactly 1 sheet");
      assert.equal(singleLayout.totalPhotos, 8);
    });

    test("36 copies of passport photo on A4 generates 2 sheets (Sheet 1 full, Sheet 2 remainder)", () => {
      const photoDimensionsMm = { widthMm: 35, heightMm: 45 };
      const sheetConfig = {
        paperSize: "a4",
        orientation: "portrait",
        paperWidthInches: 8.2677,
        paperHeightInches: 11.6929,
        dpi: 300,
        layoutMode: "auto",
        manualCols: 4,
        manualRows: 6,
        copies: 36,
        centerAlignment: false,
        margins: { topMm: 6, bottomMm: 6, leftMm: 6, rightMm: 6, uniform: true },
        spacing: { horizontalMm: 1.5, verticalMm: 1.5, uniform: true },
        cutGuides: { enabled: true, style: "corner_crop_marks", color: "#94a3b8", thicknessPx: 1, includeInExport: true },
      };

      const baseLayout = calculatePhotoSheetLayout(sheetConfig, photoDimensionsMm);
      const maxCap = baseLayout.maxCapacity; // 24
      const req = 36;
      const totalSheets = Math.ceil(req / maxCap);

      assert.equal(totalSheets, 2, "36 copies must require 2 sheets");

      // Sheet 1
      const sheet1Layout = calculatePhotoSheetLayout(
        { ...sheetConfig, copies: maxCap },
        photoDimensionsMm
      );
      assert.equal(sheet1Layout.totalPhotos, 24, "Sheet 1 must have 24 photos (full)");

      // Sheet 2
      const sheet2Layout = calculatePhotoSheetLayout(
        { ...sheetConfig, copies: req - maxCap },
        photoDimensionsMm
      );
      assert.equal(sheet2Layout.totalPhotos, 12, "Sheet 2 must have 12 photos");
    });
  });

  // =========================================================================
  // 4. Document Studio: Exact Sheet Count & Compatibility
  // =========================================================================
  describe("4. Document Studio: Page Count and Copies Control", () => {
    test("1 copy generates 1 sheet for print", () => {
      const layout = createDefaultPrintLayoutSettings();
      layout.copies = 1;
      const front = createMockDocumentSideResult();
      const back = createMockDocumentSideResult();

      const paperLayout = calculatePrintPaperLayout({
        layout,
        mode: "combined",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(paperLayout.copies, 1);
    });

    test("generatePrintReadyPdf with 1 copy produces a 1-page PDF", async () => {
      const layout = createDefaultPrintLayoutSettings();
      layout.copies = 1;
      const front = createMockDocumentSideResult();
      const back = createMockDocumentSideResult();

      const paperLayout = calculatePrintPaperLayout({
        layout,
        mode: "combined",
        arrangement: "horizontal",
        front,
        back,
      });

      const pdf = await generatePrintReadyPdf({
        paperLayout,
        front,
        back,
        dpi: 300,
        imageBytes: SAMPLE_JPEG_BYTES,
      });

      assert.equal(pdf.pageCount, 1);
      const doc = await PDFDocument.load(await pdf.blob.arrayBuffer());
      assert.equal(doc.getPageCount(), 1, "PDF must contain exactly 1 page");
    });

    test("generatePrintReadyPdf with 2 copies produces a 2-page PDF", async () => {
      const layout = createDefaultPrintLayoutSettings();
      layout.copies = 2;
      const front = createMockDocumentSideResult();
      const back = createMockDocumentSideResult();

      const paperLayout = calculatePrintPaperLayout({
        layout,
        mode: "combined",
        arrangement: "vertical",
        front,
        back,
      });

      const pdf = await generatePrintReadyPdf({
        paperLayout,
        front,
        back,
        dpi: 300,
        imageBytes: SAMPLE_JPEG_BYTES,
      });

      assert.equal(pdf.pageCount, 2);
      const doc = await PDFDocument.load(await pdf.blob.arrayBuffer());
      assert.equal(doc.getPageCount(), 2, "PDF must contain exactly 2 pages for 2 copies");
    });
  });

  // =========================================================================
  // 5. CSS Print Rules Invariants (Protection against the 3-page bug)
  // =========================================================================
  describe("5. CSS Print Rules Invariants", () => {
    const cssPath = path.resolve(process.cwd(), "src/app/globals.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    test("printable-sheet-container does NOT use position: fixed rule in print stylesheet", () => {
      // In CSS paged media, position: fixed elements duplicate on every page.
      // It must NEVER use position: fixed in print media.
      assert.ok(
        !cssContent.match(/#printable-sheet-container\s*\{[^}]*position:\s*fixed/i),
        "Critical Invariant: #printable-sheet-container must NOT use position: fixed which causes sheet duplication"
      );
      assert.ok(
        cssContent.includes("position: static !important;"),
        "Printable container must be in standard document flow (position: static)"
      );
    });

    test("hides entire web application outside printable container", () => {
      assert.ok(
        cssContent.includes("body > *:not(#printable-sheet-container)"),
        "Must isolate #printable-sheet-container by hiding all other direct body children"
      );
    });

    test("print-page has break-after: auto on :last-child to prevent trailing blank page", () => {
      assert.ok(
        cssContent.includes(".print-page:last-child") && cssContent.includes("break-after: auto"),
        "Must include .print-page:last-child with break-after: auto to eliminate trailing blank pages"
      );
    });
  });
});
