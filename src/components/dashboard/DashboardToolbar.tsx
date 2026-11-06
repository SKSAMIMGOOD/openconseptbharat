"use client";

import React from "react";
import {
  Grid3x3,
  Camera,
  Scissors,
  Printer,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { ToolCategory } from "@/types/tools";
import { SearchBar } from "@/components/common/SearchBar";
import { cn } from "@/lib/utils/cn";

export interface DashboardCategoryTab {
  id: "all" | ToolCategory;
  label: string;
  icon: React.ElementType;
}

export const DASHBOARD_CATEGORY_TABS: DashboardCategoryTab[] = [
  { id: "all", label: "All Utilities", icon: Grid3x3 },
  { id: "photo-studio", label: "Photo Studio", icon: Camera },
  { id: "image-tools", label: "Image Tools", icon: Scissors },
  { id: "photo-printing", label: "Photo Printing", icon: Printer },
  { id: "utilities", label: "Utilities", icon: SlidersHorizontal },
];

export interface DashboardToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: "all" | ToolCategory;
  onCategorySelect: (category: "all" | ToolCategory) => void;
  categoryCounts: Record<string, number>;
  totalTools: number;
  filteredCount: number;
  onResetFilters: () => void;
  className?: string;
}

export const DashboardToolbar: React.FC<DashboardToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategorySelect,
  categoryCounts,
  totalTools,
  filteredCount,
  onResetFilters,
  className,
}) => {
  const isFiltered = Boolean(searchQuery.trim() || selectedCategory !== "all");

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-surface-200 p-4 sm:p-5 shadow-subtle mb-8 space-y-4",
        className
      )}
    >
      {/* Top Row: Search Input and Status Counter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="w-full md:max-w-md">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            onClear={() => onSearchChange("")}
            placeholder="Search tools by name, description, features, or keyword..."
          />
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-surface-500">
          <span>
            Showing <strong className="text-surface-900 font-bold">{filteredCount}</strong> of{" "}
            <strong className="text-surface-900">{totalTools}</strong> utilities
          </span>
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded px-1.5 py-0.5"
            >
              <X className="w-3 h-3" />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs Row */}
      <div
        className="pt-2 border-t border-surface-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
        role="tablist"
        aria-label="Tool category filters"
      >
        {DASHBOARD_CATEGORY_TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isSelected = selectedCategory === tab.id;
          const count = categoryCounts[tab.id] ?? 0;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isSelected}
              onClick={() => onCategorySelect(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                isSelected
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-surface-50 text-surface-700 hover:bg-surface-100 border border-surface-200/80"
              )}
            >
              <TabIcon
                className={cn(
                  "w-3.5 h-3.5",
                  isSelected ? "text-white" : "text-surface-500"
                )}
              />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                  isSelected
                    ? "bg-brand-700 text-white"
                    : "bg-surface-200 text-surface-600"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
