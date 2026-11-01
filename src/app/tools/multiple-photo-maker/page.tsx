"use client";

import React, { useState } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { FileDropzone } from "@/components/common/FileDropzone";
import { TOOLS } from "@/constants/tools";
import { Grid3x3, Check, Printer, ShieldCheck, FileSpreadsheet, Sliders } from "lucide-react";

export default function MultiplePhotoMakerPage() {
  const tool = TOOLS.find((t) => t.id === "multiple-photo-maker")!;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<"a4" | "4x6" | "5x7">("a4");
  const [withCutLines, setWithCutLines] = useState(true);

  return (
    <ModuleLayout tool={tool}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Workspace: Upload & Sheet Staging */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-card">
            <h3 className="text-base font-bold text-surface-900 mb-4 flex items-center gap-2">
              <Grid3x3 className="w-5 h-5 text-brand-600" />
              <span>Step 1: Choose Master Passport Photo</span>
            </h3>

            <FileDropzone
              acceptTypes={tool.fileAccept}
              maxSizeMB={tool.maxFileSizeMB}
              label="Select your cropped passport photo"
              hint="High-resolution JPG, PNG, or WebP portrait. We will auto-tile it across your selected print sheet."
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
                  Ready to Tile
                </span>
              </div>
            )}
          </div>

          {/* Sheet Layout Staging Configuration */}
          <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-subtle">
            <h3 className="text-base font-bold text-surface-900 mb-2 flex items-center gap-2">
              <Printer className="w-5 h-5 text-surface-600" />
              <span>Step 2: Print Sheet Staging & Layout Preset</span>
            </h3>
            <p className="text-xs text-surface-600 mb-6 leading-relaxed">
              Configure your paper dimensions, tile counts, and cutting border guides. In Phase 02, this workspace will render the calibrated 1:1 vector PDF sheet preview in real-time.
            </p>

            {/* Paper Size Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setSelectedPaper("a4")}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedPaper === "a4"
                    ? "border-brand-500 bg-brand-50/50 shadow-sm ring-1 ring-brand-500"
                    : "border-surface-200 hover:border-surface-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-surface-900">A4 Standard</span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-100 text-surface-600">
                    30-Up
                  </span>
                </div>
                <span className="text-xs text-surface-500 block">210 × 297 mm</span>
                <span className="text-[11px] text-brand-700 font-medium block mt-1.5">
                  Best for bulk printing
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPaper("4x6")}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedPaper === "4x6"
                    ? "border-brand-500 bg-brand-50/50 shadow-sm ring-1 ring-brand-500"
                    : "border-surface-200 hover:border-surface-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-surface-900">4 × 6 Inch</span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-100 text-surface-600">
                    8-Up
                  </span>
                </div>
                <span className="text-xs text-surface-500 block">102 × 152 mm (10×15 cm)</span>
                <span className="text-[11px] text-brand-700 font-medium block mt-1.5">
                  Standard photo lab paper
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPaper("5x7")}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedPaper === "5x7"
                    ? "border-brand-500 bg-brand-50/50 shadow-sm ring-1 ring-brand-500"
                    : "border-surface-200 hover:border-surface-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-surface-900">5 × 7 Inch</span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-100 text-surface-600">
                    12-Up
                  </span>
                </div>
                <span className="text-xs text-surface-500 block">127 × 178 mm</span>
                <span className="text-[11px] text-brand-700 font-medium block mt-1.5">
                  Studio portrait paper
                </span>
              </button>
            </div>

            {/* Print Options */}
            <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cut-lines"
                  checked={withCutLines}
                  onChange={(e) => setWithCutLines(e.target.checked)}
                  className="rounded border-surface-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <label htmlFor="cut-lines" className="font-medium text-surface-800 cursor-pointer">
                  Include cutting guide lines (0.25 pt light dashed rules)
                </label>
              </div>
              <span className="text-surface-500 font-mono">DPI: 300 / 600 Calibrated</span>
            </div>
          </div>
        </div>

        {/* Sidebar Controls & Specifications */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-subtle">
            <h4 className="text-sm font-bold text-surface-900 mb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-brand-600" />
              <span>Sheet Layout Capabilities</span>
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

          <div className="bg-emerald-50 rounded-2xl border border-emerald-200/80 p-6 text-emerald-950">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm font-bold">Local PDF Assembly</h4>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              PDF generation executes via `pdf-lib` entirely in your browser. Print layout bytes are produced locally without remote API roundtrips.
            </p>
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
}
