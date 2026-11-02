import type { BackgroundColorOption, ModelDefinition } from "../types/background-remover.ts";

export const BACKGROUND_COLOR_PRESETS: BackgroundColorOption[] = [
  {
    id: "transparent",
    name: "Transparent",
    value: "transparent",
    description: "Lossless alpha cutout for overlays or PNG stickers",
  },
  {
    id: "white",
    name: "Studio White",
    value: "#FFFFFF",
    description: "Standard clean white backdrop for passports & IDs",
  },
  {
    id: "light-blue",
    name: "Light Blue",
    value: "#D0E8FF",
    description: "Official light blue backdrop for Indian & international visas",
  },
  {
    id: "dark-blue",
    name: "Dark Blue",
    value: "#1E3A8A",
    description: "Corporate & formal navy blue studio background",
  },
  {
    id: "red",
    name: "Vibrant Red",
    value: "#DC2626",
    description: "Official red document backdrop for Asian passports & badges",
  },
  {
    id: "green",
    name: "Studio Green",
    value: "#16A34A",
    description: "Chroma studio green for editing and keying",
  },
  {
    id: "custom",
    name: "Custom Hex",
    value: "#6366F1",
    description: "Pick any custom color for creative photography",
  },
];

export const DEFAULT_BACKGROUND_COLOR = BACKGROUND_COLOR_PRESETS[0]; // Transparent

export const AVAILABLE_MODELS: ModelDefinition[] = [
  {
    id: "rmbg-1.4",
    name: "BRIA RMBG-1.4",
    tagline: "Studio High Quality (Quantized ONNX)",
    description: "State-of-the-art segmentation trained on diverse subjects. Preserves fine hair, garments, and complex edge details.",
    sizeMB: 43.9,
    inputDimensions: { width: 1024, height: 1024 },
    url: "https://huggingface.co/briaai/RMBG-1.4/resolve/main/onnx/model_quantized.onnx",
    source: "Hugging Face (briaai/RMBG-1.4)",
    recommended: true,
  },
  {
    id: "u2netp",
    name: "U2NetP",
    tagline: "Fast & Lightweight (~4.7 MB)",
    description: "Ultra-compact salient object segmentation model. Fast download and lightweight inference on mobile devices.",
    sizeMB: 4.7,
    inputDimensions: { width: 320, height: 320 },
    url: "https://huggingface.co/schmuell/u2netp-onnx/resolve/main/u2netp.onnx",
    source: "Hugging Face (schmuell/u2netp-onnx)",
    recommended: false,
  },
];

export const DEFAULT_MODEL = AVAILABLE_MODELS[0];

export const PREVIEW_ZOOM_MIN = 0.2;
export const PREVIEW_ZOOM_MAX = 5.0;
export const PREVIEW_ZOOM_STEP = 0.25;
