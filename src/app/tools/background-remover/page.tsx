"use client";

import React, { useState } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { FileDropzone } from "@/components/common/FileDropzone";
import { TOOLS } from "@/constants/tools";
import {
  Scissors,
  Cpu,
  Check,
  ShieldCheck,
  Sparkles,
  Layers,
  Image as ImageIcon,
} from "lucide-react";

export default function BackgroundRemoverPage() {
  const tool = TOOLS.find((t) => t.id === "background-remover")!;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backdropType, setBackdropType] = useState<"transparent" | "white" | "blue">("transparent");

  return (
    <ModuleLayout tool={tool}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Workspace: File Ingestion & AI Stage */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-card">
            <h3 className="text-base font-bold text-surface-900 mb-4 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-brand-600" />
              <span>Step 1: Ingest Image for Local AI Background Removal</span>
            </h3>

            <FileDropzone
              acceptTypes={tool.fileAccept}
              maxSizeMB={tool.maxFileSizeMB}
              label="Select image to isolate subject"
              hint="Works entirely in browser memory. Transparent PNG or solid backdrop export."
              onFileSelect={(file) => setSelectedFile(file)}
            />

            {selectedFile && (
              <div className="mt-4 p-4 rounded-xl bg-surface-50 border border-surface-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-surface-900">{selectedFile.name}</h4>
                  <p className="text-xs text-surface-500 mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB • In-Memory Buffer
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Staged for AI Inference
                </span>
              </div>
            )}
          </div>

          {/* AI Canvas Stage Placeholder */}
          <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-subtle">
            <h3 className="text-base font-bold text-surface-900 mb-2 flex items-center gap-2">
              <Layers className="w-5 h-5 text-surface-600" />
              <span>Step 2: AI Masking Stage & Backdrop Preview</span>
            </h3>
            <p className="text-xs text-surface-600 mb-6 leading-relaxed">
              In Phase 03, quantized local neural networks (ONNX Runtime Web / Transformers.js) will execute directly inside your browser tab to generate precise segmentation masks.
            </p>

            {/* Backdrop preset tabs */}
            <div className="flex items-center gap-2 mb-6">
              <button
                type="button"
                onClick={() => setBackdropType("transparent")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  backdropType === "transparent"
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-surface-100 text-surface-700 hover:bg-surface-200"
                }`}
              >
                Transparent Alpha PNG
              </button>
              <button
                type="button"
                onClick={() => setBackdropType("white")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  backdropType === "white"
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-surface-100 text-surface-700 hover:bg-surface-200"
                }`}
              >
                Solid White Backdrop
              </button>
              <button
                type="button"
                onClick={() => setBackdropType("blue")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  backdropType === "blue"
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-surface-100 text-surface-700 hover:bg-surface-200"
                }`}
              >
                Studio Passport Blue
              </button>
            </div>

            {/* Checkerboard Stage Mockup */}
            <div className="h-48 rounded-xl border border-surface-200 bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] [background-size:20px_20px] [background-position:0_0,0_10px,10px_-10px,-10px_0px] flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-white/90 backdrop-blur-sm border border-surface-200 flex items-center justify-center text-surface-500 mb-2 shadow-sm">
                <ImageIcon className="w-6 h-6 text-brand-600" />
              </div>
              <span className="text-xs font-semibold text-surface-800">
                Interactive Segmentation Canvas
              </span>
              <span className="text-[11px] text-surface-500 mt-0.5">
                Upload a portrait or product photo to initialize the WebGPU/WASM pipeline
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Controls & Model Specifications */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-subtle">
            <h4 className="text-sm font-bold text-surface-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>AI Pipeline Specifications</span>
            </h4>
            <ul className="text-xs text-surface-600 space-y-2.5">
              {tool.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-subtle">
            <h4 className="text-sm font-bold text-surface-900 mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-surface-600" />
              <span>Client-Side Inference Runtime</span>
            </h4>
            <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 text-xs text-surface-700 space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-surface-500 font-sans">Execution Engine:</span>
                <span className="font-semibold text-surface-900">Browser WASM / WebGPU</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500 font-sans">Remote Cloud APIs:</span>
                <span className="font-semibold text-emerald-700">0 (Zero)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500 font-sans">Processing Boundary:</span>
                <span className="font-semibold text-brand-700">Client Memory Only</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-2xl border border-emerald-200/80 p-6 text-emerald-950">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm font-bold">100% On-Device Privacy</h4>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Unlike commercial background removal services that send your personal photos to remote cloud servers, Browser Utility Studio keeps all biometric and subject data local.
            </p>
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
}
