/**
 * Document Straightener — Type Definitions
 *
 * Provides types for 4-corner perspective crop, precision magnification loupe,
 * independent front & back workflow, and integration with Document Studio enhancement/print pipeline.
 */

import type {
  DocumentDimensions,
  DocumentEnhancementSettings,
  DocumentPrintSettings,
} from "./document-studio";

export interface Point2D {
  x: number;
  y: number;
}

export type CornerHandleKey = "topLeft" | "topRight" | "bottomRight" | "bottomLeft";

export interface PerspectiveQuad {
  topLeft: Point2D;
  topRight: Point2D;
  bottomRight: Point2D;
  bottomLeft: Point2D;
}

export type StraightenerSide = "front" | "back";

export type StraightenerStep =
  | "upload"
  | "crop-front"
  | "crop-back"
  | "preview";

export type AspectRatioPreset = "auto" | "cr80" | "a4" | "custom";

export interface PerspectiveDetectionResult {
  detected: boolean;
  confidence: number;
  quad: PerspectiveQuad;
  message: string;
}

export interface StraightenerSideState {
  file: File | null;
  previewUrl: string | null;
  dimensions: DocumentDimensions | null;
  rotation: number; // 0, 90, 180, 270
  quad: PerspectiveQuad | null;
  straightenedUrl: string | null;
  straightenedBlob: Blob | null;
  straightenedDimensions: DocumentDimensions | null;
  aspectRatioPreset: AspectRatioPreset;
  enhancements: DocumentEnhancementSettings;
  enhancedPreviewUrl: string | null;
  enhancedBlob: Blob | null;
  printSettings: DocumentPrintSettings;
  isConfirmed: boolean;
  autoDetectConfidence: number | null;
  isLoading: boolean;
  error: string | null;
}

export interface DocumentStraightenerState {
  front: StraightenerSideState;
  back: StraightenerSideState;
  activeSide: StraightenerSide;
  step: StraightenerStep;
  isDualSide: boolean;
}
