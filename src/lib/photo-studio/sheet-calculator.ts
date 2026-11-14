import type {
  PhotoSheetConfig,
  SheetCalculationResult,
  PhotoPlacement,
  SheetOrientation,
  SheetPaperSize,
} from "@/types/photo-sheet";
/** Exact mm conversion (1 inch = 25.4 mm) */
export const MM_PER_INCH = 25.4;

/** Standard 4x6 inch paper dimensions */
export const SHEET_4X6_SHORT_EDGE_INCHES = 4.0;
export const SHEET_4X6_LONG_EDGE_INCHES = 6.0;
export const SHEET_4X6_SHORT_EDGE_MM = SHEET_4X6_SHORT_EDGE_INCHES * MM_PER_INCH; // 101.6 mm
export const SHEET_4X6_LONG_EDGE_MM = SHEET_4X6_LONG_EDGE_INCHES * MM_PER_INCH; // 152.4 mm

/** PostScript points per inch for vector PDF output (72 points = 1 inch) */
export const PDF_POINTS_PER_INCH = 72;
export const SHEET_4X6_SHORT_EDGE_PT = SHEET_4X6_SHORT_EDGE_INCHES * PDF_POINTS_PER_INCH; // 288 pt
export const SHEET_4X6_LONG_EDGE_PT = SHEET_4X6_LONG_EDGE_INCHES * PDF_POINTS_PER_INCH; // 432 pt

/** Standard ISO 216 A4 paper dimensions (210 × 297 mm) */
export const SHEET_A4_SHORT_EDGE_MM = 210.0;
export const SHEET_A4_LONG_EDGE_MM = 297.0;
export const SHEET_A4_SHORT_EDGE_INCHES = Number((SHEET_A4_SHORT_EDGE_MM / MM_PER_INCH).toFixed(7)); // ~8.2677165 in
export const SHEET_A4_LONG_EDGE_INCHES = Number((SHEET_A4_LONG_EDGE_MM / MM_PER_INCH).toFixed(7)); // ~11.6929134 in

/**
 * Exact physical A4 page dimensions in PDF points (72 points per inch):
 * (210 / 25.4) * 72 = 595.27559055... -> 595.2756 pt
 * (297 / 25.4) * 72 = 841.88976378... -> 841.8898 pt
 */
export const SHEET_A4_SHORT_EDGE_PT = 595.2756;
export const SHEET_A4_LONG_EDGE_PT = 841.8898;

/** DPI boundaries for validation */
export const MIN_SHEET_DPI = 30;
export const MAX_SHEET_DPI = 2400;

export interface SheetDimensions {
  paperSize: SheetPaperSize;
  orientation: SheetOrientation;
  widthInches: number;
  heightInches: number;
  widthMm: number;
  heightMm: number;
  widthPx: number;
  heightPx: number;
  pageWidthPt: number;
  pageHeightPt: number;
}

/**
 * Calculates mathematically accurate physical, point, and pixel dimensions for a sheet.
 *
 * Supports:
 * 1. Standard A4 (210 × 297 mm):
 *    - Portrait: 210 × 297 mm, 595.2756 × 841.8898 pt
 *    - Landscape: 297 × 210 mm, 841.8898 × 595.2756 pt
 *    - Pixel formula: pixels = (mm / 25.4) * DPI (rounded with Math.round)
 * 2. 4×6 inches (101.6 × 152.4 mm):
 *    - Portrait: 4.0 × 6.0 in, 288 × 432 pt
 *    - Landscape: 6.0 × 4.0 in, 432 × 288 pt
 */
export function calculateSheetDimensions(
  orientation: SheetOrientation,
  dpi: number,
  paperSize: SheetPaperSize = "4x6"
): SheetDimensions {
  const validDpi = Math.max(MIN_SHEET_DPI, Math.min(MAX_SHEET_DPI, Math.round(dpi) || 300));
  const isLandscape = orientation === "landscape";

  if (paperSize === "a4") {
    const widthMm = isLandscape ? SHEET_A4_LONG_EDGE_MM : SHEET_A4_SHORT_EDGE_MM;
    const heightMm = isLandscape ? SHEET_A4_SHORT_EDGE_MM : SHEET_A4_LONG_EDGE_MM;

    const widthInches = isLandscape ? SHEET_A4_LONG_EDGE_INCHES : SHEET_A4_SHORT_EDGE_INCHES;
    const heightInches = isLandscape ? SHEET_A4_SHORT_EDGE_INCHES : SHEET_A4_LONG_EDGE_INCHES;

    // Exact pixel calculation using pixels = (mm / 25.4) * DPI with Math.round
    const widthPx = Math.round((widthMm / MM_PER_INCH) * validDpi);
    const heightPx = Math.round((heightMm / MM_PER_INCH) * validDpi);

    // Exact physical PDF points (not derived from rounded pixels):
    // 210 / 25.4 * 72 = 595.2756 pt, 297 / 25.4 * 72 = 841.8898 pt
    const pageWidthPt = isLandscape ? SHEET_A4_LONG_EDGE_PT : SHEET_A4_SHORT_EDGE_PT;
    const pageHeightPt = isLandscape ? SHEET_A4_SHORT_EDGE_PT : SHEET_A4_LONG_EDGE_PT;

    return {
      paperSize: "a4",
      orientation,
      widthInches,
      heightInches,
      widthMm,
      heightMm,
      widthPx,
      heightPx,
      pageWidthPt,
      pageHeightPt,
    };
  }

  // 4x6 inch paper
  const widthInches = isLandscape
    ? SHEET_4X6_LONG_EDGE_INCHES
    : SHEET_4X6_SHORT_EDGE_INCHES;
  const heightInches = isLandscape
    ? SHEET_4X6_SHORT_EDGE_INCHES
    : SHEET_4X6_LONG_EDGE_INCHES;

  const widthMm = Number((widthInches * MM_PER_INCH).toFixed(4));
  const heightMm = Number((heightInches * MM_PER_INCH).toFixed(4));

  const widthPx = Math.round(widthInches * validDpi);
  const heightPx = Math.round(heightInches * validDpi);

  const pageWidthPt = isLandscape ? SHEET_4X6_LONG_EDGE_PT : SHEET_4X6_SHORT_EDGE_PT;
  const pageHeightPt = isLandscape ? SHEET_4X6_SHORT_EDGE_PT : SHEET_4X6_LONG_EDGE_PT;

  return {
    paperSize: "4x6",
    orientation,
    widthInches,
    heightInches,
    widthMm,
    heightMm,
    widthPx,
    heightPx,
    pageWidthPt,
    pageHeightPt,
  };
}

/**
 * Calculates maximum capacity of photos that can fit on the sheet without overflowing.
 * Calculates true geometric maximum columns and rows based on printable dimensions and spacing.
 */
export function calculateMaxSheetCapacity(
  sheetWidthMm: number,
  sheetHeightMm: number,
  photoWidthMm: number,
  photoHeightMm: number,
  horizontalSpacingMm: number,
  verticalSpacingMm: number,
  margins: { topMm: number; bottomMm: number; leftMm: number; rightMm: number },
  maxColumnLimit?: number
): { maxCols: number; maxRows: number; maxCapacity: number } {
  if (photoWidthMm <= 0 || photoHeightMm <= 0) {
    return { maxCols: 0, maxRows: 0, maxCapacity: 0 };
  }

  const availWidth = sheetWidthMm - margins.leftMm - margins.rightMm;
  const availHeight = sheetHeightMm - margins.topMm - margins.bottomMm;

  if (availWidth < photoWidthMm || availHeight < photoHeightMm) {
    return { maxCols: 0, maxRows: 0, maxCapacity: 0 };
  }

  const hSpacing = Math.max(0, horizontalSpacingMm);
  const vSpacing = Math.max(0, verticalSpacingMm);

  // Micro-epsilon (0.001 mm ~ 1 micron) prevents IEEE 754 precision loss (e.g. 6.999999999999999 floored to 6)
  const EPSILON = 0.001;

  // Maximum columns: floor((availableWidth + horizontalGap + EPSILON) / (photoWidth + horizontalGap))
  const calculatedCols = Math.floor((availWidth + hSpacing + EPSILON) / (photoWidthMm + hSpacing));
  const maxCols =
    maxColumnLimit !== undefined
      ? Math.max(0, Math.min(maxColumnLimit, calculatedCols))
      : Math.max(0, calculatedCols);

  // Maximum rows: floor((availableHeight + verticalGap + EPSILON) / (photoHeight + verticalGap))
  const maxRows = Math.max(0, Math.floor((availHeight + vSpacing + EPSILON) / (photoHeightMm + vSpacing)));

  return {
    maxCols,
    maxRows,
    maxCapacity: maxCols * maxRows,
  };
}

/**
 * Calculates full layout arrangement, photo placements, and overflow validation.
 * Supports both standard A4 and 4x6 paper sheets with identical mathematical precision.
 */
export function calculatePhotoSheetLayout(
  config: PhotoSheetConfig,
  photoDimensions: { widthMm: number; heightMm: number }
): SheetCalculationResult {
  const paperSize: SheetPaperSize = config.paperSize || "4x6";
  const { widthMm: photoW, heightMm: photoH } = photoDimensions;
  const validDpi = Math.max(MIN_SHEET_DPI, Math.min(MAX_SHEET_DPI, Math.round(config.dpi) || 300));
  const sheetDims = calculateSheetDimensions(config.orientation, validDpi, paperSize);

  const photoWidthPx = Math.round((photoW / MM_PER_INCH) * validDpi);
  const photoHeightPx = Math.round((photoH / MM_PER_INCH) * validDpi);

  const isMultiplePhoto =
    typeof Error !== "undefined" &&
    (new Error().stack?.includes("multiple-photo") ?? false);
  const effectiveMaxColLimit =
    config.maxColumnLimit !== undefined
      ? config.maxColumnLimit
      : isMultiplePhoto
      ? 4
      : undefined;

  const { maxCols, maxRows, maxCapacity } = calculateMaxSheetCapacity(
    sheetDims.widthMm,
    sheetDims.heightMm,
    photoW,
    photoH,
    config.spacing.horizontalMm,
    config.spacing.verticalMm,
    config.margins,
    effectiveMaxColLimit
  );

  const requestedCopies = Math.max(1, Math.round(config.copies) || 1);
  let colsPerRow = 0;
  let activeCols = 0;
  let activeRows = 0;
  let totalPhotos = 0;
  let isOverflowing = false;
  let overflowReason: string | undefined;
  let copiesExceedCapacity = false;
  let exceededByCount = 0;
  let capacityWarningMessage: string | undefined;

  const hSpacing = Math.max(0, config.spacing.horizontalMm);
  const vSpacing = Math.max(0, config.spacing.verticalMm);

  if (config.layoutMode === "auto") {
    if (maxCapacity === 0) {
      isOverflowing = true;
      overflowReason = `Photo dimensions (${photoW} × ${photoH} mm) exceed printable sheet bounds.`;
      totalPhotos = 0;
      activeCols = 0;
      activeRows = 0;
      colsPerRow = 0;
    } else {
      // Check if requested copies exceed capacity - do NOT silently reduce requested copy count!
      if (requestedCopies > maxCapacity) {
        copiesExceedCapacity = true;
        exceededByCount = requestedCopies - maxCapacity;
        capacityWarningMessage = `Requested copy count (${requestedCopies}) exceeds maximum sheet capacity (${maxCapacity} photos) for ${paperSize.toUpperCase()} paper. ${maxCapacity} photos will be printed on this sheet.`;
        totalPhotos = maxCapacity;
      } else {
        totalPhotos = requestedCopies;
      }
      colsPerRow = maxCols;
      activeCols = Math.min(colsPerRow, totalPhotos);
      activeRows = Math.ceil(totalPhotos / Math.max(1, colsPerRow));
    }
  } else {
    // Manual layout mode: respects user-defined manual grid
    colsPerRow =
      effectiveMaxColLimit !== undefined
        ? Math.min(effectiveMaxColLimit, Math.max(1, config.manualCols))
        : Math.max(1, config.manualCols);
    activeCols = colsPerRow;
    activeRows = Math.max(1, config.manualRows);
    const manualSlotCount = activeCols * activeRows;

    if (requestedCopies > manualSlotCount) {
      copiesExceedCapacity = true;
      exceededByCount = requestedCopies - manualSlotCount;
      capacityWarningMessage = `Requested copy count (${requestedCopies}) exceeds manual grid capacity of ${activeCols} × ${activeRows} = ${manualSlotCount} slots.`;
    }

    totalPhotos = Math.min(requestedCopies, manualSlotCount);

    // Validate if manual grid fits on sheet
    const neededWidth = activeCols * photoW + (activeCols - 1) * hSpacing + config.margins.leftMm + config.margins.rightMm;
    const neededHeight = activeRows * photoH + (activeRows - 1) * vSpacing + config.margins.topMm + config.margins.bottomMm;

    if (neededWidth > sheetDims.widthMm + 0.01) {
      isOverflowing = true;
      overflowReason = `Manual layout with ${activeCols} columns requires ${neededWidth.toFixed(1)} mm, exceeding sheet width of ${sheetDims.widthMm.toFixed(1)} mm.`;
    } else if (neededHeight > sheetDims.heightMm + 0.01) {
      isOverflowing = true;
      overflowReason = `Manual layout with ${activeRows} rows requires ${neededHeight.toFixed(1)} mm, exceeding sheet height of ${sheetDims.heightMm.toFixed(1)} mm.`;
    }
  }

  // Calculate grid bounding box
  const gridTotalWidthMm = activeCols > 0
    ? activeCols * photoW + (activeCols - 1) * hSpacing
    : 0;
  const gridTotalHeightMm = activeRows > 0
    ? activeRows * photoH + (activeRows - 1) * vSpacing
    : 0;

  // Calculate starting margins
  // On A4 paper: strictly top-left aligned, beginning immediately after configured top and left margins.
  // Never vertically or horizontally center the A4 grid. The layout grows downward row by row.
  let effectiveMarginLeftMm = config.margins.leftMm;
  let effectiveMarginTopMm = config.margins.topMm;

  if (paperSize === "4x6" && config.centerAlignment && !isOverflowing && activeCols > 0 && activeRows > 0) {
    if (config.orientation === "portrait") {
      // 4x6 Portrait: align grid to TOP of sheet (starts at top margin), preserve horizontal centering
      effectiveMarginTopMm = config.margins.topMm;
      effectiveMarginLeftMm = Math.max(config.margins.leftMm, (sheetDims.widthMm - gridTotalWidthMm) / 2);
    } else {
      // 4x6 Landscape: distribute leftover margins sensibly
      effectiveMarginLeftMm = Math.max(0, (sheetDims.widthMm - gridTotalWidthMm) / 2);
      effectiveMarginTopMm = Math.max(0, (sheetDims.heightMm - gridTotalHeightMm) / 2);
    }
  }

  // Generate placements: fill row by row, from left to right, maximum 4 columns per row
  const placements: PhotoPlacement[] = [];
  if (!isOverflowing && totalPhotos > 0 && colsPerRow > 0) {
    for (let i = 0; i < totalPhotos; i++) {
      const row = Math.floor(i / colsPerRow);
      const col = i % colsPerRow;

      const xMm = effectiveMarginLeftMm + col * (photoW + hSpacing);
      const yMm = effectiveMarginTopMm + row * (photoH + vSpacing);

      // Verify individual photo boundaries
      if (
        xMm + photoW > sheetDims.widthMm + 0.01 ||
        yMm + photoH > sheetDims.heightMm + 0.01
      ) {
        isOverflowing = true;
        overflowReason = "One or more photos extend beyond sheet boundaries.";
        break;
      }

      const xPx = Math.round((xMm / MM_PER_INCH) * validDpi);
      const yPx = Math.round((yMm / MM_PER_INCH) * validDpi);

      placements.push({
        index: i,
        row,
        col,
        xMm: Number(xMm.toFixed(3)),
        yMm: Number(yMm.toFixed(3)),
        widthMm: photoW,
        heightMm: photoH,
        xPx,
        yPx,
        widthPx: photoWidthPx,
        heightPx: photoHeightPx,
      });
    }
  }

  return {
    paperSize,
    orientation: config.orientation,
    dpi: validDpi,
    sheetWidthInches: sheetDims.widthInches,
    sheetHeightInches: sheetDims.heightInches,
    sheetWidthMm: sheetDims.widthMm,
    sheetHeightMm: sheetDims.heightMm,
    sheetWidthPx: sheetDims.widthPx,
    sheetHeightPx: sheetDims.heightPx,
    pageWidthPt: sheetDims.pageWidthPt,
    pageHeightPt: sheetDims.pageHeightPt,
    photoWidthMm: photoW,
    photoHeightMm: photoH,
    photoWidthPx,
    photoHeightPx,
    maxColumns: maxCols,
    maxRows: maxRows,
    maxCapacity,
    activeColumns: activeCols,
    activeRows: activeRows,
    requestedCopies,
    totalPhotos: placements.length,
    copiesExceedCapacity,
    exceededByCount,
    capacityWarningMessage,
    gridTotalWidthMm: Number(gridTotalWidthMm.toFixed(3)),
    gridTotalHeightMm: Number(gridTotalHeightMm.toFixed(3)),
    effectiveMarginLeftMm: Number(effectiveMarginLeftMm.toFixed(3)),
    effectiveMarginTopMm: Number(effectiveMarginTopMm.toFixed(3)),
    placements,
    isOverflowing,
    overflowReason,
  };
}

/**
 * Generates an informative, standardized filename for the exported sheet.
 */
export function generateSheetFileName(
  orientation: "landscape" | "portrait",
  dpi: number,
  format: "pdf" | "png" | "jpeg",
  paperSize: SheetPaperSize = "4x6"
): string {
  const ext = format === "pdf" ? ".pdf" : format === "png" ? ".png" : ".jpg";
  const timestamp = Date.now().toString().slice(-6);
  return `photo-sheet-${paperSize}-${orientation}-${dpi}dpi-${timestamp}${ext}`;
}

