import React from "react";
import Link from "next/link";
import {
  Layers,
  ShieldCheck,
  Cpu,
  Code2,
  Lock,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <PageHeader
        title="About Browser Utility Studio"
        subtitle="An independent, client-side utility platform engineered for high-performance document cropping, photo editing, and PDF creation with absolute data privacy."
        badge="Independent Utility Architecture"
        breadcrumbs={[{ label: "About" }]}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex-1 w-full space-y-8">
        {/* Mission Card */}
        <div className="bg-white rounded-3xl border border-surface-200/90 p-8 sm:p-12 shadow-subtle">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center mb-6 shadow-sm">
            <Layers className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-bold text-surface-900 tracking-tight">
            Our Architectural Mission
          </h2>

          <p className="mt-4 text-sm sm:text-base text-surface-600 leading-relaxed">
            Every day, millions of citizens and professionals need to crop government identity cards (such as PAN and Aadhaar), format standard passport photos, or build ATS-compliant resumes. Traditional web tools require uploading these highly sensitive documents to remote cloud servers, exposing citizens to persistent storage breaches, unauthorized profiling, and data leaks.
          </p>

          <p className="mt-3 text-sm sm:text-base text-surface-600 leading-relaxed">
            <strong>Browser Utility Studio was built to eliminate this compromise.</strong> By taking full advantage of modern HTML5 Canvas, Web Workers, WebAssembly, and client-side vector synthesis, 100% of the byte processing executes inside your browser tab. Your files never touch external infrastructure.
          </p>
        </div>

        {/* 3 Core Architecture Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-surface-900 mb-2">Modern Web Stack</h3>
              <p className="text-xs text-surface-600 leading-relaxed">
                Powered by Next.js App Router, TypeScript, Tailwind CSS, HTML5 Canvas, and multi-threaded Web Workers for stutter-free performance.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-100 text-[11px] font-mono text-surface-500">
              Next.js 14 • React 18
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-surface-900 mb-2">Architectural Privacy</h3>
              <p className="text-xs text-surface-600 leading-relaxed">
                Zero file endpoints, zero cloud buckets, zero databases, and zero tracking scripts. Your sensitive data stays strictly in client RAM.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-100 text-[11px] font-mono text-emerald-700">
              0 Bytes Uploaded
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 border border-teal-100">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-surface-900 mb-2">Print Calibration</h3>
              <p className="text-xs text-surface-600 leading-relaxed">
                Mathematical millimeter-to-pixel projection ensuring exact 300/600 DPI output for ISO/IEC 7810 ID-1 PVC cards and passport sheets.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-100 text-[11px] font-mono text-teal-700">
              1:1 Physical Scale
            </div>
          </div>
        </div>

        {/* Blueprint & Call to Action */}
        <div className="bg-white rounded-3xl border border-surface-200/90 p-8 sm:p-10 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Code2 className="w-5 h-5 text-brand-600" />
              <h3 className="text-base font-bold text-surface-900">Explore Our Utilities</h3>
            </div>
            <p className="text-xs sm:text-sm text-surface-600 max-w-md">
              Start editing photos, cropping government ID cards, or designing your ATS resume directly in your browser.
            </p>
          </div>

          <Link
            href="/tools"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-sm gap-2 shrink-0"
          >
            <span>Explore All 8 Tools</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
