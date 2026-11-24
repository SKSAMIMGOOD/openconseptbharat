/**
 * Raw Image to Clean PDF — Edge Midpoint Geometry & Translation Engine
 *
 * Implements constrained translation logic for 4 edge-midpoint drag handles:
 * - Top edge handle: moves vertically (up/down), updating both top corners (topLeft.y, topRight.y)
 * - Bottom edge handle: moves vertically (up/down), updating both bottom corners (bottomLeft.y, bottomRight.y)
 * - Left edge handle: moves horizontally (left/right), updating both left corners (topLeft.x, bottomLeft.x)
 * - Right edge handle: moves horizontally (left/right), updating both right corners (topRight.x, bottomRight.x)
 *
 * Enforces strict image boundaries [0, imageDimension], prevents edges from
 * crossing opposing edges (maintaining minimum clearance), and validates
 * strictly convex quadrilateral geometry (isConvexQuad).
 */

import type { PerspectiveQuad, EdgeHandleKey } from "../../types/raw-image-to-pdf.ts";
import { isConvexQuad } from "../document/perspective-engine.ts";

export interface TranslateEdgeParams {
  startQuad: PerspectiveQuad;
  edge: EdgeHandleKey;
  deltaX: number;
  deltaY: number;
  imageWidth: number;
  imageHeight: number;
  minClearance?: number;
}

/**
 * Translates an edge of a perspective quadrilateral while preserving
 * perpendicular positions, clamping within image boundaries, and enforcing
 * convex geometry without crossing opposing edges.
 */
export function translateQuadEdge({
  startQuad,
  edge,
  deltaX,
  deltaY,
  imageWidth,
  imageHeight,
  minClearance = 20,
}: TranslateEdgeParams): PerspectiveQuad {
  let nextQuad: PerspectiveQuad = { ...startQuad };

  if (edge === "top") {
    // Both top corners translate vertically by deltaY
    const minDelta = -Math.min(startQuad.topLeft.y, startQuad.topRight.y);
    const boundaryMaxDelta = imageHeight - Math.max(startQuad.topLeft.y, startQuad.topRight.y);
    const clearanceMaxDelta = Math.min(
      startQuad.bottomLeft.y - startQuad.topLeft.y,
      startQuad.bottomRight.y - startQuad.topRight.y
    ) - minClearance;
    const maxDelta = Math.max(minDelta, Math.min(boundaryMaxDelta, clearanceMaxDelta));
    const clampedDelta = Math.max(minDelta, Math.min(maxDelta, deltaY));

    nextQuad = {
      ...startQuad,
      topLeft: { ...startQuad.topLeft, y: startQuad.topLeft.y + clampedDelta },
      topRight: { ...startQuad.topRight, y: startQuad.topRight.y + clampedDelta },
    };
  } else if (edge === "bottom") {
    // Both bottom corners translate vertically by deltaY
    const boundaryMaxDelta = imageHeight - Math.max(startQuad.bottomLeft.y, startQuad.bottomRight.y);
    const boundaryMinDelta = -Math.min(startQuad.bottomLeft.y, startQuad.bottomRight.y);
    const clearanceMinDelta = Math.max(
      startQuad.topLeft.y - startQuad.bottomLeft.y,
      startQuad.topRight.y - startQuad.bottomRight.y
    ) + minClearance;
    const minDelta = Math.min(boundaryMaxDelta, Math.max(boundaryMinDelta, clearanceMinDelta));
    const maxDelta = boundaryMaxDelta;
    const clampedDelta = Math.max(minDelta, Math.min(maxDelta, deltaY));

    nextQuad = {
      ...startQuad,
      bottomLeft: { ...startQuad.bottomLeft, y: startQuad.bottomLeft.y + clampedDelta },
      bottomRight: { ...startQuad.bottomRight, y: startQuad.bottomRight.y + clampedDelta },
    };
  } else if (edge === "left") {
    // Both left corners translate horizontally by deltaX
    const minDelta = -Math.min(startQuad.topLeft.x, startQuad.bottomLeft.x);
    const boundaryMaxDelta = imageWidth - Math.max(startQuad.topLeft.x, startQuad.bottomLeft.x);
    const clearanceMaxDelta = Math.min(
      startQuad.topRight.x - startQuad.topLeft.x,
      startQuad.bottomRight.x - startQuad.bottomLeft.x
    ) - minClearance;
    const maxDelta = Math.max(minDelta, Math.min(boundaryMaxDelta, clearanceMaxDelta));
    const clampedDelta = Math.max(minDelta, Math.min(maxDelta, deltaX));

    nextQuad = {
      ...startQuad,
      topLeft: { ...startQuad.topLeft, x: startQuad.topLeft.x + clampedDelta },
      bottomLeft: { ...startQuad.bottomLeft, x: startQuad.bottomLeft.x + clampedDelta },
    };
  } else if (edge === "right") {
    // Both right corners translate horizontally by deltaX
    const boundaryMaxDelta = imageWidth - Math.max(startQuad.topRight.x, startQuad.bottomRight.x);
    const boundaryMinDelta = -Math.min(startQuad.topRight.x, startQuad.bottomRight.x);
    const clearanceMinDelta = Math.max(
      startQuad.topLeft.x - startQuad.topRight.x,
      startQuad.bottomLeft.x - startQuad.bottomRight.x
    ) + minClearance;
    const minDelta = Math.min(boundaryMaxDelta, Math.max(boundaryMinDelta, clearanceMinDelta));
    const maxDelta = boundaryMaxDelta;
    const clampedDelta = Math.max(minDelta, Math.min(maxDelta, deltaX));

    nextQuad = {
      ...startQuad,
      topRight: { ...startQuad.topRight, x: startQuad.topRight.x + clampedDelta },
      bottomRight: { ...startQuad.bottomRight, x: startQuad.bottomRight.x + clampedDelta },
    };
  }

  // Only apply update if resulting quadrilateral is strictly convex and non-collapsed
  if (isConvexQuad(nextQuad)) {
    return nextQuad;
  }

  return startQuad;
}
