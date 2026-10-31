export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export interface ValidatedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl: string;
  dimensions?: ImageDimensions;
  createdAt: number;
}

export interface FileValidationOptions {
  allowedMimeTypes: string[];
  maxSizeMB: number;
  minDimensions?: { width: number; height: number };
  maxDimensions?: { width: number; height: number };
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  errorCode?: "INVALID_TYPE" | "FILE_TOO_LARGE" | "INVALID_DIMENSIONS" | "CORRUPTED_FILE";
}
