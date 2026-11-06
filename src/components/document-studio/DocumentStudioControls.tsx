"use client";

import React from "react";
import {
  DocumentTypeId,
  CustomSidesMode,
  DocumentStudioState,
} from "@/types/document-studio";
import { DocumentTypeSelector } from "./DocumentTypeSelector";
import { getDocumentTypeDefinition, isSideActive } from "@/constants/document-studio";
import { cn } from "@/lib/utils/cn";
import {
  ShieldCheck,
  Lock,
  Layers,
  Trash2,
  Cpu,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";

export interface DocumentStudioControlsProps {
  state: DocumentStudioState;
  onSelectType: (id: DocumentTypeId) => void;
  onSelectCustomSides: (mode: CustomSidesMode) => void;
  onClearAll: () => void;
  hideTypeSelector?: boolean;
  className?: string;
}

export const DocumentStudioControls: React.FC<DocumentStudioControlsProps> = ({
  state,
  onSelectType,
  onSelectCustomSides,
  onClearAll,
  hideTypeSelector = false,
  className,
}) => {
  const docDef = getDocumentTypeDefinition(state.selectedDocType);
  const frontActive = isSideActive("front", docDef, state.customSidesMode);
  const backActive = isSideActive("back", docDef, state.customSidesMode);

  const hasSourceFile = Boolean(state.source.file && state.source.previewUrl);
  const frontCropped = state.front.isCropped;
  const backCropped = state.back.isCropped;

  return (
    <div className={cn("space-y-6", className)}>
      {/* 1. Document Type Selector */}
      {!hideTypeSelector && (
        <div className="bg-white dark:bg-surface-800/90 rounded-2xl border border-surface-200 dark:border-surface-700/80 p-5 shadow-subtle">
          <DocumentTypeSelector
            selectedType={state.selectedDocType}
            customSidesMode={state.customSidesMode}
            onSelectType={onSelectType}
            onSelectCustomSides={onSelectCustomSides}
          />
        </div>
      )}

      {/* 2. Document Specifications Card */}
      <div className="bg-white dark:bg-surface-800/90 rounded-2xl border border-surface-200 dark:border-surface-700/80 p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400">
            Document Specifications
          </h4>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/50">
            {docDef.badge}
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          {/* Target Dimensions */}
          {docDef.targetDimensions ? (
            <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200/80 dark:border-surface-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400 block">
                Standard Form Factor
              </span>
              <span className="font-bold text-surface-900 dark:text-surface-100 block mt-0.5 text-xs">
                {docDef.targetDimensions.widthMm.toFixed(2)} mm ×{" "}
                {docDef.targetDimensions.heightMm.toFixed(2)} mm
              </span>
              <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-1 leading-relaxed">
                {docDef.targetDimensions.note}
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200/80 dark:border-surface-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400 block">
                Dimensions
              </span>
              <p className="text-[11px] text-surface-600 dark:text-surface-300 mt-0.5">
                Custom document format. Aspect ratio and cropping dimensions adjust to your selection.
              </p>
            </div>
          )}

          {/* Active Sides Status */}
          <div className="pt-2 border-t border-surface-100 dark:border-surface-700/60 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400 block">
              Output Separation Status
            </span>

            {frontActive && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-50 dark:bg-surface-800 text-[11px]">
                <span className="font-medium text-surface-700 dark:text-surface-300">
                  Front Side
                </span>
                {frontCropped ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Cropped & Ready
                  </span>
                ) : hasSourceFile ? (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Adjusting crop
                  </span>
                ) : (
                  <span className="text-surface-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Awaiting upload
                  </span>
                )}
              </div>
            )}

            {backActive && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-50 dark:bg-surface-800 text-[11px]">
                <span className="font-medium text-surface-700 dark:text-surface-300">
                  Back Side
                </span>
                {backCropped ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Cropped & Ready
                  </span>
                ) : hasSourceFile ? (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Adjusting crop
                  </span>
                ) : (
                  <span className="text-surface-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Awaiting upload
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Clear All button */}
        {hasSourceFile && (
          <button
            type="button"
            onClick={onClearAll}
            className="w-full py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Document & Crops</span>
          </button>
        )}
      </div>

      {/* 3. Privacy Guarantee */}
      <div className="bg-surface-50 dark:bg-surface-800/60 rounded-2xl border border-surface-200 dark:border-surface-700/70 p-4 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Privacy & Security Guarantee</span>
        </div>
        <p className="text-[11px] text-surface-500 dark:text-surface-400 leading-relaxed">
          Uploaded documents are processed strictly in your device&apos;s browser memory. Zero bytes uploaded to any remote server or third-party API.
        </p>
        <div className="pt-2 flex items-center gap-3 text-[10px] text-surface-400 font-mono">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-600" /> Local Only
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-brand-600" /> Canvas / PDF.js
          </span>
        </div>
      </div>
    </div>
  );
};
