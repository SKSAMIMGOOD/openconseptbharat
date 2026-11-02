/**
 * Client-Side AI Model Loader & Cache Manager
 * 
 * Safely downloads ONNX model weights from reputable public sources (e.g. Hugging Face)
 * and caches them locally in the browser's CacheStorage API.
 * 
 * Guarantees:
 * - Real-time byte-level download progress reporting
 * - Zero repeated downloads once cached
 * - Complete offline execution after initial download
 * - Support for user-provided local .onnx files
 */

export const AI_MODEL_CACHE_NAME = "browser-utility-studio-ai-models-v1";

export interface DownloadProgress {
  loadedBytes: number;
  totalBytes: number;
  percent: number;
}

/**
 * Checks if model weights are already stored in the browser's CacheStorage.
 */
export async function isModelCached(url: string): Promise<boolean> {
  if (typeof window === "undefined" || !("caches" in window)) {
    return false;
  }
  try {
    const cache = await window.caches.open(AI_MODEL_CACHE_NAME);
    const match = await cache.match(url);
    return !!match;
  } catch {
    return false;
  }
}

/**
 * Deletes a cached model from browser storage to free up disk space.
 */
export async function deleteCachedModel(url: string): Promise<boolean> {
  if (typeof window === "undefined" || !("caches" in window)) {
    return false;
  }
  try {
    const cache = await window.caches.open(AI_MODEL_CACHE_NAME);
    return await cache.delete(url);
  } catch {
    return false;
  }
}

/**
 * Fetches model weights with real-time progress tracking and CacheStorage persistence.
 */
export async function fetchModelWeights(
  url: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<ArrayBuffer> {
  // 1. Check browser CacheStorage first
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cache = await window.caches.open(AI_MODEL_CACHE_NAME);
      const cachedResponse = await cache.match(url);
      if (cachedResponse) {
        const buffer = await cachedResponse.arrayBuffer();
        onProgress?.({
          loadedBytes: buffer.byteLength,
          totalBytes: buffer.byteLength,
          percent: 100,
        });
        return buffer;
      }
    } catch (err) {
      console.warn("Failed reading from CacheStorage, falling back to network:", err);
    }
  }

  // 2. Fetch from network with stream tracking
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      mode: "cors",
    });
  } catch (err) {
    throw new Error(
      `Network error fetching AI model weights: ${err instanceof Error ? err.message : String(err)}. Check your internet connection or try loading a local .onnx file.`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Failed to download model weights from ${url}: HTTP ${response.status} ${response.statusText}`
    );
  }

  const contentLengthHeader = response.headers.get("Content-Length");
  const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
  let loadedBytes = 0;

  let buffer: ArrayBuffer;

  if (response.body && typeof ReadableStream !== "undefined") {
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        loadedBytes += value.length;
        const percent = totalBytes > 0
          ? Math.min(100, Math.round((loadedBytes / totalBytes) * 100))
          : Math.min(99, Math.round(loadedBytes / (45 * 1024 * 1024) * 100)); // approximate if no header

        onProgress?.({
          loadedBytes,
          totalBytes: totalBytes || loadedBytes,
          percent,
        });
      }
    }

    // Assemble concatenated byte array
    const combined = new Uint8Array(loadedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    buffer = combined.buffer;
  } else {
    buffer = await response.arrayBuffer();
    onProgress?.({
      loadedBytes: buffer.byteLength,
      totalBytes: buffer.byteLength,
      percent: 100,
    });
  }

  // 3. Store into CacheStorage for instant future loads
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cache = await window.caches.open(AI_MODEL_CACHE_NAME);
      // Clone buffer because Response consumes it
      const responseToCache = new Response(buffer.slice(0), {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Length": String(buffer.byteLength),
        },
      });
      await cache.put(url, responseToCache);
    } catch (err) {
      console.warn("Could not cache model in CacheStorage:", err);
    }
  }

  return buffer;
}

/**
 * Loads model weights directly from a user-uploaded local File (for offline / custom models).
 */
export async function loadLocalModelFile(file: File): Promise<ArrayBuffer> {
  return await file.arrayBuffer();
}
