/**
 * Document Studio — High-Resolution PNG Download Feature Test Suite
 *
 * Verifies:
 * 1. PNG Download Support for All Supported Document Types (Aadhaar, PAN, Voter ID, Ration Card, Custom)
 * 2. Resolution Options (300 DPI standard vs 600 DPI recommended default)
 * 3. Exact Pixel Dimension Mapping for All Page Sizes (A4, 4x6, CR80, Letter, A5)
 * 4. Lossless PNG Encoding (PNG magic signature 89 50 4E 47, no JPEG compression)
 * 5. Strict Preservation of Existing Functionality (Crop geometry, layouts, PDF export preserved)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generatePrintReadyPng,
  generatePrintReadyPdf,
  getPaperDimensionsInPixels,
  generatePrintFileName,
  downloadPngBlob,
} from "../src/lib/document/document-print-pdf.ts";
import {
  DEFAULT_ENHANCEMENT_SETTINGS,
  createDefaultEnhancementSettings,
  createDefaultPrintLayoutSettings,
} from "../src/types/document-studio.ts";
import {
  DOCUMENT_TYPES,
  AADHAAR_CARD_MEASUREMENTS,
  PAN_CARD_MEASUREMENTS,
  VOTER_ID_MEASUREMENTS,
  RATION_CARD_MEASUREMENTS,
} from "../src/constants/document-studio.ts";
import { resolvePrintStudioLayout } from "../src/lib/document/document-print-studio.ts";

/**
 * Creates a valid synthetic PNG byte buffer (1x1 red pixel base64).
 */
function createSyntheticPngBuffer() {
  const base64Png =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const binary = Buffer.from(base64Png, "base64");
  return new Uint8Array(binary);
}

/**
 * Creates a mock DocumentSideResult with valid cropped PNG blob.
 */
function createMockSideResult(
  side = "front",
  crop = { x: 100, y: 150, width: 856, height: 540 }
) {
  const pngBytes = createSyntheticPngBuffer();
  const blob = new Blob([pngBytes], { type: "image/png" });
  return {
    isAvailable: true,
    isCropped: true,
    crop,
    rotation: 0,
    zoom: 1,
    croppedPreviewUrl: `blob:mock-${side}-cropped`,
    croppedBlob: blob,
    croppedDimensions: { width: 2022, height: 1276, aspectRatio: 2022 / 1276 },
    enhancedPreviewUrl: `blob:mock-${side}-enhanced`,
    enhancedBlob: blob,
    isManualCrop: false,
    isCropEditorOpen: false,
    activeView: "cropped",
    enhancements: createDefaultEnhancementSettings(),
    printSettings: {
      dimensionPreset: "cr80",
      widthMm: 85.6,
      heightMm: 53.98,
      dpi: 600,
    },
  };
}

describe("HIGH-RESOLUTION PNG DOWNLOAD: 1. Pixel Dimension Calculations", () => {
  it("calculates exact A4 pixel dimensions at 300 DPI (~2480 × 3508 px)", () => {
    const dims = getPaperDimensionsInPixels(210, 297, 300);
    assert.equal(dims.widthPx, 2480);
    assert.equal(dims.heightPx, 3508);
  });

  it("calculates exact A4 pixel dimensions at 600 DPI (~4961 × 7016 px)", () => {
    const dims = getPaperDimensionsInPixels(210, 297, 600);
    assert.equal(dims.widthPx, 4961);
    assert.equal(dims.heightPx, 7016);
  });

  it("calculates exact 4x6 sheet pixel dimensions at 300 DPI and 600 DPI", () => {
    const dims300 = getPaperDimensionsInPixels(101.6, 152.4, 300);
    assert.equal(dims300.widthPx, 1200);
    assert.equal(dims300.heightPx, 1800);

    const dims600 = getPaperDimensionsInPixels(101.6, 152.4, 600);
    assert.equal(dims600.widthPx, 2400);
    assert.equal(dims600.heightPx, 3600);
  });

  it("calculates exact CR80 card dimensions at 300 DPI and 600 DPI", () => {
    const dims300 = getPaperDimensionsInPixels(85.6, 53.98, 300);
    assert.equal(dims300.widthPx, 1011);
    assert.equal(dims300.heightPx, 638);

    const dims600 = getPaperDimensionsInPixels(85.6, 53.98, 600);
    assert.equal(dims600.widthPx, 2022);
    assert.equal(dims600.heightPx, 1275);
  });

  it("calculates exact Letter dimensions at 300 DPI and 600 DPI", () => {
    const dims300 = getPaperDimensionsInPixels(215.9, 279.4, 300);
    assert.equal(dims300.widthPx, 2550);
    assert.equal(dims300.heightPx, 3300);

    const dims600 = getPaperDimensionsInPixels(215.9, 279.4, 600);
    assert.equal(dims600.widthPx, 5100);
    assert.equal(dims600.heightPx, 6600);
  });
});

describe("HIGH-RESOLUTION PNG DOWNLOAD: 2. File Naming", () => {
  it("generates semantic filenames for PNG exports", () => {
    const aadhaarFileName = generatePrintFileName("aadhaar", "a4", "portrait", 600, "png");
    assert.equal(aadhaarFileName, "document-studio-aadhaar-a4-portrait-600dpi.png");

    const panFileName = generatePrintFileName("pan", "cr80", "landscape", 300, "png");
    assert.equal(panFileName, "document-studio-pan-cr80-landscape-300dpi.png");

    const rationFileName = generatePrintFileName("ration-card", "4x6", "portrait", 600, "png");
    assert.equal(rationFileName, "document-studio-ration-card-4x6-portrait-600dpi.png");
  });
});

describe("HIGH-RESOLUTION PNG DOWNLOAD: 3. PNG Generation for All Document Types", () => {
  it("generates 600 DPI PNG export for Aadhaar Card on A4 paper", async () => {
    const front = createMockSideResult("front");
    const back = createMockSideResult("back");
    const layout = createDefaultPrintLayoutSettings();
    const { paperLayout } = resolvePrintStudioLayout({
      mode: "combined",
      arrangement: "vertical",
      layout,
      front,
      back,
      isSingleSided: false,
    });

    const aadhaarDef = DOCUMENT_TYPES.find((d) => d.id === "aadhaar");
    const result = await generatePrintReadyPng({
      paperLayout,
      front,
      back,
      isSingleSided: false,
      docDef: aadhaarDef,
      dpi: 600,
    });

    assert.ok(result.blob);
    assert.equal(result.format, "image/png");
    assert.equal(result.dpi, 600);
    assert.equal(result.widthPx, 4961);
    assert.equal(result.heightPx, 7016);
    assert.ok(result.fileName.endsWith("-600dpi.png"));
    assert.ok(result.sizeBytes > 0);

    // Verify PNG magic header signature: 89 50 4E 47 0D 0A 1A 0A
    const arrayBuf = await result.blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuf);
    assert.equal(bytes[0], 0x89);
    assert.equal(bytes[1], 0x50); // 'P'
    assert.equal(bytes[2], 0x4e); // 'N'
    assert.equal(bytes[3], 0x47); // 'G'
  });

  it("generates 300 DPI PNG export for Aadhaar Card on A4 paper", async () => {
    const front = createMockSideResult("front");
    const back = createMockSideResult("back");
    const layout = createDefaultPrintLayoutSettings();
    const { paperLayout } = resolvePrintStudioLayout({
      mode: "combined",
      arrangement: "vertical",
      layout,
      front,
      back,
      isSingleSided: false,
    });

    const aadhaarDef = DOCUMENT_TYPES.find((d) => d.id === "aadhaar");
    const result = await generatePrintReadyPng({
      paperLayout,
      front,
      back,
      isSingleSided: false,
      docDef: aadhaarDef,
      dpi: 300,
    });

    assert.equal(result.format, "image/png");
    assert.equal(result.dpi, 300);
    assert.equal(result.widthPx, 2480);
    assert.equal(result.heightPx, 3508);
    assert.ok(result.fileName.endsWith("-300dpi.png"));
  });

  it("generates 600 DPI PNG export for Single-Sided PAN Card on CR80 card", async () => {
    const front = createMockSideResult("front");
    const back = createMockSideResult("back");
    const layout = {
      ...createDefaultPrintLayoutSettings(),
      paperSize: "custom",
      orientation: "landscape",
      customPaper: { width: 85.6, height: 53.98, unit: "mm" },
    };
    const { paperLayout } = resolvePrintStudioLayout({
      mode: "front-only",
      arrangement: "vertical",
      layout,
      front,
      back,
      isSingleSided: true,
    });

    const panDef = DOCUMENT_TYPES.find((d) => d.id === "pan");
    const result = await generatePrintReadyPng({
      paperLayout,
      front,
      back,
      isSingleSided: true,
      docDef: panDef,
      dpi: 600,
    });

    assert.equal(result.format, "image/png");
    assert.equal(result.dpi, 600);
    assert.equal(result.widthPx, 2022);
    assert.equal(result.heightPx, 1275);
    assert.ok(result.fileName.includes("pan-custom"));
  });

  it("generates 600 DPI PNG export for Voter ID Card on A4 paper", async () => {
    const front = createMockSideResult("front");
    const back = createMockSideResult("back");
    const layout = createDefaultPrintLayoutSettings();
    const { paperLayout } = resolvePrintStudioLayout({
      mode: "combined",
      arrangement: "vertical",
      layout,
      front,
      back,
      isSingleSided: false,
    });

    const voterDef = DOCUMENT_TYPES.find((d) => d.id === "voter-id");
    const result = await generatePrintReadyPng({
      paperLayout,
      front,
      back,
      isSingleSided: false,
      docDef: voterDef,
      dpi: 600,
    });

    assert.equal(result.format, "image/png");
    assert.equal(result.dpi, 600);
    assert.equal(result.widthPx, 4961);
    assert.equal(result.heightPx, 7016);
    assert.ok(result.fileName.includes("voter-id"));
  });

  it("generates 600 DPI PNG export for Ration Card on 4x6 paper", async () => {
    const front = createMockSideResult("front");
    const back = createMockSideResult("back");
    const layout = { ...createDefaultPrintLayoutSettings(), paperSize: "4x6" };
    const { paperLayout } = resolvePrintStudioLayout({
      mode: "combined",
      arrangement: "vertical",
      layout,
      front,
      back,
      isSingleSided: false,
    });

    const rationDef = DOCUMENT_TYPES.find((d) => d.id === "ration-card");
    const result = await generatePrintReadyPng({
      paperLayout,
      front,
      back,
      isSingleSided: false,
      docDef: rationDef,
      dpi: 600,
    });

    assert.equal(result.format, "image/png");
    assert.equal(result.dpi, 600);
    assert.equal(result.widthPx, 2400);
    assert.equal(result.heightPx, 3600);
    assert.ok(result.fileName.includes("ration-card-4x6"));
  });
});

describe("HIGH-RESOLUTION PNG DOWNLOAD: 4. Preservation of Existing PDF Export", () => {
  it("confirms generatePrintReadyPdf continues working alongside PNG export", async () => {
    const front = createMockSideResult("front");
    const back = createMockSideResult("back");
    const layout = createDefaultPrintLayoutSettings();
    const { paperLayout } = resolvePrintStudioLayout({
      mode: "combined",
      arrangement: "vertical",
      layout,
      front,
      back,
      isSingleSided: false,
    });

    const pdfResult = await generatePrintReadyPdf({
      paperLayout,
      front,
      back,
      isSingleSided: false,
      docDef: { id: "aadhaar", name: "Aadhaar Card" },
      dpi: 300,
    });

    assert.equal(pdfResult.format, "application/pdf");
    assert.ok(pdfResult.sizeBytes > 0);
    assert.equal(pdfResult.pageCount, 1);
  });

  it("validates that crop coordinates remain strictly untouched", () => {
    assert.equal(AADHAAR_CARD_MEASUREMENTS.front.xMin, 0.0796);
    assert.equal(PAN_CARD_MEASUREMENTS.front.xMin, 0.101);
    assert.equal(VOTER_ID_MEASUREMENTS.front.xMin, 0.0546);
    assert.equal(RATION_CARD_MEASUREMENTS.front.xMin, 0.1243);
  });
});
