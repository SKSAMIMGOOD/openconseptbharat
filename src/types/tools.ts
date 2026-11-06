export type ToolCategory =
  | "photo-studio"
  | "image-tools"
  | "photo-printing"
  | "utilities"
  | "photo"
  | "document"
  | "pdf"
  | "resume";

export type ToolStatus = "ready" | "in-development" | "planned";

export interface ToolMetadata {
  id: string;
  name: string;
  category: ToolCategory;
  categories: ToolCategory[];
  shortDescription: string;
  description: string;
  route: string;
  status: ToolStatus;
  badge?: string;
  iconName: string;
  features: string[];
  fileAccept: string[];
  maxFileSizeMB: number;
}

export interface CategoryMetadata {
  id: ToolCategory;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
  toolCount?: number;
}
