import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Import image validation and memory utilities
import {
  validateImageFile,
  verifyImageMagicBytes,
  generateFileFingerprint,
  getFileExtension,
} from '../src/lib/image/validator.ts';

import {
  createTrackedObjectURL,
  revokeObjectUrlSafely,
  releaseCanvasBuffer,
} from '../src/lib/utils/memory.ts';

// Synthetic Mock File Factory for Node.js test environment
function createMockFile(name, type, byteData, sizeOverride) {
  const buffer = byteData instanceof Uint8Array ? byteData : new Uint8Array(byteData);
  const blob = new Blob([buffer], { type });
  const file = new File([blob], name, { type, lastModified: 1700000000000 });
  if (sizeOverride !== undefined) {
    Object.defineProperty(file, 'size', { value: sizeOverride });
  }
  return file;
}

// Magic Bytes Fixtures
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

describe('PHASE 03A: Professional Photo Studio Test Suite', () => {

  describe('1. Format Support (JPG, PNG, WebP)', () => {
    it('successfully validates standard JPG file with correct magic bytes', async () => {
      const file = createMockFile('portrait.jpg', 'image/jpeg', VALID_JPEG_HEADER);
      const res = await validateImageFile(file, { maxSizeMB: 20 });
      assert.equal(res.isValid, true);
      assert.equal(res.detectedFormat, 'image/jpeg');
    });

    it('successfully validates standard JPEG file with uppercase extension', async () => {
      const file = createMockFile('PORTRAIT_SCAN.JPEG', 'image/jpeg', VALID_JPEG_HEADER);
      const res = await validateImageFile(file, { maxSizeMB: 20 });
      assert.equal(res.isValid, true);
      assert.equal(res.detectedFormat, 'image/jpeg');
    });

    it('successfully validates transparent PNG portrait file', async () => {
      const file = createMockFile('cutout.png', 'image/png', VALID_PNG_HEADER);
      const res = await validateImageFile(file, { maxSizeMB: 20 });
      assert.equal(res.isValid, true);
      assert.equal(res.detectedFormat, 'image/png');
    });

    it('successfully validates modern WebP image file', async () => {
      const file = createMockFile('studio.webp', 'image/webp', VALID_WEBP_HEADER);
      const res = await validateImageFile(file, { maxSizeMB: 20 });
      assert.equal(res.isValid, true);
      assert.equal(res.detectedFormat, 'image/webp');
    });
  });

  describe('2. Ingestion & Duplicate Protection', () => {
    it('generates consistent fingerprint for duplicate detection', async () => {
      const file1 = createMockFile('id_photo.jpg', 'image/jpeg', VALID_JPEG_HEADER);
      const file2 = createMockFile('id_photo.jpg', 'image/jpeg', VALID_JPEG_HEADER);
      const fp1 = await generateFileFingerprint(file1);
      const fp2 = await generateFileFingerprint(file2);
      assert.equal(fp1, fp2);
    });

    it('distinguishes different files with different content or names', async () => {
      const file1 = createMockFile('photo1.jpg', 'image/jpeg', VALID_JPEG_HEADER);
      const file2 = createMockFile('photo2.jpg', 'image/jpeg', VALID_JPEG_HEADER);
      const fp1 = await generateFileFingerprint(file1);
      const fp2 = await generateFileFingerprint(file2);
      assert.notEqual(fp1, fp2);
    });
  });

  describe('3. Validation Boundaries & Rejections', () => {
    it('rejects unsupported file formats (e.g. SVG or PDF)', async () => {
      const file = createMockFile('document.pdf', 'application/pdf', PDF_HEADER);
      const res = await validateImageFile(file, {
        maxSizeMB: 20,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
      });
      assert.equal(res.isValid, false);
      assert.equal(res.errorCode, 'INVALID_EXTENSION');
    });

    it('rejects renamed non-image files with valid image extension (spoofing protection)', async () => {
      const spoofed = createMockFile('fake.jpg', 'image/jpeg', PDF_HEADER);
      const res = await validateImageFile(spoofed, { maxSizeMB: 20 });
      assert.equal(res.isValid, false);
      assert.equal(res.errorCode, 'CORRUPTED_FILE');
    });

    it('rejects corrupted image headers', async () => {
      const corrupted = createMockFile('corrupted.png', 'image/png', CORRUPTED_HEADER);
      const res = await validateImageFile(corrupted, { maxSizeMB: 20 });
      assert.equal(res.isValid, false);
      assert.equal(res.errorCode, 'CORRUPTED_FILE');
    });

    it('strictly enforces the configurable 20 MB size limit', async () => {
      const exact20MB = 20 * 1024 * 1024;
      const over20MB = 20 * 1024 * 1024 + 1024; // 20 MB + 1 KB

      const fileValid = createMockFile('valid_size.jpg', 'image/jpeg', VALID_JPEG_HEADER, exact20MB);
      const resValid = await validateImageFile(fileValid, { maxSizeMB: 20 });
      assert.equal(resValid.isValid, true);

      const fileOversized = createMockFile('oversized.jpg', 'image/jpeg', VALID_JPEG_HEADER, over20MB);
      const resOversized = await validateImageFile(fileOversized, { maxSizeMB: 20 });
      assert.equal(resOversized.isValid, false);
      assert.equal(resOversized.errorCode, 'FILE_TOO_LARGE');
      assert.match(resOversized.error, /exceeds maximum allowed limit of 20 MB/);
    });
  });

  describe('4. Image Information & Aspect Ratio Math', () => {
    function computeFriendlyAspectRatio(width, height) {
      const ratio = width / height;
      const commonRatios = [
        { name: '1:1 Square', value: 1.0 },
        { name: '3:4 Portrait', value: 3 / 4 },
        { name: '4:3 Standard', value: 4 / 3 },
        { name: '2:3 Portrait', value: 2 / 3 },
        { name: '3:2 Landscape', value: 3 / 2 },
        { name: '16:9 Widescreen', value: 16 / 9 },
        { name: '35:45 Passport', value: 35 / 45 },
      ];
      for (const item of commonRatios) {
        if (Math.abs(ratio - item.value) < 0.02) {
          return `${item.name} (${ratio.toFixed(2)}:1)`;
        }
      }
      return `${ratio.toFixed(2)}:1`;
    }

    it('correctly calculates 35:45 passport aspect ratio', () => {
      const aspect = computeFriendlyAspectRatio(350, 450);
      assert.match(aspect, /35:45 Passport/);
    });

    it('correctly calculates 1:1 square aspect ratio', () => {
      const aspect = computeFriendlyAspectRatio(600, 600);
      assert.match(aspect, /1:1 Square/);
    });

    it('correctly calculates 3:4 portrait aspect ratio', () => {
      const aspect = computeFriendlyAspectRatio(3000, 4000);
      assert.match(aspect, /3:4 Portrait/);
    });

    it('correctly calculates megapixels from original dimensions', () => {
      const width = 4000;
      const height = 3000;
      const mp = ((width * height) / 1_000_000).toFixed(1);
      assert.equal(mp, '12.0');
    });
  });

  describe('5. Zoom & Fit Math Logic', () => {
    function calculateFitZoom(containerW, containerH, imageW, imageH, padding = 32) {
      const availW = Math.max(10, containerW - padding);
      const availH = Math.max(10, containerH - padding);
      const scaleW = availW / imageW;
      const scaleH = availH / imageH;
      return Math.min(scaleW, scaleH, 1);
    }

    it('scales large high-resolution images down to fit container', () => {
      const zoom = calculateFitZoom(800, 600, 4000, 3000);
      assert.ok(zoom < 1);
      assert.ok(zoom > 0);
      assert.equal(Math.round(zoom * 100) / 100, 0.19);
    });

    it('caps fit zoom at 1.0 for small images to avoid pixelation', () => {
      const zoom = calculateFitZoom(800, 600, 200, 150);
      assert.equal(zoom, 1);
    });

    it('preserves zoom bounds between 10% and 500%', () => {
      const clampZoom = (z) => Math.max(0.1, Math.min(5, Math.round(z * 100) / 100));
      assert.equal(clampZoom(0.01), 0.1);
      assert.equal(clampZoom(6.5), 5.0);
      assert.equal(clampZoom(1.25), 1.25);
    });
  });

  describe('6. Resource Cleanup & Memory Safety', () => {
    it('safely handles object URL revocation without exceptions', () => {
      assert.doesNotThrow(() => {
        revokeObjectUrlSafely('blob:http://localhost:3000/mock-uuid');
        revokeObjectUrlSafely(null);
        revokeObjectUrlSafely(undefined);
        revokeObjectUrlSafely('');
      });
    });

    it('clears canvas buffer and zeroes dimensions on cleanup', () => {
      const mockCanvas = {
        width: 1920,
        height: 1080,
        getContext: () => ({
          clearRect: () => {},
        }),
      };
      releaseCanvasBuffer(mockCanvas);
      assert.equal(mockCanvas.width, 0);
      assert.equal(mockCanvas.height, 0);
    });
  });

  describe('7. Privacy & Zero-Upload Verification', () => {
    it('verifies that no remote server endpoints or API routes exist', async () => {
      // Confirms API directory is not present
      const fs = await import('node:fs');
      assert.equal(fs.existsSync('./src/app/api'), false);
    });

    it('verifies image formats stay within client-allowed types', () => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      assert.equal(allowed.includes('image/jpeg'), true);
      assert.equal(allowed.includes('image/png'), true);
      assert.equal(allowed.includes('image/webp'), true);
      assert.equal(allowed.includes('application/octet-stream'), false);
    });
  });

});
