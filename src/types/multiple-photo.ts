import { DimensionUnit } from "./crop-preset";
import {
  SheetPaperSize,
  SheetOrientation,
  SheetMargins,
  SheetSpacing,
  CutGuidesConfig,
  PhotoPlacement,
  SheetCalculationResult,
  SheetExportFormat,
} from "./photo-sheet";

/**
 * An individual uploaded photograph tracked in browser memory.
 */
export interface UploadedPhoto {
  /** Unique ephemeral identifier */
  id: string;
  /** Browser File object */
  file: File;
  /** Original file name */
  name: string;
  /** File size in bytes */
  size: number;
  /** Natural pixel width */
  width: number;
  /** Natural pixel height */
  height: number;
  /** Aspect ratio (width / height) */
  aspectRatio: number;
  /** Ephemeral tracked blob URL for display */
  previewUrl: string;
  /** Decoded HTMLImageElement ready for canvas rendering */
  imageElement?: HTMLImageElement;
  /** Requested copy count for this specific photo */
  copies: number;
}

/**
 * Configurable physical dimensions for photos on the sheet.
 */
export interface MultiplePhotoDimensions {
  /** Physical width in current unit */
  width: number;
  /** Physical height in current unit */
  height: number;
  /** Measurement unit (inch, cm, mm) */
  unit: DimensionUnit;
}

/**
 * Complete configuration for the Multiple Photo Maker tool.
 */
export interface MultiplePhotoConfig {
  /** Physical dimensions of each photo */
  dimensions: MultiplePhotoDimensions;
  /** Target DPI resolution (150, 200, 300, 600) */
  dpi: number;
  /** Target paper size ('4x6' or 'a4') */
  paperSize: SheetPaperSize;
  /** Sheet orientation ('portrait' or 'landscape') */
  orientation: SheetOrientation;
  /** Default copies per photo applied to new uploads */
  defaultCopiesPerPhoto: number;
  /** Sheet margins in millimeters */
  margins: SheetMargins;
  /** Inter-photo spacing in millimeters */
  spacing: SheetSpacing;
  /** Columns per row constraint: 'auto' (up to 4) or 1..4 */
  columnsMode: "auto" | 1 | 2 | 3 | 4;
  /** Cutting guides configuration */
  cutGuides: CutGuidesConfig;
}

/**
 * Result of arranging multiple photos across the calculated sheet grid.
 */
export interface MultiPhotoArrangementResult {
  /** Underlying sheet calculation result */
  layout: SheetCalculationResult;
  /** Total copies requested across all uploaded photos */
  totalRequestedCopies: number;
  /** Total photos successfully placed on this sheet */
  totalPlacedPhotos: number;
  /** Number of photo copies that exceeded sheet capacity */
  unplacedCopiesCount: number;
  /** Whether requested copies exceed sheet capacity */
  isCapacityExceeded: boolean;
  /** Placed photo item pairs: placement rectangle + corresponding photo */
  placements: Array<{
    placement: PhotoPlacement;
    photo: UploadedPhoto;
    photoIndex: number;
    copyIndex: number;
  }>;
}
