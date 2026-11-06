import type { ToolMetadata } from "@/types/tools";

export const RECENT_TOOLS_KEY = "bus_recent_tools";
export const RECENT_TOOLS_EVENT = "bus_recent_tools_updated";
export const MAX_RECENT_TOOLS = 4;

export interface StoredRecentTool {
  id: string;
  timestamp: number;
}

/**
 * Retrieve sorted recent tool IDs from client localStorage.
 */
export function getRecentToolIds(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(RECENT_TOOLS_KEY);
    if (!raw) return [];

    const parsed: StoredRecentTool[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && typeof item.id === "string")
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .map((item) => item.id)
      .slice(0, MAX_RECENT_TOOLS);
  } catch {
    return [];
  }
}

/**
 * Resolve recent tool IDs to full ToolMetadata records from a provided catalog.
 */
export function resolveRecentTools(
  ids: string[],
  toolCatalog: ToolMetadata[]
): ToolMetadata[] {
  if (!ids || ids.length === 0 || !toolCatalog || toolCatalog.length === 0) return [];

  const toolMap = new Map(toolCatalog.map((tool) => [tool.id, tool]));
  return ids
    .map((id) => toolMap.get(id))
    .filter((tool): tool is ToolMetadata => Boolean(tool));
}

/**
 * Retrieve full ToolMetadata records for recently used tools from a catalog.
 */
export function getRecentTools(toolCatalog: ToolMetadata[] = []): ToolMetadata[] {
  const ids = getRecentToolIds();
  return resolveRecentTools(ids, toolCatalog);
}

/**
 * Record a tool visit into localStorage and dispatch a sync event.
 */
export function recordToolUsage(
  toolId: string,
  validToolIds?: string[]
): void {
  if (typeof window === "undefined" || !toolId) return;

  // If a whitelist of valid tool IDs is supplied, enforce it
  if (validToolIds && !validToolIds.includes(toolId)) return;

  try {
    const raw = window.localStorage.getItem(RECENT_TOOLS_KEY);
    let items: StoredRecentTool[] = [];

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          items = parsed.filter((item) => item && typeof item.id === "string");
        }
      } catch {
        items = [];
      }
    }

    // Remove previous occurrences of this toolId
    items = items.filter((item) => item.id !== toolId);

    // Prepend as most recent
    items.unshift({
      id: toolId,
      timestamp: Date.now(),
    });

    // Keep up to 10 stored records in storage
    items = items.slice(0, 10);

    window.localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(RECENT_TOOLS_EVENT, { detail: { toolId } }));
  } catch {
    // Gracefully ignore storage quota or sandbox restrictions
  }
}

/**
 * Clear the recently used tools history.
 */
export function clearRecentTools(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(RECENT_TOOLS_KEY);
    window.dispatchEvent(new CustomEvent(RECENT_TOOLS_EVENT));
  } catch {
    // Gracefully ignore
  }
}
