/**
 * Document Content Classifier for Indian Identity Cards
 *
 * Implements content-based Front/Back validation using 100% browser/Node.js client-side computer vision:
 * - Detects presence of face photographs (skin-tone clustering, continuous tonal gradients)
 * - Detects presence of QR codes and barcodes (dense high-contrast orthogonal grids, low saturation)
 * - Detects dense text block patterns (horizontal line frequency)
 * - Provides document-specific Front vs Back scoring for PAN, Aadhaar, Ration, and Voter ID
 * - Swaps crops when content classification strongly indicates inverted order
 * - Keeps original position as safe tie-breaker when signals are inconclusive
 */

import type { PixelBuffer } from "./document-detector";
import type { DocumentTypeId } from "@/types/document-studio";

export interface CardContentFeatures {
  hasPhoto: boolean;
  photoScore: number; // 0.0 - 1.0
  hasQrOrBarcode: boolean;
  qrBarcodeScore: number; // 0.0 - 1.0
  textLineDensity: number; // 0.0 - 1.0
  meanSaturation: number;
  has1DBarcode?: boolean;
  barcode1DScore?: number;
  hasBottomRightQr?: boolean;
  bottomRightQrScore?: number;
}

export interface CardClassificationDecision {
  shouldSwap: boolean;
  confidence: number;
  frontCandidateFeatures: CardContentFeatures;
  backCandidateFeatures: CardContentFeatures;
  reason: string;
}

/**
 * Checks if a pixel falls within human skin tone color spectrum.
 * Based on empirical RGB skin detection (R > G > B, bounded saturation).
 */
function isSkinTonePixel(r: number, g: number, b: number): boolean {
  if (r <= 60 || r >= 250) return false;
  // R must dominate G and B
  if (r <= g || g <= b) return false;
  // Difference checks
  const diffRG = r - g;
  const diffGB = g - b;
  return diffRG >= 10 && diffRG <= 75 && diffGB >= 2 && diffGB <= 55;
}

/**
 * Analyzes features inside a card pixel buffer.
 */
export function extractCardFeatures(buffer: PixelBuffer): CardContentFeatures {
  const { data, width, height } = buffer;
  const totalPixels = width * height;

  if (totalPixels === 0) {
    return {
      hasPhoto: false,
      photoScore: 0,
      hasQrOrBarcode: false,
      qrBarcodeScore: 0,
      textLineDensity: 0,
      meanSaturation: 0,
    };
  }

  // Divide card into 9 grid zones (3x3) to analyze spatial localization
  const gridW = Math.floor(width / 3);
  const gridH = Math.floor(height / 3);

  const skinPixelCounts = new Array(9).fill(0);
  const qrCandidateCounts = new Array(9).fill(0);
  const cellHTransitions = new Array(9).fill(0);
  const cellVTransitions = new Array(9).fill(0);
  let totalSaturation = 0;

  // Track horizontal transitions for text/barcode detection
  let horizontalTransitions = 0;
  let verticalTransitions = 0;

  // Stride of 2 or 3 for fast analysis (<5ms)
  const step = Math.max(1, Math.floor(Math.min(width, height) / 150));

  let sampledCount = 0;

  for (let y = 0; y < height; y += step) {
    const gridY = Math.min(2, Math.floor(y / gridH));

    for (let x = 0; x < width; x += step) {
      const gridX = Math.min(2, Math.floor(x / gridW));
      const cellIdx = gridY * 3 + gridX;

      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const sat = maxC - minC;
      totalSaturation += sat;
      sampledCount++;

      // 1. Skin tone test for photograph
      if (isSkinTonePixel(r, g, b)) {
        skinPixelCounts[cellIdx]++;
      }

      // 2. High-contrast near-binary pixel test for QR code (black or white, very low saturation)
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const isBinaryContrast = (lum < 55 || lum > 200) && sat < 18;
      if (isBinaryContrast) {
        qrCandidateCounts[cellIdx]++;
      }

      // 3. Transition check along X
      if (x + step < width) {
        const nextIdx = (y * width + (x + step)) * 4;
        const nextLum =
          0.299 * data[nextIdx] + 0.587 * data[nextIdx + 1] + 0.114 * data[nextIdx + 2];
        if (Math.abs(lum - nextLum) > 50) {
          horizontalTransitions++;
          cellHTransitions[cellIdx]++;
        }
      }

      // 4. Transition check along Y
      if (y + step < height) {
        const nextIdxY = ((y + step) * width + x) * 4;
        const nextLumY =
          0.299 * data[nextIdxY] + 0.587 * data[nextIdxY + 1] + 0.114 * data[nextIdxY + 2];
        if (Math.abs(lum - nextLumY) > 50) {
          verticalTransitions++;
          cellVTransitions[cellIdx]++;
        }
      }
    }
  }

  const meanSaturation = sampledCount > 0 ? totalSaturation / sampledCount : 0;
  const samplesPerCell = Math.max(1, sampledCount / 9);

  // Photographs in Indian cards are concentrated in one cell (typically cell 0/3/6 on left, or 2/5/8 on right)
  const maxSkinRatioInCell = Math.max(...skinPixelCounts.map((c) => c / samplesPerCell));
  const photoScore = Math.min(1.0, maxSkinRatioInCell * 3.5);
  const hasPhoto = photoScore >= 0.25;

  // QR code is concentrated in one quadrant with high binary density and high bidirectional transitions
  const maxQrRatioInCell = Math.max(...qrCandidateCounts.map((c) => c / samplesPerCell));
  const qrBarcodeScore = Math.min(1.0, maxQrRatioInCell * 1.8);
  const hasQrOrBarcode = qrBarcodeScore >= 0.35;

  // Text density from horizontal transitions
  const textLineDensity = Math.min(1.0, (horizontalTransitions / (sampledCount || 1)) * 2.0);

  // Bottom-right QR code analysis (cell 8 = gridY 2, gridX 2):
  // Front Ration card has a QR code specifically in the bottom right corner.
  const qrRatioCell8 = qrCandidateCounts[8] / samplesPerCell;
  const qrTransitionsCell8 = Math.min(cellHTransitions[8], cellVTransitions[8]) / samplesPerCell;
  const bottomRightQrScore = Math.min(1.0, qrRatioCell8 * 1.6 + qrTransitionsCell8 * 1.2);
  const hasBottomRightQr = bottomRightQrScore >= 0.30;

  // Centered 1D barcode analysis:
  // Back Ration card features a centered 1D barcode with many thin vertical bars.
  // 1D barcodes produce high horizontal transitions with comparatively low vertical transitions.
  const centerH = cellHTransitions[4] + Math.round(cellHTransitions[1] * 0.5);
  const centerV = cellVTransitions[4] + Math.round(cellVTransitions[1] * 0.5);
  const hToVRatio = (centerH + 1) / (centerV + 1);
  const isBarcodeDominant = hToVRatio >= 1.6 && (centerH / samplesPerCell) >= 0.12;
  const barcode1DScore = isBarcodeDominant
    ? Math.min(1.0, (hToVRatio * 0.25) + (centerH / samplesPerCell) * 0.5)
    : 0;
  const has1DBarcode = barcode1DScore >= 0.30;

  return {
    hasPhoto,
    photoScore: Math.round(photoScore * 100) / 100,
    hasQrOrBarcode,
    qrBarcodeScore: Math.round(qrBarcodeScore * 100) / 100,
    textLineDensity: Math.round(textLineDensity * 100) / 100,
    meanSaturation: Math.round(meanSaturation * 10) / 10,
    has1DBarcode,
    barcode1DScore: Math.round(barcode1DScore * 100) / 100,
    hasBottomRightQr,
    bottomRightQrScore: Math.round(bottomRightQrScore * 100) / 100,
  };
}

/**
 * Classifies which candidate crop is Front and which is Back based on extracted card features.
 */
export function decideFrontBackFromFeatures(
  featA: CardContentFeatures,
  featB: CardContentFeatures,
  docType: DocumentTypeId = "aadhaar"
): CardClassificationDecision {
  // Dedicated Ration Card classification:
  // - Front card: bottom-right QR code, personal details, NO face photo required
  // - Back card: centered 1D barcode (vertical bars), address block
  // - QR code presence MUST NOT be used to identify Back!
  // - Position fallback: Left card = Front, Right card = Back
  if (docType === "ration-card") {
    let rationFrontScoreA = 0;
    let rationFrontScoreB = 0;

    if (featA.hasBottomRightQr) {
      rationFrontScoreA += (featA.bottomRightQrScore ?? 0.8) * 2.2;
    }
    if (featB.hasBottomRightQr) {
      rationFrontScoreB += (featB.bottomRightQrScore ?? 0.8) * 2.2;
    }

    if (featA.has1DBarcode) {
      rationFrontScoreA -= (featA.barcode1DScore ?? 0.8) * 2.5; // Back indicator
    }
    if (featB.has1DBarcode) {
      rationFrontScoreB -= (featB.barcode1DScore ?? 0.8) * 2.5; // Back indicator
    }

    const rationDiff = Math.abs(rationFrontScoreA - rationFrontScoreB);

    if (rationFrontScoreB > rationFrontScoreA && rationDiff >= 0.35) {
      return {
        shouldSwap: true,
        confidence: Math.min(0.98, Math.round((0.75 + rationDiff * 0.15) * 100) / 100),
        frontCandidateFeatures: featB,
        backCandidateFeatures: featA,
        reason:
          "Ration Card classification detected 1D barcode on first crop and bottom-right QR code on second crop. Crops swapped to Front/Back order.",
      };
    }

    if (rationFrontScoreA > rationFrontScoreB && rationDiff >= 0.35) {
      return {
        shouldSwap: false,
        confidence: Math.min(0.98, Math.round((0.75 + rationDiff * 0.15) * 100) / 100),
        frontCandidateFeatures: featA,
        backCandidateFeatures: featB,
        reason:
          "Ration Card classification confirmed first crop contains front features (bottom-right QR) and second crop contains back features (1D barcode).",
      };
    }

    // Position-based fallback: Left card = Front, Right card = Back
    return {
      shouldSwap: false,
      confidence: 0.90,
      frontCandidateFeatures: featA,
      backCandidateFeatures: featB,
      reason:
        "Visual content signals balanced; preserved standard positional order (Left = Front, Right = Back).",
    };
  }

  // Compute Front score for Candidate A:
  // Photos strongly indicate Front. QR codes strongly indicate Back.
  let frontScoreA = featA.photoScore * 2.2 - featA.qrBarcodeScore * 1.5;
  let frontScoreB = featB.photoScore * 2.2 - featB.qrBarcodeScore * 1.5;

  // Document-specific adjustments
  if (docType === "aadhaar") {
    // In Aadhaar, QR code is strictly on the Back card
    if (featA.hasQrOrBarcode && !featA.hasPhoto) frontScoreA -= 1.0;
    if (featB.hasQrOrBarcode && !featB.hasPhoto) frontScoreB -= 1.0;
    if (featA.hasPhoto) frontScoreA += 1.2;
    if (featB.hasPhoto) frontScoreB += 1.2;
  } else if (docType === "pan") {
    // PAN card front has photo + signature + name
    if (featA.hasPhoto) frontScoreA += 1.5;
    if (featB.hasPhoto) frontScoreB += 1.5;
  } else if (docType === "voter-id") {
    // Voter ID front has photo + EPIC number
    if (featA.hasPhoto) frontScoreA += 1.4;
    if (featB.hasPhoto) frontScoreB += 1.4;
  }

  const scoreDiff = Math.abs(frontScoreA - frontScoreB);

  // High confidence threshold (require a meaningful difference before swapping)
  if (frontScoreB > frontScoreA && scoreDiff >= 0.35) {
    return {
      shouldSwap: true,
      confidence: Math.min(0.98, Math.round((0.7 + scoreDiff * 0.15) * 100) / 100),
      frontCandidateFeatures: featB,
      backCandidateFeatures: featA,
      reason:
        "Content classification detected photograph on second crop and QR/address patterns on first crop. Crops swapped to Front/Back order.",
    };
  }

  if (frontScoreA > frontScoreB && scoreDiff >= 0.35) {
    return {
      shouldSwap: false,
      confidence: Math.min(0.98, Math.round((0.7 + scoreDiff * 0.15) * 100) / 100),
      frontCandidateFeatures: featA,
      backCandidateFeatures: featB,
      reason:
        "Content classification confirmed first crop contains photograph and second crop contains reverse-side patterns.",
    };
  }

  // Tie-breaker: Inconclusive content signals, keep positional order
  return {
    shouldSwap: false,
    confidence: 0.85,
    frontCandidateFeatures: featA,
    backCandidateFeatures: featB,
    reason:
      "Content signals were evenly balanced. Preserved standard left-to-right positional order.",
  };
}

/**
 * Classifies which candidate crop is Front and which is Back based on document-specific content signals.
 *
 * Front signals:
 * - PAN: Face photo, cardholder name, DOB details
 * - Aadhaar: Face photo, DOB
 * - Ration: Face photo/name details
 * - Voter ID: Personal photograph, EPIC number
 *
 * Back signals:
 * - PAN: Reverse-side terms, barcode/QR, helpline
 * - Aadhaar: Address block, large secure QR code
 * - Ration: Full family address, barcode or QR code
 * - Voter ID: Residential address, polling station info
 */
export function classifyFrontBackCrops(
  candidateA: PixelBuffer,
  candidateB: PixelBuffer,
  docType: DocumentTypeId = "aadhaar"
): CardClassificationDecision {
  const featA = extractCardFeatures(candidateA);
  const featB = extractCardFeatures(candidateB);
  return decideFrontBackFromFeatures(featA, featB, docType);
}
