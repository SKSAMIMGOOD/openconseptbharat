"use client";

import React, { useState } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { FileDropzone } from "@/components/common/FileDropzone";
import { TOOLS } from "@/constants/tools";
import { Camera, Check, ShieldCheck } from "lucide-react";
import { getImageDimensions } from "@/lib/validation/file-validator";

export default function PhotoStudioPage() {
  const tool = TOOLS.find((t) => t.id === "photo-studio")!;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDetails, setFileDetails] = useState<{ width: number; height: number } | null>(null);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    try {
      const dims = await getImageDimensions(file);
      setFileDetails(dims);
    } catch {
      setFileDetails(null);
    }
  };

  return (
    <ModuleLayout tool={tool}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left / Main Workspace: Upload & Staged Canvas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-card">
            <h3 className="text-base font-bold text-surface-900 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-brand-600" />
              <span>Step 1: Ingest Portrait Photo</span>
            </h3>

            <FileDropzone
              acceptTypes={tool.fileAccept}
              maxSizeMB={tool.maxFileSizeMB}
              label="Select or drop your portrait photo"
              hint="Works entirely in browser memory. High-resolution JPG or PNG recommended."
              onFileSelect={handleFileSelect}
            />

            {selectedFile && fileDetails && (
              <div className="mt-6 p-4 rounded-xl bg-surface-50 border border-surface-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-surface-900">{selectedFile.name}</h4>
                  <p className="text-xs text-surface-500 mt-0.5">
                    Dimensions: {fileDetails.width} × {fileDetails.height} px • {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Validated
                </span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-subtle">
            <h3 className="text-base font-bold text-surface-900 mb-2">Studio Architecture & Processing Pipeline</h3>
            <p className="text-xs text-surface-600 mb-4">
              When full editing begins, this workspace mounts an offscreen HTML5 canvas to crop to standard passport/visa proportions, enforce 300 DPI, and apply border and name stamps.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-surface-50 border border-surface-200 text-center">
                <span className="font-semibold block text-surface-800">Indian Passport</span>
                <span className="text-[11px] text-surface-500">35 × 45 mm</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-50 border border-surface-200 text-center">
                <span className="font-semibold block text-surface-800">US Visa</span>
                <span className="text-[11px] text-surface-500">2 × 2 inches (51×51mm)</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-50 border border-surface-200 text-center">
                <span className="font-semibold block text-surface-800">Schengen Visa</span>
                <span className="text-[11px] text-surface-500">35 × 45 mm</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-50 border border-surface-200 text-center">
                <span className="font-semibold block text-surface-800">Stamp Size</span>
                <span className="text-[11px] text-surface-500">25 × 30 mm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Module Controls Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-subtle">
            <h4 className="text-sm font-bold text-surface-900 mb-3">Planned Studio Capabilities</h4>
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
              <h4 className="text-sm font-bold">100% Client-Side Privacy</h4>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Biometric portrait photos are sensitive. With Browser Utility Studio, facial data never transmits across the Internet.
            </p>
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
}
