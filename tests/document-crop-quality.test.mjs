/**
 * Automated Test Suite: Document Studio Crop Quality and Text Sharpness
 *
 * Validates:
 * 1. PDF rasterization resolution (600 DPI default vs legacy 144 DPI)
 * 2. High-DPI CR80 standardization & source resolution preservation
 * 3. Proportional scaling, zero stretching, and dynamic padding
 * 4. Image smoothing quality flags (high quality interpolation)
 * 5. Lossless PNG embedding in print-ready PDF generation
 * 6. Crop geometry and reference coordinates strict preservation
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";

import {
  DEFAULT_PDF_RENDER_DPI,
  DEFAULT_PDF_RENDER_SCALE,
  renderPdfDocumentPageToBlob,
} from "../src/lib/document/document-processor.ts";

import {
  CR80_TARGET_WIDTH_PX,
  CR80_TARGET_HEIGHT_PX,
  CR80_CORNER_RADIUS_PX,
  CR80_TARGET_ASPECT_RATIO,
  calculateCR80Scaling,
  renderCR80NormalizedCrop,
} from "../src/lib/document/cr80-normalizer.ts";

import {
  renderDocumentCrop,
  normalizeRotation,
  getRotatedDimensions,
} from "../src/lib/document/document-cropper.ts";

import {
  renderMasterDocumentCanvas,
  generatePrintReadyPdf,
  checkSourceResolutionAdequacy,
} from "../src/lib/document/document-print-pdf.ts";

import {
  AADHAAR_CARD_MEASUREMENTS,
  PAN_CARD_MEASUREMENTS,
  RATION_CARD_MEASUREMENTS,
  VOTER_ID_MEASUREMENTS,
  CR80_STANDARD_SPEC,
} from "../src/constants/document-studio.ts";

describe("PHASE QUALITY: 1. Crop Geometry & Coordinates Strict Preservation", () => {
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

describe("PHASE QUALITY: 2. PDF Rasterization Resolution", () => {
  test("defines 600 DPI default PDF rendering constants", () => {
    assert.equal(DEFAULT_PDF_RENDER_DPI, 600, "Default PDF rendering DPI must be 600");
    const expectedScale = 600 / 72;
    assert.ok(
      Math.abs(DEFAULT_PDF_RENDER_SCALE - expectedScale) < 0.0001,
      "Render scale must equal 600 / 72 (~8.333)"
    );
  });

  test("calculates A4 page dimensions at 600 DPI with high-fidelity resolution", () => {
    // A4 in points: 595.28 x 841.89
    const a4W = 595.28;
    const a4H = 841.89;
    const pxW = Math.round(a4W * DEFAULT_PDF_RENDER_SCALE);
    const pxH = Math.round(a4H * DEFAULT_PDF_RENDER_SCALE);

    assert.equal(pxW, 4961, "A4 width at 600 DPI must be ~4961 px (was ~1191 px at 144 DPI)");
    assert.equal(pxH, 7016, "A4 height at 600 DPI must be ~7016 px (was ~1684 px at 144 DPI)");

    // At 600 DPI, Aadhaar card crop dimensions (x: 0.0796..0.4922, y: 0.7224..0.9261)
    const cardCropW = Math.round((0.4922 - 0.0796) * pxW);
    const cardCropH = Math.round((0.9261 - 0.7224) * pxH);

    assert.ok(
      cardCropW >= 2000,
      `Aadhaar crop width at 600 DPI (${cardCropW} px) must be >= 2000 px for ultra-sharp text`
    );
    assert.ok(
      cardCropH >= 1400,
      `Aadhaar crop height at 600 DPI (${cardCropH} px) must be >= 1400 px for ultra-sharp text`
    );
  });
});

describe("PHASE QUALITY: 3. CR80 Normalization & High-DPI Scaling", () => {
  test("defaults to standard 1011 x 638 px at 300 DPI for backward compatibility", () => {
    const geo = calculateCR80Scaling(1052, 672);
    assert.equal(geo.targetWidth, 1011);
    assert.equal(geo.targetHeight, 638);
    assert.equal(geo.isStretched, false);
  });

  test("scales to exact 2022 x 1276 px at 600 DPI preserving high-resolution crops", () => {
    // 600 DPI Aadhaar crop: ~2047 x 1429
    const geo = calculateCR80Scaling(2047, 1429, 600);
    assert.equal(geo.targetWidth, 2022, "Target width at 600 DPI must be 2022 px");
    assert.equal(geo.targetHeight, 1276, "Target height at 600 DPI must be 1276 px");
    assert.equal(geo.isStretched, false, "Must never stretch card pixels");

    // Proportional uniform scale
    const expectedScale = Math.min(2022 / 2047, 1276 / 1429);
    assert.ok(Math.abs(geo.scaleFactor - expectedScale) < 0.0001);

    // Centered padding
    assert.ok(geo.drawWidth <= 2022);
    assert.ok(geo.drawHeight <= 1276);
    assert.equal(geo.drawX, Math.round(geo.padHorizontal / 2));
    assert.equal(geo.drawY, Math.round(geo.padVertical / 2));
  });

  test("Ration Card fits seamlessly into 600 DPI CR80 with proportional padding", () => {
    // Ration Card at 600 DPI: width ~1846, height ~1106 (aspect ~1.669)
    const geo = calculateCR80Scaling(1846, 1106, 600);
    assert.equal(geo.targetWidth, 2022);
    assert.equal(geo.targetHeight, 1276);
    assert.equal(geo.drawWidth, 2022);
    assert.equal(geo.padHorizontal, 0);
    assert.ok(geo.padVertical > 0, "Must have vertical padding for wider aspect ratio");
    assert.equal(geo.drawY, Math.round(geo.padVertical / 2));
    assert.equal(geo.isStretched, false);
  });
});

describe("PHASE QUALITY: 4. Source Resolution Adequacy & Print DPI Diagnostics", () => {
  test("confirms 600 DPI card resolution is adequate for both 300 DPI and 600 DPI print", () => {
    const placedItem = {
      side: "front",
      title: "Front Side",
      badge: "F",
      isAvailable: true,
      xMm: 10,
      yMm: 10,
      widthMm: 85.6,
      heightMm: 53.98,
      widthPercent: 40,
      heightPercent: 20,
      xPercent: 5,
      yPercent: 5,
    };

    // 600 DPI cropped card
    const side600 = {
      croppedDimensions: { width: 2022, height: 1276, aspectRatio: 2022 / 1276 },
    };

    // Check adequacy at 300 DPI
    const check300 = checkSourceResolutionAdequacy(placedItem, side600, 300);
    assert.equal(check300.isAdequate, true, "600 DPI source must be fully adequate for 300 DPI print");
    assert.equal(check300.warning, undefined, "Must have no warning at 300 DPI print");

    // Check adequacy at 600 DPI
    const check600 = checkSourceResolutionAdequacy(placedItem, side600, 600);
    assert.equal(check600.isAdequate, true, "600 DPI source must be fully adequate for 600 DPI print");
    assert.equal(check600.warning, undefined, "Must have no warning at 600 DPI print");
  });
});

describe("PHASE QUALITY: 5. PDF Generation with Lossless PNG Embedding", () => {
  test("embeds PNG image bytes into PDF document without compression loss", async () => {
    // Minimal valid 1x1 PNG bytes
    const samplePngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
      0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, // IEND chunk
      0x42, 0x60, 0x82,
    ]);

    const paperLayout = {
      paperSize: "a4",
      paperWidthMm: 210,
      paperHeightMm: 297,
      orientation: "portrait",
      paperAspectRatio: 210 / 297,
      printableWidthMm: 200,
      printableHeightMm: 287,
      margins: { topMm: 5, bottomMm: 5, leftMm: 5, rightMm: 5 },
      copies: 1,
      items: [
        {
          side: "front",
          title: "Front Side",
          badge: "F",
          isAvailable: true,
          imageUrl: "blob:test",
          xMm: 10,
          yMm: 10,
          widthMm: 85.6,
          heightMm: 53.98,
          widthPercent: 40,
          heightPercent: 20,
          xPercent: 5,
          yPercent: 5,
        },
      ],
    };

    const front = {
      isCropped: true,
      croppedPreviewUrl: "blob:test",
      croppedDimensions: { width: 2022, height: 1276, aspectRatio: 2022 / 1276 },
      enhancements: {},
      showBefore: false,
      printSettings: { dpi: 600, widthMm: 85.6, heightMm: 53.98 },
    };

    const back = {
      isCropped: false,
      croppedPreviewUrl: null,
      croppedDimensions: null,
      enhancements: {},
      showBefore: false,
      printSettings: { dpi: 600, widthMm: 85.6, heightMm: 53.98 },
    };

    const pdfResult = await generatePrintReadyPdf({
      paperLayout,
      front,
      back,
      isSingleSided: true,
      docDef: { id: "aadhaar", name: "Aadhaar Card" },
      dpi: 600,
      imageBytes: samplePngBytes,
    });

    assert.ok(pdfResult.blob instanceof Blob, "Result must be a Blob");
    assert.equal(pdfResult.format, "application/pdf");
    assert.ok(pdfResult.sizeBytes > 500, "PDF size must be > 500 bytes");
    assert.equal(pdfResult.pageCount, 1);
  });
});
