/**
 * Global Settings Constants, Option Definitions & Manager Functions (Phase 07)
 *
 * Provides safe serialization, validation, schema fallback,
 * DOM theme synchronization, and anti-leak protections.
 *
 * GUARANTEES:
 * - 100% Client-Side.
 * - Stores ONLY primitive preferences (theme, units, format, DPI, quality).
 * - NEVER stores image buffers, Blobs, base64 data, or files in localStorage.
 * - Graceful fallback on missing, outdated, or corrupted keys.
 */

import type {
  AppSettings,
  AppTheme,
  DefaultDpi,
  DefaultPhotoUnit,
  DefaultExportFormat,
  DefaultPreviewMode,
  PerformancePreference,
} from "../types/settings.ts";

export const SETTINGS_STORAGE_KEY = "bus_user_preferences";
export const SETTINGS_UPDATED_EVENT = "bus_preferences_updated";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: "system",
  defaultDpi: 300,
  defaultUnit: "mm",
  defaultExportFormat: "image/png",
  defaultJpegQuality: 0.92,
  defaultBackgroundColor: "transparent",
  defaultPreviewMode: "split_slider",
  performancePreference: "auto",
};

export const VALID_THEMES: readonly AppTheme[] = ["light", "dark", "system"] as const;
export const VALID_DPIS: readonly DefaultDpi[] = [150, 200, 300, 600] as const;
export const VALID_UNITS: readonly DefaultPhotoUnit[] = ["mm", "cm", "inch"] as const;
export const VALID_EXPORT_FORMATS: readonly DefaultExportFormat[] = [
  "image/png",
  "image/jpeg",
] as const;
export const VALID_PREVIEW_MODES: readonly DefaultPreviewMode[] = [
  "split_slider",
  "side_by_side",
  "processed_only",
  "original_only",
] as const;
export const VALID_PERFORMANCE_PREFERENCES: readonly PerformancePreference[] = [
  "auto",
  "webgpu",
  "webgl",
  "wasm",
] as const;

export interface SettingOption<T> {
  value: T;
  label: string;
  description: string;
  badge?: string;
}

export const THEME_OPTIONS: readonly SettingOption<AppTheme>[] = [
  {
    value: "system",
    label: "System Theme",
    description: "Follow your operating system's light or dark mode preference automatically.",
    badge: "Auto",
  },
  {
    value: "light",
    label: "Light Theme",
    description: "Crisp white backdrops, ideal for bright workspaces and document clarity.",
  },
  {
    value: "dark",
    label: "Dark Theme",
    description: "Low-light interface reducing eye fatigue during intensive photo editing.",
  },
];

export const DPI_OPTIONS: readonly SettingOption<DefaultDpi>[] = [
  {
    value: 150,
    label: "150 DPI",
    description: "Draft & screen preview. Compact file sizes for fast web uploads.",
  },
  {
    value: 200,
    label: "200 DPI",
    description: "Standard digital submissions and quick inkjet printing.",
  },
  {
    value: 300,
    label: "300 DPI",
    description: "Professional lab & biometric passport photo standard. Crisp 1:1 print reproduction.",
    badge: "Recommended",
  },
  {
    value: 600,
    label: "600 DPI",
    description: "Ultra-high resolution for archival scanning and large-format photographic printouts.",
  },
];

export const UNIT_OPTIONS: readonly SettingOption<DefaultPhotoUnit>[] = [
  {
    value: "mm",
    label: "Millimeters (mm)",
    description: "International standard for passport, visa, and identity photo specifications.",
    badge: "Standard",
  },
  {
    value: "cm",
    label: "Centimeters (cm)",
    description: "Metric units commonly used for general print crafting and document sizing.",
  },
  {
    value: "inch",
    label: "Inches (in)",
    description: "Imperial units for US visa (2×2 in) and 4×6 / 5×7 inch photographic sheets.",
  },
];

export const EXPORT_FORMAT_OPTIONS: readonly SettingOption<DefaultExportFormat>[] = [
  {
    value: "image/png",
    label: "PNG (Lossless)",
    description: "Preserves full transparency and crisp edges. Ideal for cutouts, sheets, and badges.",
    badge: "Recommended",
  },
  {
    value: "image/jpeg",
    label: "JPEG (Compressed)",
    description: "Solid background photo export with configurable compression for portal file size limits.",
  },
];

export const BACKGROUND_COLOR_PRESETS = [
  {
    id: "transparent",
    value: "transparent",
    label: "Transparent",
    description: "Retains alpha channel cutout for stickers or custom overlays.",
    badge: "Lossless",
  },
  {
    id: "white",
    value: "#FFFFFF",
    label: "Studio White",
    description: "Standard clean white backdrop (#FFFFFF) for passports and official IDs.",
    badge: "Official",
  },
  {
    id: "light-blue",
    value: "#D0E8FF",
    label: "Light Blue",
    description: "Official soft sky blue (#D0E8FF) for Indian and international visa specifications.",
  },
  {
    id: "dark-blue",
    value: "#1E3A8A",
    label: "Navy Blue",
    description: "Formal corporate blue (#1E3A8A) for company credentials and resumes.",
  },
  {
    id: "red",
    value: "#DC2626",
    label: "Vibrant Red",
    description: "Standard red document backdrop for Asian passports and employment cards.",
  },
  {
    id: "green",
    value: "#16A34A",
    label: "Studio Green",
    description: "Chroma studio green for editing and keying workflows.",
  },
] as const;

export const PREVIEW_MODE_OPTIONS: readonly SettingOption<DefaultPreviewMode>[] = [
  {
    value: "split_slider",
    label: "Interactive Split Slider",
    description: "Interactive draggable divider showing before and after side-by-side.",
    badge: "Default",
  },
  {
    value: "side_by_side",
    label: "Side by Side",
    description: "Dual panes simultaneously displaying original and processed results.",
  },
  {
    value: "processed_only",
    label: "Processed Cutout Only",
    description: "Maximized workspace dedicated purely to the final segmented result.",
  },
  {
    value: "original_only",
    label: "Original Image Only",
    description: "Inspect the untouched source image without overlay or segmentation.",
  },
];

export const PERFORMANCE_OPTIONS: readonly SettingOption<PerformancePreference>[] = [
  {
    value: "auto",
    label: "Automatic (WebGPU with Fallback)",
    description: "Automatically selects WebGPU hardware acceleration if supported, falling back to WebGL and WASM.",
    badge: "Recommended",
  },
  {
    value: "webgpu",
    label: "WebGPU (Direct Compute)",
    description: "Fastest GPU execution for modern Chrome and Edge browsers.",
  },
  {
    value: "webgl",
    label: "WebGL (Shader Acceleration)",
    description: "Broad compatibility across modern laptops and mobile GPUs.",
  },
  {
    value: "wasm",
    label: "WebAssembly (CPU Threaded)",
    description: "Safe CPU-based computation that works universally without hardware GPU dependencies.",
  },
];

/**
 * Validates whether a given string is a safe hex color or transparent.
 */
export function isValidBackgroundColor(val: unknown): val is string {
  if (typeof val !== "string") return false;
  if (val === "transparent") return true;
  // Matches #RGB or #RRGGBB or #RRGGBBAA
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(val);
}

/**
 * Sanitizes and normalizes an input object into guaranteed valid AppSettings.
 * Corrupted, outdated, or malicious fields are stripped and replaced with default values.
 */
export function sanitizeSettings(raw: unknown): AppSettings {
  const result: AppSettings = { ...DEFAULT_APP_SETTINGS };

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return result;
  }

  const obj = raw as Record<string, unknown>;

  // 1. Theme
  if (VALID_THEMES.includes(obj.theme as AppTheme)) {
    result.theme = obj.theme as AppTheme;
  }

  // 2. Default DPI
  const parsedDpi = Number(obj.defaultDpi);
  if (VALID_DPIS.includes(parsedDpi as DefaultDpi)) {
    result.defaultDpi = parsedDpi as DefaultDpi;
  }

  // 3. Default Unit
  if (VALID_UNITS.includes(obj.defaultUnit as DefaultPhotoUnit)) {
    result.defaultUnit = obj.defaultUnit as DefaultPhotoUnit;
  }

  // 4. Default Export Format
  if (VALID_EXPORT_FORMATS.includes(obj.defaultExportFormat as DefaultExportFormat)) {
    result.defaultExportFormat = obj.defaultExportFormat as DefaultExportFormat;
  }

  // 5. Default JPEG Quality
  if (typeof obj.defaultJpegQuality === "number" && !Number.isNaN(obj.defaultJpegQuality)) {
    const clamped = Math.min(1.0, Math.max(0.7, obj.defaultJpegQuality));
    result.defaultJpegQuality = Number(clamped.toFixed(2));
  }

  // 6. Default Background Color
  if (isValidBackgroundColor(obj.defaultBackgroundColor)) {
    result.defaultBackgroundColor = obj.defaultBackgroundColor;
  }

  // 7. Default Preview Mode
  if (VALID_PREVIEW_MODES.includes(obj.defaultPreviewMode as DefaultPreviewMode)) {
    result.defaultPreviewMode = obj.defaultPreviewMode as DefaultPreviewMode;
  }

  // 8. Performance Preference
  if (VALID_PERFORMANCE_PREFERENCES.includes(obj.performancePreference as PerformancePreference)) {
    result.performancePreference = obj.performancePreference as PerformancePreference;
  }

  return result;
}

/**
 * Asserts that an object does NOT contain image data, base64 payloads, or file objects.
 */
export function assertNoImageData(obj: unknown): void {
  if (!obj || typeof obj !== "object") return;

  const entries = Object.entries(obj as Record<string, unknown>);
  for (const [key, value] of entries) {
    if (typeof value === "string") {
      if (
        value.startsWith("data:image/") ||
        value.startsWith("blob:") ||
        value.length > 512
      ) {
        throw new Error(
          `Privacy Violation: Detected attempt to store image or oversized data in preferences key "${key}".`
        );
      }
    } else if (
      value instanceof Blob ||
      (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) ||
      (typeof Uint8Array !== "undefined" && value instanceof Uint8Array)
    ) {
      throw new Error(
        `Privacy Violation: Binary image buffer detected in preferences key "${key}".`
      );
    }
  }
}

/**
 * Determines whether dark mode is currently active given a theme selection and system preference.
 */
export function resolveIsDarkMode(
  theme: AppTheme,
  systemPrefersDark?: boolean
): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;

  if (typeof systemPrefersDark === "boolean") {
    return systemPrefersDark;
  }

  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  return false;
}

/**
 * Synchronizes the visual theme on the document <html> tag.
 */
export function applyTheme(theme: AppTheme): void {
  if (typeof document === "undefined") return;

  const isDark = resolveIsDarkMode(theme);
  const root = document.documentElement;

  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  // Update color-scheme CSS property
  root.style.colorScheme = isDark ? "dark" : "light";
}

/**
 * Reads stored preferences safely from browser localStorage.
 * Returns DEFAULT_APP_SETTINGS if in SSR, if missing, or if corrupted.
 */
export function getStoredSettings(): AppSettings {
  if (typeof window === "undefined" || !window.localStorage) {
    return { ...DEFAULT_APP_SETTINGS };
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_APP_SETTINGS };
    }

    const parsed = JSON.parse(raw);
    return sanitizeSettings(parsed);
  } catch (err) {
    console.warn("Failed to parse stored preferences from localStorage, falling back to defaults:", err);
    return { ...DEFAULT_APP_SETTINGS };
  }
}

/**
 * Saves updated preferences to browser localStorage and notifies listeners.
 */
export function saveStoredSettings(updates: Partial<AppSettings>): AppSettings {
  if (typeof window === "undefined" || !window.localStorage) {
    return { ...DEFAULT_APP_SETTINGS, ...updates };
  }

  // Guard against accidental storage of image files or blobs
  assertNoImageData(updates);

  const current = getStoredSettings();
  const merged = { ...current, ...updates };
  const sanitized = sanitizeSettings(merged);

  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(sanitized));
  } catch (err) {
    console.error("Failed to write preferences to localStorage:", err);
  }

  // Apply theme if changed
  if (updates.theme !== undefined) {
    applyTheme(sanitized.theme);
  }

  // Broadcast change across tabs and components
  try {
    window.dispatchEvent(
      new CustomEvent(SETTINGS_UPDATED_EVENT, { detail: sanitized })
    );
  } catch {
    // CustomEvent might not be supported in older runtimes
  }

  return sanitized;
}

/**
 * Resets all user preferences to factory defaults.
 */
export function resetStoredSettings(): AppSettings {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
    } catch (err) {
      console.error("Failed to remove preferences key from localStorage:", err);
    }
  }

  const defaults = { ...DEFAULT_APP_SETTINGS };
  applyTheme(defaults.theme);

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(
        new CustomEvent(SETTINGS_UPDATED_EVENT, { detail: defaults })
      );
    } catch {}
  }

  return defaults;
}
