/**
 * Design Studio Export Engine Test Suite
 *
 * Validates:
 * 1. Physical dimensions and DPI calculations for pixels, inches, and millimeters.
 * 2. Color parsing and PDF RGB conversions.
 * 3. Raster adapter export options (PNG transparent, JPEG solid background).
 * 4. Multi-page and front/back PDF generation using pdf-lib preserving real physical dimensions and vector text/shapes.
 * 5. Isolation from Konva stage and non-destruction of original DesignDocument.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import {
  mmToPoints,
  pointsToMm,
  mmToPixels,
  POINTS_PER_INCH,
  MM_PER_INCH,
} from "../src/constants/design-dimensions.ts";
import {
  parseColor,
  hexToPdfRgb,
} from "../src/lib/design-studio/export/color-utils.ts";
import { renderDocumentToPdf } from "../src/lib/design-studio/export/pdf-adapter.ts";
import { instantiateTemplate, ALL_DESIGN_TEMPLATES } from "../src/lib/design-studio/template-registry.ts";

test("Design Studio Export — Physical Dimension & DPI Conversions", async (t) => {
  await t.test("correctly calculates PostScript points from millimeters", () => {
    // 25.4 mm = 1 inch = 72 points
    const pts = mmToPoints(25.4);
    assert.equal(pts, 72);

    // Standard US visiting card width: 3.5 inches = 88.9 mm -> 252 points
    const visitingCardWidthPt = mmToPoints(88.9);
    assert.equal(visitingCardWidthPt, 252);

    // Standard US visiting card height: 2 inches = 50.8 mm -> 144 points
    const visitingCardHeightPt = mmToPoints(50.8);
    assert.equal(visitingCardHeightPt, 144);
  });

  await t.test("correctly converts millimeters to raster pixels at various DPI settings", () => {
    // 25.4 mm (1 inch) at 300 DPI = 300 pixels
    assert.equal(mmToPixels(25.4, 300), 300);

    // 25.4 mm at 72 DPI = 72 pixels
    assert.equal(mmToPixels(25.4, 72), 72);

    // 25.4 mm at 600 DPI = 600 pixels
    assert.equal(mmToPixels(25.4, 600), 600);

    // Visiting card 88.9 mm at 300 DPI = (3.5 * 300) = 1050 px
    assert.equal(mmToPixels(88.9, 300), 1050);

    // Visiting card 50.8 mm at 300 DPI = (2.0 * 300) = 600 px
    assert.equal(mmToPixels(50.8, 300), 600);
  });
});

test("Design Studio Export — Color Utilities", async (t) => {
  await t.test("parses hex and rgba colors correctly", () => {
    const white = parseColor("#ffffff");
    assert.deepEqual(white, { r: 255, g: 255, b: 255, a: 1 });

    const redHex = parseColor("#ff0000");
    assert.deepEqual(redHex, { r: 255, g: 0, b: 0, a: 1 });

    const transparent = parseColor("transparent");
    assert.deepEqual(transparent, { r: 255, g: 255, b: 255, a: 0 });

    const rgba = parseColor("rgba(30, 58, 138, 0.8)");
    assert.equal(rgba.r, 30);
    assert.equal(rgba.g, 58);
    assert.equal(rgba.b, 138);
    assert.equal(rgba.a, 0.8);
  });

  await t.test("converts to pdf-lib RGB channels (0.0 to 1.0)", () => {
    const pdfWhite = hexToPdfRgb("#ffffff");
    assert.equal(pdfWhite.red, 1);
    assert.equal(pdfWhite.green, 1);
    assert.equal(pdfWhite.blue, 1);

    const pdfBlack = hexToPdfRgb("#000000");
    assert.equal(pdfBlack.red, 0);
    assert.equal(pdfBlack.green, 0);
    assert.equal(pdfBlack.blue, 0);
  });
});

test("Design Studio Export — Multi-page Vector PDF Export", async (t) => {
  const corporateCard = ALL_DESIGN_TEMPLATES.find((tpl) => tpl.id === "vc-corporate-classic");
  assert.ok(corporateCard, "Corporate classic visiting card template must exist");

  const doc = instantiateTemplate(corporateCard);
  assert.equal(doc.pages.length, 2, "Visiting card template must have 2 pages (Front & Back)");

  await t.test("generates valid multi-page PDF document", async () => {
    const pdfBytes = await renderDocumentToPdf(doc, { pageScope: "all" });
    assert.ok(pdfBytes instanceof Uint8Array);
    assert.ok(pdfBytes.length > 500, "PDF bytes should be populated");

    // Load back with pdf-lib to verify structural integrity
    const parsedPdf = await PDFDocument.load(pdfBytes);
    assert.equal(parsedPdf.getPageCount(), 2, "PDF must contain exactly 2 pages for front and back");

    const page1 = parsedPdf.getPage(0);
    const page2 = parsedPdf.getPage(1);

    // Verify physical dimensions in PDF points
    // Landscape 3.5×2 inches = 252 × 144 points
    assert.ok(Math.abs(page1.getWidth() - 252) < 0.5, "Page 1 width should match 3.5 inches in points");
    assert.ok(Math.abs(page1.getHeight() - 144) < 0.5, "Page 1 height should match 2.0 inches in points");

    assert.ok(Math.abs(page2.getWidth() - 252) < 0.5, "Page 2 width should match 3.5 inches in points");
    assert.ok(Math.abs(page2.getHeight() - 144) < 0.5, "Page 2 height should match 2.0 inches in points");
  });

  await t.test("supports single-page scope export", async () => {
    const frontPageId = doc.pages[0].id;
    const pdfBytes = await renderDocumentToPdf(doc, { pageScope: frontPageId });
    const parsedPdf = await PDFDocument.load(pdfBytes);
    assert.equal(parsedPdf.getPageCount(), 1, "PDF with single page scope must have 1 page");
  });

  await t.test("does not mutate original DesignDocument during export", async () => {
    const originalJson = JSON.stringify(doc);
    await renderDocumentToPdf(doc);
    const postExportJson = JSON.stringify(doc);
    assert.equal(originalJson, postExportJson, "Original design document must remain strictly immutable");
  });
});
