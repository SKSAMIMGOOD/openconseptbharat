# Browser Utility Studio — Strict Privacy Policy & Architecture Specification

## 1. Fundamental Principle: Zero-Upload

Browser Utility Studio is architected so that **user files are never uploaded to any server, cloud platform, or remote entity under any circumstances**. 

When processing sensitive citizen identity documents (such as PAN cards, Aadhaar cards, or Ration cards) or personal portrait photographs, traditional online utility sites send raw files to their servers for processing. This presents acute data security risks, including identity theft, unauthorized data mining, and surveillance.

Browser Utility Studio solves this problem fundamentally by **moving all computation to the client device**.

---

## 2. Technical Privacy Guarantees

| Category | Policy | Technical Implementation |
| :--- | :--- | :--- |
| **Data Ingestion** | Local Only | Files are read strictly via browser `File` and `FileReader` APIs directly from the local filesystem. |
| **Network Traffic** | Zero Outbound Payloads | No REST, GraphQL, or WebSocket endpoints exist in the application. Network inspection reveals zero payload requests. |
| **Server Infrastructure** | Static Serving Only | Next.js serves purely precompiled JavaScript, CSS, HTML, and WASM binary assets. No server execution is invoked during document processing. |
| **Image Processing** | 100% Client Memory | Canvas rendering, cropping, rotating, and scaling occur using HTML5 Canvas API and Web Workers in client RAM. |
| **PDF Synthesis** | In-Browser Assembly | `pdf-lib` and `pdfjs-dist` generate and parse PDF byte streams within the browser's JavaScript engine. |
| **Local Persistence** | No Permanent Caching | User files, extracted images, and decrypted PDF passwords are never saved to `localStorage`, `sessionStorage`, or `IndexedDB`. |
| **Analytics & Telemetry** | Zero Trackers | No Google Analytics, Facebook Pixel, Mixpanel, or third-party advertising SDKs are installed. |

### 2.1. Shared Image Processing Engine Lifecycle (Phase 02)
- **Zero In-Transit Decryption:** Image decoding (`createImageBitmap`), transformations (crop, rotate, resize, flip), and canvas pixel manipulation run inside ephemeral client memory or sandboxed Web Workers.
- **Deterministic Resource Revocation:** Object URLs generated for preview rendering or download triggers are tracked in-memory and revoked via `URL.revokeObjectURL()`.
- **Immediate Bitmap Disposal:** Master and intermediate `ImageBitmap` buffers are closed via `bitmap.close()` when transformations complete or components unmount.
- **No Base64 Payload Sprawl:** Canvas outputs are converted directly to ephemeral Blobs without creating massive base64 string allocations that could persist in memory dumps.

---

## 3. Verification Protocol for Users and Auditors

Any user or independent security auditor can prove that their files never leave the machine:

1. Open your browser's Developer Tools (`Ctrl+Shift+I` or `Cmd+Option+I` or `F12`).
2. Navigate to the **Network** tab.
3. Check the **Disable cache** option and filter requests by **Fetch/XHR**.
4. Ingest and crop a sample document or photo.
5. Notice that:
   - No HTTP POST, PUT, or PATCH requests are initiated.
   - The size of sent network data remains `0 B`.
   - The processed result is exported via a local `blob:` URI.

---

## 4. Model & Static Asset Integrity

Future browser-based AI models (such as background removal neural networks) will be delivered as static quantized ONNX or WebAssembly weights served with strict Content-Security-Policy (CSP) headers. Model inference is executed through client hardware acceleration (WebGL, WebGPU, or WASM).

---

## 5. Summary of Compliance

- **GDPR / DPDP Act (India):** Because no personal data is collected, stored, or processed on remote systems, Browser Utility Studio fundamentally respects data minimization and citizen digital sovereignty.
