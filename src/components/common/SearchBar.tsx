"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onClear,
  placeholder = "Search utilities (e.g. passport, crop, aadhaar, resume)...",
  className,
  id = "tool-search",
}) => {
  const handleClear = () => {
    onChange("");
    if (onClear) onClear();
  };

  return (
    <div className={cn("relative flex items-center w-full", className)}>
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <div className="absolute left-3.5 text-surface-400 pointer-events-none flex items-center">
        <Search className="w-4 h-4" aria-hidden="true" />
      </div>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 text-sm bg-surface-50 border border-surface-200 rounded-xl text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all shadow-sm"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search input"
          className="absolute right-3 p-1 rounded-md text-surface-400 hover:text-surface-700 hover:bg-surface-200/60 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
