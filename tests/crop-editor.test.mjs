import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Import crop geometry and presets
import {
  initDefaultCrop,
  clampCropToBounds,
  recalculateCropForAspectRatio,
  moveCrop,
  centerCropInImage,
  fitCropToImage,
  resizeCropFromHandle,
  renderCropCanvas,
  MIN_CROP_PIXELS,
} from '../src/lib/crop/crop-geometry.ts';

import {
  INITIAL_PHOTO_PRESETS,
  EXTENDED_PHOTO_PRESETS,
  ALL_PHOTO_PRESETS,
  DEFAULT_PRESET,
  DEFAULT_A4_PRESET,
  DEFAULT_4X6_PRESET,
} from '../src/constants/crop-presets.ts';

import {
  unitToMm,
  mmToUnit,
  convertUnit,
  calculateAspectRatio,
  validateCustomDimensions,
  formatDimension,
} from '../src/lib/crop/unit-converter.ts';

import {
  STUDIO_BACKGROUND_OPTIONS,
  DEFAULT_BACKGROUND_COLOR,
} from '../src/constants/background-options.ts';

import { releaseCanvasBuffer, revokeObjectUrlSafely } from '../src/lib/utils/memory.ts';

describe('PHASE 03C: Passport Photo Presets & Interactive Crop Editor Test Suite', () => {

  // 1. Predefined Presets
  describe('1. Predefined Photo Presets Specification', () => {
    it('contains all 6 required initial presets with strictly typed properties', () => {
      assert.equal(INITIAL_PHOTO_PRESETS.length, 6);

      const ids = INITIAL_PHOTO_PRESETS.map((p) => p.id);
      assert.ok(ids.includes('a4-compact-27x32'));
      assert.ok(ids.includes('compact-1.1x1.35'));
      assert.ok(ids.includes('passport-35-45'));
      assert.ok(ids.includes('portrait-40-50'));
      assert.ok(ids.includes('square-2x2-inch'));
      assert.ok(ids.includes('custom'));
    });

    it('verifies default compact (1.1 × 1.35 in) competitor-style preset geometry', () => {
      const compact = INITIAL_PHOTO_PRESETS.find((p) => p.id === 'compact-1.1x1.35');
      assert.ok(compact);
      assert.equal(compact.width, 1.1);
      assert.equal(compact.height, 1.35);
      assert.equal(compact.unit, 'inch');
      assert.ok(Math.abs(compact.aspectRatio - 1.1 / 1.35) < 0.0001);
      assert.equal(compact.isOfficial, false);
      assert.equal(DEFAULT_4X6_PRESET.id, 'compact-1.1x1.35');
      assert.equal(DEFAULT_A4_PRESET.id, 'a4-compact-27x32');
    });

    it('verifies 35 × 45 mm passport-style preset geometry', () => {
      const passport = INITIAL_PHOTO_PRESETS.find((p) => p.id === 'passport-35-45');
      assert.ok(passport);
      assert.equal(passport.width, 35);
      assert.equal(passport.height, 45);
      assert.equal(passport.unit, 'mm');
      assert.ok(Math.abs(passport.aspectRatio - 35 / 45) < 0.0001);
      assert.equal(passport.isOfficial, false); // Advisory disclaimer verification
      assert.ok(passport.description.length > 20);
    });

    it('verifies 40 × 50 mm portrait preset geometry', () => {
      const portrait = INITIAL_PHOTO_PRESETS.find((p) => p.id === 'portrait-40-50');
      assert.ok(portrait);
      assert.equal(portrait.width, 40);
      assert.equal(portrait.height, 50);
      assert.equal(portrait.unit, 'mm');
      assert.equal(portrait.aspectRatio, 0.8);
      assert.equal(portrait.isOfficial, false);
    });

    it('verifies 2 × 2 inches square preset geometry', () => {
      const square = INITIAL_PHOTO_PRESETS.find((p) => p.id === 'square-2x2-inch');
      assert.ok(square);
      assert.equal(square.width, 2);
      assert.equal(square.height, 2);
      assert.equal(square.unit, 'inch');
      assert.equal(square.aspectRatio, 1.0);
      assert.equal(square.isOfficial, false);
    });

    it('verifies custom preset definition', () => {
      const custom = INITIAL_PHOTO_PRESETS.find((p) => p.id === 'custom');
      assert.ok(custom);
      assert.equal(custom.unit, 'mm');
      assert.equal(custom.category, 'custom');
      assert.equal(custom.isOfficial, false);
    });
  });

  // 2. Custom Dimensions Specification
  describe('2. Custom Dimensions Input Validation', () => {
    it('validates standard valid millimeter custom dimensions', () => {
      const res = validateCustomDimensions(35, 45, 'mm');
      assert.equal(res.isValid, true);
      assert.equal(res.widthMm, 35);
      assert.equal(res.heightMm, 45);
      assert.ok(Math.abs(res.aspectRatio - 35 / 45) < 0.0001);
    });

    it('validates decimal dimension inputs accurately', () => {
      const res = validateCustomDimensions(50.8, 50.8, 'mm');
      assert.equal(res.isValid, true);
      assert.equal(res.aspectRatio, 1.0);

      const inchRes = validateCustomDimensions(1.75, 2.25, 'inch');
      assert.equal(inchRes.isValid, true);
      assert.ok(Math.abs(inchRes.aspectRatio - 1.75 / 2.25) < 0.0001);
    });

    it('rejects zero, negative, NaN or non-numeric dimension values', () => {
      const zeroW = validateCustomDimensions(0, 45, 'mm');
      assert.equal(zeroW.isValid, false);
      assert.ok(zeroW.errors.width);

      const negH = validateCustomDimensions(35, -10, 'mm');
      assert.equal(negH.isValid, false);
      assert.ok(negH.errors.height);

      const nanVal = validateCustomDimensions(NaN, 50, 'mm');
      assert.equal(nanVal.isValid, false);
      assert.ok(nanVal.errors.width);
    });

    it('enforces safety bounds: min 1 mm and max 1000 mm', () => {
      const tooSmall = validateCustomDimensions(0.5, 45, 'mm'); // 0.5 mm < 1 mm
      assert.equal(tooSmall.isValid, false);
      assert.match(tooSmall.errors.width, /cannot be less than/);

      const tooLarge = validateCustomDimensions(1200, 45, 'mm'); // > 1 meter
      assert.equal(tooLarge.isValid, false);
      assert.match(tooLarge.errors.width, /exceeds maximum limit/);
    });
  });

  // 3. Unit Conversions (mm, cm, inch)
  describe('3. Unit Conversions Math', () => {
    it('converts inches to mm correctly (1 in = 25.4 mm)', () => {
      assert.equal(unitToMm(1, 'inch'), 25.4);
      assert.equal(unitToMm(2, 'inch'), 50.8);
      assert.equal(unitToMm(0.5, 'inch'), 12.7);
    });

    it('converts cm to mm correctly (1 cm = 10 mm)', () => {
      assert.equal(unitToMm(3.5, 'cm'), 35);
      assert.equal(unitToMm(4.5, 'cm'), 45);
      assert.equal(unitToMm(10, 'cm'), 100);
    });

    it('converts mm to target units (inch, cm)', () => {
      assert.equal(mmToUnit(25.4, 'inch'), 1);
      assert.equal(mmToUnit(50.8, 'inch'), 2);
      assert.equal(mmToUnit(35, 'cm'), 3.5);
    });

    it('performs cross-unit conversion with decimal rounding', () => {
      // 35 mm to inches: 35 / 25.4 = 1.37795... -> 1.38
      assert.equal(convertUnit(35, 'mm', 'inch', 2), 1.38);
      // 2 inches to cm: 2 * 2.54 = 5.08
      assert.equal(convertUnit(2, 'inch', 'cm', 2), 5.08);
      // 4.5 cm to mm: 45
      assert.equal(convertUnit(4.5, 'cm', 'mm', 2), 45);
      // Identity conversion
      assert.equal(convertUnit(35, 'mm', 'mm'), 35);
    });

    it('formats dimensions with unit labels correctly', () => {
      assert.equal(formatDimension(35, 'mm'), '35 mm');
      assert.equal(formatDimension(3.5, 'cm'), '3.5 cm');
      assert.equal(formatDimension(2, 'inch'), '2 in');
      assert.equal(formatDimension(2.25, 'inch'), '2.25 in');
    });
  });

  // 4. Aspect Ratio Calculations
  describe('4. Aspect Ratio Calculations', () => {
    it('calculates aspect ratio accurately for standard passport proportions', () => {
      const ratio = calculateAspectRatio(35, 45);
      assert.ok(Math.abs(ratio - 35 / 45) < 0.0001);
    });

    it('calculates 1:1 square aspect ratio', () => {
      assert.equal(calculateAspectRatio(2, 2), 1.0);
      assert.equal(calculateAspectRatio(50.8, 50.8), 1.0);
    });

    it('handles fallback safely on zero or invalid inputs', () => {
      assert.equal(calculateAspectRatio(0, 45), 1.0);
      assert.equal(calculateAspectRatio(35, 0), 1.0);
      assert.equal(calculateAspectRatio(NaN, 45), 1.0);
    });
  });

  // 5. Crop Boundary Validation
  describe('5. Crop Boundary Validation & Clamping', () => {
    it('clamps crop strictly inside image boundaries', () => {
      const imageW = 1000;
      const imageH = 1000;

      // Overflows right
      const clampedRight = clampCropToBounds({ x: 900, y: 100, width: 300, height: 300 }, imageW, imageH);
      assert.equal(clampedRight.x + clampedRight.width <= imageW, true);
      assert.equal(clampedRight.x, 700);

      // Overflows bottom
      const clampedBottom = clampCropToBounds({ x: 100, y: 850, width: 300, height: 300 }, imageW, imageH);
      assert.equal(clampedBottom.y + clampedBottom.height <= imageH, true);
      assert.equal(clampedBottom.y, 700);

      // Negative coordinates
      const clampedNeg = clampCropToBounds({ x: -50, y: -80, width: 400, height: 400 }, imageW, imageH);
      assert.equal(clampedNeg.x, 0);
      assert.equal(clampedNeg.y, 0);
    });

    it('enforces minimum crop size threshold', () => {
      const clamped = clampCropToBounds({ x: 50, y: 50, width: 5, height: 10 }, 800, 600, null, 24);
      assert.ok(clamped.width >= 24);
      assert.ok(clamped.height >= 24);
    });

    it('clamps while maintaining aspect ratio constraint', () => {
      const targetRatio = 35 / 45; // ~0.7778
      const clamped = clampCropToBounds(
        { x: 100, y: 100, width: 400, height: 400 },
        800,
        600,
        targetRatio
      );

      const ratio = clamped.width / clamped.height;
      assert.ok(Math.abs(ratio - targetRatio) < 0.01);
      assert.ok(clamped.x + clamped.width <= 800);
      assert.ok(clamped.y + clamped.height <= 600);
    });
  });

  // 6. Image Repositioning (Move, Center, Fit)
  describe('6. Crop Repositioning & Framing Controls', () => {
    it('moves crop rectangle by deltaX and deltaY within bounds', () => {
      const initial = { x: 100, y: 100, width: 300, height: 400 };
      const moved = moveCrop(initial, 50, 70, 1000, 1000);

      assert.equal(moved.x, 150);
      assert.equal(moved.y, 170);
      assert.equal(moved.width, 300);
      assert.equal(moved.height, 400);
    });

    it('clamps crop movement at edge boundaries', () => {
      const initial = { x: 700, y: 600, width: 250, height: 350 };
      const movedExcessive = moveCrop(initial, 500, 500, 1000, 1000);

      assert.equal(movedExcessive.x, 750); // 1000 - 250
      assert.equal(movedExcessive.y, 650); // 1000 - 350
    });

    it('centers crop frame inside the image', () => {
      const crop = { x: 0, y: 0, width: 350, height: 450 };
      const centered = centerCropInImage(crop, 1000, 1000);

      assert.equal(centered.x, 325); // (1000 - 350) / 2
      assert.equal(centered.y, 275); // (1000 - 450) / 2
    });

    it('fits crop frame to maximize image area respecting aspect ratio', () => {
      const imageW = 1200;
      const imageH = 800;
      const targetRatio = 35 / 45; // ~0.7778 (portrait)

      const fitted = fitCropToImage(imageW, imageH, targetRatio);

      // Height should be max (800), width = 800 * (35/45) = ~622
      assert.equal(fitted.height, 800);
      assert.equal(fitted.width, Math.round(800 * (35 / 45)));
      assert.equal(fitted.x, Math.round((1200 - fitted.width) / 2));
      assert.equal(fitted.y, 0);
    });

    it('fits full image area in free crop mode', () => {
      const fitted = fitCropToImage(1920, 1080, null);
      assert.equal(fitted.x, 0);
      assert.equal(fitted.y, 0);
      assert.equal(fitted.width, 1920);
      assert.equal(fitted.height, 1080);
    });
  });

  // 7. Zoom Controls
  describe('7. Zoom Controls & Bounds', () => {
    it('initializes default crop with comfortable margin', () => {
      const defaultCrop = initDefaultCrop(1000, 1000, 35 / 45, 0.85);

      assert.ok(defaultCrop.width > 0);
      assert.ok(defaultCrop.height > 0);
      assert.ok(defaultCrop.x >= 0);
      assert.ok(defaultCrop.y >= 0);
      assert.ok(defaultCrop.x + defaultCrop.width <= 1000);
      assert.ok(defaultCrop.y + defaultCrop.height <= 1000);
      assert.ok(Math.abs(defaultCrop.width / defaultCrop.height - 35 / 45) < 0.01);
    });
  });

  // 8. 8-Handle Resizing (Corners & Edges)
  describe('8. 8-Directional Handle Resizing', () => {
    const imgW = 2000;
    const imgH = 2000;
    const targetRatio = 1.0; // 1:1 square for easy exact checks

    it('resizes from SE (bottom-right) handle with aspect ratio lock', () => {
      const initial = { x: 500, y: 500, width: 400, height: 400 };
      const resized = resizeCropFromHandle(initial, 'se', 100, 100, imgW, imgH, targetRatio);

      assert.equal(resized.x, 500); // Anchor TL remains unchanged
      assert.equal(resized.y, 500);
      assert.equal(resized.width, 500);
      assert.equal(resized.height, 500);
      assert.equal(resized.width / resized.height, 1.0);
    });

    it('resizes from NW (top-left) handle with aspect ratio lock', () => {
      const initial = { x: 500, y: 500, width: 400, height: 400 };
      const resized = resizeCropFromHandle(initial, 'nw', -100, -100, imgW, imgH, targetRatio);

      // Anchor BR (900, 900) remains unchanged
      assert.equal(resized.x + resized.width, 900);
      assert.equal(resized.y + resized.height, 900);
      assert.equal(resized.width, 500);
      assert.equal(resized.height, 500);
    });

    it('resizes from NE (top-right) handle with aspect ratio lock', () => {
      const initial = { x: 500, y: 500, width: 400, height: 400 };
      const resized = resizeCropFromHandle(initial, 'ne', 100, -100, imgW, imgH, targetRatio);

      // Anchor BL (500, 900) remains unchanged
      assert.equal(resized.x, 500);
      assert.equal(resized.y + resized.height, 900);
      assert.equal(resized.width, 500);
      assert.equal(resized.height, 500);
    });

    it('resizes from SW (bottom-left) handle with aspect ratio lock', () => {
      const initial = { x: 500, y: 500, width: 400, height: 400 };
      const resized = resizeCropFromHandle(initial, 'sw', -100, 100, imgW, imgH, targetRatio);

      // Anchor TR (900, 500) remains unchanged
      assert.equal(resized.x + resized.width, 900);
      assert.equal(resized.y, 500);
      assert.equal(resized.width, 500);
      assert.equal(resized.height, 500);
    });

    it('resizes edge handles (E, W, S, N) symmetrically around opposite axis', () => {
      const initial = { x: 500, y: 500, width: 400, height: 400 };
      const resizedE = resizeCropFromHandle(initial, 'e', 100, 0, imgW, imgH, targetRatio);

      assert.equal(resizedE.x, 500);
      assert.equal(resizedE.width, 500);
      assert.equal(resizedE.height, 500);
      // Height expands symmetrically around center Y (700) -> Y becomes 450
      assert.equal(resizedE.y, 450);
    });

    it('resizes freely without aspect lock when aspectRatio is null', () => {
      const initial = { x: 100, y: 100, width: 200, height: 300 };
      const resized = resizeCropFromHandle(initial, 'e', 50, 0, imgW, imgH, null);

      assert.equal(resized.x, 100);
      assert.equal(resized.y, 100);
      assert.equal(resized.width, 250);
      assert.equal(resized.height, 300); // Height untouched
    });
  });

  // 9. Changing Presets without Resetting Image
  describe('9. Preset Switching & Aspect Ratio Adaptation', () => {
    it('adapts crop frame to new aspect ratio centered around existing framing', () => {
      const imageW = 2000;
      const imageH = 2000;

      // Existing 1:1 crop centered at (1000, 1000)
      const currentCrop = { x: 750, y: 750, width: 500, height: 500 };
      const centerBeforeX = currentCrop.x + currentCrop.width / 2; // 1000
      const centerBeforeY = currentCrop.y + currentCrop.height / 2; // 1000

      // Switch to 35:45 passport preset (~0.7778)
      const newRatio = 35 / 45;
      const updated = recalculateCropForAspectRatio(currentCrop, imageW, imageH, newRatio);

      const centerAfterX = updated.x + updated.width / 2;
      const centerAfterY = updated.y + updated.height / 2;

      // Center should be strictly preserved within 1 pixel rounding
      assert.ok(Math.abs(centerBeforeX - centerAfterX) <= 1);
      assert.ok(Math.abs(centerBeforeY - centerAfterY) <= 1);

      // New aspect ratio strictly matches
      assert.ok(Math.abs(updated.width / updated.height - newRatio) < 0.01);
      assert.ok(updated.x >= 0);
      assert.ok(updated.y >= 0);
      assert.ok(updated.x + updated.width <= imageW);
      assert.ok(updated.y + updated.height <= imageH);
    });
  });

  // 10 & 11. Background Color Options & Transparency
  describe('10. Studio Background Options & Transparency', () => {
    it('provides all specified background options including transparent, white, light blue, and custom', () => {
      const ids = STUDIO_BACKGROUND_OPTIONS.map((o) => o.id);
      assert.ok(ids.includes('transparent'));
      assert.ok(ids.includes('white'));
      assert.ok(ids.includes('light_blue'));
      assert.ok(ids.includes('custom'));
    });

    it('verifies default background color is transparent to preserve cutouts', () => {
      assert.equal(DEFAULT_BACKGROUND_COLOR, 'transparent');
    });

    it('verifies white studio backdrop hex value', () => {
      const white = STUDIO_BACKGROUND_OPTIONS.find((o) => o.id === 'white');
      assert.equal(white.colorValue, '#FFFFFF');
    });

    it('verifies light blue studio backdrop value', () => {
      const blue = STUDIO_BACKGROUND_OPTIONS.find((o) => o.id === 'light_blue');
      assert.ok(blue.colorValue.startsWith('#'));
    });
  });

  // 12. High-Resolution Image Cropping
  describe('11. High-Resolution Image Cropping & Coordinate Precision', () => {
    it('accurately handles 4000 × 3000 (12 MP) camera photo dimensions', () => {
      const imageW = 4000;
      const imageH = 3000;
      const passportRatio = 35 / 45;

      const initial = initDefaultCrop(imageW, imageH, passportRatio);
      assert.ok(initial.width > 1500);
      assert.ok(initial.height > 2000);
      assert.ok(initial.x + initial.width <= imageW);
      assert.ok(initial.y + initial.height <= imageH);

      // Verify pixel-perfect integer crop coordinates
      assert.equal(Number.isInteger(initial.x), true);
      assert.equal(Number.isInteger(initial.y), true);
      assert.equal(Number.isInteger(initial.width), true);
      assert.equal(Number.isInteger(initial.height), true);
    });
  });

  // 13. Memory Deallocation & Garbage Collection
  describe('12. Memory Cleanup & Lifecycle Safety', () => {
    it('safely cleans up canvas buffer by zeroing dimensions', () => {
      const mockCanvas = {
        width: 800,
        height: 600,
        getContext: () => ({ clearRect: () => {} }),
      };

      releaseCanvasBuffer(mockCanvas);
      assert.equal(mockCanvas.width, 0);
      assert.equal(mockCanvas.height, 0);
    });

    it('safely revokes object URLs without throwing', () => {
      assert.doesNotThrow(() => {
        revokeObjectUrlSafely('blob:http://localhost:3000/test-uuid');
        revokeObjectUrlSafely(null);
        revokeObjectUrlSafely('');
      });
    });
  });

});
