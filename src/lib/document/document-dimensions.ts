/**
 * Phase 08D — Document Print Quality & Dimensions Calculator and Validator
 *
 * Implements:
 * 1. Print Quality Presets (Standard: 150 DPI, High: 300 DPI, Maximum: 600 DPI, Custom DPI)
 * 2. Custom DPI Validation & Bounds Checking (72 DPI - 1200 DPI)
 * 3. Document Dimension Presets (Original Size, Aadhaar, PAN, Voter ID, Custom Size)
 * 4. Precise Unit Conversions (mm, inches, pixels) at arbitrary DPI
 * 5. Aspect Ratio Preservation & Proportional Adjustments
 * 6. Source Resolution Sufficiency & Warning Diagnostics (Zero Artificial Upscaling)
 *
 * Zero UI dependencies; strictly executes in browser or Node test harnesses.
 */

import type {
  PrintQualityPreset,
  DocumentDimensionPreset,
  DocumentDimensionUnit,
  DocumentPrintSettings,
  DocumentDimensions,
  DocumentTypeId,
} from "@/types/document-studio";

export const MM_PER_INCH = 25.4;

export const PRINT_DPI_PRESETS = {
  standard: 150,
  high: 300,
  maximum: 600,
} as const;

export const MIN_CUSTOM_DPI = 72;
export const MAX_CUSTOM_DPI = 1200;
export const DEFAULT_PRINT_DPI = 300;

export const MIN_DIMENSION_LIMITS: Record<DocumentDimensionUnit, number> = {
  mm: 5,
  inch: 0.2,
  px: 20,
};

export const MAX_DIMENSION_LIMITS: Record<DocumentDimensionUnit, number> = {
  mm: 1000,
  inch: 40,
  px: 10000,
};

/**
 * Standard ISO/IEC 7810 ID-1 CR80 dimensions in millimeters.
 * Governs official Indian Aadhaar, PAN, and Voter ID cards.
 */
export const CR80_STANDARD_DIMENSIONS_MM = {
  width: 85.6,
  height: 53.98,
  aspectRatio: 85.6 / 53.98, // ~1.5857725...
} as const;

export interface DpiPresetDefinition {
  id: PrintQualityPreset;
  name: string;
  dpi: number;
  description: string;
}

export const PRINT_QUALITY_PRESET_OPTIONS: DpiPresetDefinition[] = [
  {
    id: "standard",
    name: "Standard Quality",
    dpi: 150,
    description: "150 DPI — Good for draft proofs and compact documents.",
  },
  {
    id: "high",
    name: "High Quality",
    dpi: 300,
    description: "300 DPI — Official commercial & photo print standard.",
  },
  {
    id: "maximum",
    name: "Maximum Quality",
    dpi: 600,
    description: "600 DPI — Ultra high-definition crisp card printing.",
  },
  {
    id: "custom",
    name: "Custom DPI",
    dpi: 300,
    description: "User-specified custom DPI (72 to 1200 DPI).",
  },
];

export interface DimensionPresetDefinition {
  id: DocumentDimensionPreset;
  name: string;
  widthMm: number;
  heightMm: number;
  aspectRatio: number;
  description: string;
  isFixedStandard: boolean;
}

export const DOCUMENT_DIMENSION_PRESETS: Record<DocumentDimensionPreset, DimensionPresetDefinition> = {
  original: {
    id: "original",
    name: "Original Size",
    widthMm: 85.6, // Default placeholder until source dimensions known
    heightMm: 53.98,
    aspectRatio: 85.6 / 53.98,
    description: "Uses natural unscaled aspect ratio and dimensions of the source document.",
    isFixedStandard: false,
  },
  aadhaar: {
    id: "aadhaar",
    name: "Aadhaar Card",
    widthMm: CR80_STANDARD_DIMENSIONS_MM.width,
    heightMm: CR80_STANDARD_DIMENSIONS_MM.height,
    aspectRatio: CR80_STANDARD_DIMENSIONS_MM.aspectRatio,
    description: "UIDAI Standard CR80 Wallet Card (85.60 × 53.98 mm).",
    isFixedStandard: true,
  },
  pan: {
    id: "pan",
    name: "PAN Card",
    widthMm: CR80_STANDARD_DIMENSIONS_MM.width,
    heightMm: CR80_STANDARD_DIMENSIONS_MM.height,
    aspectRatio: CR80_STANDARD_DIMENSIONS_MM.aspectRatio,
    description: "Income Tax Department CR80 Card (85.60 × 53.98 mm).",
    isFixedStandard: true,
  },
  "voter-id": {
    id: "voter-id",
    name: "Voter ID Card",
    widthMm: CR80_STANDARD_DIMENSIONS_MM.width,
    heightMm: CR80_STANDARD_DIMENSIONS_MM.height,
    aspectRatio: CR80_STANDARD_DIMENSIONS_MM.aspectRatio,
    description: "Election Commission of India PVC e-EPIC Card (85.60 × 53.98 mm).",
    isFixedStandard: true,
  },
  custom: {
    id: "custom",
    name: "Custom Size",
    widthMm: 85.6,
    heightMm: 53.98,
    aspectRatio: 85.6 / 53.98,
    description: "Custom width and height specified in mm, inches, or pixels.",
    isFixedStandard: false,
  },
};

/**
 * Validates a custom DPI input value.
 * Prevents invalid numbers or excessively large values from causing browser canvas memory exhaustion.
 */
export function validateCustomDpi(dpiInput: unknown): {
  isValid: boolean;
  dpi: number;
  error?: string;
} {
  if (
    dpiInput === null ||
    dpiInput === undefined ||
    (typeof dpiInput === "string" && dpiInput.trim() === "")
  ) {
    return {
      isValid: false,
      dpi: DEFAULT_PRINT_DPI,
      error: "DPI must be a valid number.",
    };
  }

  const numeric = typeof dpiInput === "number" ? dpiInput : Number(dpiInput);

  if (isNaN(numeric) || !isFinite(numeric)) {
    return {
      isValid: false,
      dpi: DEFAULT_PRINT_DPI,
      error: "DPI must be a valid number.",
    };
  }

  const rounded = Math.round(numeric);

  if (rounded < MIN_CUSTOM_DPI) {
    return {
      isValid: false,
      dpi: rounded,
      error: `DPI must be at least ${MIN_CUSTOM_DPI} DPI for print output.`,
    };
  }

  if (rounded > MAX_CUSTOM_DPI) {
    return {
      isValid: false,
      dpi: rounded,
      error: `DPI cannot exceed ${MAX_CUSTOM_DPI} DPI to prevent performance and memory issues.`,
    };
  }

  return {
    isValid: true,
    dpi: rounded,
  };
}

/**
 * Converts a dimension value to physical millimeters (the canonical storage unit).
 */
export function documentUnitToMm(
  value: number,
  unit: DocumentDimensionUnit,
  dpi: number = DEFAULT_PRINT_DPI
): number {
  if (typeof value !== "number" || isNaN(value) || !isFinite(value) || value <= 0) {
    return 0;
  }
  const safeDpi = dpi > 0 ? dpi : DEFAULT_PRINT_DPI;
  switch (unit) {
    case "mm":
      return value;
    case "inch":
      return value * MM_PER_INCH;
    case "px":
      return (value / safeDpi) * MM_PER_INCH;
    default:
      return value;
  }
}

/**
 * Converts physical millimeters into a target document unit (mm, inch, px).
 */
export function mmToDocumentUnit(
  mm: number,
  targetUnit: DocumentDimensionUnit,
  dpi: number = DEFAULT_PRINT_DPI,
  decimals?: number
): number {
  if (typeof mm !== "number" || isNaN(mm) || !isFinite(mm) || mm <= 0) {
    return 0;
  }
  const safeDpi = dpi > 0 ? dpi : DEFAULT_PRINT_DPI;

  let converted: number;
  switch (targetUnit) {
    case "mm":
      converted = mm;
      break;
    case "inch":
      converted = mm / MM_PER_INCH;
      break;
    case "px":
      converted = Math.round((mm / MM_PER_INCH) * safeDpi);
      return converted;
    default:
      converted = mm;
  }

  const dec = decimals ?? (targetUnit === "inch" ? 2 : 2);
  const factor = Math.pow(10, dec);
  return Math.round(converted * factor) / factor;
}

/**
 * Direct conversion between any two document units at a specified DPI.
 */
export function convertDocumentUnit(
  value: number,
  fromUnit: DocumentDimensionUnit,
  toUnit: DocumentDimensionUnit,
  dpi: number = DEFAULT_PRINT_DPI,
  decimals?: number
): number {
  if (fromUnit === toUnit) return value;
  const mm = documentUnitToMm(value, fromUnit, dpi);
  return mmToDocumentUnit(mm, toUnit, dpi, decimals);
}

/**
 * Computes pixel count from physical dimensions at a given DPI.
 */
export function calculateTargetPixels(
  widthMm: number,
  heightMm: number,
  dpi: number = DEFAULT_PRINT_DPI
): { widthPx: number; heightPx: number } {
  const safeDpi = dpi > 0 ? dpi : DEFAULT_PRINT_DPI;
  const widthPx = Math.max(1, Math.round((widthMm / MM_PER_INCH) * safeDpi));
  const heightPx = Math.max(1, Math.round((heightMm / MM_PER_INCH) * safeDpi));
  return { widthPx, heightPx };
}

/**
 * Computes physical size in mm/inches from pixel dimensions at a given DPI.
 */
export function calculatePhysicalFromPixels(
  pixels: number,
  dpi: number = DEFAULT_PRINT_DPI,
  targetUnit: DocumentDimensionUnit = "mm",
  decimals: number = 2
): number {
  if (pixels <= 0) return 0;
  const safeDpi = dpi > 0 ? dpi : DEFAULT_PRINT_DPI;
  const mm = (pixels / safeDpi) * MM_PER_INCH;
  return mmToDocumentUnit(mm, targetUnit, safeDpi, decimals);
}

/**
 * Adjusts opposite dimension when maintainAspectRatio is enabled.
 */
export function adjustDimensionWithAspectRatio(
  changedField: "width" | "height",
  newValue: number,
  aspectRatio: number,
  unit: DocumentDimensionUnit
): { width: number; height: number } {
  if (newValue <= 0 || !aspectRatio || isNaN(aspectRatio) || !isFinite(aspectRatio)) {
    return { width: newValue, height: newValue };
  }

  const isPixel = unit === "px";
  const roundVal = (v: number) => {
    if (isPixel) return Math.max(1, Math.round(v));
    return Number(v.toFixed(2));
  };

  if (changedField === "width") {
    const calculatedHeight = roundVal(newValue / aspectRatio);
    return { width: roundVal(newValue), height: calculatedHeight };
  } else {
    const calculatedWidth = roundVal(newValue * aspectRatio);
    return { width: calculatedWidth, height: roundVal(newValue) };
  }
}

/**
 * Validates document width and height inputs.
 * Ensures non-zero, positive, and bounded dimensions.
 */
export function validateDocumentDimensions(
  width: number,
  height: number,
  unit: DocumentDimensionUnit,
  dpi: number = DEFAULT_PRINT_DPI
): {
  isValid: boolean;
  errors: { width?: string; height?: string; general?: string };
  widthMm: number;
  heightMm: number;
  widthPx: number;
  heightPx: number;
} {
  const errors: { width?: string; height?: string; general?: string } = {};

  const minLimit = MIN_DIMENSION_LIMITS[unit];
  const maxLimit = MAX_DIMENSION_LIMITS[unit];

  if (typeof width !== "number" || isNaN(width) || !isFinite(width) || width <= 0) {
    errors.width = "Width must be a positive number greater than 0.";
  } else if (width < minLimit) {
    errors.width = `Width must be at least ${minLimit} ${unit}.`;
  } else if (width > maxLimit) {
    errors.width = `Width cannot exceed ${maxLimit} ${unit}.`;
  }

  if (typeof height !== "number" || isNaN(height) || !isFinite(height) || height <= 0) {
    errors.height = "Height must be a positive number greater than 0.";
  } else if (height < minLimit) {
    errors.height = `Height must be at least ${minLimit} ${unit}.`;
  } else if (height > maxLimit) {
    errors.height = `Height cannot exceed ${maxLimit} ${unit}.`;
  }

  const widthMm = documentUnitToMm(width, unit, dpi);
  const heightMm = documentUnitToMm(height, unit, dpi);
  const { widthPx, heightPx } = calculateTargetPixels(widthMm, heightMm, dpi);

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    widthMm: Number(widthMm.toFixed(2)),
    heightMm: Number(heightMm.toFixed(2)),
    widthPx,
    heightPx,
  };
}

export interface ResolutionSufficiencyResult {
  isInsufficient: boolean;
  sourceWidthPx: number;
  sourceHeightPx: number;
  requiredWidthPx: number;
  requiredHeightPx: number;
  effectiveDpi: number;
  targetDpi: number;
  message?: string;
  hasDimensions: boolean;
}

/**
 * Checks whether source image resolution is sufficient for the target print size at selected DPI.
 *
 * Requirements:
 * - Warns if source resolution is insufficient.
 * - Does NOT artificially upscale or claim selecting higher DPI improves actual source image detail.
 * - Accurately computes effective DPI based on physical print dimensions.
 */
export function checkResolutionSufficiency(params: {
  sourceDimensions: DocumentDimensions | null;
  targetWidthMm: number;
  targetHeightMm: number;
  selectedDpi: number;
  dimensionPreset?: DocumentDimensionPreset;
}): ResolutionSufficiencyResult {
  const {
    sourceDimensions,
    targetWidthMm,
    targetHeightMm,
    selectedDpi,
    dimensionPreset,
  } = params;

  if (!sourceDimensions || sourceDimensions.width <= 0 || sourceDimensions.height <= 0) {
    return {
      isInsufficient: false,
      sourceWidthPx: 0,
      sourceHeightPx: 0,
      requiredWidthPx: Math.round((targetWidthMm / MM_PER_INCH) * selectedDpi),
      requiredHeightPx: Math.round((targetHeightMm / MM_PER_INCH) * selectedDpi),
      effectiveDpi: selectedDpi,
      targetDpi: selectedDpi,
      hasDimensions: false,
    };
  }

  const sourceW = sourceDimensions.width;
  const sourceH = sourceDimensions.height;
  const reqW = Math.round((targetWidthMm / MM_PER_INCH) * selectedDpi);
  const reqH = Math.round((targetHeightMm / MM_PER_INCH) * selectedDpi);

  // Original size preset preserves natural 1:1 pixel grid without physical resize constraints
  if (dimensionPreset === "original") {
    return {
      isInsufficient: false,
      sourceWidthPx: sourceW,
      sourceHeightPx: sourceH,
      requiredWidthPx: sourceW,
      requiredHeightPx: sourceH,
      effectiveDpi: selectedDpi,
      targetDpi: selectedDpi,
      hasDimensions: true,
    };
  }

  // Calculate actual effective DPI from pixels over physical dimensions
  const effectiveDpiX = (sourceW / targetWidthMm) * MM_PER_INCH;
  const effectiveDpiY = (sourceH / targetHeightMm) * MM_PER_INCH;
  const effectiveDpi = Math.round(Math.min(effectiveDpiX, effectiveDpiY));

  // Allow 2 DPI tolerance for 1-pixel rounding variations
  const isInsufficient = effectiveDpi < selectedDpi - 2;

  let message: string | undefined;
  if (isInsufficient) {
    message = `Source image resolution (${sourceW} × ${sourceH} px, ~${effectiveDpi} DPI) is lower than recommended for this print size at ${selectedDpi} DPI (requires ${reqW} × ${reqH} px). Original pixel resolution is preserved without artificial upscaling.`;
  }

  return {
    isInsufficient,
    sourceWidthPx: sourceW,
    sourceHeightPx: sourceH,
    requiredWidthPx: reqW,
    requiredHeightPx: reqH,
    effectiveDpi,
    targetDpi: selectedDpi,
    message,
    hasDimensions: true,
  };
}

/**
 * Creates updated DocumentPrintSettings ensuring synchronized physical and unit dimensions.
 */
export function updatePrintSettings(
  current: DocumentPrintSettings,
  updates: Partial<DocumentPrintSettings>,
  sourceDimensions?: DocumentDimensions | null
): DocumentPrintSettings {
  const next = { ...current, ...updates };

  // 1. Handle DPI changes
  if (updates.qualityPreset !== undefined && updates.qualityPreset !== "custom") {
    next.dpi = PRINT_DPI_PRESETS[updates.qualityPreset];
  } else if (updates.customDpi !== undefined) {
    const val = validateCustomDpi(updates.customDpi);
    if (val.isValid) {
      next.dpi = val.dpi;
      next.customDpi = val.dpi;
    }
  }

  // 2. Handle Dimension Preset changes
  if (updates.dimensionPreset !== undefined) {
    const preset = updates.dimensionPreset;
    if (preset === "original" && sourceDimensions) {
      next.widthMm = Number(((sourceDimensions.width / next.dpi) * MM_PER_INCH).toFixed(2));
      next.heightMm = Number(((sourceDimensions.height / next.dpi) * MM_PER_INCH).toFixed(2));
      next.aspectRatio = sourceDimensions.aspectRatio;
    } else if (DOCUMENT_DIMENSION_PRESETS[preset]) {
      const def = DOCUMENT_DIMENSION_PRESETS[preset];
      next.widthMm = def.widthMm;
      next.heightMm = def.heightMm;
      next.aspectRatio = def.aspectRatio;
    }
    // Update active unit values
    next.width = mmToDocumentUnit(next.widthMm, next.unit, next.dpi);
    next.height = mmToDocumentUnit(next.heightMm, next.unit, next.dpi);
  }

  // 3. Handle Unit changes
  if (updates.unit !== undefined && updates.unit !== current.unit) {
    next.width = mmToDocumentUnit(next.widthMm, updates.unit, next.dpi);
    next.height = mmToDocumentUnit(next.heightMm, updates.unit, next.dpi);
  }

  // 4. Handle direct width/height edits
  if (updates.width !== undefined || updates.height !== undefined) {
    let newW = updates.width !== undefined ? updates.width : next.width;
    let newH = updates.height !== undefined ? updates.height : next.height;

    if (next.maintainAspectRatio && next.aspectRatio > 0) {
      if (updates.width !== undefined && updates.height === undefined) {
        const adjusted = adjustDimensionWithAspectRatio("width", newW, next.aspectRatio, next.unit);
        newH = adjusted.height;
      } else if (updates.height !== undefined && updates.width === undefined) {
        const adjusted = adjustDimensionWithAspectRatio("height", newH, next.aspectRatio, next.unit);
        newW = adjusted.width;
      }
    } else if (newW > 0 && newH > 0) {
      next.aspectRatio = newW / newH;
    }

    next.width = newW;
    next.height = newH;
    next.widthMm = Number(documentUnitToMm(newW, next.unit, next.dpi).toFixed(2));
    next.heightMm = Number(documentUnitToMm(newH, next.unit, next.dpi).toFixed(2));

    // If edited manually, switch preset to custom
    if (
      updates.dimensionPreset === undefined &&
      next.dimensionPreset !== "custom" &&
      next.dimensionPreset !== "original"
    ) {
      next.dimensionPreset = "custom";
    }
  }

  // 5. Always recalculate target pixel grid
  const { widthPx, heightPx } = calculateTargetPixels(next.widthMm, next.heightMm, next.dpi);
  next.targetWidthPx = widthPx;
  next.targetHeightPx = heightPx;

  return next;
}
