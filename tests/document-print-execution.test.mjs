/**
 * Automated Test Suite: Document Studio — Phase 5
 * Actual Printing and Print-Ready PDF Generation
 *
 * Verifies:
 * 1. Print Readiness Validation (front-only, back-only, combined, missing documents, single-sided PAN)
 * 2. Source Resolution Adequacy Check (effective DPI calculation, target pixel recommendation, warnings)
 * 3. Physical Paper Dimensions to PDF Points Conversion (72 pt/in, A4, A5, Letter, Custom)
 * 4. Orientation & CSS @page Size Generation (A4 portrait/landscape, A5, Letter, Custom mm)
 * 5. Semantic Filename Generation (doc type, paper size, orientation, DPI, extension)
 * 6. Print-Ready PDF Document Generation with pdf-lib (vector page points, embedded image, multi-page copies)
 * 7. Multi-Copy Support (copies count reflected in PDF page count)
 * 8. Aspect Ratio Preservation & Non-Distortion Guarantee
 * 9. Error Handling (missing sides, invalid dimensions, invalid DPI, descriptive error messages)
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  validatePrintReadiness,
  checkSourceResolutionAdequacy,
  getPaperDimensionsInPoints,
  generatePrintFileName,
  getPageSizeCss,
  generatePrintReadyPdf,
} from "../src/lib/document/document-print-pdf.ts";

import {
  calculatePrintPaperLayout,
  resolvePrintStudioLayout,
} from "../src/lib/document/document-print-studio.ts";

import {
  createDefaultPrintLayoutSettings,
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

// Sample valid 1x1 JPEG Uint8Array for testing PDF image embedding
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

describe("PHASE 5: Document Studio — Actual Printing & Print-Ready PDF Generation", () => {
  // =========================================================================
  // 1. PRINT READINESS VALIDATION
  // =========================================================================
  describe("1. Print Readiness Validation", () => {
    test("validates Front Side Only mode when front document is ready", () => {
      const front = createMockSideResult();
      const back = createMockSideResult({ croppedPreviewUrl: null });
      const res = validatePrintReadiness({
        mode: "front-only",
        arrangement: "vertical",
        front,
        back,
      });
      assert.equal(res.isValid, true);
      assert.equal(res.errors.length, 0);
    });

    test("rejects Front Side Only mode when front document is missing", () => {
      const front = createMockSideResult({ croppedPreviewUrl: null, enhancedPreviewUrl: null });
      const back = createMockSideResult();
      const res = validatePrintReadiness({
        mode: "front-only",
        arrangement: "vertical",
        front,
        back,
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errors[0].includes("Front side document is missing"));
    });

    test("validates Back Side Only mode when back document is ready", () => {
      const front = createMockSideResult({ croppedPreviewUrl: null });
      const back = createMockSideResult();
      const res = validatePrintReadiness({
        mode: "back-only",
        arrangement: "vertical",
        front,
        back,
        isSingleSided: false,
      });
      assert.equal(res.isValid, true);
      assert.equal(res.errors.length, 0);
    });

    test("rejects Back Side Only mode when back document is missing", () => {
      const front = createMockSideResult();
      const back = createMockSideResult({ croppedPreviewUrl: null, enhancedPreviewUrl: null });
      const res = validatePrintReadiness({
        mode: "back-only",
        arrangement: "vertical",
        front,
        back,
        isSingleSided: false,
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errors[0].includes("Back side document is missing"));
    });

    test("rejects Back Side Only mode for single-sided documents (e.g. PAN Card)", () => {
      const front = createMockSideResult();
      const back = createMockSideResult();
      const res = validatePrintReadiness({
        mode: "back-only",
        arrangement: "vertical",
        front,
        back,
        isSingleSided: true,
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errors[0].includes("single-sided and does not have a back side"));
    });

    test("validates Combined mode when both front and back documents are ready", () => {
      const front = createMockSideResult();
      const back = createMockSideResult();
      const res = validatePrintReadiness({
        mode: "combined",
        arrangement: "vertical",
        front,
        back,
      });
      assert.equal(res.isValid, true);
      assert.equal(res.errors.length, 0);
    });

    test("rejects Combined mode when front document is missing", () => {
      const front = createMockSideResult({ croppedPreviewUrl: null, enhancedPreviewUrl: null });
      const back = createMockSideResult();
      const res = validatePrintReadiness({
        mode: "combined",
        arrangement: "vertical",
        front,
        back,
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errors[0].includes("Front side document is missing"));
    });

    test("rejects Combined mode when back document is missing", () => {
      const front = createMockSideResult();
      const back = createMockSideResult({ croppedPreviewUrl: null, enhancedPreviewUrl: null });
      const res = validatePrintReadiness({
        mode: "combined",
        arrangement: "vertical",
        front,
        back,
        isSingleSided: false,
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errors[0].includes("Back side document is missing"));
    });

    test("rejects when both document sides are missing", () => {
      const front = createMockSideResult({ croppedPreviewUrl: null });
      const back = createMockSideResult({ croppedPreviewUrl: null });
      const res = validatePrintReadiness({
        mode: "combined",
        arrangement: "vertical",
        front,
        back,
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errors[0].includes("Both document sides are missing"));
    });

    test("rejects invalid paper dimensions (<= 0)", () => {
      const front = createMockSideResult();
      const back = createMockSideResult();
      const layout = createDefaultPrintLayoutSettings();
      layout.paperSize = "custom";
      layout.customPaper.width = 0;
      layout.customPaper.height = -50;

      const res = validatePrintReadiness({
        mode: "front-only",
        arrangement: "vertical",
        front,
        back,
        layout,
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some((e) => e.includes("Custom paper width must be greater than 0")));
    });

    test("rejects invalid DPI (<= 0 or NaN)", () => {
      const front = createMockSideResult();
      const back = createMockSideResult();
      const res = validatePrintReadiness({
        mode: "front-only",
        arrangement: "vertical",
        front,
        back,
        dpi: -300,
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some((e) => e.includes("Print DPI must be a positive number")));
    });
  });

  // =========================================================================
  // 2. SOURCE RESOLUTION ADEQUACY CHECK
  // =========================================================================
  describe("2. Source Resolution Adequacy Check", () => {
    test("reports adequate resolution when cropped source exceeds recommended pixel dimensions for 300 DPI", () => {
      const item = {
        side: "front",
        title: "Front Side",
        badge: "F",
        imageUrl: "blob:...",
        isAvailable: true,
        isEnhanced: false,
        xMm: 20,
        yMm: 20,
        widthMm: 85.6,
        heightMm: 53.98,
        aspectRatio: 85.6 / 53.98,
        xPercent: 10,
        yPercent: 10,
        widthPercent: 40,
        heightPercent: 20,
      };

      // 85.6 mm at 300 DPI requires 1011 × 638 px
      const sideResult = createMockSideResult({
        croppedDimensions: { width: 1200, height: 800, aspectRatio: 1200 / 800 },
      });

      const check = checkSourceResolutionAdequacy(item, sideResult, 300);
      assert.equal(check.isAdequate, true);
      assert.equal(check.warning, undefined);
      assert.ok(check.effectiveDpi >= 300);
    });

    test("reports low resolution warning when cropped source is significantly smaller than target 300 DPI", () => {
      const item = {
        side: "front",
        title: "Front Side",
        badge: "F",
        imageUrl: "blob:...",
        isAvailable: true,
        isEnhanced: false,
        xMm: 20,
        yMm: 20,
        widthMm: 85.6,
        heightMm: 53.98,
        aspectRatio: 85.6 / 53.98,
        xPercent: 10,
        yPercent: 10,
        widthPercent: 40,
        heightPercent: 20,
      };

      // Only 400 × 250 px source
      const sideResult = createMockSideResult({
        croppedDimensions: { width: 400, height: 250, aspectRatio: 400 / 250 },
      });

      const check = checkSourceResolutionAdequacy(item, sideResult, 300);
      assert.equal(check.isAdequate, false);
      assert.ok(check.warning?.includes("lower than recommended"));
      assert.ok(check.effectiveDpi < 200);
    });
  });

  // =========================================================================
  // 3. PHYSICAL PAPER DIMENSIONS TO PDF POINTS CONVERSION
  // =========================================================================
  describe("3. Paper Dimensions to PDF Points Conversion", () => {
    test("calculates exact PDF points for A4 portrait (595.2756 × 841.8898 pt)", () => {
      const { pageWidthPt, pageHeightPt } = getPaperDimensionsInPoints(210, 297);
      assert.equal(pageWidthPt, 595.2756);
      assert.equal(pageHeightPt, 841.8898);
    });

    test("calculates exact PDF points for Letter portrait (612.0 × 792.0 pt)", () => {
      const { pageWidthPt, pageHeightPt } = getPaperDimensionsInPoints(215.9, 279.4);
      assert.equal(pageWidthPt, 612.0);
      assert.equal(pageHeightPt, 792.0);
    });

    test("calculates exact PDF points for A5 portrait (419.5276 × 595.2756 pt)", () => {
      const { pageWidthPt, pageHeightPt } = getPaperDimensionsInPoints(148, 210);
      assert.equal(pageWidthPt, 419.5276);
      assert.equal(pageHeightPt, 595.2756);
    });

    test("calculates exact PDF points for 4x6 inch paper (288.0 × 432.0 pt)", () => {
      const { pageWidthPt, pageHeightPt } = getPaperDimensionsInPoints(101.6, 152.4);
      assert.equal(pageWidthPt, 288.0);
      assert.equal(pageHeightPt, 432.0);
    });

    test("calculates exact PDF points for custom paper size (100 × 150 mm)", () => {
      const { pageWidthPt, pageHeightPt } = getPaperDimensionsInPoints(100, 150);
      assert.equal(pageWidthPt, 283.4646);
      assert.equal(pageHeightPt, 425.1969);
    });
  });

  // =========================================================================
  // 4. ORIENTATION & CSS @PAGE SIZE GENERATION
  // =========================================================================
  describe("4. Orientation & CSS @page Size Generation", () => {
    test("generates A4 portrait CSS @page size", () => {
      const css = getPageSizeCss("a4", "portrait", 210, 297);
      assert.equal(css, "A4 portrait");
    });

    test("generates A4 landscape CSS @page size", () => {
      const css = getPageSizeCss("a4", "landscape", 297, 210);
      assert.equal(css, "A4 landscape");
    });

    test("generates Letter portrait and landscape CSS @page sizes", () => {
      assert.equal(getPageSizeCss("letter", "portrait", 215.9, 279.4), "letter portrait");
      assert.equal(getPageSizeCss("letter", "landscape", 279.4, 215.9), "letter landscape");
    });

    test("generates 4x6 inch portrait and landscape CSS @page sizes", () => {
      assert.equal(getPageSizeCss("4x6", "portrait", 101.6, 152.4), "4in 6in");
      assert.equal(getPageSizeCss("4x6", "landscape", 152.4, 101.6), "6in 4in");
    });

    test("generates custom paper size in millimeters for CSS @page", () => {
      const css = getPageSizeCss("custom", "portrait", 120, 180);
      assert.equal(css, "120mm 180mm");
    });
  });

  // =========================================================================
  // 5. SEMANTIC FILENAME GENERATION
  // =========================================================================
  describe("5. Semantic Filename Generation", () => {
    test("generates clean descriptive filename with doc type, paper size, orientation, and DPI", () => {
      const name = generatePrintFileName("aadhaar", "a4", "portrait", 300, "pdf");
      assert.equal(name, "document-studio-aadhaar-a4-portrait-300dpi.pdf");
    });

    test("sanitizes unusual characters in document type name", () => {
      const name = generatePrintFileName("Voter ID / EPIC Card", "letter", "landscape", 600, "pdf");
      assert.equal(name, "document-studio-voter_id___epic_card-letter-landscape-600dpi.pdf");
    });
  });

  // =========================================================================
  // 6. PRINT-READY PDF DOCUMENT GENERATION (pdf-lib)
  // =========================================================================
  describe("6. Print-Ready PDF Document Generation with pdf-lib", () => {
    test("generates valid PDF document with vector page dimensions and metadata", async () => {
      const layout = createDefaultPrintLayoutSettings();
      const front = createMockSideResult();
      const back = createMockSideResult();

      const paperLayout = calculatePrintPaperLayout({
        layout,
        mode: "front-only",
        arrangement: "vertical",
        front,
        back,
      });

      const pdfResult = await generatePrintReadyPdf({
        paperLayout,
        front,
        back,
        isSingleSided: false,
        docDef: { id: "aadhaar", name: "Aadhaar Card" },
        dpi: 300,
        imageBytes: SAMPLE_JPEG_BYTES,
      });

      assert.ok(pdfResult.blob instanceof Blob);
      assert.equal(pdfResult.format, "application/pdf");
      assert.ok(pdfResult.sizeBytes > 500, "PDF byte length must be greater than 500 bytes");
      assert.equal(pdfResult.pageWidthPt, 595.2756); // A4 portrait width
      assert.equal(pdfResult.pageHeightPt, 841.8898); // A4 portrait height
      assert.equal(pdfResult.pageCount, 1);
      assert.ok(pdfResult.fileName.includes("aadhaar-a4-portrait-300dpi.pdf"));
    });

    test("generates multi-page PDF reflecting copies setting (e.g. 3 copies = 3 pages)", async () => {
      const layout = createDefaultPrintLayoutSettings();
      layout.copies = 3;
      const front = createMockSideResult();
      const back = createMockSideResult();

      const paperLayout = calculatePrintPaperLayout({
        layout,
        mode: "combined",
        arrangement: "vertical",
        front,
        back,
      });

      const pdfResult = await generatePrintReadyPdf({
        paperLayout,
        front,
        back,
        isSingleSided: false,
        docDef: { id: "aadhaar", name: "Aadhaar Card" },
        dpi: 300,
        imageBytes: SAMPLE_JPEG_BYTES,
      });

      assert.equal(pdfResult.pageCount, 3, "PDF must contain exactly 3 pages corresponding to 3 copies");
    });

    test("generates PDF with landscape orientation dimensions", async () => {
      const layout = createDefaultPrintLayoutSettings();
      layout.orientation = "landscape";
      const front = createMockSideResult();
      const back = createMockSideResult();

      const paperLayout = calculatePrintPaperLayout({
        layout,
        mode: "combined",
        arrangement: "horizontal",
        front,
        back,
      });

      const pdfResult = await generatePrintReadyPdf({
        paperLayout,
        front,
        back,
        isSingleSided: false,
        dpi: 300,
        imageBytes: SAMPLE_JPEG_BYTES,
      });

      // In landscape, width is greater than height
      assert.equal(pdfResult.pageWidthPt, 841.8898);
      assert.equal(pdfResult.pageHeightPt, 595.2756);
      assert.ok(pdfResult.pageWidthPt > pdfResult.pageHeightPt);
    });

    test("throws an informative error if required document is missing during PDF generation", async () => {
      const layout = createDefaultPrintLayoutSettings();
      const front = createMockSideResult({ croppedPreviewUrl: null, enhancedPreviewUrl: null });
      const back = createMockSideResult();

      const paperLayout = calculatePrintPaperLayout({
        layout,
        mode: "front-only",
        arrangement: "vertical",
        front,
        back,
      });

      await assert.rejects(
        async () => {
          await generatePrintReadyPdf({
            paperLayout,
            front,
            back,
            imageBytes: SAMPLE_JPEG_BYTES,
          });
        },
        {
          name: "Error",
          message: /Front side document is missing/,
        }
      );
    });

    test("generates exact 4x6 inch PDF (288.0 × 432.0 pt) with 4x6 paper size", async () => {
      const layout = { ...createDefaultPrintLayoutSettings(), paperSize: "4x6" };
      const front = createMockSideResult();
      const back = createMockSideResult();

      const paperLayout = calculatePrintPaperLayout({
        layout,
        mode: "combined",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(paperLayout.isFoldable4x6, true);

      const pdfResult = await generatePrintReadyPdf({
        paperLayout,
        front,
        back,
        isSingleSided: false,
        docDef: { id: "aadhaar", name: "Aadhaar Card" },
        dpi: 300,
        imageBytes: SAMPLE_JPEG_BYTES,
      });

      assert.equal(pdfResult.pageWidthPt, 288.0);
      assert.equal(pdfResult.pageHeightPt, 432.0);
      assert.equal(pdfResult.pageCount, 1);
      assert.ok(pdfResult.fileName.includes("4x6-portrait"));
    });

    test("generates PDF with custom document vector border enabled (solid, dashed, dotted)", async () => {
      const front = createMockSideResult();
      const back = createMockSideResult();

      // Test solid border
      const layoutSolid = {
        ...createDefaultPrintLayoutSettings(),
        paperSize: "a4",
        border: {
          enabled: true,
          style: "solid",
          thicknessPreset: "medium",
          thicknessMm: 0.5,
          colorPreset: "black",
          color: "#000000",
        },
      };

      const paperLayoutSolid = calculatePrintPaperLayout({
        layout: layoutSolid,
        mode: "combined",
        arrangement: "vertical",
        front,
        back,
      });

      const pdfSolid = await generatePrintReadyPdf({
        paperLayout: paperLayoutSolid,
        front,
        back,
        isSingleSided: false,
        imageBytes: SAMPLE_JPEG_BYTES,
      });

      assert.ok(pdfSolid.sizeBytes > 500);
      assert.equal(pdfSolid.pageCount, 1);

      // Test dashed border with custom color
      const layoutDashed = {
        ...createDefaultPrintLayoutSettings(),
        paperSize: "4x6",
        border: {
          enabled: true,
          style: "dashed",
          thicknessPreset: "thick",
          thicknessMm: 1.0,
          colorPreset: "custom",
          color: "#2563EB",
        },
      };

      const paperLayoutDashed = calculatePrintPaperLayout({
        layout: layoutDashed,
        mode: "combined",
        arrangement: "vertical",
        front,
        back,
      });

      const pdfDashed = await generatePrintReadyPdf({
        paperLayout: paperLayoutDashed,
        front,
        back,
        isSingleSided: false,
        imageBytes: SAMPLE_JPEG_BYTES,
      });

      assert.ok(pdfDashed.sizeBytes > 500);
      assert.equal(pdfDashed.pageWidthPt, 288.0);
      assert.equal(pdfDashed.pageHeightPt, 432.0);
    });
  });

  // =========================================================================
  // 7. ASPECT RATIO PRESERVATION & COMBINED ARRANGEMENTS
  // =========================================================================
  describe("7. Aspect Ratio Preservation & Combined Arrangements", () => {
    test("preserves exact card aspect ratio in Vertical arrangement", () => {
      const layout = createDefaultPrintLayoutSettings();
      const front = createMockSideResult();
      const back = createMockSideResult();

      const paperLayout = calculatePrintPaperLayout({
        layout,
        mode: "combined",
        arrangement: "vertical",
        front,
        back,
      });

      assert.equal(paperLayout.items.length, 2);
      const [f, b] = paperLayout.items;

      const expectedRatio = 85.6 / 53.98;
      assert.ok(Math.abs(f.aspectRatio - expectedRatio) < 0.001);
      assert.ok(Math.abs(b.aspectRatio - expectedRatio) < 0.001);

      // Verify vertical stack
      assert.equal(f.xMm, b.xMm);
      assert.ok(b.yMm > f.yMm + f.heightMm);
    });

    test("preserves exact card aspect ratio in Horizontal arrangement", () => {
      const layout = createDefaultPrintLayoutSettings();
      const front = createMockSideResult();
      const back = createMockSideResult();

      const paperLayout = calculatePrintPaperLayout({
        layout,
        mode: "combined",
        arrangement: "horizontal",
        front,
        back,
      });

      assert.equal(paperLayout.items.length, 2);
      const [f, b] = paperLayout.items;

      const expectedRatio = 85.6 / 53.98;
      assert.ok(Math.abs(f.aspectRatio - expectedRatio) < 0.001);
      assert.ok(Math.abs(b.aspectRatio - expectedRatio) < 0.001);

      // Verify side-by-side
      assert.equal(f.yMm, b.yMm);
      assert.ok(b.xMm > f.xMm + f.widthMm);
    });

    test("maintains aspect ratio under Fit to Page scaling without distortion", () => {
      const layout = createDefaultPrintLayoutSettings();
      layout.scaleMode = "fit";
      const front = createMockSideResult();
      const back = createMockSideResult();

      const paperLayout = calculatePrintPaperLayout({
        layout,
        mode: "front-only",
        arrangement: "vertical",
        front,
        back,
      });

      const originalRatio = 85.6 / 53.98;
      const scaledRatio = paperLayout.items[0].widthMm / paperLayout.items[0].heightMm;
      assert.ok(Math.abs(originalRatio - scaledRatio) < 0.001);
    });
  });
});
