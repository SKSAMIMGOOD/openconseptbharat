"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Sparkles,
  Grid,
  Camera,
  CreditCard,
  FileSpreadsheet,
  FileText,
  SlidersHorizontal,
} from "lucide-react";
import { TOOLS, TOOL_CATEGORIES } from "@/constants/tools";
import { ToolCategory } from "@/types/tools";
import { ToolCard } from "@/components/common/ToolCard";
import { SearchBar } from "@/components/common/SearchBar";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { PrivacyNotice } from "@/components/common/PrivacyNotice";

const CATEGORY_TABS: { id: "all" | ToolCategory; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All Utilities", icon: Grid },
  { id: "photo", label: "Photo Tools", icon: Camera },
  { id: "document", label: "Document Tools", icon: CreditCard },
  { id: "pdf", label: "PDF Tools", icon: FileSpreadsheet },
  { id: "resume", label: "Resume & CV Tools", icon: FileText },
];

function ToolsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialCategory = (searchParams.get("category") as ToolCategory) || "all";
  const [selectedCategory, setSelectedCategory] = useState<"all" | ToolCategory>(
    CATEGORY_TABS.some((tab) => tab.id === initialCategory) ? initialCategory : "all"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const handleCategorySelect = (categoryId: "all" | ToolCategory) => {
    setSelectedCategory(categoryId);
    // Update URL query parameters without reloading
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
          tool.categories.includes(selectedCategory);
      }

      // Search matching
      let matchesSearch = true;
      if (query) {
        const inName = tool.name.toLowerCase().includes(query);
        const inShortDesc = tool.shortDescription.toLowerCase().includes(query);
        const inDesc = tool.description.toLowerCase().includes(query);
        const inFeatures = tool.features.some((f) => f.toLowerCase().includes(query));
        const inBadge = tool.badge?.toLowerCase().includes(query) || false;
        matchesSearch = inName || inShortDesc || inDesc || inFeatures || inBadge;
      }

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  // Compute live counts per category (under current search query)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: TOOLS.length };
    CATEGORY_TABS.forEach((tab) => {
      if (tab.id === "all") return;
      const catId = tab.id as ToolCategory;
      counts[catId] = TOOLS.filter(
        (t) => t.category === catId || t.categories.includes(catId)
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
        badge="8 Client-Side Utilities"
        breadcrumbs={[{ label: "All Tools" }]}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex-1 w-full">
        {/* Search & Category Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-surface-200 p-4 sm:p-5 shadow-subtle mb-8 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="w-full md:max-w-md">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={() => setSearchQuery("")}
                placeholder="Search tools by name, keyword, or document type..."
              />
            </div>

            {/* Quick Status / Reset */}
            <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-surface-500">
              <span>
                Showing <strong className="text-surface-900">{filteredTools.length}</strong> of{" "}
                {TOOLS.length} utilities
              </span>
              {(searchQuery || selectedCategory !== "all") && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="font-semibold text-brand-600 hover:text-brand-800 hover:underline"
                >
                  Reset all filters
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="pt-2 border-t border-surface-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} showCategoryTag />
            ))}
          </div>
        ) : (
          <div className="my-12">
            <EmptyState
              title="No utilities matched your search"
              description={`We couldn't find any tools matching "${searchQuery}". Try searching for terms like "passport", "crop", "PAN", "PDF", or "resume".`}
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
