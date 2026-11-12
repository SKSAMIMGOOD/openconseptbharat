/**
 * Phase 08A — Centralized Document Configuration Registry
 * Single source of truth for document definitions, available sides, and upload constraints.
 */

import type {
  DocumentTypeDefinition,
  DocumentTypeId,
  DocumentSide,
  CustomSidesMode,
  DocumentReferenceMeasurement,
} from "@/types/document-studio";

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const ALLOWED_DOCUMENT_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
];

export const MAX_DOCUMENT_FILE_SIZE_MB = 30;

/**
 * Standard ISO/IEC 7810 ID-1 (CR80) Standard Output Specifications
 * Universal standard applied to all 4 identity documents (PAN, Aadhaar, Ration, Voter ID).
 */
export const CR80_STANDARD_SPEC = {
  widthMm: 85.6,
  heightMm: 53.98,
  aspectRatio: 85.6 / 53.98, // ~1.58577
  standardDpi: 300,
  targetWidthPx: 1011, // Math.round((85.60 / 25.4) * 300) = 1011
  targetHeightPx: 638, // Math.round((53.98 / 25.4) * 300) = 638
  cornerRadiusMm: 3.18,
  cornerRadiusPx: 38, // Math.round((3.18 / 25.4) * 300) = 38
  format: "ISO/IEC 7810 ID-1 (CR80)",
  orientation: "landscape" as const,
};

/**
 * Exact Measured Normalized Coordinates for PAN Card (US Letter 2550 x 3300 px at 300 DPI)
 * Reference measurements:
 * - Dashed cut box: X 215–2339, Y 2553–3190
 * - Vertical fold: X 1279.5 (normalized ~0.5018)
 * - Front card: X 257–1212, Y 2582–3177 (approx 955 x 597 px, aspect ~1.60)
 * - Back card: X 1345–2299, Y 2584–3180 (approx 955 x 597 px, aspect ~1.60)
 */
export const PAN_CARD_MEASUREMENTS: DocumentReferenceMeasurement = {
  front: {
    xMin: 0.101, // 257 / 2550
    xMax: 0.475, // 1212 / 2550
    yMin: 0.782, // 2582 / 3300
    yMax: 0.963, // 3177 / 3300
  },
  back: {
    xMin: 0.527, // 1345 / 2550
    xMax: 0.902, // 2299 / 2550
    yMin: 0.783, // 2584 / 3300
    yMax: 0.964, // 3180 / 3300
  },
  approxWidthPx: 955,
  approxHeightPx: 597,
  aspectRatio: 1.6,
  description: "PAN Card Microsoft Print to PDF raster layout with dashed cut box and central fold",
};

/**
 * Exact Measured Normalized Coordinates for Aadhaar Card (US Letter 2550 x 3300 px at 300 DPI)
 * Reference measurements:
 * - Horizontal dashed cut line: Y ~ 2382–2383 (normalized ~0.722)
 * - Vertical fold: X ~ 1275–1277 (normalized ~0.5004)
 * - Front card: X 203–1255, Y 2384–3056 (approx 1052 x 672 px)
 * - Back card: X 1297–2349, Y 2384–3056 (approx 1052 x 672 px)
 */
export const AADHAAR_CARD_MEASUREMENTS: DocumentReferenceMeasurement = {
  front: {
    xMin: 0.0796, // 203 / 2550
    xMax: 0.4922, // 1255 / 2550
    yMin: 0.7224, // 2384 / 3300
    yMax: 0.9261, // 3056 / 3300
  },
  back: {
    xMin: 0.5086, // 1297 / 2550
    xMax: 0.9212, // 2349 / 2550
    yMin: 0.7224, // 2384 / 3300
    yMax: 0.9261, // 3056 / 3300
  },
  approxWidthPx: 1052,
  approxHeightPx: 672,
  aspectRatio: 1052 / 672, // ~1.565
  description: "Aadhaar Card lower PVC card section with dashed cut line Y~0.722 and solid card borders",
};

/**
 * Exact Measured Normalized Coordinates for Ration Card (US Letter 2550 x 3300 px at 300 DPI)
 * Reference measurements:
 * - Dashed cut box: X 269–2280, Y 2570–3205
 * - Vertical fold: X ~ 1280 (normalized ~0.5020)
 * - Front card: X 317–1239, Y 2616–3168 (approx 923 x 553 px, aspect ~1.669)
 * - Back card: X 1317–2239, Y 2616–3168 (approx 923 x 553 px, aspect ~1.669)
 * - Bottom-left normalized coordinates (Y inverted):
 *   Front: X 0.1243–0.4859, Y 0.0400–0.2073
 *   Back:  X 0.5165–0.8780, Y 0.0400–0.2073
 */
export const RATION_CARD_MEASUREMENTS: DocumentReferenceMeasurement = {
  front: {
    xMin: 0.1243, // 317 / 2550
    xMax: 0.4859, // 1239 / 2550
    yMin: 0.7927, // 2616 / 3300
    yMax: 0.96, // 3168 / 3300
  },
  back: {
    xMin: 0.5165, // 1317 / 2550
    xMax: 0.878, // 2239 / 2550
    yMin: 0.7927, // 2616 / 3300
    yMax: 0.96, // 3168 / 3300
  },
  approxWidthPx: 923,
  approxHeightPx: 553,
  aspectRatio: 1.669,
  description: "Ration Card lower 35% cut box with dashed boundaries and central fold",
  cutBox: {
    xMin: 0.1055, // 269 / 2550
    xMax: 0.8941, // 2280 / 2550
    yMin: 0.7788, // 2570 / 3300
    yMax: 0.9712, // 3205 / 3300
  },
  bottomLeft: {
    front: {
      xMin: 0.1243,
      xMax: 0.4859,
      yMin: 0.04, // 1 - 0.9600
      yMax: 0.2073, // 1 - 0.7927
    },
    back: {
      xMin: 0.5165,
      xMax: 0.878,
      yMin: 0.04, // 1 - 0.9600
      yMax: 0.2073, // 1 - 0.7927
    },
  },
};

/**
 * Exact Measured Coordinates for Voter ID Card (e-EPIC Vector PDF A4 ~595 x 842 pt)
 * Reference measurements:
 * - Top dashed line: Y ~ 70 pt
 * - Bottom dashed line: Y ~ 275 pt
 * - Vertical fold: X ~ 302 pt
 * - Front card: X 32.5–277.5 pt, Y 95–249 pt (245 x 154 pt, aspect ~1.591)
 * - Back card: X 327.03–572.03 pt, Y 95–249 pt (245 x 154 pt, aspect ~1.591)
 * Normalized coordinates:
 * - Front: X 0.0546–0.4664, Y 0.1128–0.2957
 * - Back: X 0.5496–0.9614, Y 0.1128–0.2957
 * Notice: Located at TOP of page!
 */
export const VOTER_ID_MEASUREMENTS: DocumentReferenceMeasurement = {
  front: {
    xMin: 0.0546, // 32.5 / 595.28
    xMax: 0.4664, // 277.5 / 595.28
    yMin: 0.1128, // 95 / 841.89
    yMax: 0.2957, // 249 / 841.89
  },
  back: {
    xMin: 0.5496, // 327.03 / 595.28
    xMax: 0.9614, // 572.03 / 595.28
    yMin: 0.1128, // 95 / 841.89
    yMax: 0.2957, // 249 / 841.89
  },
  approxWidthPx: 245,
  approxHeightPx: 154,
  aspectRatio: 1.591,
  description: "Voter ID Card (e-EPIC) vector PDF top-aligned cards (X: 32.5-277.5 / 327.03-572.03, Y: 95-249 pt)",
};

/**
 * Centralized Document Type Definitions.
 * All 4 primary documents (PAN, Aadhaar, Voter ID, Ration Card) configure
 * standardized ISO/IEC 7810 ID-1 CR80 dimensions (85.60 mm x 53.98 mm)
 * and provide document-specific auto-detection strategies.
 */
export const DOCUMENT_TYPES: DocumentTypeDefinition[] = [
  {
    id: "aadhaar",
    name: "Aadhaar Card",
    shortName: "Aadhaar",
    category: "Identity & Resident",
    description: "Standard UIDAI identity card featuring biometric photo and address with QR code.",
    supportedSides: ["front", "back"],
    defaultSides: ["front", "back"],
    allowsSideSelection: false,
    targetDimensions: {
      widthMm: CR80_STANDARD_SPEC.widthMm,
      heightMm: CR80_STANDARD_SPEC.heightMm,
      aspectRatio: CR80_STANDARD_SPEC.aspectRatio,
      standardDpi: CR80_STANDARD_SPEC.standardDpi,
      note: "Standard UIDAI wallet card format (ISO/IEC 7810 ID-1 CR80: 85.60 mm x 53.98 mm).",
    },
    frontNotes: "Contains resident name, DOB/Year, gender, photo, and 12-digit Aadhaar number.",
    backNotes: "Contains resident address, secure QR code, and UIDAI contact helpline.",
    badge: "UIDAI / Identity",
    iconName: "Fingerprint",
  },
  {
    id: "pan",
    name: "PAN Card",
    shortName: "PAN",
    category: "Tax & Financial",
    description: "Permanent Account Number card issued by the Indian Income Tax Department. Both front and back cards extracted from lower dashed cut box.",
    supportedSides: ["front", "back"],
    defaultSides: ["front", "back"],
    allowsSideSelection: false,
    targetDimensions: {
      widthMm: CR80_STANDARD_SPEC.widthMm,
      heightMm: CR80_STANDARD_SPEC.heightMm,
      aspectRatio: CR80_STANDARD_SPEC.aspectRatio,
      standardDpi: CR80_STANDARD_SPEC.standardDpi,
      note: "Standard financial card specification (ISO/IEC 7810 ID-1 CR80: 85.60 mm x 53.98 mm).",
    },
    frontNotes: "Front card containing PAN number, cardholder photo, name, father/parent name, and DOB.",
    backNotes: "Back card containing informational text, QR/barcode, and Income Tax Department helpline.",
    badge: "Income Tax Dept",
    iconName: "CreditCard",
  },
  {
    id: "voter-id",
    name: "Voter ID Card",
    shortName: "Voter ID",
    category: "Electoral Identity",
    description: "Electors Photo Identity Card (e-EPIC) vector PDF with top-aligned embedded card placements.",
    supportedSides: ["front", "back"],
    defaultSides: ["front", "back"],
    allowsSideSelection: false,
    targetDimensions: {
      widthMm: CR80_STANDARD_SPEC.widthMm,
      heightMm: CR80_STANDARD_SPEC.heightMm,
      aspectRatio: CR80_STANDARD_SPEC.aspectRatio,
      standardDpi: CR80_STANDARD_SPEC.standardDpi,
      note: "Modern PVC EPIC conforms to ISO/IEC 7810 ID-1 CR80: 85.60 mm x 53.98 mm.",
    },
    frontNotes: "Displays EPIC number, voter photograph, voter name, and father/husband name.",
    backNotes: "Displays residential address, assembly constituency, polling station, and electoral officer signature.",
    badge: "Election Commission",
    iconName: "Award",
  },
  {
    id: "ration-card",
    name: "Ration Card",
    shortName: "Ration Card",
    category: "Food & Public Distribution",
    description: "Digital ration card / NFSA e-Ration document with dashed cut box in lower 35% of page.",
    supportedSides: ["front", "back"],
    defaultSides: ["front", "back"],
    allowsSideSelection: false,
    targetDimensions: {
      widthMm: CR80_STANDARD_SPEC.widthMm,
      heightMm: CR80_STANDARD_SPEC.heightMm,
      aspectRatio: CR80_STANDARD_SPEC.aspectRatio,
      standardDpi: CR80_STANDARD_SPEC.standardDpi,
      note: "Standardized to ISO/IEC 7810 ID-1 CR80 format (85.60 mm x 53.98 mm) for wallet card printing. State booklet designs vary across Indian states.",
    },
    frontNotes: "Displays digital ration card number, category (NFSA/SPHH), family head, dealer name & QR.",
    backNotes: "Displays full family address, registered members, issuing authority signature & helpline.",
    badge: "Food & Supplies",
    iconName: "FileCheck",
  },
  {
    id: "custom",
    name: "Custom Document",
    shortName: "Custom",
    category: "Generic & Other",
    description: "Any government ID, certificate, student card, driving licence, or custom printed card.",
    supportedSides: ["front", "back"],
    defaultSides: ["front", "back"],
    allowsSideSelection: true,
    targetDimensions: undefined, // Configured interactively
    frontNotes: "Primary or front side of your custom document.",
    backNotes: "Secondary or reverse side of your custom document (optional).",
    badge: "Custom Document",
    iconName: "FileText",
  },
];

export const DEFAULT_DOCUMENT_TYPE_ID: DocumentTypeId = "aadhaar";

/**
 * Document types that support client-side password-protected PDF unlocking.
 * Strictly scoped to PAN Card, Aadhaar Card, and Custom Document.
 */
export const PASSWORD_PROTECTED_PDF_SUPPORTED_DOC_TYPES: ReadonlyArray<DocumentTypeId> = [
  "pan",
  "aadhaar",
  "custom",
];

/**
 * Checks whether a document type supports password-protected PDF unlocking.
 */
export function supportsPasswordProtectedPdf(docType: DocumentTypeId): boolean {
  return PASSWORD_PROTECTED_PDF_SUPPORTED_DOC_TYPES.includes(docType);
}

/**
 * Retrieves a document type definition by ID with fallback to Aadhaar.
 */
export function getDocumentTypeDefinition(id: DocumentTypeId): DocumentTypeDefinition {
  const found = DOCUMENT_TYPES.find((d) => d.id === id);
  return found || DOCUMENT_TYPES[0];
}

/**
 * Derives the active sides for a given document type and custom mode.
 */
export function getAvailableSides(
  docType: DocumentTypeDefinition,
  customMode: CustomSidesMode = "both"
): DocumentSide[] {
  if (docType.allowsSideSelection) {
    if (customMode === "front-only") return ["front"];
    if (customMode === "back-only") return ["back"];
    return ["front", "back"];
  }

  return docType.defaultSides;
}

/**
 * Checks if a specific side is currently active for the selected configuration.
 */
export function isSideActive(
  side: DocumentSide,
  docType: DocumentTypeDefinition,
  customMode: CustomSidesMode = "both"
): boolean {
  const sides = getAvailableSides(docType, customMode);
  return sides.includes(side);
}
