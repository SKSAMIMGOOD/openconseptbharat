import React from "react";
import { CategoryMetadata, ToolMetadata } from "@/types/tools";
import { ToolCard } from "./ToolCard";
import { CreditCard, Camera, Wand2, FileText } from "lucide-react";

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  CreditCard,
  Camera,
  Wand2,
  FileText,
};

export interface CategorySectionProps {
  category: CategoryMetadata;
  tools: ToolMetadata[];
}

export const CategorySection: React.FC<CategorySectionProps> = ({ category, tools }) => {
  const IconComponent = CATEGORY_ICON_MAP[category.iconName] || CreditCard;

  if (tools.length === 0) return null;

  return (
    <section className="mb-12" id={category.id}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
          <IconComponent className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-surface-900 tracking-tight">{category.title}</h2>
          <p className="text-xs text-surface-500 font-medium">{category.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
};
