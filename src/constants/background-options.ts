/**
 * Studio Background Color Options (Phase 03C)
 *
 * Defines background options for photographic composition rendering.
 *
 * IMPORTANT TRANSPARENCY NOTICE:
 * This feature only paints a solid background behind transparent pixels (e.g. PNG / WebP cutouts)
 * or canvas borders. It DOES NOT automatically extract subjects or remove backgrounds from
 * existing solid photos. Background extraction belongs strictly to the client-side AI Background
 * Remover module.
 */

import type { BackgroundOption } from "@/types/crop-preset";

export const STUDIO_BACKGROUND_OPTIONS: readonly BackgroundOption[] = [
  {
    id: "transparent",
    name: "Transparent",
    colorValue: "transparent",
    description: "Preserves native alpha channel. Ideal for transparent PNG or WebP cutouts.",
  },
  {
    id: "white",
    name: "Studio White",
    colorValue: "#FFFFFF",
    description: "Pure white backdrop (#FFFFFF). Standard for most international passport and visa applications.",
  },
  {
    id: "light_blue",
    name: "Light Blue",
    colorValue: "#D0E8FF", // Soft sky blue commonly used in passport photo studios
    description: "Soft studio light blue (#D0E8FF). Commonly used for specific Asian and European visa submissions.",
  },
  {
    id: "light_grey",
    name: "Light Grey",
    colorValue: "#F3F4F6", // Neutral off-white / grey
    description: "Neutral light grey (#F3F4F6). Used for specific diplomatic and institutional credentials.",
  },
  {
    id: "custom",
    name: "Custom Color",
    colorValue: "#3B82F6", // Default starting color for custom color picker
    description: "User-defined hex studio backdrop color.",
  },
] as const;

export const DEFAULT_BACKGROUND_COLOR = "transparent";

export const BACKGROUND_TRANSPARENCY_DISCLAIMER =
  "Notice: Studio Background Color applies behind transparent pixels (e.g. cutouts) or letterbox padding. It will not remove or replace the background of an existing solid photograph. To isolate your portrait, use the Background Remover utility.";
