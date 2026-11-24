/**
 * Raw Image to Clean PDF — Type Definitions
 * Phase 1: Foundation & Multi-Image Upload
 * Phase 2: Decoupled Multi-Page Perspective Cropper & Loupe
 * Phase 3: Document Enhancement & Annotation Tools
 *
 * Types for multi-image batch upload, independent page lifecycle,
 * 4-corner perspective cropping, global document enhancements,
 * pixel-retouching eraser, highlighter, watermark, and undo/redo stacks.
 */

import type {
  Point2D,
  PerspectiveQuad,
  CornerHandleKey,
  AspectRatioPreset,
  PerspectiveDetectionResult,
} from "./document-straightener.ts";

import type { DocumentEnhancementSettings } from "./document-studio.ts";
import { DEFAULT_ENHANCEMENT_SETTINGS } from "./document-studio.ts";

export type {
  Point2D,
  PerspectiveQuad,
  CornerHandleKey,
  AspectRatioPreset,
  PerspectiveDetectionResult,
  DocumentEnhancementSettings,
};

export { DEFAULT_ENHANCEMENT_SETTINGS };

export const NEUTRAL_ENHANCEMENT_SETTINGS: Readonly<DocumentEnhancementSettings> = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpness: 0,
  grayscale: false,
  invert: false,
};

export type EdgeHandleKey = "top" | "right" | "bottom" | "left";

export type PageProcessingStatus = "idle" | "loading" | "ready" | "error";

export type AnnotationToolType =
  | "select"
  | "enhance"
  | "filter"
  | "eraser"
  | "highlighter"
  | "watermark";

export type ColorFilterPresetId =
  | "original"
  | "auto"
  | "grayscale"
  | "bw"
  | "warm"
  | "cool"
  | "vintage"
  | "high-contrast";

export interface ColorFilterSettings {
  preset: ColorFilterPresetId;
  intensity: number; // 0 to 100, default 100
}

export const DEFAULT_COLOR_FILTER_SETTINGS: Readonly<ColorFilterSettings> = {
  preset: "original",
  intensity: 100,
};

export interface FilterPresetOption {
  id: ColorFilterPresetId;
  name: string;
  description: string;
  previewFilter: string;
}

export const COLOR_FILTER_PRESETS: ReadonlyArray<FilterPresetOption> = [
  {
    id: "original",
    name: "Original",
    description: "Natural document color without filters",
    previewFilter: "none",
  },
  {
    id: "auto",
    name: "Auto Color",
    description: "Enhanced clarity, balanced contrast & vibrancy",
    previewFilter: "contrast(1.15) saturate(1.15) brightness(1.05)",
  },
  {
    id: "grayscale",
    name: "Grayscale",
    description: "Balanced monochrome tonal reproduction",
    previewFilter: "grayscale(100%)",
  },
  {
    id: "bw",
    name: "Black & White",
    description: "Crisp high-contrast document scan",
    previewFilter: "grayscale(100%) contrast(2.2) brightness(1.1)",
  },
  {
    id: "warm",
    name: "Warm",
    description: "Pleasant warm paper tone with soft amber highlights",
    previewFilter: "sepia(40%) saturate(1.2) brightness(1.02)",
  },
  {
    id: "cool",
    name: "Cool",
    description: "Clean modern cool tone with subtle cyan tint",
    previewFilter: "hue-rotate(-20deg) saturate(1.1) brightness(1.03)",
  },
  {
    id: "vintage",
    name: "Vintage",
    description: "Archival retro print with sepia aging",
    previewFilter: "sepia(60%) contrast(0.85) saturate(0.8)",
  },
  {
    id: "high-contrast",
    name: "High Contrast",
    description: "Deep blacks and punchy whites for faded scans",
    previewFilter: "contrast(1.8) brightness(0.95)",
  },
];

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface AnnotationStroke {
  id: string;
  tool: "eraser" | "highlighter";
  points: DrawingPoint[];
  size: number;
  color: string;
  opacity: number;
}

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  fontSize: number; // in pixels (e.g. 16 to 120, default 48)
  color: string; // e.g. "#64748b" (slate), "#ef4444" (red), etc.
  opacity: number; // 0.05 to 1.0 (default 0.25)
  rotation: number; // in degrees (-90 to 90, default -30)
  xPercent: number; // 0 to 100 (50 is center)
  yPercent: number; // 0 to 100 (50 is center)
}

export const DEFAULT_WATERMARK_CONFIG: Readonly<WatermarkConfig> = {
  enabled: true,
  text: "CONFIDENTIAL",
  fontSize: 48,
  color: "#64748b",
  opacity: 0.25,
  rotation: -30,
  xPercent: 50,
  yPercent: 50,
};

export interface PageCropConfig {
  quad: PerspectiveQuad;
  rotation: number; // 0, 90, 180, 270
  aspectRatioPreset: AspectRatioPreset;
  appliedAt?: number;
}

export interface RawDocumentPage {
  id: string;
  file: File;
  name: string;
  size: number;
  sizeFormatted: string;
  originalWidth: number;
  originalHeight: number;
  aspectRatio: number;
  thumbnailUrl: string;
  thumbnailBlob?: Blob;
  status: PageProcessingStatus;
  error?: string;

  // Phase 2: Independent 4-corner crop & perspective state
  rotation?: number; // 0, 90, 180, 270
  isCropped?: boolean;
  cropConfig?: PageCropConfig;
  croppedPreviewUrl?: string;
  croppedBlob?: Blob;
  croppedWidth?: number;
  croppedHeight?: number;

  // Phase 3: Page-specific annotations & watermark state
  annotations?: AnnotationStroke[];
  undoStack?: AnnotationStroke[];
  watermark?: WatermarkConfig | null;
  editedPreviewUrl?: string;
  editedBlob?: Blob;

  // Phase 3.1: Per-page opt-out for global enhancements and color filters (default true)
  applyGlobalEdits?: boolean;

  // Workflow: Track whether page crop is confirmed (cropped or confirmed original)
  cropConfirmed?: boolean;
}

export type WorkflowStep = "upload" | "crop" | "edit";

export interface RawImageToPdfConfig {
  maxBatchSize: number;
  maxFileSizeMB: number;
  allowedMimeTypes: string[];
  thumbnailMaxDimension: number;
  thumbnailQuality: number;
}

export const DEFAULT_RAW_IMAGE_CONFIG: Readonly<RawImageToPdfConfig> = {
  maxBatchSize: 5,
  maxFileSizeMB: 25,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  thumbnailMaxDimension: 480,
  thumbnailQuality: 0.82,
};

export interface RawImageToPdfState {
  pages: RawDocumentPage[];
  activePageIndex: number;
  isProcessing: boolean;
  statusMessage: string | null;
  validationErrors: string[];
}

export interface BatchUploadResult {
  addedPages: RawDocumentPage[];
  rejectedCount: number;
  errors: string[];
}

// ==========================================
// Phase 4: A4 Fitting & PDF Compiler Types
// ==========================================

export const A4_WIDTH_PT = 595.28;
export const A4_HEIGHT_PT = 841.89;
export const DEFAULT_A4_MARGIN_PT = 24; // ~8.5 mm padding around content

export interface A4PageFitGeometry {
  pageWidthPt: number;
  pageHeightPt: number;
  isLandscape: boolean;
  contentX: number;
  contentY: number;
  contentWidthPt: number;
  contentHeightPt: number;
  scale: number;
}

export interface RawImagePdfExportOptions {
  pages: RawDocumentPage[];
  globalEnhancements: DocumentEnhancementSettings;
  globalColorFilter?: ColorFilterSettings;
  format?: "pdf" | "png";
  dpi?: 300 | 600;
  quality?: number; // 0.85 to 1.0 (default 0.95)
  fileName?: string;
  onProgress?: (progress: {
    currentPage: number;
    totalPages: number;
    percentage: number;
    statusText: string;
  }) => void;
}

export interface RawImagePdfExportResult {
  blob: Blob;
  fileName: string;
  sizeBytes: number;
  pageCount: number;
  format: "application/pdf" | "image/png";
}

