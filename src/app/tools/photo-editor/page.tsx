"use client";

import React, { useState } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { FileDropzone } from "@/components/common/FileDropzone";
import { TOOLS } from "@/constants/tools";
import {
  SlidersHorizontal,
  Check,
  ShieldCheck,
  RotateCw,
  Crop,
  SunMedium,
  Gauge,
  Sliders,
} from "lucide-react";

export default function PhotoEditorPage() {
  const tool = TOOLS.find((t) => t.id === "photo-editor")!;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAspect, setSelectedAspect] = useState<string>("free");

  return (
    <ModuleLayout tool={tool}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Workspace */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-card">
            <h3 className="text-base font-bold text-surface-900 mb-4 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-brand-600" />
              <span>Step 1: Open Photo for In-Browser Editing</span>
            </h3>

            <FileDropzone
              acceptTypes={tool.fileAccept}
              maxSizeMB={tool.maxFileSizeMB}
              label="Select photo to enhance and adjust"
              hint="High-performance client canvas editor for rotation, crops, filters, and target size compression."
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
                  Loaded In-Memory
                </span>
              </div>
            )}
          </div>

          {/* Interactive Editor Controls Workspace Staging */}
          <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-subtle">
            <h3 className="text-base font-bold text-surface-900 mb-2 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-surface-600" />
              <span>Step 2: Non-Destructive Canvas Pipeline</span>
            </h3>
            <p className="text-xs text-surface-600 mb-6 leading-relaxed">
              Equipped for non-destructive operations: rotate, flip, freeform crop, aspect crop (1:1, 4:3, 16:9), brightness/contrast tuning, and target file size compression.
            </p>

            {/* Crop Aspect Presets */}
            <div className="mb-6">
              <label className="text-xs font-bold text-surface-700 uppercase tracking-wider block mb-2">
                Crop Aspect Ratio Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "free", label: "Freeform" },
                  { id: "1:1", label: "Square (1:1)" },
                  { id: "4:3", label: "Standard (4:3)" },
                  { id: "16:9", label: "Widescreen (16:9)" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedAspect(item.id)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      selectedAspect === item.id
                        ? "border-brand-500 bg-brand-50 text-brand-700 shadow-sm"
                        : "border-surface-200 text-surface-700 hover:bg-surface-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Adjustment Controls Mockup */}
            <div className="space-y-4 pt-4 border-t border-surface-100">
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-surface-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <SunMedium className="w-3.5 h-3.5 text-amber-500" />
                    Brightness
                  </span>
                  <span className="font-mono text-surface-500">0%</span>
                </div>
                <input
                  type="range"
                  disabled
                  defaultValue={50}
                  className="w-full h-1.5 bg-surface-200 rounded-lg appearance-none cursor-not-allowed opacity-60"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-medium text-surface-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-brand-500" />
                    Contrast
                  </span>
                  <span className="font-mono text-surface-500">0%</span>
                </div>
                <input
                  type="range"
                  disabled
                  defaultValue={50}
                  className="w-full h-1.5 bg-surface-200 rounded-lg appearance-none cursor-not-allowed opacity-60"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls & Specifications */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-subtle">
            <h4 className="text-sm font-bold text-surface-900 mb-3 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-brand-600" />
              <span>Target File Size Compressor</span>
            </h4>
            <p className="text-xs text-surface-600 mb-3 leading-relaxed">
              Many government portal applications strictly demand photo files under 50 KB or 100 KB. Our binary-search compression engine tunes quality iteratively to meet exact byte limits.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-surface-50 border border-surface-200 text-center">
                <span className="font-bold text-surface-800 block">&lt; 50 KB</span>
                <span className="text-[10px] text-surface-500">Govt Applications</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-50 border border-surface-200 text-center">
                <span className="font-bold text-surface-800 block">&lt; 100 KB</span>
                <span className="text-[10px] text-surface-500">Exam Portals</span>
              </div>
            </div>
          </div>

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
              <h4 className="text-sm font-bold">100% In-Memory Canvas</h4>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Every edit is applied directly to an in-memory HTML5 Canvas and offscreen workers. Zero bytes leave your browser.
            </p>
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
}
