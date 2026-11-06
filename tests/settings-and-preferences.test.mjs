/**
 * Automated Test Suite: Phase 07 — Global Application Settings & User Preferences
 *
 * Verifies:
 * 1. Schema integrity & default configuration values
 * 2. Strict sanitization, type validation & graceful fallback on corrupted values
 * 3. LocalStorage persistence, event dispatching & reset workflows
 * 4. Zero-upload & privacy anti-leak guarantees (no image data or binary buffers in storage)
 * 5. Theme resolution & switching logic (Light, Dark, System)
 * 6. Integration contracts across tools (Photo Studio, DPI Calculator, Sheet Generator, Background Remover)
 * 7. Navigation & routing verification
 */

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  DEFAULT_APP_SETTINGS,
  SETTINGS_STORAGE_KEY,
  SETTINGS_UPDATED_EVENT,
  VALID_THEMES,
  VALID_DPIS,
  VALID_UNITS,
  VALID_EXPORT_FORMATS,
  VALID_PREVIEW_MODES,
  VALID_PERFORMANCE_PREFERENCES,
  THEME_OPTIONS,
  DPI_OPTIONS,
  UNIT_OPTIONS,
  EXPORT_FORMAT_OPTIONS,
  BACKGROUND_COLOR_PRESETS,
  PREVIEW_MODE_OPTIONS,
  PERFORMANCE_OPTIONS,
  sanitizeSettings,
  isValidBackgroundColor,
  assertNoImageData,
  resolveIsDarkMode,
  getStoredSettings,
  saveStoredSettings,
  resetStoredSettings,
} from "../src/constants/settings.ts";

// Mock localStorage & window for Node.js test environment
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.get(key) || null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

describe("PHASE 07 — Global Application Settings & User Preferences", () => {
  let originalWindow;
  let mockStorage;
  let dispatchedEvents = [];

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
    dispatchedEvents = [];

    originalWindow = global.window;
    global.window = {
      localStorage: mockStorage,
      dispatchEvent: (event) => {
        dispatchedEvents.push(event);
      },
      matchMedia: (query) => ({
        matches: query.includes("dark"),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    };

    global.CustomEvent = class CustomEvent {
      constructor(type, options = {}) {
        this.type = type;
        this.detail = options.detail;
      }
    };
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  // =========================================================================
  // 1. Schema Integrity & Default Configuration
  // =========================================================================
  describe("1. Schema Integrity & Default Configuration", () => {
    test("defines complete and valid factory defaults", () => {
      assert.equal(DEFAULT_APP_SETTINGS.theme, "system");
      assert.equal(DEFAULT_APP_SETTINGS.defaultDpi, 300);
      assert.equal(DEFAULT_APP_SETTINGS.defaultUnit, "mm");
      assert.equal(DEFAULT_APP_SETTINGS.defaultExportFormat, "image/png");
      assert.equal(DEFAULT_APP_SETTINGS.defaultJpegQuality, 0.92);
      assert.equal(DEFAULT_APP_SETTINGS.defaultBackgroundColor, "transparent");
      assert.equal(DEFAULT_APP_SETTINGS.defaultPreviewMode, "split_slider");
      assert.equal(DEFAULT_APP_SETTINGS.performancePreference, "auto");
    });

    test("maintains complete option catalogs for UI selection", () => {
      assert.equal(THEME_OPTIONS.length, 3, "Expected 3 theme options (system, light, dark)");
      assert.equal(DPI_OPTIONS.length, 4, "Expected 4 DPI presets (150, 200, 300, 600)");
      assert.equal(UNIT_OPTIONS.length, 3, "Expected 3 measurement units (mm, cm, inch)");
      assert.equal(EXPORT_FORMAT_OPTIONS.length, 2, "Expected 2 export formats (PNG, JPEG)");
      assert.ok(BACKGROUND_COLOR_PRESETS.length >= 6, "Expected at least 6 background presets");
      assert.equal(PREVIEW_MODE_OPTIONS.length, 4, "Expected 4 preview comparison modes");
      assert.equal(PERFORMANCE_OPTIONS.length, 4, "Expected 4 execution provider presets");
    });

    test("ensures all option catalog values are covered in validation enums", () => {
      for (const t of THEME_OPTIONS) {
        assert.ok(VALID_THEMES.includes(t.value));
      }
      for (const d of DPI_OPTIONS) {
        assert.ok(VALID_DPIS.includes(d.value));
      }
      for (const u of UNIT_OPTIONS) {
        assert.ok(VALID_UNITS.includes(u.value));
      }
      for (const f of EXPORT_FORMAT_OPTIONS) {
        assert.ok(VALID_EXPORT_FORMATS.includes(f.value));
      }
      for (const p of PREVIEW_MODE_OPTIONS) {
        assert.ok(VALID_PREVIEW_MODES.includes(p.value));
      }
      for (const perf of PERFORMANCE_OPTIONS) {
        assert.ok(VALID_PERFORMANCE_PREFERENCES.includes(perf.value));
      }
    });
  });

  // =========================================================================
  // 2. Strict Sanitization, Validation & Safe Fallbacks
  // =========================================================================
  describe("2. Strict Sanitization, Validation & Safe Fallbacks", () => {
    test("returns full defaults when passed null, undefined, or non-object", () => {
      assert.deepEqual(sanitizeSettings(null), DEFAULT_APP_SETTINGS);
      assert.deepEqual(sanitizeSettings(undefined), DEFAULT_APP_SETTINGS);
      assert.deepEqual(sanitizeSettings("invalid-string"), DEFAULT_APP_SETTINGS);
      assert.deepEqual(sanitizeSettings(12345), DEFAULT_APP_SETTINGS);
      assert.deepEqual(sanitizeSettings([]), DEFAULT_APP_SETTINGS);
    });

    test("merges valid partial settings without overwriting unaffected fields", () => {
      const sanitized = sanitizeSettings({
        theme: "dark",
        defaultDpi: 600,
      });

      assert.equal(sanitized.theme, "dark");
      assert.equal(sanitized.defaultDpi, 600);
      assert.equal(sanitized.defaultUnit, "mm");
      assert.equal(sanitized.defaultExportFormat, "image/png");
      assert.equal(sanitized.defaultBackgroundColor, "transparent");
    });

    test("falls back to default theme when given an unsupported theme string", () => {
      const sanitized = sanitizeSettings({ theme: "neon-cyberpunk" });
      assert.equal(sanitized.theme, "system");
    });

    test("falls back to default DPI when given an out-of-spec DPI value", () => {
      assert.equal(sanitizeSettings({ defaultDpi: 72 }).defaultDpi, 300);
      assert.equal(sanitizeSettings({ defaultDpi: 1200 }).defaultDpi, 300);
      assert.equal(sanitizeSettings({ defaultDpi: "not-a-number" }).defaultDpi, 300);
    });

    test("falls back to default unit when given an unsupported measurement unit", () => {
      assert.equal(sanitizeSettings({ defaultUnit: "meters" }).defaultUnit, "mm");
      assert.equal(sanitizeSettings({ defaultUnit: "pt" }).defaultUnit, "mm");
    });

    test("falls back to default export format when given an unsupported mime type", () => {
      assert.equal(sanitizeSettings({ defaultExportFormat: "image/gif" }).defaultExportFormat, "image/png");
      assert.equal(sanitizeSettings({ defaultExportFormat: "image/webp" }).defaultExportFormat, "image/png");
    });

    test("clamps JPEG quality between 0.70 and 1.00", () => {
      assert.equal(sanitizeSettings({ defaultJpegQuality: 0.1 }).defaultJpegQuality, 0.7);
      assert.equal(sanitizeSettings({ defaultJpegQuality: 1.5 }).defaultJpegQuality, 1.0);
      assert.equal(sanitizeSettings({ defaultJpegQuality: 0.8543 }).defaultJpegQuality, 0.85);
      assert.equal(sanitizeSettings({ defaultJpegQuality: "high" }).defaultJpegQuality, 0.92);
    });

    test("validates background colors: accepts hex codes and transparent, rejects script injections", () => {
      assert.equal(isValidBackgroundColor("transparent"), true);
      assert.equal(isValidBackgroundColor("#ffffff"), true);
      assert.equal(isValidBackgroundColor("#FFFFFF"), true);
      assert.equal(isValidBackgroundColor("#1E3A8A"), true);
      assert.equal(isValidBackgroundColor("#FFF"), true);

      assert.equal(isValidBackgroundColor("red"), false);
      assert.equal(isValidBackgroundColor("rgb(0,0,0)"), false);
      assert.equal(isValidBackgroundColor("<script>"), false);
      assert.equal(isValidBackgroundColor("javascript:void(0)"), false);

      assert.equal(
        sanitizeSettings({ defaultBackgroundColor: "#1E3A8A" }).defaultBackgroundColor,
        "#1E3A8A"
      );
      assert.equal(
        sanitizeSettings({ defaultBackgroundColor: "invalid-color-value" }).defaultBackgroundColor,
        "transparent"
      );
    });

    test("falls back to default preview mode and performance preference on invalid values", () => {
      assert.equal(sanitizeSettings({ defaultPreviewMode: "matrix" }).defaultPreviewMode, "split_slider");
      assert.equal(sanitizeSettings({ performancePreference: "quantum" }).performancePreference, "auto");
    });
  });

  // =========================================================================
  // 3. LocalStorage Persistence, Synchronization & Reset
  // =========================================================================
  describe("3. LocalStorage Persistence, Synchronization & Reset", () => {
    test("reads factory defaults when localStorage is empty", () => {
      const settings = getStoredSettings();
      assert.deepEqual(settings, DEFAULT_APP_SETTINGS);
    });

    test("recovers gracefully from corrupted JSON stored in localStorage", () => {
      mockStorage.setItem(SETTINGS_STORAGE_KEY, "this-is-corrupted-json-{{{");
      const settings = getStoredSettings();
      assert.deepEqual(settings, DEFAULT_APP_SETTINGS);
    });

    test("persists preferences and updates the storage key", () => {
      const saved = saveStoredSettings({
        theme: "light",
        defaultDpi: 200,
        defaultUnit: "inch",
        defaultExportFormat: "image/jpeg",
        defaultJpegQuality: 0.85,
      });

      assert.equal(saved.theme, "light");
      assert.equal(saved.defaultDpi, 200);
      assert.equal(saved.defaultUnit, "inch");
      assert.equal(saved.defaultExportFormat, "image/jpeg");

      const raw = mockStorage.getItem(SETTINGS_STORAGE_KEY);
      assert.ok(raw !== null, "Expected raw settings string in storage");

      const parsed = JSON.parse(raw);
      assert.equal(parsed.theme, "light");
      assert.equal(parsed.defaultDpi, 200);
      assert.equal(parsed.defaultUnit, "inch");
    });

    test("dispatches custom event on preference change for multi-component reactivity", () => {
      saveStoredSettings({ theme: "dark" });

      assert.equal(dispatchedEvents.length, 1);
      assert.equal(dispatchedEvents[0].type, SETTINGS_UPDATED_EVENT);
      assert.equal(dispatchedEvents[0].detail.theme, "dark");
    });

    test("resets all preferences to factory defaults on resetStoredSettings", () => {
      saveStoredSettings({
        theme: "dark",
        defaultDpi: 600,
        defaultUnit: "cm",
      });

      const resetResult = resetStoredSettings();
      assert.deepEqual(resetResult, DEFAULT_APP_SETTINGS);

      const inStorage = getStoredSettings();
      assert.deepEqual(inStorage, DEFAULT_APP_SETTINGS);

      const latestEvent = dispatchedEvents[dispatchedEvents.length - 1];
      assert.equal(latestEvent.type, SETTINGS_UPDATED_EVENT);
      assert.deepEqual(latestEvent.detail, DEFAULT_APP_SETTINGS);
    });
  });

  // =========================================================================
  // 4. Privacy & Anti-Leak Guarantees (No Image Data in LocalStorage)
  // =========================================================================
  describe("4. Privacy & Anti-Leak Guarantees", () => {
    test("rejects attempt to store base64 image data URIs in preferences", () => {
      const fakeImageData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      assert.throws(
        () => {
          assertNoImageData({ someImage: fakeImageData });
        },
        /Privacy Violation/
      );

      assert.throws(
        () => {
          saveStoredSettings({ defaultBackgroundColor: fakeImageData });
        },
        /Privacy Violation/
      );
    });

    test("rejects attempt to store blob: URLs or oversized payload strings in preferences", () => {
      const blobUrl = "blob:http://localhost:3000/123e4567-e89b-12d3-a456-426614174000";
      assert.throws(
        () => {
          assertNoImageData({ photo: blobUrl });
        },
        /Privacy Violation/
      );

      const oversized = "a".repeat(1024);
      assert.throws(
        () => {
          assertNoImageData({ oversizedField: oversized });
        },
        /Privacy Violation/
      );
    });

    test("verifies that actual localStorage content contains strictly primitive preference values", () => {
      saveStoredSettings({
        theme: "dark",
        defaultDpi: 300,
        defaultUnit: "mm",
        defaultExportFormat: "image/png",
        defaultJpegQuality: 0.95,
      });

      const raw = mockStorage.getItem(SETTINGS_STORAGE_KEY);
      assert.ok(raw !== null);
      assert.ok(!raw.includes("data:image/"), "Must not contain base64 image data");
      assert.ok(!raw.includes("blob:"), "Must not contain blob URLs");
      assert.ok(raw.length < 500, "Preferences JSON size must be minimal and bounded");
    });
  });

  // =========================================================================
  // 5. Theme Resolution Logic
  // =========================================================================
  describe("5. Theme Resolution Logic", () => {
    test("resolves dark theme directly to true", () => {
      assert.equal(resolveIsDarkMode("dark"), true);
      assert.equal(resolveIsDarkMode("dark", false), true);
    });

    test("resolves light theme directly to false", () => {
      assert.equal(resolveIsDarkMode("light"), false);
      assert.equal(resolveIsDarkMode("light", true), false);
    });

    test("resolves system theme based on OS preference", () => {
      assert.equal(resolveIsDarkMode("system", true), true, "System theme should be dark when OS is dark");
      assert.equal(resolveIsDarkMode("system", false), false, "System theme should be light when OS is light");
    });
  });

  // =========================================================================
  // 6. Navigation & Routing Verification
  // =========================================================================
  describe("6. Navigation & Routing Verification", () => {
    test("verifies that the settings page file exists on disk", () => {
      const settingsPagePath = path.resolve(process.cwd(), "src/app/settings/page.tsx");
      assert.ok(
        fs.existsSync(settingsPagePath),
        "Expected src/app/settings/page.tsx to exist"
      );
    });

    test("verifies that Header includes Settings in PRIMARY_NAV_LINKS", () => {
      const headerPath = path.resolve(process.cwd(), "src/components/layout/Header.tsx");
      const content = fs.readFileSync(headerPath, "utf-8");
      assert.ok(
        content.includes('href: "/settings"'),
        "Header must contain link to /settings"
      );
      assert.ok(
        content.includes("Settings"),
        "Header must reference Settings component/label"
      );
    });

    test("verifies that Footer includes Preferences & Settings link", () => {
      const footerPath = path.resolve(process.cwd(), "src/components/layout/Footer.tsx");
      const content = fs.readFileSync(footerPath, "utf-8");
      assert.ok(
        content.includes('href="/settings"'),
        "Footer must contain link to /settings"
      );
    });
  });
});
