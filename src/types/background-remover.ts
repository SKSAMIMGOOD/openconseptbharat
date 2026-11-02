/**
 * Background Remover Type Definitions
 * Strict TypeScript contracts for client-side AI background removal,
 * models, inference progress, background presets, preview, and export.
 */

export type ModelId = "rmbg-1.4" | "u2netp" | "custom";

export interface ModelDefinition {
  id: ModelId;
  name: string;
  tagline: string;
  description: string;
  sizeMB: number;
  inputDimensions: { width: number; height: number };
  url: string;
  source: string;
  recommended?: boolean;
}

export type ExecutionProvider = "webgpu" | "webgl" | "wasm";

export interface ModelLoadingProgress {
  phase: "idle" | "checking_cache" | "downloading" | "compiling" | "ready" | "error";
  loadedBytes: number;
  totalBytes: number;
  percent: number;
  fromCache: boolean;
  message: string;
}

export interface InferenceProgress {
  stage: "idle" | "preprocessing" | "inferring" | "postprocessing" | "completed" | "error";
  percent: number;
  message: string;
}

export type BackgroundColorId =
  | "transparent"
  | "white"
  | "light-blue"
  | "dark-blue"
  | "red"
  | "green"
  | "custom";

export interface BackgroundColorOption {
  id: BackgroundColorId;
  name: string;
  value: string; // hex color or "transparent"
  description: string;
}

export type BeforeAfterViewMode =
  | "split_slider"
  | "side_by_side"
  | "processed_only"
  | "original_only";

export type ExportFormat =
  | "png_transparent"
  | "png_background"
  | "jpeg_background";

export interface BackgroundRemoverExportOptions {
  format: ExportFormat;
  quality?: number; // 0.1 to 1.0 for JPEG
  fileName?: string;
  backgroundColor?: string;
}

export interface SegmentationResult {
  cutoutBlob: Blob;
  cutoutUrl: string;
  cutoutCanvas: HTMLCanvasElement;
  maskCanvas: HTMLCanvasElement;
  width: number;
  height: number;
}
