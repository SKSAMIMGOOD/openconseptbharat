import {
  DecodedImageSource,
  ImageDimensions,
  SupportedImageFormat,
} from "../../types/image-engine";
import { createTrackedObjectURL, revokeObjectUrlSafely } from "../utils/memory";

/** Maximum texture dimension supported safely across modern browser canvas implementations */
export const MAX_SAFE_CANVAS_DIMENSION = 16384;

/**
 * Decodes an image file or blob into an ImageBitmap using native browser APIs with EXIF orientation correction.
 * Falls back to HTMLImageElement if createImageBitmap fails or is unsupported.
 */
export async function decodeImage(
  blob: Blob | File,
  options?: { targetFormat?: SupportedImageFormat }
): Promise<DecodedImageSource> {
  if (typeof window === "undefined") {
    throw new Error("Image decoding is only supported in browser environments.");
  }

  // 1. Preferred Native Path: createImageBitmap with EXIF correction
  if (typeof window.createImageBitmap === "function") {
    try {
      // imageOrientation: 'from-image' respects EXIF rotation tags in JPEG portraits
      const bitmap = await window.createImageBitmap(blob, {
        imageOrientation: "from-image",
        premultiplyAlpha: "default",
        colorSpaceConversion: "default",
      });

      if (bitmap.width <= 0 || bitmap.height <= 0) {
        bitmap.close();
        throw new Error("Decoded image returned non-positive dimensions.");
      }

      if (
        bitmap.width > MAX_SAFE_CANVAS_DIMENSION ||
        bitmap.height > MAX_SAFE_CANVAS_DIMENSION
      ) {
        bitmap.close();
        throw new Error(
          `Image dimensions (${bitmap.width} × ${bitmap.height} px) exceed safe browser memory limit of ${MAX_SAFE_CANVAS_DIMENSION} px.`
        );
      }

      const format: SupportedImageFormat =
        options?.targetFormat ||
        (blob.type as SupportedImageFormat) ||
        "image/png";

      return {
        source: bitmap,
        isBitmap: true,
        width: bitmap.width,
        height: bitmap.height,
        aspectRatio: bitmap.width / bitmap.height,
        format,
        close: () => {
          try {
            bitmap.close();
          } catch {
            // Already closed
          }
        },
      };
    } catch (bitmapError) {
      // Fall through to HTMLImageElement fallback if createImageBitmap fails
      console.warn("createImageBitmap failed, falling back to HTMLImageElement:", bitmapError);
    }
  }

  // 2. Fallback Path: HTMLImageElement via ephemeral Object URL
  return new Promise((resolve, reject) => {
    const objectUrl = createTrackedObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      if (img.naturalWidth <= 0 || img.naturalHeight <= 0) {
        revokeObjectUrlSafely(objectUrl);
        reject(new Error("Image loaded with zero or invalid dimensions."));
        return;
      }

      if (
        img.naturalWidth > MAX_SAFE_CANVAS_DIMENSION ||
        img.naturalHeight > MAX_SAFE_CANVAS_DIMENSION
      ) {
        revokeObjectUrlSafely(objectUrl);
        reject(
          new Error(
            `Image dimensions (${img.naturalWidth} × ${img.naturalHeight} px) exceed safe limit of ${MAX_SAFE_CANVAS_DIMENSION} px.`
          )
        );
        return;
      }

      const format: SupportedImageFormat =
        options?.targetFormat ||
        (blob.type as SupportedImageFormat) ||
        "image/png";

      resolve({
        source: img,
        isBitmap: false,
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
        format,
        close: () => {
          img.src = "";
          revokeObjectUrlSafely(objectUrl);
        },
      });
    };

    img.onerror = () => {
      revokeObjectUrlSafely(objectUrl);
      reject(new Error("Corrupted image data: browser failed to decode picture."));
    };

    img.src = objectUrl;
  });
}

/**
 * Extracts image dimensions without retaining full image in memory.
 * Quickly decodes and immediately releases all allocated buffers.
 */
export async function readImageDimensions(blob: Blob | File): Promise<ImageDimensions> {
  const decoded = await decodeImage(blob);
  const dims: ImageDimensions = {
    width: decoded.width,
    height: decoded.height,
    aspectRatio: decoded.aspectRatio,
  };
  decoded.close();
  return dims;
}
