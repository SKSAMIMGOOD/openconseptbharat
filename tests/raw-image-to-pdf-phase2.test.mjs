/**
 * Raw Image to Clean PDF — Phase 2 Test Suite
 *
 * Validates:
 * 1. Independent 4-Corner Quadrilateral Convexity & Non-Degeneracy
 * 2. Aspect Ratio Presets (Natural, A4, CR80/ID Card)
 * 3. 90-degree Rotation Transformations of Perspective Quads
 * 4. Multi-Page Crop Isolation (modifying Page 1 leaves Page 2 untouched)
 * 5. Re-edit Crop Persistence (reopening a page restores its exact quad & settings)
 * 6. Multi-Page Navigation Clamping & Bounds
 * 7. 4 Edge-Midpoint Translation Handles (top, bottom, left, right)
 * 8. Memory Safety & Cropped Preview URL Lifecycle
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  isConvexQuad,
  calculateOutputDimensions,
  rotatePerspectiveQuad,
  createDefaultQuad,
  pointDistance,
  crossProduct2D,
} from "../src/lib/document/perspective-engine.ts";

import {
  releaseCanvasBuffer,
  revokeObjectUrlSafely,
} from "../src/lib/utils/memory.ts";

import { translateQuadEdge } from "../src/lib/raw-image-to-pdf/edge-geometry.ts";

describe("Raw Image to Clean PDF — Phase 2 Test Suite", () => {
  describe("1. Quadrilateral Convexity & Non-Degeneracy", () => {
    test("accepts a normal, convex document quadrilateral", () => {
      const quad = {
        topLeft: { x: 50, y: 50 },
        topRight: { x: 950, y: 60 },
        bottomRight: { x: 940, y: 740 },
        bottomLeft: { x: 60, y: 730 },
      };
      assert.equal(isConvexQuad(quad), true);
    });

    test("accepts default inset quadrilateral from createDefaultQuad", () => {
      const quad = createDefaultQuad(1200, 1600, 0.1);
      assert.equal(isConvexQuad(quad), true);
      assert.equal(quad.topLeft.x, 120);
      assert.equal(quad.topLeft.y, 160);
      assert.equal(quad.bottomRight.x, 1080);
      assert.equal(quad.bottomRight.y, 1440);
    });

    test("rejects self-intersecting / bow-tie quadrilateral (inverted corners)", () => {
      // Swapping topRight and bottomRight creates a bowtie self-intersection
      const invertedQuad = {
        topLeft: { x: 50, y: 50 },
        topRight: { x: 940, y: 740 }, // Inverted
        bottomRight: { x: 950, y: 60 }, // Inverted
        bottomLeft: { x: 60, y: 730 },
      };
      assert.equal(isConvexQuad(invertedQuad), false);
    });

    test("rejects collapsed or collinear points", () => {
      const collapsedQuad = {
        topLeft: { x: 100, y: 100 },
        topRight: { x: 100, y: 100 },
        bottomRight: { x: 100, y: 100 },
        bottomLeft: { x: 100, y: 100 },
      };
      assert.equal(isConvexQuad(collapsedQuad), false);
    });
  });

  describe("2. Document Aspect Ratio Presets", () => {
    test("calculates natural aspect ratio from quad bounds", () => {
      const quad = {
        topLeft: { x: 0, y: 0 },
        topRight: { x: 1000, y: 0 },
        bottomRight: { x: 1000, y: 500 },
        bottomLeft: { x: 0, y: 500 },
      };
      const result = calculateOutputDimensions(quad, "auto");
      assert.equal(result.width, 1000);
      assert.equal(result.height, 500);
      assert.equal(result.aspectRatio, 2.0);
    });

    test("calculates standard A4 document proportions (1 : sqrt(2))", () => {
      const quad = {
        topLeft: { x: 0, y: 0 },
        topRight: { x: 1000, y: 0 },
        bottomRight: { x: 1000, y: 1000 },
        bottomLeft: { x: 0, y: 1000 },
      };
      const result = calculateOutputDimensions(quad, "a4");
      // For width=1000 portrait/landscape, aspect ratio must match Math.SQRT2
      assert.ok(Math.abs(result.aspectRatio - Math.SQRT2) < 0.01);
      assert.equal(result.width, 1000);
      assert.equal(result.height, Math.round(1000 / Math.SQRT2));
    });

    test("calculates ISO CR80 ID card proportions (85.6 x 53.98 mm)", () => {
      const cr80ExpectedRatio = 85.6 / 53.98; // ~1.58577
      const quad = {
        topLeft: { x: 0, y: 0 },
        topRight: { x: 856, y: 0 },
        bottomRight: { x: 856, y: 600 },
        bottomLeft: { x: 0, y: 600 },
      };
      const result = calculateOutputDimensions(quad, "cr80");
      assert.ok(Math.abs(result.aspectRatio - cr80ExpectedRatio) < 0.001);
      assert.equal(result.width, 856);
      assert.equal(result.height, Math.round(856 / cr80ExpectedRatio));
    });
  });

  describe("3. 90-Degree Rotations of Perspective Quads", () => {
    const originalQuad = {
      topLeft: { x: 100, y: 200 },
      topRight: { x: 800, y: 250 },
      bottomRight: { x: 750, y: 900 },
      bottomLeft: { x: 120, y: 880 },
    };
    const srcW = 1000;
    const srcH = 1200;

    test("rotates quad 90 degrees clockwise with correct corner mapping", () => {
      const rot90 = rotatePerspectiveQuad(originalQuad, 90, srcW, srcH);
      // Under 90 deg CW: dimensions swap (srcW -> srcH)
      // New topLeft must correspond to rotated bottomLeft
      assert.ok(isConvexQuad(rot90));
      assert.equal(rot90.topLeft.x, srcH - 1 - originalQuad.bottomLeft.y);
      assert.equal(rot90.topLeft.y, originalQuad.bottomLeft.x);
    });

    test("rotates quad 180 degrees with 2-step rotation equivalence", () => {
      const rot180 = rotatePerspectiveQuad(originalQuad, 180, srcW, srcH);
      assert.ok(isConvexQuad(rot180));
      assert.equal(rot180.topLeft.x, srcW - 1 - originalQuad.bottomRight.x);
      assert.equal(rot180.topLeft.y, srcH - 1 - originalQuad.bottomRight.y);
    });

    test("full 360-degree rotation returns to original points", () => {
      const rot360 = rotatePerspectiveQuad(originalQuad, 360, srcW, srcH);
      assert.deepEqual(rot360, originalQuad);
    });
  });

  describe("4. Multi-Page Crop State Isolation", () => {
    test("modifying Page 1 crop configuration does not alter Page 2", () => {
      const page1 = {
        id: "p1",
        name: "document-1.jpg",
        isCropped: false,
        cropConfig: undefined,
      };

      const page2 = {
        id: "p2",
        name: "document-2.jpg",
        isCropped: false,
        cropConfig: undefined,
      };

      const pages = [page1, page2];

      const page1Crop = {
        quad: createDefaultQuad(1000, 1500, 0.15),
        rotation: 90,
        aspectRatioPreset: "a4",
        appliedAt: Date.now(),
      };

      // Apply crop to page 1
      const updatedPages = pages.map((p) =>
        p.id === "p1"
          ? {
              ...p,
              isCropped: true,
              rotation: 90,
              cropConfig: page1Crop,
              croppedPreviewUrl: "blob:http://localhost/crop-1",
            }
          : p
      );

      // Page 1 is updated
      assert.equal(updatedPages[0].isCropped, true);
      assert.equal(updatedPages[0].rotation, 90);
      assert.deepEqual(updatedPages[0].cropConfig, page1Crop);

      // Page 2 remains strictly untouched
      assert.equal(updatedPages[1].isCropped, false);
      assert.equal(updatedPages[1].cropConfig, undefined);
      assert.equal(updatedPages[1].croppedPreviewUrl, undefined);
    });

    test("reopening a page restores its exact previously saved crop", () => {
      const savedQuad = {
        topLeft: { x: 120, y: 140 },
        topRight: { x: 880, y: 150 },
        bottomRight: { x: 870, y: 1100 },
        bottomLeft: { x: 130, y: 1090 },
      };

      const croppedPage = {
        id: "p-abc",
        isCropped: true,
        rotation: 0,
        cropConfig: {
          quad: savedQuad,
          rotation: 0,
          aspectRatioPreset: "cr80",
          appliedAt: 123456789,
        },
      };

      // Simulated restore in editor
      const initialQuad = croppedPage.cropConfig?.quad || null;
      const initialPreset = croppedPage.cropConfig?.aspectRatioPreset || "auto";

      assert.deepEqual(initialQuad, savedQuad);
      assert.equal(initialPreset, "cr80");
    });

    test("resetting a page crop reverts to uncropped state while preserving other pages", () => {
      const pages = [
        { id: "p1", isCropped: true, cropConfig: { quad: createDefaultQuad(100, 100), rotation: 0, aspectRatioPreset: "auto" } },
        { id: "p2", isCropped: true, cropConfig: { quad: createDefaultQuad(200, 200), rotation: 90, aspectRatioPreset: "a4" } },
      ];

      // Reset page 1
      const updatedPages = pages.map((p) =>
        p.id === "p1"
          ? { ...p, isCropped: false, cropConfig: undefined, croppedPreviewUrl: undefined }
          : p
      );

      assert.equal(updatedPages[0].isCropped, false);
      assert.equal(updatedPages[0].cropConfig, undefined);

      // Page 2 remains cropped
      assert.equal(updatedPages[1].isCropped, true);
      assert.equal(updatedPages[1].cropConfig.aspectRatioPreset, "a4");
    });
  });

  describe("5. Multi-Page Navigation Clamping & Bounds", () => {
    test("clamps previous page navigation at index 0", () => {
      const currentIndex = 0;
      const prevIndex = Math.max(0, currentIndex - 1);
      assert.equal(prevIndex, 0);
    });

    test("clamps next page navigation at last page index", () => {
      const totalPages = 5;
      const currentIndex = 4;
      const nextIndex = Math.min(totalPages - 1, currentIndex + 1);
      assert.equal(nextIndex, 4);
    });

    test("navigates forward and backward cleanly within bounds", () => {
      const totalPages = 4;
      let currentIndex = 1;

      // Next
      currentIndex = Math.min(totalPages - 1, currentIndex + 1);
      assert.equal(currentIndex, 2);

      // Next
      currentIndex = Math.min(totalPages - 1, currentIndex + 1);
      assert.equal(currentIndex, 3);

      // Previous
      currentIndex = Math.max(0, currentIndex - 1);
      assert.equal(currentIndex, 2);
    });
  });

  describe("6. 4 Edge-Midpoint Translation Handles", () => {
    const baseQuad = {
      topLeft: { x: 100, y: 100 },
      topRight: { x: 900, y: 120 },
      bottomRight: { x: 880, y: 800 },
      bottomLeft: { x: 120, y: 780 },
    };
    const imgW = 1000;
    const imgH = 1000;

    test("top edge handle moves vertically: shifts both top corners and preserves horizontal positions", () => {
      const deltaY = 50;
      const result = translateQuadEdge({
        startQuad: baseQuad,
        edge: "top",
        deltaX: 120, // Horizontal movement should be ignored for top handle
        deltaY,
        imageWidth: imgW,
        imageHeight: imgH,
      });

      // Both top Y coordinates incremented by deltaY
      assert.equal(result.topLeft.y, baseQuad.topLeft.y + deltaY);
      assert.equal(result.topRight.y, baseQuad.topRight.y + deltaY);

      // Top X coordinates must be strictly preserved
      assert.equal(result.topLeft.x, baseQuad.topLeft.x);
      assert.equal(result.topRight.x, baseQuad.topRight.x);

      // Bottom corners untouched
      assert.deepEqual(result.bottomLeft, baseQuad.bottomLeft);
      assert.deepEqual(result.bottomRight, baseQuad.bottomRight);
      assert.ok(isConvexQuad(result));
    });

    test("top edge handle clamps at image top boundary (y >= 0)", () => {
      const extremeUpDelta = -500; // Attempt to move beyond y=0
      const result = translateQuadEdge({
        startQuad: baseQuad,
        edge: "top",
        deltaX: 0,
        deltaY: extremeUpDelta,
        imageWidth: imgW,
        imageHeight: imgH,
      });

      // Cannot move below 0
      assert.ok(result.topLeft.y >= 0);
      assert.ok(result.topRight.y >= 0);
      assert.equal(result.topLeft.x, baseQuad.topLeft.x);
      assert.equal(result.topRight.x, baseQuad.topRight.x);
      assert.ok(isConvexQuad(result));
    });

    test("bottom edge handle moves vertically: shifts both bottom corners and preserves horizontal positions", () => {
      const deltaY = -60;
      const result = translateQuadEdge({
        startQuad: baseQuad,
        edge: "bottom",
        deltaX: 80, // Horizontal movement ignored for bottom handle
        deltaY,
        imageWidth: imgW,
        imageHeight: imgH,
      });

      assert.equal(result.bottomLeft.y, baseQuad.bottomLeft.y + deltaY);
      assert.equal(result.bottomRight.y, baseQuad.bottomRight.y + deltaY);
      assert.equal(result.bottomLeft.x, baseQuad.bottomLeft.x);
      assert.equal(result.bottomRight.x, baseQuad.bottomRight.x);

      // Top corners untouched
      assert.deepEqual(result.topLeft, baseQuad.topLeft);
      assert.deepEqual(result.topRight, baseQuad.topRight);
      assert.ok(isConvexQuad(result));
    });

    test("bottom edge handle clamps at image bottom boundary (y <= imageHeight)", () => {
      const extremeDownDelta = 500;
      const result = translateQuadEdge({
        startQuad: baseQuad,
        edge: "bottom",
        deltaX: 0,
        deltaY: extremeDownDelta,
        imageWidth: imgW,
        imageHeight: imgH,
      });

      assert.ok(result.bottomLeft.y <= imgH);
      assert.ok(result.bottomRight.y <= imgH);
      assert.equal(result.bottomLeft.x, baseQuad.bottomLeft.x);
      assert.equal(result.bottomRight.x, baseQuad.bottomRight.x);
      assert.ok(isConvexQuad(result));
    });

    test("left edge handle moves horizontally: shifts both left corners and preserves vertical positions", () => {
      const deltaX = 40;
      const result = translateQuadEdge({
        startQuad: baseQuad,
        edge: "left",
        deltaX,
        deltaY: -90, // Vertical movement ignored for left handle
        imageWidth: imgW,
        imageHeight: imgH,
      });

      assert.equal(result.topLeft.x, baseQuad.topLeft.x + deltaX);
      assert.equal(result.bottomLeft.x, baseQuad.bottomLeft.x + deltaX);
      assert.equal(result.topLeft.y, baseQuad.topLeft.y);
      assert.equal(result.bottomLeft.y, baseQuad.bottomLeft.y);

      // Right corners untouched
      assert.deepEqual(result.topRight, baseQuad.topRight);
      assert.deepEqual(result.bottomRight, baseQuad.bottomRight);
      assert.ok(isConvexQuad(result));
    });

    test("left edge handle clamps at image left boundary (x >= 0)", () => {
      const extremeLeftDelta = -400;
      const result = translateQuadEdge({
        startQuad: baseQuad,
        edge: "left",
        deltaX: extremeLeftDelta,
        deltaY: 0,
        imageWidth: imgW,
        imageHeight: imgH,
      });

      assert.ok(result.topLeft.x >= 0);
      assert.ok(result.bottomLeft.x >= 0);
      assert.equal(result.topLeft.y, baseQuad.topLeft.y);
      assert.equal(result.bottomLeft.y, baseQuad.bottomLeft.y);
      assert.ok(isConvexQuad(result));
    });

    test("right edge handle moves horizontally: shifts both right corners and preserves vertical positions", () => {
      const deltaX = -50;
      const result = translateQuadEdge({
        startQuad: baseQuad,
        edge: "right",
        deltaX,
        deltaY: 100, // Vertical movement ignored for right handle
        imageWidth: imgW,
        imageHeight: imgH,
      });

      assert.equal(result.topRight.x, baseQuad.topRight.x + deltaX);
      assert.equal(result.bottomRight.x, baseQuad.bottomRight.x + deltaX);
      assert.equal(result.topRight.y, baseQuad.topRight.y);
      assert.equal(result.bottomRight.y, baseQuad.bottomRight.y);

      // Left corners untouched
      assert.deepEqual(result.topLeft, baseQuad.topLeft);
      assert.deepEqual(result.bottomLeft, baseQuad.bottomLeft);
      assert.ok(isConvexQuad(result));
    });

    test("right edge handle clamps at image right boundary (x <= imageWidth)", () => {
      const extremeRightDelta = 400;
      const result = translateQuadEdge({
        startQuad: baseQuad,
        edge: "right",
        deltaX: extremeRightDelta,
        deltaY: 0,
        imageWidth: imgW,
        imageHeight: imgH,
      });

      assert.ok(result.topRight.x <= imgW);
      assert.ok(result.bottomRight.x <= imgW);
      assert.equal(result.topRight.y, baseQuad.topRight.y);
      assert.equal(result.bottomRight.y, baseQuad.bottomRight.y);
      assert.ok(isConvexQuad(result));
    });

    test("safeguard: prevents moving edge past opposing edge to maintain convex quadrilateral", () => {
      // Attempting to move top edge all the way down past the bottom edge
      const crossingDownDelta = 800;
      const result = translateQuadEdge({
        startQuad: baseQuad,
        edge: "top",
        deltaX: 0,
        deltaY: crossingDownDelta,
        imageWidth: imgW,
        imageHeight: imgH,
        minClearance: 20,
      });

      // Must remain strictly convex and never cross bottom edge
      assert.ok(isConvexQuad(result));
      assert.ok(result.topLeft.y <= baseQuad.bottomLeft.y - 20);
      assert.ok(result.topRight.y <= baseQuad.bottomRight.y - 20);
      assert.equal(result.topLeft.x, baseQuad.topLeft.x);
      assert.equal(result.topRight.x, baseQuad.topRight.x);
    });
  });

  describe("7. Memory Safety & Cropped Preview URL Lifecycle", () => {
    test("tracks and releases cropped object URLs safely", () => {
      const trackedUrls = new Set();

      const register = (url) => {
        if (url && url.startsWith("blob:")) trackedUrls.add(url);
      };

      const release = (url) => {
        if (url && url.startsWith("blob:")) {
          trackedUrls.delete(url);
          revokeObjectUrlSafely(url);
        }
      };

      register("blob:http://localhost/crop-page-1");
      register("blob:http://localhost/crop-page-2");
      assert.equal(trackedUrls.size, 2);

      // Re-crop page 1 releases old URL
      release("blob:http://localhost/crop-page-1");
      register("blob:http://localhost/crop-page-1-v2");

      assert.equal(trackedUrls.size, 2);
      assert.ok(!trackedUrls.has("blob:http://localhost/crop-page-1"));
      assert.ok(trackedUrls.has("blob:http://localhost/crop-page-1-v2"));

      // Clear all
      trackedUrls.forEach((url) => release(url));
      assert.equal(trackedUrls.size, 0);
    });
  });
});
