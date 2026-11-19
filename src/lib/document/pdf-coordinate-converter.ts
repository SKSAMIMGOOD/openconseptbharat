/**
 * Document Studio — Non-Destructive PDF Coordinate Conversion & Vector Placement Layer
 *
 * Provides pure mathematical coordinate transformation between:
 * 1. Document Studio Canvas Crop coordinates (top-left origin, Y-down, pixels)
 * 2. PDF User Unit Points (bottom-left origin, Y-up, 72 pt/inch)
 *
 * Accounts for:
 * - PDF MediaBox and CropBox origin offsets (e.g., non-zero [x, y])
 * - Viewport rasterization scale factor
 * - Intrinsic PDF page rotation (0°, 90°, 180°, 270°)
 * - User-applied UI rotation & print arrangement rotation (e.g. 4x6 foldable back)
 * - Proportional CR80 aspect ratio placement without pixel stretching
 */

import { degrees, type Rotation, type PDFPage } from "pdf-lib";
import type { CropCoordinates } from "@/types/crop";

export interface PdfBoundingBox {
  left: number;
  bottom: number;
  right: number;
  top: number;
}

export interface RotatedPlacementResult {
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: Rotation;
}

export interface ProportionalFitResult {
  x: number;
  y: number;
  width: number;
  height: number;
  scaleFactor: number;
}

export interface MinimalPdfPageLike {
  getWidth: () => number;
  getHeight: () => number;
  getMediaBox?: () => { x: number; y: number; width: number; height: number };
  getCropBox?: () => { x: number; y: number; width: number; height: number };
  getRotation?: () => { angle: number };
}

/**
 * Maps a canvas-based CropCoordinates rectangle (X, Y, Width, Height)
 * into exact unrotated PDF page user units (points) for pdf-lib's `embedPage(page, boundingBox)`.
 *
 * Strictly accounts for:
 * - Canvas resolution / dimensions (W, H)
 * - Intrinsic PDF page rotation (0°, 90°, 180°, 270°)
 * - PDF MediaBox / CropBox origins (e.g. non-zero x, y)
 */
export function mapCanvasCropToPdfBoundingBox(
  crop: CropCoordinates,
  canvasDimensions: { width: number; height: number },
  pdfPage: MinimalPdfPageLike
): PdfBoundingBox {
  const box =
    (pdfPage.getCropBox ? pdfPage.getCropBox() : null) ||
    (pdfPage.getMediaBox ? pdfPage.getMediaBox() : null) || {
      x: 0,
      y: 0,
      width: pdfPage.getWidth(),
      height: pdfPage.getHeight(),
    };

  const pageW = box.width;
  const pageH = box.height;
  const originX = box.x;
  const originY = box.y;

  const rawRotation = pdfPage.getRotation ? pdfPage.getRotation().angle : 0;
  const pageRotation = ((rawRotation % 360) + 360) % 360;

  const canvasW = Math.max(1, canvasDimensions.width);
  const canvasH = Math.max(1, canvasDimensions.height);

  // Normalized coordinates (0.0 to 1.0) on the rendered canvas viewport
  const u0 = Math.max(0, Math.min(1, crop.x / canvasW));
  const u1 = Math.max(0, Math.min(1, (crop.x + crop.width) / canvasW));
  const v0 = Math.max(0, Math.min(1, crop.y / canvasH));
  const v1 = Math.max(0, Math.min(1, (crop.y + crop.height) / canvasH));

  let left: number;
  let right: number;
  let bottom: number;
  let top: number;

  switch (pageRotation) {
    case 90:
      // In 90° clockwise page rotation:
      // Canvas width maps to pageH, canvas height maps to pageW.
      // Top-left of canvas corresponds to (originX, originY) in unrotated space.
      left = originX + v0 * pageW;
      right = originX + v1 * pageW;
      bottom = originY + u0 * pageH;
      top = originY + u1 * pageH;
      break;

    case 180:
      // In 180° page rotation:
      // Moving right on canvas decreases X in unrotated space.
      // Moving down on canvas increases Y in unrotated space.
      left = originX + (1 - u1) * pageW;
      right = originX + (1 - u0) * pageW;
      bottom = originY + v0 * pageH;
      top = originY + v1 * pageH;
      break;

    case 270:
      // In 270° clockwise (90° CCW) page rotation:
      left = originX + (1 - v1) * pageW;
      right = originX + (1 - v0) * pageW;
      bottom = originY + (1 - u1) * pageH;
      top = originY + (1 - u0) * pageH;
      break;

    case 0:
    default:
      // Standard unrotated page:
      // Origin (0,0) is bottom-left. Canvas (0,0) is top-left.
      left = originX + u0 * pageW;
      right = originX + u1 * pageW;
      bottom = originY + (1 - v1) * pageH;
      top = originY + (1 - v0) * pageH;
      break;
  }

  // Ensure left <= right and bottom <= top
  const clampedBox: PdfBoundingBox = {
    left: Math.min(left, right),
    bottom: Math.min(bottom, top),
    right: Math.max(left, right),
    top: Math.max(bottom, top),
  };

  return clampedBox;
}

/**
 * Calculates the exact placement coordinates (x, y) and rotation object
 * for pdf-lib's `page.drawPage` or `page.drawImage`.
 *
 * In pdf-lib, rotation around (x, y) is counter-clockwise.
 * This function translates the placement point so that a rotated element
 * aligns cleanly within its intended bounding slot [targetX, targetY, width, height].
 */
export function getRotatedPlacement(
  targetX: number,
  targetY: number,
  width: number,
  height: number,
  clockwiseAngleDegrees: number = 0
): RotatedPlacementResult {
  const normAngle = ((clockwiseAngleDegrees % 360) + 360) % 360;

  // In PDF coordinate space, positive angles are counter-clockwise.
  // Clockwise rotation C corresponds to CCW angle (360 - C) % 360.
  const ccwAngle = (360 - normAngle) % 360;

  switch (normAngle) {
    case 90:
      // 90° clockwise = 270° CCW
      // Element rotates from (targetX, targetY) into positive Y, so adjust x by width
      return {
        x: targetX,
        y: targetY + width,
        width,
        height,
        rotate: degrees(ccwAngle),
      };

    case 180:
      // 180° rotation
      return {
        x: targetX + width,
        y: targetY + height,
        width,
        height,
        rotate: degrees(ccwAngle),
      };

    case 270:
      // 270° clockwise = 90° CCW
      return {
        x: targetX + height,
        y: targetY,
        width,
        height,
        rotate: degrees(ccwAngle),
      };

    case 0:
    default:
      return {
        x: targetX,
        y: targetY,
        width,
        height,
        rotate: degrees(0),
      };
  }
}

/**
 * Proportionally scales a cropped card (widthPt x heightPt) to fit inside
 * the target slot (targetWPt x targetHPt) without stretching or skewing,
 * centering it inside the allocated slot.
 */
export function calculateProportionalCardFit(
  cardWidthPt: number,
  cardHeightPt: number,
  targetWPt: number,
  targetHPt: number,
  targetXPt: number = 0,
  targetYPt: number = 0
): ProportionalFitResult {
  if (cardWidthPt <= 0 || cardHeightPt <= 0 || targetWPt <= 0 || targetHPt <= 0) {
    return {
      x: targetXPt,
      y: targetYPt,
      width: targetWPt,
      height: targetHPt,
      scaleFactor: 1.0,
    };
  }

  const scaleX = targetWPt / cardWidthPt;
  const scaleY = targetHPt / cardHeightPt;
  const scaleFactor = Math.min(scaleX, scaleY);

  const drawWidth = Number((cardWidthPt * scaleFactor).toFixed(4));
  const drawHeight = Number((cardHeightPt * scaleFactor).toFixed(4));

  const padX = Number(((targetWPt - drawWidth) / 2).toFixed(4));
  const padY = Number(((targetHPt - drawHeight) / 2).toFixed(4));

  return {
    x: targetXPt + padX,
    y: targetYPt + padY,
    width: drawWidth,
    height: drawHeight,
    scaleFactor,
  };
}
