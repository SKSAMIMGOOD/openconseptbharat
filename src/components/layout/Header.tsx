"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers,
  Menu,
  X,
  Camera,
  CreditCard,
  FileText,
  Grid,
  ShieldCheck,
  Info,
  ChevronRight,
} from "lucide-react";
import { PrivacyBadge } from "./PrivacyBadge";
import { cn } from "@/lib/utils/cn";

interface NavLinkItem {
  label: string;
  href: string;
  icon?: React.ElementType;
}

const PRIMARY_NAV_LINKS: NavLinkItem[] = [
  { label: "Home", href: "/" },
  { label: "All Tools", href: "/tools", icon: Grid },
  { label: "Photo Studio", href: "/tools/photo-studio", icon: Camera },
  { label: "Document Tools", href: "/tools?category=document", icon: CreditCard },
  { label: "Resume Maker", href: "/tools/resume-maker", icon: FileText },
  { label: "About", href: "/about", icon: Info },
  { label: "Privacy", href: "/privacy", icon: ShieldCheck },
];

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    if (href.startsWith("/tools?category=")) {
      // In SSR / static pathname is '/tools'
      return false;
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-200/80 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-xl py-1 shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-teal-500 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base sm:text-lg text-surface-900 tracking-tight">
                Browser Utility Studio
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-surface-500 font-medium">
              Zero-Upload Client Processing
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden lg:flex items-center gap-1 xl:gap-2"
          aria-label="Main Navigation"
        >
          {PRIMARY_NAV_LINKS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-surface-600 hover:text-surface-900 hover:bg-surface-100"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <PrivacyBadge />
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-surface-600 hover:text-surface-900 hover:bg-surface-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 border border-surface-200/80"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer & Backdrop */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          className="fixed inset-0 top-16 z-50 lg:hidden flex flex-col"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-16 bg-surface-900/30 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Menu Panel */}
          <div className="relative w-full bg-white border-b border-surface-200 shadow-float p-5 max-h-[calc(100vh-4rem)] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
            {/* Privacy Badge inside mobile menu */}
            <div className="sm:hidden mb-4 pb-4 border-b border-surface-100">
              <PrivacyBadge />
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-bold text-surface-400 uppercase tracking-wider px-3 mb-1">
                Navigation
              </div>
              {PRIMARY_NAV_LINKS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-surface-700 hover:text-surface-900 hover:bg-surface-100"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      {Icon && <Icon className="w-4 h-4 text-surface-400" />}
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-surface-300" />
                  </Link>
                );
              })}
            </div>

            {/* Quick Tools list in Mobile Drawer */}
            <div className="mt-5 pt-4 border-t border-surface-100">
              <div className="text-[11px] font-bold text-surface-400 uppercase tracking-wider px-3 mb-2">
                Featured Utilities
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <Link
                  href="/tools/photo-studio"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 rounded-lg border border-surface-200 hover:border-brand-300 hover:bg-surface-50 flex items-center justify-between font-medium text-surface-800"
                >
                  <span>Professional Photo Studio</span>
                  <ChevronRight className="w-3.5 h-3.5 text-surface-400" />
                </Link>
                <Link
                  href="/tools/pan-card-crop"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 rounded-lg border border-surface-200 hover:border-brand-300 hover:bg-surface-50 flex items-center justify-between font-medium text-surface-800"
                >
                  <span>PAN Card Crop</span>
                  <ChevronRight className="w-3.5 h-3.5 text-surface-400" />
                </Link>
                <Link
                  href="/tools/aadhaar-card-crop"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 rounded-lg border border-surface-200 hover:border-brand-300 hover:bg-surface-50 flex items-center justify-between font-medium text-surface-800"
                >
                  <span>Aadhaar Card Crop</span>
                  <ChevronRight className="w-3.5 h-3.5 text-surface-400" />
                </Link>
                <Link
                  href="/tools/resume-maker"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2.5 rounded-lg border border-surface-200 hover:border-brand-300 hover:bg-surface-50 flex items-center justify-between font-medium text-surface-800"
                >
                  <span>Resume / CV Maker</span>
                  <ChevronRight className="w-3.5 h-3.5 text-surface-400" />
                </Link>
              </div>
            </div>

            {/* In-Memory Guarantee Footnote */}
            <div className="mt-5 p-3 rounded-xl bg-surface-50 border border-surface-200 text-[11px] text-surface-600 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Files stay 100% in local memory. 0 bytes uploaded.</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
