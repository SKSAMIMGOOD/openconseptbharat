/**
 * Test Suite: Document Straightener — Perspective Engine & Homography
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  pointDistance,
  crossProduct2D,
  isConvexQuad,
  calculateOutputDimensions,
  computeBackwardHomography,
  warpPerspectiveBuffer,
  rotatePoint,
  rotatePerspectiveQuad,
  createDefaultQuad,
} from "../src/lib/document/perspective-engine.ts";

describe("Perspective Engine — Geometry & Homography", () => {
  test("pointDistance computes accurate Euclidean distance", () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 300, y: 400 };
    assert.equal(pointDistance(p1, p2), 500);
  });

  test("isConvexQuad identifies convex quadrilaterals", () => {
    const validQuad = {
      topLeft: { x: 100, y: 100 },
      topRight: { x: 800, y: 120 },
      bottomRight: { x: 820, y: 600 },
      bottomLeft: { x: 80, y: 580 },
    };
    assert.equal(isConvexQuad(validQuad), true);
  });

  test("isConvexQuad rejects self-intersecting or concave quadrilaterals", () => {
    // Top-Left and Top-Right swapped -> self-intersecting butterfly polygon
    const invertedQuad = {
      topLeft: { x: 800, y: 100 },
      topRight: { x: 100, y: 100 },
      bottomRight: { x: 820, y: 600 },
      bottomLeft: { x: 80, y: 600 },
    };
    assert.equal(isConvexQuad(invertedQuad), false);

    // Concave quadrilateral where one vertex indents past the diagonal
    const concaveQuad = {
      topLeft: { x: 100, y: 100 },
      topRight: { x: 800, y: 100 },
      bottomRight: { x: 200, y: 200 }, // folded inward
      bottomLeft: { x: 100, y: 800 },
    };
    assert.equal(isConvexQuad(concaveQuad), false);
  });

  test("calculateOutputDimensions computes correct dimensions and aspect ratios", () => {
    const quad = {
      topLeft: { x: 100, y: 100 },
      topRight: { x: 956, y: 100 }, // width = 856
      bottomRight: { x: 956, y: 640 }, // height = 540
      bottomLeft: { x: 100, y: 640 },
    };

    // Auto preset
    const autoDims = calculateOutputDimensions(quad, "auto");
    assert.equal(autoDims.width, 856);
    assert.equal(autoDims.height, 540);

    // CR80 ID Card preset (85.6 / 53.98 = ~1.58577)
    const cr80Dims = calculateOutputDimensions(quad, "cr80");
    assert.equal(cr80Dims.width, 856);
    assert.equal(cr80Dims.height, Math.round(856 / (85.6 / 53.98)));

    // A4 Paper preset (sqrt(2))
    const a4Dims = calculateOutputDimensions(quad, "a4");
    assert.equal(a4Dims.width, 856);
    assert.equal(a4Dims.height, Math.round(856 / Math.SQRT2));
  });

  test("computeBackwardHomography maps destination corners exactly to source quad", () => {
    const quad = {
      topLeft: { x: 50, y: 60 },
      topRight: { x: 500, y: 40 },
      bottomRight: { x: 520, y: 350 },
      bottomLeft: { x: 70, y: 340 },
    };
    const W = 400;
    const H = 300;

    const Hmat = computeBackwardHomography(quad, W, H);

    // Function to map (u, v) using Hmat
    const map = (u, v) => {
      const denom = Hmat.m20 * u + Hmat.m21 * v + 1;
      return {
        x: (Hmat.m00 * u + Hmat.m01 * v + Hmat.m02) / denom,
        y: (Hmat.m10 * u + Hmat.m11 * v + Hmat.m12) / denom,
      };
    };

    // (0, 0) should map to topLeft
    const pTL = map(0, 0);
    assert.ok(Math.abs(pTL.x - quad.topLeft.x) < 1e-4);
    assert.ok(Math.abs(pTL.y - quad.topLeft.y) < 1e-4);

    // (W, 0) should map to topRight
    const pTR = map(W, 0);
    assert.ok(Math.abs(pTR.x - quad.topRight.x) < 1e-4);
    assert.ok(Math.abs(pTR.y - quad.topRight.y) < 1e-4);

    // (W, H) should map to bottomRight
    const pBR = map(W, H);
    assert.ok(Math.abs(pBR.x - quad.bottomRight.x) < 1e-4);
    assert.ok(Math.abs(pBR.y - quad.bottomRight.y) < 1e-4);

    // (0, H) should map to bottomLeft
    const pBL = map(0, H);
    assert.ok(Math.abs(pBL.x - quad.bottomLeft.x) < 1e-4);
    assert.ok(Math.abs(pBL.y - quad.bottomLeft.y) < 1e-4);
  });

  test("warpPerspectiveBuffer warps and straightens synthetic test pattern", () => {
    // Create a 100x100 white image with a red square inside a rotated quad
    const srcW = 100;
    const srcH = 100;
    const data = new Uint8ClampedArray(srcW * srcH * 4);

    // Fill with white
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }

    // Paint a distinct blue block in the center (x: 40..60, y: 40..60)
    for (let y = 40; y <= 60; y++) {
      for (let x = 40; x <= 60; x++) {
        const idx = (y * srcW + x) * 4;
        data[idx] = 0; // R
        data[idx + 1] = 0; // G
        data[idx + 2] = 255; // B (Blue)
        data[idx + 3] = 255;
      }
    }

    const srcBuffer = { data, width: srcW, height: srcH };

    // Define quad around the blue block (x: 40..60, y: 40..60)
    const quad = {
      topLeft: { x: 40, y: 40 },
      topRight: { x: 60, y: 40 },
      bottomRight: { x: 60, y: 60 },
      bottomLeft: { x: 40, y: 60 },
    };

    const dstW = 50;
    const dstH = 50;
    const warped = warpPerspectiveBuffer(srcBuffer, quad, dstW, dstH);

    assert.equal(warped.length, dstW * dstH * 4);

    // The entire warped destination should be solid blue!
    // Check center pixel:
    const centerIdx = (25 * dstW + 25) * 4;
    assert.equal(warped[centerIdx], 0); // R
    assert.equal(warped[centerIdx + 1], 0); // G
    assert.equal(warped[centerIdx + 2], 255); // B
  });

  test("rotatePerspectiveQuad accurately rotates points clockwise by 90 deg", () => {
    const srcW = 1000;
    const srcH = 800;
    const quad = {
      topLeft: { x: 100, y: 100 },
      topRight: { x: 700, y: 150 },
      bottomRight: { x: 720, y: 550 },
      bottomLeft: { x: 120, y: 500 },
    };

    const rotated90 = rotatePerspectiveQuad(quad, 90, srcW, srcH);
    assert.ok(isConvexQuad(rotated90));

    // Full 360 rotation should return original coordinates
    const rotated360 = rotatePerspectiveQuad(quad, 360, srcW, srcH);
    assert.equal(rotated360.topLeft.x, quad.topLeft.x);
    assert.equal(rotated360.topLeft.y, quad.topLeft.y);
  });
});
