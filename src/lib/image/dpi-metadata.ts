/**
 * Client-Side DPI Metadata Injection & Parsing Subsystem (Phase 03H)
 *
 * Implements pure binary manipulation of standard image headers to embed and
 * verify Dots-Per-Inch (DPI) physical resolution metadata:
 * - PNG: Standard "pHYs" chunk (pixels per meter, ISO/IEC 15948)
 * - JPEG: Standard JFIF "APP0" marker (dots per inch, ISO/IEC 10918-1)
 *
 * 100% in-browser execution with zero external dependencies and zero cloud roundtrips.
 */

// Precomputed CRC-32 table for IEEE 802.3 / ISO 3309 standard
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}

/**
 * Computes standard CRC-32 over a byte slice.
 */
export function crc32(
  bytes: Uint8Array,
  offset: number = 0,
  length: number = bytes.length
): number {
  let crc = 0xffffffff;
  const end = offset + length;
  for (let i = offset; i < end; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Standard conversion factor: 1 meter = 39.37007874 inches.
 * Pixels Per Meter (PPM) = round(DPI / 0.0254).
 * Example: 300 DPI -> 11811 PPM.
 */
export function dpiToPixelsPerMeter(dpi: number): number {
  return Math.round(dpi / 0.0254);
}

/**
 * Converts Pixels Per Meter (PPM) back to Dots Per Inch (DPI).
 * Example: 11811 PPM -> 300 DPI.
 */
export function pixelsPerMeterToDpi(ppm: number): number {
  return Math.round(ppm * 0.0254);
}

/**
 * Injects or updates a standard PNG "pHYs" chunk with the specified DPI.
 *
 * PNG specification:
 * - Length: 9 bytes
 * - Type: "pHYs" (0x70 0x48 0x79 0x73)
 * - Data:
 *   - 4 bytes uint32BE: Pixels per unit, X axis
 *   - 4 bytes uint32BE: Pixels per unit, Y axis
 *   - 1 byte uint8: Unit specifier (1 = metre)
 * - CRC: 4 bytes uint32BE computed over type + data (13 bytes total)
 *
 * The "pHYs" chunk is inserted immediately following the 25-byte "IHDR" chunk at byte 33.
 */
export function writePngDpi(
  buffer: ArrayBuffer | Uint8Array,
  dpi: number
): Uint8Array {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  // Validate PNG 8-byte signature: 0x89 'P' 'N' 'G' 0x0D 0x0A 0x1A 0x0A
  if (
    bytes.length < 33 ||
    bytes[0] !== 0x89 ||
    bytes[1] !== 0x50 ||
    bytes[2] !== 0x4e ||
    bytes[3] !== 0x47 ||
    bytes[4] !== 0x0d ||
    bytes[5] !== 0x0a ||
    bytes[6] !== 0x1a ||
    bytes[7] !== 0x0a
  ) {
    return bytes;
  }

  const safeDpi = Math.max(30, Math.min(2400, Math.round(dpi)));
  const ppm = dpiToPixelsPerMeter(safeDpi);

  // Create 21-byte pHYs chunk (4 length + 4 type + 9 data + 4 crc)
  const physChunk = new Uint8Array(21);
  const view = new DataView(physChunk.buffer);

  // 1. Length (9)
  view.setUint32(0, 9, false);

  // 2. Type "pHYs"
  physChunk[4] = 0x70; // 'p'
  physChunk[5] = 0x48; // 'H'
  physChunk[6] = 0x59; // 'Y'
  physChunk[7] = 0x73; // 's'

  // 3. Data: X PPM (uint32BE), Y PPM (uint32BE), Unit (0x01 = meter)
  view.setUint32(8, ppm, false);
  view.setUint32(12, ppm, false);
  physChunk[16] = 0x01; // meter

  // 4. CRC32 over type + data (bytes 4..16, length 13)
  const chunkCrc = crc32(physChunk, 4, 13);
  view.setUint32(17, chunkCrc, false);

  // Locate and strip any existing pHYs chunk before IDAT or IEND
  let existingPhysStart = -1;
  let existingPhysLen = 0;
  let cursor = 8; // start right after PNG signature

  while (cursor + 8 <= bytes.length) {
    const chunkDataLen =
      (bytes[cursor] << 24) |
      (bytes[cursor + 1] << 16) |
      (bytes[cursor + 2] << 8) |
      bytes[cursor + 3];
    const chunkType = String.fromCharCode(
      bytes[cursor + 4],
      bytes[cursor + 5],
      bytes[cursor + 6],
      bytes[cursor + 7]
    );

    if (chunkType === "pHYs") {
      existingPhysStart = cursor;
      existingPhysLen = 4 + 4 + chunkDataLen + 4; // length + type + data + crc
      break;
    }

    if (chunkType === "IDAT" || chunkType === "IEND") {
      break;
    }

    cursor += 4 + 4 + chunkDataLen + 4;
  }

  let cleanBytes = bytes;
  if (existingPhysStart !== -1 && existingPhysLen > 0) {
    cleanBytes = new Uint8Array(bytes.length - existingPhysLen);
    cleanBytes.set(bytes.subarray(0, existingPhysStart), 0);
    cleanBytes.set(
      bytes.subarray(existingPhysStart + existingPhysLen),
      existingPhysStart
    );
  }

  // Insert pHYs chunk immediately after the IHDR chunk (offset 33 = 8 signature + 25 IHDR)
  const insertPos = 33;
  const result = new Uint8Array(cleanBytes.length + 21);
  result.set(cleanBytes.subarray(0, insertPos), 0);
  result.set(physChunk, insertPos);
  result.set(cleanBytes.subarray(insertPos), insertPos + 21);

  return result;
}

/**
 * Extracts the DPI metadata from a PNG's "pHYs" chunk.
 * Returns null if no valid "pHYs" chunk with meter units is found.
 */
export function extractPngDpi(buffer: ArrayBuffer | Uint8Array): number | null {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.length < 33) return null;

  let cursor = 8;
  while (cursor + 8 <= bytes.length) {
    const chunkDataLen =
      (bytes[cursor] << 24) |
      (bytes[cursor + 1] << 16) |
      (bytes[cursor + 2] << 8) |
      bytes[cursor + 3];
    const chunkType = String.fromCharCode(
      bytes[cursor + 4],
      bytes[cursor + 5],
      bytes[cursor + 6],
      bytes[cursor + 7]
    );

    if (chunkType === "pHYs" && chunkDataLen >= 9) {
      const dataOffset = cursor + 8;
      const ppmX =
        (bytes[dataOffset] << 24) |
        (bytes[dataOffset + 1] << 16) |
        (bytes[dataOffset + 2] << 8) |
        bytes[dataOffset + 3];
      const unit = bytes[dataOffset + 8];

      if (unit === 1 && ppmX > 0) {
        return pixelsPerMeterToDpi(ppmX);
      }
      return null;
    }

    if (chunkType === "IDAT" || chunkType === "IEND") {
      break;
    }

    cursor += 4 + 4 + chunkDataLen + 4;
  }

  return null;
}

/**
 * Injects or updates a standard JPEG JFIF "APP0" marker with the specified DPI.
 *
 * JFIF specification:
 * - Marker: 0xFF 0xE0
 * - Length: 16 (0x00 0x10)
 * - Identifier: "JFIF\0" (0x4A 0x46 0x49 0x46 0x00)
 * - Version: 1.1 (0x01 0x01)
 * - Density units: 0x01 = dots per inch (DPI)
 * - Xdensity: uint16BE
 * - Ydensity: uint16BE
 * - Xthumbnail: 0x00
 * - Ythumbnail: 0x00
 *
 * If an existing JFIF APP0 is present, its units and densities are updated in-place.
 * If not present, the 18-byte APP0 marker is inserted immediately following the SOI marker (0xFF 0xD8).
 */
export function writeJpegDpi(
  buffer: ArrayBuffer | Uint8Array,
  dpi: number
): Uint8Array {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  // Validate JPEG SOI marker (0xFF 0xD8)
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return bytes;
  }

  const safeDpi = Math.max(30, Math.min(2400, Math.round(dpi)));

  // Case 1: Check if an APP0 JFIF marker already exists right after SOI
  if (
    bytes[2] === 0xff &&
    bytes[3] === 0xe0 &&
    bytes.length >= 20 &&
    bytes[6] === 0x4a && // 'J'
    bytes[7] === 0x46 && // 'F'
    bytes[8] === 0x49 && // 'I'
    bytes[9] === 0x46 && // 'F'
    bytes[10] === 0x00
  ) {
    // Clone bytes to avoid mutating input buffer
    const copy = new Uint8Array(bytes);
    copy[13] = 0x01; // units = dots per inch (DPI)
    copy[14] = (safeDpi >> 8) & 0xff; // Xdensity high
    copy[15] = safeDpi & 0xff; // Xdensity low
    copy[16] = (safeDpi >> 8) & 0xff; // Ydensity high
    copy[17] = safeDpi & 0xff; // Ydensity low
    return copy;
  }

  // Case 2: No JFIF APP0 right after SOI. Build and insert 18-byte JFIF APP0 marker.
  const app0 = new Uint8Array(18);
  app0[0] = 0xff;
  app0[1] = 0xe0; // APP0
  app0[2] = 0x00;
  app0[3] = 0x10; // Length = 16 (includes length bytes)
  app0[4] = 0x4a; // 'J'
  app0[5] = 0x46; // 'F'
  app0[6] = 0x49; // 'I'
  app0[7] = 0x46; // 'F'
  app0[8] = 0x00; // '\0'
  app0[9] = 0x01; // Version major 1
  app0[10] = 0x01; // Version minor 1
  app0[11] = 0x01; // Units: 1 = dots per inch (DPI)
  app0[12] = (safeDpi >> 8) & 0xff;
  app0[13] = safeDpi & 0xff;
  app0[14] = (safeDpi >> 8) & 0xff;
  app0[15] = safeDpi & 0xff;
  app0[16] = 0x00; // Xthumbnail
  app0[17] = 0x00; // Ythumbnail

  const result = new Uint8Array(bytes.length + 18);
  result.set(bytes.subarray(0, 2), 0); // SOI (FF D8)
  result.set(app0, 2); // APP0 marker
  result.set(bytes.subarray(2), 20); // Rest of JPEG

  return result;
}

/**
 * Extracts DPI metadata from a JPEG JFIF APP0 marker.
 * Returns null if no valid JFIF marker is found.
 */
export function extractJpegDpi(
  buffer: ArrayBuffer | Uint8Array
): { dpiX: number; dpiY: number; unit: number } | null {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.length < 18 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return null;
  }

  let cursor = 2;
  while (cursor + 4 <= bytes.length) {
    if (bytes[cursor] !== 0xff) {
      break;
    }
    const marker = bytes[cursor + 1];
    if (marker === 0xd9 || marker === 0xda) {
      // EOI or SOS: stop parsing headers
      break;
    }

    const length = (bytes[cursor + 2] << 8) | bytes[cursor + 3];
    if (length < 2 || cursor + 2 + length > bytes.length) {
      break;
    }

    if (
      marker === 0xe0 &&
      length >= 16 &&
      bytes[cursor + 4] === 0x4a &&
      bytes[cursor + 5] === 0x46 &&
      bytes[cursor + 6] === 0x49 &&
      bytes[cursor + 7] === 0x46 &&
      bytes[cursor + 8] === 0x00
    ) {
      const unit = bytes[cursor + 11];
      const dpiX = (bytes[cursor + 12] << 8) | bytes[cursor + 13];
      const dpiY = (bytes[cursor + 14] << 8) | bytes[cursor + 15];
      return { dpiX, dpiY, unit };
    }

    cursor += 2 + length;
  }

  return null;
}

/**
 * High-level helper: attaches DPI metadata to an encoded image Blob (PNG or JPEG).
 * For formats that do not support standard DPI metadata (or PDF where points define physical scale),
 * returns the original Blob unchanged.
 */
export async function attachDpiMetadata(
  blob: Blob,
  format: string,
  dpi: number
): Promise<Blob> {
  if (!dpi || dpi <= 0 || !Number.isFinite(dpi)) {
    return blob;
  }

  try {
    if (format === "image/png") {
      const arrayBuffer = await blob.arrayBuffer();
      const updatedBytes = writePngDpi(arrayBuffer, dpi);
      return new Blob([updatedBytes.buffer as ArrayBuffer], { type: "image/png" });
    }

    if (format === "image/jpeg") {
      const arrayBuffer = await blob.arrayBuffer();
      const updatedBytes = writeJpegDpi(arrayBuffer, dpi);
      return new Blob([updatedBytes.buffer as ArrayBuffer], { type: "image/jpeg" });
    }

    return blob;
  } catch (err) {
    console.warn("Failed to attach DPI metadata to image:", err);
    return blob;
  }
}
