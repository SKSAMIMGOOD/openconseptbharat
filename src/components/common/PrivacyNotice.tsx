import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight, Lock, ServerOff, Cpu, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface PrivacyNoticeProps {
  variant?: "card" | "banner" | "compact";
  className?: string;
}

export const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({
  variant = "card",
  className,
}) => {
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium",
          className
        )}
      >
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>100% In-Browser • Zero Server Uploads</span>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div
        className={cn(
          "bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-emerald-950",
          className
        )}
      >
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold">Strict Client-Side Privacy Guarantee</h4>
            <p className="text-xs text-emerald-800 mt-0.5">
              Files are processed locally in your browser and never sent to our servers. No account required.
            </p>
          </div>
        </div>
        <Link
          href="/privacy"
          className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 shrink-0 hover:underline"
        >
          <span>Privacy Architecture</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-white rounded-3xl border border-surface-200/90 p-6 sm:p-8 shadow-subtle",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-surface-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-surface-900">Your Privacy is Guaranteed</h3>
            <p className="text-xs text-surface-500">Every byte stays strictly inside your browser</p>
          </div>
        </div>
        <Link
          href="/privacy"
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
        >
          <span>Read Privacy Architecture</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200/60">
          <div className="flex items-center gap-2 mb-1.5 font-bold text-surface-900">
            <ServerOff className="w-4 h-4 text-emerald-600" />
            <span>Zero Server Uploads</span>
          </div>
          <p className="text-surface-600 leading-relaxed">
            Uploaded files are not sent to our servers. Network payload traffic remains 0 bytes.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200/60">
          <div className="flex items-center gap-2 mb-1.5 font-bold text-surface-900">
            <Cpu className="w-4 h-4 text-brand-600" />
            <span>Local Browser Engine</span>
          </div>
          <p className="text-surface-600 leading-relaxed">
            HTML5 Canvas, WebAssembly, and local workers execute all pixel transformations directly.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200/60">
          <div className="flex items-center gap-2 mb-1.5 font-bold text-surface-900">
            <Lock className="w-4 h-4 text-teal-600" />
            <span>No Account Required</span>
          </div>
          <p className="text-surface-600 leading-relaxed">
            Use all basic utilities instantly without creating accounts, logins, or tracking cookies.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200/60">
          <div className="flex items-center gap-2 mb-1.5 font-bold text-surface-900">
            <RefreshCw className="w-4 h-4 text-violet-600" />
            <span>Ephemeral Memory</span>
          </div>
          <p className="text-surface-600 leading-relaxed">
            Temporary processing data is cleared immediately upon download or when closing the tab.
          </p>
        </div>
      </div>
    </div>
  );
};
