/**
 * Photographic Dimension Presets (Phase 03C)
 *
 * Provides configurable standard presets for passport-style, portrait, square,
 * and custom photographic dimensions.
 *
 * IMPORTANT ADVISORY & COMPLIANCE NOTICE:
 * These presets represent general photographic proportions and dimensions commonly used
 * across various international forms and applications. They DO NOT guarantee satisfaction
 * of every country's specific passport, visa, or consular regulations. Specific jurisdictions
 * enforce strict rules regarding head height, crown-to-chin percentage, eye-line positioning,
 * and background luminance. Always consult official government guidelines for your specific
 * jurisdiction before submitting photographic documents.
 */

import type { PhotoPreset } from "@/types/crop-preset";

/**
 * Standard initial photo presets specified in Phase 03C.
 */
export const INITIAL_PHOTO_PRESETS: readonly PhotoPreset[] = [
  {
    id: "passport-35-45",
    name: "Passport-style photo (35 × 45 mm)",
    width: 35,
    height: 45,
    unit: "mm",
    aspectRatio: 35 / 45, // ~0.7778 (7:9)
    description:
      "Standard international passport-style proportion (35 × 45 mm). Widely used in the UK, EU, India, Australia, and New Zealand. Requirements vary by country; verify official government guidelines.",
    category: "passport",
    isOfficial: false,
    countryOrStandard: "General International (ICAO 35 × 45 mm standard style)",
  },
  {
    id: "portrait-40-50",
    name: "Portrait photo (40 × 50 mm)",
    width: 40,
    height: 50,
    unit: "mm",
    aspectRatio: 40 / 50, // 0.8 (4:5)
    description:
      "Standard portrait dimension (40 × 50 mm) frequently requested for civil identity cards, driving permits, university credentials, and administrative documentation.",
    category: "portrait",
    isOfficial: false,
    countryOrStandard: "General Administrative Portrait",
  },
  {
    id: "square-2x2-inch",
    name: "Square photo (2 × 2 inches)",
    width: 2,
    height: 2,
    unit: "inch",
    aspectRatio: 1.0, // 1:1
    description:
      "Square 2 × 2 inch format (50.8 × 50.8 mm) commonly requested for US Visa, US Passport, and Indian OCI applications. Check specific embassy guidelines for biometric head sizing.",
    category: "square",
    isOfficial: false,
    countryOrStandard: "US Visa / Passport / OCI Style",
  },
  {
    id: "custom",
    name: "Custom dimensions",
    width: 35,
    height: 45,
    unit: "mm",
    aspectRatio: 35 / 45,
    description:
      "User-defined custom width, height, and unit (mm, cm, or inches). Supports decimal measurements and live aspect-ratio calculation.",
    category: "custom",
    isOfficial: false,
  },
] as const;

/**
 * Extended configurable presets for common national and administrative standards.
 * Each entry includes explicit `isOfficial: false` unless verified against an authoritative source.
 */
export const EXTENDED_PHOTO_PRESETS: readonly PhotoPreset[] = [
  {
    id: "india-pan-25-35",
    name: "Indian PAN Card / Govt Photo (25 × 35 mm)",
    width: 25,
    height: 35,
    unit: "mm",
    aspectRatio: 25 / 35, // ~0.7143 (5:7)
    description:
      "Standard portrait photo dimension commonly requested for Indian PAN card applications (NSDL / UTIITSL) and state government identity forms.",
    category: "identity",
    isOfficial: false,
    countryOrStandard: "India (PAN / State Administrative)",
  },
  {
    id: "stamp-size-20-25",
    name: "Stamp Size Photo (20 × 25 mm)",
    width: 20,
    height: 25,
    unit: "mm",
    aspectRatio: 20 / 25, // 0.8 (4:5)
    description:
      "Compact document stamp size portrait photo (20 × 25 mm) frequently used for official registers, certificates, and student record books.",
    category: "standard",
    isOfficial: false,
    countryOrStandard: "General Administrative Stamp Size",
  },
  {
    id: "canada-passport-50-70",
    name: "Canada Passport Style (50 × 70 mm)",
    width: 50,
    height: 70,
    unit: "mm",
    aspectRatio: 50 / 70, // ~0.7143 (5:7)
    description:
      "Large portrait format (50 × 70 mm) specified by Passport Program Canada. Verification of commercial photographer stamp and date of photo is required by authorities.",
    category: "passport",
    isOfficial: false,
    countryOrStandard: "Canada Passport Program Style",
  },
  {
    id: "schengen-visa-35-45",
    name: "Schengen Visa Style (35 × 45 mm)",
    width: 35,
    height: 45,
    unit: "mm",
    aspectRatio: 35 / 45,
    description:
      "European Union Schengen Area visa application standard. Requires 70% to 80% face coverage from chin to crown.",
    category: "visa",
    isOfficial: false,
    countryOrStandard: "EU Schengen Visa Style",
  },
] as const;

/**
 * Combined list of all photo presets.
 */
export const ALL_PHOTO_PRESETS: readonly PhotoPreset[] = [
  ...INITIAL_PHOTO_PRESETS,
  ...EXTENDED_PHOTO_PRESETS,
] as const;

/**
 * Default preset selected on initial load: Standard Passport-style 35 × 45 mm.
 */
export const DEFAULT_PRESET: PhotoPreset = INITIAL_PHOTO_PRESETS[0];

/**
 * Advisory notice string displayed in UI.
 */
export const PRESET_DISCLAIMER_TEXT =
  "Official Notice: Photo requirements vary across countries and consulates. These presets provide standard aspect ratios and physical dimensions, but do not guarantee compliance with specific facial coverage, head height, or lighting standards. Always verify official government guidelines before submission.";
