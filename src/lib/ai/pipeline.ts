/**
 * Browser AI Pipeline Architecture
 * Interfaces for on-device machine learning (Transformers.js / ONNX Runtime Web).
 * Strictly runs models locally via WASM / WebGPU without external API calls.
 */

export interface AiModelConfig {
  modelId: string;
  executionProvider: "wasm" | "webgl" | "webgpu";
  quantized: boolean;
}

export interface BackgroundRemovalOptions {
  threshold?: number;
  refineEdges?: boolean;
}

export interface IBrowserAiPipeline {
  isModelLoaded(): boolean;
  loadModel(onProgress?: (progress: number) => void): Promise<void>;
  removeBackground(imageSource: HTMLImageElement | HTMLCanvasElement, options?: BackgroundRemovalOptions): Promise<Blob>;
  dispose(): void;
}

/**
 * Placeholder stub demonstrating the clean contract separation.
 * Actual WASM/ONNX runtime weights and inference will be integrated in Phase 03.
 */
export class ClientAiSegmentationPipeline implements IBrowserAiPipeline {
  private loaded: boolean = false;

  isModelLoaded(): boolean {
    return this.loaded;
  }

  async loadModel(onProgress?: (progress: number) => void): Promise<void> {
    if (onProgress) onProgress(100);
    this.loaded = true;
  }

  async removeBackground(
    imageSource: HTMLImageElement | HTMLCanvasElement,
    _options?: BackgroundRemovalOptions
  ): Promise<Blob> {
    throw new Error("Background Remover AI model execution is scheduled for Phase 03 implementation.");
  }

  dispose(): void {
    this.loaded = false;
  }
}
