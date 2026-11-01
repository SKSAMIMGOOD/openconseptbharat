import React from "react";
import { Breadcrumb, BreadcrumbItem } from "./Breadcrumb";
import { Badge } from "./Badge";
import { cn } from "@/lib/utils/cn";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  breadcrumbs,
  actions,
  className,
}) => {
  return (
    <div className={cn("bg-white border-b border-surface-200/80 py-8 mb-8", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-4">
            <Breadcrumb items={breadcrumbs} />
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            {badge && (
              <Badge variant="brand" size="sm" className="mb-2">
                {badge}
              </Badge>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 text-sm sm:text-base text-surface-600 max-w-3xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
        </div>
      </div>
    </div>
  );
};
