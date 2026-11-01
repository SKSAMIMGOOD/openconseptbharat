import React from "react";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
}) => {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-surface-200/90 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-subtle",
        className
      )}
      role="status"
    >
      <div className="w-14 h-14 rounded-2xl bg-surface-50 text-surface-400 border border-surface-200/80 flex items-center justify-center mx-auto mb-4">
        {icon || <SearchX className="w-7 h-7" />}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-surface-900">{title}</h3>
      <p className="text-xs sm:text-sm text-surface-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>

      {actionLabel && (
        <div className="mt-6">
          {actionHref ? (
            <Link href={actionHref}>
              <Button variant="secondary" size="sm">
                {actionLabel}
              </Button>
            </Link>
          ) : onAction ? (
            <Button variant="secondary" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
};
