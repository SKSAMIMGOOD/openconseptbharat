"use client";

import React, { useRef } from "react";
import {
  Sparkles,
  Cpu,
  DownloadCloud,
  CheckCircle2,
  HardDrive,
  FolderOpen,
  Info,
  Layers,
  Loader2,
} from "lucide-react";
import { ModelDefinition, ModelLoadingProgress, InferenceProgress } from "@/types/background-remover";
import { AVAILABLE_MODELS } from "@/constants/background-remover";
import { cn } from "@/lib/utils/cn";

export interface ModelSettingsCardProps {
  selectedModel: ModelDefinition;
  isModelCached: boolean;
  isModelLoaded: boolean;
  modelProgress: ModelLoadingProgress;
  isInferring: boolean;
  inferenceProgress: InferenceProgress;
  hasImage: boolean;
  onSelectModel: (model: ModelDefinition) => void;
  onUploadCustomModel: (file: File) => Promise<void>;
  onRunRemoval: () => Promise<void>;
}

export const ModelSettingsCard: React.FC<ModelSettingsCardProps> = ({
  selectedModel,
  isModelCached,
  isModelLoaded,
  modelProgress,
  isInferring,
  inferenceProgress,
  hasImage,
  onSelectModel,
  onUploadCustomModel,
  onRunRemoval,
}) => {
  const customFileInputRef = useRef<HTMLInputElement>(null);

  const handleCustomFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await onUploadCustomModel(e.target.files[0]);
    }
    e.target.value = "";
  };

  const isDownloading = modelProgress.phase === "downloading" || modelProgress.phase === "checking_cache";
  const isCompiling = modelProgress.phase === "compiling";
  const isBusy = isDownloading || isCompiling || isInferring;

  return (
    <div className="bg-white rounded-2xl border border-surface-200 p-5 sm:p-6 shadow-card space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-brand-600" />
          <span>AI Segmentation Model</span>
        </h3>
        <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 border border-brand-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
          ONNX Runtime Web
        </span>
      </div>

      {/* Model Selection Buttons */}
      <div className="space-y-2.5">
        {AVAILABLE_MODELS.map((model) => {
          const isSelected = selectedModel.id === model.id;
          return (
            <button
              key={model.id}
              type="button"
              disabled={isBusy}
              onClick={() => onSelectModel(model)}
              className={cn(
                "w-full text-left p-3.5 rounded-xl border transition-all text-xs flex flex-col gap-1.5",
                isSelected
                  ? "border-brand-500 bg-brand-50/40 shadow-sm ring-1 ring-brand-500/30"
                  : "border-surface-200 bg-surface-50/50 hover:bg-surface-100 hover:border-surface-300",
                isBusy && "opacity-60 cursor-not-allowed"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-surface-900">{model.name}</span>
                  {model.recommended && (
                    <span className="text-[10px] font-semibold bg-brand-100 text-brand-800 px-1.5 py-0.2 rounded-full">
                      Recommended
                    </span>
                  )}
                </div>
                <span className="font-mono text-[11px] text-surface-500 font-semibold">
                  ~{model.sizeMB} MB
                </span>
              </div>

              <p className="text-[11px] text-surface-600 leading-relaxed">
                {model.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Pretrained Weights Transparency Advisory */}
      <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 text-xs space-y-2">
        <div className="flex items-start gap-2 text-surface-700">
          <Info className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-surface-900 text-[11px]">
              Pretrained Weights Source: <span className="font-mono text-brand-700">{selectedModel.source}</span>
            </p>
            <p className="text-[11px] text-surface-500 leading-normal">
              Inference runs 100% locally on your device via WebAssembly/WebGPU. No image is transmitted. Weights are saved in browser cache for future offline usage.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-surface-200 flex items-center justify-between text-[11px]">
          <span className="text-surface-600 flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5 text-surface-400" />
            Storage Status:
          </span>
          {isModelCached ? (
            <span className="font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Cached Locally (0 KB Download)
            </span>
          ) : (
            <span className="font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
              <DownloadCloud className="w-3 h-3 text-amber-600" />
              Download Needed (~{selectedModel.sizeMB} MB)
            </span>
          )}
        </div>
      </div>

      {/* Custom Local ONNX Option */}
      <div>
        <input
          ref={customFileInputRef}
          type="file"
          accept=".onnx"
          className="hidden"
          disabled={isBusy}
          onChange={handleCustomFileChange}
        />
        <button
          type="button"
          disabled={isBusy}
          onClick={() => customFileInputRef.current?.click()}
          className="w-full text-center py-2 px-3 rounded-xl border border-dashed border-surface-300 text-surface-600 hover:text-surface-900 hover:border-surface-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Load Custom / Offline .onnx Model
        </button>
      </div>

      {/* Progress Bars (Download or Inference) */}
      {(isDownloading || isCompiling) && (
        <div className="p-3.5 rounded-xl bg-brand-50/70 border border-brand-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-brand-900 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
              {modelProgress.message}
            </span>
            <span className="font-mono font-bold text-brand-700">
              {modelProgress.percent}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-brand-100 overflow-hidden">
            <div
              className="h-full bg-brand-600 transition-all duration-200 rounded-full"
              style={{ width: `${Math.max(5, modelProgress.percent)}%` }}
            />
          </div>
        </div>
      )}

      {isInferring && (
        <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-purple-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-purple-600" />
              {inferenceProgress.message || "Running neural network..."}
            </span>
            <span className="font-mono font-bold text-purple-700">
              {inferenceProgress.percent}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-purple-100 overflow-hidden">
            <div
              className="h-full bg-purple-600 transition-all duration-200 rounded-full"
              style={{ width: `${Math.max(10, inferenceProgress.percent)}%` }}
            />
          </div>
        </div>
      )}

      {/* Primary Action Button */}
      <button
        type="button"
        disabled={!hasImage || isBusy}
        onClick={onRunRemoval}
        className={cn(
          "w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-sm transition-all flex items-center justify-center gap-2",
          !hasImage || isBusy
            ? "bg-surface-300 cursor-not-allowed"
            : "bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 shadow-brand-500/20 active:scale-[0.99]"
        )}
      >
        {isBusy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing In Browser...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Remove Background with AI</span>
          </>
        )}
      </button>
    </div>
  );
};
