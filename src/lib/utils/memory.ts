/**
 * Memory Management & Resource Cleanup Utilities
 * Strictly enforces browser-only ephemeral lifecycle rules.
 */

const activeObjectUrls = new Set<string>();

/**
 * Creates a browser object URL from a Blob or File and tracks it for cleanup.
 */
export function createTrackedObjectURL(blob: Blob | File): string {
  if (typeof window === "undefined") return "";
  const url = URL.createObjectURL(blob);
  activeObjectUrls.add(url);
  return url;
}

/**
 * Revokes a tracked or untracked object URL safely and removes it from memory.
 */
export function revokeObjectUrlSafely(url: string | null | undefined): void {
  if (!url || typeof window === "undefined") return;
  if (url.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(url);
      activeObjectUrls.delete(url);
    } catch {
      // Ignore failure if already revoked
    }
  }
}

/**
 * Clears all currently registered blob URLs in memory.
 */
export function revokeAllTrackedObjectURLs(): void {
  if (typeof window === "undefined") return;
  activeObjectUrls.forEach((url) => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Continue cleanup
    }
  });
  activeObjectUrls.clear();
}

/**
 * Cleans up an HTMLCanvasElement by resetting its dimensions and clearing the 2D context.
 */
export function releaseCanvasBuffer(canvas: HTMLCanvasElement | null): void {
  if (!canvas) return;
  try {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    canvas.width = 0;
    canvas.height = 0;
  } catch {
    // Ignore release errors
  }
}
