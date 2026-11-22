import React from "react";
import Link from "next/link";
import { Mail, MessageSquare, ShieldCheck, Code, ArrowLeft, ArrowRight, FileCheck } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col transition-colors duration-150">
      <PageHeader
        title="Contact & Technical Support"
        subtitle="Have feedback, questions about our privacy architecture, or want to report a technical bug?"
        badge="Community & Support"
        breadcrumbs={[{ label: "Contact" }]}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex-1 w-full space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200/90 dark:border-surface-800 p-6 sm:p-8 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4 border border-brand-100 dark:border-brand-800">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-surface-900 dark:text-surface-100 mb-2">Direct Inquiries</h3>
              <p className="text-xs text-surface-600 dark:text-surface-300 leading-relaxed mb-4">
                For architectural questions, security disclosures, feedback, or collaboration inquiries regarding Print Ready Designs.
              </p>
            </div>
            <a
              href="mailto:socialmediasamim@gmail.com"
              className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors border border-surface-200 dark:border-surface-700 text-xs font-mono text-brand-600 dark:text-brand-400 font-semibold block text-center"
            >
              socialmediasamim@gmail.com
            </a>
          </div>

          <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200/90 dark:border-surface-800 p-6 sm:p-8 shadow-subtle flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-100 dark:border-emerald-800">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-surface-900 dark:text-surface-100 mb-2">Privacy & Zero-Log Support Policy</h3>
              <p className="text-xs text-surface-600 dark:text-surface-300 leading-relaxed mb-4">
                We do not collect customer tracking logs or retain files on our servers. When requesting technical support, please describe your browser environment (e.g., Chrome, Firefox), operating system, and document format.
              </p>
            </div>
            <Link
              href="/privacy"
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 hover:underline flex items-center gap-1"
            >
              <span>Verify privacy architecture independently</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Feedback / Bug Reporting Guide */}
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200/90 dark:border-surface-800 p-8 sm:p-10 shadow-subtle">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">Reporting Technical Issues & Device Limits</h2>
          </div>
          <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-300 leading-relaxed mb-6">
            If a document crop, PDF render, or photo export does not behave as expected in your browser, please verify the following:
          </p>
          <ul className="list-disc list-inside text-xs sm:text-sm text-surface-700 dark:text-surface-300 space-y-2.5 pl-2 mb-8">
            <li><strong>File Size Constraints:</strong> Ensure files are within client limits (under 25 MB for images, under 40 MB for PDFs).</li>
            <li><strong>Hardware Acceleration:</strong> Ensure hardware acceleration is enabled in your browser settings for WebGPU, Canvas, and Web Workers.</li>
            <li><strong>Supported Formats:</strong> Ensure you are uploading valid JPG, PNG, WebP, or non-corrupted PDF documents.</li>
            <li><strong>Password Protection:</strong> For encrypted e-Aadhaar PDFs, make sure you know the 8-character password (first 4 letters of name in CAPITAL + 4-digit birth year).</li>
          </ul>

          <div className="pt-6 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between">
            <Link
              href="/tools"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Explore all tools</span>
            </Link>
            <span className="text-xs text-surface-400 dark:text-surface-500 font-mono">Print Ready Designs v0.1.0</span>
          </div>
        </div>
      </main>
    </div>
  );
}