"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/common/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Client-side local error reporting
    console.error("Local client error encountered:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-surface-900 mb-2">An Unexpected Client Error Occurred</h1>
      <p className="text-sm text-surface-600 max-w-md mb-6">
        {error.message || "An unexpected error occurred in your local browser runtime. No data was lost or transmitted."}
      </p>
      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={() => reset()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Reload Workspace
        </Button>
        <a
          href="/"
          className="px-4 py-2 rounded-lg bg-surface-100 text-surface-800 text-sm font-semibold hover:bg-surface-200 transition-colors"
        >
          Return Home
        </a>
      </div>
    </div>
  );
}
