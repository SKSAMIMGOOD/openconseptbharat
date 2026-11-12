/**
 * Automated Test Suite: Password-Protected PDF Support in Document Studio
 *
 * Covers all 15 required test scenarios plus encryption error differentiation,
 * supported-tool scoping (PAN, Aadhaar, Custom Document only), multi-page
 * navigation, security/privacy guarantees, and PDF.js resource cleanup.
 */

import { test, describe, before, afterEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire, registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import { PDFDocument } from "pdf-lib";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const ROOT_DIR = process.cwd();

// ---------------------------------------------------------------------------
// 1. Real PDF.js (legacy build for Node) + TypeScript / JSX Loader Hooks
// ---------------------------------------------------------------------------

const realPdfJs = require("pdfjs-dist/legacy/build/pdf.js");
realPdfJs.GlobalWorkerOptions.workerSrc = require.resolve(
  "pdfjs-dist/legacy/build/pdf.worker.js"
);

// Suppress expected Node-only DOMMatrix / Path2D / Canvas polyfill warnings from pdfjs-dist
if (typeof globalThis.DOMMatrix === "undefined") {
  globalThis.DOMMatrix = class DOMMatrixMock {
    constructor(init) {
      if (Array.isArray(init) && init.length === 6) {
        [this.a, this.b, this.c, this.d, this.e, this.f] = init;
      } else {
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.e = 0;
        this.f = 0;
      }
    }
    multiply() {
      return new DOMMatrixMock([this.a, this.b, this.c, this.d, this.e, this.f]);
    }
    translate(tx = 0, ty = 0) {
      return new DOMMatrixMock([this.a, this.b, this.c, this.d, this.e + tx, this.f + ty]);
    }
    scale(sx = 1, sy = sx) {
      return new DOMMatrixMock([this.a * sx, this.b, this.c, this.d * sy, this.e, this.f]);
    }
  };
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "pdfjs-dist/build/pdf.js") {
      return nextResolve("pdfjs-dist/legacy/build/pdf.js", context);
    }

    if (specifier.startsWith("@/")) {
      const rel = specifier.slice(2);
      const candidates = [
        rel + ".ts",
        rel + ".tsx",
        rel + ".js",
        path.join(rel, "index.ts"),
        path.join(rel, "index.tsx"),
        rel,
      ];
      for (const candidate of candidates) {
        const fullPath = path.join(ROOT_DIR, "src", candidate);
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
          return nextResolve(pathToFileURL(fullPath).href, context);
        }
      }
    }

    return nextResolve(specifier, context);
  },

  load(url, context, nextLoad) {
    if (url.endsWith(".tsx")) {
      const source = fs.readFileSync(new URL(url), "utf8");
      const transpiled = ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          jsx: ts.JsxEmit.ReactJSX,
          target: ts.ScriptTarget.ES2022,
        },
      });
      return {
        format: "module",
        source: transpiled.outputText,
        shortCircuit: true,
      };
    }
    return nextLoad(url, context);
  },
});

const {
  PASSWORD_PROTECTED_PDF_SUPPORTED_DOC_TYPES,
  supportsPasswordProtectedPdf,
} = await import("@/constants/document-studio");

const {
  classifyPdfLoadError,
  openPdfDocumentSession,
  renderPdfDocumentPageToBlob,
  processDocumentFile,
  validateDocumentFile,
  PdfProcessingError,
} = await import("@/lib/document/document-processor");

const { useDocumentStudio } = await import("@/hooks/useDocumentStudio");
const { PdfPasswordPrompt } = await import("@/components/document-studio/PdfPasswordPrompt");

// ---------------------------------------------------------------------------
// 2. Test Environment Shims (Canvas, Image, ObjectURL, Network/Storage Spies)
// ---------------------------------------------------------------------------

const urlRegistry = new Map();
const revokedUrls = new Set();
let objectUrlCounter = 0;
let fetchCallCount = 0;

function createSyntheticCardImageData(width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  // Light scanner background (242) with two high-contrast rectangular card blocks
  // so document detection and front/back cropping always run realistic pixels.
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 242;
    data[i + 1] = 242;
    data[i + 2] = 242;
    data[i + 3] = 255;
  }

  const paintCard = (x0, y0, w, h, r, g, b) => {
    for (let y = Math.max(0, y0); y < Math.min(height, y0 + h); y++) {
      for (let x = Math.max(0, x0); x < Math.min(width, x0 + w); x++) {
        const idx = (y * width + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
  };

  paintCard(
    Math.floor(width * 0.1),
    Math.floor(height * 0.1),
    Math.floor(width * 0.8),
    Math.floor(height * 0.35),
    35,
    70,
    130
  );
  paintCard(
    Math.floor(width * 0.1),
    Math.floor(height * 0.55),
    Math.floor(width * 0.8),
    Math.floor(height * 0.35),
    45,
    90,
    140
  );

  return { data, width, height };
}

function installBrowserTestEnvironment() {
  globalThis.window = globalThis;
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

  globalThis.OffscreenCanvas = class MockOffscreenCanvas {
    constructor(width = 612, height = 792) {
      this.width = width;
      this.height = height;
    }
    getContext() {
      return make2dContext(this);
    }
    async convertToBlob({ type = "image/png" } = {}) {
      const payload = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      return new Blob([payload], { type });
    }
  };

  globalThis.URL.createObjectURL = (blob) => {
    const id = `blob:test-doc-${++objectUrlCounter}`;
    urlRegistry.set(id, blob);
    return id;
  };

  globalThis.URL.revokeObjectURL = (url) => {
    revokedUrls.add(url);
    urlRegistry.delete(url);
  };

  globalThis.Image = class MockImage {
    constructor() {
      this.width = 612;
      this.height = 792;
      this.naturalWidth = 612;
      this.naturalHeight = 792;
      this.crossOrigin = "";
      this.onload = null;
      this.onerror = null;
      this._src = "";
    }
    set src(val) {
      this._src = val;
      queueMicrotask(() => {
        if (this.onload) this.onload();
      });
    }
    get src() {
      return this._src;
    }
  };

  const make2dContext = (canvasEl) =>
    new Proxy(
      {
        canvas: canvasEl,
        fillStyle: "#ffffff",
        strokeStyle: "#000000",
        lineWidth: 1,
        globalAlpha: 1,
        filter: "none",
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
        getTransform() {
          return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
        },
        measureText() {
          return { width: 12 };
        },
        createImageData(w, h) {
          return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
        },
        getImageData(_x, _y, w, h) {
          return createSyntheticCardImageData(w, h);
        },
        putImageData() {},
      },
      {
        get(target, prop) {
          if (prop in target) return target[prop];
          return () => {};
        },
      }
    );

  globalThis.document = {
    createElement(tag) {
      if (tag === "canvas") {
        const canvasEl = {
          width: 612,
          height: 792,
          getContext() {
            return make2dContext(canvasEl);
          },
          toBlob(callback, type = "image/png") {
            const payload = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
            const blob = new Blob([payload], { type });
            queueMicrotask(() => callback(blob));
          },
          remove() {},
        };
        return canvasEl;
      }
      return {
        href: "",
        download: "",
        click() {},
        style: {},
        setAttribute() {},
      };
    },
    body: {
      appendChild() {},
      removeChild() {},
      contains() {
        return false;
      },
    },
    head: {
      appendChild() {},
    },
    getElementById() {
      return null;
    },
  };

  globalThis.fetch = async () => {
    fetchCallCount += 1;
    throw new Error("Unexpected network fetch during client-side PDF test");
  };
}

// ---------------------------------------------------------------------------
// 3. Real PDF & Image Binary Generators
// ---------------------------------------------------------------------------

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

function createPngFile(name = "aadhaar-photo.png") {
  const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01]);
  return createMockFile(Buffer.from(bytes), name, "image/png");
}

function createJpgFile(name = "pan-scan.jpg") {
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
  return createMockFile(Buffer.from(bytes), name, "image/jpeg");
}

function createWebpFile(name = "doc-scan.webp") {
  const bytes = Buffer.from("RIFF\x24\x00\x00\x00WEBPVP8 ", "latin1");
  return createMockFile(bytes, name, "image/webp");
}

async function createUnprotectedPdfFile(fileName = "normal.pdf", pageCount = 1) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    doc.addPage([612, 792]);
  }
  const bytes = await doc.save();
  return createMockFile(Buffer.from(bytes), fileName, "application/pdf");
}

const PDF_PADDING = Buffer.from(
  "28bf4e5e4e758a4164004e56fffa01082e2e00b6d0683e802f0ca9fe6453697a",
  "hex"
);

function padPdfPassword(pw) {
  const raw = Buffer.from(pw, "latin1");
  if (raw.length >= 32) return raw.subarray(0, 32);
  return Buffer.concat([raw, PDF_PADDING]).subarray(0, 32);
}

function rc4Transform(key, data) {
  const s = new Uint8Array(256);
  for (let i = 0; i < 256; i++) s[i] = i;
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key[i % key.length]) & 0xff;
    const tmp = s[i];
    s[i] = s[j];
    s[j] = tmp;
  }
  const out = Buffer.alloc(data.length);
  let i = 0;
  j = 0;
  for (let k = 0; k < data.length; k++) {
    i = (i + 1) & 0xff;
    j = (j + s[i]) & 0xff;
    const tmp = s[i];
    s[i] = s[j];
    s[j] = tmp;
    out[k] = data[k] ^ s[(s[i] + s[j]) & 0xff];
  }
  return out;
}

/**
 * Generates a real ISO 32000-1 Standard RC4-40 encrypted PDF (1 or more pages)
 * that PDF.js parses, prompts via onPassword, validates, decrypts, and renders.
 */
function createEncryptedPdfFile({
  userPassword,
  ownerPassword = "owner-secret-password",
  fileName = "protected-document.pdf",
  pageCount = 1,
}) {
  const ownerPadded = padPdfPassword(ownerPassword);
  const oHash = crypto.createHash("md5").update(ownerPadded).digest().subarray(0, 5);
  const ownerKey = rc4Transform(oHash, padPdfPassword(userPassword));

  const idBytes = Buffer.from("0123456789abcdef0123456789abcdef", "hex");
  const pValue = -4;
  const pBuf = Buffer.alloc(4);
  pBuf.writeInt32LE(pValue, 0);

  const encKey = crypto
    .createHash("md5")
    .update(Buffer.concat([padPdfPassword(userPassword), ownerKey, pBuf, idBytes]))
    .digest()
    .subarray(0, 5);

  const userKey = rc4Transform(encKey, PDF_PADDING);

  const kidsRefs = [];
  const pageObjects = [];
  for (let i = 0; i < pageCount; i++) {
    const objNum = 4 + i;
    kidsRefs.push(`${objNum} 0 R`);
    pageObjects.push(
      `${objNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> >>\nendobj\n`
    );
  }

  const objects = [
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
    `2 0 obj\n<< /Type /Pages /Kids [${kidsRefs.join(" ")}] /Count ${pageCount} >>\nendobj\n`,
    `3 0 obj\n<< /Filter /Standard /V 1 /R 2 /Length 40 /P ${pValue} /O <${ownerKey.toString("hex")}> /U <${userKey.toString("hex")}> >>\nendobj\n`,
    ...pageObjects,
  ];

  let body = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(body, "latin1"));
    body += obj;
  }

  const xrefOffset = Buffer.byteLength(body, "latin1");
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  const idHex = idBytes.toString("hex");
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Encrypt 3 0 R /ID [<${idHex}> <${idHex}>] >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return createMockFile(Buffer.from(body + xref + trailer, "latin1"), fileName, "application/pdf");
}

function createCorruptedPdfFile(fileName = "corrupted.pdf") {
  return createMockFile(
    Buffer.from("%PDF-1.7\ngarbage-corrupted-body-without-xref-or-trailer", "latin1"),
    fileName,
    "application/pdf"
  );
}

function createUnsupportedEncryptionPdfFile(fileName = "pubsec.pdf") {
  const objects = [
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
    `2 0 obj\n<< /Type /Pages /Kids [4 0 R] /Count 1 >>\nendobj\n`,
    `3 0 obj\n<< /Filter /Adobe.PubSec /V 4 /R 4 >>\nendobj\n`,
    `4 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> >>\nendobj\n`,
  ];
  let body = "%PDF-1.6\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(body, "latin1"));
    body += obj;
  }
  const xrefOffset = Buffer.byteLength(body, "latin1");
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Encrypt 3 0 R /ID [<0123456789abcdef0123456789abcdef> <0123456789abcdef0123456789abcdef>] >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return createMockFile(Buffer.from(body + xref + trailer, "latin1"), fileName, "application/pdf");
}

// ---------------------------------------------------------------------------
// 4. Lightweight React 18 Hook & Component Runner (State + Effect + Unmount)
// ---------------------------------------------------------------------------

const ReactInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

function depsChanged(prevDeps, nextDeps) {
  if (!prevDeps || !nextDeps) return true;
  if (prevDeps.length !== nextDeps.length) return true;
  for (let i = 0; i < prevDeps.length; i++) {
    if (!Object.is(prevDeps[i], nextDeps[i])) return true;
  }
  return false;
}

function mountReactFunction(renderFn) {
  const hookSlots = [];
  const effectSlots = [];
  let mounted = true;
  let rerenderQueued = false;
  let currentResult = undefined;

  const scheduleRerender = () => {
    if (!mounted || rerenderQueued) return;
    rerenderQueued = true;
    queueMicrotask(() => {
      rerenderQueued = false;
      if (mounted) renderPass();
    });
  };

  function runEffects(pending) {
    for (const item of pending) {
      if (typeof item.slot.cleanup === "function") {
        item.slot.cleanup();
        item.slot.cleanup = undefined;
      }
      const cleanup = item.create();
      item.slot.cleanup = typeof cleanup === "function" ? cleanup : undefined;
    }
  }

  function renderPass() {
    if (!mounted) return;
    let cursor = 0;
    const pendingEffects = [];

    const dispatcher = {
      useState(initialState) {
        const idx = cursor++;
        if (!(idx in hookSlots)) {
          const val = typeof initialState === "function" ? initialState() : initialState;
          const setState = (updater) => {
            if (!mounted) return;
            const slot = hookSlots[idx];
            const nextVal = typeof updater === "function" ? updater(slot.value) : updater;
            if (!Object.is(slot.value, nextVal)) {
              slot.value = nextVal;
              scheduleRerender();
            }
          };
          hookSlots[idx] = { value: val, setState };
        }
        return [hookSlots[idx].value, hookSlots[idx].setState];
      },

      useRef(initialValue) {
        const idx = cursor++;
        if (!(idx in hookSlots)) {
          hookSlots[idx] = { current: initialValue };
        }
        return hookSlots[idx];
      },

      useCallback(fn, deps) {
        const idx = cursor++;
        const prev = hookSlots[idx];
        if (!prev || depsChanged(prev.deps, deps)) {
          hookSlots[idx] = { fn, deps };
        }
        return hookSlots[idx].fn;
      },

      useMemo(factory, deps) {
        const idx = cursor++;
        const prev = hookSlots[idx];
        if (!prev || depsChanged(prev.deps, deps)) {
          hookSlots[idx] = { value: factory(), deps };
        }
        return hookSlots[idx].value;
      },

      useEffect(create, deps) {
        const idx = cursor++;
        const prev = effectSlots[idx];
        if (!prev || depsChanged(prev.deps, deps)) {
          const slot = prev ?? { cleanup: undefined, deps };
          slot.deps = deps;
          effectSlots[idx] = slot;
          pendingEffects.push({ slot, create });
        }
      },

      useLayoutEffect(create, deps) {
        dispatcher.useEffect(create, deps);
      },

      useReducer(reducer, initialArg, init) {
        const [state, setState] = dispatcher.useState(() =>
          init ? init(initialArg) : initialArg
        );
        const dispatch = (action) => setState((prev) => reducer(prev, action));
        return [state, dispatch];
      },

      useContext(ctx) {
        return ctx._currentValue;
      },
      useId() {
        const idx = cursor++;
        if (!(idx in hookSlots)) hookSlots[idx] = `react-test-id-${idx}`;
        return hookSlots[idx];
      },
      useTransition() {
        return [false, (cb) => cb()];
      },
      useDeferredValue(v) {
        return v;
      },
    };

    const prevDispatcher = ReactInternals.ReactCurrentDispatcher.current;
    ReactInternals.ReactCurrentDispatcher.current = dispatcher;
    try {
      currentResult = renderFn();
    } finally {
      ReactInternals.ReactCurrentDispatcher.current = prevDispatcher;
    }

    runEffects(pendingEffects);
  }

  renderPass();

  const flush = async () => {
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 0));
      if (mounted && rerenderQueued) {
        rerenderQueued = false;
        renderPass();
      }
    }
  };

  return {
    get current() {
      return currentResult;
    },
    async act(fn) {
      if (fn) await fn();
      await flush();
    },
    forceRerender(nextRenderFn) {
      if (nextRenderFn) renderFn = nextRenderFn;
      renderPass();
    },
    unmount() {
      if (!mounted) return;
      mounted = false;
      for (const slot of effectSlots) {
        if (slot && typeof slot.cleanup === "function") {
          slot.cleanup();
          slot.cleanup = undefined;
        }
      }
    },
  };
}

function findReactElements(node, predicate, out = []) {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) {
    for (const child of node) findReactElements(child, predicate, out);
    return out;
  }
  if ("type" in node && "props" in node) {
    if (predicate(node)) out.push(node);
    if (node.props?.children) findReactElements(node.props.children, predicate, out);
  }
  return out;
}

// ---------------------------------------------------------------------------
// 5. Global Hook Tracking & Per-Test Cleanup
// ---------------------------------------------------------------------------

const mountedRunners = [];

function mountDocumentStudio(initialDocType = "aadhaar") {
  const runner = mountReactFunction(() => useDocumentStudio(initialDocType));
  mountedRunners.push(runner);
  return runner;
}

before(() => {
  installBrowserTestEnvironment();
});

afterEach(() => {
  while (mountedRunners.length > 0) {
    const r = mountedRunners.pop();
    r.unmount();
  }
  fetchCallCount = 0;
});

// ---------------------------------------------------------------------------
// 6. Comprehensive Test Suite
// ---------------------------------------------------------------------------

describe("Password-Protected PDF Support — Supported Tools & Core Classification", () => {
  test("enables password-protected PDF support ONLY for PAN Card, Aadhaar Card, and Custom Document", () => {
    assert.deepEqual([...PASSWORD_PROTECTED_PDF_SUPPORTED_DOC_TYPES], ["pan", "aadhaar", "custom"]);
    assert.equal(supportsPasswordProtectedPdf("pan"), true);
    assert.equal(supportsPasswordProtectedPdf("aadhaar"), true);
    assert.equal(supportsPasswordProtectedPdf("custom"), true);
    assert.equal(supportsPasswordProtectedPdf("voter-id"), false);
    assert.equal(supportsPasswordProtectedPdf("ration-card"), false);
  });

  test("distinguishes password errors from corrupted PDFs and unsupported encryption", () => {
    const needPw = classifyPdfLoadError({ name: "PasswordException", code: 1, message: "No password given" });
    assert.equal(needPw.category, "password-required");

    const wrongPw = classifyPdfLoadError({ name: "PasswordException", code: 2, message: "Incorrect Password" });
    assert.equal(wrongPw.category, "incorrect-password");
    assert.equal(wrongPw.message, "Incorrect password. Please try again.");

    const unsupported = classifyPdfLoadError({ name: "UnknownErrorException", message: "unknown encryption method" });
    assert.equal(unsupported.category, "unsupported-encryption");
    assert.match(unsupported.message, /encryption/i);

    const corrupted = classifyPdfLoadError({ name: "InvalidPDFException", message: "Invalid PDF structure." });
    assert.equal(corrupted.category, "corrupted-pdf");
    assert.match(corrupted.message, /corrupted|unreadable/i);
  });
});

describe("Password-Protected PDF Support — Real PDF.js Session & Processing Pipeline", () => {
  test("1. Normal unprotected PDF loads without password prompt", async () => {
    const normalPdf = await createUnprotectedPdfFile("normal.pdf", 1);
    const res = await openPdfDocumentSession(normalPdf, { pdfjsLib: realPdfJs });
    assert.equal(res.status, "loaded");
    assert.equal(res.pageCount, 1);
    const rendered = await renderPdfDocumentPageToBlob(res.pdfDoc, 1);
    assert.equal(rendered.pageNumber, 1);
    assert.equal(rendered.width > 0, true);
    await res.pdfDoc.destroy?.();
  });

  test("2 & 3. Real password-protected PDF detects password requirement and unlocks with correct password", async () => {
    const protectedPdf = createEncryptedPdfFile({ userPassword: "19950815", pageCount: 1 });
    const res = await openPdfDocumentSession(protectedPdf, { pdfjsLib: realPdfJs });
    assert.equal(res.status, "password-required");

    const unlockResult = await res.session.submitPassword("19950815");
    assert.equal(unlockResult.status, "unlocked");
    assert.equal(unlockResult.pageCount, 1);
    const rendered = await renderPdfDocumentPageToBlob(unlockResult.pdfDoc, 1);
    assert.equal(rendered.pageNumber, 1);
    await unlockResult.pdfDoc.destroy?.();
  });

  test("4 & 5 & 6. Wrong password shows error, rejects empty password, and allows retry without re-uploading", async () => {
    const protectedPdf = createEncryptedPdfFile({ userPassword: "correct-pw", pageCount: 1 });
    const res = await openPdfDocumentSession(protectedPdf, { pdfjsLib: realPdfJs });
    assert.equal(res.status, "password-required");

    const emptyRes = await res.session.submitPassword("   ");
    assert.equal(emptyRes.status, "empty-password");

    const wrong1 = await res.session.submitPassword("wrong-1");
    assert.equal(wrong1.status, "incorrect-password");
    assert.equal(wrong1.message, "Incorrect password. Please try again.");

    const wrong2 = await res.session.submitPassword("wrong-2");
    assert.equal(wrong2.status, "incorrect-password");
    assert.equal(wrong2.message, "Incorrect password. Please try again.");

    const right = await res.session.submitPassword("correct-pw");
    assert.equal(right.status, "unlocked");
    assert.equal(right.pageCount, 1);
    await right.pdfDoc.destroy?.();
  });

  test("15 (pipeline). Corrupted PDF and unsupported encryption fail cleanly instead of triggering password UI", async () => {
    const corruptedPdf = createCorruptedPdfFile();
    await assert.rejects(
      () => openPdfDocumentSession(corruptedPdf, { pdfjsLib: realPdfJs }),
      (err) => err instanceof PdfProcessingError && err.category === "corrupted-pdf"
    );

    const unsupportedPdf = createUnsupportedEncryptionPdfFile();
    await assert.rejects(
      () => openPdfDocumentSession(unsupportedPdf, { pdfjsLib: realPdfJs }),
      (err) => err instanceof PdfProcessingError && err.category === "unsupported-encryption"
    );
  });
});

describe("Password-Protected PDF Support — Hook & Workflow Integration (Section 8 Required Cases)", () => {
  test("1. Normal unprotected PDF loads immediately in Document Studio without showing password UI", async () => {
    const hook = mountDocumentStudio("aadhaar");
    const normalPdf = await createUnprotectedPdfFile("eaadhaar-open.pdf", 1);

    await hook.act(async () => {
      await hook.current.uploadDocumentFile(normalPdf);
    });

    assert.equal(hook.current.pdfPassword.status, "idle");
    assert.equal(hook.current.hasAnyFile, true);
    assert.equal(hook.current.state.source.fileType, "pdf");
    assert.equal(hook.current.state.source.error, null);
  });

  test("2, 3, 4, 5, 6, 7. Full prompt, empty validation, wrong password retries, unlock, and password UI dismissal", async () => {
    const hook = mountDocumentStudio("aadhaar");
    const protectedPdf = createEncryptedPdfFile({ userPassword: "UIDAI2026", fileName: "eaadhaar.pdf" });

    // Upload encrypted PDF -> triggers prompt
    await hook.act(async () => {
      await hook.current.uploadDocumentFile(protectedPdf);
    });
    assert.equal(hook.current.pdfPassword.status, "required");
    assert.equal(hook.current.pdfPassword.fileName, "eaadhaar.pdf");
    assert.equal(hook.current.hasAnyFile, false);

    // Empty password rejected without hitting session unlock attempts
    let emptyOk = true;
    await hook.act(async () => {
      emptyOk = await hook.current.submitPdfPassword("");
    });
    assert.equal(emptyOk, false);
    assert.equal(hook.current.pdfPassword.status, "required");
    assert.equal(hook.current.pdfPassword.error, "Please enter the PDF password.");
    assert.equal(hook.current.pdfPassword.attemptCount, 0);

    // Wrong password shows error & allows retry without re-uploading
    let firstOk = true;
    await hook.act(async () => {
      firstOk = await hook.current.submitPdfPassword("wrongpass1");
    });
    assert.equal(firstOk, false);
    assert.equal(hook.current.pdfPassword.status, "incorrect");
    assert.equal(hook.current.pdfPassword.error, "Incorrect password. Please try again.");
    assert.equal(hook.current.pdfPassword.attemptCount, 1);

    let secondOk = true;
    await hook.act(async () => {
      secondOk = await hook.current.submitPdfPassword("wrongpass2");
    });
    assert.equal(secondOk, false);
    assert.equal(hook.current.pdfPassword.attemptCount, 2);

    // Correct password unlocks & hides password UI
    let finalOk = false;
    await hook.act(async () => {
      finalOk = await hook.current.submitPdfPassword("UIDAI2026");
    });
    assert.equal(finalOk, true);
    assert.equal(hook.current.pdfPassword.status, "idle");
    assert.equal(hook.current.pdfPassword.error, null);
    assert.equal(hook.current.hasAnyFile, true);
  });

  test("8. Image uploads (PNG, JPG, WebP) never trigger password UI", async () => {
    const hook = mountDocumentStudio("pan");

    for (const imgFile of [createPngFile(), createJpgFile(), createWebpFile()]) {
      const validation = await validateDocumentFile(imgFile);
      assert.equal(validation.isValid, true);
      assert.equal(validation.fileType, "image");

      await hook.act(async () => {
        await hook.current.uploadDocumentFile(imgFile);
      });
      assert.equal(hook.current.pdfPassword.status, "idle");
      assert.equal(hook.current.hasAnyFile, true);
      assert.equal(hook.current.state.source.fileType, "image");
    }
  });

  test("9. PAN Card workflow continues automatic detection & cropping after unlocking", async () => {
    const hook = mountDocumentStudio("pan");
    const panPdf = createEncryptedPdfFile({ userPassword: "15081995", fileName: "e-pan.pdf" });

    await hook.act(async () => {
      await hook.current.uploadDocumentFile(panPdf);
    });
    assert.equal(hook.current.pdfPassword.status, "required");

    await hook.act(async () => {
      const ok = await hook.current.submitPdfPassword("15081995");
      assert.equal(ok, true);
    });

    assert.equal(hook.current.state.selectedDocType, "pan");
    assert.equal(hook.current.hasAnyFile, true);
    assert.notEqual(hook.current.state.autoDetectStatus.status, "idle");
    assert.ok(hook.current.state.front.croppedPreviewUrl, "PAN front side should be processed after unlock");
  });

  test("10. Aadhaar Card workflow continues automatic detection & front/back separation after unlocking", async () => {
    const hook = mountDocumentStudio("aadhaar");
    const aadhaarPdf = createEncryptedPdfFile({ userPassword: "AADH1990", fileName: "eaadhaar.pdf" });

    await hook.act(async () => {
      await hook.current.uploadDocumentFile(aadhaarPdf);
    });
    assert.equal(hook.current.pdfPassword.status, "required");

    await hook.act(async () => {
      const ok = await hook.current.submitPdfPassword("AADH1990");
      assert.equal(ok, true);
    });

    assert.equal(hook.current.state.selectedDocType, "aadhaar");
    assert.equal(hook.current.hasAnyFile, true);
    assert.notEqual(hook.current.state.autoDetectStatus.status, "idle");
    assert.ok(hook.current.state.front.croppedPreviewUrl, "Aadhaar front side should render after unlock");
    assert.ok(hook.current.state.back.croppedPreviewUrl, "Aadhaar back side should render after unlock");
  });

  test("11. Custom Document workflow continues automatic detection & processing after unlocking", async () => {
    const hook = mountDocumentStudio("custom");
    const customPdf = createEncryptedPdfFile({ userPassword: "CUSTOM99", fileName: "custom-doc.pdf" });

    await hook.act(async () => {
      await hook.current.uploadDocumentFile(customPdf);
    });
    assert.equal(hook.current.pdfPassword.status, "required");

    await hook.act(async () => {
      const ok = await hook.current.submitPdfPassword("CUSTOM99");
      assert.equal(ok, true);
    });

    assert.equal(hook.current.state.selectedDocType, "custom");
    assert.equal(hook.current.hasAnyFile, true);
    assert.notEqual(hook.current.state.autoDetectStatus.status, "idle");
    assert.ok(hook.current.state.front.croppedPreviewUrl, "Custom document front side should render after unlock");
  });

  test("12. Multi-page password-protected PDFs unlock and navigate pages without re-prompting", async () => {
    const hook = mountDocumentStudio("aadhaar");
    const multiPagePdf = createEncryptedPdfFile({
      userPassword: "MULTIPAGE",
      fileName: "multi-page-protected.pdf",
      pageCount: 2,
    });

    await hook.act(async () => {
      await hook.current.uploadDocumentFile(multiPagePdf);
    });
    assert.equal(hook.current.pdfPassword.status, "required");

    await hook.act(async () => {
      const ok = await hook.current.submitPdfPassword("MULTIPAGE");
      assert.equal(ok, true);
    });

    assert.equal(hook.current.state.source.pageCount, 2);
    assert.equal(hook.current.state.source.currentPage, 1);
    const page1Url = hook.current.state.source.previewUrl;

    await hook.act(async () => {
      await hook.current.changePdfPage(2);
    });

    assert.equal(hook.current.pdfPassword.status, "idle");
    assert.equal(hook.current.state.source.currentPage, 2);
    assert.notEqual(hook.current.state.source.previewUrl, page1Url);
    assert.equal(revokedUrls.has(page1Url), true);
  });

  test("13. Document replacement clears previous password state, attempt counter, and active file", async () => {
    const hook = mountDocumentStudio("aadhaar");
    const firstProtected = createEncryptedPdfFile({
      userPassword: "FIRST",
      fileName: "first.pdf",
    });

    await hook.act(async () => {
      await hook.current.uploadDocumentFile(firstProtected);
    });
    await hook.act(async () => {
      await hook.current.submitPdfPassword("wrong");
    });
    assert.equal(hook.current.pdfPassword.attemptCount, 1);
    assert.equal(hook.current.pdfPassword.error, "Incorrect password. Please try again.");
    const firstSessionId = hook.current.pdfPassword.sessionId;

    // Replace with another password-protected PDF -> fresh prompt, cleared attempts/error
    const secondProtected = createEncryptedPdfFile({
      userPassword: "SECOND",
      fileName: "second.pdf",
    });
    await hook.act(async () => {
      await hook.current.uploadDocumentFile(secondProtected);
    });
    assert.notEqual(hook.current.pdfPassword.sessionId, firstSessionId);
    assert.equal(hook.current.pdfPassword.fileName, "second.pdf");
    assert.equal(hook.current.pdfPassword.attemptCount, 0);
    assert.equal(hook.current.pdfPassword.error, null);

    // Unlock second PDF, then replace with third protected PDF -> old preview cleared & prompt opens cleanly
    await hook.act(async () => {
      assert.equal(await hook.current.submitPdfPassword("SECOND"), true);
    });
    assert.equal(hook.current.hasAnyFile, true);

    const thirdProtected = createEncryptedPdfFile({
      userPassword: "THIRD",
      fileName: "third.pdf",
    });
    await hook.act(async () => {
      await hook.current.uploadDocumentFile(thirdProtected);
    });
    assert.equal(hook.current.hasAnyFile, false);
    assert.equal(hook.current.pdfPassword.status, "required");
    assert.equal(hook.current.pdfPassword.fileName, "third.pdf");
  });

  test("14 (hook). Component unmount and cancel release temporary PDF sessions and object URLs", async () => {
    const hook = mountDocumentStudio("pan");
    const protectedPdf = createEncryptedPdfFile({ userPassword: "UNMOUNT1", fileName: "unmount.pdf" });

    await hook.act(async () => {
      await hook.current.uploadDocumentFile(protectedPdf);
    });
    assert.equal(hook.current.pdfPassword.status, "required");

    // Cancel clears prompt cleanly
    await hook.act(async () => {
      hook.current.cancelPasswordPrompt();
    });
    assert.equal(hook.current.pdfPassword.status, "idle");
    assert.equal(hook.current.pdfPassword.fileName, null);

    // Re-upload and unlock, then unmount -> preview URL revoked
    await hook.act(async () => {
      await hook.current.uploadDocumentFile(protectedPdf);
    });
    await hook.act(async () => {
      await hook.current.submitPdfPassword("UNMOUNT1");
    });
    const activeUrl = hook.current.state.source.previewUrl;
    assert.ok(activeUrl);

    hook.unmount();
    assert.equal(revokedUrls.has(activeUrl), true);
  });

  test("15 (hook). Corrupted PDF and unsupported encryption surface source errors without showing password UI", async () => {
    const hook = mountDocumentStudio("custom");
    const corruptedPdf = createCorruptedPdfFile("broken.pdf");

    await hook.act(async () => {
      await hook.current.uploadDocumentFile(corruptedPdf);
    });
    assert.equal(hook.current.pdfPassword.status, "idle");
    assert.equal(hook.current.hasAnyFile, false);
    assert.match(hook.current.state.source.error || "", /corrupted|unreadable/i);

    const unsupportedPdf = createUnsupportedEncryptionPdfFile("adobe-pubsec.pdf");
    await hook.act(async () => {
      await hook.current.uploadDocumentFile(unsupportedPdf);
    });
    assert.equal(hook.current.pdfPassword.status, "idle");
    assert.equal(hook.current.hasAnyFile, false);
    assert.match(hook.current.state.source.error || "", /encryption/i);
  });

  test("Unsupported tools (Voter ID & Ration Card) never trigger password UI and cancel pending prompts on switch", async () => {
    for (const unsupportedTool of ["voter-id", "ration-card"]) {
      const hook = mountDocumentStudio(unsupportedTool);
      const protectedPdf = createEncryptedPdfFile({ userPassword: "SECRET", fileName: "locked.pdf" });

      await hook.act(async () => {
        await hook.current.uploadDocumentFile(protectedPdf);
      });

      assert.equal(hook.current.supportsPasswordPdf, false);
      assert.equal(hook.current.pdfPassword.status, "idle");
      assert.equal(hook.current.hasAnyFile, false);
      assert.match(hook.current.state.source.error || "", /PAN Card, Aadhaar Card, and Custom Document/i);
    }

    // Switching from Aadhaar with open prompt -> Voter ID clears prompt cleanly
    const hook = mountDocumentStudio("aadhaar");
    await hook.act(async () => {
      await hook.current.uploadDocumentFile(createEncryptedPdfFile({ userPassword: "123" }));
    });
    assert.equal(hook.current.pdfPassword.status, "required");

    await hook.act(async () => {
      hook.current.setDocumentType("voter-id");
    });
    assert.equal(hook.current.pdfPassword.status, "idle");
    assert.equal(hook.current.supportsPasswordPdf, false);
  });
});

describe("Password-Protected PDF Support — PdfPasswordPrompt UI Component Behavior", () => {
  test("renders required heading, description, placeholder, toggle, unlock button, and privacy message", () => {
    const html = renderToStaticMarkup(
      React.createElement(PdfPasswordPrompt, {
        promptState: {
          sessionId: 1,
          status: "required",
          fileName: "eaadhaar_masked.pdf",
          fileSizeFormatted: "124 KB",
          error: null,
          attemptCount: 0,
        },
        onUnlock: async () => true,
        onCancel: () => {},
      })
    );

    assert.match(html, /Password-Protected PDF Detected/);
    assert.match(html, /This document requires a password before it can be processed\./);
    assert.match(html, /placeholder="Enter PDF password"/);
    assert.match(html, /type="password"/);
    assert.match(html, /aria-label="Show password"/);
    assert.match(html, /Unlock &amp; Continue/);
    assert.match(html, /Your password and document stay in your browser\./);
    assert.match(html, /eaadhaar_masked\.pdf/);
  });

  test("renders loading & disabled state while verifying and displays error alert on failure", () => {
    const verifyingHtml = renderToStaticMarkup(
      React.createElement(PdfPasswordPrompt, {
        promptState: {
          sessionId: 1,
          status: "verifying",
          fileName: "eaadhaar.pdf",
          fileSizeFormatted: "120 KB",
          error: null,
          attemptCount: 0,
        },
        onUnlock: async () => true,
        onCancel: () => {},
      })
    );
    assert.match(verifyingHtml, /Unlocking\.\.\./);
    assert.match(verifyingHtml, /disabled=""/);
    assert.match(verifyingHtml, /aria-busy="true"/);

    const errorHtml = renderToStaticMarkup(
      React.createElement(PdfPasswordPrompt, {
        promptState: {
          sessionId: 1,
          status: "required",
          fileName: "eaadhaar.pdf",
          fileSizeFormatted: "120 KB",
          error: "Incorrect password. Please try again.",
          attemptCount: 1,
        },
        onUnlock: async () => false,
        onCancel: () => {},
      })
    );
    assert.match(errorHtml, /role="alert"/);
    assert.match(errorHtml, /Incorrect password\. Please try again\./);
  });

  test("6, 7, 13, 14 (component). Validates empty input locally, toggles visibility, clears on unlock/replacement/unmount", async () => {
    let promptProps = {
      promptState: {
        sessionId: 1,
        status: "required",
        fileName: "locked.pdf",
        fileSizeFormatted: "10 KB",
        error: null,
        attemptCount: 0,
      },
      unlockCalls: [],
      onUnlock: async (pw) => {
        promptProps.unlockCalls.push(pw);
        return pw === "correct";
      },
      cancelCalls: 0,
      onCancel: () => {
        promptProps.cancelCalls += 1;
      },
    };

    const comp = mountReactFunction(() =>
      PdfPasswordPrompt({
        promptState: promptProps.promptState,
        onUnlock: promptProps.onUnlock,
        onCancel: promptProps.onCancel,
      })
    );
    mountedRunners.push(comp);

    const getElements = () => ({
      input: findReactElements(comp.current, (el) => el.type === "input")[0],
      form: findReactElements(comp.current, (el) => el.type === "form")[0],
      toggleBtn: findReactElements(
        comp.current,
        (el) => el.type === "button" && /password/i.test(el.props["aria-label"] || "")
      )[0],
      removeBtn: findReactElements(
        comp.current,
        (el) => el.type === "button" && /Remove uploaded PDF/i.test(el.props["aria-label"] || "")
      )[0],
    });

    // Empty submit rejected without invoking onUnlock
    await comp.act(async () => {
      await getElements().form.props.onSubmit({ preventDefault() {} });
    });
    assert.equal(promptProps.unlockCalls.length, 0);
    assert.equal(
      findReactElements(comp.current, (el) => el.props?.role === "alert").length,
      1
    );

    // Typing password + show/hide toggle works
    await comp.act(() => {
      getElements().input.props.onChange({ target: { value: "temp-secret" } });
      getElements().toggleBtn.props.onClick();
    });
    assert.equal(getElements().input.props.value, "temp-secret");
    assert.equal(getElements().input.props.type, "text");

    // Replacement (sessionId changes from 1 -> 2) clears input & resets visibility to hidden
    promptProps.promptState = { ...promptProps.promptState, sessionId: 2 };
    await comp.act(() => {
      comp.forceRerender();
    });
    assert.equal(getElements().input.props.value, "");
    assert.equal(getElements().input.props.type, "password");

    // Successful unlock clears password input
    await comp.act(() => {
      getElements().input.props.onChange({ target: { value: "correct" } });
    });
    await comp.act(async () => {
      await getElements().form.props.onSubmit({ preventDefault() {} });
    });
    assert.deepEqual(promptProps.unlockCalls, ["correct"]);
    assert.equal(getElements().input.props.value, "");

    // Type again, then cancel clears password input and invokes onCancel
    await comp.act(() => {
      getElements().input.props.onChange({ target: { value: "secret-before-cancel" } });
    });
    await comp.act(() => {
      getElements().removeBtn.props.onClick();
    });
    assert.equal(promptProps.cancelCalls, 1);
    assert.equal(getElements().input.props.value, "");

    // Unmount executes cleanup without throwing
    comp.unmount();
  });
});

describe("Password-Protected PDF Support — Security, Privacy & Regression Isolation", () => {
  test("never transmits passwords over network, never persists storage, and never logs passwords", async () => {
    const sentinelPassword = "SUPER_SECRET_SENTINEL_PASSWORD_9182";
    const capturedLogs = [];
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;
    console.log = (...args) => capturedLogs.push(args.map(String).join(" "));
    console.warn = (...args) => capturedLogs.push(args.map(String).join(" "));
    console.error = (...args) => capturedLogs.push(args.map(String).join(" "));

    try {
      const hook = mountDocumentStudio("aadhaar");
      const lockedPdf = createEncryptedPdfFile({ userPassword: sentinelPassword });

      await hook.act(async () => {
        await hook.current.uploadDocumentFile(lockedPdf);
      });
      await hook.act(async () => {
        await hook.current.submitPdfPassword("wrong-" + sentinelPassword);
      });
      await hook.act(async () => {
        const ok = await hook.current.submitPdfPassword(sentinelPassword);
        assert.equal(ok, true);
      });

      assert.equal(fetchCallCount, 0, "No network requests may be made when unlocking PDFs");
      for (const line of capturedLogs) {
        assert.equal(line.includes(sentinelPassword), false, "Logs must never include PDF passwords");
      }
      assert.equal(
        hook.current.pdfPassword.error === null ||
          !String(hook.current.pdfPassword.error).includes(sentinelPassword),
        true
      );
    } finally {
      console.log = origLog;
      console.warn = origWarn;
      console.error = origError;
    }

    // Source scan across new/modified modules for storage, network, or telemetry APIs
    const filesToAudit = [
      path.join(ROOT_DIR, "src/components/document-studio/PdfPasswordPrompt.tsx"),
      path.join(ROOT_DIR, "src/lib/document/document-processor.ts"),
      path.join(ROOT_DIR, "src/hooks/useDocumentStudio.ts"),
    ];
    const forbiddenPattern =
      /\b(localStorage|sessionStorage|indexedDB|fetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|document\.cookie)\b/;
    for (const filePath of filesToAudit) {
      const contents = fs.readFileSync(filePath, "utf8");
      assert.equal(
        forbiddenPattern.test(contents),
        false,
        `${path.basename(filePath)} must not use persistent storage, cookies, or network APIs`
      );
    }
  });

  test("gates PdfPasswordPrompt strictly behind supportsPasswordPdf in DocumentStudioWorkspace", () => {
    const workspaceSrc = fs.readFileSync(
      path.join(ROOT_DIR, "src/components/document-studio/DocumentStudioWorkspace.tsx"),
      "utf8"
    );
    assert.match(
      workspaceSrc,
      /supportsPasswordPdf\s*&&\s*pdfPassword\.status\s*!==\s*"idle"/,
      "Workspace must gate password UI behind supportsPasswordPdf and non-idle prompt state"
    );
  });
});
