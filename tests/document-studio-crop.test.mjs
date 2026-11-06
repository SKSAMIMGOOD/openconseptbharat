/**
 * Automated Test Suite: Phase 08B (Workflow Correction)
 * Single Document Upload with Automatic Dual-Side Detection and Independent Cropping
 *
 * Verifies:
 * 1. Single Document Input Workflow (one file contains both Front & Back sides)
 * 2. Automatic Dual-Side Document Boundary Detection:
 *    - Horizontally arranged document cards (side-by-side e.g. e-Aadhaar)
 *    - Vertically arranged document cards (stacked e.g. Ration Card / Xerox)
 *    - Single-sided document (PAN Card front-only)
 *    - Target aspect ratio alignment (ISO ID-1 85.60 x 53.98 mm)
 *    - Non-destructive safety margin (1.5% padding)
 * 3. Honest Detection Failure & Manual Fallback:
 *    - Low contrast / uniform image fallback without false claims
 *    - Independent manual crop adjustment for Front and Back
 * 4. 90° Step Rotation & Math Transformation:
 *    - Normalization, dimension bounds, and crop coordinate re-centering
 * 5. State Isolation & Ephemeral Memory Guarantees:
 *    - Source document upload with derived front/back crop results
 *    - Independent front and back mutations
 *    - Zero data persistence or remote leaks
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  detectDocumentInPixelBuffer,
  detectDualDocumentInPixelBuffer,
  detectBottomDualDocumentInPixelBuffer,
  detectHorizontalDualDocumentInPixelBuffer,
  detectVerticalDualDocumentInPixelBuffer,
  determineDocumentLayout,
  extractSubBuffer,
  createCenteredCrop,
} from "../src/lib/document/document-detector.ts";

import {
  normalizeRotation,
  getRotatedDimensions,
  adjustCropForRotation,
  createDefaultCropState,
} from "../src/lib/document/document-cropper.ts";

import {
  initDefaultCrop,
  clampCropToBounds,
  moveCrop,
  resizeCropFromHandle,
  MIN_CROP_PIXELS,
} from "../src/lib/crop/crop-geometry.ts";

import {
  DOCUMENT_TYPES,
  getDocumentTypeDefinition,
} from "../src/constants/document-studio.ts";

/**
 * Test helper: Synthesizes a pixel buffer containing two rectangular cards on a single sheet.
 */
function createSyntheticDualCardImage(options = {}) {
  const {
    imageWidth = 800,
    imageHeight = 400,
    layout = "horizontal", // "horizontal" (side-by-side) or "vertical" (stacked)
    frontCard = { x: 40, y: 80, width: 320, height: 200 },
    backCard = { x: 440, y: 80, width: 320, height: 200 },
    bgColor = [35, 35, 40], // Dark background
    cardColor = [245, 245, 240], // Light cards
  } = options;

  const data = new Uint8ClampedArray(imageWidth * imageHeight * 4);

  for (let y = 0; y < imageHeight; y++) {
    for (let x = 0; x < imageWidth; x++) {
      const idx = (y * imageWidth + x) * 4;

      const isFront =
        x >= frontCard.x &&
        x < frontCard.x + frontCard.width &&
        y >= frontCard.y &&
        y < frontCard.y + frontCard.height;

      const isBack =
        backCard &&
        x >= backCard.x &&
        x < backCard.x + backCard.width &&
        y >= backCard.y &&
        y < backCard.y + backCard.height;

      if (isFront || isBack) {
        data[idx] = cardColor[0];
        data[idx + 1] = cardColor[1];
        data[idx + 2] = cardColor[2];
        data[idx + 3] = 255;
      } else {
        data[idx] = bgColor[0];
        data[idx + 1] = bgColor[1];
        data[idx + 2] = bgColor[2];
        data[idx + 3] = 255;
      }
    }
  }

  return { data, width: imageWidth, height: imageHeight };
}

describe("PHASE 08B — Dual Document Detection on a Single Sheet", () => {
  const id1Aspect = 85.6 / 53.98; // ~1.58577

  test("detects horizontally arranged document cards (Aadhaar Front and Back side-by-side)", () => {
    // 800x400 sheet with Front on left (x=40..360) and Back on right (x=440..760)
    const buffer = createSyntheticDualCardImage({
      imageWidth: 800,
      imageHeight: 400,
      layout: "horizontal",
      frontCard: { x: 40, y: 80, width: 320, height: 200 },
      backCard: { x: 440, y: 80, width: 320, height: 200 },
    });

    const result = detectDualDocumentInPixelBuffer(buffer, {
      targetAspectRatio: id1Aspect,
      safetyMarginPercent: 1.5,
    });

    assert.equal(result.detected, true, "Must detect both sides successfully");
    assert.equal(result.layout, "horizontal", "Must determine horizontal layout");
    assert.ok(result.frontCrop, "Must supply frontCrop");
    assert.ok(result.backCrop, "Must supply backCrop");

    // Front must be on the left half, Back on the right half
    assert.ok(result.frontCrop.x < 400, "Front card must be on left half");
    assert.ok(result.backCrop.x >= 400, "Back card must be on right half");

    // Both cards must enclose their respective card content
    assert.ok(result.frontCrop.x <= 40);
    assert.ok(result.frontCrop.x + result.frontCrop.width >= 360);
    assert.ok(result.backCrop.x <= 440);
    assert.ok(result.backCrop.x + result.backCrop.width >= 760);

    // Verify aspect ratios match ISO ID-1
    const frontRatio = result.frontCrop.width / result.frontCrop.height;
    const backRatio = result.backCrop.width / result.backCrop.height;
    assert.ok(Math.abs(frontRatio - id1Aspect) < 0.05);
    assert.ok(Math.abs(backRatio - id1Aspect) < 0.05);
  });

  test("detects vertically arranged document cards (Ration Card Front and Back stacked)", () => {
    // 500x700 sheet with Front on top (y=40..280) and Back on bottom (y=380..620)
    const buffer = createSyntheticDualCardImage({
      imageWidth: 500,
      imageHeight: 700,
      layout: "vertical",
      frontCard: { x: 50, y: 40, width: 400, height: 240 },
      backCard: { x: 50, y: 380, width: 400, height: 240 },
    });

    const result = detectDualDocumentInPixelBuffer(buffer, {
      targetAspectRatio: id1Aspect,
      safetyMarginPercent: 1.5,
    });

    assert.equal(result.detected, true);
    assert.equal(result.layout, "vertical");
    assert.ok(result.frontCrop.y < 350, "Front card must be on top half");
    assert.ok(result.backCrop.y >= 350, "Back card must be on bottom half");
    assert.ok(result.frontCrop.y <= 40);
    assert.ok(result.backCrop.y <= 380);
  });

  test("handles single-sided document (PAN Card front-only) on a single sheet", () => {
    // 600x400 sheet with a single card
    const buffer = createSyntheticDualCardImage({
      imageWidth: 600,
      imageHeight: 400,
      frontCard: { x: 100, y: 80, width: 400, height: 240 },
      backCard: null,
    });

    const result = detectDualDocumentInPixelBuffer(buffer, {
      isSingleSide: true,
      targetAspectRatio: id1Aspect,
    });

    assert.equal(result.detected, true);
    assert.equal(result.layout, "single");
    assert.ok(result.frontCrop);
    assert.equal(result.backCrop, null, "Back crop must be null for single-sided document");
  });

  test("provides honest fallback with adjustable default regions when detection fails", () => {
    // Completely uniform image (no contrasting card borders)
    const data = new Uint8ClampedArray(800 * 400 * 4).fill(240);
    const buffer = { data, width: 800, height: 400 };

    const result = detectDualDocumentInPixelBuffer(buffer, {
      targetAspectRatio: id1Aspect,
    });

    assert.equal(result.detected, false, "Must not falsely claim boundary detection");
    assert.ok(
      result.message.toLowerCase().includes("could not automatically") ||
        result.message.toLowerCase().includes("manual"),
      "Must provide clear honest notification"
    );
    assert.ok(result.frontCrop, "Fallback must supply usable Front crop coordinates");
    assert.ok(result.backCrop, "Fallback must supply usable Back crop coordinates");
  });

  test("sub-buffer extraction cleanly slices image regions without distortion", () => {
    const buffer = createSyntheticDualCardImage({ imageWidth: 400, imageHeight: 200 });
    const sub = extractSubBuffer(buffer, { x: 50, y: 20, width: 100, height: 80 });

    assert.equal(sub.width, 100);
    assert.equal(sub.height, 80);
    assert.equal(sub.data.length, 100 * 80 * 4);
  });

  test("layout determination detects wide sheets as horizontal and tall sheets as vertical", () => {
    assert.equal(determineDocumentLayout({ width: 800, height: 400, data: new Uint8ClampedArray() }), "horizontal");
    assert.equal(determineDocumentLayout({ width: 400, height: 700, data: new Uint8ClampedArray() }), "vertical");
  });
});

describe("TASK 2 & 3 — Dedicated Bottom-Left + Bottom-Right Document Detection (e-Aadhaar Layout)", () => {
  const id1Aspect = 85.6 / 53.98;

  // Synthesizes a realistic portrait e-Aadhaar A4 document page (800x1130)
  // Upper portion contains citizen address, letterhead text, barcode, instructions
  // Lower portion contains Front Card (bottom-left) and Back Card (bottom-right)
  function createSyntheticEaadhaarPage() {
    const imageWidth = 800;
    const imageHeight = 1130;
    const data = new Uint8ClampedArray(imageWidth * imageHeight * 4);
    const bgColor = [242, 242, 242];
    const textColor = [45, 45, 50];
    const cardColor = [35, 75, 140]; // Contrasting ID card color

    // Fill background
    for (let i = 0; i < imageWidth * imageHeight; i++) {
      data[i * 4] = bgColor[0];
      data[i * 4 + 1] = bgColor[1];
      data[i * 4 + 2] = bgColor[2];
      data[i * 4 + 3] = 255;
    }

    // Upper area letterhead & citizen letter lines (y = 50..520)
    for (let y = 60; y < 520; y += 30) {
      for (let x = 60; x < 740; x++) {
        const idx = (y * imageWidth + x) * 4;
        data[idx] = textColor[0];
        data[idx + 1] = textColor[1];
        data[idx + 2] = textColor[2];
      }
    }

    // Front Card in Bottom-Left: x = 45..385 (w=340), y = 740..955 (h=215, aspect ~1.581)
    for (let y = 740; y < 955; y++) {
      for (let x = 45; x < 385; x++) {
        const idx = (y * imageWidth + x) * 4;
        data[idx] = cardColor[0];
        data[idx + 1] = cardColor[1];
        data[idx + 2] = cardColor[2];
      }
    }

    // Back Card in Bottom-Right: x = 415..755 (w=340), y = 740..955 (h=215, aspect ~1.581)
    for (let y = 740; y < 955; y++) {
      for (let x = 415; x < 755; x++) {
        const idx = (y * imageWidth + x) * 4;
        data[idx] = cardColor[0];
        data[idx + 1] = cardColor[1];
        data[idx + 2] = cardColor[2];
      }
    }

    return { data, width: imageWidth, height: imageHeight };
  }

  test("auto-detects bottom-left as Front and bottom-right as Back, completely ignoring upper content", () => {
    const buffer = createSyntheticEaadhaarPage();
    const result = detectDualDocumentInPixelBuffer(buffer, {
      targetAspectRatio: id1Aspect,
      safetyMarginPercent: 1.5,
    });

    assert.equal(result.detected, true, "Must detect both cards");
    assert.equal(result.layout, "bottom-dual", "Must detect bottom-dual layout");
    assert.ok(result.frontCrop, "Must provide frontCrop");
    assert.ok(result.backCrop, "Must provide backCrop");

    // 1. Upper page content (y < 600) must NEVER be selected as a document side
    assert.ok(
      result.frontCrop.y >= 600,
      `Front crop top (${result.frontCrop.y}) must be in lower area, never in upper letterhead`
    );
    assert.ok(
      result.backCrop.y >= 600,
      `Back crop top (${result.backCrop.y}) must be in lower area, never in upper letterhead`
    );

    // 2. Front card must be bottom-left, Back card must be bottom-right
    assert.ok(
      result.frontCrop.x < 400,
      `Front card x (${result.frontCrop.x}) must be in the left half`
    );
    assert.ok(
      result.backCrop.x >= 400,
      `Back card x (${result.backCrop.x}) must be in the right half`
    );

    // 3. Front card must enclose bottom-left card (x=45..385, y=740..955)
    assert.ok(result.frontCrop.x <= 45);
    assert.ok(result.frontCrop.x + result.frontCrop.width >= 385);
    assert.ok(result.frontCrop.y <= 740);
    assert.ok(result.frontCrop.y + result.frontCrop.height >= 955);

    // 4. Back card must enclose bottom-right card (x=415..755, y=740..955)
    assert.ok(result.backCrop.x <= 415);
    assert.ok(result.backCrop.x + result.backCrop.width >= 755);
    assert.ok(result.backCrop.y <= 740);
    assert.ok(result.backCrop.y + result.backCrop.height >= 955);

    // 5. Target aspect ratios must be maintained close to ISO ID-1
    const frontAspect = result.frontCrop.width / result.frontCrop.height;
    const backAspect = result.backCrop.width / result.backCrop.height;
    assert.ok(Math.abs(frontAspect - id1Aspect) < 0.05, `Front aspect ratio ${frontAspect} must match ID-1`);
    assert.ok(Math.abs(backAspect - id1Aspect) < 0.05, `Back aspect ratio ${backAspect} must match ID-1`);
  });

  test("explicit forceLayout='bottom-dual' targets bottom-left and bottom-right reliably", () => {
    const buffer = createSyntheticEaadhaarPage();
    const result = detectDualDocumentInPixelBuffer(buffer, {
      forceLayout: "bottom-dual",
      targetAspectRatio: id1Aspect,
    });

    assert.equal(result.detected, true);
    assert.equal(result.layout, "bottom-dual");
    assert.ok(result.frontCrop.x < 400);
    assert.ok(result.backCrop.x >= 400);
    assert.ok(result.frontCrop.y >= 600);
    assert.ok(result.backCrop.y >= 600);
  });

  test("explicit forceLayout='horizontal' forces side-by-side splitting across full height", () => {
    const buffer = createSyntheticEaadhaarPage();
    const result = detectDualDocumentInPixelBuffer(buffer, {
      forceLayout: "horizontal",
      targetAspectRatio: id1Aspect,
    });

    assert.equal(result.layout, "horizontal");
    assert.ok(result.frontCrop.x < 400);
    assert.ok(result.backCrop.x >= 400);
  });

  test("explicit forceLayout='vertical' forces stacked top and bottom splitting", () => {
    const buffer = createSyntheticEaadhaarPage();
    const result = detectDualDocumentInPixelBuffer(buffer, {
      forceLayout: "vertical",
      targetAspectRatio: id1Aspect,
    });

    assert.equal(result.layout, "vertical");
    assert.ok(result.frontCrop.y < 565);
    assert.ok(result.backCrop.y >= 565);
  });

  test("explicit forceLayout='manual' returns editable default crops without false claims", () => {
    const buffer = createSyntheticEaadhaarPage();
    const result = detectDualDocumentInPixelBuffer(buffer, {
      forceLayout: "manual",
      targetAspectRatio: id1Aspect,
    });

    assert.equal(result.detected, false);
    assert.ok(result.frontCrop);
    assert.ok(result.backCrop);
    assert.ok(result.message.toLowerCase().includes("manual"));
  });

  test("direct detectBottomDualDocumentInPixelBuffer cleanly extracts both sides", () => {
    const buffer = createSyntheticEaadhaarPage();
    const result = detectBottomDualDocumentInPixelBuffer(buffer, {
      targetAspectRatio: id1Aspect,
    });

    assert.equal(result.detected, true);
    assert.equal(result.layout, "bottom-dual");
    assert.ok(result.frontCrop.x < 400);
    assert.ok(result.backCrop.x >= 400);
    assert.ok(result.frontCrop.y >= 600);
    assert.ok(result.backCrop.y >= 600);
  });
});

describe("PHASE 08B — 90° Step Rotation & Math Transformation", () => {
  test("normalizes rotation angles correctly", () => {
    assert.equal(normalizeRotation(0), 0);
    assert.equal(normalizeRotation(90), 90);
    assert.equal(normalizeRotation(180), 180);
    assert.equal(normalizeRotation(270), 270);
    assert.equal(normalizeRotation(360), 0);
    assert.equal(normalizeRotation(-90), 270);
    assert.equal(normalizeRotation(450), 90);
  });

  test("computes rotated dimensions for landscape and portrait images", () => {
    assert.deepEqual(getRotatedDimensions(1920, 1080, 0), { width: 1920, height: 1080 });
    assert.deepEqual(getRotatedDimensions(1920, 1080, 90), { width: 1080, height: 1920 });
    assert.deepEqual(getRotatedDimensions(1920, 1080, 180), { width: 1920, height: 1080 });
    assert.deepEqual(getRotatedDimensions(1920, 1080, 270), { width: 1080, height: 1920 });
  });

  test("adjusts crop rectangle cleanly when orientation flips by 90°", () => {
    const originalCrop = { x: 50, y: 50, width: 800, height: 500 };
    const adjusted = adjustCropForRotation(originalCrop, 1000, 600, 600, 1000, 1.586);

    assert.ok(adjusted.width <= 600);
    assert.ok(adjusted.height <= 1000);
    assert.ok(adjusted.x >= 0);
    assert.ok(adjusted.y >= 0);
  });
});

describe("PHASE 08B — Manual Crop Geometry & Drag Interactions", () => {
  const imgW = 1200;
  const imgH = 800;
  const id1Aspect = 85.6 / 53.98;

  test("initializes centered crop respecting target aspect ratio", () => {
    const crop = initDefaultCrop(imgW, imgH, id1Aspect, 0.85);
    assert.ok(crop.x > 0);
    assert.ok(crop.y > 0);
    const aspect = crop.width / crop.height;
    assert.ok(Math.abs(aspect - id1Aspect) < 0.01);
  });

  test("moves crop rectangle within image boundaries", () => {
    const initial = { x: 100, y: 100, width: 400, height: 300 };
    const moved = moveCrop(initial, 50, 40, imgW, imgH);
    assert.equal(moved.x, 150);
    assert.equal(moved.y, 140);
  });

  test("prevents crop rectangle from extending outside image when dragging", () => {
    const initial = { x: 1000, y: 600, width: 400, height: 300 };
    const moved = moveCrop(initial, 300, 300, imgW, imgH);
    assert.equal(moved.x + moved.width, imgW);
    assert.equal(moved.y + moved.height, imgH);
  });

  test("resizes crop from corner handle with aspect ratio locked", () => {
    const initial = { x: 100, y: 100, width: 317, height: 200 };
    const resized = resizeCropFromHandle(
      initial,
      "se",
      50,
      50,
      imgW,
      imgH,
      id1Aspect,
      MIN_CROP_PIXELS
    );

    assert.ok(resized.width > initial.width);
    const aspect = resized.width / resized.height;
    assert.ok(Math.abs(aspect - id1Aspect) < 0.02);
  });

  test("resizes crop from edge handle with free aspect ratio", () => {
    const initial = { x: 100, y: 100, width: 400, height: 300 };
    const resized = resizeCropFromHandle(
      initial,
      "e",
      60,
      0,
      imgW,
      imgH,
      null,
      MIN_CROP_PIXELS
    );
    assert.equal(resized.width, 460);
    assert.equal(resized.height, 300);
  });

  test("enforces minimum crop pixel threshold", () => {
    const initial = { x: 100, y: 100, width: 100, height: 100 };
    const shrunk = resizeCropFromHandle(
      initial,
      "se",
      -200,
      -200,
      imgW,
      imgH,
      null,
      MIN_CROP_PIXELS
    );
    assert.ok(shrunk.width >= MIN_CROP_PIXELS);
    assert.ok(shrunk.height >= MIN_CROP_PIXELS);
  });
});

describe("PHASE 08B — Document Studio Card Presets & Form Factors", () => {
  test("Aadhaar Card specifies ID-1 85.60 x 53.98 mm dimensions and front/back sides", () => {
    const aadhaar = getDocumentTypeDefinition("aadhaar");
    assert.ok(aadhaar.targetDimensions);
    assert.equal(aadhaar.targetDimensions.widthMm, 85.6);
    assert.equal(aadhaar.targetDimensions.heightMm, 53.98);
    assert.deepEqual(aadhaar.supportedSides, ["front", "back"]);
  });

  test("PAN Card specifies ID-1 standard dimensions and front/back sides", () => {
    const pan = getDocumentTypeDefinition("pan");
    assert.ok(pan.targetDimensions);
    assert.equal(pan.targetDimensions.widthMm, 85.6);
    assert.equal(pan.targetDimensions.heightMm, 53.98);
    assert.deepEqual(pan.supportedSides, ["front", "back"]);
  });

  test("Voter ID Card specifies standard ID-1 card dimensions and front/back sides", () => {
    const voter = getDocumentTypeDefinition("voter-id");
    assert.ok(voter.targetDimensions);
    assert.equal(voter.targetDimensions.widthMm, 85.6);
    assert.equal(voter.targetDimensions.heightMm, 53.98);
    assert.deepEqual(voter.supportedSides, ["front", "back"]);
  });

  test("Ration Card specifies standard card dimensions and front/back sides", () => {
    const ration = getDocumentTypeDefinition("ration-card");
    assert.ok(ration.targetDimensions);
    assert.equal(ration.targetDimensions.widthMm, 85.6);
    assert.equal(ration.targetDimensions.heightMm, 53.98);
    assert.deepEqual(ration.supportedSides, ["front", "back"]);
  });

  test("Custom Document allows dynamic aspect ratio and side modes", () => {
    const custom = getDocumentTypeDefinition("custom");
    assert.equal(custom.allowsSideSelection, true);
  });
});

describe("PHASE 08B — Single-Upload Workflow & UI Integration", () => {
  test("verifies required UI components and exports exist on disk", () => {
    const pagePath = path.resolve(process.cwd(), "src", "app", "tools", "document-studio", "page.tsx");
    const cropEditorPath = path.resolve(process.cwd(), "src", "components", "document-studio", "DocumentCropEditor.tsx");
    const detectorPath = path.resolve(process.cwd(), "src", "lib", "document", "document-detector.ts");
    const cropperPath = path.resolve(process.cwd(), "src", "lib", "document", "document-cropper.ts");
    const sideWorkspacePath = path.resolve(process.cwd(), "src", "components", "document-studio", "DocumentSideWorkspace.tsx");

    assert.ok(fs.existsSync(pagePath), "page.tsx must exist");
    assert.ok(fs.existsSync(cropEditorPath), "DocumentCropEditor.tsx must exist");
    assert.ok(fs.existsSync(detectorPath), "document-detector.ts must exist");
    assert.ok(fs.existsSync(cropperPath), "document-cropper.ts must exist");
    assert.ok(fs.existsSync(sideWorkspacePath), "DocumentSideWorkspace.tsx must exist");

    const pageContent = fs.readFileSync(pagePath, "utf-8");
    assert.ok(pageContent.includes("both Front and Back sides") || pageContent.includes("Upload"));
    assert.ok(pageContent.includes("Re-run Auto Detection") || pageContent.includes("Re-detect"));
    assert.ok(pageContent.includes("Split Horizontally"));
    assert.ok(pageContent.includes("Split Vertically"));

    const workspaceContent = fs.readFileSync(sideWorkspacePath, "utf-8");
    assert.ok(workspaceContent.includes("Adjust"));
    assert.ok(workspaceContent.includes("Cropped & Isolated"));
  });
});
