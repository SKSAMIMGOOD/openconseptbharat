import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// Simple CRC32 implementation for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makePngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data ? data.length : 0;
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(len, 0);

  const crcPayload = data ? Buffer.concat([typeBuf, data]) : typeBuf;
  const crcVal = crc32(crcPayload);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return data ? Buffer.concat([lenBuf, typeBuf, data, crcBuf]) : Buffer.concat([lenBuf, typeBuf, crcBuf]);
}

/**
 * Encodes RGBA pixel buffer into a valid PNG buffer.
 * width, height: dimensions
 * rgbaBuffer: Uint8Array of size width * height * 4
 */
export function encodePng(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: 13 bytes
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type 6: RGBA
  ihdrData[10] = 0; // compression method 0
  ihdrData[11] = 0; // filter method 0
  ihdrData[12] = 0; // interlace method 0
  const ihdrChunk = makePngChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0 (None)
  const scanlineLength = width * 4 + 1;
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rawOffset = y * scanlineLength;
    rawData[rawOffset] = 0; // Filter: None
    const rgbaOffset = y * width * 4;
    for (let x = 0; x < width * 4; x++) {
      rawData[rawOffset + 1 + x] = rgbaBuffer[rgbaOffset + x];
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makePngChunk('IDAT', compressedData);
  const iendChunk = makePngChunk('IEND', null);

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Software rasterizer for generating crisp visual diagram screenshots of A4 sheets
 */
export class CanvasSim {
  constructor(width, height, bg = [255, 255, 255, 255]) {
    this.width = width;
    this.height = height;
    this.buffer = new Uint8Array(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      this.buffer[i * 4 + 0] = bg[0];
      this.buffer[i * 4 + 1] = bg[1];
      this.buffer[i * 4 + 2] = bg[2];
      this.buffer[i * 4 + 3] = bg[3];
    }
  }

  setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = (y * this.width + x) * 4;
    this.buffer[idx + 0] = r;
    this.buffer[idx + 1] = g;
    this.buffer[idx + 2] = b;
    this.buffer[idx + 3] = a;
  }

  fillRect(x0, y0, w, h, r, g, b, a = 255) {
    const xEnd = Math.min(this.width, Math.max(0, x0 + w));
    const yEnd = Math.min(this.height, Math.max(0, y0 + h));
    const xStart = Math.max(0, x0);
    const yStart = Math.max(0, y0);

    for (let y = yStart; y < yEnd; y++) {
      for (let x = xStart; x < xEnd; x++) {
        this.setPixel(x, y, r, g, b, a);
      }
    }
  }

  strokeRect(x0, y0, w, h, r, g, b, lineWidth = 1) {
    for (let lw = 0; lw < lineWidth; lw++) {
      for (let x = x0; x < x0 + w; x++) {
        this.setPixel(x, y0 + lw, r, g, b);
        this.setPixel(x, y0 + h - 1 - lw, r, g, b);
      }
      for (let y = y0; y < y0 + h; y++) {
        this.setPixel(x0 + lw, y, r, g, b);
        this.setPixel(x0 + w - 1 - lw, y, r, g, b);
      }
    }
  }

  drawPhoto(x0, y0, w, h, index) {
    // Photo background
    this.fillRect(x0, y0, w, h, 224, 242, 254); // light sky blue (#e0f2fe)
    this.strokeRect(x0, y0, w, h, 56, 189, 248, 1); // #38bdf8

    // Silhouette head
    const cx = Math.round(x0 + w / 2);
    const cy = Math.round(y0 + h * 0.38);
    const radius = Math.round(w * 0.22);
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2) {
          this.setPixel(x, y, 14, 165, 233); // #0ea5e9
        }
      }
    }

    // Silhouette shoulders
    const bodyCx = cx;
    const bodyCy = Math.round(y0 + h * 0.82);
    const rx = Math.round(w * 0.38);
    const ry = Math.round(h * 0.22);
    for (let y = y0 + Math.round(h * 0.55); y < y0 + h - 2; y++) {
      for (let x = x0 + 4; x < x0 + w - 4; x++) {
        if (((x - bodyCx) / rx) ** 2 + ((y - bodyCy) / ry) ** 2 <= 1.0) {
          this.setPixel(x, y, 14, 165, 233);
        }
      }
    }

    // Border tick marks / crop guides (3px outward)
    const tickLen = 5;
    // TL
    for (let i = 0; i < tickLen; i++) {
      this.setPixel(x0 - 1 - i, y0, 100, 116, 139);
      this.setPixel(x0, y0 - 1 - i, 100, 116, 139);
    }
    // TR
    for (let i = 0; i < tickLen; i++) {
      this.setPixel(x0 + w + i, y0, 100, 116, 139);
      this.setPixel(x0 + w - 1, y0 - 1 - i, 100, 116, 139);
    }
    // BL
    for (let i = 0; i < tickLen; i++) {
      this.setPixel(x0 - 1 - i, y0 + h - 1, 100, 116, 139);
      this.setPixel(x0, y0 + h + i, 100, 116, 139);
    }
    // BR
    for (let i = 0; i < tickLen; i++) {
      this.setPixel(x0 + w + i, y0 + h - 1, 100, 116, 139);
      this.setPixel(x0 + w - 1, y0 + h + i, 100, 116, 139);
    }
  }

  toPngBuffer() {
    return encodePng(this.width, this.height, this.buffer);
  }
}

// Ensure screenshots directory exists
const screenshotsDir = path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const SCALE = 2.0; // Scale 1mm -> 2.0 px
const A4_W = Math.round(210.0 * SCALE); // 420 px
const A4_H = Math.round(297.0 * SCALE); // 594 px
const PHOTO_W = Math.round(35.0 * SCALE); // 70 px
const PHOTO_H = Math.round(45.0 * SCALE); // 90 px
const MARGIN = Math.round(6.0 * SCALE); // 12 px

console.log('Generating Before vs After A4 Photo Sheet layout screenshots...');

// 1. BEFORE SCREENSHOT (Buggy: 2mm spacing, vertically centered in middle of A4, 5 columns)
{
  const sim = new CanvasSim(A4_W, A4_H, [255, 255, 255, 255]);
  // Printable area border (dashed guide)
  sim.strokeRect(MARGIN, MARGIN, A4_W - 2 * MARGIN, A4_H - 2 * MARGIN, 226, 232, 240, 1);

  const beforeGap = Math.round(2.0 * SCALE);
  const beforeCols = 5;
  const gridW = beforeCols * PHOTO_W + (beforeCols - 1) * beforeGap;
  const gridH = 2 * PHOTO_H + 1 * beforeGap;

  // Unwanted vertical centering: (A4_H - gridH) / 2
  const startX = Math.round((A4_W - gridW) / 2);
  const startY = Math.round((A4_H - gridH) / 2); // Floating in middle!

  for (let i = 0; i < 6; i++) {
    const row = Math.floor(i / beforeCols);
    const col = i % beforeCols;
    const x = startX + col * (PHOTO_W + beforeGap);
    const y = startY + row * (PHOTO_H + beforeGap);
    sim.drawPhoto(x, y, PHOTO_W, PHOTO_H, i + 1);
  }

  fs.writeFileSync(path.join(screenshotsDir, 'a4-photo-sheet-before-buggy.png'), sim.toPngBuffer());
  console.log('Saved: a4-photo-sheet-before-buggy.png');
}

// 2. AFTER SCREENSHOT (Fixed: 6 photos, top-aligned at 6mm margin, 1.5mm gap, strict max 4 columns)
{
  const sim = new CanvasSim(A4_W, A4_H, [255, 255, 255, 255]);
  sim.strokeRect(MARGIN, MARGIN, A4_W - 2 * MARGIN, A4_H - 2 * MARGIN, 187, 247, 208, 1);

  const afterGap = Math.round(1.5 * SCALE); // 3 px = 1.5 mm
  const afterCols = 4; // Strict max 4 columns
  const startX = MARGIN; // Top-left aligned
  const startY = MARGIN; // Starts immediately at top margin

  for (let i = 0; i < 6; i++) {
    const row = Math.floor(i / afterCols);
    const col = i % afterCols;
    const x = startX + col * (PHOTO_W + afterGap);
    const y = startY + row * (PHOTO_H + afterGap);
    sim.drawPhoto(x, y, PHOTO_W, PHOTO_H, i + 1);
  }

  fs.writeFileSync(path.join(screenshotsDir, 'a4-photo-sheet-after-fixed.png'), sim.toPngBuffer());
  console.log('Saved: a4-photo-sheet-after-fixed.png');
}

// 3. CASE 1 SCREENSHOT (4 Photos in 1 Row)
{
  const sim = new CanvasSim(A4_W, A4_H, [255, 255, 255, 255]);
  sim.strokeRect(MARGIN, MARGIN, A4_W - 2 * MARGIN, A4_H - 2 * MARGIN, 226, 232, 240, 1);
  const gap = Math.round(1.5 * SCALE);

  for (let i = 0; i < 4; i++) {
    const x = MARGIN + i * (PHOTO_W + gap);
    const y = MARGIN;
    sim.drawPhoto(x, y, PHOTO_W, PHOTO_H, i + 1);
  }

  fs.writeFileSync(path.join(screenshotsDir, 'a4-photo-sheet-case1-4photos.png'), sim.toPngBuffer());
  console.log('Saved: a4-photo-sheet-case1-4photos.png');
}

// 4. CASE 2 SCREENSHOT (8 Photos in 2 Rows)
{
  const sim = new CanvasSim(A4_W, A4_H, [255, 255, 255, 255]);
  sim.strokeRect(MARGIN, MARGIN, A4_W - 2 * MARGIN, A4_H - 2 * MARGIN, 226, 232, 240, 1);
  const gap = Math.round(1.5 * SCALE);

  for (let i = 0; i < 8; i++) {
    const row = Math.floor(i / 4);
    const col = i % 4;
    const x = MARGIN + col * (PHOTO_W + gap);
    const y = MARGIN + row * (PHOTO_H + gap);
    sim.drawPhoto(x, y, PHOTO_W, PHOTO_H, i + 1);
  }

  fs.writeFileSync(path.join(screenshotsDir, 'a4-photo-sheet-case2-8photos.png'), sim.toPngBuffer());
  console.log('Saved: a4-photo-sheet-case2-8photos.png');
}

// 5. CASE 3 SCREENSHOT (6 Photos in 2 Rows)
{
  const sim = new CanvasSim(A4_W, A4_H, [255, 255, 255, 255]);
  sim.strokeRect(MARGIN, MARGIN, A4_W - 2 * MARGIN, A4_H - 2 * MARGIN, 226, 232, 240, 1);
  const gap = Math.round(1.5 * SCALE);

  for (let i = 0; i < 6; i++) {
    const row = Math.floor(i / 4);
    const col = i % 4;
    const x = MARGIN + col * (PHOTO_W + gap);
    const y = MARGIN + row * (PHOTO_H + gap);
    sim.drawPhoto(x, y, PHOTO_W, PHOTO_H, i + 1);
  }

  fs.writeFileSync(path.join(screenshotsDir, 'a4-photo-sheet-case3-6photos.png'), sim.toPngBuffer());
  console.log('Saved: a4-photo-sheet-case3-6photos.png');
}

// 6. SIDE-BY-SIDE BEFORE vs AFTER COMPARISON POSTER
{
  const posterW = A4_W * 2 + 60;
  const posterH = A4_H + 110;
  const poster = new CanvasSim(posterW, posterH, [15, 23, 42, 255]); // Dark slate #0f172a

  // Left card: BEFORE
  const leftX = 20;
  const topY = 70;
  // White A4 sheet
  poster.fillRect(leftX, topY, A4_W, A4_H, 255, 255, 255);
  // Red margin guide
  poster.strokeRect(leftX + MARGIN, topY + MARGIN, A4_W - 2 * MARGIN, A4_H - 2 * MARGIN, 254, 202, 202, 1);

  // Before photos (2mm gap, 5 cols, vertically centered)
  const beforeGap = Math.round(2.0 * SCALE);
  const beforeCols = 5;
  const gridW = beforeCols * PHOTO_W + (beforeCols - 1) * beforeGap;
  const gridH = 2 * PHOTO_H + 1 * beforeGap;
  const bStartX = leftX + Math.round((A4_W - gridW) / 2);
  const bStartY = topY + Math.round((A4_H - gridH) / 2);

  for (let i = 0; i < 6; i++) {
    const row = Math.floor(i / beforeCols);
    const col = i % beforeCols;
    const x = bStartX + col * (PHOTO_W + beforeGap);
    const y = bStartY + row * (PHOTO_H + beforeGap);
    poster.drawPhoto(x, y, PHOTO_W, PHOTO_H, i + 1);
  }

  // Right card: AFTER
  const rightX = leftX + A4_W + 20;
  // White A4 sheet
  poster.fillRect(rightX, topY, A4_W, A4_H, 255, 255, 255);
  // Green margin guide
  poster.strokeRect(rightX + MARGIN, topY + MARGIN, A4_W - 2 * MARGIN, A4_H - 2 * MARGIN, 187, 247, 208, 1);

  // After photos (1.5mm gap, 4 cols, top-left aligned)
  const afterGap = Math.round(1.5 * SCALE);
  const afterCols = 4;
  const aStartX = rightX + MARGIN;
  const aStartY = topY + MARGIN;

  for (let i = 0; i < 6; i++) {
    const row = Math.floor(i / afterCols);
    const col = i % afterCols;
    const x = aStartX + col * (PHOTO_W + afterGap);
    const y = aStartY + row * (PHOTO_H + afterGap);
    poster.drawPhoto(x, y, PHOTO_W, PHOTO_H, i + 1);
  }

  // Header banner
  // Red accent on left
  poster.fillRect(leftX, 20, 180, 26, 244, 63, 94);
  // Green accent on right
  poster.fillRect(rightX, 20, 180, 26, 16, 185, 129);

  fs.writeFileSync(path.join(screenshotsDir, 'a4-photo-sheet-before-after-diff.png'), poster.toPngBuffer());
  console.log('Saved: a4-photo-sheet-before-after-diff.png');
}

console.log('All visual verification screenshots generated successfully!');
