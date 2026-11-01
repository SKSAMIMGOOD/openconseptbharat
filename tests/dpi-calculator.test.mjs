import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  mmToPixels,
  pixelsToMm,
  calculatePixelDimensions,
  validatePhysicalInputs,
  calculateProportionalDimension,
  calculateEffectiveDpi,
  assessResolutionQuality,
  getFriendlyAspectRatioName,
} from '../src/lib/photo-studio/dpi-calculator.ts';

import {
  MM_PER_INCH,
  PHOTO_DIMENSION_PRESETS,
  SUPPORTED_DPI_PRESETS,
} from '../src/constants/photo-dimensions.ts';

describe('PHASE 03B: DPI & Physical Photo Size Calculator Test Suite', () => {

  // 1. Standard Passport Size: 35 × 45 mm at 300 DPI
  describe('1. 35 × 45 mm at 300 DPI Specification', () => {
    it('calculates expected 413 × 531 pixels for 35 × 45 mm at 300 DPI', () => {
      const widthPx = mmToPixels(35, 300);
      const heightPx = mmToPixels(45, 300);

      assert.equal(widthPx, 413, 'Width at 300 DPI should be 413 pixels');
      assert.equal(heightPx, 531, 'Height at 300 DPI should be 531 pixels');

      const result = calculatePixelDimensions({ widthMm: 35, heightMm: 45, dpi: 300 });
      assert.equal(result.isValid, true);
      assert.equal(result.widthPx, 413);
      assert.equal(result.heightPx, 531);
      assert.match(result.aspectRatioFormatted, /35:45 Passport/);
    });
  });

  // 2. High Resolution Print: 35 × 45 mm at 600 DPI
  describe('2. 35 × 45 mm at 600 DPI Archival Specification', () => {
    it('calculates expected 827 × 1063 pixels for 35 × 45 mm at 600 DPI', () => {
      const widthPx = mmToPixels(35, 600);
      const heightPx = mmToPixels(45, 600);

      // (35 / 25.4) * 600 = 826.77 -> Math.round -> 827
      assert.equal(widthPx, 827, 'Width at 600 DPI should round to 827 pixels');
      // (45 / 25.4) * 600 = 1062.99 -> Math.round -> 1063
      assert.equal(heightPx, 1063, 'Height at 600 DPI should round to 1063 pixels');

      const result = calculatePixelDimensions({ widthMm: 35, heightMm: 45, dpi: 600 });
      assert.equal(result.isValid, true);
      assert.equal(result.widthPx, 827);
      assert.equal(result.heightPx, 1063);
    });
  });

  // 3. Alternative Standard Size: 40 × 50 mm at 300 DPI
  describe('3. 40 × 50 mm at 300 DPI Specification', () => {
    it('calculates expected 472 × 591 pixels for 40 × 50 mm at 300 DPI', () => {
      // (40 / 25.4) * 300 = 472.44 -> 472
      const widthPx = mmToPixels(40, 300);
      // (50 / 25.4) * 300 = 590.55 -> 591
      const heightPx = mmToPixels(50, 300);

      assert.equal(widthPx, 472, 'Width at 300 DPI should be 472 pixels');
      assert.equal(heightPx, 591, 'Height at 300 DPI should be 591 pixels');

      const result = calculatePixelDimensions({ widthMm: 40, heightMm: 50, dpi: 300 });
      assert.equal(result.isValid, true);
      assert.equal(result.widthPx, 472);
      assert.equal(result.heightPx, 591);
    });
  });

  // 4. Custom Dimensions
  describe('4. Custom Dimensions Support', () => {
    it('calculates custom dimension presets accurately', () => {
      // Indian PAN photo: 25 × 35 mm at 300 DPI
      // (25 / 25.4) * 300 = 295.275 -> 295
      // (35 / 25.4) * 300 = 413.385 -> 413
      const panResult = calculatePixelDimensions({ widthMm: 25, heightMm: 35, dpi: 300 });
      assert.equal(panResult.isValid, true);
      assert.equal(panResult.widthPx, 295);
      assert.equal(panResult.heightPx, 413);

      // Large custom portrait: 100 × 150 mm at 150 DPI
      // (100 / 25.4) * 150 = 590.55 -> 591
      // (150 / 25.4) * 150 = 885.82 -> 886
      const largeResult = calculatePixelDimensions({ widthMm: 100, heightMm: 150, dpi: 150 });
      assert.equal(largeResult.isValid, true);
      assert.equal(largeResult.widthPx, 591);
      assert.equal(largeResult.heightPx, 886);
    });
  });

  // 5. Decimal Dimensions
  describe('5. Decimal Millimetre Dimensions', () => {
    it('accurately handles exact decimal values for inch-based conversions', () => {
      // 2.0 inches = exactly 50.8 mm
      // At 300 DPI: (50.8 / 25.4) * 300 = 2 * 300 = 600 px exactly
      const usVisaResult = calculatePixelDimensions({ widthMm: 50.8, heightMm: 50.8, dpi: 300 });
      assert.equal(usVisaResult.isValid, true);
      assert.equal(usVisaResult.widthPx, 600);
      assert.equal(usVisaResult.heightPx, 600);

      // 1.5 inches = 38.1 mm
      // At 300 DPI: (38.1 / 25.4) * 300 = 1.5 * 300 = 450 px exactly
      const inchResult = calculatePixelDimensions({ widthMm: 38.1, heightMm: 38.1, dpi: 300 });
      assert.equal(inchResult.isValid, true);
      assert.equal(inchResult.widthPx, 450);
      assert.equal(inchResult.heightPx, 450);

      // Arbitrary decimal: 35.5 × 45.5 mm at 300 DPI
      // (35.5 / 25.4) * 300 = 419.29 -> 419
      // (45.5 / 25.4) * 300 = 537.40 -> 537
      const decimalResult = calculatePixelDimensions({ widthMm: 35.5, heightMm: 45.5, dpi: 300 });
      assert.equal(decimalResult.isValid, true);
      assert.equal(decimalResult.widthPx, 419);
      assert.equal(decimalResult.heightPx, 537);
    });
  });

  // 6. Invalid Dimensions
  describe('6. Invalid Dimension Validation and Rejection', () => {
    it('rejects zero width or height dimensions', () => {
      const res1 = validatePhysicalInputs(0, 45, 300);
      assert.equal(res1.isValid, false);
      assert.ok(res1.errors.width);

      const res2 = validatePhysicalInputs(35, 0, 300);
      assert.equal(res2.isValid, false);
      assert.ok(res2.errors.height);
    });

    it('rejects negative width or height dimensions', () => {
      const res = validatePhysicalInputs(-35, 45, 300);
      assert.equal(res.isValid, false);
      assert.ok(res.errors.width);
    });

    it('rejects NaN, Infinity, and non-numeric dimensions', () => {
      const resNaN = validatePhysicalInputs(NaN, 45, 300);
      assert.equal(resNaN.isValid, false);
      assert.ok(resNaN.errors.width);

      const resInf = validatePhysicalInputs(35, Infinity, 300);
      assert.equal(resInf.isValid, false);
      assert.ok(resInf.errors.height);
    });

    it('rejects dimensions smaller than minimum threshold (1 mm)', () => {
      const res = validatePhysicalInputs(0.5, 45, 300);
      assert.equal(res.isValid, false);
      assert.ok(res.errors.width);
    });

    it('rejects unreasonably large dimensions (> 1000 mm / 1 meter)', () => {
      const res = validatePhysicalInputs(1500, 45, 300);
      assert.equal(res.isValid, false);
      assert.ok(res.errors.width);
      assert.match(res.errors.width, /exceeds maximum limit/);
    });
  });

  // 7. Zero and Negative DPI
  describe('7. Zero, Negative, and Boundary DPI Validation', () => {
    it('rejects zero DPI value', () => {
      const res = validatePhysicalInputs(35, 45, 0);
      assert.equal(res.isValid, false);
      assert.ok(res.errors.dpi);
    });

    it('rejects negative DPI values', () => {
      const res = validatePhysicalInputs(35, 45, -300);
      assert.equal(res.isValid, false);
      assert.ok(res.errors.dpi);
    });

    it('rejects DPI below minimum threshold (30 DPI)', () => {
      const res = validatePhysicalInputs(35, 45, 20);
      assert.equal(res.isValid, false);
      assert.ok(res.errors.dpi);
    });

    it('rejects unreasonably high DPI values (> 2400 DPI)', () => {
      const res = validatePhysicalInputs(35, 45, 4800);
      assert.equal(res.isValid, false);
      assert.ok(res.errors.dpi);
      assert.match(res.errors.dpi, /cannot exceed/);
    });
  });

  // 8. Aspect-Ratio Calculations (Locked vs Unlocked, Width vs Height Driven)
  describe('8. Aspect-Ratio Calculations & Bi-Directional Lock', () => {
    it('calculates reciprocal height when width changes with aspect lock', () => {
      // Base ratio = 35 / 45 = 0.7777777778
      const targetRatio = 35 / 45;
      // Double width to 70mm -> height should double to 90mm
      const newHeight = calculateProportionalDimension('width', 70, targetRatio);
      assert.equal(newHeight, 90);

      // Width changed to 50mm -> height = 50 / (35/45) = 64.29mm
      const newHeight2 = calculateProportionalDimension('width', 50, targetRatio);
      assert.equal(newHeight2, 64.29);
    });

    it('calculates reciprocal width when height changes with aspect lock', () => {
      const targetRatio = 35 / 45;
      // Double height to 90mm -> width should double to 70mm
      const newWidth = calculateProportionalDimension('height', 90, targetRatio);
      assert.equal(newWidth, 70);

      // Height changed to 60mm -> width = 60 * (35/45) = 46.67mm
      const newWidth2 = calculateProportionalDimension('height', 60, targetRatio);
      assert.equal(newWidth2, 46.67);
    });

    it('maintains 1:1 square ratio symmetrically', () => {
      const squareRatio = 1.0;
      assert.equal(calculateProportionalDimension('width', 50.8, squareRatio), 50.8);
      assert.equal(calculateProportionalDimension('height', 50.8, squareRatio), 50.8);
    });
  });

  // 9. Sufficient Source Resolution Detection
  describe('9. Resolution Analysis: Sufficient Resolution (Tier A)', () => {
    it('identifies source with sufficient pixels for 300 DPI print', () => {
      // Target: 35 × 45 mm at 300 DPI requires 413 × 531 px
      // Source image: 1200 × 1600 px (well above requirements)
      const assessment = assessResolutionQuality(1200, 1600, 35, 45, 300);

      assert.equal(assessment.tier, 'sufficient');
      assert.equal(assessment.badgeVariant, 'emerald');
      assert.ok(assessment.scaleFactor <= 1.0);
      assert.ok(assessment.effectiveDpi.effectiveDpi >= 300);
      assert.match(assessment.description, /exceeds the required/);
    });
  });

  // 10. Upscaling Detection (Moderate vs Significant)
  describe('10. Resolution Analysis: Upscaling Detection (Tiers B & C)', () => {
    it('detects moderate upscaling required when source is slightly below target', () => {
      // Target: 35 × 45 mm at 300 DPI requires 413 × 531 px
      // Source image: 350 × 450 px (scale factor ~ 413 / 350 = 1.18x <= 1.5x)
      const assessment = assessResolutionQuality(350, 450, 35, 45, 300);

      assert.equal(assessment.tier, 'upscaling_required');
      assert.equal(assessment.badgeVariant, 'amber');
      assert.ok(assessment.scaleFactor > 1.0 && assessment.scaleFactor <= 1.5);
      assert.match(assessment.description, /software interpolation will be required/i);
    });

    it('detects significant upscaling required when source is substantially smaller', () => {
      // Target: 35 × 45 mm at 300 DPI requires 413 × 531 px
      // Source image: 150 × 200 px (scale factor ~ 413 / 150 = 2.75x > 1.5x)
      const assessment = assessResolutionQuality(150, 200, 35, 45, 300);

      assert.equal(assessment.tier, 'significant_upscaling');
      assert.equal(assessment.badgeVariant, 'rose');
      assert.ok(assessment.scaleFactor > 1.5);
      assert.match(assessment.description, /substantially larger than the source/i);
    });

    it('includes explicit disclaimer that upscaling does not recover real detail', () => {
      const assessment = assessResolutionQuality(200, 200, 50, 50, 300);
      assert.match(assessment.disclaimer, /cannot reconstruct or synthesize missing optical photographic detail/i);
    });
  });

  // 11. Aspect-Ratio Mismatch Detection
  describe('11. Aspect-Ratio Mismatch Assessment', () => {
    it('detects mismatch when source ratio differs significantly from target print ratio', () => {
      // Source is 1:1 square (1000 × 1000 px, ratio = 1.0)
      // Target is 35 × 45 mm passport (ratio = 0.7778)
      const assessment = assessResolutionQuality(1000, 1000, 35, 45, 300);

      assert.equal(assessment.aspectRatioMismatch, true);
      assert.ok(assessment.aspectRatioDeviationPercent > 10);
    });

    it('recognizes matching aspect ratios without flagging mismatch', () => {
      // Source: 700 × 900 px (ratio = 7/9 = 0.7778)
      // Target: 35 × 45 mm (ratio = 35/45 = 0.7778)
      const assessment = assessResolutionQuality(700, 900, 35, 45, 300);

      assert.equal(assessment.aspectRatioMismatch, false);
      assert.ok(assessment.aspectRatioDeviationPercent <= 1.5);
    });
  });

  // 12. Effective DPI Calculation
  describe('12. Effective Available DPI Calculation & Limiting Axis', () => {
    it('calculates effective DPI along both axes and identifies limiting constraint', () => {
      // Source: 1000 × 1200 px for 35 × 45 mm
      // Width: (1000 * 25.4) / 35 = 725.71 -> Math.round -> 726 DPI
      // Height: (1200 * 25.4) / 45 = 677.33 -> Math.round -> 677 DPI
      // Limiting effective DPI = min(726, 677) = 677 DPI (height limited)
      const details = calculateEffectiveDpi(1000, 1200, 35, 45);

      assert.equal(details.effectiveDpiWidth, 726);
      assert.equal(details.effectiveDpiHeight, 677);
      assert.equal(details.effectiveDpi, 677);
      assert.equal(details.limitingAxis, 'height');
    });

    it('identifies width as limiting axis when width is relatively narrower', () => {
      // Source: 500 × 1200 px for 35 × 45 mm
      // Width: (500 * 25.4) / 35 = 362.8 -> 363 DPI
      // Height: (1200 * 25.4) / 45 = 677.3 -> 677 DPI
      const details = calculateEffectiveDpi(500, 1200, 35, 45);

      assert.equal(details.effectiveDpiWidth, 363);
      assert.equal(details.effectiveDpiHeight, 677);
      assert.equal(details.effectiveDpi, 363);
      assert.equal(details.limitingAxis, 'width');
    });

    it('returns zero for invalid or non-positive input dimensions', () => {
      const details = calculateEffectiveDpi(0, 1000, 35, 45);
      assert.equal(details.effectiveDpi, 0);
    });
  });

  // Precision and Rounding Strategy Tests
  describe('13. Calculation Precision & Rounding Strategy', () => {
    it('respects default round vs floor vs ceil strategies', () => {
      // 35 mm at 300 DPI = 413.3858...
      assert.equal(mmToPixels(35, 300, 'round'), 413);
      assert.equal(mmToPixels(35, 300, 'floor'), 413);
      assert.equal(mmToPixels(35, 300, 'ceil'), 414);

      // 45 mm at 300 DPI = 531.4960...
      assert.equal(mmToPixels(45, 300, 'round'), 531);
      assert.equal(mmToPixels(45, 300, 'floor'), 531);
      assert.equal(mmToPixels(45, 300, 'ceil'), 532);
    });

    it('performs reversible pixelsToMm conversion within rounding margins', () => {
      const px = mmToPixels(35, 300); // 413
      const mm = pixelsToMm(px, 300); // 413 / 300 * 25.4 = 34.97 mm
      assert.ok(Math.abs(mm - 35) < 0.05);
    });

    it('verifies preset list integrity and supported DPI presets', () => {
      assert.equal(SUPPORTED_DPI_PRESETS.length, 5);
      assert.deepEqual(SUPPORTED_DPI_PRESETS, [72, 150, 200, 300, 600]);

      assert.ok(PHOTO_DIMENSION_PRESETS.length >= 6);
      const standardPassport = PHOTO_DIMENSION_PRESETS.find(p => p.id === 'passport_standard');
      assert.ok(standardPassport);
      assert.equal(standardPassport.widthMm, 35);
      assert.equal(standardPassport.heightMm, 45);
    });
  });

});
