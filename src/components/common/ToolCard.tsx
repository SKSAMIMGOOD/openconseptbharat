import React from "react";
import Link from "next/link";
import {
  CreditCard,
  Camera,
  Scissors,
  SlidersHorizontal,
  Fingerprint,
  FileCheck,
  FileText,
  Grid3x3,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { ToolMetadata } from "@/types/tools";
import { Badge } from "@/components/common/Badge";
import { cn } from "@/lib/utils/cn";

const TOOL_ICON_MAP: Record<string, React.ElementType> = {
  CreditCard,
  Camera,
  Scissors,
  SlidersHorizontal,
  Fingerprint,
  FileCheck,
  FileText,
  Grid3x3,
  Grid: Grid3x3,
};

const CATEGORY_ACCENTS: Record<string, { iconBg: string; iconColor: string; hoverBorder: string }> = {
  photo: {
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    hoverBorder: "hover:border-blue-300",
  },
  document: {
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
    hoverBorder: "hover:border-teal-300",
  },
  pdf: {
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    hoverBorder: "hover:border-violet-300",
  },
  resume: {
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    hoverBorder: "hover:border-indigo-300",
  },
};

export interface ToolCardProps {
  tool: ToolMetadata;
  className?: string;
  showCategoryTag?: boolean;
}

export const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  className,
  showCategoryTag = false,
}) => {
  const IconComponent = TOOL_ICON_MAP[tool.iconName] || FileText;
  const accent = CATEGORY_ACCENTS[tool.category] || CATEGORY_ACCENTS.photo;

  return (
    <Link
      href={tool.route}
      className={cn(
        "group relative flex flex-col justify-between bg-white rounded-2xl border border-surface-200/90 p-6 shadow-subtle hover:shadow-float hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500",
        accent.hoverBorder,
        className
      )}
    >
      <div>
        {/* Card Header: Icon & Badges */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 border border-surface-200/60",
              accent.iconBg,
              accent.iconColor
            )}
          >
            <IconComponent className="w-6 h-6" />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {tool.badge && (
              <Badge variant="brand" size="sm">
                {tool.badge}
              </Badge>
            )}
            <Badge variant="success" size="sm" className="hidden sm:inline-flex">
              <ShieldCheck className="w-3 h-3 mr-0.5 text-emerald-600" />
              Local
            </Badge>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-base font-bold text-surface-900 group-hover:text-brand-600 transition-colors">
          {tool.name}
        </h3>
        <p className="text-xs text-surface-600 mt-2 line-clamp-2 leading-relaxed">
          {tool.shortDescription}
        </p>

        {/* Relevant feature labels */}
        <div className="mt-4 pt-3 border-t border-surface-100 flex flex-wrap gap-1.5">
          {tool.features.slice(0, 2).map((feat, idx) => (
            <span
              key={idx}
              className="text-[11px] text-surface-600 bg-surface-50 px-2 py-0.5 rounded-md border border-surface-200/60 truncate max-w-full"
            >
              • {feat}
            </span>
          ))}
        </div>
      </div>

      {/* Card Action Link */}
      <div className="mt-6 pt-2 flex items-center justify-between text-xs font-semibold text-brand-600 group-hover:text-brand-700">
        <span>Open Tool</span>
        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
};
