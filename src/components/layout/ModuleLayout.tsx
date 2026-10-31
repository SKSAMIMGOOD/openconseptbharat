import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { ToolMetadata } from "@/types/tools";

export interface ModuleLayoutProps {
  tool: ToolMetadata;
  children?: React.ReactNode;
}

export const ModuleLayout: React.FC<ModuleLayoutProps> = ({ tool, children }) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-surface-50/50">
      {/* Module Sub-Header */}
      <div className="bg-white border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb & Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="inline-flex items-center text-xs font-medium text-surface-500 hover:text-brand-600 transition-colors gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all tools</span>
            </Link>

            <div className="flex items-center gap-2">
              <Badge variant="brand" size="sm">
                <Sparkles className="w-3 h-3 mr-1" />
                {tool.badge || "Studio Tool"}
              </Badge>
              <Badge variant="success" size="sm">
                <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                Browser Isolated
              </Badge>
            </div>
          </div>

          {/* Module Heading */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 tracking-tight">{tool.name}</h1>
              <p className="text-sm text-surface-600 mt-1 max-w-3xl">{tool.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children ? (
          children
        ) : (
          <div className="bg-white rounded-2xl border border-surface-200 p-8 sm:p-12 shadow-card text-center max-w-3xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4 border border-brand-100">
              <Wrench className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-surface-900 mb-2">Module Initialized & Ready for Phase Integration</h2>
            <p className="text-sm text-surface-600 max-w-md mx-auto mb-6">
              The architecture, types, and client contracts for <strong className="text-surface-800">{tool.name}</strong> are initialized. Full browser processing pipelines will be activated in upcoming development phases.
            </p>

            <div className="bg-surface-50 rounded-xl p-4 text-left border border-surface-200 max-w-lg mx-auto mb-8">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-500 mb-2">Architectural Blueprint & Features</h4>
              <ul className="text-xs text-surface-700 space-y-1.5">
                {tool.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-surface-100 text-surface-800 hover:bg-surface-200 transition-colors"
            >
              Return to Studio Dashboard
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};
