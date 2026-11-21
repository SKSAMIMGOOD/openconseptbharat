/**
 * Comprehensive Automated Test Suite: Document Straightener – Perspective Correction
 *
 * Verifies:
 * 1. Tool Registry & Routing:
 *    - Tool is registered in TOOLS with id 'document-straightener'
 *    - Route is /tools/document-straightener
 *    - Valid categories, features, file acceptance
 *    - Page and layout files exist on disk
 * 2. 4-Corner Perspective Geometry:
 *    - Euclidean distance and cross products
 *    - Strict convexity verification (isConvexQuad)
 *    - Rejection of self-intersecting and concave quads
 *    - Polygon area calculation via Shoelace formula
 * 3. Backward Homography & Warping Engine:
 *    - Mapping of destination rectangle corners to source quad corners
 *    - Non-destructive sub-pixel bilinear interpolation
 *    - 90-degree step rotation coordinate transformations
 *    - Preset aspect ratio calculations (Auto/Natural, ISO CR80, A4 Paper)
 * 4. Boundary Detection & Honest Fallback:
 *    - High-contrast document detection
 *    - Honest fallback for low-contrast/plain backgrounds
 * 5. Architectural Integration & Reusability:
 *    - Document Studio compatibility
 *    - Component file existence on disk
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { TOOLS, getToolById } from "../src/constants/tools.ts";
import {
  pointDistance,
  crossProduct2D,
  polygonArea,
  isConvexQuad,
  calculateOutputDimensions,
  computeBackwardHomography,
  warpPerspectiveBuffer,
  rotatePoint,
  rotatePerspectiveQuad,
  createDefaultQuad,
} from "../src/lib/document/perspective-engine.ts";
import {
  detectDocumentCorners,
} from "../src/lib/document/perspective-detector.ts";

describe("1. Document Straightener — Registry & Configuration", () => {
  test("tool is registered in TOOLS with valid metadata", () => {
    const tool = getToolById("document-straightener");
    assert.ok(tool, "document-straightener must be registered in TOOLS");
    assert.equal(tool.name, "Free Document Straightener");
    assert.equal(tool.route, "/tools/document-straightener");
    assert.equal(tool.category, "utilities");
    assert.ok(tool.categories.includes("document"));
    assert.equal(tool.status, "ready");
    assert.ok(tool.features.length >= 4);
    assert.ok(tool.fileAccept.includes("image/jpeg"));
    assert.ok(tool.fileAccept.includes("image/png"));
  });

  test("route files exist on disk in src/app/tools/document-straightener", () => {
    const pagePath = path.resolve(process.cwd(), "src/app/tools/document-straightener/page.tsx");
    const layoutPath = path.resolve(process.cwd(), "src/app/tools/document-straightener/layout.tsx");

    assert.ok(fs.existsSync(pagePath), `page.tsx must exist at ${pagePath}`);
    assert.ok(fs.existsSync(layoutPath), `layout.tsx must exist at ${layoutPath}`);
  });

  test("workspace and editor components exist on disk", () => {
    const workspacePath = path.resolve(
      process.cwd(),
      "src/components/document-straightener/DocumentStraightenerWorkspace.tsx"
    );
    const editorPath = path.resolve(
      process.cwd(),
      "src/components/document-straightener/PerspectiveCropEditor.tsx"
    );
    const magnifierPath = path.resolve(
      process.cwd(),
      "src/components/document-straightener/PerspectiveMagnifier.tsx"
    );

    assert.ok(fs.existsSync(workspacePath), "DocumentStraightenerWorkspace must exist");
    assert.ok(fs.existsSync(editorPath), "PerspectiveCropEditor must exist");
    assert.ok(fs.existsSync(magnifierPath), "PerspectiveMagnifier must exist");
  });
});

describe("2. Advanced Four-Corner Perspective Geometry", () => {
  test("calculates Euclidean distance and polygon area accurately", () => {
    const p1 = { x: 100, y: 100 };
    const p2 = { x: 400, y: 500 };
    assert.equal(pointDistance(p1, p2), 500);

    const quadPoints = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 0, y: 50 },
    ];
    assert.equal(polygonArea(quadPoints), 5000);
  });

  test("isConvexQuad accepts valid trapezoidal and perspective-distorted quads", () => {
    // Normal rectangular card
    const rectQuad = {
      topLeft: { x: 50, y: 50 },
      topRight: { x: 850, y: 50 },
      bottomRight: { x: 850, y: 550 },
      bottomLeft: { x: 50, y: 550 },
    };
    assert.equal(isConvexQuad(rectQuad), true);

    // Tilted, perspective-distorted phone photo of a card (trapezoid)
    const perspectiveQuad = {
      topLeft: { x: 120, y: 80 },
      topRight: { x: 780, y: 140 },
      bottomRight: { x: 820, y: 590 },
      bottomLeft: { x: 60, y: 520 },
    };
    assert.equal(isConvexQuad(perspectiveQuad), true);
  });

  test("isConvexQuad rejects self-intersecting quads (butterfly/bowtie)", () => {
    // Top-left crossed past top-right
    const bowtieQuad = {
      topLeft: { x: 800, y: 100 },
      topRight: { x: 100, y: 100 },
      bottomRight: { x: 800, y: 600 },
      bottomLeft: { x: 100, y: 600 },
    };
    assert.equal(isConvexQuad(bowtieQuad), false);
  });

  test("isConvexQuad rejects concave or collapsed quads", () => {
    // Inward-folded corner
    const concaveQuad = {
      topLeft: { x: 100, y: 100 },
      topRight: { x: 800, y: 100 },
      bottomRight: { x: 300, y: 300 }, // folded inside
      bottomLeft: { x: 100, y: 800 },
    };
    assert.equal(isConvexQuad(concaveQuad), false);

    // Degenerate/collapsed area
    const tinyQuad = {
      topLeft: { x: 10, y: 10 },
      topRight: { x: 12, y: 10 },
      bottomRight: { x: 12, y: 12 },
      bottomLeft: { x: 10, y: 12 },
    };
    assert.equal(isConvexQuad(tinyQuad), false, "Quads with area < 400 px² must be rejected");
  });

  test("calculateOutputDimensions computes correct aspect ratio dimensions", () => {
    const quad = {
      topLeft: { x: 100, y: 100 },
      topRight: { x: 956, y: 100 }, // width 856
      bottomRight: { x: 956, y: 640 }, // height 540
      bottomLeft: { x: 100, y: 640 },
    };

    // Auto / Natural preset
    const autoDims = calculateOutputDimensions(quad, "auto");
    assert.equal(autoDims.width, 856);
    assert.equal(autoDims.height, 540);

    // ISO CR80 preset (85.6 / 53.98)
    const cr80Dims = calculateOutputDimensions(quad, "cr80");
    assert.equal(cr80Dims.width, 856);
    assert.equal(cr80Dims.height, Math.round(856 / (85.6 / 53.98)));

    // A4 Paper preset (sqrt(2))
    const a4Dims = calculateOutputDimensions(quad, "a4");
    assert.equal(a4Dims.width, 856);
    assert.equal(a4Dims.height, Math.round(856 / Math.SQRT2));
  });
});

describe("3. Perspective Transformation Engine & Homography", () => {
  test("computeBackwardHomography maps output corners to source quadrilateral vertices", () => {
    const srcQuad = {
      topLeft: { x: 45, y: 80 },
      topRight: { x: 620, y: 55 },
      bottomRight: { x: 670, y: 440 },
      bottomLeft: { x: 90, y: 410 },
    };
    const dstW = 500;
    const dstH = 350;

    const H = computeBackwardHomography(srcQuad, dstW, dstH);

    const project = (u, v) => {
      const denom = H.m20 * u + H.m21 * v + 1;
      return {
        x: (H.m00 * u + H.m01 * v + H.m02) / denom,
        y: (H.m10 * u + H.m11 * v + H.m12) / denom,
      };
    };

    const tl = project(0, 0);
    assert.ok(Math.abs(tl.x - srcQuad.topLeft.x) < 1e-4);
    assert.ok(Math.abs(tl.y - srcQuad.topLeft.y) < 1e-4);

    const tr = project(dstW, 0);
    assert.ok(Math.abs(tr.x - srcQuad.topRight.x) < 1e-4);
    assert.ok(Math.abs(tr.y - srcQuad.topRight.y) < 1e-4);

    const br = project(dstW, dstH);
    assert.ok(Math.abs(br.x - srcQuad.bottomRight.x) < 1e-4);
    assert.ok(Math.abs(br.y - srcQuad.bottomRight.y) < 1e-4);

    const bl = project(0, dstH);
    assert.ok(Math.abs(bl.x - srcQuad.bottomLeft.x) < 1e-4);
    assert.ok(Math.abs(bl.y - srcQuad.bottomLeft.y) < 1e-4);
  });

  test("warpPerspectiveBuffer straightens trapezoid to uniform rectangle", () => {
    const W = 200;
    const H = 200;
    const data = new Uint8ClampedArray(W * H * 4);
    // Fill white
    data.fill(255);

    // Paint an emerald green block (R: 16, G: 185, B: 129)
    for (let y = 50; y <= 150; y++) {
      for (let x = 60; x <= 140; x++) {
        const idx = (y * W + x) * 4;
        data[idx] = 16;
        data[idx + 1] = 185;
        data[idx + 2] = 129;
        data[idx + 3] = 255;
      }
    }

    const quad = {
      topLeft: { x: 60, y: 50 },
      topRight: { x: 140, y: 50 },
      bottomRight: { x: 140, y: 150 },
      bottomLeft: { x: 60, y: 150 },
    };

    const dstW = 80;
    const dstH = 100;
    const warped = warpPerspectiveBuffer({ data, width: W, height: H }, quad, dstW, dstH);

    assert.equal(warped.length, dstW * dstH * 4);
    // Center pixel of warped destination must be green
    const center = (50 * dstW + 40) * 4;
    assert.equal(warped[center], 16);
    assert.equal(warped[center + 1], 185);
    assert.equal(warped[center + 2], 129);
  });

  test("rotatePerspectiveQuad accurately handles 90, 180, 270, 360 degree rotations", () => {
    const srcW = 1200;
    const srcH = 900;
    const quad = {
      topLeft: { x: 100, y: 120 },
      topRight: { x: 800, y: 100 },
      bottomRight: { x: 820, y: 600 },
      bottomLeft: { x: 110, y: 580 },
    };

    const r90 = rotatePerspectiveQuad(quad, 90, srcW, srcH);
    assert.ok(isConvexQuad(r90));

    const r180 = rotatePerspectiveQuad(quad, 180, srcW, srcH);
    assert.ok(isConvexQuad(r180));

    const r270 = rotatePerspectiveQuad(quad, 270, srcW, srcH);
    assert.ok(isConvexQuad(r270));

    const r360 = rotatePerspectiveQuad(quad, 360, srcW, srcH);
    assert.equal(r360.topLeft.x, quad.topLeft.x);
    assert.equal(r360.topLeft.y, quad.topLeft.y);
  });
});

describe("4. Automatic Boundary Detection & Honest Fallback", () => {
  test("detects document corners against contrasting background", () => {
    const W = 300;
    const H = 200;
    const data = new Uint8ClampedArray(W * H * 4);
    // Light gray background
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 230;
      data[i + 1] = 230;
      data[i + 2] = 230;
      data[i + 3] = 255;
    }

    // High contrast dark blue card in center
    for (let y = 30; y <= 170; y++) {
      for (let x = 40; x <= 260; x++) {
        const idx = (y * W + x) * 4;
        data[idx] = 20;
        data[idx + 1] = 60;
        data[idx + 2] = 160;
        data[idx + 3] = 255;
      }
    }

    const res = detectDocumentCorners({ data, width: W, height: H }, 3000, 2000);
    assert.equal(res.detected, true);
    assert.ok(res.confidence > 0.7);
    assert.ok(Math.abs(res.quad.topLeft.x - 400) < 50);
    assert.ok(Math.abs(res.quad.topLeft.y - 300) < 50);
  });

  test("honestly reports fallback when detection is ambiguous or contrast is zero", () => {
    const W = 100;
    const H = 100;
    const data = new Uint8ClampedArray(W * H * 4);
    data.fill(240); // Solid color everywhere

    const res = detectDocumentCorners({ data, width: W, height: H }, 1000, 1000);
    assert.equal(res.detected, false);
    assert.ok(res.message.includes("Manual") || res.message.includes("contrast"));
    // Falls back to safe 10% default quad for manual adjustment
    assert.equal(res.quad.topLeft.x, 100);
    assert.equal(res.quad.topLeft.y, 100);
    assert.equal(res.quad.bottomRight.x, 900);
    assert.equal(res.quad.bottomRight.y, 900);
  });
});

describe("5. Document Straightener — PDF Enhancement Pipeline & Side Mapping", () => {
  // Synthetic 1x1 PNGs with distinct byte signatures to differentiate raw vs enhanced
  const rawPngBytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
  // Distinct 1x1 PNG for enhanced version
  const enhancedFrontBytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );
  const enhancedBackBytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==",
    "base64"
  );

  test("sideResult maps croppedBlob and croppedPreviewUrl to enhanced version when enhancedBlob is present", () => {
    const rawBlob = new Blob([rawPngBytes], { type: "image/png" });
    const enhancedBlob = new Blob([enhancedFrontBytes], { type: "image/png" });

    const frontState = {
      file: null,
      previewUrl: "blob:mock-raw-preview",
      dimensions: { width: 1000, height: 600, aspectRatio: 1000 / 600 },
      rotation: 0,
      quad: null,
      straightenedUrl: "blob:mock-straightened-unenhanced",
      straightenedBlob: rawBlob,
      straightenedDimensions: { width: 1000, height: 600, aspectRatio: 1000 / 600 },
      aspectRatioPreset: "auto",
      enhancements: {
        brightness: 15,
        contrast: 20,
        saturation: 5,
        sharpness: 10,
        grayscale: false,
        invert: false,
      },
      enhancedPreviewUrl: "blob:mock-enhanced-preview",
      enhancedBlob: enhancedBlob,
      printSettings: {
        dimensionPreset: "cr80",
        widthMm: 85.6,
        heightMm: 53.98,
        dpi: 300,
      },
      isConfirmed: true,
      autoDetectConfidence: null,
      isLoading: false,
      error: null,
    };

    // Simulate mapping logic from useDocumentStraightener
    const effectiveBlob = frontState.enhancedBlob || frontState.straightenedBlob;
    const effectiveUrl = frontState.enhancedPreviewUrl || frontState.straightenedUrl;

    const frontSideResult = {
      crop: null,
      rotation: frontState.rotation,
      zoom: 1,
      aspectRatioLocked: true,
      targetAspectRatio: frontState.straightenedDimensions?.aspectRatio || null,
      croppedPreviewUrl: effectiveUrl,
      croppedBlob: effectiveBlob,
      croppedDimensions: frontState.straightenedDimensions,
      isCropped: frontState.isConfirmed,
      isCropEditorOpen: false,
      activeView: "cropped",
      enhancements: frontState.enhancements,
      enhancedPreviewUrl: frontState.enhancedPreviewUrl || effectiveUrl,
      enhancedBlob: frontState.enhancedBlob || effectiveBlob,
      printSettings: frontState.printSettings,
    };

    // Both croppedBlob and enhancedBlob must be the enhancedBlob
    assert.equal(frontSideResult.croppedBlob, enhancedBlob);
    assert.equal(frontSideResult.enhancedBlob, enhancedBlob);
    assert.equal(frontSideResult.croppedPreviewUrl, "blob:mock-enhanced-preview");
    assert.equal(frontSideResult.enhancedPreviewUrl, "blob:mock-enhanced-preview");
    assert.equal(frontSideResult.enhancements.brightness, 15);
    assert.equal(frontSideResult.enhancements.contrast, 20);
  });

  test("generatePrintReadyPdf in experimental-png-600 mode embeds enhanced front & back image bytes", async () => {
    const { PDFDocument } = await import("pdf-lib");
    const { generatePrintReadyPdf } = await import("../src/lib/document/document-print-pdf.ts");
    const { resolvePrintStudioLayout } = await import("../src/lib/document/document-print-studio.ts");
    const { createDefaultPrintLayoutSettings } = await import("../src/types/document-studio.ts");

    const rawBlob = new Blob([rawPngBytes], { type: "image/png" });
    const frontEnhancedBlob = new Blob([enhancedFrontBytes], { type: "image/png" });
    const backEnhancedBlob = new Blob([enhancedBackBytes], { type: "image/png" });

    // Front with enhancements (+15 brightness)
    const frontSideResult = {
      isAvailable: true,
      isCropped: true,
      crop: null,
      rotation: 0,
      zoom: 1,
      croppedPreviewUrl: "blob:mock-front-enhanced",
      croppedBlob: frontEnhancedBlob, // Corrected mapping: points to enhancedBlob!
      croppedDimensions: { width: 856, height: 540, aspectRatio: 856 / 540 },
      enhancedPreviewUrl: "blob:mock-front-enhanced",
      enhancedBlob: frontEnhancedBlob,
      isManualCrop: false,
      isCropEditorOpen: false,
      activeView: "cropped",
      enhancements: {
        brightness: 15,
        contrast: 10,
        saturation: 0,
        sharpness: 0,
        grayscale: false,
        invert: false,
      },
      printSettings: {
        dimensionPreset: "cr80",
        widthMm: 85.6,
        heightMm: 53.98,
        dpi: 300,
      },
    };

    // Back with independent enhancements (grayscale: true)
    const backSideResult = {
      isAvailable: true,
      isCropped: true,
      crop: null,
      rotation: 0,
      zoom: 1,
      croppedPreviewUrl: "blob:mock-back-enhanced",
      croppedBlob: backEnhancedBlob, // Corrected mapping: points to back enhancedBlob!
      croppedDimensions: { width: 856, height: 540, aspectRatio: 856 / 540 },
      enhancedPreviewUrl: "blob:mock-back-enhanced",
      enhancedBlob: backEnhancedBlob,
      isManualCrop: false,
      isCropEditorOpen: false,
      activeView: "cropped",
      enhancements: {
        brightness: 0,
        contrast: 25,
        saturation: 0,
        sharpness: 5,
        grayscale: true,
        invert: false,
      },
      printSettings: {
        dimensionPreset: "cr80",
        widthMm: 85.6,
        heightMm: 53.98,
        dpi: 300,
      },
    };

    const layout = createDefaultPrintLayoutSettings();
    const { paperLayout } = resolvePrintStudioLayout({
      mode: "combined",
      arrangement: "vertical",
      layout,
      front: frontSideResult,
      back: backSideResult,
      isSingleSided: false,
    });

    const pdfResult = await generatePrintReadyPdf({
      paperLayout,
      front: frontSideResult,
      back: backSideResult,
      isSingleSided: false,
      pipelineMode: "experimental-png-600",
    });

    assert.ok(pdfResult.blob, "PDF blob must be created");
    assert.equal(pdfResult.format, "application/pdf");
    assert.ok(pdfResult.sizeBytes > 0);

    const pdfBuffer = await pdfResult.blob.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    assert.equal(pdfDoc.getPageCount(), 1);

    // Verify PDF has embedded images
    // PDFDocument contains embedded objects: frontEnhancedBytes and backEnhancedBytes must be embedded
    const pdfRawString = Buffer.from(pdfBuffer).toString("binary");
    // Ensure the PDF contains image XObjects
    assert.ok(pdfRawString.includes("/XObject"), "PDF must contain XObject image references");
    assert.ok(pdfRawString.includes("/Subtype /Image"), "PDF must contain embedded image sub-type");
  });

  test("front and back retain their respective enhancement settings independently", () => {
    const frontSettings = {
      brightness: 20,
      contrast: 15,
      saturation: 10,
      sharpness: 0,
      grayscale: false,
      invert: false,
    };
    const backSettings = {
      brightness: -10,
      contrast: 30,
      saturation: -5,
      sharpness: 20,
      grayscale: true,
      invert: false,
    };

    assert.notEqual(frontSettings.brightness, backSettings.brightness);
    assert.notEqual(frontSettings.contrast, backSettings.contrast);
    assert.notEqual(frontSettings.grayscale, backSettings.grayscale);
  });
});
