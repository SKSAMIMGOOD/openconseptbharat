/**
 * Design Studio — In-Memory Asset Reference Manager
 *
 * Provides lifecycle management for images, headshots, emblems and logos
 * imported into Design Studio documents:
 * 1. Strictly in client browser RAM (zero network transmission).
 * 2. Deterministic ObjectURL tracking & disposal via project memory utilities.
 * 3. Asynchronous intrinsic dimension inspection without DOM leakage.
 * 4. Image data URL generation for self-contained template export.
 */

import type { DesignAsset } from "../../types/design-studio.ts";
import { createTrackedObjectURL, revokeObjectUrlSafely } from "../utils/memory.ts";
import { validateFile } from "../validation/file-validator.ts";

export class InMemoryAssetManager {
  private assets = new Map<string, DesignAsset>();

  /**
   * Registers a pre-existing or deserialized asset.
   */
  public registerAsset(asset: DesignAsset): void {
    this.assets.set(asset.id, asset);
  }

  /**
   * Retrieves an asset by ID.
   */
  public getAsset(id: string): DesignAsset | undefined {
    return this.assets.get(id);
  }

  /**
   * Returns all currently active assets.
   */
  public getAllAssets(): DesignAsset[] {
    return Array.from(this.assets.values());
  }

  /**
   * Returns an asset record dictionary matching DesignDocument.assets.
   */
  public getAssetRecord(): Record<string, DesignAsset> {
    const record: Record<string, DesignAsset> = {};
    this.assets.forEach((asset, id) => {
      record[id] = asset;
    });
    return record;
  }

  /**
   * Ingests a user-selected File or Blob into client memory.
   * Performs format inspection and dimension calculation.
   */
  public async ingestImageFile(
    file: File | Blob,
    customName?: string
  ): Promise<DesignAsset> {
    // 1. Client-side security and MIME check
    if (file instanceof File) {
      const validation = validateFile(file, {
        maxSizeMB: 25,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
      });
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.error || "Invalid file"}`);
      }
    }

    // 2. Tracked Object URL creation in browser memory
    const objectUrl = createTrackedObjectURL(file);

    // 3. Inspect intrinsic width and height
    const { width, height } = await this.inspectImageDimensions(objectUrl);

    const assetId = `asset-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const fileName =
      customName ||
      (file instanceof File ? file.name : `image-${assetId.slice(-6)}.png`);

    const asset: DesignAsset = {
      id: assetId,
      name: fileName,
      type: file.type === "image/svg+xml" ? "svg" : "image",
      mimeType: file.type || "image/png",
      url: objectUrl,
      width,
      height,
      sizeBytes: file.size,
    };

    this.assets.set(assetId, asset);
    return asset;
  }

  /**
   * Asynchronously reads intrinsic dimensions of an image URL.
   */
  private inspectImageDimensions(
    url: string
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      if (typeof Image === "undefined") {
        // Node / test environment fallback
        resolve({ width: 800, height: 600 });
        return;
      }

      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth || 800,
          height: img.naturalHeight || 600,
        });
      };
      img.onerror = () => {
        reject(new Error("Failed to load and inspect image dimensions"));
      };
      img.src = url;
    });
  }

  /**
   * Revokes and removes an individual asset.
   */
  public releaseAsset(id: string): void {
    const asset = this.assets.get(id);
    if (asset) {
      if (asset.url.startsWith("blob:")) {
        revokeObjectUrlSafely(asset.url);
      }
      this.assets.delete(id);
    }
  }

  /**
   * Clears and revokes all registered assets.
   */
  public dispose(): void {
    this.assets.forEach((asset) => {
      if (asset.url.startsWith("blob:")) {
        revokeObjectUrlSafely(asset.url);
      }
    });
    this.assets.clear();
  }
}
