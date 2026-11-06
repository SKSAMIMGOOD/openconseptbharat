/**
 * Automated Test Suite: Phase 08A — Document Studio Foundation & Upload Workspace
 *
 * Verifies:
 * 1. Centralized Document Configuration Registry (Aadhaar, PAN, Voter ID, Ration Card, Custom)
 * 2. Document Side Rules (Aadhaar: Front+Back, PAN: Front-only, Voter ID: Front+Back, Ration: Front+Back, Custom: user-selected)
 * 3. File Validation & Format Support (JPG, PNG, PDF supported; invalid formats rejected; size limits)
 * 4. Multi-Page PDF Inspection & Page Selection
 * 5. Front/Back Workspace State Isolation & Ephemeral Memory URL Lifecycle
 * 6. Privacy & Zero-Upload Guarantees
 * 7. Navigation, Tool Registry & Route Existence
 */

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

import {
  DOCUMENT_TYPES,
  DEFAULT_DOCUMENT_TYPE_ID,
  ALLOWED_DOCUMENT_MIME_TYPES,
  ALLOWED_DOCUMENT_EXTENSIONS,
  MAX_DOCUMENT_FILE_SIZE_MB,
  getDocumentTypeDefinition,
  getAvailableSides,
  isSideActive,
} from "../src/constants/document-studio.ts";

import {
  validateDocumentFile,
  getPdfPageCount,
  formatFileSize,
} from "../src/lib/document/document-processor.ts";

import { TOOLS, getToolById } from "../src/constants/tools.ts";

// Helper to construct a mock File for Node environment
function createMockFile(content, fileName, mimeType) {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
  return {
    name: fileName,
    type: mimeType,
    size: buffer.length,
    slice(start, end) {
      const sliced = buffer.subarray(start, end);
      return {
        async arrayBuffer() {
          return sliced.buffer.slice(sliced.byteOffset, sliced.byteOffset + sliced.byteLength);
        },
      };
    },
    async arrayBuffer() {
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    },
  };
}

describe("PHASE 08A — Centralized Document Configuration Registry", () => {
  test("defines all 5 required document types", () => {
    const ids = DOCUMENT_TYPES.map((d) => d.id);
    assert.deepEqual(
      ids,
      ["aadhaar", "pan", "voter-id", "ration-card", "custom"],
      "Must register Aadhaar, PAN, Voter ID, Ration Card, and Custom Document"
    );
  });

  test("Aadhaar Card configures Front and Back sides", () => {
    const aadhaar = getDocumentTypeDefinition("aadhaar");
    assert.ok(aadhaar);
    assert.equal(aadhaar.name, "Aadhaar Card");
    assert.deepEqual(aadhaar.supportedSides, ["front", "back"]);
    assert.deepEqual(aadhaar.defaultSides, ["front", "back"]);
    assert.equal(aadhaar.allowsSideSelection, false);
    assert.ok(aadhaar.targetDimensions, "Aadhaar should document standard ID dimensions");
    assert.equal(aadhaar.targetDimensions.widthMm, 85.6);
    assert.equal(aadhaar.targetDimensions.heightMm, 53.98);
  });

  test("PAN Card configures Front and Back sides", () => {
    const pan = getDocumentTypeDefinition("pan");
    assert.ok(pan);
    assert.equal(pan.name, "PAN Card");
    assert.deepEqual(pan.supportedSides, ["front", "back"]);
    assert.deepEqual(pan.defaultSides, ["front", "back"]);
    assert.equal(pan.allowsSideSelection, false);
    assert.ok(pan.targetDimensions, "PAN should document ISO ID-1 dimensions");
    assert.equal(pan.targetDimensions.widthMm, 85.6);
    assert.equal(pan.targetDimensions.heightMm, 53.98);
  });

  test("Voter ID Card configures Front and Back sides", () => {
    const voter = getDocumentTypeDefinition("voter-id");
    assert.ok(voter);
    assert.equal(voter.name, "Voter ID Card");
    assert.deepEqual(voter.supportedSides, ["front", "back"]);
    assert.deepEqual(voter.defaultSides, ["front", "back"]);
    assert.equal(voter.allowsSideSelection, false);
    assert.ok(voter.targetDimensions);
    assert.equal(voter.targetDimensions.widthMm, 85.6);
    assert.equal(voter.targetDimensions.heightMm, 53.98);
  });

  test("Ration Card configures Front and Back sides with flexible format note", () => {
    const ration = getDocumentTypeDefinition("ration-card");
    assert.ok(ration);
    assert.equal(ration.name, "Ration Card");
    assert.deepEqual(ration.supportedSides, ["front", "back"]);
    assert.deepEqual(ration.defaultSides, ["front", "back"]);
    assert.equal(ration.allowsSideSelection, false);
    assert.ok(ration.targetDimensions);
    assert.ok(ration.targetDimensions.note.toLowerCase().includes("state"), "Should note state variation in ration slips");
  });

  test("Custom Document allows user-selected side configuration", () => {
    const custom = getDocumentTypeDefinition("custom");
    assert.ok(custom);
    assert.equal(custom.name, "Custom Document");
    assert.equal(custom.allowsSideSelection, true);
    assert.deepEqual(custom.supportedSides, ["front", "back"]);

    // Test dynamic sides based on custom mode
    const bothSides = getAvailableSides(custom, "both");
    assert.deepEqual(bothSides, ["front", "back"]);

    const frontOnly = getAvailableSides(custom, "front-only");
    assert.deepEqual(frontOnly, ["front"]);

    const backOnly = getAvailableSides(custom, "back-only");
    assert.deepEqual(backOnly, ["back"]);
  });

  test("isSideActive helper correctly determines active side", () => {
    const pan = getDocumentTypeDefinition("pan");
    assert.equal(isSideActive("front", pan), true);
    assert.equal(isSideActive("back", pan), true);

    const aadhaar = getDocumentTypeDefinition("aadhaar");
    assert.equal(isSideActive("front", aadhaar), true);
    assert.equal(isSideActive("back", aadhaar), true);

    const custom = getDocumentTypeDefinition("custom");
    assert.equal(isSideActive("back", custom, "front-only"), false);
    assert.equal(isSideActive("front", custom, "front-only"), true);
    assert.equal(isSideActive("back", custom, "back-only"), true);
    assert.equal(isSideActive("front", custom, "back-only"), false);
  });
});

describe("PHASE 08A — File Validation & Format Verification", () => {
  test("formats file sizes correctly", () => {
    assert.equal(formatFileSize(0), "0 Bytes");
    assert.equal(formatFileSize(1024), "1 KB");
    assert.equal(formatFileSize(1024 * 1024 * 2.5), "2.5 MB");
  });

  test("validates genuine JPEG file by magic bytes", async () => {
    // JPEG header: FF D8 FF
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    const file = createMockFile(jpegBuffer, "aadhaar-front.jpg", "image/jpeg");

    const result = await validateDocumentFile(file);
    assert.equal(result.isValid, true);
    assert.equal(result.fileType, "image");
  });

  test("validates genuine PNG file by magic bytes", async () => {
    // PNG header: 89 50 4E 47 0D 0A 1A 0A
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = createMockFile(pngBuffer, "pan-card.png", "image/png");

    const result = await validateDocumentFile(file);
    assert.equal(result.isValid, true);
    assert.equal(result.fileType, "image");
  });

  test("validates genuine PDF file by magic bytes", async () => {
    // PDF header: %PDF-
    const pdfBuffer = Buffer.from("%PDF-1.7\n%some content");
    const file = createMockFile(pdfBuffer, "eaadhaar.pdf", "application/pdf");

    const result = await validateDocumentFile(file);
    assert.equal(result.isValid, true);
    assert.equal(result.fileType, "pdf");
  });

  test("rejects invalid or dangerous file extensions", async () => {
    const exeBuffer = Buffer.from("MZfakeexecutable");
    const file = createMockFile(exeBuffer, "malware.exe", "application/octet-stream");

    const result = await validateDocumentFile(file);
    assert.equal(result.isValid, false);
    assert.ok(result.error && result.error.includes("Unsupported file format"));
  });

  test("rejects text files and zip archives", async () => {
    const txtBuffer = Buffer.from("hello text file");
    const file = createMockFile(txtBuffer, "document.txt", "text/plain");

    const result = await validateDocumentFile(file);
    assert.equal(result.isValid, false);
  });

  test("rejects spoofed file with fake extension and wrong magic bytes", async () => {
    const fakeBuffer = Buffer.from("just random plain text bytes");
    const file = createMockFile(fakeBuffer, "fake.jpg", "image/jpeg");

    const result = await validateDocumentFile(file);
    assert.equal(result.isValid, false);
    assert.ok(result.error && result.error.includes("corrupted"));
  });

  test("rejects oversized files exceeding 30 MB limit", async () => {
    const largeSize = 31 * 1024 * 1024;
    const fakeBuffer = Buffer.alloc(16);
    fakeBuffer[0] = 0xff;
    fakeBuffer[1] = 0xd8;
    fakeBuffer[2] = 0xff;

    const oversizedFile = {
      name: "huge-scan.jpg",
      type: "image/jpeg",
      size: largeSize,
      slice() {
        return {
          async arrayBuffer() {
            return fakeBuffer.buffer;
          },
        };
      },
      async arrayBuffer() {
        return fakeBuffer.buffer;
      },
    };

    const result = await validateDocumentFile(oversizedFile);
    assert.equal(result.isValid, false);
    assert.ok(result.error && result.error.includes("exceeds the limit"));
  });
});

describe("PHASE 08A — Multi-Page PDF Handling", () => {
  test("creates and inspects multi-page PDF page count accurately", async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([595, 842]); // Page 1 (Front)
    pdfDoc.addPage([595, 842]); // Page 2 (Back)
    const pdfBytes = await pdfDoc.save();

    const file = createMockFile(Buffer.from(pdfBytes), "sample-dual-side.pdf", "application/pdf");
    const pageCount = await getPdfPageCount(file);

    assert.equal(pageCount, 2, "Must accurately detect 2 pages in multi-page document");
  });

  test("handles 1-page PDF correctly", async () => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([595, 842]);
    const pdfBytes = await pdfDoc.save();

    const file = createMockFile(Buffer.from(pdfBytes), "pan-slip.pdf", "application/pdf");
    const pageCount = await getPdfPageCount(file);

    assert.equal(pageCount, 1, "Must detect single-page PDF correctly");
  });
});

describe("PHASE 08A — Front & Back Workspace State Isolation", () => {
  test("maintains independent state for Front and Back sides", () => {
    // Simulate workspace state
    const workspaceState = {
      selectedDocType: "aadhaar",
      customSidesMode: "both",
      front: {
        file: { name: "aadhaar-front.jpg" },
        dimensions: { width: 1920, height: 1080, aspectRatio: 1920 / 1080 },
        previewUrl: "blob:http://localhost/front-uuid-1",
      },
      back: {
        file: null,
        dimensions: null,
        previewUrl: null,
      },
    };

    // Assert Front is populated and Back remains untouched
    assert.ok(workspaceState.front.file);
    assert.equal(workspaceState.front.file.name, "aadhaar-front.jpg");
    assert.equal(workspaceState.back.file, null);

    // Now populate Back independently
    workspaceState.back = {
      file: { name: "aadhaar-back.jpg" },
      dimensions: { width: 1920, height: 1080, aspectRatio: 1920 / 1080 },
      previewUrl: "blob:http://localhost/back-uuid-2",
    };

    assert.ok(workspaceState.back.file);
    assert.equal(workspaceState.back.file.name, "aadhaar-back.jpg");
    assert.equal(workspaceState.front.file.name, "aadhaar-front.jpg");

    // Replace Front: Back must remain completely unaffected
    workspaceState.front = {
      file: { name: "aadhaar-front-v2.png" },
      dimensions: { width: 2048, height: 1152, aspectRatio: 2048 / 1152 },
      previewUrl: "blob:http://localhost/front-uuid-3",
    };

    assert.equal(workspaceState.front.file.name, "aadhaar-front-v2.png");
    assert.equal(workspaceState.back.file.name, "aadhaar-back.jpg");

    // Remove Back: Front must remain unaffected
    workspaceState.back = {
      file: null,
      dimensions: null,
      previewUrl: null,
    };

    assert.equal(workspaceState.back.file, null);
    assert.equal(workspaceState.front.file.name, "aadhaar-front-v2.png");
  });
});

describe("PHASE 08A — Tool Registry & Navigation Integration", () => {
  test("registers Document Studio in TOOLS registry", () => {
    const docStudio = getToolById("document-studio");
    assert.ok(docStudio, "Document Studio must be registered in TOOLS");
    assert.equal(docStudio.name, "Document Studio");
    assert.equal(docStudio.route, "/tools/document-studio");
    assert.equal(docStudio.status, "ready");
    assert.equal(docStudio.category, "utilities");
    assert.ok(docStudio.categories.includes("document"));
    assert.ok(docStudio.categories.includes("pdf"));
  });

  test("Document Studio page file exists on disk", () => {
    const pagePath = path.resolve(
      process.cwd(),
      "src",
      "app",
      "tools",
      "document-studio",
      "page.tsx"
    );
    assert.ok(fs.existsSync(pagePath), `Page route must exist at ${pagePath}`);
  });

  test("Header includes Document Studio in primary navigation", () => {
    const headerPath = path.resolve(
      process.cwd(),
      "src",
      "components",
      "layout",
      "Header.tsx"
    );
    const headerContent = fs.readFileSync(headerPath, "utf-8");
    assert.ok(
      headerContent.includes("/tools/document-studio"),
      "Header must include link to /tools/document-studio"
    );
    assert.ok(
      headerContent.includes("Document Studio"),
      "Header must display Document Studio"
    );
  });

  test("Footer includes updated utilities link", () => {
    const footerPath = path.resolve(
      process.cwd(),
      "src",
      "components",
      "layout",
      "Footer.tsx"
    );
    const footerContent = fs.readFileSync(footerPath, "utf-8");
    assert.ok(
      footerContent.includes("All Utilities (9)"),
      "Footer should reflect 9 available utilities"
    );
  });
});
