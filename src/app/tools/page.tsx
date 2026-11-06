"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Grid3x3,
  Camera,
  Scissors,
  Printer,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { TOOLS } from "@/constants/tools";
import { ToolCategory } from "@/types/tools";
import { ToolCard } from "@/components/common/ToolCard";
import { SearchBar } from "@/components/common/SearchBar";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { PrivacyNotice } from "@/components/common/PrivacyNotice";
import { RecentlyUsedSection } from "@/components/dashboard/RecentlyUsedSection";

const CATEGORY_TABS: { id: "all" | ToolCategory; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All Utilities", icon: Grid3x3 },
  { id: "photo-studio", label: "Photo Studio", icon: Camera },
  { id: "image-tools", label: "Image Tools", icon: Scissors },
  { id: "photo-printing", label: "Photo Printing", icon: Printer },
  { id: "utilities", label: "Utilities", icon: SlidersHorizontal },
];

function normalizeCategory(cat: string | null): "all" | ToolCategory {
  if (!cat || cat === "all") return "all";
  // Support legacy category aliases
  if (cat === "photo") return "photo-studio";
  if (cat === "document") return "utilities";
  if (cat === "pdf") return "photo-printing";
  if (cat === "resume") return "utilities";
  if (
    cat === "photo-studio" ||
    cat === "image-tools" ||
    cat === "photo-printing" ||
    cat === "utilities"
  ) {
    return cat as ToolCategory;
  }
  return "all";
}

function ToolsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawCategory = searchParams.get("category");
  const initialCategory = normalizeCategory(rawCategory);

  const [selectedCategory, setSelectedCategory] = useState<"all" | ToolCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCategorySelect = (categoryId: "all" | ToolCategory) => {
    setSelectedCategory(categoryId);
    const params = new URLSearchParams(window.location.search);
    if (categoryId === "all") {
      params.delete("category");
    } else {
      params.set("category", categoryId);
    }
    const newQuery = params.toString() ? `?${params.toString()}` : "/tools";
    router.replace(newQuery, { scroll: false });
  };

  // Filter tools based on search query and selected category
  const filteredTools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return TOOLS.filter((tool) => {
      // Category matching
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

  // Compute live counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: TOOLS.length };
    CATEGORY_TABS.forEach((tab) => {
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
    handleCategorySelect("all");
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <PageHeader
        title="All Browser Utilities"
        subtitle="Explore our complete suite of browser-native photo, document, and printing tools. Zero server uploads."
        badge={`${TOOLS.length} Client-Side Utilities`}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "All Tools" },
        ]}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex-1 w-full">
        {/* Recently Used Tools Bar (if user has opened tools) */}
        <RecentlyUsedSection />

        {/* Search & Category Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-surface-200 p-4 sm:p-5 shadow-subtle mb-8 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="w-full md:max-w-md">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={() => setSearchQuery("")}
                placeholder="Search tools by name, description, features, or keyword..."
              />
            </div>

            {/* Quick Status / Reset */}
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
                  <span>Reset all filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div
            className="pt-2 border-t border-surface-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
            role="tablist"
            aria-label="Filter utilities by category"
          >
            {CATEGORY_TABS.map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = selectedCategory === tab.id;
              const count = categoryCounts[tab.id] || 0;

              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => handleCategorySelect(tab.id)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} showCategoryTag />
            ))}
          </div>
        ) : (
          <div className="my-12">
            <EmptyState
              title="No utilities matched your search"
              description={`We couldn't find any tools matching "${searchQuery}". Try searching for terms like "passport", "crop", "background", "sheet", "Aadhaar", or "resume".`}
              actionLabel="Clear search & reset filters"
              onAction={handleResetFilters}
            />
          </div>
        )}

        {/* Global Privacy Guarantee Notice */}
        <PrivacyNotice variant="card" className="mt-8" />
      </main>
    </div>
  );
}

export default function ToolsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-50 flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-sm text-surface-500">
            <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading tools catalog...</span>
          </div>
        </div>
      }
    >
      <ToolsContent />
    </Suspense>
  );
}
