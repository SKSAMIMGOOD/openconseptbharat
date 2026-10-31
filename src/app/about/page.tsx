import React from "react";
import Link from "next/link";
import { ArrowLeft, Layers, ShieldCheck, Cpu, Code2 } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface-50/50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-semibold text-surface-500 hover:text-brand-600 transition-colors gap-1.5 mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Studio Dashboard</span>
        </Link>

        <div className="bg-white rounded-3xl border border-surface-200/90 p-8 sm:p-12 shadow-subtle mb-10">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-6 border border-brand-100">
            <Layers className="w-6 h-6" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-surface-900 tracking-tight">
            About Browser Utility Studio
          </h1>

          <p className="mt-4 text-sm sm:text-base text-surface-600 leading-relaxed">
            Browser Utility Studio is an independent, client-side utility platform engineered to provide fast, professional document and image processing with unwavering user privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-subtle">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-surface-900 mb-2">Modern Technology</h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              Built on modern Next.js App Router, TypeScript, HTML Canvas API, Web Workers, PDF.js, and pdf-lib. All resource-intensive computations leverage modern multi-threaded browser runtimes.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-subtle">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-surface-900 mb-2">Architectural Privacy</h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              We never upload personal documents, PAN scans, Aadhaar numbers, or facial photos to any server. Your device does 100% of the work.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-subtle">
          <div className="flex items-center gap-2 mb-3">
            <Code2 className="w-5 h-5 text-surface-700" />
            <h3 className="text-base font-bold text-surface-900">Open & Transparent Blueprint</h3>
          </div>
          <p className="text-xs text-surface-600 leading-relaxed">
            This project provides clean, modular code with strictly decoupled UI and processing logic, ready for production expansion across card crops, photo studios, and PDF builders.
          </p>
        </div>
      </div>
    </div>
  );
}
