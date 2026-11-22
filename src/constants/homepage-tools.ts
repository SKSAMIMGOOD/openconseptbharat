import { TOOLS } from "./tools.ts";
import type { ToolMetadata } from "../types/tools.d.ts";

/**
 * Free Voter ID Card Crop Tool — Homepage Exposure
 * Deep-links directly to Document Studio with Voter ID / e-EPIC preset selected.
 */
export const VOTER_ID_TOOL: ToolMetadata = {
  id: "voter-id-crop",
  name: "Free Voter ID Card Crop Tool",
  category: "utilities",
  categories: ["utilities", "document", "pdf"],
  shortDescription:
    "Crop and prepare Voter ID / e-EPIC documents for clean, print-ready output.",
  description:
    "Crop and prepare Voter ID / e-EPIC documents for clean, print-ready output with automatic front and back alignment and high-contrast text sharpening.",
  route: "/tools/document-studio?type=voter-id",
  status: "ready",
  badge: "e-EPIC",
  iconName: "Award",
  features: [
    "e-EPIC PDF & high-res image input",
    "Auto dual-side front & back crop",
    "Standard ISO ID-1 CR80 card size",
    "Printable A4 layout generation",
  ],
  fileAccept: ["application/pdf", "image/jpeg", "image/png"],
  maxFileSizeMB: 30,
};

/**
 * Free Custom Document Crop Tool — Homepage Exposure
 * Deep-links directly to Document Studio with Custom Document preset selected.
 */
export const CUSTOM_DOCUMENT_TOOL: ToolMetadata = {
  id: "custom-document-crop",
  name: "Free Custom Document Crop Tool",
  category: "utilities",
  categories: ["utilities", "document", "pdf"],
  shortDescription:
    "Crop and prepare custom ID cards, certificates and other documents for printing.",
  description:
    "Crop and prepare custom ID cards, certificates and other documents for printing with flexible aspect ratios and single or dual-sided workflows.",
  route: "/tools/document-studio?type=custom",
  status: "ready",
  badge: "Custom Crop",
  iconName: "FileText",
  features: [
    "Custom aspect ratio crop",
    "Front, Back or Single-side",
    "Zero-upload client-side memory",
    "High-res PNG, JPEG & Print PDF",
  ],
  fileAccept: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
  maxFileSizeMB: 30,
};

/**
 * Tools specifically configured for the Homepage tools grid.
 * Replaces the generic "Document Studio" card with dedicated cards for
 * "Free Voter ID Card Crop Tool" and "Free Custom Document Crop Tool".
 */
export const HOMEPAGE_TOOLS: ToolMetadata[] = TOOLS.flatMap((tool) => {
  if (tool.id === "document-studio") {
    return [VOTER_ID_TOOL, CUSTOM_DOCUMENT_TOOL];
  }
  return [tool];
});
