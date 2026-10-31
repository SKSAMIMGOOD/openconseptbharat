import React from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface PrivacyBadgeProps {
  className?: string;
  variant?: "pill" | "banner";
}

export const PrivacyBadge: React.FC<PrivacyBadgeProps> = ({ className, variant = "pill" }) => {
  if (variant === "banner") {
    return (
      <div className={cn("bg-emerald-50/80 border-b border-emerald-200/80 py-2 px-4 text-xs text-emerald-800 flex items-center justify-center gap-2", className)}>
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          <strong className="font-semibold">Privacy-First Architecture:</strong> All files are processed 100% locally in your browser memory. No backend uploads. No data collection.
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-subtle",
        className
      )}
    >
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
      <span>100% Client-Side • Zero Upload</span>
    </div>
  );
};
