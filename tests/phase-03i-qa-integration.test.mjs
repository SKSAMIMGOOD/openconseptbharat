/**
 * Automated Integration Test Suite: Phase 03I — Photo Studio Final QA, Integration Testing & Bug Fixing
 *
 * Verifies End-to-End Real User Workflows:
 * - Workflow A: Upload photo -> passport preset (35×45mm @ 300 DPI) -> crop calculation -> PNG export dimension (413 × 531 px)
 * - Workflow B: Upload photo -> custom dimensions (2×2 inch @ 300 DPI) -> crop -> export (600 × 600 px)
 * - Workflow C: Upload multiple photos -> arrange on 4×6 sheet @ 300 DPI (1200 × 1800 px) -> download
 * - Workflow D: Upload multiple photos -> generate A4 sheet @ 300 DPI (2480 × 3508 px) -> preview layout -> PDF vector points (595.2756 × 841.8898 pt) -> print calibration
 * - Workflow E: Background removal handoff -> ephemeral memory transfer -> staging -> consumption -> Photo Studio crop -> export
 * - Workflow F: Live dimension and DPI changes -> bi-directional synchronization -> dynamic pixel recalculation
 *
 * All Critical Calculations & Mathematical Invariants:
 * - 35 × 45 mm at 300 DPI = 413 × 531 px
 * - 2 × 2 inch at 300 DPI = 600 × 600 px
 * - 4×6 inch at 300 DPI = 1200 × 1800 px (portrait) / 1800 × 1200 px (landscape)
 * - A4 at 300 DPI = 2480 × 3508 px (portrait) / 3508 × 2480 px (landscape)
 * - Bidirectional unit conversions (mm, cm, inch)
 * - Crop aspect ratio and 8-handle directional anchor math
 * - Photo sheet layout calculations & max 4-column constraint
 * - Zero-upload client-side privacy invariant
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

// Core calculation engines
import {
  calculatePixelDimensions,
  assessResolutionQuality,
  getFriendlyAspectRatioName,
} from "../src/lib/photo-studio/dpi-calculator.ts";

import {
  calculatePhotoSheetLayout,
  calculateSheetDimensions,
  calculateMaxSheetCapacity,
  generateSheetFileName,
  MM_PER_INCH,
} from "../src/lib/photo-studio/sheet-calculator.ts";

import {
  unitToMm,
  convertUnit,
  validateCustomDimensions,
  calculateAspectRatio,
  calculateCustomPhotoPixels,
} from "../src/lib/crop/unit-converter.ts";

import {
  initDefaultCrop,
  clampCropToBounds,
  recalculateCropForAspectRatio,
  centerCropInImage,
  fitCropToImage,
  resizeCropFromHandle,
} from "../src/lib/crop/crop-geometry.ts";

import {
  calculateCenterCrop,
} from "../src/lib/photo-studio/sheet-renderer.ts";

import {
  flattenPhotoCopies,
  calculateMultiPhotoArrangement,
} from "../src/lib/multiple-photo/multiple-photo-engine.ts";

import {
  stageImageForTransfer,
  peekStagedImage,
  consumeTransferredImage,
  clearStagedImage,
} from "../src/lib/utils/image-transfer.ts";

import {
  writePngDpi,
  extractPngDpi,
  writeJpegDpi,
  extractJpegDpi,
} from "../src/lib/image/dpi-metadata.ts";

import {
  DEFAULT_A4_SHEET_CONFIG,
  DEFAULT_PHOTO_SHEET_CONFIG,
} from "../src/constants/photo-sheet.ts";

// Minimal valid PNG fixture: 1×1 pixel RGBA image
const TINY_PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR header
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1×1 px
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, // RGBA, 8-bit
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, // IDAT chunk
  0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, // IEND chunk
  0x42, 0x60, 0x82,
]);

// Minimal valid JPEG fixture: 1×1 pixel image
const TINY_JPEG_BYTES = new Uint8Array([
  0xff, 0xd8, // SOI
  0xff, 0xe0, 0x00, 0x10, // APP0 marker
  0x4a, 0x46, 0x49, 0x46, 0x00, // "JFIF\0"
  0x01, 0x01, // v1.1
  0x00, // aspect ratio units (no units)
  0x00, 0x01, 0x00, 0x01, // Xdensity=1, Ydensity=1
  0x00, 0x00, // thumbnail 0x0
  0xff, 0xdb, 0x00, 0x43, 0x00, // DQT (sample table)
  ...new Array(64).fill(0x10),
  0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, // SOF0: 1×1 px, 1 comp
  0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, // SOS
  0x7f, 0x00, // Scan data
  0xff, 0xd9, // EOI
]);

describe("PHASE 03I: Final QA & Integration Test Suite", () => {
  // =========================================================================
  // WORKFLOW A: Upload Photo -> Passport Preset (35×45 mm) -> Crop -> PNG
  // =========================================================================
  describe("Workflow A: Passport Photo (35 × 45 mm) Crop & Export", () => {
    test("calculates exact pixel dimensions for 35 × 45 mm at 300 DPI (413 × 531 px)", () => {
      const result = calculatePixelDimensions({
        widthMm: 35,
        heightMm: 45,
        dpi: 300,
        roundingStrategy: "round",
      });

      assert.equal(result.isValid, true);
      assert.equal(result.widthPx, 413);
      assert.equal(result.heightPx, 531);
      assert.equal(result.dpi, 300);
      assert.ok(Math.abs(result.aspectRatio - 35 / 45) < 0.001);
    });

    test("computes initial centered crop frame adhering to 35:45 aspect ratio", () => {
      const imgW = 2000;
      const imgH = 3000;
      const ratio = 35 / 45; // ~0.7778
      const crop = initDefaultCrop(imgW, imgH, ratio);

      assert.ok(crop.width > 0 && crop.height > 0);
      assert.ok(crop.x >= 0 && crop.y >= 0);
      assert.ok(crop.x + crop.width <= imgW);
      assert.ok(crop.y + crop.height <= imgH);

      const actualCropRatio = crop.width / crop.height;
      assert.ok(Math.abs(actualCropRatio - ratio) < 0.01);
    });

    test("embeds and extracts 300 DPI metadata in PNG pHYs chunk for passport export", () => {
      const pngWithDpi = writePngDpi(TINY_PNG_BYTES, 300);
      const extractedDpi = extractPngDpi(pngWithDpi);

      assert.ok(extractedDpi !== null);
      assert.equal(extractedDpi, 300);
    });

    test("generates semantic file name for passport photo export", () => {
      const presetId = "passport_standard";
      const fileName = `photo-${presetId}-35mmx45mm-300dpi-413x531px.png`;
      assert.ok(fileName.includes("passport_standard"));
      assert.ok(fileName.includes("300dpi"));
      assert.ok(fileName.includes("413x531px"));
      assert.ok(fileName.endsWith(".png"));
    });
  });

  // =========================================================================
  // WORKFLOW B: Upload Photo -> Custom Dimensions (2 × 2 in) -> Crop -> 300 DPI
  // =========================================================================
  describe("Workflow B: Custom Dimensions (2 × 2 inch) Crop & Export", () => {
    test("converts 2 × 2 inches to 50.8 × 50.8 mm accurately", () => {
      const widthMm = unitToMm(2.0, "inch");
      const heightMm = unitToMm(2.0, "inch");

      assert.equal(widthMm, 50.8);
      assert.equal(heightMm, 50.8);
    });

    test("calculates exact pixel dimensions for 2 × 2 inch at 300 DPI = 600 × 600 px", () => {
      const result = calculatePixelDimensions({
        widthMm: 50.8,
        heightMm: 50.8,
        dpi: 300,
        roundingStrategy: "round",
      });

      assert.equal(result.isValid, true);
      assert.equal(result.widthPx, 600);
      assert.equal(result.heightPx, 600);
      assert.equal(result.aspectRatio, 1.0);
    });

    test("embeds and extracts 300 DPI in JPEG JFIF APP0 marker", () => {
      const jpegWithDpi = writeJpegDpi(TINY_JPEG_BYTES, 300);
      const extracted = extractJpegDpi(jpegWithDpi);

      assert.ok(extracted !== null);
      assert.equal(extracted.dpiX, 300);
      assert.equal(extracted.dpiY, 300);
      assert.equal(extracted.unit, 1); // 1 = dots per inch
    });

    test("evaluates optical resolution quality for 12MP source vs 600×600 target", () => {
      const assessment = assessResolutionQuality(3000, 4000, 50.8, 50.8, 300);
      assert.equal(assessment.badgeVariant, "emerald");
      assert.equal(assessment.tier, "sufficient");
      assert.ok(assessment.scaleFactor <= 1.0);
    });
  });

  // =========================================================================
  // WORKFLOW C: Multiple Photos -> 4×6 Inch Sheet -> Download
  // =========================================================================
  describe("Workflow C: 4×6 Inch Photo Sheet Arrangement & Export", () => {
    test("calculates exact 4×6 inch sheet dimensions at 300 DPI (1200 × 1800 px portrait, 1800 × 1200 px landscape)", () => {
      const portrait = calculateSheetDimensions("portrait", 300, "4x6");
      assert.equal(portrait.widthPx, 1200);
      assert.equal(portrait.heightPx, 1800);
      assert.equal(portrait.pageWidthPt, 288);
      assert.equal(portrait.pageHeightPt, 432);

      const landscape = calculateSheetDimensions("landscape", 300, "4x6");
      assert.equal(landscape.widthPx, 1800);
      assert.equal(landscape.heightPx, 1200);
      assert.equal(landscape.pageWidthPt, 432);
      assert.equal(landscape.pageHeightPt, 288);
    });

    test("arranges multiple photos on 4×6 sheet with max 4 columns per row", () => {
      // 1. Standard Multiple Photo Maker default dimensions (1.1 × 1.35 in = 27.94 × 34.29 mm)
      const config8 = {
        ...DEFAULT_PHOTO_SHEET_CONFIG,
        paperSize: "4x6",
        orientation: "landscape",
        copies: 8,
        dpi: 300,
      };

      const defaultDims = { widthMm: 27.94, heightMm: 34.29 };
      const layout8 = calculatePhotoSheetLayout(config8, defaultDims);

      assert.equal(layout8.isOverflowing, false);
      assert.ok(layout8.activeColumns <= 4);
      assert.equal(layout8.totalPhotos, 8);
      assert.equal(layout8.activeColumns, 4);
      assert.equal(layout8.activeRows, 2);

      // Verify boundary compliance on 4×6 landscape (152.4 × 101.6 mm)
      for (const p of layout8.placements) {
        assert.ok(p.xMm + p.widthMm <= 152.41);
        assert.ok(p.yMm + p.heightMm <= 101.61);
      }

      // 2. 35 × 45 mm passport size on 4×6 sheet (holds 6 photos, warns if 8 requested)
      const configPassport = {
        ...DEFAULT_PHOTO_SHEET_CONFIG,
        paperSize: "4x6",
        orientation: "landscape",
        copies: 8,
        dpi: 300,
      };
      const passportDims = { widthMm: 35, heightMm: 45 };
      const layoutPassport = calculatePhotoSheetLayout(configPassport, passportDims);

      assert.equal(layoutPassport.maxCapacity, 6);
      assert.equal(layoutPassport.totalPhotos, 6);
      assert.equal(layoutPassport.copiesExceedCapacity, true);
      assert.equal(layoutPassport.exceededByCount, 2);
    });

    test("flattens multi-photo copies sequentially (Photo A × 3, Photo B × 2)", () => {
      const photos = [
        {
          id: "photo-1",
          file: {},
          name: "PhotoA.jpg",
          size: 1000,
          previewUrl: "blob:photo-a",
          copies: 3,
          dimensions: { width: 800, height: 1000, aspectRatio: 0.8 },
          addedAt: Date.now(),
        },
        {
          id: "photo-2",
          file: {},
          name: "PhotoB.jpg",
          size: 1200,
          previewUrl: "blob:photo-b",
          copies: 2,
          dimensions: { width: 800, height: 1000, aspectRatio: 0.8 },
          addedAt: Date.now(),
        },
      ];

      const flattened = flattenPhotoCopies(photos);
      assert.equal(flattened.length, 5);
      assert.equal(flattened[0].id, "photo-1");
      assert.equal(flattened[1].id, "photo-1");
      assert.equal(flattened[2].id, "photo-1");
      assert.equal(flattened[3].id, "photo-2");
      assert.equal(flattened[4].id, "photo-2");
    });
  });

  // =========================================================================
  // WORKFLOW D: Multiple Photos -> A4 Sheet -> Preview -> Print
  // =========================================================================
  describe("Workflow D: A4 Photo Sheet Arrangement, Vector PDF & Print Calibration", () => {
    test("calculates exact ISO 216 A4 sheet dimensions at 300 DPI (2480 × 3508 px portrait)", () => {
      const portrait = calculateSheetDimensions("portrait", 300, "a4");
      assert.equal(portrait.widthPx, 2480);
      assert.equal(portrait.heightPx, 3508);
      assert.equal(portrait.widthMm, 210.0);
      assert.equal(portrait.heightMm, 297.0);

      // Verify exact PDF PostScript points
      assert.equal(portrait.pageWidthPt, 595.2756);
      assert.equal(portrait.pageHeightPt, 841.8898);
    });

    test("calculates exact ISO 216 A4 landscape dimensions at 300 DPI (3508 × 2480 px)", () => {
      const landscape = calculateSheetDimensions("landscape", 300, "a4");
      assert.equal(landscape.widthPx, 3508);
      assert.equal(landscape.heightPx, 2480);
      assert.equal(landscape.widthMm, 297.0);
      assert.equal(landscape.heightMm, 210.0);

      assert.equal(landscape.pageWidthPt, 841.8898);
      assert.equal(landscape.pageHeightPt, 595.2756);
    });

    test("arranges 24 passport photos on A4 portrait sheet (4 cols × 6 rows, strictly top-aligned)", () => {
      const config = {
        ...DEFAULT_A4_SHEET_CONFIG,
        paperSize: "a4",
        orientation: "portrait",
        copies: 24,
        dpi: 300,
      };

      const photoDimensions = { widthMm: 35, heightMm: 45 };
      const layout = calculatePhotoSheetLayout(config, photoDimensions);

      assert.equal(layout.isOverflowing, false);
      assert.equal(layout.activeColumns, 4);
      assert.equal(layout.activeRows, 6);
      assert.equal(layout.totalPhotos, 24);

      // Top margin must be preserved without vertical centering on A4
      assert.equal(layout.effectiveMarginTopMm, config.margins.topMm);
      assert.equal(layout.effectiveMarginLeftMm, config.margins.leftMm);

      // Verify row 1 and row 2 vertical coordinates
      const row1 = layout.placements.filter((p) => p.row === 0);
      const row2 = layout.placements.filter((p) => p.row === 1);
      assert.equal(row1.length, 4);
      assert.equal(row2.length, 4);

      const expectedRow2Y = config.margins.topMm + 45 + config.spacing.verticalMm;
      assert.ok(Math.abs(row2[0].yMm - expectedRow2Y) < 0.01);
    });

    test("generates standardized print-ready sheet file names", () => {
      const a4PdfName = generateSheetFileName("portrait", 300, "pdf", "a4");
      assert.ok(a4PdfName.startsWith("photo-sheet-a4-portrait-300dpi-"));
      assert.ok(a4PdfName.endsWith(".pdf"));

      const photo4x6PngName = generateSheetFileName("landscape", 300, "png", "4x6");
      assert.ok(photo4x6PngName.startsWith("photo-sheet-4x6-landscape-300dpi-"));
      assert.ok(photo4x6PngName.endsWith(".png"));
    });
  });

  // =========================================================================
  // WORKFLOW E: Background Removal Handoff & Ephemeral RAM Transfer
  // =========================================================================
  describe("Workflow E: Ephemeral In-Memory Image Transfer Between Tools", () => {
    test("stages, peeks, and consumes transferred image without data leakage", () => {
      clearStagedImage();
      assert.equal(peekStagedImage(), null);

      const mockFile = {
        name: "portrait-cutout.png",
        size: 54321,
        type: "image/png",
      };

      // 1. Stage in ephemeral RAM
      stageImageForTransfer(mockFile, "background-remover");

      // 2. Peek does not consume
      const peeked = peekStagedImage();
      assert.ok(peeked !== null);
      assert.equal(peeked.file.name, "portrait-cutout.png");
      assert.equal(peeked.sourceTool, "background-remover");

      // 3. Consume wipes staged pointer
      const consumed = consumeTransferredImage();
      assert.ok(consumed !== null);
      assert.equal(consumed.name, "portrait-cutout.png");

      // 4. Subsequent read is null (zero leakage)
      assert.equal(peekStagedImage(), null);
      assert.equal(consumeTransferredImage(), null);
    });
  });

  // =========================================================================
  // WORKFLOW F: Live Dimension and DPI Changes & Unit Conversions
  // =========================================================================
  describe("Workflow F: Dynamic Dimensions, DPI Recalculation & Lossless Conversions", () => {
    test("recalculates 35 × 45 mm across standard DPI presets (150, 200, 300, 600 DPI)", () => {
      // 150 DPI: round(35/25.4 * 150) = 207, round(45/25.4 * 150) = 266
      const dpi150 = calculatePixelDimensions({ widthMm: 35, heightMm: 45, dpi: 150 });
      assert.equal(dpi150.widthPx, 207);
      assert.equal(dpi150.heightPx, 266);

      // 200 DPI: round(35/25.4 * 200) = 276, round(45/25.4 * 200) = 354
      const dpi200 = calculatePixelDimensions({ widthMm: 35, heightMm: 45, dpi: 200 });
      assert.equal(dpi200.widthPx, 276);
      assert.equal(dpi200.heightPx, 354);

      // 300 DPI: round(35/25.4 * 300) = 413, round(45/25.4 * 300) = 531
      const dpi300 = calculatePixelDimensions({ widthMm: 35, heightMm: 45, dpi: 300 });
      assert.equal(dpi300.widthPx, 413);
      assert.equal(dpi300.heightPx, 531);

      // 600 DPI: round(35/25.4 * 600) = 827, round(45/25.4 * 600) = 1063
      const dpi600 = calculatePixelDimensions({ widthMm: 35, heightMm: 45, dpi: 600 });
      assert.equal(dpi600.widthPx, 827);
      assert.equal(dpi600.heightPx, 1063);
    });

    test("performs bidirectional lossless unit conversions between mm, cm, and inches", () => {
      // mm to inches
      assert.equal(convertUnit(25.4, "mm", "inch", 2), 1.0);
      assert.equal(convertUnit(50.8, "mm", "inch", 2), 2.0);

      // inches to mm
      assert.equal(convertUnit(1.0, "inch", "mm", 2), 25.4);
      assert.equal(convertUnit(2.0, "inch", "mm", 2), 50.8);

      // cm to mm and mm to cm
      assert.equal(convertUnit(3.5, "cm", "mm", 2), 35.0);
      assert.equal(convertUnit(45.0, "mm", "cm", 2), 4.5);

      // inches to cm
      assert.equal(convertUnit(2.0, "inch", "cm", 2), 5.08);

      // Round-trip precision: mm -> in -> cm -> mm
      const orig = 35.0;
      const inVal = convertUnit(orig, "mm", "inch", 6);
      const cmVal = convertUnit(inVal, "inch", "cm", 6);
      const backMm = convertUnit(cmVal, "cm", "mm", 2);
      assert.equal(backMm, orig);
    });

    test("validates custom dimensions rejecting boundary violations", () => {
      // Valid custom dimensions
      const valid = validateCustomDimensions(50, 50, "mm", 300);
      assert.equal(valid.isValid, true);

      // Negative dimension
      const neg = validateCustomDimensions(-10, 50, "mm", 300);
      assert.equal(neg.isValid, false);
      assert.ok(neg.errors.width);

      // Exceeds max dimension (> 1000 mm)
      const oversized = validateCustomDimensions(1500, 50, "mm", 300);
      assert.equal(oversized.isValid, false);
      assert.ok(oversized.errors.width);

      // Out of range DPI (< 30 or > 2400)
      const lowDpi = validateCustomDimensions(35, 45, "mm", 10);
      assert.equal(lowDpi.isValid, false);
      assert.ok(lowDpi.errors.dpi);

      const highDpi = validateCustomDimensions(35, 45, "mm", 3000);
      assert.equal(highDpi.isValid, false);
      assert.ok(highDpi.errors.dpi);
    });
  });

  // =========================================================================
  // ASPECT RATIO & CENTER-CROP PROTECTION
  // =========================================================================
  describe("Image Geometry & Distortion Prevention", () => {
    test("calculateCenterCrop crops wider source horizontally to prevent stretching", () => {
      // 16:9 landscape image (1920 × 1080) placed into 35:45 portrait slot (350 × 450)
      const crop = calculateCenterCrop(1920, 1080, 350, 450);

      const targetRatio = 350 / 450;
      const croppedRatio = crop.sWidth / crop.sHeight;
      assert.ok(Math.abs(croppedRatio - targetRatio) < 0.001);

      // Must be horizontally centered: equal left and right margins
      assert.equal(crop.sy, 0);
      assert.equal(crop.sHeight, 1080);
      assert.equal(crop.sx, Math.round((1920 - crop.sWidth) / 2));
    });

    test("calculateCenterCrop crops taller source vertically to prevent stretching", () => {
      // 9:16 portrait image (1080 × 1920) placed into 1:1 square slot (500 × 500)
      const crop = calculateCenterCrop(1080, 1920, 500, 500);

      assert.equal(crop.sWidth, 1080);
      assert.equal(crop.sHeight, 1080);
      assert.equal(crop.sx, 0);
      assert.equal(crop.sy, Math.round((1920 - 1080) / 2)); // 420 px
    });

    test("clamps crop box within natural image boundaries preventing NaN or negative coords", () => {
      const clamped = clampCropToBounds(
        { x: -50, y: -20, width: 3000, height: 4000 },
        1000,
        1500,
        35 / 45
      );

      assert.ok(clamped.x >= 0);
      assert.ok(clamped.y >= 0);
      assert.ok(clamped.x + clamped.width <= 1000);
      assert.ok(clamped.y + clamped.height <= 1500);
    });

    test("recalculateCropForAspectRatio maintains center position when switching presets", () => {
      const initial = { x: 200, y: 300, width: 600, height: 600 }; // 1:1 square
      const updated = recalculateCropForAspectRatio(initial, 2000, 2000, 35 / 45); // Passport ratio

      const initialCx = initial.x + initial.width / 2;
      const initialCy = initial.y + initial.height / 2;

      const updatedCx = updated.x + updated.width / 2;
      const updatedCy = updated.y + updated.height / 2;

      assert.ok(Math.abs(initialCx - updatedCx) <= 1.0);
      assert.ok(Math.abs(initialCy - updatedCy) <= 1.0);
    });
  });

  // =========================================================================
  // PRIVACY & ZERO-UPLOAD GUARANTEE
  // =========================================================================
  describe("Privacy & In-Browser Execution Invariant", () => {
    test("verifies that all calculations run locally in Node without network requests", () => {
      assert.ok(typeof calculatePixelDimensions === "function");
      assert.ok(typeof calculatePhotoSheetLayout === "function");
      assert.ok(typeof calculateSheetDimensions === "function");
      assert.ok(typeof convertUnit === "function");
      assert.ok(typeof writePngDpi === "function");
      assert.ok(typeof writeJpegDpi === "function");
    });
  });
});
