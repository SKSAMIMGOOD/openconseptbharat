import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  ServerOff,
  Cpu,
  Lock,
  EyeOff,
  ArrowRight,
  Terminal,
} from "lucide-react";
import { PRIVACY_GUARANTEES } from "@/constants/privacy";
import { PageHeader } from "@/components/common/PageHeader";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <PageHeader
        title="Privacy Architecture & Zero-Upload Guarantee"
        subtitle="Engineered with strict zero-upload data isolation. Discover how our client-side architecture mathematically prevents file transmission."
        badge="100% In-Browser Execution"
        breadcrumbs={[{ label: "Privacy Guarantee" }]}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex-1 w-full space-y-8">
        {/* Core Philosophy Banner */}
        <div className="bg-white rounded-3xl border border-surface-200/90 p-8 sm:p-12 shadow-subtle">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Strict Browser-Only Architecture</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
            Our Architectural Promise: Zero Bytes Uploaded
          </h2>

          <p className="mt-4 text-sm sm:text-base text-surface-600 leading-relaxed">
            Browser Utility Studio was engineered from day one on a radical architectural premise: <strong>User identity documents and photos must never be uploaded to remote servers.</strong> We believe document utility tools should empower users without sacrificing digital sovereignty.
          </p>
        </div>

        {/* 4 Privacy Guarantees */}
        <div className="space-y-6">
          {PRIVACY_GUARANTEES.map((guarantee, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-subtle hover:border-brand-300 transition-colors"
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
                  <div className="mt-3 p-3 rounded-xl bg-surface-50 border border-surface-200/70 text-xs font-mono text-surface-700 flex items-start gap-2">
                    <Terminal className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-brand-700 font-semibold">Technical Enforcement: </span>
                      {guarantee.technicalMechanism}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Independent Verification Guide */}
        <div className="bg-white rounded-3xl border border-surface-200/90 p-8 sm:p-10 shadow-subtle">
          <div className="flex items-center gap-2.5 mb-3">
            <Lock className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-surface-900">
              How to Independently Verify Our Privacy
            </h2>
          </div>
          <p className="text-sm text-surface-600 leading-relaxed mb-6">
            You do not have to take our word for it. You can inspect the application runtime directly using your browser&apos;s built-in developer tools:
          </p>

          <ol className="list-decimal list-inside text-xs sm:text-sm text-surface-700 space-y-3.5 pl-2">
            <li>
              <strong>Open Developer Tools:</strong> Press <kbd className="px-2 py-0.5 bg-surface-100 border border-surface-300 rounded font-mono text-xs">F12</kbd> or right-click anywhere and select <em>Inspect</em>.
            </li>
            <li>
              <strong>Switch to the Network Tab:</strong> Filter by <em>Fetch / XHR</em>.
            </li>
            <li>
              <strong>Upload a document or photo:</strong> Select your PAN, Aadhaar, or passport photo inside any tool workspace.
            </li>
            <li>
              <strong>Verify zero traffic:</strong> Notice that zero HTTP POST / PUT requests are emitted with file payloads.
            </li>
            <li>
              <strong>Inspect Application Storage:</strong> Check <em>IndexedDB</em> and <em>LocalStorage</em> to confirm that zero uploaded documents are cached permanently.
            </li>
          </ol>

          <div className="mt-8 pt-6 border-t border-surface-100 flex items-center justify-between">
            <span className="text-xs text-surface-500">
              Independent client-side verification verified on Chrome, Safari, Edge & Firefox.
            </span>
            <Link
              href="/tools"
              className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
            >
              <span>Test with a Tool</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
