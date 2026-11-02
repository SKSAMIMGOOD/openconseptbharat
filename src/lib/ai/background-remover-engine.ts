/**
 * Core AI Background Removal Engine
 * 
 * Performs 100% in-browser client-side neural network inference via ONNX Runtime Web.
 * Operates purely in local memory (RAM) with zero network transmissions.
 */

import * as ort from "onnxruntime-web";
import { ModelId, ExecutionProvider, SegmentationResult } from "@/types/background-remover";

// Configure ONNX Runtime Web WASM environment safely for browser context
if (typeof window !== "undefined") {
  // Use 1 thread to avoid requiring SharedArrayBuffer COOP/COEP headers
  ort.env.wasm.numThreads = 1;
  // Point to reliable jsdelivr CDN for ONNX WebAssembly binaries
  ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.1/dist/";
}

/**
 * Creates an optimized ONNX InferenceSession attempting WebGPU -> WebGL -> WASM fallback.
 */
export async function createSession(
  modelBuffer: ArrayBuffer,
  preferredProvider?: ExecutionProvider
): Promise<{ session: ort.InferenceSession; activeProvider: ExecutionProvider }> {
  const providerCandidates: ExecutionProvider[] = preferredProvider
    ? [preferredProvider, "webgpu", "webgl", "wasm"].filter((p, i, a) => a.indexOf(p) === i) as ExecutionProvider[]
    : ["webgpu", "webgl", "wasm"];

  let lastError: Error | null = null;

  for (const provider of providerCandidates) {
    try {
      const options: ort.InferenceSession.SessionOptions = {
        executionProviders: [provider],
        graphOptimizationLevel: "all",
      };
      const session = await ort.InferenceSession.create(modelBuffer, options);
      return { session, activeProvider: provider };
    } catch (err) {
      console.warn(`Execution provider "${provider}" initialization failed, falling back:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  // Final fallback to default WASM runtime
  try {
    const session = await ort.InferenceSession.create(modelBuffer);
    return { session, activeProvider: "wasm" };
  } catch (err) {
    throw new Error(
      `Failed to initialize ONNX Runtime Web session: ${
        lastError?.message || (err instanceof Error ? err.message : String(err))
      }`
    );
  }
}

/**
 * Prepares input NCHW Float32 tensor for the model from source image pixels.
 */
export function prepareInputTensor(
  sourceCanvasOrImage: HTMLCanvasElement | ImageBitmap | ImageData | HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  modelId: ModelId
): { tensor: ort.Tensor; scaledImageData: ImageData } {
  // 1. Render onto a target dimensions canvas
  let canvas: HTMLCanvasElement | OffscreenCanvas;
  if (typeof OffscreenCanvas !== "undefined") {
    canvas = new OffscreenCanvas(targetWidth, targetHeight);
  } else {
    canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  const ctx = canvas.getContext("2d", { willReadFrequently: true }) as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D;

  if (!ctx) {
    throw new Error("Unable to obtain 2D canvas context for tensor preprocessing.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (sourceCanvasOrImage instanceof ImageData) {
    // Put temp onto canvas then scale
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = sourceCanvasOrImage.width;
    tempCanvas.height = sourceCanvasOrImage.height;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx?.putImageData(sourceCanvasOrImage, 0, 0);
    ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
  } else {
    ctx.drawImage(sourceCanvasOrImage, 0, 0, targetWidth, targetHeight);
  }

  const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const { data } = imageData;
  const numPixels = targetWidth * targetHeight;
  const float32Array = new Float32Array(3 * numPixels);

  // 2. Normalize according to model architecture
  if (modelId === "u2netp") {
    // Standard ImageNet normalization: mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
    const mean = [0.485, 0.456, 0.406];
    const std = [0.229, 0.224, 0.225];

    for (let i = 0; i < numPixels; i++) {
      const r = data[i * 4] / 255.0;
      const g = data[i * 4 + 1] / 255.0;
      const b = data[i * 4 + 2] / 255.0;

      float32Array[i] = (r - mean[0]) / std[0];
      float32Array[numPixels + i] = (g - mean[1]) / std[1];
      float32Array[2 * numPixels + i] = (b - mean[2]) / std[2];
    }
  } else {
    // RMBG-1.4 & default: (pixel / 255.0 - 0.5) / 1.0 = (pixel / 255.0) - 0.5
    for (let i = 0; i < numPixels; i++) {
      const r = data[i * 4] / 255.0;
      const g = data[i * 4 + 1] / 255.0;
      const b = data[i * 4 + 2] / 255.0;

      float32Array[i] = r - 0.5;
      float32Array[numPixels + i] = g - 0.5;
      float32Array[2 * numPixels + i] = b - 0.5;
    }
  }

  const tensor = new ort.Tensor("float32", float32Array, [1, 3, targetHeight, targetWidth]);
  return { tensor, scaledImageData: imageData };
}

/**
 * Extracts raw alpha mask values from output tensor and normalizes to 0-255.
 */
export function extractAlphaMaskValues(
  outputTensor: ort.Tensor,
  targetWidth: number,
  targetHeight: number
): Uint8ClampedArray {
  const data = outputTensor.data as Float32Array;
  const numPixels = targetWidth * targetHeight;
  const mask = new Uint8ClampedArray(numPixels);

  let min = Infinity;
  let max = -Infinity;

  for (let i = 0; i < numPixels; i++) {
    const val = data[i];
    if (val < min) min = val;
    if (val > max) max = val;
  }

  const range = max - min;

  for (let i = 0; i < numPixels; i++) {
    let val = data[i];
    if (range > 0 && (min < 0 || max > 1.05)) {
      // Min-max normalization for models outputting unscaled logits
      val = (val - min) / range;
    } else {
      // Clamp to [0, 1]
      val = Math.max(0, Math.min(1, val));
    }
    mask[i] = Math.round(val * 255);
  }

  return mask;
}

/**
 * Smoothly rescales the model alpha mask back to the original image dimensions
 * using Canvas bicubic interpolation.
 */
export function rescaleMaskToDimensions(
  maskValues: Uint8ClampedArray,
  maskWidth: number,
  maskHeight: number,
  targetWidth: number,
  targetHeight: number
): ImageData {
  // 1. Construct temporary mask canvas at model resolution
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = maskWidth;
  maskCanvas.height = maskHeight;
  const maskCtx = maskCanvas.getContext("2d");
  if (!maskCtx) throw new Error("Could not create mask canvas context.");

  const maskImageData = maskCtx.createImageData(maskWidth, maskHeight);
  const totalModelPixels = maskWidth * maskHeight;
  for (let i = 0; i < totalModelPixels; i++) {
    maskImageData.data[i * 4] = 0;
    maskImageData.data[i * 4 + 1] = 0;
    maskImageData.data[i * 4 + 2] = 0;
    maskImageData.data[i * 4 + 3] = maskValues[i];
  }
  maskCtx.putImageData(maskImageData, 0, 0);

  // 2. Rescale onto target original dimensions canvas with high-quality smoothing
  const targetCanvas = document.createElement("canvas");
  targetCanvas.width = targetWidth;
  targetCanvas.height = targetHeight;
  const targetCtx = targetCanvas.getContext("2d");
  if (!targetCtx) throw new Error("Could not create target canvas context.");

  targetCtx.imageSmoothingEnabled = true;
  targetCtx.imageSmoothingQuality = "high";
  targetCtx.drawImage(maskCanvas, 0, 0, targetWidth, targetHeight);

  return targetCtx.getImageData(0, 0, targetWidth, targetHeight);
}

/**
 * Applies the rescaled alpha mask to the original image pixels.
 * Strictly preserves the original RGB colors without distortion.
 */
export function applyAlphaMaskToImage(
  originalImageData: ImageData,
  rescaledMask: ImageData
): ImageData {
  const width = originalImageData.width;
  const height = originalImageData.height;
  const totalPixels = width * height;

  const output = new ImageData(width, height);
  const origData = originalImageData.data;
  const maskData = rescaledMask.data;
  const outData = output.data;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const origAlpha = origData[idx + 3] / 255.0;
    const maskAlpha = maskData[idx + 3] / 255.0;
    const finalAlpha = Math.round(origAlpha * maskAlpha * 255.0);

    // Keep original RGB 100% untouched
    outData[idx] = origData[idx];
    outData[idx + 1] = origData[idx + 1];
    outData[idx + 2] = origData[idx + 2];
    outData[idx + 3] = finalAlpha;
  }

  return output;
}

/**
 * Composites the transparent cutout on top of a selected background color (or transparent).
 */
export function compositeOnBackground(
  cutoutCanvasOrBitmap: HTMLCanvasElement | ImageBitmap,
  width: number,
  height: number,
  backgroundColor: string
): HTMLCanvasElement {
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));
  const canvas = document.createElement("canvas");
  canvas.width = safeWidth;
  canvas.height = safeHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get composite canvas context.");

  if (backgroundColor && backgroundColor !== "transparent") {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, safeWidth, safeHeight);
  } else {
    ctx.clearRect(0, 0, safeWidth, safeHeight);
  }

  ctx.drawImage(cutoutCanvasOrBitmap, 0, 0, safeWidth, safeHeight);
  return canvas;
}

/**
 * End-to-end background removal execution pipeline.
 */
export async function executeSegmentation(
  session: ort.InferenceSession,
  imageSource: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
  modelId: ModelId,
  inputDims: { width: number; height: number },
  onProgress?: (progress: { stage: string; percent: number }) => void
): Promise<SegmentationResult> {
  const rawWidth = imageSource instanceof HTMLImageElement
    ? (imageSource.naturalWidth || imageSource.width)
    : imageSource.width;
  const rawHeight = imageSource instanceof HTMLImageElement
    ? (imageSource.naturalHeight || imageSource.height)
    : imageSource.height;

  const width = Math.max(1, Math.round(rawWidth));
  const height = Math.max(1, Math.round(rawHeight));

  // 1. Preprocessing
  onProgress?.({ stage: "Preprocessing image tensor...", percent: 20 });
  const { tensor } = prepareInputTensor(imageSource, inputDims.width, inputDims.height, modelId);

  // 2. Neural Network Inference
  onProgress?.({ stage: "Running neural network segmentation...", percent: 50 });
  const feeds: Record<string, ort.Tensor> = {};
  feeds[session.inputNames[0]] = tensor;
  const results = await session.run(feeds);
  const outputTensor = results[session.outputNames[0]];

  // 3. Postprocessing & Mask Extraction
  onProgress?.({ stage: "Extracting & refining alpha mask...", percent: 80 });
  const maskValues = extractAlphaMaskValues(outputTensor, inputDims.width, inputDims.height);
  const rescaledMask = rescaleMaskToDimensions(
    maskValues,
    inputDims.width,
    inputDims.height,
    width,
    height
  );

  // 4. Extract Original Pixels
  const origCanvas = document.createElement("canvas");
  origCanvas.width = width;
  origCanvas.height = height;
  const origCtx = origCanvas.getContext("2d");
  if (!origCtx) throw new Error("Could not create original canvas.");
  origCtx.drawImage(imageSource, 0, 0);
  const origImageData = origCtx.getImageData(0, 0, width, height);

  // 5. Alpha Matting Composite
  onProgress?.({ stage: "Applying alpha cutout...", percent: 95 });
  const cutoutImageData = applyAlphaMaskToImage(origImageData, rescaledMask);

  const cutoutCanvas = document.createElement("canvas");
  cutoutCanvas.width = width;
  cutoutCanvas.height = height;
  const cutoutCtx = cutoutCanvas.getContext("2d");
  if (!cutoutCtx) throw new Error("Could not create cutout canvas.");
  cutoutCtx.putImageData(cutoutImageData, 0, 0);

  // Mask visualization canvas
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext("2d");
  if (maskCtx) maskCtx.putImageData(rescaledMask, 0, 0);

  // Generate ephemeral Blob & URL
  const cutoutBlob = await new Promise<Blob>((resolve, reject) => {
    cutoutCanvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error("Failed generating cutout blob."));
    }, "image/png");
  });

  const cutoutUrl = URL.createObjectURL(cutoutBlob);

  onProgress?.({ stage: "Completed", percent: 100 });

  return {
    cutoutBlob,
    cutoutUrl,
    cutoutCanvas,
    maskCanvas,
    width,
    height,
  };
}
