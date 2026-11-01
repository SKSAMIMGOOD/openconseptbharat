/**
 * Shared Browser Image Processing Engine — Type Definitions
 * Strict TypeScript contracts for input, decoding, transforms, workers, preview, and export.
 */

export type SupportedImageFormat = "image/jpeg" | "image/png" | "image/webp";

export type ImageExtension = ".jpg" | ".jpeg" | ".png" | ".webp";

export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export interface ImageValidationOptions {
  allowedMimeTypes?: SupportedImageFormat[];
  allowedExtensions?: ImageExtension[];
  maxSizeMB?: number;
  minDimensions?: { width: number; height: number };
  maxDimensions?: { width: number; height: number };
  verifyDecode?: boolean;
}

export type ImageErrorCode =
  | "NO_FILE"
  | "INVALID_MIME"
  | "INVALID_EXTENSION"
  | "FILE_TOO_LARGE"
  | "DIMENSIONS_TOO_SMALL"
  | "DIMENSIONS_TOO_LARGE"
  | "MAGIC_BYTES_MISMATCH"
  | "DECODE_FAILED"
  | "CORRUPTED_FILE"
  | "DUPLICATE_FILE"
  | "PROCESSING_ERROR"
  | "EXPORT_ERROR";

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  errorCode?: ImageErrorCode;
  dimensions?: ImageDimensions;
  detectedFormat?: SupportedImageFormat;
}

export interface ValidatedImageFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: SupportedImageFormat;
  dimensions: ImageDimensions;
  previewUrl: string;
  createdAt: number;
}

export interface DecodedImageSource {
  source: ImageBitmap | HTMLImageElement;
  isBitmap: boolean;
  width: number;
  height: number;
  aspectRatio: number;
  format: SupportedImageFormat;
  close: () => void;
}

export interface ResizeOptions {
  width: number;
  height: number;
  maintainAspectRatio?: boolean;
  smoothingQuality?: ImageSmoothingQuality;
}

export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatioConstraint?: number;
}

export interface RotateOptions {
  angle: number; // in degrees, e.g. 90, 180, 270 or arbitrary
  expandBounds?: boolean; // defaults to true for arbitrary angles
}

export interface FlipOptions {
  horizontal: boolean;
  vertical: boolean;
}

export interface ImageTransformPipeline {
  crop?: CropRegion;
  rotate?: RotateOptions;
  flip?: FlipOptions;
  resize?: ResizeOptions;
  backgroundColor?: string; // Hex or CSS color, defaults to transparent or white for JPEG
}

export interface ImageExportOptions {
  format: SupportedImageFormat;
  quality?: number; // 0.1 to 1.0 (defaults to 0.92 for lossy)
  backgroundColor?: string; // used when exporting transparency to formats like JPEG
  fileName?: string;
}

export interface ExportResult {
  blob: Blob;
  fileName: string;
  format: SupportedImageFormat;
  width: number;
  height: number;
  sizeBytes: number;
}

// Worker message protocols
export type WorkerOperationType = "transform" | "resize" | "crop" | "rotate" | "flip" | "export";

export interface WorkerJobRequest {
  jobId: string;
  operation: WorkerOperationType;
  bitmap?: ImageBitmap;
  pipeline?: ImageTransformPipeline;
  exportOptions?: ImageExportOptions;
}

export interface WorkerProgressMessage {
  type: "progress";
  jobId: string;
  stage: string;
  percent: number;
}

export interface WorkerSuccessMessage {
  type: "success";
  jobId: string;
  bitmap?: ImageBitmap;
  blob?: Blob;
  width?: number;
  height?: number;
}

export interface WorkerErrorMessage {
  type: "error";
  jobId: string;
  error: string;
}

export type WorkerResponseMessage =
  | WorkerProgressMessage
  | WorkerSuccessMessage
  | WorkerErrorMessage;
