import { CardSpecification, CropCoordinates } from "@/types/crop";

const MM_PER_INCH = 25.4;

/**
 * Converts millimeters to pixels based on target DPI (dots per inch).
 */
export function mmToPixels(mm: number, dpi: number = 300): number {
  return Math.round((mm / MM_PER_INCH) * dpi);
}

/**
 * Converts pixels to millimeters based on target DPI.
 */
export function pixelsToMm(pixels: number, dpi: number = 300): number {
  return (pixels / dpi) * MM_PER_INCH;
}

/**
 * Calculates standard card dimensions in pixels for a given card specification and DPI.
 */
export function getCardDimensionsInPixels(spec: CardSpecification, dpi: number = 300): { width: number; height: number } {
  return {
    width: mmToPixels(spec.targetWidthMm, dpi),
    height: mmToPixels(spec.targetHeightMm, dpi),
  };
}

/**
 * Adjusts crop coordinates to strictly maintain the target aspect ratio.
 */
export function enforceAspectRatio(
  crop: CropCoordinates,
  targetRatio: number,
  containerBounds: { width: number; height: number }
): CropCoordinates {
  let { x, y, width, height } = crop;

  const currentRatio = width / height;

  if (currentRatio > targetRatio) {
    // Current width is too wide; adjust width
    width = height * targetRatio;
  } else {
    // Current height is too tall; adjust height
    height = width / targetRatio;
  }

  // Constrain inside container bounds
  if (x + width > containerBounds.width) {
    x = containerBounds.width - width;
  }
  if (y + height > containerBounds.height) {
    y = containerBounds.height - height;
  }

  return {
    x: Math.max(0, x),
    y: Math.max(0, y),
    width,
    height,
  };
}
