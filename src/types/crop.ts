export interface CropCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type DocumentCardType = "pan" | "aadhaar" | "ration" | "voter-id";

export interface CardSpecification {
  id: DocumentCardType;
  displayName: string;
  targetWidthMm: number;
  targetHeightMm: number;
  aspectRatio: number;
  standardDpi: number;
  hasFrontBack: boolean;
  notes: string[];
}

export interface CardCropResult {
  frontCrop?: Blob;
  backCrop?: Blob;
  mergedPdfBlob?: Blob;
  specs: CardSpecification;
}
