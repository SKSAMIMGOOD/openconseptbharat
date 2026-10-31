"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  Sparkles,
  Zap,
  Lock,
  ArrowRight,
  FileCheck,
  HardDriveDownload,
} from "lucide-react";
import { TOOLS, TOOL_CATEGORIES } from "@/constants/tools";
import { ToolCategory } from "@/types/tools";
import { CategorySection } from "@/components/dashboard/CategorySection";
import { PrivacyHighlights } from "@/components/dashboard/PrivacyHighlights";
import { FileDropzone } from "@/components/common/FileDropzone";
import { NotificationBanner } from "@/components/common/NotificationBanner";
import { useNotification } from "@/hooks/useNotification";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | "all">("all");
  const { notifications, notify, removeNotification } = useNotification();

  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchesSearch =
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === "all" || tool.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleDemoFileSelect = (file: File) => {
    notify({
      type: "success",
      title: "File Inspected In-Memory",
      message: `"${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB) loaded strictly into client memory. 0 bytes uploaded.`,
      duration: 6000,
    });
  };

  return (
    <div className="flex-1 flex flex-col">
      <NotificationBanner notifications={notifications} onDismiss={removeNotification} />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-surface-200/80 pt-16 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(#e0e7ff_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 shadow-subtle mb-6 animate-in fade-in">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Zero-Upload Guarantee • 100% In-Browser Execution</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-surface-900 tracking-tight max-w-4xl mx-auto leading-tight">
            High-Performance Utility Studio.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">
              Private by Design.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-surface-600 max-w-2xl mx-auto leading-relaxed">
            Crop government ID cards, generate passport photo sheets, and edit documents directly inside your browser. No files are ever sent to an external server.
          </p>

          {/* Quick Stats Banner */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-surface-600">
            <div className="flex items-center gap-1.5 font-medium">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>0 Server Uploads</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5 font-medium">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Instant WebAssembly Speed</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5 font-medium">
              <HardDriveDownload className="w-4 h-4 text-brand-600" />
              <span>300 DPI Print Calibration</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>8 Modular Tools</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full" id="tools">
        {/* Search & Category Filter Bar */}
        <div className="bg-white rounded-2xl border border-surface-200 p-4 shadow-subtle mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search tools (e.g., PAN, Passport, Crop)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white text-surface-900 placeholder:text-surface-400"
            />
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                selectedCategory === "all"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-surface-100 text-surface-700 hover:bg-surface-200"
              }`}
            >
              All Utilities ({TOOLS.length})
            </button>
            {TOOL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                  selectedCategory === cat.id
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-surface-100 text-surface-700 hover:bg-surface-200"
                }`}
              >
                {cat.title.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Display */}
        {selectedCategory === "all" && searchQuery === "" ? (
          <div>
            {TOOL_CATEGORIES.map((category) => {
              const categoryTools = TOOLS.filter((t) => t.category === category.id);
              return (
                <CategorySection
                  key={category.id}
                  category={category}
                  tools={categoryTools}
                />
              );
            })}
          </div>
        ) : (
          <div className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-surface-900">
                Found {filteredTools.length} {filteredTools.length === 1 ? "tool" : "tools"}
              </h2>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-brand-600 hover:underline font-medium"
                >
                  Clear search
                </button>
              )}
            </div>

            {filteredTools.length === 0 ? (
              <div className="bg-white rounded-2xl border border-surface-200 p-12 text-center max-w-md mx-auto">
                <FileCheck className="w-10 h-10 text-surface-400 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-surface-900">No matching tools found</h3>
                <p className="text-xs text-surface-500 mt-1">
                  Try adjusting your search query or switching categories.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTools.map((tool) => (
                  <div key={tool.id}>
                    {/* Render tool card */}
                    <Link
                      href={tool.route}
                      className="group flex flex-col justify-between bg-white rounded-2xl border border-surface-200/90 p-6 shadow-subtle hover:shadow-float hover:border-brand-300 hover:-translate-y-1 transition-all duration-200 h-full"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                            {tool.badge || "Utility"}
                          </span>
                          <span className="text-xs text-surface-400 font-mono">
                            {tool.maxFileSizeMB}MB Max
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-surface-900 group-hover:text-brand-600 transition-colors">
                          {tool.name}
                        </h3>
                        <p className="text-xs text-surface-600 mt-2 line-clamp-2">
                          {tool.shortDescription}
                        </p>
                      </div>

                      <div className="mt-6 pt-3 border-t border-surface-100 flex items-center justify-between text-xs font-semibold text-brand-600">
                        <span>Launch Tool</span>
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Interactive Dropzone Inspector Preview Showcase */}
        <section className="bg-white rounded-3xl border border-surface-200/90 p-8 sm:p-12 mb-16 shadow-subtle">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Dropzone Component Showcase
            </span>
            <h2 className="text-2xl font-bold text-surface-900 mt-1 tracking-tight">
              Test Client-Side File Ingestion
            </h2>
            <p className="text-sm text-surface-600 mt-2">
              Drop any document or image below to verify client-side validation and ephemeral memory isolation. Notice that your network tab records zero outbound payload requests.
            </p>
          </div>

          <FileDropzone
            label="Drop an image or PDF to inspect in browser"
            hint="Supports JPG, PNG, WebP, and PDF up to 25 MB"
            onFileSelect={handleDemoFileSelect}
            maxSizeMB={25}
          />
        </section>

        {/* Privacy Architectural Showcase */}
        <PrivacyHighlights />
      </main>
    </div>
  );
}
