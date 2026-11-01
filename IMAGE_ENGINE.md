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
