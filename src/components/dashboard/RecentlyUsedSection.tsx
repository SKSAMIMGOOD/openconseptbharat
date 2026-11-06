"use client";

import React from "react";
import Link from "next/link";
import {
  Clock,
  ArrowRight,
  Trash2,
  Camera,
  Scissors,
  SlidersHorizontal,
  Printer,
  CreditCard,
  Fingerprint,
  FileCheck,
  FileText,
  Grid3x3,
} from "lucide-react";
import { useRecentTools } from "@/hooks/useRecentTools";
import { cn } from "@/lib/utils/cn";

const TOOL_ICON_MAP: Record<string, React.ElementType> = {
  Camera,
  Scissors,
  SlidersHorizontal,
  Printer,
  CreditCard,
  Fingerprint,
  FileCheck,
  FileText,
  Grid3x3,
  Grid: Grid3x3,
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "photo-studio": {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  "image-tools": {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
  },
  "photo-printing": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  utilities: {
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
  },
};

export interface RecentlyUsedSectionProps {
  className?: string;
}

export const RecentlyUsedSection: React.FC<RecentlyUsedSectionProps> = ({ className }) => {
  const { recentTools, isLoaded, clearRecent, recordUsage } = useRecentTools();

  // If not hydrated or user has no usage history, gracefully omit section
  if (!isLoaded || recentTools.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Recently used tools"
      className={cn("bg-surface-50 border border-surface-200/90 rounded-2xl p-5 sm:p-6 mb-10 shadow-subtle", className)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-surface-200/70 text-surface-700 flex items-center justify-center">
            <Clock className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-surface-900 tracking-tight">
                Recently Used Tools
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.2 bg-brand-50 text-brand-700 rounded-full font-semibold border border-brand-200">
                {recentTools.length}
              </span>
            </div>
            <p className="text-[11px] text-surface-500">
              Quick access to your frequently opened tools
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={clearRecent}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-surface-500 hover:text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          title="Clear recent tools history"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear history</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {recentTools.map((tool) => {
          const Icon = TOOL_ICON_MAP[tool.iconName] || FileText;
          const style = CATEGORY_COLORS[tool.category] || CATEGORY_COLORS["photo-studio"];

          return (
            <Link
              key={tool.id}
              href={tool.route}
              onClick={() => recordUsage(tool.id)}
              className="group flex items-center justify-between p-3.5 bg-white rounded-xl border border-surface-200/90 hover:border-brand-300 hover:shadow-subtle transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-surface-200/60 group-hover:scale-105 transition-transform",
                    style.bg,
                    style.text
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-surface-900 group-hover:text-brand-600 truncate transition-colors">
                    {tool.name}
                  </h3>
                  <span
                    className={cn(
                      "inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.2 rounded border truncate max-w-full",
                      style.bg,
                      style.text,
                      style.border
                    )}
                  >
                    {tool.badge || tool.category}
                  </span>
                </div>
              </div>

              <div className="w-6 h-6 rounded-md bg-surface-50 text-surface-400 group-hover:bg-brand-50 group-hover:text-brand-600 flex items-center justify-center shrink-0 transition-colors">
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
