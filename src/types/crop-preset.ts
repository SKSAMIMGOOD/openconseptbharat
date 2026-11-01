/**
 * Passport Photo Presets & Crop Editor — Type Contracts (Phase 03C)
 *
 * Defines strictly typed structures for physical photo presets, unit conversions,
 * interactive crop geometry, handle positions, background options, and editor state.
 */

import type { CropCoordinates } from "./crop";
import type { ImageDimensions } from "./image-engine";

export type DimensionUnit = "mm" | "cm" | "inch";

export type PresetCategory =
  | "passport"
  | "portrait"
  | "square"
  | "visa"
  | "identity"
  | "standard"
  | "custom";

/**
 * Specification for a photographic size preset.
 * Kept strictly independent of React UI presentation.
 */
export interface PhotoPreset {
  /** Unique identifier (e.g. 'passport-35-45') */
  readonly id: string;
  /** Human-readable display name (e.g. 'Passport-style photo (35 × 45 mm)') */
  readonly name: string;
  /** Physical width in specified unit */
  readonly width: number;
  /** Physical height in specified unit */
  readonly height: number;
  /** Physical measurement unit */
  readonly unit: DimensionUnit;
  /** Aspect ratio calculated as width / height */
  readonly aspectRatio: number;
  /** Informational description and advisory notes */
  readonly description: string;
  /** Optional category taxonomy */
  readonly category?: PresetCategory;
  /**
   * Whether this preset has been verified against an authoritative government standard.
   * NEVER mark true unless verified against an official government publication.
   */
  readonly isOfficial: boolean;
  /** Official government source URL or authority name if verified */
  readonly officialSource?: string;
  /** Country, region or administrative standard context */
  readonly countryOrStandard?: string;
}

/**
 * Custom dimension specification supplied by user.
 */
export interface CustomDimensionsInput {
  width: number;
  height: number;
  unit: DimensionUnit;
}

/**
 * Crop mode: Fixed to preset aspect ratio or free-form.
 */
export type CropMode = "fixed" | "free";

/**
 * 8 interactive resize handles around the crop boundary.
 */
export type CropHandle =
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w";

/**
 * Studio background color options for canvas composition.
 */
export type BackgroundColorType =
  | "transparent"
  | "white"
  | "light_blue"
  | "light_grey"
  | "custom";

export interface BackgroundOption {
  readonly id: BackgroundColorType;
  readonly name: string;
  readonly colorValue: string;
  readonly description: string;
}

/**
 * Complete state contract for the interactive crop editor.
 */
export interface CropEditorState {
  crop: CropCoordinates;
  preset: PhotoPreset;
  customDimensions: CustomDimensionsInput;
  cropMode: CropMode;
  targetAspectRatio: number | null;
  backgroundColor: string;
  dpi: number;
  zoom: number;
  pan: { x: number; y: number };
  showGrid: boolean;
}

/**
 * Computed crop analysis metrics for HUD and preview display.
 */
export interface CropMetrics {
  originalDimensions: ImageDimensions;
  cropCoordinates: CropCoordinates;
  aspectRatio: number;
  friendlyAspectRatio: string;
  physicalWidthMm: number;
  physicalHeightMm: number;
  targetWidthPx: number;
  targetHeightPx: number;
  dpi: number;
  zoomPercent: number;
}
