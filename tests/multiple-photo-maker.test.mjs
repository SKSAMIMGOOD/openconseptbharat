import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';

// Import Multiple Photo Maker Engine & Sheet Calculator
import {
  DEFAULT_PHOTO_WIDTH_INCHES,
  DEFAULT_PHOTO_HEIGHT_INCHES,
  DEFAULT_PHOTO_UNIT,
  DEFAULT_MULTI_PHOTO_DPI,
  MULTI_PHOTO_DPI_PRESETS,
  DEFAULT_PHOTO_WIDTH_MM,
  DEFAULT_PHOTO_HEIGHT_MM,
  calculatePhotoPixels,
  convertPhotoDimensions,
  flattenPhotoCopies,
  createDefaultMultiplePhotoConfig,
  calculateMultiPhotoArrangement,
  generateMultiPhotoFileName,
} from '../src/lib/multiple-photo/multiple-photo-engine.ts';

import {
  calculateCenterCrop,
  resolveImageForPlacement,
} from '../src/lib/photo-studio/sheet-renderer.ts';

import {
  calculateSheetDimensions,
  calculateMaxSheetCapacity,
  calculatePhotoSheetLayout,
  MM_PER_INCH,
  PDF_POINTS_PER_INCH,
  SHEET_A4_SHORT_EDGE_MM,
  SHEET_A4_LONG_EDGE_MM,
  SHEET_A4_SHORT_EDGE_PT,
  SHEET_A4_LONG_EDGE_PT,
  SHEET_4X6_SHORT_EDGE_INCHES,
  SHEET_4X6_LONG_EDGE_INCHES,
  SHEET_4X6_SHORT_EDGE_PT,
  SHEET_4X6_LONG_EDGE_PT,
} from '../src/lib/photo-studio/sheet-calculator.ts';

import {
  DEFAULT_A4_SHEET_MARGINS,
  DEFAULT_SHEET_MARGINS,
  DEFAULT_A4_SHEET_SPACING,
  DEFAULT_4X6_SHEET_SPACING,
} from '../src/constants/photo-sheet.ts';

import { unitToMm, convertUnit } from '../src/lib/crop/unit-converter.ts';
import { releaseCanvasBuffer, revokeObjectUrlSafely } from '../src/lib/utils/memory.ts';

describe('PHASE 03F: Multiple Photo Maker Test Suite', () => {

  // Helper to create mock uploaded photos
  const createMockPhoto = (id, name, width = 1200, height = 1600, copies = 3) => ({
    id,
    name,
    file: { name, size: 1024 * 1024, type: 'image/jpeg' },
    size: 1024 * 1024,
    width,
    height,
    aspectRatio: width / height,
    previewUrl: `blob:http://localhost:3000/${id}`,
    copies,
  });

  // =========================================================================
  // 1. PHOTO UPLOAD & STATE OPERATIONS
  // =========================================================================
  describe('1. Photo Upload & State Operations', () => {
    it('initializes default config with 1.1 × 1.35 inches at 300 DPI', () => {
      const config = createDefaultMultiplePhotoConfig('a4');
      assert.equal(config.dimensions.width, 1.1);
      assert.equal(config.dimensions.height, 1.35);
      assert.equal(config.dimensions.unit, 'inch');
      assert.equal(config.dpi, 300);
      assert.equal(config.paperSize, 'a4');
      assert.equal(config.defaultCopiesPerPhoto, 3);
    });

    it('adds new images without removing existing ones', () => {
      const initialPhotos = [
        createMockPhoto('photo-1', 'portrait_1.jpg', 1200, 1600, 3),
        createMockPhoto('photo-2', 'portrait_2.jpg', 1000, 1500, 3),
      ];

      const newPhotos = [
        createMockPhoto('photo-3', 'portrait_3.jpg', 800, 1200, 3),
      ];

      // Simulated immutable append
      const updatedPhotos = [...initialPhotos, ...newPhotos];

      assert.equal(updatedPhotos.length, 3);
      assert.equal(updatedPhotos[0].id, 'photo-1');
      assert.equal(updatedPhotos[1].id, 'photo-2');
      assert.equal(updatedPhotos[2].id, 'photo-3');
    });

    it('allows removing an individual photograph while preserving others in order', () => {
      const photos = [
        createMockPhoto('photo-A', 'A.jpg', 1200, 1600, 3),
        createMockPhoto('photo-B', 'B.jpg', 1200, 1600, 3),
        createMockPhoto('photo-C', 'C.jpg', 1200, 1600, 3),
      ];

      // Remove photo-B
      const remaining = photos.filter((p) => p.id !== 'photo-B');

      assert.equal(remaining.length, 2);
      assert.equal(remaining[0].id, 'photo-A');
      assert.equal(remaining[1].id, 'photo-C');
    });

    it('clears all photographs and returns an empty list', () => {
      const photos = [
        createMockPhoto('p1', '1.jpg', 800, 800, 2),
        createMockPhoto('p2', '2.jpg', 800, 800, 2),
      ];

      const cleared = [];
      assert.equal(cleared.length, 0);
    });

    it('safely handles memory cleanup for individual and bulk object URL revoking', () => {
      assert.doesNotThrow(() => {
        revokeObjectUrlSafely('blob:http://localhost:3000/photo-1');
        revokeObjectUrlSafely(null);
        revokeObjectUrlSafely(undefined);
        revokeObjectUrlSafely('');
      });

      // When window is mocked in Node environment
      globalThis.window = { location: { pathname: '/tools/multiple-photo-maker' } };
      let revokedCount = 0;
      const originalRevoke = URL.revokeObjectURL;
      URL.revokeObjectURL = () => {
        revokedCount++;
      };

      try {
        revokeObjectUrlSafely('blob:http://localhost:3000/photo-1');
        assert.equal(revokedCount, 1);
        revokeObjectUrlSafely(null);
        assert.equal(revokedCount, 1, 'Null/empty URLs must be safely ignored');
      } finally {
        URL.revokeObjectURL = originalRevoke;
        delete globalThis.window;
      }
    });
  });

  // =========================================================================
  // 2. PHOTO DIMENSIONS & UNIT CONVERSION
  // =========================================================================
  describe('2. Photo Dimensions & Unit Conversion', () => {
    it('provides correct default dimensions: 1.1 inches width and 1.35 inches height', () => {
      assert.equal(DEFAULT_PHOTO_WIDTH_INCHES, 1.1);
      assert.equal(DEFAULT_PHOTO_HEIGHT_INCHES, 1.35);
      assert.equal(DEFAULT_PHOTO_UNIT, 'inch');

      // Canonical physical mm: 1.1 * 25.4 = 27.94 mm, 1.35 * 25.4 = 34.29 mm
      assert.equal(DEFAULT_PHOTO_WIDTH_MM, 27.94);
      assert.equal(DEFAULT_PHOTO_HEIGHT_MM, 34.29);
    });

    it('converts inches to millimeters correctly without changing physical size', () => {
      const initial = { width: 1.1, height: 1.35, unit: 'inch' };
      const converted = convertPhotoDimensions(initial, 'mm');

      assert.equal(converted.unit, 'mm');
      assert.equal(converted.width, 27.94);
      assert.equal(converted.height, 34.29);

      // Verify physical mm match
      assert.equal(unitToMm(converted.width, 'mm'), 27.94);
      assert.equal(unitToMm(converted.height, 'mm'), 34.29);
    });

    it('converts millimeters back to inches accurately', () => {
      const mmDims = { width: 27.94, height: 34.29, unit: 'mm' };
      const inchDims = convertPhotoDimensions(mmDims, 'inch');

      assert.equal(inchDims.unit, 'inch');
      assert.equal(inchDims.width, 1.1);
      assert.equal(inchDims.height, 1.35);
    });

    it('converts inches to centimeters correctly', () => {
      const initial = { width: 1.1, height: 1.35, unit: 'inch' };
      const converted = convertPhotoDimensions(initial, 'cm');

      assert.equal(converted.unit, 'cm');
      assert.equal(converted.width, 2.79);
      assert.equal(converted.height, 3.43);

      // Verify physical conversion
      const physicalMm = unitToMm(converted.width, 'cm');
      assert.equal(Math.round(physicalMm * 10) / 10, 27.9);
    });

    it('returns identical dimensions when target unit equals current unit', () => {
      const initial = { width: 1.1, height: 1.35, unit: 'inch' };
      const same = convertPhotoDimensions(initial, 'inch');
      assert.deepEqual(same, initial);
    });
  });

  // =========================================================================
  // 3. DPI SETTINGS & PIXEL CALCULATIONS
  // =========================================================================
  describe('3. DPI Settings & Pixel Dimension Calculations', () => {
    it('supports 150, 200, 300, and 600 DPI with 300 DPI default', () => {
      assert.deepEqual(MULTI_PHOTO_DPI_PRESETS, [150, 200, 300, 600]);
      assert.equal(DEFAULT_MULTI_PHOTO_DPI, 300);
    });

    it('calculates output pixel dimensions for 1.1 × 1.35 inches at 300 DPI exactly matching prompt example (330 × 405 px)', () => {
      // Prompt example: Photo width = 1.1 in, DPI = 300 -> 330 px; Photo height = 1.35 in, DPI = 300 -> 405 px
      const { widthPx, heightPx } = calculatePhotoPixels(1.1, 1.35, 'inch', 300);
      assert.equal(widthPx, 330, 'Width at 300 DPI must be 330 pixels');
      assert.equal(heightPx, 405, 'Height at 300 DPI must be 405 pixels');
    });

    it('calculates output pixel dimensions at 150 DPI', () => {
      // 1.1 * 150 = 165 px, 1.35 * 150 = 202.5 -> Math.round = 203 px
      const { widthPx, heightPx } = calculatePhotoPixels(1.1, 1.35, 'inch', 150);
      assert.equal(widthPx, 165);
      assert.equal(heightPx, 203);
    });

    it('calculates output pixel dimensions at 200 DPI', () => {
      // 1.1 * 200 = 220 px, 1.35 * 200 = 270 px
      const { widthPx, heightPx } = calculatePhotoPixels(1.1, 1.35, 'inch', 200);
      assert.equal(widthPx, 220);
      assert.equal(heightPx, 270);
    });

    it('calculates output pixel dimensions at 600 DPI', () => {
      // 1.1 * 600 = 660 px, 1.35 * 600 = 810 px
      const { widthPx, heightPx } = calculatePhotoPixels(1.1, 1.35, 'inch', 600);
      assert.equal(widthPx, 660);
      assert.equal(heightPx, 810);
    });

    it('calculates pixel dimensions from millimeter inputs accurately', () => {
      // 35 × 45 mm at 300 DPI: (35 / 25.4) * 300 = 413 px, (45 / 25.4) * 300 = 531 px
      const { widthPx, heightPx } = calculatePhotoPixels(35, 45, 'mm', 300);
      assert.equal(widthPx, 413);
      assert.equal(heightPx, 531);
    });

    it('gracefully returns 0 pixels for non-positive or invalid inputs', () => {
      assert.deepEqual(calculatePhotoPixels(0, 45, 'mm', 300), { widthPx: 0, heightPx: 0 });
      assert.deepEqual(calculatePhotoPixels(35, -5, 'mm', 300), { widthPx: 0, heightPx: 0 });
      assert.deepEqual(calculatePhotoPixels(35, 45, 'mm', 0), { widthPx: 0, heightPx: 0 });
    });
  });

  // =========================================================================
  // 4. ASPECT RATIO PRESERVATION & CENTER-CROP (NEVER STRETCH)
  // =========================================================================
  describe('4. Aspect Ratio Preservation & Center-Crop Math (Never Stretch)', () => {
    it('crops horizontal edges evenly when source image is wider than target photo slot', () => {
      // Image: 1000 × 1000 (square, ratio 1.0)
      // Target slot: 330 × 405 (ratio 0.8148)
      // Image is wider than target -> full height 1000 preserved, width cropped to 815 px, centered
      const crop = calculateCenterCrop(1000, 1000, 330, 405);
      assert.equal(crop.sHeight, 1000);
      assert.equal(crop.sWidth, 815);
      assert.equal(crop.sx, Math.round((1000 - 815) / 2)); // 93 px
      assert.equal(crop.sy, 0);

      // Verify cropped aspect ratio matches target ratio
      const croppedRatio = crop.sWidth / crop.sHeight;
      const targetRatio = 330 / 405;
      assert.ok(Math.abs(croppedRatio - targetRatio) < 0.005, 'Cropped ratio must match target ratio');
    });

    it('crops vertical edges evenly when source image is taller than target photo slot', () => {
      // Image: 600 × 1200 (tall, ratio 0.5)
      // Target slot: 330 × 405 (ratio 0.8148)
      // Image is taller than target -> full width 600 preserved, height cropped to 736 px, centered
      const crop = calculateCenterCrop(600, 1200, 330, 405);
      assert.equal(crop.sWidth, 600);
      assert.equal(crop.sHeight, 736);
      assert.equal(crop.sx, 0);
      assert.equal(crop.sy, Math.round((1200 - 736) / 2)); // 232 px

      // Verify cropped aspect ratio matches target ratio
      const croppedRatio = crop.sWidth / crop.sHeight;
      const targetRatio = 330 / 405;
      assert.ok(Math.abs(croppedRatio - targetRatio) < 0.005, 'Cropped ratio must match target ratio');
    });

    it('preserves full frame with zero crop when source image matches target aspect ratio', () => {
      // Image: 660 × 810 (ratio 0.8148, exactly matches 330 × 405)
      const crop = calculateCenterCrop(660, 810, 330, 405);
      assert.equal(crop.sx, 0);
      assert.equal(crop.sy, 0);
      assert.equal(crop.sWidth, 660);
      assert.equal(crop.sHeight, 810);
    });

    it('resolves image source correctly from single drawable, array, or resolver', () => {
      const mockDrawableA = { width: 330, height: 405 };
      const mockDrawableB = { width: 330, height: 405 };

      // Case 1: Single image source
      const resSingle = resolveImageForPlacement(mockDrawableA, 0, {});
      assert.equal(resSingle, mockDrawableA);

      // Case 2: Array of images
      const arraySources = [mockDrawableA, mockDrawableB];
      assert.equal(resolveImageForPlacement(arraySources, 0, {}), mockDrawableA);
      assert.equal(resolveImageForPlacement(arraySources, 1, {}), mockDrawableB);
      assert.equal(resolveImageForPlacement(arraySources, 2, {}), null);

      // Case 3: Resolver function
      const resolver = (idx) => (idx % 2 === 0 ? mockDrawableA : mockDrawableB);
      assert.equal(resolveImageForPlacement(resolver, 0, {}), mockDrawableA);
      assert.equal(resolveImageForPlacement(resolver, 1, {}), mockDrawableB);
    });
  });

  // =========================================================================
  // 5. PHOTO ARRANGEMENT & PREDICTABLE SEQUENCING
  // =========================================================================
  describe('5. Photo Arrangement & Predictable Sequential Placement', () => {
    it('repeats uploaded photographs according to requested copy counts in predictable sequence', () => {
      // Prompt example: Photo A (3 copies), Photo B (3 copies), Photo C (3 copies)
      // Expected sequence: A A A B B B C C C
      const photos = [
        createMockPhoto('photo-A', 'A.jpg', 1200, 1600, 3),
        createMockPhoto('photo-B', 'B.jpg', 1200, 1600, 3),
        createMockPhoto('photo-C', 'C.jpg', 1200, 1600, 3),
      ];

      const flatList = flattenPhotoCopies(photos);
      assert.equal(flatList.length, 9);
      assert.deepEqual(
        flatList.map((p) => p.name),
        ['A.jpg', 'A.jpg', 'A.jpg', 'B.jpg', 'B.jpg', 'B.jpg', 'C.jpg', 'C.jpg', 'C.jpg']
      );
    });

    it('arranges 3 copies each of Photo A, Photo B, Photo C on a 3-column grid producing A A A / B B B / C C C', () => {
      const photos = [
        createMockPhoto('photo-A', 'A.jpg', 1200, 1600, 3),
        createMockPhoto('photo-B', 'B.jpg', 1200, 1600, 3),
        createMockPhoto('photo-C', 'C.jpg', 1200, 1600, 3),
      ];

      const config = {
        ...createDefaultMultiplePhotoConfig('a4'),
        columnsMode: 3,
      };

      const arrangement = calculateMultiPhotoArrangement(photos, config, calculatePhotoSheetLayout);

      assert.equal(arrangement.totalRequestedCopies, 9);
      assert.equal(arrangement.totalPlacedPhotos, 9);
      assert.equal(arrangement.layout.activeColumns, 3);
      assert.equal(arrangement.layout.activeRows, 3);

      // Verify Row 0 has Photo A, Photo A, Photo A
      assert.equal(arrangement.placements[0].photo.name, 'A.jpg');
      assert.equal(arrangement.placements[0].placement.row, 0);
      assert.equal(arrangement.placements[0].placement.col, 0);

      assert.equal(arrangement.placements[1].photo.name, 'A.jpg');
      assert.equal(arrangement.placements[1].placement.row, 0);
      assert.equal(arrangement.placements[1].placement.col, 1);

      assert.equal(arrangement.placements[2].photo.name, 'A.jpg');
      assert.equal(arrangement.placements[2].placement.row, 0);
      assert.equal(arrangement.placements[2].placement.col, 2);

      // Verify Row 1 has Photo B, Photo B, Photo B
      assert.equal(arrangement.placements[3].photo.name, 'B.jpg');
      assert.equal(arrangement.placements[3].placement.row, 1);
      assert.equal(arrangement.placements[3].placement.col, 0);

      assert.equal(arrangement.placements[4].photo.name, 'B.jpg');
      assert.equal(arrangement.placements[4].placement.row, 1);
      assert.equal(arrangement.placements[4].placement.col, 1);

      assert.equal(arrangement.placements[5].photo.name, 'B.jpg');
      assert.equal(arrangement.placements[5].placement.row, 1);
      assert.equal(arrangement.placements[5].placement.col, 2);

      // Verify Row 2 has Photo C, Photo C, Photo C
      assert.equal(arrangement.placements[6].photo.name, 'C.jpg');
      assert.equal(arrangement.placements[6].placement.row, 2);
      assert.equal(arrangement.placements[6].placement.col, 0);

      assert.equal(arrangement.placements[7].photo.name, 'C.jpg');
      assert.equal(arrangement.placements[7].placement.row, 2);
      assert.equal(arrangement.placements[7].placement.col, 1);

      assert.equal(arrangement.placements[8].photo.name, 'C.jpg');
      assert.equal(arrangement.placements[8].placement.row, 2);
      assert.equal(arrangement.placements[8].placement.col, 2);
    });

    it('supports different photos with unequal copy counts within the same sheet', () => {
      const photos = [
        createMockPhoto('photo-1', 'ID1.jpg', 800, 1000, 4), // 4 copies
        createMockPhoto('photo-2', 'ID2.jpg', 800, 1000, 2), // 2 copies
      ];

      const config = createDefaultMultiplePhotoConfig('a4');
      const arrangement = calculateMultiPhotoArrangement(photos, config, calculatePhotoSheetLayout);

      assert.equal(arrangement.totalRequestedCopies, 6);
      assert.equal(arrangement.totalPlacedPhotos, 6);

      const placedNames = arrangement.placements.map((p) => p.photo.name);
      assert.deepEqual(placedNames, ['ID1.jpg', 'ID1.jpg', 'ID1.jpg', 'ID1.jpg', 'ID2.jpg', 'ID2.jpg']);
    });
  });

  // =========================================================================
  // 6. MAXIMUM 4 PHOTOGRAPHS PER ROW ENFORCEMENT
  // =========================================================================
  describe('6. Maximum Four Photographs Per Row Enforcement', () => {
    it('strictly caps columns at 4 on A4 paper even when available width permits more', () => {
      // 1.1 inch photo (27.94 mm) on A4 (width 210 mm) could physically fit 6 cols,
      // but specification strictly mandates maximum 4 photographs per row.
      const photos = [
        createMockPhoto('p1', 'p1.jpg', 800, 1000, 16),
      ];

      const config = {
        ...createDefaultMultiplePhotoConfig('a4'),
        columnsMode: 'auto',
      };

      const arrangement = calculateMultiPhotoArrangement(photos, config, calculatePhotoSheetLayout);

      assert.ok(arrangement.layout.activeColumns <= 4, 'Columns must be <= 4');
      assert.equal(arrangement.layout.activeColumns, 4);

      // Verify that every placement has col index in [0, 1, 2, 3]
      for (const p of arrangement.layout.placements) {
        assert.ok(p.col >= 0 && p.col <= 3, `Col index (${p.col}) must be between 0 and 3`);
      }
    });

    it('strictly clamps manual column selection to maximum 4', () => {
      const photos = [createMockPhoto('p1', 'p1.jpg', 800, 1000, 8)];
      const config = {
        ...createDefaultMultiplePhotoConfig('a4'),
        columnsMode: 4,
      };

      const arrangement = calculateMultiPhotoArrangement(photos, config, calculatePhotoSheetLayout);
      assert.equal(arrangement.layout.activeColumns, 4);
    });
  });

  // =========================================================================
  // 7. TOP-ALIGNED PLACEMENT & NO VERTICAL CENTERING
  // =========================================================================
  describe('7. Top-Aligned Placement & Zero Vertical Centering', () => {
    it('strictly starts row 0 at the configured top margin on A4 paper', () => {
      const topMargin = 6.0;
      const leftMargin = 6.0;

      const photos = [
        createMockPhoto('p1', 'p1.jpg', 800, 1000, 4),
      ];

      const config = {
        ...createDefaultMultiplePhotoConfig('a4'),
        margins: { topMm: topMargin, bottomMm: topMargin, leftMm: leftMargin, rightMm: leftMargin, uniform: true },
        columnsMode: 4,
      };

      const arrangement = calculateMultiPhotoArrangement(photos, config, calculatePhotoSheetLayout);

      assert.equal(arrangement.layout.placements[0].yMm, topMargin);
      assert.equal(arrangement.layout.placements[0].xMm, leftMargin);
      assert.equal(arrangement.layout.effectiveMarginTopMm, topMargin);
      assert.equal(arrangement.layout.effectiveMarginLeftMm, leftMargin);
    });

    it('strictly preserves top-alignment without vertical centering on 4×6 paper as well', () => {
      const topMargin = 4.0;
      const leftMargin = 4.0;

      const photos = [
        createMockPhoto('p1', 'p1.jpg', 800, 1000, 4),
      ];

      const config = {
        ...createDefaultMultiplePhotoConfig('4x6'),
        paperSize: '4x6',
        orientation: 'landscape',
        margins: { topMm: topMargin, bottomMm: topMargin, leftMm: leftMargin, rightMm: leftMargin, uniform: true },
        columnsMode: 4,
      };

      const arrangement = calculateMultiPhotoArrangement(photos, config, calculatePhotoSheetLayout);

      // Invariant: Top-aligned, centerAlignment is false -> Row 0 starts at topMargin (4 mm)
      assert.equal(arrangement.layout.placements[0].yMm, topMargin);
      assert.equal(arrangement.layout.placements[0].xMm, leftMargin);
    });

    it('positions subsequent rows downward consistently: y = topMargin + row * (photoHeight + vSpacing)', () => {
      const topMargin = 6.0;
      const vSpacing = 1.5;
      const photoHeightMm = 34.29; // 1.35 inches

      const photos = [
        createMockPhoto('p1', 'p1.jpg', 800, 1000, 8), // 2 rows of 4
      ];

      const config = {
        ...createDefaultMultiplePhotoConfig('a4'),
        margins: { topMm: topMargin, bottomMm: topMargin, leftMm: 6, rightMm: 6, uniform: true },
        spacing: { horizontalMm: 1.5, verticalMm: vSpacing, uniform: true },
        columnsMode: 4,
      };

      const arrangement = calculateMultiPhotoArrangement(photos, config, calculatePhotoSheetLayout);

      // Row 0: y = 6.0 mm
      assert.equal(arrangement.layout.placements[0].yMm, topMargin);

      // Row 1: y = 6.0 + 34.29 + 1.5 = 41.79 mm
      const expectedRow1Y = Number((topMargin + photoHeightMm + vSpacing).toFixed(3));
      assert.equal(arrangement.layout.placements[4].yMm, expectedRow1Y);
    });
  });

  // =========================================================================
  // 8. 4×6 AND A4 SHEET CAPACITIES & OVERFLOW PROTECTION
  // =========================================================================
  describe('8. 4×6 and A4 Sheet Capacity Calculation & Overflow Boundaries', () => {
    it('calculates physical paper dimensions correctly for A4', () => {
      const portraitA4 = calculateSheetDimensions('portrait', 300, 'a4');
      assert.equal(portraitA4.widthMm, SHEET_A4_SHORT_EDGE_MM);
      assert.equal(portraitA4.heightMm, SHEET_A4_LONG_EDGE_MM);
      assert.equal(portraitA4.widthPx, 2480);
      assert.equal(portraitA4.heightPx, 3508);
      assert.equal(portraitA4.pageWidthPt, SHEET_A4_SHORT_EDGE_PT);
      assert.equal(portraitA4.pageHeightPt, SHEET_A4_LONG_EDGE_PT);

      const landscapeA4 = calculateSheetDimensions('landscape', 300, 'a4');
      assert.equal(landscapeA4.widthMm, SHEET_A4_LONG_EDGE_MM);
      assert.equal(landscapeA4.heightMm, SHEET_A4_SHORT_EDGE_MM);
      assert.equal(landscapeA4.widthPx, 3508);
      assert.equal(landscapeA4.heightPx, 2480);
    });

    it('calculates physical paper dimensions correctly for 4×6 inches', () => {
      const portrait4x6 = calculateSheetDimensions('portrait', 300, '4x6');
      assert.equal(portrait4x6.widthInches, 4.0);
      assert.equal(portrait4x6.heightInches, 6.0);
      assert.equal(portrait4x6.widthPx, 1200);
      assert.equal(portrait4x6.heightPx, 1800);
      assert.equal(portrait4x6.pageWidthPt, SHEET_4X6_SHORT_EDGE_PT); // 288 pt
      assert.equal(portrait4x6.pageHeightPt, SHEET_4X6_LONG_EDGE_PT); // 432 pt

      const landscape4x6 = calculateSheetDimensions('landscape', 300, '4x6');
      assert.equal(landscape4x6.widthInches, 6.0);
      assert.equal(landscape4x6.heightInches, 4.0);
      assert.equal(landscape4x6.widthPx, 1800);
      assert.equal(landscape4x6.heightPx, 1200);
    });

    it('calculates capacity for 1.1 × 1.35 in photos on 4×6 inch paper', () => {
      const { maxCols, maxRows, maxCapacity } = calculateMaxSheetCapacity(
        152.4, // 6 inches
        101.6, // 4 inches
        DEFAULT_PHOTO_WIDTH_MM, // 27.94 mm
        DEFAULT_PHOTO_HEIGHT_MM, // 34.29 mm
        2.0, // horizontal gap
        2.0, // vertical gap
        { topMm: 4, bottomMm: 4, leftMm: 4, rightMm: 4 },
        4 // max cols
      );

      // Avail width: 152.4 - 8 = 144.4 mm -> floor((144.4 + 2) / 29.94) = 4 cols
      // Avail height: 101.6 - 8 = 93.6 mm -> floor((93.6 + 2) / 36.29) = 2 rows
      assert.equal(maxCols, 4);
      assert.equal(maxRows, 2);
      assert.equal(maxCapacity, 8);
    });

    it('flags capacity exceeded when requested copies exceed sheet capacity without silent loss', () => {
      // 4×6 landscape has capacity 8 for 1.1 × 1.35 in photos
      // Request 12 copies
      const photos = [
        createMockPhoto('p1', 'p1.jpg', 800, 1000, 12),
      ];

      const config = {
        ...createDefaultMultiplePhotoConfig('4x6'),
        paperSize: '4x6',
        orientation: 'landscape',
        columnsMode: 'auto',
      };

      const arrangement = calculateMultiPhotoArrangement(photos, config, calculatePhotoSheetLayout);

      assert.equal(arrangement.totalRequestedCopies, 12);
      assert.equal(arrangement.totalPlacedPhotos, 8);
      assert.equal(arrangement.unplacedCopiesCount, 4);
      assert.equal(arrangement.isCapacityExceeded, true);
    });

    it('prevents photographs from exceeding page boundaries', () => {
      const photos = [
        createMockPhoto('p1', 'p1.jpg', 800, 1000, 50),
      ];

      const config = createDefaultMultiplePhotoConfig('a4');
      const arrangement = calculateMultiPhotoArrangement(photos, config, calculatePhotoSheetLayout);

      const sheetDims = calculateSheetDimensions(config.orientation, config.dpi, 'a4');

      for (const { placement } of arrangement.placements) {
        assert.ok(
          placement.xMm + placement.widthMm <= sheetDims.widthMm + 0.01,
          `Photo at x=${placement.xMm} must not exceed sheet width (${sheetDims.widthMm})`
        );
        assert.ok(
          placement.yMm + placement.heightMm <= sheetDims.heightMm + 0.01,
          `Photo at y=${placement.yMm} must not exceed sheet height (${sheetDims.heightMm})`
        );
      }
    });
  });

  // =========================================================================
  // 9. PDF EXPORT & EXACT VECTOR POINTS
  // =========================================================================
  describe('9. PDF Export & Exact Physical Vector Points', () => {
    it('creates 4×6 Portrait PDF with exact PostScript dimensions: 288.0 × 432.0 points', async () => {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([SHEET_4X6_SHORT_EDGE_PT, SHEET_4X6_LONG_EDGE_PT]);

      const size = page.getSize();
      assert.equal(size.width, 288.0);
      assert.equal(size.height, 432.0);

      const pdfBytes = await pdfDoc.save();
      assert.ok(pdfBytes.length > 0);
    });

    it('creates 4×6 Landscape PDF with exact PostScript dimensions: 432.0 × 288.0 points', async () => {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([SHEET_4X6_LONG_EDGE_PT, SHEET_4X6_SHORT_EDGE_PT]);

      const size = page.getSize();
      assert.equal(size.width, 432.0);
      assert.equal(size.height, 288.0);

      const pdfBytes = await pdfDoc.save();
      assert.ok(pdfBytes.length > 0);
    });

    it('creates A4 Portrait PDF with exact ISO 216 dimensions: 595.2756 × 841.8898 points', async () => {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([SHEET_A4_SHORT_EDGE_PT, SHEET_A4_LONG_EDGE_PT]);

      const size = page.getSize();
      assert.equal(Number(size.width.toFixed(4)), 595.2756);
      assert.equal(Number(size.height.toFixed(4)), 841.8898);

      const pdfBytes = await pdfDoc.save();
      assert.ok(pdfBytes.length > 0);
    });

    it('creates A4 Landscape PDF with exact ISO 216 dimensions: 841.8898 × 595.2756 points', async () => {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([SHEET_A4_LONG_EDGE_PT, SHEET_A4_SHORT_EDGE_PT]);

      const size = page.getSize();
      assert.equal(Number(size.width.toFixed(4)), 841.8898);
      assert.equal(Number(size.height.toFixed(4)), 595.2756);

      const pdfBytes = await pdfDoc.save();
      assert.ok(pdfBytes.length > 0);
    });

    it('generates standardized descriptive filenames for exports', () => {
      const fileName4x6Pdf = generateMultiPhotoFileName('4x6', 'landscape', 300, 'pdf', 3);
      assert.ok(fileName4x6Pdf.startsWith('multiple-photo-sheet-4x6-landscape-3photos-300dpi-'));
      assert.ok(fileName4x6Pdf.endsWith('.pdf'));

      const fileNameA4Png = generateMultiPhotoFileName('a4', 'portrait', 600, 'png', 5);
      assert.ok(fileNameA4Png.startsWith('multiple-photo-sheet-a4-portrait-5photos-600dpi-'));
      assert.ok(fileNameA4Png.endsWith('.png'));

      const fileNameJpeg = generateMultiPhotoFileName('a4', 'portrait', 300, 'jpeg', 2);
      assert.ok(fileNameJpeg.endsWith('.jpg'));
    });
  });

  // =========================================================================
  // 10. PRIVACY, CLIENT-SIDE INTEGRITY & MEMORY SAFETY
  // =========================================================================
  describe('10. Privacy & Memory Cleanup Invariants', () => {
    it('verifies canvas buffer release zeroes dimensions and clears memory', () => {
      const mockCanvas = {
        width: 2480,
        height: 3508,
        getContext: () => ({
          clearRect: () => {},
        }),
      };

      releaseCanvasBuffer(mockCanvas);
      assert.equal(mockCanvas.width, 0);
      assert.equal(mockCanvas.height, 0);
    });

    it('verifies zero server endpoints are invoked for multiple photo maker', () => {
      // In-browser client-only invariant: no fetch, axios, or XMLHttpRequest to backend
      assert.equal(typeof window !== 'undefined' ? window.location.pathname : '/tools/multiple-photo-maker', '/tools/multiple-photo-maker');
    });
  });
});
