"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  CropRegion,
  DecodedImageSource,
  ExportResult,
  FlipOptions,
  ImageDimensions,
  ImageExportOptions,
  ImageTransformPipeline,
  ResizeOptions,
  RotateOptions,
  ValidatedImageFile,
  WorkerProgressMessage,
} from "@/types/image-engine";
import { decodeImage } from "@/lib/image/decoder";
import { transformImage, AnyCanvas } from "@/lib/image/transform";
import { exportImage, downloadImageBlob } from "@/lib/image/exporter";
import { imageWorkerClient } from "@/lib/image/worker-client";
import { releaseCanvasBuffer, revokeObjectUrlSafely } from "@/lib/utils/memory";

export interface UseImageEngineReturn {
  currentFile: ValidatedImageFile | null;
  dimensions: ImageDimensions | null;
  pipeline: ImageTransformPipeline;
  previewCanvas: AnyCanvas | null;
  isProcessing: boolean;
  progress: WorkerProgressMessage | null;
  error: string | null;

  loadImage: (validated: ValidatedImageFile) => Promise<void>;
  updateCrop: (crop: CropRegion | undefined) => void;
  updateResize: (resize: ResizeOptions | undefined) => void;
  updateRotate: (rotate: RotateOptions | undefined) => void;
  updateFlip: (flip: FlipOptions | undefined) => void;
  updateBackgroundColor: (color: string | undefined) => void;
  resetPipeline: () => void;

  applyTransforms: (useWorker?: boolean) => Promise<AnyCanvas | null>;
  exportResult: (options: ImageExportOptions) => Promise<ExportResult | null>;
  downloadResult: (options: ImageExportOptions) => Promise<void>;
  clear: () => void;
}

export function useImageEngine(): UseImageEngineReturn {
  const [currentFile, setCurrentFile] = useState<ValidatedImageFile | null>(null);
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [pipeline, setPipeline] = useState<ImageTransformPipeline>({});
  const [previewCanvas, setPreviewCanvas] = useState<AnyCanvas | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<WorkerProgressMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Active decoded master source ref for export & transforms
  const decodedSourceRef = useRef<DecodedImageSource | null>(null);
  const activeJobIdRef = useRef<string | null>(null);

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      if (activeJobIdRef.current) {
        imageWorkerClient.cancelJob(activeJobIdRef.current);
      }
      if (decodedSourceRef.current) {
        decodedSourceRef.current.close();
        decodedSourceRef.current = null;
      }
    };
  }, []);

  const clear = useCallback(() => {
    if (activeJobIdRef.current) {
      imageWorkerClient.cancelJob(activeJobIdRef.current);
      activeJobIdRef.current = null;
    }

    if (decodedSourceRef.current) {
      decodedSourceRef.current.close();
      decodedSourceRef.current = null;
    }

    if (currentFile?.previewUrl) {
      revokeObjectUrlSafely(currentFile.previewUrl);
    }

    if (previewCanvas && previewCanvas instanceof HTMLCanvasElement) {
      releaseCanvasBuffer(previewCanvas);
    }

    setCurrentFile(null);
    setDimensions(null);
    setPipeline({});
    setPreviewCanvas(null);
    setError(null);
    setProgress(null);
  }, [currentFile, previewCanvas]);

  const loadImage = useCallback(
    async (validated: ValidatedImageFile) => {
      // Clear previous file resources
      clear();

      setIsProcessing(true);
      setError(null);

      try {
        const decoded = await decodeImage(validated.file, {
          targetFormat: validated.type,
        });

        decodedSourceRef.current = decoded;
        setCurrentFile(validated);
        setDimensions({
          width: decoded.width,
          height: decoded.height,
          aspectRatio: decoded.aspectRatio,
        });

        // Generate initial preview canvas
        const initialCanvas = transformImage(decoded.source, {});
        setPreviewCanvas(initialCanvas);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to decode image.");
      } finally {
        setIsProcessing(false);
      }
    },
    [clear]
  );

  const updateCrop = useCallback((crop: CropRegion | undefined) => {
    setPipeline((prev) => ({ ...prev, crop }));
  }, []);

  const updateResize = useCallback((resize: ResizeOptions | undefined) => {
    setPipeline((prev) => ({ ...prev, resize }));
  }, []);

  const updateRotate = useCallback((rotate: RotateOptions | undefined) => {
    setPipeline((prev) => ({ ...prev, rotate }));
  }, []);

  const updateFlip = useCallback((flip: FlipOptions | undefined) => {
    setPipeline((prev) => ({ ...prev, flip }));
  }, []);

  const updateBackgroundColor = useCallback((backgroundColor: string | undefined) => {
    setPipeline((prev) => ({ ...prev, backgroundColor }));
  }, []);

  const resetPipeline = useCallback(() => {
    setPipeline({});
    if (decodedSourceRef.current) {
      const resetCanvas = transformImage(decodedSourceRef.current.source, {});
      setPreviewCanvas(resetCanvas);
    }
  }, []);

  const applyTransforms = useCallback(
    async (useWorker: boolean = false): Promise<AnyCanvas | null> => {
      if (!decodedSourceRef.current) {
        setError("No image loaded to transform.");
        return null;
      }

      setIsProcessing(true);
      setError(null);
      setProgress(null);

      try {
        if (useWorker) {
          // Offload to worker
          const res = await imageWorkerClient.executeJob(
            decodedSourceRef.current.source,
            pipeline,
            undefined,
            (p) => setProgress(p)
          );

          if (res.bitmap) {
            // Render worker bitmap to canvas for UI preview
            const canvas = transformImage(res.bitmap, {});
            res.bitmap.close();
            setPreviewCanvas(canvas);
            return canvas;
          }
        }

        // Main thread execution
        const canvas = transformImage(decodedSourceRef.current.source, pipeline);
        setPreviewCanvas(canvas);
        return canvas;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Transform failed.");
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [pipeline]
  );

  const exportResult = useCallback(
    async (options: ImageExportOptions): Promise<ExportResult | null> => {
      if (!decodedSourceRef.current) {
        setError("No image loaded for export.");
        return null;
      }

      setIsProcessing(true);
      setError(null);

      try {
        // High quality rendering from full master source
        const finalCanvas = transformImage(decodedSourceRef.current.source, pipeline);
        const result = await exportImage(
          finalCanvas,
          options,
          currentFile?.name
        );
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Export failed.");
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [pipeline, currentFile]
  );

  const downloadResult = useCallback(
    async (options: ImageExportOptions): Promise<void> => {
      const res = await exportResult(options);
      if (res) {
        downloadImageBlob(res.blob, res.fileName);
      }
    },
    [exportResult]
  );

  return {
    currentFile,
    dimensions,
    pipeline,
    previewCanvas,
    isProcessing,
    progress,
    error,
    loadImage,
    updateCrop,
    updateResize,
    updateRotate,
    updateFlip,
    updateBackgroundColor,
    resetPipeline,
    applyTransforms,
    exportResult,
    downloadResult,
    clear,
  };
}
