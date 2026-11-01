/**
 * DPI & Physical Photo Size Calculator — TypeScript Type Definitions
 * Phase 03B Contracts for physical dimensions, DPI presets, and resolution analysis.
 */

export type StandardDpiPreset = 72 | 150 | 200 | 300 | 600;

export type DpiSelection = StandardDpiPreset | "custom";

export interface PhysicalDimensionsMm {
  widthMm: number;
  heightMm: number;
}

export interface PixelDimensions {
  widthPx: number;
  heightPx: number;
}

export interface DpiCalculationInput {
  widthMm: number;
  heightMm: number;
  dpi: number;
  roundingStrategy?: "round" | "floor" | "ceil";
}

export interface DimensionValidationResult {
  isValid: boolean;
  errors: {
    width?: string;
    height?: string;
    dpi?: string;
    general?: string;
  };
}

export interface DpiCalculationResult {
  widthMm: number;
  heightMm: number;
  dpi: number;
  widthPx: number;
  heightPx: number;
  aspectRatio: number;
  aspectRatioFormatted: string;
  isValid: boolean;
  errors?: DimensionValidationResult["errors"];
}

export type ResolutionQualityTier =
  | "sufficient"
  | "upscaling_required"
  | "significant_upscaling";

export interface EffectiveDpiDetails {
  effectiveDpi: number; // Limiting effective DPI
  effectiveDpiWidth: number;
  effectiveDpiHeight: number;
  limitingAxis: "width" | "height" | "balanced";
}

export interface ResolutionQualityAssessment {
  tier: ResolutionQualityTier;
  title: string;
  description: string;
  badgeVariant: "emerald" | "amber" | "rose";
  sourceWidthPx: number;
  sourceHeightPx: number;
  requiredWidthPx: number;
  requiredHeightPx: number;
  scaleFactor: number; // Required / Source max ratio
  effectiveDpi: EffectiveDpiDetails;
  targetDpi: number;
  aspectRatioMismatch: boolean;
  aspectRatioDeviationPercent: number;
  sourceAspectRatio: number;
  targetAspectRatio: number;
  disclaimer: string;
}

export type PhotoDimensionCategory =
  | "passport"
  | "visa"
  | "identity"
  | "standard"
  | "custom";

export interface PhotoDimensionPreset {
  id: string;
  name: string;
  countryOrStandard?: string;
  description: string;
  category: PhotoDimensionCategory;
  widthMm: number;
  heightMm: number;
  defaultDpi: number;
}
