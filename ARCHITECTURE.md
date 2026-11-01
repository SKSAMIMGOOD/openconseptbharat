# Browser Utility Studio — Technical Architecture Specification

## 1. Executive Architectural Overview

Browser Utility Studio is engineered as an **isolated, zero-upload client-side web utility platform**. Unlike traditional cloud-processing platforms that require file uploads, backend worker queues, and persistent storage buckets, this architecture guarantees that **100% of the byte processing, canvas manipulations, and PDF generations execute exclusively within the client's browser runtime**.

```
+-----------------------------------------------------------------------------------+
|                                 USER BROWSER RUNTIME                              |
|                                                                                   |
|  +------------------+     +------------------------+     +---------------------+  |
|  | User Input File  | --> | In-Memory Blob & Array | --> | HTML5 Canvas / WASM |  |
|  |  (Image / PDF)   |     | (Ephemeral JavaScript) |     | (Worker Pipeline)   |  |
|  +------------------+     +------------------------+     +---------------------+  |
|                                                                      |            |
|                                                                      v            |
|  +------------------+     +------------------------+     +---------------------+  |
|  | Local File Save  | <-- | Browser Blob Download  | <-- | PDF-Lib / Canvas    |  |
|  | (Direct Disk)    |     | (Ephemerally Revoked)  |     | Export Assembly     |  |
|  +------------------+     +------------------------+     +---------------------+  |
+-----------------------------------------------------------------------------------+
                                         X (NO NETWORK FILE TRAFFIC)
+-----------------------------------------------------------------------------------+
|                                 SERVER / CLOUD                                    |
|                                                                                   |
|           Static Bundle Serving ONLY (HTML / JS / CSS / WASM Weights)             |
|                  Zero File Endpoints • Zero Databases • Zero APIs                 |
+-----------------------------------------------------------------------------------+
```

---

## 2. Directory Layout & Separation of Concerns

The codebase enforces strict decoupling between user-interface presentations and heavy processing logic:

```
src/
├── app/               # Presentation layer (App Router pages, layouts, error boundaries)
├── components/        # Reusable UI controls (Atomic buttons, Dropzone, Banners, Cards)
│   ├── common/        # General-purpose reusable UI primitives (Breadcrumb, SearchBar, ToolCard, EmptyState)
│   ├── layout/        # Global header, mobile drawer, footer, navigation, and module shells
│   └── dashboard/     # Home view cards, category grids, highlights
├── constants/         # Static configuration, card dimensions, DPI values, privacy rules, tools catalog
├── hooks/             # Custom React lifecycle hooks (Memory management, notifications)
├── lib/               # Pure business & processing logic (No UI dependencies)
│   ├── ai/            # Local browser AI inference interfaces
│   ├── crop/          # Mathematical crop calculators and aspect-ratio bounds
│   ├── image/         # Canvas operations, filters, format conversions, triggers
│   ├── pdf/           # PDF.js render pipelines and pdf-lib document builders
│   ├── utils/         # Tailwind class combiner (cn) & memory garbage helpers
│   └── validation/    # MIME type, file size, and magic byte validators
├── types/             # Strongly typed TypeScript contracts
└── workers/           # Multi-threaded Web Workers for background pixel operations
```

---

## 3. Core Subsystems

### 3.1. Ephemeral Memory & Garbage Collection Pipeline (`src/lib/utils/memory.ts`)
Handling high-resolution user photos (300/600 DPI) and multi-page PDFs can cause rapid browser heap expansion if references leak.
- **Tracked Object URLs:** All `URL.createObjectURL()` references are registered in an active tracking set.
- **Deterministic Revocation:** Components and hooks (`useObjectUrl`) call `URL.revokeObjectURL(url)` immediately upon unmount or file replacement.
- **Canvas Context Deallocation:** The `releaseCanvasBuffer` utility zeros width/height properties and clears contexts to signal immediate browser GC reclaiming.

### 3.2. Secure Validation Pipeline (`src/lib/validation/file-validator.ts`)
- **Size Bounds:** Enforces strict client limits (20MB images, 40MB PDFs) to prevent browser tab crashes.
- **Header Magic Bytes Inspection:** Before canvas rendering, initial file chunks (first 8 bytes) are verified against official signatures (`%PDF-`, `0xFFD8FF`, `0x89504E47`, `RIFF...WEBP`) to block corrupted or spoofed payloads.
- **Asynchronous Dimension Inspection:** Reads intrinsic pixel widths and heights without rendering to the DOM.

### 3.3. Document Card Cropping Pipeline (`src/lib/crop/calculator.ts`)
- **Millimeter-to-Pixel Projection:** Uses the canonical formula `pixels = (mm / 25.4) * DPI`.
- **ISO/IEC 7810 ID-1 Standard:** Strict aspect-ratio lock (`1.5858`) for PAN and Aadhaar identity documents.
- **Boundary Preservation:** Clamps crop rectangles inside container bounds, preventing out-of-bounds artifact clipping.

### 3.4. Dual PDF Processing Architecture (`src/lib/pdf/engine.ts`)
- **Rendering (PDF to Image/Canvas):** Powered by `pdfjs-dist` inside client Web Workers. Supports multi-page scanning, page navigation, and password decryption in memory.
- **Synthesis (Image to PDF):** Powered by `pdf-lib`. Compiles front/back card crops or multiple passport photo grids directly into printable vector PDF documents with accurate millimeter margins and cutting guides.

### 3.5. Multi-Threaded Web Workers (`src/workers/`)
- Heavy image adjustments, sharpening matrices, and threshold filters run off the main JavaScript thread via Web Workers, ensuring that UI responsiveness, animations, and buttons never freeze or drop frames.

---

## 4. UI Shell, Client Navigation & State Architecture (Phase 01)

### 4.1. Server & Client Component Segregation
- **Server Component Default:** Static layout presentation, informational pages (`/about`, `/privacy`, `/terms`, `/contact`), and base document shells execute as Server Components for zero-bundle rendering and instant Time-to-First-Byte (TTFB).
- **Client Component Boundary:** Interactive navigation state (`Header.tsx` drawer, search query synchronization in `src/app/tools/page.tsx`, and in-memory dropzone inspect stages) isolates `"use client"` directives to the exact interactive leaf components.

### 4.2. Tool Catalog & Dual-Taxonomy Categorization (`src/constants/tools.ts`)
- All 8 utilities are registered in a single source of truth (`TOOLS`).
- Each tool implements both a primary `category` (`photo`, `document`, `pdf`, `resume`) and an array of cross-cutting `categories` (e.g., PAN Card Crop is a `document` tool that also operates on `pdf` files).
- The `/tools` index dynamically resolves filters and live counts across this taxonomy with URL search parameter hydration (`?category=...`).

### 4.3. Accessible Navigation & Mobile Drawer
- Global navigation is rendered with accessible ARIA semantics (`aria-label="Main Navigation"`, `aria-label="Breadcrumb"`, `aria-expanded`, `aria-controls`).
- Mobile menu drawer locks viewport scroll while open and binds keyboard escape listeners for accessible modal dismissal.

---

## 5. Shared Browser Image Processing Engine Architecture (Phase 02)

### 5.1. Multi-Stage Pipeline Isolation
The image processing engine strictly decouples presentation components from byte transformations:
- **Input Validation (`src/lib/image/validator.ts`):** Evaluates MIME type, extension, size, magic byte signatures, and duplicates before committing resources to memory.
- **Native Decoding (`src/lib/image/decoder.ts`):** Utilizes `createImageBitmap()` with `{ imageOrientation: "from-image" }` to respect EXIF rotation data off the main DOM thread, with an offscreen `HTMLImageElement` fallback.
- **Pure Transformations (`src/lib/image/transform.ts`):** Pure mathematical calculations (`computeResizeDimensions`, `validateAndClampCrop`, `computeRotatedBounds`) combined into a single canvas matrix draw call with high-quality bicubic interpolation.
- **Background Worker Offloading (`src/workers/image-engine.worker.ts` & `src/lib/image/worker-client.ts`):** Offloads heavy canvas operations to `OffscreenCanvas` in background Web Workers with typed message protocols, job tracking, and main-thread fallback.
- **Multi-Format Export (`src/lib/image/exporter.ts`):** Encodes to PNG, JPEG (with background fill for transparency flattening), and WebP, synthesizing ephemeral Blobs and initiating direct disk downloads.
- **Interactive Viewport Preview (`src/components/image-engine/ImagePreview.tsx`):** Independent preview viewport supporting responsive fit-to-screen, interactive zoom (10%-500%), and click-drag panning without downsampling master export resolution.

---

## 6. Architectural Rules & Invariants

1. **Zero API Routes:** The `/app/api` directory is intentionally absent. No server endpoints exist to receive file buffers.
2. **Unoptimized Static Next.js Images:** Next.js is configured with `images: { unoptimized: true }` so images are never proxied through a Node.js image optimization endpoint.
3. **No Storage Persistence:** Neither `localStorage` nor `IndexedDB` may be used to store user document blobs or decrypted credentials.
4. **Independent Modules:** Each of the 8 utility modules operates as an isolated feature pipeline with dedicated types and configurations.
5. **Decoupled Resolution Invariant:** Preview scaling and viewport pan/zoom transformations must never modify or downsample the master source image buffer used for exports.
