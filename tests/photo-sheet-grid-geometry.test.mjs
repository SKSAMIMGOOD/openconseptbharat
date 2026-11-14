import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';

import {
  calculateSheetDimensions,
  calculateMaxSheetCapacity,
  calculatePhotoSheetLayout,
  generateSheetFileName,
} from '../src/lib/photo-studio/sheet-calculator.ts';

import {
  SHEET_A4_SHORT_EDGE_MM,
  SHEET_A4_LONG_EDGE_MM,
  SHEET_A4_SHORT_EDGE_PT,
  SHEET_A4_LONG_EDGE_PT,
  SHEET_4X6_SHORT_EDGE_MM,
  SHEET_4X6_LONG_EDGE_MM,
  SHEET_4X6_SHORT_EDGE_PT,
  SHEET_4X6_LONG_EDGE_PT,
  MM_PER_INCH,
  DEFAULT_A4_SHEET_CONFIG,
  DEFAULT_PHOTO_SHEET_CONFIG,
  DEFAULT_A4_SHEET_MARGINS,
  DEFAULT_SHEET_MARGINS,
  DEFAULT_A4_SHEET_SPACING,
  DEFAULT_4X6_SHEET_SPACING,
  DEFAULT_SHEET_SPACING,
} from '../src/constants/photo-sheet.ts';

import { exportMultiSheetAsPdf } from '../src/lib/photo-studio/sheet-exporter.ts';
import { renderMasterSheetCanvas } from '../src/lib/photo-studio/sheet-renderer.ts';

// Minimal valid 1x1 JPEG bytes for real pdf-lib embedding verification
const SAMPLE_JPEG_BYTES = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
  0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
  0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
  0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
  0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
  0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
  0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
  0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
  0x00, 0xbf, 0x80, 0xff, 0xd9,
]);

describe('PHOTO STUDIO: Physical Grid Layout & Geometry Test Suite (Phase 06)', () => {

  // =========================================================================
  // 1. 4×6 COMPACT PHOTO SHEET (1.1 × 1.35 in = 27.94 × 34.29 mm)
  // =========================================================================
  describe('1. 4×6 Compact Photo Sheet (27.94 × 34.29 mm)', () => {
    const compactDims = { widthMm: 27.94, heightMm: 34.29 };

    it('calculates exactly 3 columns across 4×6 portrait paper when margins permit', () => {
      // 101.6 mm sheet width, 4 mm margins each side = 93.6 mm available width.
      // 3 compact photos: 3 × 27.94 + 2 × 1.5 = 86.82 mm <= 93.6 mm.
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_PHOTO_SHEET_CONFIG,
          paperSize: '4x6',
          orientation: 'portrait',
          margins: { topMm: 4, bottomMm: 4, leftMm: 4, rightMm: 4, uniform: true },
          spacing: { horizontalMm: 1.5, verticalMm: 1.5, uniform: true },
          copies: 12,
        },
        compactDims
      );

      assert.equal(layout.isOverflowing, false);
      assert.equal(layout.maxColumns, 3);
      assert.equal(layout.activeColumns, 3);
    });

    it('calculates maximum valid rows (4 rows) and total capacity (12 photos) on 4×6 portrait', () => {
      // 152.4 mm sheet height, 4 mm margins each side = 144.4 mm available height.
      // 4 rows: 4 × 34.29 + 3 × 1.5 = 141.66 mm <= 144.4 mm.
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_PHOTO_SHEET_CONFIG,
          paperSize: '4x6',
          orientation: 'portrait',
          margins: { topMm: 4, bottomMm: 4, leftMm: 4, rightMm: 4, uniform: true },
          spacing: { horizontalMm: 1.5, verticalMm: 1.5, uniform: true },
          copies: 20, // Request more than capacity
        },
        compactDims
      );

      assert.equal(layout.maxRows, 4);
      assert.equal(layout.maxCapacity, 12); // 3 cols × 4 rows = 12
      assert.equal(layout.totalPhotos, 12);
      assert.equal(layout.copiesExceedCapacity, true);
      assert.equal(layout.exceededByCount, 8);
    });

    it('arranges user-selected custom quantity with partial final row (e.g. 10 photos -> 3, 3, 3, 1)', () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_PHOTO_SHEET_CONFIG,
          paperSize: '4x6',
          orientation: 'portrait',
          margins: { topMm: 4, bottomMm: 4, leftMm: 4, rightMm: 4, uniform: true },
          spacing: { horizontalMm: 1.5, verticalMm: 1.5, uniform: true },
          copies: 10,
        },
        compactDims
      );

      assert.equal(layout.totalPhotos, 10);
      assert.equal(layout.activeColumns, 3);
      assert.equal(layout.activeRows, 4);
      assert.equal(layout.placements.length, 10);

      // Verify row and column distributions
      const rowCounts = [0, 0, 0, 0];
      for (const p of layout.placements) {
        rowCounts[p.row]++;
      }
      assert.deepEqual(rowCounts, [3, 3, 3, 1], 'Must place 3 in Row 0, 3 in Row 1, 3 in Row 2, and 1 in Row 3');

      // Verify col 0 in Row 3 is aligned with col 0 in previous rows
      const row0col0 = layout.placements[0];
      const row3col0 = layout.placements[9];
      assert.equal(row3col0.col, 0);
      assert.equal(row3col0.xMm, row0col0.xMm);
    });

    it('verifies spacing, borders and non-collision boundaries on 4×6 compact', () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_PHOTO_SHEET_CONFIG,
          paperSize: '4x6',
          orientation: 'portrait',
          margins: { topMm: 4, bottomMm: 4, leftMm: 4, rightMm: 4, uniform: true },
          spacing: { horizontalMm: 1.5, verticalMm: 1.5, uniform: true },
          copies: 12,
        },
        compactDims
      );

      // Check all photos stay inside 101.6 × 152.4 mm boundaries
      for (const p of layout.placements) {
        assert.ok(p.xMm >= 0);
        assert.ok(p.yMm >= 0);
        assert.ok(p.xMm + p.widthMm <= 101.61);
        assert.ok(p.yMm + p.heightMm <= 152.41);
      }

      // Check horizontal spacing between column 0 and column 1
      const gapX = layout.placements[1].xMm - (layout.placements[0].xMm + layout.placements[0].widthMm);
      assert.equal(Number(gapX.toFixed(3)), 1.5);

      // Check vertical spacing between row 0 and row 1 (indices 0 and 3)
      const gapY = layout.placements[3].yMm - (layout.placements[0].yMm + layout.placements[0].heightMm);
      assert.equal(Number(gapY.toFixed(3)), 1.5);
    });
  });

  // =========================================================================
  // 2. 4×6 STANDARD PASSPORT PHOTO SHEET (35 × 45 mm)
  // =========================================================================
  describe('2. 4×6 Standard Passport Photo Sheet (35 × 45 mm)', () => {
    const standardDims = { widthMm: 35, heightMm: 45 };

    it('calculates maximum valid column count of 2 on 4×6 portrait', () => {
      // 101.6 mm sheet width, 4 mm margins = 93.6 mm available.
      // 2 standard photos: 2 × 35 + 1.5 = 71.5 mm <= 93.6 mm.
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_PHOTO_SHEET_CONFIG,
          paperSize: '4x6',
          orientation: 'portrait',
          margins: { topMm: 4, bottomMm: 4, leftMm: 4, rightMm: 4, uniform: true },
          spacing: { horizontalMm: 1.5, verticalMm: 1.5, uniform: true },
          copies: 6,
        },
        standardDims
      );

      assert.equal(layout.maxColumns, 2);
      assert.equal(layout.activeColumns, 2);
      assert.equal(layout.maxRows, 3);
      assert.equal(layout.maxCapacity, 6);
    });

    it('verifies an impossible 3-column arrangement of 35mm photos on 4×6 portrait is rejected', () => {
      // 3 × 35 + 2 × 1.5 = 108 mm > 93.6 mm available width (and > 101.6 mm total paper width)
      const { maxCols } = calculateMaxSheetCapacity(
        101.6,
        152.4,
        35,
        45,
        1.5,
        1.5,
        { topMm: 4, bottomMm: 4, leftMm: 4, rightMm: 4 }
      );

      assert.equal(maxCols, 2, 'Cannot fit 3 standard 35mm photos across 4×6 portrait width');
    });

    it('calculates maximum 3 columns on 4×6 landscape with 4mm margins', () => {
      // 152.4 mm width, 8 mm total margins = 144.4 mm available.
      // 4 × 35 + 3 × 1.5 = 144.5 mm > 144.4 mm (exceeds by 0.1 mm) -> 3 columns fit.
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_PHOTO_SHEET_CONFIG,
          paperSize: '4x6',
          orientation: 'landscape',
          margins: { topMm: 4, bottomMm: 4, leftMm: 4, rightMm: 4, uniform: true },
          spacing: { horizontalMm: 1.5, verticalMm: 1.5, uniform: true },
          copies: 6,
        },
        standardDims
      );

      assert.equal(layout.maxColumns, 3);
      assert.equal(layout.maxRows, 2);
      assert.equal(layout.maxCapacity, 6);
    });
  });

  // =========================================================================
  // 3. A4 COMPACT PHOTO SHEET (27.94 × 34.29 mm)
  // =========================================================================
  describe('3. A4 Compact Photo Sheet (27.94 × 34.29 mm)', () => {
    const compactDims = { widthMm: 27.94, heightMm: 34.29 };

    it('calculates exactly 7 columns on A4 portrait when margins permit', () => {
      // 210 mm paper width with 2 mm left/right margins leaves 206 mm available width.
      // 7 compact photos: 7 × 27.94 + 6 × 1.5 = 204.58 mm <= 206 mm.
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          margins: { topMm: 5, bottomMm: 5, leftMm: 2, rightMm: 2, uniform: false },
          spacing: { horizontalMm: 1.5, verticalMm: 1.5, uniform: true },
          copies: 56,
        },
        compactDims
      );

      assert.equal(layout.isOverflowing, false);
      assert.equal(layout.maxColumns, 7);
      assert.equal(layout.activeColumns, 7);
      assert.equal(layout.maxRows, 8);
      assert.equal(layout.maxCapacity, 56); // 7 cols × 8 rows = 56 photos
      assert.equal(layout.totalPhotos, 56);
    });

    it('correctly reduces column count to 6 when margins exceed available width for 7 columns', () => {
      // Default A4 margins: leftMm = 6, rightMm = 6 -> combined 12 mm margins.
      // Available width: 210 - 12 = 198 mm.
      // 7 compact photos require 204.58 mm > 198 mm.
      // 6 compact photos require 6 × 27.94 + 5 × 1.5 = 175.14 mm <= 198 mm.
      // Grid must correctly reduce to 6 columns without silently changing configured margins.
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          margins: { topMm: 6, bottomMm: 6, leftMm: 6, rightMm: 6, uniform: true },
          spacing: { horizontalMm: 1.5, verticalMm: 1.5, uniform: true },
          copies: 48,
        },
        compactDims
      );

      assert.equal(layout.isOverflowing, false);
      assert.equal(layout.maxColumns, 6);
      assert.equal(layout.activeColumns, 6);
      assert.equal(layout.maxRows, 8);
      assert.equal(layout.maxCapacity, 48);
    });

    it('supports more than 4 columns (up to 9 columns on A4 landscape compact)', () => {
      // 297 mm width, 12 mm margins = 285 mm available width.
      // 9 compact photos: 9 × 27.94 + 8 × 1.5 = 263.46 mm <= 285 mm.
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'landscape',
          copies: 45,
        },
        compactDims
      );

      assert.equal(layout.maxColumns, 9);
      assert.equal(layout.maxRows, 5);
      assert.equal(layout.maxCapacity, 45);
    });
  });

  // =========================================================================
  // 4. A4 STANDARD PASSPORT PHOTO SHEET (35 × 45 mm)
  // =========================================================================
  describe('4. A4 Standard Passport Photo Sheet (35 × 45 mm)', () => {
    const standardDims = { widthMm: 35, heightMm: 45 };

    it('calculates true maximum valid columns (5) and rows (6) for 30 photos on A4 portrait', () => {
      // 210 mm width, 12 mm margins = 198 mm available.
      // 5 cols: 5 × 35 + 4 × 1.5 = 181 mm <= 198 mm.
      // 297 mm height, 12 mm margins = 285 mm available.
      // 6 rows: 6 × 45 + 5 × 1.5 = 277.5 mm <= 285 mm.
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          margins: { topMm: 6, bottomMm: 6, leftMm: 6, rightMm: 6, uniform: true },
          spacing: { horizontalMm: 1.5, verticalMm: 1.5, uniform: true },
          copies: 30,
        },
        standardDims
      );

      assert.equal(layout.maxColumns, 5);
      assert.equal(layout.maxRows, 6);
      assert.equal(layout.maxCapacity, 30);
      assert.equal(layout.activeColumns, 5);
      assert.equal(layout.activeRows, 6);
      assert.equal(layout.totalPhotos, 30);
    });

    it('preserves exact 35 × 45 mm physical photo dimensions without shrinking or distortion', () => {
      const layout = calculatePhotoSheetLayout(
        DEFAULT_A4_SHEET_CONFIG,
        standardDims
      );

      assert.equal(layout.photoWidthMm, 35);
      assert.equal(layout.photoHeightMm, 45);

      for (const p of layout.placements) {
        assert.equal(p.widthMm, 35);
        assert.equal(p.heightMm, 45);
        // Verify pixel dimensions at 300 DPI: Math.round(35 / 25.4 * 300) = 413 px
        assert.equal(p.widthPx, Math.round((35 / MM_PER_INCH) * 300));
        assert.equal(p.heightPx, Math.round((45 / MM_PER_INCH) * 300));
      }
    });

    it('calculates 7 columns and 4 rows on A4 landscape (28 photo capacity)', () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'landscape',
          margins: { topMm: 6, bottomMm: 6, leftMm: 6, rightMm: 6, uniform: true },
          copies: 28,
        },
        standardDims
      );

      assert.equal(layout.maxColumns, 7);
      assert.equal(layout.maxRows, 4);
      assert.equal(layout.maxCapacity, 28);
    });
  });

  // =========================================================================
  // 5. REGRESSION & PARITY TEST SUITE
  // =========================================================================
  describe('5. Regression & Parity Verification', () => {
    it('respects custom quantity selection without forcing to sheet max capacity', () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          copies: 7, // User wants 7 photos on a 30-capacity sheet
        },
        { widthMm: 35, heightMm: 45 }
      );

      assert.equal(layout.requestedCopies, 7);
      assert.equal(layout.totalPhotos, 7);
      assert.equal(layout.placements.length, 7);
      assert.equal(layout.copiesExceedCapacity, false);
      // Row 0 has 5 photos, Row 1 has 2 photos
      assert.equal(layout.placements.filter((p) => p.row === 0).length, 5);
      assert.equal(layout.placements.filter((p) => p.row === 1).length, 2);
    });

    it('respects custom spacing settings (0 mm, 2 mm, 5 mm)', () => {
      for (const gap of [0, 2, 5]) {
        const layout = calculatePhotoSheetLayout(
          {
            ...DEFAULT_A4_SHEET_CONFIG,
            paperSize: 'a4',
            orientation: 'portrait',
            spacing: { horizontalMm: gap, verticalMm: gap, uniform: true },
            copies: 5,
          },
          { widthMm: 35, heightMm: 45 }
        );

        assert.equal(layout.isOverflowing, false);
        const actualHGap = layout.placements[1].xMm - (layout.placements[0].xMm + layout.placements[0].widthMm);
        assert.equal(Number(actualHGap.toFixed(3)), gap);
      }
    });

    it('respects custom dimensions (US Visa 50.8 × 50.8 mm)', () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          copies: 15,
        },
        { widthMm: 50.8, heightMm: 50.8 }
      );

      assert.equal(layout.maxColumns, 3);
      assert.equal(layout.maxRows, 5);
      assert.equal(layout.maxCapacity, 15);
      assert.equal(layout.totalPhotos, 15);
    });

    it('supports PDF export with identical layout and vector boundaries', async () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          copies: 5,
        },
        { widthMm: 35, heightMm: 45 }
      );

      const pdfResult = await exportMultiSheetAsPdf(
        [{ imageSource: null, layout, imageBytes: SAMPLE_JPEG_BYTES }],
        DEFAULT_A4_SHEET_CONFIG,
        { format: 'application/pdf', quality: 0.95 }
      );

      assert.equal(pdfResult.format, 'application/pdf');
      assert.equal(pdfResult.pageCount, 1);
      assert.equal(Number(pdfResult.pageWidthPt.toFixed(4)), SHEET_A4_SHORT_EDGE_PT);
      assert.equal(Number(pdfResult.pageHeightPt.toFixed(4)), SHEET_A4_LONG_EDGE_PT);
    });

    it('supports multi-page sheet pagination when requested copies exceed sheet capacity', () => {
      const config = {
        ...DEFAULT_A4_SHEET_CONFIG,
        paperSize: 'a4',
        orientation: 'portrait',
        margins: { topMm: 6, bottomMm: 6, leftMm: 6, rightMm: 6, uniform: true },
        spacing: { horizontalMm: 1.5, verticalMm: 1.5, uniform: true },
        copies: 35, // 35 copies exceeds 30 capacity
      };

      const baseLayout = calculatePhotoSheetLayout(config, { widthMm: 35, heightMm: 45 });
      assert.equal(baseLayout.maxCapacity, 30);
      assert.equal(baseLayout.copiesExceedCapacity, true);
      assert.equal(baseLayout.exceededByCount, 5);

      // Multi-sheet pagination calculation
      const maxCap = baseLayout.maxCapacity;
      const totalPages = Math.ceil(config.copies / maxCap);
      assert.equal(totalPages, 2);

      const page1Copies = Math.min(maxCap, config.copies);
      const page2Copies = config.copies - maxCap;
      assert.equal(page1Copies, 30);
      assert.equal(page2Copies, 5);

      const page1Layout = calculatePhotoSheetLayout({ ...config, copies: page1Copies }, { widthMm: 35, heightMm: 45 });
      const page2Layout = calculatePhotoSheetLayout({ ...config, copies: page2Copies }, { widthMm: 35, heightMm: 45 });

      assert.equal(page1Layout.totalPhotos, 30);
      assert.equal(page2Layout.totalPhotos, 5);
      assert.equal(page1Layout.totalPhotos + page2Layout.totalPhotos, 35);
    });
  });

  // =========================================================================
  // 6. FINE-TUNED POSITIONING, GAPS & MARGINS VERIFICATION
  // =========================================================================
  describe('6. Fine-Tuned Positioning, Gaps & Margins Verification', () => {
    const compactDims = { widthMm: 27.94, heightMm: 34.29 };

    it('4×6 portrait: photo grid starts strictly at TOP margin (3 mm) without vertical centering', () => {
      // 3 copies = 1 row. Previously this centered vertically at y ~ 59 mm.
      // Must now start at top margin ~ 3 mm.
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_PHOTO_SHEET_CONFIG,
          paperSize: '4x6',
          orientation: 'portrait',
          copies: 3,
        },
        compactDims
      );

      assert.equal(layout.totalPhotos, 3);
      assert.equal(layout.activeRows, 1);
      assert.equal(layout.activeColumns, 3);

      // Verify row 0 starts at top margin (3.0 mm), NOT centered vertically (~59 mm)
      assert.equal(layout.placements[0].yMm, 3.0);
      assert.equal(layout.placements[1].yMm, 3.0);
      assert.equal(layout.placements[2].yMm, 3.0);

      // Verify horizontal centering is preserved (101.6 - 89.22) / 2 = 6.19 mm
      const expectedLeftMargin = Number(((101.6 - (3 * 27.94 + 2 * 2.7)) / 2).toFixed(3));
      assert.equal(layout.placements[0].xMm, expectedLeftMargin);
      const rightMargin = Number((101.6 - (layout.placements[2].xMm + compactDims.widthMm)).toFixed(3));
      assert.equal(rightMargin, expectedLeftMargin);
    });

    it('4×6 portrait: applies competitor-measured targets (2.7 mm horiz gap, 2.8 mm vert gap, 3 mm margin)', () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_PHOTO_SHEET_CONFIG,
          paperSize: '4x6',
          orientation: 'portrait',
          copies: 12,
        },
        compactDims
      );

      assert.equal(layout.totalPhotos, 12);
      assert.equal(layout.maxColumns, 3);
      assert.equal(layout.maxRows, 4);

      // Verify horizontal gap between adjacent columns = 2.7 mm
      const gapX = Number((layout.placements[1].xMm - (layout.placements[0].xMm + compactDims.widthMm)).toFixed(3));
      assert.equal(gapX, 2.7);

      // Verify vertical gap between adjacent rows = 2.8 mm
      const gapY = Number((layout.placements[3].yMm - (layout.placements[0].yMm + compactDims.heightMm)).toFixed(3));
      assert.equal(gapY, 2.8);

      // Verify top margin = 3.0 mm
      assert.equal(layout.placements[0].yMm, 3.0);

      // Verify bottom margin is >= 3.0 mm (152.4 - (3.0 + 4 * 34.29 + 3 * 2.8) = 3.84 mm)
      const lastPhoto = layout.placements[11];
      const bottomMargin = Number((152.4 - (lastPhoto.yMm + compactDims.heightMm)).toFixed(3));
      assert.ok(bottomMargin >= 3.0, `Bottom margin ${bottomMargin} mm must be >= 3 mm`);
    });

    it('4×6 landscape: validates maximum valid capacity of 8 photos (4 cols × 2 rows) under physical bounds', () => {
      // Sheet: 152.4 × 101.6 mm.
      // Photo: 27.94 × 34.29 mm.
      // 3 rows height alone = 3 × 34.29 = 102.87 mm > 101.6 mm (sheet height).
      // Therefore, 15 photos (3 rows) is physically impossible without distortion/shrinking.
      // Max valid rows = 2, max valid cols = 4 -> max capacity = 8.
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_PHOTO_SHEET_CONFIG,
          paperSize: '4x6',
          orientation: 'landscape',
          copies: 15,
        },
        compactDims
      );

      assert.equal(layout.maxColumns, 4);
      assert.equal(layout.maxRows, 2);
      assert.equal(layout.maxCapacity, 8);
      assert.equal(layout.totalPhotos, 8);
      assert.equal(layout.copiesExceedCapacity, true);

      // Verify sensible distribution of remaining margins
      assert.ok(layout.placements[0].xMm >= 3.0);
      assert.ok(layout.placements[0].yMm >= 3.0);
    });

    it('A4 portrait: proves 7 columns physically requires <= 1.4 mm gap with 3 mm margins, and drops to 6 at 2.5 mm gap', () => {
      // At 2.5 mm gap with 3 mm margins:
      // 7 × 27.94 + 6 × 2.5 + 2 × 3.0 = 216.58 mm > 210 mm paper width.
      // Even with 0 margins: 7 × 27.94 + 6 × 2.5 = 210.58 mm > 210 mm.
      // Therefore, at 2.5 mm gap, max columns = 6.
      const layout2_5mm = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          spacing: { horizontalMm: 2.5, verticalMm: 2.5, uniform: true },
          margins: { topMm: 3.0, bottomMm: 3.0, leftMm: 3.0, rightMm: 3.0, uniform: true },
        },
        compactDims
      );
      assert.equal(layout2_5mm.maxColumns, 6, 'A4 cannot physically hold 7 columns with 2.5 mm gap');

      // At 1.5 mm gap with 2.5 mm margins:
      // 7 × 27.94 + 6 × 1.5 = 204.58 mm <= 205 mm available width.
      // 7 columns physically fit.
      const layout1_5mm = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          spacing: { horizontalMm: 1.5, verticalMm: 1.5, uniform: true },
          margins: { topMm: 5.0, bottomMm: 5.0, leftMm: 2.5, rightMm: 2.5, uniform: false },
        },
        compactDims
      );
      assert.equal(layout1_5mm.maxColumns, 7, 'A4 physically holds 7 columns with 1.5 mm gap');
      assert.equal(layout1_5mm.maxRows, 8);
      assert.equal(layout1_5mm.maxCapacity, 56);
    });

    it('A4 compact default: applies 27 mm × 32 mm (26.94 × 32.33 mm) with 2.6 mm / 2.8 mm spacing to fit exactly 56 photos (7 cols × 8 rows)', () => {
      const a4CompactDims = { widthMm: 26.94, heightMm: 32.33 };
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          copies: 56,
        },
        a4CompactDims
      );

      // Verify grid capacity and dimensions
      assert.equal(layout.maxColumns, 7);
      assert.equal(layout.maxRows, 8);
      assert.equal(layout.maxCapacity, 56);
      assert.equal(layout.totalPhotos, 56);
      assert.equal(layout.activeColumns, 7);
      assert.equal(layout.activeRows, 8);
      assert.equal(layout.isOverflowing, false);

      // Verify target pixel dimensions at 300 DPI
      assert.equal(layout.photoWidthPx, 318);
      assert.equal(layout.photoHeightPx, 382);

      // Verify margins and positioning
      assert.equal(layout.placements[0].yMm, 3.1);
      assert.equal(Number(layout.placements[0].xMm.toFixed(2)), 2.91);

      // Verify horizontal gap between col 0 and col 1 = 2.6 mm
      const gapX = Number((layout.placements[1].xMm - (layout.placements[0].xMm + a4CompactDims.widthMm)).toFixed(2));
      assert.equal(gapX, 2.6);

      // Verify vertical gap between row 0 and row 1 = 2.8 mm
      const gapY = Number((layout.placements[7].yMm - (layout.placements[0].yMm + a4CompactDims.heightMm)).toFixed(2));
      assert.equal(gapY, 2.8);

      // Verify strict 4x6 preservation remains intact when switching back
      const layout4x6 = calculatePhotoSheetLayout(
        {
          ...DEFAULT_PHOTO_SHEET_CONFIG,
          paperSize: '4x6',
          orientation: 'portrait',
          copies: 12,
        },
        compactDims
      );
      assert.equal(layout4x6.maxColumns, 3);
      assert.equal(layout4x6.maxRows, 4);
      assert.equal(layout4x6.totalPhotos, 12);
      assert.equal(layout4x6.placements[0].yMm, 3.0);
    });
  });
});
