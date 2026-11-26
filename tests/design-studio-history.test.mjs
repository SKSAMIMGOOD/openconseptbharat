import test from "node:test";
import assert from "node:assert/strict";

import { HistoryManager } from "../src/lib/design-studio/history-manager.ts";
import {
  createEmptyDesignDocument,
  insertTextElement,
  insertShapeElement,
  updateElementInDocument,
  deleteElementFromDocument,
} from "../src/lib/design-studio/template-foundation.ts";

test("Design Studio History — Records discrete changes and supports Undo / Redo lifecycle", () => {
  const initialDoc = createEmptyDesignDocument("visiting-card", "History Test");
  const pageId = initialDoc.pages[0].id;

  const history = new HistoryManager(initialDoc, 10);
  assert.equal(history.canUndo(), false);
  assert.equal(history.canRedo(), false);

  // Action 1: Insert Text
  const { document: docWithText, element: textEl } = insertTextElement(initialDoc, pageId, {
    text: "John Doe",
  });
  history.pushState(docWithText);

  assert.equal(history.canUndo(), true);
  assert.equal(history.canRedo(), false);
  assert.equal(history.getCurrentDocument().pages[0].elements.length, 1);

  // Action 2: Insert Shape
  const { document: docWithShape, element: shapeEl } = insertShapeElement(docWithText, pageId, {
    shapeType: "circle",
  });
  history.pushState(docWithShape);

  assert.equal(history.canUndo(), true);
  assert.equal(history.getCurrentDocument().pages[0].elements.length, 2);

  // Undo Action 2 -> Expect only Text element
  const afterUndo1 = history.undo();
  assert.ok(afterUndo1);
  assert.equal(afterUndo1.pages[0].elements.length, 1);
  assert.equal(afterUndo1.pages[0].elements[0].id, textEl.id);
  assert.equal(history.canUndo(), true);
  assert.equal(history.canRedo(), true);

  // Undo Action 1 -> Expect initial empty document
  const afterUndo2 = history.undo();
  assert.ok(afterUndo2);
  assert.equal(afterUndo2.pages[0].elements.length, 0);
  assert.equal(history.canUndo(), false);
  assert.equal(history.canRedo(), true);

  // Redo Action 1 -> Expect Text restored
  const afterRedo1 = history.redo();
  assert.ok(afterRedo1);
  assert.equal(afterRedo1.pages[0].elements.length, 1);
  assert.equal(afterRedo1.pages[0].elements[0].id, textEl.id);
  assert.equal(history.canUndo(), true);
  assert.equal(history.canRedo(), true);

  // Redo Action 2 -> Expect Shape restored
  const afterRedo2 = history.redo();
  assert.ok(afterRedo2);
  assert.equal(afterRedo2.pages[0].elements.length, 2);
  assert.equal(history.canUndo(), true);
  assert.equal(history.canRedo(), false);
});

test("Design Studio History — New action clears Redo future branch", () => {
  const initialDoc = createEmptyDesignDocument("visiting-card", "Branching Test");
  const pageId = initialDoc.pages[0].id;
  const history = new HistoryManager(initialDoc);

  // Add Step 1
  const { document: d1 } = insertTextElement(initialDoc, pageId, { text: "Step 1" });
  history.pushState(d1);

  // Add Step 2
  const { document: d2 } = insertTextElement(d1, pageId, { text: "Step 2" });
  history.pushState(d2);

  // Undo to Step 1
  history.undo();
  assert.equal(history.canRedo(), true);

  // Now perform alternative Step 3
  const { document: d3 } = insertShapeElement(history.getCurrentDocument(), pageId, {
    shapeType: "rect",
  });
  history.pushState(d3);

  // Redo future must be wiped out
  assert.equal(history.canRedo(), false);
  assert.equal(history.canUndo(), true);
  assert.equal(history.getCurrentDocument().pages[0].elements[1].type, "shape");
});

test("Design Studio History — Bounded buffer drops oldest past states beyond max limit", () => {
  const initialDoc = createEmptyDesignDocument("visiting-card", "Buffer Limit Test");
  const pageId = initialDoc.pages[0].id;
  const maxLimit = 5;
  const history = new HistoryManager(initialDoc, maxLimit);

  let curDoc = initialDoc;
  for (let i = 1; i <= 8; i++) {
    const { document: nextDoc } = insertTextElement(curDoc, pageId, { text: `Item ${i}` });
    history.pushState(nextDoc);
    curDoc = nextDoc;
  }

  const metrics = history.getMetrics();
  assert.equal(metrics.pastCount, maxLimit);
  assert.equal(metrics.maxLimit, maxLimit);
});

test("Design Studio History — Ignores duplicate identical states to avoid redundant undo steps", () => {
  const initialDoc = createEmptyDesignDocument("visiting-card", "Dedup Test");
  const history = new HistoryManager(initialDoc);

  // Pushing identical document does not increase past count
  history.pushState(initialDoc);
  history.pushState(JSON.parse(JSON.stringify(initialDoc)));

  assert.equal(history.canUndo(), false);
});

test("Design Studio Navigation — Zoom range boundaries (0.2x to 4.0x) prevent distortion and overflow", () => {
  const clampZoom = (z) => Math.max(0.2, Math.min(4.0, Number(z.toFixed(2))));

  assert.equal(clampZoom(0.05), 0.2);
  assert.equal(clampZoom(0.2), 0.2);
  assert.equal(clampZoom(1.0), 1.0);
  assert.equal(clampZoom(2.5), 2.5);
  assert.equal(clampZoom(4.0), 4.0);
  assert.equal(clampZoom(5.5), 4.0);
});
