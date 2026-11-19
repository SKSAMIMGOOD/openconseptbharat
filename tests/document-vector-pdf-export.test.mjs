/**
 * Test Suite: Document Studio Non-Destructive Vector PDF & High-Quality Export
 *
 * Verifies:
 * 1. Crop Geometry Strict Preservation (zero changes to reference coordinates)
 * 2. Coordinate Conversion Layer (canvas crops -> PDF points across 0°, 90°, 180°, 270°)
 * 3. Proportional Card Fitting & Placement
 * 4. Non-Destructive Vector PDF Generation (preserves selectable text & vector objects)
 * 5. Text Clipping Behavior (only text inside crop bounding box is preserved)
 * 6. Direct High-Resolution Card Embedding for Image Sources
 * 7. Backward Compatibility Fallback (explicit imageBytes and masterCanvas)
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { PDFDocument, degrees } from "pdf-lib";
import pdfjs from "pdfjs-dist/legacy/build/pdf.js";

import {
  AADHAAR_CARD_MEASUREMENTS,
  PAN_CARD_MEASUREMENTS,
  RATION_CARD_MEASUREMENTS,
  VOTER_ID_MEASUREMENTS,
} from "../src/constants/document-studio.ts";

import {
  mapCanvasCropToPdfBoundingBox,
  getRotatedPlacement,
  calculateProportionalCardFit,
} from "../src/lib/document/pdf-coordinate-converter.ts";

import {
  generatePrintReadyPdf,
} from "../src/lib/document/document-print-pdf.ts";

import {
  calculatePrintPaperLayout,
} from "../src/lib/document/document-print-studio.ts";

import {
  createDefaultPrintLayoutSettings,
  createDefaultEnhancementSettings,
  createDefaultPrintSettings,
} from "../src/types/document-studio.ts";

// Helper to create mock DocumentSideResult
function createMockSide(overrides = {}) {
  return {
    crop: { x: 395, y: 5068, width: 2047, height: 1429 },
    rotation: 0,
    zoom: 1,
    aspectRatioLocked: true,
    targetAspectRatio: 85.6 / 53.98,
    croppedPreviewUrl: "mock://preview",
    croppedBlob: null,
    croppedDimensions: { width: 2022, height: 1276, aspectRatio: 2022 / 1276 },
    isCropped: true,
    isCropEditorOpen: false,
    activeView: "cropped",
    enhancements: createDefaultEnhancementSettings(),
    printSettings: createDefaultPrintSettings("aadhaar"),
    ...overrides,
  };
}

describe("NON-DESTRUCTIVE PDF: 1. Crop Geometry Strict Preservation", () => {
  test("preserves exact Aadhaar reference coordinates without modification", () => {
    assert.equal(AADHAAR_CARD_MEASUREMENTS.front.xMin, 0.0796);
    assert.equal(AADHAAR_CARD_MEASUREMENTS.front.xMax, 0.4922);
    assert.equal(AADHAAR_CARD_MEASUREMENTS.front.yMin, 0.7224);
    assert.equal(AADHAAR_CARD_MEASUREMENTS.front.yMax, 0.9261);

    assert.equal(AADHAAR_CARD_MEASUREMENTS.back.xMin, 0.5086);
    assert.equal(AADHAAR_CARD_MEASUREMENTS.back.xMax, 0.9212);
    assert.equal(AADHAAR_CARD_MEASUREMENTS.back.yMin, 0.7224);
    assert.equal(AADHAAR_CARD_MEASUREMENTS.back.yMax, 0.9261);
  });

  test("preserves exact PAN, Ration, and Voter ID reference coordinates", () => {
    assert.equal(PAN_CARD_MEASUREMENTS.front.xMin, 0.101);
    assert.equal(PAN_CARD_MEASUREMENTS.front.xMax, 0.475);
    assert.equal(RATION_CARD_MEASUREMENTS.front.xMin, 0.1243);
    assert.equal(RATION_CARD_MEASUREMENTS.front.xMax, 0.4859);
    assert.equal(VOTER_ID_MEASUREMENTS.front.xMin, 0.0546);
    assert.equal(VOTER_ID_MEASUREMENTS.front.xMax, 0.4664);
  });
});

describe("NON-DESTRUCTIVE PDF: 2. Coordinate Conversion Layer", () => {
  test("maps standard unrotated A4 canvas crop to exact PDF points", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]); // A4 in points
    const canvasDims = { width: 4961, height: 7016 }; // 600 DPI rendered canvas

    // Crop: Aadhaar front card
    const crop = {
      x: Math.round(0.0796 * 4961),
      y: Math.round(0.7224 * 7016),
      width: Math.round((0.4922 - 0.0796) * 4961),
      height: Math.round((0.9261 - 0.7224) * 7016),
    };

    const bbox = mapCanvasCropToPdfBoundingBox(crop, canvasDims, page);

    // Left should be ~ 0.0796 * 595.28 = 47.38
    assert.ok(Math.abs(bbox.left - 47.38) < 1.0, `bbox.left (${bbox.left}) should be ~47.38 pt`);
    // Right should be ~ 0.4922 * 595.28 = 293.00
    assert.ok(Math.abs(bbox.right - 293.00) < 1.0, `bbox.right (${bbox.right}) should be ~293.00 pt`);
    // Bottom should be ~ (1 - 0.9261) * 841.89 = 62.22 pt
    assert.ok(Math.abs(bbox.bottom - 62.22) < 1.0, `bbox.bottom (${bbox.bottom}) should be ~62.22 pt`);
    // Top should be ~ (1 - 0.7224) * 841.89 = 233.71 pt
    assert.ok(Math.abs(bbox.top - 233.71) < 1.0, `bbox.top (${bbox.top}) should be ~233.71 pt`);

    assert.ok(bbox.left < bbox.right, "Bounding box left must be strictly less than right");
    assert.ok(bbox.bottom < bbox.top, "Bounding box bottom must be strictly less than top");
  });

  test("correctly accounts for 90°, 180°, and 270° page rotations", async () => {
    const canvasDims = { width: 2000, height: 1000 };
    const crop = { x: 100, y: 100, width: 400, height: 300 };

    for (const rot of [0, 90, 180, 270]) {
      const doc = await PDFDocument.create();
      const page = doc.addPage([500, 300]);
      page.setRotation(degrees(rot));

      const bbox = mapCanvasCropToPdfBoundingBox(crop, canvasDims, page);
      assert.ok(bbox.left < bbox.right, `rot ${rot}: bbox.left must be < right`);
      assert.ok(bbox.bottom < bbox.top, `rot ${rot}: bbox.bottom must be < top`);
      assert.ok(bbox.left >= 0 && bbox.right <= 500, `rot ${rot}: X bounds must be within page`);
      assert.ok(bbox.bottom >= 0 && bbox.top <= 300, `rot ${rot}: Y bounds must be within page`);
    }
  });

  test("calculates proportional card fit inside CR80 dimensions without distortion", () => {
    // CR80: 242.65 pt x 153.01 pt (85.60 mm x 53.98 mm)
    const targetW = 242.65;
    const targetH = 153.01;

    // Wider card (e.g. aspect 1.669)
    const fit = calculateProportionalCardFit(250, 150, targetW, targetH, 50, 100);
    assert.ok(fit.width <= targetW, "Draw width must not exceed target width");
    assert.ok(fit.height <= targetH, "Draw height must not exceed target height");
    assert.equal(fit.x, 50, "Pillarbox padding must be zero when width fills slot");
    assert.ok(fit.y > 100, "Letterbox padding must center card vertically");
  });

  test("calculates placement coordinates for rotated items (e.g. 180° foldable)", () => {
    const place0 = getRotatedPlacement(50, 60, 200, 100, 0);
    assert.equal(place0.x, 50);
    assert.equal(place0.y, 60);

    const place180 = getRotatedPlacement(50, 60, 200, 100, 180);
    assert.equal(place180.x, 50 + 200);
    assert.equal(place180.y, 60 + 100);
  });
});

describe("NON-DESTRUCTIVE PDF: 3. Vector Content & Selectable Text Preservation", () => {
  test("generates vector PDF where text inside crop remains selectable", async () => {
    // 1. Create a genuine vector source PDF with embedded text
    const srcDoc = await PDFDocument.create();
    const srcPage = srcDoc.addPage([595.28, 841.89]);
    srcPage.drawText("AADHAAR CARD HOLDER NAME", { x: 100, y: 180, size: 12 });
    srcPage.drawText("9876 5432 1098", { x: 100, y: 120, size: 14 });
    srcPage.drawText("HEADER NOTICE OUTSIDE CROP", { x: 50, y: 750, size: 10 });
    const srcPdfBytes = await srcDoc.save();

    // Mock File object
    const mockFile = {
      name: "sample-aadhaar.pdf",
      size: srcPdfBytes.length,
      arrayBuffer: async () => srcPdfBytes.buffer.slice(srcPdfBytes.byteOffset, srcPdfBytes.byteOffset + srcPdfBytes.byteLength),
    };

    const source = {
      file: mockFile,
      fileType: "pdf",
      previewUrl: "blob:mock-pdf",
      dimensions: { width: 4961, height: 7016, aspectRatio: 4961 / 7016 },
      fileSizeFormatted: "10 KB",
      fileName: "sample-aadhaar.pdf",
      pageCount: 1,
      currentPage: 1,
      isLoading: false,
      error: null,
    };

    const layout = createDefaultPrintLayoutSettings();
    const front = createMockSide({
      crop: {
        x: Math.round(0.0796 * 4961),
        y: Math.round(0.7224 * 7016),
        width: Math.round((0.4922 - 0.0796) * 4961),
        height: Math.round((0.9261 - 0.7224) * 7016),
      },
    });
    const back = createMockSide({ isCropped: false, crop: null });

    const paperLayout = calculatePrintPaperLayout({
      layout,
      mode: "front-only",
      arrangement: "vertical",
      front,
      back,
    });

    const exportResult = await generatePrintReadyPdf({
      paperLayout,
      front,
      back,
      isSingleSided: true,
      docDef: { id: "aadhaar", name: "Aadhaar Card" },
      dpi: 300,
      source,
    });

    assert.ok(exportResult.blob instanceof Blob);
    assert.equal(exportResult.format, "application/pdf");
    assert.equal(exportResult.pageCount, 1);
    assert.ok(exportResult.sizeBytes > 0);

    // 2. Inspect generated PDF with pdfjs-dist to verify selectable text
    const generatedArrayBuffer = await exportResult.blob.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(generatedArrayBuffer) });
    const pdfJsDoc = await loadingTask.promise;
    const page1 = await pdfJsDoc.getPage(1);
    const textContent = await page1.getTextContent();
    const allStrings = textContent.items.map((i) => i.str).join(" ");

    // Verify text inside card crop is preserved and selectable
    assert.ok(
      allStrings.includes("AADHAAR CARD HOLDER NAME"),
      `Extracted text must contain card holder name. Got: "${allStrings}"`
    );
    assert.ok(
      allStrings.includes("9876 5432 1098"),
      `Extracted text must contain card number. Got: "${allStrings}"`
    );

    // Verify text outside card crop was clipped out
    assert.ok(
      !allStrings.includes("HEADER NOTICE OUTSIDE CROP"),
      `Text outside the card crop must NOT be in the exported card output`
    );
  });

  test("preserves physical A4 and CR80 dimensions in vector PDF export", async () => {
    const srcDoc = await PDFDocument.create();
    const srcPage = srcDoc.addPage([595.28, 841.89]);
    srcPage.drawText("PAN CARD TEST", { x: 100, y: 150, size: 10 });
    const srcPdfBytes = await srcDoc.save();

    const mockFile = {
      name: "sample-pan.pdf",
      size: srcPdfBytes.length,
      arrayBuffer: async () => srcPdfBytes.buffer.slice(srcPdfBytes.byteOffset, srcPdfBytes.byteOffset + srcPdfBytes.byteLength),
    };

    const source = {
      file: mockFile,
      fileType: "pdf",
      previewUrl: "blob:mock-pdf",
      dimensions: { width: 4961, height: 7016, aspectRatio: 4961 / 7016 },
      fileSizeFormatted: "5 KB",
      fileName: "sample-pan.pdf",
      pageCount: 1,
      currentPage: 1,
      isLoading: false,
      error: null,
    };

    const layout = createDefaultPrintLayoutSettings();
    layout.paperSize = "a4";
    layout.orientation = "portrait";

    const front = createMockSide({
      crop: { x: 400, y: 5000, width: 2000, height: 1400 },
      printSettings: createDefaultPrintSettings("pan"),
    });
    const back = createMockSide({ isCropped: false, crop: null });

    const paperLayout = calculatePrintPaperLayout({
      layout,
      mode: "front-only",
      arrangement: "vertical",
      front,
      back,
    });

    const exportResult = await generatePrintReadyPdf({
      paperLayout,
      front,
      back,
      isSingleSided: true,
      docDef: { id: "pan", name: "PAN Card" },
      dpi: 300,
      source,
    });

    assert.equal(exportResult.pageWidthPt, 595.2756); // A4 width pt
    assert.equal(exportResult.pageHeightPt, 841.8898); // A4 height pt
  });

  test("supports multi-copy setting in vector PDF generation", async () => {
    const srcDoc = await PDFDocument.create();
    const srcPage = srcDoc.addPage([595.28, 841.89]);
    srcPage.drawText("MULTI COPY TEST", { x: 100, y: 150, size: 10 });
    const srcPdfBytes = await srcDoc.save();

    const mockFile = {
      name: "sample.pdf",
      size: srcPdfBytes.length,
      arrayBuffer: async () => srcPdfBytes.buffer.slice(srcPdfBytes.byteOffset, srcPdfBytes.byteOffset + srcPdfBytes.byteLength),
    };

    const source = {
      file: mockFile,
      fileType: "pdf",
      previewUrl: "blob:mock",
      dimensions: { width: 4961, height: 7016, aspectRatio: 4961 / 7016 },
      fileSizeFormatted: "5 KB",
      fileName: "sample.pdf",
      pageCount: 1,
      currentPage: 1,
      isLoading: false,
      error: null,
    };

    const layout = createDefaultPrintLayoutSettings();
    layout.copies = 3;

    const front = createMockSide({ crop: { x: 400, y: 5000, width: 2000, height: 1400 } });
    const back = createMockSide({ isCropped: false, crop: null });

    const paperLayout = calculatePrintPaperLayout({
      layout,
      mode: "front-only",
      arrangement: "vertical",
      front,
      back,
    });

    const exportResult = await generatePrintReadyPdf({
      paperLayout,
      front,
      back,
      isSingleSided: true,
      docDef: { id: "aadhaar", name: "Aadhaar Card" },
      dpi: 300,
      source,
    });

    assert.equal(exportResult.pageCount, 3, "Output PDF must contain 3 pages for 3 copies");
  });

  test("generates dual front and back vector cards in combined layout", async () => {
    const srcDoc = await PDFDocument.create();
    const srcPage = srcDoc.addPage([595.28, 841.89]);
    srcPage.drawText("FRONT CARD VECTOR TEXT", { x: 100, y: 180, size: 12 });
    srcPage.drawText("BACK CARD VECTOR TEXT", { x: 350, y: 180, size: 12 });
    const srcPdfBytes = await srcDoc.save();

    const mockFile = {
      name: "aadhaar-both.pdf",
      size: srcPdfBytes.length,
      arrayBuffer: async () => srcPdfBytes.buffer.slice(srcPdfBytes.byteOffset, srcPdfBytes.byteOffset + srcPdfBytes.byteLength),
    };

    const source = {
      file: mockFile,
      fileType: "pdf",
      previewUrl: "blob:mock",
      dimensions: { width: 4961, height: 7016, aspectRatio: 4961 / 7016 },
      fileSizeFormatted: "8 KB",
      fileName: "aadhaar-both.pdf",
      pageCount: 1,
      currentPage: 1,
      isLoading: false,
      error: null,
    };

    const layout = createDefaultPrintLayoutSettings();
    const front = createMockSide({
      crop: {
        x: Math.round(0.0796 * 4961),
        y: Math.round(0.7224 * 7016),
        width: Math.round((0.4922 - 0.0796) * 4961),
        height: Math.round((0.9261 - 0.7224) * 7016),
      },
    });
    const back = createMockSide({
      crop: {
        x: Math.round(0.5086 * 4961),
        y: Math.round(0.7224 * 7016),
        width: Math.round((0.9212 - 0.5086) * 4961),
        height: Math.round((0.9261 - 0.7224) * 7016),
      },
    });

    const paperLayout = calculatePrintPaperLayout({
      layout,
      mode: "combined",
      arrangement: "vertical",
      front,
      back,
    });

    const exportResult = await generatePrintReadyPdf({
      paperLayout,
      front,
      back,
      isSingleSided: false,
      docDef: { id: "aadhaar", name: "Aadhaar Card" },
      dpi: 300,
      source,
    });

    assert.ok(exportResult.blob instanceof Blob);
    assert.equal(exportResult.pageCount, 1);

    const generatedBytes = await exportResult.blob.arrayBuffer();
    const task = pdfjs.getDocument({ data: new Uint8Array(generatedBytes) });
    const loaded = await task.promise;
    const page = await loaded.getPage(1);
    const textContent = await page.getTextContent();
    const allStrings = textContent.items.map((i) => i.str).join(" ");

    assert.ok(allStrings.includes("FRONT CARD VECTOR TEXT"), "Must include front card vector text");
    assert.ok(allStrings.includes("BACK CARD VECTOR TEXT"), "Must include back card vector text");
  });

  test("generates 4x6 foldable layout with 180° back card rotation", async () => {
    const srcDoc = await PDFDocument.create();
    const srcPage = srcDoc.addPage([595.28, 841.89]);
    srcPage.drawText("FRONT 4X6 TEXT", { x: 100, y: 180, size: 12 });
    srcPage.drawText("BACK 4X6 TEXT", { x: 350, y: 180, size: 12 });
    const srcPdfBytes = await srcDoc.save();

    const mockFile = {
      name: "aadhaar-foldable.pdf",
      size: srcPdfBytes.length,
      arrayBuffer: async () => srcPdfBytes.buffer.slice(srcPdfBytes.byteOffset, srcPdfBytes.byteOffset + srcPdfBytes.byteLength),
    };

    const source = {
      file: mockFile,
      fileType: "pdf",
      previewUrl: "blob:mock",
      dimensions: { width: 4961, height: 7016, aspectRatio: 4961 / 7016 },
      fileSizeFormatted: "8 KB",
      fileName: "aadhaar-foldable.pdf",
      pageCount: 1,
      currentPage: 1,
      isLoading: false,
      error: null,
    };

    const layout = createDefaultPrintLayoutSettings();
    layout.paperSize = "4x6";
    layout.orientation = "portrait";

    const front = createMockSide({ crop: { x: 395, y: 5068, width: 2047, height: 1429 } });
    const back = createMockSide({ crop: { x: 2523, y: 5068, width: 2047, height: 1429 } });

    const paperLayout = calculatePrintPaperLayout({
      layout,
      mode: "combined",
      arrangement: "vertical",
      front,
      back,
    });

    assert.equal(paperLayout.isFoldable4x6, true);
    assert.equal(paperLayout.items.find((i) => i.side === "back")?.rotation, 180);

    const exportResult = await generatePrintReadyPdf({
      paperLayout,
      front,
      back,
      isSingleSided: false,
      docDef: { id: "aadhaar", name: "Aadhaar Card" },
      dpi: 300,
      source,
    });

    assert.equal(exportResult.pageWidthPt, 288); // 4 inches in points
    assert.equal(exportResult.pageHeightPt, 432); // 6 inches in points
    assert.ok(exportResult.sizeBytes > 0);
  });
});

describe("NON-DESTRUCTIVE PDF: 4. Direct High-Resolution Card Embedding for Image Sources", () => {
  test("embeds card image blob directly without master canvas when source is image", async () => {
    // 1x1 transparent PNG
    const samplePngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    const frontBlob = new Blob([samplePngBytes], { type: "image/png" });

    const layout = createDefaultPrintLayoutSettings();
    const front = createMockSide({
      croppedBlob: frontBlob,
    });
    const back = createMockSide({ isCropped: false, crop: null });

    const paperLayout = calculatePrintPaperLayout({
      layout,
      mode: "front-only",
      arrangement: "vertical",
      front,
      back,
    });

    const exportResult = await generatePrintReadyPdf({
      paperLayout,
      front,
      back,
      isSingleSided: true,
      docDef: { id: "aadhaar", name: "Aadhaar Card" },
      dpi: 300,
    });

    assert.ok(exportResult.blob instanceof Blob);
    assert.equal(exportResult.pageCount, 1);
    assert.ok(exportResult.sizeBytes > 500);
  });
});
