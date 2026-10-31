"use client";

import React from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { TOOLS } from "@/constants/tools";
import { FileText, Check, ShieldCheck, Sparkles, LayoutTemplate } from "lucide-react";

export default function ResumeMakerPage() {
  const tool = TOOLS.find((t) => t.id === "resume-maker")!;

  return (
    <ModuleLayout tool={tool}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-card">
            <h3 className="text-base font-bold text-surface-900 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              <span>ATS-Optimized Resume Builder Architecture</span>
            </h3>
            <p className="text-sm text-surface-600 mb-6 leading-relaxed">
              Build your resume without trusting commercial resume platforms with your sensitive employment history, phone number, and personal address. In Phase 05, this builder will feature live side-by-side editing and direct vector PDF generation via `pdf-lib`.
            </p>

            <div className="p-6 rounded-2xl bg-surface-50 border border-surface-200/90 text-center">
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3 border border-brand-100">
                <LayoutTemplate className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-surface-900 mb-1">Interactive Form & Live Vector Preview Ready</h4>
              <p className="text-xs text-surface-500 max-w-md mx-auto mb-4">
                Structured forms will populate reactive resume models with real-time PDF rendering.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Planned for Phase 05 Implementation</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-subtle">
            <h3 className="text-base font-bold text-surface-900 mb-2">Architectural Blueprint</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-surface-200 bg-surface-50">
                <span className="font-semibold text-surface-900 block mb-1">Local State Store</span>
                <span className="text-surface-600">Pure React hooks with ephemeral session states.</span>
              </div>
              <div className="p-3 rounded-xl border border-surface-200 bg-surface-50">
                <span className="font-semibold text-surface-900 block mb-1">Vector PDF Rendering</span>
                <span className="text-surface-600">High-crisp font rendering using client-side `pdf-lib`.</span>
              </div>
              <div className="p-3 rounded-xl border border-surface-200 bg-surface-50">
                <span className="font-semibold text-surface-900 block mb-1">ATS Parsable</span>
                <span className="text-surface-600">Standard single-column and dual-column layouts.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-subtle">
            <h4 className="text-sm font-bold text-surface-900 mb-3">Planned Features</h4>
            <ul className="text-xs text-surface-600 space-y-2.5">
              {tool.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-emerald-50 rounded-2xl border border-emerald-200/80 p-6 text-emerald-950">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm font-bold">Confidential Career Data</h4>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Your resume details and career history are never stored in a cloud database or shared with recruiters.
            </p>
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
}
