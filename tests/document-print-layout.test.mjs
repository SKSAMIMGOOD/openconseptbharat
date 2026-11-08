/**
 * Automated Test Suite: Document Studio — Phase 4
 * Print Layout Settings
 *
 * Verifies:
 * 1. Paper Size (A4, A5, Letter, Custom with mm and inch unit conversion & sanitization)
 * 2. Orientation (Portrait vs Landscape, dynamic dimension swapping, immediate update)
 * 3. Margins (No Margins, Small Margins, Normal Margins, Custom Margins, negative/invalid rejection)
 * 4. Document Alignment (Center, Top, Custom Position with horizontal and vertical offsets)
 * 5. Document Scale (Actual Size 100%, Fit to Page, Custom Percentage, strict aspect ratio preservation)
 * 6. Copies (Min 1, Max 20, Default 1, input validation & clamping)
 * 7. Paper Layout Preview Engine (mm to percentage positioning, vertical & horizontal arrangements, overflow detection)
 * 8. Integration & Non-Regression (enhancement reflection, dimension settings, Phase 3 mode compatibility)
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  PRINT_PAPER_SIZE_OPTIONS,
  PRINT_ORIENTATION_OPTIONS,
  PRINT_MARGIN_PRESET_OPTIONS,
  PRINT_ALIGNMENT_OPTIONS,
  PRINT_SCALE_OPTIONS,
  validatePrintPaperSize,
  validatePrintOrientation,
  validatePrintMarginPreset,
  validatePrintAlignment,
  validatePrintScaleMode,
  sanitizeMarginValue,
  sanitizeCustomMargins,
  sanitizeScalePercentage,
  sanitizeCopies,
  sanitizeCustomPaper,
  getEffectivePaperDimensions,
  getEffectiveMargins,
  calculatePrintPaperLayout,
  resolvePrintStudioLayout,
} from "../src/lib/document/document-print-studio.ts";

import {
  STANDARD_PAPER_SIZES,
  MARGIN_PRESET_VALUES,
  DEFAULT_PRINT_MARGINS,
  DEFAULT_PRINT_LAYOUT_SETTINGS,
  createDefaultPrintLayoutSettings,
  createDefaultPrintStudioState,
  createDefaultPrintSettings,
  createDefaultEnhancementSettings,
} from "../src/types/document-studio.ts";

// Helper to mock a DocumentSideResult
function createMockSideResult(overrides = {}) {
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

describe("PHASE 4: Document Studio — Print Layout Settings", () => {
  // =========================================================================
  // 1. PAPER SIZE SELECTION & CUSTOM DIMENSIONS
  // =========================================================================
  describe("1. Paper Size Selection & Custom Dimensions", () => {
    test("defines exactly 4 paper size options: A4, A5, Letter, Custom", () => {
      const ids = PRINT_PAPER_SIZE_OPTIONS.map((p) => p.id);
      assert.deepEqual(ids, ["a4", "a5", "letter", "custom"]);
    });

    test("validates PrintPaperSize values strictly", () => {
      assert.equal(validatePrintPaperSize("a4"), true);
      assert.equal(validatePrintPaperSize("a5"), true);
      assert.equal(validatePrintPaperSize("letter"), true);
      assert.equal(validatePrintPaperSize("custom"), true);
      assert.equal(validatePrintPaperSize("legal"), false);
      assert.equal(validatePrintPaperSize(null), false);
      assert.equal(validatePrintPaperSize(undefined), false);
    });

    test("resolves A4 standard paper dimensions (210 × 297 mm)", () => {
      const dims = getEffectivePaperDimensions("a4", "portrait");
      assert.equal(dims.widthMm, 210);
      assert.equal(dims.heightMm, 297);
      assert.equal(Number((210 / 297).toFixed(4)), dims.aspectRatio);
    });

    test("resolves A5 standard paper dimensions (148 × 210 mm)", () => {
      const dims = getEffectivePaperDimensions("a5", "portrait");
      assert.equal(dims.widthMm, 148);
      assert.equal(dims.heightMm, 210);
      assert.equal(Number((148 / 210).toFixed(4)), dims.aspectRatio);
    });

    test("resolves Letter standard paper dimensions (215.9 × 279.4 mm)", () => {
      const dims = getEffectivePaperDimensions("letter", "portrait");
      assert.equal(dims.widthMm, 215.9);
      assert.equal(dims.heightMm, 279.4);
      assert.equal(Number((215.9 / 279.4).toFixed(4)), dims.aspectRatio);
    });

    test("resolves Custom paper size in millimeters", () => {
      const customPaper = { width: 120, height: 180, unit: "mm" };
      const dims = getEffectivePaperDimensions("custom", "portrait", customPaper);
      assert.equal(dims.widthMm, 120);
      assert.equal(dims.heightMm, 180);
      assert.equal(Number((120 / 180).toFixed(4)), dims.aspectRatio);
    });

    test("resolves Custom paper size in inches with accurate mm conversion", () => {
      // 4 × 6 inch photo card: 4 * 25.4 = 101.6 mm, 6 * 25.4 = 152.4 mm
      const customPaper = { width: 4, height: 6, unit: "inch" };
      const dims = getEffectivePaperDimensions("custom", "portrait", customPaper);
      assert.equal(dims.widthMm, 101.6);
      assert.equal(dims.heightMm, 152.4);
      assert.equal(Number((101.6 / 152.4).toFixed(4)), dims.aspectRatio);
    });

    test("sanitizes custom paper dimensions safely", () => {
      // Negative / zero dimensions clamped to defaults
      const sanitizedZero = sanitizeCustomPaper({ width: 0, height: -10, unit: "mm" });
      assert.equal(sanitizedZero.width, 210);
      assert.equal(sanitizedZero.height, 297);

      // Oversized dimensions clamped to max limits
      const sanitizedMax = sanitizeCustomPaper({ width: 5000, height: 5000, unit: "mm" });
      assert.equal(sanitizedMax.width, 1200);
      assert.equal(sanitizedMax.height, 1200);
    });
  });

  // =========================================================================
  // 2. ORIENTATION
  // =========================================================================
  describe("2. Orientation Options & Swapping", () => {
    test("defines Portrait and Landscape orientation options", () => {
      const ids = PRINT_ORIENTATION_OPTIONS.map((o) => o.id);
      assert.deepEqual(ids, ["portrait", "landscape"]);
    });

    test("validates PrintOrientation strictly", () => {
      assert.equal(validatePrintOrientation("portrait"), true);
      assert.equal(validatePrintOrientation("landscape"), true);
      assert.equal(validatePrintOrientation("square"), false);
      assert.equal(validatePrintOrientation(123), false);
    });

    test("portrait orientation maintains height greater than or equal to width", () => {
      const a4Portrait = getEffectivePaperDimensions("a4", "portrait");
      assert.equal(a4Portrait.widthMm, 210);
      assert.equal(a4Portrait.heightMm, 297);
      assert.ok(a4Portrait.heightMm >= a4Portrait.widthMm);
    });

    test("landscape orientation immediately swaps dimensions (width >= height)", () => {
      const a4Landscape = getEffectivePaperDimensions("a4", "landscape");
      assert.equal(a4Landscape.widthMm, 297);
      assert.equal(a4Landscape.heightMm, 210);
      assert.ok(a4Landscape.widthMm >= a4Landscape.heightMm);
      assert.equal(Number((297 / 210).toFixed(4)), a4Landscape.aspectRatio);
    });

    test("orientation updates preview layout result immediately", () => {
      const layoutPortrait = createDefaultPrintLayoutSettings();
      layoutPortrait.orientation = "portrait";

      const front = createMockSideResult();
      const back = createMockSideResult();

      const resultPortrait = calculatePrintPaperLayout({
        layout: layoutPortrait,
        mode: "front-only",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(resultPortrait.paperWidthMm, 210);
      assert.equal(resultPortrait.paperHeightMm, 297);

      // Switch to landscape
      const layoutLandscape = { ...layoutPortrait, orientation: "landscape" };
      const resultLandscape = calculatePrintPaperLayout({
        layout: layoutLandscape,
        mode: "front-only",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(resultLandscape.paperWidthMm, 297);
      assert.equal(resultLandscape.paperHeightMm, 210);
      assert.equal(resultLandscape.orientation, "landscape");
    });
  });

  // =========================================================================
  // 3. MARGINS
  // =========================================================================
  describe("3. Margins Configuration & Sanitization", () => {
    test("defines presets: none, small, normal, custom", () => {
      const ids = PRINT_MARGIN_PRESET_OPTIONS.map((m) => m.id);
      assert.deepEqual(ids, ["none", "small", "normal", "custom"]);
    });

    test("validates PrintMarginPreset strictly", () => {
      assert.equal(validatePrintMarginPreset("none"), true);
      assert.equal(validatePrintMarginPreset("small"), true);
      assert.equal(validatePrintMarginPreset("normal"), true);
      assert.equal(validatePrintMarginPreset("custom"), true);
      assert.equal(validatePrintMarginPreset("wide"), false);
    });

    test("resolves No Margins (0 mm on all 4 sides)", () => {
      const margins = getEffectiveMargins("none", undefined, 210, 297);
      assert.deepEqual(margins, { topMm: 0, bottomMm: 0, leftMm: 0, rightMm: 0 });
    });

    test("resolves Small Margins (5 mm on all 4 sides)", () => {
      const margins = getEffectiveMargins("small", undefined, 210, 297);
      assert.deepEqual(margins, { topMm: 5, bottomMm: 5, leftMm: 5, rightMm: 5 });
    });

    test("resolves Normal Margins (12.7 mm on all 4 sides)", () => {
      const margins = getEffectiveMargins("normal", undefined, 210, 297);
      assert.deepEqual(margins, { topMm: 12.7, bottomMm: 12.7, leftMm: 12.7, rightMm: 12.7 });
    });

    test("allows independent configuration of top, bottom, left, and right in custom margins", () => {
      const custom = { topMm: 15, bottomMm: 20, leftMm: 10, rightMm: 25 };
      const margins = getEffectiveMargins("custom", custom, 210, 297);
      assert.deepEqual(margins, custom);
    });

    test("strictly prevents negative or NaN margin values", () => {
      assert.equal(sanitizeMarginValue(-5), 0);
      assert.equal(sanitizeMarginValue(-0.1), 0);
      assert.equal(sanitizeMarginValue(NaN), 0);
      assert.equal(sanitizeMarginValue("invalid"), 0);
      assert.equal(sanitizeMarginValue(15), 15);
    });

    test("clamps custom margins when sum exceeds paper size while keeping 10mm printable area", () => {
      // Paper width is 210mm. Left 150 + Right 150 = 300 > 200 (max allowed for 10mm printable)
      const oversized = { topMm: 0, bottomMm: 0, leftMm: 150, rightMm: 150 };
      const margins = getEffectiveMargins("custom", oversized, 210, 297);
      assert.ok(margins.leftMm + margins.rightMm <= 200);
      assert.ok(margins.leftMm > 0);
      assert.ok(margins.rightMm > 0);
    });
  });

  // =========================================================================
  // 4. DOCUMENT ALIGNMENT
  // =========================================================================
  describe("4. Document Alignment", () => {
    test("defines alignment options: center, top, custom", () => {
      const ids = PRINT_ALIGNMENT_OPTIONS.map((a) => a.id);
      assert.deepEqual(ids, ["center", "top", "custom"]);
    });

    test("validates PrintAlignment strictly", () => {
      assert.equal(validatePrintAlignment("center"), true);
      assert.equal(validatePrintAlignment("top"), true);
      assert.equal(validatePrintAlignment("custom"), true);
      assert.equal(validatePrintAlignment("bottom"), false);
    });

    test("center alignment centers document horizontally and vertically within printable area", () => {
      const layout = createDefaultPrintLayoutSettings();
      layout.alignment = "center";
      layout.marginPreset = "none"; // 210 × 297 printable
      layout.scaleMode = "actual"; // Aadhaar: 85.6 × 53.98

      const front = createMockSideResult();
      const back = createMockSideResult();

      const result = calculatePrintPaperLayout({
        layout,
        mode: "front-only",
        arrangement: "vertical",
        front,
        back,
      });

      // extraW = 210 - 85.6 = 124.4 => relX = 62.2 mm
      // extraH = 297 - 53.98 = 243.02 => relY = 121.51 mm
      assert.equal(result.blockPaperX, 62.2);
      assert.equal(result.blockPaperY, 121.51);
    });

    test("top alignment aligns document to top margin while horizontally centered", () => {
      const layout = createDefaultPrintLayoutSettings();
      layout.alignment = "top";
      layout.marginPreset = "normal"; // 12.7 mm margins
      layout.scaleMode = "actual";

      const front = createMockSideResult();
      const back = createMockSideResult();

      const result = calculatePrintPaperLayout({
        layout,
        mode: "front-only",
        arrangement: "vertical",
        front,
        back,
      });

      // relY should be 0, blockPaperY should equal top margin 12.7 mm
      assert.equal(result.blockPaperY, 12.7);
      // horizontally centered
      assert.ok(result.blockPaperX > 12.7);
    });

    test("custom position allows horizontal and vertical offsets in mm", () => {
      const layout = createDefaultPrintLayoutSettings();
      layout.alignment = "custom";
      layout.marginPreset = "normal"; // 12.7 mm margins
      layout.customPosition = { xMm: 30, yMm: 45 };

      const front = createMockSideResult();
      const back = createMockSideResult();

      const result = calculatePrintPaperLayout({
        layout,
        mode: "front-only",
        arrangement: "vertical",
        front,
        back,
      });

      // blockPaperX = leftMargin (12.7) + xMm (30) = 42.7 mm
      // blockPaperY = topMargin (12.7) + yMm (45) = 57.7 mm
      assert.equal(result.blockPaperX, 42.7);
      assert.equal(result.blockPaperY, 57.7);
    });
  });

  // =========================================================================
  // 5. SCALE
  // =========================================================================
  describe("5. Document Scale & Aspect Ratio Preservation", () => {
    test("defines scale modes: actual, fit, custom", () => {
      const ids = PRINT_SCALE_OPTIONS.map((s) => s.id);
      assert.deepEqual(ids, ["actual", "fit", "custom"]);
    });

    test("validates PrintScaleMode strictly", () => {
      assert.equal(validatePrintScaleMode("actual"), true);
      assert.equal(validatePrintScaleMode("fit"), true);
      assert.equal(validatePrintScaleMode("custom"), true);
      assert.equal(validatePrintScaleMode("fill"), false);
    });

    test("actual size scale preserves 1:1 physical dimensions (100%)", () => {
      const layout = createDefaultPrintLayoutSettings();
      layout.scaleMode = "actual";

      const front = createMockSideResult();
      const back = createMockSideResult();

      const result = calculatePrintPaperLayout({
        layout,
        mode: "front-only",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(result.scaleFactor, 1.0);
      assert.equal(result.scalePercentage, 100);
      assert.equal(result.items[0].widthMm, 85.6);
      assert.equal(result.items[0].heightMm, 53.98);
    });

    test("fit to page dynamically scales document while strictly preserving aspect ratio", () => {
      const layout = createDefaultPrintLayoutSettings();
      layout.scaleMode = "fit";
      layout.marginPreset = "normal"; // 184.6 × 271.6 mm printable area

      const front = createMockSideResult();
      const back = createMockSideResult();

      const result = calculatePrintPaperLayout({
        layout,
        mode: "front-only",
        arrangement: "vertical",
        front,
        back,
      });

      // Scale factor > 1
      assert.ok(result.scaleFactor > 1);
      // Strictly preserves aspect ratio (85.6 / 53.98 = 1.58577)
      const originalRatio = 85.6 / 53.98;
      const scaledRatio = result.items[0].widthMm / result.items[0].heightMm;
      assert.ok(Math.abs(originalRatio - scaledRatio) < 0.001, "Aspect ratio must be preserved without stretching");
      // Fits within printable area
      assert.ok(result.items[0].widthMm <= result.printableWidthMm + 0.1);
      assert.ok(result.items[0].heightMm <= result.printableHeightMm + 0.1);
    });

    test("custom percentage scales document accurately while preserving aspect ratio", () => {
      const layout = createDefaultPrintLayoutSettings();
      layout.scaleMode = "custom";
      layout.customScalePercentage = 150; // 150%

      const front = createMockSideResult();
      const back = createMockSideResult();

      const result = calculatePrintPaperLayout({
        layout,
        mode: "front-only",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(result.scaleFactor, 1.5);
      assert.equal(result.scalePercentage, 150);
      assert.equal(result.items[0].widthMm, Number((85.6 * 1.5).toFixed(2)));
      assert.equal(result.items[0].heightMm, Number((53.98 * 1.5).toFixed(2)));

      const ratio = result.items[0].widthMm / result.items[0].heightMm;
      assert.ok(Math.abs(ratio - (85.6 / 53.98)) < 0.001);
    });

    test("sanitizes custom scale percentage (clamps 10% to 500%, rejects invalid values)", () => {
      assert.equal(sanitizeScalePercentage(-50), 100);
      assert.equal(sanitizeScalePercentage(0), 100);
      assert.equal(sanitizeScalePercentage(NaN), 100);
      assert.equal(sanitizeScalePercentage(5), 10);
      assert.equal(sanitizeScalePercentage(800), 500);
      assert.equal(sanitizeScalePercentage(125.5), 125.5);
    });
  });

  // =========================================================================
  // 6. COPIES
  // =========================================================================
  describe("6. Copies Setting & Validation", () => {
    test("defaults copies to 1", () => {
      const defaults = createDefaultPrintLayoutSettings();
      assert.equal(defaults.copies, 1);
    });

    test("sanitizes copies: clamps to minimum 1", () => {
      assert.equal(sanitizeCopies(0), 1);
      assert.equal(sanitizeCopies(-5), 1);
      assert.equal(sanitizeCopies(-999), 1);
    });

    test("sanitizes copies: clamps to maximum 20", () => {
      assert.equal(sanitizeCopies(21), 20);
      assert.equal(sanitizeCopies(100), 20);
      assert.equal(sanitizeCopies(20), 20);
    });

    test("sanitizes copies: parses integers and falls back to 1 on NaN/invalid input", () => {
      assert.equal(sanitizeCopies("5"), 5);
      assert.equal(sanitizeCopies(3.8), 3);
      assert.equal(sanitizeCopies(NaN), 1);
      assert.equal(sanitizeCopies("invalid"), 1);
      assert.equal(sanitizeCopies(null), 1);
      assert.equal(sanitizeCopies(undefined), 1);
    });
  });

  // =========================================================================
  // 7. LAYOUT PREVIEW CALCULATION & PLACEMENTS
  // =========================================================================
  describe("7. Layout Preview Coordinate Engine", () => {
    test("calculates percentage coordinates accurately for Front Side Only mode", () => {
      const layout = createDefaultPrintLayoutSettings();
      const front = createMockSideResult();
      const back = createMockSideResult();

      const result = calculatePrintPaperLayout({
        layout,
        mode: "front-only",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(result.items.length, 1);
      const item = result.items[0];
      assert.equal(item.side, "front");
      assert.equal(item.badge, "F");

      // Verify percentages are calculated correctly relative to A4 (210 × 297 mm)
      assert.equal(item.xPercent, Number(((item.xMm / 210) * 100).toFixed(3)));
      assert.equal(item.yPercent, Number(((item.yMm / 297) * 100).toFixed(3)));
      assert.equal(item.widthPercent, Number(((item.widthMm / 210) * 100).toFixed(3)));
      assert.equal(item.heightPercent, Number(((item.heightMm / 297) * 100).toFixed(3)));
    });

    test("calculates percentage coordinates accurately for Back Side Only mode", () => {
      const layout = createDefaultPrintLayoutSettings();
      const front = createMockSideResult();
      const back = createMockSideResult();

      const result = calculatePrintPaperLayout({
        layout,
        mode: "back-only",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(result.items.length, 1);
      const item = result.items[0];
      assert.equal(item.side, "back");
      assert.equal(item.badge, "B");
    });

    test("places both cards with Vertical arrangement in Combined mode", () => {
      const layout = createDefaultPrintLayoutSettings();
      const front = createMockSideResult();
      const back = createMockSideResult();

      const result = calculatePrintPaperLayout({
        layout,
        mode: "combined",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(result.items.length, 2);
      const [frontItem, backItem] = result.items;

      assert.equal(frontItem.side, "front");
      assert.equal(backItem.side, "back");

      // Front on top, Back on bottom with vertical spacing (5mm)
      assert.equal(frontItem.xMm, backItem.xMm); // aligned horizontally
      assert.ok(backItem.yMm > frontItem.yMm + frontItem.heightMm);
    });

    test("places both cards with Horizontal arrangement in Combined mode", () => {
      const layout = createDefaultPrintLayoutSettings();
      const front = createMockSideResult();
      const back = createMockSideResult();

      const result = calculatePrintPaperLayout({
        layout,
        mode: "combined",
        arrangement: "horizontal",
        front,
        back,
      });

      assert.equal(result.items.length, 2);
      const [frontItem, backItem] = result.items;

      assert.equal(frontItem.side, "front");
      assert.equal(backItem.side, "back");

      // Front on left, Back on right with horizontal spacing (5mm)
      assert.equal(frontItem.yMm, backItem.yMm); // aligned vertically
      assert.ok(backItem.xMm > frontItem.xMm + frontItem.widthMm);
    });

    test("detects overflow when document extends beyond sheet boundaries", () => {
      const layout = createDefaultPrintLayoutSettings();
      layout.alignment = "custom";
      layout.customPosition = { xMm: 250, yMm: 350 }; // way beyond A4 (210 × 297)

      const front = createMockSideResult();
      const back = createMockSideResult();

      const result = calculatePrintPaperLayout({
        layout,
        mode: "front-only",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(result.isOverflowing, true);
      assert.ok(result.overflowReason?.includes("exceeds paper sheet boundary"));
    });
  });

  // =========================================================================
  // 8. INTEGRATION & NON-REGRESSION
  // =========================================================================
  describe("8. Integration & Non-Regression", () => {
    test("preserves Phase 1 enhancements on placed items", () => {
      const front = createMockSideResult({
        enhancements: {
          brightness: 15,
          contrast: 20,
          saturation: 0,
          sharpness: 25,
          grayscale: false,
          invert: false,
        },
        enhancedPreviewUrl: "blob:http://localhost/enhanced-front.png",
      });
      const back = createMockSideResult();

      const layout = createDefaultPrintLayoutSettings();
      const res = calculatePrintPaperLayout({
        layout,
        mode: "front-only",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(res.items[0].isEnhanced, true);
      assert.equal(res.items[0].imageUrl, "blob:http://localhost/enhanced-front.png");
    });

    test("preserves Phase 2 document dimensions settings", () => {
      const front = createMockSideResult({
        printSettings: {
          ...createDefaultPrintSettings("pan"),
          widthMm: 85.0,
          heightMm: 54.0,
          dimensionPreset: "pan",
        },
      });
      const back = createMockSideResult();

      const layout = createDefaultPrintLayoutSettings();
      const res = calculatePrintPaperLayout({
        layout,
        mode: "front-only",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(res.items[0].widthMm, 85.0);
      assert.equal(res.items[0].heightMm, 54.0);
    });

    test("resolvePrintStudioLayout seamlessly produces both Phase 3 sidesToRender and Phase 4 paperLayout", () => {
      const front = createMockSideResult();
      const back = createMockSideResult();

      const resolution = resolvePrintStudioLayout({
        mode: "combined",
        arrangement: "vertical",
        front,
        back,
      });

      // Phase 3 outputs intact
      assert.equal(resolution.mode, "combined");
      assert.equal(resolution.arrangement, "vertical");
      assert.equal(resolution.sidesToRender.length, 2);

      // Phase 4 outputs present and valid
      assert.ok(resolution.paperLayout);
      assert.equal(resolution.paperLayout.paperSize, "a4");
      assert.equal(resolution.paperLayout.items.length, 2);
    });

    test("handles missing document side gracefully with empty state in paper layout", () => {
      const front = createMockSideResult({
        croppedPreviewUrl: null,
        enhancedPreviewUrl: null,
      });
      const back = createMockSideResult({
        croppedPreviewUrl: "blob:http://localhost/back.png",
      });

      const layout = createDefaultPrintLayoutSettings();
      const res = calculatePrintPaperLayout({
        layout,
        mode: "combined",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(res.items[0].isAvailable, false);
      assert.equal(res.items[0].imageUrl, null);
      assert.equal(res.items[1].isAvailable, true);
      assert.equal(res.items[1].imageUrl, "blob:http://localhost/back.png");
    });
  });
});
