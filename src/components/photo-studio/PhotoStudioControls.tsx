"use client";

import React, { useRef } from "react";
import {
  RefreshCw,
  Trash2,
  RotateCcw,
  Upload,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface PhotoStudioControlsProps {
  onReplaceFile: (file: File) => void;
  onRemovePhoto: () => void;
  onResetWorkspace: () => void;
  fileName?: string;
  className?: string;
  disabled?: boolean;
}

export const PhotoStudioControls: React.FC<PhotoStudioControlsProps> = ({
  onReplaceFile,
  onRemovePhoto,
  onResetWorkspace,
  fileName,
  className,
  disabled = false,
}) => {
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onReplaceFile(e.target.files[0]);
      e.target.value = ""; // Reset input so same file can be re-selected if desired
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-surface-200 shadow-card",
        className
      )}
    >
      {/* Hidden file input for replacing current photo */}
      <input
        ref={replaceInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Replace current photo"
      />

      {/* Left: Active File Status Badge & Filename */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shrink-0">
          <CheckCircle className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-surface-900 truncate max-w-[220px] sm:max-w-xs">
              {fileName || "Photo Loaded"}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              In Memory
            </span>
          </div>
          <p className="text-[11px] text-surface-500 truncate mt-0.5">
            Decoded with EXIF orientation • Master fidelity preserved
          </p>
        </div>
      </div>

      {/* Right: Action Buttons (Replace, Reset Workspace, Remove) */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        {/* Replace Photo Button */}
        <button
          type="button"
          onClick={() => replaceInputRef.current?.click()}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-surface-700 bg-surface-100 hover:bg-surface-200 active:bg-surface-300 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
          title="Choose a different photo to replace current image"
          aria-label="Replace photo"
        >
          <Upload className="w-3.5 h-3.5 text-surface-500" />
          <span>Replace Photo</span>
        </button>

        {/* Reset Workspace Button */}
        <button
          type="button"
          onClick={onResetWorkspace}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-surface-700 bg-surface-100 hover:bg-surface-200 active:bg-surface-300 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
          title="Reset zoom, pan, and preview viewport"
          aria-label="Reset workspace"
        >
          <RotateCcw className="w-3.5 h-3.5 text-surface-500" />
          <span>Reset Workspace</span>
        </button>

        {/* Remove Photo Button */}
        <button
          type="button"
          onClick={onRemovePhoto}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200/80 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
          title="Remove photo and clear workspace memory"
          aria-label="Remove photo"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
          <span>Remove Photo</span>
        </button>
      </div>
    </div>
  );
};
