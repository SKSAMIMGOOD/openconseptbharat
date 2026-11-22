import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  HelpCircle,
  Info,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  User,
  Wrench,
  XCircle,
} from "lucide-react";
import { GUIDES, getGuideBySlug } from "@/constants/guides";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Badge } from "@/components/common/Badge";
import {
  getGuideBreadcrumbSchema,
  getGuideArticleSchema,
  getGuideHowToSchema,
  getGuideFaqSchema,
} from "@/lib/seo/guide-structured-data";

export interface GuidePageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return GUIDES.map((guide) => ({
    slug: guide.slug,
  }));
}

export function generateMetadata({ params }: GuidePageProps): Metadata {
  const guide = getGuideBySlug(params.slug);

  if (!guide) {
    return {
      title: "Guide Not Found | Print Ready Designs",
    };
  }

  const guideUrl = `/guides/${guide.slug}`;

  return {
    title: {
      absolute: guide.seoTitle,
    },
    description: guide.metaDescription,
    keywords: [
      guide.primaryKeyword,
      guide.title.toLowerCase(),
      `${guide.category.toLowerCase()} guide`,
      "print ready designs tutorial",
    ],
    alternates: {
      canonical: guideUrl,
    },
    openGraph: {
      title: guide.seoTitle,
      description: guide.metaDescription,
      url: guideUrl,
      type: "article",
      siteName: "Print Ready Designs",
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
      authors: [guide.author],
    },
    twitter: {
      card: "summary_large_image",
      title: guide.seoTitle,
      description: guide.metaDescription,
    },
  };
}

export default function GuidePage({ params }: GuidePageProps) {
  const guide = getGuideBySlug(params.slug);

  if (!guide) {
    notFound();
  }

  const breadcrumbSchema = getGuideBreadcrumbSchema(guide);
  const articleSchema = getGuideArticleSchema(guide);
  const howToSchema = getGuideHowToSchema(guide);
  const faqSchema = getGuideFaqSchema(guide);

  const relatedGuideItems = guide.relatedGuides
    .map((slug) => getGuideBySlug(slug))
    .filter((g): g is NonNullable<typeof g> => Boolean(g));

  return (
    <article className="min-h-[calc(100vh-4rem)] bg-surface-50 dark:bg-surface-950 flex flex-col">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(howToSchema),
        }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema),
          }}
        />
      )}

      {/* Guide Header & Navigation Bar */}
      <header className="bg-white dark:bg-surface-900 border-b border-surface-200/90 dark:border-surface-800 py-6 sm:py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/guides"
              className="inline-flex items-center text-xs font-semibold text-surface-500 dark:text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors gap-1.5 p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
              title="Back to Guides directory"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Guides</span>
            </Link>
            <span className="text-surface-300 dark:text-surface-700">|</span>
            <Breadcrumb
              items={[
                { label: "Guides", href: "/guides" },
                { label: guide.title },
              ]}
            />
          </div>

          {/* Badges & Meta Info */}
          <div className="flex flex-wrap items-center gap-3 mb-4 text-xs">
            <Badge variant="brand" size="sm">
              {guide.category}
            </Badge>

            <span className="flex items-center gap-1 text-surface-500 dark:text-surface-400 font-medium">
              <Clock className="w-3.5 h-3.5 text-surface-400" />
              <span>{guide.readTime}</span>
            </span>

            <span className="text-surface-300 dark:text-surface-700">•</span>

            <span className="flex items-center gap-1 text-surface-500 dark:text-surface-400 font-medium">
              <Calendar className="w-3.5 h-3.5 text-surface-400" />
              <span>Updated {guide.updatedAt}</span>
            </span>

            <span className="text-surface-300 dark:text-surface-700">•</span>

            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>100% Client-Side Privacy</span>
            </span>
          </div>

          {/* Primary H1 */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-surface-900 dark:text-surface-100 tracking-tight leading-tight mb-4">
            {guide.title}
          </h1>

          <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-surface-400" />
            <span>By {guide.author}</span>
          </p>
        </div>
      </header>

      {/* Main Guide Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 w-full space-y-12">
        {/* Top Companion Tool Launch Callout */}
        <section
          aria-label="Companion Utility"
          className="rounded-2xl bg-gradient-to-r from-brand-50 to-indigo-50/70 dark:from-brand-950/50 dark:to-indigo-950/40 border border-brand-200 dark:border-brand-800/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
              <Wrench className="w-3.5 h-3.5" />
              <span>Official Free Online Tool</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-surface-900 dark:text-surface-100">
              {guide.relatedTool.name}
            </h2>
            <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-300 max-w-xl leading-relaxed">
              {guide.relatedTool.description}
            </p>
          </div>

          <Link
            href={guide.relatedTool.route}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition-all duration-150 shrink-0 w-full sm:w-auto"
          >
            <span>Open Tool Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>

        {/* Introduction */}
        <section className="prose dark:prose-invert max-w-none">
          <p className="text-base sm:text-lg text-surface-700 dark:text-surface-300 leading-relaxed font-normal">
            {guide.introduction}
          </p>
        </section>

        {/* Key Specifications Grid */}
        {guide.keySpecs && guide.keySpecs.length > 0 && (
          <section
            aria-label="Technical Specifications"
            className="bg-white dark:bg-surface-900 border border-surface-200/90 dark:border-surface-800 rounded-2xl p-6 shadow-xs space-y-4"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h2 className="text-base sm:text-lg font-bold text-surface-900 dark:text-surface-100">
                Key Standards & Specifications
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {guide.keySpecs.map((spec, i) => (
                <div
                  key={i}
                  className="bg-surface-50 dark:bg-surface-800/60 p-3.5 rounded-xl border border-surface-200/60 dark:border-surface-700/60"
                >
                  <dt className="text-[11px] uppercase tracking-wider font-semibold text-surface-400 dark:text-surface-400">
                    {spec.label}
                  </dt>
                  <dd className="text-xs sm:text-sm font-semibold text-surface-900 dark:text-surface-100 mt-1">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Step-by-Step Instructions */}
        <section aria-label="Step by Step Instructions" className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-100 tracking-tight">
              Step-by-Step Instructions
            </h2>
            <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400">
              Follow these practical steps to prepare and export your files with 100% precision.
            </p>
          </div>

          <div className="space-y-6">
            {guide.steps.map((step) => (
              <div
                key={step.stepNumber}
                className="bg-white dark:bg-surface-900 border border-surface-200/90 dark:border-surface-800 rounded-2xl p-6 shadow-xs space-y-4 relative"
              >
                <div className="flex items-start gap-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-600 text-white font-extrabold text-sm shrink-0 shadow-xs">
                    {step.stepNumber}
                  </span>
                  <div className="space-y-2 flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-surface-900 dark:text-surface-100">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-300 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                {step.tip && (
                  <div className="ml-12 flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
                    <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold">Pro Tip: </strong>
                      <span>{step.tip}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Common Mistakes & Practical Tips */}
        {guide.commonMistakes && guide.commonMistakes.length > 0 && (
          <section aria-label="Common Mistakes" className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-100 tracking-tight">
                Common Mistakes to Avoid
              </h2>
              <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400">
                Ensure perfect print results and official compliance by avoiding these frequent pitfalls.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {guide.commonMistakes.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-surface-900 border border-surface-200/90 dark:border-surface-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>Mistake</span>
                    </div>
                    <p className="text-xs font-semibold text-surface-900 dark:text-surface-100">
                      {item.mistake}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-surface-100 dark:border-surface-800/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>The Fix</span>
                    </div>
                    <p className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
                      {item.fix}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Frequently Asked Questions */}
        {guide.faqs && guide.faqs.length > 0 && (
          <section aria-label="Frequently Asked Questions" className="space-y-5">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-100 tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guide.faqs.map((faq, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-surface-900 border border-surface-200/90 dark:border-surface-800 rounded-2xl p-5 shadow-xs space-y-2"
                >
                  <h3 className="text-xs sm:text-sm font-bold text-surface-900 dark:text-surface-100 flex items-start gap-2">
                    <span className="text-brand-600 dark:text-brand-400 font-extrabold shrink-0">Q:</span>
                    <span>{faq.question}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-400 leading-relaxed pl-5">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA Block */}
        <section
          aria-label="Ready to Start"
          className="rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-1.5 text-center sm:text-left">
            <h2 className="text-lg sm:text-xl font-bold">
              Ready to process your {guide.category.toLowerCase()}?
            </h2>
            <p className="text-xs sm:text-sm text-brand-100 max-w-lg leading-relaxed">
              Use our 100% free, private online tool. No account required, zero software installation, and zero file uploads.
            </p>
          </div>

          <Link
            href={guide.relatedTool.route}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-surface-50 text-brand-700 font-bold text-xs sm:text-sm shadow-xs transition-all duration-150 shrink-0"
          >
            <span>Launch {guide.relatedTool.name}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* Related Guides / Next Reading */}
        {relatedGuideItems.length > 0 && (
          <section aria-label="Related Guides" className="space-y-5 pt-6 border-t border-surface-200/80 dark:border-surface-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-surface-900 dark:text-surface-100">
                Related Printing Guides & Tutorials
              </h2>
              <Link
                href="/guides"
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <span>View all guides</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedGuideItems.map((relGuide) => (
                <Link
                  key={relGuide.slug}
                  href={`/guides/${relGuide.slug}`}
                  className="group bg-white dark:bg-surface-900 border border-surface-200/90 dark:border-surface-800 hover:border-brand-500 rounded-2xl p-5 shadow-xs transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                        {relGuide.category}
                      </span>
                      <span className="text-[11px] text-surface-400">
                        {relGuide.readTime}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug">
                      {relGuide.title}
                    </h3>

                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {relGuide.summary}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-surface-100 dark:border-surface-800/80 flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400 gap-1 group-hover:gap-1.5 transition-all">
                    <span>Read Guide</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </article>
  );
}
