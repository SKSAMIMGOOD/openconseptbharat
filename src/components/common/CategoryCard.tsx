import React from "react";
import Link from "next/link";
import {
  Camera,
  CreditCard,
  FileSpreadsheet,
  FileText,
  ArrowRight,
} from "lucide-react";
import { CategoryMetadata } from "@/types/tools";
import { cn } from "@/lib/utils/cn";

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  Camera,
  CreditCard,
  FileSpreadsheet,
  FileText,
};

// Subtle accent themes for different categories
const ACCENT_STYLES: Record<string, { iconBg: string; iconColor: string; borderHover: string; badge: string }> = {
  photo: {
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    borderHover: "hover:border-blue-300",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
  },
  document: {
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
    borderHover: "hover:border-teal-300",
    badge: "bg-teal-50 text-teal-700 border-teal-200",
  },
  pdf: {
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    borderHover: "hover:border-violet-300",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
  },
  resume: {
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    borderHover: "hover:border-indigo-300",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
};

export interface CategoryCardProps {
  category: CategoryMetadata;
  className?: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, className }) => {
  const IconComponent = CATEGORY_ICON_MAP[category.iconName] || FileText;
  const accent = ACCENT_STYLES[category.id] || ACCENT_STYLES.photo;

  return (
    <Link
      href={`/tools?category=${category.id}`}
      className={cn(
        "group flex flex-col justify-between bg-white rounded-2xl border border-surface-200/90 p-6 shadow-subtle hover:shadow-float hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500",
        accent.borderHover,
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105",
              accent.iconBg,
              accent.iconColor
            )}
          >
            <IconComponent className="w-6 h-6" />
          </div>
          {category.toolCount !== undefined && (
            <span
              className={cn(
                "text-xs font-semibold px-2.5 py-0.5 rounded-full border",
                accent.badge
              )}
            >
              {category.toolCount} {category.toolCount === 1 ? "Tool" : "Tools"}
            </span>
          )}
        </div>

        <h3 className="text-base font-bold text-surface-900 group-hover:text-brand-600 transition-colors">
          {category.title}
        </h3>
        <p className="text-xs font-medium text-surface-500 mt-0.5">
          {category.subtitle}
        </p>
        <p className="text-xs text-surface-600 mt-2 line-clamp-2 leading-relaxed">
          {category.description}
        </p>
      </div>

      <div className="mt-6 pt-3 border-t border-surface-100 flex items-center justify-between text-xs font-semibold text-brand-600 group-hover:text-brand-700">
        <span>Explore Category</span>
        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
};
