export interface ImageAdjustments {
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  saturation: number; // -100 to 100
  sharpness: number;  // 0 to 100
  rotation: number;   // 0, 90, 180, 270
}

export interface PhotoStudioPresets {
  id: string;
  name: string;
  country: string;
  widthMm: number;
  heightMm: number;
  widthPx: number;
  heightPx: number;
  backgroundColors: string[];
}

export interface MultiplePhotoLayoutConfig {
  paperSize: "A4" | "4x6" | "Letter";
  orientation: "portrait" | "landscape";
  photoWidthMm: number;
  photoHeightMm: number;
  marginMm: number;
  gapMm: number;
  copiesCount: number;
  showCuttingGuides: boolean;
}
