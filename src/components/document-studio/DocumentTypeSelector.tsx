"use client";

import React from "react";
import {
  DocumentTypeId,
  CustomSidesMode,
  DocumentTypeDefinition,
} from "@/types/document-studio";
import { DOCUMENT_TYPES } from "@/constants/document-studio";
import { cn } from "@/lib/utils/cn";
import {
  Fingerprint,
  CreditCard,
  Award,
  FileCheck,
  FileText,
  CheckCircle2,
  Layers,
} from "lucide-react";

export interface DocumentTypeSelectorProps {
  selectedType: DocumentTypeId;
  customSidesMode: CustomSidesMode;
  onSelectType: (id: DocumentTypeId) => void;
  onSelectCustomSides: (mode: CustomSidesMode) => void;
  className?: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Fingerprint,
  CreditCard,
  Award,
  FileCheck,
  FileText,
};

export const DocumentTypeSelector: React.FC<DocumentTypeSelectorProps> = ({
  selectedType,
  customSidesMode,
  onSelectType,
  onSelectCustomSides,
  className,
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-surface-600 dark:text-surface-400">
          Select Document Type
        </label>
        <span className="text-[11px] text-surface-400 font-medium">
          5 Configured Presets
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
        {DOCUMENT_TYPES.map((doc: DocumentTypeDefinition) => {
          const isSelected = doc.id === selectedType;
          const Icon = ICON_MAP[doc.iconName] || FileText;

          let sidesLabel = "Front & Back";
          if (doc.allowsSideSelection) {
            sidesLabel =
              customSidesMode === "front-only"
                ? "Front Only"
                : customSidesMode === "back-only"
                ? "Back Only"
                : "Front & Back";
          }

          return (
            <button
              key={doc.id}
              type="button"
              onClick={() => onSelectType(doc.id)}
              className={cn(
                "group relative w-full text-left p-3.5 rounded-xl border transition-all text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                isSelected
                  ? "bg-brand-50/80 dark:bg-brand-950/40 border-brand-500 shadow-sm ring-1 ring-brand-500/20"
                  : "bg-white dark:bg-surface-800/80 border-surface-200 dark:border-surface-700/80 hover:border-surface-300 dark:hover:border-surface-600 hover:bg-surface-50/80 dark:hover:bg-surface-800"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors mt-0.5",
                      isSelected
                        ? "bg-brand-600 text-white shadow-sm"
                        : "bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 group-hover:text-surface-900 dark:group-hover:text-surface-100"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-surface-900 dark:text-surface-100">
                        {doc.name}
                      </span>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide",
                          isSelected
                            ? "bg-brand-200/60 dark:bg-brand-800/60 text-brand-900 dark:text-brand-200"
                            : "bg-surface-100 dark:bg-surface-700/60 text-surface-600 dark:text-surface-400"
                        )}
                      >
                        {sidesLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-1">
                      {doc.description}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Side selection controls for Custom Document */}
      {selectedType === "custom" && (
        <div className="p-3.5 bg-brand-50/50 dark:bg-surface-800/90 rounded-xl border border-brand-200/70 dark:border-surface-700 space-y-2 mt-3 animate-fade-in">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-surface-800 dark:text-surface-200">
            <Layers className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Custom Document Sides</span>
          </div>
          <p className="text-[11px] text-surface-500 dark:text-surface-400">
            Choose which side(s) of the custom document you want to process:
          </p>

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => onSelectCustomSides("both")}
              className={cn(
                "py-1.5 px-2 rounded-lg text-[11px] font-semibold border text-center transition-colors",
                customSidesMode === "both"
                  ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                  : "bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-600"
              )}
            >
              Front & Back
            </button>

            <button
              type="button"
              onClick={() => onSelectCustomSides("front-only")}
              className={cn(
                "py-1.5 px-2 rounded-lg text-[11px] font-semibold border text-center transition-colors",
                customSidesMode === "front-only"
                  ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                  : "bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-600"
              )}
            >
              Front Only
            </button>

            <button
              type="button"
              onClick={() => onSelectCustomSides("back-only")}
              className={cn(
                "py-1.5 px-2 rounded-lg text-[11px] font-semibold border text-center transition-colors",
                customSidesMode === "back-only"
                  ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                  : "bg-white dark:bg-surface-700 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-600"
              )}
            >
              Back Only
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
