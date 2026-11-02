/**
 * Physical Dimension Unit Converter & Custom Dimensions Validator (Phase 03C & 03G)
 *
 * Implements pure unit conversion math (mm, cm, inches), decimal precision handling,
 * DPI-based pixel projection, browser safety validation, and live aspect-ratio calculation.
 * Zero UI dependencies; strictly executes in browser or Node test harnesses.
 */

import type { DimensionUnit, CustomDimensionsInput } from "../../types/crop-preset";

export const MM_PER_INCH = 25.4;
export const MM_PER_CM = 10;
export const CM_PER_INCH = 2.54;
export const MIN_DIMENSION_MM = 1;
export const MAX_DIMENSION_MM = 1000;

export const MIN_DPI = 30;
export const MAX_DPI = 2400;
export const DEFAULT_CUSTOM_DPI = 300;

/** Safety threshold to prevent browser canvas crash from excessive memory allocation */
export const MAX_SAFE_PIXEL_DIMENSION = 10000;
export const MAX_SAFE_TOTAL_PIXELS = 50_000_000; // 50 Megapixels

/**
 * Calculates human-readable aspect ratio label.
 * Identifies common ratios within 1.5% tolerance.
 */
export function getFriendlyAspectRatioName(ratio: number): string {
  if (!ratio || isNaN(ratio) || !isFinite(ratio) || ratio <= 0) return "1:1";

  const commonRatios: Array<{ name: string; value: number }> = [
    { name: "1:1 Square", value: 1.0 },
    { name: "35:45 Passport", value: 35 / 45 }, // ~0.778
    { name: "4:5 Portrait", value: 4 / 5 }, // 0.8
    { name: "3:4 Portrait", value: 3 / 4 }, // 0.75
    { name: "2:3 Portrait", value: 2 / 3 }, // ~0.667
    { name: "16:9 Landscape", value: 16 / 9 }, // ~1.778
    { name: "4:3 Landscape", value: 4 / 3 }, // ~1.333
  ];

  for (const { name, value } of commonRatios) {
    if (Math.abs(ratio - value) / value < 0.015) {
      return name;
    }
  }

  return `${ratio.toFixed(2)}:1`;
}

/**
 * Converts any value in a supported unit into physical millimeters (canonical unit).
 */
export function unitToMm(value: number, unit: DimensionUnit): number {
  if (typeof value !== "number" || isNaN(value) || !isFinite(value)) return 0;
  switch (unit) {
    case "mm":
      return value;
    case "cm":
      return value * MM_PER_CM;
    case "inch":
      return value * MM_PER_INCH;
    default:
      return value;
  }
}

/**
 * Converts physical millimeters into a target unit.
 */
export function mmToUnit(mm: number, targetUnit: DimensionUnit): number {
  if (typeof mm !== "number" || isNaN(mm) || !isFinite(mm)) return 0;
  switch (targetUnit) {
    case "mm":
      return mm;
    case "cm":
      return mm / MM_PER_CM;
    case "inch":
      return mm / MM_PER_INCH;
    default:
      return mm;
  }
}

/**
 * Converts a dimension value directly between any two supported units.
 * Supports configurable decimal rounding (defaults to 2 decimal places for clean UI).
 */
export function convertUnit(
  value: number,
  fromUnit: DimensionUnit,
  toUnit: DimensionUnit,
  decimals: number = 2
): number {
  if (typeof value !== "number" || isNaN(value) || !isFinite(value)) return 0;
  if (fromUnit === toUnit) return value;

  const mm = unitToMm(value, fromUnit);
  const targetVal = mmToUnit(mm, toUnit);

  const factor = Math.pow(10, decimals);
  return Math.round(targetVal * factor) / factor;
}

/**
 * Formats a dimension value with its unit symbol for clear UI representation.
 */
export function formatDimension(
  value: number,
  unit: DimensionUnit,
  decimals?: number
): string {
  const dec = decimals ?? (unit === "inch" ? 2 : unit === "cm" ? 1 : 0);
  const formatted = value % 1 === 0 ? value.toString() : value.toFixed(dec);
  const unitLabel = unit === "inch" ? "in" : unit;
  return `${formatted} ${unitLabel}`;
}

/**
 * Computes the aspect ratio (width / height) from given dimensions.
 */
export function calculateAspectRatio(width: number, height: number): number {
  if (typeof width !== "number" || typeof height !== "number") return 1;
  if (isNaN(width) || isNaN(height) || !isFinite(width) || !isFinite(height)) return 1;
  if (height <= 0 || width <= 0) return 1;
  return width / height;
}

/**
 * Calculates pixel dimension from physical dimension and unit at a given DPI.
 *
 * Formula:
 * Pixels = (physical dimension in inches × DPI)
 * or:
 * Pixels = (dimension in mm / 25.4) × DPI
 *
 * Rounding: nearest integer (Math.round).
 */
export function calculateDimensionPixels(
  value: number,
  unit: DimensionUnit,
  dpi: number
): number {
  if (typeof value !== "number" || isNaN(value) || !isFinite(value) || value <= 0) return 0;
  if (typeof dpi !== "number" || isNaN(dpi) || !isFinite(dpi) || dpi <= 0) return 0;

  if (unit === "inch") {
    return Math.round(value * dpi);
  }
  const mm = unitToMm(value, unit);
  return Math.round((mm / MM_PER_INCH) * dpi);
}

export interface CustomPhotoPixelCalculation {
  widthPx: number;
  heightPx: number;
  widthMm: number;
  heightMm: number;
  aspectRatio: number;
  friendlyAspectRatio: string;
}

/**
 * Calculates live pixel dimensions, physical millimeters, and aspect ratio for custom photo dimensions.
 */
export function calculateCustomPhotoPixels(
  width: number,
  height: number,
  unit: DimensionUnit,
  dpi: number = DEFAULT_CUSTOM_DPI
): CustomPhotoPixelCalculation {
  const widthMm = unitToMm(width, unit);
  const heightMm = unitToMm(height, unit);
  const widthPx = calculateDimensionPixels(width, unit, dpi);
  const heightPx = calculateDimensionPixels(height, unit, dpi);
  const aspectRatio = calculateAspectRatio(width, height);
  const friendlyAspectRatio = getFriendlyAspectRatioName(aspectRatio);

  return {
    widthPx,
    heightPx,
    widthMm: Number(widthMm.toFixed(2)),
    heightMm: Number(heightMm.toFixed(2)),
    aspectRatio,
    friendlyAspectRatio,
  };
}

export interface DimensionValidationResult {
  isValid: boolean;
  errors: {
    width?: string;
    height?: string;
    dpi?: string;
    general?: string;
  };
  widthMm: number;
  heightMm: number;
  widthPx?: number;
  heightPx?: number;
  aspectRatio: number;
}

/**
 * Validates custom dimension inputs and DPI against physical safety and browser crash bounds.
 * Fully supports decimal numbers (e.g. 2.0 inches, 3.5 cm, 50.8 mm).
 */
export function validateCustomDimensions(
  width: number,
  height: number,
  unit: DimensionUnit,
  dpi: number = DEFAULT_CUSTOM_DPI
): DimensionValidationResult {
  const errors: DimensionValidationResult["errors"] = {};

  const widthMm = unitToMm(width, unit);
  const heightMm = unitToMm(height, unit);

  // Validate Width
  if (typeof width !== "number" || isNaN(width) || !isFinite(width)) {
    errors.width = "Width is required and must be a valid number.";
  } else if (width <= 0) {
    errors.width = "Width must be greater than zero.";
  } else if (widthMm < MIN_DIMENSION_MM) {
    errors.width = `Width cannot be less than ${formatDimension(
      mmToUnit(MIN_DIMENSION_MM, unit),
      unit
    )}.`;
  } else if (widthMm > MAX_DIMENSION_MM) {
    errors.width = `Width exceeds maximum limit of ${formatDimension(
      mmToUnit(MAX_DIMENSION_MM, unit),
      unit
    )}.`;
  }

  // Validate Height
  if (typeof height !== "number" || isNaN(height) || !isFinite(height)) {
    errors.height = "Height is required and must be a valid number.";
  } else if (height <= 0) {
    errors.height = "Height must be greater than zero.";
  } else if (heightMm < MIN_DIMENSION_MM) {
    errors.height = `Height cannot be less than ${formatDimension(
      mmToUnit(MIN_DIMENSION_MM, unit),
      unit
    )}.`;
  } else if (heightMm > MAX_DIMENSION_MM) {
    errors.height = `Height exceeds maximum limit of ${formatDimension(
      mmToUnit(MAX_DIMENSION_MM, unit),
      unit
    )}.`;
  }

  // Validate DPI
  if (typeof dpi !== "number" || isNaN(dpi) || !isFinite(dpi)) {
    errors.dpi = "DPI is required and must be a valid number.";
  } else if (dpi <= 0) {
    errors.dpi = "DPI must be greater than zero.";
  } else if (dpi < MIN_DPI) {
    errors.dpi = `DPI cannot be less than ${MIN_DPI} (too low for visible rendering).`;
  } else if (dpi > MAX_DPI) {
    errors.dpi = `DPI cannot exceed ${MAX_DPI} (prevents memory exhaustion).`;
  }

  const validDpi = typeof dpi === "number" && !isNaN(dpi) && dpi > 0 ? dpi : DEFAULT_CUSTOM_DPI;
  const widthPx =
    typeof width === "number" && !isNaN(width) && width > 0
      ? calculateDimensionPixels(width, unit, validDpi)
      : 0;
  const heightPx =
    typeof height === "number" && !isNaN(height) && height > 0
      ? calculateDimensionPixels(height, unit, validDpi)
      : 0;

  // Validate excessive pixel dimensions to prevent browser crashes
  if (widthPx > MAX_SAFE_PIXEL_DIMENSION || heightPx > MAX_SAFE_PIXEL_DIMENSION) {
    errors.general = `Calculated pixel dimensions (${widthPx} × ${heightPx} px) exceed browser safe limit (maximum ${MAX_SAFE_PIXEL_DIMENSION.toLocaleString()} px per side). Reduce physical size or DPI to prevent browser crash.`;
  } else if (widthPx > 0 && heightPx > 0 && widthPx * heightPx > MAX_SAFE_TOTAL_PIXELS) {
    errors.general = `Calculated resolution (${(widthPx * heightPx).toLocaleString()} pixels) exceeds safe browser memory limit of 50 megapixels. Reduce physical size or DPI.`;
  }

  const isValid = Object.keys(errors).length === 0;
  const aspectRatio = isValid && heightMm > 0 ? widthMm / heightMm : 1;

  return {
    isValid,
    errors,
    widthMm,
    heightMm,
    widthPx,
    heightPx,
    aspectRatio,
  };
}
