/**
 * Design Studio — Multi-Copy Print Sheet Calculation & Imposition Engine
 *
 * Mathematically calculates optimal N-up card grid placement on A4, 4×6,
 * or custom paper, with exact margin reservation, spacing gaps, cut marks,
 * and duplex front/back column alignment for long-edge or short-edge printing.
 */

import type { DesignDocument } from "../../../types/design-studio.ts";
import type {
  PrintSheetConfig,
  PrintSheetLayoutResult,
  PlacedCardPosition,
} from "../../../types/design-print-sheet.ts";
import { STANDARD_PRINT_PAPERS } from "../../../types/design-print-sheet.ts";
import { mmToPoints } from "../../../constants/design-dimensions.ts";

/**
 * Calculates print sheet imposition and geometric placement.
 */
export function calculatePrintSheetLayout(
  document: DesignDocument,
  config: PrintSheetConfig
): PrintSheetLayoutResult {
  // 1. Resolve Paper Dimensions
  let basePaperW = 210;
  let basePaperH = 297;

  if (config.paperSize === "a4") {
    basePaperW = STANDARD_PRINT_PAPERS.a4.widthMm;
    basePaperH = STANDARD_PRINT_PAPERS.a4.heightMm;
  } else if (config.paperSize === "4x6") {
    basePaperW = STANDARD_PRINT_PAPERS["4x6"].widthMm;
    basePaperH = STANDARD_PRINT_PAPERS["4x6"].heightMm;
  } else if (config.paperSize === "custom") {
    basePaperW = Math.max(50, config.customPaperWidthMm || 210);
    basePaperH = Math.max(50, config.customPaperHeightMm || 297);
  }

  const isPaperLandscape = config.orientation === "landscape";
  const paperWidthMm = isPaperLandscape ? Math.max(basePaperW, basePaperH) : Math.min(basePaperW, basePaperH);
  const paperHeightMm = isPaperLandscape ? Math.min(basePaperW, basePaperH) : Math.max(basePaperW, basePaperH);

  const paperWidthPt = mmToPoints(paperWidthMm);
  const paperHeightPt = mmToPoints(paperHeightMm);

  // 2. Resolve Card Dimensions from Document
  const isDocLandscape = document.orientation === "landscape";
  const baseCardW = isDocLandscape
    ? Math.max(document.dimensions.widthMm, document.dimensions.heightMm)
    : Math.min(document.dimensions.widthMm, document.dimensions.heightMm);
  const baseCardH = isDocLandscape
    ? Math.min(document.dimensions.widthMm, document.dimensions.heightMm)
    : Math.max(document.dimensions.widthMm, document.dimensions.heightMm);

  // Apply optional 90-degree card rotation
  const cardWidthMm = config.rotateCard ? baseCardH : baseCardW;
  const cardHeightMm = config.rotateCard ? baseCardW : baseCardH;
  const cardWidthPt = mmToPoints(cardWidthMm);
  const cardHeightPt = mmToPoints(cardHeightMm);

  // 3. Calculate Printable Area
  const availWidthMm = paperWidthMm - (config.marginsMm.left + config.marginsMm.right);
  const availHeightMm = paperHeightMm - (config.marginsMm.top + config.marginsMm.bottom);

  if (availWidthMm <= 0 || availHeightMm <= 0 || cardWidthMm > availWidthMm || cardHeightMm > availHeightMm) {
    return {
      paperWidthMm,
      paperHeightMm,
      paperWidthPt,
      paperHeightPt,
      cardWidthMm,
      cardHeightMm,
      cardWidthPt,
      cardHeightPt,
      columns: 0,
      rows: 0,
      capacityPerSheet: 0,
      totalCopiesRequested: config.copies,
      totalCopiesPlaced: 0,
      totalSheetsRequired: 0,
      sheets: [],
      warning: "Card size exceeds printable paper area after margins.",
    };
  }

  // 4. Calculate Columns and Rows (Accounting for spacing between adjacent cards)
  // formula: columns * cardW + (columns - 1) * spacingH <= availWidth
  // columns * (cardW + spacingH) <= availWidth + spacingH
  const colSpacing = Math.max(0, config.spacingMm.horizontal);
  const rowSpacing = Math.max(0, config.spacingMm.vertical);

  const columns = Math.max(
    0,
    Math.floor((availWidthMm + colSpacing) / (cardWidthMm + colSpacing))
  );
  const rows = Math.max(
    0,
    Math.floor((availHeightMm + rowSpacing) / (cardHeightMm + rowSpacing))
  );

  const capacityPerSheet = columns * rows;

  if (capacityPerSheet === 0) {
    return {
      paperWidthMm,
      paperHeightMm,
      paperWidthPt,
      paperHeightPt,
      cardWidthMm,
      cardHeightMm,
      cardWidthPt,
      cardHeightPt,
      columns: 0,
      rows: 0,
      capacityPerSheet: 0,
      totalCopiesRequested: config.copies,
      totalCopiesPlaced: 0,
      totalSheetsRequired: 0,
      sheets: [],
      warning: "Paper margins or card dimensions leave no room for even a single copy.",
    };
  }

  // 5. Grid Origin and Alignment
  const totalGridWidthMm = columns * cardWidthMm + (columns - 1) * colSpacing;
  const totalGridHeightMm = rows * cardHeightMm + (rows - 1) * rowSpacing;

  let originX = config.marginsMm.left;
  let originY = config.marginsMm.top;

  if (config.alignment === "center") {
    originX = config.marginsMm.left + (availWidthMm - totalGridWidthMm) / 2;
    originY = config.marginsMm.top + (availHeightMm - totalGridHeightMm) / 2;
  }

  // 6. Multi-Copy & Multi-Sheet Distribution
  const totalCopiesRequested = Math.max(1, config.copies);
  const sheetsCount = Math.ceil(totalCopiesRequested / capacityPerSheet);

  const frontPageId = config.frontPageId || document.pages[0]?.id || "";
  const backPageId = config.backPageId || document.pages[1]?.id || document.pages[0]?.id || "";
  const isDuplex = config.pageSelection === "both-duplex" && document.pages.length > 1;

  const sheets: PrintSheetLayoutResult["sheets"] = [];
  let remainingCopies = totalCopiesRequested;

  for (let sIdx = 0; sIdx < sheetsCount; sIdx++) {
    const copiesOnThisSheet = Math.min(capacityPerSheet, remainingCopies);
    remainingCopies -= copiesOnThisSheet;

    // FRONT SHEET
    const frontCards: PlacedCardPosition[] = [];
    let placedCount = 0;

    for (let r = 0; r < rows && placedCount < copiesOnThisSheet; r++) {
      for (let c = 0; c < columns && placedCount < copiesOnThisSheet; c++) {
        const xMm = originX + c * (cardWidthMm + colSpacing);
        const yMm = originY + r * (cardHeightMm + rowSpacing);

        frontCards.push({
          row: r,
          col: c,
          sheetIndex: sIdx,
          xMm,
          yMm,
          widthMm: cardWidthMm,
          heightMm: cardHeightMm,
          xPt: mmToPoints(xMm),
          yPt: mmToPoints(yMm),
          widthPt: cardWidthPt,
          heightPt: cardHeightPt,
          isRotated: config.rotateCard,
          designPageId: config.pageSelection === "back-only" ? backPageId : frontPageId,
        });

        placedCount++;
      }
    }

    sheets.push({
      sheetIndex: sIdx * (isDuplex ? 2 : 1),
      isBackSide: false,
      cards: frontCards,
    });

    // BACK SHEET (For Duplex Printing)
    if (isDuplex) {
      const backCards: PlacedCardPosition[] = [];
      // In duplex printing, when sheet is turned:
      // - Long Edge Flip: Horizontal axis flips! Column c maps to (columns - 1 - c).
      // - Short Edge Flip: Vertical axis flips! Row r maps to (rows - 1 - r).
      for (const fCard of frontCards) {
        let backCol = fCard.col;
        let backRow = fCard.row;

        if (config.duplexFlipEdge === "long-edge") {
          backCol = columns - 1 - fCard.col;
        } else {
          backRow = rows - 1 - fCard.row;
        }

        const xMm = originX + backCol * (cardWidthMm + colSpacing);
        const yMm = originY + backRow * (cardHeightMm + rowSpacing);

        backCards.push({
          row: backRow,
          col: backCol,
          sheetIndex: sIdx * 2 + 1,
          xMm,
          yMm,
          widthMm: cardWidthMm,
          heightMm: cardHeightMm,
          xPt: mmToPoints(xMm),
          yPt: mmToPoints(yMm),
          widthPt: cardWidthPt,
          heightPt: cardHeightPt,
          isRotated: config.rotateCard,
          designPageId: backPageId,
        });
      }

      sheets.push({
        sheetIndex: sIdx * 2 + 1,
        isBackSide: true,
        cards: backCards,
      });
    }
  }

  let warning: string | undefined;
  if (totalCopiesRequested > capacityPerSheet) {
    warning = `Requested ${totalCopiesRequested} copies requires ${sheetsCount} sheets (${capacityPerSheet} copies per sheet).`;
  }

  return {
    paperWidthMm,
    paperHeightMm,
    paperWidthPt,
    paperHeightPt,
    cardWidthMm,
    cardHeightMm,
    cardWidthPt,
    cardHeightPt,
    columns,
    rows,
    capacityPerSheet,
    totalCopiesRequested,
    totalCopiesPlaced: totalCopiesRequested,
    totalSheetsRequired: sheets.length,
    sheets,
    warning,
  };
}
