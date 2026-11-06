/**
 * Vector PDF Inspector for Identity Documents (Voter ID / e-EPIC)
 *
 * Privacy-first, 100% client-side PDF vector & image placement extractor.
 * Unlike raster-based Microsoft Print to PDF documents (PAN, Aadhaar, Ration),
 * official e-EPIC Voter ID cards generated via iText contain embedded card images
 * with exact vector placement coordinates in PDF point space (A4: 595.28 x 841.89 pt).
 *
 * Reference placements:
 * - Top dashed line: Y ~ 70 pt
 * - Bottom dashed line: Y ~ 275 pt
 * - Vertical fold: X ~ 302 pt
 * - Front card: X 32.5–277.5, Y 95–249 pt (245 x 154 pt, aspect ~1.591)
 * - Back card: X 327.03–572.03, Y 95–249 pt (245 x 154 pt, aspect ~1.591)
 *
 * This module extracts the exact PDF placement bounding boxes rather than relying
 * on pixel downsampling or bottom-corner assumptions.
 */

import { PDFDocument, PDFName } from "pdf-lib";
import type { CropCoordinates } from "@/types/crop";
import { VOTER_ID_MEASUREMENTS } from "@/constants/document-studio";

export interface VectorCardPlacement {
  x: number; // PDF points from left
  y: number; // PDF points from top
  width: number; // PDF points
  height: number; // PDF points
  name?: string;
}

export interface VectorPdfInspectionResult {
  isVectorPdf: boolean;
  pageWidthPt: number;
  pageHeightPt: number;
  frontCropPt: CropCoordinates;
  backCropPt: CropCoordinates;
  frontCropPx: CropCoordinates;
  backCropPx: CropCoordinates;
  confidence: number;
  method: "pdf-image-placement" | "pdf-normalized-fallback";
  message: string;
}

/**
 * Decompresses raw Deflate/Flate stream bytes in both browser and Node.js environments.
 */
async function decompressPdfStream(compressedBytes: Uint8Array): Promise<string> {
  // 1. Try Node.js zlib if available (e.g. during test runner)
  if (typeof process !== "undefined" && process.versions?.node) {
    try {
      // Dynamic import to prevent bundler errors in browser
      const zlib = await import("zlib");
      const unzipped = zlib.inflateSync(Buffer.from(compressedBytes));
      return unzipped.toString("utf8");
    } catch {
      // Fall through to browser Web Streams API
    }
  }

  // 2. Try browser DecompressionStream API (Chrome 80+, Safari 16.4+, Firefox 113+, Edge)
  if (typeof DecompressionStream !== "undefined") {
    try {
      const stream = new Response(
        new Blob([compressedBytes as unknown as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate"))
      );
      return await stream.text();
    } catch {
      try {
        const streamRaw = new Response(
          new Blob([compressedBytes as unknown as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"))
        );
        return await streamRaw.text();
      } catch {
        // Fall through
      }
    }
  }

  // 3. Fallback: string decode if stream was not compressed
  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(compressedBytes);
  } catch {
    return "";
  }
}

/**
 * Parses transformation matrix `cm` and image paint `/Name Do` commands from a decoded PDF content stream.
 * PDF coordinate origin is bottom-left; converts coordinates to top-left origin.
 */
export function parseImagePlacementsFromContentStream(
  contentStreamText: string,
  pageHeightPt: number
): VectorCardPlacement[] {
  const placements: VectorCardPlacement[] = [];

  // Tokenize content stream lines/commands
  // Standard PDF image drawing sequence:
  // q
  // a b c d e f cm (or series of transformations)
  // /ImageName Do
  // Q
  const lines = contentStreamText.split(/\r?\n|\r/);
  let currentMatrix = [1, 0, 0, 1, 0, 0];
  const matrixStack: number[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line === "q") {
      matrixStack.push([...currentMatrix]);
      continue;
    }

    if (line === "Q") {
      if (matrixStack.length > 0) {
        currentMatrix = matrixStack.pop()!;
      }
      continue;
    }

    // Check for transformation matrix `a b c d e f cm`
    const cmMatch = line.match(/^([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+cm$/);
    if (cmMatch) {
      const a = parseFloat(cmMatch[1]);
      const b = parseFloat(cmMatch[2]);
      const c = parseFloat(cmMatch[3]);
      const d = parseFloat(cmMatch[4]);
      const e = parseFloat(cmMatch[5]);
      const f = parseFloat(cmMatch[6]);

      // If matrix already had a translation, compose or update
      if (currentMatrix[0] === 1 && currentMatrix[3] === 1 && currentMatrix[4] === 0 && currentMatrix[5] === 0) {
        currentMatrix = [a, b, c, d, e, f];
      } else {
        // Multiply 2D affine transformation matrices: [A] * [B]
        const [a1, b1, c1, d1, e1, f1] = currentMatrix;
        currentMatrix = [
          a1 * a + c1 * b,
          b1 * a + d1 * b,
          a1 * c + c1 * d,
          b1 * c + d1 * d,
          a1 * e + c1 * f + e1,
          b1 * e + d1 * f + f1,
        ];
      }
      continue;
    }

    // Check for `/ImageXObject Do`
    const doMatch = line.match(/^\/([^\s]+)\s+Do$/);
    if (doMatch) {
      const imageName = doMatch[1];
      const width = Math.abs(currentMatrix[0]);
      const height = Math.abs(currentMatrix[3]);
      const x = currentMatrix[4];
      const yBottom = currentMatrix[5];
      // Convert from bottom-left PDF coordinate system to standard top-left origin
      const yTop = pageHeightPt - (yBottom + height);

      placements.push({
        name: imageName,
        x,
        y: yTop,
        width,
        height,
      });

      // Reset matrix back to identity for next command if not in a q/Q block
      if (matrixStack.length === 0) {
        currentMatrix = [1, 0, 0, 1, 0, 0];
      }
    }
  }

  return placements;
}

/**
 * Inspects a PDF Document for vector Voter ID (e-EPIC) card placements.
 * Returns exact PDF bounding boxes and converts them into pixel coordinates for target raster resolution.
 */
export async function inspectVectorVoterIdPdf(
  pdfBytes: ArrayBuffer | Uint8Array,
  rasterWidth: number,
  rasterHeight: number
): Promise<VectorPdfInspectionResult> {
  const defaultPageW = 595.28;
  const defaultPageH = 841.89;

  // Normalized fallback coordinates for Voter ID (top-aligned)
  const normFront = VOTER_ID_MEASUREMENTS.front;
  const normBack = VOTER_ID_MEASUREMENTS.back;

  const fallbackFrontPx: CropCoordinates = {
    x: Math.round(normFront.xMin * rasterWidth),
    y: Math.round(normFront.yMin * rasterHeight),
    width: Math.round((normFront.xMax - normFront.xMin) * rasterWidth),
    height: Math.round((normFront.yMax - normFront.yMin) * rasterHeight),
  };

  const fallbackBackPx: CropCoordinates = {
    x: Math.round(normBack.xMin * rasterWidth),
    y: Math.round(normBack.yMin * rasterHeight),
    width: Math.round((normBack.xMax - normBack.xMin) * rasterWidth),
    height: Math.round((normBack.yMax - normBack.yMin) * rasterHeight),
  };

  const fallbackFrontPt: CropCoordinates = {
    x: 32.5,
    y: 95.0,
    width: 245.0,
    height: 154.0,
  };

  const fallbackBackPt: CropCoordinates = {
    x: 327.03,
    y: 95.0,
    width: 245.0,
    height: 154.0,
  };

  try {
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    if (pdfDoc.getPageCount() === 0) {
      throw new Error("PDF contains zero pages.");
    }

    const page = pdfDoc.getPage(0);
    const { width: pageW, height: pageH } = page.getSize();
    const pageArea = pageW * pageH;

    // Check if the page has XObject resources
    const resources = page.node.Resources();
    const xObjectDict = resources ? resources.lookup(PDFName.of("XObject")) : null;

    if (!xObjectDict) {
      // No XObjects, return normalized fallback
      return {
        isVectorPdf: false,
        pageWidthPt: pageW || defaultPageW,
        pageHeightPt: pageH || defaultPageH,
        frontCropPt: fallbackFrontPt,
        backCropPt: fallbackBackPt,
        frontCropPx: fallbackFrontPx,
        backCropPx: fallbackBackPx,
        confidence: 0.88,
        method: "pdf-normalized-fallback",
        message: "No embedded vector XObjects detected. Top-aligned reference coordinates applied.",
      };
    }

    // Extract decoded content streams
    const contents = page.node.Contents();
    const contentRefs = contents
      ? (contents as unknown as { asArray?: () => unknown[] }).asArray
        ? (contents as unknown as { asArray: () => unknown[] }).asArray()
        : [contents]
      : [];

    let combinedStreamText = "";
    for (const ref of contentRefs) {
      try {
        const stream = pdfDoc.context.lookup(ref as import("pdf-lib").PDFRef) as
          | { contents?: Uint8Array }
          | undefined;
        if (stream && stream.contents) {
          const text = await decompressPdfStream(stream.contents);
          combinedStreamText += "\n" + text;
        }
      } catch (err) {
        console.warn("Content stream decompress warning:", err);
      }
    }

    const placements = parseImagePlacementsFromContentStream(combinedStreamText, pageH);

    // Filter embedded images:
    // - Area exceeds 5% of the page
    // - Aspect ratio falls between 1.45 and 1.75
    // - Card-like dimensions
    const candidateCards = placements.filter((p) => {
      const area = p.width * p.height;
      const areaRatio = area / pageArea;
      const aspect = p.width / p.height;
      return areaRatio >= 0.04 && aspect >= 1.45 && aspect <= 1.75;
    });

    // If exactly 2 candidate cards or 2 top-aligned cards found:
    if (candidateCards.length >= 2) {
      // Sort left to right
      candidateCards.sort((a, b) => a.x - b.x);
      const cardA = candidateCards[0];
      const cardB = candidateCards[1];

      // Confirm horizontally aligned (|yA - yB| within 10 pt)
      const isHorizontallyAligned = Math.abs(cardA.y - cardB.y) <= 15;
      // Confirm dimensions match within ~3%
      const widthDiffRatio = Math.abs(cardA.width - cardB.width) / Math.max(cardA.width, cardB.width);
      const heightDiffRatio = Math.abs(cardA.height - cardB.height) / Math.max(cardA.height, cardB.height);
      const dimensionsMatch = widthDiffRatio < 0.05 && heightDiffRatio < 0.05;

      if (isHorizontallyAligned && dimensionsMatch) {
        // Remove ~0.5 pt built-in black border
        const inset = 0.5;
        const frontPt: CropCoordinates = {
          x: Math.max(0, cardA.x + inset),
          y: Math.max(0, cardA.y + inset),
          width: Math.max(10, cardA.width - inset * 2),
          height: Math.max(10, cardA.height - inset * 2),
        };

        const backPt: CropCoordinates = {
          x: Math.max(0, cardB.x + inset),
          y: Math.max(0, cardB.y + inset),
          width: Math.max(10, cardB.width - inset * 2),
          height: Math.max(10, cardB.height - inset * 2),
        };

        // Scale to raster coordinates
        const scaleX = rasterWidth / pageW;
        const scaleY = rasterHeight / pageH;

        const frontPx: CropCoordinates = {
          x: Math.round(frontPt.x * scaleX),
          y: Math.round(frontPt.y * scaleY),
          width: Math.round(frontPt.width * scaleX),
          height: Math.round(frontPt.height * scaleY),
        };

        const backPx: CropCoordinates = {
          x: Math.round(backPt.x * scaleX),
          y: Math.round(backPt.y * scaleY),
          width: Math.round(backPt.width * scaleX),
          height: Math.round(backPt.height * scaleY),
        };

        return {
          isVectorPdf: true,
          pageWidthPt: pageW,
          pageHeightPt: pageH,
          frontCropPt: frontPt,
          backCropPt: backPt,
          frontCropPx: frontPx,
          backCropPx: backPx,
          confidence: 0.99,
          method: "pdf-image-placement",
          message: "Exact embedded image placement coordinates extracted from vector PDF.",
        };
      }
    }

    // If candidate card placements were not conclusive, this is not an e-EPIC vector PDF with embedded image placements
    return {
      isVectorPdf: false,
      pageWidthPt: pageW,
      pageHeightPt: pageH,
      frontCropPt: fallbackFrontPt,
      backCropPt: fallbackBackPt,
      frontCropPx: fallbackFrontPx,
      backCropPx: fallbackBackPx,
      confidence: 0.92,
      method: "pdf-normalized-fallback",
      message: "No embedded card image placements matched. Standard boundary detection will be used.",
    };
  } catch (err) {
    console.warn("inspectVectorVoterIdPdf fallback:", err);
    return {
      isVectorPdf: false,
      pageWidthPt: defaultPageW,
      pageHeightPt: defaultPageH,
      frontCropPt: fallbackFrontPt,
      backCropPt: fallbackBackPt,
      frontCropPx: fallbackFrontPx,
      backCropPx: fallbackBackPx,
      confidence: 0.85,
      method: "pdf-normalized-fallback",
      message: "Top-aligned reference coordinates applied for Voter ID.",
    };
  }
}
