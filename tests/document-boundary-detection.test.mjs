/**
 * Test Suite: Document Straightener — Perspective Boundary Detector
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  detectDocumentCorners,
} from "../src/lib/document/perspective-detector.ts";

describe("Perspective Boundary Detector — Synthetic Tests", () => {
  test("detects high-contrast tilted document quad on uniform background", () => {
    // 300x200 image with light background (240, 240, 240)
    // and a blue document rectangle in the center (x: 50..250, y: 40..160)
    const W = 300;
    const H = 200;
    const data = new Uint8ClampedArray(W * H * 4);

    // Fill with light gray background
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 240;
      data[i + 1] = 240;
      data[i + 2] = 240;
      data[i + 3] = 245;
    }

    // Paint a distinct blue document (50, 40) to (250, 160)
    for (let y = 40; y <= 160; y++) {
      for (let x = 50; x <= 250; x++) {
        const idx = (y * W + x) << 2;
        data[idx] = 30;
        data[idx + 1] = 120;
        data[idx + 2] = 220;
        data[idx + 3] = 255;
      }
    }

    const buffer = { data, width: W, height: H };
    const result = detectDocumentCorners(buffer, 3000, 2000);

    assert.equal(result.detected, true);
    assert.ok(result.confidence > 0.6);
    // Scaled to native resolution: 50 * 10 = 500, 40 * 10 = 400
    assert.ok(Math.abs(result.quad.topLeft.x - 500) < 50);
    assert.ok(Math.abs(result.quad.topLeft.y - 400) < 50);
    assert.ok(Math.abs(result.quad.bottomRight.x - 2500) < 50);
    assert.ok(Math.abs(result.quad.bottomRight.y - 1600) < 50);
  });

  test("honestly reports fallback when image has zero contrast (uniform white sheet)", () => {
    const W = 100;
    const H = 100;
    const data = new Uint8ClampedArray(W * H * 4);
    // Solid white everywhere
    data.fill(255);

    const buffer = { data, width: W, height: H };
    const result = detectDocumentCorners(buffer, 1000, 1000);

    assert.equal(result.detected, false);
    assert.ok(result.message.includes("contrast") || result.message.includes("Manual"));
    // Falls back to safe 10% default quad
    assert.equal(result.quad.topLeft.x, 100);
    assert.equal(result.quad.topLeft.y, 100);
    assert.equal(result.quad.bottomRight.x, 900);
    assert.equal(result.quad.bottomRight.y, 900);
  });
});
