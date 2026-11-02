# Shared Browser Image Processing Engine — Technical Specification

## 1. Overview & Architecture

The **Shared Browser Image Processing Engine** is an isolated, zero-upload client-side pipeline engineered for high-performance pixel operations, resizing, cropping, rotation, multi-format export, and interactive preview rendering.

It runs **100% inside client browser memory** utilizing native web APIs:
- `createImageBitmap()` with EXIF `from-image` orientation correction.
- `OffscreenCanvas` & multi-threaded Web Workers for background computation.
- Mathematical coordinate matrix transforms (bicubic high-quality interpolation).
- Ephemeral Blob synthesis and deterministic memory deallocation.

```
+-----------------------------------------------------------------------------------------+
|                                    USER BROWSER RUNTIME                                 |
|                                                                                         |
|  [User File]                                                                            |
|       |                                                                                 |
|       v                                                                                 |
|  +------------------------+                                                             |
|  | Image Validator        | --> Checks MIME, extension, size, magic bytes, duplicates   |
|  +------------------------+                                                             |
|       |                                                                                 |
|       v                                                                                 |
|  +------------------------+                                                             |
|  | Native Decoder         | --> createImageBitmap({ imageOrientation: 'from-image' })   |
|  +------------------------+                                                             |
|       |                                                                                 |
|       +-----------------------------------+                                             |
|       |                                   |                                             |
|       v                                   v                                             |
|  +---------------------------+       +---------------------------------------------+    |
|  | Interactive Preview View  |       | Background Processing Web Worker            |    |
|  | - Zoom (10%-500%) & Pan   |       | - OffscreenCanvas Matrix Transformations    |    |
|  | - Dimension HUD Overlay   |       | - Crop / Rotate / Flip / Resize Pipeline    |    |
|  +---------------------------+       +---------------------------------------------+    |
|                                                   |                                     |
|                                                   v                                     |
|                                      +---------------------------------------------+    |
|                                      | Image Exporter                              |    |
|                                      | - PNG / JPEG (with background fill) / WebP  |    |
|                                      | - Ephemeral Blob & Direct Disk Download     |    |
|                                      +---------------------------------------------+    |
|                                                   |                                     |
|                                                   v                                     |
|                                      +---------------------------------------------+    |
|                                      | Deterministic Memory Deallocation           |    |
|                                      | - ImageBitmap.close()                       |    |
|                                      | - URL.revokeObjectURL()                     |    |
|                                      | - Canvas buffer width/height zeroing        |    |
|                                      +---------------------------------------------+    |
+-----------------------------------------------------------------------------------------+
                                 X (ZERO SERVER NETWORK TRAFFIC)
```

---

## 2. Supported Image Formats & Specifications

| Format | MIME Type | Magic Byte Signature | Alpha / Transparency | Optimal Use Case |
|---|---|---|---|---|
| **JPEG / JPG** | `image/jpeg` | `0xFF 0xD8 0xFF` | No (Flattened onto custom background) | Photographs, ID documents, government forms |
| **PNG** | `image/png` | `0x89 0x50 0x4E 0x47` | Yes (8-bit alpha channel) | Cutouts, transparent graphics, card crops |
| **WebP** | `image/webp` | `RIFF....WEBP` | Yes (Lossy & Lossless alpha) | Modern compact web exports |

---

## 3. Core Engine Subsystems

### 3.1. Image Input & Multi-Layer Validation (`src/lib/image/validator.ts`)
Validates incoming file buffers in strict sequential order:
1. **Size Boundary:** Validates that file does not exceed configurable limits (default 25 MB).
2. **Extension Check:** Validates lower-case extensions (`.jpg`, `.jpeg`, `.png`, `.webp`).
3. **MIME Verification:** Enforces browser-reported MIME types.
4. **Header Magic Bytes:** Reads first 16 bytes via `ArrayBuffer` slice to verify official format signatures, blocking spoofed or renamed executables.
5. **Deduplication Check:** Computes composite signature (`name-size-lastModified-byteHash`) to prevent redundant memory allocation.
6. **Integrity Decoding:** Test-decodes using `createImageBitmap()` to detect truncated or corrupted image payloads.

### 3.2. Native Image Decoding Engine (`src/lib/image/decoder.ts`)
- **Primary Engine:** Uses `createImageBitmap(blob, { imageOrientation: "from-image" })`. This decodes images off the DOM and respects embedded EXIF camera orientation tags (preventing rotated smartphone portraits).
- **Fallback Engine:** Gracefully falls back to offscreen `HTMLImageElement` via ephemeral Object URLs if `createImageBitmap` is unavailable or fails.
- **Safety Clamping:** Rejects images exceeding `MAX_SAFE_CANVAS_DIMENSION` (16,384 px) to protect against GPU texture allocation tab crashes.
- **Resource Management:** Returns a `DecodedImageSource` containing an explicit `close()` cleanup handle.

### 3.3. Core Transformation Pipeline (`src/lib/image/transform.ts`)
Pure mathematical and canvas transformation functions:
- **`computeResizeDimensions(sourceW, sourceH, options)`**:
  Calculates target width and height. Supports aspect ratio locking (box fitting or proportional dimension calculation).
- **`validateAndClampCrop(sourceW, sourceH, cropRegion)`**:
  Clamps bounding boxes strictly within source boundaries, preventing coordinate underflows and out-of-bounds artifact clipping. Supports aspect ratio constraints (e.g. `1.0` for 1:1 square, `0.7778` for 35×45mm passport).
- **`computeRotatedBounds(w, h, angleDegrees)`**:
  Calculates new bounding box coordinates for right-angle rotations (90°, 180°, 270°) and arbitrary angles using $|w\cos\theta| + |h\sin\theta|$.
- **`transformImage(source, pipeline)`**:
  Applies Crop $\to$ Rotate $\to$ Flip $\to$ Resize in a single coordinated canvas draw call, preserving image sharpness with high-quality bicubic interpolation (`imageSmoothingQuality = "high"`).

### 3.4. Background Web Worker Client (`src/workers/image-engine.worker.ts` & `src/lib/image/worker-client.ts`)
- Offloads heavy image transforms and canvas conversions to background threads.
- Uses `OffscreenCanvas` inside worker threads when available.
- Transfers `ImageBitmap` directly without cloning or copying memory buffers.
- Supports typed progress callbacks (`preparing`, `transforming`, `encoding`, `completed`).
- Supports explicit job cancellation via `cancelJob(jobId)`.
- **Graceful Fallback:** If `Worker` or `OffscreenCanvas` is not supported in the user's browser, the client seamlessly executes on the main thread with identical API contracts.

### 3.5. Image Exporter (`src/lib/image/exporter.ts`)
- **Lossy Quality:** Configurable quality setting ($0.01$ to $1.0$, default $0.92$).
- **Transparency Flattening:** When exporting transparent images to JPEG (which lacks an alpha channel), automatically paints a solid background color (default `#ffffff` or user-chosen backdrop) to prevent black border artifacts.
- **Semantic File Naming:** Generates sanitized filenames with timestamps: `processed-[name]-[timestamp].[ext]`.
- **Ephemeral Download:** Triggers browser file save via tracked object URLs that are safely revoked immediately after download initiation.

### 3.6. Interactive Image Preview Component (`src/components/image-engine/ImagePreview.tsx`)
- Viewport fit-to-container with aspect ratio lock.
- Interactive Zoom In (+25%), Zoom Out (-25%), 100% Actual Pixels, and Fit to Screen.
- Interactive click-and-drag Pan when zoomed.
- Floating HUD displaying original dimensions, aspect ratio, and zoom level.
- **Decoupled Resolution:** Preview zoom scales the presentation layer only. Master export operations always use full-fidelity source pixels.

---

## 4. API Reference

### `validateImageFile(file, options)`
```ts
const result = await validateImageFile(file, {
  maxSizeMB: 25,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
});
if (!result.isValid) {
  console.error(result.error); // e.g. "File size exceeds limit of 25 MB"
}
```

### `decodeImage(blob, options)`
```ts
const decoded = await decodeImage(file);
console.log(`Image dimensions: ${decoded.width}x${decoded.height}`);
// Do operations...
decoded.close(); // Clean up ImageBitmap
```

### `transformImage(source, pipeline)`
```ts
const canvas = transformImage(decoded.source, {
  crop: { x: 100, y: 100, width: 800, height: 800 },
  rotate: { angle: 90 },
  flip: { horizontal: false, vertical: false },
  resize: { width: 400, height: 400, maintainAspectRatio: true },
  backgroundColor: "#ffffff",
});
```

### `exportImage(canvas, options, originalFileName)`
```ts
const exportRes = await exportImage(canvas, {
  format: "image/jpeg",
  quality: 0.9,
  backgroundColor: "#ffffff",
});
downloadImageBlob(exportRes.blob, exportRes.fileName);
```

### React Hook: `useImageEngine()`
```tsx
const {
  currentFile,
  dimensions,
  previewCanvas,
  isProcessing,
  loadImage,
  updateCrop,
  updateRotate,
  updateResize,
  applyTransforms,
  downloadResult,
  clear,
} = useImageEngine();
```

---

## 5. Memory Management & Ephemeral Lifecycle Rules

1. **Deterministic Object URL Revocation:** Every `URL.createObjectURL()` is registered with `createTrackedObjectURL()` and revoked via `revokeObjectUrlSafely()`.
2. **Explicit Bitmap Disposal:** Every `ImageBitmap` must be closed via `bitmap.close()` when no longer needed or on component unmount.
3. **Canvas Deallocation:** Finished or unmounted canvas contexts are cleared with `releaseCanvasBuffer(canvas)`, resetting width and height to 0 to signal immediate GC reclamation.
4. **No Base64 Payloads:** High-resolution images are transferred as `ImageBitmap` or `Blob` pointers, never converted into multi-megabyte base64 strings.
5. **No Local Persistence:** Neither `localStorage` nor `IndexedDB` is used to cache user document or photo blobs.

---

## 6. Browser Compatibility

| Feature | Chrome / Edge | Safari | Firefox | Mobile Chrome / Safari | Fallback Mechanism |
|---|---|---|---|---|---|
| `createImageBitmap` | 54+ | 15+ | 42+ | Full Support | Offscreen `HTMLImageElement` |
| `OffscreenCanvas` in Worker | 69+ | 16.4+ | 105+ | Full Support | Main-thread canvas execution |
| EXIF `from-image` orientation | 79+ | 15+ | 93+ | Full Support | Standard canvas orientation |
| WebP Encoding | Full | 14+ | 65+ | Full Support | PNG fallback if unsupported |
| Canvas `toBlob` | Full | Full | Full | Full Support | Canvas buffer extraction |

---

## 8. Physical Photo Size & DPI Calculation Subsystem (Phase 03B)

The **DPI & Physical Photo Size Calculator** (`src/lib/photo-studio/dpi-calculator.ts`) provides mathematical millimeter-to-pixel projection, bi-directional aspect-ratio locking, effective available DPI evaluation, and optical print resolution grading.

### 8.1. Mathematical Formulation & Constants

- **International Inch Standard:** $1\text{ inch} = 25.4\text{ mm}$ (exact, agreed internationally in 1959).
- **Millimeter to Pixel Conversion:**
  $$\text{pixels} = \left(\frac{\text{millimeters}}{25.4}\right) \times \text{DPI}$$
- **Pixel to Millimeter Conversion:**
  $$\text{millimeters} = \left(\frac{\text{pixels}}{\text{DPI}}\right) \times 25.4$$
- **Rounding Strategy:**
  All physical millimeter calculations default to **nearest whole pixel** via `Math.round()`.
  The engine also supports deterministic `"floor"` or `"ceil"` for bounding box alignment.

#### Benchmark Verification Examples

| Physical Size | DPI Preset | Mathematical Raw Output | Default Rounding (`Math.round`) | Total Pixels |
|---|---|---|---|---|
| **35 × 45 mm** (Passport) | 300 DPI | $413.386 \times 531.496\text{ px}$ | **413 × 531 px** | 0.22 MP |
| **35 × 45 mm** (Passport) | 600 DPI | $826.772 \times 1062.992\text{ px}$ | **827 × 1063 px** | 0.88 MP |
| **40 × 50 mm** (Standard) | 300 DPI | $472.441 \times 590.551\text{ px}$ | **472 × 591 px** | 0.28 MP |
| **50.8 × 50.8 mm** (2×2 in US Visa) | 300 DPI | $600.000 \times 600.000\text{ px}$ | **600 × 600 px** | 0.36 MP |
| **25 × 35 mm** (Indian PAN photo) | 300 DPI | $295.276 \times 413.386\text{ px}$ | **295 × 413 px** | 0.12 MP |

### 8.2. Bi-Directional Aspect Ratio Mathematics

- Aspect Ratio is defined as: $R = \frac{\text{width}}{\text{height}}$.
- When **Maintain Aspect Ratio** is locked:
  - **Width-driven recalculation:** $\text{height}_{\text{mm}} = \text{round}\left(\frac{\text{width}_{\text{mm}}}{R}, 2\right)$
  - **Height-driven recalculation:** $\text{width}_{\text{mm}} = \text{round}\left(\text{height}_{\text{mm}} \times R, 2\right)$
- When unlocked, width and height vary independently.

### 8.3. Effective Available DPI & Optical Analysis

When an image is loaded, its physical reproduction density depends on its intrinsic pixel dimensions ($W_{\text{src}} \times H_{\text{src}}$) and the requested print dimensions ($W_{\text{mm}} \times H_{\text{mm}}$):

$$\text{DPI}_W = \text{round}\left(\frac{W_{\text{src}} \times 25.4}{W_{\text{mm}}}\right)$$
$$\text{DPI}_H = \text{round}\left(\frac{H_{\text{src}} \times 25.4}{H_{\text{mm}}}\right)$$
$$\text{Effective DPI} = \min(\text{DPI}_W, \text{DPI}_H)$$

The limiting axis identifies whether width or height constraints govern the print resolution.

### 8.4. Resolution Quality Assessment Tiers

1. **Tier A — Sufficient Resolution (Emerald Badge):**
   - Condition: $W_{\text{src}} \ge W_{\text{required}}$ and $H_{\text{src}} \ge H_{\text{required}}$ ($\text{scaleFactor} \le 1.0$).
   - Verdict: The source photo has adequate optical detail to print crisply at the requested DPI without digital interpolation.
2. **Tier B — Upscaling Required (Amber Badge):**
   - Condition: $1.0 < \text{scaleFactor} \le 1.5$.
   - Verdict: The source image is slightly below the target print dimensions. Software interpolation will enlarge pixels; moderate detail loss may be visible upon close inspection.
3. **Tier C — Significant Upscaling (Rose Badge):**
   - Condition: $\text{scaleFactor} > 1.5$ (source resolution is less than 67% of requirement).
   - Verdict: Required print dimensions substantially exceed source pixels. The printed photo will likely suffer from noticeable softness, blurriness, or pixelation.
4. **Aspect Ratio Mismatch Alert:**
   - Condition: $|\text{ratio}_{\text{src}} - \text{ratio}_{\text{target}}| / \text{ratio}_{\text{target}} > 1.5\%$.
   - Verdict: Warns the user that direct non-uniform stretching would distort facial proportions; cropping or framing will be required.
5. **Physical Resolution Invariant:**
   - Digital upscaling and bicubic interpolation mathematically synthesize pixel grids, but cannot recover or reconstruct true optical detail from low-resolution sensors.

### 8.5. Validation Boundaries & Thresholds

- **Physical Dimensions:** Must be finite numbers $> 0$, with minimum $1\text{ mm}$ and safety cap $1000\text{ mm}$ (1 meter).
- **DPI Values:** Must be positive numbers, minimum $30\text{ DPI}$, maximum $2400\text{ DPI}$ (preventing memory exhaustion).
- **Zero & Negative Protection:** All zero, negative, NaN, and Infinity inputs are strictly rejected with typed field error messages.

---

## 9. Passport Photo Presets & Interactive Crop Editor Subsystem (Phase 03C)

The **Passport Photo Presets & Interactive Crop Editor** (`src/lib/crop/crop-geometry.ts` and `src/lib/crop/unit-converter.ts`) provides an isolated, pure mathematical coordinate transformation engine, multi-unit conversions, 8-handle directional boundary resizing, aspect-ratio constraint snapping, studio background composition, and real-time canvas crop rendering.

### 9.1. Photo Size Preset Schema

Photo presets are strictly decoupled from UI presentation components (`src/types/crop-preset.ts` and `src/constants/crop-presets.ts`):

```ts
export type DimensionUnit = "mm" | "cm" | "inch";

export interface PhotoPreset {
  readonly id: string;
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly unit: DimensionUnit;
  readonly aspectRatio: number; // width / height
  readonly description: string;
  readonly category?: PresetCategory;
  readonly isOfficial: boolean;
  readonly officialSource?: string;
  readonly countryOrStandard?: string;
}
```

#### Initial Standard Presets

1. **Passport-style photo (35 × 45 mm):** Aspect ratio $35 / 45 \approx 0.7778$ (7:9). International standard proportion.
2. **Portrait photo (40 × 50 mm):** Aspect ratio $40 / 50 = 0.8$ (4:5). Standard civil ID and administrative form size.
3. **Square photo (2 × 2 inches):** $50.8 \times 50.8\text{ mm}$. Aspect ratio $1.0$ (1:1). Standard format for US Visa / Passport / OCI.
4. **Custom dimensions:** User-specified width, height, and unit (mm, cm, inch) with live aspect-ratio calculation.

> [!IMPORTANT]
> **Advisory Disclaimer Invariant:** Preset definitions and UI components never claim to satisfy every country's official passport or visa requirements. Requirements vary widely by consulate; presets are only marked official (`isOfficial: true`) when verified against an authoritative government standard.

### 9.2. Unit Conversions & Decimal Precision Mathematics

Physical dimensions support three international units (`mm`, `cm`, `inch`) with exact mathematical conversion constants:

- $1\text{ inch} = 25.4\text{ mm}$ (exact, 1959 international yard and pound agreement).
- $1\text{ cm} = 10\text{ mm}$ (exact).
- $1\text{ inch} = 2.54\text{ cm}$ (exact).

$$\text{value}_{\text{mm}} = \begin{cases} \text{value} & \text{if unit is mm} \\ \text{value} \times 10 & \text{if unit is cm} \\ \text{value} \times 25.4 & \text{if unit is inch} \end{cases}$$

$$\text{value}_{\text{target}} = \begin{cases} \text{value}_{\text{mm}} & \text{if target is mm} \\ \text{value}_{\text{mm}} / 10 & \text{if target is cm} \\ \text{value}_{\text{mm}} / 25.4 & \text{if target is inch} \end{cases}$$

Validation enforces positive finite numbers within $1\text{ mm} \le \text{dimension}_{\text{mm}} \le 1000\text{ mm}$ with full floating-point decimal support (e.g. $50.8\text{ mm}$, $2.0\text{ in}$, $3.5\text{ cm}$).

### 9.3. Intrinsic Crop Coordinate System & Viewport Projection

To maintain maximum print fidelity and resolution decoupling, crop coordinates are **always stored in intrinsic source image pixels**:

$$C = \{ x, y, \text{width}, \text{height} \} \quad \text{where } 0 \le x \le W_{\text{src}} - \text{width}, \; 0 \le y \le H_{\text{src}} - \text{height}$$

When rendered in the interactive workspace viewport, screen coordinates are projected via display scale and pan offset:

$$\text{scale} = \text{fitScale} \times \text{zoom}$$
$$\text{screenX} = \text{originX} + x \times \text{scale}$$
$$\text{screenY} = \text{originY} + y \times \text{scale}$$
$$\text{screenWidth} = \text{width} \times \text{scale}$$
$$\text{screenHeight} = \text{height} \times \text{scale}$$

Interactive pointer deltas $(\Delta X_{\text{screen}}, \Delta Y_{\text{screen}})$ map inversely to intrinsic source pixels:

$$\Delta X_{\text{source}} = \frac{\Delta X_{\text{screen}}}{\text{scale}}, \quad \Delta Y_{\text{source}} = \frac{\Delta Y_{\text{screen}}}{\text{scale}}$$

### 9.4. Image Transformation & Positioning Behavior

- **Non-Destructive Invariant:** The master source image buffer and original dimensions remain untouched in browser RAM.
- **Preset Switching Adaptation (`recalculateCropForAspectRatio`):** When the user selects a new preset, the crop box adapts its aspect ratio around the current crop center $(c_x, c_y)$ without resetting or reloading the uploaded image.
- **8-Directional Resizing (`resizeCropFromHandle`):**
  - **Corner Handles (NW, NE, SE, SW):** Anchor against the diagonally opposite corner, projecting candidate deltas onto the aspect ratio line $W = H \times R$.
  - **Edge Handles (N, S, E, W):** Symmetrically expand/contract perpendicular dimensions around the center axis when aspect ratio is locked.
- **Boundary Clamping (`clampCropToBounds`):** Prevents negative coordinates, zero dimensions, NaNs, and out-of-bounds overflows, enforcing a minimum crop threshold of $24\text{ px}$.
- **Framing Controls:**
  - `centerCropInImage`: Shifts crop frame to $([W_{\text{src}} - W_{\text{crop}}]/2, [H_{\text{src}} - H_{\text{crop}}]/2)$.
  - `fitCropToImage`: Maximizes crop frame area within image bounds while preserving aspect ratio.
  - `CropMode` toggle: Seamlessly switches between Fixed Aspect Ratio (locked) and Free Crop (unlocked).

### 9.5. Studio Background Composition & Transparency

- Supported options: **Transparent** (alpha preservation), **Studio White** (`#FFFFFF`), **Light Blue** (`#D0E8FF`), **Light Grey** (`#F3F4F6`), and **Custom Hex Color**.
- When rendering crop composition:
  - If `backgroundColor === "transparent"`, canvas buffer clears and native PNG/WebP alpha transparency is preserved with a checkerboard preview.
  - If a solid color is selected, the color is painted underneath transparent pixels.
- **Scope Distinction:** Studio background color applies behind transparent pixels or letterbox padding only. It does not perform automatic subject segmentation or remove existing solid photograph backgrounds (which belongs to the upcoming Phase 04 AI Background Remover).

### 9.6. Known Limitations

1. **Facial Biometric Anchoring:** The crop editor provides visual rule-of-thirds grid lines, but does not yet perform automatic facial landmark detection (chin-to-crown distance calculation). The user positions the crop frame manually.
2. **GPU Texture Memory Bounds:** In accordance with Phase 02 invariants, maximum canvas dimension is safely constrained to $16,384\text{ px}$ to prevent mobile WebGL context resets.
3. **Solid Background Separation:** Modifying the studio backdrop color only affects transparent pixels; existing solid backgrounds in photos require the AI Background Remover tool.

---

## 10. Multiple Photo Print Sheet Engine Subsystem (Phase 03D & Phase 03E)

The **Multiple Photo Print Sheet Engine** (`src/lib/photo-studio/sheet-calculator.ts`, `src/lib/photo-studio/sheet-renderer.ts`, and `src/lib/photo-studio/sheet-exporter.ts`) synthesizes print-ready multi-photo layout sheets directly in browser memory. It provides mathematical grid positioning, capacity calculations, orientation switching, cutting guides, high-resolution rasterization, and physical PostScript PDF vector assembly without server assistance.

### 10.1. Paper Format Specifications & Physical Geometry

The engine unifies standard ISO 216 **A4 paper** and standard **4 × 6 inch (10 × 15 cm)** photo card stock under a single layout and export pipeline:

| Dimension Attribute | ISO 216 A4 Paper (Phase 03E) | 4 × 6 Inch Photo Card (Phase 03D) | Standard Constant Definition |
|---|---|---|---|
| **Short Edge (mm)** | $210.0\text{ mm}$ | $101.6\text{ mm}$ ($4.0\text{ in} \times 25.4$) | `SHEET_A4_SHORT_EDGE_MM` / `SHEET_4X6_SHORT_EDGE_MM` |
| **Long Edge (mm)** | $297.0\text{ mm}$ | $152.4\text{ mm}$ ($6.0\text{ in} \times 25.4$) | `SHEET_A4_LONG_EDGE_MM` / `SHEET_4X6_LONG_EDGE_MM` |
| **Short Edge (inches)** | $\approx 8.2677165\text{ in}$ | $4.0000000\text{ in}$ | `millimeters / 25.4` |
| **Long Edge (inches)** | $\approx 11.6929134\text{ in}$ | $6.0000000\text{ in}$ | `millimeters / 25.4` |
| **PostScript PDF Short Edge** | **$595.2756\text{ pt}$** | **$288.0000\text{ pt}$** | `(shortMm / 25.4) * 72` |
| **PostScript PDF Long Edge** | **$841.8898\text{ pt}$** | **$432.0000\text{ pt}$** | `(longMm / 25.4) * 72` |
| **Default Outer Margins** | $6.0\text{ mm}$ (safe for desktop printers) | $4.0\text{ mm}$ (compact photo stock) | `DEFAULT_A4_SHEET_MARGINS` / `DEFAULT_SHEET_MARGINS` |
| **Default Photo Spacing** | $2.0\text{ mm}$ horizontal / $2.0\text{ mm}$ vertical | $2.0\text{ mm}$ horizontal / $2.0\text{ mm}$ vertical | `horizontalSpacingMm` / `verticalSpacingMm` |

#### Orientation Rules
- **Portrait Orientation:** Width is mapped to the Short Edge; Height is mapped to the Long Edge:
  - A4 Portrait: $210.0 \times 297.0\text{ mm}$ ($595.2756 \times 841.8898\text{ pt}$).
  - 4×6 Portrait: $101.6 \times 152.4\text{ mm}$ ($288.0000 \times 432.0000\text{ pt}$).
- **Landscape Orientation:** Width is mapped to the Long Edge; Height is mapped to the Short Edge:
  - A4 Landscape: $297.0 \times 210.0\text{ mm}$ ($841.8898 \times 595.2756\text{ pt}$).
  - 4×6 Landscape: $152.4 \times 101.6\text{ mm}$ ($432.0000 \times 288.0000\text{ pt}$).

---

### 10.2. Pixel Grid Formulations & Rounding Strategy

Raster canvas pixel dimensions are calculated strictly using the international standard formula with round-to-nearest-integer rounding:

$$\text{pixels} = \text{Math.round}\left(\frac{\text{millimeters}}{25.4} \times \text{DPI}\right)$$

#### Standard A4 Output Grids Across Supported DPI Presets

| DPI Preset | Portrait Dimensions (W × H px) | Landscape Dimensions (W × H px) | Total Megapixels | Optimal Use Case |
|---|---|---|---|---|
| **150 DPI** | $1240 \times 1754\text{ px}$ | $1754 \times 1240\text{ px}$ | $\approx 2.18\text{ MP}$ | Fast test proofs, draft previews, low-bandwidth workflows |
| **200 DPI** | $1654 \times 2339\text{ px}$ | $2339 \times 1654\text{ px}$ | $\approx 3.87\text{ MP}$ | Office laser printers and standard document copies |
| **300 DPI** | $2480 \times 3508\text{ px}$ | $3508 \times 2480\text{ px}$ | $\approx 8.70\text{ MP}$ | Commercial photo lab standard (crisp continuous tone) |
| **600 DPI** | $4961 \times 7016\text{ px}$ | $7016 \times 4961\text{ px}$ | $\approx 34.81\text{ MP}$ | High-end archival fine-art and biometric security printing |
| **Custom DPI** | Validated $30 \le \text{DPI} \le 2400$ | Validated $30 \le \text{DPI} \le 2400$ | Calculated dynamically | Calibrated RIP drivers and non-standard print workflows |

---

### 10.3. Unified Layout Grid & Placement Mathematics

Both A4 and 4×6 layouts share the exact same pure placement math (`calculatePhotoSheetLayout`):

#### 1. Available Usable Space Calculation
$$\begin{aligned}
W_{\text{usable}} &= W_{\text{sheet}} - (M_{\text{left}} + M_{\text{right}}) \\
H_{\text{usable}} &= H_{\text{sheet}} - (M_{\text{top}} + M_{\text{bottom}})
\end{aligned}$$
If $W_{\text{usable}} < W_{\text{photo}}$ or $H_{\text{usable}} < H_{\text{photo}}$, available capacity evaluates to $0$ and placement is aborted to prevent boundary clipping.

#### 2. Automatic Capacity Derivation
$$\begin{aligned}
C_{\text{max}} &= \left\lfloor \frac{W_{\text{usable}} + S_{\text{col}}}{W_{\text{photo}} + S_{\text{col}}} \right\rfloor \\
R_{\text{max}} &= \left\lfloor \frac{H_{\text{usable}} + S_{\text{row}}}{H_{\text{photo}} + S_{\text{row}}} \right\rfloor \\
N_{\text{capacity}} &= C_{\text{max}} \times R_{\text{max}}
\end{aligned}$$

#### 3. Standard Capacity Benchmarks on A4 Paper (with 6 mm margins & 2 mm spacing)
- **Standard Passport (35 × 45 mm):**
  - Portrait ($210 \times 297\text{ mm}$): fits **30 photos** (5 columns × 6 rows).
  - Landscape ($297 \times 210\text{ mm}$): fits **28 photos** (7 columns × 4 rows).
- **US Visa / Square (50.8 × 50.8 mm / 2 × 2″):**
  - Portrait: fits **15 photos** (3 columns × 5 rows).
  - Landscape: fits **15 photos** (5 columns × 3 rows).
- **Portrait Photo (40 × 50 mm):**
  - Portrait: fits **20 photos** (4 columns × 5 rows).
  - Landscape: fits **18 photos** (6 columns × 3 rows).

#### 4. Automatic vs. Manual Grid Columns and Rows
- **Automatic Arrangement:** $C = C_{\text{max}}$ and $R = R_{\text{max}}$.
- **Manual Mode:** The user may select fewer columns $C_{\text{user}} \le C_{\text{max}}$ or rows $R_{\text{user}} \le R_{\text{max}}$ to leave open writing/signing areas on the sheet.

#### 5. Center-Aligned Grid Placement
When center alignment is enabled (default `true`), leftover usable space is distributed symmetrically:
$$\begin{aligned}
W_{\text{grid}} &= C \times W_{\text{photo}} + (C - 1) \times S_{\text{col}} \\
H_{\text{grid}} &= R \times H_{\text{photo}} + (R - 1) \times S_{\text{row}} \\
X_0 &= M_{\text{left}} + \frac{W_{\text{usable}} - W_{\text{grid}}}{2} \\
Y_0 &= M_{\text{top}} + \frac{H_{\text{usable}} - H_{\text{grid}}}{2}
\end{aligned}$$

Each photo copy $i \in [0, N_{\text{placed}} - 1]$ is assigned grid index $(\text{row} = \lfloor i / C \rfloor, \text{col} = i \pmod C)$:
$$\begin{aligned}
X_i &= X_0 + \text{col} \times (W_{\text{photo}} + S_{\text{col}}) \\
Y_i &= Y_0 + \text{row} \times (H_{\text{photo}} + S_{\text{row}})
\end{aligned}$$

---

### 10.4. Copy Count Invariant: Zero Silent Reduction

A core architectural invariant of Browser Utility Studio is **never to silently discard user configuration**:

- The user-requested copy count (`config.copies`) is permanently preserved in state.
- If $\text{requestedCopies} > N_{\text{capacity}}$:
  - The engine sets `copiesExceedCapacity: true` and calculates `exceededByCount = requested - capacity`.
  - The rendered sheet displays the maximum possible photos ($N_{\text{placed}} = \min(\text{requested}, N_{\text{capacity}})$).
  - A persistent, high-visibility amber warning banner appears across the controls panel and preview HUD informing the user:
    > *"Sheet capacity reached: Placing [placed] of [requested] requested photos on this sheet ([overflow] photos exceed single-sheet capacity). Adjust margins, spacing, or print an additional sheet."*
- If $\text{requestedCopies} \le N_{\text{capacity}}$:
  - Exactly $N_{\text{placed}} = \text{requestedCopies}$ are placed in reading order (top-left to bottom-right), leaving trailing cells cleanly unprinted.

---

### 10.5. Cutting Guides & Separation Lines

To facilitate post-print manual trimming with guillotine cutters or scissors, the engine renders configurable cutting guides:

1. **Crop Marks (Corner Markers):**
   - Precise crosshairs or L-bracket corner marks rendered just outside the photo perimeter ($0.5\text{ mm}$ offset with $2.5\text{ mm}$ arm length).
   - Keeps marks entirely outside photo content so no black ink encroaches on the cropped face.
2. **Separation Grid Lines:**
   - Continuous dashed or solid divider lines through horizontal and vertical photo gutters.
   - Dash pattern: $[4\text{ px}, 4\text{ px}]$ scaled to output resolution.
3. **Configurable Style & Color:**
   - Color picker with presets: Light Gray (`#D1D5DB`), Mid Gray (`#9CA3AF`), Dark Charcoal (`#374151`), or Solid Black (`#000000`).
   - Line thickness options: Fine ($0.5\text{ mm}$), Standard ($1.0\text{ mm}$), Bold ($1.5\text{ mm}$).
   - Toggleable switch: Allows 1-click preview and export with or without cutting guides.

---

### 10.6. Print-Ready PDF Point Precision Standard

PDF files use a device-independent coordinate system where $1\text{ point} = \frac{1}{72}\text{ inch} = \frac{25.4}{72}\text{ mm} \approx 0.352778\text{ mm}$.

> [!CRITICAL]
> **PDF Dimension Invariant:** PDF page dimensions MUST NEVER be derived from rounded raster pixel dimensions. Deriving PDF page points by dividing rounded pixels by DPI ($\frac{\text{pixels}}{\text{DPI}} \times 72$) introduces floating-point truncation errors that accumulate into noticeable physical sizing discrepancies when sent to printing presses.

Instead, PDF documents generated by `exportSheetToPdf()` use exact physical conversion formulas:
$$\begin{aligned}
\text{pageWidthPt}_{\text{A4 Portrait}} &= \frac{210.0\text{ mm}}{25.4\text{ mm/in}} \times 72\text{ pt/in} = \mathbf{595.2756\text{ pt}} \\
\text{pageHeightPt}_{\text{A4 Portrait}} &= \frac{297.0\text{ mm}}{25.4\text{ mm/in}} \times 72\text{ pt/in} = \mathbf{841.8898\text{ pt}}
\end{aligned}$$

In PostScript PDF standard, origin $(0, 0)$ is at the **bottom-left** corner. The exporter inverts vertical coordinates so photos align with screen layout:
$$\begin{aligned}
X_{\text{pdf}} &= \frac{X_{\text{mm}}}{25.4} \times 72 \\
Y_{\text{pdf}} &= \text{pageHeightPt} - \left(\frac{Y_{\text{mm}} + H_{\text{photoMm}}}{25.4} \times 72\right)
\end{aligned}$$

---

### 10.7. Live Preview Scaled Canvas Performance

To maintain 60 FPS UI responsiveness on low-power laptops and mobile devices, interactive controls decouple live preview rendering from export rasterization:
- **Preview Canvas:** Scaled dynamically to fit container boundaries (typically $300\text{ px}$ to $1200\text{ px}$ wide), preventing costly multi-megapixel redraws on every margin slider step.
- **Export Canvas:** Synthesized on-demand upon clicking "Download" at full physical target resolution ($2480 \times 3508\text{ px}$ at 300 DPI or $4961 \times 7016\text{ px}$ at 600 DPI).
- **Buffer Cleanup:** Master export canvas buffers and temporary Blobs are immediately disposed via `releaseCanvasBuffer()` and `revokeObjectUrlSafely()`.

---

### 10.8. Physical Printing Accuracy & Hardware Limitations

When printing generated A4 and 4×6 photo sheets, software accuracy must be paired with correct operating system print dialog configurations:

1. **Scale Setting — 100% / Actual Size:**
   - In the system print dialog (Chrome, Acrobat, Windows Photo Viewer, macOS Preview), the user **MUST** select **"Actual Size"** or **"100%"**.
   - **Disable "Fit to Printable Area", "Scale to Fit", or "Shrink oversized pages"**: Enabling automatic scaling reduces the physical photo dimensions (e.g. shrinking a $35 \times 45\text{ mm}$ photo down to $33 \times 42\text{ mm}$), causing biometric passport rejection at consulates.
2. **Paper Size Selection:**
   - Select **A4 ($210 \times 297\text{ mm}$)** in printer properties. Do not select US Letter ($8.5 \times 11\text{ in} = 215.9 \times 279.4\text{ mm}$).
3. **Hardware Non-Printable Margin Limitations:**
   - Standard consumer inkjet and laser printers possess physical mechanical paper grab rollers that require non-printable margins (typically $3.0\text{ mm}$ to $6.0\text{ mm}$ on leading/trailing edges).
   - Our default A4 margin is preset to $6.0\text{ mm}$ to ensure all photo content and corner marks remain within printable mechanical boundaries.
   - True borderless printing requires dedicated photo printers with overspray ink absorbers; borderless modes may introduce minor edge expansion zoom ($1\% - 2\%$). Users requiring exact caliper-grade physical accuracy should print with margins enabled at $100\%$ scale.
