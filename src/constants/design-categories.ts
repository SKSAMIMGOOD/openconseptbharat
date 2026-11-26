/**
 * Design Studio — Category Definitions & Configuration
 *
 * Defines metadata, UI labels, supported page modes, default layouts,
 * and feature highlights for the 4 core categories:
 * 1. Visiting Cards
 * 2. Wedding Cards
 * 3. School / College Project Covers
 * 4. ID Cards
 */

import type { DesignCategory, DesignOrientation } from "../types/design-studio.ts";
import { getDefaultDimensionsForCategory } from "./design-dimensions.ts";

export interface DesignCategoryConfig {
  id: DesignCategory;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  iconName: string; // Lucide icon identifier
  defaultPageCount: number;
  supportsDualSide: boolean;
  defaultOrientation: DesignOrientation;
  defaultPageNames: string[];
  route: string;
  features: string[];
}

export const DESIGN_CATEGORIES: readonly DesignCategoryConfig[] = [
  {
    id: "visiting-card",
    name: "Visiting Card Maker",
    shortName: "Visiting Cards",
    tagline: "Professional business & calling cards",
    description:
      "Design crisp, high-resolution business cards with Front & Back side editing, standard 3.5×2 inch proportions, and 300 DPI print-ready vector/raster exports.",
    iconName: "CreditCard",
    defaultPageCount: 2,
    supportsDualSide: true,
    defaultOrientation: "landscape",
    defaultPageNames: ["Front Side", "Back Side"],
    route: "/tools/design-studio?category=visiting-card",
    features: [
      "Standard 3.5 × 2 inch (88.9 × 50.8 mm) dimensions",
      "Front and Back side dual-layer canvas",
      "Company logo and avatar placement",
      "300 DPI high-definition export with bleed margins",
    ],
  },
  {
    id: "wedding-card",
    name: "Wedding Card Maker",
    shortName: "Wedding Cards",
    tagline: "Traditional & modern invitation cards",
    description:
      "Craft elegant Indian wedding invitation cards, save-the-date cards, and ceremonial announcements with ornate typography and standard 5×7 inch dimensions.",
    iconName: "Heart",
    defaultPageCount: 1,
    supportsDualSide: true,
    defaultOrientation: "portrait",
    defaultPageNames: ["Main Invitation", "Ceremony Details"],
    route: "/tools/design-studio?category=wedding-card",
    features: [
      "Standard 5 × 7 inch (127 × 177.8 mm) royal portrait format",
      "Luxury typography presets (Playfair, Cinzel, Poppins)",
      "Bespoke floral & tricolor motif framing",
      "Multi-side ceremony schedule support",
    ],
  },
  {
    id: "project-cover",
    name: "School & College Project Cover Maker",
    shortName: "Project Covers",
    tagline: "Academic report & assignment title pages",
    description:
      "Create clean, compliant project cover pages and assignment title sheets for schools, colleges, and universities in standard ISO A4 format with binding margins.",
    iconName: "BookOpen",
    defaultPageCount: 1,
    supportsDualSide: false,
    defaultOrientation: "portrait",
    defaultPageNames: ["Front Cover"],
    route: "/tools/design-studio?category=project-cover",
    features: [
      "Standard ISO A4 (210 × 297 mm) academic page standard",
      "Pre-formatted institution name, project title, and submission details",
      "Institute emblem & department seal placement",
      "Calibrated left-edge safe binding margin (spiral/hardcover)",
    ],
  },
  {
    id: "id-card",
    name: "ID Card Maker",
    shortName: "ID Cards",
    tagline: "Corporate, student & membership badges",
    description:
      "Generate standard ISO/IEC 7810 ID-1 CR80 identity cards with photo headshot frames, barcode/QR placeholders, and front/back credentials.",
    iconName: "Contact",
    defaultPageCount: 2,
    supportsDualSide: true,
    defaultOrientation: "landscape",
    defaultPageNames: ["Front Side", "Back Side"],
    route: "/tools/design-studio?category=id-card",
    features: [
      "Strict ISO/IEC 7810 ID-1 CR80 (85.6 × 53.98 mm) standard",
      "Portrait and Landscape badge lanyard orientation",
      "Photo crop box, barcode, and QR code placeholders",
      "Front and Back side dual verification layout",
    ],
  },
] as const;

/**
 * Look up category configuration by ID.
 */
export function getDesignCategoryConfig(category: DesignCategory): DesignCategoryConfig | undefined {
  return DESIGN_CATEGORIES.find((c) => c.id === category);
}
