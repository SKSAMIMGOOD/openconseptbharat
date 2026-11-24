import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  createDefaultMultiplePhotoConfig,
  calculateMultiPhotoArrangement,
  buildPhotoSheetConfig,
  calculateMultiSheetPages,
  unitToMm,
  DEFAULT_A4_PHOTO_WIDTH_MM,
  DEFAULT_A4_PHOTO_HEIGHT_MM,
  DEFAULT_4X6_PHOTO_WIDTH_MM,
  DEFAULT_4X6_PHOTO_HEIGHT_MM,
  DEFAULT_4X6_LANDSCAPE_PHOTO_WIDTH_MM,
  DEFAULT_4X6_LANDSCAPE_PHOTO_HEIGHT_MM,
} from '../src/lib/multiple-photo/multiple-photo-engine.ts';

import {
  calculatePhotoSheetLayout,
  calculateSheetDimensions,
  calculateMaxSheetCapacity,
} from '../src/lib/photo-studio/sheet-calculator.ts';

import {
  DEFAULT_A4_SHEET_CONFIG,
  DEFAULT_PHOTO_SHEET_CONFIG,
  DEFAULT_4X6_LANDSCAPE_SHEET_CONFIG,
  DEFAULT_A4_SHEET_MARGINS,
  DEFAULT_SHEET_MARGINS,
  DEFAULT_4X6_LANDSCAPE_SHEET_MARGINS,
  DEFAULT_A4_SHEET_SPACING,
  DEFAULT_4X6_SHEET_SPACING,
  DEFAULT_4X6_LANDSCAPE_SHEET_SPACING,
} from '../src/constants/photo-sheet.ts';

describe('SYNCHRONIZATION VERIFICATION: Multiple Photo Maker & Professional Photo Studio Parity', () => {

  const createMockPhoto = (id, name, width = 1200, height = 1600, copies = 1) => ({
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
  // 1. A4 Default Layout Synchronization (27 × 32 mm, 56 Photos)
  // =========================================================================
  describe('1. A4 Sheet Layout & Capacity Parity (27 × 32 mm)', () => {
    it('produces identical sheet calculation results between Studio default and Multiple Photo config', () => {
      // 1. Studio layout calculation
      const studioDims = {
        widthMm: DEFAULT_A4_PHOTO_WIDTH_MM,
        heightMm: DEFAULT_A4_PHOTO_HEIGHT_MM,
      };
      const studioLayout = calculatePhotoSheetLayout(DEFAULT_A4_SHEET_CONFIG, studioDims);

      // 2. Multiple Photo Maker arrangement
      const multiConfig = createDefaultMultiplePhotoConfig('a4');
      const photos = Array.from({ length: 56 }, (_, i) =>
        createMockPhoto(`p-${i}`, `photo_${i}.jpg`, 1200, 1600, 1)
      );

      const multiArrangement = calculateMultiPhotoArrangement(
        photos,
        multiConfig,
        calculatePhotoSheetLayout
      );

      // Verify identical sheet geometry
      assert.equal(multiArrangement.layout.paperSize, studioLayout.paperSize);
      assert.equal(multiArrangement.layout.orientation, studioLayout.orientation);
      assert.equal(multiArrangement.layout.dpi, studioLayout.dpi);
      assert.equal(multiArrangement.layout.sheetWidthMm, studioLayout.sheetWidthMm);
      assert.equal(multiArrangement.layout.sheetHeightMm, studioLayout.sheetHeightMm);

      // Verify identical column and row calculations
      assert.equal(multiArrangement.layout.maxColumns, studioLayout.maxColumns);
      assert.equal(multiArrangement.layout.maxRows, studioLayout.maxRows);
      assert.equal(multiArrangement.layout.maxCapacity, 56);
      assert.equal(studioLayout.maxCapacity, 56);
      assert.equal(multiArrangement.layout.activeColumns, 7);
      assert.equal(multiArrangement.layout.activeRows, 8);
      assert.equal(multiArrangement.totalPlacedPhotos, 56);

      // Verify identical placement coordinates for all 56 slots
      assert.equal(multiArrangement.layout.placements.length, studioLayout.placements.length);
      for (let i = 0; i < 56; i++) {
        const multiP = multiArrangement.layout.placements[i];
        const studioP = studioLayout.placements[i];
        assert.equal(multiP.row, studioP.row, `Slot ${i} row mismatch`);
        assert.equal(multiP.col, studioP.col, `Slot ${i} col mismatch`);
        assert.equal(multiP.xMm, studioP.xMm, `Slot ${i} xMm mismatch`);
        assert.equal(multiP.yMm, studioP.yMm, `Slot ${i} yMm mismatch`);
        assert.equal(multiP.widthMm, studioP.widthMm, `Slot ${i} widthMm mismatch`);
        assert.equal(multiP.heightMm, studioP.heightMm, `Slot ${i} heightMm mismatch`);
        assert.equal(multiP.xPx, studioP.xPx, `Slot ${i} xPx mismatch`);
        assert.equal(multiP.yPx, studioP.yPx, `Slot ${i} yPx mismatch`);
      }
    });
  });

  // =========================================================================
  // 2. 4×6 Landscape Layout Synchronization (24.55 × 30.14 mm, 15 Photos)
  // =========================================================================
  describe('2. 4×6 Landscape Sheet Layout & Capacity Parity (24.55 × 30.14 mm)', () => {
    it('produces identical 15-photo layout between Studio landscape default and Multiple Photo config', () => {
      // 1. Studio layout calculation
      const studioDims = {
        widthMm: DEFAULT_4X6_LANDSCAPE_PHOTO_WIDTH_MM,
        heightMm: DEFAULT_4X6_LANDSCAPE_PHOTO_HEIGHT_MM,
      };
      const studioLayout = calculatePhotoSheetLayout(DEFAULT_4X6_LANDSCAPE_SHEET_CONFIG, studioDims);

      // 2. Multiple Photo Maker arrangement
      const multiConfig = createDefaultMultiplePhotoConfig('4x6', 'landscape');
      const photos = Array.from({ length: 15 }, (_, i) =>
        createMockPhoto(`p-${i}`, `photo_${i}.jpg`, 1200, 1600, 1)
      );

      const multiArrangement = calculateMultiPhotoArrangement(
        photos,
        multiConfig,
        calculatePhotoSheetLayout
      );

      // Verify identical sheet geometry
      assert.equal(multiArrangement.layout.paperSize, '4x6');
      assert.equal(multiArrangement.layout.orientation, 'landscape');
      assert.equal(multiArrangement.layout.maxColumns, 5);
      assert.equal(multiArrangement.layout.maxRows, 3);
      assert.equal(multiArrangement.layout.maxCapacity, 15);
      assert.equal(studioLayout.maxCapacity, 15);
      assert.equal(multiArrangement.totalPlacedPhotos, 15);

      // Verify placements match exactly
      for (let i = 0; i < 15; i++) {
        const multiP = multiArrangement.layout.placements[i];
        const studioP = studioLayout.placements[i];
        assert.equal(multiP.row, studioP.row);
        assert.equal(multiP.col, studioP.col);
        assert.equal(multiP.xMm, studioP.xMm);
        assert.equal(multiP.yMm, studioP.yMm);
      }
    });
  });

  // =========================================================================
  // 3. 4×6 Portrait Layout Synchronization (1.1 × 1.35 in, 12 Photos)
  // =========================================================================
  describe('3. 4×6 Portrait Sheet Layout & Capacity Parity (1.1 × 1.35 in)', () => {
    it('produces identical 12-photo layout between Studio portrait default and Multiple Photo config', () => {
      // 1. Studio layout calculation
      const studioDims = {
        widthMm: DEFAULT_4X6_PHOTO_WIDTH_MM,
        heightMm: DEFAULT_4X6_PHOTO_HEIGHT_MM,
      };
      const studioLayout = calculatePhotoSheetLayout(DEFAULT_PHOTO_SHEET_CONFIG, studioDims);

      // 2. Multiple Photo Maker arrangement
      const multiConfig = createDefaultMultiplePhotoConfig('4x6', 'portrait');
      const photos = Array.from({ length: 12 }, (_, i) =>
        createMockPhoto(`p-${i}`, `photo_${i}.jpg`, 1200, 1600, 1)
      );

      const multiArrangement = calculateMultiPhotoArrangement(
        photos,
        multiConfig,
        calculatePhotoSheetLayout
      );

      assert.equal(multiArrangement.layout.paperSize, '4x6');
      assert.equal(multiArrangement.layout.orientation, 'portrait');
      assert.equal(multiArrangement.layout.maxColumns, 3);
      assert.equal(multiArrangement.layout.maxRows, 4);
      assert.equal(multiArrangement.layout.maxCapacity, 12);
      assert.equal(studioLayout.maxCapacity, 12);
      assert.equal(multiArrangement.totalPlacedPhotos, 12);

      // Verify placements match exactly
      for (let i = 0; i < 12; i++) {
        const multiP = multiArrangement.layout.placements[i];
        const studioP = studioLayout.placements[i];
        assert.equal(multiP.row, studioP.row);
        assert.equal(multiP.col, studioP.col);
        assert.equal(multiP.xMm, studioP.xMm);
        assert.equal(multiP.yMm, studioP.yMm);
      }
    });
  });

  // =========================================================================
  // 4. Standard Passport Photo (35 × 45 mm) Parity Across Both Tools
  // =========================================================================
  describe('4. Standard Passport Photo (35 × 45 mm) Layout Parity', () => {
    it('produces identical A4 placement grid for 35 × 45 mm photos', () => {
      const passportDims = { widthMm: 35, heightMm: 45 };

      // Photo Studio A4 configuration for passport photos
      const studioPassportConfig = {
        ...DEFAULT_A4_SHEET_CONFIG,
        copies: 30,
      };
      const studioLayout = calculatePhotoSheetLayout(studioPassportConfig, passportDims);

      // Multiple Photo Maker configuration for passport photos
      const multiPassportConfig = {
        ...createDefaultMultiplePhotoConfig('a4'),
        dimensions: { width: 35, height: 45, unit: 'mm' },
        columnsMode: 'auto',
      };
      const photos = Array.from({ length: 30 }, (_, i) =>
        createMockPhoto(`p-${i}`, `passport_${i}.jpg`, 1200, 1600, 1)
      );
      const multiArrangement = calculateMultiPhotoArrangement(
        photos,
        multiPassportConfig,
        calculatePhotoSheetLayout
      );

      // Both should yield identical columns, rows, capacity, and placements
      assert.equal(multiArrangement.layout.maxColumns, studioLayout.maxColumns);
      assert.equal(multiArrangement.layout.maxRows, studioLayout.maxRows);
      assert.equal(multiArrangement.layout.maxCapacity, studioLayout.maxCapacity);
      assert.equal(multiArrangement.layout.placements.length, studioLayout.placements.length);

      for (let i = 0; i < studioLayout.placements.length; i++) {
        assert.equal(multiArrangement.layout.placements[i].xMm, studioLayout.placements[i].xMm);
        assert.equal(multiArrangement.layout.placements[i].yMm, studioLayout.placements[i].yMm);
      }
    });
  });

  // =========================================================================
  // 5. Multi-sheet Pagination Exact Boundaries
  // =========================================================================
  describe('5. Multi-sheet Pagination Exact Boundaries', () => {
    it('generates exactly 2 pages when photos exceed 56 on A4', () => {
      const multiConfig = createDefaultMultiplePhotoConfig('a4');
      // 60 photos -> 56 on Page 1, 4 on Page 2
      const photos = Array.from({ length: 60 }, (_, i) =>
        createMockPhoto(`p-${i}`, `p_${i}.jpg`, 1200, 1600, 1)
      );

      const pages = calculateMultiSheetPages(photos, multiConfig, calculatePhotoSheetLayout);
      assert.equal(pages.length, 2);
      assert.equal(pages[0].photos.length, 56);
      assert.equal(pages[1].photos.length, 4);
      assert.equal(pages[0].layout.totalPhotos, 56);
      assert.equal(pages[1].layout.totalPhotos, 4);
    });
  });
});
