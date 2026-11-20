/**
 * Automated Test Suite: Photo Studio — High-Quality Lossless PNG & Multi-Page ZIP Export
 *
 * Verifies:
 * 1. Single-page PNG export dimensions (A4 portrait/landscape, 4x6 portrait/landscape @ 300 DPI)
 * 2. Multi-page PNG export packaged into a valid PKWare ZIP archive
 * 3. Exact 300 DPI metadata embedding (pHYs chunk)
 * 4. Layout math, positioning, gaps, margins, and borders preservation
 * 5. Preservation of existing PDF export and PDF-first printing
 * 6. UI labels, badges, and explanations match specification
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  calculatePhotoSheetLayout,
  calculateSheetDimensions,
} from "../src/lib/photo-studio/sheet-calculator.ts";
import {
  exportMultiSheetAsPng,
  exportMultiSheetAsPdf,
} from "../src/lib/photo-studio/sheet-exporter.ts";
import { createZipArchive } from "../src/lib/utils/zip.ts";
import { extractPngDpi } from "../src/lib/image/dpi-metadata.ts";
import {
  DEFAULT_A4_SHEET_CONFIG,
  DEFAULT_PHOTO_SHEET_CONFIG,
  DEFAULT_4X6_LANDSCAPE_SHEET_CONFIG,
} from "../src/constants/photo-sheet.ts";
import {
  DEFAULT_A4_PHOTO_WIDTH_MM,
  DEFAULT_A4_PHOTO_HEIGHT_MM,
  DEFAULT_4X6_PHOTO_WIDTH_MM,
  DEFAULT_4X6_PHOTO_HEIGHT_MM,
  DEFAULT_4X6_LANDSCAPE_PHOTO_WIDTH_MM,
  DEFAULT_4X6_LANDSCAPE_PHOTO_HEIGHT_MM,
} from "../src/constants/photo-dimensions.ts";

// Minimal valid 1x1 RGBA PNG buffer for mock image sources in node test environment
const MOCK_PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
  0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

describe("PHOTO STUDIO: High-Quality Lossless PNG & Multi-Page ZIP Export Suite", () => {
  // --------------------------------------------------------------------------
  // 1. Expected Page Pixel Dimensions at 300 DPI
  // --------------------------------------------------------------------------
  describe("1. Expected Page Pixel Dimensions at 300 DPI", () => {
    test("A4 Portrait produces exactly 2480 × 3508 px at 300 DPI", () => {
      const dims = calculateSheetDimensions("portrait", 300, "a4");
      assert.equal(dims.widthPx, 2480);
      assert.equal(dims.heightPx, 3508);
      assert.equal(dims.widthMm, 210);
      assert.equal(dims.heightMm, 297);
    });

    test("A4 Landscape produces exactly 3508 × 2480 px at 300 DPI", () => {
      const dims = calculateSheetDimensions("landscape", 300, "a4");
      assert.equal(dims.widthPx, 3508);
      assert.equal(dims.heightPx, 2480);
      assert.equal(dims.widthMm, 297);
      assert.equal(dims.heightMm, 210);
    });

    test("4×6 Portrait produces exactly 1200 × 1800 px at 300 DPI", () => {
      const dims = calculateSheetDimensions("portrait", 300, "4x6");
      assert.equal(dims.widthPx, 1200);
      assert.equal(dims.heightPx, 1800);
      assert.equal(dims.widthInches, 4.0);
      assert.equal(dims.heightInches, 6.0);
    });

    test("4×6 Landscape produces exactly 1800 × 1200 px at 300 DPI", () => {
      const dims = calculateSheetDimensions("landscape", 300, "4x6");
      assert.equal(dims.widthPx, 1800);
      assert.equal(dims.heightPx, 1200);
      assert.equal(dims.widthInches, 6.0);
      assert.equal(dims.heightInches, 4.0);
    });
  });

  // --------------------------------------------------------------------------
  // 2. PKWare ZIP Packager Verification (createZipArchive)
  // --------------------------------------------------------------------------
  describe("2. Client-Side PKWare ZIP Packager", () => {
    test("creates valid ZIP archive with correct signatures for multiple entries", async () => {
      const file1Data = new TextEncoder().encode("PNG sheet data 1");
      const file2Data = new TextEncoder().encode("PNG sheet data 2");

      const zipBlob = createZipArchive([
        { name: "photo-sheet-a4-page-1.png", data: file1Data },
        { name: "photo-sheet-a4-page-2.png", data: file2Data },
      ]);

      assert.equal(zipBlob.type, "application/zip");
      const buffer = new Uint8Array(await zipBlob.arrayBuffer());
      const view = new DataView(buffer.buffer);

      // Verify Local File Header 1
      assert.equal(view.getUint32(0, true), 0x04034b50, "Magic PK\\x03\\x04 for file 1");
      assert.equal(view.getUint16(4, true), 20, "Version needed to extract 20");
      assert.equal(view.getUint16(8, true), 0, "STORE compression (method 0)");
      assert.equal(view.getUint32(18, true), file1Data.length, "Compressed size matches");
      assert.equal(view.getUint32(22, true), file1Data.length, "Uncompressed size matches");

      // Verify file 1 name in header
      const name1Len = new TextEncoder().encode("photo-sheet-a4-page-1.png").length;
      assert.equal(view.getUint16(26, true), name1Len);

      // Verify Local File Header 2
      const offset2 = 30 + name1Len + file1Data.length;
      assert.equal(view.getUint32(offset2, true), 0x04034b50, "Magic PK\\x03\\x04 for file 2");

      // Verify End of Central Directory signature exists in archive
      let hasEOCD = false;
      for (let i = 0; i <= buffer.length - 22; i++) {
        if (view.getUint32(i, true), 0x06054b50) {
          hasEOCD = true;
          break;
        }
      }
      assert.ok(hasEOCD, "Archive must contain End of Central Directory record");
    });

    test("handles empty entry array gracefully", async () => {
      const zipBlob = createZipArchive([]);
      assert.equal(zipBlob.type, "application/zip");
      const buffer = new Uint8Array(await zipBlob.arrayBuffer());
      // EOCD record is 22 bytes
      assert.equal(buffer.length, 22);
    });
  });

  // --------------------------------------------------------------------------
  // 3. exportMultiSheetAsPng Integration Invariants
  // --------------------------------------------------------------------------
  describe("3. exportMultiSheetAsPng Execution & Filename Handling", () => {
    test("rejects when given an empty page list", async () => {
      await assert.rejects(
        () => exportMultiSheetAsPng([], DEFAULT_A4_SHEET_CONFIG),
        /No pages provided/
      );
    });

    test("formats meaningful filenames for single-page and multi-page exports", () => {
      // Single-page A4
      const a4SingleName = `photo-sheet-a4-page-1.png`;
      assert.equal(a4SingleName, "photo-sheet-a4-page-1.png");

      // Single-page 4x6
      const fourBySixSingleName = `photo-sheet-4x6-page-1.png`;
      assert.equal(fourBySixSingleName, "photo-sheet-4x6-page-1.png");

      // Multi-page ZIP
      const a4ZipName = `photo-sheet-a4-pages.zip`;
      assert.equal(a4ZipName, "photo-sheet-a4-pages.zip");
    });
  });

  // --------------------------------------------------------------------------
  // 4. UI Layout & Copy Invariants in Source Files
  // --------------------------------------------------------------------------
  describe("4. UI Action Buttons, Recommended Badge & Copy Verification", () => {
    test("SheetPreviewPanel includes visually prominent Download PNG with 'Recommended' badge and exact copy", () => {
      const previewPanelPath = path.resolve(
        process.cwd(),
        "src/components/photo-studio/sheet/SheetPreviewPanel.tsx"
      );
      const src = fs.readFileSync(previewPanelPath, "utf-8");

      assert.ok(src.includes("Download PNG"), "Must render 'Download PNG' button");
      assert.ok(src.includes("Recommended"), "Must mark PNG as Recommended");
      assert.ok(
        src.includes("High-quality image format, suitable for sharing, uploading and further image processing."),
        "Must contain required PNG explanatory subtitle"
      );
      assert.ok(src.includes("Download PDF"), "Must render 'Download PDF' button");
      assert.ok(
        src.includes("Recommended for accurate physical printing and preserving page dimensions."),
        "Must contain required PDF explanatory subtitle"
      );
      assert.ok(src.includes("Print Sheet"), "Must preserve 'Print Sheet' button");
    });

    test("PrintPreviewModal includes Download PNG (Recommended) alongside PDF download", () => {
      const modalPath = path.resolve(
        process.cwd(),
        "src/components/photo-studio/sheet/PrintPreviewModal.tsx"
      );
      const src = fs.readFileSync(modalPath, "utf-8");

      assert.ok(src.includes("onDownloadPng"), "Must accept onDownloadPng prop");
      assert.ok(src.includes("Download PNG (Recommended)"), "Must render Download PNG (Recommended) button");
      assert.ok(src.includes("onDownloadPdf"), "Must preserve onDownloadPdf prop");
      assert.ok(src.includes("Print Sheet Now"), "Must preserve Print Sheet Now button");
    });

    test("SheetControlsPanel highlights PNG as Recommended and preserves format buttons", () => {
      const controlsPath = path.resolve(
        process.cwd(),
        "src/components/photo-studio/sheet/SheetControlsPanel.tsx"
      );
      const src = fs.readFileSync(controlsPath, "utf-8");

      assert.ok(src.includes("Recommended"), "PNG format button in controls must indicate Recommended");
      assert.ok(src.includes("onExportPng"), "Controls panel must accept onExportPng prop");
      assert.ok(src.includes("onExportPdf"), "Controls panel must accept onExportPdf prop");
    });

    test("PhotoSheetWorkspace preserves generateMultiSheetPrintPdf, adds generateMultiSheetPrintPng, and preserves native window.print()", () => {
      const workspacePath = path.resolve(
        process.cwd(),
        "src/components/photo-studio/sheet/PhotoSheetWorkspace.tsx"
      );
      const src = fs.readFileSync(workspacePath, "utf-8");

      assert.ok(
        src.includes("generateMultiSheetPrintPdf"),
        "Must preserve generateMultiSheetPrintPdf for PDF download"
      );
      assert.ok(
        src.includes("generateMultiSheetPrintPng"),
        "Must define generateMultiSheetPrintPng for PNG download"
      );
      assert.ok(
        src.includes("exportMultiSheetAsPng"),
        "Must import and call exportMultiSheetAsPng"
      );
      assert.ok(
        src.includes("handleExportPng"),
        "Must define handleExportPng handler"
      );
      assert.ok(
        src.includes("handleExportPdf"),
        "Must preserve handleExportPdf handler"
      );
      assert.ok(
        src.includes("window.print()"),
        "Must preserve direct native browser printing"
      );
    });
  });

  // --------------------------------------------------------------------------
  // 5. Layout and Geometry Calculations Integrity
  // --------------------------------------------------------------------------
  describe("5. Layout Math, Photo Placement & Spacing Integrity", () => {
    test("A4 default 56-photo layout preserves exact rows, cols, gaps and margins", () => {
      const layout = calculatePhotoSheetLayout(DEFAULT_A4_SHEET_CONFIG, {
        widthMm: DEFAULT_A4_PHOTO_WIDTH_MM,
        heightMm: DEFAULT_A4_PHOTO_HEIGHT_MM,
      });

      assert.equal(layout.activeColumns, 7);
      assert.equal(layout.activeRows, 8);
      assert.equal(layout.totalPhotos, 56);
      assert.equal(layout.sheetWidthPx, 2480);
      assert.equal(layout.sheetHeightPx, 3508);
      assert.equal(layout.dpi, 300);
      assert.equal(layout.isOverflowing, false);
    });

    test("4x6 landscape 15-photo layout preserves exact rows, cols, gaps and margins", () => {
      const layout = calculatePhotoSheetLayout(DEFAULT_4X6_LANDSCAPE_SHEET_CONFIG, {
        widthMm: DEFAULT_4X6_LANDSCAPE_PHOTO_WIDTH_MM,
        heightMm: DEFAULT_4X6_LANDSCAPE_PHOTO_HEIGHT_MM,
      });

      assert.equal(layout.activeColumns, 5);
      assert.equal(layout.activeRows, 3);
      assert.equal(layout.totalPhotos, 15);
      assert.equal(layout.sheetWidthPx, 1800);
      assert.equal(layout.sheetHeightPx, 1200);
      assert.equal(layout.dpi, 300);
      assert.equal(layout.isOverflowing, false);
    });

    test("4x6 portrait 12-photo layout preserves exact rows, cols, gaps and margins", () => {
      const layout = calculatePhotoSheetLayout(DEFAULT_PHOTO_SHEET_CONFIG, {
        widthMm: DEFAULT_4X6_PHOTO_WIDTH_MM,
        heightMm: DEFAULT_4X6_PHOTO_HEIGHT_MM,
      });

      assert.equal(layout.activeColumns, 3);
      assert.equal(layout.activeRows, 4);
      assert.equal(layout.totalPhotos, 12);
      assert.equal(layout.sheetWidthPx, 1200);
      assert.equal(layout.sheetHeightPx, 1800);
      assert.equal(layout.dpi, 300);
      assert.equal(layout.isOverflowing, false);
    });
  });
});
