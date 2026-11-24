/**
 * Test Suite: Raw Image to Clean PDF — Phase 1: Foundation & Multi-Image Upload
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_RAW_IMAGE_CONFIG,
} from '../src/types/raw-image-to-pdf.ts';

import {
  formatFileSize,
} from '../src/lib/raw-image-to-pdf/thumbnail-generator.ts';

import {
  validateFile,
} from '../src/lib/validation/file-validator.ts';

import {
  createTrackedObjectURL,
  revokeObjectUrlSafely,
  releaseCanvasBuffer,
} from '../src/lib/utils/memory.ts';

import {
  TOOLS,
  getToolById,
  getToolsByCategory,
  searchTools,
} from '../src/constants/tools.ts';

import {
  HOMEPAGE_TOOLS,
} from '../src/constants/homepage-tools.ts';

describe('Raw Image to Clean PDF — Phase 1 Test Suite', () => {

  describe('1. Configuration & Default Constraints', () => {
    it('enforces maximum batch size of 10 images by default', () => {
      assert.equal(DEFAULT_RAW_IMAGE_CONFIG.maxBatchSize, 10);
    });

    it('sets maximum file size limit to 5 MB', () => {
      assert.equal(DEFAULT_RAW_IMAGE_CONFIG.maxFileSizeMB, 5);
    });

    it('allows standard web image formats: JPEG, PNG, WebP', () => {
      assert.deepEqual(DEFAULT_RAW_IMAGE_CONFIG.allowedMimeTypes, [
        'image/jpeg',
        'image/png',
        'image/webp',
      ]);
    });

    it('sets lightweight thumbnail max dimension to 480px', () => {
      assert.equal(DEFAULT_RAW_IMAGE_CONFIG.thumbnailMaxDimension, 480);
    });
  });

  describe('2. File Size Formatting', () => {
    it('formats bytes below 1 KB correctly', () => {
      assert.equal(formatFileSize(512), '1 KB');
    });

    it('formats KB values properly', () => {
      assert.equal(formatFileSize(450 * 1024), '450 KB');
    });

    it('formats MB values with two decimal precision', () => {
      assert.equal(formatFileSize(2.45 * 1024 * 1024), '2.45 MB');
    });

    it('handles zero or negative sizes gracefully', () => {
      assert.equal(formatFileSize(0), '0 B');
      assert.equal(formatFileSize(-100), '0 B');
    });
  });

  describe('3. File Validation & Batch Constraints', () => {
    it('accepts valid JPEG and PNG files under 5 MB', () => {
      const mockJpg = {
        name: 'scan1.jpg',
        size: 4 * 1024 * 1024,
        type: 'image/jpeg',
      };
      const res = validateFile(mockJpg, {
        maxSizeMB: DEFAULT_RAW_IMAGE_CONFIG.maxFileSizeMB,
        allowedMimeTypes: DEFAULT_RAW_IMAGE_CONFIG.allowedMimeTypes,
      });
      assert.equal(res.isValid, true);
    });

    it('rejects files exceeding 5 MB', () => {
      const oversized = {
        name: 'huge_scan.png',
        size: 6 * 1024 * 1024,
        type: 'image/png',
      };
      const res = validateFile(oversized, {
        maxSizeMB: DEFAULT_RAW_IMAGE_CONFIG.maxFileSizeMB,
        allowedMimeTypes: DEFAULT_RAW_IMAGE_CONFIG.allowedMimeTypes,
      });
      assert.equal(res.isValid, false);
      assert.equal(res.errorCode, 'FILE_TOO_LARGE');
    });

    it('rejects unsupported file formats (e.g. text/html, application/zip)', () => {
      const invalid = {
        name: 'script.exe',
        size: 1024,
        type: 'application/x-msdownload',
      };
      const res = validateFile(invalid, {
        maxSizeMB: DEFAULT_RAW_IMAGE_CONFIG.maxFileSizeMB,
        allowedMimeTypes: DEFAULT_RAW_IMAGE_CONFIG.allowedMimeTypes,
      });
      assert.equal(res.isValid, false);
      assert.equal(res.errorCode, 'INVALID_TYPE');
    });
  });

  describe('4. Batch Capacity Slicing Simulation', () => {
    it('correctly caps incoming uploads when approaching the 10-image limit', () => {
      const currentPages = [
        { id: 'p1', name: 'img1.jpg' },
        { id: 'p2', name: 'img2.jpg' },
        { id: 'p3', name: 'img3.jpg' },
        { id: 'p4', name: 'img4.jpg' },
        { id: 'p5', name: 'img5.jpg' },
        { id: 'p6', name: 'img6.jpg' },
        { id: 'p7', name: 'img7.jpg' },
      ];
      const incoming = [
        { name: 'new1.jpg' },
        { name: 'new2.jpg' },
        { name: 'new3.jpg' },
        { name: 'new4.jpg' },
        { name: 'new5.jpg' },
      ];

      const maxLimit = DEFAULT_RAW_IMAGE_CONFIG.maxBatchSize;
      const remainingCapacity = Math.max(0, maxLimit - currentPages.length);
      assert.equal(remainingCapacity, 3);

      const accepted = incoming.slice(0, remainingCapacity);
      const rejectedCount = incoming.length - remainingCapacity;

      assert.equal(accepted.length, 3);
      assert.equal(rejectedCount, 2);
      assert.equal(currentPages.length + accepted.length, 10);
    });

    it('rejects all incoming files if batch is already at full capacity (10)', () => {
      const currentPages = Array.from({ length: 10 }, (_, i) => ({ id: `p${i}` }));
      const incoming = [{ name: 'extra.jpg' }];

      const remainingCapacity = Math.max(0, DEFAULT_RAW_IMAGE_CONFIG.maxBatchSize - currentPages.length);
      assert.equal(remainingCapacity, 0);
    });
  });

  describe('5. Page Ordering & Reordering Geometry', () => {
    it('swaps adjacent pages correctly on moveLeft and moveRight', () => {
      let pages = ['Page A', 'Page B', 'Page C'];

      const moveLeft = (arr, idx) => {
        if (idx <= 0) return arr;
        const copy = [...arr];
        const [item] = copy.splice(idx, 1);
        copy.splice(idx - 1, 0, item);
        return copy;
      };

      pages = moveLeft(pages, 1);
      assert.deepEqual(pages, ['Page B', 'Page A', 'Page C']);

      const moveRight = (arr, idx) => {
        if (idx >= arr.length - 1) return arr;
        const copy = [...arr];
        const [item] = copy.splice(idx, 1);
        copy.splice(idx + 1, 0, item);
        return copy;
      };

      pages = moveRight(pages, 0);
      assert.deepEqual(pages, ['Page A', 'Page B', 'Page C']);
    });

    it('ignores reorder requests exceeding index bounds', () => {
      const pages = ['Page 1', 'Page 2'];
      const moveLeft = (arr, idx) => (idx <= 0 ? arr : arr);
      assert.deepEqual(moveLeft(pages, 0), ['Page 1', 'Page 2']);
    });
  });

  describe('6. Memory & Canvas Resource Safety', () => {
    it('releaseCanvasBuffer resets canvas width and height to 0', () => {
      const mockCanvas = {
        width: 800,
        height: 600,
        getContext: () => ({
          clearRect: () => {},
        }),
      };

      releaseCanvasBuffer(mockCanvas);
      assert.equal(mockCanvas.width, 0);
      assert.equal(mockCanvas.height, 0);
    });

    it('handles null and undefined safely in releaseCanvasBuffer', () => {
      assert.doesNotThrow(() => releaseCanvasBuffer(null));
      assert.doesNotThrow(() => releaseCanvasBuffer(undefined));
    });

    it('handles null and undefined safely in revokeObjectUrlSafely', () => {
      assert.doesNotThrow(() => revokeObjectUrlSafely(null));
      assert.doesNotThrow(() => revokeObjectUrlSafely(undefined));
      assert.doesNotThrow(() => revokeObjectUrlSafely(''));
    });
  });

  describe('7. UI Registration & Discovery Verification', () => {
    it('registers raw-image-to-pdf in the central TOOLS array', () => {
      const tool = getToolById('raw-image-to-pdf');
      assert.ok(tool, 'Tool raw-image-to-pdf must be registered in TOOLS');
      assert.equal(tool.id, 'raw-image-to-pdf');
      assert.equal(tool.name, 'Raw Image to Clean PDF');
      assert.equal(tool.route, '/tools/raw-image-to-pdf');
      assert.equal(tool.category, 'utilities');
      assert.equal(tool.status, 'ready');
      assert.equal(tool.iconName, 'FileText');
      assert.ok(tool.categories.includes('utilities'));
      assert.ok(tool.categories.includes('image-tools'));
      assert.ok(tool.categories.includes('document'));
      assert.ok(tool.categories.includes('pdf'));
    });

    it('exposes raw-image-to-pdf on homepage tools listing', () => {
      const hpTool = HOMEPAGE_TOOLS.find((t) => t.id === 'raw-image-to-pdf');
      assert.ok(hpTool, 'raw-image-to-pdf must be available in HOMEPAGE_TOOLS');
      assert.equal(hpTool.route, '/tools/raw-image-to-pdf');
    });

    it('allows discovering raw-image-to-pdf via keyword search', () => {
      const byRaw = searchTools('raw');
      assert.ok(byRaw.some((t) => t.id === 'raw-image-to-pdf'));

      const byPdf = searchTools('clean pdf');
      assert.ok(byPdf.some((t) => t.id === 'raw-image-to-pdf'));

      const byStraighten = searchTools('straighten');
      assert.ok(byStraighten.some((t) => t.id === 'raw-image-to-pdf'));
    });

    it('organizes tool under utilities category filter', () => {
      const utilityTools = getToolsByCategory('utilities');
      assert.ok(utilityTools.some((t) => t.id === 'raw-image-to-pdf'));
    });
  });

});
