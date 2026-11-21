/**
 * Document Straightener — Perspective Engine & Homography
 *
 * Privacy-first, 100% in-browser mathematical perspective transformation (homography).
 * Features:
 * - 4-point backward projective mapping with sub-pixel bilinear interpolation
 * - Rigorous quadrilateral convexity & non-self-intersection verification
 * - Natural aspect ratio calculation and ISO CR80 / A4 document presets
 * - Text, QR code, and barcode clarity preservation
 * - Works identically in Node.js (pure pixel buffer) and browser (Canvas / Blob)
 */

import type {
  Point2D,
  PerspectiveQuad,
  CornerHandleKey,
  AspectRatioPreset,
} from "@/types/document-straightener";

export interface HomographyMatrix {
  m00: number;
  m01: number;
  m02: number;
  m10: number;
  m11: number;
  m12: number;
  m20: number;
  m21: number;
  m22: number;
}

export interface PixelBuffer {
  data: Uint8ClampedArray | Uint8Array;
  width: number;
  height: number;
}

/**
 * Computes Euclidean distance between two 2D points.
 */
export function pointDistance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 2D cross product of vectors (p2 - p1) and (p3 - p2).
 * Positive value indicates clockwise turn (in screen coordinates where y points down).
 */
export function crossProduct2D(p1: Point2D, p2: Point2D, p3: Point2D): number {
  return (p2.x - p1.x) * (p3.y - p2.y) - (p2.y - p1.y) * (p3.x - p2.x);
}

/**
 * Computes the area of a polygon using the Shoelace formula.
 */
export function polygonArea(points: Point2D[]): number {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

/**
 * Verifies if the 4-corner quadrilateral is strictly convex and non-degenerate.
 * Points must be ordered: Top-Left -> Top-Right -> Bottom-Right -> Bottom-Left.
 */
export function isConvexQuad(quad: PerspectiveQuad): boolean {
  const { topLeft, topRight, bottomRight, bottomLeft } = quad;

  const cp0 = crossProduct2D(topLeft, topRight, bottomRight);
  const cp1 = crossProduct2D(topRight, bottomRight, bottomLeft);
  const cp2 = crossProduct2D(bottomRight, bottomLeft, topLeft);
  const cp3 = crossProduct2D(bottomLeft, topLeft, topRight);

  // All 4 cross products must have the same strictly positive sign (clockwise)
  // or all strictly negative (counterclockwise).
  const allPositive = cp0 > 1e-4 && cp1 > 1e-4 && cp2 > 1e-4 && cp3 > 1e-4;
  const allNegative = cp0 < -1e-4 && cp1 < -1e-4 && cp2 < -1e-4 && cp3 < -1e-4;

  if (!allPositive && !allNegative) {
    return false;
  }

  // Ensure minimum valid area to avoid collapsed quad (at least 400 px²)
  const area = polygonArea([topLeft, topRight, bottomRight, bottomLeft]);
  return area >= 400;
}

/**
 * Calculates output dimensions (width and height) for straightening.
 * Uses natural quadrilateral dimensions or locks to preset standard aspect ratios.
 */
export function calculateOutputDimensions(
  quad: PerspectiveQuad,
  preset: AspectRatioPreset = "auto",
  customRatio?: number
): { width: number; height: number; aspectRatio: number } {
  const { topLeft, topRight, bottomRight, bottomLeft } = quad;

  const topWidth = pointDistance(topLeft, topRight);
  const bottomWidth = pointDistance(bottomLeft, bottomRight);
  const leftHeight = pointDistance(topLeft, bottomLeft);
  const rightHeight = pointDistance(topRight, bottomRight);

  const natWidth = Math.max(10, Math.round(Math.max(topWidth, bottomWidth)));
  const natHeight = Math.max(10, Math.round(Math.max(leftHeight, rightHeight)));

  if (preset === "cr80") {
    // ISO/IEC 7810 ID-1 standard ratio: 85.6 mm / 53.98 mm = ~1.58577
    const cr80Ratio = 85.6 / 53.98;
    if (natWidth >= natHeight) {
      const h = Math.round(natWidth / cr80Ratio);
      return { width: natWidth, height: h, aspectRatio: cr80Ratio };
    } else {
      const w = Math.round(natHeight / cr80Ratio);
      return { width: w, height: natHeight, aspectRatio: 1 / cr80Ratio };
    }
  }

  if (preset === "a4") {
    // ISO 216 standard paper ratio 1 : sqrt(2) = 1.4142
    const a4Ratio = Math.SQRT2;
    if (natWidth >= natHeight) {
      const h = Math.round(natWidth / a4Ratio);
      return { width: natWidth, height: h, aspectRatio: a4Ratio };
    } else {
      const w = Math.round(natHeight / a4Ratio);
      return { width: w, height: natHeight, aspectRatio: 1 / a4Ratio };
    }
  }

  if (preset === "custom" && customRatio && customRatio > 0) {
    const h = Math.round(natWidth / customRatio);
    return { width: natWidth, height: h, aspectRatio: customRatio };
  }

  // Natural aspect ratio (preset === "auto")
  return {
    width: natWidth,
    height: natHeight,
    aspectRatio: natWidth / natHeight,
  };
}

/**
 * Computes the 3x3 homography matrix mapping destination coordinates
 * (u, v) in [0, dstWidth] x [0, dstHeight] back to source coordinates (x, y).
 */
export function computeBackwardHomography(
  srcQuad: PerspectiveQuad,
  dstWidth: number,
  dstHeight: number
): HomographyMatrix {
  const x0 = srcQuad.topLeft.x;
  const y0 = srcQuad.topLeft.y;
  const x1 = srcQuad.topRight.x;
  const y1 = srcQuad.topRight.y;
  const x2 = srcQuad.bottomRight.x;
  const y2 = srcQuad.bottomRight.y;
  const x3 = srcQuad.bottomLeft.x;
  const y3 = srcQuad.bottomLeft.y;

  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const sx = x0 - x1 + x2 - x3;

  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const sy = y0 - y1 + y2 - y3;

  let a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number;

  if (Math.abs(sx) < 1e-10 && Math.abs(sy) < 1e-10) {
    // Parallelogram affine case
    a = x1 - x0;
    b = x3 - x0;
    c = x0;
    d = y1 - y0;
    e = y3 - y0;
    f = y0;
    g = 0;
    h = 0;
  } else {
    // General projective perspective case
    const det = dx1 * dy2 - dy1 * dx2;
    if (Math.abs(det) < 1e-10) {
      // Fallback for near-collinear points
      a = x1 - x0;
      b = x3 - x0;
      c = x0;
      d = y1 - y0;
      e = y3 - y0;
      f = y0;
      g = 0;
      h = 0;
    } else {
      g = (sx * dy2 - sy * dx2) / det;
      h = (dx1 * sy - dy1 * sx) / det;
      a = x1 - x0 + g * x1;
      b = x3 - x0 + h * x3;
      c = x0;
      d = y1 - y0 + g * y1;
      e = y3 - y0 + h * y3;
      f = y0;
    }
  }

  // Scale unit square mapping [0, 1] to destination dimensions [0, dstWidth] x [0, dstHeight]
  const invW = 1 / dstWidth;
  const invH = 1 / dstHeight;

  return {
    m00: a * invW,
    m01: b * invH,
    m02: c,
    m10: d * invW,
    m11: e * invH,
    m12: f,
    m20: g * invW,
    m21: h * invH,
    m22: 1,
  };
}

/**
 * Transforms an image buffer using 4-point backward perspective mapping with bilinear interpolation.
 * Pure mathematical computation compatible with Node.js and Browser.
 */
export function warpPerspectiveBuffer(
  srcBuffer: PixelBuffer,
  srcQuad: PerspectiveQuad,
  dstWidth: number,
  dstHeight: number
): Uint8ClampedArray {
  const { data: src, width: srcW, height: srcH } = srcBuffer;
  const dst = new Uint8ClampedArray(dstWidth * dstHeight * 4);

  const H = computeBackwardHomography(srcQuad, dstWidth, dstHeight);
  const { m00, m01, m02, m10, m11, m12, m20, m21 } = H;

  const maxSrcX = srcW - 1;
  const maxSrcY = srcH - 1;

  for (let v = 0; v < dstHeight; v++) {
    const rowOffset = v * dstWidth * 4;

    // Incremental numerator and denominator values along row v
    let xNum = m01 * v + m02;
    let yNum = m11 * v + m12;
    let denom = m21 * v + 1;

    for (let u = 0; u < dstWidth; u++) {
      const invDenom = 1 / denom;
      const x = xNum * invDenom;
      const y = yNum * invDenom;

      const dstIdx = rowOffset + (u << 2);

      if (x < 0 || x > maxSrcX || y < 0 || y > maxSrcY) {
        // Outside source boundary: clamp to edge pixel
        const cx = Math.max(0, Math.min(maxSrcX, Math.round(x)));
        const cy = Math.max(0, Math.min(maxSrcY, Math.round(y)));
        const srcIdx = (cy * srcW + cx) << 2;
        dst[dstIdx] = src[srcIdx];
        dst[dstIdx + 1] = src[srcIdx + 1];
        dst[dstIdx + 2] = src[srcIdx + 2];
        dst[dstIdx + 3] = src[srcIdx + 3];
      } else {
        // Bilinear interpolation
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const x1 = Math.min(x0 + 1, maxSrcX);
        const y1 = Math.min(y0 + 1, maxSrcY);

        const s = x - x0;
        const t = y - y0;
        const w00 = (1 - s) * (1 - t);
        const w10 = s * (1 - t);
        const w01 = (1 - s) * t;
        const w11 = s * t;

        const idx00 = (y0 * srcW + x0) << 2;
        const idx10 = (y0 * srcW + x1) << 2;
        const idx01 = (y1 * srcW + x0) << 2;
        const idx11 = (y1 * srcW + x1) << 2;

        dst[dstIdx] =
          w00 * src[idx00] +
          w10 * src[idx10] +
          w01 * src[idx01] +
          w11 * src[idx11];
        dst[dstIdx + 1] =
          w00 * src[idx00 + 1] +
          w10 * src[idx10 + 1] +
          w01 * src[idx01 + 1] +
          w11 * src[idx11 + 1];
        dst[dstIdx + 2] =
          w00 * src[idx00 + 2] +
          w10 * src[idx10 + 2] +
          w01 * src[idx01 + 2] +
          w11 * src[idx11 + 2];
        dst[dstIdx + 3] =
          w00 * src[idx00 + 3] +
          w10 * src[idx10 + 3] +
          w01 * src[idx01 + 3] +
          w11 * src[idx11 + 3];
      }

      xNum += m00;
      yNum += m10;
      denom += m20;
    }
  }

  return dst;
}

/**
 * Browser Canvas-based perspective transformation engine.
 * Takes an image element, extracts pixels, warps perspective at full resolution,
 * and creates an ephemeral Blob and object URL.
 */
export async function warpPerspectiveCanvas(
  imageSource: HTMLImageElement | HTMLCanvasElement,
  srcQuad: PerspectiveQuad,
  dstWidth: number,
  dstHeight: number,
  mimeType: "image/png" | "image/jpeg" = "image/png",
  quality = 0.95
): Promise<{
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
  fileSizeFormatted: string;
}> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("warpPerspectiveCanvas requires browser Canvas API");
  }

  // 1. Render source image to offscreen canvas to obtain raw RGBA data
  const srcW = "naturalWidth" in imageSource ? imageSource.naturalWidth : imageSource.width;
  const srcH = "naturalHeight" in imageSource ? imageSource.naturalHeight : imageSource.height;

  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = srcW;
  srcCanvas.height = srcH;
  const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true });
  if (!srcCtx) throw new Error("Could not create source canvas 2D context");
  srcCtx.drawImage(imageSource, 0, 0);

  const srcImageData = srcCtx.getImageData(0, 0, srcW, srcH);
  const srcBuffer: PixelBuffer = {
    data: srcImageData.data,
    width: srcW,
    height: srcH,
  };

  // 2. Perform perspective warp with bilinear interpolation
  const warpedPixels = warpPerspectiveBuffer(srcBuffer, srcQuad, dstWidth, dstHeight);

  // 3. Put pixels onto destination canvas
  const dstCanvas = document.createElement("canvas");
  dstCanvas.width = dstWidth;
  dstCanvas.height = dstHeight;
  const dstCtx = dstCanvas.getContext("2d");
  if (!dstCtx) throw new Error("Could not create destination canvas 2D context");

  const dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
  dstImageData.data.set(warpedPixels);
  dstCtx.putImageData(dstImageData, 0, 0);

  // 4. Convert to Blob
  return new Promise((resolve, reject) => {
    dstCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to generate straightened image blob"));
          return;
        }

        const previewUrl = URL.createObjectURL(blob);
        const sizeKb = blob.size / 1024;
        const fileSizeFormatted =
          sizeKb >= 1024
            ? `${(sizeKb / 1024).toFixed(2)} MB`
            : `${Math.round(sizeKb)} KB`;

        // Free intermediate source canvas
        srcCanvas.width = 0;
        srcCanvas.height = 0;
        dstCanvas.width = 0;
        dstCanvas.height = 0;

        resolve({
          blob,
          previewUrl,
          width: dstWidth,
          height: dstHeight,
          fileSizeFormatted,
        });
      },
      mimeType,
      quality
    );
  });
}

/**
 * Rotates a 2D point around the center of an image of given dimensions.
 */
export function rotatePoint(
  p: Point2D,
  angleDegrees: number,
  srcWidth: number,
  srcHeight: number
): Point2D {
  const normAngle = ((angleDegrees % 360) + 360) % 360;
  if (normAngle === 0) return { x: p.x, y: p.y };

  if (normAngle === 90) {
    return { x: srcHeight - 1 - p.y, y: p.x };
  }
  if (normAngle === 180) {
    return { x: srcWidth - 1 - p.x, y: srcHeight - 1 - p.y };
  }
  if (normAngle === 270) {
    return { x: p.y, y: srcWidth - 1 - p.x };
  }

  return { x: p.x, y: p.y };
}

/**
 * Rotates all 4 corners of a perspective quadrilateral by 90-degree increments.
 */
export function rotatePerspectiveQuad(
  quad: PerspectiveQuad,
  angleDegrees: number,
  srcWidth: number,
  srcHeight: number
): PerspectiveQuad {
  const normAngle = ((angleDegrees % 360) + 360) % 360;
  if (normAngle === 0) return { ...quad };

  // When rotating clockwise:
  // After 90 deg: TL -> TR, TR -> BR, BR -> BL, BL -> TL
  const rTL = rotatePoint(quad.topLeft, normAngle, srcWidth, srcHeight);
  const rTR = rotatePoint(quad.topRight, normAngle, srcWidth, srcHeight);
  const rBR = rotatePoint(quad.bottomRight, normAngle, srcWidth, srcHeight);
  const rBL = rotatePoint(quad.bottomLeft, normAngle, srcWidth, srcHeight);

  if (normAngle === 90) {
    return {
      topLeft: rBL,
      topRight: rTL,
      bottomRight: rTR,
      bottomLeft: rBR,
    };
  }
  if (normAngle === 180) {
    return {
      topLeft: rBR,
      topRight: rBL,
      bottomRight: rTL,
      bottomLeft: rTR,
    };
  }
  if (normAngle === 270) {
    return {
      topLeft: rTR,
      topRight: rBR,
      bottomRight: rBL,
      bottomLeft: rTL,
    };
  }

  return { ...quad };
}

/**
 * Creates a default inset quadrilateral (e.g. 10% margin from borders) for a given dimension.
 */
export function createDefaultQuad(width: number, height: number, insetRatio = 0.1): PerspectiveQuad {
  const mx = Math.round(width * insetRatio);
  const my = Math.round(height * insetRatio);

  return {
    topLeft: { x: mx, y: my },
    topRight: { x: width - mx, y: my },
    bottomRight: { x: width - mx, y: height - my },
    bottomLeft: { x: mx, y: height - my },
  };
}
