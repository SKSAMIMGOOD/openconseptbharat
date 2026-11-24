/**
 * Multiple Photo Maker Engine (Phase 03F)
 *
 * Implements pure calculations for:
 * - Multi-photo sheet arrangement & predictable ordering (sequential A A A, B B B, C C C)
 * - Dimension unit conversion (inch, cm, mm) preserving physical size
 * - Exact DPI-to-pixel projection formula: pixels = (mm / 25.4) * DPI
 * - Layout calculation with top-aligned placement, maximum 4 photos per row, and no vertical centering
 * - 100% in-browser processing, zero persistent storage, deterministic memory safety
 */

import type { DimensionUnit } from "@/types/crop-preset";
import type {
  SheetPaperSize,
  SheetOrientation,
  PhotoSheetConfig,
  SheetCalculationResult,
  SheetMargins,
  SheetSpacing,
  CutGuidesConfig,
} from "@/types/photo-sheet";
import {
  SHEET_A4_SHORT_EDGE_INCHES,
  SHEET_A4_LONG_EDGE_INCHES,
  SHEET_4X6_SHORT_EDGE_INCHES,
  SHEET_4X6_LONG_EDGE_INCHES,
  DEFAULT_A4_SHEET_MARGINS,
  DEFAULT_SHEET_MARGINS,
  DEFAULT_4X6_LANDSCAPE_SHEET_MARGINS,
  DEFAULT_A4_SHEET_SPACING,
  DEFAULT_4X6_SHEET_SPACING,
  DEFAULT_4X6_LANDSCAPE_SHEET_SPACING,
  DEFAULT_CUT_GUIDES,
} from "../../constants/photo-sheet.ts";
import {
  DEFAULT_A4_PHOTO_WIDTH_MM,
  DEFAULT_A4_PHOTO_HEIGHT_MM,
  DEFAULT_4X6_PHOTO_WIDTH_MM,
  DEFAULT_4X6_PHOTO_HEIGHT_MM,
  DEFAULT_4X6_LANDSCAPE_PHOTO_WIDTH_MM,
  DEFAULT_4X6_LANDSCAPE_PHOTO_HEIGHT_MM,
  PHOTO_DIMENSION_PRESETS,
} from "../../constants/photo-dimensions.ts";
import type {
  UploadedPhoto,
  MultiplePhotoDimensions,
  MultiplePhotoConfig,
  MultiPhotoArrangementResult,
} from "@/types/multiple-photo";

/** Exact international inch to millimeter conversion constant */
export const MM_PER_INCH = 25.4;
export const MM_PER_CM = 10;
export const CM_PER_INCH = 2.54;

export {
  SHEET_A4_SHORT_EDGE_INCHES,
  SHEET_A4_LONG_EDGE_INCHES,
  SHEET_4X6_SHORT_EDGE_INCHES,
  SHEET_4X6_LONG_EDGE_INCHES,
  DEFAULT_A4_PHOTO_WIDTH_MM,
  DEFAULT_A4_PHOTO_HEIGHT_MM,
  DEFAULT_4X6_PHOTO_WIDTH_MM,
  DEFAULT_4X6_PHOTO_HEIGHT_MM,
  DEFAULT_4X6_LANDSCAPE_PHOTO_WIDTH_MM,
  DEFAULT_4X6_LANDSCAPE_PHOTO_HEIGHT_MM,
};

/** Default physical photo dimensions: 1.1 × 1.35 inches (for 4×6 compact preset) */
export const DEFAULT_PHOTO_WIDTH_INCHES = 1.1;
export const DEFAULT_PHOTO_HEIGHT_INCHES = 1.35;
export const DEFAULT_PHOTO_UNIT: DimensionUnit = "inch";

/** Supported DPI presets */
export const MULTI_PHOTO_DPI_PRESETS = [150, 200, 300, 600] as const;
export const DEFAULT_MULTI_PHOTO_DPI = 300;

/** Default physical dimensions in millimeters for 1.1 × 1.35 in photos */
export const DEFAULT_PHOTO_WIDTH_MM = 27.94;
export const DEFAULT_PHOTO_HEIGHT_MM = 34.29;

/** Default cutting guides synchronized with Photo Studio */
export const DEFAULT_MULTI_PHOTO_CUT_GUIDES: CutGuidesConfig = {
  ...DEFAULT_CUT_GUIDES,
  style: "corner_crop_marks",
  color: "#94a3b8",
};

/** Default A4 margins in millimeters (synchronized with Professional Photo Studio) */
export const DEFAULT_MULTI_PHOTO_A4_MARGINS: SheetMargins = {
  ...DEFAULT_A4_SHEET_MARGINS,
};

/** Default 4x6 portrait margins in millimeters (synchronized with Professional Photo Studio) */
export const DEFAULT_MULTI_PHOTO_4X6_MARGINS: SheetMargins = {
  ...DEFAULT_SHEET_MARGINS,
};

/** Default 4x6 landscape margins in millimeters (synchronized with Professional Photo Studio) */
export const DEFAULT_MULTI_PHOTO_4X6_LANDSCAPE_MARGINS: SheetMargins = {
  ...DEFAULT_4X6_LANDSCAPE_SHEET_MARGINS,
};

/** Default A4 spacing in millimeters (synchronized with Professional Photo Studio) */
export const DEFAULT_MULTI_PHOTO_A4_SPACING: SheetSpacing = {
  ...DEFAULT_A4_SHEET_SPACING,
};

/** Default 4x6 portrait spacing in millimeters (synchronized with Professional Photo Studio) */
export const DEFAULT_MULTI_PHOTO_4X6_SPACING: SheetSpacing = {
  ...DEFAULT_4X6_SHEET_SPACING,
};

/** Default 4x6 landscape spacing in millimeters (synchronized with Professional Photo Studio) */
export const DEFAULT_MULTI_PHOTO_4X6_LANDSCAPE_SPACING: SheetSpacing = {
  ...DEFAULT_4X6_LANDSCAPE_SHEET_SPACING,
};

/**
 * Converts a dimension value to physical millimeters.
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
 * Converts physical millimeters to a target unit.
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
 * Converts dimension value directly between any two units with rounding.
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
 * Calculates output pixel dimensions from physical photo dimensions and DPI.
 *
 * Formula: pixels = (millimeters / 25.4) * DPI
 *
 * Example:
 * Width = 1.1 inches (27.94 mm), DPI = 300 -> 330 pixels.
 * Height = 1.35 inches (34.29 mm), DPI = 300 -> 405 pixels.
 */
export function calculatePhotoPixels(
  width: number,
  height: number,
  unit: DimensionUnit,
  dpi: number
): { widthPx: number; heightPx: number } {
  if (width <= 0 || height <= 0 || dpi <= 0) {
    return { widthPx: 0, heightPx: 0 };
  }
  const widthMm = unitToMm(width, unit);
  const heightMm = unitToMm(height, unit);

  const widthPx = Math.round((widthMm / MM_PER_INCH) * dpi);
  const heightPx = Math.round((heightMm / MM_PER_INCH) * dpi);

  return { widthPx, heightPx };
}

/**
 * Converts photo dimensions to a target unit without altering physical size.
 */
export function convertPhotoDimensions(
  dimensions: MultiplePhotoDimensions,
  targetUnit: DimensionUnit
): MultiplePhotoDimensions {
  if (dimensions.unit === targetUnit) {
    return { ...dimensions };
  }

  const decimals = targetUnit === "inch" ? 2 : targetUnit === "cm" ? 2 : 2;
  const newWidth = convertUnit(dimensions.width, dimensions.unit, targetUnit, decimals);
  const newHeight = convertUnit(dimensions.height, dimensions.unit, targetUnit, decimals);

  return {
    width: newWidth,
    height: newHeight,
    unit: targetUnit,
  };
}

/**
 * Expands an array of uploaded photos by their requested copy count into a flat, predictable sequence.
 *
 * Example:
 * Photo A (3 copies), Photo B (3 copies), Photo C (3 copies)
 * Returns: [A, A, A, B, B, B, C, C, C]
 */
export function flattenPhotoCopies(photos: UploadedPhoto[]): UploadedPhoto[] {
  const result: UploadedPhoto[] = [];
  for (const photo of photos) {
    const count = Math.max(0, Math.round(photo.copies) || 0);
    for (let c = 0; c < count; c++) {
      result.push(photo);
    }
  }
  return result;
}

/**
 * Creates default configuration for the Multiple Photo Maker tool.
 * Default dimensions, margins, and spacing match Professional Photo Studio source of truth.
 */
export function createDefaultMultiplePhotoConfig(
  paperSize: SheetPaperSize = "a4",
  orientation?: SheetOrientation
): MultiplePhotoConfig {
  const isA4 = paperSize === "a4";
  const defaultOrientation: SheetOrientation =
    orientation || (isA4 ? "portrait" : "landscape");
  const isLandscape = defaultOrientation === "landscape";

  let dimensions: MultiplePhotoDimensions;
  let margins: SheetMargins;
  let spacing: SheetSpacing;

  if (isA4) {
    dimensions = {
      width: DEFAULT_A4_PHOTO_WIDTH_MM, // 26.94 mm (27 × 32 mm standard)
      height: DEFAULT_A4_PHOTO_HEIGHT_MM, // 32.33 mm
      unit: "mm",
      presetId: "a4_compact_default",
    };
    margins = { ...DEFAULT_MULTI_PHOTO_A4_MARGINS };
    spacing = { ...DEFAULT_MULTI_PHOTO_A4_SPACING };
  } else if (isLandscape) {
    dimensions = {
      width: DEFAULT_4X6_LANDSCAPE_PHOTO_WIDTH_MM, // 24.5533333333333 mm
      height: DEFAULT_4X6_LANDSCAPE_PHOTO_HEIGHT_MM, // 30.1413333333333 mm
      unit: "mm",
      presetId: "compact_4x6_landscape",
    };
    margins = { ...DEFAULT_MULTI_PHOTO_4X6_LANDSCAPE_MARGINS };
    spacing = { ...DEFAULT_MULTI_PHOTO_4X6_LANDSCAPE_SPACING };
  } else {
    dimensions = {
      width: DEFAULT_PHOTO_WIDTH_INCHES, // 1.1 in (27.94 mm)
      height: DEFAULT_PHOTO_HEIGHT_INCHES, // 1.35 in (34.29 mm)
      unit: "inch",
      presetId: "compact_default",
    };
    margins = { ...DEFAULT_MULTI_PHOTO_4X6_MARGINS };
    spacing = { ...DEFAULT_MULTI_PHOTO_4X6_SPACING };
  }

  return {
    dimensions,
    dpi: DEFAULT_MULTI_PHOTO_DPI,
    paperSize,
    orientation: defaultOrientation,
    defaultCopiesPerPhoto: 3,
    margins,
    spacing,
    columnsMode: "auto",
    cutGuides: { ...DEFAULT_MULTI_PHOTO_CUT_GUIDES },
  };
}

/**
 * Builds the PhotoSheetConfig object parameterized for Multiple Photo Maker.
 */
export function buildPhotoSheetConfig(
  config: MultiplePhotoConfig,
  totalRequestedCopies: number
): PhotoSheetConfig {
  const isA4 = config.paperSize === "a4";
  const paperWidthInches = isA4
    ? (config.orientation === "landscape" ? SHEET_A4_LONG_EDGE_INCHES : SHEET_A4_SHORT_EDGE_INCHES)
    : (config.orientation === "landscape" ? SHEET_4X6_LONG_EDGE_INCHES : SHEET_4X6_SHORT_EDGE_INCHES);
  const paperHeightInches = isA4
    ? (config.orientation === "landscape" ? SHEET_A4_SHORT_EDGE_INCHES : SHEET_A4_LONG_EDGE_INCHES)
    : (config.orientation === "landscape" ? SHEET_4X6_SHORT_EDGE_INCHES : SHEET_4X6_LONG_EDGE_INCHES);

  const isManualCols = typeof config.columnsMode === "number";
  const manualCols = isManualCols ? Math.max(1, config.columnsMode as number) : 4;
  const manualRows = Math.max(1, Math.ceil(Math.max(1, totalRequestedCopies) / manualCols));

  // 4x6 portrait centers horizontally while staying top-aligned; A4 and 4x6 landscape are top-left printable region
  const centerAlignment = config.paperSize === "4x6" && config.orientation === "portrait";

  return {
    paperSize: config.paperSize,
    orientation: config.orientation,
    paperWidthInches,
    paperHeightInches,
    dpi: config.dpi,
    layoutMode: isManualCols ? "manual" : "auto",
    manualCols,
    manualRows,
    copies: Math.max(1, totalRequestedCopies),
    centerAlignment,
    margins: config.margins,
    spacing: config.spacing,
    cutGuides: config.cutGuides,
  };
}

/**
 * Maps an array of uploaded photos to sheet placements in predictable sequential order.
 */
export function arrangePhotosOnLayout(
  photos: UploadedPhoto[],
  layout: SheetCalculationResult
): MultiPhotoArrangementResult {
  const flatPhotos = flattenPhotoCopies(photos);
  const totalRequestedCopies = flatPhotos.length;
  const placements: MultiPhotoArrangementResult["placements"] = [];
  const totalToPlace = Math.min(flatPhotos.length, layout.placements.length);

  const photoCopyCounter = new Map<string, number>();

  for (let i = 0; i < totalToPlace; i++) {
    const photo = flatPhotos[i];
    const currentCopy = (photoCopyCounter.get(photo.id) || 0) + 1;
    photoCopyCounter.set(photo.id, currentCopy);

    const originalPhotoIndex = photos.findIndex((p) => p.id === photo.id);

    placements.push({
      placement: layout.placements[i],
      photo,
      photoIndex: originalPhotoIndex >= 0 ? originalPhotoIndex : 0,
      copyIndex: currentCopy,
    });
  }

  const unplacedCopiesCount = Math.max(0, totalRequestedCopies - totalToPlace);
  const isCapacityExceeded = totalRequestedCopies > layout.maxCapacity || unplacedCopiesCount > 0;

  return {
    layout: {
      ...layout,
      totalPhotos: totalToPlace,
    },
    totalRequestedCopies,
    totalPlacedPhotos: totalToPlace,
    unplacedCopiesCount,
    isCapacityExceeded,
    placements,
  };
}

/**
 * High-level arrangement calculator combining configuration, photo list, and sheet layout.
 */
export function calculateMultiPhotoArrangement(
  photos: UploadedPhoto[],
  config: MultiplePhotoConfig,
  calculateLayoutFn: (
    sheetConfig: PhotoSheetConfig,
    photoDims: { widthMm: number; heightMm: number }
  ) => SheetCalculationResult
): MultiPhotoArrangementResult {
  const widthMm = unitToMm(config.dimensions.width, config.dimensions.unit);
  const heightMm = unitToMm(config.dimensions.height, config.dimensions.unit);
  const flatPhotos = flattenPhotoCopies(photos);
  const sheetConfig = buildPhotoSheetConfig(config, flatPhotos.length);
  const layout = calculateLayoutFn(sheetConfig, { widthMm, heightMm });
  return arrangePhotosOnLayout(photos, layout);
}

/**
 * Generates standardized filename for multiple photo sheet exports.
 */
export function generateMultiPhotoFileName(
  paperSize: SheetPaperSize,
  orientation: SheetOrientation,
  dpi: number,
  format: "pdf" | "png" | "jpeg",
  photoCount: number
): string {
  const ext = format === "pdf" ? ".pdf" : format === "png" ? ".png" : ".jpg";
  const timestamp = Date.now().toString().slice(-6);
  return `multiple-photo-sheet-${paperSize}-${orientation}-${photoCount}photos-${dpi}dpi-${timestamp}${ext}`;
}

export interface MultiSheetPage {
  pageIndex: number;
  totalPages: number;
  photos: UploadedPhoto[];
  layout: SheetCalculationResult;
  imageSources: (any)[];
}

/**
 * Calculates pagination across multiple physical sheets when photos exceed single-sheet capacity.
 *
 * Rules:
 * - If photos fit on 1 sheet (page is not full), exactly 1 page is generated.
 * - If photos fill a sheet, remaining photos cleanly shift onto subsequent sheets.
 * - Each sheet strictly respects top-aligned rows, margins, and maximum 4 columns.
 */
export function calculateMultiSheetPages(
  photos: UploadedPhoto[],
  config: MultiplePhotoConfig,
  calculateLayoutFn: (
    sheetConfig: PhotoSheetConfig,
    photoDims: { widthMm: number; heightMm: number }
  ) => SheetCalculationResult
): MultiSheetPage[] {
  const flatPhotos = flattenPhotoCopies(photos);
  if (flatPhotos.length === 0) return [];

  const widthMm = unitToMm(config.dimensions.width, config.dimensions.unit);
  const heightMm = unitToMm(config.dimensions.height, config.dimensions.unit);

  // Probe single sheet to determine maxCapacity
  const probeConfig = buildPhotoSheetConfig(config, flatPhotos.length);
  const probeLayout = calculateLayoutFn(probeConfig, { widthMm, heightMm });
  const maxCapacity = Math.max(1, probeLayout.maxCapacity);

  const totalPages = Math.max(1, Math.ceil(flatPhotos.length / maxCapacity));
  const pages: MultiSheetPage[] = [];

  for (let i = 0; i < totalPages; i++) {
    const pagePhotos = flatPhotos.slice(i * maxCapacity, (i + 1) * maxCapacity);
    const pageSheetConfig = buildPhotoSheetConfig(config, pagePhotos.length);
    const pageLayout = calculateLayoutFn(pageSheetConfig, { widthMm, heightMm });

    const imageSources = pageLayout.placements.map((p) => {
      if (p.index < pagePhotos.length) {
        return pagePhotos[p.index].imageElement || null;
      }
      return null;
    });

    pages.push({
      pageIndex: i,
      totalPages,
      photos: pagePhotos,
      layout: pageLayout,
      imageSources,
    });
  }

  return pages;
}

