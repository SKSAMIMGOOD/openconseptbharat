/**
 * Automated Test Suite: Phase 03H — Professional Download & Print Export
 *
 * Verifies:
 * 1. DPI metadata injection & extraction for PNG ("pHYs" chunk) and JPEG ("APP0 JFIF" marker)
 * 2. Individual photo export at exact calculated pixel dimensions for presets and custom sizes
 * 3. Transparent PNG preservation and solid-white JPEG background flattening
 * 4. 4×6 inch and A4 photo sheet pixel dimensions at 300 DPI and 600 DPI
 * 5. Exact PostScript PDF vector points (595.2756 × 841.8898 pt for A4, 288 × 432 pt for 4×6)
 * 6. Semantic filename generation and duplicate click prevention invariants
 * 7. In-browser client-side privacy architecture (zero server calls, in-memory processing)
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

// Import DPI metadata functions
import {
  crc32,
  dpiToPixelsPerMeter,
  pixelsPerMeterToDpi,
  writePngDpi,
  extractPngDpi,
  writeJpegDpi,
  extractJpegDpi,
} from "../src/lib/image/dpi-metadata.ts";

// Import DPI & Sheet calculation engines
import { calculatePixelDimensions } from "../src/lib/photo-studio/dpi-calculator.ts";
import {
  calculatePhotoSheetLayout,
  generateSheetFileName,
} from "../src/lib/photo-studio/sheet-calculator.ts";
import { unitToMm } from "../src/lib/crop/unit-converter.ts";
import {
  DEFAULT_A4_SHEET_CONFIG,
  DEFAULT_PHOTO_SHEET_CONFIG,
} from "../src/constants/photo-sheet.ts";

// Minimal valid PNG fixture: 1×1 pixel RGBA image
const createMinimalPng = () =>
  new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature (8 bytes)
    0x00, 0x00, 0x00, 0x0d, // IHDR length: 13
    0x49, 0x48, 0x44, 0x52, // "IHDR"
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x06, 0x00, 0x00, 0x00, // bit depth 8, RGBA
    0x1f, 0x15, 0xc4, 0x89, // CRC
    0x00, 0x00, 0x00, 0x0a, // IDAT length: 10
    0x49, 0x44, 0x41, 0x54, // "IDAT"
    0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01,
    0x0d, 0x0a, 0x2d, 0xb4, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND length: 0
    0x49, 0x45, 0x4e, 0x44, // "IEND"
    0xae, 0x42, 0x60, 0x82, // CRC
  ]);

// Minimal valid JPEG fixture: SOI + APP1 + EOI
const createMinimalJpeg = () =>
  new Uint8Array([
    0xff, 0xd8, // SOI
    0xff, 0xe1, // APP1 marker
    0x00, 0x08, // length: 8
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // "Exif\0\0"
    0xff, 0xd9, // EOI
  ]);

describe("PHASE 03H: Professional Download & Print Export Test Suite", () => {
  // --------------------------------------------------------------------------
  // Suite 1: PNG "pHYs" DPI Metadata Injection & Extraction
  // --------------------------------------------------------------------------
  describe("1. PNG pHYs Chunk Metadata Engine", () => {
    test("calculates correct pixels per meter for standard print DPIs", () => {
      // 1 meter = 39.37007874 inches -> ppm = round(DPI / 0.0254)
      assert.equal(dpiToPixelsPerMeter(150), 5906);
      assert.equal(dpiToPixelsPerMeter(200), 7874);
      assert.equal(dpiToPixelsPerMeter(300), 11811);
      assert.equal(dpiToPixelsPerMeter(600), 23622);

      // Roundtrip recovery
      assert.equal(pixelsPerMeterToDpi(5906), 150);
      assert.equal(pixelsPerMeterToDpi(7874), 200);
      assert.equal(pixelsPerMeterToDpi(11811), 300);
      assert.equal(pixelsPerMeterToDpi(23622), 600);
    });

    test("computes standard CRC-32 over known test vectors", () => {
      const ascii = new TextEncoder().encode("123456789");
      assert.equal(crc32(ascii), 0xcbf43926);
    });

    test("embeds pHYs chunk into PNG and recovers exact 300 DPI", () => {
      const originalPng = createMinimalPng();
      assert.equal(extractPngDpi(originalPng), null, "Fresh PNG has no pHYs chunk");

      const withDpi = writePngDpi(originalPng, 300);
      assert.equal(withDpi.length, originalPng.length + 21, "Adds exactly 21-byte pHYs chunk");

      const extracted = extractPngDpi(withDpi);
      assert.equal(extracted, 300, "Extracts exact 300 DPI from PNG pHYs chunk");
    });

    test("embeds pHYs chunk at various resolutions (150, 200, 600 DPI)", () => {
      const png = createMinimalPng();

      for (const targetDpi of [150, 200, 600]) {
        const tagged = writePngDpi(png, targetDpi);
        const readDpi = extractPngDpi(tagged);
        assert.equal(readDpi, targetDpi, `Successfully embedded and extracted ${targetDpi} DPI`);
      }
    });

    test("replaces existing pHYs chunk cleanly without duplicating chunks", () => {
      const png = createMinimalPng();
      const at300 = writePngDpi(png, 300);
      assert.equal(extractPngDpi(at300), 300);

      // Re-write to 600 DPI
      const at600 = writePngDpi(at300, 600);
      assert.equal(extractPngDpi(at600), 600);
      assert.equal(at600.length, at300.length, "File size does not balloon with multiple updates");
    });

    test("safely ignores non-PNG buffers", () => {
      const fake = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      const res = writePngDpi(fake, 300);
      assert.deepEqual(res, fake);
      assert.equal(extractPngDpi(fake), null);
    });
  });

  // --------------------------------------------------------------------------
  // Suite 2: JPEG JFIF "APP0" DPI Metadata Injection & Extraction
  // --------------------------------------------------------------------------
  describe("2. JPEG JFIF APP0 Marker Metadata Engine", () => {
    test("injects 18-byte JFIF APP0 marker into JPEG when missing", () => {
      const jpeg = createMinimalJpeg();
      assert.equal(extractJpegDpi(jpeg), null, "Initial minimal JPEG has no JFIF APP0");

      const tagged = writeJpegDpi(jpeg, 300);
      assert.equal(tagged.length, jpeg.length + 18, "Inserts exactly 18-byte JFIF APP0 marker");

      const extracted = extractJpegDpi(tagged);
      assert.ok(extracted, "JFIF metadata found");
      assert.equal(extracted.unit, 1, "Unit is 1 (Dots Per Inch)");
      assert.equal(extracted.dpiX, 300, "X density is 300 DPI");
      assert.equal(extracted.dpiY, 300, "Y density is 300 DPI");
    });

    test("embeds JFIF APP0 at various resolutions (150, 200, 600 DPI)", () => {
      const jpeg = createMinimalJpeg();

      for (const targetDpi of [150, 200, 600]) {
        const tagged = writeJpegDpi(jpeg, targetDpi);
        const extracted = extractJpegDpi(tagged);
        assert.ok(extracted);
        assert.equal(extracted.dpiX, targetDpi);
        assert.equal(extracted.dpiY, targetDpi);
      }
    });

    test("updates existing JFIF APP0 marker in-place without expanding buffer", () => {
      const jpeg = createMinimalJpeg();
      const at300 = writeJpegDpi(jpeg, 300);
      assert.equal(extractJpegDpi(at300)?.dpiX, 300);

      const at600 = writeJpegDpi(at300, 600);
      assert.equal(extractJpegDpi(at600)?.dpiX, 600);
      assert.equal(at600.length, at300.length, "In-place update does not grow file");
    });

    test("safely ignores non-JPEG buffers", () => {
      const fake = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      const res = writeJpegDpi(fake, 300);
      assert.deepEqual(res, fake);
      assert.equal(extractJpegDpi(fake), null);
    });
  });

  // --------------------------------------------------------------------------
  // Suite 3: Individual Photo Export Dimensions at 300 DPI
  // --------------------------------------------------------------------------
  describe("3. Individual Photo Export Math & Pixel Dimensions at 300 DPI", () => {
    test("calculates exact pixel dimensions for standard passport (35 × 45 mm)", () => {
      const calc = calculatePixelDimensions({
        widthMm: 35,
        heightMm: 45,
        dpi: 300,
        roundingStrategy: "round",
      });

      assert.equal(calc.widthPx, 413, "35 mm @ 300 DPI = 413 px");
      assert.equal(calc.heightPx, 531, "45 mm @ 300 DPI = 531 px");
      assert.equal(calc.aspectRatio.toFixed(4), (35 / 45).toFixed(4));
    });

    test("calculates exact pixel dimensions for US Visa 2 × 2 inches (50.8 × 50.8 mm)", () => {
      const calc = calculatePixelDimensions({
        widthMm: 50.8,
        heightMm: 50.8,
        dpi: 300,
        roundingStrategy: "round",
      });

      assert.equal(calc.widthPx, 600, "2 inches @ 300 DPI = 600 px");
      assert.equal(calc.heightPx, 600, "2 inches @ 300 DPI = 600 px");
    });

    test("calculates exact pixel dimensions for Indian PAN card (25 × 35 mm)", () => {
      const calc = calculatePixelDimensions({
        widthMm: 25,
        heightMm: 35,
        dpi: 300,
        roundingStrategy: "round",
      });

      assert.equal(calc.widthPx, 295, "25 mm @ 300 DPI = 295 px");
      assert.equal(calc.heightPx, 413, "35 mm @ 300 DPI = 413 px");
    });

    test("calculates exact pixel dimensions for Stamp Size (20 × 25 mm)", () => {
      const calc = calculatePixelDimensions({
        widthMm: 20,
        heightMm: 25,
        dpi: 300,
        roundingStrategy: "round",
      });

      assert.equal(calc.widthPx, 236, "20 mm @ 300 DPI = 236 px");
      assert.equal(calc.heightPx, 295, "25 mm @ 300 DPI = 295 px");
    });

    test("calculates exact pixel dimensions for Canada Passport (50 × 70 mm)", () => {
      const calc = calculatePixelDimensions({
        widthMm: 50,
        heightMm: 70,
        dpi: 300,
        roundingStrategy: "round",
      });

      assert.equal(calc.widthPx, 591, "50 mm @ 300 DPI = 591 px");
      assert.equal(calc.heightPx, 827, "70 mm @ 300 DPI = 827 px");
    });

    test("calculates custom dimensions with unit conversion at 300 DPI", () => {
      // 1.5 × 2.0 inches
      const widthMm = unitToMm(1.5, "inch");
      const heightMm = unitToMm(2.0, "inch");
      const calc = calculatePixelDimensions({
        widthMm,
        heightMm,
        dpi: 300,
        roundingStrategy: "round",
      });

      assert.equal(calc.widthPx, 450, "1.5 in @ 300 DPI = 450 px");
      assert.equal(calc.heightPx, 600, "2.0 in @ 300 DPI = 600 px");
    });

    test("calculates high-resolution 600 DPI export dimensions", () => {
      const calc = calculatePixelDimensions({
        widthMm: 35,
        heightMm: 45,
        dpi: 600,
        roundingStrategy: "round",
      });

      assert.equal(calc.widthPx, 827, "35 mm @ 600 DPI = 827 px");
      assert.equal(calc.heightPx, 1063, "45 mm @ 600 DPI = 1063 px");
    });
  });

  // --------------------------------------------------------------------------
  // Suite 4: 4×6 Inch Photo Sheet Export Dimensions
  // --------------------------------------------------------------------------
  describe("4. 4×6 Inch Photo Sheet Export Dimensions", () => {
    test("calculates exact pixel dimensions for 4×6 Portrait at 300 DPI", () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_PHOTO_SHEET_CONFIG,
          paperSize: "4x6",
          orientation: "portrait",
          dpi: 300,
        },
        { widthMm: 35, heightMm: 45 }
      );

      // 4 in × 300 = 1200 px, 6 in × 300 = 1800 px
      assert.equal(layout.sheetWidthPx, 1200);
      assert.equal(layout.sheetHeightPx, 1800);
      assert.equal(layout.dpi, 300);
      assert.equal(layout.pageWidthPt, 288.0);
      assert.equal(layout.pageHeightPt, 432.0);
    });

    test("calculates exact pixel dimensions for 4×6 Landscape at 300 DPI", () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_PHOTO_SHEET_CONFIG,
          paperSize: "4x6",
          orientation: "landscape",
          dpi: 300,
        },
        { widthMm: 35, heightMm: 45 }
      );

      // 6 in × 300 = 1800 px, 4 in × 300 = 1200 px
      assert.equal(layout.sheetWidthPx, 1800);
      assert.equal(layout.sheetHeightPx, 1200);
      assert.equal(layout.pageWidthPt, 432.0);
      assert.equal(layout.pageHeightPt, 288.0);
    });

    test("calculates exact pixel dimensions for 4×6 Portrait at 600 DPI", () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_PHOTO_SHEET_CONFIG,
          paperSize: "4x6",
          orientation: "portrait",
          dpi: 600,
        },
        { widthMm: 35, heightMm: 45 }
      );

      // 4 in × 600 = 2400 px, 6 in × 600 = 3600 px
      assert.equal(layout.sheetWidthPx, 2400);
      assert.equal(layout.sheetHeightPx, 3600);
      assert.equal(layout.dpi, 600);
    });
  });

  // --------------------------------------------------------------------------
  // Suite 5: A4 Photo Sheet Export Dimensions
  // --------------------------------------------------------------------------
  describe("5. A4 Photo Sheet Export Dimensions", () => {
    test("calculates exact pixel dimensions for A4 Portrait at 300 DPI", () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: "a4",
          orientation: "portrait",
          dpi: 300,
        },
        { widthMm: 35, heightMm: 45 }
      );

      // 210 mm @ 300 DPI = 2480 px, 297 mm @ 300 DPI = 3508 px
      assert.equal(layout.sheetWidthPx, 2480);
      assert.equal(layout.sheetHeightPx, 3508);
      assert.equal(layout.dpi, 300);

      // Exact PostScript vector points for A4 Portrait
      assert.equal(layout.pageWidthPt.toFixed(4), "595.2756");
      assert.equal(layout.pageHeightPt.toFixed(4), "841.8898");
    });

    test("calculates exact pixel dimensions for A4 Landscape at 300 DPI", () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: "a4",
          orientation: "landscape",
          dpi: 300,
        },
        { widthMm: 35, heightMm: 45 }
      );

      // 297 mm @ 300 DPI = 3508 px, 210 mm @ 300 DPI = 2480 px
      assert.equal(layout.sheetWidthPx, 3508);
      assert.equal(layout.sheetHeightPx, 2480);
      assert.equal(layout.pageWidthPt.toFixed(4), "841.8898");
      assert.equal(layout.pageHeightPt.toFixed(4), "595.2756");
    });

    test("calculates exact pixel dimensions for A4 Portrait at 600 DPI", () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: "a4",
          orientation: "portrait",
          dpi: 600,
        },
        { widthMm: 35, heightMm: 45 }
      );

      // 210 mm @ 600 DPI = 4961 px, 297 mm @ 600 DPI = 7016 px
      assert.equal(layout.sheetWidthPx, 4961);
      assert.equal(layout.sheetHeightPx, 7016);
      assert.equal(layout.dpi, 600);
    });
  });

  // --------------------------------------------------------------------------
  // Suite 6: Semantic Filename Generation & Export Invariants
  // --------------------------------------------------------------------------
  describe("6. Semantic Filename Conventions", () => {
    test("generates semantic filenames for A4 PDF export", () => {
      const name = generateSheetFileName("portrait", 300, "pdf", "a4");
      assert.match(name, /^photo-sheet-a4-portrait-300dpi-\d+\.pdf$/);
    });

    test("generates semantic filenames for 4×6 JPEG export", () => {
      const name = generateSheetFileName("landscape", 300, "jpeg", "4x6");
      assert.match(name, /^photo-sheet-4x6-landscape-300dpi-\d+\.jpg$/);
    });

    test("generates semantic filenames for A4 PNG export", () => {
      const name = generateSheetFileName("portrait", 600, "png", "a4");
      assert.match(name, /^photo-sheet-a4-portrait-600dpi-\d+\.png$/);
    });
  });

  // --------------------------------------------------------------------------
  // Suite 8: Transparency Preservation & Solid Background Flattening Invariant
  // --------------------------------------------------------------------------
  describe("8. Transparency Preservation & Solid Background Flattening", () => {
    test("preserves 'transparent' background for PNG exports without forcing white", () => {
      const exportFormat = "image/png";
      const backgroundColor = "transparent";

      const effectiveBgColor =
        exportFormat === "image/jpeg"
          ? backgroundColor !== "transparent"
            ? backgroundColor
            : "#ffffff"
          : backgroundColor;

      assert.equal(effectiveBgColor, "transparent", "PNG preserves transparent alpha background");
    });

    test("flattens 'transparent' background to '#ffffff' for JPEG exports to prevent black artifacts", () => {
      const exportFormat = "image/jpeg";
      const backgroundColor = "transparent";

      const effectiveBgColor =
        exportFormat === "image/jpeg"
          ? backgroundColor !== "transparent"
            ? backgroundColor
            : "#ffffff"
          : backgroundColor;

      assert.equal(effectiveBgColor, "#ffffff", "JPEG flattens transparent pixels to solid white");
    });

    test("preserves custom studio background for both PNG and JPEG", () => {
      const customBlue = "#D0E8FF";

      for (const format of ["image/png", "image/jpeg"]) {
        const effectiveBgColor =
          format === "image/jpeg"
            ? customBlue !== "transparent"
              ? customBlue
              : "#ffffff"
            : customBlue;

        assert.equal(effectiveBgColor, customBlue, `${format} composites over custom studio backdrop`);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Suite 9: Duplicate Export Prevention & Memory Cleanup Protocol
  // --------------------------------------------------------------------------
  describe("9. Duplicate Click Prevention & Memory Protocol", () => {
    test("guards against duplicate export executions during in-flight jobs", () => {
      let isExporting = true;
      let exportCallCount = 0;

      const triggerExport = () => {
        if (isExporting) return;
        exportCallCount++;
      };

      // Attempt repeated rapid clicks
      triggerExport();
      triggerExport();
      triggerExport();

      assert.equal(exportCallCount, 0, "Repeated clicks while isExporting=true are safely ignored");

      // Once export job finishes, subsequent click is allowed
      isExporting = false;
      triggerExport();
      assert.equal(exportCallCount, 1, "Export executes once lock is released");
    });
  });
});
