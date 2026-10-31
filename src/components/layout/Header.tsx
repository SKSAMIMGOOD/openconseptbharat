import React from "react";
import Link from "next/link";
import { Layers, ShieldCheck, Grid } from "lucide-react";
import { PrivacyBadge } from "./PrivacyBadge";

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-200/80 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 group focus:outline-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-surface-900 tracking-tight">Browser Utility Studio</span>
            </div>
            <p className="text-[11px] text-surface-500 font-medium">Privacy-First Document & Photo Tools</p>
          </div>
        </Link>

        {/* Center / Right navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/#tools"
            className="text-sm font-medium text-surface-600 hover:text-brand-600 transition-colors flex items-center gap-1.5"
          >
            <Grid className="w-4 h-4" />
            <span>Tools</span>
          </Link>
          <Link
            href="/privacy"
            className="text-sm font-medium text-surface-600 hover:text-brand-600 transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy Guarantee</span>
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-surface-600 hover:text-brand-600 transition-colors"
          >
            About
          </Link>
        </nav>

        {/* Client-side privacy indicator */}
        <div className="flex items-center gap-3">
          <PrivacyBadge />
        </div>
      </div>
    </header>
  );
};
