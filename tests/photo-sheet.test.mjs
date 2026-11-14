import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';

// Import sheet calculator, constants, and types
import {
  calculateSheetDimensions,
  calculateMaxSheetCapacity,
  calculatePhotoSheetLayout,
  generateSheetFileName,
} from '../src/lib/photo-studio/sheet-calculator.ts';

import {
  SHEET_4X6_SHORT_EDGE_INCHES,
  SHEET_4X6_LONG_EDGE_INCHES,
  SHEET_4X6_SHORT_EDGE_MM,
  SHEET_4X6_LONG_EDGE_MM,
  SHEET_4X6_SHORT_EDGE_PT,
  SHEET_4X6_LONG_EDGE_PT,
  MM_PER_INCH,
  PDF_POINTS_PER_INCH,
  DEFAULT_PHOTO_SHEET_CONFIG,
  CUT_GUIDE_STYLES,
  SHEET_DPI_PRESETS,
} from '../src/constants/photo-sheet.ts';

import { releaseCanvasBuffer, revokeObjectUrlSafely } from '../src/lib/utils/memory.ts';

describe('PHASE 03D: 4×6 Inch Photo Sheet Generator Test Suite', () => {

  // 1. Sheet Dimensions & DPI Calculations (Landscape)
  describe('1. Landscape Sheet Dimensions across DPI presets', () => {
    it('calculates exact 900 × 600 pixels at 150 DPI', () => {
      const dims = calculateSheetDimensions('landscape', 150);
      assert.equal(dims.widthInches, 6.0);
      assert.equal(dims.heightInches, 4.0);
      assert.equal(dims.widthPx, 900);
      assert.equal(dims.heightPx, 600);
      assert.equal(dims.widthMm, 152.4);
      assert.equal(dims.heightMm, 101.6);
    });

    it('calculates exact 1200 × 800 pixels at 200 DPI', () => {
      const dims = calculateSheetDimensions('landscape', 200);
      assert.equal(dims.widthInches, 6.0);
      assert.equal(dims.heightInches, 4.0);
      assert.equal(dims.widthPx, 1200);
      assert.equal(dims.heightPx, 800);
    });

    it('calculates exact 1800 × 1200 pixels at 300 DPI (Lab Print Standard)', () => {
      const dims = calculateSheetDimensions('landscape', 300);
      assert.equal(dims.widthInches, 6.0);
      assert.equal(dims.heightInches, 4.0);
      assert.equal(dims.widthPx, 1800);
      assert.equal(dims.heightPx, 1200);
    });

    it('calculates exact 3600 × 2400 pixels at 600 DPI (Fine Art Ultra-High Resolution)', () => {
      const dims = calculateSheetDimensions('landscape', 600);
      assert.equal(dims.widthInches, 6.0);
      assert.equal(dims.heightInches, 4.0);
      assert.equal(dims.widthPx, 3600);
      assert.equal(dims.heightPx, 2400);
    });

    it('supports custom DPI within sensible limits', () => {
      const dims = calculateSheetDimensions('landscape', 240);
      assert.equal(dims.widthPx, Math.round(6.0 * 240)); // 1440
      assert.equal(dims.heightPx, Math.round(4.0 * 240)); // 960
    });
  });

  // 2. Portrait Sheet Dimensions
  describe('2. Portrait Sheet Dimensions across DPI presets', () => {
    it('calculates exact 600 × 900 pixels at 150 DPI in portrait mode', () => {
      const dims = calculateSheetDimensions('portrait', 150);
      assert.equal(dims.widthInches, 4.0);
      assert.equal(dims.heightInches, 6.0);
      assert.equal(dims.widthPx, 600);
      assert.equal(dims.heightPx, 900);
      assert.equal(dims.widthMm, 101.6);
      assert.equal(dims.heightMm, 152.4);
    });

    it('calculates exact 800 × 1200 pixels at 200 DPI in portrait mode', () => {
      const dims = calculateSheetDimensions('portrait', 200);
      assert.equal(dims.widthPx, 800);
      assert.equal(dims.heightPx, 1200);
    });

    it('calculates exact 1200 × 1800 pixels at 300 DPI in portrait mode', () => {
      const dims = calculateSheetDimensions('portrait', 300);
      assert.equal(dims.widthPx, 1200);
      assert.equal(dims.heightPx, 1800);
    });

    it('calculates exact 2400 × 3600 pixels at 600 DPI in portrait mode', () => {
      const dims = calculateSheetDimensions('portrait', 600);
      assert.equal(dims.widthPx, 2400);
      assert.equal(dims.heightPx, 3600);
    });

    it('guarantees landscape and portrait dimensions are never accidentally reversed', () => {
      const land = calculateSheetDimensions('landscape', 300);
      const port = calculateSheetDimensions('portrait', 300);

      assert.equal(land.widthPx, port.heightPx);
      assert.equal(land.heightPx, port.widthPx);
      assert.ok(land.widthPx > land.heightPx, 'Landscape width must exceed height');
      assert.ok(port.heightPx > port.widthPx, 'Portrait height must exceed width');
    });
  });

  // 3. Automatic Capacity Calculation
  describe('3. Automatic Capacity Calculation', () => {
    it('computes 8-photo capacity for 35 × 45 mm passport photo on 4×6 landscape with standard margins', () => {
      // 152.4 x 101.6 mm sheet
      // margins: left/right = 3mm, top/bottom = 3mm
      // spacing: h = 2mm, v = 2mm
      const { maxCols, maxRows, maxCapacity } = calculateMaxSheetCapacity(
        152.4,
        101.6,
        35,
        45,
        2,
        2,
        { topMm: 3, bottomMm: 3, leftMm: 3, rightMm: 3 }
      );

      // 4 cols: 4 * 35 + 3 * 2 = 146 mm <= 146.4 mm
      // 2 rows: 2 * 45 + 1 * 2 = 92 mm <= 95.6 mm
      assert.equal(maxCols, 4);
      assert.equal(maxRows, 2);
      assert.equal(maxCapacity, 8);
    });

    it('computes 6-photo capacity for 35 × 45 mm passport photo on 4×6 portrait', () => {
      // 101.6 x 152.4 mm sheet
      const { maxCols, maxRows, maxCapacity } = calculateMaxSheetCapacity(
        101.6,
        152.4,
        35,
        45,
        2,
        2,
        { topMm: 3, bottomMm: 3, leftMm: 3, rightMm: 3 }
      );

      // 2 cols: 2 * 35 + 1 * 2 = 72 mm <= 95.6 mm
      // 3 rows: 3 * 45 + 2 * 2 = 139 mm <= 146.4 mm
      assert.equal(maxCols, 2);
      assert.equal(maxRows, 3);
      assert.equal(maxCapacity, 6);
    });

    it('computes capacity for 2 × 2 inches (50.8 × 50.8 mm) US Visa photos', () => {
      const { maxCols, maxRows, maxCapacity } = calculateMaxSheetCapacity(
        152.4,
        101.6,
        50.8,
        50.8,
        2,
        2,
        { topMm: 3, bottomMm: 3, leftMm: 3, rightMm: 3 }
      );

      // 2 cols: 2 * 50.8 + 1 * 2 = 103.6 mm <= 146.4 mm
      // 1 row: 50.8 mm <= 95.6 mm (2 rows would need 103.6 mm > 95.6 mm)
      assert.equal(maxCols, 2);
      assert.equal(maxRows, 1);
      assert.equal(maxCapacity, 2);
    });

    it('returns zero capacity when photo dimensions exceed available sheet size', () => {
      const { maxCols, maxRows, maxCapacity } = calculateMaxSheetCapacity(
        152.4,
        101.6,
        160,
        120,
        0,
        0,
        { topMm: 0, bottomMm: 0, leftMm: 0, rightMm: 0 }
      );

      assert.equal(maxCols, 0);
      assert.equal(maxRows, 0);
      assert.equal(maxCapacity, 0);
    });
  });

  // 4. Multiple Photo Copies & Auto Layout Arrangement
  describe('4. Multiple Copies & Auto Layout Arrangement', () => {
    it('places multiple identical copies without exceeding max capacity', () => {
      const config = {
        ...DEFAULT_PHOTO_SHEET_CONFIG,
        copies: 6,
        layoutMode: 'auto',
      };

      const result = calculatePhotoSheetLayout(config, { widthMm: 35, heightMm: 45 });
      assert.equal(result.isOverflowing, false);
      assert.equal(result.totalPhotos, 6);
      assert.equal(result.placements.length, 6);
    });

    it('clamps requested copies to maximum sheet capacity', () => {
      const config = {
        ...DEFAULT_PHOTO_SHEET_CONFIG,
        copies: 20, // Exceeds capacity of 8
        layoutMode: 'auto',
      };

      const result = calculatePhotoSheetLayout(config, { widthMm: 35, heightMm: 45 });
      assert.equal(result.isOverflowing, false);
      assert.equal(result.totalPhotos, result.maxCapacity);
      assert.ok(result.totalPhotos <= result.maxCapacity);
    });

    it('places single copy correctly with center alignment', () => {
      const config = {
        ...DEFAULT_PHOTO_SHEET_CONFIG,
        orientation: 'landscape',
        paperWidthInches: SHEET_4X6_LONG_EDGE_INCHES,
        paperHeightInches: SHEET_4X6_SHORT_EDGE_INCHES,
        copies: 1,
        centerAlignment: true,
      };

      const result = calculatePhotoSheetLayout(config, { widthMm: 35, heightMm: 45 });
      assert.equal(result.placements.length, 1);

      const p = result.placements[0];
      // Expected centered X: (152.4 - 35) / 2 = 58.7 mm
      // Expected centered Y: (101.6 - 45) / 2 = 28.3 mm
      assert.ok(Math.abs(p.xMm - 58.7) < 0.1);
      assert.ok(Math.abs(p.yMm - 28.3) < 0.1);
    });
  });

  // 5. Custom Rows and Columns (Manual Mode)
  describe('5. Custom Rows and Columns (Manual Mode)', () => {
    it('arranges exact grid of 2 rows and 3 columns in manual mode', () => {
      const config = {
        ...DEFAULT_PHOTO_SHEET_CONFIG,
        orientation: 'landscape',
        paperWidthInches: SHEET_4X6_LONG_EDGE_INCHES,
        paperHeightInches: SHEET_4X6_SHORT_EDGE_INCHES,
        layoutMode: 'manual',
        manualCols: 3,
        manualRows: 2,
        copies: 6,
      };

      const result = calculatePhotoSheetLayout(config, { widthMm: 35, heightMm: 45 });
      assert.equal(result.isOverflowing, false);
      assert.equal(result.placements.length, 6);
      assert.equal(result.activeColumns, 3);
      assert.equal(result.activeRows, 2);

      // Verify row and column indices
      const cols = result.placements.map((p) => p.col);
      const rows = result.placements.map((p) => p.row);
      assert.deepEqual(cols, [0, 1, 2, 0, 1, 2]);
      assert.deepEqual(rows, [0, 0, 0, 1, 1, 1]);
    });
  });

  // 6. Margins & Offsets
  describe('6. Margins & Offsets', () => {
    it('respects custom asymmetric margins when center alignment is disabled', () => {
      const config = {
        ...DEFAULT_PHOTO_SHEET_CONFIG,
        centerAlignment: false,
        margins: {
          topMm: 10,
          bottomMm: 5,
          leftMm: 12,
          rightMm: 8,
          uniform: false,
        },
        copies: 1,
      };

      const result = calculatePhotoSheetLayout(config, { widthMm: 35, heightMm: 45 });
      assert.equal(result.placements.length, 1);
      assert.equal(result.placements[0].xMm, 12);
      assert.equal(result.placements[0].yMm, 10);
    });
  });

  // 7. Horizontal and Vertical Spacing
  describe('7. Horizontal and Vertical Spacing', () => {
    it('applies configured inter-photo spacing correctly between adjacent copies', () => {
      const config = {
        ...DEFAULT_PHOTO_SHEET_CONFIG,
        layoutMode: 'manual',
        manualCols: 2,
        manualRows: 1,
        copies: 2,
        centerAlignment: false,
        margins: { topMm: 5, bottomMm: 5, leftMm: 5, rightMm: 5, uniform: true },
        spacing: { horizontalMm: 6, verticalMm: 4, uniform: false },
      };

      const result = calculatePhotoSheetLayout(config, { widthMm: 35, heightMm: 45 });
      assert.equal(result.placements.length, 2);

      const p0 = result.placements[0];
      const p1 = result.placements[1];

      // p1.xMm should equal p0.xMm + photoWidth (35) + horizontalSpacing (6) = 5 + 35 + 6 = 46 mm
      assert.equal(p0.xMm, 5);
      assert.equal(p1.xMm, 46);
      assert.equal(p1.xMm - (p0.xMm + 35), 6);
    });
  });

  // 8. Overlap Prevention & Non-Collision Invariant
  describe('8. Overlap Prevention & Non-Collision Invariant', () => {
    it('guarantees that no two placed photos overlap each other', () => {
      const config = {
        ...DEFAULT_PHOTO_SHEET_CONFIG,
        copies: 8,
        layoutMode: 'auto',
      };

      const result = calculatePhotoSheetLayout(config, { widthMm: 35, heightMm: 45 });
      const { placements } = result;

      for (let i = 0; i < placements.length; i++) {
        for (let j = i + 1; j < placements.length; j++) {
          const a = placements[i];
          const b = placements[j];

          // Check for rectangular collision
          const noOverlap =
            a.xMm + a.widthMm <= b.xMm ||
            b.xMm + b.widthMm <= a.xMm ||
            a.yMm + a.heightMm <= b.yMm ||
            b.yMm + b.heightMm <= a.yMm;

          assert.ok(
            noOverlap,
            `Photo ${i} (${a.xMm}, ${a.yMm}) collides with photo ${j} (${b.xMm}, ${b.yMm})`
          );
        }
      }
    });

    it('detects overflow when manual grid exceeds sheet boundaries', () => {
      const config = {
        ...DEFAULT_PHOTO_SHEET_CONFIG,
        layoutMode: 'manual',
        manualCols: 5, // 5 * 35 = 175 mm > 152.4 mm
        manualRows: 2,
        copies: 10,
      };

      const result = calculatePhotoSheetLayout(config, { widthMm: 35, heightMm: 45 });
      assert.equal(result.isOverflowing, true);
      assert.ok(result.overflowReason?.includes('exceeding sheet width'));
    });
  });

  // 9. Cutting Guides Specification
  describe('9. Cutting Guides Configuration', () => {
    it('supports all 4 cutting guide styles', () => {
      const styles = CUT_GUIDE_STYLES.map((s) => s.id);
      assert.ok(styles.includes('corner_crop_marks'));
      assert.ok(styles.includes('dashed'));
      assert.ok(styles.includes('thin_solid'));
      assert.ok(styles.includes('none'));
    });

    it('allows toggling cutting guides in export options', () => {
      const configWithGuides = {
        ...DEFAULT_PHOTO_SHEET_CONFIG,
        cutGuides: {
          ...DEFAULT_PHOTO_SHEET_CONFIG.cutGuides,
          includeInExport: true,
        },
      };
      assert.equal(configWithGuides.cutGuides.includeInExport, true);

      const configWithoutGuides = {
        ...DEFAULT_PHOTO_SHEET_CONFIG,
        cutGuides: {
          ...DEFAULT_PHOTO_SHEET_CONFIG.cutGuides,
          includeInExport: false,
        },
      };
      assert.equal(configWithoutGuides.cutGuides.includeInExport, false);
    });
  });

  // 10. Photo Physical Size Accuracy
  describe('10. Photo Physical Size Accuracy', () => {
    it('preserves exact 35 × 45 mm physical photo dimensions at 300 DPI', () => {
      const config = { ...DEFAULT_PHOTO_SHEET_CONFIG, dpi: 300 };
      const result = calculatePhotoSheetLayout(config, { widthMm: 35, heightMm: 45 });

      // Expected photo pixel size at 300 DPI:
      // width: (35 / 25.4) * 300 = 413 px
      // height: (45 / 25.4) * 300 = 531 px
      assert.equal(result.photoWidthPx, 413);
      assert.equal(result.photoHeightPx, 531);

      // Verify each individual placement uses these exact pixel dimensions
      for (const p of result.placements) {
        assert.equal(p.widthPx, 413);
        assert.equal(p.heightPx, 531);
        assert.equal(p.widthMm, 35);
        assert.equal(p.heightMm, 45);
      }
    });

    it('preserves exact 2 × 2 inches (50.8 × 50.8 mm) photo dimensions at 300 DPI', () => {
      const config = { ...DEFAULT_PHOTO_SHEET_CONFIG, dpi: 300 };
      const result = calculatePhotoSheetLayout(config, { widthMm: 50.8, heightMm: 50.8 });

      // Expected pixel size: 600 x 600 px
      assert.equal(result.photoWidthPx, 600);
      assert.equal(result.photoHeightPx, 600);
    });
  });

  // 11. PDF Page Size Verification with pdf-lib
  describe('11. PDF Document Physical Page Size Verification', () => {
    it('generates landscape PDF measuring exactly 432 × 288 points (6 × 4 inches)', async () => {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([SHEET_4X6_LONG_EDGE_PT, SHEET_4X6_SHORT_EDGE_PT]);

      const { width, height } = page.getSize();
      assert.equal(width, 432); // 6 inches * 72 pt
      assert.equal(height, 288); // 4 inches * 72 pt

      // Verify physical inches
      const widthInches = width / PDF_POINTS_PER_INCH;
      const heightInches = height / PDF_POINTS_PER_INCH;
      assert.equal(widthInches, 6.0);
      assert.equal(heightInches, 4.0);

      const pdfBytes = await pdfDoc.save();
      assert.ok(pdfBytes.length > 0);

      // Re-load and verify from saved binary stream
      const loadedDoc = await PDFDocument.load(pdfBytes);
      const loadedPage = loadedDoc.getPage(0);
      assert.equal(loadedPage.getWidth(), 432);
      assert.equal(loadedPage.getHeight(), 288);
    });

    it('generates portrait PDF measuring exactly 288 × 432 points (4 × 6 inches)', async () => {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([SHEET_4X6_SHORT_EDGE_PT, SHEET_4X6_LONG_EDGE_PT]);

      const { width, height } = page.getSize();
      assert.equal(width, 288);
      assert.equal(height, 432);

      const widthInches = width / PDF_POINTS_PER_INCH;
      const heightInches = height / PDF_POINTS_PER_INCH;
      assert.equal(widthInches, 4.0);
      assert.equal(heightInches, 6.0);
    });
  });

  // 12. Filename Generation
  describe('12. Standardized Semantic Filenames', () => {
    it('generates correct filename for landscape 300 DPI PDF', () => {
      const fn = generateSheetFileName('landscape', 300, 'pdf');
      assert.ok(fn.startsWith('photo-sheet-4x6-landscape-300dpi-'));
      assert.ok(fn.endsWith('.pdf'));
    });

    it('generates correct filename for portrait 600 DPI PNG', () => {
      const fn = generateSheetFileName('portrait', 600, 'png');
      assert.ok(fn.startsWith('photo-sheet-4x6-portrait-600dpi-'));
      assert.ok(fn.endsWith('.png'));
    });

    it('generates correct filename for JPEG export', () => {
      const fn = generateSheetFileName('landscape', 300, 'jpeg');
      assert.ok(fn.startsWith('photo-sheet-4x6-landscape-300dpi-'));
      assert.ok(fn.endsWith('.jpg'));
    });
  });

  // 13. Resource Cleanup & Memory Safety
  describe('13. Resource Cleanup & Memory Safety', () => {
    it('releases mock canvas buffer cleanly', () => {
      const mockCanvas = {
        width: 1800,
        height: 1200,
        getContext: () => ({
          clearRect: () => {},
        }),
      };

      releaseCanvasBuffer(mockCanvas);
      assert.equal(mockCanvas.width, 0);
      assert.equal(mockCanvas.height, 0);
    });

    it('revokes ephemeral object URLs safely', () => {
      assert.doesNotThrow(() => {
        revokeObjectUrlSafely('blob:http://localhost/test-uuid');
        revokeObjectUrlSafely('');
      });
    });
  });
});
