"use client";

import React, { useState } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { FileDropzone } from "@/components/common/FileDropzone";
import { TOOLS } from "@/constants/tools";
import { Grid3X3, Check, Printer, ShieldCheck } from "lucide-react";

export default function MultiplePhotosPage() {
  const tool = TOOLS.find((t) => t.id === "multiple-photos")!;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <ModuleLayout tool={tool}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-card">
            <h3 className="text-base font-bold text-surface-900 mb-4 flex items-center gap-2">
              <Grid3X3 className="w-5 h-5 text-brand-600" />
              <span>Step 1: Choose Master Passport Photo</span>
            </h3>

            <FileDropzone
              acceptTypes={tool.fileAccept}
              maxSizeMB={tool.maxFileSizeMB}
              label="Select your cropped passport photo"
              hint="Select a passport photo to automatically tile onto a print sheet."
              onFileSelect={(file) => setSelectedFile(file)}
            />

            {selectedFile && (
              <div className="mt-4 p-3 bg-surface-50 rounded-xl border border-surface-200 flex items-center justify-between text-xs">
                <span className="font-medium text-surface-800 truncate">{selectedFile.name}</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Ready for tiling
                </span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-subtle">
            <h3 className="text-base font-bold text-surface-900 mb-2 flex items-center gap-2">
              <Printer className="w-5 h-5 text-surface-600" />
              <span>Print Sheet Configurations Ready</span>
            </h3>
            <p className="text-xs text-surface-600 mb-4">
              Pre-calculated tiling layouts will automatically space photos with millimeter precision and optional cutting borders.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-surface-200 bg-surface-50">
                <span className="font-bold text-surface-900 block mb-1">A4 Sheet</span>
                <span className="text-surface-600 block">Up to 30 photos</span>
                <span className="text-surface-400 text-[11px] block mt-1">210 × 297 mm</span>
              </div>
              <div className="p-4 rounded-xl border border-surface-200 bg-surface-50">
                <span className="font-bold text-surface-900 block mb-1">4 × 6 Inch (10×15 cm)</span>
                <span className="text-surface-600 block">Up to 8 photos</span>
                <span className="text-surface-400 text-[11px] block mt-1">Standard photo lab paper</span>
              </div>
              <div className="p-4 rounded-xl border border-surface-200 bg-surface-50">
                <span className="font-bold text-surface-900 block mb-1">5 × 7 Inch</span>
                <span className="text-surface-600 block">Up to 12 photos</span>
                <span className="text-surface-400 text-[11px] block mt-1">Studio portrait paper</span>
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
              <h4 className="text-sm font-bold">Local PDF Assembly</h4>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              PDF generation executes via `pdf-lib` in your browser. Print layout bytes are produced locally without remote API roundtrips.
            </p>
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
}
