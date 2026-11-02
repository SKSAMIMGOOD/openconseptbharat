"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  BackgroundColorOption,
  BeforeAfterViewMode,
  ExportFormat,
  InferenceProgress,
  ModelDefinition,
  ModelLoadingProgress,
  SegmentationResult,
} from "@/types/background-remover";
import {
  BACKGROUND_COLOR_PRESETS,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_MODEL,
  PREVIEW_ZOOM_MAX,
  PREVIEW_ZOOM_MIN,
  PREVIEW_ZOOM_STEP,
} from "@/constants/background-remover";
import {
  isModelCached,
  fetchModelWeights,
  loadLocalModelFile,
} from "@/lib/ai/model-loader";
import {
  createSession,
  compositeOnBackground,
} from "@/lib/ai/background-remover-engine";
import { bgRemoverWorkerClient } from "@/lib/ai/worker-client";
import { validateImageFile } from "@/lib/image/validator";
import { decodeImage } from "@/lib/image/decoder";
import { createTrackedObjectURL, revokeObjectUrlSafely, releaseCanvasBuffer } from "@/lib/utils/memory";
import { stageImageForTransfer } from "@/lib/utils/image-transfer";
import * as ort from "onnxruntime-web";

export interface UseBackgroundRemoverReturn {
  // File state
  originalFile: File | null;
  originalPreviewUrl: string | null;
  dimensions: { width: number; height: number; aspectRatio: number } | null;
  
  // Model state
  selectedModel: ModelDefinition;
  isModelCachedState: boolean;
  modelLoadingProgress: ModelLoadingProgress;
  isModelLoaded: boolean;
  
  // Inference state
  isInferring: boolean;
  inferenceProgress: InferenceProgress;
  hasResult: boolean;
  segmentationResult: SegmentationResult | null;
  
  // Background & Preview state
  selectedBackground: BackgroundColorOption;
  customColorHex: string;
  compositeCanvas: HTMLCanvasElement | null;
  viewMode: BeforeAfterViewMode;
  sliderPosition: number;
  zoom: number;
  pan: { x: number; y: number };
  error: string | null;

  // Actions
  handleFileSelect: (file: File) => Promise<boolean>;
  removeImage: () => void;
  selectModel: (model: ModelDefinition) => void;
  handleCustomModelUpload: (file: File) => Promise<void>;
  processBackgroundRemoval: () => Promise<void>;
  selectBackground: (bg: BackgroundColorOption) => void;
  updateCustomHex: (hex: string) => void;
  setViewMode: (mode: BeforeAfterViewMode) => void;
  setSliderPosition: (pos: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToScreen: () => void;
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  exportFile: (format: ExportFormat, quality?: number) => Promise<void>;
  transferToPhotoStudio: () => Promise<boolean>;
  clearError: () => void;
}

export function useBackgroundRemover(): UseBackgroundRemoverReturn {
  // 1. File state
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number; aspectRatio: number } | null>(null);
  const originalImageElementRef = useRef<HTMLImageElement | null>(null);

  // 2. Model state
  const [selectedModel, setSelectedModel] = useState<ModelDefinition>(DEFAULT_MODEL);
  const [isModelCachedState, setIsModelCachedState] = useState<boolean>(false);
  const [modelLoadingProgress, setModelLoadingProgress] = useState<ModelLoadingProgress>({
    phase: "idle",
    loadedBytes: 0,
    totalBytes: 0,
    percent: 0,
    fromCache: false,
    message: "Ready to load model",
  });
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  const mainSessionRef = useRef<ort.InferenceSession | null>(null);
  const modelBufferRef = useRef<ArrayBuffer | null>(null);

  // 3. Inference state
  const [isInferring, setIsInferring] = useState<boolean>(false);
  const [inferenceProgress, setInferenceProgress] = useState<InferenceProgress>({
    stage: "idle",
    percent: 0,
    message: "",
  });
  const [segmentationResult, setSegmentationResult] = useState<SegmentationResult | null>(null);

  // 4. Background & Preview state
  const [selectedBackground, setSelectedBackground] = useState<BackgroundColorOption>(DEFAULT_BACKGROUND_COLOR);
  const [customColorHex, setCustomColorHex] = useState<string>("#6366F1");
  const [compositeCanvas, setCompositeCanvas] = useState<HTMLCanvasElement | null>(null);
  const [viewMode, setViewMode] = useState<BeforeAfterViewMode>("split_slider");
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);

  // Persistent refs to track latest resources without triggering unmount cleanups on render
  const originalPreviewUrlRef = useRef<string | null>(null);
  const segmentationResultRef = useRef<SegmentationResult | null>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    originalPreviewUrlRef.current = originalPreviewUrl;
  }, [originalPreviewUrl]);

  useEffect(() => {
    segmentationResultRef.current = segmentationResult;
  }, [segmentationResult]);

  useEffect(() => {
    compositeCanvasRef.current = compositeCanvas;
  }, [compositeCanvas]);

  // Check cache status whenever selected model changes
  useEffect(() => {
    let active = true;
    isModelCached(selectedModel.url).then((cached) => {
      if (active) setIsModelCachedState(cached);
    });
    return () => {
      active = false;
    };
  }, [selectedModel]);

  // Clean up resources strictly on unmount
  useEffect(() => {
    return () => {
      if (originalPreviewUrlRef.current) {
        revokeObjectUrlSafely(originalPreviewUrlRef.current);
      }
      if (segmentationResultRef.current?.cutoutUrl) {
        revokeObjectUrlSafely(segmentationResultRef.current.cutoutUrl);
      }
      if (compositeCanvasRef.current) {
        releaseCanvasBuffer(compositeCanvasRef.current);
      }
      if (mainSessionRef.current) {
        try {
          mainSessionRef.current.release();
        } catch {}
      }
      bgRemoverWorkerClient.terminate();
    };
  }, []);

  // Re-composite canvas whenever background color, custom color, or segmentation result changes
  useEffect(() => {
    if (!segmentationResult) {
      setCompositeCanvas(null);
      return;
    }

    const activeColor =
      selectedBackground.id === "custom"
        ? customColorHex
        : selectedBackground.value;

    const comp = compositeOnBackground(
      segmentationResult.cutoutCanvas,
      segmentationResult.width,
      segmentationResult.height,
      activeColor
    );
    setCompositeCanvas(comp);
  }, [segmentationResult, selectedBackground, customColorHex]);

  // Handle image upload with validation & decoding
  const handleFileSelect = useCallback(async (file: File): Promise<boolean> => {
    setError(null);

    // 1. Validate file
    const validation = await validateImageFile(file, {
      maxSizeMB: 25,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
    });

    if (!validation.isValid) {
      setError(validation.error || "The selected file is not a supported image format.");
      return false;
    }

    // 2. Decode file
    try {
      const decoded = await decodeImage(file);
      const url = createTrackedObjectURL(file);

      // Clean up previous image resources
      if (originalPreviewUrlRef.current) {
        revokeObjectUrlSafely(originalPreviewUrlRef.current);
      }
      if (segmentationResultRef.current?.cutoutUrl) {
        revokeObjectUrlSafely(segmentationResultRef.current.cutoutUrl);
      }
      if (compositeCanvasRef.current) {
        releaseCanvasBuffer(compositeCanvasRef.current);
      }

      setOriginalFile(file);
      setOriginalPreviewUrl(url);
      setDimensions({
        width: decoded.width,
        height: decoded.height,
        aspectRatio: decoded.aspectRatio,
      });

      // Cache HTMLImageElement for canvas operations with rejection handler
      const img = new Image();
      img.src = url;
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("Browser failed to decode image into preview buffer."));
      });
      originalImageElementRef.current = img;

      decoded.close();
      setSegmentationResult(null);
      setCompositeCanvas(null);
      setZoom(1.0);
      setPan({ x: 0, y: 0 });
      setSliderPosition(50);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decode image.");
      return false;
    }
  }, []);

  // Remove current image
  const removeImage = useCallback(() => {
    if (originalPreviewUrlRef.current) {
      revokeObjectUrlSafely(originalPreviewUrlRef.current);
    }
    if (segmentationResultRef.current?.cutoutUrl) {
      revokeObjectUrlSafely(segmentationResultRef.current.cutoutUrl);
    }
    if (compositeCanvasRef.current) {
      releaseCanvasBuffer(compositeCanvasRef.current);
    }

    setOriginalFile(null);
    setOriginalPreviewUrl(null);
    setDimensions(null);
    originalImageElementRef.current = null;
    setSegmentationResult(null);
    setCompositeCanvas(null);
    setError(null);
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  // Select AI Model
  const selectModel = useCallback((model: ModelDefinition) => {
    setSelectedModel(model);
    if (selectedModel.id !== model.id) {
      setIsModelLoaded(false);
      if (mainSessionRef.current) {
        try {
          mainSessionRef.current.release();
        } catch {}
        mainSessionRef.current = null;
      }
    }
  }, [selectedModel]);

  // Handle user uploading a custom local .onnx model file
  const handleCustomModelUpload = useCallback(async (file: File) => {
    setError(null);
    try {
      setModelLoadingProgress({
        phase: "downloading",
        loadedBytes: 0,
        totalBytes: file.size,
        percent: 50,
        fromCache: false,
        message: `Loading custom model "${file.name}" from local disk...`,
      });

      const buffer = await loadLocalModelFile(file);
      modelBufferRef.current = buffer;

      setModelLoadingProgress({
        phase: "compiling",
        loadedBytes: file.size,
        totalBytes: file.size,
        percent: 80,
        fromCache: false,
        message: "Compiling ONNX model weights in browser...",
      });

      const customDef: ModelDefinition = {
        id: "custom",
        name: `Custom: ${file.name}`,
        tagline: "User-Provided Local Model",
        description: "Custom local ONNX model loaded directly from disk.",
        sizeMB: Number((file.size / (1024 * 1024)).toFixed(1)),
        inputDimensions: { width: 1024, height: 1024 },
        url: "",
        source: "Local Disk",
      };

      const { session } = await createSession(buffer);
      mainSessionRef.current = session;

      // Also initialize in worker if supported
      await bgRemoverWorkerClient.initModel(buffer, customDef);

      setSelectedModel(customDef);
      setIsModelLoaded(true);
      setModelLoadingProgress({
        phase: "ready",
        loadedBytes: file.size,
        totalBytes: file.size,
        percent: 100,
        fromCache: false,
        message: "Custom model loaded and ready.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load custom ONNX model.";
      setError(msg);
      setModelLoadingProgress({
        phase: "error",
        loadedBytes: 0,
        totalBytes: 0,
        percent: 0,
        fromCache: false,
        message: msg,
      });
    }
  }, []);

  // Main Background Removal Trigger
  const processBackgroundRemoval = useCallback(async () => {
    if (!originalImageElementRef.current || !originalFile) {
      setError("Please upload an image first.");
      return;
    }

    setError(null);
    setIsInferring(true);

    try {
      // 1. Ensure Model is loaded
      if (!isModelLoaded || !mainSessionRef.current) {
        const cached = await isModelCached(selectedModel.url);
        setModelLoadingProgress({
          phase: cached ? "checking_cache" : "downloading",
          loadedBytes: 0,
          totalBytes: 0,
          percent: 0,
          fromCache: cached,
          message: cached ? "Loading model from local browser cache..." : `Downloading ${selectedModel.name} (${selectedModel.sizeMB} MB)...`,
        });

        const buffer = await fetchModelWeights(selectedModel.url, (p) => {
          setModelLoadingProgress({
            phase: "downloading",
            loadedBytes: p.loadedBytes,
            totalBytes: p.totalBytes,
            percent: p.percent,
            fromCache: cached,
            message: `Downloading model weights (${(p.loadedBytes / (1024 * 1024)).toFixed(1)} / ${(p.totalBytes / (1024 * 1024)).toFixed(1)} MB)...`,
          });
        });

        modelBufferRef.current = buffer;

        setModelLoadingProgress({
          phase: "compiling",
          loadedBytes: buffer.byteLength,
          totalBytes: buffer.byteLength,
          percent: 90,
          fromCache: cached,
          message: "Compiling neural network into WebAssembly/WebGPU...",
        });

        const { session } = await createSession(buffer);
        mainSessionRef.current = session;

        // Try initializing worker
        try {
          await bgRemoverWorkerClient.initModel(buffer, selectedModel);
        } catch (workerInitErr) {
          console.warn("Worker init failed, will use main thread:", workerInitErr);
        }

        setIsModelLoaded(true);
        setIsModelCachedState(true);
        setModelLoadingProgress({
          phase: "ready",
          loadedBytes: buffer.byteLength,
          totalBytes: buffer.byteLength,
          percent: 100,
          fromCache: cached,
          message: "Model compiled and ready.",
        });
      }

      // 2. Run Segmentation
      setInferenceProgress({
        stage: "inferring",
        percent: 10,
        message: "Segmenting subject from background...",
      });

      const result = await bgRemoverWorkerClient.removeBackground(
        originalImageElementRef.current,
        selectedModel,
        mainSessionRef.current,
        (p) => {
          setInferenceProgress({
            stage: "inferring",
            percent: p.percent,
            message: p.stage,
          });
        }
      );

      setSegmentationResult(result);
      setInferenceProgress({
        stage: "completed",
        percent: 100,
        message: "Background successfully removed!",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to remove background.";
      setError(msg);
      setInferenceProgress({
        stage: "error",
        percent: 0,
        message: msg,
      });
    } finally {
      setIsInferring(false);
    }
  }, [originalFile, isModelLoaded, selectedModel]);

  // Background selection
  const selectBackground = useCallback((bg: BackgroundColorOption) => {
    setSelectedBackground(bg);
  }, []);

  const updateCustomHex = useCallback((hex: string) => {
    setCustomColorHex(hex);
  }, []);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(PREVIEW_ZOOM_MAX, Number((z + PREVIEW_ZOOM_STEP).toFixed(2))));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(PREVIEW_ZOOM_MIN, Number((z - PREVIEW_ZOOM_STEP).toFixed(2))));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  const fitToScreen = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  // Export File (Transparent PNG, PNG with background, JPEG with background)
  const exportFile = useCallback(async (format: ExportFormat, quality: number = 0.95) => {
    if (!segmentationResult || !originalFile) {
      setError("No processed photo available for export.");
      return;
    }

    const baseName = originalFile.name.replace(/\.[^/.]+$/, "");
    let targetCanvas: HTMLCanvasElement;
    let mimeType: string;
    let extension: string;
    let exportNameSuffix: string;

    if (format === "png_transparent") {
      targetCanvas = segmentationResult.cutoutCanvas;
      mimeType = "image/png";
      extension = "png";
      exportNameSuffix = "transparent";
    } else if (format === "png_background") {
      const bg = selectedBackground.id === "custom" ? customColorHex : selectedBackground.value;
      targetCanvas = compositeOnBackground(
        segmentationResult.cutoutCanvas,
        segmentationResult.width,
        segmentationResult.height,
        bg
      );
      mimeType = "image/png";
      extension = "png";
      exportNameSuffix = selectedBackground.id === "transparent" ? "cutout" : selectedBackground.id;
    } else {
      // JPEG requires solid background (default to white if transparent is selected)
      let bg = selectedBackground.id === "custom" ? customColorHex : selectedBackground.value;
      if (bg === "transparent") bg = "#FFFFFF";

      targetCanvas = compositeOnBackground(
        segmentationResult.cutoutCanvas,
        segmentationResult.width,
        segmentationResult.height,
        bg
      );
      mimeType = "image/jpeg";
      extension = "jpg";
      exportNameSuffix = selectedBackground.id === "transparent" ? "white-bg" : selectedBackground.id;
    }

    const blob = await new Promise<Blob | null>((res) => {
      targetCanvas.toBlob((b) => res(b), mimeType, quality);
    });

    if (!blob) {
      setError("Failed to create export blob.");
      return;
    }

    const timestamp = Date.now();
    const downloadFileName = `bg-removed-${baseName}-${exportNameSuffix}-${timestamp}.${extension}`;

    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = downloadFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
  }, [segmentationResult, originalFile, selectedBackground, customColorHex]);

  // Transfer to Professional Photo Studio in RAM
  const transferToPhotoStudio = useCallback(async (): Promise<boolean> => {
    if (!segmentationResult || !originalFile) {
      setError("No processed cutout to send to Photo Studio.");
      return false;
    }

    try {
      // Composite image with selected background (or transparent)
      const bg = selectedBackground.id === "custom" ? customColorHex : selectedBackground.value;
      const targetCanvas = compositeOnBackground(
        segmentationResult.cutoutCanvas,
        segmentationResult.width,
        segmentationResult.height,
        bg
      );

      const blob = await new Promise<Blob | null>((res) => {
        targetCanvas.toBlob((b) => res(b), "image/png");
      });

      if (!blob) {
        throw new Error("Failed generating memory blob for handoff.");
      }

      const baseName = originalFile.name.replace(/\.[^/.]+$/, "");
      const handoffFile = new File([blob], `bg-removed-${baseName}.png`, {
        type: "image/png",
        lastModified: Date.now(),
      });

      // Stage in ephemeral memory
      stageImageForTransfer(handoffFile, "background-remover");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to transfer image to Photo Studio.");
      return false;
    }
  }, [segmentationResult, originalFile, selectedBackground, customColorHex]);

  const clearError = useCallback(() => setError(null), []);

  return {
    originalFile,
    originalPreviewUrl,
    dimensions,
    selectedModel,
    isModelCachedState,
    modelLoadingProgress,
    isModelLoaded,
    isInferring,
    inferenceProgress,
    hasResult: segmentationResult !== null,
    segmentationResult,
    selectedBackground,
    customColorHex,
    compositeCanvas,
    viewMode,
    sliderPosition,
    zoom,
    pan,
    error,
    handleFileSelect,
    removeImage,
    selectModel,
    handleCustomModelUpload,
    processBackgroundRemoval,
    selectBackground,
    updateCustomHex,
    setViewMode,
    setSliderPosition,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    setPan,
    exportFile,
    transferToPhotoStudio,
    clearError,
  };
}
