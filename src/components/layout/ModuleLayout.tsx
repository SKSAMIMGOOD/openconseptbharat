"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles, Lock, Cpu } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ToolMetadata } from "@/types/tools";
import { recordToolUsage } from "@/lib/utils/recent-tools";

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

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-surface-50">
      {/* Module Sub-Header & Breadcrumb Bar */}
      <div className="bg-white border-b border-surface-200/90 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs & Quick Back */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center text-xs font-semibold text-surface-500 hover:text-brand-600 transition-colors gap-1.5 p-1 rounded-lg hover:bg-surface-100"
                title="Return to Dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <span className="text-surface-300">|</span>
              <Breadcrumb
                items={[
                  { label: "Dashboard", href: "/" },
                  { label: "All Tools", href: "/tools" },
                  { label: tool.name },
                ]}
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {tool.badge && (
                <Badge variant="brand" size="sm">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {tool.badge}
                </Badge>
              )}
              <Badge variant="success" size="sm">
                <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                Browser Isolated
              </Badge>
            </div>
          </div>

          {/* Module Heading & Metadata */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
                {tool.name}
              </h1>
              <p className="text-xs sm:text-sm text-surface-600 mt-1.5 max-w-3xl leading-relaxed">
                {tool.description}
              </p>
            </div>

            {/* Architecture indicator */}
            <div className="hidden lg:flex items-center gap-3 shrink-0 text-xs text-surface-500 font-mono bg-surface-50 px-3 py-1.5 rounded-xl border border-surface-200">
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-brand-600" />
                HTML5 Canvas / Workers
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
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
