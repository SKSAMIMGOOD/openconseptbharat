"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers,
  Menu,
  X,
  Camera,
  Scissors,
  CreditCard,
  FileCheck,
  FileText,
  Grid,
  ShieldCheck,
  Info,
  ChevronRight,
  Printer,
  SlidersHorizontal,
  Settings,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { PrivacyBadge } from "./PrivacyBadge";
import { usePreferences } from "@/hooks/usePreferences";
import { cn } from "@/lib/utils/cn";

interface NavLinkItem {
  label: string;
  href: string;
  icon?: React.ElementType;
}

const PRIMARY_NAV_LINKS: NavLinkItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "All Tools", href: "/tools", icon: Grid },
  { label: "Photo Studio", href: "/tools/photo-studio", icon: Camera },
  { label: "Document Studio", href: "/tools/document-studio", icon: FileCheck },
  { label: "Background Remover", href: "/tools/background-remover", icon: Scissors },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "About", href: "/about", icon: Info },
  { label: "Privacy", href: "/privacy", icon: ShieldCheck },
];

const FEATURED_DRAWER_TOOLS = [
  { name: "Document Studio", route: "/tools/document-studio", icon: FileCheck },
  { name: "Professional Photo Studio", route: "/tools/photo-studio", icon: Camera },
  { name: "AI Background Remover", route: "/tools/background-remover", icon: Scissors },
  { name: "Multiple Photo Maker", route: "/tools/multiple-photo-maker", icon: Printer },
  { name: "Advanced Photo Editor", route: "/tools/photo-editor", icon: SlidersHorizontal },
  { name: "PAN Card Crop", route: "/tools/pan-card-crop", icon: CreditCard },
  { name: "Aadhaar Card Crop", route: "/tools/aadhaar-card-crop", icon: CreditCard },
  { name: "Resume / CV Maker", route: "/tools/resume-maker", icon: FileText },
];

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { settings, updateSettings, isLoaded } = usePreferences();

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
      return pathname === "/" || pathname === "/dashboard";
    }
    if (href === "/tools") {
      return pathname === "/tools";
    }
    if (href.startsWith("/tools?category=")) {
      return false;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const cycleTheme = () => {
    const nextTheme =
      settings.theme === "system"
        ? "light"
        : settings.theme === "light"
        ? "dark"
        : "system";
    updateSettings({ theme: nextTheme });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-200/80 dark:border-surface-800 bg-white/95 dark:bg-surface-900/95 backdrop-blur-md transition-colors duration-150">
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
              <span className="font-bold text-base sm:text-lg text-surface-900 dark:text-surface-100 tracking-tight">
                Browser Utility Studio
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-surface-500 dark:text-surface-400 font-medium">
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
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"
                    : "text-surface-600 hover:text-surface-900 hover:bg-surface-100 dark:text-surface-300 dark:hover:text-surface-100 dark:hover:bg-surface-800"
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

          {/* Theme Quick Toggle Button */}
          {isLoaded && (
            <button
              type="button"
              onClick={cycleTheme}
              className="p-2 rounded-xl text-surface-600 hover:text-surface-900 hover:bg-surface-100 dark:text-surface-400 dark:hover:text-surface-100 dark:hover:bg-surface-800 transition-colors border border-surface-200/80 dark:border-surface-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              title={`Theme: ${settings.theme} (Click to toggle Light / Dark / System)`}
              aria-label={`Current theme is ${settings.theme}. Toggle theme.`}
            >
              {settings.theme === "dark" ? (
                <Moon className="w-4 h-4 text-brand-400" />
              ) : settings.theme === "light" ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Monitor className="w-4 h-4 text-surface-500 dark:text-surface-400" />
              )}
            </button>
          )}

          {/* Direct Settings Link Button */}
          <Link
            href="/settings"
            className={cn(
              "hidden sm:flex p-2 rounded-xl text-surface-600 hover:text-surface-900 hover:bg-surface-100 dark:text-surface-400 dark:hover:text-surface-100 dark:hover:bg-surface-800 transition-colors border border-surface-200/80 dark:border-surface-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              pathname === "/settings" && "bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800"
            )}
            title="Application Settings & User Preferences"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-surface-600 hover:text-surface-900 hover:bg-surface-100 dark:text-surface-300 dark:hover:text-surface-100 dark:hover:bg-surface-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 border border-surface-200/80 dark:border-surface-700"
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
          className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800 rounded-t-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto z-10 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-surface-100 dark:border-surface-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-surface-900 dark:text-surface-100">
                  Navigation Menu
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Primary Nav List */}
            <div className="py-4 space-y-1">
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
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"
                        : "text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      {Icon && <Icon className="w-4 h-4 text-surface-400 dark:text-surface-500" />}
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-surface-300 dark:text-surface-600" />
                  </Link>
                );
              })}
            </div>

            {/* Quick Tools list in Mobile Drawer */}
            <div className="mt-2 pt-4 border-t border-surface-100 dark:border-surface-800">
              <div className="text-[11px] font-bold text-surface-400 uppercase tracking-wider px-3 mb-2">
                Featured Utilities
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {FEATURED_DRAWER_TOOLS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <Link
                      key={t.route}
                      href={t.route}
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2.5 rounded-lg border border-surface-200 dark:border-surface-700 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-surface-50 dark:hover:bg-surface-800 flex items-center justify-between font-medium text-surface-800 dark:text-surface-200"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        <span>{t.name}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-surface-400" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* In-Memory Guarantee Footnote */}
            <div className="mt-5 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700 text-[11px] text-surface-600 dark:text-surface-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Files stay 100% in local memory. 0 bytes uploaded.</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
