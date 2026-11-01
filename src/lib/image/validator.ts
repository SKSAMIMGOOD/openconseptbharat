import type {
  SupportedImageFormat,
  ImageExtension,
  ImageValidationOptions,
  ImageValidationResult,
  ImageDimensions,
} from "../../types/image-engine";

export const DEFAULT_ALLOWED_MIMES: SupportedImageFormat[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const DEFAULT_ALLOWED_EXTENSIONS: ImageExtension[] = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
];

export const DEFAULT_MAX_SIZE_MB = 25;

/**
 * Extracts the file extension in lower-case with leading dot.
 */
export function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex === -1) return "";
  return fileName.slice(lastDotIndex).toLowerCase();
}

/**
 * Verifies magic bytes of the file to protect against spoofed or corrupted image files.
 */
export async function verifyImageMagicBytes(
  file: File
): Promise<{ isValid: boolean; detectedFormat?: SupportedImageFormat }> {
  try {
    const buffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (bytes.length < 4) {
      return { isValid: false };
    }

    // JPEG signature: 0xFF 0xD8 0xFF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return { isValid: true, detectedFormat: "image/jpeg" };
    }

    // PNG signature: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    ) {
      return { isValid: true, detectedFormat: "image/png" };
    }

    // WebP signature: RIFF....WEBP
    if (
      bytes[0] === 0x52 && // R
      bytes[1] === 0x49 && // I
      bytes[2] === 0x46 && // F
      bytes[3] === 0x46 && // F
      bytes[8] === 0x57 && // W
      bytes[9] === 0x45 && // E
      bytes[10] === 0x42 && // B
      bytes[11] === 0x50 // P
    ) {
      return { isValid: true, detectedFormat: "image/webp" };
    }

    return { isValid: false };
  } catch {
    return { isValid: false };
  }
}

/**
 * Validates file headers, format, extension, and file size synchronously and via magic bytes.
 */
export async function validateImageFile(
  file: File,
  options: ImageValidationOptions = {}
): Promise<ImageValidationResult> {
  if (!file) {
    return {
      isValid: false,
      error: "No file was provided for validation.",
      errorCode: "NO_FILE",
    };
  }

  const allowedMimes = options.allowedMimeTypes ?? DEFAULT_ALLOWED_MIMES;
  const allowedExtensions = options.allowedExtensions ?? DEFAULT_ALLOWED_EXTENSIONS;
  const maxSizeMB = options.maxSizeMB ?? DEFAULT_MAX_SIZE_MB;

  // 1. File size check
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `File size (${sizeInMB} MB) exceeds maximum allowed limit of ${maxSizeMB} MB.`,
      errorCode: "FILE_TOO_LARGE",
    };
  }

  // 2. File extension check
  const ext = getFileExtension(file.name) as ImageExtension;
  if (!allowedExtensions.includes(ext)) {
    return {
      isValid: false,
      error: `Invalid file extension "${ext || "none"}". Allowed formats: ${allowedExtensions.join(", ")}.`,
      errorCode: "INVALID_EXTENSION",
    };
  }

  // 3. MIME type check
  const mime = file.type.toLowerCase() as SupportedImageFormat;
  if (mime && !allowedMimes.includes(mime)) {
    return {
      isValid: false,
      error: `Unsupported MIME type "${file.type}". Allowed: ${allowedMimes.join(", ")}.`,
      errorCode: "INVALID_MIME",
    };
  }

  // 4. Magic bytes verification
  const magicCheck = await verifyImageMagicBytes(file);
  if (!magicCheck.isValid) {
    return {
      isValid: false,
      error: "The file header is corrupted or does not match a valid image format (JPEG, PNG, or WebP).",
      errorCode: "CORRUPTED_FILE",
    };
  }

  return {
    isValid: true,
    detectedFormat: magicCheck.detectedFormat,
  };
}

/**
 * Generates a unique deduplication signature for a file based on name, size, lastModified,
 * and a sample of its byte content to prevent duplicate uploads without loading the entire file.
 */
export async function generateFileFingerprint(file: File): Promise<string> {
  const metaPart = `${file.name}-${file.size}-${file.lastModified}`;
  try {
    const chunk = await file.slice(0, 128).arrayBuffer();
    const bytes = new Uint8Array(chunk);
    let sampleHash = 0;
    for (let i = 0; i < bytes.length; i++) {
      sampleHash = ((sampleHash << 5) - sampleHash + bytes[i]) | 0;
    }
    return `${metaPart}-${sampleHash}`;
  } catch {
    return metaPart;
  }
}

/**
 * Checks a file against a list of already loaded files to detect duplicates.
 */
export async function isDuplicateFile(
  newFile: File,
  existingFingerprints: Set<string>
): Promise<boolean> {
  const fingerprint = await generateFileFingerprint(newFile);
  return existingFingerprints.has(fingerprint);
}
