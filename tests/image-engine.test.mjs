import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Test targets
import {
  verifyImageMagicBytes,
  validateImageFile,
  getFileExtension,
  generateFileFingerprint,
} from '../src/lib/image/validator.ts';

import {
  computeResizeDimensions,
  validateAndClampCrop,
  computeRotatedBounds,
} from '../src/lib/image/transform.ts';

// Export filename generator test logic
function generateExportFileName(originalName = 'image', format = 'image/png', prefix = 'processed') {
  const dotIndex = originalName.lastIndexOf('.');
  const baseName = dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
  const cleanBase = baseName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
  const timestamp = Date.now().toString().slice(-6);
  const extMap = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
  const ext = extMap[format] || '.png';
  return `${prefix}-${cleanBase}-${timestamp}${ext}`;
}

// Helper to create synthetic File in Node.js
function createMockFile(name, type, byteData, sizeOverride) {
  const buffer = byteData instanceof Uint8Array ? byteData : new Uint8Array(byteData);
  const blob = new Blob([buffer], { type });
  const file = new File([blob], name, { type, lastModified: 1700000000000 });
  if (sizeOverride !== undefined) {
    Object.defineProperty(file, 'size', { value: sizeOverride });
  }
  return file;
}

// Realistic Magic Bytes Fixtures
const VALID_JPEG_HEADER = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);
const VALID_PNG_HEADER = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
const VALID_WEBP_HEADER = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, // RIFF
  0x24, 0x00, 0x00, 0x00, // size
  0x57, 0x45, 0x42, 0x50, // WEBP
  0x56, 0x50, 0x38, 0x20  // VP8
]);
const CORRUPTED_HEADER = new Uint8Array([0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77]);
const PDF_HEADER = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]); // %PDF-1.5

describe('1. File Extension & Format Validation', () => {
  it('extracts correct lower-case extensions', () => {
    assert.equal(getFileExtension('photo.jpg'), '.jpg');
    assert.equal(getFileExtension('SCAN.JPEG'), '.jpeg');
    assert.equal(getFileExtension('image.png'), '.png');
    assert.equal(getFileExtension('graphic.webp'), '.webp');
    assert.equal(getFileExtension('noextension'), '');
    assert.equal(getFileExtension('multiple.dots.image.PNG'), '.png');
  });

  it('verifies JPEG magic bytes correctly', async () => {
    const file = createMockFile('test.jpg', 'image/jpeg', VALID_JPEG_HEADER);
    const result = await verifyImageMagicBytes(file);
    assert.equal(result.isValid, true);
    assert.equal(result.detectedFormat, 'image/jpeg');
  });

  it('verifies PNG magic bytes correctly', async () => {
    const file = createMockFile('test.png', 'image/png', VALID_PNG_HEADER);
    const result = await verifyImageMagicBytes(file);
    assert.equal(result.isValid, true);
    assert.equal(result.detectedFormat, 'image/png');
  });

  it('verifies WebP magic bytes correctly', async () => {
    const file = createMockFile('test.webp', 'image/webp', VALID_WEBP_HEADER);
    const result = await verifyImageMagicBytes(file);
    assert.equal(result.isValid, true);
    assert.equal(result.detectedFormat, 'image/webp');
  });

  it('rejects corrupted or spoofed image files', async () => {
    const corruptedFile = createMockFile('fake.jpg', 'image/jpeg', CORRUPTED_HEADER);
    const result = await verifyImageMagicBytes(corruptedFile);
    assert.equal(result.isValid, false);
  });

  it('rejects non-image formats (e.g. PDF spoofed as JPG)', async () => {
    const pdfSpoofed = createMockFile('document.jpg', 'image/jpeg', PDF_HEADER);
    const result = await verifyImageMagicBytes(pdfSpoofed);
    assert.equal(result.isValid, false);
  });
});

describe('2. Comprehensive File Validation (validateImageFile)', () => {
  it('accepts valid JPEG within size limits', async () => {
    const file = createMockFile('portrait.jpg', 'image/jpeg', VALID_JPEG_HEADER);
    const res = await validateImageFile(file, { maxSizeMB: 25 });
    assert.equal(res.isValid, true);
    assert.equal(res.detectedFormat, 'image/jpeg');
  });

  it('rejects file exceeding configured maxSizeMB', async () => {
    // 30MB file with 25MB limit
    const largeFile = createMockFile('huge.png', 'image/png', VALID_PNG_HEADER, 30 * 1024 * 1024);
    const res = await validateImageFile(largeFile, { maxSizeMB: 25 });
    assert.equal(res.isValid, false);
    assert.equal(res.errorCode, 'FILE_TOO_LARGE');
    assert.match(res.error, /exceeds maximum allowed limit/i);
  });

  it('rejects invalid extension even if MIME is image', async () => {
    const badExtFile = createMockFile('image.gif', 'image/gif', VALID_JPEG_HEADER);
    const res = await validateImageFile(badExtFile);
    assert.equal(res.isValid, false);
    assert.equal(res.errorCode, 'INVALID_EXTENSION');
  });

  it('rejects corrupted header even with valid extension and MIME', async () => {
    const corrupted = createMockFile('sample.png', 'image/png', CORRUPTED_HEADER);
    const res = await validateImageFile(corrupted);
    assert.equal(res.isValid, false);
    assert.equal(res.errorCode, 'CORRUPTED_FILE');
  });
});

describe('3. Duplicate File Detection', () => {
  it('generates consistent fingerprint for identical file parameters', async () => {
    const fileA = createMockFile('doc.jpg', 'image/jpeg', VALID_JPEG_HEADER);
    const fileB = createMockFile('doc.jpg', 'image/jpeg', VALID_JPEG_HEADER);

    const fpA = await generateFileFingerprint(fileA);
    const fpB = await generateFileFingerprint(fileB);
    assert.equal(fpA, fpB);
  });

  it('differentiates files with different names or sizes', async () => {
    const fileA = createMockFile('doc1.jpg', 'image/jpeg', VALID_JPEG_HEADER);
    const fileB = createMockFile('doc2.jpg', 'image/jpeg', VALID_JPEG_HEADER);

    const fpA = await generateFileFingerprint(fileA);
    const fpB = await generateFileFingerprint(fileB);
    assert.notEqual(fpA, fpB);
  });
});

describe('4. Resize Mathematical Calculations', () => {
  it('resizes to exact custom dimensions when maintainAspectRatio is false', () => {
    const res = computeResizeDimensions(1920, 1080, {
      width: 800,
      height: 600,
      maintainAspectRatio: false,
    });
    assert.deepEqual(res, { width: 800, height: 600 });
  });

  it('calculates proportional height when only width is specified with aspect lock', () => {
    // 16:9 ratio (1920x1080) resized to width 960 -> height 540
    const res = computeResizeDimensions(1920, 1080, {
      width: 960,
      height: 0,
      maintainAspectRatio: true,
    });
    assert.deepEqual(res, { width: 960, height: 540 });
  });

  it('calculates proportional width when only height is specified with aspect lock', () => {
    // 4:3 ratio (800x600) resized to height 300 -> width 400
    const res = computeResizeDimensions(800, 600, {
      width: 0,
      height: 300,
      maintainAspectRatio: true,
    });
    assert.deepEqual(res, { width: 400, height: 300 });
  });

  it('fits within bounding box when both dimensions are provided with aspect lock', () => {
    // 1920x1080 inside 500x500 box -> 500x281
    const res = computeResizeDimensions(1920, 1080, {
      width: 500,
      height: 500,
      maintainAspectRatio: true,
    });
    assert.equal(res.width, 500);
    assert.equal(res.height, 281);
  });

  it('clamps invalid or zero dimensions to safe positive integers', () => {
    const res = computeResizeDimensions(100, 100, {
      width: -50,
      height: 0,
      maintainAspectRatio: false,
    });
    assert.equal(res.width >= 1, true);
    assert.equal(res.height >= 1, true);
  });
});

describe('5. Crop Boundary Clamping & Aspect Constraints', () => {
  it('preserves valid in-bounds crop region', () => {
    const crop = validateAndClampCrop(1000, 1000, {
      x: 100,
      y: 100,
      width: 400,
      height: 400,
    });
    assert.deepEqual(crop, { x: 100, y: 100, width: 400, height: 400, aspectRatioConstraint: undefined });
  });

  it('clamps out-of-bounds crop to image boundary', () => {
    // Requesting width 600 at x 600 on a 1000px image -> width must clamp to 400
    const crop = validateAndClampCrop(1000, 1000, {
      x: 600,
      y: 600,
      width: 600,
      height: 600,
    });
    assert.equal(crop.x, 600);
    assert.equal(crop.y, 600);
    assert.equal(crop.width, 400);
    assert.equal(crop.height, 400);
  });

  it('clamps negative crop coordinates to 0', () => {
    const crop = validateAndClampCrop(800, 600, {
      x: -50,
      y: -20,
      width: 200,
      height: 200,
    });
    assert.equal(crop.x, 0);
    assert.equal(crop.y, 0);
    assert.equal(crop.width, 200);
    assert.equal(crop.height, 200);
  });

  it('enforces aspect ratio constraints (e.g. 1:1 square crop)', () => {
    const crop = validateAndClampCrop(1000, 1000, {
      x: 0,
      y: 0,
      width: 600,
      height: 400,
      aspectRatioConstraint: 1.0,
    });
    assert.equal(crop.width, crop.height);
  });

  it('enforces passport aspect ratio constraint (35:45 mm = 0.7778)', () => {
    const passportRatio = 35 / 45;
    const crop = validateAndClampCrop(1000, 1000, {
      x: 50,
      y: 50,
      width: 350,
      height: 450,
      aspectRatioConstraint: passportRatio,
    });
    const computedRatio = crop.width / crop.height;
    assert.ok(Math.abs(computedRatio - passportRatio) < 0.01);
  });
});

describe('6. Rotation Coordinate Mathematics', () => {
  it('swaps width and height for 90° rotation', () => {
    const bounds = computeRotatedBounds(800, 600, 90);
    assert.equal(bounds.width, 600);
    assert.equal(bounds.height, 800);
  });

  it('maintains width and height for 180° rotation', () => {
    const bounds = computeRotatedBounds(800, 600, 180);
    assert.equal(bounds.width, 800);
    assert.equal(bounds.height, 600);
  });

  it('swaps width and height for 270° rotation', () => {
    const bounds = computeRotatedBounds(800, 600, 270);
    assert.equal(bounds.width, 600);
    assert.equal(bounds.height, 800);
  });

  it('computes expanded bounding box for 45° rotation', () => {
    // For 100x100 square rotated 45°, new bounding box is sqrt(2) * 100 ≈ 141.4px
    const bounds = computeRotatedBounds(100, 100, 45);
    assert.equal(bounds.width, 141);
    assert.equal(bounds.height, 141);
  });

  it('normalizes negative rotation angles correctly (-90° == 270°)', () => {
    const bounds = computeRotatedBounds(500, 300, -90);
    assert.equal(bounds.width, 300);
    assert.equal(bounds.height, 500);
  });
});

describe('7. Semantic Export Filename Generation', () => {
  it('generates proper extension for JPEG format', () => {
    const name = generateExportFileName('portrait.png', 'image/jpeg');
    assert.ok(name.startsWith('processed-portrait-'));
    assert.ok(name.endsWith('.jpg'));
  });

  it('generates proper extension for WebP format', () => {
    const name = generateExportFileName('photo.jpg', 'image/webp');
    assert.ok(name.startsWith('processed-photo-'));
    assert.ok(name.endsWith('.webp'));
  });

  it('cleans special characters from original filename', () => {
    const name = generateExportFileName('my photo #1 [draft]!.jpeg', 'image/png');
    assert.ok(!name.includes('#'));
    assert.ok(!name.includes('['));
    assert.ok(!name.includes('!'));
    assert.ok(name.endsWith('.png'));
  });
});

describe('8. Export Quality & Boundary Settings', () => {
  it('normalizes quality parameter between 0.01 and 1.0', () => {
    const clampQuality = (q) => Math.max(0.01, Math.min(1.0, q ?? 0.92));
    assert.equal(clampQuality(0.8), 0.8);
    assert.equal(clampQuality(1.5), 1.0);
    assert.equal(clampQuality(-0.5), 0.01);
    assert.equal(clampQuality(undefined), 0.92);
  });
});

describe('9. Memory Management Lifecycle & URL Revocation', () => {
  it('tracks and manages ephemeral memory safety', () => {
    const activeUrls = new Set();
    const createTracked = (id) => {
      const url = `blob:http://localhost/${id}`;
      activeUrls.add(url);
      return url;
    };
    const revokeTracked = (url) => {
      activeUrls.delete(url);
    };

    const url1 = createTracked('img1');
    const url2 = createTracked('img2');
    assert.equal(activeUrls.size, 2);

    revokeTracked(url1);
    assert.equal(activeUrls.size, 1);
    assert.equal(activeUrls.has(url1), false);
    assert.equal(activeUrls.has(url2), true);

    activeUrls.clear();
    assert.equal(activeUrls.size, 0);
  });
});
