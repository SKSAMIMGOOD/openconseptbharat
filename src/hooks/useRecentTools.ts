"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ToolMetadata } from "@/types/tools";
import { TOOLS } from "@/constants/tools";
import {
  getRecentTools,
  recordToolUsage,
  clearRecentTools,
  RECENT_TOOLS_EVENT,
} from "@/lib/utils/recent-tools";

export function useRecentTools(catalog: ToolMetadata[] = TOOLS) {
  const [recentTools, setRecentTools] = useState<ToolMetadata[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const validToolIds = useMemo(() => catalog.map((t) => t.id), [catalog]);

  const refresh = useCallback(() => {
    setRecentTools(getRecentTools(catalog));
    setIsLoaded(true);
  }, [catalog]);

  useEffect(() => {
    refresh();

    const handleUpdate = () => refresh();
    window.addEventListener(RECENT_TOOLS_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(RECENT_TOOLS_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [refresh]);

  const clear = useCallback(() => {
    clearRecentTools();
    setRecentTools([]);
  }, []);

  const record = useCallback(
    (toolId: string) => {
      recordToolUsage(toolId, validToolIds);
    },
    [validToolIds]
  );

  return {
    recentTools,
    isLoaded,
    clearRecent: clear,
    recordUsage: record,
    refresh,
  };
}
