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
  Database,
  Layers,
  Globe,
  HardDrive,
  FileCheck,
} from "lucide-react";
import {
  PRIVACY_GUARANTEES,
  TOOL_PRIVACY_MATRIX,
  THIRD_PARTY_DISCLOSURES,
} from "@/constants/privacy";
import { PageHeader } from "@/components/common/PageHeader";
import { getPrivacyBreadcrumbSchema } from "@/lib/seo/breadcrumbs";

export default function PrivacyPage() {
  const breadcrumbSchema = getPrivacyBreadcrumbSchema();

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col transition-colors duration-150">
      <PageHeader
        title="Privacy Architecture & Zero-Upload Guarantee"
        subtitle="Engineered with strict client-side data isolation. Discover how Print Ready Designs mathematically prevents document transmission."
        badge="100% In-Browser Execution"
        breadcrumbs={[{ label: "Privacy Guarantee" }]}
        breadcrumbSchema={breadcrumbSchema}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex-1 w-full space-y-10">
        {/* Core Philosophy Banner */}
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200/90 dark:border-surface-800 p-8 sm:p-12 shadow-subtle">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Strict Browser-Only Architecture</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900 dark:text-surface-100 tracking-tight">
            Our Architectural Promise: Zero Bytes Uploaded
          </h2>

          <p className="mt-4 text-sm sm:text-base text-surface-600 dark:text-surface-300 leading-relaxed">
            <strong>Print Ready Designs</strong> was engineered from day one on a strict architectural principle: <strong>User identity documents and personal photos must never be uploaded to remote servers.</strong> We believe document utility tools should empower citizens, cyber cafes, and professionals without sacrificing data privacy or digital sovereignty.
          </p>

          <p className="mt-3 text-sm sm:text-base text-surface-600 dark:text-surface-300 leading-relaxed">
            By executing all processing entirely on your device via HTML5 Canvas, WebAssembly, and multi-threaded Web Workers, our servers never receive, inspect, or retain your files.
          </p>
        </div>

        {/* 6 Core Architectural Guarantees */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">
              Verified Technical Safeguards
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRIVACY_GUARANTEES.map((guarantee, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 p-6 shadow-subtle hover:border-brand-300 dark:hover:border-brand-700 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-surface-900 dark:text-surface-100">
                        {guarantee.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-300 mt-1 leading-relaxed">
                        {guarantee.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/80 border border-surface-200/70 dark:border-surface-700 text-xs font-mono text-surface-700 dark:text-surface-300 flex items-start gap-2">
                  <Terminal className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-brand-700 dark:text-brand-300 font-semibold">Technical Enforcement: </span>
                    {guarantee.technicalMechanism}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tool-by-Tool File Handling Matrix */}
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200/90 dark:border-surface-800 p-6 sm:p-8 shadow-subtle space-y-6">
          <div className="flex items-center gap-2.5">
            <FileCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <div>
              <h3 className="text-xl font-bold text-surface-900 dark:text-surface-100">
                Tool-by-Tool File Handling Matrix
              </h3>
              <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                Exact technical execution environment, storage lifecycle, and network behavior for every tool.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <table className="w-full text-left text-xs border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-800 text-surface-400 uppercase tracking-wider font-semibold text-[11px] bg-surface-50/60 dark:bg-surface-800/50">
                  <th className="py-3 px-4">Tool Name</th>
                  <th className="py-3 px-4">Execution Environment</th>
                  <th className="py-3 px-4">Network Activity</th>
                  <th className="py-3 px-4">Data Persistence</th>
                  <th className="py-3 px-4">Formats & Limits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {TOOL_PRIVACY_MATRIX.map((tool) => (
                  <tr
                    key={tool.id}
                    className="hover:bg-surface-50/50 dark:hover:bg-surface-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-surface-900 dark:text-surface-100 whitespace-nowrap">
                      {tool.toolName}
                    </td>
                    <td className="py-3 px-4 text-surface-600 dark:text-surface-300">
                      {tool.executionEnvironment}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        {tool.networkTransmission}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-surface-600 dark:text-surface-300">
                      {tool.dataPersistence}
                    </td>
                    <td className="py-3 px-4 text-surface-500 dark:text-surface-400 font-mono text-[11px]">
                      {tool.supportedFormats} (Max {tool.maxFileSize})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Third-Party Services & Network Transparency */}
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200/90 dark:border-surface-800 p-6 sm:p-8 shadow-subtle space-y-6">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="text-xl font-bold text-surface-900 dark:text-surface-100">
                Third-Party Network Disclosures
              </h3>
              <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                Full disclosure of every external domain contacted by the application.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {THIRD_PARTY_DISCLOSURES.map((service, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/80 dark:border-surface-700/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-surface-900 dark:text-surface-100">
                    {service.service}
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300">
                    {service.optionalOrRequired}
                  </span>
                </div>
                <p className="text-xs text-surface-600 dark:text-surface-300 leading-relaxed">
                  <strong>Purpose:</strong> {service.purpose}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
                  <strong>Data Transmitted:</strong> {service.dataTransmitted}
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
              <strong>Zero Analytics & Zero User Tracking:</strong> Print Ready Designs does NOT load Google Analytics, Meta Pixel, Hotjar, or advertising cookies. We do not track, profile, or sell user browsing activity.
            </div>
          </div>
        </div>

        {/* Independent Verification Guide */}
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200/90 dark:border-surface-800 p-8 sm:p-10 shadow-subtle">
          <div className="flex items-center gap-2.5 mb-3">
            <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">
              How to Independently Verify Our Zero-Upload Architecture
            </h2>
          </div>
          <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed mb-6">
            You do not have to take our word for it. You can inspect the application runtime directly using your browser&apos;s built-in developer tools:
          </p>

          <ol className="list-decimal list-inside text-xs sm:text-sm text-surface-700 dark:text-surface-300 space-y-3.5 pl-2">
            <li>
              <strong>Open Developer Tools:</strong> Press <kbd className="px-2 py-0.5 bg-surface-100 dark:bg-surface-800 border border-surface-300 dark:border-surface-700 rounded font-mono text-xs">F12</kbd> or right-click anywhere and select <em>Inspect</em>.
            </li>
            <li>
              <strong>Switch to the Network Tab:</strong> Filter by <em>Fetch / XHR</em>.
            </li>
            <li>
              <strong>Upload a document or photo:</strong> Select your PAN, Aadhaar, or passport photo inside any tool workspace.
            </li>
            <li>
              <strong>Verify zero outgoing file traffic:</strong> Notice that zero HTTP POST or PUT requests are emitted with file payloads. Only static model weights or fonts appear as incoming GET requests.
            </li>
            <li>
              <strong>Inspect Application Storage:</strong> Check <em>IndexedDB</em> and <em>LocalStorage</em> to confirm that zero uploaded documents or image blobs are saved permanently.
            </li>
          </ol>

          <div className="mt-8 pt-6 border-t border-surface-100 dark:border-surface-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-surface-500 dark:text-surface-400">
              Independent client-side verification verified on Chrome, Safari, Edge & Firefox.
            </span>
            <Link
              href="/tools"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 flex items-center gap-1"
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