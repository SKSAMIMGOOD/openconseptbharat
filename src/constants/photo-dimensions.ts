import type { PhotoDimensionPreset, StandardDpiPreset } from "@/types/dpi-calculator";

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
 * Default calculation parameters.
 */
export const DEFAULT_PHOTO_WIDTH_MM = 35;
export const DEFAULT_PHOTO_HEIGHT_MM = 45;
export const DEFAULT_DPI = 300;

/**
 * Practical safety and validation thresholds for physical dimensions and DPI.
 */
export const MIN_DIMENSION_MM = 1;
export const MAX_DIMENSION_MM = 1000; // 1 meter (prevents browser heap exhaustion)
export const MIN_DPI = 30;
export const MAX_DPI = 2400; // Archival scanner upper boundary

/**
 * Configurable photo dimension presets.
 * Country-specific standards can be added incrementally without code restructuring.
 */
export const PHOTO_DIMENSION_PRESETS: PhotoDimensionPreset[] = [
  {
    id: "custom",
    name: "Custom Size",
    description: "Freely specify custom physical dimensions and DPI",
    category: "custom",
    widthMm: 35,
    heightMm: 45,
    defaultDpi: 300,
  },
  {
    id: "passport_standard",
    name: "Standard Passport (35 × 45 mm)",
    countryOrStandard: "ICAO / India / UK / EU / Australia",
    description: "Standard international biometric passport and visa specification",
    category: "passport",
    widthMm: 35,
    heightMm: 45,
    defaultDpi: 300,
  },
  {
    id: "us_visa",
    name: "US Visa & Passport (2 × 2 in)",
    countryOrStandard: "United States (DoST)",
    description: "Official square format: 2.0 × 2.0 inches (50.8 × 50.8 mm)",
    category: "visa",
    widthMm: 50.8,
    heightMm: 50.8,
    defaultDpi: 300,
  },
  {
    id: "pan_card_photo",
    name: "Indian PAN Card / Govt Photo",
    countryOrStandard: "India (NSDL / UTIITSL)",
    description: "Official identity card portrait photo: 25 × 35 mm",
    category: "identity",
    widthMm: 25,
    heightMm: 35,
    defaultDpi: 300,
  },
  {
    id: "stamp_size",
    name: "Stamp Size Photo",
    countryOrStandard: "General Administrative",
    description: "Compact document stamp portrait: 20 × 25 mm",
    category: "standard",
    widthMm: 20,
    heightMm: 25,
    defaultDpi: 300,
  },
  {
    id: "canada_passport",
    name: "Canada Passport / Visa",
    countryOrStandard: "Canada (Passport Program)",
    description: "Canadian passport photo specification: 50 × 70 mm",
    category: "passport",
    widthMm: 50,
    heightMm: 70,
    defaultDpi: 300,
  },
  {
    id: "schengen_visa",
    name: "Schengen Visa Photo",
    countryOrStandard: "European Union Schengen Area",
    description: "Standard Schengen consulate requirement: 35 × 45 mm",
    category: "visa",
    widthMm: 35,
    heightMm: 45,
    defaultDpi: 300,
  },
];
