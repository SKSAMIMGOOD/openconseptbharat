import type { Metadata } from "next";
import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 flex items-center justify-center mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">
        Page or Tool Not Found
      </h1>
      <p className="text-sm text-surface-600 dark:text-surface-400 max-w-md mb-6 leading-relaxed">
        The tool or page you requested does not exist or may have been reorganized.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs sm:text-sm font-semibold hover:bg-brand-700 transition-colors shadow-xs"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home Dashboard</span>
      </Link>
    </div>
  );
}
