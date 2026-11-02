"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { TOOLS } from "@/constants/tools";
import {
  Grid3x3,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Layers,
  Camera,
  Download,
} from "lucide-react";
import type { UploadedPhoto, MultiplePhotoConfig } from "@/types/multiple-photo";
import {
  createDefaultMultiplePhotoConfig,
  calculateMultiPhotoArrangement,
} from "@/lib/multiple-photo/multiple-photo-engine";
import { calculatePhotoSheetLayout } from "@/lib/photo-studio/sheet-calculator";
import { revokeObjectUrlSafely } from "@/lib/utils/memory";
import { MultiPhotoDropzone } from "@/components/multiple-photo-maker/MultiPhotoDropzone";
import { UploadedPhotoGallery } from "@/components/multiple-photo-maker/UploadedPhotoGallery";
import { MultiplePhotoDimensionsPanel } from "@/components/multiple-photo-maker/MultiplePhotoDimensionsPanel";
import { MultiplePhotoSheetControls } from "@/components/multiple-photo-maker/MultiplePhotoSheetControls";
import { MultiplePhotoPreviewPanel } from "@/components/multiple-photo-maker/MultiplePhotoPreviewPanel";

export default function MultiplePhotoMakerPage() {
  const tool = TOOLS.find((t) => t.id === "multiple-photo-maker")!;

  // 1. Uploaded photographs state
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const photosRef = useRef<UploadedPhoto[]>([]);
  photosRef.current = photos;

  // 2. Sheet layout & dimensions configuration state
  const [config, setConfig] = useState<MultiplePhotoConfig>(() =>
    createDefaultMultiplePhotoConfig("a4")
  );

  // 3. Calculated multi-photo sheet arrangement
  const arrangement = useMemo(() => {
    return calculateMultiPhotoArrangement(photos, config, calculatePhotoSheetLayout);
  }, [photos, config]);

  // Clean up object URLs on component unmount
  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => {
        revokeObjectUrlSafely(p.previewUrl);
      });
    };
  }, []);

  // Add more photos without removing existing ones
  const handlePhotosAdded = useCallback((newPhotos: UploadedPhoto[]) => {
    setPhotos((prev) => [...prev, ...newPhotos]);
  }, []);

  // Clear all photos and safely release memory
  const handleClearAll = useCallback(() => {
    photos.forEach((p) => {
      revokeObjectUrlSafely(p.previewUrl);
    });
    setPhotos([]);
  }, [photos]);

  return (
    <ModuleLayout tool={tool}>
      <div className="space-y-8">
        {/* Phase 03F Header Feature Callout Banner */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-brand-50 via-emerald-50 to-teal-50 border border-brand-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Grid3x3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-surface-900">
                  Multiple Photo Maker — Phase 03F Active
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  100% In-Browser
                </span>
              </div>
              <p className="text-xs text-surface-600 mt-0.5 max-w-2xl">
                Upload multiple photographs, configure physical dimensions and DPI, and arrange them seamlessly on A4 or 4×6″ sheets with top-aligned grid math, maximum 4 photos per row, and print-ready PDF export.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/tools/photo-studio"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-surface-50 border border-surface-200 text-surface-700 text-xs font-semibold transition-all shadow-xs"
            >
              <Camera className="w-3.5 h-3.5 text-brand-600" />
              <span>Single Photo Studio</span>
            </Link>
          </div>
        </div>

        {/* Responsive Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Photo Upload, Gallery, Dimensions & Sheet Controls */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Multi-Photo Upload Dropzone */}
            <div className="bg-white rounded-3xl border border-surface-200 p-5 sm:p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-surface-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                    <Grid3x3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-surface-900">
                      Step 1: Upload Photographs
                    </h3>
                    <p className="text-xs text-surface-500">
                      Add one or more JPG, PNG, or WebP portrait photos.
                    </p>
                  </div>
                </div>
                {photos.length > 0 && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                    {photos.length} {photos.length === 1 ? "Photo" : "Photos"}
                  </span>
                )}
              </div>

              <MultiPhotoDropzone
                onPhotosAdded={handlePhotosAdded}
                defaultCopies={config.defaultCopiesPerPhoto}
              />
            </div>

            {/* 2. Uploaded Photos Gallery (if photos exist) */}
            {photos.length > 0 && (
              <UploadedPhotoGallery
                photos={photos}
                onPhotosChange={setPhotos}
                onClearAll={handleClearAll}
                onPhotosAdded={handlePhotosAdded}
                defaultCopies={config.defaultCopiesPerPhoto}
              />
            )}

            {/* 3. Photo Dimensions & DPI Settings */}
            <MultiplePhotoDimensionsPanel
              dimensions={config.dimensions}
              dpi={config.dpi}
              onDimensionsChange={(updater) =>
                setConfig((prev) => ({
                  ...prev,
                  dimensions: updater(prev.dimensions),
                }))
              }
              onDpiChange={(newDpi) =>
                setConfig((prev) => ({
                  ...prev,
                  dpi: newDpi,
                }))
              }
            />

            {/* 4. Sheet Layout, Paper Size & Margins */}
            <MultiplePhotoSheetControls
              config={config}
              onConfigChange={setConfig}
            />
          </div>

          {/* Right Column: Live Sheet Preview & Export (Sticky on Desktop) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
            {/* Live Sheet Preview Panel */}
            <MultiplePhotoPreviewPanel
              photos={photos}
              config={config}
              arrangement={arrangement}
            />

            {/* Local Security & Privacy Assurance Card */}
            <div className="bg-emerald-50 rounded-3xl border border-emerald-200/90 p-5 sm:p-6 text-emerald-950 space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <h4 className="text-sm font-bold">100% In-Browser Privacy Invariant</h4>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                All image decoding, aspect-ratio safe center-cropping, canvas rasterization, and PDF synthesis occur strictly inside your device&apos;s browser memory. Zero bytes are uploaded to remote servers or cloud storage.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
}
