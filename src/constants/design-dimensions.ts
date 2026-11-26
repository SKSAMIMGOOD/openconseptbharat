/**
 * Design Studio — Physical Dimension Presets & Sizing Standards
 *
 * Implements precise real-world dimensions (mm, inches, PostScript points)
 * and print calibration standards for:
 * 1. Visiting Cards (Standard 3.5×2", Euro 85×55mm, Square)
 * 2. Wedding Cards (Royal 5×7", Classic 4×6", Square 6×6")
 * 3. School / College Project Covers (Standard ISO A4, Letter)
 * 4. ID Cards (Standard ISO/IEC 7810 ID-1 CR80 horizontal & vertical)
 */

import type { PhysicalDimensions, DesignCategory, DesignOrientation } from "../types/design-studio.ts";

/** Millimeters per inch (exact international standard) */
export const MM_PER_INCH = 25.4;

/** PostScript points per inch for vector PDF and logical canvas (72 pt = 1 inch) */
export const POINTS_PER_INCH = 72;

/**
 * Converts millimeters to PostScript points.
 * formula: (mm / 25.4) * 72
 */
export function mmToPoints(mm: number): number {
  return Number(((mm / MM_PER_INCH) * POINTS_PER_INCH).toFixed(4));
}

/**
 * Converts PostScript points to millimeters.
 * formula: (points / 72) * 25.4
 */
export function pointsToMm(points: number): number {
  return Number(((points / POINTS_PER_INCH) * MM_PER_INCH).toFixed(4));
}

/**
 * Converts millimeters to raster pixels at specified DPI.
 * formula: round((mm / 25.4) * DPI)
 */
export function mmToPixels(mm: number, dpi: number = 300): number {
  return Math.round((mm / MM_PER_INCH) * dpi);
}

/**
 * Dimension Preset Definition for Design Studio Templates.
 */
export interface DimensionPreset {
  id: string;
  name: string;
  category: DesignCategory;
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  safeMarginMm: number;
  targetDpi: number;
  defaultOrientation: DesignOrientation;
  isStandardDefault: boolean;
  description: string;
}

/**
 * Standard Visiting Card Dimension Presets.
 */
export const VISITING_CARD_PRESETS: readonly DimensionPreset[] = [
  {
    id: "visiting-card-standard",
    name: "Standard Visiting Card (3.5 × 2 in)",
    category: "visiting-card",
    widthMm: 88.9,
    heightMm: 50.8,
    bleedMm: 2.0,
    safeMarginMm: 3.5,
    targetDpi: 300,
    defaultOrientation: "landscape",
    isStandardDefault: true,
    description: "Standard Indian & US commercial business card format (3.5 × 2 inches).",
  },
  {
    id: "visiting-card-euro",
    name: "European Business Card (85 × 55 mm)",
    category: "visiting-card",
    widthMm: 85.0,
    heightMm: 55.0,
    bleedMm: 2.0,
    safeMarginMm: 3.5,
    targetDpi: 300,
    defaultOrientation: "landscape",
    isStandardDefault: false,
    description: "Standard European business card size (85 × 55 mm).",
  },
  {
    id: "visiting-card-square",
    name: "Square Mini Card (65 × 65 mm)",
    category: "visiting-card",
    widthMm: 65.0,
    heightMm: 65.0,
    bleedMm: 2.0,
    safeMarginMm: 3.5,
    targetDpi: 300,
    defaultOrientation: "landscape",
    isStandardDefault: false,
    description: "Creative modern square calling card.",
  },
] as const;

/**
 * Standard Wedding Invitation Card Dimension Presets.
 */
export const WEDDING_CARD_PRESETS: readonly DimensionPreset[] = [
  {
    id: "wedding-card-5x7",
    name: "Royal Invitation (5 × 7 in)",
    category: "wedding-card",
    widthMm: 127.0,
    heightMm: 177.8,
    bleedMm: 3.0,
    safeMarginMm: 5.0,
    targetDpi: 300,
    defaultOrientation: "portrait",
    isStandardDefault: true,
    description: "Classic luxury Indian wedding invitation card (5 × 7 inches).",
  },
  {
    id: "wedding-card-4x6",
    name: "Postcard Invitation (4 × 6 in)",
    category: "wedding-card",
    widthMm: 101.6,
    heightMm: 152.4,
    bleedMm: 3.0,
    safeMarginMm: 5.0,
    targetDpi: 300,
    defaultOrientation: "portrait",
    isStandardDefault: false,
    description: "Standard compact 4 × 6 inch save-the-date or invite card.",
  },
  {
    id: "wedding-card-square-6x6",
    name: "Square Royal Card (6 × 6 in)",
    category: "wedding-card",
    widthMm: 152.4,
    heightMm: 152.4,
    bleedMm: 3.0,
    safeMarginMm: 6.0,
    targetDpi: 300,
    defaultOrientation: "portrait",
    isStandardDefault: false,
    description: "Square 6 × 6 inch ornate invitation card format.",
  },
] as const;

/**
 * Standard Project Report & Assignment Cover Dimension Presets.
 */
export const PROJECT_COVER_PRESETS: readonly DimensionPreset[] = [
  {
    id: "project-cover-a4",
    name: "Standard Academic A4 (210 × 297 mm)",
    category: "project-cover",
    widthMm: 210.0,
    heightMm: 297.0,
    bleedMm: 3.0,
    safeMarginMm: 12.0, // generous binding safe-zone for spiral or thermal binding
    targetDpi: 300,
    defaultOrientation: "portrait",
    isStandardDefault: true,
    description: "Official ISO A4 format for school, college, and university project reports.",
  },
  {
    id: "project-cover-letter",
    name: "US Letter (8.5 × 11 in)",
    category: "project-cover",
    widthMm: 215.9,
    heightMm: 279.4,
    bleedMm: 3.0,
    safeMarginMm: 12.0,
    targetDpi: 300,
    defaultOrientation: "portrait",
    isStandardDefault: false,
    description: "Standard US Letter report cover format (215.9 × 279.4 mm).",
  },
] as const;

/**
 * Standard ID Card Dimension Presets.
 * Governed by ISO/IEC 7810 ID-1 standard (CR80).
 */
export const ID_CARD_PRESETS: readonly DimensionPreset[] = [
  {
    id: "id-card-cr80-horizontal",
    name: "Horizontal ID Card (CR80 Standard)",
    category: "id-card",
    widthMm: 85.6,
    heightMm: 53.98,
    bleedMm: 2.0,
    safeMarginMm: 3.0,
    targetDpi: 300,
    defaultOrientation: "landscape",
    isStandardDefault: true,
    description: "Standard ISO/IEC 7810 ID-1 CR80 card for employee, school & member IDs.",
  },
  {
    id: "id-card-cr80-vertical",
    name: "Vertical Badge ID Card (CR80 Standard)",
    category: "id-card",
    widthMm: 53.98,
    heightMm: 85.6,
    bleedMm: 2.0,
    safeMarginMm: 3.0,
    targetDpi: 300,
    defaultOrientation: "portrait",
    isStandardDefault: false,
    description: "Vertical lanyard badge orientation for corporate and conference passes.",
  },
] as const;

/** All dimension presets across all categories */
export const ALL_DESIGN_DIMENSION_PRESETS: readonly DimensionPreset[] = [
  ...VISITING_CARD_PRESETS,
  ...WEDDING_CARD_PRESETS,
  ...PROJECT_COVER_PRESETS,
  ...ID_CARD_PRESETS,
] as const;

/**
 * Look up the default physical dimensions for a given category.
 */
export function getDefaultDimensionsForCategory(category: DesignCategory): PhysicalDimensions {
  const presets = ALL_DESIGN_DIMENSION_PRESETS.filter((p) => p.category === category);
  const defaultPreset = presets.find((p) => p.isStandardDefault) || presets[0];

  return {
    widthMm: defaultPreset.widthMm,
    heightMm: defaultPreset.heightMm,
    bleedMm: defaultPreset.bleedMm,
    safeMarginMm: defaultPreset.safeMarginMm,
    targetDpi: defaultPreset.targetDpi,
  };
}

/**
 * Look up dimension presets by category.
 */
export function getDimensionPresetsByCategory(category: DesignCategory): DimensionPreset[] {
  return ALL_DESIGN_DIMENSION_PRESETS.filter((p) => p.category === category);
}
