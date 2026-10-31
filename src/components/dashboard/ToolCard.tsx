import React from "react";
import Link from "next/link";
import {
  CreditCard,
  Camera,
  Wand2,
  FileText,
  UserSquare2,
  Grid3X3,
  Scissors,
  SlidersHorizontal,
  Fingerprint,
  FileCheck,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { ToolMetadata } from "@/types/tools";
import { Badge } from "@/components/common/Badge";

const ICON_MAP: Record<string, React.ElementType> = {
  CreditCard,
  Camera,
  Wand2,
  FileText,
  UserSquare2,
  Grid3X3,
  Scissors,
  SlidersHorizontal,
  Fingerprint,
  FileCheck,
};

export interface ToolCardProps {
  tool: ToolMetadata;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const IconComponent = ICON_MAP[tool.iconName] || CreditCard;

  return (
    <Link
      href={tool.route}
      className="group relative flex flex-col justify-between bg-white rounded-2xl border border-surface-200/90 p-6 shadow-subtle hover:shadow-float hover:border-brand-300 hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
    >
      <div>
        {/* Card Header: Icon & Badges */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="w-12 h-12 rounded-xl bg-surface-50 text-brand-600 flex items-center justify-center border border-surface-200/80 group-hover:bg-brand-50 group-hover:text-brand-600 group-hover:border-brand-200 transition-colors">
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

        {/* Feature Highlights */}
        <div className="mt-4 pt-3 border-t border-surface-100 flex flex-wrap gap-1.5">
          {tool.features.slice(0, 2).map((feat, idx) => (
            <span
              key={idx}
              className="text-[11px] text-surface-500 bg-surface-50 px-2 py-0.5 rounded-md border border-surface-200/50 truncate max-w-full"
            >
              • {feat}
            </span>
          ))}
        </div>
      </div>

      {/* Card Action Link */}
      <div className="mt-6 pt-2 flex items-center justify-between text-xs font-semibold text-brand-600 group-hover:text-brand-700">
        <span>Open Utility</span>
        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
};
