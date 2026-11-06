import { CardSpecification } from "@/types/crop";

export const CARD_SPECIFICATIONS: Record<string, CardSpecification> = {
  pan: {
    id: "pan",
    displayName: "Permanent Account Number (PAN) Card",
    targetWidthMm: 85.6,
    targetHeightMm: 53.98,
    aspectRatio: 85.6 / 53.98, // approx 1.5858 (Standard ISO/IEC 7810 ID-1)
    standardDpi: 300,
    hasFrontBack: true,
    notes: [
      "Standard credit-card form factor (ISO/IEC 7810 ID-1)",
      "Target print size: 85.60 mm x 53.98 mm",
      "Resolution: 1011 x 638 pixels at 300 DPI",
    ],
  },
  aadhaar: {
    id: "aadhaar",
    displayName: "Aadhaar Card (UIDAI)",
    targetWidthMm: 85.6,
    targetHeightMm: 53.98,
    aspectRatio: 85.6 / 53.98,
    standardDpi: 300,
    hasFrontBack: true,
    notes: [
      "Standard laminated wallet card dimension",
      "Front side contains Name, DOB, Gender, Aadhaar Number, and Photo",
      "Back side contains Address, QR code, and Helpline details",
    ],
  },
  ration: {
    id: "ration",
    displayName: "Ration Card / Digital e-Ration Slip",
    targetWidthMm: 85.6,
    targetHeightMm: 53.98,
    aspectRatio: 85.6 / 53.98,
    standardDpi: 300,
    hasFrontBack: true,
    notes: [
      "Standardized to ISO/IEC 7810 ID-1 CR80 wallet card format (85.60 mm x 53.98 mm)",
      "Target print size: 85.60 mm x 53.98 mm",
      "Resolution: 1011 x 638 pixels at 300 DPI",
    ],
  },
  "voter-id": {
    id: "voter-id",
    displayName: "Voter ID Card (e-EPIC)",
    targetWidthMm: 85.6,
    targetHeightMm: 53.98,
    aspectRatio: 85.6 / 53.98,
    standardDpi: 300,
    hasFrontBack: true,
    notes: [
      "Standard PVC e-EPIC card format (ISO/IEC 7810 ID-1: 85.60 mm x 53.98 mm)",
      "Front side displays EPIC number, photo, and cardholder name",
      "Back side displays address, constituency, and polling station",
    ],
  },
};
