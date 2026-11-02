import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  unitToMm,
  mmToUnit,
  convertUnit,
  formatDimension,
  calculateAspectRatio,
  calculateDimensionPixels,
  calculateCustomPhotoPixels,
  validateCustomDimensions,
  getFriendlyAspectRatioName,
  MM_PER_INCH,
  MM_PER_CM,
  MIN_DPI,
  MAX_DPI,
  DEFAULT_CUSTOM_DPI,
  MIN_DIMENSION_MM,
  MAX_DIMENSION_MM,
  MAX_SAFE_PIXEL_DIMENSION,
} from '../src/lib/crop/unit-converter.ts';

import {
  calculateSheetDimensions,
  calculateMaxSheetCapacity,
  calculatePhotoSheetLayout,
} from '../src/lib/photo-studio/sheet-calculator.ts';

import {
  DEFAULT_PHOTO_SHEET_CONFIG,
  DEFAULT_A4_SHEET_CONFIG,
} from '../src/constants/photo-sheet.ts';

import {
  recalculateCropForAspectRatio,
  initDefaultCrop,
} from '../src/lib/crop/crop-geometry.ts';

describe('PHASE 03G: Custom Photo Dimensions Test Suite', () => {

  // =========================================================================
  // TEST CASE 1: 35 × 45 mm at 300 DPI
  // =========================================================================
  describe('1. Standard Passport Dimension: 35 × 45 mm at 300 DPI', () => {
    it('calculates exact 413 × 531 pixels using the official rounding formula', () => {
      // Formula: (mm / 25.4) * DPI
      // (35 / 25.4) * 300 = 413.3858... -> 413
      // (45 / 25.4) * 300 = 531.4960... -> 531
      const widthPx = calculateDimensionPixels(35, 'mm', 300);
      const heightPx = calculateDimensionPixels(45, 'mm', 300);

      assert.equal(widthPx, 413, 'Width at 300 DPI must be 413 pixels');
      assert.equal(heightPx, 531, 'Height at 300 DPI must be 531 pixels');

      const calc = calculateCustomPhotoPixels(35, 45, 'mm', 300);
      assert.equal(calc.widthPx, 413);
      assert.equal(calc.heightPx, 531);
      assert.equal(calc.widthMm, 35.0);
      assert.equal(calc.heightMm, 45.0);
      assert.ok(Math.abs(calc.aspectRatio - 35 / 45) < 0.0001);
      assert.match(calc.friendlyAspectRatio, /35:45 Passport/);
    });

    it('validates 35 × 45 mm at 300 DPI as completely valid with zero errors', () => {
      const val = validateCustomDimensions(35, 45, 'mm', 300);
      assert.equal(val.isValid, true);
      assert.equal(Object.keys(val.errors).length, 0);
      assert.equal(val.widthPx, 413);
      assert.equal(val.heightPx, 531);
    });

    it('calculates sheet capacities accurately on 4×6 inch and A4 paper', () => {
      // 4×6 Landscape sheet with standard 3mm print margins and 2mm spacing:
      // Avail width: 152.4 - 6 = 146.4 mm >= 4 * 35 + 3 * 2 = 146 mm (4 cols)
      // Avail height: 101.6 - 6 = 95.6 mm >= 2 * 45 + 1 * 2 = 92 mm (2 rows)
      // Capacity = 4 cols × 2 rows = 8 photos
      const sheet4x6Tight = calculatePhotoSheetLayout(
        {
          ...DEFAULT_PHOTO_SHEET_CONFIG,
          paperSize: '4x6',
          orientation: 'landscape',
          copies: 8,
          margins: { topMm: 3, bottomMm: 3, leftMm: 3, rightMm: 3, uniform: true },
          spacing: { horizontalMm: 2, verticalMm: 2, uniform: true },
        },
        { widthMm: 35, heightMm: 45 }
      );
      assert.equal(sheet4x6Tight.maxCapacity, 8);
      assert.equal(sheet4x6Tight.totalPhotos, 8);
      assert.equal(sheet4x6Tight.isOverflowing, false);

      // 4×6 Landscape sheet with default 4mm margins: 3 cols × 2 rows = 6 photos
      const sheet4x6Default = calculatePhotoSheetLayout(
        {
          ...DEFAULT_PHOTO_SHEET_CONFIG,
          paperSize: '4x6',
          orientation: 'landscape',
          copies: 8,
        },
        { widthMm: 35, heightMm: 45 }
      );
      assert.equal(sheet4x6Default.maxCapacity, 6);
      assert.equal(sheet4x6Default.totalPhotos, 6);

      // A4 Portrait sheet (4 cols × 6 rows = 24 photos)
      const sheetA4 = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          copies: 24,
        },
        { widthMm: 35, heightMm: 45 }
      );
      assert.equal(sheetA4.maxCapacity, 24);
      assert.equal(sheetA4.totalPhotos, 24);
      assert.equal(sheetA4.isOverflowing, false);
    });
  });

  // =========================================================================
  // TEST CASE 2: 2 × 2 inch at 300 DPI
  // =========================================================================
  describe('2. Square Format: 2 × 2 inch at 300 DPI', () => {
    it('calculates exact 600 × 600 pixels using physical dimension in inches × DPI', () => {
      // Formula: inches * DPI = 2 * 300 = 600
      const widthPx = calculateDimensionPixels(2, 'inch', 300);
      const heightPx = calculateDimensionPixels(2, 'inch', 300);

      assert.equal(widthPx, 600, 'Width at 300 DPI must be exactly 600 pixels');
      assert.equal(heightPx, 600, 'Height at 300 DPI must be exactly 600 pixels');

      const calc = calculateCustomPhotoPixels(2, 2, 'inch', 300);
      assert.equal(calc.widthPx, 600);
      assert.equal(calc.heightPx, 600);
      assert.equal(calc.widthMm, 50.8);
      assert.equal(calc.heightMm, 50.8);
      assert.equal(calc.aspectRatio, 1.0);
      assert.match(calc.friendlyAspectRatio, /1:1 Square/);
    });

    it('validates 2 × 2 inch as valid without errors', () => {
      const val = validateCustomDimensions(2, 2, 'inch', 300);
      assert.equal(val.isValid, true);
      assert.equal(val.widthMm, 50.8);
      assert.equal(val.heightMm, 50.8);
      assert.equal(val.widthPx, 600);
      assert.equal(val.heightPx, 600);
    });

    it('fits 2 photos on 4×6 inch landscape sheet and 15 photos on A4 sheet', () => {
      // 4×6 landscape: 2 cols × 1 row = 2 photos
      const sheet4x6 = calculatePhotoSheetLayout(
        {
          ...DEFAULT_PHOTO_SHEET_CONFIG,
          paperSize: '4x6',
          orientation: 'landscape',
          copies: 2,
        },
        { widthMm: 50.8, heightMm: 50.8 }
      );
      assert.equal(sheet4x6.maxCapacity, 2);
      assert.equal(sheet4x6.totalPhotos, 2);
      assert.equal(sheet4x6.isOverflowing, false);

      // A4 portrait: 3 cols × 5 rows = 15 photos
      const sheetA4 = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          copies: 15,
        },
        { widthMm: 50.8, heightMm: 50.8 }
      );
      assert.equal(sheetA4.maxCapacity, 15);
      assert.equal(sheetA4.totalPhotos, 15);
      assert.equal(sheetA4.isOverflowing, false);
    });
  });

  // =========================================================================
  // TEST CASE 3: 3.5 × 4.5 cm at 300 DPI
  // =========================================================================
  describe('3. Centimeter Format: 3.5 × 4.5 cm at 300 DPI', () => {
    it('calculates exact 413 × 531 pixels with identical parity to 35 × 45 mm', () => {
      // 3.5 cm = 35 mm, 4.5 cm = 45 mm
      const widthPx = calculateDimensionPixels(3.5, 'cm', 300);
      const heightPx = calculateDimensionPixels(4.5, 'cm', 300);

      assert.equal(widthPx, 413, 'Width for 3.5 cm at 300 DPI must be 413 pixels');
      assert.equal(heightPx, 531, 'Height for 4.5 cm at 300 DPI must be 531 pixels');

      const calc = calculateCustomPhotoPixels(3.5, 4.5, 'cm', 300);
      assert.equal(calc.widthPx, 413);
      assert.equal(calc.heightPx, 531);
      assert.equal(calc.widthMm, 35.0);
      assert.equal(calc.heightMm, 45.0);

      // Verify exact parity with 35 × 45 mm calculation
      const mmCalc = calculateCustomPhotoPixels(35, 45, 'mm', 300);
      assert.equal(calc.widthPx, mmCalc.widthPx);
      assert.equal(calc.heightPx, mmCalc.heightPx);
      assert.equal(calc.widthMm, mmCalc.widthMm);
      assert.equal(calc.heightMm, mmCalc.heightMm);
    });

    it('validates 3.5 × 4.5 cm at 300 DPI as valid', () => {
      const val = validateCustomDimensions(3.5, 4.5, 'cm', 300);
      assert.equal(val.isValid, true);
      assert.equal(val.widthMm, 35);
      assert.equal(val.heightMm, 45);
    });
  });

  // =========================================================================
  // TEST CASE 4: Switching Units Without Changing Physical Dimensions
  // =========================================================================
  describe('4. Switching Units Without Changing Physical Dimensions', () => {
    it('converts 35 mm to 3.5 cm and back without loss', () => {
      const cmVal = convertUnit(35, 'mm', 'cm', 2);
      assert.equal(cmVal, 3.5);

      const mmVal = convertUnit(cmVal, 'cm', 'mm', 2);
      assert.equal(mmVal, 35);
    });

    it('converts 2 inches to 50.8 mm and back to 2 inches cleanly', () => {
      const mmVal = convertUnit(2, 'inch', 'mm', 2);
      assert.equal(mmVal, 50.8);

      const inVal = convertUnit(mmVal, 'mm', 'inch', 2);
      assert.equal(inVal, 2.0);
    });

    it('converts 2 inches to 5.08 cm and back to 2 inches cleanly', () => {
      const cmVal = convertUnit(2, 'inch', 'cm', 2);
      assert.equal(cmVal, 5.08);

      const inVal = convertUnit(cmVal, 'cm', 'inch', 2);
      assert.equal(inVal, 2.0);
    });

    it('produces identical pixel dimensions after unit conversion across all three units', () => {
      // 50.8 mm == 5.08 cm == 2.0 inches
      const pxFromInches = calculateDimensionPixels(2, 'inch', 300);
      const pxFromMm = calculateDimensionPixels(50.8, 'mm', 300);
      const pxFromCm = calculateDimensionPixels(5.08, 'cm', 300);

      assert.equal(pxFromInches, 600);
      assert.equal(pxFromMm, 600);
      assert.equal(pxFromCm, 600);
    });
  });

  // =========================================================================
  // TEST CASE 5: Crop Aspect Ratio
  // =========================================================================
  describe('5. Crop Aspect Ratio & Frame Integration', () => {
    it('computes aspect ratio matching width / height for custom dimensions', () => {
      assert.equal(calculateAspectRatio(35, 45), 35 / 45);
      assert.equal(calculateAspectRatio(2, 2), 1.0);
      assert.equal(calculateAspectRatio(3.5, 4.5), 3.5 / 4.5);
      assert.equal(calculateAspectRatio(50, 70), 50 / 70);
    });

    it('recalculates crop frame centered without distortion when aspect ratio changes', () => {
      const initialCrop = initDefaultCrop(1000, 1000, 1.0); // 85% centered box = 850 × 850
      assert.equal(initialCrop.width, 850);
      assert.equal(initialCrop.height, 850);

      // User switches to custom 35 × 45 mm (~0.7778 ratio)
      const targetRatio = 35 / 45;
      const updatedCrop = recalculateCropForAspectRatio(initialCrop, 1000, 1000, targetRatio);

      // Verify new aspect ratio matches custom dimensions
      const actualRatio = updatedCrop.width / updatedCrop.height;
      assert.ok(Math.abs(actualRatio - targetRatio) < 0.002);

      // Verify crop stays within image boundaries (1000 × 1000)
      assert.ok(updatedCrop.x >= 0);
      assert.ok(updatedCrop.y >= 0);
      assert.ok(updatedCrop.x + updatedCrop.width <= 1000);
      assert.ok(updatedCrop.y + updatedCrop.height <= 1000);
    });

    it('preserves framing when switching between equivalent units', () => {
      const crop1 = recalculateCropForAspectRatio({ x: 50, y: 50, width: 400, height: 400 }, 1000, 1000, 35 / 45);
      const crop2 = recalculateCropForAspectRatio({ x: 50, y: 50, width: 400, height: 400 }, 1000, 1000, 3.5 / 4.5);

      assert.equal(crop1.width, crop2.width);
      assert.equal(crop1.height, crop2.height);
      assert.equal(crop1.x, crop2.x);
      assert.equal(crop1.y, crop2.y);
    });
  });

  // =========================================================================
  // TEST CASE 6: 4×6 and A4 Sheet Placement
  // =========================================================================
  describe('6. 4×6 and A4 Sheet Placement with Custom Dimensions', () => {
    it('places custom photos without overlapping and with exact spacing', () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          copies: 8,
          spacing: { horizontalMm: 2.0, verticalMm: 2.0, uniform: true },
          margins: { topMm: 5.0, bottomMm: 5.0, leftMm: 5.0, rightMm: 5.0, uniform: true },
        },
        { widthMm: 35, heightMm: 45 }
      );

      assert.equal(layout.totalPhotos, 8);
      assert.equal(layout.isOverflowing, false);

      // Verify no photo overlaps another
      for (let i = 0; i < layout.placements.length; i++) {
        for (let j = i + 1; j < layout.placements.length; j++) {
          const p1 = layout.placements[i];
          const p2 = layout.placements[j];

          const noOverlap =
            p1.xMm + p1.widthMm <= p2.xMm || // p1 left of p2
            p2.xMm + p2.widthMm <= p1.xMm || // p2 left of p1
            p1.yMm + p1.heightMm <= p2.yMm || // p1 above p2
            p2.yMm + p2.heightMm <= p1.yMm;   // p2 above p1

          assert.ok(noOverlap, `Photo ${i} and photo ${j} must not overlap`);
        }
      }
    });

    it('strictly preserves top-aligned layout on A4 paper', () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_A4_SHEET_CONFIG,
          paperSize: 'a4',
          orientation: 'portrait',
          copies: 4,
          margins: { topMm: 8.0, bottomMm: 8.0, leftMm: 8.0, rightMm: 8.0, uniform: true },
        },
        { widthMm: 40, heightMm: 50 }
      );

      // Row 0 must start strictly at top margin
      assert.equal(layout.placements[0].yMm, 8.0);
      assert.equal(layout.placements[1].yMm, 8.0);
    });

    it('correctly reports capacity and warning when requested copies exceed capacity', () => {
      const layout = calculatePhotoSheetLayout(
        {
          ...DEFAULT_PHOTO_SHEET_CONFIG,
          paperSize: '4x6',
          orientation: 'landscape',
          copies: 20, // Exceeds capacity
        },
        { widthMm: 35, heightMm: 45 }
      );

      assert.equal(layout.maxCapacity, 6);
      assert.equal(layout.totalPhotos, 6);
      assert.equal(layout.requestedCopies, 20);
      assert.equal(layout.copiesExceedCapacity, true);
      assert.equal(layout.exceededByCount, 14);
      assert.ok(layout.capacityWarningMessage);
    });
  });

  // =========================================================================
  // TEST CASE 7: Validation of Invalid and Excessively Large Values
  // =========================================================================
  describe('7. Validation of Invalid and Excessively Large Values', () => {
    it('rejects empty or NaN dimensions', () => {
      const emptyW = validateCustomDimensions(NaN, 45, 'mm');
      assert.equal(emptyW.isValid, false);
      assert.ok(emptyW.errors.width);

      const emptyH = validateCustomDimensions(35, NaN, 'mm');
      assert.equal(emptyH.isValid, false);
      assert.ok(emptyH.errors.height);
    });

    it('rejects zero or negative dimensions', () => {
      const zeroW = validateCustomDimensions(0, 45, 'mm');
      assert.equal(zeroW.isValid, false);
      assert.ok(zeroW.errors.width);

      const negW = validateCustomDimensions(-10, 45, 'mm');
      assert.equal(negW.isValid, false);
      assert.ok(negW.errors.width);

      const zeroH = validateCustomDimensions(35, 0, 'mm');
      assert.equal(zeroH.isValid, false);
      assert.ok(zeroH.errors.height);

      const negH = validateCustomDimensions(35, -5, 'mm');
      assert.equal(negH.isValid, false);
      assert.ok(negH.errors.height);
    });

    it('rejects invalid DPI values (< 30 or > 2400 or NaN)', () => {
      const lowDpi = validateCustomDimensions(35, 45, 'mm', 20); // < 30
      assert.equal(lowDpi.isValid, false);
      assert.match(lowDpi.errors.dpi, /cannot be less than 30/);

      const highDpi = validateCustomDimensions(35, 45, 'mm', 3000); // > 2400
      assert.equal(highDpi.isValid, false);
      assert.match(highDpi.errors.dpi, /cannot exceed 2400/);

      const nanDpi = validateCustomDimensions(35, 45, 'mm', NaN);
      assert.equal(nanDpi.isValid, false);
      assert.ok(nanDpi.errors.dpi);
    });

    it('rejects dimensions exceeding physical upper bound (1000 mm / 1 meter)', () => {
      const tooLargeMm = validateCustomDimensions(1200, 45, 'mm', 300);
      assert.equal(tooLargeMm.isValid, false);
      assert.match(tooLargeMm.errors.width, /exceeds maximum limit/);

      const tooLargeIn = validateCustomDimensions(45, 50, 'inch', 300); // 50 in = 1270 mm > 1000 mm
      assert.equal(tooLargeIn.isValid, false);
      assert.match(tooLargeIn.errors.height, /exceeds maximum limit/);
    });

    it('rejects excessively large pixel dimensions that could crash the browser', () => {
      // 900 mm at 600 DPI = (900 / 25.4) * 600 = 21,259 px (> 10,000 px safe limit)
      const hugeRes = validateCustomDimensions(900, 900, 'mm', 600);
      assert.equal(hugeRes.isValid, false);
      assert.ok(hugeRes.errors.general);
      assert.match(hugeRes.errors.general, /exceed browser safe limit/);
    });
  });
});
