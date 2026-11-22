import React from "react";
import Link from "next/link";
import { ShieldCheck, FileText, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col transition-colors duration-150">
      <PageHeader
        title="Terms of Use"
        subtitle="Transparent terms for using Print Ready Designs' browser-only processing utilities."
        badge="Legal & Usage Terms"
        breadcrumbs={[{ label: "Terms of Use" }]}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex-1 w-full">
        <div className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-200/90 dark:border-surface-800 p-8 sm:p-12 shadow-subtle space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 mb-3">
              <FileText className="w-3.5 h-3.5" />
              <span>Effective Date: October 2026 • Last Updated: November 2026</span>
            </div>
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">1. Client-Side Software Agreement</h2>
            <p className="mt-2 text-sm text-surface-600 dark:text-surface-300 leading-relaxed">
              <strong>Print Ready Designs</strong> is provided as a free client-side web utility suite. All computations, image processing, card cropping, perspective correction, background removal, and PDF synthesis occur exclusively inside your web browser. By accessing or using our platform, you agree to these terms.
            </p>
          </div>

          <div className="pt-6 border-t border-surface-100 dark:border-surface-800">
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">2. Local Data Processing & Complete User Ownership</h2>
            <p className="mt-2 text-sm text-surface-600 dark:text-surface-300 leading-relaxed">
              You retain 100% full ownership and all rights to any photos, scanned documents, identity cards, and personal career information you process using our platform. Because Print Ready Designs never transmits your files to any remote server, cloud bucket, or external database, we do not access, view, copy, share, or retain your data.
            </p>
          </div>

          <div className="pt-6 border-t border-surface-100 dark:border-surface-800">
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">3. Permitted & Responsible Use</h2>
            <p className="mt-2 text-sm text-surface-600 dark:text-surface-300 leading-relaxed">
              You agree to use our utilities only for lawful purposes. You must have the legal right, ownership, or explicit authorization to crop, format, or edit any government documents, identity cards (such as Aadhaar, PAN, Voter ID, or Ration cards), or portrait photographs processed with these tools. You agree not to use this software for fraudulent identity duplication, falsification, forgery, or any unlawful activity.
            </p>
          </div>

          <div className="pt-6 border-t border-surface-100 dark:border-surface-800">
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">4. Print Calibration & Measurement Disclaimers</h2>
            <p className="mt-2 text-sm text-surface-600 dark:text-surface-300 leading-relaxed">
              While our tools are mathematically calibrated to meet standard document dimensions (such as ISO/IEC 7810 ID-1 / 85.60 × 53.98 mm and official 35 × 45 mm passport photo specifications), physical output depends on user printer hardware, scaling dialogs, and paper types. Users are advised to select &quot;Actual Size / 100% Scale&quot; in print settings and verify physical prints against specific agency submission requirements prior to official filing.
            </p>
          </div>

          <div className="pt-6 border-t border-surface-100 dark:border-surface-800">
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">5. Disclaimer of Warranties & Limitation of Liability</h2>
            <p className="mt-2 text-sm text-surface-600 dark:text-surface-300 leading-relaxed">
              Print Ready Designs is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express or implied. Under no circumstances shall Print Ready Designs be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use this platform.
            </p>
          </div>

          <div className="pt-6 border-t border-surface-100 dark:border-surface-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-surface-500 dark:text-surface-400">
            <span>Questions regarding our terms?</span>
            <Link
              href="/contact"
              className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 hover:underline flex items-center gap-1"
            >
              <span>Contact our team</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}