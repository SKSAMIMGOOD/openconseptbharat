"use client";

import React, { useEffect, useState } from "react";
import type { PdfPasswordPromptState } from "@/types/document-studio";
import { cn } from "@/lib/utils/cn";
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Loader2,
  X,
  FileText,
} from "lucide-react";

export interface PdfPasswordPromptProps {
  promptState: PdfPasswordPromptState;
  onUnlock: (password: string) => Promise<boolean>;
  onCancel: () => void;
  className?: string;
}

export const PdfPasswordPrompt: React.FC<PdfPasswordPromptProps> = ({
  promptState,
  onUnlock,
  onCancel,
  className,
}) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isVerifying = promptState.status === "verifying";
  const displayError = validationError ?? promptState.error;

  // Clear temporary password input whenever a new file/session replaces the current one
  useEffect(() => {
    setPassword("");
    setShowPassword(false);
    setValidationError(null);
  }, [promptState.sessionId]);

  // Clear temporary password state on unmount
  useEffect(() => {
    return () => {
      setPassword("");
      setShowPassword(false);
      setValidationError(null);
    };
  }, []);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isVerifying) return;

    if (!password || password.trim().length === 0) {
      setValidationError("Please enter the PDF password.");
      return;
    }

    setValidationError(null);
    const unlocked = await onUnlock(password);
    if (unlocked) {
      setPassword("");
      setShowPassword(false);
      setValidationError(null);
    }
  };

  const handleCancel = () => {
    if (isVerifying) return;
    setPassword("");
    setShowPassword(false);
    setValidationError(null);
    onCancel();
  };

  return (
    <div
      role="region"
      aria-label="PDF password unlock"
      className={cn(
        "w-full bg-white dark:bg-surface-800/90 rounded-2xl border border-surface-200 dark:border-surface-700/80 p-5 shadow-subtle space-y-4",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200/70 dark:border-brand-800/50 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h4 className="text-sm sm:text-base font-bold text-surface-900 dark:text-surface-100 tracking-tight">
              Password-Protected PDF Detected
            </h4>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
              This document requires a password before it can be processed.
            </p>
            {promptState.fileName && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200/80 dark:border-surface-700 text-[11px] text-surface-600 dark:text-surface-300 max-w-full">
                <FileText className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                <span className="font-medium truncate max-w-[220px] sm:max-w-[320px]">
                  {promptState.fileName}
                </span>
                {promptState.fileSizeFormatted && (
                  <>
                    <span className="text-surface-400">•</span>
                    <span className="shrink-0 text-surface-500 dark:text-surface-400">
                      {promptState.fileSizeFormatted}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleCancel}
          disabled={isVerifying}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-700/70 transition-colors shrink-0 disabled:opacity-50"
          aria-label="Remove uploaded PDF"
          title="Remove uploaded PDF"
        >
          <X className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Remove</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter PDF password"
              aria-label="Enter PDF password"
              aria-invalid={Boolean(displayError)}
              autoComplete="off"
              spellCheck={false}
              disabled={isVerifying}
              className={cn(
                "w-full rounded-xl border bg-surface-50/70 dark:bg-surface-900/70 pl-3.5 pr-10 py-2.5 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 transition-colors disabled:opacity-60",
                displayError
                  ? "border-rose-400 dark:border-rose-600 focus:ring-rose-500/30"
                  : "border-surface-300 dark:border-surface-600 focus:border-brand-500 focus:ring-brand-500/20"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isVerifying}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-surface-500 hover:text-surface-800 dark:text-surface-400 dark:hover:text-surface-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            aria-busy={isVerifying}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Unlocking...</span>
              </>
            ) : (
              <span>Unlock & Continue</span>
            )}
          </button>
        </div>

        {displayError && (
          <div
            role="alert"
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800/70 bg-rose-50/80 dark:bg-rose-950/30 text-xs text-rose-700 dark:text-rose-300"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{displayError}</span>
          </div>
        )}
      </form>

      <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium pt-0.5">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        <span>Your password and document stay in your browser.</span>
      </div>
    </div>
  );
};
