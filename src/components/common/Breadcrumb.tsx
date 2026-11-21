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
    <nav aria-label="Breadcrumb" className={cn("flex items-center text-xs text-surface-500 dark:text-surface-400", className)}>
      <ol className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap">
        <li>
          <Link
            href="/"
            className="flex items-center gap-1 text-surface-500 hover:text-brand-600 dark:text-surface-400 dark:hover:text-brand-400 transition-colors focus:outline-none focus:underline"
          >
            <Home className="w-3.5 h-3.5 text-surface-400 dark:text-surface-500" />
            <span className="sr-only sm:not-sr-only">Home</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center space-x-1.5 sm:space-x-2">
              <ChevronRight className="w-3.5 h-3.5 text-surface-300 dark:text-surface-600 shrink-0" aria-hidden="true" />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-brand-600 text-surface-600 dark:text-surface-400 dark:hover:text-brand-400 transition-colors focus:outline-none focus:underline truncate max-w-[140px] sm:max-w-none"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    "font-medium truncate max-w-[160px] sm:max-w-none",
                    isLast
                      ? "text-surface-900 dark:text-surface-100 font-semibold"
                      : "text-surface-600 dark:text-surface-400"
                  )}
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
