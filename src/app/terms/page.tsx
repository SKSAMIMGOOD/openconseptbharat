import React from "react";
import Link from "next/link";
import { ShieldCheck, FileText, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <PageHeader
        title="Terms of Use"
        subtitle="Transparent terms for using Browser Utility Studio's browser-only processing utilities."
        badge="Legal & Usage Terms"
        breadcrumbs={[{ label: "Terms of Use" }]}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex-1 w-full">
        <div className="bg-white rounded-3xl border border-surface-200/90 p-8 sm:p-12 shadow-subtle space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 mb-3">
              <FileText className="w-3.5 h-3.5" />
              <span>Effective Date: October 2026</span>
            </div>
            <h2 className="text-xl font-bold text-surface-900">1. Client-Side Software Agreement</h2>
            <p className="mt-2 text-sm text-surface-600 leading-relaxed">
              Browser Utility Studio is provided as a client-side web application suite. All computations, image processing, card cropping, and PDF synthesis occur exclusively inside your web browser. By accessing or using our platform, you agree to these terms.
            </p>
          </div>

          <div className="pt-6 border-t border-surface-100">
            <h2 className="text-xl font-bold text-surface-900">2. Local Data Processing & Ownership</h2>
            <p className="mt-2 text-sm text-surface-600 leading-relaxed">
              You retain 100% full ownership of any photos, scanned documents, identity cards, and personal career information you process using our platform. Because Browser Utility Studio never transmits your files to any remote server or cloud bucket, we do not access, view, copy, or retain your data.
            </p>
          </div>

          <div className="pt-6 border-t border-surface-100">
            <h2 className="text-xl font-bold text-surface-900">3. Permitted & Responsible Use</h2>
            <p className="mt-2 text-sm text-surface-600 leading-relaxed">
              You agree to use our utilities only for lawful purposes. You must have the legal right or authorization to crop, format, or edit any government documents or personal identification cards processed with these tools.
            </p>
          </div>

          <div className="pt-6 border-t border-surface-100">
            <h2 className="text-xl font-bold text-surface-900">4. Disclaimer of Warranties</h2>
            <p className="mt-2 text-sm text-surface-600 leading-relaxed">
              Browser Utility Studio is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind. While our tools are calibrated to meet standard document dimensions (such as ISO/IEC 7810 ID-1 and official passport photo requirements), users are advised to verify physical printouts against specific agency submission requirements.
            </p>
          </div>

          <div className="pt-6 border-t border-surface-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-surface-500">
            <span>Questions regarding our terms?</span>
            <Link
              href="/contact"
              className="font-semibold text-brand-600 hover:text-brand-800 hover:underline"
            >
              Contact our team &rarr;
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
