/**
 * Pure Mathematical Crop Geometry Engine (Phase 03C)
 *
 * Implements coordinate transformations, aspect-ratio constraint snapping,
 * 8-handle directional resizing, centering, fitting, boundary clamping,
 * and high-fidelity canvas crop rendering.
 *
 * ZERO UI / React dependencies; fully testable in Node test runner.
 */

import type { CropCoordinates } from "@/types/crop";
import type { CropHandle } from "@/types/crop-preset";

export type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
export type AnyCanvasContext =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D;

/**
 * Creates an OffscreenCanvas if supported, or an HTMLCanvasElement in DOM environments.
 */
export function createCanvasBuffer(width: number, height: number): AnyCanvas {
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));

  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(safeWidth, safeHeight);
  }

  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = safeWidth;
    canvas.height = safeHeight;
    return canvas;
  }

  throw new Error("Canvas is not supported in this runtime environment.");
}

export const MIN_CROP_PIXELS = 24;

/**
 * Initializes a default centered crop rectangle for a given image and aspect ratio.
 * Typically fills ~85% of the limiting dimension to give a comfortable initial framing.
 */
export function initDefaultCrop(
  imageWidth: number,
  imageHeight: number,
  targetAspectRatio: number | null,
  fillRatio: number = 0.85
): CropCoordinates {
  const safeImgW = Math.max(1, Math.round(imageWidth));
  const safeImgH = Math.max(1, Math.round(imageHeight));

  if (!targetAspectRatio || targetAspectRatio <= 0) {
    // Free mode: 85% centered box
    const width = Math.max(MIN_CROP_PIXELS, Math.round(safeImgW * fillRatio));
    const height = Math.max(MIN_CROP_PIXELS, Math.round(safeImgH * fillRatio));
    const x = Math.round((safeImgW - width) / 2);
    const y = Math.round((safeImgH - height) / 2);
    return { x, y, width, height };
  }

  // Target aspect ratio = width / height
  const maxW = safeImgW * fillRatio;
  const maxH = safeImgH * fillRatio;

  let width: number;
  let height: number;

  if (maxW / maxH > targetAspectRatio) {
    // Limited by height
    height = Math.round(maxH);
    width = Math.round(height * targetAspectRatio);
  } else {
    // Limited by width
    width = Math.round(maxW);
    height = Math.round(width / targetAspectRatio);
  }

  // Safety clamps
  width = Math.max(MIN_CROP_PIXELS, Math.min(safeImgW, width));
  height = Math.max(MIN_CROP_PIXELS, Math.min(safeImgH, height));

  const x = Math.max(0, Math.round((safeImgW - width) / 2));
  const y = Math.max(0, Math.round((safeImgH - height) / 2));

  return { x, y, width, height };
}

/**
 * Validates and strictly clamps crop coordinates inside the parent image boundaries.
 * Prevents negative coordinates, zero dimensions, NaNs, and out-of-bounds overflows.
 */
export function clampCropToBounds(
  crop: CropCoordinates,
  imageWidth: number,
  imageHeight: number,
  aspectRatio: number | null = null,
  minSize: number = MIN_CROP_PIXELS
): CropCoordinates {
  const imgW = Math.max(minSize, Math.round(imageWidth));
  const imgH = Math.max(minSize, Math.round(imageHeight));

  let width = Math.max(minSize, Math.min(imgW, Math.round(crop.width || minSize)));
  let height = Math.max(minSize, Math.min(imgH, Math.round(crop.height || minSize)));

  if (aspectRatio && aspectRatio > 0) {
    if (width / height > aspectRatio) {
      width = Math.max(minSize, Math.round(height * aspectRatio));
    } else {
      height = Math.max(minSize, Math.round(width / aspectRatio));
    }

    if (width > imgW) {
      width = imgW;
      height = Math.max(minSize, Math.round(width / aspectRatio));
    }
    if (height > imgH) {
      height = imgH;
      width = Math.max(minSize, Math.round(height * aspectRatio));
    }
  }

  const maxX = Math.max(0, imgW - width);
  const maxY = Math.max(0, imgH - height);

  const x = Math.max(0, Math.min(maxX, Math.round(crop.x || 0)));
  const y = Math.max(0, Math.min(maxY, Math.round(crop.y || 0)));

  return { x, y, width, height };
}

/**
 * Smoothly recalculates crop frame when the user changes photo presets or aspect ratio,
 * centered around the existing crop position without unnecessarily resetting the uploaded photo.
 */
export function recalculateCropForAspectRatio(
  currentCrop: CropCoordinates,
  imageWidth: number,
  imageHeight: number,
  newAspectRatio: number | null,
  minSize: number = MIN_CROP_PIXELS
): CropCoordinates {
  const imgW = Math.max(minSize, Math.round(imageWidth));
  const imgH = Math.max(minSize, Math.round(imageHeight));

  if (!newAspectRatio || newAspectRatio <= 0) {
    return clampCropToBounds(currentCrop, imgW, imgH, null, minSize);
  }

  // Preserve center point of current crop
  const cx = currentCrop.x + currentCrop.width / 2;
  const cy = currentCrop.y + currentCrop.height / 2;

  // Use current crop area as reference scale
  const currentArea = Math.max(minSize * minSize, currentCrop.width * currentCrop.height);

  let newHeight = Math.sqrt(currentArea / newAspectRatio);
  let newWidth = newHeight * newAspectRatio;

  // Clamp if calculated dimensions exceed image bounds
  if (newWidth > imgW) {
    newWidth = imgW;
    newHeight = newWidth / newAspectRatio;
  }
  if (newHeight > imgH) {
    newHeight = imgH;
    newWidth = newHeight * newAspectRatio;
  }

  newWidth = Math.max(minSize, Math.round(newWidth));
  newHeight = Math.max(minSize, Math.round(newHeight));

  // Position around current center
  let x = Math.round(cx - newWidth / 2);
  let y = Math.round(cy - newHeight / 2);

  // Shift inside image bounds
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  if (x + newWidth > imgW) x = imgW - newWidth;
  if (y + newHeight > imgH) y = imgH - newHeight;

  return {
    x: Math.max(0, x),
    y: Math.max(0, y),
    width: newWidth,
    height: newHeight,
  };
}

/**
 * Moves/pans the crop rectangle by deltaX and deltaY within image boundaries.
 */
export function moveCrop(
  crop: CropCoordinates,
  deltaX: number,
  deltaY: number,
  imageWidth: number,
  imageHeight: number
): CropCoordinates {
  const imgW = Math.max(crop.width, Math.round(imageWidth));
  const imgH = Math.max(crop.height, Math.round(imageHeight));

  const maxX = Math.max(0, imgW - crop.width);
  const maxY = Math.max(0, imgH - crop.height);

  const x = Math.max(0, Math.min(maxX, Math.round(crop.x + deltaX)));
  const y = Math.max(0, Math.min(maxY, Math.round(crop.y + deltaY)));

  return {
    x,
    y,
    width: crop.width,
    height: crop.height,
  };
}

/**
 * Centers the crop frame inside the image.
 */
export function centerCropInImage(
  crop: CropCoordinates,
  imageWidth: number,
  imageHeight: number
): CropCoordinates {
  const imgW = Math.max(crop.width, Math.round(imageWidth));
  const imgH = Math.max(crop.height, Math.round(imageHeight));

  const x = Math.max(0, Math.round((imgW - crop.width) / 2));
  const y = Math.max(0, Math.round((imgH - crop.height) / 2));

  return {
    x,
    y,
    width: crop.width,
    height: crop.height,
  };
}

/**
 * Fits the crop frame to maximize image area while maintaining aspect ratio (or full image if free).
 */
export function fitCropToImage(
  imageWidth: number,
  imageHeight: number,
  aspectRatio: number | null
): CropCoordinates {
  const imgW = Math.max(1, Math.round(imageWidth));
  const imgH = Math.max(1, Math.round(imageHeight));

  if (!aspectRatio || aspectRatio <= 0) {
    return { x: 0, y: 0, width: imgW, height: imgH };
  }

  let width: number;
  let height: number;

  if (imgW / imgH > aspectRatio) {
    // Wider than aspect ratio: fit to height
    height = imgH;
    width = Math.round(height * aspectRatio);
  } else {
    // Taller than aspect ratio: fit to width
    width = imgW;
    height = Math.round(width / aspectRatio);
  }

  const x = Math.max(0, Math.round((imgW - width) / 2));
  const y = Math.max(0, Math.round((imgH - height) / 2));

  return { x, y, width, height };
}

/**
 * Directional resizing from any of the 8 resize handles.
 * Strictly maintains target aspect ratio if specified, anchoring against the opposite point.
 */
export function resizeCropFromHandle(
  crop: CropCoordinates,
  handle: CropHandle,
  deltaX: number,
  deltaY: number,
  imageWidth: number,
  imageHeight: number,
  aspectRatio: number | null = null,
  minSize: number = MIN_CROP_PIXELS
): CropCoordinates {
  const imgW = Math.max(minSize, Math.round(imageWidth));
  const imgH = Math.max(minSize, Math.round(imageHeight));

  let { x, y, width, height } = crop;

  // FREE CROP MODE: direct boundary movement
  if (!aspectRatio || aspectRatio <= 0) {
    switch (handle) {
      case "e": {
        const newW = Math.max(minSize, Math.min(imgW - x, width + deltaX));
        return { x, y, width: newW, height };
      }
      case "w": {
        const maxDelta = width - minSize;
        const clampedDelta = Math.max(-x, Math.min(maxDelta, deltaX));
        return { x: x + clampedDelta, y, width: width - clampedDelta, height };
      }
      case "s": {
        const newH = Math.max(minSize, Math.min(imgH - y, height + deltaY));
        return { x, y, width, height: newH };
      }
      case "n": {
        const maxDelta = height - minSize;
        const clampedDelta = Math.max(-y, Math.min(maxDelta, deltaY));
        return { x, y: y + clampedDelta, width, height: height - clampedDelta };
      }
      case "se": {
        const newW = Math.max(minSize, Math.min(imgW - x, width + deltaX));
        const newH = Math.max(minSize, Math.min(imgH - y, height + deltaY));
        return { x, y, width: newW, height: newH };
      }
      case "sw": {
        const maxDeltaX = width - minSize;
        const clampedDeltaX = Math.max(-x, Math.min(maxDeltaX, deltaX));
        const newH = Math.max(minSize, Math.min(imgH - y, height + deltaY));
        return { x: x + clampedDeltaX, y, width: width - clampedDeltaX, height: newH };
      }
      case "ne": {
        const newW = Math.max(minSize, Math.min(imgW - x, width + deltaX));
        const maxDeltaY = height - minSize;
        const clampedDeltaY = Math.max(-y, Math.min(maxDeltaY, deltaY));
        return { x, y: y + clampedDeltaY, width: newW, height: height - clampedDeltaY };
      }
      case "nw": {
        const maxDeltaX = width - minSize;
        const clampedDeltaX = Math.max(-x, Math.min(maxDeltaX, deltaX));
        const maxDeltaY = height - minSize;
        const clampedDeltaY = Math.max(-y, Math.min(maxDeltaY, deltaY));
        return {
          x: x + clampedDeltaX,
          y: y + clampedDeltaY,
          width: width - clampedDeltaX,
          height: height - clampedDeltaY,
        };
      }
      default:
        return crop;
    }
  }

  // FIXED ASPECT RATIO MODE
  const R = aspectRatio;

  switch (handle) {
    case "se": {
      // Anchor: Top-Left (x, y)
      let newW = width + deltaX;
      let newH = newW / R;

      // Bound checking
      if (x + newW > imgW) {
        newW = imgW - x;
        newH = newW / R;
      }
      if (y + newH > imgH) {
        newH = imgH - y;
        newW = newH * R;
      }

      newW = Math.max(minSize, Math.round(newW));
      newH = Math.max(minSize, Math.round(newH));
      return { x, y, width: newW, height: newH };
    }

    case "sw": {
      // Anchor: Top-Right (x + width, y)
      const anchorRight = x + width;
      let newW = width - deltaX;
      let newH = newW / R;

      if (anchorRight - newW < 0) {
        newW = anchorRight;
        newH = newW / R;
      }
      if (y + newH > imgH) {
        newH = imgH - y;
        newW = newH * R;
      }

      newW = Math.max(minSize, Math.round(newW));
      newH = Math.max(minSize, Math.round(newH));
      return { x: anchorRight - newW, y, width: newW, height: newH };
    }

    case "ne": {
      // Anchor: Bottom-Left (x, y + height)
      const anchorBottom = y + height;
      let newW = width + deltaX;
      let newH = newW / R;

      if (x + newW > imgW) {
        newW = imgW - x;
        newH = newW / R;
      }
      if (anchorBottom - newH < 0) {
        newH = anchorBottom;
        newW = newH * R;
      }

      newW = Math.max(minSize, Math.round(newW));
      newH = Math.max(minSize, Math.round(newH));
      return { x, y: anchorBottom - newH, width: newW, height: newH };
    }

    case "nw": {
      // Anchor: Bottom-Right (x + width, y + height)
      const anchorRight = x + width;
      const anchorBottom = y + height;
      let newW = width - deltaX;
      let newH = newW / R;

      if (anchorRight - newW < 0) {
        newW = anchorRight;
        newH = newW / R;
      }
      if (anchorBottom - newH < 0) {
        newH = anchorBottom;
        newW = newH * R;
      }

      newW = Math.max(minSize, Math.round(newW));
      newH = Math.max(minSize, Math.round(newH));
      return {
        x: anchorRight - newW,
        y: anchorBottom - newH,
        width: newW,
        height: newH,
      };
    }

    case "e": {
      // Anchor: Left (x). Symmetrically scale height around center Y.
      const centerY = y + height / 2;
      let newW = Math.max(minSize, Math.min(imgW - x, width + deltaX));
      let newH = newW / R;

      if (newH > imgH) {
        newH = imgH;
        newW = newH * R;
      }

      let newY = Math.round(centerY - newH / 2);
      if (newY < 0) newY = 0;
      if (newY + newH > imgH) newY = imgH - newH;

      return { x, y: newY, width: Math.round(newW), height: Math.round(newH) };
    }

    case "w": {
      // Anchor: Right (x + width). Symmetrically scale height around center Y.
      const anchorRight = x + width;
      const centerY = y + height / 2;
      let newW = Math.max(minSize, Math.min(anchorRight, width - deltaX));
      let newH = newW / R;

      if (newH > imgH) {
        newH = imgH;
        newW = newH * R;
      }

      let newY = Math.round(centerY - newH / 2);
      if (newY < 0) newY = 0;
      if (newY + newH > imgH) newY = imgH - newH;

      return {
        x: Math.round(anchorRight - newW),
        y: newY,
        width: Math.round(newW),
        height: Math.round(newH),
      };
    }

    case "s": {
      // Anchor: Top (y). Symmetrically scale width around center X.
      const centerX = x + width / 2;
      let newH = Math.max(minSize, Math.min(imgH - y, height + deltaY));
      let newW = newH * R;

      if (newW > imgW) {
        newW = imgW;
        newH = newW / R;
      }

      let newX = Math.round(centerX - newW / 2);
      if (newX < 0) newX = 0;
      if (newX + newW > imgW) newX = imgW - newW;

      return { x: newX, y, width: Math.round(newW), height: Math.round(newH) };
    }

    case "n": {
      // Anchor: Bottom (y + height). Symmetrically scale width around center X.
      const anchorBottom = y + height;
      const centerX = x + width / 2;
      let newH = Math.max(minSize, Math.min(anchorBottom, height - deltaY));
      let newW = newH * R;

      if (newW > imgW) {
        newW = imgW;
        newH = newW / R;
      }

      let newX = Math.round(centerX - newW / 2);
      if (newX < 0) newX = 0;
      if (newX + newW > imgW) newX = imgW - newW;

      return {
        x: newX,
        y: Math.round(anchorBottom - newH),
        width: Math.round(newW),
        height: Math.round(newH),
      };
    }

    default:
      return crop;
  }
}

/**
 * High-quality canvas crop rendering.
 * Renders source image crop region onto a new Canvas buffer with optional background fill.
 * Preserves alpha transparency when backgroundColor is "transparent".
 */
export function renderCropCanvas(
  source: CanvasImageSource,
  crop: CropCoordinates,
  outputWidth: number,
  outputHeight: number,
  backgroundColor: string = "transparent"
): AnyCanvas {
  const safeOutW = Math.max(1, Math.round(outputWidth));
  const safeOutH = Math.max(1, Math.round(outputHeight));

  const canvas = createCanvasBuffer(safeOutW, safeOutH);
  const ctx = canvas.getContext("2d") as AnyCanvasContext;

  if (!ctx) {
    throw new Error("Unable to obtain 2D rendering context.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Optional background color fill
  if (backgroundColor && backgroundColor !== "transparent") {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, safeOutW, safeOutH);
  } else {
    ctx.clearRect(0, 0, safeOutW, safeOutH);
  }

  // Draw cropped slice stretched to target output size with bicubic smoothing
  ctx.drawImage(
    source,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    safeOutW,
    safeOutH
  );

  return canvas;
}
