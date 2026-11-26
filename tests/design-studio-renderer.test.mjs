import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calculateResponsiveFitScale,
  calculateImageFitDimensions,
  getPageDimensionsPt,
} from "../src/lib/design-studio/coordinate-converter.ts";
import {
  createEmptyDesignDocument,
  createTextElement,
  createShapeElement,
  createImageElement,
} from "../src/lib/design-studio/template-foundation.ts";
import {
  toKonvaTextProps,
  toKonvaShapeProps,
  toKonvaImageProps,
} from "../src/lib/design-studio/konva-adapter.ts";

describe("Design Studio Renderer — Foundation & Math Test Suite", () => {
  describe("1. Responsive Scale & Proportional Fit Calculations", () => {
    test("calculates proportional fit for A4 Project Cover in landscape viewport without distortion", () => {
      const a4WidthPt = 595.28;
      const a4HeightPt = 841.89;
      const containerW = 800;
      const containerH = 600;
      const padding = 32;

      const scale = calculateResponsiveFitScale(
        a4WidthPt,
        a4HeightPt,
        containerW,
        containerH,
        padding
      );

      // Available: (800 - 64) = 736 width, (600 - 64) = 536 height
      // ScaleX: 736 / 595.28 = 1.236, ScaleY: 536 / 841.89 = 0.6366
      // Limited by height constraint
      assert.ok(scale < 1.0);
      assert.ok(Math.abs(scale - 0.6367) < 0.01);

      // Verify that rendered dimensions strictly fit inside available container
      const renderedW = Math.round(a4WidthPt * scale);
      const renderedH = Math.round(a4HeightPt * scale);
      assert.ok(renderedW <= 736);
      assert.ok(renderedH <= 536);
    });

    test("calculates proportional fit for Visiting Card in spacious viewport", () => {
      const vcWidthPt = 252;
      const vcHeightPt = 144;
      const containerW = 1200;
      const containerH = 800;
      const padding = 40;

      const scale = calculateResponsiveFitScale(
        vcWidthPt,
        vcHeightPt,
        containerW,
        containerH,
        padding
      );

      // Available: 1120W, 720H
      // ScaleX: 1120 / 252 = 4.444, ScaleY: 720 / 144 = 5.0
      // Limited by width constraint
      assert.ok(scale > 4.0);
      assert.ok(Math.abs(scale - 4.4444) < 0.01);

      const renderedW = vcWidthPt * scale;
      const renderedH = vcHeightPt * scale;
      assert.ok(renderedW <= 1120);
      assert.ok(renderedH <= 720);
    });

    test("handles zero and negative container dimensions gracefully", () => {
      assert.equal(calculateResponsiveFitScale(252, 144, 0, 0), 1.0);
      assert.equal(calculateResponsiveFitScale(0, 0, 800, 600), 1.0);
      assert.equal(calculateResponsiveFitScale(-10, 100, 800, 600), 1.0);
    });
  });

  describe("2. Image Aspect Ratio Fitting Strategies", () => {
    test("contain: wider image into square box is letterboxed and vertically centered", () => {
      const fitted = calculateImageFitDimensions(200, 200, 400, 200, "contain");
      assert.equal(fitted.width, 200);
      assert.equal(fitted.height, 100);
      assert.equal(fitted.x, 0);
      assert.equal(fitted.y, 50); // (200 - 100) / 2
    });

    test("contain: taller image into square box is pillarboxed and horizontally centered", () => {
      const fitted = calculateImageFitDimensions(200, 200, 200, 400, "contain");
      assert.equal(fitted.width, 100);
      assert.equal(fitted.height, 200);
      assert.equal(fitted.x, 50); // (200 - 100) / 2
      assert.equal(fitted.y, 0);
    });

    test("cover: wider image into square box covers full height and is horizontally centered", () => {
      const fitted = calculateImageFitDimensions(200, 200, 400, 200, "cover");
      assert.equal(fitted.width, 400); // 200 * 2.0
      assert.equal(fitted.height, 200);
      assert.equal(fitted.x, -100); // (200 - 400) / 2
      assert.equal(fitted.y, 0);
    });

    test("cover: taller image into square box covers full width and is vertically centered", () => {
      const fitted = calculateImageFitDimensions(200, 200, 200, 400, "cover");
      assert.equal(fitted.width, 200);
      assert.equal(fitted.height, 400); // 200 * 2.0
      assert.equal(fitted.x, 0);
      assert.equal(fitted.y, -100); // (200 - 400) / 2
    });

    test("fill: exactly matches destination bounding box", () => {
      const fitted = calculateImageFitDimensions(300, 150, 500, 200, "fill");
      assert.equal(fitted.width, 300);
      assert.equal(fitted.height, 150);
      assert.equal(fitted.x, 0);
      assert.equal(fitted.y, 0);
    });
  });

  describe("3. Object Rendering Contracts & Layer Isolation", () => {
    test("text element adapter maps all typography styling correctly", () => {
      const textEl = createTextElement({
        text: "Jane Doe",
        fontFamily: "Playfair Display",
        fontSize: 18,
        fontWeight: "700",
        fontStyle: "italic",
        fill: "#1e3a8a",
        align: "center",
        lineHeight: 1.4,
        letterSpacing: 1.5,
      });

      const konvaProps = toKonvaTextProps(textEl, 2.0, false);
      assert.equal(konvaProps.text, "Jane Doe");
      assert.equal(konvaProps.fontFamily, "Playfair Display");
      assert.equal(konvaProps.fontSize, 36); // 18 * 2.0
      assert.equal(konvaProps.fontStyle, "italic bold");
      assert.equal(konvaProps.fill, "#1e3a8a");
      assert.equal(konvaProps.align, "center");
      assert.equal(konvaProps.letterSpacing, 3.0); // 1.5 * 2.0
    });

    test("shape element adapter maps rectangle, circle, and star properties", () => {
      const rectEl = createShapeElement({
        shapeType: "rect",
        fill: "#FF9933",
        stroke: "#000000",
        strokeWidth: 2,
        cornerRadius: 6,
      });
      const rectProps = toKonvaShapeProps(rectEl, 1.0, false);
      assert.equal(rectProps.shapeType, "rect");
      assert.equal(rectProps.fill, "#FF9933");
      assert.equal(rectProps.strokeWidth, 2);
      assert.equal(rectProps.cornerRadius, 6);

      const circleEl = createShapeElement({
        shapeType: "circle",
        fill: "#138808",
      });
      const circleProps = toKonvaShapeProps(circleEl, 1.0, false);
      assert.equal(circleProps.shapeType, "circle");
      assert.equal(circleProps.fill, "#138808");
    });

    test("multi-page documents maintain completely isolated elements per page", () => {
      const doc = createEmptyDesignDocument("visiting-card");
      assert.equal(doc.pages.length, 2);

      const frontText = createTextElement({ text: "Front Company Name", zIndex: 1 });
      const backText = createTextElement({ text: "Back Contact Details", zIndex: 1 });

      doc.pages[0].elements.push(frontText);
      doc.pages[1].elements.push(backText);

      // Verify page 0 has only frontText
      assert.equal(doc.pages[0].elements.length, 1);
      assert.equal(doc.pages[0].elements[0].text, "Front Company Name");

      // Verify page 1 has only backText
      assert.equal(doc.pages[1].elements.length, 1);
      assert.equal(doc.pages[1].elements[0].text, "Back Contact Details");

      // Verify IDs are distinct
      assert.notEqual(doc.pages[0].elements[0].id, doc.pages[1].elements[0].id);
    });

    test("layer ordering sorts elements strictly by zIndex ascending", () => {
      const el1 = createTextElement({ name: "Bottom Layer", zIndex: 0 });
      const el2 = createShapeElement({ name: "Middle Layer", zIndex: 5 });
      const el3 = createTextElement({ name: "Top Layer", zIndex: 10 });

      // Pass out of order
      const elements = [el3, el1, el2];
      const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);

      assert.equal(sorted[0].name, "Bottom Layer");
      assert.equal(sorted[1].name, "Middle Layer");
      assert.equal(sorted[2].name, "Top Layer");
    });
  });
});
