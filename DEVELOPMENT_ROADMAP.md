# Browser Utility Studio — Development Roadmap

This multi-phase roadmap outlines the step-by-step engineering progression for Browser Utility Studio.

---

## 📌 Phase 00 — Architecture, Project Initialization & Foundation ✅ [CURRENT PHASE COMPLETED]

- [x] Initial workspace inspection and clean configuration setup.
- [x] Next.js 14 App Router, TypeScript 5, and Tailwind CSS initialized.
- [x] Strict client-side privacy architecture and memory deallocation protocols established.
- [x] Contract interfaces defined for Image, PDF, Card Cropping, and Browser AI subsystems.
- [x] Clean directory structure separating presentation, hooks, processing logic, and Web Workers.
- [x] Application foundation: Header, Footer, Privacy Badge, and Responsive Shell.
- [x] Tool catalog and metadata definition for all 8 target modules.
- [x] Placeholder routes created for all 8 modules with ModuleLayout wrapper.
- [x] Interactive FileDropzone upload component with file validation and ephemeral preview.
- [x] Shared error boundary (`error.tsx`), 404 handler (`not-found.tsx`), and notification toast banner.
- [x] Complete documentation: `README.md`, `ARCHITECTURE.md`, `PRIVACY.md`, `DEVELOPMENT_ROADMAP.md`.
- [x] 100% clean Next.js production build (`next build`) and zero ESLint errors (`next lint`).

---

## 📌 Phase 01 — Document & Card Cropping Suite (PAN, Aadhaar, Ration Card)

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

## 📌 Phase 02 — Professional Photo Studio & Multiple Photo Maker

**Target Modules:** Professional Photo Studio, Multiple Photo Maker

- [ ] **Passport & Visa Photo Presets:**
  - Presets for Indian Passport (35 × 45 mm), US Visa (2 × 2 in), Schengen Visa, Stamp Size.
  - Face alignment guides and chin/crown boundary overlays.
  - Custom border widths, background color replacement (white, light blue, grey).
  - Name and date of photo (DOP) text imprint generator.
- [ ] **Multiple Photo Print Sheet Engine:**
  - Paper sizes: A4, 4 × 6 inch (10 × 15 cm), 5 × 7 inch.
  - Configurable photo grid density, margins, and cutting line markers.
  - High-resolution (300 / 600 DPI) PDF export for commercial photo printers.

---

## 📌 Phase 03 — Client-Side AI Background Remover

**Target Module:** Background Remover

- [ ] **In-Browser Model Deployment:**
  - Integration of lightweight quantized neural network weights (e.g. RMBG-1.4 or BiRefNet).
  - Execution runtime via Transformers.js / ONNX Runtime Web.
  - Hardware acceleration support: WebGPU with graceful WebGL/WASM fallback.
- [ ] **Mask Refinement & Edge Smoothing:**
  - Client-side alpha matting for hair and fine boundary details.
  - Instant background replacement: Solid studio backdrop or custom scene.

---

## 📌 Phase 04 — Advanced Photo Editor

**Target Module:** Advanced Photo Editor

- [ ] **Full Non-Destructive Canvas Editor:**
  - Interactive adjustments: Brightness, contrast, exposure, saturation, temperature.
  - Freeform and fixed aspect ratio cropping.
  - Sharpness enhancement matrix and noise reduction.
- [ ] **Target Size File Compressor:**
  - Binary search JPEG/WebP compression to achieve exact file size constraints (e.g., &lt; 50 KB, &lt; 100 KB for government forms).

---

## 📌 Phase 05 — Resume / CV Maker

**Target Module:** Resume / CV Maker

- [ ] **Structured Resume Builder:**
  - Reactive form sections: Contact, Experience, Education, Skills, Projects.
  - Live split-screen side-by-side preview.
  - ATS-friendly modern typography and structural formatting.
- [ ] **Direct Vector PDF Rendering:**
  - Vector text rendering via `pdf-lib` (selectable text, clickable links, perfect printing).

---

## 📌 Phase 06 — Offline PWA & Enterprise Hardening

- [ ] Service Worker configuration for 100% offline usage.
- [ ] Progressive Web App (PWA) manifest for desktop installability.
- [ ] End-to-end automated testing suite with Playwright.
- [ ] Comprehensive performance profiling and canvas memory benchmark reports.
