import React from "react";
import { cn } from "@/lib/utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  hoverEffect = false,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        "bg-white dark:bg-surface-900 rounded-xl border border-surface-200/80 dark:border-surface-800 shadow-subtle p-6 transition-all duration-200 text-surface-900 dark:text-surface-100",
        hoverEffect && "hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-card hover:-translate-y-0.5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
