import React from "react";
import Link from "next/link";
import { Shield, Lock, Cpu, EyeOff } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-surface-200 bg-surface-50/70 text-surface-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Core Architectural Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 border-b border-surface-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100/60 text-emerald-700 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-semibold text-surface-900 text-xs">Zero Server Uploads</h5>
              <p className="text-xs text-surface-500 mt-1">Images & PDFs never transmit beyond your browser runtime.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100/60 text-blue-700 flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-semibold text-surface-900 text-xs">WASM & Canvas Powered</h5>
              <p className="text-xs text-surface-500 mt-1">High-performance processing via HTML Canvas, Workers, and WASM.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100/60 text-amber-700 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-semibold text-surface-900 text-xs">No Persistent Storage</h5>
              <p className="text-xs text-surface-500 mt-1">No database, no cloud buckets, no localStorage caching of files.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100/60 text-purple-700 flex items-center justify-center shrink-0">
              <EyeOff className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-semibold text-surface-900 text-xs">Zero Trackers</h5>
              <p className="text-xs text-surface-500 mt-1">No Google Analytics, advertising tags, or remote telemetry.</p>
            </div>
          </div>
        </div>

        {/* Footer Navigation & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-surface-500">
            <p>© {new Date().getFullYear()} Browser Utility Studio. Designed for privacy, security, and performance.</p>
            <p className="mt-0.5">Independent client-side utility suite inspired by browser-first workflows.</p>
          </div>

          <div className="flex items-center gap-6 text-xs font-medium">
            <Link href="/" className="hover:text-brand-600 transition-colors">
              Home
            </Link>
            <Link href="/privacy" className="hover:text-brand-600 transition-colors">
              Privacy Architecture
            </Link>
            <Link href="/about" className="hover:text-brand-600 transition-colors">
              About
            </Link>
            <span className="text-surface-400">v0.1.0 (Phase 00)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
