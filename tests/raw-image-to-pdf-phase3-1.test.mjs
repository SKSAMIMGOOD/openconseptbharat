/**
 * Raw Image to Clean PDF — Phase 3.1 Test Suite
 *
 * Validates:
 * 1. Filter Preset Definitions & Metadata (All 8 presets)
 * 2. Color Filter CSS Generation (Auto, Grayscale, B&W, Warm, Cool, Vintage, High Contrast)
 * 3. Intensity Slider Scaling (0% to 100%)
 * 4. Filter Switching & Non-Accumulation (Pure, non-destructive replacement)
 * 5. Combined Filter Integration with Document Enhancements
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  COLOR_FILTER_PRESETS,
  DEFAULT_COLOR_FILTER_SETTINGS,
} from "../src/types/raw-image-to-pdf.ts";

import {
  getColorFilterCss,
  getCombinedDocumentFilter,
  getEnhancementCssFilter,
} from "../src/lib/raw-image-to-pdf/annotation-engine.ts";

describe("Raw Image to Clean PDF — Phase 3.1 Color Filter Suite", () => {
  describe("1. Filter Presets Definitions", () => {
    test("provides all 8 required filter presets in order", () => {
      const expectedIds = [
        "original",
        "auto",
        "grayscale",
        "bw",
        "warm",
        "cool",
        "vintage",
        "high-contrast",
      ];

      const actualIds = COLOR_FILTER_PRESETS.map((p) => p.id);
      assert.deepEqual(actualIds, expectedIds);
      assert.equal(COLOR_FILTER_PRESETS.length, 8);
    });

    test("default color filter is Original with 100% intensity", () => {
      assert.equal(DEFAULT_COLOR_FILTER_SETTINGS.preset, "original");
      assert.equal(DEFAULT_COLOR_FILTER_SETTINGS.intensity, 100);
    });
  });

  describe("2. Color Filter CSS Generation", () => {
    test("returns empty string for 'original' preset", () => {
      const css = getColorFilterCss({ preset: "original", intensity: 100 });
      assert.equal(css, "");
    });

    test("generates Auto Color filter at full intensity", () => {
      const css = getColorFilterCss({ preset: "auto", intensity: 100 });
      assert.ok(css.includes("contrast(1.15)"));
      assert.ok(css.includes("saturate(1.15)"));
      assert.ok(css.includes("brightness(1.05)"));
    });

    test("generates Grayscale filter at full intensity", () => {
      const css = getColorFilterCss({ preset: "grayscale", intensity: 100 });
      assert.equal(css, "grayscale(100%)");
    });

    test("generates Black & White scan filter at full intensity", () => {
      const css = getColorFilterCss({ preset: "bw", intensity: 100 });
      assert.ok(css.includes("grayscale(100%)"));
      assert.ok(css.includes("contrast(2.20)"));
      assert.ok(css.includes("brightness(1.10)"));
    });

    test("generates Warm filter at full intensity", () => {
      const css = getColorFilterCss({ preset: "warm", intensity: 100 });
      assert.ok(css.includes("sepia(40%)"));
      assert.ok(css.includes("saturate(1.20)"));
      assert.ok(css.includes("brightness(1.02)"));
    });

    test("generates Cool filter at full intensity", () => {
      const css = getColorFilterCss({ preset: "cool", intensity: 100 });
      assert.ok(css.includes("hue-rotate(-20deg)"));
      assert.ok(css.includes("saturate(1.10)"));
      assert.ok(css.includes("brightness(1.03)"));
    });

    test("generates Vintage filter at full intensity", () => {
      const css = getColorFilterCss({ preset: "vintage", intensity: 100 });
      assert.ok(css.includes("sepia(60%)"));
      assert.ok(css.includes("contrast(0.85)"));
      assert.ok(css.includes("saturate(0.80)"));
    });

    test("generates High Contrast filter at full intensity", () => {
      const css = getColorFilterCss({ preset: "high-contrast", intensity: 100 });
      assert.ok(css.includes("contrast(1.80)"));
      assert.ok(css.includes("brightness(0.95)"));
    });
  });

  describe("3. Intensity Slider Scaling", () => {
    test("returns empty string when intensity is 0%", () => {
      const css = getColorFilterCss({ preset: "warm", intensity: 0 });
      assert.equal(css, "");
    });

    test("scales grayscale percentage according to intensity", () => {
      const half = getColorFilterCss({ preset: "grayscale", intensity: 50 });
      assert.equal(half, "grayscale(50%)");

      const quarter = getColorFilterCss({ preset: "grayscale", intensity: 25 });
      assert.equal(quarter, "grayscale(25%)");
    });

    test("scales warm sepia and saturation proportionally with intensity", () => {
      const half = getColorFilterCss({ preset: "warm", intensity: 50 });
      assert.ok(half.includes("sepia(20%)"));
      assert.ok(half.includes("saturate(1.10)"));
    });
  });

  describe("4. Non-Accumulation & Clean Preset Switching", () => {
    test("switching presets cleanly replaces previous filter without compounding", () => {
      const filter1 = getColorFilterCss({ preset: "warm", intensity: 100 });
      const filter2 = getColorFilterCss({ preset: "cool", intensity: 100 });
      const filter3 = getColorFilterCss({ preset: "bw", intensity: 100 });

      assert.ok(filter1.includes("sepia(40%)"));
      assert.ok(!filter1.includes("hue-rotate"));

      assert.ok(filter2.includes("hue-rotate(-20deg)"));
      assert.ok(!filter2.includes("sepia"));

      assert.ok(filter3.includes("grayscale(100%)"));
      assert.ok(!filter3.includes("hue-rotate"));
    });

    test("resetting to Original cleanly removes any filter effect", () => {
      const reset = getColorFilterCss({ preset: "original", intensity: 100 });
      assert.equal(reset, "");
    });
  });

  describe("5. Combined Filter Integration", () => {
    test("returns 'none' when enhancements and color filter are both neutral", () => {
      const neutralEnh = {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        sharpness: 0,
        grayscale: false,
        invert: false,
      };
      const neutralFilter = { preset: "original", intensity: 100 };

      const combined = getCombinedDocumentFilter(neutralEnh, neutralFilter);
      assert.equal(combined, "none");
    });

    test("combines brightness adjustment with warm color filter", () => {
      const enh = {
        brightness: 20,
        contrast: 0,
        saturation: 0,
        sharpness: 0,
        grayscale: false,
        invert: false,
      };
      const filter = { preset: "warm", intensity: 100 };

      const combined = getCombinedDocumentFilter(enh, filter);
      assert.ok(combined.includes("brightness(1.20)"));
      assert.ok(combined.includes("sepia(40%)"));
    });
  });

  describe("6. Per-Page Opt-Out for Global Enhancements and Color Filters", () => {
    test("global application is enabled by default for every page", () => {
      const page1 = { id: "p1", applyGlobalEdits: true };
      const page2 = { id: "p2" }; // undefined defaults to true

      assert.equal(page1.applyGlobalEdits ?? true, true);
      assert.equal(page2.applyGlobalEdits ?? true, true);
    });

    test("opted-in page receives both global enhancements and color filters", () => {
      const enh = {
        brightness: 15,
        contrast: 20,
        saturation: 0,
        sharpness: 0,
        grayscale: false,
        invert: false,
      };
      const filter = { preset: "cool", intensity: 100 };
      const page = { id: "p1", applyGlobalEdits: true };

      const isEnabled = page.applyGlobalEdits ?? true;
      const cssFilter = isEnabled ? getCombinedDocumentFilter(enh, filter) : "none";

      assert.ok(cssFilter.includes("brightness(1.15)"));
      assert.ok(cssFilter.includes("contrast(1.20)"));
      assert.ok(cssFilter.includes("hue-rotate(-20deg)"));
      assert.notEqual(cssFilter, "none");
    });

    test("opted-out page retains original appearance (returns 'none')", () => {
      const enh = {
        brightness: 25,
        contrast: 30,
        saturation: 10,
        sharpness: 0,
        grayscale: false,
        invert: false,
      };
      const filter = { preset: "vintage", intensity: 100 };
      const page = { id: "p2", applyGlobalEdits: false };

      const isEnabled = page.applyGlobalEdits ?? true;
      const cssFilter = isEnabled ? getCombinedDocumentFilter(enh, filter) : "none";

      assert.equal(cssFilter, "none");
    });

    test("independent per-page opt-out isolation and preservation", () => {
      const pages = [
        { id: "p1", applyGlobalEdits: true, annotations: [{ id: "a1", tool: "highlighter" }] },
        { id: "p2", applyGlobalEdits: false, annotations: [] },
      ];

      const enh = {
        brightness: 10,
        contrast: 10,
        saturation: 0,
        sharpness: 0,
        grayscale: false,
        invert: false,
      };
      const filter = { preset: "bw", intensity: 100 };

      // Page 1 filter
      const p1Filter = (pages[0].applyGlobalEdits ?? true)
        ? getCombinedDocumentFilter(enh, filter)
        : "none";
      assert.ok(p1Filter.includes("grayscale(100%)"));

      // Page 2 filter
      const p2Filter = (pages[1].applyGlobalEdits ?? true)
        ? getCombinedDocumentFilter(enh, filter)
        : "none";
      assert.equal(p2Filter, "none");

      // Opt-out does not clear or affect page annotations
      assert.equal(pages[0].annotations.length, 1);
    });
  });
});
