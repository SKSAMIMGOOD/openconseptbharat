import test from "node:test";
import assert from "node:assert/strict";

import {
  createEmptyDesignDocument,
  insertTextElement,
  insertImageElement,
  insertShapeElement,
  calculateCenteredPosition,
  addElementToPage,
} from "../src/lib/design-studio/template-foundation.ts";
import { getPageDimensionsPt } from "../src/lib/design-studio/coordinate-converter.ts";

test("Design Studio Insertion — insertTextElement adds unique text element to active page", () => {
  const doc = createEmptyDesignDocument("visiting-card", "Text Insertion Test");
  const activePageId = doc.pages[0].id;
  assert.equal(doc.pages[0].elements.length, 0);

  const { document: docWithText1, element: el1 } = insertTextElement(doc, activePageId, {
    text: "John Doe",
    fontSize: 20,
    fontFamily: "Inter",
    fontWeight: "bold",
    fill: "#1e3a8a",
  });

  assert.equal(docWithText1.pages[0].elements.length, 1);
  assert.equal(el1.text, "John Doe");
  assert.equal(el1.fontSize, 20);
  assert.equal(el1.fontWeight, "bold");
  assert.equal(el1.fill, "#1e3a8a");
  assert.equal(el1.zIndex, 1);
  assert.ok(el1.id.startsWith("el-text-"));

  // Second text element receives unique ID and higher zIndex
  const { document: docWithText2, element: el2 } = insertTextElement(docWithText1, activePageId, {
    text: "Software Architect\nTech Lead",
    fontSize: 12,
  });

  assert.equal(docWithText2.pages[0].elements.length, 2);
  assert.notEqual(el1.id, el2.id);
  assert.equal(el2.zIndex, 2);
  assert.equal(el2.text, "Software Architect\nTech Lead");
});

test("Design Studio Insertion — insertShapeElement supports rect, circle, line, and triangle", () => {
  const doc = createEmptyDesignDocument("visiting-card", "Shape Insertion Test");
  const activePageId = doc.pages[0].id;

  const shapes = ["rect", "circle", "line", "triangle"];
  let currentDoc = doc;

  shapes.forEach((shapeType, idx) => {
    const { document: nextDoc, element } = insertShapeElement(currentDoc, activePageId, {
      shapeType: shapeType,
      fill: shapeType === "line" ? "transparent" : "#2563eb",
      stroke: shapeType === "line" ? "#2563eb" : "transparent",
      strokeWidth: shapeType === "line" ? 2 : 0,
      transform: {
        x: 10 * idx,
        y: 10 * idx,
        width: 80,
        height: 60,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
      },
    });

    assert.equal(element.type, "shape");
    assert.equal(element.shapeType, shapeType);
    assert.equal(element.zIndex, idx + 1);
    currentDoc = nextDoc;
  });

  assert.equal(currentDoc.pages[0].elements.length, 4);
});

test("Design Studio Insertion — insertImageElement links asset ID and preserves aspect ratio calculations", () => {
  const doc = createEmptyDesignDocument("visiting-card", "Image Insertion Test");
  const activePageId = doc.pages[0].id;
  const assetId = "asset-test-photo-1";

  const { document: updatedDoc, element } = insertImageElement(doc, activePageId, assetId, {
    name: "ProfilePhoto.png",
    fit: "contain",
    transform: {
      x: 30,
      y: 40,
      width: 120,
      height: 80, // 3:2 ratio
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
  });

  assert.equal(updatedDoc.pages[0].elements.length, 1);
  assert.equal(element.type, "image");
  assert.equal(element.assetId, assetId);
  assert.equal(element.name, "ProfilePhoto.png");
  assert.equal(element.transform.width, 120);
  assert.equal(element.transform.height, 80);
});

test("Design Studio Insertion — calculateCenteredPosition places objects in the center of the page", () => {
  const dimensions = { widthMm: 85, heightMm: 55 }; // Standard Visiting Card
  const { widthPt, heightPt } = getPageDimensionsPt(dimensions, "landscape");

  const elemW = 100;
  const elemH = 40;
  const center = calculateCenteredPosition(widthPt, heightPt, elemW, elemH);

  const expectedX = Math.round((widthPt - elemW) / 2);
  const expectedY = Math.round((heightPt - elemH) / 2);

  assert.equal(center.x, expectedX);
  assert.equal(center.y, expectedY);
  assert.ok(center.x > 0);
  assert.ok(center.y > 0);
});

test("Design Studio Insertion — Inserted objects target only the active page and preserve other pages", () => {
  // Visiting card has Page 1 (Front) and Page 2 (Back)
  const doc = createEmptyDesignDocument("visiting-card", "Multi Page Target Test");
  assert.equal(doc.pages.length, 2);

  const page1Id = doc.pages[0].id;
  const page2Id = doc.pages[1].id;

  // Insert on Page 1
  const { document: docWithPage1 } = insertTextElement(doc, page1Id, { text: "Front Side" });
  assert.equal(docWithPage1.pages[0].elements.length, 1);
  assert.equal(docWithPage1.pages[1].elements.length, 0);

  // Insert on Page 2
  const { document: docWithBothPages } = insertTextElement(docWithPage1, page2Id, { text: "Back Side" });
  assert.equal(docWithBothPages.pages[0].elements.length, 1);
  assert.equal(docWithBothPages.pages[1].elements.length, 1);
  assert.equal(docWithBothPages.pages[0].elements[0].text, "Front Side");
  assert.equal(docWithBothPages.pages[1].elements[0].text, "Back Side");
});
