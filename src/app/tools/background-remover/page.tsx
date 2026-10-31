"use client";

import React, { useState } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { FileDropzone } from "@/components/common/FileDropzone";
import { TOOLS } from "@/constants/tools";
import { Scissors, Cpu, Check, ShieldCheck } from "lucide-react";

export default function BackgroundRemoverPage() {
  const tool = TOOLS.find((t) => t.id === "background-remover")!;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <ModuleLayout tool={tool}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-card">
            <h3 className="text-base font-bold text-surface-900 mb-4 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-brand-600" />
              <span>Step 1: Ingest Image for Background Removal</span>
            </h3>

            <FileDropzone
              acceptTypes={tool.fileAccept}
              maxSizeMB={tool.maxFileSizeMB}
              label="Select image to isolate subject"
              hint="All machine learning inference runs locally via WebAssembly / WebGPU."
              onFileSelect={(file) => setSelectedFile(file)}
            />

            {selectedFile && (
              <div className="mt-4 p-3 bg-surface-50 rounded-xl border border-surface-200 flex items-center justify-between text-xs">
                <span className="font-medium text-surface-800 truncate">{selectedFile.name}</span>
                <span className="text-brand-700 font-semibold">Ready for local AI inference</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-subtle">
            <h3 className="text-base font-bold text-surface-900 mb-2 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-surface-600" />
              <span>Local AI Architecture</span>
            </h3>
            <p className="text-xs text-surface-600 mb-4">
              Unlike cloud services that require paid API subscriptions and upload user photos to external servers, Browser Utility Studio will utilize lightweight quantized in-browser models (e.g. RMBG / MODNet) running via WebAssembly and WebGPU.
            </p>
            <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 text-xs text-surface-700 space-y-1.5">
              <div className="flex justify-between">
                <span className="font-medium">Execution Engine:</span>
                <span className="text-surface-900 font-semibold">Browser WASM / WebGPU</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Remote API Calls:</span>
                <span className="text-emerald-700 font-semibold">0 (Zero)</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Privacy Level:</span>
                <span className="text-emerald-700 font-semibold">100% On-Device</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-subtle">
            <h4 className="text-sm font-bold text-surface-900 mb-3">Planned Features</h4>
            <ul className="text-xs text-surface-600 space-y-2.5">
              {tool.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-emerald-50 rounded-2xl border border-emerald-200/80 p-6 text-emerald-950">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm font-bold">Safe AI Computation</h4>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              No machine learning provider gets access to your private images. Models run sandboxed in the client tab.
            </p>
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
}
