/**
 * Design Studio — Multi-Copy Print Sheet Types & Contracts
 */

import type { DesignDocument, DesignOrientation } from "@/types/design-studio";

export type PrintPaperSize = "a4" | "4x6" | "custom";

export type DuplexFlipEdge = "long-edge" | "short-edge";

export type CutGuideStyle = "corners" | "full-lines" | "border" | "none";

export interface PrintPaperDimensions {
  widthMm: number;
  heightMm: number;
  name: string;
}

export const STANDARD_PRINT_PAPERS: Record<"a4" | "4x6", PrintPaperDimensions> = {
  a4: {
    widthMm: 210,
    heightMm: 297,
    name: "ISO A4 (210 × 297 mm)",
  },
  "4x6": {
    widthMm: 101.6,
    heightMm: 152.4,
    name: "Photo 4 × 6 in (101.6 × 152.4 mm)",
  },
};

export interface PrintSheetConfig {
  /** Paper size standard or custom */
  paperSize: PrintPaperSize;
  /** Custom paper dimensions if paperSize is "custom" */
  customPaperWidthMm?: number;
  customPaperHeightMm?: number;
  /** Paper orientation */
  orientation: DesignOrientation;
  /** Desired number of copies across all sheets */
  copies: number;
  /** Page selection mode: "front-only" | "back-only" | "both-duplex" */
  pageSelection: "front-only" | "back-only" | "both-duplex";
  /** Front page ID in document */
  frontPageId?: string;
  /** Back page ID in document */
  backPageId?: string;
  /** Duplex printer tumble binding */
  duplexFlipEdge: DuplexFlipEdge;
  /** Page margins in millimeters */
  marginsMm: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  /** Spacing gap between card cells in millimeters */
  spacingMm: {
    horizontal: number;
    vertical: number;
  };
  /** Card rotation in sheet (0 or 90 degrees) to optimize utilization */
  rotateCard: boolean;
  /** Alignment inside printable boundary */
  alignment: "center" | "top-left";
  /** Cut guide options */
  cutGuides: {
    enabled: boolean;
    style: CutGuideStyle;
    color: string;
    widthPt: number;
    includeBorder: boolean;
    borderColor: string;
  };
  /** Target print DPI */
  dpi: number;
}

export interface PlacedCardPosition {
  /** Row index (0-based) */
  row: number;
  /** Column index (0-based) */
  col: number;
  /** Sheet index (0-based) */
  sheetIndex: number;
  /** Physical X coordinate in mm from paper top-left */
  xMm: number;
  /** Physical Y coordinate in mm from paper top-left */
  yMm: number;
  /** Card width in mm */
  widthMm: number;
  /** Card height in mm */
  heightMm: number;
  /** Logical points X on paper */
  xPt: number;
  /** Logical points Y on paper */
  yPt: number;
  /** Logical points width */
  widthPt: number;
  /** Logical points height */
  heightPt: number;
  /** Whether card is rotated 90 degrees */
  isRotated: boolean;
  /** Page design ID assigned to this position */
  designPageId: string;
}

export interface PrintSheetLayoutResult {
  /** Effective paper dimensions */
  paperWidthMm: number;
  paperHeightMm: number;
  paperWidthPt: number;
  paperHeightPt: number;
  /** Card dimensions after optional rotation */
  cardWidthMm: number;
  cardHeightMm: number;
  cardWidthPt: number;
  cardHeightPt: number;
  /** Capacity calculations */
  columns: number;
  rows: number;
  capacityPerSheet: number;
  totalCopiesRequested: number;
  totalCopiesPlaced: number;
  totalSheetsRequired: number;
  /** Calculated placements grouped by sheet */
  sheets: {
    sheetIndex: number;
    isBackSide: boolean;
    cards: PlacedCardPosition[];
  }[];
  /** Warning message if capacity is tight or zero */
  warning?: string;
}
