import React from "react";
import Link from "next/link";
import { Mail, MessageSquare, ShieldCheck, Code, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <PageHeader
        title="Contact & Technical Support"
        subtitle="Have feedback, questions about our privacy architecture, or want to report a technical bug?"
        badge="Community & Support"
        breadcrumbs={[{ label: "Contact" }]}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex-1 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white rounded-2xl border border-surface-200/90 p-6 sm:p-8 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4 border border-brand-100">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-surface-900 mb-2">Direct Inquiries</h3>
              <p className="text-xs text-surface-600 leading-relaxed mb-4">
                For architectural questions, security disclosures, or collaboration inquiries regarding Browser Utility Studio.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-surface-50 border border-surface-200 text-xs font-mono text-surface-800">
              support@browserutilitystudio.local
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-surface-200/90 p-6 sm:p-8 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-surface-900 mb-2">Privacy & Zero-Log Policy</h3>
              <p className="text-xs text-surface-600 leading-relaxed mb-4">
                We do not collect customer tracking logs or retain files on our servers. When asking for assistance, please describe your browser environment (e.g. Chrome, Firefox) and document format.
              </p>
            </div>
            <Link
              href="/privacy"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
            >
              Verify privacy independently &rarr;
            </Link>
          </div>
        </div>

        {/* Feedback / Bug Reporting Guide */}
        <div className="bg-white rounded-3xl border border-surface-200/90 p-8 sm:p-10 shadow-subtle">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-bold text-surface-900">Reporting Technical Issues</h2>
          </div>
          <p className="text-xs sm:text-sm text-surface-600 leading-relaxed mb-6">
            If a document crop, PDF render, or photo export does not behave as expected in your browser, please ensure:
          </p>
          <ul className="list-disc list-inside text-xs sm:text-sm text-surface-700 space-y-2.5 pl-2 mb-8">
            <li>Your file is within client limits (under 20 MB for images, under 40 MB for PDFs).</li>
            <li>Hardware acceleration is enabled in your browser settings for WebGPU / Canvas.</li>
            <li>For encrypted e-Aadhaar PDFs, make sure you know the 8-character password.</li>
          </ul>

          <div className="pt-6 border-t border-surface-100 flex items-center justify-between">
            <Link
              href="/tools"
              className="text-xs font-semibold text-brand-600 hover:text-brand-800"
            >
              &larr; Explore all tools
            </Link>
            <span className="text-xs text-surface-400">Browser Utility Studio v0.1.0</span>
          </div>
        </div>
      </main>
    </div>
  );
}
