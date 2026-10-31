"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { NotificationItem } from "@/hooks/useNotification";
import { cn } from "@/lib/utils/cn";

export interface NotificationBannerProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notifications,
  onDismiss,
}) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 sm:px-0">
      {notifications.map((item) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
          info: <Info className="w-5 h-5 text-brand-600 shrink-0" />,
        };

        const bgStyles = {
          success: "bg-emerald-50 border-emerald-200 text-emerald-950",
          warning: "bg-amber-50 border-amber-200 text-amber-950",
          error: "bg-rose-50 border-rose-200 text-rose-950",
          info: "bg-brand-50 border-brand-200 text-brand-950",
        };

        return (
          <div
            key={item.id}
            role="alert"
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl border shadow-card transition-all duration-200 animate-in fade-in slide-in-from-bottom-2",
              bgStyles[item.type]
            )}
          >
            {icons[item.type]}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold">{item.title}</h4>
              {item.message && <p className="text-xs text-surface-600 mt-0.5">{item.message}</p>}
            </div>
            <button
              onClick={() => onDismiss(item.id)}
              className="text-surface-400 hover:text-surface-700 p-1 rounded-md transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
