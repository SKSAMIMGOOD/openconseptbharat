/**
 * Background Remover Worker Client
 * 
 * Manages communication with background-remover.worker.ts.
 * Seamlessly falls back to main-thread execution if Web Workers or OffscreenCanvas are unsupported.
 */

import { ModelDefinition, SegmentationResult } from "@/types/background-remover";
import { executeSegmentation } from "./background-remover-engine";
import * as ort from "onnxruntime-web";

interface PendingWorkerJob {
  resolve: (result: { cutoutBitmap: ImageBitmap; width: number; height: number }) => void;
  reject: (err: Error) => void;
  onProgress?: (progress: { stage: string; percent: number }) => void;
}

export class BackgroundRemoverWorkerClient {
  private worker: Worker | null = null;
  private pendingJobs = new Map<string, PendingWorkerJob>();
  private isSupported: boolean = false;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.checkWorkerSupport();
  }

  private checkWorkerSupport(): boolean {
    if (typeof window === "undefined") {
      this.isSupported = false;
      return false;
    }
    const hasWorker = typeof Worker !== "undefined";
    const hasOffscreen = typeof OffscreenCanvas !== "undefined";
    this.isSupported = hasWorker && hasOffscreen;
    return this.isSupported;
  }

  public getIsSupported(): boolean {
    return this.isSupported;
  }

  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(
        new URL("../../workers/background-remover.worker.ts", import.meta.url),
        { type: "module" }
      );

      this.worker.onmessage = (event: MessageEvent) => {
        const data = event.data;

        if (data.type === "progress") {
          const job = this.pendingJobs.get(data.jobId);
          job?.onProgress?.({ stage: data.stage, percent: data.percent });
        } else if (data.type === "success") {
          const job = this.pendingJobs.get(data.jobId);
          if (job) {
            this.pendingJobs.delete(data.jobId);
            job.resolve({
              cutoutBitmap: data.cutoutBitmap,
              width: data.width,
              height: data.height,
            });
          }
        } else if (data.type === "error") {
          const job = this.pendingJobs.get(data.jobId);
          if (job) {
            this.pendingJobs.delete(data.jobId);
            job.reject(new Error(data.error));
          }
        }
      };

      this.worker.onerror = (err) => {
        console.error("Worker error:", err);
        for (const [jobId, job] of Array.from(this.pendingJobs.entries())) {
          job.reject(new Error("Web Worker encountered an unexpected error."));
          this.pendingJobs.delete(jobId);
        }
      };
    }
    return this.worker;
  }

  public async initModel(modelBuffer: ArrayBuffer, modelDef: ModelDefinition): Promise<void> {
    if (!this.isSupported) return;

    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise<void>((resolve, reject) => {
      const worker = this.getWorker();

      const handleInit = (event: MessageEvent) => {
        if (event.data.type === "init_success") {
          worker.removeEventListener("message", handleInit);
          this.isInitialized = true;
          resolve();
        } else if (event.data.type === "init_error") {
          worker.removeEventListener("message", handleInit);
          this.isInitialized = false;
          reject(new Error(event.data.error));
        }
      };

      worker.addEventListener("message", handleInit);

      // Clone buffer to preserve caller's copy
      const cloned = modelBuffer.slice(0);
      worker.postMessage(
        {
          type: "init",
          modelBuffer: cloned,
          modelId: modelDef.id,
          inputDims: modelDef.inputDimensions,
        },
        [cloned]
      );
    });

    return this.initPromise;
  }

  public async removeBackground(
    imageSource: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
    modelDef: ModelDefinition,
    mainThreadSession: ort.InferenceSession | null,
    onProgress?: (progress: { stage: string; percent: number }) => void
  ): Promise<SegmentationResult> {
    // If worker is supported and initialized, execute in worker
    if (this.isSupported && this.isInitialized) {
      try {
        const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        let bitmap: ImageBitmap;
        if (imageSource instanceof ImageBitmap) {
          bitmap = imageSource;
        } else {
          bitmap = await createImageBitmap(imageSource);
        }

        const workerResult = await new Promise<{ cutoutBitmap: ImageBitmap; width: number; height: number }>(
          (resolve, reject) => {
            this.pendingJobs.set(jobId, { resolve, reject, onProgress });
            const worker = this.getWorker();
            worker.postMessage({ type: "infer", jobId, bitmap }, [bitmap]);
          }
        );

        // Convert worker ImageBitmap to HTMLCanvasElement and Blob
        const cutoutCanvas = document.createElement("canvas");
        cutoutCanvas.width = workerResult.width;
        cutoutCanvas.height = workerResult.height;
        const ctx = cutoutCanvas.getContext("2d");
        if (ctx) ctx.drawImage(workerResult.cutoutBitmap, 0, 0);

        const maskCanvas = document.createElement("canvas");
        maskCanvas.width = workerResult.width;
        maskCanvas.height = workerResult.height;

        const cutoutBlob = await new Promise<Blob>((res, rej) => {
          cutoutCanvas.toBlob((b) => (b ? res(b) : rej(new Error("Blob error"))), "image/png");
        });

        workerResult.cutoutBitmap.close();

        return {
          cutoutBlob,
          cutoutUrl: URL.createObjectURL(cutoutBlob),
          cutoutCanvas,
          maskCanvas,
          width: workerResult.width,
          height: workerResult.height,
        };
      } catch (err) {
        console.warn("Worker segmentation failed, falling back to main thread:", err);
      }
    }

    // Fallback: Main thread execution
    if (!mainThreadSession) {
      throw new Error("Cannot run background removal: AI session not available.");
    }

    return await executeSegmentation(
      mainThreadSession,
      imageSource,
      modelDef.id,
      modelDef.inputDimensions,
      onProgress
    );
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      this.initPromise = null;
      this.pendingJobs.clear();
    }
  }
}

export const bgRemoverWorkerClient = new BackgroundRemoverWorkerClient();
