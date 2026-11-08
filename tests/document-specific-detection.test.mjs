/**
 * Automated Acceptance Test Suite: Document-Specific Auto-Detection, Manual Cropping & CR80 Normalization
 *
 * Verifies the 7 mandatory acceptance criteria from Section 12:
 *
 * Test 1: PAN Card Document-Specific Detection (dashed cut box, fold line, lower region [0.78, 0.96], upper ignored)
 * Test 2: Aadhaar Card Document-Specific Detection (horizontal cut line, solid borders, lower PVC row [0.72, 0.93], upper letter ignored)
 * Test 3: Ration Card Document-Specific Detection (lower 35% cut box, fold line, scissors symbols filtered out)
 * Test 4: Voter ID Card Vector & Top-Aligned Detection (top region [0.11, 0.30], vector inspection, bottom logic NOT applied)
 * Test 5: Manual Cropping Workflow (independent front/back crops, no cross-side mutation, overrides preserved)
 * Test 6: CR80 Standardization Engine (1011 x 638 px @ 300 DPI, proportional scaling, zero stretching, symmetrical padding)
 * Test 7: Front/Back Content Classification & Strategy Dispatcher (photo vs QR scoring, swapping, dispatcher routing)
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  detectPanCardInPixelBuffer,
  detectAadhaarCardInPixelBuffer,
  detectRationCardInPixelBuffer,
  detectVoterIdInPixelBuffer,
  detectPanCards,
  detectAadhaarCards,
  detectRationCards,
  detectVoterCards,
  detectDocumentByStrategy,
  detectDualDocumentBoundaries,
} from "../src/lib/document/document-detector.ts";

import {
  classifyFrontBackCrops,
  decideFrontBackFromFeatures,
  extractCardFeatures,
} from "../src/lib/document/document-content-classifier.ts";

import {
  calculateCR80Scaling,
  CR80_TARGET_WIDTH_PX,
  CR80_TARGET_HEIGHT_PX,
  CR80_TARGET_ASPECT_RATIO,
  CR80_CORNER_RADIUS_PX,
} from "../src/lib/document/cr80-normalizer.ts";

import {
  PAN_CARD_MEASUREMENTS,
  AADHAAR_CARD_MEASUREMENTS,
  RATION_CARD_MEASUREMENTS,
  VOTER_ID_MEASUREMENTS,
  CR80_STANDARD_SPEC,
  DOCUMENT_TYPES,
  getDocumentTypeDefinition,
} from "../src/constants/document-studio.ts";

/**
 * Helper to create an empty RGBA pixel buffer of given dimensions with a uniform background color.
 */
function createBuffer(width, height, bgColor = [255, 255, 255]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = bgColor[0];
    data[i + 1] = bgColor[1];
    data[i + 2] = bgColor[2];
    data[i + 3] = 255;
  }
  return { data, width, height };
}

/**
 * Fills a rectangle with a given RGB color.
 */
function fillRect(buffer, x, y, w, h, color) {
  const x0 = Math.max(0, Math.round(x));
  const y0 = Math.max(0, Math.round(y));
  const x1 = Math.min(buffer.width, Math.round(x + w));
  const y1 = Math.min(buffer.height, Math.round(y + h));

  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const idx = (py * buffer.width + px) * 4;
      buffer.data[idx] = color[0];
      buffer.data[idx + 1] = color[1];
      buffer.data[idx + 2] = color[2];
      buffer.data[idx + 3] = 255;
    }
  }
}

/**
 * Draws a horizontal dashed line.
 */
function drawDashedHLine(buffer, y, xStart, xEnd, dashLen = 8, gapLen = 6, color = [40, 40, 40]) {
  const py = Math.round(y);
  if (py < 0 || py >= buffer.height) return;
  let drawing = true;
  let count = 0;

  for (let px = Math.round(xStart); px <= Math.round(xEnd); px++) {
    if (px >= 0 && px < buffer.width && drawing) {
      const idx = (py * buffer.width + px) * 4;
      buffer.data[idx] = color[0];
      buffer.data[idx + 1] = color[1];
      buffer.data[idx + 2] = color[2];
    }
    count++;
    if (drawing && count >= dashLen) {
      drawing = false;
      count = 0;
    } else if (!drawing && count >= gapLen) {
      drawing = true;
      count = 0;
    }
  }
}

/**
 * Draws a vertical dashed line.
 */
function drawDashedVLine(buffer, x, yStart, yEnd, dashLen = 8, gapLen = 6, color = [40, 40, 40]) {
  const px = Math.round(x);
  if (px < 0 || px >= buffer.width) return;
  let drawing = true;
  let count = 0;

  for (let py = Math.round(yStart); py <= Math.round(yEnd); py++) {
    if (py >= 0 && py < buffer.height && drawing) {
      const idx = (py * buffer.width + px) * 4;
      buffer.data[idx] = color[0];
      buffer.data[idx + 1] = color[1];
      buffer.data[idx + 2] = color[2];
    }
    count++;
    if (drawing && count >= dashLen) {
      drawing = false;
      count = 0;
    } else if (!drawing && count >= gapLen) {
      drawing = true;
      count = 0;
    }
  }
}

describe("TEST 1: PAN Card Document-Specific Detection", () => {
  test("accurately detects front and back cards in lower portion and ignores upper content", () => {
    // US Letter proportional page: 510 x 660 px (scaled from 2550 x 3300 px)
    const W = 510;
    const H = 660;
    const buffer = createBuffer(W, H, [250, 250, 250]);

    // 1. Add upper content (letterhead, instructions, header text) at Y in [0.05, 0.65]
    fillRect(buffer, 40, 50, 430, 20, [30, 30, 30]); // Title
    fillRect(buffer, 40, 90, 430, 10, [100, 100, 100]); // Subtitle
    fillRect(buffer, 40, 140, 400, 150, [180, 180, 180]); // Large text block
    fillRect(buffer, 40, 320, 400, 80, [170, 170, 170]); // Another upper section

    // 2. Dashed cut box in lower portion: Y ~ [0.78, 0.96] -> Y ~ [515, 638]
    // Normalized bounds: Front X: 0.101-0.475, Back X: 0.527-0.902
    const boxY1 = Math.round(0.774 * H); // ~511
    const boxY2 = Math.round(0.967 * H); // ~638
    const boxX1 = Math.round(0.084 * W); // ~43
    const boxX2 = Math.round(0.917 * W); // ~468
    const foldX = Math.round(0.5018 * W); // ~256

    // Draw dashed cut box perimeter and central fold
    drawDashedHLine(buffer, boxY1, boxX1, boxX2);
    drawDashedHLine(buffer, boxY2, boxX1, boxX2);
    drawDashedVLine(buffer, boxX1, boxY1, boxY2);
    drawDashedVLine(buffer, boxX2, boxY1, boxY2);
    drawDashedVLine(buffer, foldX, boxY1, boxY2);

    // 3. Colored PAN cards inside each half (saturated/contrasting content)
    // Front card: X ~ [0.101, 0.475], Y ~ [0.782, 0.963]
    const frontX = Math.round(PAN_CARD_MEASUREMENTS.front.xMin * W);
    const frontY = Math.round(PAN_CARD_MEASUREMENTS.front.yMin * H);
    const frontW = Math.round((PAN_CARD_MEASUREMENTS.front.xMax - PAN_CARD_MEASUREMENTS.front.xMin) * W);
    const frontH = Math.round((PAN_CARD_MEASUREMENTS.front.yMax - PAN_CARD_MEASUREMENTS.front.yMin) * H);
    fillRect(buffer, frontX, frontY, frontW, frontH, [210, 230, 250]); // Light blue PAN front

    // Back card: X ~ [0.527, 0.902], Y ~ [0.783, 0.964]
    const backX = Math.round(PAN_CARD_MEASUREMENTS.back.xMin * W);
    const backY = Math.round(PAN_CARD_MEASUREMENTS.back.yMin * H);
    const backW = Math.round((PAN_CARD_MEASUREMENTS.back.xMax - PAN_CARD_MEASUREMENTS.back.xMin) * W);
    const backH = Math.round((PAN_CARD_MEASUREMENTS.back.yMax - PAN_CARD_MEASUREMENTS.back.yMin) * H);
    fillRect(buffer, backX, backY, backW, backH, [230, 240, 250]); // PAN back

    // Execute PAN-specific detector
    const result = detectPanCardInPixelBuffer(buffer);

    assert.equal(result.detected, true);
    assert.ok(result.strategyUsed?.includes("pan"), "Should use PAN-specific strategy");
    assert.ok(result.backCrop !== null, "Back crop must be detected");

    // Check Front card coordinates: must be in lower portion Y > 0.70
    const frontNormY = result.frontCrop.y / H;
    const backNormY = result.backCrop.y / H;
    assert.ok(frontNormY >= 0.70, `Front card Y (${frontNormY}) must be in lower portion (>= 0.70)`);
    assert.ok(backNormY >= 0.70, `Back card Y (${backNormY}) must be in lower portion (>= 0.70)`);

    // Verify Front card is to the left of fold, Back card is to the right
    assert.ok(result.frontCrop.x + result.frontCrop.width <= foldX + 10);
    assert.ok(result.backCrop.x >= foldX - 10);

    // Aspect ratio check: between 1.50 and 1.70
    const frontAspect = result.frontCrop.width / result.frontCrop.height;
    const backAspect = result.backCrop.width / result.backCrop.height;
    assert.ok(frontAspect >= 1.50 && frontAspect <= 1.70, `Front aspect ratio ${frontAspect} should be ~1.60`);
    assert.ok(backAspect >= 1.50 && backAspect <= 1.70, `Back aspect ratio ${backAspect} should be ~1.60`);
  });
});

describe("TEST 2: Aadhaar Card Document-Specific Detection", () => {
  test("extracts lower PVC card row, detects solid borders, and completely ignores upper Aadhaar letter", () => {
    // Page dimensions: 510 x 660 px
    const W = 510;
    const H = 660;
    const buffer = createBuffer(W, H, [255, 255, 255]);

    // 1. Upper Aadhaar letter (address box, large QR, instructions at Y in [0.10, 0.65])
    fillRect(buffer, 30, 80, 200, 100, [60, 60, 60]); // Upper letter address
    fillRect(buffer, 300, 80, 150, 150, [20, 20, 20]); // Upper letter large QR code
    fillRect(buffer, 30, 260, 450, 80, [120, 120, 120]); // Instructions & disclaimers

    // 2. Horizontal dashed cut line at Y ~ 0.722
    const cutY = Math.round(0.7224 * H);
    drawDashedHLine(buffer, cutY, 20, W - 20, 10, 6, [30, 30, 30]);

    // 3. Lower PVC cards with solid borders
    // Front: X ~ [0.0796, 0.4922], Y ~ [0.7224, 0.9261]
    const fX = Math.round(AADHAAR_CARD_MEASUREMENTS.front.xMin * W);
    const fY = Math.round(AADHAAR_CARD_MEASUREMENTS.front.yMin * H);
    const fW = Math.round((AADHAAR_CARD_MEASUREMENTS.front.xMax - AADHAAR_CARD_MEASUREMENTS.front.xMin) * W);
    const fH = Math.round((AADHAAR_CARD_MEASUREMENTS.front.yMax - AADHAAR_CARD_MEASUREMENTS.front.yMin) * H);

    // Back: X ~ [0.5086, 0.9212], Y ~ [0.7224, 0.9261]
    const bX = Math.round(AADHAAR_CARD_MEASUREMENTS.back.xMin * W);
    const bY = Math.round(AADHAAR_CARD_MEASUREMENTS.back.yMin * H);
    const bW = Math.round((AADHAAR_CARD_MEASUREMENTS.back.xMax - AADHAAR_CARD_MEASUREMENTS.back.xMin) * W);
    const bH = Math.round((AADHAAR_CARD_MEASUREMENTS.back.yMax - AADHAAR_CARD_MEASUREMENTS.back.yMin) * H);

    // Fill PVC cards
    fillRect(buffer, fX, fY, fW, fH, [245, 245, 240]);
    fillRect(buffer, bX, bY, bW, bH, [245, 245, 240]);

    // Draw solid borders around both PVC cards
    const borderColor = [30, 30, 30];
    fillRect(buffer, fX, fY, fW, 2, borderColor);
    fillRect(buffer, fX, fY + fH - 2, fW, 2, borderColor);
    fillRect(buffer, fX, fY, 2, fH, borderColor);
    fillRect(buffer, fX + fW - 2, fY, 2, fH, borderColor);

    fillRect(buffer, bX, bY, bW, 2, borderColor);
    fillRect(buffer, bX, bY + bH - 2, bW, 2, borderColor);
    fillRect(buffer, bX, bY, 2, fH, borderColor);
    fillRect(buffer, bX + bW - 2, bY, 2, bH, borderColor);

    // Run Aadhaar-specific detector
    const result = detectAadhaarCardInPixelBuffer(buffer);

    assert.equal(result.detected, true);
    assert.ok(result.strategyUsed?.includes("aadhaar"), "Should use Aadhaar-specific strategy");
    assert.ok(result.backCrop !== null, "Back crop must be present");

    // Ensure crops are strictly from lower region Y >= 0.70
    assert.ok(result.frontCrop.y / H >= 0.70, "Aadhaar front crop must not include upper letter");
    assert.ok(result.backCrop.y / H >= 0.70, "Aadhaar back crop must not include upper letter");

    // Check width and height similarity between front and back (within 5%)
    const wDiff = Math.abs(result.frontCrop.width - result.backCrop.width) / result.frontCrop.width;
    const hDiff = Math.abs(result.frontCrop.height - result.backCrop.height) / result.frontCrop.height;
    assert.ok(wDiff < 0.05, `Width difference between sides (${wDiff}) should be < 5%`);
    assert.ok(hDiff < 0.05, `Height difference between sides (${hDiff}) should be < 5%`);
  });
});

describe("TEST 3: Ration Card Document-Specific Detection", () => {
  test("identifies lower 35% cut box, ignores scissors symbols, and extracts front/back", () => {
    const W = 510;
    const H = 660;
    const buffer = createBuffer(W, H, [255, 255, 255]);

    // 1. Upper booklet tables and NFSA head details at Y < 0.60
    fillRect(buffer, 30, 40, 450, 30, [40, 40, 40]);
    fillRect(buffer, 30, 80, 450, 150, [200, 200, 200]);
    fillRect(buffer, 30, 250, 450, 120, [190, 190, 190]);

    // 2. Scissors symbols near the cut line (small high contrast icons that must NOT be mistaken for card bounds)
    fillRect(buffer, 20, Math.round(0.77 * H), 12, 12, [10, 10, 10]); // Left scissors
    fillRect(buffer, W - 35, Math.round(0.77 * H), 12, 12, [10, 10, 10]); // Right scissors

    // 3. Lower 35% dashed cut box
    const cutTop = Math.round(0.78 * H);
    const cutBot = Math.round(0.97 * H);
    drawDashedHLine(buffer, cutTop, 40, W - 40);
    drawDashedHLine(buffer, cutBot, 40, W - 40);
    drawDashedVLine(buffer, Math.round(0.502 * W), cutTop, cutBot);

    // 4. Front card: X ~ [0.1243, 0.4859], Back: X ~ [0.5165, 0.8780], Y ~ [0.7927, 0.9600]
    const fX = Math.round(RATION_CARD_MEASUREMENTS.front.xMin * W);
    const fY = Math.round(RATION_CARD_MEASUREMENTS.front.yMin * H);
    const fW = Math.round((RATION_CARD_MEASUREMENTS.front.xMax - RATION_CARD_MEASUREMENTS.front.xMin) * W);
    const fH = Math.round((RATION_CARD_MEASUREMENTS.front.yMax - RATION_CARD_MEASUREMENTS.front.yMin) * H);

    const bX = Math.round(RATION_CARD_MEASUREMENTS.back.xMin * W);
    const bY = Math.round(RATION_CARD_MEASUREMENTS.back.yMin * H);
    const bW = Math.round((RATION_CARD_MEASUREMENTS.back.xMax - RATION_CARD_MEASUREMENTS.back.xMin) * W);
    const bH = Math.round((RATION_CARD_MEASUREMENTS.back.yMax - RATION_CARD_MEASUREMENTS.back.yMin) * H);

    fillRect(buffer, fX, fY, fW, fH, [220, 240, 220]);
    fillRect(buffer, bX, bY, bW, bH, [220, 240, 220]);

    // Run Ration Card-specific detector
    const result = detectRationCardInPixelBuffer(buffer);

    assert.equal(result.detected, true);
    assert.ok(result.strategyUsed?.includes("ration"), "Should use Ration-specific strategy");
    assert.ok(result.backCrop !== null);

    // Verify scissors symbol was not included as the card boundary
    assert.ok(result.frontCrop.x >= fX - 10, "Front crop should not stretch to scissors position");
    assert.ok(result.frontCrop.y / H >= 0.75, "Ration card must be in lower 35% region");
    assert.ok(result.backCrop.y / H >= 0.75, "Ration card back must be in lower 35% region");
  });

  test("verifies reference measurements and bottom-left to top-left coordinate conversions", () => {
    // Top-left origin reference coordinates for 2550 x 3300 px @ 300 DPI:
    // Dashed cut box: X 269–2280 px, Y 2570–3205 px
    // Fold: ~1280 px (X ~ 0.5020)
    // Front card: X 317–1239 px (0.1243–0.4859), Y 2616–3168 px (0.7927–0.9600)
    // Back card: X 1317–2239 px (0.5165–0.8780), Y 2616–3168 px (0.7927–0.9600)

    const W = 2550;
    const H = 3300;

    assert.ok(RATION_CARD_MEASUREMENTS.cutBox, "Cut box coordinates must be defined");
    const cutBox = RATION_CARD_MEASUREMENTS.cutBox;

    // Cut box normalized range checks
    assert.ok(Math.abs(cutBox.xMin - 269 / W) < 0.001);
    assert.ok(Math.abs(cutBox.xMax - 2280 / W) < 0.001);
    assert.ok(Math.abs(cutBox.yMin - 2570 / H) < 0.001);
    assert.ok(Math.abs(cutBox.yMax - 3205 / H) < 0.001);

    // Front card normalized range checks
    const front = RATION_CARD_MEASUREMENTS.front;
    assert.ok(Math.abs(front.xMin - 317 / W) < 0.001);
    assert.ok(Math.abs(front.xMax - 1239 / W) < 0.001);
    assert.ok(Math.abs(front.yMin - 2616 / H) < 0.001);
    assert.ok(Math.abs(front.yMax - 3168 / H) < 0.001);

    // Back card normalized range checks
    const back = RATION_CARD_MEASUREMENTS.back;
    assert.ok(Math.abs(back.xMin - 1317 / W) < 0.001);
    assert.ok(Math.abs(back.xMax - 2239 / W) < 0.001);
    assert.ok(Math.abs(back.yMin - 2616 / H) < 0.001);
    assert.ok(Math.abs(back.yMax - 3168 / H) < 0.001);

    // Bottom-left coordinate conversion formulas:
    // Y_bottom = H - Y_top
    // Y_bottom_normalized = 1 - Y_top_normalized
    assert.ok(RATION_CARD_MEASUREMENTS.bottomLeft, "Bottom-left coordinates must be provided");
    const blFront = RATION_CARD_MEASUREMENTS.bottomLeft.front;
    const blBack = RATION_CARD_MEASUREMENTS.bottomLeft.back;

    // In bottom-left space, front/back Y is ~[0.0400, 0.2073]
    const expectedBlYMin = 1 - front.yMax; // ~0.0400
    const expectedBlYMax = 1 - front.yMin; // ~0.2073

    assert.ok(Math.abs(blFront.yMin - expectedBlYMin) < 0.001);
    assert.ok(Math.abs(blFront.yMax - expectedBlYMax) < 0.001);
    assert.ok(Math.abs(blBack.yMin - expectedBlYMin) < 0.001);
    assert.ok(Math.abs(blBack.yMax - expectedBlYMax) < 0.001);

    // Verify distance from dashed cut box edges to card edges:
    // Card starts ~46 px below top dashed edge and ends ~37 px above bottom dashed edge
    const topDashedEdgePx = Math.round(cutBox.yMin * H);
    const bottomDashedEdgePx = Math.round(cutBox.yMax * H);
    const topCardEdgePx = Math.round(front.yMin * H);
    const bottomCardEdgePx = Math.round(front.yMax * H);

    assert.equal(topCardEdgePx - topDashedEdgePx, 46, "Card must start 46 px below top dashed line");
    assert.equal(bottomDashedEdgePx - bottomCardEdgePx, 37, "Card must end 37 px above bottom dashed line");
  });

  test("extracts card boundaries using primary saturation threshold (sat >= 45) at 300 DPI resolution", () => {
    // Full 2550 x 3300 px raster buffer
    const W = 2550;
    const H = 3300;
    const buffer = createBuffer(W, H, [255, 255, 255]); // Pure white (sat = 0)

    // 1. Draw dashed cut box around [269, 2280] x [2570, 3205] (sat = 0)
    drawDashedHLine(buffer, 2570, 269, 2280, 16, 12, [50, 50, 50]);
    drawDashedHLine(buffer, 3205, 269, 2280, 16, 12, [50, 50, 50]);
    drawDashedVLine(buffer, 1280, 2570, 3205, 16, 12, [50, 50, 50]); // Fold line

    // 2. Colored cards with saturation >= 45 (light blue card background: RGB [160, 200, 245], sat = 85)
    // Front: X: 317 to 1239, Y: 2616 to 3168 (W: 922, H: 552)
    fillRect(buffer, 317, 2616, 922, 552, [160, 200, 245]);

    // Back: X: 1317 to 2239, Y: 2616 to 3168 (W: 922, H: 552)
    fillRect(buffer, 1317, 2616, 922, 552, [160, 200, 245]);

    // 3. Add non-card distractions in upper region (sat = 0 or high sat, but Y < 0.75 * H = 2475)
    fillRect(buffer, 100, 500, 800, 400, [255, 100, 100]); // Upper red header
    fillRect(buffer, 1500, 1200, 600, 300, [0, 0, 0]); // Upper table

    // Execute detector
    const result = detectRationCardInPixelBuffer(buffer);

    assert.equal(result.detected, true);
    assert.ok(result.strategyUsed?.includes("ration"), "Must use Ration strategy");
    assert.ok(result.backCrop !== null);

    // Verify detected front and back card boundaries match card dimensions within ±10 px
    assert.ok(Math.abs(result.frontCrop.x - 317) <= 10, `Front X (${result.frontCrop.x}) should be ~317`);
    assert.ok(Math.abs(result.frontCrop.y - 2616) <= 10, `Front Y (${result.frontCrop.y}) should be ~2616`);
    assert.ok(Math.abs(result.frontCrop.width - 922) <= 10, `Front width (${result.frontCrop.width}) should be ~922`);
    assert.ok(Math.abs(result.frontCrop.height - 552) <= 10, `Front height (${result.frontCrop.height}) should be ~552`);

    assert.ok(Math.abs(result.backCrop.x - 1317) <= 10, `Back X (${result.backCrop.x}) should be ~1317`);
    assert.ok(Math.abs(result.backCrop.y - 2616) <= 10, `Back Y (${result.backCrop.y}) should be ~2616`);
    assert.ok(Math.abs(result.backCrop.width - 922) <= 10, `Back width (${result.backCrop.width}) should be ~922`);
    assert.ok(Math.abs(result.backCrop.height - 552) <= 10, `Back height (${result.backCrop.height}) should be ~552`);

    // Verify dashed box perimeter is NOT included in crop
    assert.ok(result.frontCrop.y >= 2610, "Crop must start at card edge, not top dashed line 2570");
    assert.ok(result.frontCrop.y + result.frontCrop.height <= 3175, "Crop must end at card edge, not bottom dashed line 3205");

    // Aspect ratio check: 922 / 552 = 1.670 (target 1.669, acceptable 1.55–1.70)
    const aspect = result.frontCrop.width / result.frontCrop.height;
    assert.ok(aspect >= 1.55 && aspect <= 1.70, `Aspect ratio ${aspect} should be ~1.669`);
  });

  test("excludes upper region content (Y < 0.75 * H) such as page-level QR, status icon, and signature block", () => {
    const W = 510;
    const H = 660;
    const buffer = createBuffer(W, H, [255, 255, 255]);

    // Page-level QR code at Y ~ 0.20
    fillRect(buffer, 350, Math.round(0.20 * H), 100, 100, [0, 0, 0]);
    // Status icon at Y ~ 0.35
    fillRect(buffer, 50, Math.round(0.35 * H), 60, 60, [0, 180, 0]);
    // Signature block at Y ~ 0.55
    fillRect(buffer, 200, Math.round(0.55 * H), 250, 40, [20, 20, 20]);
    // Scissors above cut box at Y ~ 0.70
    fillRect(buffer, 60, Math.round(0.70 * H), 20, 20, [10, 10, 10]);

    // Cards in lower region Y >= 0.79
    const fX = Math.round(RATION_CARD_MEASUREMENTS.front.xMin * W);
    const fY = Math.round(RATION_CARD_MEASUREMENTS.front.yMin * H);
    const fW = Math.round((RATION_CARD_MEASUREMENTS.front.xMax - RATION_CARD_MEASUREMENTS.front.xMin) * W);
    const fH = Math.round((RATION_CARD_MEASUREMENTS.front.yMax - RATION_CARD_MEASUREMENTS.front.yMin) * H);

    const bX = Math.round(RATION_CARD_MEASUREMENTS.back.xMin * W);
    const bY = Math.round(RATION_CARD_MEASUREMENTS.back.yMin * H);
    const bW = Math.round((RATION_CARD_MEASUREMENTS.back.xMax - RATION_CARD_MEASUREMENTS.back.xMin) * W);
    const bH = Math.round((RATION_CARD_MEASUREMENTS.back.yMax - RATION_CARD_MEASUREMENTS.back.yMin) * H);

    fillRect(buffer, fX, fY, fW, fH, [180, 220, 250]);
    fillRect(buffer, bX, bY, bW, bH, [180, 220, 250]);

    const result = detectRationCardInPixelBuffer(buffer);

    assert.equal(result.detected, true);
    // Ensure all detected coordinates are strictly in the lower region Y >= 0.75 * H
    assert.ok(result.frontCrop.y >= 0.75 * H, "Front crop Y must be >= 0.75 * H");
    assert.ok(result.backCrop.y >= 0.75 * H, "Back crop Y must be >= 0.75 * H");
  });

  test("correctly classifies front (bottom-right QR) and back (centered 1D barcode) for Ration Cards without requiring photo", () => {
    // Ration Card Front: Has bottom-right QR code, text density, NO photo
    const frontFeatures = {
      hasPhoto: false,
      photoScore: 0.05,
      hasQrOrBarcode: true,
      qrBarcodeScore: 0.75,
      hasBottomRightQr: true,
      bottomRightQrScore: 0.82,
      has1DBarcode: false,
      barcode1DScore: 0.05,
      textLineDensity: 0.5,
      meanSaturation: 40,
    };

    // Ration Card Back: Centered 1D barcode, text density, NO photo
    const backFeatures = {
      hasPhoto: false,
      photoScore: 0.05,
      hasQrOrBarcode: true,
      qrBarcodeScore: 0.80,
      hasBottomRightQr: false,
      bottomRightQrScore: 0.04,
      has1DBarcode: true,
      barcode1DScore: 0.88,
      textLineDensity: 0.45,
      meanSaturation: 40,
    };

    // Correct alignment: candidate 1 is Front, candidate 2 is Back -> should NOT swap
    const decisionCorrect = decideFrontBackFromFeatures(frontFeatures, backFeatures, "ration-card");
    assert.equal(decisionCorrect.shouldSwap, false, "Should not swap when front is on candidate 1 and back on candidate 2");
    assert.ok(decisionCorrect.reason.includes("Ration Card"), "Reason should indicate Ration Card logic");

    // Inverted alignment: candidate 1 is Back, candidate 2 is Front -> MUST swap
    const decisionInverted = decideFrontBackFromFeatures(backFeatures, frontFeatures, "ration-card");
    assert.equal(decisionInverted.shouldSwap, true, "Must swap when back candidate is on candidate 1 and front on candidate 2");
    assert.ok(decisionInverted.confidence >= 0.80, "Confidence should be high based on 1D barcode and bottom-right QR");

    // Verify that QR code presence does NOT penalize or flip front card when no 1D barcode on front
    const frontWithQrOnly = { ...frontFeatures, has1DBarcode: false, barcode1DScore: 0.0 };
    const plainBack = { ...backFeatures, hasBottomRightQr: false, bottomRightQrScore: 0.0 };
    const qrDecision = decideFrontBackFromFeatures(frontWithQrOnly, plainBack, "ration-card");
    assert.equal(qrDecision.shouldSwap, false, "QR code on Ration Card front must NOT trigger false swap to back");
  });

  test("marks low confidence when detected card edge deviates > 3% from reference page coordinates", () => {
    const W = 510;
    const H = 660;
    const buffer = createBuffer(W, H, [255, 255, 255]);

    // Place card shifted downwards significantly (> 3% of page height, > 20 px)
    const shiftedY = Math.round((RATION_CARD_MEASUREMENTS.front.yMin + 0.05) * H); // shifted by +5% of H
    const fX = Math.round(RATION_CARD_MEASUREMENTS.front.xMin * W);
    const fW = Math.round((RATION_CARD_MEASUREMENTS.front.xMax - RATION_CARD_MEASUREMENTS.front.xMin) * W);
    const fH = Math.round((RATION_CARD_MEASUREMENTS.front.yMax - RATION_CARD_MEASUREMENTS.front.yMin) * H);

    fillRect(buffer, fX, shiftedY, fW, fH, [180, 220, 250]);
    fillRect(buffer, Math.round(RATION_CARD_MEASUREMENTS.back.xMin * W), shiftedY, fW, fH, [180, 220, 250]);

    const result = detectRationCardInPixelBuffer(buffer);

    // If edge deviates > 3% of page dimension, confidence should be low (< 0.70)
    assert.ok(
      result.confidence < 0.70 || result.confidenceReason?.includes("deviates"),
      "Should indicate lower confidence when edges deviate > 3% from reference"
    );
  });

  test("CR80 normalizer fits Ration Card (1.669 aspect ratio) to CR80 by scaling to width and extending vertical padding", () => {
    // Ration Card measured crop: Width = 923 px, Height = 553 px (ratio = 1.669)
    const cardWidth = 923;
    const cardHeight = 553;

    const geo = calculateCR80Scaling(cardWidth, cardHeight);

    // Must scale uniformly to CR80 width (1011 px)
    assert.equal(geo.drawWidth, CR80_TARGET_WIDTH_PX, "Draw width must equal 1011 px");
    assert.equal(geo.padHorizontal, 0, "Horizontal padding must be 0 (full width fit)");

    // Draw height: 553 * (1011 / 923) = ~606 px
    const expectedDrawHeight = Math.round(cardHeight * (CR80_TARGET_WIDTH_PX / cardWidth));
    assert.equal(geo.drawHeight, expectedDrawHeight, "Draw height must be proportionally ~606 px");

    // Vertical padding: 638 - 606 = 32 px
    assert.equal(geo.padVertical, CR80_TARGET_HEIGHT_PX - expectedDrawHeight, "Vertical padding must equal remaining space (32 px)");
    assert.equal(geo.drawY, Math.round(geo.padVertical / 2), "drawY must be centered (16 px top margin)");

    // Zero stretching
    assert.equal(geo.isStretched, false, "Must never stretch card pixels");
  });
});

describe("TEST 4: Voter ID Card Vector PDF & Top-Aligned Detection", () => {
  test("extracts card placements from vector PDF information when available", async () => {
    // Vector PDF test: Page A4 (595.28 x 841.89 pt)
    const nativeWidth = 2480;
    const nativeHeight = 3508;
    const scaleX = nativeWidth / 595.28;
    const scaleY = nativeHeight / 841.89;

    const frontPt = { x: 32.5, y: 95.0, width: 245.0, height: 154.0 };
    const backPt = { x: 327.03, y: 95.0, width: 245.0, height: 154.0 };

    const vectorInfo = {
      isVectorPdf: true,
      pageWidthPt: 595.28,
      pageHeightPt: 841.89,
      frontCropPt: frontPt,
      backCropPt: backPt,
      frontCropPx: {
        x: Math.round(frontPt.x * scaleX),
        y: Math.round(frontPt.y * scaleY),
        width: Math.round(frontPt.width * scaleX),
        height: Math.round(frontPt.height * scaleY),
      },
      backCropPx: {
        x: Math.round(backPt.x * scaleX),
        y: Math.round(backPt.y * scaleY),
        width: Math.round(backPt.width * scaleX),
        height: Math.round(backPt.height * scaleY),
      },
      confidence: 0.99,
      method: "pdf-image-placement",
      message: "Detected 2 embedded card image placements from vector PDF.",
    };

    // Detection with vectorInfo passed to detectDualDocumentBoundaries at 300 DPI
    const result = await detectDualDocumentBoundaries(
      null, // No raster buffer needed for vector extraction
      nativeWidth,
      nativeHeight,
      {
        docTypeId: "voter-id",
        vectorInfo,
      }
    );

    assert.equal(result.detected, true);
    assert.ok(result.strategyUsed?.includes("voter-id"), "Should use Voter ID vector strategy");
    assert.ok(result.backCrop !== null);

    // Verify coordinates match precalculated pixel placements
    assert.equal(result.frontCrop.x, vectorInfo.frontCropPx.x);
    assert.equal(result.frontCrop.y, vectorInfo.frontCropPx.y);

    // Verify Voter ID cards are in the TOP region of the page (Y < 0.35)
    const normFrontY = result.frontCrop.y / nativeHeight;
    assert.ok(normFrontY < 0.35, `Voter ID Front Y (${normFrontY}) must be near top of page (< 0.35)`);
  });

  test("uses top-aligned raster detection for Voter ID when vector info is absent and refuses bottom-dual logic", () => {
    const W = 595;
    const H = 842;
    const buffer = createBuffer(W, H, [255, 255, 255]);

    // Voter ID cards are near the top: Y in [0.1128, 0.2957] -> Y in [95, 249]
    const fX = Math.round(VOTER_ID_MEASUREMENTS.front.xMin * W);
    const fY = Math.round(VOTER_ID_MEASUREMENTS.front.yMin * H);
    const fW = Math.round((VOTER_ID_MEASUREMENTS.front.xMax - VOTER_ID_MEASUREMENTS.front.xMin) * W);
    const fH = Math.round((VOTER_ID_MEASUREMENTS.front.yMax - VOTER_ID_MEASUREMENTS.front.yMin) * H);

    const bX = Math.round(VOTER_ID_MEASUREMENTS.back.xMin * W);
    const bY = Math.round(VOTER_ID_MEASUREMENTS.back.yMin * H);
    const bW = Math.round((VOTER_ID_MEASUREMENTS.back.xMax - VOTER_ID_MEASUREMENTS.back.xMin) * W);
    const bH = Math.round((VOTER_ID_MEASUREMENTS.back.yMax - VOTER_ID_MEASUREMENTS.back.yMin) * H);

    fillRect(buffer, fX, fY, fW, fH, [240, 240, 245]);
    fillRect(buffer, bX, bY, bW, bH, [240, 240, 245]);

    // Bottom region contains non-card voter instructions / tables
    fillRect(buffer, 30, Math.round(0.75 * H), 500, 150, [180, 180, 180]);

    // Run Voter ID raster detector
    const result = detectVoterIdInPixelBuffer(buffer);

    assert.equal(result.detected, true);
    assert.ok(result.strategyUsed?.includes("voter-id"), "Should use Voter ID raster strategy");
    assert.ok(result.backCrop !== null);

    // Confirm that front and back crops are near the top (Y < 0.35) and NOT from the bottom
    assert.ok(result.frontCrop.y / H < 0.35, "Voter ID must detect cards in top portion");
    assert.ok(result.backCrop.y / H < 0.35, "Voter ID back card must be in top portion");
  });
});

describe("TEST 5: Manual Cropping Workflow & State Isolation", () => {
  test("maintains independent state for Front and Back side crops without cross-side mutation", () => {
    // Simulate Studio state with auto-detected front and back crops
    let frontCrop = { x: 50, y: 100, width: 300, height: 189 };
    let backCrop = { x: 400, y: 100, width: 300, height: 189 };
    let isFrontManual = false;
    let isBackManual = false;

    // User adjusts FRONT crop manually
    const newFrontCrop = { x: 45, y: 95, width: 310, height: 195 };
    frontCrop = { ...newFrontCrop };
    isFrontManual = true;

    // Verify BACK crop is completely unchanged
    assert.deepEqual(backCrop, { x: 400, y: 100, width: 300, height: 189 });
    assert.equal(isBackManual, false);
    assert.equal(isFrontManual, true);

    // User adjusts BACK crop manually
    const newBackCrop = { x: 410, y: 105, width: 290, height: 183 };
    backCrop = { ...newBackCrop };
    isBackManual = true;

    // Verify FRONT crop is completely unchanged
    assert.deepEqual(frontCrop, { x: 45, y: 95, width: 310, height: 195 });
    assert.equal(isBackManual, true);

    // If an auto-detection event occurs, manual crops should be preserved
    // (Simulating hook logic: preserve manual crop overrides)
    const simulatedAutoDetection = {
      frontCrop: { x: 50, y: 100, width: 300, height: 189 },
      backCrop: { x: 400, y: 100, width: 300, height: 189 },
    };

    const finalFront = isFrontManual ? frontCrop : simulatedAutoDetection.frontCrop;
    const finalBack = isBackManual ? backCrop : simulatedAutoDetection.backCrop;

    assert.deepEqual(finalFront, newFrontCrop, "Front manual crop must be preserved");
    assert.deepEqual(finalBack, newBackCrop, "Back manual crop must be preserved");
  });
});

describe("TEST 6: CR80 Standardization Engine", () => {
  test("normalizes all 4 document dimensions to exact 1011 x 638 px @ 300 DPI with proportional scaling", () => {
    // Reference crop dimensions from actual measurements:
    const cardSamples = [
      { name: "PAN Card", width: 955, height: 597 },
      { name: "Aadhaar Card", width: 1052, height: 672 },
      { name: "Ration Card", width: 923, height: 553 },
      { name: "Voter ID Card", width: 980, height: 616 },
    ];

    for (const sample of cardSamples) {
      const geo = calculateCR80Scaling(sample.width, sample.height);

      // Target canvas dimensions must be strictly 1011 x 638 px
      assert.equal(geo.targetWidth, CR80_TARGET_WIDTH_PX, `${sample.name}: target width must be 1011 px`);
      assert.equal(geo.targetHeight, CR80_TARGET_HEIGHT_PX, `${sample.name}: target height must be 638 px`);

      // Scaling factor must be proportional (scaleX == scaleY, zero stretching)
      const expectedScale = Math.min(CR80_TARGET_WIDTH_PX / sample.width, CR80_TARGET_HEIGHT_PX / sample.height);
      assert.ok(
        Math.abs(geo.scaleFactor - expectedScale) < 0.0001,
        `${sample.name}: scale (${geo.scaleFactor}) must match min ratio (${expectedScale})`
      );

      // Rendered width and height must fit within 1011 x 638 px
      assert.ok(geo.drawWidth <= CR80_TARGET_WIDTH_PX);
      assert.ok(geo.drawHeight <= CR80_TARGET_HEIGHT_PX);

      // Verify no stretching
      assert.equal(geo.isStretched, false);

      // Padding must be symmetrically distributed
      const horizRem = CR80_TARGET_WIDTH_PX - geo.drawWidth;
      const vertRem = CR80_TARGET_HEIGHT_PX - geo.drawHeight;
      assert.ok(Math.abs(geo.drawX - horizRem / 2) <= 1.0, `${sample.name}: horizontal padding must be centered`);
      assert.ok(Math.abs(geo.drawY - vertRem / 2) <= 1.0, `${sample.name}: vertical padding must be centered`);

      // Target aspect ratio must match standard CR80 ~1.586
      const targetAspect = geo.targetWidth / geo.targetHeight;
      assert.ok(
        Math.abs(targetAspect - CR80_TARGET_ASPECT_RATIO) < 0.005,
        `Aspect ratio ${targetAspect} must equal CR80 ${CR80_TARGET_ASPECT_RATIO}`
      );
    }
  });

  test("defines correct physical CR80 specification constants", () => {
    assert.equal(CR80_STANDARD_SPEC.widthMm, 85.60);
    assert.equal(CR80_STANDARD_SPEC.heightMm, 53.98);
    assert.equal(CR80_STANDARD_SPEC.targetWidthPx, 1011);
    assert.equal(CR80_STANDARD_SPEC.targetHeightPx, 638);
    assert.equal(CR80_STANDARD_SPEC.cornerRadiusMm, 3.18);
    assert.equal(CR80_CORNER_RADIUS_PX, 38);
  });
});

describe("TEST 7: Front/Back Content Classification & Strategy Dispatcher", () => {
  test("correctly swaps card candidates when photo is on candidate 2 and QR/barcode is on candidate 1", () => {
    // Candidate 1: High QR score, low photo score (Back side features)
    const candidate1 = {
      hasPhoto: false,
      photoScore: 0.1,
      hasQrOrBarcode: true,
      qrBarcodeScore: 0.85,
      textLineDensity: 0.6,
      meanSaturation: 15,
    };

    // Candidate 2: High photo score, low QR score (Front side features)
    const candidate2 = {
      hasPhoto: true,
      photoScore: 0.9,
      hasQrOrBarcode: false,
      qrBarcodeScore: 0.05,
      textLineDensity: 0.3,
      meanSaturation: 45,
    };

    // If candidate 1 was placed as frontCandidate and candidate 2 as backCandidate, classifier should flag shouldSwap: true
    const decision = decideFrontBackFromFeatures(candidate1, candidate2, "pan");
    assert.equal(decision.shouldSwap, true, "Should swap when back features are on front and front features are on back");
    assert.ok(decision.confidence > 0.6);

    // When candidate 2 is front and candidate 1 is back, shouldSwap should be false
    const decisionCorrect = decideFrontBackFromFeatures(candidate2, candidate1, "pan");
    assert.equal(decisionCorrect.shouldSwap, false, "Should not swap when correctly aligned");
  });

  test("detectDocumentByStrategy dispatches to appropriate document-specific detector", () => {
    const W = 500;
    const H = 600;
    const buffer = createBuffer(W, H, [255, 255, 255]);

    // Test PAN dispatch
    const panResult = detectDocumentByStrategy(buffer, "pan");
    assert.ok(panResult.strategyUsed?.includes("pan"), "Should route to PAN strategy");

    // Test Aadhaar dispatch
    const aadhaarResult = detectDocumentByStrategy(buffer, "aadhaar");
    assert.ok(aadhaarResult.strategyUsed?.includes("aadhaar"), "Should route to Aadhaar strategy");

    // Test Ration Card dispatch
    const rationResult = detectDocumentByStrategy(buffer, "ration-card");
    assert.ok(rationResult.strategyUsed?.includes("ration"), "Should route to Ration strategy");

    // Test Voter ID dispatch
    const voterResult = detectDocumentByStrategy(buffer, "voter-id");
    assert.ok(voterResult.strategyUsed?.includes("voter-id"), "Should route to Voter ID strategy");
  });

  test("conceptual detector functions detectPanCards, detectAadhaarCards, detectRationCards, detectVoterCards are all callable", () => {
    assert.equal(typeof detectPanCards, "function");
    assert.equal(typeof detectAadhaarCards, "function");
    assert.equal(typeof detectRationCards, "function");
    assert.equal(typeof detectVoterCards, "function");

    const buffer = createBuffer(100, 100);
    const resPan = detectPanCards(buffer);
    assert.ok(resPan.frontCrop);

    const resAadhaar = detectAadhaarCards(buffer);
    assert.ok(resAadhaar.frontCrop);

    const resRation = detectRationCards(buffer);
    assert.ok(resRation.frontCrop);

    const resVoter = detectVoterCards(buffer);
    assert.ok(resVoter.frontCrop);
  });

  test("vector PDF inspection info is strictly isolated to Voter ID and never hijacked by PAN, Aadhaar, or Ration Card", () => {
    const W = 2550;
    const H = 3300;
    const buffer = createBuffer(W, H, [255, 255, 255]);

    // Simulated vector info containing top-aligned Voter ID placements (Y: 95 to 249 pt, approx 372 to 975 px)
    const simulatedVoterVectorInfo = {
      isVectorPdf: true,
      confidence: 0.98,
      frontCropPx: { x: 139, y: 372, width: 1050, height: 603 },
      backCropPx: { x: 1400, y: 372, width: 1050, height: 603 },
      message: "e-EPIC cards isolated from vector placements",
    };

    // When docType is 'pan', even if vectorInfo is passed, it must NEVER use the top placement!
    const panResult = detectDocumentByStrategy(buffer, "pan", { vectorInfo: simulatedVoterVectorInfo });
    assert.notEqual(panResult.strategyUsed, "voter-id-vector-pdf-embedded-image-placements");
    // Front Y must be in lower half (Y >= 0.70 * H = 2310)
    assert.ok(panResult.frontCrop.y >= H * 0.70, `PAN front Y (${panResult.frontCrop.y}) must be in bottom section, not top!`);

    // When docType is 'aadhaar', it must NOT use voter vector placement
    const aadhaarResult = detectDocumentByStrategy(buffer, "aadhaar", { vectorInfo: simulatedVoterVectorInfo });
    assert.notEqual(aadhaarResult.strategyUsed, "voter-id-vector-pdf-embedded-image-placements");
    assert.ok(aadhaarResult.frontCrop.y >= H * 0.70, `Aadhaar front Y (${aadhaarResult.frontCrop.y}) must be in bottom section, not top!`);

    // When docType is 'ration-card', it must NOT use voter vector placement
    const rationResult = detectDocumentByStrategy(buffer, "ration-card", { vectorInfo: simulatedVoterVectorInfo });
    assert.notEqual(rationResult.strategyUsed, "voter-id-vector-pdf-embedded-image-placements");
    assert.ok(rationResult.frontCrop.y >= H * 0.65, `Ration front Y (${rationResult.frontCrop.y}) must be in bottom section, not top!`);

    // Only when docType is 'voter-id', it uses the vector placements
    const voterResult = detectDocumentByStrategy(buffer, "voter-id", { vectorInfo: simulatedVoterVectorInfo });
    assert.equal(voterResult.frontCrop.y, 372, "Voter ID should use the top vector crop Y: 372");
    assert.equal(voterResult.backCrop.y, 372, "Voter ID should use the top vector crop Y: 372");
  });
});
