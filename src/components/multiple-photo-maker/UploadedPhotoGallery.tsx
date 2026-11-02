"use client";

import React, { useRef } from "react";
import {
  Trash2,
  Plus,
  Minus,
  Upload,
  Layers,
  Image as ImageIcon,
  Check,
  RefreshCw,
} from "lucide-react";
import type { UploadedPhoto } from "@/types/multiple-photo";
import { revokeObjectUrlSafely } from "@/lib/utils/memory";
import { validateFile, getImageDimensions } from "@/lib/validation/file-validator";
import { createTrackedObjectURL } from "@/lib/utils/memory";
import { cn } from "@/lib/utils/cn";

export interface UploadedPhotoGalleryProps {
  photos: UploadedPhoto[];
  onPhotosChange: (updater: (prev: UploadedPhoto[]) => UploadedPhoto[]) => void;
  onClearAll: () => void;
  onPhotosAdded: (newPhotos: UploadedPhoto[]) => void;
  defaultCopies?: number;
  className?: string;
}

export const UploadedPhotoGallery: React.FC<UploadedPhotoGalleryProps> = ({
  photos,
  onPhotosChange,
  onClearAll,
  onPhotosAdded,
  defaultCopies = 3,
  className,
}) => {
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  const totalCopies = photos.reduce((sum, p) => sum + (p.copies || 0), 0);

  // Update copies for a specific photo
  const handleCopyChange = (id: string, delta: number) => {
    onPhotosChange((prev) =>
      prev.map((photo) => {
        if (photo.id !== id) return photo;
        const newCopies = Math.max(1, Math.min(100, (photo.copies || 1) + delta));
        return { ...photo, copies: newCopies };
      })
    );
  };

  // Direct input change for photo copies
  const handleDirectCopyInput = (id: string, value: number) => {
    const validValue = Math.max(1, Math.min(100, Math.round(value) || 1));
    onPhotosChange((prev) =>
      prev.map((photo) => (photo.id === id ? { ...photo, copies: validValue } : photo))
    );
  };

  // Remove individual photo and safely revoke its object URL
  const handleRemovePhoto = (id: string) => {
    const photoToRemove = photos.find((p) => p.id === id);
    if (photoToRemove?.previewUrl) {
      revokeObjectUrlSafely(photoToRemove.previewUrl);
    }
    onPhotosChange((prev) => prev.filter((p) => p.id !== id));
  };

  // Apply a uniform copy count to all uploaded photos
  const handleApplyCopiesToAll = (count: number) => {
    const validCount = Math.max(1, Math.min(100, count));
    onPhotosChange((prev) => prev.map((p) => ({ ...p, copies: validCount })));
  };

  // Handle adding more photos through the "Add More" button
  const handleAddMoreFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const addedPhotos: UploadedPhoto[] = [];

    for (const file of files) {
      const validation = validateFile(file, {
        maxSizeMB: 20,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      });

      if (!validation.isValid) continue;

      try {
        const dimensions = await getImageDimensions(file);
        const previewUrl = createTrackedObjectURL(file);
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load"));
          img.src = previewUrl;
        });

        addedPhotos.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          file,
          name: file.name,
          size: file.size,
          width: dimensions.width,
          height: dimensions.height,
          aspectRatio: dimensions.aspectRatio,
          previewUrl,
          imageElement: img,
          copies: defaultCopies,
        });
      } catch {
        // Skip invalid files
      }
    }

    if (addedPhotos.length > 0) {
      onPhotosAdded(addedPhotos);
    }

    if (addMoreInputRef.current) {
      addMoreInputRef.current.value = "";
    }
  };

  if (photos.length === 0) {
    return null;
  }

  return (
    <div className={cn("bg-white rounded-3xl border border-surface-200 p-5 sm:p-6 shadow-card space-y-5", className)}>
      {/* Top Header & Bulk Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                <span>Uploaded Photographs</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-100 text-brand-800">
                  {photos.length} {photos.length === 1 ? "Photo" : "Photos"}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-100 text-surface-700">
                  {totalCopies} Total Copies
                </span>
              </h3>
              <p className="text-xs text-surface-500 mt-0.5">
                Configure copies for each photo or set a uniform count for all.
              </p>
            </div>
          </div>
        </div>

        {/* Global Bulk Actions */}
        <div className="flex items-center gap-2">
          {/* Hidden file input for "Add More" */}
          <input
            ref={addMoreInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAddMoreFiles}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => addMoreInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-surface-200 hover:border-brand-300 hover:bg-brand-50/50 text-surface-700 hover:text-brand-700 text-xs font-semibold transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add More</span>
          </button>

          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold transition-all shadow-xs"
            title="Remove all photos from memory"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Bulk Copies Quick Select Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-surface-50 border border-surface-200 text-xs">
        <div className="flex items-center gap-2 text-surface-700 font-medium">
          <Layers className="w-4 h-4 text-brand-600" />
          <span>Quick Set Copies for All Photos:</span>
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 6, 8].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => handleApplyCopiesToAll(count)}
              className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-white border border-surface-200 hover:border-brand-400 hover:bg-brand-50 text-surface-700 hover:text-brand-700 active:scale-95 shadow-2xs"
            >
              {count}× each
            </button>
          ))}
        </div>
      </div>

      {/* Photo Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="group relative flex flex-col justify-between p-3.5 rounded-2xl border border-surface-200 bg-white hover:border-brand-300 hover:shadow-subtle transition-all"
          >
            <div className="flex items-start gap-3">
              {/* Thumbnail Container */}
              <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-surface-100 border border-surface-200 shrink-0 shadow-2xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt={photo.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-surface-900/80 text-white backdrop-blur-xs font-mono">
                  #{index + 1}
                </span>
              </div>

              {/* Photo Metadata */}
              <div className="flex-1 min-w-0 space-y-1">
                <p
                  className="text-xs font-bold text-surface-900 truncate"
                  title={photo.name}
                >
                  {photo.name}
                </p>
                <p className="text-[11px] text-surface-500 font-mono">
                  {photo.width} × {photo.height} px
                </p>
                <p className="text-[11px] text-surface-400">
                  {(photo.size / 1024).toFixed(1)} KB
                </p>
              </div>

              {/* Individual Remove Button */}
              <button
                type="button"
                onClick={() => handleRemovePhoto(photo.id)}
                className="text-surface-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors shrink-0"
                title={`Remove ${photo.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Copies Counter Controls */}
            <div className="mt-3 pt-3 border-t border-surface-100 flex items-center justify-between">
              <span className="text-xs font-medium text-surface-600">
                Print Copies:
              </span>
              <div className="flex items-center gap-1.5 bg-surface-50 border border-surface-200 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => handleCopyChange(photo.id, -1)}
                  disabled={photo.copies <= 1}
                  className="w-6 h-6 rounded-lg bg-white hover:bg-surface-100 disabled:opacity-40 disabled:hover:bg-white text-surface-700 flex items-center justify-center transition-colors shadow-2xs"
                  title="Decrease copies"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={photo.copies}
                  onChange={(e) =>
                    handleDirectCopyInput(photo.id, parseInt(e.target.value, 10))
                  }
                  className="w-10 text-center text-xs font-bold font-mono text-surface-900 bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCopyChange(photo.id, 1)}
                  disabled={photo.copies >= 100}
                  className="w-6 h-6 rounded-lg bg-white hover:bg-surface-100 disabled:opacity-40 disabled:hover:bg-white text-surface-700 flex items-center justify-center transition-colors shadow-2xs"
                  title="Increase copies"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
