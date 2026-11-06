"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Zap,
  Lock,
  Camera,
  Scissors,
  SlidersHorizontal,
  CreditCard,
  FileText,
  Printer,
  Grid3x3,
  HardDriveDownload,
  Info,
  Layers,
  X,
} from "lucide-react";
import { TOOLS, TOOL_CATEGORIES } from "@/constants/tools";
import { ToolCategory } from "@/types/tools";
import { CategoryCard } from "@/components/common/CategoryCard";
import { ToolCard } from "@/components/common/ToolCard";
import { PrivacyNotice } from "@/components/common/PrivacyNotice";
import { FileDropzone } from "@/components/common/FileDropzone";
import { NotificationBanner } from "@/components/common/NotificationBanner";
import { SearchBar } from "@/components/common/SearchBar";
import { EmptyState } from "@/components/common/EmptyState";
import { RecentlyUsedSection } from "@/components/dashboard/RecentlyUsedSection";
import { useNotification } from "@/hooks/useNotification";

const CATEGORY_FILTER_TABS: { id: "all" | ToolCategory; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All Utilities", icon: Grid3x3 },
  { id: "photo-studio", label: "Photo Studio", icon: Camera },
  { id: "image-tools", label: "Image Tools", icon: Scissors },
  { id: "photo-printing", label: "Photo Printing", icon: Printer },
  { id: "utilities", label: "Utilities", icon: SlidersHorizontal },
];

export default function HomePage() {
  const { notifications, notify, removeNotification } = useNotification();
  const [activeMockupTab, setActiveMockupTab] = useState<"passport" | "card" | "resume">("passport");
  const [selectedCategory, setSelectedCategory] = useState<"all" | ToolCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleDemoFileSelect = (file: File) => {
    notify({
      type: "success",
      title: "File Inspected In-Memory",
      message: `"${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB) loaded strictly into client memory. 0 bytes uploaded.`,
      duration: 6000,
    });
  };

  // Filter tools based on search query and selected category
  const filteredTools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return TOOLS.filter((tool) => {
      // Category filter
      let matchesCategory = true;
      if (selectedCategory !== "all") {
        matchesCategory =
          tool.category === selectedCategory ||
          (tool.categories && tool.categories.includes(selectedCategory));
      }

      // Search matching
      let matchesSearch = true;
      if (query) {
        const inName = tool.name.toLowerCase().includes(query);
        const inShortDesc = tool.shortDescription.toLowerCase().includes(query);
        const inDesc = tool.description.toLowerCase().includes(query);
        const inFeatures = tool.features.some((f) => f.toLowerCase().includes(query));
        const inBadge = tool.badge?.toLowerCase().includes(query) || false;
        const inId = tool.id.toLowerCase().includes(query);
        matchesSearch = inName || inShortDesc || inDesc || inFeatures || inBadge || inId;
      }

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  // Compute tool counts per category tab
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: TOOLS.length };
    CATEGORY_FILTER_TABS.forEach((tab) => {
      if (tab.id === "all") return;
      const catId = tab.id as ToolCategory;
      counts[catId] = TOOLS.filter(
        (t) => t.category === catId || (t.categories && t.categories.includes(catId))
      ).length;
    });
    return counts;
  }, []);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
  };

  return (
    <div className="flex-1 flex flex-col">
      <NotificationBanner notifications={notifications} onDismiss={removeNotification} />

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-white border-b border-surface-200/80 pt-14 pb-16 lg:pt-18 lg:pb-20">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Zero-Upload Guarantee Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-subtle mb-6 animate-in fade-in">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero-Upload Guarantee • 100% In-Browser Execution</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-surface-900 tracking-tight leading-[1.15]">
              Everything You Need to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-indigo-600 to-teal-600">
                Edit, Crop & Print.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base sm:text-lg text-surface-600 leading-relaxed max-w-2xl mx-auto">
              Professional browser-native tools for photo editing, passport photos, government ID card crops, and photo printing. Zero server uploads, zero data tracking.
            </p>

            {/* Actions: Primary Explore Tools & Secondary Privacy Information */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <a
                href="#dashboard-tools"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 transition-all shadow-sm hover:shadow gap-2 group"
              >
                <span>Explore Tools</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </a>

              <Link
                href="/privacy"
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold bg-surface-100 text-surface-800 hover:bg-surface-200 hover:text-surface-900 transition-colors border border-surface-200/80 gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Privacy Guarantee</span>
              </Link>
            </div>

            {/* Architectural Trust Points */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-surface-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>0 Server Uploads</span>
              </div>
              <span className="text-surface-300 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Instant WASM Speed</span>
              </div>
              <span className="text-surface-300 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <HardDriveDownload className="w-3.5 h-3.5 text-brand-600" />
                <span>300 DPI Print Calibration</span>
              </div>
              <span className="text-surface-300 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>8 In-Browser Utilities</span>
              </div>
            </div>
          </div>

          {/* Visual Illustration Mockup */}
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-surface-200 shadow-float overflow-hidden">
              {/* Window Header */}
              <div className="bg-surface-100/90 border-b border-surface-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-surface-300" />
                  <div className="w-3 h-3 rounded-full bg-surface-300" />
                  <div className="w-3 h-3 rounded-full bg-surface-300" />
                  <span className="ml-2 text-xs font-mono text-surface-500 hidden sm:inline">
                    studio.local/in-memory-canvas
                  </span>
                </div>

                {/* Illustration View Switcher */}
                <div className="flex items-center gap-1 bg-surface-200/70 p-1 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveMockupTab("passport")}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      activeMockupTab === "passport" ? "bg-white text-surface-900 shadow-sm" : "text-surface-600 hover:text-surface-900"
                    }`}
                  >
                    Passport Studio
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMockupTab("card")}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      activeMockupTab === "card" ? "bg-white text-surface-900 shadow-sm" : "text-surface-600 hover:text-surface-900"
                    }`}
                  >
                    ID-1 Card Cropper
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMockupTab("resume")}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      activeMockupTab === "resume" ? "bg-white text-surface-900 shadow-sm" : "text-surface-600 hover:text-surface-900"
                    }`}
                  >
                    ATS Vector Resume
                  </button>
                </div>
              </div>

              {/* Window Canvas Stage Body */}
              <div className="p-6 sm:p-8 bg-surface-50">
                {activeMockupTab === "passport" && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-7 space-y-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <Camera className="w-3.5 h-3.5" />
                        <span>35 × 45 mm Passport Calibration</span>
                      </div>
                      <h3 className="text-xl font-bold text-surface-900">
                        Precision Biometric Alignment & Multi-Copy Sheet Tiling
                      </h3>
                      <p className="text-xs text-surface-600 leading-relaxed">
                        Automatic head-to-chin guidelines, uniform white/blue backdrop replacement, and 300 DPI high-resolution export ready for official passport and visa submissions.
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-surface-200 font-medium text-surface-700">
                          ✓ Indian Passport 3.5×4.5 cm
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-surface-200 font-medium text-surface-700">
                          ✓ US Visa 2×2 Inch
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-surface-200 font-medium text-surface-700">
                          ✓ A4 & 4×6&quot; Photo Sheets
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-5 flex justify-center">
                      <div className="relative w-44 h-56 bg-white rounded-2xl border-2 border-brand-500 shadow-card p-3 flex flex-col items-center justify-between">
                        <div className="absolute inset-x-4 top-10 border-b border-dashed border-brand-400 text-[10px] text-brand-600 font-mono text-center">
                          Crown Guide
                        </div>
                        <div className="absolute inset-x-4 bottom-14 border-b border-dashed border-brand-400 text-[10px] text-brand-600 font-mono text-center">
                          Chin Guide
                        </div>
                        <div className="w-20 h-24 rounded-full bg-surface-200/80 mt-4 flex items-center justify-center">
                          <Camera className="w-8 h-8 text-surface-400" />
                        </div>
                        <div className="w-full text-center">
                          <span className="text-[11px] font-bold text-surface-800 block">35 × 45 mm</span>
                          <span className="text-[10px] font-mono text-emerald-600">300 DPI • Local RAM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeMockupTab === "card" && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-7 space-y-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>ISO/IEC 7810 ID-1 Standard (85.6 × 53.98 mm)</span>
                      </div>
                      <h3 className="text-xl font-bold text-surface-900">
                        Standard Wallet Card Proportions & High-Contrast Text
                      </h3>
                      <p className="text-xs text-surface-600 leading-relaxed">
                        Extract front and back segments of PAN, Aadhaar, and Ration card documents into standard physical card dimensions ready for PVC card printers and lamination sheets.
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-surface-200 font-medium text-surface-700">
                          ✓ Dual-Side Front & Back Alignment
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-surface-200 font-medium text-surface-700">
                          ✓ Greyscale & Text Sharpening
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-surface-200 font-medium text-surface-700">
                          ✓ Direct Printable A4 PDF Output
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-5 flex justify-center">
                      <div className="w-56 h-36 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl p-3 text-white shadow-card flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <div className="w-6 h-5 rounded bg-amber-400/80" />
                          <span className="text-[10px] font-mono tracking-widest uppercase">ID-1 WALLET</span>
                        </div>
                        <div className="space-y-1">
                          <div className="w-24 h-2 bg-white/40 rounded" />
                          <div className="w-36 h-2 bg-white/30 rounded" />
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-teal-100">
                          <span>85.6 × 53.98 mm</span>
                          <span>300 DPI</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeMockupTab === "resume" && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-7 space-y-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <FileText className="w-3.5 h-3.5" />
                        <span>ATS-Friendly Vector PDF Engine</span>
                      </div>
                      <h3 className="text-xl font-bold text-surface-900">
                        Professional Structure With Zero Employment Profiling
                      </h3>
                      <p className="text-xs text-surface-600 leading-relaxed">
                        Design clean, modern curriculum vitae with live side-by-side rendering and vector PDF export. Personal information never touches any analytics or recruitment database.
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-surface-200 font-medium text-surface-700">
                          ✓ Machine-Readable ATS Layouts
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-surface-200 font-medium text-surface-700">
                          ✓ Direct pdf-lib Vector Export
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-surface-200 font-medium text-surface-700">
                          ✓ 100% In-Browser Privacy
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-5 flex justify-center">
                      <div className="w-40 h-52 bg-white rounded-xl border border-surface-300 shadow-card p-3 flex flex-col gap-2">
                        <div className="w-16 h-2 bg-indigo-600 rounded" />
                        <div className="w-24 h-1.5 bg-surface-300 rounded" />
                        <div className="w-full border-t border-surface-200 my-1" />
                        <div className="space-y-1.5">
                          <div className="w-12 h-1.5 bg-surface-400 rounded" />
                          <div className="w-full h-1 bg-surface-200 rounded" />
                          <div className="w-5/6 h-1 bg-surface-200 rounded" />
                        </div>
                        <div className="space-y-1.5 mt-1">
                          <div className="w-14 h-1.5 bg-surface-400 rounded" />
                          <div className="w-full h-1 bg-surface-200 rounded" />
                          <div className="w-4/5 h-1 bg-surface-200 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CENTRAL DASHBOARD SECTION */}
      <section className="py-14 sm:py-18 bg-surface-50 border-b border-surface-200/80" id="dashboard-tools">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Recently Used Section (hydrated from localStorage) */}
          <RecentlyUsedSection />

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">
                Central Tool Registry
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
                All Browser Utilities
              </h2>
              <p className="text-xs sm:text-sm text-surface-600 mt-1 max-w-2xl">
                Explore our full suite of privacy-first photo, document, and printing workflows. Every tool runs 100% in your browser.
              </p>
            </div>

            <Link
              href="/tools"
              className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors gap-1.5 shrink-0"
            >
              <span>View dedicated catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Search & Category Filter Toolbar */}
          <div className="bg-white rounded-2xl border border-surface-200 p-4 sm:p-5 shadow-subtle mb-8 space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search Bar Input */}
              <div className="w-full md:max-w-md">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onClear={() => setSearchQuery("")}
                  placeholder="Search tools by name, description, features, or keyword..."
                />
              </div>

              {/* Status Counter & Reset Action */}
              <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-surface-500">
                <span>
                  Showing <strong className="text-surface-900 font-bold">{filteredTools.length}</strong> of{" "}
                  <strong className="text-surface-900">{TOOLS.length}</strong> utilities
                </span>
                {(searchQuery || selectedCategory !== "all") && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded px-1.5 py-0.5"
                  >
                    <X className="w-3 h-3" />
                    <span>Reset filters</span>
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div
              className="pt-2 border-t border-surface-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
              role="tablist"
              aria-label="Filter utilities by category"
            >
              {CATEGORY_FILTER_TABS.map((tab) => {
                const TabIcon = tab.icon;
                const isSelected = selectedCategory === tab.id;
                const count = categoryCounts[tab.id] ?? 0;

                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                      isSelected
                        ? "bg-brand-600 text-white shadow-sm"
                        : "bg-surface-50 text-surface-700 hover:bg-surface-100 border border-surface-200/80"
                    }`}
                  >
                    <TabIcon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-surface-500"}`} />
                    <span>{tab.label}</span>
                    <span
                      className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isSelected
                          ? "bg-brand-700 text-white"
                          : "bg-surface-200 text-surface-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tools Grid or Empty State */}
          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} showCategoryTag />
              ))}
            </div>
          ) : (
            <div className="my-10">
              <EmptyState
                title="No utilities matched your search"
                description={`We couldn't find any tools matching "${searchQuery}". Try searching for "passport", "background", "crop", "sheet", "Aadhaar", or "resume".`}
                actionLabel="Clear search & reset filters"
                onAction={handleResetFilters}
              />
            </div>
          )}
        </div>
      </section>

      {/* 3. CATEGORIES SECTION */}
      <section className="py-16 sm:py-20 bg-white border-b border-surface-200/80" id="categories">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">
              Organized Catalog
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
              Explore by Tool Category
            </h2>
            <p className="text-xs sm:text-sm text-surface-600 mt-2">
              Select a specialized category to find tailored utilities for biometric photos, local AI image enhancements, multi-copy print sheets, or government card cropping.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TOOL_CATEGORIES.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. ZERO-UPLOAD INGESTION DEMONSTRATION */}
      <section className="py-16 bg-surface-50 border-b border-surface-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-surface-200/90 p-8 sm:p-12 shadow-subtle">
            <div className="max-w-2xl mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                Interactive Verification Stage
              </span>
              <h2 className="text-2xl font-bold text-surface-900 mt-1 tracking-tight">
                Inspect In-Browser File Ingestion
              </h2>
              <p className="text-xs sm:text-sm text-surface-600 mt-2 leading-relaxed">
                Drop any document or photo below to verify client-side validation and ephemeral memory isolation. Open your browser Developer Tools (F12) to verify that zero network bytes leave your machine.
              </p>
            </div>

            <FileDropzone
              label="Drop an image or PDF to inspect in browser"
              hint="Supports JPG, PNG, WebP, and PDF up to 25 MB. Never uploaded."
              onFileSelect={handleDemoFileSelect}
              maxSizeMB={25}
            />
          </div>
        </div>
      </section>

      {/* 5. PRIVACY SECTION */}
      <section className="py-16 sm:py-20 bg-white" id="privacy-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Architectural Privacy By Design</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
              Strict Zero-Upload Architecture
            </h2>
            <p className="text-xs sm:text-sm text-surface-600 mt-2 leading-relaxed">
              We believe citizen documents and biometric portraits should remain in citizen hands. Here is exactly how our platform protects your digital sovereignty:
            </p>
          </div>

          <PrivacyNotice variant="card" />

          {/* DevTools Verification Callout */}
          <div className="mt-8 p-6 rounded-2xl bg-surface-50 border border-surface-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-200 text-surface-700 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <p className="text-surface-700">
                Want to inspect the network tab yourself? Follow our independent verification instructions.
              </p>
            </div>
            <Link
              href="/privacy"
              className="font-semibold text-brand-600 hover:text-brand-800 hover:underline shrink-0"
            >
              Read Verification Guide &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
