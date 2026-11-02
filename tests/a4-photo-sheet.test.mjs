import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';

// Import sheet calculator, constants, types, and renderer
import {
  calculateSheetDimensions,
  calculateMaxSheetCapacity,
  calculatePhotoSheetLayout,
  generateSheetFileName,
} from '../src/lib/photo-studio/sheet-calculator.ts';

import {
  SHEET_A4_SHORT_EDGE_MM,
  SHEET_A4_LONG_EDGE_MM,
  SHEET_A4_SHORT_EDGE_INCHES,
  SHEET_A4_LONG_EDGE_INCHES,
  SHEET_A4_SHORT_EDGE_PT,
  SHEET_A4_LONG_EDGE_PT,
  SHEET_4X6_SHORT_EDGE_INCHES,
  SHEET_4X6_LONG_EDGE_INCHES,
  MM_PER_INCH,
  PDF_POINTS_PER_INCH,
  DEFAULT_A4_SHEET_CONFIG,
  DEFAULT_PHOTO_SHEET_CONFIG,
  DEFAULT_A4_SHEET_SPACING,
  DEFAULT_4X6_SHEET_SPACING,
  MAX_A4_COLUMNS,
  SHEET_DPI_PRESETS,
  CUT_GUIDE_STYLES,
} from '../src/constants/photo-sheet.ts';

import { releaseCanvasBuffer, revokeObjectUrlSafely } from '../src/lib/utils/memory.ts';

describe('BUG FIX VERIFICATION: A4 Photo Sheet Grid Layout & Spacing Test Suite', () => {

  // =========================================================================
  // CASE 1: Four photographs in one row
  // =========================================================================
  describe('Case 1: Four photographs in one row', () => {
    it('places exactly 4 photographs in a single top-aligned row across 4 columns', () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          copies: 4,
          margins: { topMm: 6, bottomMm: 6, leftMm: 6, rightMm: 6, uniform: true },
          spacing: { horizontalMm: 1.5, verticalMm: 1.5, uniform: true },
        },
        { widthMm: 35, heightMm: 45 }
      );

      assert.equal(layout.totalPhotos, 4);
      assert.equal(layout.activeColumns, 4);
      assert.equal(layout.activeRows, 1);
      assert.equal(layout.placements.length, 4);

      // Verify all 4 photos are in row 0
      for (let i = 0; i < 4; i++) {
        const p = layout.placements[i];
        assert.equal(p.row, 0, `Photo ${i} must be in row 0`);
        assert.equal(p.col, i, `Photo ${i} must be in column ${i}`);
        assert.equal(p.yMm, 6.0, `Photo ${i} Y coordinate must match top margin`);
        const expectedX = 6.0 + i * (35.0 + 1.5);
        assert.equal(p.xMm, expectedX, `Photo ${i} X coordinate must equal left margin + col * (width + spacing)`);
      }
    });
  });

  // =========================================================================
  // CASE 2: Eight photographs in two rows
  // =========================================================================
  describe('Case 2: Eight photographs in two rows', () => {
    it('places exactly 8 photographs in two complete rows of 4 columns each', () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          copies: 8,
          margins: { topMm: 6, bottomMm: 6, leftMm: 6, rightMm: 6, uniform: true },
          spacing: { horizontalMm: 1.5, verticalMm: 1.5, uniform: true },
        },
        { widthMm: 35, heightMm: 45 }
      );

      assert.equal(layout.totalPhotos, 8);
      assert.equal(layout.activeColumns, 4);
      assert.equal(layout.activeRows, 2);
      assert.equal(layout.placements.length, 8);

      // Row 1: Photos 0..3
      for (let i = 0; i < 4; i++) {
        const p = layout.placements[i];
        assert.equal(p.row, 0);
        assert.equal(p.col, i);
        assert.equal(p.yMm, 6.0);
      }

      // Row 2: Photos 4..7
      const expectedRow1Y = 6.0 + 45.0 + 1.5; // 52.5 mm
      for (let i = 4; i < 8; i++) {
        const p = layout.placements[i];
        const col = i - 4;
        assert.equal(p.row, 1);
        assert.equal(p.col, col);
        assert.equal(p.yMm, expectedRow1Y);
        // Column alignment: Photo 4 must align horizontally with Photo 0, Photo 5 with Photo 1, etc.
        assert.equal(p.xMm, layout.placements[col].xMm);
      }
    });
  });

  // =========================================================================
  // CASE 3: Six photographs in two rows
  // =========================================================================
  describe('Case 3: Six photographs in two rows', () => {
    it('places 4 photos in Row 1 and 2 photos in Row 2 without stretching the incomplete row', () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          copies: 6,
          margins: { topMm: 6, bottomMm: 6, leftMm: 6, rightMm: 6, uniform: true },
          spacing: { horizontalMm: 1.5, verticalMm: 1.5, uniform: true },
        },
        { widthMm: 35, heightMm: 45 }
      );

      assert.equal(layout.totalPhotos, 6);
      assert.equal(layout.activeColumns, 4);
      assert.equal(layout.activeRows, 2);
      assert.equal(layout.placements.length, 6);

      // Row 1: Photos 0, 1, 2, 3
      assert.deepEqual(
        layout.placements.slice(0, 4).map((p) => ({ row: p.row, col: p.col })),
        [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
        ]
      );

      // Row 2: Photos 4, 5 (col 0 and col 1)
      assert.deepEqual(
        layout.placements.slice(4, 6).map((p) => ({ row: p.row, col: p.col })),
        [
          { row: 1, col: 0 },
          { row: 1, col: 1 },
        ]
      );

      // Verify incomplete row does NOT stretch across the page:
      // Photo 4 is at same X as Photo 0
      assert.equal(layout.placements[4].xMm, layout.placements[0].xMm);
      // Photo 5 is at same X as Photo 1
      assert.equal(layout.placements[5].xMm, layout.placements[1].xMm);
      // Inter-photo horizontal spacing between Photo 4 and Photo 5 is strictly 1.5 mm
      const gap = layout.placements[5].xMm - (layout.placements[4].xMm + layout.placements[4].widthMm);
      assert.equal(Number(gap.toFixed(3)), 1.5);
    });
  });

  // =========================================================================
  // CASE 4: Maximum four-column enforcement
  // =========================================================================
  describe('Case 4: Maximum four-column enforcement', () => {
    it('never renders 5 or more photos in a single row even when sheet width permits', () => {
      // 35mm photos on A4 portrait (198mm available width can physically hold 5 columns)
      const layoutPortrait = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          copies: 24,
        },
        { widthMm: 35, heightMm: 45 }
      );

      assert.equal(layoutPortrait.maxColumns, 4);
      assert.ok(layoutPortrait.activeColumns <= 4);
      for (const p of layoutPortrait.placements) {
        assert.ok(p.col <= 3, `Column index ${p.col} must not exceed 3 (max 4 columns)`);
      }

      // Small 20mm stamp photos on A4 portrait (198mm available can physically hold 9 columns)
      const layoutStamps = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          copies: 20,
        },
        { widthMm: 20, heightMm: 25 }
      );

      assert.equal(layoutStamps.maxColumns, 4);
      assert.ok(layoutStamps.activeColumns <= 4);
      for (const p of layoutStamps.placements) {
        assert.ok(p.col <= 3, `Stamp column index ${p.col} must not exceed 3`);
      }

      // 35mm photos on A4 landscape (285mm available can physically hold 7 columns)
      const layoutLandscape = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'landscape',
          copies: 16,
        },
        { widthMm: 35, heightMm: 45 }
      );

      assert.equal(layoutLandscape.maxColumns, 4);
      assert.ok(layoutLandscape.activeColumns <= 4);
      for (const p of layoutLandscape.placements) {
        assert.ok(p.col <= 3, `Landscape column index ${p.col} must not exceed 3`);
      }
    });

    it('enforces maximum 4 columns in manual mode even if user inputs more', () => {
      const layoutManual = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          layoutMode: 'manual',
          manualCols: 8, // Request 8 columns
          manualRows: 3,
          copies: 12,
        },
        { widthMm: 35, heightMm: 45 }
      );

      assert.equal(layoutManual.activeColumns, 4);
      for (const p of layoutManual.placements) {
        assert.ok(p.col <= 3);
      }
    });
  });

  // =========================================================================
  // CASE 5: Top margin preservation (No unwanted vertical centering)
  // =========================================================================
  describe('Case 5: Top margin preservation', () => {
    it('strictly aligns grid to top margin without vertically centering or distributing rows', () => {
      const marginsList = [6.0, 10.0, 15.0, 20.0];

      for (const topMargin of marginsList) {
        const layout = calculatePhotoSheetLayout(
          {
            ...DEFAULT_A4_SHEET_CONFIG,
            paperSize: 'a4',
            orientation: 'portrait',
            copies: 4, // Just 1 row of photos! Must NOT float in the center of the sheet
            centerAlignment: true, // Even if config has centerAlignment=true, A4 must NEVER vertically center
            margins: { topMm: topMargin, bottomMm: 6, leftMm: 6, rightMm: 6, uniform: false },
            spacing: { horizontalMm: 1.5, verticalMm: 1.5, uniform: true },
          },
          { widthMm: 35, heightMm: 45 }
        );

        assert.equal(layout.effectiveMarginTopMm, topMargin);
        assert.equal(layout.placements[0].yMm, topMargin);
      }
    });

    it('uses consistent vertical positioning for every subsequent row, growing downward', () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          copies: 12, // 3 rows of 4
          margins: { topMm: 8, bottomMm: 8, leftMm: 8, rightMm: 8, uniform: true },
          spacing: { horizontalMm: 1.5, verticalMm: 2.5, uniform: false },
        },
        { widthMm: 35, heightMm: 45 }
      );

      const photoH = 45.0;
      const vGap = 2.5;
      const topMargin = 8.0;

      // Row 0: y = 8.0
      assert.equal(layout.placements[0].yMm, topMargin);
      // Row 1: y = 8.0 + 45.0 + 2.5 = 55.5
      assert.equal(layout.placements[4].yMm, topMargin + photoH + vGap);
      // Row 2: y = 8.0 + 2 * (45.0 + 2.5) = 103.0
      assert.equal(layout.placements[8].yMm, topMargin + 2 * (photoH + vGap));
    });
  });

  // =========================================================================
  // CASE 6: Minimum horizontal spacing
  // =========================================================================
  describe('Case 6: Minimum horizontal spacing', () => {
    it('applies default 1.5 mm horizontal spacing between adjacent photos', () => {
      const layout = calculatePhotoSheetLayout(
        DEFAULT_A4_SHEET_CONFIG,
        { widthMm: 35, heightMm: 45 }
      );

      const p0 = layout.placements[0];
      const p1 = layout.placements[1];
      const hGap = p1.xMm - (p0.xMm + p0.widthMm);
      assert.equal(Number(hGap.toFixed(3)), 1.5);
    });

    it('allows reducing horizontal spacing down to 0 mm without photo overlap', () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          copies: 4,
          spacing: { horizontalMm: 0, verticalMm: 1.5, uniform: false },
        },
        { widthMm: 35, heightMm: 45 }
      );

      const p0 = layout.placements[0];
      const p1 = layout.placements[1];
      assert.equal(p1.xMm, p0.xMm + p0.widthMm); // Edge to edge, exactly 0 gap
      assert.ok(p0.xMm + p0.widthMm <= p1.xMm); // No overlap
    });

    it('supports intermediate custom horizontal spacing values (0.5 mm, 1.0 mm)', () => {
      for (const gap of [0.5, 1.0, 2.0, 3.5]) {
        const layout = calculatePhotoSheetLayout(
          {
            ...DEFAULT_A4_SHEET_CONFIG,
            paperSize: 'a4',
            spacing: { horizontalMm: gap, verticalMm: 1.5, uniform: false },
            copies: 4,
          },
          { widthMm: 35, heightMm: 45 }
        );
        const actualGap = layout.placements[1].xMm - (layout.placements[0].xMm + layout.placements[0].widthMm);
        assert.equal(Number(actualGap.toFixed(3)), gap);
      }
    });
  });

  // =========================================================================
  // CASE 7: Minimum vertical spacing
  // =========================================================================
  describe('Case 7: Minimum vertical spacing', () => {
    it('applies default 1.5 mm vertical spacing between consecutive rows', () => {
      const layout = calculatePhotoSheetLayout(
        DEFAULT_A4_SHEET_CONFIG,
        { widthMm: 35, heightMm: 45 }
      );

      const pRow0 = layout.placements[0];
      const pRow1 = layout.placements[4];
      const vGap = pRow1.yMm - (pRow0.yMm + pRow0.heightMm);
      assert.equal(Number(vGap.toFixed(3)), 1.5);
    });

    it('allows reducing vertical spacing down to 0 mm without row overlap', () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          copies: 8,
          spacing: { horizontalMm: 1.5, verticalMm: 0, uniform: false },
        },
        { widthMm: 35, heightMm: 45 }
      );

      const pRow0 = layout.placements[0];
      const pRow1 = layout.placements[4];
      assert.equal(pRow1.yMm, pRow0.yMm + pRow0.heightMm);
      assert.ok(pRow0.yMm + pRow0.heightMm <= pRow1.yMm); // No overlap
    });
  });

  // =========================================================================
  // CASE 8: A4 portrait
  // =========================================================================
  describe('Case 8: A4 portrait geometry and arrangement', () => {
    it('calculates accurate portrait dimensions (210 × 297 mm, 2480 × 3508 px at 300 DPI, 24 photo capacity)', () => {
      const dims = calculateSheetDimensions('portrait', 300, 'a4');
      assert.equal(dims.widthMm, 210.0);
      assert.equal(dims.heightMm, 297.0);
      assert.equal(dims.widthPx, 2480);
      assert.equal(dims.heightPx, 3508);
      assert.equal(Number(dims.pageWidthPt.toFixed(4)), 595.2756);
      assert.equal(Number(dims.pageHeightPt.toFixed(4)), 841.8898);

      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
        },
        { widthMm: 35, heightMm: 45 }
      );

      assert.equal(layout.maxColumns, 4);
      assert.equal(layout.maxRows, 6);
      assert.equal(layout.maxCapacity, 24);
      assert.equal(layout.effectiveMarginLeftMm, 6.0);
      assert.equal(layout.effectiveMarginTopMm, 6.0);
    });
  });

  // =========================================================================
  // CASE 9: A4 landscape
  // =========================================================================
  describe('Case 9: A4 landscape geometry and arrangement', () => {
    it('calculates accurate landscape dimensions (297 × 210 mm, 3508 × 2480 px at 300 DPI, 16 photo capacity)', () => {
      const dims = calculateSheetDimensions('landscape', 300, 'a4');
      assert.equal(dims.widthMm, 297.0);
      assert.equal(dims.heightMm, 210.0);
      assert.equal(dims.widthPx, 3508);
      assert.equal(dims.heightPx, 2480);
      assert.equal(Number(dims.pageWidthPt.toFixed(4)), 841.8898);
      assert.equal(Number(dims.pageHeightPt.toFixed(4)), 595.2756);

      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'landscape',
          copies: 16,
        },
        { widthMm: 35, heightMm: 45 }
      );

      assert.equal(layout.maxColumns, 4);
      assert.equal(layout.maxRows, 4);
      assert.equal(layout.maxCapacity, 16);
      assert.equal(layout.totalPhotos, 16);
      assert.equal(layout.effectiveMarginLeftMm, 6.0);
      assert.equal(layout.effectiveMarginTopMm, 6.0);
    });
  });

  // =========================================================================
  // CASE 10: Custom photo dimensions
  // =========================================================================
  describe('Case 10: Custom photo dimensions', () => {
    it('correctly calculates layout for 50.8 × 50.8 mm US Visa photos (3 cols × 5 rows = 15)', () => {
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
      assert.equal(layout.activeColumns, 3);
      assert.equal(layout.activeRows, 5);
    });

    it('correctly calculates layout for 40 × 50 mm photos (4 cols × 5 rows = 20)', () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          copies: 20,
        },
        { widthMm: 40, heightMm: 50 }
      );

      assert.equal(layout.maxColumns, 4);
      assert.equal(layout.maxRows, 5);
      assert.equal(layout.maxCapacity, 20);
    });

    it('enforces max 4 columns for small 25 × 25 mm photos', () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          copies: 16,
        },
        { widthMm: 25, heightMm: 25 }
      );

      assert.equal(layout.maxColumns, 4);
    });
  });

  // =========================================================================
  // CASE 11: Capacity calculation
  // =========================================================================
  describe('Case 11: Capacity calculation and warning', () => {
    it('implements min(4, floor((availW + gap) / (photoW + gap))) and floor((availH + gap) / (photoH + gap))', () => {
      const { maxCols, maxRows, maxCapacity } = calculateMaxSheetCapacity(
        210.0,
        297.0,
        35.0,
        45.0,
        1.5,
        1.5,
        { topMm: 6, bottomMm: 6, leftMm: 6, rightMm: 6 }
      );

      // availableWidth = 210 - 12 = 198 mm -> floor((198 + 1.5) / 36.5) = floor(199.5 / 36.5) = 5 -> min(4, 5) = 4
      assert.equal(maxCols, 4);
      // availableHeight = 297 - 12 = 285 mm -> floor((285 + 1.5) / 46.5) = floor(286.5 / 46.5) = 6
      assert.equal(maxRows, 6);
      assert.equal(maxCapacity, 24);
    });

    it('warns clearly and never silently discards requested copies when count exceeds capacity', () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          copies: 40, // 40 requested, but capacity is 24
        },
        { widthMm: 35, heightMm: 45 }
      );

      assert.equal(layout.requestedCopies, 40);
      assert.equal(layout.maxCapacity, 24);
      assert.equal(layout.totalPhotos, 24);
      assert.equal(layout.copiesExceedCapacity, true);
      assert.equal(layout.exceededByCount, 16);
      assert.ok(layout.capacityWarningMessage?.includes('Requested copy count (40) exceeds maximum sheet capacity (24 photos)'));
    });
  });

  // =========================================================================
  // CASE 12: PNG export positioning
  // =========================================================================
  describe('Case 12: PNG export positioning', () => {
    it('produces exact pixel coordinates corresponding to physical layout placements', () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          dpi: 300,
          copies: 8,
        },
        { widthMm: 35, heightMm: 45 }
      );

      // Verify pixel canvas
      assert.equal(layout.sheetWidthPx, 2480);
      assert.equal(layout.sheetHeightPx, 3508);

      // Verify each placement's xPx and yPx strictly equal Math.round((mm / 25.4) * DPI)
      for (const p of layout.placements) {
        assert.equal(p.xPx, Math.round((p.xMm / MM_PER_INCH) * 300));
        assert.equal(p.yPx, Math.round((p.yMm / MM_PER_INCH) * 300));
        assert.equal(p.widthPx, Math.round((35.0 / MM_PER_INCH) * 300));
        assert.equal(p.heightPx, Math.round((45.0 / MM_PER_INCH) * 300));
      }
    });
  });

  // =========================================================================
  // CASE 13: JPEG export positioning
  // =========================================================================
  describe('Case 13: JPEG export positioning', () => {
    it('generates consistent dimensions, placements and file naming for JPEG export', () => {
      const fn = generateSheetFileName('portrait', 300, 'jpeg', 'a4');
      assert.ok(fn.startsWith('photo-sheet-a4-portrait-300dpi-'));
      assert.ok(fn.endsWith('.jpg'));

      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          dpi: 300,
          copies: 6,
        },
        { widthMm: 35, heightMm: 45 }
      );

      // Placements in JPEG use exact same layout coordinates
      assert.equal(layout.placements.length, 6);
      assert.equal(layout.placements[0].xPx, Math.round((6.0 / MM_PER_INCH) * 300));
      assert.equal(layout.placements[0].yPx, Math.round((6.0 / MM_PER_INCH) * 300));
    });
  });

  // =========================================================================
  // CASE 14: PDF export positioning
  // =========================================================================
  describe('Case 14: PDF export positioning', () => {
    it('sets exact physical A4 page dimensions in PDF points (595.2756 × 841.8898 pt)', async () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          dpi: 300,
        },
        { widthMm: 35, heightMm: 45 }
      );

      assert.equal(layout.pageWidthPt, SHEET_A4_SHORT_EDGE_PT);
      assert.equal(layout.pageHeightPt, SHEET_A4_LONG_EDGE_PT);

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([layout.pageWidthPt, layout.pageHeightPt]);

      assert.equal(Number(page.getWidth().toFixed(4)), 595.2756);
      assert.equal(Number(page.getHeight().toFixed(4)), 841.8898);

      const pdfBytes = await pdfDoc.save();
      assert.ok(pdfBytes.length > 0);
    });
  });

  // =========================================================================
  // CASE 15: Preview versus exported layout comparison
  // =========================================================================
  describe('Case 15: Preview versus exported layout comparison', () => {
    it('guarantees identical geometric proportions between scaled preview and master export', () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          copies: 8,
        },
        { widthMm: 35, heightMm: 45 }
      );

      const maxPreviewWidth = 720;
      const previewScale = maxPreviewWidth / layout.sheetWidthPx;

      for (const p of layout.placements) {
        // Master export relative coordinates
        const masterRelX = p.xPx / layout.sheetWidthPx;
        const masterRelY = p.yPx / layout.sheetHeightPx;

        // Preview downscaled coordinates
        const previewX = Math.round(p.xPx * previewScale);
        const previewY = Math.round(p.yPx * previewScale);
        const previewW = Math.round(p.widthPx * previewScale);
        const previewH = Math.round(p.heightPx * previewScale);

        const previewRelX = previewX / maxPreviewWidth;

        // Verify mathematical divergence is within 1 subpixel precision
        assert.ok(
          Math.abs(masterRelX - previewRelX) < 0.002,
          `Preview X ratio (${previewRelX}) must match master ratio (${masterRelX})`
        );
        assert.ok(previewW > 0 && previewH > 0);
      }
    });
  });

  // =========================================================================
  // ADDITIONAL COMPREHENSIVE TESTS: DPI, Overlap Invariant, Guides, Memory
  // =========================================================================
  describe('16. DPI Presets & Boundary Validation', () => {
    it('calculates exact 1240 × 1754 pixels at 150 DPI', () => {
      const dims = calculateSheetDimensions('portrait', 150, 'a4');
      assert.equal(dims.widthPx, 1240);
      assert.equal(dims.heightPx, 1754);
    });

    it('calculates exact 4961 × 7016 pixels at 600 DPI', () => {
      const dims = calculateSheetDimensions('portrait', 600, 'a4');
      assert.equal(dims.widthPx, 4961);
      assert.equal(dims.heightPx, 7016);
    });

    it('clamps DPI below 30 to safe minimum and above 2400 to safe maximum', () => {
      const dimsMin = calculateSheetDimensions('portrait', 10, 'a4');
      assert.equal(dimsMin.widthPx, Math.round((210.0 / MM_PER_INCH) * 30));

      const dimsMax = calculateSheetDimensions('portrait', 5000, 'a4');
      assert.equal(dimsMax.widthPx, Math.round((210.0 / MM_PER_INCH) * 2400));
    });
  });

  describe('17. Overlap Prevention & Boundary Invariant', () => {
    it('guarantees that no two placed photos collide or overlap', () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          copies: 24,
        },
        { widthMm: 35, heightMm: 45 }
      );

      const placements = layout.placements;
      for (let i = 0; i < placements.length; i++) {
        for (let j = i + 1; j < placements.length; j++) {
          const a = placements[i];
          const b = placements[j];

          const separatedHorizontally =
            a.xMm + a.widthMm <= b.xMm + 0.001 || b.xMm + b.widthMm <= a.xMm + 0.001;
          const separatedVertically =
            a.yMm + a.heightMm <= b.yMm + 0.001 || b.yMm + b.heightMm <= a.yMm + 0.001;

          assert.ok(
            separatedHorizontally || separatedVertically,
            `Photo ${i} and Photo ${j} must not overlap!`
          );
        }
      }
    });

    it('guarantees all photos remain strictly inside A4 sheet boundaries', () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          copies: 24,
        },
        { widthMm: 35, heightMm: 45 }
      );

      for (const p of layout.placements) {
        assert.ok(p.xMm >= 0, 'Photo X must not be negative');
        assert.ok(p.yMm >= 0, 'Photo Y must not be negative');
        assert.ok(p.xMm + p.widthMm <= 210.01, 'Photo must not exceed 210 mm width');
        assert.ok(p.yMm + p.heightMm <= 297.01, 'Photo must not exceed 297 mm height');
      }
    });
  });

  describe('18. Comparative Analysis: A4 vs 4×6 Unified Core Engine', () => {
    it('verifies both A4 and 4×6 operate under unified sheet capacity engine with strict limits', () => {
      const cap4x6 = calculateMaxSheetCapacity(152.4, 101.6, 35, 45, 2, 2, { topMm: 3, bottomMm: 3, leftMm: 3, rightMm: 3 });
      const capA4 = calculateMaxSheetCapacity(210.0, 297.0, 35, 45, 1.5, 1.5, { topMm: 6, bottomMm: 6, leftMm: 6, rightMm: 6 });

      assert.equal(cap4x6.maxCapacity, 8); // 4 cols × 2 rows = 8 photos on 4x6
      assert.equal(capA4.maxCapacity, 24); // 4 cols × 6 rows = 24 photos on A4
      assert.ok(capA4.maxCapacity > cap4x6.maxCapacity);
    });

    it('preserves center alignment support for 4x6 while keeping A4 top-left aligned', () => {
      const layout4x6 = calculatePhotoSheetLayout(
        { ...DEFAULT_PHOTO_SHEET_CONFIG, paperSize: '4x6', centerAlignment: true, copies: 1 },
        { widthMm: 35, heightMm: 45 }
      );
      const layoutA4 = calculatePhotoSheetLayout(
        { ...DEFAULT_A4_SHEET_CONFIG, paperSize: 'a4', copies: 1 },
        { widthMm: 35, heightMm: 45 }
      );

      // 4x6 centers the photo
      assert.ok(Math.abs(layout4x6.placements[0].xMm - 58.7) < 0.1);
      assert.ok(Math.abs(layout4x6.placements[0].yMm - 28.3) < 0.1);

      // A4 stays strictly top-left aligned at margin
      assert.equal(layoutA4.placements[0].xMm, 6.0);
      assert.equal(layoutA4.placements[0].yMm, 6.0);
    });
  });

  describe('19. High-DPI Large Canvas Memory Management', () => {
    it('verifies clean memory buffer release for high-DPI canvases', () => {
      const mockCanvas = {
        width: 4961,
        height: 7016,
        getContext: () => ({ clearRect: () => {} }),
      };

      releaseCanvasBuffer(mockCanvas);
      assert.equal(mockCanvas.width, 0);
      assert.equal(mockCanvas.height, 0);
    });
  });
});
