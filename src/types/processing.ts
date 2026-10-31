export type ProcessingStatus = "idle" | "preparing" | "processing" | "completed" | "error";

export interface ProcessingProgress {
  stage: string;
  percent: number;
  message?: string;
}

export interface ProcessingState<TResult = unknown> {
  status: ProcessingStatus;
  progress: ProcessingProgress;
  error: string | null;
  result: TResult | null;
}

export interface ExportOptions {
  format: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  quality?: number; // 0.0 to 1.0
  fileName?: string;
  dpi?: number;
}
