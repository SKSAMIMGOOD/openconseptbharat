/**
 * Automated Test Suite: Document Studio — Phase 08D
 * Print Quality and Document Dimensions Settings
 *
 * Verifies:
 * 1. Print Quality Presets (Standard: 150 DPI, High: 300 DPI, Maximum: 600 DPI, Custom DPI)
 * 2. Custom DPI Validation & Bounds (72 - 1200 DPI, rejection of non-numbers, negative, zero, and out-of-bound values)
 * 3. Document Dimension Presets (Aadhaar: 85.6 × 53.98 mm, PAN: 85.6 × 53.98 mm, Voter ID: 85.6 × 53.98 mm, Original Size, Custom Size)
 * 4. Default Measurement Unit (Millimeters - mm) and Switching between mm, inches, pixels
 * 5. Unit Conversion Math (mm <-> inches <-> pixels) at 150, 300, 600 DPI
 * 6. Aspect Ratio Behavior (Automatic height adjustment on width change, automatic width adjustment on height change, toggle behavior)
 * 7. Dimension Validation (Rejection of zero, negative, and excessively large dimensions)
 * 8. Resolution Sufficiency & Warning Diagnostics (Effective DPI calculation, warning generation, zero artificial upscaling guarantee)
 * 9. Front & Back State Architecture & Persistence (Independence, mutual preservation, synchronisation)
 * 10. Non-Regression of Phase 1 Document Enhancements
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  PRINT_DPI_PRESETS,
  MIN_CUSTOM_DPI,
  MAX_CUSTOM_DPI,
  DEFAULT_PRINT_DPI,
  CR80_STANDARD_DIMENSIONS_MM,
  DOCUMENT_DIMENSION_PRESETS,
  PRINT_QUALITY_PRESET_OPTIONS,
  validateCustomDpi,
  documentUnitToMm,
  mmToDocumentUnit,
  convertDocumentUnit,
  calculateTargetPixels,
  calculatePhysicalFromPixels,
  adjustDimensionWithAspectRatio,
  validateDocumentDimensions,
  checkResolutionSufficiency,
  updatePrintSettings,
} from "../src/lib/document/document-dimensions.ts";

import {
  DEFAULT_PRINT_SETTINGS,
  createDefaultPrintSettings,
  createDefaultEnhancementSettings,
  DEFAULT_ENHANCEMENT_SETTINGS,
  isEnhancementActive,
} from "../src/types/document-studio.ts";

describe("PHASE 08D: Document Studio — Print Quality & Document Dimensions", () => {
  // =========================================================================
  // 1. PRINT QUALITY PRESETS
  // =========================================================================
  describe("1. Print Quality Settings & Presets", () => {
    test("defines Standard (150 DPI), High (300 DPI), and Maximum (600 DPI) presets", () => {
      assert.equal(PRINT_DPI_PRESETS.standard, 150, "Standard Quality must be 150 DPI");
      assert.equal(PRINT_DPI_PRESETS.high, 300, "High Quality must be 300 DPI");
      assert.equal(PRINT_DPI_PRESETS.maximum, 600, "Maximum Quality must be 600 DPI");
    });

    test("includes all 4 options in preset registry with human-readable descriptions", () => {
      const ids = PRINT_QUALITY_PRESET_OPTIONS.map((p) => p.id);
      assert.deepEqual(ids, ["standard", "high", "maximum", "custom"]);

      const standard = PRINT_QUALITY_PRESET_OPTIONS.find((p) => p.id === "standard");
      assert.equal(standard?.dpi, 150);

      const high = PRINT_QUALITY_PRESET_OPTIONS.find((p) => p.id === "high");
      assert.equal(high?.dpi, 300);

      const max = PRINT_QUALITY_PRESET_OPTIONS.find((p) => p.id === "maximum");
      assert.equal(max?.dpi, 600);

      const custom = PRINT_QUALITY_PRESET_OPTIONS.find((p) => p.id === "custom");
      assert.ok(custom?.description.includes("72 to 1200 DPI"));
    });

    test("defaults to High Quality (300 DPI)", () => {
      assert.equal(DEFAULT_PRINT_DPI, 300);
      assert.equal(DEFAULT_PRINT_SETTINGS.qualityPreset, "high");
      assert.equal(DEFAULT_PRINT_SETTINGS.dpi, 300);
    });

    test("updates DPI when switching presets via updatePrintSettings", () => {
      let settings = { ...DEFAULT_PRINT_SETTINGS };

      settings = updatePrintSettings(settings, { qualityPreset: "standard" });
      assert.equal(settings.dpi, 150);
      assert.equal(settings.qualityPreset, "standard");

      settings = updatePrintSettings(settings, { qualityPreset: "maximum" });
      assert.equal(settings.dpi, 600);
      assert.equal(settings.qualityPreset, "maximum");

      settings = updatePrintSettings(settings, { qualityPreset: "high" });
      assert.equal(settings.dpi, 300);
      assert.equal(settings.qualityPreset, "high");
    });
  });

  // =========================================================================
  // 2. CUSTOM DPI VALIDATION & SAFETY
  // =========================================================================
  describe("2. Custom DPI Validation & Bounds Enforcement", () => {
    test("accepts valid custom DPI numbers within [72, 1200]", () => {
      const validCases = [72, 100, 150, 200, 300, 450, 600, 800, 1200];
      for (const val of validCases) {
        const res = validateCustomDpi(val);
        assert.equal(res.isValid, true, `DPI ${val} should be valid`);
        assert.equal(res.dpi, val);
        assert.equal(res.error, undefined);
      }
    });

    test("accepts numeric strings and rounds fractional inputs to integer", () => {
      const res1 = validateCustomDpi("300");
      assert.equal(res1.isValid, true);
      assert.equal(res1.dpi, 300);

      const res2 = validateCustomDpi(300.4);
      assert.equal(res2.isValid, true);
      assert.equal(res2.dpi, 300);

      const res3 = validateCustomDpi(299.7);
      assert.equal(res3.isValid, true);
      assert.equal(res3.dpi, 300);
    });

    test("rejects DPI values below minimum threshold (< 72 DPI)", () => {
      const lowCases = [0, 10, 30, 50, 71, -100];
      for (const val of lowCases) {
        const res = validateCustomDpi(val);
        assert.equal(res.isValid, false, `DPI ${val} must be rejected as below minimum`);
        assert.ok(res.error?.includes("at least 72 DPI"));
      }
    });

    test("rejects excessively large DPI values (> 1200 DPI) to prevent browser memory exhaustion", () => {
      const highCases = [1201, 2400, 4800, 10000];
      for (const val of highCases) {
        const res = validateCustomDpi(val);
        assert.equal(res.isValid, false, `DPI ${val} must be rejected as excessively large`);
        assert.ok(res.error?.includes("cannot exceed 1200 DPI"));
      }
    });

    test("rejects non-numeric inputs, NaN, and Infinity", () => {
      const invalidInputs = ["abc", "", NaN, Infinity, -Infinity, null, undefined];
      for (const val of invalidInputs) {
        const res = validateCustomDpi(val);
        assert.equal(res.isValid, false, `Input ${String(val)} must be rejected`);
        assert.ok(res.error?.includes("valid number"));
      }
    });
  });

  // =========================================================================
  // 3. DOCUMENT DIMENSION PRESETS
  // =========================================================================
  describe("3. Document Dimension Presets & Standards", () => {
    test("Aadhaar Card adheres to ISO/IEC 7810 ID-1 standard: 85.60 × 53.98 mm", () => {
      const aadhaar = DOCUMENT_DIMENSION_PRESETS.aadhaar;
      assert.ok(aadhaar);
      assert.equal(aadhaar.name, "Aadhaar Card");
      assert.equal(aadhaar.widthMm, 85.6);
      assert.equal(aadhaar.heightMm, 53.98);
      assert.ok(Math.abs(aadhaar.aspectRatio - 85.6 / 53.98) < 0.0001);
      assert.equal(aadhaar.isFixedStandard, true);
    });

    test("PAN Card adheres to ISO/IEC 7810 ID-1 standard: 85.60 × 53.98 mm", () => {
      const pan = DOCUMENT_DIMENSION_PRESETS.pan;
      assert.ok(pan);
      assert.equal(pan.name, "PAN Card");
      assert.equal(pan.widthMm, 85.6);
      assert.equal(pan.heightMm, 53.98);
      assert.ok(Math.abs(pan.aspectRatio - 85.6 / 53.98) < 0.0001);
      assert.equal(pan.isFixedStandard, true);
    });

    test("Voter ID Card adheres to ISO/IEC 7810 ID-1 standard: 85.60 × 53.98 mm", () => {
      const voter = DOCUMENT_DIMENSION_PRESETS["voter-id"];
      assert.ok(voter);
      assert.equal(voter.name, "Voter ID Card");
      assert.equal(voter.widthMm, 85.6);
      assert.equal(voter.heightMm, 53.98);
      assert.ok(Math.abs(voter.aspectRatio - 85.6 / 53.98) < 0.0001);
      assert.equal(voter.isFixedStandard, true);
    });

    test("Original Size preset exists and uses dynamic document dimensions", () => {
      const orig = DOCUMENT_DIMENSION_PRESETS.original;
      assert.ok(orig);
      assert.equal(orig.name, "Original Size");
      assert.equal(orig.isFixedStandard, false);

      const sourceDims = { width: 1200, height: 800, aspectRatio: 1.5 };
      const settings = createDefaultPrintSettings("custom", sourceDims);
      assert.equal(settings.dimensionPreset, "original");
      assert.equal(settings.targetWidthPx, 1200);
      assert.equal(settings.targetHeightPx, 800);
      assert.equal(settings.aspectRatio, 1.5);
    });

    test("Custom Size preset exists for user-configured dimensions", () => {
      const custom = DOCUMENT_DIMENSION_PRESETS.custom;
      assert.ok(custom);
      assert.equal(custom.name, "Custom Size");
      assert.equal(custom.isFixedStandard, false);
    });

    test("Default measurement unit is millimeters (mm)", () => {
      assert.equal(DEFAULT_PRINT_SETTINGS.unit, "mm");
    });
  });

  // =========================================================================
  // 4. UNIT CONVERSIONS (MM, INCHES, PIXELS)
  // =========================================================================
  describe("4. Unit Conversion Math (mm <-> inches <-> pixels)", () => {
    test("converts standard CR80 85.60 × 53.98 mm to inches accurately", () => {
      // 85.6 / 25.4 = 3.370078... -> 3.37 in
      // 53.98 / 25.4 = 2.125196... -> 2.13 in
      const widthIn = mmToDocumentUnit(85.6, "inch", 300);
      const heightIn = mmToDocumentUnit(53.98, "inch", 300);

      assert.equal(widthIn, 3.37);
      assert.equal(heightIn, 2.13);

      const roundTripW = documentUnitToMm(widthIn, "inch", 300);
      assert.ok(Math.abs(roundTripW - 85.6) < 0.1);
    });

    test("converts standard CR80 85.60 × 53.98 mm to pixels at 300 DPI (1011 × 638 px)", () => {
      // (85.6 / 25.4) * 300 = 1011.0236... -> 1011 px
      // (53.98 / 25.4) * 300 = 637.559... -> 638 px
      const { widthPx, heightPx } = calculateTargetPixels(85.6, 53.98, 300);

      assert.equal(widthPx, 1011, "Width at 300 DPI must be 1011 px");
      assert.equal(heightPx, 638, "Height at 300 DPI must be 638 px");
    });

    test("converts standard CR80 85.60 × 53.98 mm to pixels at 150 DPI (506 × 319 px)", () => {
      // (85.6 / 25.4) * 150 = 505.51... -> 506 px
      // (53.98 / 25.4) * 150 = 318.77... -> 319 px
      const { widthPx, heightPx } = calculateTargetPixels(85.6, 53.98, 150);

      assert.equal(widthPx, 506, "Width at 150 DPI must be 506 px");
      assert.equal(heightPx, 319, "Height at 150 DPI must be 319 px");
    });

    test("converts standard CR80 85.60 × 53.98 mm to pixels at 600 DPI (2022 × 1275 px)", () => {
      // (85.6 / 25.4) * 600 = 2022.04... -> 2022 px
      // (53.98 / 25.4) * 600 = 1275.11... -> 1275 px
      const { widthPx, heightPx } = calculateTargetPixels(85.6, 53.98, 600);

      assert.equal(widthPx, 2022, "Width at 600 DPI must be 2022 px");
      assert.equal(heightPx, 1275, "Height at 600 DPI must be 1275 px");
    });

    test("converts pixels to physical units at 300 DPI", () => {
      const mmW = calculatePhysicalFromPixels(1011, 300, "mm");
      assert.equal(mmW, 85.6);

      const inW = calculatePhysicalFromPixels(1011, 300, "inch");
      assert.equal(inW, 3.37);
    });

    test("direct convertDocumentUnit functions correctly between all pairs", () => {
      // mm -> inch
      assert.equal(convertDocumentUnit(25.4, "mm", "inch", 300), 1.0);
      // inch -> mm
      assert.equal(convertDocumentUnit(1.0, "inch", "mm", 300), 25.4);
      // mm -> px at 300 DPI
      assert.equal(convertDocumentUnit(25.4, "mm", "px", 300), 300);
      // px -> mm at 300 DPI
      assert.equal(convertDocumentUnit(300, "px", "mm", 300), 25.4);
      // inch -> px at 300 DPI
      assert.equal(convertDocumentUnit(2, "inch", "px", 300), 600);
      // px -> inch at 300 DPI
      assert.equal(convertDocumentUnit(600, "px", "inch", 300), 2);
    });

    test("switching units updates active dimension values cleanly in updatePrintSettings", () => {
      let settings = { ...DEFAULT_PRINT_SETTINGS, unit: "mm", width: 85.6, height: 53.98 };

      // Switch to inches
      settings = updatePrintSettings(settings, { unit: "inch" });
      assert.equal(settings.unit, "inch");
      assert.equal(settings.width, 3.37);
      assert.equal(settings.height, 2.13);
      assert.equal(settings.widthMm, 85.6);
      assert.equal(settings.heightMm, 53.98);

      // Switch to pixels
      settings = updatePrintSettings(settings, { unit: "px" });
      assert.equal(settings.unit, "px");
      assert.equal(settings.width, 1011);
      assert.equal(settings.height, 638);
      assert.equal(settings.widthMm, 85.6);
      assert.equal(settings.heightMm, 53.98);

      // Switch back to mm
      settings = updatePrintSettings(settings, { unit: "mm" });
      assert.equal(settings.unit, "mm");
      assert.equal(settings.width, 85.6);
      assert.equal(settings.height, 53.98);
    });
  });

  // =========================================================================
  // 5. ASPECT RATIO PRESERVATION & BEHAVIOR
  // =========================================================================
  describe("5. Aspect Ratio Behavior & Proportional Resizing", () => {
    test("when Maintain Aspect Ratio is enabled, changing width automatically adjusts height", () => {
      const ratio = 85.6 / 53.98; // ~1.58577...
      const res = adjustDimensionWithAspectRatio("width", 100, ratio, "mm");

      assert.equal(res.width, 100);
      // height = 100 / 1.5857725... = 63.06
      assert.equal(res.height, 63.06);
    });

    test("when Maintain Aspect Ratio is enabled, changing height automatically adjusts width", () => {
      const ratio = 85.6 / 53.98; // ~1.58577...
      const res = adjustDimensionWithAspectRatio("height", 60, ratio, "mm");

      // width = 60 * 1.5857725... = 95.15
      assert.equal(res.width, 95.15);
      assert.equal(res.height, 60);
    });

    test("aspect ratio adjustment rounds to integers when unit is pixels", () => {
      const ratio = 1011 / 638; // ~1.5846
      const resW = adjustDimensionWithAspectRatio("width", 2000, ratio, "px");
      assert.equal(resW.width, 2000);
      assert.equal(resW.height, Math.round(2000 / ratio));

      const resH = adjustDimensionWithAspectRatio("height", 1000, ratio, "px");
      assert.equal(resH.height, 1000);
      assert.equal(resH.width, Math.round(1000 * ratio));
    });

    test("updatePrintSettings maintains aspect ratio when maintainAspectRatio is true", () => {
      let settings = { ...DEFAULT_PRINT_SETTINGS, maintainAspectRatio: true };
      const originalRatio = settings.aspectRatio;

      settings = updatePrintSettings(settings, { width: 120 });
      assert.equal(settings.width, 120);
      assert.equal(settings.height, Number((120 / originalRatio).toFixed(2)));
      assert.equal(settings.dimensionPreset, "custom", "Manual edit should switch to custom preset");
    });

    test("updatePrintSettings allows independent width and height when maintainAspectRatio is false", () => {
      let settings = { ...DEFAULT_PRINT_SETTINGS, maintainAspectRatio: false };

      settings = updatePrintSettings(settings, { width: 120 });
      assert.equal(settings.width, 120);
      assert.equal(settings.height, 53.98, "Height must remain untouched when aspect ratio lock is off");

      settings = updatePrintSettings(settings, { height: 75 });
      assert.equal(settings.width, 120, "Width must remain untouched when aspect ratio lock is off");
      assert.equal(settings.height, 75);
    });
  });

  // =========================================================================
  // 6. DIMENSION VALIDATION & SAFETY
  // =========================================================================
  describe("6. Dimension Input Validation & Safety", () => {
    test("validates normal dimensions as valid with zero errors", () => {
      const res = validateDocumentDimensions(85.6, 53.98, "mm", 300);
      assert.equal(res.isValid, true);
      assert.equal(Object.keys(res.errors).length, 0);
      assert.equal(res.widthMm, 85.6);
      assert.equal(res.heightMm, 53.98);
      assert.equal(res.widthPx, 1011);
      assert.equal(res.heightPx, 638);
    });

    test("rejects zero and negative dimensions", () => {
      const zeroW = validateDocumentDimensions(0, 50, "mm", 300);
      assert.equal(zeroW.isValid, false);
      assert.ok(zeroW.errors.width?.includes("positive number"));

      const negH = validateDocumentDimensions(80, -5, "mm", 300);
      assert.equal(negH.isValid, false);
      assert.ok(negH.errors.height?.includes("positive number"));
    });

    test("rejects dimensions below minimum threshold (< 5 mm)", () => {
      const tooSmall = validateDocumentDimensions(2, 50, "mm", 300);
      assert.equal(tooSmall.isValid, false);
      assert.ok(tooSmall.errors.width?.includes("at least 5 mm"));
    });

    test("rejects excessively large dimensions (> 1000 mm / > 10000 px)", () => {
      const tooLargeMm = validateDocumentDimensions(1500, 50, "mm", 300);
      assert.equal(tooLargeMm.isValid, false);
      assert.ok(tooLargeMm.errors.width?.includes("cannot exceed 1000 mm"));

      const tooLargePx = validateDocumentDimensions(12000, 500, "px", 300);
      assert.equal(tooLargePx.isValid, false);
      assert.ok(tooLargePx.errors.width?.includes("cannot exceed 10000 px"));
    });

    test("rejects NaN and non-numbers", () => {
      const nanRes = validateDocumentDimensions(NaN, 50, "mm", 300);
      assert.equal(nanRes.isValid, false);
      assert.ok(nanRes.errors.width);
    });
  });

  // =========================================================================
  // 7. RESOLUTION SUFFICIENCY & ZERO ARTIFICIAL UPSCALING
  // =========================================================================
  describe("7. Resolution Sufficiency & Warning Diagnostics", () => {
    test("triggers insufficient resolution warning when source pixels are below target DPI requirements", () => {
      // Aadhaar 85.6 × 53.98 mm at 300 DPI requires 1011 × 638 px
      // Source image is only 640 × 400 px (~188 DPI)
      const sourceDims = { width: 640, height: 400, aspectRatio: 1.6 };

      const check = checkResolutionSufficiency({
        sourceDimensions: sourceDims,
        targetWidthMm: 85.6,
        targetHeightMm: 53.98,
        selectedDpi: 300,
        dimensionPreset: "aadhaar",
      });

      assert.equal(check.isInsufficient, true);
      assert.equal(check.sourceWidthPx, 640);
      assert.equal(check.sourceHeightPx, 400);
      assert.equal(check.requiredWidthPx, 1011);
      assert.equal(check.requiredHeightPx, 638);
      assert.equal(check.effectiveDpi, 188);
      assert.equal(check.targetDpi, 300);
      assert.ok(check.message?.includes("lower than recommended"));
      assert.ok(check.message?.includes("without artificial upscaling"));
    });

    test("does not warn when source image resolution meets or exceeds target DPI requirements", () => {
      // Source image has 1200 × 760 px (~356 DPI), target is 300 DPI
      const sourceDims = { width: 1200, height: 760, aspectRatio: 1200 / 760 };

      const check = checkResolutionSufficiency({
        sourceDimensions: sourceDims,
        targetWidthMm: 85.6,
        targetHeightMm: 53.98,
        selectedDpi: 300,
        dimensionPreset: "aadhaar",
      });

      assert.equal(check.isInsufficient, false);
      assert.equal(check.effectiveDpi, 356);
      assert.equal(check.message, undefined);
    });

    test("original size preset never triggers resolution insufficiency warning", () => {
      const sourceDims = { width: 500, height: 300, aspectRatio: 500 / 300 };

      const check = checkResolutionSufficiency({
        sourceDimensions: sourceDims,
        targetWidthMm: 85.6,
        targetHeightMm: 53.98,
        selectedDpi: 600,
        dimensionPreset: "original",
      });

      assert.equal(check.isInsufficient, false);
      assert.equal(check.requiredWidthPx, 500);
      assert.equal(check.requiredHeightPx, 300);
    });

    test("handles null or missing source dimensions gracefully without crashing", () => {
      const check = checkResolutionSufficiency({
        sourceDimensions: null,
        targetWidthMm: 85.6,
        targetHeightMm: 53.98,
        selectedDpi: 300,
      });

      assert.equal(check.isInsufficient, false);
      assert.equal(check.hasDimensions, false);
    });
  });

  // =========================================================================
  // 8. FRONT & BACK STATE PERSISTENCE & INDEPENDENCE
  // =========================================================================
  describe("8. Front/Back Settings Architecture & Persistence", () => {
    test("Front and Back sides initialize with independent printSettings objects", () => {
      const frontSettings = createDefaultPrintSettings("aadhaar");
      const backSettings = createDefaultPrintSettings("aadhaar");

      assert.notEqual(frontSettings, backSettings, "Must not share identical object references");
      assert.deepEqual(frontSettings, backSettings);
    });

    test("mutating Front printSettings does NOT mutate Back printSettings", () => {
      let frontSettings = createDefaultPrintSettings("aadhaar");
      let backSettings = createDefaultPrintSettings("aadhaar");

      // Update Front to 600 DPI and custom width
      frontSettings = updatePrintSettings(frontSettings, {
        qualityPreset: "maximum",
        width: 100,
      });

      assert.equal(frontSettings.dpi, 600);
      assert.equal(frontSettings.qualityPreset, "maximum");
      assert.equal(frontSettings.width, 100);

      // Back must remain unchanged at 300 DPI and 85.6 mm
      assert.equal(backSettings.dpi, 300);
      assert.equal(backSettings.qualityPreset, "high");
      assert.equal(backSettings.width, 85.6);
    });

    test("mutating Back printSettings does NOT mutate Front printSettings", () => {
      let frontSettings = createDefaultPrintSettings("pan");
      let backSettings = createDefaultPrintSettings("pan");

      // Update Back to standard 150 DPI
      backSettings = updatePrintSettings(backSettings, {
        qualityPreset: "standard",
      });

      assert.equal(backSettings.dpi, 150);
      assert.equal(backSettings.qualityPreset, "standard");

      // Front must remain unchanged at 300 DPI
      assert.equal(frontSettings.dpi, 300);
      assert.equal(frontSettings.qualityPreset, "high");
    });

    test("simulated side switching preserves both Front and Back configurations intact", () => {
      let frontSettings = createDefaultPrintSettings("aadhaar");
      let backSettings = createDefaultPrintSettings("aadhaar");

      // User configures Front: 600 DPI, inch unit
      frontSettings = updatePrintSettings(frontSettings, {
        qualityPreset: "maximum",
        unit: "inch",
      });

      // User configures Back: 150 DPI, mm unit
      backSettings = updatePrintSettings(backSettings, {
        qualityPreset: "standard",
        unit: "mm",
      });

      // User switches tab back and forth
      let activeSide = "front";
      let current = activeSide === "front" ? frontSettings : backSettings;
      assert.equal(current.dpi, 600);
      assert.equal(current.unit, "inch");

      activeSide = "back";
      current = activeSide === "front" ? frontSettings : backSettings;
      assert.equal(current.dpi, 150);
      assert.equal(current.unit, "mm");

      activeSide = "front";
      current = activeSide === "front" ? frontSettings : backSettings;
      assert.equal(current.dpi, 600);
      assert.equal(current.unit, "inch");
    });
  });

  // =========================================================================
  // 9. PHASE 1 DOCUMENT ENHANCEMENT NON-REGRESSION
  // =========================================================================
  describe("9. Phase 1 Document Enhancement Preservation", () => {
    test("enhancement default settings remain intact and functional", () => {
      const enhance = createDefaultEnhancementSettings();
      assert.deepEqual(enhance, DEFAULT_ENHANCEMENT_SETTINGS);
      assert.equal(enhance.brightness, -6);
      assert.equal(enhance.contrast, 33);
      assert.equal(enhance.saturation, 33);
      assert.equal(enhance.sharpness, 33);
      assert.equal(isEnhancementActive(enhance), true);
    });

    test("isEnhancementActive correctly detects active enhancements alongside print settings", () => {
      const enhance = createDefaultEnhancementSettings();
      enhance.contrast = 25;
      assert.equal(isEnhancementActive(enhance), true);

      const print = createDefaultPrintSettings("aadhaar");
      assert.equal(print.dpi, 300);
      // Both coexist independently
      assert.equal(isEnhancementActive(enhance), true);
    });
  });
});
