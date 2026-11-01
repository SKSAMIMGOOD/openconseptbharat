# Browser Utility Studio — Development Roadmap

This multi-phase roadmap outlines the step-by-step engineering progression for Browser Utility Studio.

---

## 📌 Phase 00 — Architecture, Project Initialization & Foundation ✅ [COMPLETED]

- [x] Initial workspace inspection and clean configuration setup.
- [x] Next.js 14 App Router, TypeScript 5, and Tailwind CSS initialized.
- [x] Strict client-side privacy architecture and memory deallocation protocols established.
- [x] Contract interfaces defined for Image, PDF, Card Cropping, and Browser AI subsystems.
- [x] Clean directory structure separating presentation, hooks, processing logic, and Web Workers.
- [x] Application foundation: Header, Footer, Privacy Badge, and Responsive Shell.
- [x] Tool catalog and metadata definition for all 8 target modules.
- [x] Placeholder routes created for modules with ModuleLayout wrapper.
- [x] Interactive FileDropzone upload component with file validation and ephemeral preview.
- [x] Shared error boundary (`error.tsx`), 404 handler (`not-found.tsx`), and notification toast banner.
- [x] Complete documentation: `README.md`, `ARCHITECTURE.md`, `PRIVACY.md`, `DEVELOPMENT_ROADMAP.md`.
- [x] 100% clean Next.js production build (`next build`) and zero ESLint errors (`next lint`).

---

## 📌 Phase 01 — Main Application UI & Navigation ✅ [COMPLETED]

**Target Objectives:** Complete frontend shell, responsive global navigation, landing dashboard, dedicated `/tools` page, individual tool routes, and cohesive reusable component library.

- [x] **Global Desktop & Mobile Navigation (`src/components/layout/Header.tsx`):**
  - Brand identity: "Browser Utility Studio" with gradient badge.
  - Desktop nav links: Home, All Tools, Photo Studio, Document Tools, Resume Maker, About, Privacy.
  - Interactive Privacy Badge indicator.
  - Mobile compact drawer with accessible hamburger toggle, escape key listener, backdrop blur, and body scroll lock.
- [x] **Home Dashboard (`src/app/page.tsx`):**
  - Hero Section: Headline "Everything You Need to Edit, Crop & Create.", subtitle "Professional photo, document and printing tools. Process everything directly in your browser.", primary "Explore Tools" and secondary "Privacy Guarantee" CTAs.
  - Platform Visual Illustration: Interactive 3-way stage mockup displaying Passport Studio, ID-1 Card Cropper, and ATS Vector Resume preview cards with in-memory execution badges.
  - Featured Tools Section: 5 high-priority cards for Professional Photo Studio, Background Remover, Advanced Photo Editor, Smart Document Crop, and Resume / CV Maker with badges, tags, and action links.
  - Categories Section: 4 primary categories (Photo Tools, Document Tools, PDF Tools, Resume & CV Tools) with live counts and direct navigation.
  - Privacy Architecture Section: 4 core privacy pillars and developer tools verification instructions.
  - Interactive file ingestion dropzone verification stage.
- [x] **All Tools Index (`src/app/tools/page.tsx`):**
  - Dedicated `/tools` route displaying all 8 browser utilities.
  - Real-time instant search by tool name, keywords, descriptions, and feature tags.
  - Category filter tabs: All Utilities (8), Photo Tools (4), Document Tools (3), PDF Tools (5), Resume & CV Tools (1).
  - Synchronized URL query parameter support (`?category=...`).
  - Responsive 1/2/3-column card grid with live result counters and clear empty search state.
- [x] **Individual Tool Workspace Routes (`/tools/*`):**
  - `/tools/photo-studio` — Passport & Visa Photo Studio with standard dimension presets.
  - `/tools/multiple-photo-maker` — Multiple photo tiling engine with A4, 4×6", 5×7" sheet presets.
  - `/tools/background-remover` — Client-side AI background remover with transparency preview.
  - `/tools/photo-editor` — Non-destructive canvas editor with crop ratios and target size compressor.
  - `/tools/pan-card-crop` — ISO/IEC 7810 ID-1 PAN card dual-side crop workspace.
  - `/tools/aadhaar-card-crop` — e-Aadhaar PDF & scan crop workspace with password architecture.
  - `/tools/ration-card-crop` — High-contrast ration card formatting workspace.
  - `/tools/resume-maker` — ATS-friendly structured form builder and live vector paper preview.
  - Aliased `/tools/multiple-photos` to guarantee zero broken bookmarks.
- [x] **Reusable Component System:**
  - `Header`: Desktop navigation, active state indicators, and mobile drawer.
  - `Footer`: Multi-column links, categories, trust pillars, and legal links.
  - `Breadcrumb`: Accessible `nav` with chevron separators and home icon.
  - `SearchBar`: Responsive search input with clear button and accessible labeling.
  - `PageHeader`: Unified header with badge, title, subtitle, and breadcrumbs.
  - `CategoryCard`: Interactive category cards with icon, count, and action links.
  - `ToolCard`: Polished utility cards with category styling, badges, and hover transitions.
  - `PrivacyNotice`: 4-pillar privacy explanation and DevTools verification guide.
  - `EmptyState`: Clean zero-results state with reset filter action.
- [x] **Supporting Legal & Info Routes:**
  - `/terms`: Terms of Use for client-side processing software.
  - `/contact`: Technical support and security contact guidelines.
  - `/about`: Studio mission and architectural blueprint.
  - `/privacy`: Zero-upload policy and DevTools verification instructions.
- [x] **Verification & Build Quality:**
  - 100% clean production build (`next build`) prerendering 18 static HTML pages.
  - Zero TypeScript compiler diagnostics (`npx tsc --noEmit`).
  - Zero ESLint warnings or errors (`next lint`).

---

## 📌 Phase 02 — Shared Browser Image Processing Engine ✅ [CURRENT PHASE COMPLETED]

**Target Objectives:** Build an isolated, production-grade, reusable browser image-processing engine (input validation, native decoding, mathematical transformations, background Web Workers, preview viewport with zoom/pan, multi-format export, and deterministic memory lifecycle).

- [x] **Strongly Typed Engine Contracts (`src/types/image-engine.ts`):**
  - Contracts for `SupportedImageFormat` (JPEG, PNG, WebP), `ImageDimensions`, `ImageValidationOptions`, `ImageValidationResult`, `DecodedImageSource`, `ResizeOptions`, `CropRegion`, `RotateOptions`, `FlipOptions`, `ImageTransformPipeline`, `ImageExportOptions`, and Web Worker job/progress/response messages.
- [x] **Image Input & Multi-Criteria Validator (`src/lib/image/validator.ts`):**
  - MIME type and file extension validation.
  - Configurable file size limits (`maxSizeMB`).
  - Magic byte verification for JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), WebP (`RIFF...WEBP`).
  - Fast duplicate file detection using metadata fingerprinting and byte hashing.
  - Decode integrity validation to catch corrupted or truncated files.
- [x] **Native Image Decoding Engine (`src/lib/image/decoder.ts`):**
  - Native `createImageBitmap()` decoding with `{ imageOrientation: "from-image" }` for automatic EXIF rotation handling.
  - Offscreen `HTMLImageElement` fallback for environments where `createImageBitmap` is unavailable or fails.
  - Dimensions extraction utility with instant buffer cleanup.
  - Maximum safe canvas dimension safety guard (`16384 px`) to prevent browser tab crashes.
- [x] **Core Transformation Pipeline (`src/lib/image/transform.ts`):**
  - `computeResizeDimensions`: Custom dimensions or aspect-ratio locked proportional calculation.
  - `validateAndClampCrop`: Strict boundary clamping and aspect-ratio constraint snapping (1:1, 4:3, 16:9, passport 35:45).
  - `computeRotatedBounds`: Exact coordinate mathematics for 90°, 180°, 270°, and arbitrary angle bounding boxes.
  - `transformImage`: Unified single-draw composite pipeline (Crop $\to$ Rotate $\to$ Flip $\to$ Resize) with high-quality bicubic interpolation (`imageSmoothingQuality = "high"`).
  - Pure non-destructive operations: source image is never mutated.
- [x] **Background Web Worker Engine (`src/workers/image-engine.worker.ts` & `src/lib/image/worker-client.ts`):**
  - Background worker processing with `OffscreenCanvas`.
  - Zero-copy `ImageBitmap` transfer between main thread and worker.
  - Typed progress reporting (`preparing`, `transforming`, `encoding`, `completed`).
  - Cancellation tokens (`cancelJob(jobId)`) and error propagation.
  - Automatic fallback to main-thread processing when Web Workers or `OffscreenCanvas` are unsupported.
- [x] **Multi-Format Image Exporter (`src/lib/image/exporter.ts`):**
  - PNG, JPEG, and WebP export with configurable quality (0.01 to 1.0).
  - Solid background color flattening for formats without transparency (e.g. JPEG white fill preventing black pixels).
  - Ephemeral Blob generation and semantic download triggers (`processed-[name]-[timestamp].[ext]`).
- [x] **Interactive Preview Component (`src/components/image-engine/ImagePreview.tsx`):**
  - Responsive viewport with transparency checkerboard background.
  - Interactive Zoom In (+25%), Zoom Out (-25%), 100% Actual Size, and Fit to Screen.
  - Interactive click-and-drag Pan when zoomed with boundary clamping.
  - Floating metadata HUD overlay (original dimensions, aspect ratio, zoom level).
  - Decoupled preview scaling: viewport zoom never degrades master export resolution.
- [x] **Reusable Ingestion Dropzone (`src/components/image-engine/ImageDropzone.tsx`):**
  - Multi-file or single-file drag-and-drop and file picker.
  - Instant client-side validation, duplicate rejection, and decoding checks.
- [x] **Memory Management & Lifecycle Hook (`src/hooks/useImageEngine.ts`):**
  - Automated `ImageBitmap.close()` on file change and component unmount.
  - Automatic Object URL tracking and revocation via `revokeObjectUrlSafely()`.
  - Canvas buffer deallocation with `releaseCanvasBuffer()`.
- [x] **Automated Test Suite (`tests/image-engine.test.mjs`):**
  - 32 automated tests covering magic bytes, file validation, duplicates, resize math, crop clamping, rotation bounds, export naming, quality normalization, and memory management.
  - Integrated with `npm test`.
- [x] **Development-Only Test Harness (`src/app/test-engine/page.tsx`):**
  - Interactive test bench at `/test-engine` (outside public production navigation) for full pipeline testing.
- [x] **Documentation (`IMAGE_ENGINE.md`, `ARCHITECTURE.md`, `DEVELOPMENT_ROADMAP.md`, `PRIVACY.md`):**
  - Comprehensive API reference, supported formats, limitations, browser compatibility, and architectural rules.

---

## 📌 Phase 02 — Document & Card Cropping Suite (PAN, Aadhaar, Ration Card)

**Target Modules:** PAN Card Crop, Aadhaar Card Crop, Ration Card Crop

- [ ] **PDF.js Client Engine Integration:**
  - Dynamic browser-only worker loader for `pdfjs-dist`.
  - Password modal for encrypted e-Aadhaar PDFs.
  - Multi-page navigation and high-DPI canvas rasterization (300 DPI).
- [ ] **Interactive Dual-Side Card Cropper:**
  - Interactive crop bounding box with fixed aspect ratio (`1.5858` for ISO/IEC 7810 ID-1).
  - Dual-side capture workflow: Front Side Crop -> Back Side Crop.
  - Rotation, perspective tilt correction, and edge snap.
- [ ] **Image Pre-processing Filters:**
  - Auto-contrast and threshold sharpening for dot-matrix ration cards.
- [ ] **Direct PDF & JPEG Output Assembly:**
  - Compile front + back card segments onto single printable A4 sheets via `pdf-lib`.
  - Export 1:1 scale calibrated PVC card templates.

---

## 📌 Phase 03 — Professional Photo Studio & Multiple Photo Maker

**Target Modules:** Professional Photo Studio, Multiple Photo Maker

### 🔹 Phase 03A — Photo Upload, Decoded Ingestion & Master Viewport ✅ [COMPLETED]
- [x] Client-side photo upload dropzone with MIME, size, magic byte, and duplicate validation.
- [x] Native `createImageBitmap()` decoding respecting EXIF camera orientation.
- [x] Ephemeral Object URL memory tracking and deterministic garbage deallocation.
- [x] High-fidelity master viewport preview with 10%–500% zoom and panning.
- [x] Technical image metadata HUD (intrinsic pixels, aspect ratio, format, file size).
- [x] 100% in-browser privacy guarantee (zero server uploads, master retained in RAM).

### 🔹 Phase 03B — DPI & Physical Photo Size Calculator ✅ [CURRENT PHASE COMPLETED]
- [x] **Core Calculation Engine (`src/lib/photo-studio/dpi-calculator.ts`):**
  - Pure, independently testable mathematical formula: $\text{pixels} = (\text{mm} / 25.4) \times \text{DPI}$.
  - Documented nearest whole pixel rounding strategy (`Math.round`).
  - Strict input validation rejecting zero, negative, NaN, $< 1\text{ mm}$, $> 1000\text{ mm}$, and DPI $< 30$ or $> 2400$.
- [x] **Bi-Directional Aspect Ratio Lock:**
  - Maintain aspect ratio toggle with lock/unlock status indicators.
  - Width-driven reciprocal height calculation.
  - Height-driven reciprocal width calculation.
  - Friendly aspect ratio identification (35:45 Passport, 1:1 Square, 3:4 Portrait, 2:3, etc.).
- [x] **Image Resolution & Quality Analysis:**
  - Intrinsic image comparison: Original source resolution vs required output resolution.
  - Effective available DPI calculation: $\min(\text{DPI}_W, \text{DPI}_H)$ with limiting axis identification.
  - 3-tier photographic quality grading:
    - Tier A: Sufficient Resolution (Crisp, print-ready, scaleFactor $\le 1.0$).
    - Tier B: Upscaling Required (Moderate software interpolation, $1.0 < \text{scaleFactor} \le 1.5$).
    - Tier C: Significant Upscaling (Noticeable blurriness risk, $\text{scaleFactor} > 1.5$).
  - Transparent optical disclaimer: Software upscaling cannot synthesize missing sensor detail.
  - Aspect ratio mismatch detection alerting against facial stretching.
- [x] **Photo Dimensions & Resolution Panel (`src/components/photo-studio/PhotoDimensionsPanel.tsx`):**
  - Extensible preset architecture: Standard Passport (35 × 45 mm), US Visa (50.8 × 50.8 mm), Indian PAN (25 × 35 mm), Stamp Size (20 × 25 mm), Canada Passport (50 × 70 mm), Schengen Visa, Custom.
  - Supported DPI preset buttons: 72, 150, 200, 300, 600, plus custom DPI input.
  - Live calculated pixel dimensions, total megapixels, and target aspect ratio.
  - Responsive two-column desktop and single-column mobile layouts.
- [x] **Automated Test Suite (`tests/dpi-calculator.test.mjs`):**
  - 29 tests across 13 suites covering 35×45mm at 300/600 DPI, 40×50mm, custom dimensions, decimals, rejections, DPI boundaries, aspect ratio locks, quality tiers, aspect mismatch, effective DPI, and rounding precision.
  - 100% test pass rate across 82 total platform unit tests.

### 🔹 Phase 03C — Face Alignment, Borders & Background Replacement [UPCOMING]
- [ ] Face alignment guides and chin/crown boundary overlays.
- [ ] Custom border widths and solid studio background replacement (white, light blue, grey).
- [ ] Name and date of photo (DOP) text imprint generator.

### 🔹 Phase 03D — Multiple Photo Print Sheet Engine [UPCOMING]
- [ ] Multiple photo sheet arrangements: A4, 4 × 6 inch (10 × 15 cm), 5 × 7 inch.
- [ ] Configurable photo grid density, margins, and cutting line markers.
- [ ] High-resolution (300 / 600 DPI) PDF export for commercial photo printers.

---

## 📌 Phase 04 — Client-Side AI Background Remover

**Target Module:** Background Remover

- [ ] **In-Browser Model Deployment:**
  - Integration of lightweight quantized neural network weights (e.g. RMBG-1.4 or BiRefNet).
  - Execution runtime via Transformers.js / ONNX Runtime Web.
  - Hardware acceleration support: WebGPU with graceful WebGL/WASM fallback.
- [ ] **Mask Refinement & Edge Smoothing:**
  - Client-side alpha matting for hair and fine boundary details.
  - Instant background replacement: Solid studio backdrop or custom scene.

---

## 📌 Phase 05 — Advanced Photo Editor

**Target Module:** Advanced Photo Editor

- [ ] **Full Non-Destructive Canvas Editor:**
  - Interactive adjustments: Brightness, contrast, exposure, saturation, temperature.
  - Freeform and fixed aspect ratio cropping.
  - Sharpness enhancement matrix and noise reduction.
- [ ] **Target Size File Compressor:**
  - Binary search JPEG/WebP compression to achieve exact file size constraints (e.g., < 50 KB, < 100 KB for government forms).

---

## 📌 Phase 06 — Resume / CV Maker

**Target Module:** Resume / CV Maker

- [ ] **Structured Resume Builder:**
  - Reactive form sections: Contact, Experience, Education, Skills, Projects.
  - Live split-screen side-by-side preview.
  - ATS-friendly modern typography and structural formatting.
- [ ] **Direct Vector PDF Rendering:**
  - Vector text rendering via `pdf-lib` (selectable text, clickable links, perfect printing).

---

## 📌 Phase 07 — Offline PWA & Enterprise Hardening

- [ ] Service Worker configuration for 100% offline usage.
- [ ] Progressive Web App (PWA) manifest for desktop installability.
- [ ] End-to-end automated testing suite with Playwright.
- [ ] Comprehensive performance profiling and canvas memory benchmark reports.
