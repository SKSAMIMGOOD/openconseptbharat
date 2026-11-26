"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Sparkles,
  Plus,
  CreditCard,
  Heart,
  BookOpen,
  UserCheck,
  Eye,
  Check,
  X,
  Layers,
} from "lucide-react";
import type {
  DesignCategory,
  DesignDocument,
  DesignTemplateDefinition,
  PhysicalDimensions,
} from "@/types/design-studio";
import {
  ALL_DESIGN_TEMPLATES,
  getTemplatesByCategory,
  instantiateTemplate,
} from "@/lib/design-studio/template-registry";
import { createEmptyDesignDocument } from "@/lib/design-studio/template-foundation";
import {
  getDefaultDimensionsForCategory,
  getDimensionPresetsByCategory,
} from "@/constants/design-dimensions";
import { CanvasStage } from "./CanvasStage";

export interface TemplateGalleryProps {
  /** Initial category filter (defaults to "visiting-card") */
  initialCategory?: DesignCategory;
  /** Callback fired when user selects and opens a template or blank document */
  onOpenDocument: (doc: DesignDocument) => void;
  /** Optional container class name */
  className?: string;
}

const CATEGORY_TABS: Array<{
  id: DesignCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
}> = [
  {
    id: "visiting-card",
    label: "Visiting Cards",
    icon: CreditCard,
    tagline: "Standard 3.5×2 inch business calling cards with Front & Back editing",
  },
  {
    id: "wedding-card",
    label: "Wedding Cards",
    icon: Heart,
    tagline: "Royal 5×7 inch wedding invitations and festive ceremonial announcements",
  },
  {
    id: "project-cover",
    label: "Project Covers",
    icon: BookOpen,
    tagline: "Academic A4 assignment & capstone covers for schools and universities",
  },
  {
    id: "id-card",
    label: "ID Cards",
    icon: UserCheck,
    tagline: "Standard CR80 85.6×54 mm staff, student, and event badges",
  },
];

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  initialCategory = "visiting-card",
  onOpenDocument,
  className = "",
}) => {
  const [activeCategory, setActiveCategory] = useState<DesignCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [previewTemplate, setPreviewTemplate] = useState<DesignTemplateDefinition | null>(null);

  // Custom blank canvas sizing modal state
  const [showBlankCustomModal, setShowBlankCustomModal] = useState<boolean>(false);
  const [customWidthMm, setCustomWidthMm] = useState<number>(88.9);
  const [customHeightMm, setCustomHeightMm] = useState<number>(50.8);

  // Filter templates by category and search
  const filteredTemplates = useMemo(() => {
    let list = getTemplatesByCategory(activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return list;
  }, [activeCategory, searchQuery]);

  // Open Template Action
  const handleSelectTemplate = (template: DesignTemplateDefinition) => {
    const instantiated = instantiateTemplate(template);
    onOpenDocument(instantiated);
  };

  // Open Blank Canvas Action
  const handleOpenBlankDefault = () => {
    const emptyDoc = createEmptyDesignDocument(activeCategory);
    onOpenDocument(emptyDoc);
  };

  const handleOpenBlankCustom = () => {
    const dimensions: PhysicalDimensions = {
      widthMm: Math.max(20, customWidthMm),
      heightMm: Math.max(20, customHeightMm),
      bleedMm: 2.0,
      safeMarginMm: 3.0,
      targetDpi: 300,
    };
    const emptyDoc = createEmptyDesignDocument(
      activeCategory,
      `Custom ${activeCategory} Design`,
      customWidthMm >= customHeightMm ? "landscape" : "portrait",
      dimensions
    );
    onOpenDocument(emptyDoc);
    setShowBlankCustomModal(false);
  };

  const activeCategoryMeta = CATEGORY_TABS.find((c) => c.id === activeCategory);

  return (
    <div
      className={`flex flex-col w-full min-h-screen bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100 p-4 sm:p-6 lg:p-8 ${className}`}
      data-testid="template-gallery"
    >
      {/* 1. Gallery Header */}
      <div className="max-w-7xl mx-auto w-full mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-surface-200 dark:border-surface-800">
          <div>
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-semibold text-xs tracking-wider uppercase mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Design Studio Template Catalog</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-surface-900 dark:text-white">
              Choose a Template or Blank Canvas
            </h2>
            <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-1">
              Every template is 100% editable with vector shapes, live text reflow, and high-DPI print precision.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates, tags..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-800 dark:text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
              data-testid="gallery-search-input"
            />
          </div>
        </div>

        {/* 2. Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveCategory(tab.id);
                  setSearchQuery("");
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shadow-xs ${
                  isActive
                    ? "bg-brand-600 text-white shadow-brand-500/20"
                    : "bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 border border-surface-200 dark:border-surface-800"
                }`}
                data-testid={`category-tab-${tab.id}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-brand-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Category Description Banner */}
        {activeCategoryMeta && (
          <div className="text-xs text-surface-500 dark:text-surface-400 pb-2">
            {activeCategoryMeta.tagline}
          </div>
        )}
      </div>

      {/* 3. Templates Grid */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Card 1: Start From Blank Canvas */}
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-surface-300 dark:border-surface-700 rounded-xl bg-white/50 dark:bg-surface-900/40 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50/20 transition-all text-center min-h-[300px] group shadow-xs">
          <div className="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-800 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/50 flex items-center justify-center text-surface-500 dark:text-surface-400 group-hover:text-brand-600 transition-colors mb-4">
            <Plus className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-surface-900 dark:text-white mb-1">
            Start Blank Canvas
          </h2>
          <p className="text-xs text-surface-500 dark:text-surface-400 max-w-[200px] mb-6">
            Create a custom layout using standard category dimensions.
          </p>

          <div className="flex flex-col gap-2 w-full max-w-[200px]">
            <button
              type="button"
              onClick={handleOpenBlankDefault}
              className="w-full py-2 px-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
              data-testid="blank-default-btn"
            >
              Standard Size
            </button>
            <button
              type="button"
              onClick={() => {
                const def = getDefaultDimensionsForCategory(activeCategory);
                setCustomWidthMm(def.widthMm);
                setCustomHeightMm(def.heightMm);
                setShowBlankCustomModal(true);
              }}
              className="w-full py-1.5 px-3 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200 rounded-lg text-xs font-medium transition-colors"
              data-testid="blank-custom-btn"
            >
              Custom Sizing
            </button>
          </div>
        </div>

        {/* Template Cards */}
        {filteredTemplates.map((template) => {
          const docPreview = template.createDocument();
          const pageCount = docPreview.pages.length;
          const { widthMm, heightMm } = docPreview.dimensions;

          return (
            <div
              key={template.id}
              className="flex flex-col bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all group"
              data-testid={`template-card-${template.id}`}
            >
              {/* Card Preview Container */}
              <div
                className="relative bg-surface-100 dark:bg-surface-950 p-4 flex items-center justify-center min-h-[190px] cursor-pointer overflow-hidden"
                onClick={() => setPreviewTemplate(template)}
              >
                {/* Live Mini Preview Render */}
                <div className="pointer-events-none transform scale-90 transition-transform group-hover:scale-95 duration-200">
                  <CanvasStage
                    page={docPreview.pages[0]}
                    dimensions={docPreview.dimensions}
                    orientation={docPreview.orientation}
                    showBleedAndGuides={false}
                    zoom={0.45}
                  />
                </div>

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-surface-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewTemplate(template);
                    }}
                    className="p-2 bg-white text-surface-800 hover:text-brand-600 rounded-full shadow-md text-xs font-semibold"
                    title="Inspect Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTemplate(template);
                    }}
                    className="py-1.5 px-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-md text-xs font-semibold flex items-center gap-1"
                  >
                    <span>Use Template</span>
                  </button>
                </div>

                {/* Page Count Badge */}
                {pageCount > 1 && (
                  <div className="absolute top-2 right-2 bg-surface-900/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs">
                    <Layers className="w-3 h-3" />
                    <span>{pageCount} Pages</span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center justify-between text-[11px] text-surface-400 mb-1">
                  <span className="font-medium">
                    {widthMm} × {heightMm} mm
                  </span>
                  <span className="capitalize">{docPreview.orientation}</span>
                </div>
                <h2 className="text-sm font-bold text-surface-900 dark:text-white truncate">
                  {template.title}
                </h2>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 line-clamp-2 flex-1">
                  {template.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {template.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={() => handleSelectTemplate(template)}
                  className="w-full mt-4 py-2 px-3 bg-surface-50 dark:bg-surface-800 hover:bg-brand-600 hover:text-white dark:hover:bg-brand-600 text-surface-700 dark:text-surface-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-surface-200 dark:border-surface-700"
                  data-testid={`use-template-btn-${template.id}`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Customize Template</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Full Template Preview Modal */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/70 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setPreviewTemplate(null)}
          data-testid="template-preview-modal"
        >
          <div
            className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden relative flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-surface-100 dark:border-surface-800">
              <div>
                <h2 className="text-lg font-bold text-surface-900 dark:text-white">
                  {previewTemplate.title}
                </h2>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {previewTemplate.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="p-1 rounded-full text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Canvas Preview */}
            <div className="bg-surface-100 dark:bg-surface-950 p-6 rounded-xl flex items-center justify-center min-h-[300px] overflow-auto">
              {(() => {
                const doc = previewTemplate.createDocument();
                return (
                  <CanvasStage
                    page={doc.pages[0]}
                    dimensions={doc.dimensions}
                    orientation={doc.orientation}
                    showBleedAndGuides={true}
                    zoom={0.8}
                  />
                );
              })()}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 text-xs font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
              >
                Back to Catalog
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSelectTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                data-testid="modal-use-template-btn"
              >
                <Check className="w-4 h-4" />
                <span>Open in Design Studio</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Blank Canvas Custom Dimensions Modal */}
      {showBlankCustomModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/70 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setShowBlankCustomModal(false)}
          data-testid="custom-dimensions-modal"
        >
          <div
            className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl max-w-sm w-full p-6 shadow-2xl relative flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-surface-100 dark:border-surface-800">
              <h2 className="text-sm font-bold text-surface-900 dark:text-white">
                Custom Page Dimensions (mm)
              </h2>
              <button
                type="button"
                onClick={() => setShowBlankCustomModal(false)}
                className="text-surface-400 hover:text-surface-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-surface-500">Width (mm)</label>
                <input
                  type="number"
                  min={20}
                  max={1000}
                  step={0.1}
                  value={customWidthMm}
                  onChange={(e) => setCustomWidthMm(Number(e.target.value) || 20)}
                  className="px-2.5 py-1.5 border border-surface-200 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-800 text-xs font-medium"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-surface-500">Height (mm)</label>
                <input
                  type="number"
                  min={20}
                  max={1000}
                  step={0.1}
                  value={customHeightMm}
                  onChange={(e) => setCustomHeightMm(Number(e.target.value) || 20)}
                  className="px-2.5 py-1.5 border border-surface-200 dark:border-surface-700 rounded bg-surface-50 dark:bg-surface-800 text-xs font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBlankCustomModal(false)}
                className="px-3 py-1.5 text-xs text-surface-600 hover:bg-surface-100 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOpenBlankCustom}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm"
              >
                Create Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateGallery;
