/**
 * Automated Test Suite: Document Studio — Phase 3
 * Print Studio and Print Mode Selection
 *
 * Verifies:
 * 1. Print Mode Selection & Options (Front Side Only, Back Side Only, Front + Back Combined)
 * 2. Front Side Only Mode (renders only front, hides back, preserves dimensions & aspect ratio)
 * 3. Back Side Only Mode (renders only back, hides front, preserves dimensions & aspect ratio)
 * 4. Front + Back Combined Mode (renders both, vertical & horizontal arrangements, labels, aspect ratio)
 * 5. Arrangement Selection (Vertical, Horizontal, validation and metadata)
 * 6. Missing Document Handling & Informative Empty States (front missing, back missing, single-sided PAN)
 * 7. Enhancement Reflection & Front/Back Enhancement Independence
 * 8. Document Dimensions & Aspect Ratio Reflection
 * 9. Relative Display Scaling (preserves physical proportions without distortion or overlap)
 * 10. Non-Regression of Existing Cropping, Enhancement, and Dimensions Features
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  PRINT_STUDIO_MODES,
  PRINT_STUDIO_ARRANGEMENTS,
  validatePrintStudioMode,
  validatePrintStudioArrangement,
  resolveActiveSideImage,
  resolvePrintStudioLayout,
  calculateRelativeDisplayScale,
} from "../src/lib/document/document-print-studio.ts";

import {
  createDefaultPrintStudioState,
  DEFAULT_PRINT_STUDIO_STATE,
  createDefaultPrintSettings,
  createDefaultEnhancementSettings,
  isEnhancementActive,
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

describe("PHASE 3: Document Studio — Print Studio & Print Mode Selection", () => {
  // =========================================================================
  // 1. PRINT MODE SELECTION & REGISTRY
  // =========================================================================
  describe("1. Print Mode Selection & Registry Options", () => {
    test("defines exactly three print modes: front-only, back-only, combined", () => {
      const modeIds = PRINT_STUDIO_MODES.map((m) => m.id);
      assert.deepEqual(modeIds, ["front-only", "back-only", "combined"]);
    });

    test("includes clear human-readable labels and descriptions for all three modes", () => {
      const frontOnly = PRINT_STUDIO_MODES.find((m) => m.id === "front-only");
      assert.equal(frontOnly?.label, "Front Side Only");
      assert.equal(frontOnly?.shortLabel, "Front Only");
      assert.equal(frontOnly?.sideBadge, "front");

      const backOnly = PRINT_STUDIO_MODES.find((m) => m.id === "back-only");
      assert.equal(backOnly?.label, "Back Side Only");
      assert.equal(backOnly?.shortLabel, "Back Only");
      assert.equal(backOnly?.sideBadge, "back");

      const combined = PRINT_STUDIO_MODES.find((m) => m.id === "combined");
      assert.equal(combined?.label, "Front + Back Combined");
      assert.equal(combined?.shortLabel, "Combined");
      assert.equal(combined?.sideBadge, "both");
    });

    test("validates PrintStudioMode values strictly", () => {
      assert.equal(validatePrintStudioMode("front-only"), true);
      assert.equal(validatePrintStudioMode("back-only"), true);
      assert.equal(validatePrintStudioMode("combined"), true);

      assert.equal(validatePrintStudioMode("both"), false);
      assert.equal(validatePrintStudioMode("single"), false);
      assert.equal(validatePrintStudioMode(null), false);
      assert.equal(validatePrintStudioMode(undefined), false);
      assert.equal(validatePrintStudioMode(123), false);
    });

    test("createDefaultPrintStudioState returns combined by default for dual-sided documents", () => {
      const defaultState = createDefaultPrintStudioState(false);
      assert.equal(defaultState.mode, "combined");
      assert.equal(defaultState.arrangement, "vertical");
      assert.deepEqual(defaultState, DEFAULT_PRINT_STUDIO_STATE);
    });

    test("createDefaultPrintStudioState returns front-only by default for single-sided documents", () => {
      const singleSidedState = createDefaultPrintStudioState(true);
      assert.equal(singleSidedState.mode, "front-only");
      assert.equal(singleSidedState.arrangement, "vertical");
    });
  });

  // =========================================================================
  // 2. FRONT SIDE ONLY MODE
  // =========================================================================
  describe("2. Front Side Only Mode", () => {
    test("displays only the front-side document and completely hides the back-side", () => {
      const front = createMockSideResult({
        croppedPreviewUrl: "blob:http://localhost/front-crop.png",
      });
      const back = createMockSideResult({
        croppedPreviewUrl: "blob:http://localhost/back-crop.png",
      });

      const layout = resolvePrintStudioLayout({
        mode: "front-only",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(layout.mode, "front-only");
      assert.equal(layout.sidesToRender.length, 1);
      assert.equal(layout.sidesToRender[0].side, "front");
      assert.equal(layout.sidesToRender[0].imageUrl, "blob:http://localhost/front-crop.png");
      assert.equal(layout.sidesToRender[0].badge, "F");

      // Verify back is NOT in sidesToRender
      const hasBackInRender = layout.sidesToRender.some((s) => s.side === "back");
      assert.equal(hasBackInRender, false, "Back side must be hidden from preview");
    });

    test("uses existing front-side crop and enhancement settings in Front Side Only mode", () => {
      const enhancements = createDefaultEnhancementSettings();
      enhancements.contrast = 20;
      enhancements.sharpness = 30;

      const front = createMockSideResult({
        croppedPreviewUrl: "blob:http://localhost/front-crop.png",
        enhancedPreviewUrl: "blob:http://localhost/front-enhanced.png",
        enhancements,
      });
      const back = createMockSideResult();

      const layout = resolvePrintStudioLayout({
        mode: "front-only",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(layout.sidesToRender[0].imageUrl, "blob:http://localhost/front-enhanced.png");
      assert.equal(layout.sidesToRender[0].isEnhanced, true);
      assert.equal(layout.sidesToRender[0].hasActiveEnhancements, true);
    });

    test("preserves front-side document dimensions and aspect ratio in Front Side Only mode", () => {
      const customPrintSettings = {
        ...createDefaultPrintSettings("aadhaar"),
        widthMm: 100,
        heightMm: 60,
      };

      const front = createMockSideResult({
        printSettings: customPrintSettings,
      });
      const back = createMockSideResult();

      const layout = resolvePrintStudioLayout({
        mode: "front-only",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(layout.sidesToRender[0].printSettings.widthMm, 100);
      assert.equal(layout.sidesToRender[0].printSettings.heightMm, 60);
      assert.equal(layout.sidesToRender[0].aspectRatio, 100 / 60);
    });
  });

  // =========================================================================
  // 3. BACK SIDE ONLY MODE
  // =========================================================================
  describe("3. Back Side Only Mode", () => {
    test("displays only the back-side document and completely hides the front-side", () => {
      const front = createMockSideResult({
        croppedPreviewUrl: "blob:http://localhost/front-crop.png",
      });
      const back = createMockSideResult({
        croppedPreviewUrl: "blob:http://localhost/back-crop.png",
      });

      const layout = resolvePrintStudioLayout({
        mode: "back-only",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(layout.mode, "back-only");
      assert.equal(layout.sidesToRender.length, 1);
      assert.equal(layout.sidesToRender[0].side, "back");
      assert.equal(layout.sidesToRender[0].imageUrl, "blob:http://localhost/back-crop.png");
      assert.equal(layout.sidesToRender[0].badge, "B");

      // Verify front is NOT in sidesToRender
      const hasFrontInRender = layout.sidesToRender.some((s) => s.side === "front");
      assert.equal(hasFrontInRender, false, "Front side must be hidden from preview");
    });

    test("uses existing back-side crop and enhancement settings in Back Side Only mode", () => {
      const backEnhancements = createDefaultEnhancementSettings();
      backEnhancements.grayscale = true;

      const front = createMockSideResult();
      const back = createMockSideResult({
        croppedPreviewUrl: "blob:http://localhost/back-crop.png",
        enhancedPreviewUrl: "blob:http://localhost/back-grayscale.png",
        enhancements: backEnhancements,
      });

      const layout = resolvePrintStudioLayout({
        mode: "back-only",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(layout.sidesToRender[0].imageUrl, "blob:http://localhost/back-grayscale.png");
      assert.equal(layout.sidesToRender[0].isEnhanced, true);
    });

    test("preserves back-side document dimensions and aspect ratio in Back Side Only mode", () => {
      const backPrintSettings = {
        ...createDefaultPrintSettings("pan"),
        widthMm: 85.6,
        heightMm: 53.98,
        dpi: 600,
      };

      const front = createMockSideResult();
      const back = createMockSideResult({
        printSettings: backPrintSettings,
      });

      const layout = resolvePrintStudioLayout({
        mode: "back-only",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(layout.sidesToRender[0].printSettings.dpi, 600);
      assert.equal(layout.sidesToRender[0].printSettings.widthMm, 85.6);
      assert.equal(layout.sidesToRender[0].aspectRatio, 85.6 / 53.98);
    });
  });

  // =========================================================================
  // 4. FRONT + BACK COMBINED MODE & ARRANGEMENT SELECTION
  // =========================================================================
  describe("4. Front + Back Combined Mode & Arrangement", () => {
    test("displays both front and back documents in combined mode", () => {
      const front = createMockSideResult({
        croppedPreviewUrl: "blob:http://localhost/front-crop.png",
      });
      const back = createMockSideResult({
        croppedPreviewUrl: "blob:http://localhost/back-crop.png",
      });

      const layout = resolvePrintStudioLayout({
        mode: "combined",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(layout.mode, "combined");
      assert.equal(layout.sidesToRender.length, 2);
      assert.equal(layout.sidesToRender[0].side, "front");
      assert.equal(layout.sidesToRender[1].side, "back");
      assert.equal(layout.allSidesAvailable, true);
    });

    test("defines and validates vertical and horizontal arrangements", () => {
      const arrIds = PRINT_STUDIO_ARRANGEMENTS.map((a) => a.id);
      assert.deepEqual(arrIds, ["vertical", "horizontal"]);

      assert.equal(validatePrintStudioArrangement("vertical"), true);
      assert.equal(validatePrintStudioArrangement("horizontal"), true);
      assert.equal(validatePrintStudioArrangement("stacked"), false);
      assert.equal(validatePrintStudioArrangement("grid"), false);
      assert.equal(validatePrintStudioArrangement(null), false);
    });

    test("reflects vertical arrangement with appropriate layout notice", () => {
      const front = createMockSideResult({ croppedPreviewUrl: "blob:http://localhost/f.png" });
      const back = createMockSideResult({ croppedPreviewUrl: "blob:http://localhost/b.png" });

      const layout = resolvePrintStudioLayout({
        mode: "combined",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(layout.arrangement, "vertical");
      assert.ok(layout.arrangementNotice?.includes("vertically"));
    });

    test("reflects horizontal arrangement with appropriate layout notice", () => {
      const front = createMockSideResult({ croppedPreviewUrl: "blob:http://localhost/f.png" });
      const back = createMockSideResult({ croppedPreviewUrl: "blob:http://localhost/b.png" });

      const layout = resolvePrintStudioLayout({
        mode: "combined",
        arrangement: "horizontal",
        front,
        back,
      });

      assert.equal(layout.arrangement, "horizontal");
      assert.ok(layout.arrangementNotice?.includes("horizontally"));
    });

    test("provides clear Front and Back badges and labels on both sides", () => {
      const front = createMockSideResult({ croppedPreviewUrl: "blob:http://localhost/f.png" });
      const back = createMockSideResult({ croppedPreviewUrl: "blob:http://localhost/b.png" });

      const layout = resolvePrintStudioLayout({
        mode: "combined",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(layout.sidesToRender[0].title, "Front Side");
      assert.equal(layout.sidesToRender[0].shortLabel, "Front");
      assert.equal(layout.sidesToRender[0].badge, "F");

      assert.equal(layout.sidesToRender[1].title, "Back Side");
      assert.equal(layout.sidesToRender[1].shortLabel, "Back");
      assert.equal(layout.sidesToRender[1].badge, "B");
    });

    test("maintains the correct aspect ratio of each side without distortion", () => {
      const front = createMockSideResult({
        printSettings: { ...createDefaultPrintSettings("aadhaar"), widthMm: 85.6, heightMm: 53.98 },
      });
      const back = createMockSideResult({
        printSettings: { ...createDefaultPrintSettings("aadhaar"), widthMm: 85.6, heightMm: 53.98 },
      });

      const layout = resolvePrintStudioLayout({
        mode: "combined",
        arrangement: "horizontal",
        front,
        back,
      });

      const expectedAspect = 85.6 / 53.98;
      assert.equal(layout.sidesToRender[0].aspectRatio, expectedAspect);
      assert.equal(layout.sidesToRender[1].aspectRatio, expectedAspect);
    });
  });

  // =========================================================================
  // 5. MISSING DOCUMENT HANDLING & EMPTY STATES
  // =========================================================================
  describe("5. Missing Document Handling & Empty States", () => {
    test("Front Side Only mode with missing front document provides informative empty state", () => {
      const front = createMockSideResult({ croppedPreviewUrl: null, isCropped: false });
      const back = createMockSideResult();

      const layout = resolvePrintStudioLayout({
        mode: "front-only",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(layout.sidesToRender[0].isAvailable, false);
      assert.equal(layout.sidesToRender[0].imageUrl, null);
      assert.ok(layout.sidesToRender[0].emptyReason?.includes("Front side document not available"));
      assert.equal(layout.allSidesAvailable, false);
    });

    test("Back Side Only mode with missing back document provides informative empty state", () => {
      const front = createMockSideResult();
      const back = createMockSideResult({ croppedPreviewUrl: null, isCropped: false });

      const layout = resolvePrintStudioLayout({
        mode: "back-only",
        arrangement: "vertical",
        front,
        back,
        isSingleSided: false,
      });

      assert.equal(layout.sidesToRender[0].isAvailable, false);
      assert.equal(layout.sidesToRender[0].imageUrl, null);
      assert.ok(layout.sidesToRender[0].emptyReason?.includes("Back side document not available"));
      assert.equal(layout.allSidesAvailable, false);
    });

    test("Back Side Only mode for single-sided document (PAN) explains single-sided nature", () => {
      const front = createMockSideResult();
      const back = createMockSideResult({ croppedPreviewUrl: null, isCropped: false });

      const layout = resolvePrintStudioLayout({
        mode: "back-only",
        arrangement: "vertical",
        front,
        back,
        isSingleSided: true,
      });

      assert.equal(layout.sidesToRender[0].isAvailable, false);
      assert.ok(layout.sidesToRender[0].emptyReason?.includes("single-sided"));
    });

    test("Combined mode with missing back document renders front and provides placeholder for back", () => {
      const front = createMockSideResult({ croppedPreviewUrl: "blob:http://localhost/front.png" });
      const back = createMockSideResult({ croppedPreviewUrl: null, isCropped: false });

      const layout = resolvePrintStudioLayout({
        mode: "combined",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(layout.sidesToRender.length, 2);
      assert.equal(layout.sidesToRender[0].isAvailable, true);
      assert.equal(layout.sidesToRender[0].imageUrl, "blob:http://localhost/front.png");

      assert.equal(layout.sidesToRender[1].isAvailable, false);
      assert.equal(layout.sidesToRender[1].imageUrl, null);
      assert.ok(layout.sidesToRender[1].emptyReason);
      assert.equal(layout.allSidesAvailable, false);
      assert.equal(layout.activeSideCount, 1);
    });

    test("Combined mode with missing front document renders back and provides placeholder for front", () => {
      const front = createMockSideResult({ croppedPreviewUrl: null, isCropped: false });
      const back = createMockSideResult({ croppedPreviewUrl: "blob:http://localhost/back.png" });

      const layout = resolvePrintStudioLayout({
        mode: "combined",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(layout.sidesToRender[0].isAvailable, false);
      assert.equal(layout.sidesToRender[1].isAvailable, true);
      assert.equal(layout.sidesToRender[1].imageUrl, "blob:http://localhost/back.png");
      assert.equal(layout.activeSideCount, 1);
    });

    test("Combined mode with both documents missing reports activeSideCount = 0", () => {
      const front = createMockSideResult({ croppedPreviewUrl: null, isCropped: false });
      const back = createMockSideResult({ croppedPreviewUrl: null, isCropped: false });

      const layout = resolvePrintStudioLayout({
        mode: "combined",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(layout.activeSideCount, 0);
      assert.equal(layout.allSidesAvailable, false);
      assert.equal(layout.sidesToRender[0].isAvailable, false);
      assert.equal(layout.sidesToRender[1].isAvailable, false);
    });
  });

  // =========================================================================
  // 6. ENHANCEMENT REFLECTION & INDEPENDENCE
  // =========================================================================
  describe("6. Enhancement Reflection & Side Independence", () => {
    test("unenhanced side resolves to croppedPreviewUrl with isEnhanced = false", () => {
      const side = createMockSideResult({
        croppedPreviewUrl: "blob:http://localhost/unenhanced.png",
        enhancedPreviewUrl: null,
      });

      const res = resolveActiveSideImage(side);
      assert.equal(res.imageUrl, "blob:http://localhost/unenhanced.png");
      assert.equal(res.isEnhanced, false);
      assert.equal(res.hasActiveEnhancements, false);
    });

    test("enhanced side with active enhancements resolves to enhancedPreviewUrl", () => {
      const enhancements = createDefaultEnhancementSettings();
      enhancements.brightness = 15;

      const side = createMockSideResult({
        croppedPreviewUrl: "blob:http://localhost/original.png",
        enhancedPreviewUrl: "blob:http://localhost/enhanced.png",
        enhancements,
      });

      const res = resolveActiveSideImage(side);
      assert.equal(res.imageUrl, "blob:http://localhost/enhanced.png");
      assert.equal(res.isEnhanced, true);
      assert.equal(res.hasActiveEnhancements, true);
    });

    test("preserves front and back enhancement independence in combined preview", () => {
      // Front is enhanced (brightness +25, sharpness 40)
      const frontEnhancements = createDefaultEnhancementSettings();
      frontEnhancements.brightness = 25;
      frontEnhancements.sharpness = 40;

      // Back is unenhanced
      const backEnhancements = createDefaultEnhancementSettings();

      const front = createMockSideResult({
        croppedPreviewUrl: "blob:http://localhost/front-crop.png",
        enhancedPreviewUrl: "blob:http://localhost/front-enhanced.png",
        enhancements: frontEnhancements,
      });

      const back = createMockSideResult({
        croppedPreviewUrl: "blob:http://localhost/back-crop.png",
        enhancedPreviewUrl: null,
        enhancements: backEnhancements,
      });

      const layout = resolvePrintStudioLayout({
        mode: "combined",
        arrangement: "vertical",
        front,
        back,
      });

      // Front must be enhanced
      assert.equal(layout.sidesToRender[0].imageUrl, "blob:http://localhost/front-enhanced.png");
      assert.equal(layout.sidesToRender[0].isEnhanced, true);

      // Back must remain unenhanced
      assert.equal(layout.sidesToRender[1].imageUrl, "blob:http://localhost/back-crop.png");
      assert.equal(layout.sidesToRender[1].isEnhanced, false);
    });

    test("handles null or undefined side objects gracefully without throwing", () => {
      const res = resolveActiveSideImage(null);
      assert.equal(res.imageUrl, null);
      assert.equal(res.isEnhanced, false);
      assert.equal(res.hasActiveEnhancements, false);
    });
  });

  // =========================================================================
  // 7. DOCUMENT DIMENSIONS & ASPECT RATIO REFLECTION
  // =========================================================================
  describe("7. Document Dimensions & Aspect Ratio Reflection", () => {
    test("reflects standard CR80 physical dimensions and DPI correctly", () => {
      const front = createMockSideResult({
        printSettings: createDefaultPrintSettings("aadhaar"),
      });
      const back = createMockSideResult({
        printSettings: createDefaultPrintSettings("aadhaar"),
      });

      const layout = resolvePrintStudioLayout({
        mode: "combined",
        arrangement: "horizontal",
        front,
        back,
      });

      assert.equal(layout.sidesToRender[0].printSettings.widthMm, 85.6);
      assert.equal(layout.sidesToRender[0].printSettings.heightMm, 53.98);
      assert.equal(layout.sidesToRender[0].printSettings.dpi, 300);

      assert.equal(layout.sidesToRender[1].printSettings.widthMm, 85.6);
      assert.equal(layout.sidesToRender[1].printSettings.heightMm, 53.98);
      assert.equal(layout.sidesToRender[1].printSettings.dpi, 300);
    });

    test("reflects custom dimensions and calculates aspect ratio accurately", () => {
      const customPrintSettings = {
        ...createDefaultPrintSettings("custom"),
        widthMm: 120,
        heightMm: 80,
        dpi: 600,
        dimensionPreset: "custom",
      };

      const front = createMockSideResult({
        printSettings: customPrintSettings,
      });
      const back = createMockSideResult();

      const layout = resolvePrintStudioLayout({
        mode: "front-only",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(layout.sidesToRender[0].printSettings.widthMm, 120);
      assert.equal(layout.sidesToRender[0].printSettings.heightMm, 80);
      assert.equal(layout.sidesToRender[0].aspectRatio, 120 / 80);
      assert.equal(layout.sidesToRender[0].printSettings.dpi, 600);
    });
  });

  // =========================================================================
  // 8. RELATIVE DISPLAY SCALING
  // =========================================================================
  describe("8. Relative Proportional Scaling Calculation", () => {
    test("calculates equal 1.0 scale factor when front and back dimensions are identical", () => {
      const frontSettings = createDefaultPrintSettings("aadhaar");
      const backSettings = createDefaultPrintSettings("aadhaar");

      const scale = calculateRelativeDisplayScale(frontSettings, backSettings);
      assert.equal(scale.frontScale, 1.0);
      assert.equal(scale.backScale, 1.0);
    });

    test("scales down smaller side proportionally when dimensions differ", () => {
      const frontSettings = {
        ...createDefaultPrintSettings("aadhaar"),
        widthMm: 100,
      };
      const backSettings = {
        ...createDefaultPrintSettings("aadhaar"),
        widthMm: 50,
      };

      const scale = calculateRelativeDisplayScale(frontSettings, backSettings);
      assert.equal(scale.frontScale, 1.0);
      assert.equal(scale.backScale, 0.5);
    });

    test("handles zero width gracefully without divide by zero error", () => {
      const frontSettings = {
        ...createDefaultPrintSettings("aadhaar"),
        widthMm: 0,
      };
      const backSettings = {
        ...createDefaultPrintSettings("aadhaar"),
        widthMm: 0,
      };

      const scale = calculateRelativeDisplayScale(frontSettings, backSettings);
      assert.equal(scale.frontScale, 1.0);
      assert.equal(scale.backScale, 1.0);
    });
  });

  // =========================================================================
  // 9. NON-REGRESSION OF EXISTING CORE FUNCTIONALITY
  // =========================================================================
  describe("9. Non-Regression of Existing Core Features", () => {
    test("existing enhancement creation and detection remain functional", () => {
      const settings = createDefaultEnhancementSettings();
      assert.equal(isEnhancementActive(settings), false);

      settings.invert = true;
      assert.equal(isEnhancementActive(settings), true);
    });

    test("existing print settings creation remains functional across document presets", () => {
      const aadhaar = createDefaultPrintSettings("aadhaar");
      assert.equal(aadhaar.dimensionPreset, "aadhaar");
      assert.equal(aadhaar.widthMm, 85.6);

      const pan = createDefaultPrintSettings("pan");
      assert.equal(pan.dimensionPreset, "pan");

      const voter = createDefaultPrintSettings("voter-id");
      assert.equal(voter.dimensionPreset, "voter-id");
    });
  });
});
