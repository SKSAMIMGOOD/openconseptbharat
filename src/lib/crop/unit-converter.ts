/**
 * Physical Dimension Unit Converter & Custom Dimensions Validator (Phase 03C)
 *
 * Implements pure unit conversion math (mm, cm, inches), decimal precision handling,
 * input validation, and live aspect-ratio calculation.
 * Zero UI dependencies; strictly executes in browser or Node test harnesses.
 */

import type { DimensionUnit, CustomDimensionsInput } from "@/types/crop-preset";

export const MM_PER_INCH = 25.4;
export const MM_PER_CM = 10;
export const CM_PER_INCH = 2.54;
export const MIN_DIMENSION_MM = 1;
export const MAX_DIMENSION_MM = 1000;

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

export interface DimensionValidationResult {
  isValid: boolean;
  errors: {
    width?: string;
    height?: string;
    general?: string;
  };
  widthMm: number;
  heightMm: number;
  aspectRatio: number;
}

/**
 * Validates custom dimension inputs against physical safety bounds (1 mm to 1000 mm).
 * Fully supports decimal numbers (e.g. 2.0 inches, 3.5 cm, 50.8 mm).
 */
export function validateCustomDimensions(
  width: number,
  height: number,
  unit: DimensionUnit
): DimensionValidationResult {
  const errors: DimensionValidationResult["errors"] = {};

  const widthMm = unitToMm(width, unit);
  const heightMm = unitToMm(height, unit);

  // Validate Width
  if (typeof width !== "number" || isNaN(width) || !isFinite(width)) {
    errors.width = "Width must be a valid number.";
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
    errors.height = "Height must be a valid number.";
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

  const isValid = Object.keys(errors).length === 0;
  const aspectRatio = isValid && heightMm > 0 ? widthMm / heightMm : 1;

  return {
    isValid,
    errors,
    widthMm,
    heightMm,
    aspectRatio,
  };
}
