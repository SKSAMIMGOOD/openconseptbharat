import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center text-xs text-surface-500", className)}>
      <ol className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap">
        <li>
          <Link
            href="/"
            className="flex items-center gap-1 text-surface-500 hover:text-brand-600 transition-colors focus:outline-none focus:underline"
          >
            <Home className="w-3.5 h-3.5 text-surface-400" />
            <span className="sr-only sm:not-sr-only">Home</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center space-x-1.5 sm:space-x-2">
              <ChevronRight className="w-3.5 h-3.5 text-surface-300 shrink-0" aria-hidden="true" />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-brand-600 text-surface-600 transition-colors focus:outline-none focus:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn("font-medium", isLast ? "text-surface-900" : "text-surface-600")}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
