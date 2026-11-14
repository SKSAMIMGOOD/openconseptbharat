import { DimensionUnit } from "./crop-preset";

export type SheetPaperSize = "a4" | "4x6";

export type SheetOrientation = "landscape" | "portrait";

export type SheetDpiPreset = 150 | 200 | 300 | 600 | "custom";

export type CutGuideStyle = "none" | "thin_solid" | "dashed" | "corner_crop_marks";

export type SheetExportFormat = "application/pdf" | "image/png" | "image/jpeg";

export interface SheetMargins {
  topMm: number;
  bottomMm: number;
  leftMm: number;
  rightMm: number;
  uniform: boolean;
}

export interface SheetSpacing {
  horizontalMm: number;
  verticalMm: number;
  uniform: boolean;
}

export interface CutGuidesConfig {
  enabled: boolean;
  style: CutGuideStyle;
  color: string;
  thicknessPx: number;
  includeInExport: boolean;
}

export interface PhotoSheetConfig {
  paperSize?: SheetPaperSize; // "a4" (default in Phase 03E) or "4x6"
  orientation: SheetOrientation;
  paperWidthInches: number; // For A4: 8.2677 in (portrait) or 11.6929 in (landscape)
  paperHeightInches: number; // For A4: 11.6929 in (portrait) or 8.2677 in (landscape)
  dpi: number;
  layoutMode: "auto" | "manual";
  manualRows: number;
  manualCols: number;
  copies: number;
  centerAlignment: boolean;
  margins: SheetMargins;
  spacing: SheetSpacing;
  cutGuides: CutGuidesConfig;
  maxColumnLimit?: number;
}

export interface PhotoPlacement {
  index: number;
  row: number;
  col: number;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  xPx: number;
  yPx: number;
  widthPx: number;
  heightPx: number;
}

export interface SheetCalculationResult {
  paperSize: SheetPaperSize;
  orientation: SheetOrientation;
  dpi: number;
  sheetWidthInches: number;
  sheetHeightInches: number;
  sheetWidthMm: number;
  sheetHeightMm: number;
  sheetWidthPx: number;
  sheetHeightPx: number;
  pageWidthPt: number;
  pageHeightPt: number;
  photoWidthMm: number;
  photoHeightMm: number;
  photoWidthPx: number;
  photoHeightPx: number;
  maxColumns: number;
  maxRows: number;
  maxCapacity: number;
  activeColumns: number;
  activeRows: number;
  requestedCopies: number;
  totalPhotos: number;
  copiesExceedCapacity: boolean;
  exceededByCount: number;
  capacityWarningMessage?: string;
  gridTotalWidthMm: number;
  gridTotalHeightMm: number;
  effectiveMarginLeftMm: number;
  effectiveMarginTopMm: number;
  placements: PhotoPlacement[];
  isOverflowing: boolean;
  overflowReason?: string;
}

export interface SheetExportOptions {
  format: SheetExportFormat;
  quality?: number; // For JPEG (0.01 to 1.0, default 0.95)
  includeCutGuides?: boolean;
  fileName?: string;
}

export interface SheetExportResult {
  blob: Blob;
  fileName: string;
  format: SheetExportFormat;
  widthPx?: number;
  heightPx?: number;
  pageWidthPt?: number;
  pageHeightPt?: number;
  pageCount?: number;
  sizeBytes: number;
}
