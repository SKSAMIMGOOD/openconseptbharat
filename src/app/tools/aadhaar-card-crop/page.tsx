"use client";

import React, { useState } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { FileDropzone } from "@/components/common/FileDropzone";
import { TOOLS } from "@/constants/tools";
import { CARD_SPECIFICATIONS } from "@/constants/cards";
import { Fingerprint, Check, ShieldCheck, Lock } from "lucide-react";

export default function AadhaarCardCropPage() {
  const tool = TOOLS.find((t) => t.id === "aadhaar-card-crop")!;
  const cardSpec = CARD_SPECIFICATIONS.aadhaar;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <ModuleLayout tool={tool}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-card">
            <h3 className="text-base font-bold text-surface-900 mb-4 flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-brand-600" />
              <span>Step 1: Upload e-Aadhaar PDF or Scan</span>
            </h3>

            <FileDropzone
              acceptTypes={tool.fileAccept}
              maxSizeMB={tool.maxFileSizeMB}
              label="Select your e-Aadhaar PDF or scan"
              hint="Supports standard UIDAI password-protected PDFs and scanned image files."
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
              <Lock className="w-5 h-5 text-surface-600" />
              <span>Password Decryption Architecture</span>
            </h3>
            <p className="text-xs text-surface-600 mb-4">
              e-Aadhaar PDFs are protected by a password (first 4 letters of name in CAPITAL + year of birth). In Phase 01, password prompts and decryption are handled entirely inside the browser&apos;s PDF.js worker. Your password and identity data never cross the network.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-surface-200 bg-surface-50">
                <span className="text-surface-500 text-[11px] block">Front Side</span>
                <span className="font-semibold text-surface-900 block mt-0.5">Photo + Aadhaar No</span>
              </div>
              <div className="p-3 rounded-xl border border-surface-200 bg-surface-50">
                <span className="text-surface-500 text-[11px] block">Back Side</span>
                <span className="font-semibold text-surface-900 block mt-0.5">Address + QR Code</span>
              </div>
              <div className="p-3 rounded-xl border border-surface-200 bg-surface-50">
                <span className="text-surface-500 text-[11px] block">Print Layout</span>
                <span className="font-semibold text-surface-900 block mt-0.5">Dual-Side Wallet Standard</span>
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
              <h4 className="text-sm font-bold">UIDAI Privacy Compliance</h4>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              UIDAI Aadhaar data carries strict legal privacy protections. Our client-only architecture guarantees that no biometric or demographic data is stored or logged.
            </p>
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
}
