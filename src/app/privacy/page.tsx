import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, CheckCircle2, ServerOff, Cpu, Lock, EyeOff } from "lucide-react";
import { PRIVACY_GUARANTEES } from "@/constants/privacy";

export default function PrivacyPage() {
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

        {/* Header */}
        <div className="bg-white rounded-3xl border border-surface-200/90 p-8 sm:p-12 shadow-subtle mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Strict Browser-Only Architecture</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-surface-900 tracking-tight">
            Privacy Architecture & Zero-Upload Guarantee
          </h1>

          <p className="mt-4 text-sm sm:text-base text-surface-600 leading-relaxed">
            Browser Utility Studio was engineered from day one on a radical architectural premise: <strong>User identity documents and photos must never be uploaded to remote servers.</strong> We believe document utility tools should empower users without sacrificing digital sovereignty.
          </p>
        </div>

        {/* Core Guarantees Grid */}
        <div className="space-y-6 mb-12">
          {PRIVACY_GUARANTEES.map((guarantee, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-subtle"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-surface-900">{guarantee.title}</h3>
                  <p className="text-sm text-surface-600 mt-1 leading-relaxed">
                    {guarantee.description}
                  </p>
                  <div className="mt-3 p-3 rounded-xl bg-surface-50 border border-surface-200/70 text-xs font-mono text-surface-700">
                    <span className="text-brand-700 font-semibold">Technical Enforcement: </span>
                    {guarantee.technicalMechanism}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Verification Instructions */}
        <div className="bg-white rounded-3xl border border-surface-200 p-8 sm:p-10 shadow-subtle mb-12">
          <h2 className="text-xl font-bold text-surface-900 mb-3">
            How to Independently Verify Our Privacy
          </h2>
          <p className="text-sm text-surface-600 leading-relaxed mb-6">
            You do not have to take our word for it. You can inspect the application runtime directly using your browser&apos;s built-in developer tools:
          </p>

          <ol className="list-decimal list-inside text-xs sm:text-sm text-surface-700 space-y-3 pl-2">
            <li>
              <strong>Open Developer Tools:</strong> Press <kbd className="px-2 py-0.5 bg-surface-100 border border-surface-300 rounded font-mono text-xs">F12</kbd> or right-click anywhere and select <em>Inspect</em>.
            </li>
            <li>
              <strong>Switch to the Network Tab:</strong> Filter by <em>Fetch / XHR</em>.
            </li>
            <li>
              <strong>Upload a document or photo:</strong> Perform card crops or edit photos.
            </li>
            <li>
              <strong>Verify zero traffic:</strong> Notice that zero HTTP POST / PUT requests are emitted with file payloads.
            </li>
            <li>
              <strong>Inspect Application Storage:</strong> Check <em>IndexedDB</em> and <em>LocalStorage</em> to confirm that zero uploaded documents are cached permanently.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
