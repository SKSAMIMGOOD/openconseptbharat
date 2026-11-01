"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sliders,
  Crop as CropIcon,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Download,
  Trash2,
  RefreshCw,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  FileCheck,
  Zap,
} from "lucide-react";
import { useImageEngine } from "@/hooks/useImageEngine";
import { ImageDropzone } from "@/components/image-engine/ImageDropzone";
import { ImagePreview } from "@/components/image-engine/ImagePreview";
import { SupportedImageFormat, ExportResult } from "@/types/image-engine";

export default function TestEnginePage() {
  const engine = useImageEngine();

  // Test Harness State
  const [useWorker, setUseWorker] = useState(true);
  const [exportFormat, setExportFormat] = useState<SupportedImageFormat>("image/png");
  const [exportQuality, setExportQuality] = useState<number>(0.92);
  const [backgroundColor, setBackgroundColor] = useState<string>("#ffffff");

  // Local transform input states
  const [resizeWidth, setResizeWidth] = useState<number>(0);
  const [resizeHeight, setResizeHeight] = useState<number>(0);
  const [maintainAspect, setMaintainAspect] = useState<boolean>(true);

  const [cropX, setCropX] = useState<number>(0);
  const [cropY, setCropY] = useState<number>(0);
  const [cropW, setCropW] = useState<number>(0);
  const [cropH, setCropH] = useState<number>(0);

  const [rotateAngle, setRotateAngle] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  const [lastExport, setLastExport] = useState<ExportResult | null>(null);
  const [benchmarks, setBenchmarks] = useState<{ durationMs: number; mode: string } | null>(null);

  // Sync dimensions when a new image loads
  const handleImageLoaded = (images: any[]) => {
    if (images.length > 0) {
      const img = images[0];
      engine.loadImage(img);
      setResizeWidth(img.dimensions.width);
      setResizeHeight(img.dimensions.height);
      setCropX(0);
      setCropY(0);
      setCropW(img.dimensions.width);
      setCropH(img.dimensions.height);
      setRotateAngle(0);
      setFlipH(false);
      setFlipV(false);
      setLastExport(null);
      setBenchmarks(null);
    }
  };

  // Preset aspect crops
  const applyPresetCrop = (ratio: number) => {
    if (!engine.dimensions) return;
    const { width, height } = engine.dimensions;
    let targetW = width;
    let targetH = Math.round(width / ratio);

    if (targetH > height) {
      targetH = height;
      targetW = Math.round(height * ratio);
    }

    const startX = Math.round((width - targetW) / 2);
    const startY = Math.round((height - targetH) / 2);

    setCropX(startX);
    setCropY(startY);
    setCropW(targetW);
    setCropH(targetH);

    engine.updateCrop({
      x: startX,
      y: startY,
      width: targetW,
      height: targetH,
      aspectRatioConstraint: ratio,
    });
  };

  // Run pipeline
  const handleProcess = async () => {
    const start = performance.now();
    await engine.applyTransforms(useWorker);
    const elapsed = Math.round(performance.now() - start);
    setBenchmarks({ durationMs: elapsed, mode: useWorker ? "Web Worker (OffscreenCanvas)" : "Main Thread (Canvas)" });
  };

  // Export
  const handleExport = async () => {
    const res = await engine.exportResult({
      format: exportFormat,
      quality: exportQuality,
      backgroundColor: exportFormat === "image/jpeg" ? backgroundColor : undefined,
    });
    setLastExport(res);
  };

  // Download
  const handleDownload = async () => {
    await engine.downloadResult({
      format: exportFormat,
      quality: exportQuality,
      backgroundColor: exportFormat === "image/jpeg" ? backgroundColor : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-surface-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-surface-200 shadow-subtle">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                DEVELOPMENT TEST HARNESS
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                100% In-Browser Execution
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
              Shared Browser Image Processing Engine Test Bench
            </h1>
            <p className="text-xs sm:text-sm text-surface-500 mt-1">
              Interactive test harness for Phase 02 verification (Input, Decoding, Crop, Rotate, Flip, Resize, Workers & Export).
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-600 hover:text-brand-600 bg-surface-100 hover:bg-surface-200 px-3.5 py-2 rounded-xl transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Studio</span>
          </Link>
        </div>

        {/* Status / Errors */}
        {engine.error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="font-medium">{engine.error}</div>
          </div>
        )}

        {/* Main Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Ingestion & Preview (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {!engine.currentFile ? (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-surface-200 shadow-subtle">
                <h3 className="text-base font-bold text-surface-900 mb-4 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-brand-600" />
                  <span>1. Ingest Master Image File</span>
                </h3>
                <ImageDropzone onImagesSelected={handleImageLoaded} />
              </div>
            ) : (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-surface-200 shadow-subtle space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-surface-100">
                  <div>
                    <h3 className="text-sm font-bold text-surface-900 truncate max-w-sm">
                      {engine.currentFile.name}
                    </h3>
                    <p className="text-xs text-surface-500 font-mono mt-0.5">
                      {(engine.currentFile.size / 1024).toFixed(1)} KB • {engine.currentFile.type}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={engine.clear}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Image</span>
                  </button>
                </div>

                {/* Viewport Preview Engine */}
                <ImagePreview
                  imageSource={engine.previewCanvas}
                  dimensions={engine.dimensions ?? undefined}
                />

                {/* Benchmark Telemetry */}
                {benchmarks && (
                  <div className="p-3 bg-surface-50 rounded-xl border border-surface-200 text-xs flex items-center justify-between font-mono text-surface-700">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>{benchmarks.mode}</span>
                    </span>
                    <span className="font-bold text-emerald-700">
                      Execution: {benchmarks.durationMs} ms
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Interactive Processing & Export Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-surface-200 shadow-subtle space-y-6">
              <h3 className="text-base font-bold text-surface-900 pb-3 border-b border-surface-100 flex items-center justify-between">
                <span>Transformation Pipeline</span>
                <span className="text-xs font-mono text-surface-400 font-normal">Pure In-Memory</span>
              </h3>

              {/* Execution Engine Selector */}
              <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-brand-600" />
                  <span className="text-xs font-bold text-surface-800">OffscreenCanvas Worker</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useWorker}
                    onChange={(e) => setUseWorker(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-surface-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>

              {/* A. Resize Controls */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-surface-700 block">
                  A. Resize Engine
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-surface-500 block mb-1">Target Width (px)</label>
                    <input
                      type="number"
                      value={resizeWidth || ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setResizeWidth(val);
                        engine.updateResize({
                          width: val,
                          height: resizeHeight,
                          maintainAspectRatio: maintainAspect,
                        });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-surface-200 bg-surface-50 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-surface-500 block mb-1">Target Height (px)</label>
                    <input
                      type="number"
                      value={resizeHeight || ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setResizeHeight(val);
                        engine.updateResize({
                          width: resizeWidth,
                          height: val,
                          maintainAspectRatio: maintainAspect,
                        });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-surface-200 bg-surface-50 text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    id="aspect-lock"
                    checked={maintainAspect}
                    onChange={(e) => {
                      setMaintainAspect(e.target.checked);
                      engine.updateResize({
                        width: resizeWidth,
                        height: resizeHeight,
                        maintainAspectRatio: e.target.checked,
                      });
                    }}
                    className="rounded border-surface-300 text-brand-600"
                  />
                  <label htmlFor="aspect-lock" className="text-surface-600 cursor-pointer">
                    Maintain Aspect Ratio
                  </label>
                </div>
              </div>

              {/* B. Crop Controls */}
              <div className="space-y-3 pt-3 border-t border-surface-100">
                <span className="text-xs font-bold uppercase tracking-wider text-surface-700 block">
                  B. Crop Engine
                </span>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => applyPresetCrop(1.0)}
                    className="px-2.5 py-1 rounded bg-surface-100 hover:bg-surface-200 text-surface-700 text-[11px] font-medium"
                  >
                    1:1 Square
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetCrop(4 / 3)}
                    className="px-2.5 py-1 rounded bg-surface-100 hover:bg-surface-200 text-surface-700 text-[11px] font-medium"
                  >
                    4:3 Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetCrop(16 / 9)}
                    className="px-2.5 py-1 rounded bg-surface-100 hover:bg-surface-200 text-surface-700 text-[11px] font-medium"
                  >
                    16:9 Wide
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetCrop(35 / 45)}
                    className="px-2.5 py-1 rounded bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-[11px] font-medium"
                  >
                    35×45mm Passport
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-surface-400 block">X</label>
                    <input
                      type="number"
                      value={cropX}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setCropX(val);
                        engine.updateCrop({ x: val, y: cropY, width: cropW, height: cropH });
                      }}
                      className="w-full px-2 py-1 rounded border border-surface-200 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-surface-400 block">Y</label>
                    <input
                      type="number"
                      value={cropY}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setCropY(val);
                        engine.updateCrop({ x: cropX, y: val, width: cropW, height: cropH });
                      }}
                      className="w-full px-2 py-1 rounded border border-surface-200 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-surface-400 block">Width</label>
                    <input
                      type="number"
                      value={cropW}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setCropW(val);
                        engine.updateCrop({ x: cropX, y: cropY, width: val, height: cropH });
                      }}
                      className="w-full px-2 py-1 rounded border border-surface-200 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-surface-400 block">Height</label>
                    <input
                      type="number"
                      value={cropH}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setCropH(val);
                        engine.updateCrop({ x: cropX, y: cropY, width: cropW, height: val });
                      }}
                      className="w-full px-2 py-1 rounded border border-surface-200 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* C. Rotate & Flip Controls */}
              <div className="space-y-3 pt-3 border-t border-surface-100">
                <span className="text-xs font-bold uppercase tracking-wider text-surface-700 block">
                  C. Rotate & Flip Engine
                </span>
                <div className="flex items-center gap-2">
                  {[0, 90, 180, 270].map((deg) => (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => {
                        setRotateAngle(deg);
                        engine.updateRotate({ angle: deg });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        rotateAngle === deg
                          ? "bg-brand-600 text-white border-brand-600 shadow-xs"
                          : "bg-surface-50 text-surface-700 border-surface-200 hover:bg-surface-100"
                      }`}
                    >
                      {deg}°
                    </button>
                  ))}

                  <div className="w-px h-6 bg-surface-200 mx-1" />

                  <button
                    type="button"
                    onClick={() => {
                      const next = !flipH;
                      setFlipH(next);
                      engine.updateFlip({ horizontal: next, vertical: flipV });
                    }}
                    className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                      flipH
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-surface-50 text-surface-700 border-surface-200 hover:bg-surface-100"
                    }`}
                    title="Flip Horizontal"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !flipV;
                      setFlipV(next);
                      engine.updateFlip({ horizontal: flipH, vertical: next });
                    }}
                    className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                      flipV
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-surface-50 text-surface-700 border-surface-200 hover:bg-surface-100"
                    }`}
                    title="Flip Vertical"
                  >
                    <FlipVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action: Execute Pipeline */}
              <div className="pt-4 border-t border-surface-100 flex items-center gap-3">
                <button
                  type="button"
                  disabled={!engine.currentFile || engine.isProcessing}
                  onClick={handleProcess}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {engine.isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sliders className="w-4 h-4" />
                  )}
                  <span>Apply Transformation Pipeline</span>
                </button>

                <button
                  type="button"
                  onClick={engine.resetPipeline}
                  disabled={!engine.currentFile}
                  className="px-3 py-2.5 rounded-xl border border-surface-200 hover:bg-surface-100 text-surface-600 text-xs font-semibold transition-colors"
                  title="Reset Pipeline"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Export & Download Controls */}
            <div className="bg-white p-6 rounded-3xl border border-surface-200 shadow-subtle space-y-4">
              <h3 className="text-base font-bold text-surface-900 pb-2 border-b border-surface-100">
                Export & Download Engine
              </h3>

              <div className="grid grid-cols-3 gap-2">
                {(["image/png", "image/jpeg", "image/webp"] as SupportedImageFormat[]).map(
                  (fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setExportFormat(fmt)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        exportFormat === fmt
                          ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                          : "bg-surface-50 text-surface-700 border-surface-200 hover:bg-surface-100"
                      }`}
                    >
                      {fmt.replace("image/", "").toUpperCase()}
                    </button>
                  )
                )}
              </div>

              {/* Quality slider for lossy */}
              {exportFormat !== "image/png" && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-surface-600">
                    <span>Quality</span>
                    <span className="font-mono font-bold">{Math.round(exportQuality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={Math.round(exportQuality * 100)}
                    onChange={(e) => setExportQuality(parseInt(e.target.value) / 100)}
                    className="w-full h-1.5 bg-surface-200 rounded appearance-none"
                  />
                </div>
              )}

              {/* Background Color Picker for JPEG */}
              {exportFormat === "image/jpeg" && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-surface-600">JPEG Background Fill:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-7 h-7 rounded border border-surface-200 cursor-pointer"
                    />
                    <span className="font-mono text-[11px] text-surface-500">{backgroundColor}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  disabled={!engine.currentFile || engine.isProcessing}
                  onClick={handleExport}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-surface-100 hover:bg-surface-200 text-surface-800 disabled:opacity-50 transition-colors"
                >
                  Generate In-Memory Blob
                </button>

                <button
                  type="button"
                  disabled={!engine.currentFile || engine.isProcessing}
                  onClick={handleDownload}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </button>
              </div>

              {/* Export Result Metadata */}
              {lastExport && (
                <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1 font-mono">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800 font-sans mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Blob Generated Client-Side</span>
                  </div>
                  <div>File: {lastExport.fileName}</div>
                  <div>
                    Resolution: {lastExport.width} × {lastExport.height} px
                  </div>
                  <div>Size: {(lastExport.sizeBytes / 1024).toFixed(1)} KB</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
