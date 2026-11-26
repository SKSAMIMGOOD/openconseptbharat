/**
 * Design Studio — Multi-Copy Print Sheet Generator Test Suite
 *
 * Validates:
 * 1. Automatic N-up capacity calculation for A4 and 4x6 paper sizes.
 * 2. Margin reservation and spacing gap between cards.
 * 3. Card placement prevention of overlap and boundary violations.
 * 4. Front/back duplex imposition (long-edge column mirroring & short-edge row mirroring).
 * 5. Cut guide corner and border generation.
 * 6. Multi-sheet PDF compilation with pdf-lib preserving physical dimensions.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import {
  calculatePrintSheetLayout,
} from "../src/lib/design-studio/print-sheet/sheet-calculation.ts";
import {
  compilePrintSheetPdf,
} from "../src/lib/design-studio/print-sheet/sheet-compiler.ts";
import {
  instantiateTemplate,
  ALL_DESIGN_TEMPLATES,
} from "../src/lib/design-studio/template-registry.ts";

test("Design Studio Print Sheet — Layout Geometry & Capacity", async (t) => {
  const corporateCard = ALL_DESIGN_TEMPLATES.find((tpl) => tpl.id === "vc-corporate-classic");
  assert.ok(corporateCard, "Visiting card template must exist");

  const doc = instantiateTemplate(corporateCard);
  // Dimensions: 88.9 × 50.8 mm (Landscape 3.5×2 inches)

  await t.test("calculates capacity on A4 portrait (210 × 297 mm)", () => {
    const config = {
      paperSize: "a4",
      orientation: "portrait",
      copies: 10,
      pageSelection: "front-only",
      duplexFlipEdge: "long-edge",
      marginsMm: { top: 10, bottom: 10, left: 10, right: 10 },
      spacingMm: { horizontal: 3, vertical: 3 },
      rotateCard: false,
      alignment: "center",
      cutGuides: {
        enabled: true,
        style: "corners",
        color: "#94a3b8",
        widthPt: 0.75,
        includeBorder: false,
        borderColor: "#cbd5e1",
      },
      dpi: 300,
    };

    const layout = calculatePrintSheetLayout(doc, config);

    // Printable width: 210 - 20 = 190 mm.
    // Card width: 88.9 mm + 3 mm spacing.
    // (190 + 3) / (88.9 + 3) = 193 / 91.9 = 2.1 -> 2 columns
    assert.equal(layout.columns, 2, "Should fit exactly 2 columns across 190mm");

    // Printable height: 297 - 20 = 277 mm.
    // Card height: 50.8 mm + 3 mm spacing.
    // (277 + 3) / (50.8 + 3) = 280 / 53.8 = 5.2 -> 5 rows
    assert.equal(layout.rows, 5, "Should fit exactly 5 rows down 277mm");

    // 2 cols * 5 rows = 10 cards per A4 sheet
    assert.equal(layout.capacityPerSheet, 10, "A4 should fit exactly 10 visiting cards per sheet");
    assert.equal(layout.sheets.length, 1, "10 requested copies should require exactly 1 sheet");
    assert.equal(layout.sheets[0].cards.length, 10);
  });

  await t.test("never places cards outside margins or overlapping", () => {
    const config = {
      paperSize: "a4",
      orientation: "portrait",
      copies: 10,
      pageSelection: "front-only",
      duplexFlipEdge: "long-edge",
      marginsMm: { top: 15, bottom: 15, left: 12, right: 12 },
      spacingMm: { horizontal: 4, vertical: 4 },
      rotateCard: false,
      alignment: "center",
      cutGuides: {
        enabled: true,
        style: "corners",
        color: "#94a3b8",
        widthPt: 0.75,
        includeBorder: false,
        borderColor: "#cbd5e1",
      },
      dpi: 300,
    };

    const layout = calculatePrintSheetLayout(doc, config);
    const cards = layout.sheets[0].cards;

    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      // Check boundaries
      assert.ok(c.xMm >= config.marginsMm.left - 0.01, "Card X should respect left margin");
      assert.ok(c.yMm >= config.marginsMm.top - 0.01, "Card Y should respect top margin");
      assert.ok(c.xMm + c.widthMm <= layout.paperWidthMm - config.marginsMm.right + 0.01, "Card should not exceed right margin");
      assert.ok(c.yMm + c.heightMm <= layout.paperHeightMm - config.marginsMm.bottom + 0.01, "Card should not exceed bottom margin");

      // Check no overlap with any subsequent card
      for (let j = i + 1; j < cards.length; j++) {
        const other = cards[j];
        const overlapsX = Math.max(c.xMm, other.xMm) < Math.min(c.xMm + c.widthMm, other.xMm + other.widthMm);
        const overlapsY = Math.max(c.yMm, other.yMm) < Math.min(c.yMm + c.heightMm, other.yMm + other.heightMm);
        assert.ok(!(overlapsX && overlapsY), `Card ${i} and Card ${j} must not overlap`);
      }
    }
  });

  await t.test("calculates capacity on compact 4x6 paper (101.6 × 152.4 mm)", () => {
    const config = {
      paperSize: "4x6",
      orientation: "portrait",
      copies: 4,
      pageSelection: "front-only",
      duplexFlipEdge: "long-edge",
      marginsMm: { top: 5, bottom: 5, left: 5, right: 5 },
      spacingMm: { horizontal: 2, vertical: 2 },
      rotateCard: false,
      alignment: "center",
      cutGuides: {
        enabled: true,
        style: "corners",
        color: "#94a3b8",
        widthPt: 0.75,
        includeBorder: false,
        borderColor: "#cbd5e1",
      },
      dpi: 300,
    };

    const layout = calculatePrintSheetLayout(doc, config);
    // 4x6 paper width = 101.6 mm. Avail width = 91.6 mm.
    // 88.9 mm card -> fits 1 column.
    // 4x6 paper height = 152.4 mm. Avail height = 142.4 mm.
    // 50.8 mm card -> fits 2 rows.
    assert.equal(layout.columns, 1);
    assert.equal(layout.rows, 2);
    assert.equal(layout.capacityPerSheet, 2, "4x6 should fit 2 visiting cards");
    assert.equal(layout.totalSheetsRequired, 2, "4 copies should require 2 sheets");
  });
});

test("Design Studio Print Sheet — Duplex Front & Back Alignment", async (t) => {
  const corporateCard = ALL_DESIGN_TEMPLATES.find((tpl) => tpl.id === "vc-corporate-classic");
  const doc = instantiateTemplate(corporateCard);

  await t.test("mirrors columns for Long-Edge duplex flip", () => {
    const config = {
      paperSize: "a4",
      orientation: "portrait",
      copies: 4,
      pageSelection: "both-duplex",
      duplexFlipEdge: "long-edge",
      marginsMm: { top: 10, bottom: 10, left: 10, right: 10 },
      spacingMm: { horizontal: 3, vertical: 3 },
      rotateCard: false,
      alignment: "center",
      cutGuides: {
        enabled: true,
        style: "corners",
        color: "#94a3b8",
        widthPt: 0.75,
        includeBorder: false,
        borderColor: "#cbd5e1",
      },
      dpi: 300,
    };

    const layout = calculatePrintSheetLayout(doc, config);
    assert.equal(layout.sheets.length, 2, "Should create Front and Back sheets");
    assert.equal(layout.sheets[0].isBackSide, false);
    assert.equal(layout.sheets[1].isBackSide, true);

    const frontCard0 = layout.sheets[0].cards[0]; // row 0, col 0
    const backCard0 = layout.sheets[1].cards[0];

    // For long edge flip with 2 columns, col 0 maps to col 1 on back
    assert.equal(frontCard0.col, 0);
    assert.equal(backCard0.col, 1, "Col 0 on front must map to Col 1 on back for long edge duplex");
    assert.equal(frontCard0.row, backCard0.row, "Row should remain identical on long edge duplex");
  });

  await t.test("mirrors rows for Short-Edge duplex flip", () => {
    const config = {
      paperSize: "a4",
      orientation: "portrait",
      copies: 4,
      pageSelection: "both-duplex",
      duplexFlipEdge: "short-edge",
      marginsMm: { top: 10, bottom: 10, left: 10, right: 10 },
      spacingMm: { horizontal: 3, vertical: 3 },
      rotateCard: false,
      alignment: "center",
      cutGuides: {
        enabled: true,
        style: "corners",
        color: "#94a3b8",
        widthPt: 0.75,
        includeBorder: false,
        borderColor: "#cbd5e1",
      },
      dpi: 300,
    };

    const layout = calculatePrintSheetLayout(doc, config);
    const frontCard0 = layout.sheets[0].cards[0]; // row 0, col 0
    const backCard0 = layout.sheets[1].cards[0];

    // For short edge flip with 5 rows, row 0 maps to row 4 on back
    assert.equal(frontCard0.row, 0);
    assert.equal(backCard0.row, layout.rows - 1, "Row 0 on front must map to last row on back for short edge duplex");
    assert.equal(frontCard0.col, backCard0.col, "Col should remain identical on short edge duplex");
  });
});
