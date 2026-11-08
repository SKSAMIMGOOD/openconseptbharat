/**
 * Phase 08A — Document Studio Types
 * Centralized type definitions for Document Studio configuration, side states, and uploads.
 */

import type { CropCoordinates } from "@/types/crop";

export type DocumentTypeId =
  | "aadhaar"
  | "pan"
  | "voter-id"
  | "ration-card"
  | "custom";

export type DocumentSide = "front" | "back";

export type CustomSidesMode = "both" | "front-only" | "back-only";

export type SourceLayoutMode =
  | "auto"
  | "bottom-dual"
  | "vertical"
  | "horizontal"
  | "manual";

export type DocumentFileType = "image" | "pdf";

export interface DocumentDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export interface DocumentTargetDimensions {
  widthMm: number;
  heightMm: number;
  aspectRatio: number;
  standardDpi?: number;
  note: string;
}

export interface DocumentTypeDefinition {
  id: DocumentTypeId;
  name: string;
  shortName: string;
  category: string;
  description: string;
  supportedSides: DocumentSide[];
  defaultSides: DocumentSide[];
  allowsSideSelection: boolean;
  targetDimensions?: DocumentTargetDimensions;
  frontNotes?: string;
  backNotes?: string;
  badge: string;
  iconName: string;
}

/**
 * Phase 08C — Document Studio Enhancement Settings
 * Non-destructive pixel enhancements: Brightness, Contrast, Saturation, Sharpness, Grayscale, Invert.
 */
export interface DocumentEnhancementSettings {
  brightness: number; // -100 to +100, default 0
  contrast: number; // -100 to +100, default 0
  saturation: number; // -100 to +100, default 0
  sharpness: number; // 0 to 100, default 0
  grayscale: boolean; // default false
  invert: boolean; // default false
}

export const DEFAULT_ENHANCEMENT_SETTINGS: Readonly<DocumentEnhancementSettings> = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpness: 0,
  grayscale: false,
  invert: false,
};

export function createDefaultEnhancementSettings(): DocumentEnhancementSettings {
  return { ...DEFAULT_ENHANCEMENT_SETTINGS };
}

export function isEnhancementActive(
  settings?: DocumentEnhancementSettings | null
): boolean {
  if (!settings) return false;
  return (
    settings.brightness !== 0 ||
    settings.contrast !== 0 ||
    settings.saturation !== 0 ||
    settings.sharpness !== 0 ||
    settings.grayscale ||
    settings.invert
  );
}

/**
 * Phase 08D — Document Studio Print Quality & Dimensions Settings
 */
export type PrintQualityPreset = "standard" | "high" | "maximum" | "custom";

export type DocumentDimensionPreset =
  | "original"
  | "aadhaar"
  | "pan"
  | "voter-id"
  | "custom";

export type DocumentDimensionUnit = "mm" | "inch" | "px";

export interface DocumentPrintSettings {
  qualityPreset: PrintQualityPreset;
  dpi: number;
  customDpi: number;
  dimensionPreset: DocumentDimensionPreset;
  unit: DocumentDimensionUnit;
  width: number;
  height: number;
  widthMm: number;
  heightMm: number;
  targetWidthPx: number;
  targetHeightPx: number;
  maintainAspectRatio: boolean;
  aspectRatio: number;
}

export const DEFAULT_PRINT_SETTINGS: Readonly<DocumentPrintSettings> = {
  qualityPreset: "high",
  dpi: 300,
  customDpi: 300,
  dimensionPreset: "aadhaar",
  unit: "mm",
  width: 85.6,
  height: 53.98,
  widthMm: 85.6,
  heightMm: 53.98,
  targetWidthPx: 1011,
  targetHeightPx: 638,
  maintainAspectRatio: true,
  aspectRatio: 85.6 / 53.98,
};

export function createDefaultPrintSettings(
  docType: DocumentTypeId = "aadhaar",
  sourceDimensions?: DocumentDimensions | null
): DocumentPrintSettings {
  if (docType === "custom" && sourceDimensions) {
    const dpi = 300;
    const widthMm = Number(((sourceDimensions.width / dpi) * 25.4).toFixed(2));
    const heightMm = Number(((sourceDimensions.height / dpi) * 25.4).toFixed(2));
    return {
      qualityPreset: "high",
      dpi,
      customDpi: dpi,
      dimensionPreset: "original",
      unit: "mm",
      width: widthMm,
      height: heightMm,
      widthMm,
      heightMm,
      targetWidthPx: sourceDimensions.width,
      targetHeightPx: sourceDimensions.height,
      maintainAspectRatio: true,
      aspectRatio: sourceDimensions.aspectRatio,
    };
  }

  const preset: DocumentDimensionPreset =
    docType === "pan"
      ? "pan"
      : docType === "voter-id"
      ? "voter-id"
      : docType === "custom"
      ? "original"
      : "aadhaar";

  return {
    ...DEFAULT_PRINT_SETTINGS,
    dimensionPreset: preset,
  };
}

/**
 * Phase 08B — Document Studio Crop State
 * Stores independent crop, rotation, zoom, aspect ratio, and preview states for a document side.
 */
export interface DocumentCropStatus {
  status: "idle" | "detecting" | "success" | "failed";
  confidence?: number;
  message?: string;
}

export interface DocumentCropState {
  isCropped: boolean;
  isManualCrop?: boolean;
  isCropEditorOpen: boolean;
  crop: CropCoordinates | null;
  rotation: number; // 0, 90, 180, 270 degrees
  zoom: number; // Viewport zoom scale (e.g. 1.0)
  aspectRatioLocked: boolean;
  targetAspectRatio: number | null;
  croppedPreviewUrl: string | null;
  croppedDimensions: DocumentDimensions | null;
  autoCropStatus: DocumentCropStatus;
  activeView: "cropped" | "original";
}

export interface AutoCropDetectionResult {
  detected: boolean;
  confidence: number;
  crop: CropCoordinates;
  message: string;
  method?: string;
  debugInfo?: {
    contrastScore: number;
    edgeScore: number;
    areaRatio: number;
  };
}

export interface NormalizedCardCoordinates {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface DocumentReferenceMeasurement {
  front: NormalizedCardCoordinates;
  back: NormalizedCardCoordinates;
  approxWidthPx: number;
  approxHeightPx: number;
  aspectRatio: number;
  description: string;
}

export interface ContentClassificationResult {
  isFrontLikely: boolean;
  photoScore: number;
  qrBarcodeScore: number;
  textScore: number;
  reason: string;
}

export interface VectorPdfCardBounds {
  front: CropCoordinates;
  back: CropCoordinates;
  pageWidthPt: number;
  pageHeightPt: number;
  method: "pdf-image-placement" | "pdf-vector-path";
}

export interface DualDocumentDetectionResult {
  detected: boolean;
  confidence: number;
  frontCrop: CropCoordinates;
  backCrop: CropCoordinates | null;
  layout:
    | "horizontal"
    | "vertical"
    | "bottom-dual"
    | "single"
    | "fallback"
    | "pan"
    | "aadhaar"
    | "ration"
    | "voter-id";
  message: string;
  strategyUsed?: string;
  contentClassification?: {
    frontConfidence: number;
    backConfidence: number;
    swapped: boolean;
    reason: string;
  };
  debugInfo?: {
    contrastScore: number;
    edgeScore: number;
    detectedCount: number;
  };
}

/**
 * Single source document uploaded by user containing both Front and Back sides (or single-side for PAN).
 */
export interface DocumentSourceFile {
  file: File | null;
  fileType: DocumentFileType | null;
  previewUrl: string | null;
  dimensions: DocumentDimensions | null;
  fileSizeFormatted: string | null;
  fileName: string | null;
  pageCount: number;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * Result state for an isolated document side (Front or Back) cropped from the source document.
 */
export interface DocumentSideResult {
  crop: CropCoordinates | null;
  rotation: number;
  zoom: number;
  aspectRatioLocked: boolean;
  targetAspectRatio: number | null;
  croppedPreviewUrl: string | null;
  croppedBlob?: Blob | null;
  croppedDimensions: DocumentDimensions | null;
  isCropped: boolean;
  isManualCrop?: boolean;
  isCropEditorOpen: boolean;
  activeView: "cropped" | "original";
  enhancements: DocumentEnhancementSettings;
  enhancedPreviewUrl?: string | null;
  enhancedBlob?: Blob | null;
  showBefore?: boolean;
  printSettings: DocumentPrintSettings;
}

export interface DocumentAutoDetectState {
  status: "idle" | "detecting" | "success" | "partial" | "failed";
  message?: string;
  layout?:
    | "horizontal"
    | "vertical"
    | "bottom-dual"
    | "single"
    | "fallback"
    | "pan"
    | "aadhaar"
    | "ration"
    | "voter-id";
  confidence?: number;
}

export interface DocumentStudioState {
  selectedDocType: DocumentTypeId;
  customSidesMode: CustomSidesMode;
  sourceLayoutMode: SourceLayoutMode;
  source: DocumentSourceFile;
  front: DocumentSideResult;
  back: DocumentSideResult;
  autoDetectStatus: DocumentAutoDetectState;
  printSettings?: DocumentPrintSettings;
  printStudio?: DocumentPrintStudioState;
}

/**
 * Phase 3 & Phase 4 — Document Studio Print Studio & Print Layout Settings
 */
export type PrintStudioMode = "front-only" | "back-only" | "combined";

export type PrintStudioArrangement = "vertical" | "horizontal";

export type PrintPaperSize = "a4" | "a5" | "letter" | "custom";

export type PaperDimensionUnit = "mm" | "inch";

export interface PaperSizeDimensions {
  widthMm: number;
  heightMm: number;
}

export interface CustomPaperDimensions {
  width: number;
  height: number;
  unit: PaperDimensionUnit;
}

export const STANDARD_PAPER_SIZES: Record<"a4" | "a5" | "letter", PaperSizeDimensions> = {
  a4: { widthMm: 210, heightMm: 297 },
  a5: { widthMm: 148, heightMm: 210 },
  letter: { widthMm: 215.9, heightMm: 279.4 },
};

export type PrintOrientation = "portrait" | "landscape";

export type PrintMarginPreset = "none" | "small" | "normal" | "custom";

export interface PrintMargins {
  topMm: number;
  bottomMm: number;
  leftMm: number;
  rightMm: number;
}

export const DEFAULT_PRINT_MARGINS: Readonly<PrintMargins> = {
  topMm: 12.7,
  bottomMm: 12.7,
  leftMm: 12.7,
  rightMm: 12.7,
};

export const MARGIN_PRESET_VALUES: Record<
  "none" | "small" | "normal",
  PrintMargins
> = {
  none: { topMm: 0, bottomMm: 0, leftMm: 0, rightMm: 0 },
  small: { topMm: 5, bottomMm: 5, leftMm: 5, rightMm: 5 },
  normal: { topMm: 12.7, bottomMm: 12.7, leftMm: 12.7, rightMm: 12.7 },
};

export type PrintAlignment = "center" | "top" | "custom";

export interface PrintCustomPosition {
  xMm: number;
  yMm: number;
}

export type PrintScaleMode = "actual" | "fit" | "custom";

export interface DocumentPrintLayoutSettings {
  paperSize: PrintPaperSize;
  customPaper: CustomPaperDimensions;
  orientation: PrintOrientation;
  marginPreset: PrintMarginPreset;
  margins: PrintMargins;
  alignment: PrintAlignment;
  customPosition: PrintCustomPosition;
  scaleMode: PrintScaleMode;
  customScalePercentage: number;
  copies: number;
}

export const DEFAULT_PRINT_LAYOUT_SETTINGS: Readonly<DocumentPrintLayoutSettings> = {
  paperSize: "a4",
  customPaper: {
    width: 210,
    height: 297,
    unit: "mm",
  },
  orientation: "portrait",
  marginPreset: "normal",
  margins: DEFAULT_PRINT_MARGINS,
  alignment: "center",
  customPosition: {
    xMm: 0,
    yMm: 0,
  },
  scaleMode: "actual",
  customScalePercentage: 100,
  copies: 1,
};

export function createDefaultPrintLayoutSettings(): DocumentPrintLayoutSettings {
  return {
    paperSize: "a4",
    customPaper: { width: 210, height: 297, unit: "mm" },
    orientation: "portrait",
    marginPreset: "normal",
    margins: { ...DEFAULT_PRINT_MARGINS },
    alignment: "center",
    customPosition: { xMm: 0, yMm: 0 },
    scaleMode: "actual",
    customScalePercentage: 100,
    copies: 1,
  };
}

export interface DocumentPrintStudioState {
  mode: PrintStudioMode;
  arrangement: PrintStudioArrangement;
  layout?: DocumentPrintLayoutSettings;
}

export const DEFAULT_PRINT_STUDIO_STATE: Readonly<DocumentPrintStudioState> = {
  mode: "combined",
  arrangement: "vertical",
  layout: DEFAULT_PRINT_LAYOUT_SETTINGS,
};

export function createDefaultPrintStudioState(
  isSingleSided: boolean = false
): DocumentPrintStudioState {
  return {
    mode: isSingleSided ? "front-only" : "combined",
    arrangement: "vertical",
    layout: createDefaultPrintLayoutSettings(),
  };
}

/** Legacy compatibility alias */
export interface DocumentFileState extends DocumentSourceFile {
  cropState: DocumentCropState;
}

export interface RenderPdfOptions {
  scale?: number;
  pageNumber?: number;
}
