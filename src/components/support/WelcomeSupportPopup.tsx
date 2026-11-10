"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Heart, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  SUPPORT_URL,
  SUPPORT_DISMISSAL_STORAGE_KEY,
  SUPPORT_QR_ASSET_PATH,
  SUPPORT_POPUP_CONTENT,
} from "@/constants/support";

export { SUPPORT_DISMISSAL_STORAGE_KEY };

export interface WelcomeSupportPopupProps {
  storageKey?: string;
}

export const WelcomeSupportPopup: React.FC<WelcomeSupportPopupProps> = ({
  storageKey = SUPPORT_DISMISSAL_STORAGE_KEY,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  // Check localStorage on mount to determine if this is the first visit
  useEffect(() => {
    try {
      const dismissed = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
      if (!dismissed) {
        // First visit: trigger popup with a brief non-blocking deferral
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore localStorage access restrictions (e.g. strict private mode)
    }
  }, [storageKey]);

  // Support manual/programmatic reopening (e.g. for testing or explicit user action)
  useEffect(() => {
    const handleCustomOpen = () => {
      setIsOpen(true);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("bus:open-support-popup", handleCustomOpen);
      (window as unknown as { __openSupportPopup?: () => void }).__openSupportPopup = handleCustomOpen;
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("bus:open-support-popup", handleCustomOpen);
        delete (window as unknown as { __openSupportPopup?: () => void }).__openSupportPopup;
      }
    };
  }, []);

  // Manage fade-in animation state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      const raf = requestAnimationFrame(() => setAnimateIn(true));
      document.body.style.overflow = "hidden";
      return () => {
        cancelAnimationFrame(raf);
        document.body.style.overflow = "";
      };
    } else {
      setAnimateIn(false);
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  const handleDismiss = useCallback(() => {
    setAnimateIn(false);
    setTimeout(() => {
      setIsOpen(false);
    }, 200);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, "true");
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [storageKey]);

  // Handle ESC key to dismiss
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleDismiss]);

  const handleHelpUsClick = useCallback(() => {
    handleDismiss();
  }, [handleDismiss]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleDismiss();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-popup-heading"
      aria-describedby="support-popup-message"
      data-testid="welcome-support-popup"
      onClick={handleBackdropClick}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-surface-950/60 backdrop-blur-sm transition-opacity duration-300 no-print",
        animateIn ? "opacity-100" : "opacity-0"
      )}
    >
      <div
        className={cn(
          "relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-800 shadow-2xl p-6 sm:p-7 text-center transition-all duration-300 transform scrollbar-none",
          animateIn ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
        )}
      >
        {/* Close (X) button */}
        <button
          type="button"
          onClick={handleDismiss}
          data-testid="support-popup-close-button"
          aria-label="Close support popup"
          className="absolute top-4 right-4 p-2 rounded-xl text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Friendly Heart Badge Icon */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-50 to-amber-50 dark:from-rose-950/40 dark:to-amber-950/40 border border-rose-200/80 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3.5 shadow-sm">
          <Heart className="w-6 h-6 fill-rose-500/20 text-rose-600 dark:text-rose-400" />
        </div>

        {/* Heading */}
        <h3
          id="support-popup-heading"
          className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-100 tracking-tight"
        >
          {SUPPORT_POPUP_CONTENT.heading}
        </h3>

        {/* Main Message */}
        <p
          id="support-popup-message"
          className="mt-2 text-xs sm:text-sm text-surface-600 dark:text-surface-300 leading-relaxed max-w-sm mx-auto"
        >
          {SUPPORT_POPUP_CONTENT.message}
        </p>

        {/* QR Code in clean white container */}
        <div className="mt-4 flex flex-col items-center">
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-surface-200/90 shadow-sm inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={SUPPORT_QR_ASSET_PATH}
              alt={SUPPORT_POPUP_CONTENT.caption}
              data-testid="support-popup-qr-image"
              className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-lg mx-auto block"
              loading="eager"
            />
          </div>
          <p className="mt-2 text-[11px] font-semibold text-surface-500 dark:text-surface-400 tracking-wide uppercase">
            {SUPPORT_POPUP_CONTENT.caption}
          </p>
        </div>

        {/* Additional Text */}
        <p className="mt-3.5 text-xs text-surface-500 dark:text-surface-400 leading-normal italic px-2">
          {SUPPORT_POPUP_CONTENT.additionalText}
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleDismiss}
            data-testid="support-popup-maybe-later-button"
            className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-surface-700 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 active:bg-surface-300 transition-colors border border-surface-200/80 dark:border-surface-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-surface-400"
          >
            {SUPPORT_POPUP_CONTENT.maybeLaterText}
          </button>

          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleHelpUsClick}
            data-testid="support-popup-help-us-button"
            className="w-full sm:w-1/2 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition-all shadow-sm hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <Heart className="w-4 h-4 fill-white/20" />
            <span>{SUPPORT_POPUP_CONTENT.helpUsText}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
