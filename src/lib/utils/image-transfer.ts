/**
 * Ephemeral In-Memory Image Transfer Service
 * 
 * Safely passes image files between Print Ready Designs tools in RAM
 * during client-side navigation.
 * 
 * Strict Privacy Invariant:
 * - Never uses localStorage
 * - Never uses SessionStorage
 * - Never uses IndexedDB
 * - Never transmits data to an external server or API
 * - Clears memory immediately once consumed or overwritten
 */

import type { CropCoordinates } from "@/types/crop";

let stagedImage: File | null = null;
let stagedSourceTool: string | null = null;
let stagedMetadata: StagedImageMetadata | null = null;

export interface StagedImageMetadata {
  crop?: CropCoordinates;
  dimensions?: { width: number; height: number; aspectRatio?: number };
  [key: string]: any;
}

export interface StagedImageInfo {
  file: File;
  sourceTool: string;
  timestamp: number;
  metadata?: StagedImageMetadata;
}

let stagedTimestamp: number = 0;

/**
 * Stages a processed image in ephemeral RAM for handoff to another tool.
 */
export function stageImageForTransfer(
  file: File,
  sourceTool: string = "background-remover",
  metadata?: StagedImageMetadata
): void {
  stagedImage = file;
  stagedSourceTool = sourceTool;
  stagedMetadata = metadata || null;
  stagedTimestamp = Date.now();
}

/**
 * Inspects whether an image is currently staged in RAM without consuming it.
 */
export function peekStagedImage(): StagedImageInfo | null {
  if (!stagedImage) return null;
  return {
    file: stagedImage,
    sourceTool: stagedSourceTool || "unknown",
    timestamp: stagedTimestamp,
    metadata: stagedMetadata || undefined,
  };
}

/**
 * Consumes the staged image from RAM and wipes the pointer to ensure zero leakage.
 */
export function consumeTransferredImage(): File | null {
  const file = stagedImage;
  stagedImage = null;
  stagedSourceTool = null;
  stagedMetadata = null;
  stagedTimestamp = 0;
  return file;
}

/**
 * Clears any pending staged image from memory.
 */
export function clearStagedImage(): void {
  stagedImage = null;
  stagedSourceTool = null;
  stagedMetadata = null;
  stagedTimestamp = 0;
}
