/**
 * Global Application Settings & User Preferences Type Contracts
 * Phase 07: Centralized Preference Management & Design System
 */

export type AppTheme = "light" | "dark" | "system";

export type DefaultDpi = 150 | 200 | 300 | 600;

export type DefaultPhotoUnit = "mm" | "cm" | "inch";

export type DefaultExportFormat = "image/png" | "image/jpeg";

export type DefaultPreviewMode =
  | "split_slider"
  | "side_by_side"
  | "processed_only"
  | "original_only";

export type PerformancePreference = "auto" | "webgpu" | "webgl" | "wasm";

export interface AppSettings {
  /** Application visual theme */
  theme: AppTheme;
  /** Default DPI for photo cropping, DPI calculator, and print sheets (150, 200, 300, 600) */
  defaultDpi: DefaultDpi;
  /** Default physical dimension measurement unit (mm, cm, inch) */
  defaultUnit: DefaultPhotoUnit;
  /** Default export format for processed photos and sheets (image/png, image/jpeg) */
  defaultExportFormat: DefaultExportFormat;
  /** Default quality for JPEG exports (0.70 to 1.00) */
  defaultJpegQuality: number;
  /** Default background color for cutouts and framing (transparent, #FFFFFF, etc.) */
  defaultBackgroundColor: string;
  /** Default preview comparison mode for background remover */
  defaultPreviewMode: DefaultPreviewMode;
  /** Preferred neural network / image processing runtime provider */
  performancePreference: PerformancePreference;
}

export type SettingsKey = keyof AppSettings;
