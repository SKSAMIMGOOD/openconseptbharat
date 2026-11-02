"use client";

import React from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { TOOLS } from "@/constants/tools";
import { useBackgroundRemover } from "@/hooks/useBackgroundRemover";
import { BackgroundRemoverUpload } from "@/components/background-remover/BackgroundRemoverUpload";
import { ModelSettingsCard } from "@/components/background-remover/ModelSettingsCard";
import { BackgroundColorPicker } from "@/components/background-remover/BackgroundColorPicker";
import { BackgroundRemoverPreview } from "@/components/background-remover/BackgroundRemoverPreview";
import { BackgroundRemoverExport } from "@/components/background-remover/BackgroundRemoverExport";
import {
  Scissors,
  Cpu,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  HardDrive,
  Info,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function BackgroundRemoverPage() {
  const tool = TOOLS.find((t) => t.id === "background-remover")!;
  const {
    originalFile,
    originalPreviewUrl,
    dimensions,
    selectedModel,
    isModelCachedState,
    modelLoadingProgress,
    isModelLoaded,
    isInferring,
    inferenceProgress,
    hasResult,
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
  } = useBackgroundRemover();

  return (
    <ModuleLayout tool={tool}>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Workspace Sub-Header & Live Privacy Status Bar */}
        <div className="bg-white rounded-3xl border border-surface-200 p-5 sm:p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5" />
                <span>Phase 05: Client-Side AI Background Remover</span>
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero-Upload Client Inference
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-surface-900 tracking-tight">
              AI Subject Segmentation & Studio Cutout Workspace
            </h2>
            <p className="text-xs text-surface-500 max-w-2xl leading-relaxed">
              Remove backgrounds with quantized neural networks running directly inside your browser tab. Replace backgrounds with studio colors or transparent PNGs without cloud APIs.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="p-3 rounded-2xl bg-surface-50 border border-surface-200 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400 block">
                Inference Runtime
              </span>
              <span className="text-xs font-mono font-bold text-surface-800 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-brand-600" />
                ONNX WebAssembly / WebGPU
              </span>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start justify-between gap-3 shadow-sm animate-in fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-bold text-rose-950">
                  Processing Notice
                </strong>
                <p className="text-xs text-rose-800 leading-relaxed mt-0.5">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearError}
              className="text-xs font-semibold text-rose-700 hover:text-rose-950 px-2 py-1 rounded-lg hover:bg-rose-100 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main 2-Column Responsive Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Preview Stage & Backdrop Selector (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Master Interactive Preview Viewport */}
            <BackgroundRemoverPreview
              originalUrl={originalPreviewUrl}
              compositeCanvas={compositeCanvas}
              dimensions={dimensions}
              viewMode={viewMode}
              sliderPosition={sliderPosition}
              zoom={zoom}
              pan={pan}
              selectedBackground={selectedBackground}
              customHex={customColorHex}
              hasResult={hasResult}
              isInferring={isInferring}
              onViewModeChange={setViewMode}
              onSliderPositionChange={setSliderPosition}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onResetZoom={resetZoom}
              onFitToScreen={fitToScreen}
              onPanChange={setPan}
            />

            {/* Background Color Options */}
            <BackgroundColorPicker
              selectedColor={selectedBackground}
              customHex={customColorHex}
              onSelectColor={selectBackground}
              onCustomHexChange={updateCustomHex}
              disabled={isInferring}
            />

            {/* Privacy & Security Technical Architecture Highlights */}
            <div className="bg-surface-50 rounded-2xl border border-surface-200/80 p-5 space-y-3">
              <h4 className="text-xs font-bold text-surface-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Client-Side Privacy Architecture</span>
              </h4>
              <p className="text-xs text-surface-600 leading-relaxed">
                Commercial background removers routinely transmit user photos to remote third-party cloud servers. In Browser Utility Studio, all tensor calculations, neural inference passes, and pixel matting operations run <strong>100% inside your browser&apos;s memory</strong>. Your sensitive biometric photo never leaves your device.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-surface-200 text-center text-[11px] font-mono">
                <div className="p-2 rounded-xl bg-white border border-surface-200">
                  <span className="text-surface-400 block font-sans text-[10px]">Cloud APIs</span>
                  <span className="font-bold text-emerald-700">0 (Zero)</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-surface-200">
                  <span className="text-surface-400 block font-sans text-[10px]">Image Uploads</span>
                  <span className="font-bold text-emerald-700">0 (Zero)</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-surface-200">
                  <span className="text-surface-400 block font-sans text-[10px]">Storage Mode</span>
                  <span className="font-bold text-brand-700">Ephemeral RAM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Upload, AI Model Settings & Export Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. Upload & Photo Ingestion */}
            <BackgroundRemoverUpload
              originalFile={originalFile}
              originalPreviewUrl={originalPreviewUrl}
              dimensions={dimensions}
              onFileSelect={handleFileSelect}
              onRemove={removeImage}
              disabled={isInferring}
            />

            {/* 2. AI Model Selection & Inference Triggers */}
            <ModelSettingsCard
              selectedModel={selectedModel}
              isModelCached={isModelCachedState}
              isModelLoaded={isModelLoaded}
              modelProgress={modelLoadingProgress}
              isInferring={isInferring}
              inferenceProgress={inferenceProgress}
              hasImage={originalFile !== null}
              onSelectModel={selectModel}
              onUploadCustomModel={handleCustomModelUpload}
              onRunRemoval={processBackgroundRemoval}
            />

            {/* 3. Multi-Format Export & Photo Studio Hand-off */}
            <BackgroundRemoverExport
              hasResult={hasResult}
              selectedBackground={selectedBackground}
              customHex={customColorHex}
              onExport={exportFile}
              onTransferToPhotoStudio={transferToPhotoStudio}
              disabled={isInferring}
            />
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
}
