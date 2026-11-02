/**
 * Browser AI Pipeline Architecture
 * Interfaces and concrete client implementation for on-device machine learning (ONNX Runtime Web).
 * Strictly runs models locally via WASM / WebGL / WebGPU without external API calls.
 */

import * as ort from "onnxruntime-web";
import { ModelDefinition, SegmentationResult } from "@/types/background-remover";
import { DEFAULT_MODEL } from "@/constants/background-remover";
import { fetchModelWeights } from "./model-loader";
import { createSession, executeSegmentation } from "./background-remover-engine";

export interface IBrowserAiPipeline {
  isModelLoaded(): boolean;
  loadModel(
    modelDef?: ModelDefinition,
    onProgress?: (progress: { loaded: number; total: number; percent: number }) => void
  ): Promise<void>;
  removeBackground(
    imageSource: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
    onProgress?: (progress: { stage: string; percent: number }) => void
  ): Promise<SegmentationResult>;
  dispose(): void;
}

export class ClientAiSegmentationPipeline implements IBrowserAiPipeline {
  private session: ort.InferenceSession | null = null;
  private currentModelDef: ModelDefinition = DEFAULT_MODEL;
  private isLoaded: boolean = false;

  isModelLoaded(): boolean {
    return this.isLoaded && this.session !== null;
  }

  getCurrentModel(): ModelDefinition {
    return this.currentModelDef;
  }

  async loadModel(
    modelDef: ModelDefinition = DEFAULT_MODEL,
    onProgress?: (progress: { loaded: number; total: number; percent: number }) => void
  ): Promise<void> {
    if (this.session && this.currentModelDef.id === modelDef.id) {
      onProgress?.({ loaded: 100, total: 100, percent: 100 });
      return;
    }

    this.dispose();
    this.currentModelDef = modelDef;

    // 1. Download/Fetch model buffer with progress
    const modelBuffer = await fetchModelWeights(modelDef.url, (p) => {
      onProgress?.({
        loaded: p.loadedBytes,
        total: p.totalBytes,
        percent: p.percent,
      });
    });

    // 2. Initialize ONNX runtime session
    const { session } = await createSession(modelBuffer);
    this.session = session;
    this.isLoaded = true;
  }

  async removeBackground(
    imageSource: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
    onProgress?: (progress: { stage: string; percent: number }) => void
  ): Promise<SegmentationResult> {
    if (!this.session) {
      throw new Error("AI Segmentation model is not loaded. Please initialize the model first.");
    }

    return await executeSegmentation(
      this.session,
      imageSource,
      this.currentModelDef.id,
      this.currentModelDef.inputDimensions,
      onProgress
    );
  }

  dispose(): void {
    if (this.session) {
      try {
        this.session.release();
      } catch (err) {
        console.warn("Error releasing ONNX session:", err);
      }
      this.session = null;
    }
    this.isLoaded = false;
  }
}
