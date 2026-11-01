import React from "react";
import Link from "next/link";
import { Shield, Lock, Cpu, EyeOff, Layers, ArrowUpRight } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-surface-200 bg-white text-surface-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Core Architectural Trust Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 border-b border-surface-200/80">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface-50 border border-surface-200/60">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/60">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-bold text-surface-900 text-xs">Zero Server Uploads</h5>
              <p className="text-xs text-surface-500 mt-1">Images & PDFs never leave your browser runtime.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface-50 border border-surface-200/60">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/60">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-bold text-surface-900 text-xs">Canvas & Web Workers</h5>
              <p className="text-xs text-surface-500 mt-1">Hardware-accelerated processing entirely in-memory.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface-50 border border-surface-200/60">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200/60">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-bold text-surface-900 text-xs">Ephemeral Memory</h5>
              <p className="text-xs text-surface-500 mt-1">Temporary buffers revoked automatically when closed.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface-50 border border-surface-200/60">
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center shrink-0 border border-violet-200/60">
              <EyeOff className="w-4 h-4" />
            </div>
            <div>
              <h5 className="font-bold text-surface-900 text-xs">Zero Tracking</h5>
              <p className="text-xs text-surface-500 mt-1">No analytics scripts, tracking cookies, or profiling.</p>
            </div>
          </div>
        </div>

        {/* Multi-Column Links Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 py-12 border-b border-surface-200/80">
          {/* Brand info */}
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Layers className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-surface-900 tracking-tight">
                Browser Utility Studio
              </span>
            </Link>
            <p className="text-xs text-surface-500 max-w-sm leading-relaxed mb-4">
              Professional browser-based utility platform for photo editing, government ID card cropping, passport photo sheets, and ATS resume creation with guaranteed client-side data isolation.
            </p>
            <div className="inline-flex items-center gap-2 text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Client-Side Security Active</span>
            </div>
          </div>

          {/* Column 1: Navigation */}
          <div>
            <h6 className="font-bold text-xs uppercase tracking-wider text-surface-900 mb-4">
              Navigation
            </h6>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/" className="hover:text-brand-600 transition-colors">
                  Home Dashboard
                </Link>
              </li>
              <li>
                <Link href="/tools" className="hover:text-brand-600 transition-colors">
                  All Utilities (8)
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-brand-600 transition-colors">
                  About the Studio
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-brand-600 transition-colors">
                  Privacy Guarantee
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-brand-600 transition-colors">
                  Contact & Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Tool Categories */}
          <div>
            <h6 className="font-bold text-xs uppercase tracking-wider text-surface-900 mb-4">
              Categories
            </h6>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/tools?category=photo" className="hover:text-brand-600 transition-colors">
                  Photo Tools
                </Link>
              </li>
              <li>
                <Link href="/tools?category=document" className="hover:text-brand-600 transition-colors">
                  Document Tools
                </Link>
              </li>
              <li>
                <Link href="/tools?category=pdf" className="hover:text-brand-600 transition-colors">
                  PDF Tools
                </Link>
              </li>
              <li>
                <Link href="/tools?category=resume" className="hover:text-brand-600 transition-colors">
                  Resume & CV Tools
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Privacy */}
          <div>
            <h6 className="font-bold text-xs uppercase tracking-wider text-surface-900 mb-4">
              Legal & Trust
            </h6>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/privacy" className="hover:text-brand-600 transition-colors flex items-center gap-1">
                  <span>Privacy Policy</span>
                  <ArrowUpRight className="w-3 h-3 text-surface-400" />
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-brand-600 transition-colors flex items-center gap-1">
                  <span>Terms of Use</span>
                  <ArrowUpRight className="w-3 h-3 text-surface-400" />
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-brand-600 transition-colors flex items-center gap-1">
                  <span>Security Contact</span>
                  <ArrowUpRight className="w-3 h-3 text-surface-400" />
                </Link>
              </li>
              <li>
                <span className="text-[11px] text-surface-400 block pt-1">
                  Engineered for 100% data sovereignty.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom / Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-surface-500">
          <div>
            <p>© {new Date().getFullYear()} Browser Utility Studio. All rights reserved.</p>
            <p className="mt-0.5 text-[11px] text-surface-400">
              Built with Next.js App Router, TypeScript, and Tailwind CSS. Zero cloud processing.
            </p>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/privacy" className="hover:text-brand-600 transition-colors">
              Zero-Upload Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-brand-600 transition-colors">
              Terms
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-brand-600 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
