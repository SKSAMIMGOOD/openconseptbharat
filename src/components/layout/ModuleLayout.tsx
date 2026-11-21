"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles, Lock, Cpu } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ToolMetadata } from "@/types/tools";
import { recordToolUsage } from "@/lib/utils/recent-tools";
import { getToolSoftwareApplicationData } from "@/lib/seo/structured-data";
import {
  getToolVisualBreadcrumbs,
  getToolCategoryBreadcrumb,
} from "@/lib/seo/breadcrumbs";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";

export interface ModuleLayoutProps {
  tool: ToolMetadata;
  children: React.ReactNode;
}

export const ModuleLayout: React.FC<ModuleLayoutProps> = ({ tool, children }) => {
  // Automatically record this tool in recent tools
  useEffect(() => {
    if (tool && tool.id) {
      recordToolUsage(tool.id);
    }
  }, [tool]);

  const categoryInfo = useMemo(() => getToolCategoryBreadcrumb(tool), [tool]);
  const visualBreadcrumbs = useMemo(() => getToolVisualBreadcrumbs(tool), [tool]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-surface-50 dark:bg-surface-950">
      {/* Tool SoftwareApplication Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getToolSoftwareApplicationData(tool)),
        }}
      />
      {/* BreadcrumbList JSON-LD Structured Data */}
      <BreadcrumbJsonLd tool={tool} />

      {/* Module Sub-Header & Breadcrumb Bar */}
      <div className="bg-white dark:bg-surface-900 border-b border-surface-200/90 dark:border-surface-800 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs & Quick Back */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <Link
                href={categoryInfo.href}
                className="inline-flex items-center text-xs font-semibold text-surface-500 dark:text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors gap-1.5 p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
                title={`Back to ${categoryInfo.name}`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </Link>
              <span className="text-surface-300 dark:text-surface-700">|</span>
              <Breadcrumb items={visualBreadcrumbs} />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {tool.badge && (
                <Badge variant="brand" size="sm">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {tool.badge}
                </Badge>
              )}
              <Badge variant="success" size="sm">
                <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                Browser Isolated
              </Badge>
            </div>
          </div>

          {/* Module Heading & Metadata */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 dark:text-surface-100 tracking-tight">
                {tool.name}
              </h1>
              <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-400 mt-1.5 max-w-3xl leading-relaxed">
                {tool.description}
              </p>
            </div>

            {/* Architecture indicator */}
            <div className="hidden lg:flex items-center gap-3 shrink-0 text-xs text-surface-500 dark:text-surface-400 font-mono bg-surface-50 dark:bg-surface-800/60 px-3 py-1.5 rounded-xl border border-surface-200 dark:border-surface-700">
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                HTML5 Canvas / Workers
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                0 Bytes Uploaded
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
