import type { FileValidationOptions, FileValidationResult, ImageDimensions } from "@/types/files";

/**
 * Validates a user uploaded file against allowed MIME types and max size.
 */
export function validateFile(file: File, options: FileValidationOptions): FileValidationResult {
  if (!file) {
    return { isValid: false, error: "No file provided", errorCode: "CORRUPTED_FILE" };
  }

  // Size validation
  const maxBytes = options.maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      isValid: false,
      error: `File size exceeds the limit of ${options.maxSizeMB} MB (Current: ${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
      errorCode: "FILE_TOO_LARGE",
    };
  }

  // MIME type validation
  if (options.allowedMimeTypes.length > 0) {
    const isMimeValid = options.allowedMimeTypes.some((allowed) => {
      if (allowed.endsWith("/*")) {
        const prefix = allowed.replace("/*", "");
        return file.type.startsWith(prefix);
      }
      return file.type === allowed;
    });

    if (!isMimeValid) {
      return {
        isValid: false,
        error: `Unsupported file type (${file.type || "unknown"}). Allowed formats: ${options.allowedMimeTypes.join(", ")}`,
        errorCode: "INVALID_TYPE",
      };
    }
  }

  return { isValid: true };
}

/**
 * Reads image dimensions client-side using an offscreen HTMLImageElement.
 */
export function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Browser environment required for image dimension extraction"));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const dimensions: ImageDimensions = {
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
      };
      URL.revokeObjectURL(objectUrl);
      resolve(dimensions);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for dimension extraction"));
    };

    img.src = objectUrl;
  });
}

/**
 * Inspects initial byte signatures (magic bytes) to verify file integrity.
 */
export async function verifyFileMagicBytes(file: File): Promise<boolean> {
  try {
    const buffer = await file.slice(0, 8).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // PDF magic bytes: %PDF- (0x25 0x50 0x44 0x46)
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return true;
    }

    // JPEG magic bytes: 0xFF 0xD8 0xFF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return true;
    }

    // PNG magic bytes: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return true;
    }

    // WebP magic bytes: RIFF....WEBP
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
