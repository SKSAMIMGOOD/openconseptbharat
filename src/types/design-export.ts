/**
 * Design Studio — Export Types & Contracts
 */

import type { DesignDocument, DesignPage } from "@/types/design-studio";

export type ExportFormat = "png" | "jpeg" | "pdf";

export type ExportUnit = "in" | "mm" | "px";

export interface ExportResolutionOption {
  label: string;
  dpi: number;
}

export const EXPORT_DPI_PRESETS: ExportResolutionOption[] = [
  { label: "Draft Screen (72 DPI)", dpi: 72 },
  { label: "Standard Web (150 DPI)", dpi: 150 },
  { label: "High-Res Print (300 DPI)", dpi: 300 },
  { label: "Ultra Crisp Print (600 DPI)", dpi: 600 },
];

export interface DesignExportOptions {
  /** Target file format */
  format: ExportFormat;
  /** Export DPI resolution (default: 300) */
  dpi: number;
  /** Image quality for lossy formats (0.1 to 1.0, default 0.95) */
  quality?: number;
  /** Whether to export transparent background if format is PNG */
  transparentBackground?: boolean;
  /** Flattening background color for JPEG (default: #ffffff) */
  backgroundColor?: string;
  /** Page scope: "all" or specific page ID */
  pageScope: "all" | string;
  /** Custom base filename (without extension) */
  baseFileName?: string;
}

export interface ExportOutputItem {
  blob: Blob;
  fileName: string;
  mimeType: string;
  pageId?: string;
  pageName?: string;
  widthPx: number;
  heightPx: number;
  fileSizeBytes: number;
}

export interface DesignExportResult {
  items: ExportOutputItem[];
  format: ExportFormat;
  totalSizeBytes: number;
}

export interface ExportProgressEvent {
  phase: "init" | "rendering-page" | "compiling" | "done" | "error";
  currentPageIndex: number;
  totalPages: number;
  message: string;
}
