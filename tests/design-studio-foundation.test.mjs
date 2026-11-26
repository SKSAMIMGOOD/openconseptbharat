import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  MM_PER_INCH,
  POINTS_PER_INCH,
  mmToPoints,
  pointsToMm,
  mmToPixels,
  VISITING_CARD_PRESETS,
  WEDDING_CARD_PRESETS,
  PROJECT_COVER_PRESETS,
  ID_CARD_PRESETS,
  ALL_DESIGN_DIMENSION_PRESETS,
  getDefaultDimensionsForCategory,
  getDimensionPresetsByCategory,
} from "../src/constants/design-dimensions.ts";
import {
  DESIGN_CATEGORIES,
  getDesignCategoryConfig,
} from "../src/constants/design-categories.ts";
import {
  getPageDimensionsPt,
  calculateViewportMetrics,
  calculatePrintExportMetrics,
  calculateBleedAndSafeZone,
} from "../src/lib/design-studio/coordinate-converter.ts";
import {
  createEmptyDesignDocument,
  createTextElement,
  createShapeElement,
  createImageElement,
  validateDesignDocument,
  cloneDesignDocument,
} from "../src/lib/design-studio/template-foundation.ts";
import {
  toKonvaTextProps,
  toKonvaShapeProps,
  toKonvaImageProps,
  extractTransformFromKonvaState,
} from "../src/lib/design-studio/konva-adapter.ts";
import { InMemoryAssetManager } from "../src/lib/design-studio/asset-manager.ts";

describe("Design Studio Foundation — Unit & Contract Tests", () => {
  describe("1. Dimension & Conversion Mathematics", () => {
    test("converts exact mm to PostScript points (72 pt / inch)", () => {
      assert.equal(mmToPoints(25.4), 72);
      assert.equal(pointsToMm(72), 25.4);
      assert.equal(mmToPixels(25.4, 300), 300);
      assert.equal(mmToPixels(25.4, 600), 600);
    });

    test("verifies standard Visiting Card dimensions (3.5 × 2 inches)", () => {
      const standard = VISITING_CARD_PRESETS.find((p) => p.isStandardDefault);
      assert.ok(standard);
      assert.equal(standard.widthMm, 88.9);
      assert.equal(standard.heightMm, 50.8);
      assert.equal(mmToPoints(standard.widthMm), 252);
      assert.equal(mmToPoints(standard.heightMm), 144);
    });

    test("verifies ISO/IEC 7810 ID-1 CR80 ID Card dimensions", () => {
      const cr80 = ID_CARD_PRESETS.find((p) => p.id === "id-card-cr80-horizontal");
      assert.ok(cr80);
      assert.equal(cr80.widthMm, 85.6);
      assert.equal(cr80.heightMm, 53.98);
      const widthPt = mmToPoints(cr80.widthMm);
      const heightPt = mmToPoints(cr80.heightMm);
      assert.ok(Math.abs(widthPt - 242.6457) < 0.01);
      assert.ok(Math.abs(heightPt - 153.0142) < 0.01);
    });

    test("verifies Academic Project Cover ISO A4 dimensions", () => {
      const a4 = PROJECT_COVER_PRESETS.find((p) => p.id === "project-cover-a4");
      assert.ok(a4);
      assert.equal(a4.widthMm, 210.0);
      assert.equal(a4.heightMm, 297.0);
      assert.ok(Math.abs(mmToPoints(a4.widthMm) - 595.2756) < 0.01);
      assert.ok(Math.abs(mmToPoints(a4.heightMm) - 841.8898) < 0.01);
    });

    test("verifies Royal Wedding Card 5x7 inch dimensions", () => {
      const royal = WEDDING_CARD_PRESETS.find((p) => p.id === "wedding-card-5x7");
      assert.ok(royal);
      assert.equal(royal.widthMm, 127.0);
      assert.equal(royal.heightMm, 177.8);
      assert.equal(mmToPoints(royal.widthMm), 360);
      assert.equal(mmToPoints(royal.heightMm), 504);
    });
  });

  describe("2. Category Configuration & Discovery", () => {
    test("contains all 4 required design categories", () => {
      const categories = DESIGN_CATEGORIES.map((c) => c.id);
      assert.deepEqual(categories, [
        "visiting-card",
        "wedding-card",
        "project-cover",
        "id-card",
      ]);
    });

    test("each category has valid metadata and presets", () => {
      for (const cat of DESIGN_CATEGORIES) {
        assert.ok(cat.name);
        assert.ok(cat.tagline);
        assert.ok(cat.description);
        assert.ok(cat.iconName);
        assert.ok(cat.features.length >= 3);

        const presets = getDimensionPresetsByCategory(cat.id);
        assert.ok(presets.length >= 1, `Category ${cat.id} must have at least one dimension preset`);

        const defaultDims = getDefaultDimensionsForCategory(cat.id);
        assert.ok(defaultDims.widthMm > 0);
        assert.ok(defaultDims.heightMm > 0);
        assert.ok(defaultDims.targetDpi >= 300);
      }
    });

    test("Visiting Card and ID Card support dual-side workflow by default", () => {
      const vc = getDesignCategoryConfig("visiting-card");
      assert.equal(vc.supportsDualSide, true);
      assert.equal(vc.defaultPageCount, 2);
      assert.deepEqual(vc.defaultPageNames, ["Front Side", "Back Side"]);

      const id = getDesignCategoryConfig("id-card");
      assert.equal(id.supportsDualSide, true);
      assert.equal(id.defaultPageCount, 2);
    });

    test("Project Cover defaults to single-page A4 format", () => {
      const pc = getDesignCategoryConfig("project-cover");
      assert.equal(pc.supportsDualSide, false);
      assert.equal(pc.defaultPageCount, 1);
      assert.equal(pc.defaultOrientation, "portrait");
    });
  });

  describe("3. Coordinate Converter & Print Calculations", () => {
    test("calculates landscape vs portrait point dimensions correctly", () => {
      const dims = {
        widthMm: 88.9,
        heightMm: 50.8,
        bleedMm: 2.0,
        safeMarginMm: 3.5,
        targetDpi: 300,
      };

      const landscape = getPageDimensionsPt(dims, "landscape");
      assert.equal(landscape.widthPt, 252);
      assert.equal(landscape.heightPt, 144);

      const portrait = getPageDimensionsPt(dims, "portrait");
      assert.equal(portrait.widthPt, 144);
      assert.equal(portrait.heightPt, 252);
    });

    test("computes master export metrics at 300 DPI without distortion", () => {
      const dims = {
        widthMm: 88.9,
        heightMm: 50.8,
        bleedMm: 2.0,
        safeMarginMm: 3.5,
        targetDpi: 300,
      };

      const exportMetrics = calculatePrintExportMetrics(dims, "landscape", 300);
      assert.equal(exportMetrics.exportWidthPx, 1050); // (88.9 / 25.4) * 300 = 1050
      assert.equal(exportMetrics.exportHeightPx, 600);  // (50.8 / 25.4) * 300 = 600
      assert.equal(exportMetrics.pixelRatio, 300 / 72);
    });

    test("computes bleed margins and safe zone bounds", () => {
      const dims = {
        widthMm: 88.9,
        heightMm: 50.8,
        bleedMm: 2.0,
        safeMarginMm: 3.5,
        targetDpi: 300,
      };

      const guides = calculateBleedAndSafeZone(dims, "landscape");
      assert.equal(guides.trimRectPt.x, 0);
      assert.equal(guides.trimRectPt.y, 0);
      assert.equal(guides.trimRectPt.width, 252);
      assert.equal(guides.trimRectPt.height, 144);

      // Bleed expands outwards by mmToPoints(2mm) = ~5.6693 pt
      assert.ok(guides.bleedRectPt.x < 0);
      assert.ok(guides.bleedRectPt.width > 252);

      // Safe zone contracts inwards by mmToPoints(3.5mm) = ~9.9213 pt
      assert.ok(guides.safeRectPt.x > 0);
      assert.ok(guides.safeRectPt.width < 252);
    });
  });

  describe("4. Template Foundation & Document Factory", () => {
    test("instantiates a valid empty document for visiting-card", () => {
      const doc = createEmptyDesignDocument("visiting-card");
      assert.equal(doc.schemaVersion, "1.0.0");
      assert.equal(doc.category, "visiting-card");
      assert.equal(doc.orientation, "landscape");
      assert.equal(doc.pages.length, 2);
      assert.equal(doc.pages[0].name, "Front Side");
      assert.equal(doc.pages[1].name, "Back Side");

      const validation = validateDesignDocument(doc);
      assert.equal(validation.isValid, true);
      assert.equal(validation.errors.length, 0);
    });

    test("instantiates a valid empty document for project-cover", () => {
      const doc = createEmptyDesignDocument("project-cover");
      assert.equal(doc.schemaVersion, "1.0.0");
      assert.equal(doc.category, "project-cover");
      assert.equal(doc.orientation, "portrait");
      assert.equal(doc.pages.length, 1);
      assert.equal(doc.pages[0].name, "Front Cover");

      const validation = validateDesignDocument(doc);
      assert.equal(validation.isValid, true);
    });

    test("element factory generates typed elements with valid defaults", () => {
      const textEl = createTextElement({ text: "OpenConsept Bharat", fontSize: 24 });
      assert.equal(textEl.type, "text");
      assert.equal(textEl.text, "OpenConsept Bharat");
      assert.equal(textEl.fontSize, 24);

      const shapeEl = createShapeElement({ shapeType: "rect", fill: "#FF9933" });
      assert.equal(shapeEl.type, "shape");
      assert.equal(shapeEl.shapeType, "rect");
      assert.equal(shapeEl.fill, "#FF9933");

      const imgEl = createImageElement("mock-asset-id", { fit: "cover" });
      assert.equal(imgEl.type, "image");
      assert.equal(imgEl.assetId, "mock-asset-id");
      assert.equal(imgEl.fit, "cover");
    });

    test("cloning preserves complete document deep equality without reference sharing", () => {
      const original = createEmptyDesignDocument("id-card");
      original.pages[0].elements.push(createTextElement({ text: "Employee Name" }));

      const cloned = cloneDesignDocument(original);
      assert.deepEqual(cloned, original);

      // Mutate clone and assert original is untouched
      cloned.pages[0].elements[0].name = "Mutated Name";
      assert.notEqual(cloned.pages[0].elements[0].name, original.pages[0].elements[0].name);
    });
  });

  describe("5. Konva Adapter Isolation", () => {
    test("translates TextDesignElement into Konva props with fontStyle mapping", () => {
      const element = createTextElement({
        text: "Title Text",
        fontWeight: "bold",
        fontStyle: "italic",
        fontSize: 20,
        fill: "#1e3a8a",
      });

      const konvaProps = toKonvaTextProps(element, 1.0, true);
      assert.equal(konvaProps.text, "Title Text");
      assert.equal(konvaProps.fontStyle, "italic bold");
      assert.equal(konvaProps.fontSize, 20);
      assert.equal(konvaProps.fill, "#1e3a8a");
      assert.equal(konvaProps.draggable, true);
    });

    test("translates ShapeDesignElement into Konva props with dashed strokes", () => {
      const shape = createShapeElement({
        shapeType: "rect",
        stroke: "#000000",
        strokeWidth: 2,
        strokeDashArray: [4, 4],
        cornerRadius: 8,
      });

      const konvaProps = toKonvaShapeProps(shape, 1.5, true);
      assert.equal(konvaProps.shapeType, "rect");
      assert.equal(konvaProps.strokeWidth, 3); // 2 * 1.5
      assert.deepEqual(konvaProps.dash, [6, 6]); // [4, 4] * 1.5
      assert.equal(konvaProps.cornerRadius, 12); // 8 * 1.5
    });

    test("extractTransformFromKonvaState maps transformed bounds back into schema points", () => {
      const transform = extractTransformFromKonvaState(
        150, // rawX
        300, // rawY
        200, // rawWidth
        100, // rawHeight
        45,  // rawRotation
        1.0, // rawScaleX
        1.0, // rawScaleY
        1.5  // scaleFactor
      );

      assert.equal(transform.x, 100); // 150 / 1.5
      assert.equal(transform.y, 200); // 300 / 1.5
      assert.ok(Math.abs(transform.width - 133.33) < 0.01);
      assert.ok(Math.abs(transform.height - 66.67) < 0.01);
      assert.equal(transform.rotation, 45);
    });
  });

  describe("6. In-Memory Asset Manager", () => {
    test("manages asset registration, retrieval and dictionary export", () => {
      const manager = new InMemoryAssetManager();
      const mockAsset = {
        id: "asset-123",
        name: "logo.png",
        type: "image",
        mimeType: "image/png",
        url: "blob:http://localhost/mock-blob",
        width: 400,
        height: 200,
      };

      manager.registerAsset(mockAsset);
      assert.equal(manager.getAsset("asset-123")?.name, "logo.png");
      assert.equal(manager.getAllAssets().length, 1);

      const record = manager.getAssetRecord();
      assert.ok(record["asset-123"]);

      manager.releaseAsset("asset-123");
      assert.equal(manager.getAsset("asset-123"), undefined);
      assert.equal(manager.getAllAssets().length, 0);
    });
  });
});
