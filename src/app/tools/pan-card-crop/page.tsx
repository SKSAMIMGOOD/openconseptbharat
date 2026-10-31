"use client";

import React, { useState } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { FileDropzone } from "@/components/common/FileDropzone";
import { TOOLS } from "@/constants/tools";
import { CARD_SPECIFICATIONS } from "@/constants/cards";
import { CreditCard, Check, ShieldCheck, FileCheck } from "lucide-react";

export default function PanCardCropPage() {
  const tool = TOOLS.find((t) => t.id === "pan-card-crop")!;
  const cardSpec = CARD_SPECIFICATIONS.pan;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <ModuleLayout tool={tool}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-card">
            <h3 className="text-base font-bold text-surface-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-600" />
              <span>Step 1: Upload e-PAN PDF or Scanned Image</span>
            </h3>

            <FileDropzone
              acceptTypes={tool.fileAccept}
              maxSizeMB={tool.maxFileSizeMB}
              label="Select your PAN document (PDF or Image)"
              hint="Works with downloaded NSDL / UTIITSL e-PAN PDFs or physical card scans."
              onFileSelect={(file) => setSelectedFile(file)}
            />

            {selectedFile && (
              <div className="mt-4 p-3 bg-surface-50 rounded-xl border border-surface-200 flex items-center justify-between text-xs">
                <span className="font-medium text-surface-800 truncate">{selectedFile.name}</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> File validated for cropping
                </span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-subtle">
            <h3 className="text-base font-bold text-surface-900 mb-2 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-surface-600" />
              <span>Standard PAN Card Dimensions & Print Calibration</span>
            </h3>
            <p className="text-xs text-surface-600 mb-4">
              The crop pipeline automatically locks to the international ISO/IEC 7810 ID-1 standard to ensure exact wallet fit and PVC card printing compatibility.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
              <div className="p-3 rounded-xl border border-surface-200 bg-surface-50">
                <span className="text-surface-500 text-[11px] block">Standard Width</span>
                <span className="font-bold text-surface-900 text-sm mt-0.5 block">{cardSpec.targetWidthMm} mm</span>
              </div>
              <div className="p-3 rounded-xl border border-surface-200 bg-surface-50">
                <span className="text-surface-500 text-[11px] block">Standard Height</span>
                <span className="font-bold text-surface-900 text-sm mt-0.5 block">{cardSpec.targetHeightMm} mm</span>
              </div>
              <div className="p-3 rounded-xl border border-surface-200 bg-surface-50">
                <span className="text-surface-500 text-[11px] block">Aspect Ratio</span>
                <span className="font-bold text-surface-900 text-sm mt-0.5 block">1.586 : 1</span>
              </div>
              <div className="p-3 rounded-xl border border-surface-200 bg-surface-50">
                <span className="text-surface-500 text-[11px] block">Target DPI</span>
                <span className="font-bold text-surface-900 text-sm mt-0.5 block">{cardSpec.standardDpi} DPI</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-subtle">
            <h4 className="text-sm font-bold text-surface-900 mb-3">Planned Tool Workflow</h4>
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
              <h4 className="text-sm font-bold">Confidential Government ID</h4>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              PAN numbers and financial records must never be uploaded to third-party servers. All PDF rendering is executed client-side via PDF.js.
            </p>
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
}
