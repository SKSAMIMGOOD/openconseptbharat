import test from "node:test";
import assert from "node:assert/strict";

import {
  createEmptyDesignDocument,
  insertTextElement,
  insertShapeElement,
  deleteElementFromDocument,
  duplicateElementInDocument,
  reorderElementLayer,
  reorderElementsList,
  updateElementInDocument,
} from "../src/lib/design-studio/template-foundation.ts";

test("Design Studio Layers — deleteElementFromDocument removes the target element cleanly", () => {
  const doc = createEmptyDesignDocument("visiting-card", "Delete Test");
  const pageId = doc.pages[0].id;

  const { document: doc1, element: el1 } = insertTextElement(doc, pageId, { text: "Line 1" });
  const { document: doc2, element: el2 } = insertTextElement(doc1, pageId, { text: "Line 2" });

  assert.equal(doc2.pages[0].elements.length, 2);

  const docAfterDelete = deleteElementFromDocument(doc2, pageId, el1.id);
  assert.equal(docAfterDelete.pages[0].elements.length, 1);
  assert.equal(docAfterDelete.pages[0].elements[0].id, el2.id);
  assert.equal(docAfterDelete.pages[0].elements[0].text, "Line 2");
});

test("Design Studio Layers — duplicateElementInDocument clones element with unique ID and offset position", () => {
  const doc = createEmptyDesignDocument("visiting-card", "Duplicate Test");
  const pageId = doc.pages[0].id;

  const { document: docWithShape, element: origShape } = insertShapeElement(doc, pageId, {
    name: "Badge Rectangle",
    shapeType: "rect",
    fill: "#dc2626",
    transform: {
      x: 50,
      y: 60,
      width: 100,
      height: 40,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
  });

  const { document: duplicatedDoc, element: dupShape } = duplicateElementInDocument(
    docWithShape,
    pageId,
    origShape.id
  );

  assert.ok(dupShape);
  assert.equal(duplicatedDoc.pages[0].elements.length, 2);
  assert.notEqual(dupShape.id, origShape.id);
  assert.equal(dupShape.name, "Badge Rectangle (Copy)");
  assert.equal(dupShape.transform.x, 65); // 50 + 15 offset
  assert.equal(dupShape.transform.y, 75); // 60 + 15 offset
  assert.equal(dupShape.zIndex, 2);
  assert.equal(dupShape.fill, "#dc2626");
});

test("Design Studio Layers — reorderElementLayer correctly changes stacking order (up, down, top, bottom)", () => {
  const doc = createEmptyDesignDocument("visiting-card", "Reorder Test");
  const pageId = doc.pages[0].id;

  // Insert 3 elements: A (z=1), B (z=2), C (z=3)
  const { document: d1, element: elA } = insertTextElement(doc, pageId, { name: "A", text: "A" });
  const { document: d2, element: elB } = insertTextElement(d1, pageId, { name: "B", text: "B" });
  const { document: d3, element: elC } = insertTextElement(d2, pageId, { name: "C", text: "C" });

  assert.deepEqual(
    d3.pages[0].elements.map((el) => el.name),
    ["A", "B", "C"]
  );

  // 1. Move A up (should become B, A, C)
  const movedAUp = reorderElementLayer(d3, pageId, elA.id, "up");
  assert.deepEqual(
    movedAUp.pages[0].elements.map((el) => el.name),
    ["B", "A", "C"]
  );
  assert.deepEqual(
    movedAUp.pages[0].elements.map((el) => el.zIndex),
    [1, 2, 3]
  );

  // 2. Bring A to top (should become B, C, A)
  const movedATop = reorderElementLayer(movedAUp, pageId, elA.id, "top");
  assert.deepEqual(
    movedATop.pages[0].elements.map((el) => el.name),
    ["B", "C", "A"]
  );

  // 3. Send A to bottom (should become A, B, C)
  const movedABottom = reorderElementLayer(movedATop, pageId, elA.id, "bottom");
  assert.deepEqual(
    movedABottom.pages[0].elements.map((el) => el.name),
    ["A", "B", "C"]
  );

  // 4. Move C down (should become A, C, B)
  const movedCDown = reorderElementLayer(movedABottom, pageId, elC.id, "down");
  assert.deepEqual(
    movedCDown.pages[0].elements.map((el) => el.name),
    ["A", "C", "B"]
  );
});

test("Design Studio Layers — reorderElementsList applies drag-and-drop order and re-indexes zIndex", () => {
  const doc = createEmptyDesignDocument("visiting-card", "List Reorder Test");
  const pageId = doc.pages[0].id;

  const { document: d1, element: el1 } = insertTextElement(doc, pageId, { name: "Layer 1" });
  const { document: d2, element: el2 } = insertTextElement(d1, pageId, { name: "Layer 2" });
  const { document: d3, element: el3 } = insertTextElement(d2, pageId, { name: "Layer 3" });

  // Reverse list order
  const reorderedDoc = reorderElementsList(d3, pageId, [el3.id, el2.id, el1.id]);

  assert.deepEqual(
    reorderedDoc.pages[0].elements.map((el) => el.id),
    [el3.id, el2.id, el1.id]
  );
  assert.deepEqual(
    reorderedDoc.pages[0].elements.map((el) => el.zIndex),
    [1, 2, 3]
  );
});

test("Design Studio Properties — updateElementInDocument mutates typography, colors, and dimensions safely", () => {
  const doc = createEmptyDesignDocument("visiting-card", "Props Test");
  const pageId = doc.pages[0].id;

  const { document: docWithText, element: textEl } = insertTextElement(doc, pageId, {
    text: "Initial Title",
    fontSize: 16,
    fill: "#000000",
  });

  // Mutate text properties
  const updatedDoc = updateElementInDocument(docWithText, pageId, textEl.id, {
    text: "Updated Title",
    fontSize: 24,
    fontWeight: "bold",
    fontStyle: "italic",
    fill: "#2563eb",
    align: "center",
    lineHeight: 1.5,
    letterSpacing: 2,
    opacity: 0.85,
  });

  const updatedEl = updatedDoc.pages[0].elements[0];
  assert.equal(updatedEl.text, "Updated Title");
  assert.equal(updatedEl.fontSize, 24);
  assert.equal(updatedEl.fontWeight, "bold");
  assert.equal(updatedEl.fontStyle, "italic");
  assert.equal(updatedEl.fill, "#2563eb");
  assert.equal(updatedEl.align, "center");
  assert.equal(updatedEl.lineHeight, 1.5);
  assert.equal(updatedEl.letterSpacing, 2);
  assert.equal(updatedEl.opacity, 0.85);
});
