/**
 * Document Studio — Phase 3 & Phase 4: Print Studio & Print Layout Settings
 *
 * Provides pure logic and utilities for:
 * 1. Print Mode selection (Front Side Only, Back Side Only, Front + Back Combined)
 * 2. Combined side arrangements (Vertical, Horizontal)
 * 3. Side resolution, active image selection (cropped vs enhanced), aspect ratio and dimensions
 * 4. Missing document detection and informative empty state resolution
 * 5. Visual scaling calculation preserving physical dimensions without distortion
 * 6. Paper Size (A4, A5, Letter, Custom with mm and inch units)
 * 7. Orientation (Portrait, Landscape)
 * 8. Margins (No Margins, Small Margins, Normal Margins, Custom Margins with independent top/bottom/left/right)
 * 9. Document Alignment (Center, Top, Custom Position)
 * 10. Document Scale (Actual Size 100%, Fit to Page, Custom Percentage with aspect ratio preservation)
 * 11. Copies (Min 1, Max 20, Default 1)
 * 12. Paper-like Layout Preview coordinate and percentage calculation
 */

import type {
  DocumentSideResult,
  DocumentPrintSettings,
  DocumentDimensions,
  PrintStudioMode,
  PrintStudioArrangement,
  DocumentPrintStudioState,
  PrintPaperSize,
  PaperDimensionUnit,
  PaperSizeDimensions,
  CustomPaperDimensions,
  PrintOrientation,
  PrintMarginPreset,
  PrintMargins,
  PrintAlignment,
  PrintCustomPosition,
  PrintScaleMode,
  DocumentPrintLayoutSettings,
  DocumentBorderSettings,
  BorderColorPreset,
  BorderThicknessPreset,
  BorderStyle,
} from "../../types/document-studio.ts";
import {
  isEnhancementActive,
  STANDARD_PAPER_SIZES,
  MARGIN_PRESET_VALUES,
  DEFAULT_PRINT_MARGINS,
  DEFAULT_PRINT_LAYOUT_SETTINGS,
  createDefaultPrintLayoutSettings,
  DEFAULT_BORDER_SETTINGS,
  BORDER_COLOR_PRESETS,
  BORDER_THICKNESS_PRESETS,
} from "../../types/document-studio.ts";

export interface PrintStudioModeOption {
  id: PrintStudioMode;
  label: string;
  shortLabel: string;
  description: string;
  sideBadge: "front" | "back" | "both";
}

export const PRINT_STUDIO_MODES: readonly PrintStudioModeOption[] = [
  {
    id: "front-only",
    label: "Front Side Only",
    shortLabel: "Front Only",
    description: "Display and prepare only the enhanced front side document",
    sideBadge: "front",
  },
  {
    id: "back-only",
    label: "Back Side Only",
    shortLabel: "Back Only",
    description: "Display and prepare only the enhanced back side document",
    sideBadge: "back",
  },
  {
    id: "combined",
    label: "Front + Back Combined",
    shortLabel: "Combined",
    description: "Display and prepare both front and back sides together",
    sideBadge: "both",
  },
] as const;

export interface PrintStudioArrangementOption {
  id: PrintStudioArrangement;
  label: string;
  shortLabel: string;
  description: string;
}

export const PRINT_STUDIO_ARRANGEMENTS: readonly PrintStudioArrangementOption[] = [
  {
    id: "vertical",
    label: "Vertical Arrangement",
    shortLabel: "Vertical",
    description: "Front side on top, Back side on bottom (Vertical stack)",
  },
  {
    id: "horizontal",
    label: "Horizontal Arrangement",
    shortLabel: "Horizontal",
    description: "Front side on left, Back side on right (Side by side)",
  },
] as const;

/**
 * Phase 4: Paper Size options
 */
export interface PrintPaperSizeOption {
  id: PrintPaperSize;
  label: string;
  shortLabel: string;
  dimensionsDescription: string;
  description: string;
}

export const PRINT_PAPER_SIZE_OPTIONS: readonly PrintPaperSizeOption[] = [
  {
    id: "a4",
    label: "A4",
    shortLabel: "A4",
    dimensionsDescription: "210 × 297 mm",
    description: "International standard A4 paper size (210 × 297 mm)",
  },
  {
    id: "a5",
    label: "A5",
    shortLabel: "A5",
    dimensionsDescription: "148 × 210 mm",
    description: "Compact A5 paper size (148 × 210 mm)",
  },
  {
    id: "letter",
    label: "Letter",
    shortLabel: "Letter",
    dimensionsDescription: "8.5 × 11.0 in (215.9 × 279.4 mm)",
    description: "US Letter standard size (8.5 × 11.0 in / 215.9 × 279.4 mm)",
  },
  {
    id: "4x6",
    label: "4×6",
    shortLabel: "4×6",
    dimensionsDescription: "4.0 × 6.0 in (101.6 × 152.4 mm)",
    description: "Standard 4×6 inch photo paper with foldable ID layout (101.6 × 152.4 mm)",
  },
  {
    id: "custom",
    label: "Custom Size",
    shortLabel: "Custom",
    dimensionsDescription: "User-defined",
    description: "Custom paper width and height with mm or inches unit",
  },
] as const;

/**
 * Phase 4: Orientation options
 */
export interface PrintOrientationOption {
  id: PrintOrientation;
  label: string;
  shortLabel: string;
  description: string;
}

export const PRINT_ORIENTATION_OPTIONS: readonly PrintOrientationOption[] = [
  {
    id: "portrait",
    label: "Portrait",
    shortLabel: "Portrait",
    description: "Vertical orientation (page height is greater than width)",
  },
  {
    id: "landscape",
    label: "Landscape",
    shortLabel: "Landscape",
    description: "Horizontal orientation (page width is greater than height)",
  },
] as const;

/**
 * Phase 4: Margin options
 */
export interface PrintMarginPresetOption {
  id: PrintMarginPreset;
  label: string;
  shortLabel: string;
  description: string;
  values?: PrintMargins;
}

export const PRINT_MARGIN_PRESET_OPTIONS: readonly PrintMarginPresetOption[] = [
  {
    id: "none",
    label: "No Margins",
    shortLabel: "None",
    description: "0 mm margins (full printable sheet area)",
    values: MARGIN_PRESET_VALUES.none,
  },
  {
    id: "small",
    label: "Small Margins",
    shortLabel: "Small",
    description: "5 mm margins on all four sides",
    values: MARGIN_PRESET_VALUES.small,
  },
  {
    id: "normal",
    label: "Normal Margins",
    shortLabel: "Normal",
    description: "12.7 mm (0.5 in) standard document margins",
    values: MARGIN_PRESET_VALUES.normal,
  },
  {
    id: "custom",
    label: "Custom Margins",
    shortLabel: "Custom",
    description: "Independently configure top, bottom, left, and right margins in mm",
  },
] as const;

/**
 * Phase 4: Alignment options
 */
export interface PrintAlignmentOption {
  id: PrintAlignment;
  label: string;
  shortLabel: string;
  description: string;
}

export const PRINT_ALIGNMENT_OPTIONS: readonly PrintAlignmentOption[] = [
  {
    id: "center",
    label: "Center",
    shortLabel: "Center",
    description: "Center document horizontally and vertically within printable area",
  },
  {
    id: "top",
    label: "Top",
    shortLabel: "Top",
    description: "Align document to top margin, centered horizontally",
  },
  {
    id: "custom",
    label: "Custom Position",
    shortLabel: "Custom",
    description: "Manually adjust horizontal and vertical positioning in mm",
  },
] as const;

/**
 * Phase 4: Scale options
 */
export interface PrintScaleOption {
  id: PrintScaleMode;
  label: string;
  shortLabel: string;
  description: string;
}

export const PRINT_SCALE_OPTIONS: readonly PrintScaleOption[] = [
  {
    id: "actual",
    label: "Actual Size (100%)",
    shortLabel: "100%",
    description: "Print at exact 1:1 physical dimensions (e.g. 85.6 × 53.98 mm)",
  },
  {
    id: "fit",
    label: "Fit to Page",
    shortLabel: "Fit to Page",
    description: "Scale to fill printable area while preserving document aspect ratio",
  },
  {
    id: "custom",
    label: "Custom Percentage",
    shortLabel: "Custom %",
    description: "Scale by a custom percentage while strictly maintaining aspect ratio",
  },
] as const;

/**
 * Type guard for PrintStudioMode.
 */
export function validatePrintStudioMode(mode: unknown): mode is PrintStudioMode {
  return mode === "front-only" || mode === "back-only" || mode === "combined";
}

/**
 * Type guard for PrintStudioArrangement.
 */
export function validatePrintStudioArrangement(
  arr: unknown
): arr is PrintStudioArrangement {
  return arr === "vertical" || arr === "horizontal";
}

/**
 * Type guard for PrintPaperSize.
 */
export function validatePrintPaperSize(size: unknown): size is PrintPaperSize {
  return (
    size === "a4" ||
    size === "a5" ||
    size === "letter" ||
    size === "4x6" ||
    size === "custom"
  );
}

/**
 * Type guard for BorderStyle.
 */
export function validateBorderStyle(style: unknown): style is BorderStyle {
  return style === "solid" || style === "dashed" || style === "dotted";
}

/**
 * Validates and sanitizes border thickness in millimeters (0.1 mm - 3.0 mm, default 0.3 mm).
 */
export function sanitizeBorderThickness(val: unknown): number {
  const num = typeof val === "number" ? val : parseFloat(String(val));
  if (isNaN(num) || !isFinite(num)) {
    return 0.3;
  }
  return Number(Math.min(3.0, Math.max(0.1, num)).toFixed(2));
}

/**
 * Validates and sanitizes border color string or hex value.
 */
export function sanitizeBorderColor(color: unknown): string {
  if (typeof color !== "string" || !color.trim()) {
    return "#000000";
  }
  const trimmed = color.trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.toLowerCase() === "black") return "#000000";
  if (trimmed.toLowerCase() === "dark-gray" || trimmed.toLowerCase() === "gray") return "#374151";
  return "#000000";
}

/**
 * Sanitizes an entire DocumentBorderSettings configuration with safe defaults.
 */
export function sanitizeBorderSettings(
  border?: Partial<DocumentBorderSettings> | null
): DocumentBorderSettings {
  if (!border) {
    return { ...DEFAULT_BORDER_SETTINGS };
  }

  const enabled = Boolean(border.enabled);
  const colorPreset: BorderColorPreset =
    border.colorPreset === "dark-gray" || border.colorPreset === "custom"
      ? border.colorPreset
      : "black";

  let color = sanitizeBorderColor(border.color);
  if (colorPreset === "black") color = "#000000";
  else if (colorPreset === "dark-gray") color = "#374151";

  const thicknessPreset: BorderThicknessPreset =
    border.thicknessPreset === "medium" ||
    border.thicknessPreset === "thick" ||
    border.thicknessPreset === "custom"
      ? border.thicknessPreset
      : "thin";

  let thicknessMm = sanitizeBorderThickness(border.thicknessMm);
  if (thicknessPreset === "thin") thicknessMm = 0.3;
  else if (thicknessPreset === "medium") thicknessMm = 0.5;
  else if (thicknessPreset === "thick") thicknessMm = 1.0;

  const style: BorderStyle = validateBorderStyle(border.style) ? border.style : "solid";

  return {
    enabled,
    colorPreset,
    color,
    thicknessPreset,
    thicknessMm,
    style,
  };
}

/**
 * Type guard for PrintOrientation.
 */
export function validatePrintOrientation(
  orient: unknown
): orient is PrintOrientation {
  return orient === "portrait" || orient === "landscape";
}

/**
 * Type guard for PrintMarginPreset.
 */
export function validatePrintMarginPreset(
  preset: unknown
): preset is PrintMarginPreset {
  return (
    preset === "none" ||
    preset === "small" ||
    preset === "normal" ||
    preset === "custom"
  );
}

/**
 * Type guard for PrintAlignment.
 */
export function validatePrintAlignment(align: unknown): align is PrintAlignment {
  return align === "center" || align === "top" || align === "custom";
}

/**
 * Type guard for PrintScaleMode.
 */
export function validatePrintScaleMode(mode: unknown): mode is PrintScaleMode {
  return mode === "actual" || mode === "fit" || mode === "custom";
}

/**
 * Validates and sanitizes a single margin value in millimeters.
 * Prevents negative values, NaNs, and infinity.
 */
export function sanitizeMarginValue(val: unknown, maxMm: number = 200): number {
  const num = typeof val === "number" ? val : parseFloat(String(val));
  if (isNaN(num) || !isFinite(num) || num < 0) {
    return 0;
  }
  return Number(Math.min(num, maxMm).toFixed(2));
}

/**
 * Sanitizes an entire PrintMargins object, ensuring no negative values
 * and ensuring margins do not exceed paper dimensions (keeping at least 10mm printable area).
 */
export function sanitizeCustomMargins(
  margins: Partial<PrintMargins> | undefined,
  paperWidthMm: number,
  paperHeightMm: number
): PrintMargins {
  const top = sanitizeMarginValue(margins?.topMm, paperHeightMm / 2);
  const bottom = sanitizeMarginValue(margins?.bottomMm, paperHeightMm / 2);
  const left = sanitizeMarginValue(margins?.leftMm, paperWidthMm / 2);
  const right = sanitizeMarginValue(margins?.rightMm, paperWidthMm / 2);

  const minPrintable = 10; // minimum 10mm printable zone
  const maxVert = Math.max(0, paperHeightMm - minPrintable);
  const maxHoriz = Math.max(0, paperWidthMm - minPrintable);

  let finalTop = top;
  let finalBottom = bottom;
  if (finalTop + finalBottom > maxVert) {
    const ratio = maxVert / (finalTop + finalBottom || 1);
    finalTop = Number((finalTop * ratio).toFixed(2));
    finalBottom = Number((finalBottom * ratio).toFixed(2));
  }

  let finalLeft = left;
  let finalRight = right;
  if (finalLeft + finalRight > maxHoriz) {
    const ratio = maxHoriz / (finalLeft + finalRight || 1);
    finalLeft = Number((finalLeft * ratio).toFixed(2));
    finalRight = Number((finalRight * ratio).toFixed(2));
  }

  return {
    topMm: finalTop,
    bottomMm: finalBottom,
    leftMm: finalLeft,
    rightMm: finalRight,
  };
}

/**
 * Validates and sanitizes scale percentage (10% to 500%, default 100%).
 */
export function sanitizeScalePercentage(val: unknown): number {
  const num = typeof val === "number" ? val : parseFloat(String(val));
  if (isNaN(num) || !isFinite(num) || num <= 0) {
    return 100;
  }
  return Number(Math.min(500, Math.max(10, num)).toFixed(1));
}

/**
 * Validates and sanitizes copies (integer from 1 to 20, default 1).
 */
export function sanitizeCopies(val: unknown): number {
  const num = typeof val === "number" ? val : parseInt(String(val), 10);
  if (isNaN(num) || !isFinite(num)) {
    return 1;
  }
  const integer = Math.floor(num);
  return Math.min(20, Math.max(1, integer));
}

/**
 * Sanitizes custom paper dimensions.
 */
export function sanitizeCustomPaper(
  custom?: Partial<CustomPaperDimensions>
): CustomPaperDimensions {
  const unit: PaperDimensionUnit = custom?.unit === "inch" ? "inch" : "mm";
  const defaultWidth = unit === "inch" ? 8.5 : 210;
  const defaultHeight = unit === "inch" ? 11.0 : 297;

  let width = typeof custom?.width === "number" ? custom.width : defaultWidth;
  let height = typeof custom?.height === "number" ? custom.height : defaultHeight;

  if (isNaN(width) || !isFinite(width) || width <= 0) width = defaultWidth;
  if (isNaN(height) || !isFinite(height) || height <= 0) height = defaultHeight;

  const minVal = unit === "inch" ? 1.0 : 25.4;
  const maxVal = unit === "inch" ? 48.0 : 1200.0;

  width = Number(Math.min(maxVal, Math.max(minVal, width)).toFixed(2));
  height = Number(Math.min(maxVal, Math.max(minVal, height)).toFixed(2));

  return {
    width,
    height,
    unit,
  };
}

/**
 * Calculates effective paper dimensions in millimeters and aspect ratio
 * based on paper size, orientation, and custom dimensions.
 */
export function getEffectivePaperDimensions(
  paperSize: PrintPaperSize,
  orientation: PrintOrientation,
  customPaper?: CustomPaperDimensions
): { widthMm: number; heightMm: number; aspectRatio: number } {
  let baseW: number;
  let baseH: number;

  if (paperSize === "custom" && customPaper) {
    const isInch = customPaper.unit === "inch";
    baseW = isInch ? customPaper.width * 25.4 : customPaper.width;
    baseH = isInch ? customPaper.height * 25.4 : customPaper.height;
  } else if (paperSize in STANDARD_PAPER_SIZES) {
    const std = STANDARD_PAPER_SIZES[paperSize as keyof typeof STANDARD_PAPER_SIZES];
    baseW = std.widthMm;
    baseH = std.heightMm;
  } else {
    // Default to A4
    baseW = STANDARD_PAPER_SIZES.a4.widthMm;
    baseH = STANDARD_PAPER_SIZES.a4.heightMm;
  }

  // Portrait: height >= width. Landscape: width >= height.
  let widthMm: number;
  let heightMm: number;

  if (orientation === "portrait") {
    widthMm = Math.min(baseW, baseH);
    heightMm = Math.max(baseW, baseH);
  } else {
    widthMm = Math.max(baseW, baseH);
    heightMm = Math.min(baseW, baseH);
  }

  widthMm = Number(widthMm.toFixed(2));
  heightMm = Number(heightMm.toFixed(2));
  const aspectRatio = Number((widthMm / heightMm).toFixed(4));

  return { widthMm, heightMm, aspectRatio };
}

/**
 * Resolves effective margins in millimeters for a given preset or custom configuration.
 */
export function getEffectiveMargins(
  preset: PrintMarginPreset,
  customMargins: PrintMargins | undefined,
  paperWidthMm: number,
  paperHeightMm: number
): PrintMargins {
  if (preset === "none") {
    return { ...MARGIN_PRESET_VALUES.none };
  }
  if (preset === "small") {
    return { ...MARGIN_PRESET_VALUES.small };
  }
  if (preset === "normal") {
    return { ...MARGIN_PRESET_VALUES.normal };
  }
  return sanitizeCustomMargins(customMargins, paperWidthMm, paperHeightMm);
}

/**
 * Placed document item on the paper preview sheet.
 */
export interface PrintPlacedItem {
  side: "front" | "back";
  title: string;
  badge: "F" | "B";
  imageUrl: string | null;
  isAvailable: boolean;
  isEnhanced: boolean;
  // Physical millimeter dimensions
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  aspectRatio: number;
  // Percentage coordinates relative to sheet (0 - 100%)
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  // Rotation relative to sheet in degrees (0 or 180)
  rotation?: number;
}

/**
 * Complete calculated print paper layout result.
 */
export interface PrintPaperLayoutResult {
  paperSize: PrintPaperSize;
  orientation: PrintOrientation;
  paperWidthMm: number;
  paperHeightMm: number;
  paperAspectRatio: number;
  margins: PrintMargins;
  printableWidthMm: number;
  printableHeightMm: number;
  scaleMode: PrintScaleMode;
  scaleFactor: number;
  scalePercentage: number;
  alignment: PrintAlignment;
  customPosition: PrintCustomPosition;
  copies: number;
  blockWidthMm: number;
  blockHeightMm: number;
  blockPaperX: number;
  blockPaperY: number;
  items: PrintPlacedItem[];
  isOverflowing: boolean;
  overflowReason?: string;
  border?: DocumentBorderSettings;
  isFoldable4x6?: boolean;
  foldLineYMm?: number;
}

/**
 * Calculates the complete paper layout including scaling, alignment, and coordinate placements.
 * Strictly maintains document aspect ratios to prevent unintended distortion or stretching.
 */
export function calculatePrintPaperLayout(options: {
  layout: DocumentPrintLayoutSettings;
  mode: PrintStudioMode;
  arrangement: PrintStudioArrangement;
  front: DocumentSideResult;
  back: DocumentSideResult;
  frontImageUrl?: string | null;
  backImageUrl?: string | null;
  isSingleSided?: boolean;
}): PrintPaperLayoutResult {
  const {
    layout,
    mode,
    arrangement,
    front,
    back,
    frontImageUrl = front.enhancedPreviewUrl || front.croppedPreviewUrl,
    backImageUrl = back.enhancedPreviewUrl || back.croppedPreviewUrl,
    isSingleSided = false,
  } = options;

  // 1. Paper Dimensions
  const effectivePaper = getEffectivePaperDimensions(
    layout.paperSize,
    layout.orientation,
    layout.customPaper
  );
  const paperWidthMm = effectivePaper.widthMm;
  const paperHeightMm = effectivePaper.heightMm;
  const paperAspectRatio = effectivePaper.aspectRatio;

  // 2. Margins & Printable Area
  const margins = getEffectiveMargins(
    layout.marginPreset,
    layout.margins,
    paperWidthMm,
    paperHeightMm
  );
  const printableWidthMm = Number(
    Math.max(0, paperWidthMm - margins.leftMm - margins.rightMm).toFixed(2)
  );
  const printableHeightMm = Number(
    Math.max(0, paperHeightMm - margins.topMm - margins.bottomMm).toFixed(2)
  );

  // 3. Document Natural Dimensions (mm)
  const frontW = front.printSettings.widthMm > 0 ? front.printSettings.widthMm : 85.6;
  const frontH = front.printSettings.heightMm > 0 ? front.printSettings.heightMm : 53.98;
  const frontAspect = frontW / frontH;

  const backW = back.printSettings.widthMm > 0 ? back.printSettings.widthMm : 85.6;
  const backH = back.printSettings.heightMm > 0 ? back.printSettings.heightMm : 53.98;
  const backAspect = backW / backH;

  const border = sanitizeBorderSettings(layout.border);

  // Dedicated 4x6 Foldable Front/Back Layout
  // Activates strictly when Paper Size = 4x6 AND Print Mode = Front + Back Combined
  const isFoldable4x6 = layout.paperSize === "4x6" && mode === "combined";

  if (isFoldable4x6) {
    const halfHeightMm = Number((paperHeightMm / 2).toFixed(2)); // Exactly 76.2 mm for 4x6 portrait

    // Printable area within each half (top half and bottom half)
    const halfPrintableW = Number(
      Math.max(0, paperWidthMm - margins.leftMm - margins.rightMm).toFixed(2)
    );
    const halfPrintableH = Number(
      Math.max(0, halfHeightMm - margins.topMm - margins.bottomMm).toFixed(2)
    );

    const maxDocW = Math.max(frontW, backW);
    const maxDocH = Math.max(frontH, backH);

    let scaleFactor = 1.0;
    const safeCustomScale = sanitizeScalePercentage(layout.customScalePercentage);

    if (layout.scaleMode === "actual") {
      // 100% actual size, using Fit to Half if natural size exceeds the half printable area to prevent clipping
      if (maxDocW > 0 && maxDocH > 0 && halfPrintableW > 0 && halfPrintableH > 0) {
        if (maxDocW > halfPrintableW || maxDocH > halfPrintableH) {
          const fitScaleX = halfPrintableW / maxDocW;
          const fitScaleY = halfPrintableH / maxDocH;
          scaleFactor = Math.min(1.0, fitScaleX, fitScaleY);
        } else {
          scaleFactor = 1.0;
        }
      } else {
        scaleFactor = 1.0;
      }
    } else if (layout.scaleMode === "fit") {
      if (maxDocW > 0 && maxDocH > 0 && halfPrintableW > 0 && halfPrintableH > 0) {
        const fitScaleX = halfPrintableW / maxDocW;
        const fitScaleY = halfPrintableH / maxDocH;
        scaleFactor = Math.min(fitScaleX, fitScaleY);
      } else {
        scaleFactor = 1.0;
      }
    } else if (layout.scaleMode === "custom") {
      scaleFactor = safeCustomScale / 100;
    }

    scaleFactor = Number(scaleFactor.toFixed(4));
    const scalePercentage = Number((scaleFactor * 100).toFixed(1));

    const scaledFrontW = Number((frontW * scaleFactor).toFixed(2));
    const scaledFrontH = Number((frontH * scaleFactor).toFixed(2));
    const scaledBackW = Number((backW * scaleFactor).toFixed(2));
    const scaledBackH = Number((backH * scaleFactor).toFixed(2));

    // Alignment calculated within each respective half
    const extraFrontX = Math.max(0, halfPrintableW - scaledFrontW);
    const extraFrontY = Math.max(0, halfPrintableH - scaledFrontH);
    const extraBackX = Math.max(0, halfPrintableW - scaledBackW);
    const extraBackY = Math.max(0, halfPrintableH - scaledBackH);

    let frontRelX = 0;
    let frontRelY = 0;
    let backRelX = 0;
    let backRelY = 0;

    if (layout.alignment === "center") {
      frontRelX = extraFrontX / 2;
      frontRelY = extraFrontY / 2;
      backRelX = extraBackX / 2;
      backRelY = extraBackY / 2;
    } else if (layout.alignment === "top") {
      frontRelX = extraFrontX / 2;
      frontRelY = 0;
      backRelX = extraBackX / 2;
      backRelY = 0;
    } else if (layout.alignment === "custom") {
      const rawX = typeof layout.customPosition?.xMm === "number" ? layout.customPosition.xMm : 0;
      const rawY = typeof layout.customPosition?.yMm === "number" ? layout.customPosition.yMm : 0;
      const safeX = isNaN(rawX) ? 0 : rawX;
      const safeY = isNaN(rawY) ? 0 : rawY;
      frontRelX = safeX;
      frontRelY = safeY;
      backRelX = safeX;
      backRelY = safeY;
    }

    // Front: Upper half (Y range [margins.topMm, halfHeightMm])
    const frontX = Number((margins.leftMm + frontRelX).toFixed(2));
    const frontY = Number((margins.topMm + frontRelY).toFixed(2));

    // Back: Lower half (Y range [halfHeightMm + margins.topMm, paperHeightMm])
    const backX = Number((margins.leftMm + backRelX).toFixed(2));
    const backY = Number((halfHeightMm + margins.topMm + backRelY).toFixed(2));

    const items: PrintPlacedItem[] = [
      {
        side: "front",
        title: "Front Side",
        badge: "F",
        imageUrl: frontImageUrl || null,
        isAvailable: Boolean(frontImageUrl),
        isEnhanced: isEnhancementActive(front.enhancements),
        xMm: frontX,
        yMm: frontY,
        widthMm: scaledFrontW,
        heightMm: scaledFrontH,
        aspectRatio: frontAspect,
        xPercent: Number(((frontX / paperWidthMm) * 100).toFixed(3)),
        yPercent: Number(((frontY / paperHeightMm) * 100).toFixed(3)),
        widthPercent: Number(((scaledFrontW / paperWidthMm) * 100).toFixed(3)),
        heightPercent: Number(((scaledFrontH / paperHeightMm) * 100).toFixed(3)),
        rotation: 0,
      },
      {
        side: "back",
        title: "Back Side",
        badge: "B",
        imageUrl: backImageUrl || null,
        isAvailable: Boolean(backImageUrl),
        isEnhanced: isEnhancementActive(back.enhancements),
        xMm: backX,
        yMm: backY,
        widthMm: scaledBackW,
        heightMm: scaledBackH,
        aspectRatio: backAspect,
        xPercent: Number(((backX / paperWidthMm) * 100).toFixed(3)),
        yPercent: Number(((backY / paperHeightMm) * 100).toFixed(3)),
        widthPercent: Number(((scaledBackW / paperWidthMm) * 100).toFixed(3)),
        heightPercent: Number(((scaledBackH / paperHeightMm) * 100).toFixed(3)),
        rotation: 180, // Back document rotated 180° for horizontal center fold & lamination
      },
    ];

    let isOverflowing = false;
    let overflowReason: string | undefined = undefined;

    if (
      frontX < 0 ||
      frontY < 0 ||
      frontX + scaledFrontW > paperWidthMm + 0.1 ||
      frontY + scaledFrontH > halfHeightMm + 0.1
    ) {
      isOverflowing = true;
      overflowReason = `Front document exceeds upper half boundary or overlaps horizontal fold line (${halfHeightMm} mm). Adjust scale or margins.`;
    }

    if (
      backX < 0 ||
      backY < halfHeightMm - 0.1 ||
      backX + scaledBackW > paperWidthMm + 0.1 ||
      backY + scaledBackH > paperHeightMm + 0.1
    ) {
      isOverflowing = true;
      overflowReason = `Back document exceeds lower half boundary or overlaps horizontal fold line (${halfHeightMm} mm). Adjust scale or margins.`;
    }

    const copies = sanitizeCopies(layout.copies);

    return {
      paperSize: layout.paperSize,
      orientation: layout.orientation,
      paperWidthMm,
      paperHeightMm,
      paperAspectRatio,
      margins,
      printableWidthMm,
      printableHeightMm,
      scaleMode: layout.scaleMode,
      scaleFactor,
      scalePercentage,
      alignment: layout.alignment,
      customPosition: layout.customPosition,
      copies,
      blockWidthMm: Math.max(scaledFrontW, scaledBackW),
      blockHeightMm: Number((backY + scaledBackH - frontY).toFixed(2)),
      blockPaperX: Math.min(frontX, backX),
      blockPaperY: frontY,
      items,
      isOverflowing,
      overflowReason,
      border,
      isFoldable4x6: true,
      foldLineYMm: halfHeightMm,
    };
  }

  const spacingMm = 5.0; // 5 mm gap between sides in combined mode

  // 4. Natural Document Block Dimensions
  let blockNaturalWidthMm = frontW;
  let blockNaturalHeightMm = frontH;

  if (mode === "front-only") {
    blockNaturalWidthMm = frontW;
    blockNaturalHeightMm = frontH;
  } else if (mode === "back-only") {
    blockNaturalWidthMm = backW;
    blockNaturalHeightMm = backH;
  } else {
    // combined mode
    if (arrangement === "vertical") {
      blockNaturalWidthMm = Math.max(frontW, backW);
      blockNaturalHeightMm = frontH + backH + spacingMm;
    } else {
      blockNaturalWidthMm = frontW + backW + spacingMm;
      blockNaturalHeightMm = Math.max(frontH, backH);
    }
  }

  // 5. Scale Factor Calculation (Strict Aspect Ratio Preservation)
  let scaleFactor = 1.0;
  const safeCustomScale = sanitizeScalePercentage(layout.customScalePercentage);

  if (layout.scaleMode === "actual") {
    scaleFactor = 1.0;
  } else if (layout.scaleMode === "fit") {
    if (blockNaturalWidthMm > 0 && blockNaturalHeightMm > 0 && printableWidthMm > 0 && printableHeightMm > 0) {
      const scaleX = printableWidthMm / blockNaturalWidthMm;
      const scaleY = printableHeightMm / blockNaturalHeightMm;
      // Use min to fit both dimensions while keeping aspect ratio locked
      scaleFactor = Math.min(scaleX, scaleY);
    } else {
      scaleFactor = 1.0;
    }
  } else if (layout.scaleMode === "custom") {
    scaleFactor = safeCustomScale / 100;
  }

  scaleFactor = Number(scaleFactor.toFixed(4));
  const scalePercentage = Number((scaleFactor * 100).toFixed(1));

  // 6. Scaled Block Dimensions
  const blockScaledWidthMm = Number((blockNaturalWidthMm * scaleFactor).toFixed(2));
  const blockScaledHeightMm = Number((blockNaturalHeightMm * scaleFactor).toFixed(2));

  // 7. Alignment & Positioning within Printable Area
  const extraWidthMm = Math.max(0, printableWidthMm - blockScaledWidthMm);
  const extraHeightMm = Math.max(0, printableHeightMm - blockScaledHeightMm);

  let relX = 0;
  let relY = 0;

  if (layout.alignment === "center") {
    relX = extraWidthMm / 2;
    relY = extraHeightMm / 2;
  } else if (layout.alignment === "top") {
    relX = extraWidthMm / 2;
    relY = 0;
  } else if (layout.alignment === "custom") {
    const rawX = typeof layout.customPosition?.xMm === "number" ? layout.customPosition.xMm : 0;
    const rawY = typeof layout.customPosition?.yMm === "number" ? layout.customPosition.yMm : 0;
    relX = isNaN(rawX) ? 0 : rawX;
    relY = isNaN(rawY) ? 0 : rawY;
  }

  relX = Number(relX.toFixed(2));
  relY = Number(relY.toFixed(2));

  const blockPaperX = Number((margins.leftMm + relX).toFixed(2));
  const blockPaperY = Number((margins.topMm + relY).toFixed(2));

  // 8. Individual Placed Items
  const items: PrintPlacedItem[] = [];

  const scaledFrontW = Number((frontW * scaleFactor).toFixed(2));
  const scaledFrontH = Number((frontH * scaleFactor).toFixed(2));

  const scaledBackW = Number((backW * scaleFactor).toFixed(2));
  const scaledBackH = Number((backH * scaleFactor).toFixed(2));

  const scaledSpacing = Number((spacingMm * scaleFactor).toFixed(2));

  if (mode === "front-only") {
    items.push({
      side: "front",
      title: "Front Side",
      badge: "F",
      imageUrl: frontImageUrl || null,
      isAvailable: Boolean(frontImageUrl),
      isEnhanced: isEnhancementActive(front.enhancements),
      xMm: blockPaperX,
      yMm: blockPaperY,
      widthMm: scaledFrontW,
      heightMm: scaledFrontH,
      aspectRatio: frontAspect,
      xPercent: Number(((blockPaperX / paperWidthMm) * 100).toFixed(3)),
      yPercent: Number(((blockPaperY / paperHeightMm) * 100).toFixed(3)),
      widthPercent: Number(((scaledFrontW / paperWidthMm) * 100).toFixed(3)),
      heightPercent: Number(((scaledFrontH / paperHeightMm) * 100).toFixed(3)),
      rotation: 0,
    });
  } else if (mode === "back-only") {
    items.push({
      side: "back",
      title: "Back Side",
      badge: "B",
      imageUrl: backImageUrl || null,
      isAvailable: Boolean(backImageUrl),
      isEnhanced: isEnhancementActive(back.enhancements),
      xMm: blockPaperX,
      yMm: blockPaperY,
      widthMm: scaledBackW,
      heightMm: scaledBackH,
      aspectRatio: backAspect,
      xPercent: Number(((blockPaperX / paperWidthMm) * 100).toFixed(3)),
      yPercent: Number(((blockPaperY / paperHeightMm) * 100).toFixed(3)),
      widthPercent: Number(((scaledBackW / paperWidthMm) * 100).toFixed(3)),
      heightPercent: Number(((scaledBackH / paperHeightMm) * 100).toFixed(3)),
      rotation: 0,
    });
  } else {
    // Combined mode: Front + Back
    // Front card item
    items.push({
      side: "front",
      title: "Front Side",
      badge: "F",
      imageUrl: frontImageUrl || null,
      isAvailable: Boolean(frontImageUrl),
      isEnhanced: isEnhancementActive(front.enhancements),
      xMm: blockPaperX,
      yMm: blockPaperY,
      widthMm: scaledFrontW,
      heightMm: scaledFrontH,
      aspectRatio: frontAspect,
      xPercent: Number(((blockPaperX / paperWidthMm) * 100).toFixed(3)),
      yPercent: Number(((blockPaperY / paperHeightMm) * 100).toFixed(3)),
      widthPercent: Number(((scaledFrontW / paperWidthMm) * 100).toFixed(3)),
      heightPercent: Number(((scaledFrontH / paperHeightMm) * 100).toFixed(3)),
      rotation: 0,
    });

    // Back card item
    let backX = blockPaperX;
    let backY = blockPaperY;
    if (arrangement === "vertical") {
      backY = Number((blockPaperY + scaledFrontH + scaledSpacing).toFixed(2));
    } else {
      backX = Number((blockPaperX + scaledFrontW + scaledSpacing).toFixed(2));
    }

    items.push({
      side: "back",
      title: "Back Side",
      badge: "B",
      imageUrl: backImageUrl || null,
      isAvailable: Boolean(backImageUrl),
      isEnhanced: isEnhancementActive(back.enhancements),
      xMm: backX,
      yMm: backY,
      widthMm: scaledBackW,
      heightMm: scaledBackH,
      aspectRatio: backAspect,
      xPercent: Number(((backX / paperWidthMm) * 100).toFixed(3)),
      yPercent: Number(((backY / paperHeightMm) * 100).toFixed(3)),
      widthPercent: Number(((scaledBackW / paperWidthMm) * 100).toFixed(3)),
      heightPercent: Number(((scaledBackH / paperHeightMm) * 100).toFixed(3)),
      rotation: 0,
    });
  }

  // 9. Overflow Validation
  let isOverflowing = false;
  let overflowReason: string | undefined = undefined;

  for (const item of items) {
    if (
      item.xMm < 0 ||
      item.yMm < 0 ||
      item.xMm + item.widthMm > paperWidthMm + 0.1 ||
      item.yMm + item.heightMm > paperHeightMm + 0.1
    ) {
      isOverflowing = true;
      overflowReason = `Document (${item.title}) exceeds paper sheet boundary (${paperWidthMm} × ${paperHeightMm} mm). Adjust scale, margins, or orientation.`;
      break;
    }
  }

  const copies = sanitizeCopies(layout.copies);

  return {
    paperSize: layout.paperSize,
    orientation: layout.orientation,
    paperWidthMm,
    paperHeightMm,
    paperAspectRatio,
    margins,
    printableWidthMm,
    printableHeightMm,
    scaleMode: layout.scaleMode,
    scaleFactor,
    scalePercentage,
    alignment: layout.alignment,
    customPosition: layout.customPosition,
    copies,
    blockWidthMm: blockScaledWidthMm,
    blockHeightMm: blockScaledHeightMm,
    blockPaperX,
    blockPaperY,
    items,
    isOverflowing,
    overflowReason,
    border,
    isFoldable4x6: false,
  };
}

/**
 * Resolves the active image URL and enhancement state for a document side.
 * When enhancements are active and an enhancedPreviewUrl is present, it takes precedence.
 * Otherwise, the croppedPreviewUrl is returned.
 */
export function resolveActiveSideImage(side?: DocumentSideResult | null): {
  imageUrl: string | null;
  isEnhanced: boolean;
  hasActiveEnhancements: boolean;
} {
  if (!side) {
    return { imageUrl: null, isEnhanced: false, hasActiveEnhancements: false };
  }

  const hasActiveEnhancements = isEnhancementActive(side.enhancements);

  if (hasActiveEnhancements && side.enhancedPreviewUrl) {
    return {
      imageUrl: side.enhancedPreviewUrl,
      isEnhanced: true,
      hasActiveEnhancements: true,
    };
  }

  if (side.croppedPreviewUrl) {
    return {
      imageUrl: side.croppedPreviewUrl,
      isEnhanced: false,
      hasActiveEnhancements,
    };
  }

  return {
    imageUrl: null,
    isEnhanced: false,
    hasActiveEnhancements,
  };
}

export interface PrintStudioResolvedSide {
  side: "front" | "back";
  title: string;
  shortLabel: string;
  badge: "F" | "B";
  isAvailable: boolean;
  imageUrl: string | null;
  dimensions: DocumentDimensions | null;
  printSettings: DocumentPrintSettings;
  aspectRatio: number;
  isEnhanced: boolean;
  hasActiveEnhancements: boolean;
  emptyReason?: string;
}

export interface PrintStudioLayoutResolution {
  mode: PrintStudioMode;
  arrangement: PrintStudioArrangement;
  sidesToRender: PrintStudioResolvedSide[];
  hasFront: boolean;
  hasBack: boolean;
  allSidesAvailable: boolean;
  isSingleSided: boolean;
  activeSideCount: number;
  arrangementNotice?: string;
  paperLayout: PrintPaperLayoutResult;
}

/**
 * Resolves which sides to render in the Print Studio preview based on
 * the selected Print Mode ("front-only", "back-only", "combined") and arrangement,
 * and calculates the accurate paper layout coordinates.
 */
export function resolvePrintStudioLayout(options: {
  mode: PrintStudioMode;
  arrangement: PrintStudioArrangement;
  front: DocumentSideResult;
  back: DocumentSideResult;
  isSingleSided?: boolean;
  layout?: DocumentPrintLayoutSettings;
  layoutSettings?: DocumentPrintLayoutSettings;
}): PrintStudioLayoutResolution {
  const {
    mode,
    arrangement,
    front,
    back,
    isSingleSided = false,
  } = options;
  const layout = options.layout || options.layoutSettings || createDefaultPrintLayoutSettings();

  const frontImg = resolveActiveSideImage(front);
  const backImg = resolveActiveSideImage(back);

  const hasFront = Boolean(frontImg.imageUrl);
  const hasBack = Boolean(backImg.imageUrl);

  const frontSettings = front.printSettings;
  const backSettings = back.printSettings;

  const frontAspect =
    frontSettings.widthMm > 0 && frontSettings.heightMm > 0
      ? frontSettings.widthMm / frontSettings.heightMm
      : front.croppedDimensions?.aspectRatio || 85.6 / 53.98;

  const backAspect =
    backSettings.widthMm > 0 && backSettings.heightMm > 0
      ? backSettings.widthMm / backSettings.heightMm
      : back.croppedDimensions?.aspectRatio || 85.6 / 53.98;

  const resolvedFront: PrintStudioResolvedSide = {
    side: "front",
    title: "Front Side",
    shortLabel: "Front",
    badge: "F",
    isAvailable: hasFront,
    imageUrl: frontImg.imageUrl,
    dimensions: front.croppedDimensions,
    printSettings: frontSettings,
    aspectRatio: frontAspect,
    isEnhanced: frontImg.isEnhanced,
    hasActiveEnhancements: frontImg.hasActiveEnhancements,
    emptyReason: hasFront
      ? undefined
      : "Front side document not available. Upload or adjust the front crop in Document Studio to preview.",
  };

  const resolvedBack: PrintStudioResolvedSide = {
    side: "back",
    title: "Back Side",
    shortLabel: "Back",
    badge: "B",
    isAvailable: hasBack,
    imageUrl: backImg.imageUrl,
    dimensions: back.croppedDimensions,
    printSettings: backSettings,
    aspectRatio: backAspect,
    isEnhanced: backImg.isEnhanced,
    hasActiveEnhancements: backImg.hasActiveEnhancements,
    emptyReason: hasBack
      ? undefined
      : isSingleSided
      ? "Back side is not applicable for single-sided documents (e.g. PAN Card)."
      : "Back side document not available. Upload a 2-sided document or adjust the back crop in Document Studio to preview.",
  };

  let sidesToRender: PrintStudioResolvedSide[] = [];
  let allSidesAvailable = false;
  let arrangementNotice: string | undefined = undefined;

  switch (mode) {
    case "front-only": {
      sidesToRender = [resolvedFront];
      allSidesAvailable = hasFront;
      break;
    }
    case "back-only": {
      sidesToRender = [resolvedBack];
      allSidesAvailable = hasBack;
      break;
    }
    case "combined": {
      sidesToRender = [resolvedFront, resolvedBack];
      allSidesAvailable = hasFront && hasBack;
      arrangementNotice =
        layout?.paperSize === "4x6"
          ? "Foldable 4×6 sheet (Front on top, Back on bottom rotated 180° for horizontal center folding)"
          : arrangement === "vertical"
          ? "Arranged vertically (Front on top, Back on bottom)"
          : "Arranged horizontally (Front on left, Back on right)";
      break;
    }
    default: {
      sidesToRender = [resolvedFront, resolvedBack];
      allSidesAvailable = hasFront && hasBack;
    }
  }

  const paperLayout = calculatePrintPaperLayout({
    layout,
    mode,
    arrangement,
    front,
    back,
    frontImageUrl: frontImg.imageUrl,
    backImageUrl: backImg.imageUrl,
    isSingleSided,
  });

  return {
    mode,
    arrangement,
    sidesToRender,
    hasFront,
    hasBack,
    allSidesAvailable,
    isSingleSided,
    activeSideCount: sidesToRender.filter((s) => s.isAvailable).length,
    arrangementNotice,
    paperLayout,
  };
}

/**
 * Calculates relative proportional scale factors for front and back sides
 * based on their physical millimetre dimensions, ensuring neither card is distorted.
 */
export function calculateRelativeDisplayScale(
  frontSettings: DocumentPrintSettings,
  backSettings: DocumentPrintSettings
): { frontScale: number; backScale: number } {
  const frontW = frontSettings.widthMm > 0 ? frontSettings.widthMm : 85.6;
  const backW = backSettings.widthMm > 0 ? backSettings.widthMm : 85.6;
  const maxW = Math.max(frontW, backW);

  return {
    frontScale: Number((frontW / maxW).toFixed(4)),
    backScale: Number((backW / maxW).toFixed(4)),
  };
}
