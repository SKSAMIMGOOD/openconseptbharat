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

### 🔹 Phase 03B — DPI & Physical Photo Size Calculator ✅ [COMPLETED]
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

### 🔹 Phase 03C — Passport Photo Presets & Interactive Crop Editor ✅ [CURRENT PHASE COMPLETED]
- [x] **Reusable Photo Presets Architecture (`src/types/crop-preset.ts` & `src/constants/crop-presets.ts`):**
  - Strongly typed `PhotoPreset` contract separating preset definitions from UI components.
  - 4 initial standard presets:
    1. Passport-style photo: 35 × 45 mm (aspect ratio 35:45 ~0.7778).
    2. Portrait photo: 40 × 50 mm (aspect ratio 4:5 = 0.8).
    3. Square photo: 2 × 2 inches (50.8 × 50.8 mm, aspect ratio 1:1 = 1.0).
    4. Custom dimensions: Fully user-definable width, height, and unit.
  - Extended country-specific preset catalog with configurable standards (Canada 50×70mm, Indian PAN 25×35mm, Stamp 20×25mm, Schengen Visa).
  - Explicit official standards advisory notice: presets never claim universal compliance; marked official only when verified against authoritative government standards.
- [x] **Custom Dimensions & Unit Conversion Subsystem (`src/lib/crop/unit-converter.ts`):**
  - Automatic bidirectional conversion across `mm`, `cm`, and `inch` (1 in = 25.4 mm, 1 cm = 10 mm).
  - Strict input validation rejecting <= 0, non-numeric, < 1 mm, and > 1000 mm.
  - Decimal support for fractional dimensions (e.g. 50.8 mm, 2.0 in, 3.5 cm).
  - Live aspect-ratio calculation and friendly ratio identification.
  - Integration with DPI calculator for target pixel projection.
- [x] **Interactive Crop Editor Engine (`src/lib/crop/crop-geometry.ts` & `src/components/photo-studio/InteractiveCropEditor.tsx`):**
  - Pure mathematical crop coordinate calculations separated from React components.
  - Intrinsic image coordinate system ($W_{\text{src}} \times H_{\text{src}}$) ensuring resolution-independent accuracy.
  - Adjustable crop frame with 8 directional resize handles (NW, N, NE, E, SE, S, SW, W).
  - Large touch targets (32px minimum hit-box) for smooth mobile touch dragging.
  - Fixed aspect-ratio crop mode with opposite-point anchor projections.
  - Free crop mode allowing unconstrained boundary adjustments.
  - Crop boundary clamping preventing negative coordinates, NaN values, and container overflows.
  - Preset switching adaptation: smoothly adapts aspect ratio around current center without resetting the uploaded photo.
  - Desktop mouse dragging and mobile touch dragging with pointer capture.
  - Alignment and framing controls: Center Crop, Fit to Image, Reset Position.
  - Viewport zoom (20% to 500%), mouse wheel zoom, 100% actual pixels, and fit to screen.
  - Viewport pan tool and toggleable rule-of-thirds composition grid.
  - Darkened SVG cutout overlay with crisp white border and real-time dimension HUD.
- [x] **Studio Background Color Options (`src/constants/background-options.ts`):**
  - 5 options: Transparent, Studio White (`#FFFFFF`), Light Blue (`#D0E8FF`), Light Grey (`#F3F4F6`), and Custom Hex Picker.
  - Preserves alpha transparency for PNG/WebP cutouts.
  - Clear transparency advisory: changes background behind transparent pixels or letterbox margins; does not remove solid photo backgrounds (reserved for Phase 04).
- [x] **Live Composition Preview Card (`src/components/photo-studio/CropPreviewCard.tsx`):**
  - Real-time canvas render of the exact cropped composition with background color fill.
  - Selected preset name, physical dimensions with unit, aspect ratio, crop pixel dimensions, target resolution at selected DPI, original image dimensions, viewport zoom percentage, and optical print resolution quality tier.
  - Memory integrity assurance: master photo remains 100% unmodified in browser RAM.
- [x] **Automated Test Suite (`tests/crop-editor.test.mjs`):**
  - 40 new automated unit tests across 12 suites covering all predefined presets, custom dimensions, unit conversions, decimal precision, aspect ratio math, boundary clamping, image repositioning, 8-handle resizing (fixed & free), preset switching without reset, transparent image handling, studio backgrounds, high-resolution 12MP cropping, and memory cleanup.
  - 100% test pass rate across 122 total platform unit tests.
- [x] **Zero-Upload Privacy Architecture:**
  - 100% in-browser processing via HTML5 Canvas and native JavaScript math. Zero backend servers or persistent storage.

### 🔹 Phase 03D — 4×6 Inch Photo Sheet Generator ✅ [COMPLETED]
- [x] **Core Sheet Calculation Architecture (`src/lib/photo-studio/sheet-calculator.ts`):**
  - Standard physical 4×6″ card dimensions: $101.6 \times 152.4\text{ mm}$ ($4.0 \times 6.0\text{ in}$).
  - Portrait ($101.6 \times 152.4\text{ mm}$) and Landscape ($152.4 \times 101.6\text{ mm}$) orientation switching.
  - Pixel dimensions across DPI presets: 150 DPI ($600 \times 900$ / $900 \times 600$), 200 DPI ($800 \times 1200$ / $1200 \times 800$), 300 DPI ($1200 \times 1800$ / $1800 \times 1200$), 600 DPI ($2400 \times 3600$ / $3600 \times 2400$).
  - Exact PDF PostScript dimensions: $288.0000 \times 432.0000\text{ pt}$ (Portrait) and $432.0000 \times 288.0000\text{ pt}$ (Landscape).
  - Configurable outer margins (default 4 mm) and photo spacing (default 2 mm).
  - Center-aligned grid placement algorithm.
- [x] **Canvas Rasterization & PDF Vector Synthesis (`src/lib/photo-studio/sheet-renderer.ts` & `src/lib/photo-studio/sheet-exporter.ts`):**
  - High-quality bicubic canvas rasterization at full DPI target resolution.
  - Multi-format export: PNG (lossless), JPEG (with solid white background flattening), and PDF.
  - Direct PDF page synthesis via `pdf-lib` with exact physical points and bottom-left coordinate inversion.
  - Toggleable cutting guides: corner crop marks and dashed separation grid lines.
- [x] **Automated Test Suite (`tests/photo-sheet.test.mjs`):**
  - 33 automated tests covering dimensions, capacities, custom rows/cols, margins, cutting guides, overlap prevention, PNG/JPEG rendering, and exact PDF points.

### 🔹 Phase 03E — A4 Photo Sheet Generator ✅ [CURRENT PHASE COMPLETED]
- [x] **ISO 216 Standard A4 Paper Configuration:**
  - Physical dimensions: $210.0 \times 297.0\text{ mm}$ ($8.2677165 \times 11.6929134\text{ in}$).
  - Portrait orientation ($210 \times 297\text{ mm}$) and Landscape orientation ($297 \times 210\text{ mm}$).
  - Standard DPI presets: 150 DPI ($1240 \times 1754\text{ px}$), 200 DPI ($1654 \times 2339\text{ px}$), 300 DPI ($2480 \times 3508\text{ px}$), 600 DPI ($4961 \times 7016\text{ px}$).
  - Custom DPI input support with strict validation ($30 \le \text{DPI} \le 2400$).
  - Exact PostScript PDF page dimensions: **$595.2756 \times 841.8898\text{ pt}$** for Portrait and **$841.8898 \times 595.2756\text{ pt}$** for Landscape (never derived from rounded pixels).
- [x] **Complete Reuse of Layout & Composition Engine:**
  - Zero duplicated layout math or independent sheet engines; unified `calculatePhotoSheetLayout` parameterized by `paperSize: "a4" | "4x6"`.
  - Automatic capacity derivation and manual row/column grid selection.
  - 35×45mm passport capacity: **30 photos** (5 cols × 6 rows) on Portrait, **28 photos** (7 cols × 4 rows) on Landscape.
  - 50.8×50.8mm (2×2″) US Visa capacity: **15 photos** (3 cols × 5 rows) on Portrait, **15 photos** (5 cols × 3 rows) on Landscape.
  - 40×50mm portrait capacity: **20 photos** (4 cols × 5 rows) on Portrait, **18 photos** (6 cols × 3 rows) on Landscape.
  - Inherits cropped photo composition from Phase 03C without distortion or stretching.
- [x] **Copy Count Invariant (Zero Silent Reduction):**
  - Strictly preserves requested copy count in state (`config.copies`).
  - High-visibility warning banner showing requested count, sheet capacity, placed count, and overflow count when requested copies exceed sheet capacity.
- [x] **Cutting Guides & Alignment:**
  - Corner crop marks with customizable offset and arm length.
  - Dashed separation lines in horizontal and vertical photo gutters.
  - Configurable line color and stroke thickness (0.5 mm to 2.0 mm).
  - 1-click toggle to export with or without cutting guides.
- [x] **Interactive Workspace & Scaled Preview:**
  - Responsive two-column workspace (`SheetControlsPanel` and `SheetPreviewPanel`).
  - Paper format switcher: 1-click toggle between Standard A4 ($210 \times 297\text{ mm}$) and 4×6″ ($101.6 \times 152.4\text{ mm}$).
  - Live HUD displaying paper size, orientation, photo count, physical photo dimensions, output resolution, margins, and spacing.
  - Interactive preview zoom (10% to 500%), reset zoom, and "Fit to Screen" auto-scaling.
  - Scaled preview canvas rendering preventing lag during control adjustments.
  - Step tabs in Photo Studio: `Step 1: Crop & Framing`, `Step 2: A4 Sheet`, `Step 3: 4×6″ Sheet` with URL parameter synchronization (`?tab=sheet-a4`, `?tab=sheet-4x6`).
- [x] **Print-Ready Export Pipeline:**
  - Multi-format client-side export: PNG (lossless), JPEG (white background fill, configurable quality), and PDF.
  - Exact PostScript PDF dimensions ($595.2756 \times 841.8898\text{ pt}$) with bottom-left coordinate inversion.
  - Documented physical print guidelines: Actual Size (100%), uncheck "Fit to Page", select A4 paper, account for mechanical printer margins.
- [x] **Automated Test Suite (`tests/a4-photo-sheet.test.mjs`):**
  - 36 new automated tests verifying all 17 requirements of Phase 03E specification plus cross-engine comparative parity between A4 and 4×6.
  - **191 total unit tests** passing with 0 failures across 6 test suites (`image-engine`, `photo-studio`, `dpi-calculator`, `crop-editor`, `photo-sheet`, `a4-photo-sheet`).
- [x] **Zero-Upload Privacy Invariant:**
  - 100% in-browser generation. Zero server uploads, zero cloud APIs, zero persistent storage.

### 🎯 Phase 03F — Multiple Photo Maker ✨ [COMPLETED]
- [x] **Multi-Photo Upload Interface (`src/components/multiple-photo-maker/MultiPhotoDropzone.tsx` & `UploadedPhotoGallery.tsx`):**
  - Multi-image dropzone supporting JPG, JPEG, PNG, and WebP up to 20 MB.
  - Add more images anytime without removing existing ones.
  - Interactive thumbnails displaying filename, pixel dimensions, file size, and sequential badge.
  - Per-photo print copy counter controls (+ / - buttons and direct numeric input).
  - Quick-set bulk copies for all photos (1×, 2×, 3×, 4×, 6×, 8×).
  - Safe individual removal and "Clear All" with deterministic object URL memory revocation.
- [x] **Configurable Photo Dimensions & Unit Conversion Subsystem (`src/lib/multiple-photo/multiple-photo-engine.ts`):**
  - Default physical photo dimensions: 1.1 × 1.35 inches (27.94 × 34.29 mm).
  - Measurement units: Inch, Centimeter, Millimeter with lossless unit conversion.
  - Aspect-ratio safe center-cropping (`calculateCenterCrop`) guaranteeing photos are never stretched or distorted.
- [x] **DPI Calibration Engine (150, 200, 300, 600 DPI):**
  - Pure mathematical formula: $\text{pixels} = \text{Math.round}((\text{mm} / 25.4) \times \text{DPI})$.
  - Verified default at 300 DPI: $1.1\text{ in} \to 330\text{ px}$, $1.35\text{ in} \to 405\text{ px}$.
- [x] **Print Sheet Grid & Sequential Arrangement Engine (`src/lib/photo-studio/sheet-calculator.ts` & `sheet-renderer.ts`):**
  - Complete reuse of layout engine with parameterization for 4×6″ and A4 paper.
  - Top-aligned photo placement without vertical centering.
  - Strict maximum four photographs per row constraint (`maxColumnLimit = 4`).
  - Predictable sequential ordering: Photo A (3), Photo B (3), Photo C (3) produces A A A / B B B / C C C.
  - Automatic capacity derivation and overflow boundary protection.
- [x] **Live Scaled Preview & HUD Viewport (`src/components/multiple-photo-maker/MultiplePhotoPreviewPanel.tsx`):**
  - Real-time scaled preview canvas with zoom (40% to 300%) and pan controls.
  - Informative HUD strip: paper dimensions, photo dimensions, DPI, placed copies, max capacity.
  - Capacity limit warning alert when requested copies exceed sheet boundaries without silent loss.
- [x] **Print-Ready Multi-Format Export Pipeline:**
  - Download 4×6 PDF and Download A4 PDF with exact physical PostScript points ($288 \times 432\text{ pt}$ and $595.2756 \times 841.8898\text{ pt}$).
  - Download high-res lossless PNG and solid-white-backed JPEG at selected DPI.
- [x] **Automated Test Suite (`tests/multiple-photo-maker.test.mjs`):**
  - 41 new unit tests covering all 10 core requirements of Phase 03F.
  - **227 total unit tests** passing with 0 failures across 7 test suites (`image-engine`, `photo-studio`, `dpi-calculator`, `crop-editor`, `photo-sheet`, `a4-photo-sheet`, `multiple-photo-maker`).
- [x] **100% In-Browser Privacy Invariant:**
  - Zero server uploads, zero remote APIs, zero permanent storage, complete deterministic memory cleanup.

### 🎯 Phase 03G - Custom Photo Dimensions ✅ [COMPLETED]
- [x] **Custom Dimensions Controls & Unit Conversion Subsystem (`src/lib/crop/unit-converter.ts` & `src/components/photo-studio/PhotoPresetSelector.tsx`):**
  - Physical measurement unit support across millimeters (`mm`), centimeters (`cm`), and inches (`in`).
  - Pure mathematical conversion using standard constants: $1\text{ inch} = 25.4\text{ mm}$, $1\text{ cm} = 10\text{ mm}$.
  - Target pixel calculation: $\text{Pixels} = (\text{dimension in mm} / 25.4) \times \text{DPI}$ (nearest whole integer via `Math.round`).
  - Unit switching without changing physical dimensions (lossless conversion).
  - Print resolution controls: default 300 DPI, quick presets (150, 200, 300, 600), and custom numeric input ($30 \le \text{DPI} \le 2400$).
- [x] **Live Dimensions & Pixel Preview HUD:**
  - Real-time updates of physical size and calculated pixel dimensions on any change.
  - Live aspect ratio derivation with friendly name formatting.
  - Bi-directional proportional aspect lock toggle for independent or proportional width/height adjustments.
- [x] **Crop Editor & Framing Integration (`src/app/tools/photo-studio/page.tsx` & `src/components/photo-studio/CropPreviewCard.tsx`):**
  - Dynamic crop frame updates to match custom aspect ratio without distortion or stretching.
  - Full repositioning and zooming within natural image bounds.
  - 1-click single cropped photo export (PNG / JPEG) at exact calculated pixel dimensions.
- [x] **Photo Sheet Integration (`src/components/photo-studio/sheet/PhotoSheetWorkspace.tsx` & `src/components/photo-studio/sheet/SheetControlsPanel.tsx`):**
  - Custom photo sizing available across both 4×6 inch and A4 photo sheets.
  - Mathematical capacity calculation, top-aligned layout, spacing, and zero-overlap invariants.
  - Clear capacity display and navigation back to crop editor.
- [x] **Browser Crash Protection & Validation (`src/lib/crop/unit-converter.ts`):**
  - Validates empty / NaN values, non-positive numbers, out-of-range DPI, physical limits ($1\text{ mm}$ to $1000\text{ mm}$).
  - Enforces canvas memory allocation safety caps (maximum 10,000 px per side, 50 megapixels total).
- [x] **Automated Test Suite (`tests/custom-dimensions.test.mjs`):**
  - 23 new unit tests covering all 7 test cases specified in Phase 03G.
  - **284 total unit tests** passing with 0 failures across 9 test suites.

---

## 📌 Phase 05 — AI Background Remover ✅ [COMPLETED]

**Target Module:** Background Remover

- [x] **In-Browser Model Deployment & Runtime Architecture:**
  - Integrated Microsoft ONNX Runtime Web (`onnxruntime-web`) executing 100% locally in browser memory.
  - Multi-tier hardware acceleration: WebGPU with graceful WebGL and WebAssembly (WASM) fallbacks.
  - Single-thread WASM configuration avoiding `SharedArrayBuffer` security header (COOP/COEP) limitations.
  - Offloaded neural network execution via dedicated Web Worker (`src/workers/background-remover.worker.ts`) preventing main UI thread blocking.
  - Seamless automatic fallback to asynchronous main-thread execution when Web Workers or `OffscreenCanvas` are unavailable.
- [x] **Model Presets & Transparent Weight Ingestion:**
  - Primary Recommended Model: **BRIA RMBG-1.4** (Quantized ONNX, ~43.9 MB) with $1024 \times 1024$ input resolution for studio-grade hair and fabric boundary detail.
  - Fast & Lightweight Model: **U2NetP** (~4.7 MB) with $320 \times 320$ input resolution and ImageNet normalization for low-bandwidth connections.
  - User-provided custom `.onnx` model upload option for air-gapped / offline enterprise use.
  - Transparent model metadata HUD disclosing pretrained weights sources (Hugging Face) and download sizes.
  - Byte-level stream progress reporting during initial weight downloads.
  - Native browser `CacheStorage` caching (`browser-utility-studio-ai-models-v1`) ensuring weights download once and run offline indefinitely.
- [x] **Tensor Preprocessing & Mask Refinement:**
  - NCHW tensor construction and model-specific channel normalization.
  - Continuous alpha mask extraction with min-max logit normalization.
  - Hardware-accelerated canvas bicubic interpolation scaling masks back to original master photo resolution without pixelation.
  - Alpha matting composite strictly preserving 100% of original foreground RGB color data.
- [x] **Studio Background Backdrop Selection:**
  - 7 standard options: Lossless Transparent, Studio White (`#FFFFFF`), Passport Light Blue (`#D0E8FF`), Navy Dark Blue (`#1E3A8A`), Vibrant Red (`#DC2626`), Studio Green (`#16A34A`), and Custom Hex Color Picker.
  - Instantaneous in-memory background switching without requiring neural network re-inference.
- [x] **High-Fidelity Interactive Preview Viewport:**
  - 4 view modes: Interactive Before/After Split Slider with draggable divider, Side-by-Side comparison, Processed Cutout only, and Original Photo only.
  - Checkerboard transparency background rendering.
  - Interactive Zoom In (+25%), Zoom Out (-25%), 100% Actual Size, Fit to Screen, and Pan dragging.
  - Real-time technical metadata HUD (dimensions, aspect ratio, zoom level, background status).
- [x] **Multi-Format Export Pipeline:**
  - Download Transparent PNG with intact alpha channel.
  - Download PNG composited with selected background backdrop.
  - Download high-quality JPEG (with automatic solid white substitution when transparent was active).
  - Semantic, timestamped download naming: `bg-removed-[name]-[backdrop]-[timestamp].[ext]`.
- [x] **Photo Studio In-Memory Handoff:**
  - One-click "Send to Professional Photo Studio" handoff.
  - Ephemeral RAM transfer service (`src/lib/utils/image-transfer.ts`) passing files across client routes.
  - 100% zero persistence: no localStorage, sessionStorage, IndexedDB, or server transmission.
- [x] **Automated Test Suite (`tests/background-remover.test.mjs`):**
  - 27 automated tests across 10 suites covering model specifications, tensor normalization math, alpha scaling, RGB preservation, background presets, export naming, in-memory handoff, magic byte validation, and zero-upload privacy.
  - **254 total unit tests** passing with 0 failures across 8 test suites.

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
