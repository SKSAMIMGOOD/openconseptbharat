import type {
  PhotoSheetConfig,
  CutGuideStyle,
  SheetDpiPreset,
  SheetPaperSize,
  SheetOrientation,
} from "@/types/photo-sheet";

/** Standard 4x6 inch paper dimensions */
export const SHEET_4X6_SHORT_EDGE_INCHES = 4.0;
export const SHEET_4X6_LONG_EDGE_INCHES = 6.0;

/** Exact mm conversion (1 inch = 25.4 mm) */
export const MM_PER_INCH = 25.4;
export const SHEET_4X6_SHORT_EDGE_MM =
  SHEET_4X6_SHORT_EDGE_INCHES * MM_PER_INCH; // 101.6 mm
export const SHEET_4X6_LONG_EDGE_MM = SHEET_4X6_LONG_EDGE_INCHES * MM_PER_INCH; // 152.4 mm

/** PostScript points per inch for vector PDF output (72 points = 1 inch) */
export const PDF_POINTS_PER_INCH = 72;
export const SHEET_4X6_SHORT_EDGE_PT =
  SHEET_4X6_SHORT_EDGE_INCHES * PDF_POINTS_PER_INCH; // 288 pt
export const SHEET_4X6_LONG_EDGE_PT =
  SHEET_4X6_LONG_EDGE_INCHES * PDF_POINTS_PER_INCH; // 432 pt

/** Standard ISO 216 A4 paper dimensions (210 × 297 mm) */
export const SHEET_A4_SHORT_EDGE_MM = 210.0;
export const SHEET_A4_LONG_EDGE_MM = 297.0;
export const SHEET_A4_SHORT_EDGE_INCHES = Number(
  (SHEET_A4_SHORT_EDGE_MM / MM_PER_INCH).toFixed(7),
); // ~8.2677165 in
export const SHEET_A4_LONG_EDGE_INCHES = Number(
  (SHEET_A4_LONG_EDGE_MM / MM_PER_INCH).toFixed(7),
); // ~11.6929134 in

/**
 * Exact physical A4 page dimensions in PDF points (72 points per inch):
 * (210 / 25.4) * 72 = 595.27559055... -> 595.2756 pt
 * (297 / 25.4) * 72 = 841.88976378... -> 841.8898 pt
 */
export const SHEET_A4_SHORT_EDGE_PT = 595.2756;
export const SHEET_A4_LONG_EDGE_PT = 841.8898;

export interface SheetPaperSizeOption {
  id: SheetPaperSize;
  name: string;
  shortLabel: string;
  dimensionsMm: string;
  dimensionsInches: string;
  description: string;
  defaultOrientation: SheetOrientation;
  defaultCopies: number;
}

export const SHEET_PAPER_SIZES: SheetPaperSizeOption[] = [
  {
    id: "a4",
    name: "A4 Standard Sheet (210 × 297 mm)",
    shortLabel: "A4 Paper",
    dimensionsMm: "210 × 297 mm",
    dimensionsInches: "8.3 × 11.7 in",
    description:
      "Standard office & home paper for large photo grids (up to 30+ photos)",
    defaultOrientation: "portrait",
    defaultCopies: 6,
  },
  {
    id: "4x6",
    name: "4×6″ Photo Paper (102 × 152 mm / 4R)",
    shortLabel: "4×6″ Paper",
    dimensionsMm: "101.6 × 152.4 mm",
    dimensionsInches: "4.0 × 6.0 in",
    description:
      "Standard photo lab print paper (typical 6 to 8 passport photos)",
    defaultOrientation: "landscape",
    defaultCopies: 8,
  },
];

/** Standard DPI presets */
export const SHEET_DPI_PRESETS: {
  value: number;
  label: string;
  description: string;
}[] = [
  {
    value: 150,
    label: "150 DPI",
    description: "Draft / Fast preview (1240 × 1754 px for A4)",
  },
  {
    value: 200,
    label: "200 DPI",
    description: "Standard photo proof (1654 × 2339 px for A4)",
  },
  {
    value: 300,
    label: "300 DPI",
    description: "Lab Print Standard (2480 × 3508 px for A4)",
  },
  {
    value: 600,
    label: "600 DPI",
    description: "Ultra-High Fine Art (4961 × 7016 px for A4)",
  },
];

/** DPI boundaries for validation */
export const MIN_SHEET_DPI = 30;
export const MAX_SHEET_DPI = 2400;
export const DEFAULT_SHEET_DPI = 300;

/** Guide styles */
export const CUT_GUIDE_STYLES: {
  id: CutGuideStyle;
  label: string;
  description: string;
}[] = [
  {
    id: "corner_crop_marks",
    label: "Corner Crop Marks",
    description: "Professional L-shaped printer registration marks",
  },
  {
    id: "dashed",
    label: "Dashed Separation",
    description: "Subtle dashed cutting lines between photos",
  },
  {
    id: "thin_solid",
    label: "Thin Border Lines",
    description: "Crisp hairline perimeter around photo frames",
  },
  {
    id: "none",
    label: "No Guides",
    description: "Clean borderless sheet without marks",
  },
];

/** Guide color options */
export const CUT_GUIDE_COLORS: { hex: string; label: string }[] = [
  { hex: "#94a3b8", label: "Neutral Slate (Recommended)" },
  { hex: "#cbd5e1", label: "Subtle Light Grey" },
  { hex: "#000000", label: "Classic Black" },
  { hex: "#3b82f6", label: "Cyan Blue Guide" },
];

/** Default cutting guide settings */
export const DEFAULT_CUT_GUIDES = {
  enabled: true,
  style: "thin_solid" as CutGuideStyle,
  color: "#000000",
  thicknessPx: 1,
  includeInExport: true,
};

/** Default margins in millimeters for 4x6 (competitor target: ~3 mm minimum outer margins) */
export const DEFAULT_SHEET_MARGINS = {
  topMm: 3,
  bottomMm: 3,
  leftMm: 3,
  rightMm: 3,
  uniform: true,
};

/** Default margins in millimeters for A4 (27 × 32 mm high-density 56-photo default layout) */
export const DEFAULT_A4_SHEET_MARGINS = {
  topMm: 3.1,
  bottomMm: 15.66,
  leftMm: 2.91,
  rightMm: 2.91,
  uniform: false,
};

/** Maximum columns allowed per row on A4 photo sheet (legacy constant retained for compatibility) */
export const MAX_A4_COLUMNS = 4;

/** Default spacing between photos in millimeters for A4 paper (competitor-measured 2.6 mm horiz, 2.8 mm vert) */
export const DEFAULT_A4_SHEET_SPACING = {
  horizontalMm: 2.6,
  verticalMm: 2.8,
  uniform: false,
};

/** Default spacing between photos in millimeters for 4x6 paper (competitor-measured targets: 2.7 mm horiz, 2.8 mm vert) */
export const DEFAULT_4X6_SHEET_SPACING = {
  horizontalMm: 2.7,
  verticalMm: 2.8,
  uniform: false,
};

/** Default spacing between photos in millimeters */
export const DEFAULT_SHEET_SPACING = {
  horizontalMm: 1.5,
  verticalMm: 1.5,
  uniform: true,
};

/** Default 4x6 Photo Sheet Configuration (Competitor compact: 3 cols × 4 rows = 12 photos) */
export const DEFAULT_PHOTO_SHEET_CONFIG: PhotoSheetConfig = {
  paperSize: "4x6",
  orientation: "portrait",
  paperWidthInches: SHEET_4X6_SHORT_EDGE_INCHES, // 4.0 in
  paperHeightInches: SHEET_4X6_LONG_EDGE_INCHES, // 6.0 in
  dpi: DEFAULT_SHEET_DPI, // 300 DPI
  layoutMode: "auto",
  manualRows: 4,
  manualCols: 3,
  copies: 12,
  centerAlignment: true,
  margins: { ...DEFAULT_SHEET_MARGINS }, // 3 mm uniform
  spacing: { ...DEFAULT_4X6_SHEET_SPACING }, // 2.7 mm horiz, 2.8 mm vert
  cutGuides: { ...DEFAULT_CUT_GUIDES },
};

/** Default A4 Photo Sheet Configuration (Competitor compact: 7 cols × 8 rows = 56 photos) */
export const DEFAULT_A4_SHEET_CONFIG: PhotoSheetConfig = {
  paperSize: "a4",
  orientation: "portrait",
  paperWidthInches: SHEET_A4_SHORT_EDGE_INCHES, // ~8.2677 in
  paperHeightInches: SHEET_A4_LONG_EDGE_INCHES, // ~11.6929 in
  dpi: DEFAULT_SHEET_DPI, // 300 DPI
  layoutMode: "auto",
  manualRows: 8,
  manualCols: 7,
  copies: 56,
  centerAlignment: false, // Top-left printable region (never vertically or horizontally centered)
  margins: { ...DEFAULT_A4_SHEET_MARGINS }, // 2.91 mm left/right, 3.1 mm top, 15.66 mm bottom
  spacing: { ...DEFAULT_A4_SHEET_SPACING }, // 2.6 mm horiz, 2.8 mm vert
  cutGuides: { ...DEFAULT_CUT_GUIDES },
};
