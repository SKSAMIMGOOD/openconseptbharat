/**
 * Design Studio — Color Utilities for Export
 */

import { rgb, type RGB } from "pdf-lib";

/**
 * Parses any CSS hex color (#RGB, #RRGGBB, #RRGGBBAA) or basic rgba to an RGB tuple [r, g, b, a] where 0-255 / 0-1.
 */
export function parseColor(colorStr: string): { r: number; g: number; b: number; a: number } {
  if (!colorStr || colorStr === "transparent") {
    return { r: 255, g: 255, b: 255, a: 0 };
  }

  const s = colorStr.trim();

  // Hex color
  if (s.startsWith("#")) {
    let hex = s.substring(1);
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("");
    }
    if (hex.length === 6) {
      const num = parseInt(hex, 16);
      return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
        a: 1,
      };
    }
    if (hex.length === 8) {
      const num = parseInt(hex, 16);
      return {
        r: (num >> 24) & 255,
        g: (num >> 16) & 255,
        b: (num >> 8) & 255,
        a: (num & 255) / 255,
      };
    }
  }

  // rgba or rgb
  const rgbaMatch = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/i);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1], 10),
      g: parseInt(rgbaMatch[2], 10),
      b: parseInt(rgbaMatch[3], 10),
      a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1,
    };
  }

  // Default fallback
  return { r: 15, g: 23, b: 42, a: 1 };
}

/**
 * Converts a hex or rgba color string to pdf-lib RGB color object.
 */
export function hexToPdfRgb(colorStr: string): RGB {
  const parsed = parseColor(colorStr);
  return rgb(parsed.r / 255, parsed.g / 255, parsed.b / 255);
}
