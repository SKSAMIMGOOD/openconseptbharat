/**
 * Pure DPI & Physical Photo Size Calculation Engine
 * Phase 03B Core Logic
 *
 * Implements pure, independently testable formulas for millimeter-to-pixel projection,
 * DPI presets, aspect ratio constraints, effective DPI analysis, and resolution quality grading.
 * Zero UI dependencies; strictly executes in browser JavaScript runtime or Node test harness.
 */

import type {
  DpiCalculationInput,
  DpiCalculationResult,
  DimensionValidationResult,
  EffectiveDpiDetails,
  ResolutionQualityAssessment,
  ResolutionQualityTier,
  StandardDpiPreset,
} from "@/types/dpi-calculator";

/**
 * Exact international inch to millimeter conversion constant.
 * 1 inch = 25.4 mm (defined by international agreement in 1959).
 */
export const MM_PER_INCH = 25.4;

/**
 * Supported standard DPI presets for digital photo workflows and print calibration.
 */
export const SUPPORTED_DPI_PRESETS: readonly StandardDpiPreset[] = [
  72, 150, 200, 300, 600,
] as const;

/**
 * Default photo studio physical dimensions and print resolution.
 */
export const DEFAULT_PHOTO_WIDTH_MM = 35;
export const DEFAULT_PHOTO_HEIGHT_MM = 45;
export const DEFAULT_DPI = 300;

/**
 * Practical safety and validation thresholds for physical dimensions and DPI.
 */
export const MIN_DIMENSION_MM = 1;
export const MAX_DIMENSION_MM = 1000; // 1 meter (prevents browser memory exhaustion)
export const MIN_DPI = 30;
export const MAX_DPI = 2400; // Archival scanner upper boundary

/**
 * Validates physical dimensions in millimeters and DPI values against safety thresholds.
 */
export function validatePhysicalInputs(
  widthMm: number,
  heightMm: number,
  dpi: number
): DimensionValidationResult {
  const errors: DimensionValidationResult["errors"] = {};

  // Validate Width (mm)
  if (typeof widthMm !== "number" || isNaN(widthMm) || !isFinite(widthMm)) {
    errors.width = "Width must be a valid numeric value.";
  } else if (widthMm <= 0) {
    errors.width = "Width must be greater than zero.";
  } else if (widthMm < MIN_DIMENSION_MM) {
    errors.width = `Width cannot be less than ${MIN_DIMENSION_MM} mm.`;
  } else if (widthMm > MAX_DIMENSION_MM) {
    errors.width = `Width exceeds maximum limit of ${MAX_DIMENSION_MM} mm (1 meter).`;
  }

  // Validate Height (mm)
  if (typeof heightMm !== "number" || isNaN(heightMm) || !isFinite(heightMm)) {
    errors.height = "Height must be a valid numeric value.";
  } else if (heightMm <= 0) {
    errors.height = "Height must be greater than zero.";
  } else if (heightMm < MIN_DIMENSION_MM) {
    errors.height = `Height cannot be less than ${MIN_DIMENSION_MM} mm.`;
  } else if (heightMm > MAX_DIMENSION_MM) {
    errors.height = `Height exceeds maximum limit of ${MAX_DIMENSION_MM} mm (1 meter).`;
  }

  // Validate DPI
  if (typeof dpi !== "number" || isNaN(dpi) || !isFinite(dpi)) {
    errors.dpi = "DPI must be a valid numeric value.";
  } else if (dpi <= 0) {
    errors.dpi = "DPI must be greater than zero.";
  } else if (dpi < MIN_DPI) {
    errors.dpi = `DPI cannot be less than ${MIN_DPI} (too low for visible rendering).`;
  } else if (dpi > MAX_DPI) {
    errors.dpi = `DPI cannot exceed ${MAX_DPI} (prevents memory exhaustion).`;
  }

  const isValid = Object.keys(errors).length === 0;
  return { isValid, errors };
}

/**
 * Converts physical millimeters to pixels at a given DPI using a documented rounding strategy.
 *
 * Formula: pixels = (millimeters / 25.4) * DPI
 * Default rounding strategy: Math.round (nearest whole pixel)
 *
 * Examples:
 * - 35 mm at 300 DPI: (35 / 25.4) * 300 = 413.3858... -> 413 pixels
 * - 45 mm at 300 DPI: (45 / 25.4) * 300 = 531.4960... -> 531 pixels
 * - 35 mm at 600 DPI: (35 / 25.4) * 600 = 826.7716... -> 827 pixels
 * - 45 mm at 600 DPI: (45 / 25.4) * 600 = 1062.9921... -> 1063 pixels
 */
export function mmToPixels(
  mm: number,
  dpi: number,
  roundingStrategy: "round" | "floor" | "ceil" = "round"
): number {
  if (typeof mm !== "number" || isNaN(mm) || !isFinite(mm) || mm <= 0) return 0;
  if (typeof dpi !== "number" || isNaN(dpi) || !isFinite(dpi) || dpi <= 0) return 0;

  const rawPixels = (mm / MM_PER_INCH) * dpi;

  switch (roundingStrategy) {
    case "floor":
      return Math.floor(rawPixels);
    case "ceil":
      return Math.ceil(rawPixels);
    case "round":
    default:
      return Math.round(rawPixels);
  }
}

/**
 * Converts pixels back to physical millimeters at a given DPI.
 *
 * Formula: millimeters = (pixels / DPI) * 25.4
 */
export function pixelsToMm(pixels: number, dpi: number): number {
  if (typeof pixels !== "number" || isNaN(pixels) || !isFinite(pixels) || pixels <= 0) return 0;
  if (typeof dpi !== "number" || isNaN(dpi) || !isFinite(dpi) || dpi <= 0) return 0;

  const rawMm = (pixels / dpi) * MM_PER_INCH;
  return Number(rawMm.toFixed(2));
}

/**
 * Calculates human-readable aspect ratio label.
 * Identifies common ratios within 1.5% tolerance.
 */
export function getFriendlyAspectRatioName(ratio: number): string {
  if (!ratio || isNaN(ratio) || !isFinite(ratio) || ratio <= 0) return "1:1";

  const commonRatios: Array<{ name: string; value: number }> = [
    { name: "1:1 Square", value: 1.0 },
    { name: "35:45 Passport", value: 35 / 45 }, // ~0.778
    { name: "45:35 Landscape", value: 45 / 35 }, // ~1.286
    { name: "3:4 Portrait", value: 3 / 4 }, // 0.75
    { name: "4:3 Standard", value: 4 / 3 }, // 1.333
    { name: "2:3 Portrait", value: 2 / 3 }, // 0.667
    { name: "3:2 Landscape", value: 3 / 2 }, // 1.5
    { name: "5:7 Portrait", value: 5 / 7 }, // 0.714
    { name: "7:5 Landscape", value: 7 / 5 }, // 1.4
    { name: "9:16 Story", value: 9 / 16 }, // 0.5625
    { name: "16:9 Widescreen", value: 16 / 9 }, // 1.778
  ];

  for (const item of commonRatios) {
    if (Math.abs(ratio - item.value) < 0.015) {
      return `${item.name} (${ratio.toFixed(2)}:1)`;
    }
  }

  return `${ratio.toFixed(2)}:1`;
}

/**
 * Executes core DPI dimension calculation with input validation.
 */
export function calculatePixelDimensions(
  input: DpiCalculationInput
): DpiCalculationResult {
  const { widthMm, heightMm, dpi, roundingStrategy = "round" } = input;
  const validation = validatePhysicalInputs(widthMm, heightMm, dpi);

  if (!validation.isValid) {
    return {
      widthMm,
      heightMm,
      dpi,
      widthPx: 0,
      heightPx: 0,
      aspectRatio: heightMm > 0 ? widthMm / heightMm : 1,
      aspectRatioFormatted: "Invalid",
      isValid: false,
      errors: validation.errors,
    };
  }

  const widthPx = mmToPixels(widthMm, dpi, roundingStrategy);
  const heightPx = mmToPixels(heightMm, dpi, roundingStrategy);
  const aspectRatio = widthMm / heightMm;
  const aspectRatioFormatted = getFriendlyAspectRatioName(aspectRatio);

  return {
    widthMm,
    heightMm,
    dpi,
    widthPx,
    heightPx,
    aspectRatio,
    aspectRatioFormatted,
    isValid: true,
  };
}

/**
 * Calculates the reciprocal proportional dimension when aspect ratio lock is enabled.
 *
 * Aspect Ratio = Width / Height
 * When Width changes: Height = Width / AspectRatio
 * When Height changes: Width = Height * AspectRatio
 */
export function calculateProportionalDimension(
  changedDimension: "width" | "height",
  valueMm: number,
  targetAspectRatio: number
): number {
  if (valueMm <= 0 || !targetAspectRatio || targetAspectRatio <= 0) return valueMm;

  if (changedDimension === "width") {
    // Width changed; calculate new height
    const newHeight = valueMm / targetAspectRatio;
    return Number(newHeight.toFixed(2));
  } else {
    // Height changed; calculate new width
    const newWidth = valueMm * targetAspectRatio;
    return Number(newWidth.toFixed(2));
  }
}

/**
 * Calculates effective available DPI of a source image when printed at specified physical dimensions.
 *
 * Effective DPI along width: (sourceWidthPx * 25.4) / widthMm
 * Effective DPI along height: (sourceHeightPx * 25.4) / heightMm
 *
 * The limiting effective DPI is min(effectiveDpiWidth, effectiveDpiHeight), which dictates
 * the maximum optical print fidelity when filling/cropping to the target physical dimensions.
 */
export function calculateEffectiveDpi(
  sourceWidthPx: number,
  sourceHeightPx: number,
  widthMm: number,
  heightMm: number
): EffectiveDpiDetails {
  if (
    sourceWidthPx <= 0 ||
    sourceHeightPx <= 0 ||
    widthMm <= 0 ||
    heightMm <= 0
  ) {
    return {
      effectiveDpi: 0,
      effectiveDpiWidth: 0,
      effectiveDpiHeight: 0,
      limitingAxis: "balanced",
    };
  }

  const effectiveDpiWidth = Math.round((sourceWidthPx * MM_PER_INCH) / widthMm);
  const effectiveDpiHeight = Math.round((sourceHeightPx * MM_PER_INCH) / heightMm);
  const effectiveDpi = Math.min(effectiveDpiWidth, effectiveDpiHeight);

  let limitingAxis: "width" | "height" | "balanced" = "balanced";
  if (effectiveDpiWidth < effectiveDpiHeight) {
    limitingAxis = "width";
  } else if (effectiveDpiHeight < effectiveDpiWidth) {
    limitingAxis = "height";
  }

  return {
    effectiveDpi,
    effectiveDpiWidth,
    effectiveDpiHeight,
    limitingAxis,
  };
}

/**
 * Performs a rigorous resolution analysis comparing the source image against requested output dimensions and DPI.
 *
 * Classifies quality into 3 standard photographic reproduction tiers:
 * A. Sufficient resolution: Source meets or exceeds requested resolution (scaleFactor <= 1.0).
 * B. Upscaling required: Source is below requested resolution, requiring moderate interpolation (1.0 < scaleFactor <= 1.5).
 * C. Significant upscaling: Output dimensions substantially exceed source (> 1.5x scaleFactor).
 *
 * Also assesses aspect ratio alignment to prevent unnoticed facial distortion.
 */
export function assessResolutionQuality(
  sourceWidthPx: number,
  sourceHeightPx: number,
  targetWidthMm: number,
  targetHeightMm: number,
  targetDpi: number
): ResolutionQualityAssessment {
  const requiredWidthPx = mmToPixels(targetWidthMm, targetDpi);
  const requiredHeightPx = mmToPixels(targetHeightMm, targetDpi);

  const effectiveDpi = calculateEffectiveDpi(
    sourceWidthPx,
    sourceHeightPx,
    targetWidthMm,
    targetHeightMm
  );

  const scaleW = requiredWidthPx / Math.max(1, sourceWidthPx);
  const scaleH = requiredHeightPx / Math.max(1, sourceHeightPx);
  const scaleFactor = Math.max(scaleW, scaleH);

  // Aspect ratio analysis
  const sourceAspectRatio = sourceWidthPx / Math.max(1, sourceHeightPx);
  const targetAspectRatio = targetWidthMm / Math.max(0.01, targetHeightMm);
  const aspectRatioDeviationPercent = Number(
    (
      (Math.abs(sourceAspectRatio - targetAspectRatio) / targetAspectRatio) *
      100
    ).toFixed(1)
  );
  const aspectRatioMismatch = aspectRatioDeviationPercent > 1.5;

  let tier: ResolutionQualityTier;
  let title: string;
  let description: string;
  let badgeVariant: "emerald" | "amber" | "rose";

  if (sourceWidthPx >= requiredWidthPx && sourceHeightPx >= requiredHeightPx) {
    tier = "sufficient";
    title = "Sufficient Resolution";
    description = `The uploaded image (${sourceWidthPx} × ${sourceHeightPx} px) exceeds the required ${requiredWidthPx} × ${requiredHeightPx} px. Effective print density is ${effectiveDpi.effectiveDpi} DPI, guaranteeing sharp, professional optical output without digital interpolation.`;
    badgeVariant = "emerald";
  } else if (scaleFactor <= 1.5) {
    tier = "upscaling_required";
    title = "Upscaling Required";
    description = `The uploaded image is slightly below requested print dimensions (${requiredWidthPx} × ${requiredHeightPx} px at ${targetDpi} DPI). Software interpolation will be required (${Math.round(scaleFactor * 100)}% scale). Moderate detail loss may be visible upon close inspection.`;
    badgeVariant = "amber";
  } else {
    tier = "significant_upscaling";
    title = "Significant Upscaling Required";
    description = `Required output dimensions (${requiredWidthPx} × ${requiredHeightPx} px) are substantially larger than the source photo (${sourceWidthPx} × ${sourceHeightPx} px; ${Math.round(scaleFactor * 100)}% scale factor). The printed photo will likely suffer from noticeable softness, pixelation, or blurriness.`;
    badgeVariant = "rose";
  }

  const disclaimer =
    "Digital upscaling and pixel interpolation enlarge image geometry, but cannot reconstruct or synthesize missing optical photographic detail.";

  return {
    tier,
    title,
    description,
    badgeVariant,
    sourceWidthPx,
    sourceHeightPx,
    requiredWidthPx,
    requiredHeightPx,
    scaleFactor: Number(scaleFactor.toFixed(2)),
    effectiveDpi,
    targetDpi,
    aspectRatioMismatch,
    aspectRatioDeviationPercent,
    sourceAspectRatio,
    targetAspectRatio,
    disclaimer,
  };
}
