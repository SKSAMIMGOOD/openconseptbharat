import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, HelpCircle, ListOrdered, Sparkles, ShieldCheck } from "lucide-react";
import { getToolSeoData } from "@/constants/tool-seo";

export const TOOL_TO_GUIDE_MAP: Record<string, { slug: string; title: string }> = {
  "aadhaar-card-crop": {
    slug: "crop-aadhaar-card-pvc-printing",
    title: "How to Crop an e-Aadhaar Card for PVC Printing",
  },
  "pan-card-crop": {
    slug: "crop-pan-card-pvc-printing",
    title: "How to Crop a PAN Card for PVC Printing",
  },
  "photo-studio": {
    slug: "indian-passport-size-photo-guide",
    title: "How to Create Indian Passport Size Photos (35×45mm)",
  },
  "multiple-photo-maker": {
    slug: "print-multiple-passport-photos-a4",
    title: "How to Print Multiple Passport Photos on A4 & 4×6 Paper",
  },
  "document-straightener": {
    slug: "straighten-crooked-document-photo",
    title: "How to Straighten a Crooked Document Photo Online",
  },
  "resume-maker": {
    slug: "create-ats-friendly-resume",
    title: "How to Create an ATS-Friendly Resume Online",
  },
  "document-studio": {
    slug: "crop-aadhaar-card-pvc-printing",
    title: "How to Crop ID Cards for PVC Printing (Step-by-Step)",
  },
};

export interface ToolSeoSectionProps {
  toolId: string;
}

export const ToolSeoSection: React.FC<ToolSeoSectionProps> = ({ toolId }) => {
  const seoData = getToolSeoData(toolId);

  if (!seoData) {
    return null;
  }

  const { howToUse, faqs, relatedTools, primaryKeyword } = seoData;
  const companionGuide = TOOL_TO_GUIDE_MAP[toolId];

  return (
    <section
      aria-label="Tool Guide and Related Utilities"
      className="mt-14 pt-10 border-t border-surface-200/80 dark:border-surface-800/80 space-y-12"
    >
      {/* 1. How to Use Section */}
      {howToUse && howToUse.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800/60">
              <ListOrdered className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-100 tracking-tight">
                How to Use {seoData.h1.split("–")[0].trim()}
              </h2>
              <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                Quick 4-step workflow to get perfect, print-ready results in seconds.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {howToUse.map((step) => (
              <div
                key={step.step}
                className="relative bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-bold text-xs ring-4 ring-brand-50 dark:ring-brand-950/40">
                      {step.step}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-surface-400 dark:text-surface-500">
                      Step {step.step}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Companion Guide Educational Callout */}
      {companionGuide && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-brand-50 to-indigo-50/70 dark:from-brand-950/40 dark:to-indigo-950/30 border border-brand-200/80 dark:border-brand-900/60 text-xs sm:text-sm shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 block">
                Educational Guide
              </span>
              <span className="font-semibold text-surface-900 dark:text-surface-100">
                {companionGuide.title}
              </span>
            </div>
          </div>
          <Link
            href={`/guides/${companionGuide.slug}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-surface-800 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold text-xs border border-brand-200/60 dark:border-brand-800 shrink-0 shadow-xs hover:shadow-sm transition-all"
          >
            <span>Read Step-by-Step Guide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 2. Frequently Asked Questions Section */}
      {faqs && faqs.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-100 tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                Common questions about {primaryKeyword}, card dimensions, and printing.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 rounded-2xl p-5 shadow-xs space-y-2.5"
              >
                <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 flex items-start gap-2">
                  <span className="text-brand-600 dark:text-brand-400 shrink-0 font-extrabold">Q:</span>
                  <span>{faq.question}</span>
                </h3>
                <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-300 leading-relaxed pl-5">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Privacy, File Security & Technical Limits Card */}
      <div className="bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-surface-900 dark:text-surface-100">
                100% Client-Side Privacy & Security Guarantee
              </h2>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Your documents and photos never leave your device.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/privacy"
              className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold"
            >
              Privacy Policy &rarr;
            </Link>
            <span className="text-surface-300 dark:text-surface-700">•</span>
            <Link
              href="/terms"
              className="text-surface-600 dark:text-surface-400 hover:underline font-semibold"
            >
              Terms of Use &rarr;
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/60 dark:border-surface-700/60 space-y-1">
            <span className="font-bold text-surface-900 dark:text-surface-100 block">Zero Server Uploads</span>
            <p className="text-surface-500 dark:text-surface-400 text-[11px] leading-relaxed">
              All rendering and processing runs locally inside your browser memory via WebAssembly and Canvas APIs.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/60 dark:border-surface-700/60 space-y-1">
            <span className="font-bold text-surface-900 dark:text-surface-100 block">Ephemeral In-Memory Lifecycle</span>
            <p className="text-surface-500 dark:text-surface-400 text-[11px] leading-relaxed">
              Documents are never stored in databases or permanent cloud storage. Closing or refreshing the tab clears all buffers.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-surface-800/60 border border-surface-200/60 dark:border-surface-700/60 space-y-1">
            <span className="font-bold text-surface-900 dark:text-surface-100 block">Zero Trackers or Profiling</span>
            <p className="text-surface-500 dark:text-surface-400 text-[11px] leading-relaxed">
              No analytics scripts, tracking pixels, or third-party behavioral beacons run on this platform.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Related Tools / Internal Links Section */}
      {relatedTools && relatedTools.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-surface-900 dark:text-surface-100 tracking-tight">
                Related Free Online Tools
              </h2>
              <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                Complementary photo editing, card cropping, and print preparation tools.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedTools.map((relTool) => (
              <Link
                key={relTool.href}
                href={relTool.href}
                className="group bg-white dark:bg-surface-900 border border-surface-200/80 dark:border-surface-800 hover:border-brand-500 dark:hover:border-brand-500/80 rounded-2xl p-4 shadow-xs transition-all duration-200 hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {relTool.title}
                  </h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {relTool.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-surface-100 dark:border-surface-800/60 flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400 gap-1 group-hover:gap-1.5 transition-all">
                  <span>Open Tool</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
