/**
 * Web Worker: In-Browser Image Processing Engine
 * Offloads compute-heavy transformations and OffscreenCanvas encoding from the main UI thread.
 */

import {
  WorkerJobRequest,
  WorkerProgressMessage,
  WorkerSuccessMessage,
  WorkerErrorMessage,
} from "../types/image-engine";
import { transformImage } from "../lib/image/transform";
import { exportCanvasToBlob } from "../lib/image/exporter";

// Execution context verification
const workerContext = self as unknown as {
  onmessage: ((event: MessageEvent) => void) | null;
  postMessage: (message: any, transfer?: Transferable[]) => void;
};

const activeJobs = new Set<string>();

workerContext.onmessage = async (event: MessageEvent<WorkerJobRequest | { type: "cancel"; jobId: string }>) => {
  const data = event.data;

  // Handle job cancellation
  if ("type" in data && data.type === "cancel") {
    activeJobs.delete(data.jobId);
    return;
  }

  const request = data as WorkerJobRequest;
  const { jobId, operation, bitmap, pipeline, exportOptions } = request;
  activeJobs.add(jobId);

  const postProgress = (stage: string, percent: number) => {
    if (!activeJobs.has(jobId)) return;
    const msg: WorkerProgressMessage = { type: "progress", jobId, stage, percent };
    workerContext.postMessage(msg);
  };

  try {
    postProgress("Initializing worker buffer", 10);

    if (!bitmap) {
      throw new Error("Worker received empty image bitmap buffer.");
    }

    if (!activeJobs.has(jobId)) {
      bitmap.close();
      return;
    }

    postProgress("Executing transformation pipeline", 40);

    // Run pure transformations on OffscreenCanvas
    const resultCanvas = transformImage(bitmap, pipeline ?? {});

    // Free incoming input bitmap as it has been transferred and rendered
    bitmap.close();

    if (!activeJobs.has(jobId)) {
      return;
    }

    // Export to Blob if export options are provided
    if (exportOptions) {
      postProgress("Encoding output format", 75);
      const blob = await exportCanvasToBlob(resultCanvas, exportOptions);

      if (!activeJobs.has(jobId)) return;

      postProgress("Completed", 100);
      const successMsg: WorkerSuccessMessage = {
        type: "success",
        jobId,
        blob,
        width: resultCanvas.width,
        height: resultCanvas.height,
      };
      workerContext.postMessage(successMsg);
    } else {
      // Transfer rendered ImageBitmap back to main UI
      postProgress("Transferring rendered canvas", 85);
      const outBitmap =
        resultCanvas instanceof OffscreenCanvas
          ? resultCanvas.transferToImageBitmap()
          : await createImageBitmap(resultCanvas);

      if (!activeJobs.has(jobId)) {
        outBitmap.close();
        return;
      }

      postProgress("Completed", 100);
      const successMsg: WorkerSuccessMessage = {
        type: "success",
        jobId,
        bitmap: outBitmap,
        width: outBitmap.width,
        height: outBitmap.height,
      };
      // Transfer outBitmap without cloning memory
      workerContext.postMessage(successMsg, [outBitmap]);
    }
  } catch (err) {
    if (bitmap) {
      try {
        bitmap.close();
      } catch {
        // already closed
      }
    }

    if (activeJobs.has(jobId)) {
      const errorMsg: WorkerErrorMessage = {
        type: "error",
        jobId,
        error: err instanceof Error ? err.message : "Image processing worker error",
      };
      workerContext.postMessage(errorMsg);
    }
  } finally {
    activeJobs.delete(jobId);
  }
};

export {};
