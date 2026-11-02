/**
 * Web Worker: Client-Side AI Background Remover
 * 
 * Offloads model initialization, tensor preprocessing, ONNX neural inference,
 * and alpha mask composite off the main UI thread.
 */

import * as ort from "onnxruntime-web";
import { ModelId } from "../types/background-remover";

// Set single-thread wasm in worker context
if (typeof self !== "undefined") {
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.1/dist/";
}

// Execution context verification
const workerContext = self as unknown as {
  onmessage: ((event: MessageEvent) => void) | null;
  postMessage: (message: any, transfer?: Transferable[]) => void;
};

let activeSession: ort.InferenceSession | null = null;
let currentModelId: ModelId = "rmbg-1.4";
let currentInputDims = { width: 1024, height: 1024 };

workerContext.onmessage = async (event: MessageEvent) => {
  const data = event.data;

  // 1. Initialize session with model buffer
  if (data.type === "init") {
    try {
      const { modelBuffer, modelId, inputDims } = data;
      currentModelId = modelId;
      currentInputDims = inputDims;

      if (activeSession) {
        try {
          activeSession.release();
        } catch {}
      }

      activeSession = await ort.InferenceSession.create(modelBuffer, {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
      });

      workerContext.postMessage({ type: "init_success" });
    } catch (err) {
      workerContext.postMessage({
        type: "init_error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
    return;
  }

  // 2. Run segmentation inference on ImageBitmap
  if (data.type === "infer") {
    const { jobId, bitmap } = data;

    if (!activeSession) {
      workerContext.postMessage({
        type: "error",
        jobId,
        error: "AI Session is not initialized in worker.",
      });
      return;
    }

    try {
      const width = bitmap.width;
      const height = bitmap.height;
      const targetW = currentInputDims.width;
      const targetH = currentInputDims.height;

      workerContext.postMessage({ type: "progress", jobId, stage: "Preprocessing image...", percent: 20 });

      // Preprocessing on OffscreenCanvas
      const offscreen = new OffscreenCanvas(targetW, targetH);
      const ctx = offscreen.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("OffscreenCanvas 2D context unavailable.");

      ctx.drawImage(bitmap, 0, 0, targetW, targetH);
      const scaledImgData = ctx.getImageData(0, 0, targetW, targetH);
      const numPixels = targetW * targetH;
      const float32Data = new Float32Array(3 * numPixels);

      if (currentModelId === "u2netp") {
        const mean = [0.485, 0.456, 0.406];
        const std = [0.229, 0.224, 0.225];
        for (let i = 0; i < numPixels; i++) {
          const r = scaledImgData.data[i * 4] / 255.0;
          const g = scaledImgData.data[i * 4 + 1] / 255.0;
          const b = scaledImgData.data[i * 4 + 2] / 255.0;
          float32Data[i] = (r - mean[0]) / std[0];
          float32Data[numPixels + i] = (g - mean[1]) / std[1];
          float32Data[2 * numPixels + i] = (b - mean[2]) / std[2];
        }
      } else {
        for (let i = 0; i < numPixels; i++) {
          float32Data[i] = scaledImgData.data[i * 4] / 255.0 - 0.5;
          float32Data[numPixels + i] = scaledImgData.data[i * 4 + 1] / 255.0 - 0.5;
          float32Data[2 * numPixels + i] = scaledImgData.data[i * 4 + 2] / 255.0 - 0.5;
        }
      }

      const inputTensor = new ort.Tensor("float32", float32Data, [1, 3, targetH, targetW]);

      workerContext.postMessage({ type: "progress", jobId, stage: "Executing ONNX inference...", percent: 55 });

      const feeds: Record<string, ort.Tensor> = {};
      feeds[activeSession.inputNames[0]] = inputTensor;
      const results = await activeSession.run(feeds);
      const outputTensor = results[activeSession.outputNames[0]];
      const outData = outputTensor.data as Float32Array;

      workerContext.postMessage({ type: "progress", jobId, stage: "Refining alpha mask...", percent: 80 });

      // Normalization of output mask
      let min = Infinity;
      let max = -Infinity;
      for (let i = 0; i < numPixels; i++) {
        if (outData[i] < min) min = outData[i];
        if (outData[i] > max) max = outData[i];
      }
      const range = max - min;
      const maskBytes = new Uint8ClampedArray(numPixels);
      for (let i = 0; i < numPixels; i++) {
        let val = outData[i];
        if (range > 0 && (min < 0 || max > 1.05)) {
          val = (val - min) / range;
        } else {
          val = Math.max(0, Math.min(1, val));
        }
        maskBytes[i] = Math.round(val * 255);
      }

      // Draw mask to OffscreenCanvas at target model size
      const maskCanvas = new OffscreenCanvas(targetW, targetH);
      const maskCtx = maskCanvas.getContext("2d");
      if (!maskCtx) throw new Error("Mask canvas context unavailable.");
      const maskImgData = maskCtx.createImageData(targetW, targetH);
      for (let i = 0; i < numPixels; i++) {
        maskImgData.data[i * 4] = 0;
        maskImgData.data[i * 4 + 1] = 0;
        maskImgData.data[i * 4 + 2] = 0;
        maskImgData.data[i * 4 + 3] = maskBytes[i];
      }
      maskCtx.putImageData(maskImgData, 0, 0);

      // Rescale mask to original image dimensions
      const rescaledMaskCanvas = new OffscreenCanvas(width, height);
      const rescaledMaskCtx = rescaledMaskCanvas.getContext("2d");
      if (!rescaledMaskCtx) throw new Error("Rescaled mask context unavailable.");
      rescaledMaskCtx.imageSmoothingEnabled = true;
      rescaledMaskCtx.imageSmoothingQuality = "high";
      rescaledMaskCtx.drawImage(maskCanvas, 0, 0, width, height);
      const rescaledMaskData = rescaledMaskCtx.getImageData(0, 0, width, height);

      // Extract original image pixels
      const origCanvas = new OffscreenCanvas(width, height);
      const origCtx = origCanvas.getContext("2d");
      if (!origCtx) throw new Error("Original canvas context unavailable.");
      origCtx.drawImage(bitmap, 0, 0);
      const origImgData = origCtx.getImageData(0, 0, width, height);

      // Alpha composite
      workerContext.postMessage({ type: "progress", jobId, stage: "Compositing transparent cutout...", percent: 95 });
      const cutoutImgData = new ImageData(width, height);
      const totalOriginalPixels = width * height;
      for (let i = 0; i < totalOriginalPixels; i++) {
        const idx = i * 4;
        const origAlpha = origImgData.data[idx + 3] / 255.0;
        const maskAlpha = rescaledMaskData.data[idx + 3] / 255.0;
        cutoutImgData.data[idx] = origImgData.data[idx];
        cutoutImgData.data[idx + 1] = origImgData.data[idx + 1];
        cutoutImgData.data[idx + 2] = origImgData.data[idx + 2];
        cutoutImgData.data[idx + 3] = Math.round(origAlpha * maskAlpha * 255.0);
      }

      const finalCanvas = new OffscreenCanvas(width, height);
      const finalCtx = finalCanvas.getContext("2d");
      if (!finalCtx) throw new Error("Final canvas context unavailable.");
      finalCtx.putImageData(cutoutImgData, 0, 0);

      const cutoutBitmap = finalCanvas.transferToImageBitmap();
      bitmap.close();

      workerContext.postMessage(
        {
          type: "success",
          jobId,
          cutoutBitmap,
          width,
          height,
        },
        [cutoutBitmap]
      );
    } catch (err) {
      bitmap.close();
      workerContext.postMessage({
        type: "error",
        jobId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
};
