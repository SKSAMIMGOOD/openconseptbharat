import Link from "react";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-100 text-surface-600 flex items-center justify-center mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-surface-900 mb-2">Page or Tool Not Found</h1>
      <p className="text-sm text-surface-600 max-w-md mb-6">
        The tool or page you requested does not exist or may have been reorganized.
      </p>
      <a
        href="/"
        className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
      >
        Return to Home Dashboard
      </a>
    </div>
  );
}
