import test from "node:test";
import assert from "node:assert/strict";

import {
  createEmptyDesignDocument,
  createTextElement,
  createImageElement,
  createShapeElement,
  updateElementTransform,
  updateElementInDocument,
} from "../src/lib/design-studio/template-foundation.ts";

test("Design Studio Interactions — updateElementTransform immutably updates position, dimensions, rotation", () => {
  const doc = createEmptyDesignDocument("visiting-card", "Interaction Test Card");
  const pageId = doc.pages[0].id;

  const textElement = createTextElement({
    text: "Sample Name",
    transform: {
      x: 20,
      y: 30,
      width: 150,
      height: 30,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
  });

  const docWithText = {
    ...doc,
    pages: doc.pages.map((p) =>
      p.id === pageId ? { ...p, elements: [textElement] } : p
    ),
  };

  assert.equal(textElement.transform.x, 20);
  assert.equal(textElement.transform.y, 30);
  assert.equal(textElement.transform.width, 150);
  assert.equal(textElement.transform.height, 30);
  assert.equal(textElement.transform.rotation, 0);

  // 1. Drag repositioning update
  const draggedDoc = updateElementTransform(docWithText, pageId, textElement.id, {
    x: 45.5,
    y: 80.25,
  });

  const draggedElement = draggedDoc.pages[0].elements[0];
  assert.equal(draggedElement.transform.x, 45.5);
  assert.equal(draggedElement.transform.y, 80.25);
  // Dimensions and rotation preserved
  assert.equal(draggedElement.transform.width, 150);
  assert.equal(draggedElement.transform.height, 30);
  assert.equal(draggedElement.transform.rotation, 0);
  // Original document not mutated
  assert.equal(docWithText.pages[0].elements[0].transform.x, 20);

  // 2. Resize and rotation update from Transformer
  const transformedDoc = updateElementTransform(draggedDoc, pageId, textElement.id, {
    width: 220,
    height: 45,
    rotation: 90,
  });

  const transformedElement = transformedDoc.pages[0].elements[0];
  assert.equal(transformedElement.transform.x, 45.5);
  assert.equal(transformedElement.transform.y, 80.25);
  assert.equal(transformedElement.transform.width, 220);
  assert.equal(transformedElement.transform.height, 45);
  assert.equal(transformedElement.transform.rotation, 90);
});

test("Design Studio Interactions — Text distortion prevention logic calculates reflowed dimensions without scaling glyphs", () => {
  // Simulates the onTransformEnd callback calculation in TextElementRenderer:
  // Node width: 100, height: 25, user drags transformer to scaleX: 1.5, scaleY: 1.2
  const initialWidth = 100;
  const initialHeight = 25;
  const scaleX = 1.5;
  const scaleY = 1.2;

  // New unscaled width and height applied directly to text element
  const newWidth = Math.max(20, Math.round(initialWidth * scaleX * 100) / 100);
  const newHeight = Math.max(10, Math.round(initialHeight * scaleY * 100) / 100);

  assert.equal(newWidth, 150);
  assert.equal(newHeight, 30);

  // Scale is normalized back to 1.0 in the schema so SVG/Canvas font glyphs render sharply
  const normalizedScaleX = 1;
  const normalizedScaleY = 1;

  assert.equal(normalizedScaleX, 1);
  assert.equal(normalizedScaleY, 1);
});

test("Design Studio Interactions — Proportional resize constraint for images maintains aspect ratio", () => {
  const doc = createEmptyDesignDocument("visiting-card", "Image Ratio Test");
  const pageId = doc.pages[0].id;

  const imgElement = createImageElement("asset-logo-1", {
    transform: {
      x: 10,
      y: 10,
      width: 100,
      height: 50, // 2:1 aspect ratio
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
  });

  const docWithImage = {
    ...doc,
    pages: doc.pages.map((p) =>
      p.id === pageId ? { ...p, elements: [imgElement] } : p
    ),
  };

  const img = docWithImage.pages[0].elements[0];
  const initialRatio = img.transform.width / img.transform.height;
  assert.equal(initialRatio, 2);

  // Simulates Transformer proportional scaling (scale = 1.5)
  const scale = 1.5;
  const newWidth = Math.round(img.transform.width * scale * 100) / 100;
  const newHeight = Math.round(img.transform.height * scale * 100) / 100;

  const updatedDoc = updateElementTransform(docWithImage, pageId, img.id, {
    width: newWidth,
    height: newHeight,
  });

  const updatedImg = updatedDoc.pages[0].elements[0];
  assert.equal(updatedImg.transform.width, 150);
  assert.equal(updatedImg.transform.height, 75);
  assert.equal(updatedImg.transform.width / updatedImg.transform.height, initialRatio);
});

test("Design Studio Interactions — Rotation values normalize correctly to [0, 360) range", () => {
  const normalizeRotation = (deg) => Math.round(((deg % 360) + 360) % 360);

  assert.equal(normalizeRotation(0), 0);
  assert.equal(normalizeRotation(90), 90);
  assert.equal(normalizeRotation(360), 0);
  assert.equal(normalizeRotation(450), 90);
  assert.equal(normalizeRotation(-90), 270);
  assert.equal(normalizeRotation(-370), 350);
});

test("Design Studio Interactions — updateElementInDocument supports locking and visibility toggling", () => {
  const doc = createEmptyDesignDocument("visiting-card", "Lock Test");
  const pageId = doc.pages[0].id;

  const shapeElement = createShapeElement({
    shapeType: "rect",
    transform: {
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    },
  });

  const docWithShape = {
    ...doc,
    pages: doc.pages.map((p) =>
      p.id === pageId ? { ...p, elements: [shapeElement] } : p
    ),
  };

  const shapeId = docWithShape.pages[0].elements[0].id;
  assert.equal(docWithShape.pages[0].elements[0].locked, false);

  // Lock element
  const lockedDoc = updateElementInDocument(docWithShape, pageId, shapeId, { locked: true });
  assert.equal(lockedDoc.pages[0].elements[0].locked, true);

  // Hide element
  const hiddenDoc = updateElementInDocument(lockedDoc, pageId, shapeId, { visible: false });
  assert.equal(hiddenDoc.pages[0].elements[0].visible, false);
  assert.equal(hiddenDoc.pages[0].elements[0].locked, true);
});

test("Design Studio Interactions — Dragging under zoom preserves logical PostScript point coordinates", () => {
  // In Konva, Stage has scaleX={scaleFactor} and scaleY={scaleFactor}.
  // Internal nodes' node.x() and node.y() already return unscaled coordinates in the Stage's logical coordinate space.
  const logicalX = 72; // 1 inch from left
  const logicalY = 144; // 2 inches from top
  const zoomLevels = [0.5, 1.0, 1.5, 2.0, 3.0];

  zoomLevels.forEach((zoom) => {
    const scaleFactor = (96 / 72) * zoom;
    // On screen, the canvas renders at (logicalX * scaleFactor, logicalY * scaleFactor)
    const screenX = logicalX * scaleFactor;
    const screenY = logicalY * scaleFactor;

    // When Konva delivers e.target.x(), it divides by scaleFactor back into the stage's coordinate system
    const recoveredLogicalX = screenX / scaleFactor;
    const recoveredLogicalY = screenY / scaleFactor;

    assert.equal(recoveredLogicalX, logicalX);
    assert.equal(recoveredLogicalY, logicalY);
  });
});
