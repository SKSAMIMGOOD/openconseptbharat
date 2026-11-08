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

### 🎯 Phase 03H — Professional Download & Print Export ✅ [COMPLETED]
- [x] **Binary DPI Metadata Engine (`src/lib/image/dpi-metadata.ts`):**
  - PNG `pHYs` Chunk Injection: Exact physical resolution encoding in pixels per meter ($\text{PPM} = \text{round}(\text{DPI} / 0.0254)$) with pure ISO 3309 CRC-32 checksum calculation. Verified at 150, 200, 300, and 600 DPI.
  - PNG `pHYs` Chunk Extraction: Fast byte-level parsing recovering exact DPI from exported PNG files.
  - JPEG JFIF `APP0` Marker Injection: Exact resolution encoding setting density units = 1 (DPI) and $X_{\text{density}} = Y_{\text{density}} = \text{DPI}$. Verified at 150, 200, 300, and 600 DPI.
  - JPEG JFIF `APP0` Marker Extraction: Header inspection recovering density units and X/Y DPI values.
  - In-place marker update: Updates existing JFIF APP0 markers without growing file size.
- [x] **Individual Photo Export Pipeline (`src/components/photo-studio/CropPreviewCard.tsx`):**
  - Full format support: PNG (lossless) and JPEG (configurable quality 70% to 100%, default 95%).
  - Alpha Transparency Preservation: Transparent PNG cutouts retain alpha transparency without solid background flattening.
  - Solid White Background Flattening: JPEG exports flatten transparent pixels over solid `#FFFFFF` to prevent black corrupted pixels.
  - Export at exact calculated pixel dimensions for Standard Passport (413 × 531 px @ 300 DPI), US Visa (600 × 600 px @ 300 DPI), Indian PAN (295 × 413 px @ 300 DPI), Stamp Size (236 × 295 px @ 300 DPI), Canada Passport (591 × 827 px @ 300 DPI), and Custom Dimensions without stretching or distortion.
  - Embedded DPI metadata (PNG `pHYs` / JPEG `JFIF APP0`) written into downloaded image blobs.
  - Descriptive semantic filenames (`photo-{preset}-{dimensions}-{dpi}dpi-{w}x{h}px.{ext}`).
- [x] **Photo Sheet Export Pipeline (`src/lib/photo-studio/sheet-exporter.ts`):**
  - 4×6 inch sheet export at exact pixel dimensions: 300 DPI ($1200 \times 1800$ portrait / $1800 \times 1200$ landscape) and 600 DPI ($2400 \times 3600$ px).
  - A4 sheet export at exact pixel dimensions: 300 DPI ($2480 \times 3508$ portrait / $3508 \times 2480$ landscape) and 600 DPI ($4961 \times 7016$ px).
  - Embedded DPI metadata in both PNG and JPEG sheet images.
  - Vector-calibrated PDF generation with exact PostScript physical points ($288 \times 432$ pt for 4×6, $595.2756 \times 841.8898$ pt for A4) via `pdf-lib`.
- [x] **Interactive Print Preview & Direct Print Mode (`src/components/photo-studio/sheet/PrintPreviewModal.tsx` & `PhotoSheetWorkspace.tsx`):**
  - True 1:1 page layout modal displaying paper size, orientation, DPI, arranged photo count, and cutting guide style.
  - Critical Printer Calibration Checklist: actual size (100%), match paper size, match orientation, disable headers/footers, non-printable margins advisory.
  - Direct browser print triggers (`handlePrintSheet`) with dynamic `@page { size: ...; margin: 0; }` style injection.
  - Comprehensive print stylesheet (`@media print` in `src/app/globals.css`) hiding all website chrome, navigation, headers, footers, buttons, and sidebars, rendering solely `#printable-sheet-container`.
- [x] **Export Reliability & Deterministic Memory Protocol:**
  - Ephemeral Blob-based downloads with tracked object URLs (`createTrackedObjectURL`).
  - Automatic scheduled revocation (`revokeObjectUrlSafely`) after browser download initiation.
  - Canvas buffer deallocation with `releaseCanvasBuffer` in `finally` blocks.
  - Duplicate click protection locking UI buttons during active exports (`isExporting` guard).
- [x] **Automated Test Suite (`tests/export-and-print.test.mjs`):**
  - 30 new unit tests verifying PNG `pHYs` generation/extraction, JPEG JFIF `APP0` injection/extraction, 300/600 DPI pixel dimensions, transparency preservation, JPEG white fill, 4×6/A4 sheet dimensions, exact PDF points, and duplicate protection.
  - **314 total platform unit tests** passing with 0 failures across 10 test suites.
- [x] **Zero-Upload Privacy Invariant:**
  - 100% in-browser generation. Zero server uploads, zero cloud APIs, zero persistent storage.

### 🎯 Phase 03I — Photo Studio Final QA, Integration Testing, and Bug Fixing ✅ [COMPLETED]
- [x] **Full Feature Audit Across All 12 Photo Studio Subsystems:**
  - Verified image upload, file replacement, and memory revocation across all image formats.
  - Verified original image preview with live resolution assessment and dimension calculations.
  - Verified DPI calculators and physical millimeter/inch/pixel invariant conversions.
  - Verified all 8 passport and identity photo presets (India Passport, US Visa, Schengen Visa, UK/EU, Indian PAN, Stamp Size, Canada Passport, Australia).
  - Verified interactive crop editor, rule-of-thirds grid, aspect ratio locking, and natural boundary clamping.
  - Verified custom dimensions mode with live millimeter/inch conversion and dynamic pixel recalculation.
  - Verified background backdrop selection, transparency preservation, and solid white fill for JPEGs.
  - Verified Multiple Photo Maker grid tiling across A4, 4×6, and 5×7 sheets.
  - Verified 4×6 photo sheet generation, grid placement, margins, gaps, cutting guides, and capacity alerts.
  - Verified A4 photo sheet generation with multi-photo arrangements and print point metrics.
  - Verified PNG and JPEG downloads with embedded binary DPI metadata (`pHYs` chunk and JFIF `APP0` marker).
  - Verified print preview modal, calibration checklists, and direct browser printing via `@media print`.
- [x] **Realistic Integration Workflows Verified:**
  - **Workflow A:** Photo upload → select passport preset → crop → download PNG (lossless with embedded 300 DPI metadata).
  - **Workflow B:** Photo upload → enter custom dimensions ($50 \times 50\text{ mm}$) → crop → export at 300 DPI ($591 \times 591\text{ px}$).
  - **Workflow C:** Multiple photos / copies arranged on 4×6 sheet ($1200 \times 1800\text{ px}$) → download PNG/JPEG.
  - **Workflow D:** Multiple photos arranged on A4 sheet ($2480 \times 3508\text{ px}$) → 1:1 print preview → print sheet directly.
  - **Workflow E:** Background Remover cutout → in-memory transfer to Photo Studio (`peekStagedImage` + `consumeTransferredImage`) → crop → export.
  - **Workflow F:** Dynamic dimension or DPI adjustment (150 / 300 / 600 DPI) → synchronized preview, pixel dimensions, and export updates.
- [x] **Identified & Resolved Critical Bugs:**
  - **Bug 1: PDF TypedArray Blob Part Incompatibility (`src/lib/photo-studio/sheet-exporter.ts`):** `pdfDoc.save()` returns `Uint8Array<ArrayBufferLike>`. Typed array buffer slice/type mismatch during PDF blob assembly resolved with typed buffer wrapper (`new Blob([pdfBytes as any], { type: "application/pdf" })`).
  - **Bug 2: PhotoDimensionsPanel State Desynchronization (`src/components/photo-studio/PhotoDimensionsPanel.tsx` & `src/app/tools/photo-studio/page.tsx`):** Fixed isolated internal state in `PhotoDimensionsPanel`. Added controlled props (`currentWidthMm`, `currentHeightMm`, `currentDpi`, `currentPresetId`) and synchronization `useEffect` to ensure preset selection in `PhotoPresetSelector` immediately updates resolution analysis metrics.
  - **Bug 3: Paper Size Toggle Reversion Bug (`src/components/photo-studio/sheet/PhotoSheetWorkspace.tsx`):** Switching to 4×6 paper inside `SheetControlsPanel` was immediately overwritten back to A4 by parent `activeTab` sync. Resolved by tracking `prevInitialPaperSizeRef` and bubbling paper size changes via `onPaperSizeChange`.
  - **Bug 4: React 18 Double-Mount Premature Staging Eviction (`src/app/tools/photo-studio/page.tsx`):** In React 18 strict mode, initial mount consumed and cleared staged transfer images, leaving the workspace empty on remount. Resolved by peeking staging state during inspection and consuming upon active workspace consumption (`peekStagedImage` + `consumeTransferredImage`).
  - **Bug 5: Crop Editor Post-Unmount Canvas Execution (`src/components/photo-studio/InteractiveCropEditor.tsx`):** Canvas draw loop in `Image.onload` could execute after fast unmount / preset toggle. Added `isMounted` cancellation guards.
  - **Bug 6: Multiple Photo Maker Missing Direct Browser Print (`src/components/multiple-photo-maker/MultiplePhotoPreviewPanel.tsx`):** Multiple Photo Maker lacked direct browser printing for Workflow D. Integrated `PrintPreviewModal`, `renderMasterSheetCanvas`, `#printable-sheet-container`, dynamic `@page` injection, and ephemeral URL cleanup.
- [x] **Automated Test Suite (`tests/phase-03i-qa-integration.test.mjs`):**
  - 24 comprehensive integration tests covering Workflows A–F, mathematical invariants, boundary clamping, and privacy guarantees.
  - **338 total platform unit & integration tests** passing with 0 failures across 19 test suites.
- [x] **Zero-Upload Privacy Invariant:**
  - 100% client-side execution verified across all workflows. Zero external telemetry, zero backend processing.

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
**Status:** Completed  
**Target Route:** `/tools/resume-maker`

- [x] **Structured Resume Builder Interface (`src/app/tools/resume-maker/page.tsx` & `src/components/resume/ResumeEditor.tsx`):**
  - Reactive form sections: Contact Details, Professional Summary, Work Experience, Education, Skills, Key Projects, and Additional Sections (Certifications, Languages, Awards, Achievements).
  - Add, edit, remove, and reorder (Move Up / Down) capabilities for Work Experience, Education, and Projects.
  - Live split-screen side-by-side editing and preview on desktop with responsive mobile view switcher ("Edit Details" vs "Live Preview").
  - Local persistence via `localStorage` with corrupted data recovery and 0 server uploads.
  - JSON backup Export and Import functionality.
  - One-click "Load Sample" and "Reset" features.
- [x] **Resume Template Engine (`src/components/resume/templates/`):**
  - **Modern Professional:** Contemporary typography with subtle brand accents, balanced spacing, and high readability.
  - **Minimal ATS:** Strict single-column, high-contrast monochrome layout engineered specifically for applicant tracking system parsers.
  - **Classic Corporate:** Elegant serif typography (Times/Georgia) with formal rules, centered header, and traditional executive alignment.
- [x] **Direct Vector PDF Rendering (`src/lib/resume/resume-pdf.ts`):**
  - 100% in-browser vector PDF compilation using `pdf-lib` (PageSizes.A4: $595.28 \times 841.89\text{ pt}$).
  - Fully selectable, copyable, ATS-searchable text with standard embedded fonts (Helvetica, TimesRoman).
  - Multi-page pagination with automatic text wrapping, orphan prevention, and footer page numbering ("Page X of Y").
  - Browser-native print preview support.
- [x] **Automated Test Suite (`tests/resume-maker.test.mjs`):**
  - 24 automated unit and integration tests covering empty resume, basic contact info, full multi-section resume, long text wrapping, 10+ experience entries pagination, template switching, JSON round-trip, and local persistence.
  - **670 total tests passing** with 0 failures across all 55 test suites.

---

## 📌 Phase 07 — Offline PWA & Enterprise Hardening

- [ ] Service Worker configuration for 100% offline usage.
- [ ] Progressive Web App (PWA) manifest for desktop installability.
- [ ] End-to-end automated testing suite with Playwright.
---

## 📌 Phase 08A — Document Studio Foundation & Upload Workspace

**Status:** Completed  
**Target Route:** `/tools/document-studio`

- [x] **Dedicated Document Studio Page & Navigation Integration:**
  - Integrated `/tools/document-studio` into the tool registry (`src/constants/tools.ts`), desktop navigation, mobile drawer (`src/components/layout/Header.tsx`), footer directory (`src/components/layout/Footer.tsx`), and dashboard.
  - Leveraged `ModuleLayout` preserving design system conventions, responsive layouts, and trust badges ("Browser Isolated", "0 Bytes Uploaded").
- [x] **Centralized Document Configuration Registry (`src/constants/document-studio.ts`):**
  - Registered 5 standardized document presets:
    - **Aadhaar Card:** Front (Photo, Name, DOB, Aadhaar No) and Back (Address, QR, Helplines) sides configured.
    - **PAN Card:** Single-sided (Front only: PAN number, photo, signature).
    - **Voter ID Card:** Front (Photo, EPIC No, Name) and Back (Address, Polling Station) sides configured.
    - **Ration Card:** Front (Card No, Category, Dealer, QR) and Back (Address, Members, Authority) sides configured.
    - **Custom Document:** Dynamic user-selected sides (Front & Back, Front Only, Back Only).
  - Target dimensions documented according to ISO/IEC 7810 ID-1 standard ($85.60 \times 53.98\text{ mm}$), while preserving flexibility for interactive fine-tuning in future cropping/printing phases.
- [x] **Independent Front & Back Upload Workspace:**
  - Separate upload dropzones and state stores for Front Side and Back Side.
  - Actions on one side never mutate or interfere with the other.
  - Natural image aspect-ratio preservation within responsive containers.
  - One-click replacement and removal with complete memory cleanup.
  - Real-time HUD displaying filename, intrinsic dimensions ($W \times H\text{ px}$), aspect ratio, and formatted file size.
- [x] **Multi-Format & PDF In-Browser Engine (`src/lib/document/document-processor.ts`):**
  - Supported input formats: JPG, JPEG, PNG, WebP, and multi-page PDF documents.
  - 100% in-browser PDF parsing and page counting via `pdf-lib`.
  - High-DPI canvas rasterization of PDF pages via local `pdfjs-dist` worker (`public/pdf.worker.min.js`).
  - Interactive multi-page navigation controls (Previous/Next page, page selector buttons).
  - One-click multi-page split helper (auto-assigns Page 1 to Front and Page 2 to Back).
  - Graceful rejection of invalid formats (`.exe`, `.zip`, `.txt`, spoofed files) and files exceeding the 30 MB threshold.
- [x] **Strict Privacy & Ephemeral Memory Guarantees:**
  - 100% client-side memory processing (0 bytes uploaded to remote servers or third-party APIs).
  - Zero persistent storage of document images in localStorage, IndexedDB, or cookies.
  - Proactive revocation of temporary Object URLs (`URL.revokeObjectURL`) upon file replacement, removal, and component unmount.
- [x] **Automated Test Suite (`tests/document-studio.test.mjs`):**
  - 22 automated tests covering configuration registry, side rules, file validation, magic byte checks, multi-page PDF inspection, front/back isolation, and navigation routing.
  - **408 total tests passing** with 0 failures across all 14 test suites.

---

## 📌 Phase 08B — Automatic & Manual Crop in Document Studio

**Status:** Completed  
**Target Route:** `/tools/document-studio`

- [x] **Interactive Manual Crop Editor (`src/components/document-studio/DocumentCropEditor.tsx`):**
  - Independent manual crop editor for Front and Back sides.
  - 8 draggable resize handles (4 corners with corner brackets + 4 edge midpoint pills).
  - Smooth pan/drag repositioning of the active crop rectangle with full pointer capture.
  - Mouse and touch gesture support across desktop and mobile devices.
  - 90° clockwise and counterclockwise step rotation with automatic coordinate re-centering.
  - Zoom controls: Zoom In, Zoom Out, mouse wheel zooming, and reset zoom to fit.
  - Aspect ratio locking: standard ISO ID-1 card aspect ratio ($85.60 \times 53.98\text{ mm} \approx 1.586$) or original image ratio, with free-crop unlock toggle.
  - Absolute boundary clamping: crop rectangle is strictly constrained within image boundaries (`clampCropToBounds`).
  - Rule-of-thirds alignment grid and dark ambient dimming mask for precise framing.
- [x] **In-Browser Automatic Document Boundary Detector (`src/lib/document/document-detector.ts`):**
  - 100% browser-side computer vision algorithm executing in <25 ms without external APIs or heavyweight dependencies.
  - Downsamples to a high-speed working thumbnail (max 500 px) for near-instant execution.
  - Background profiling via perimeter sampling (mean color, luminance, and standard deviation).
  - Contrast threshold verification: prevents false detections on monochromatic or uniform images.
  - Sobel gradient edge mapping ($G_x, G_y$) combined with Euclidean background color distance.
  - Multi-scanline median boundary extraction (robust against shadows, glares, and texture artifacts).
  - Perimeter edge-density verification to ensure boundary authenticity.
  - Non-destructive 1.5% safety margin padding preventing any document text or border clipping.
  - Target document aspect-ratio alignment expanding outward to preserve detected card content.
  - Accurate scaling back to native full-resolution coordinates.
  - **Honest Fallback Protocol:** Fails gracefully when background is non-contrasting, never falsely claiming automatic detection; automatically opens the manual crop editor with clear user notification.
- [x] **High-Resolution Canvas Crop Engine (`src/lib/document/document-cropper.ts`):**
  - Offscreen Canvas crop rendering at native original image resolution.
  - Zero stretching or distortion with high-quality bicubic smoothing.
  - Clean 90° rotation rasterization preserving original aspect ratios and crisp text legibility.
  - Preserves original uploaded image in memory so users can redo, readjust, or reset crops at any time.
  - Asynchronous Blob generation (`image/png`) and temporary Object URL creation.
- [x] **Enhanced Document Studio Workspace UX (`src/components/document-studio/DocumentSideWorkspace.tsx`):**
  - Quick action toolbar: Auto Crop, Manual Crop / Adjust Crop, Rotate Left, Rotate Right, Zoom In, Zoom Out, Reset Crop.
  - "Final Crop Preview" mode with "Cropped" badge, dimensions ($W \times H\text{ px}$), and "Show Original" / "Show Cropped" toggle.
  - Real-time side status reflection in Document Studio Controls sidebar ("Cropped & Ready" vs "Uploaded").
- [x] **Strict Ephemeral Memory & Privacy Guarantees:**
  - Zero server uploads or third-party image-processing APIs.
  - No document images persisted in localStorage or IndexedDB.
  - Proactive revocation of both preview and cropped Object URLs (`URL.revokeObjectURL`) on replace, remove, reset, and unmount.
- [x] **Automated Test Suite (`tests/document-studio-crop.test.mjs`):**
  - 22 comprehensive automated tests covering boundary detection on contrasting and colored backgrounds, honest fallback behavior, 90° rotation math, 8-handle resizing, boundary clamping, standard ID-1 card presets, and state isolation.
  - **430 total tests passing** with 0 failures across all 15 test suites.

## 📌 Phase 08C — Document Enhancement Controls in Document Studio

**Status:** Completed  
**Target Route:** `/tools/document-studio`

- [x] **Collapsible Document Enhancement Panel (`src/components/document-studio/DocumentEnhancementPanel.tsx`):**
  - Collapsible enhancement panel with chevron toggle and real-time active status badges ("Front: Enhanced", "Back: Enhanced").
  - Independent side switcher tabs (`[Front Side]`, `[Back Side]`) for dual-sided documents with active indicator dots.
  - Non-destructive slider controls:
    - **Brightness**: -100 to +100 (default 0), proportional scaling with instant reset button.
    - **Contrast**: -100 to +100 (default 0), anchored at mid-gray 128 pivot.
    - **Saturation**: -100 to +100 (default 0), -100 for full desaturation, +100 for color boost.
    - **Sharpness**: 0 to 100 (default 0), unsharp mask convolution with noise coring threshold ($\tau = 2$) preventing text haloing or QR code module bridging.
  - Quick toggle buttons:
    - **Grayscale**: ITU-R BT.709 luminance conversion ($0.2126R + 0.7152G + 0.0722B$) for photocopies and black-and-white printouts.
    - **Invert Colors**: Exact RGB inversion ($255 - X$) for inverted scans or negative films.
  - **Reset Enhancements** button:
    - Resets only the currently selected side back to default (0 values, toggles OFF), keeping the other side intact.
- [x] **High-Performance Canvas Enhancement Engine (`src/lib/document/document-enhancer.ts`):**
  - 100% in-browser, client-side pixel manipulation on OffscreenCanvas and Canvas buffers.
  - Always processes from the original clean cropped buffer, never repeatedly processing an already-enhanced image.
  - Ultra-fast execution (~24ms on full 1011 × 638 px ISO CR80 card).
  - Pure pixel math engine compatible with both Node.js automated test runner and modern browser contexts.
- [x] **Real-Time Preview & Comparison UX (`src/components/document-studio/DocumentSideWorkspace.tsx`):**
  - Immediate visual feedback on slider changes with 35ms debounced Canvas rendering and zero-lag toggles.
  - "Before / After" preview toggle button allowing instantaneous flick comparison between unenhanced original and enhanced crop.
  - Dynamic status overlays: `[Enhanced (After)]` vs `[Before (Original)]`.
  - Lightbox modal displays the active enhanced image for enlarged inspection.
  - "Save CR80" export generates the exact enhanced image seen in the preview.
- [x] **Automated Test Suite (`tests/document-enhancement.test.mjs`):**
  - 27 comprehensive tests across 10 suites covering brightness, contrast, saturation, grayscale, invert, QR/text-safe sharpness, front/back state independence, non-destructive reversibility, and execution performance budgets.
  - **483 total tests passing** with 0 failures across all 18 test suites.

---

## 📌 Phase 08D — Print Quality & Document Dimensions in Document Studio

**Status:** Completed  
**Target Route:** `/tools/document-studio`

- [x] **Collapsible Print Settings Panel (`src/components/document-studio/DocumentPrintSettingsPanel.tsx`):**
  - Print quality presets: Standard (150 DPI), High (300 DPI, default), Maximum (600 DPI), and Custom DPI (72–1200 DPI bounds with real-time validation).
  - Standard physical dimension presets: Aadhaar (85.6 × 53.98 mm), PAN (85.6 × 53.98 mm), Voter ID (85.6 × 53.98 mm), Original Size, and Custom dimensions.
  - Measurement unit switching: Millimeters (mm), Inches (in), and Pixels (px) with automatic unit conversions.
  - Proportional aspect ratio lock maintaining physical shape on width or height changes.
  - Resolution sufficiency diagnostics warning when source image lacks sufficient physical pixel density for chosen DPI without artificial upscaling.
  - Front and Back independent print settings with optional side synchronisation.
- [x] **Automated Test Suite (`tests/document-dimensions.test.mjs`):**
  - 42 comprehensive tests across 10 suites covering presets, conversions, DPI bounds, aspect ratio locking, sufficiency diagnostics, and side persistence.
  - **525 total tests passing** with 0 failures across all 19 test suites.

---

## 📌 Phase 08E / Phase 3 — Print Studio and Print Mode Selection

**Status:** Completed  
**Target Route:** `/tools/document-studio`

- [x] **Dedicated Print Studio Section (`src/components/document-studio/DocumentPrintStudio.tsx`):**
  - Interactive Print Studio panel embedded into Document Studio with collapsible controls and dedicated Top Control Bar navigation shortcut.
  - Clearly visible Print Mode selector with 3 dedicated options:
    1. **Front Side Only (`front-only`)**: Previews solely the front document; hides back side; preserves original crop, enhancements, and aspect ratio.
    2. **Back Side Only (`back-only`)**: Previews solely the back document; hides front side; preserves original crop, enhancements, and aspect ratio.
    3. **Front + Back Combined (`combined`)**: Previews both front and back sides simultaneously.
  - Arrangement selection for Combined mode:
    - **Vertical Arrangement**: Stacked layout (Front on top, Back on bottom) with clear visual flow divider.
    - **Horizontal Arrangement**: Side-by-side layout (Front on left, Back on right) with responsive spacing.
- [x] **Large Readable Print Studio Preview Canvas:**
  - Neutral canvas stage distinguishing the arrangement preview from the editing workspace without paper/margin confusion.
  - Pre-print arrangement guidance banner clarifying that paper sizes (A4/Letter), margins, and orientation belong to the upcoming Print Layout phase.
  - Document cards with strict CSS aspect ratio preservation (`style={{ aspectRatio }}`), preventing distortion, stretching, or cropping.
  - Prominent "Front Side" and "Back Side" badges (`F` and `B` indicators) and metadata chips (dimensions, DPI, enhancement status).
  - Informative empty states with helpful guidance when front or back documents are missing, uncropped, or for single-sided documents (like PAN card).
- [x] **Reactive State Engine (`src/lib/document/document-print-studio.ts` & `src/hooks/useDocumentStudio.ts`):**
  - Pure layout resolution engine (`resolvePrintStudioLayout`, `resolveActiveSideImage`, `calculateRelativeDisplayScale`).
  - Immediate visual updates on mode or arrangement changes without duplicate image processing.
  - Independent enhancement reflection (Front and Back enhancements remain strictly decoupled).
  - Relative display scale calculation preserving exact physical proportions between sides.
  - 100% in-browser, client-side, zero-upload privacy guarantee.
- [x] **Automated Test Suite (`tests/document-print-studio.test.mjs`):**
  - 34 comprehensive tests across 9 suites testing Front Side Only, Back Side Only, Front + Back Combined, Vertical/Horizontal arrangements, missing document empty states, enhancement reflection, dimension preservation, and non-regression of existing features.
  - **559 total tests passing** with 0 failures across all 20 test suites.

---

## 📌 Phase 08F / Phase 4 — Print Layout Settings

**Status:** Completed  
**Target Route:** `/tools/document-studio`

- [x] **Paper Size Selection & Custom Dimensions (`src/components/document-studio/DocumentPrintStudio.tsx`):**
  - Standard paper size options: **A4** (210 × 297 mm), **A5** (148 × 210 mm), **Letter** (8.5 × 11.0 in / 215.9 × 279.4 mm), and **Custom**.
  - Custom paper dimensions editor with Width, Height, and Unit selector (`mm` or `inches`) with automatic unit conversion and validation.
- [x] **Orientation Controls (`Portrait` vs `Landscape`):**
  - Portrait (page height >= width) and Landscape (page width >= height) options.
  - Immediate dynamic recalculation of paper width, height, aspect ratio, and layout positions on orientation changes.
- [x] **Margins Configuration & Strict Sanitization:**
  - Presets: **No Margins** (0 mm), **Small Margins** (5 mm), **Normal Margins** (12.7 mm / 0.5 in), and **Custom Margins**.
  - Independent configuration of Top, Bottom, Left, and Right margins in millimeters.
  - Strict validation preventing negative margins, non-numeric values, or margins exceeding paper boundaries (maintaining >= 10 mm printable area).
- [x] **Document Alignment Controls:**
  - Presets: **Center** (horizontally and vertically centered in printable area), **Top** (aligned to top margin, horizontally centered), and **Custom Position**.
  - Custom Position controls: independent Horizontal offset X (mm) and Vertical offset Y (mm) adjustments.
- [x] **Document Scaling with Aspect Ratio Preservation:**
  - Options: **Actual Size (100%)** (1:1 physical CR80 dimensions), **Fit to Page** (dynamically scales to fill printable area without overflowing), and **Custom Percentage** (10% to 500%).
  - Strict aspect ratio preservation mathematically guaranteed (`cardScaledW / cardScaledH = originalAspect`) to eliminate any distortion or stretching.
- [x] **Copies Setting:**
  - Minimum: 1, Maximum: 20, Default: 1.
  - Interactive stepper buttons (`-` and `+`) with direct integer input validation and safe clamping.
- [x] **Realistic Paper Sheet Layout Preview Canvas:**
  - Visual paper-like canvas displaying accurate aspect ratio, paper drop-shadow, and responsive scaling.
  - Visible margin guide box (dashed blue boundary) identifying the printable zone.
  - Precise document positioning and scaling in physical percentage coordinates (`xPercent`, `yPercent`, `widthPercent`, `heightPercent`).
  - Strict preservation of Phase 3 modes (Front Only, Back Only, Combined with Vertical/Horizontal arrangements).
  - Informative empty states for missing sides and visual overflow warnings if documents exceed paper boundaries.
  - Dual-view toggle: **Paper Sheet View** (default) vs **Card Details View** (Phase 3 inspection).
- [x] **Automated Test Suite (`tests/document-print-layout.test.mjs`):**
  - 45 comprehensive unit and integration tests across 8 suites verifying all paper sizes, orientation swapping, margin presets and clamping, alignment options, scaling, copies validation, coordinate math, overflow detection, and integration with existing enhancements and dimensions.
  - **604 total tests passing** with 0 failures across all 21 test suites.

---

## 📌 Phase 08G / Phase 5 — Actual Printing and Print-Ready PDF Generation ✅ [COMPLETED]

**Status:** Completed  
**Target Route:** `/tools/document-studio`

- [x] **Browser Native Print Document Action (`src/lib/document/document-print-pdf.ts` & `src/components/document-studio/DocumentPrintStudio.tsx`):**
  - High-resolution canvas rendering engine (`renderMasterDocumentCanvas`) composing documents onto paper sheets with exact millimeter-to-pixel coordinate projection.
  - Dedicated `#printable-sheet-container` in DOM with `@media print` isolation: prints solely the document sheet and hides all application UI, headers, sidebars, controls, and buttons.
  - Dynamic CSS `@page { size: ...; margin: 0; }` style element injection for A4, A5, Letter, and Custom dimensions in Portrait and Landscape orientations.
  - Opens browser native print dialog (`window.print()`) with automatic cleanup.
  - Strict document aspect ratio preservation preventing stretching, distortion, or clipping.
  - Applies independent front and back enhancement settings (brightness, contrast, sharpness, grayscale, binarization, auto-levels) to physical print output.
  - Respects selected document dimensions (CR80 ID card or custom) and selected print DPI (150, 300, 600, or custom).
- [x] **Print Modes & Arrangements:**
  - **Front Side Only (`front-only`)**: Renders only the front side with front enhancements and dimensions.
  - **Back Side Only (`back-only`)**: Renders only the back side with back enhancements and dimensions.
  - **Front + Back Combined (`combined`)**:
    - **Vertical Arrangement**: Stacks Front and Back cards with calibrated inter-card spacing.
    - **Horizontal Arrangement**: Places Front and Back cards side-by-side with calibrated inter-card spacing.
- [x] **Copies Behavior & Native Browser Limitation Handling:**
  - PDF Generation: Multi-page generation producing $N$ identical vector-calibrated pages reflecting the copies setting (1–20).
  - Native Print: Prominent disclaimer in UI and modal explaining modern browser security limitation (web applications cannot programmatically override printer copy counts), guiding users to verify copies in the native print dialog.
- [x] **Print-Ready PDF Generation (`generatePrintReadyPdf`):**
  - Vector-calibrated page sizing with `pdf-lib` ($1\text{ mm} = 72 / 25.4\text{ pt}$).
  - Embeds high-fidelity JPEG raster image without lossy re-encoding or artificial downsampling.
  - Supports all paper sizes (A4, A5, Letter, Custom) and orientations (Portrait, Landscape).
  - Embeds document metadata (Title, Subject, Creator, Producer).
  - Semantic filename generation (`generatePrintFileName`) such as `document-studio-aadhaar-a4-portrait-300dpi.pdf`.
  - 100% client-side execution with tracked object URL deallocation (`createTrackedObjectURL` & `revokeObjectUrlSafely`).
- [x] **Print Preview Modal (`src/components/document-studio/DocumentPrintPreviewModal.tsx`):**
  - High-fidelity modal displaying large paper sheet preview with margin boundaries and document placement.
  - Physical dimension chips: Millimeters (mm), Inches (in), PDF Points (pt), Target DPI, and Copies.
  - Integrated action buttons to launch browser native print or download print-ready PDF.
- [x] **Source Resolution Adequacy Diagnostics (`checkSourceResolutionAdequacy`):**
  - Computes effective DPI based on source cropped pixels and target physical dimensions.
  - Alerts user with actionable warnings when effective DPI < 75% of target DPI, preventing unexpectedly blurry physical prints without artificially upscaling pixels.
- [x] **Error Handling & Feedback Banners:**
  - Validates missing front/back documents per mode, invalid paper dimensions, and invalid DPI.
  - Displays user-friendly error and success banners with dismiss actions.
- [x] **Automated Test Suite (`tests/document-print-execution.test.mjs`):**
  - 30 tests covering readiness validation, resolution checks, points conversion, CSS `@page` generation, filename generation, `pdf-lib` PDF generation with copies, aspect ratio preservation, and error handling.
  - **634 total tests passing** with 0 failures across all 22 test suites.
