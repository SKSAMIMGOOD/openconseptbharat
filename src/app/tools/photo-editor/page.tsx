"use client";

import React, { useState } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { FileDropzone } from "@/components/common/FileDropzone";
import { TOOLS } from "@/constants/tools";
import { SlidersHorizontal, Check, ShieldCheck } from "lucide-react";

export default function PhotoEditorPage() {
  const tool = TOOLS.find((t) => t.id === "photo-editor")!;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <ModuleLayout tool={tool}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
              <div className="mt-4 p-3 bg-surface-50 rounded-xl border border-surface-200 flex items-center justify-between text-xs">
                <span className="font-medium text-surface-800 truncate">{selectedFile.name}</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Ready for editing
                </span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-subtle">
            <h3 className="text-base font-bold text-surface-900 mb-2">Editor Pipeline Architecture</h3>
            <p className="text-xs text-surface-600 mb-4">
              Equipped for non-destructive operations: rotate, flip, freeform crop, aspect crop (1:1, 4:3, 16:9), brightness/contrast tuning, and target file size compression (e.g. strict &lt; 50 KB limits for government job applications).
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
              <div className="p-3 rounded-xl border border-surface-200 bg-surface-50">
                <span className="font-bold text-surface-800 block">Rotation</span>
                <span className="text-surface-500 text-[11px]">90° / 180° / 270°</span>
              </div>
              <div className="p-3 rounded-xl border border-surface-200 bg-surface-50">
                <span className="font-bold text-surface-800 block">Color Balance</span>
                <span className="text-surface-500 text-[11px]">Tone, Saturation</span>
              </div>
              <div className="p-3 rounded-xl border border-surface-200 bg-surface-50">
                <span className="font-bold text-surface-800 block">Target Size</span>
                <span className="text-surface-500 text-[11px]">KB compressor</span>
              </div>
              <div className="p-3 rounded-xl border border-surface-200 bg-surface-50">
                <span className="font-bold text-surface-800 block">Formats</span>
                <span className="text-surface-500 text-[11px]">JPG, PNG, WebP</span>
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
              <h4 className="text-sm font-bold">Safe Local Processing</h4>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Every edit is applied directly to an in-memory HTML5 Canvas and offscreen buffers. Zero bytes leave your browser.
            </p>
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
}
