"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { TOOLS } from "@/constants/tools";
import { useImageEngine } from "@/hooks/useImageEngine";
import { PhotoStudioUpload } from "@/components/photo-studio/PhotoStudioUpload";
import { PhotoStudioControls } from "@/components/photo-studio/PhotoStudioControls";
import { PhotoStudioInfoPanel } from "@/components/photo-studio/PhotoStudioInfoPanel";
import { PhotoDimensionsPanel } from "@/components/photo-studio/PhotoDimensionsPanel";
import { InteractiveCropEditor } from "@/components/photo-studio/InteractiveCropEditor";
import { PhotoPresetSelector } from "@/components/photo-studio/PhotoPresetSelector";
import { CropPreviewCard } from "@/components/photo-studio/CropPreviewCard";
import { PhotoSheetWorkspace } from "@/components/photo-studio/sheet/PhotoSheetWorkspace";
import { ValidatedImageFile } from "@/types/image-engine";
import type { PhotoPreset, CustomDimensionsInput, CropMode } from "@/types/crop-preset";
import type { CropCoordinates } from "@/types/crop";
import { DEFAULT_PRESET } from "@/constants/crop-presets";
import { DEFAULT_BACKGROUND_COLOR } from "@/constants/background-options";
import {
  initDefaultCrop,
  recalculateCropForAspectRatio,
  centerCropInImage,
  fitCropToImage,
  renderCropCanvas,
} from "@/lib/crop/crop-geometry";
import { unitToMm } from "@/lib/crop/unit-converter";
import { consumeTransferredImage, peekStagedImage } from "@/lib/utils/image-transfer";
import { usePreferences } from "@/hooks/usePreferences";
import { cn } from "@/lib/utils/cn";
import {
  Camera,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Crop,
  Printer,
  Layers,
} from "lucide-react";

export type PhotoStudioWorkspaceState =
  | "empty"
  | "dragging"
  | "decoding"
  | "ready"
  | "invalid_file"
  | "processing_error";

export default function PhotoStudioPage() {
  const tool = TOOLS.find((t) => t.id === "photo-studio")!;
  const engine = useImageEngine();
  const { settings: userPreferences } = usePreferences();
  const hasUserModifiedSettingsRef = useRef(false);

  const [workspaceState, setWorkspaceState] =
    useState<PhotoStudioWorkspaceState>("empty");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Phase 03C State: Presets, Custom Dimensions, Crop Coordinates & Background
  const [selectedPreset, setSelectedPreset] = useState<PhotoPreset>(DEFAULT_PRESET);
  const [customDimensions, setCustomDimensions] = useState<CustomDimensionsInput>({
    width: DEFAULT_PRESET.width,
    height: DEFAULT_PRESET.height,
    unit: userPreferences.defaultUnit || DEFAULT_PRESET.unit,
  });
  const [cropMode, setCropMode] = useState<CropMode>("fixed");
  const [backgroundColor, setBackgroundColor] = useState<string>(
    userPreferences.defaultBackgroundColor || DEFAULT_BACKGROUND_COLOR
  );
  const [dpi, setDpi] = useState<number>(userPreferences.defaultDpi || 300);

  // Sync with global preferences when workspace is empty and user hasn't overridden
  useEffect(() => {
    if (!hasUserModifiedSettingsRef.current && workspaceState === "empty") {
      if (userPreferences.defaultDpi) {
        setDpi(userPreferences.defaultDpi);
      }
      if (userPreferences.defaultBackgroundColor) {
        setBackgroundColor(userPreferences.defaultBackgroundColor);
      }
      if (userPreferences.defaultUnit) {
        setCustomDimensions((prev) => ({
          ...prev,
          unit: userPreferences.defaultUnit,
        }));
      }
    }
  }, [userPreferences, workspaceState]);

  // Active Crop Coordinates in intrinsic image pixels
  const [crop, setCrop] = useState<CropCoordinates>({
    x: 0,
    y: 0,
    width: 350,
    height: 450,
  });

  // Active Studio Mode: Step 1 (Crop & Framing) vs Step 2 (A4 Print Sheet) vs Step 3 (4×6″ Print Sheet)
  const [activeTab, setActiveTab] = useState<"crop" | "sheet_a4" | "sheet_4x6">("crop");

  // Read URL search parameter on initial mount (?tab=sheet, ?tab=a4, ?tab=4x6)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "sheet" || tabParam === "a4" || tabParam === "sheet_a4") {
        setActiveTab("sheet_a4");
      } else if (tabParam === "4x6" || tabParam === "sheet_4x6") {
        setActiveTab("sheet_4x6");
      }
    }
  }, []);

  // Cached HTMLImageElement for canvas rendering in crop editor and preview
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  // Physical photo dimensions in millimeters
  const photoDimensionsMm = useMemo(() => {
    let widthMm: number;
    let heightMm: number;
    if (selectedPreset.id === "custom") {
      widthMm = unitToMm(customDimensions.width, customDimensions.unit);
      heightMm = unitToMm(customDimensions.height, customDimensions.unit);
    } else {
      widthMm = unitToMm(selectedPreset.width, selectedPreset.unit);
      heightMm = unitToMm(selectedPreset.height, selectedPreset.unit);
    }
    return {
      width: Number(widthMm.toFixed(2)),
      height: Number(heightMm.toFixed(2)),
    };
  }, [selectedPreset, customDimensions]);

  // Master cropped canvas preserving full optical resolution
  const croppedPhotoCanvas = useMemo(() => {
    if (!imageElement) return null;
    try {
      return renderCropCanvas(
        imageElement,
        crop,
        crop.width,
        crop.height,
        backgroundColor
      ) as HTMLCanvasElement;
    } catch {
      return null;
    }
  }, [imageElement, crop, backgroundColor]);

  // Synchronize error from image engine hook
  useEffect(() => {
    if (engine.error) {
      setErrorMessage(engine.error);
      setWorkspaceState("processing_error");
    }
  }, [engine.error]);

  // Load ImageElement whenever a new photo preview URL is set
  useEffect(() => {
    if (engine.currentFile?.previewUrl) {
      let isCurrent = true;
      const img = new Image();
      img.onload = () => {
        if (isCurrent) {
          setImageElement(img);
        }
      };
      img.src = engine.currentFile.previewUrl;
      return () => {
        isCurrent = false;
      };
    } else {
      setImageElement(null);
    }
  }, [engine.currentFile?.previewUrl]);

  const { dimensions: engineDimensions, updateCrop: engineUpdateCrop } = engine;

  // Initialize crop frame whenever a new photo is decoded
  useEffect(() => {
    if (engineDimensions) {
      const initial = initDefaultCrop(
        engineDimensions.width,
        engineDimensions.height,
        cropMode === "fixed" ? selectedPreset.aspectRatio : null
      );
      setCrop(initial);
      engineUpdateCrop({
        x: initial.x,
        y: initial.y,
        width: initial.width,
        height: initial.height,
      });
    }
  }, [engineDimensions, cropMode, selectedPreset.aspectRatio, engineUpdateCrop]);

  // Handle successful image ingestion and decoding
  const handleImageLoaded = useCallback(
    async (validated: ValidatedImageFile) => {
      setWorkspaceState("decoding");
      setErrorMessage(null);

      try {
        await engine.loadImage(validated);
        setWorkspaceState("ready");
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to decode photo into browser memory.";
        setErrorMessage(msg);
        setWorkspaceState("processing_error");
      }
    },
    [engine]
  );

  // Check for ephemeral image handed off from AI Background Remover in RAM
  useEffect(() => {
    const staged = peekStagedImage();
    if (staged) {
      let isCancelled = false;
      (async () => {
        try {
          const { decodeImage } = await import("@/lib/image/decoder");
          const { createTrackedObjectURL } = await import("@/lib/utils/memory");
          const decoded = await decodeImage(staged.file);
          if (isCancelled) {
            decoded.close();
            return;
          }
          const validated: ValidatedImageFile = {
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            file: staged.file,
            name: staged.file.name,
            size: staged.file.size,
            type: (staged.file.type as any) || "image/png",
            dimensions: {
              width: decoded.width,
              height: decoded.height,
              aspectRatio: decoded.aspectRatio,
            },
            previewUrl: createTrackedObjectURL(staged.file),
            createdAt: Date.now(),
          };
          decoded.close();
          consumeTransferredImage();
          await handleImageLoaded(validated);
        } catch (err) {
          console.error("Failed to ingest transferred photo:", err);
        }
      })();
      return () => {
        isCancelled = true;
      };
    }
  }, [handleImageLoaded]);

  // Handle upload validation error (unsupported format, oversized, etc.)
  const handleUploadError = useCallback((errorStr: string) => {
    setErrorMessage(errorStr);
    setWorkspaceState("invalid_file");
  }, []);

  // Handle replacing the current photo
  const handleReplaceFile = useCallback(
    async (file: File) => {
      setWorkspaceState("decoding");
      setErrorMessage(null);

      // Clean up previous engine resources first to prevent stale previews
      engine.clear();

      // Ingest new file through validation
      const { validateImageFile } = await import("@/lib/image/validator");
      const { decodeImage } = await import("@/lib/image/decoder");
      const { createTrackedObjectURL } = await import("@/lib/utils/memory");

      const validation = await validateImageFile(file, {
        maxSizeMB: tool.maxFileSizeMB,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
      });

      if (!validation.isValid) {
        setErrorMessage(validation.error || "Invalid image file format or size.");
        setWorkspaceState("invalid_file");
        return;
      }

      try {
        const decoded = await decodeImage(file);
        const previewUrl = createTrackedObjectURL(file);
        const validatedImage: ValidatedImageFile = {
          id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          file,
          name: file.name,
          size: file.size,
          type: (validation.detectedFormat || file.type) as any,
          dimensions: {
            width: decoded.width,
            height: decoded.height,
            aspectRatio: decoded.aspectRatio,
          },
          previewUrl,
          createdAt: Date.now(),
        };

        decoded.close();
        await engine.loadImage(validatedImage);
        setWorkspaceState("ready");
      } catch (decErr) {
        setErrorMessage(
          decErr instanceof Error
            ? decErr.message
            : "Failed to decode replacement photograph."
        );
        setWorkspaceState("processing_error");
      }
    },
    [engine, tool.maxFileSizeMB]
  );

  // Handle removing the photo
  const handleRemovePhoto = useCallback(() => {
    hasUserModifiedSettingsRef.current = false;
    engine.clear();
    setImageElement(null);
    setErrorMessage(null);
    setWorkspaceState("empty");
  }, [engine]);

  // Handle resetting the workspace
  const handleResetWorkspace = useCallback(() => {
    setErrorMessage(null);
    if (engine.dimensions) {
      const resetCrop = initDefaultCrop(
        engine.dimensions.width,
        engine.dimensions.height,
        cropMode === "fixed" ? selectedPreset.aspectRatio : null
      );
      setCrop(resetCrop);
      engine.updateCrop(resetCrop);
      engine.updateBackgroundColor(DEFAULT_BACKGROUND_COLOR);
      setBackgroundColor(DEFAULT_BACKGROUND_COLOR);
      setWorkspaceState("ready");
    } else {
      setWorkspaceState("empty");
    }
  }, [engine, cropMode, selectedPreset]);

  // Handle Preset Selection: Automatically updates crop frame without resetting photo
  const handlePresetChange = useCallback(
    (preset: PhotoPreset) => {
      hasUserModifiedSettingsRef.current = true;
      setSelectedPreset(preset);
      if (preset.id === "custom") {
        setCustomDimensions((prev) => ({
          ...prev,
          width: preset.width,
          height: preset.height,
          unit: preset.unit,
        }));
      }

      if (engine.dimensions) {
        const newRatio = cropMode === "fixed" ? preset.aspectRatio : null;
        setCrop((prevCrop) => {
          const updated = recalculateCropForAspectRatio(
            prevCrop,
            engine.dimensions!.width,
            engine.dimensions!.height,
            newRatio
          );
          engine.updateCrop(updated);
          return updated;
        });
      }
    },
    [cropMode, engine]
  );

  // Handle Custom Dimensions Change
  const handleCustomDimensionsChange = useCallback(
    (custom: CustomDimensionsInput) => {
      hasUserModifiedSettingsRef.current = true;
      setCustomDimensions(custom);
      if (custom.dpi && custom.dpi !== dpi) {
        setDpi(custom.dpi);
      }
      if (engine.dimensions && cropMode === "fixed") {
        const ratio = custom.width / Math.max(0.001, custom.height);
        setCrop((prevCrop) => {
          const updated = recalculateCropForAspectRatio(
            prevCrop,
            engine.dimensions!.width,
            engine.dimensions!.height,
            ratio
          );
          engine.updateCrop(updated);
          return updated;
        });
      }
    },
    [cropMode, engine, dpi]
  );

  // Handle Crop Mode Toggle (Fixed Aspect vs Free Crop)
  const handleCropModeToggle = useCallback(
    (mode: CropMode) => {
      setCropMode(mode);
      if (mode === "fixed" && engine.dimensions) {
        const updated = recalculateCropForAspectRatio(
          crop,
          engine.dimensions.width,
          engine.dimensions.height,
          selectedPreset.aspectRatio
        );
        setCrop(updated);
        engine.updateCrop(updated);
      }
    },
    [crop, engine, selectedPreset.aspectRatio]
  );

  // Handle Crop Frame Drag/Resize update
  const handleCropChange = useCallback(
    (newCrop: CropCoordinates) => {
      setCrop(newCrop);
      engine.updateCrop(newCrop);
    },
    [engine]
  );

  // Handle Studio Background Color Change
  const handleBackgroundColorChange = useCallback(
    (color: string) => {
      hasUserModifiedSettingsRef.current = true;
      setBackgroundColor(color);
      engine.updateBackgroundColor(color);
    },
    [engine]
  );

  return (
    <ModuleLayout tool={tool}>
      <div className="space-y-8">
        {/* Workspace Sub-Header & Live Privacy Status Bar */}
        <div className="bg-white rounded-3xl border border-surface-200 p-5 sm:p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" />
                <span>Phase 03: Photo Studio & Multi-Format Sheet Generator</span>
              </span>
              <span className="text-surface-300">•</span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
                  workspaceState === "ready"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : workspaceState === "decoding"
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : workspaceState === "dragging"
                    ? "bg-brand-50 text-brand-800 border border-brand-200"
                    : workspaceState === "invalid_file" ||
                      workspaceState === "processing_error"
                    ? "bg-rose-50 text-rose-800 border border-rose-200"
                    : "bg-surface-100 text-surface-600 border border-surface-200"
                }`}
              >
                {workspaceState === "ready" && (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Photo Studio Active</span>
                  </>
                )}
                {workspaceState === "decoding" && (
                  <>
                    <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
                    <span>Decoding Photo...</span>
                  </>
                )}
                {workspaceState === "dragging" && (
                  <>
                    <Sparkles className="w-3 h-3 text-brand-600" />
                    <span>Drop Target Active</span>
                  </>
                )}
                {workspaceState === "invalid_file" && <span>Invalid File</span>}
                {workspaceState === "processing_error" && (
                  <span>Processing Error</span>
                )}
                {workspaceState === "empty" && <span>Empty Workspace</span>}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-surface-900 tracking-tight">
              Professional Photo Studio & Print Sheet Generator
            </h2>
            <p className="text-xs sm:text-sm text-surface-500 max-w-2xl">
              Crop passport photos with standard presets, calibrate print DPI, and arrange multiple copies on standard A4 or 4×6″ sheets with 100% in-browser privacy.
            </p>
          </div>

          {/* Privacy Indicator Badge */}
          <div className="flex items-center gap-2 self-start md:self-auto px-3.5 py-2 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 text-emerald-900 shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-left font-mono">
              <span className="block text-[11px] font-bold text-emerald-950">
                100% In-Browser Privacy
              </span>
              <span className="block text-[10px] text-emerald-700">
                0 Bytes Sent • Master Stored in RAM
              </span>
            </div>
          </div>
        </div>

        {/* Step Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-surface-100 rounded-2xl border border-surface-200 max-w-2xl">
          <button
            type="button"
            onClick={() => setActiveTab("crop")}
            className={cn(
              "flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all",
              activeTab === "crop"
                ? "bg-white text-surface-900 shadow-sm border border-surface-200"
                : "text-surface-600 hover:text-surface-900"
            )}
          >
            <Crop className="w-4 h-4 text-brand-600" />
            <span>Step 1: Crop & Framing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sheet_a4")}
            className={cn(
              "flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all",
              activeTab === "sheet_a4"
                ? "bg-white text-surface-900 shadow-sm border border-surface-200"
                : "text-surface-600 hover:text-surface-900"
            )}
          >
            <Printer className="w-4 h-4 text-brand-600" />
            <span>Step 2: A4 Sheet</span>
            {engine.currentFile && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sheet_4x6")}
            className={cn(
              "flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all",
              activeTab === "sheet_4x6"
                ? "bg-white text-surface-900 shadow-sm border border-surface-200"
                : "text-surface-600 hover:text-surface-900"
            )}
          >
            <Layers className="w-4 h-4 text-brand-600" />
            <span>Step 3: 4×6″ Sheet</span>
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 shadow-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-rose-950">
                Workspace Notification
              </h4>
              <p className="text-xs text-rose-800 mt-0.5 whitespace-pre-line">
                {errorMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-900 px-2 py-1 rounded-lg hover:bg-rose-100 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dynamic Workspace: Empty / Upload vs Ready / Interactive Editor */}
        {!engine.currentFile ? (
          /* Empty State: Ingestion dropzone + Standalone Physical Calculator Preview */
          <div className="space-y-10 max-w-5xl mx-auto">
            {(activeTab === "sheet_a4" || activeTab === "sheet_4x6") && (
              <div className="p-4 rounded-2xl bg-brand-50/70 border border-brand-200 text-brand-900 text-xs flex items-center gap-3">
                <Printer className="w-5 h-5 text-brand-600 shrink-0" />
                <div>
                  <strong className="block text-brand-950">
                    Step 1 Required Before Sheet Arrangement
                  </strong>
                  <span>
                    Upload and frame your portrait photo below. It will automatically populate the print sheet once cropped.
                  </span>
                </div>
              </div>
            )}

            <PhotoStudioUpload
              onImageLoaded={handleImageLoaded}
              onError={handleUploadError}
              isDecoding={workspaceState === "decoding"}
              maxSizeMB={tool.maxFileSizeMB}
              onDraggingChange={(isDragging) => {
                setWorkspaceState(isDragging ? "dragging" : "empty");
              }}
            />

            {/* Standalone Physical Photo Dimensions & DPI Calculator Preview */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-surface-500">
                  Interactive DPI & Physical Photo Size Calculator
                </span>
              </div>
              <PhotoDimensionsPanel />
            </div>
          </div>
        ) : activeTab === "sheet_a4" || activeTab === "sheet_4x6" ? (
          /* Active Tab: A4 or 4x6 Print Sheet Workspace */
          <PhotoSheetWorkspace
            croppedCanvas={croppedPhotoCanvas}
            presetName={selectedPreset.name}
            photoDimensionsMm={photoDimensionsMm}
            initialPaperSize={activeTab === "sheet_4x6" ? "4x6" : "a4"}
            initialDpi={dpi}
            onNavigateToCrop={() => setActiveTab("crop")}
            onPaperSizeChange={(paperSize) =>
              setActiveTab(paperSize === "4x6" ? "sheet_4x6" : "sheet_a4")
            }
            onDpiChange={setDpi}
          />
        ) : (
          /* Active Tab: Interactive Crop Workspace, Controls & Live Preview */
          <div className="space-y-6">
            {/* Top Workspace Controls Bar */}
            <PhotoStudioControls
              fileName={engine.currentFile.name}
              onReplaceFile={handleReplaceFile}
              onRemovePhoto={handleRemovePhoto}
              onResetWorkspace={handleResetWorkspace}
              disabled={engine.isProcessing}
            />

            {/* Main Interactive Grid: Crop Workspace (7 cols) + Presets & Controls (5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column (7 cols): Interactive Crop Editor & Final Crop Preview */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Main Interactive Crop Editor */}
                <InteractiveCropEditor
                  imageSource={engine.currentFile.previewUrl}
                  naturalWidth={engine.dimensions?.width ?? 800}
                  naturalHeight={engine.dimensions?.height ?? 600}
                  crop={crop}
                  aspectRatio={cropMode === "fixed" ? selectedPreset.aspectRatio : null}
                  cropMode={cropMode}
                  backgroundColor={backgroundColor}
                  presetName={selectedPreset.name}
                  onCropChange={handleCropChange}
                  onCropModeToggle={handleCropModeToggle}
                />

                {/* 2. Live Composition Preview Card */}
                <CropPreviewCard
                  imageElement={imageElement}
                  crop={crop}
                  preset={selectedPreset}
                  dpi={dpi}
                  backgroundColor={backgroundColor}
                  originalDimensions={engine.dimensions}
                  currentZoom={1}
                  cropMode={cropMode}
                  onNavigateToSheet={() => setActiveTab("sheet_a4")}
                />

                {/* 3. Original File Technical Metadata */}
                <PhotoStudioInfoPanel imageFile={engine.currentFile} />
              </div>

              {/* Right Column (5 cols): Preset Selector, Custom Dimensions, Background & DPI */}
              <div className="lg:col-span-5 space-y-6">
                {/* 1. Photo Preset Selector & Custom Dimensions */}
                <PhotoPresetSelector
                  selectedPreset={selectedPreset}
                  cropMode={cropMode}
                  backgroundColor={backgroundColor}
                  dpi={dpi}
                  onPresetChange={handlePresetChange}
                  onCustomDimensionsChange={handleCustomDimensionsChange}
                  onCropModeToggle={handleCropModeToggle}
                  onBackgroundColorChange={handleBackgroundColorChange}
                  onDpiChange={setDpi}
                />

                {/* 2. Dedicated DPI & Physical Resolution Assessment Panel */}
                <PhotoDimensionsPanel
                  imageFile={engine.currentFile}
                  currentWidthMm={photoDimensionsMm.width}
                  currentHeightMm={photoDimensionsMm.height}
                  currentDpi={dpi}
                  currentPresetId={selectedPreset.id}
                  onDimensionsChange={(dims) => {
                    if (dims.dpi !== dpi) {
                      setDpi(dims.dpi);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </ModuleLayout>
  );
}
