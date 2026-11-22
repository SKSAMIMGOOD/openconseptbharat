import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { GUIDES } from "@/constants/guides";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Badge } from "@/components/common/Badge";
import { getGuidesIndexBreadcrumbSchema } from "@/lib/seo/guide-structured-data";

export const metadata: Metadata = {
  title: {
    absolute: "Guides & Tutorials – Document Cropping, Passport Photos & Resume Maker | Print Ready Designs",
  },
  description:
    "Step-by-step guides for e-Aadhaar & PAN card PVC printing, Indian passport photo 35×45mm creation, photo sheet layout printing, document straightening, and ATS resumes.",
  keywords: [
    "print ready designs guides",
    "how to crop eaadhaar card",
    "how to crop pan card for pvc",
    "indian passport photo 35x45mm guide",
    "print multiple passport photos a4",
    "straighten document photo online",
    "create ats friendly resume free",
  ],
  alternates: {
    canonical: "/guides",
  },
  openGraph: {
    title: "Guides & Tutorials – Document Cropping, Passport Photos & Resume Maker | Print Ready Designs",
    description:
      "Step-by-step guides for e-Aadhaar & PAN card PVC printing, Indian passport photo 35×45mm creation, photo sheet layout printing, document straightening, and ATS resumes.",
    url: "/guides",
    type: "website",
    siteName: "Print Ready Designs",
  },
  twitter: {
    card: "summary_large_image",
    title: "Guides & Tutorials – Document Cropping, Passport Photos & Resume Maker | Print Ready Designs",
    description:
      "Step-by-step guides for e-Aadhaar & PAN card PVC printing, Indian passport photo 35×45mm creation, photo sheet layout printing, document straightening, and ATS resumes.",
  },
};

export default function GuidesIndexPage() {
  const breadcrumbSchema = getGuidesIndexBreadcrumbSchema();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-50 dark:bg-surface-950 flex flex-col">
      {/* Schema.org BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      {/* Hero Header */}
      <div className="bg-white dark:bg-surface-900 border-b border-surface-200/90 dark:border-surface-800 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4">
            <Breadcrumb items={[{ label: "Guides" }]} />
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 text-xs font-semibold border border-brand-200/60 dark:border-brand-800/60 mb-4">
              <BookOpen className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Step-by-Step Educational Guides</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-surface-900 dark:text-surface-100 tracking-tight">
              Printing Guides & Document Utilities Tutorials
            </h1>

            <p className="mt-3 text-sm sm:text-base text-surface-600 dark:text-surface-400 leading-relaxed">
              Clear, practical, step-by-step walkthroughs to help you crop ID cards for PVC printing, create compliant Indian passport photos, straighten camera snapshots, and build ATS-friendly resumes—all using free, 100% private in-browser tools.
            </p>
          </div>
        </div>
      </div>

      {/* Guides Grid Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {GUIDES.map((guide) => (
            <article
              key={guide.slug}
              className="group bg-white dark:bg-surface-900 border border-surface-200/90 dark:border-surface-800 hover:border-brand-500/80 dark:hover:border-brand-500/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Meta Header */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <Badge variant="brand" size="sm">
                    {guide.category}
                  </Badge>

                  <div className="flex items-center gap-1 text-[11px] font-medium text-surface-500 dark:text-surface-400">
                    <Clock className="w-3 h-3 text-surface-400" />
                    <span>{guide.readTime}</span>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug mb-3">
                  <Link href={`/guides/${guide.slug}`} className="focus:outline-none focus:underline">
                    {guide.title}
                  </Link>
                </h2>

                {/* Summary */}
                <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-400 leading-relaxed line-clamp-3 mb-6">
                  {guide.summary}
                </p>
              </div>

              {/* Card Footer: Target Tool & CTA */}
              <div className="pt-4 border-t border-surface-100 dark:border-surface-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] text-surface-400 dark:text-surface-500 font-mono">
                    Companion Tool:
                  </span>
                  <Link
                    href={guide.relatedTool.route}
                    className="font-semibold text-surface-700 dark:text-surface-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1"
                  >
                    <span>{guide.relatedTool.name}</span>
                    <ChevronRight className="w-3 h-3 text-surface-400" />
                  </Link>
                </div>

                <Link
                  href={`/guides/${guide.slug}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 hover:bg-brand-50 dark:hover:bg-brand-950/60 text-surface-900 dark:text-surface-100 hover:text-brand-600 dark:hover:text-brand-400 border border-surface-200 dark:border-surface-700 hover:border-brand-300 dark:hover:border-brand-800 text-xs font-semibold transition-all duration-150"
                >
                  <span>Read Full Guide</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-14 rounded-2xl bg-gradient-to-br from-brand-50 via-white to-indigo-50 dark:from-brand-950/40 dark:via-surface-900 dark:to-indigo-950/30 border border-brand-200/70 dark:border-brand-900/60 p-8 text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-6 shadow-xs">
          <div className="max-w-2xl mb-6 sm:mb-0">
            <h3 className="text-xl font-bold text-surface-900 dark:text-surface-100">
              Need to process your documents right now?
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-surface-600 dark:text-surface-400 leading-relaxed">
              Explore our full suite of free browser utilities for Aadhaar, PAN, and Ration card cropping, passport photo sheets, perspective correction, and ATS resumes. Zero uploads, zero tracking.
            </p>
          </div>

          <Link
            href="/tools"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all duration-150 shrink-0"
          >
            <span>Explore All Free Utilities</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
