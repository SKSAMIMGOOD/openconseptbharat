import {
  ImageExportOptions,
  ImageTransformPipeline,
  WorkerJobRequest,
  WorkerProgressMessage,
  WorkerResponseMessage,
  WorkerSuccessMessage,
} from "../../types/image-engine";
import { transformImage } from "./transform";
import { exportCanvasToBlob } from "./exporter";

export type ProgressCallback = (progress: WorkerProgressMessage) => void;

interface PendingJob {
  resolve: (result: WorkerSuccessMessage) => void;
  reject: (err: Error) => void;
  onProgress?: ProgressCallback;
}

export class ImageWorkerClient {
  private worker: Worker | null = null;
  private pendingJobs = new Map<string, PendingJob>();
  private isSupported: boolean = false;

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

  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(
        new URL("../../workers/image-engine.worker.ts", import.meta.url),
        { type: "module" }
      );

      this.worker.onmessage = (event: MessageEvent<WorkerResponseMessage>) => {
        const data = event.data;
        const job = this.pendingJobs.get(data.jobId);
        if (!job) return;

        if (data.type === "progress") {
          job.onProgress?.(data);
        } else if (data.type === "success") {
          this.pendingJobs.delete(data.jobId);
          job.resolve(data);
        } else if (data.type === "error") {
          this.pendingJobs.delete(data.jobId);
          job.reject(new Error(data.error));
        }
      };

      this.worker.onerror = (err) => {
        console.error("Image processing worker error event:", err);
        this.pendingJobs.forEach((job) => {
          job.reject(new Error("Worker fatal error: " + err.message));
        });
        this.pendingJobs.clear();
      };
    }

    return this.worker;
  }

  /**
   * Executes an image transformation job.
   * If Web Workers or OffscreenCanvas are supported, offloads to worker.
   * Otherwise, provides a graceful fallback executing on the main thread without blocking APIs.
   */
  public async executeJob(
    source: ImageBitmap | HTMLImageElement | HTMLCanvasElement,
    pipeline: ImageTransformPipeline = {},
    exportOptions?: ImageExportOptions,
    onProgress?: ProgressCallback
  ): Promise<WorkerSuccessMessage> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Fallback path: Main thread execution when Workers / OffscreenCanvas are unavailable
    if (!this.isSupported) {
      onProgress?.({ type: "progress", jobId, stage: "Main-thread processing", percent: 30 });
      const canvas = transformImage(source, pipeline);

      if (exportOptions) {
        onProgress?.({ type: "progress", jobId, stage: "Encoding blob", percent: 75 });
        const blob = await exportCanvasToBlob(canvas, exportOptions);
        onProgress?.({ type: "progress", jobId, stage: "Completed", percent: 100 });
        return {
          type: "success",
          jobId,
          blob,
          width: canvas.width,
          height: canvas.height,
        };
      }

      onProgress?.({ type: "progress", jobId, stage: "Generating bitmap", percent: 85 });
      const bitmap =
        typeof createImageBitmap === "function"
          ? await createImageBitmap(canvas)
          : undefined;

      onProgress?.({ type: "progress", jobId, stage: "Completed", percent: 100 });
      return {
        type: "success",
        jobId,
        bitmap,
        width: canvas.width,
        height: canvas.height,
      };
    }

    // Worker path: Transfer ImageBitmap to avoid cloning
    let transferableBitmap: ImageBitmap;
    if (source instanceof ImageBitmap) {
      transferableBitmap = source;
    } else {
      transferableBitmap = await createImageBitmap(source);
    }

    return new Promise((resolve, reject) => {
      this.pendingJobs.set(jobId, { resolve, reject, onProgress });

      try {
        const worker = this.getWorker();
        const request: WorkerJobRequest = {
          jobId,
          operation: "transform",
          bitmap: transferableBitmap,
          pipeline,
          exportOptions,
        };

        worker.postMessage(request, [transferableBitmap]);
      } catch (postErr) {
        this.pendingJobs.delete(jobId);
        reject(postErr instanceof Error ? postErr : new Error("Failed to post message to worker"));
      }
    });
  }

  /**
   * Cancels an ongoing processing job.
   */
  public cancelJob(jobId: string): void {
    const job = this.pendingJobs.get(jobId);
    if (job) {
      this.pendingJobs.delete(jobId);
      job.reject(new Error(`Job ${jobId} was cancelled by user.`));

      if (this.worker) {
        this.worker.postMessage({ type: "cancel", jobId });
      }
    }
  }

  /**
   * Disposes the worker and cancels all pending jobs.
   */
  public terminate(): void {
    this.pendingJobs.forEach((job, jobId) => {
      job.reject(new Error(`Worker terminated: Job ${jobId} aborted.`));
    });
    this.pendingJobs.clear();

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// Global singleton instance for app-wide reuse
export const imageWorkerClient = new ImageWorkerClient();
