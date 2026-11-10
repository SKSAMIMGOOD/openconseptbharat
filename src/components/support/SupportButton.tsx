"use client";

import React from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { SUPPORT_URL, SUPPORT_POPUP_CONTENT } from "@/constants/support";

export { SUPPORT_URL };

export interface SupportButtonProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "subtle" | "filled" | "outline";
  showSupportingLabel?: boolean;
}

export const SupportButton: React.FC<SupportButtonProps> = ({
  className,
  size = "sm",
  variant = "subtle",
  showSupportingLabel = true,
}) => {
  const sizeStyles = {
    sm: "px-3.5 py-2 text-xs rounded-xl gap-2",
    md: "px-4 py-2.5 text-sm rounded-xl gap-2",
    lg: "px-5 py-3 text-sm rounded-xl gap-2.5 font-semibold",
  };

  const variantStyles = {
    subtle:
      "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 hover:text-rose-800 dark:hover:text-rose-200 shadow-subtle hover:shadow",
    filled:
      "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm hover:shadow",
    outline:
      "bg-white dark:bg-surface-900 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 shadow-subtle",
  };

  return (
    <a
      href={SUPPORT_URL}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="dashboard-help-us-button"
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-200 select-none group shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      title="Help keep this tool free — Support Browser Utility Studio"
      aria-label="Help Us — Help keep this tool free"
    >
      <Heart
        className={cn(
          "w-4 h-4 transition-transform group-hover:scale-110",
          variant === "filled" ? "fill-white/30 text-white" : "fill-rose-500/20 text-rose-600 dark:text-rose-400"
        )}
      />
      <span className="font-bold">{SUPPORT_POPUP_CONTENT.helpUsText}</span>
      {showSupportingLabel && (
        <span
          className={cn(
            "hidden sm:inline text-[11px] font-normal pl-2 border-l",
            variant === "filled"
              ? "text-rose-100 border-rose-400/60"
              : "text-rose-600/80 dark:text-rose-300/80 border-rose-200 dark:border-rose-800"
          )}
        >
          {SUPPORT_POPUP_CONTENT.supportingLabel}
        </span>
      )}
    </a>
  );
};
