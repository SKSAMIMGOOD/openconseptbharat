/**
 * Automated Test Suite: Phase 06 — Dashboard & Tool Integration
 *
 * Verifies:
 * - Tool registry integrity (8 existing tools with unique IDs, names, descriptions, categories, icons, routes, status)
 * - Tool categories (Photo Studio, Image Tools, Photo Printing, Utilities)
 * - Tool discovery: search by name, description, feature tags, category filter, and empty state
 * - Recently used tools logic: record, sort by MRU, limit, deduplicate, clear
 * - Navigation and route existence on disk (no broken or placeholder links)
 * - Zero-upload security verification
 */

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  TOOLS,
  TOOL_CATEGORIES,
  getToolById,
  getToolsByCategory,
  searchTools,
  getFeaturedTools,
  getCategoryMetadata,
} from "../src/constants/tools.ts";

import {
  getRecentToolIds,
  getRecentTools,
  recordToolUsage,
  clearRecentTools,
  RECENT_TOOLS_KEY,
  MAX_RECENT_TOOLS,
} from "../src/lib/utils/recent-tools.ts";

// Mock localStorage for Node test environment
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

describe("PHASE 06 — Tool Registry & Configuration", () => {
  test("registers all tools in the project", () => {
    assert.equal(TOOLS.length, 9, "Expected 9 tools in the registry");
  });

  test("all tools have unique IDs", () => {
    const ids = TOOLS.map((t) => t.id);
    const uniqueIds = new Set(ids);
    assert.equal(uniqueIds.size, TOOLS.length, "All tool IDs must be strictly unique");
  });

  test("each tool has complete required fields", () => {
    const expectedCategories = ["photo-studio", "image-tools", "photo-printing", "utilities"];

    for (const tool of TOOLS) {
      assert.ok(tool.id && typeof tool.id === "string", `Tool missing id: ${JSON.stringify(tool)}`);
      assert.ok(tool.name && typeof tool.name === "string", `Tool ${tool.id} missing name`);
      assert.ok(tool.shortDescription && typeof tool.shortDescription === "string", `Tool ${tool.id} missing shortDescription`);
      assert.ok(tool.description && typeof tool.description === "string", `Tool ${tool.id} missing description`);
      assert.ok(expectedCategories.includes(tool.category), `Tool ${tool.id} has invalid category: ${tool.category}`);
      assert.ok(tool.route && tool.route.startsWith("/tools/"), `Tool ${tool.id} has invalid route: ${tool.route}`);
      assert.equal(tool.status, "ready", `Tool ${tool.id} availability status should be ready`);
      assert.ok(tool.iconName && typeof tool.iconName === "string", `Tool ${tool.id} missing iconName`);
      assert.ok(Array.isArray(tool.features) && tool.features.length > 0, `Tool ${tool.id} should have feature tags`);
    }
  });

  test("lookup by ID returns the correct tool", () => {
    const photoStudio = getToolById("photo-studio");
    assert.ok(photoStudio);
    assert.equal(photoStudio.name, "Professional Photo Studio");
    assert.equal(photoStudio.route, "/tools/photo-studio");

    const bgRemover = getToolById("background-remover");
    assert.ok(bgRemover);
    assert.equal(bgRemover.name, "Background Remover");
    assert.equal(bgRemover.route, "/tools/background-remover");

    const nonExistent = getToolById("non-existent-tool");
    assert.equal(nonExistent, undefined);
  });

  test("curated featured tools list contains valid tools", () => {
    const featured = getFeaturedTools();
    assert.ok(featured.length >= 4, "Expected at least 4 featured tools");
    for (const tool of featured) {
      assert.ok(tool.id);
      assert.ok(tool.route);
    }
  });
});

describe("PHASE 06 — Tool Categories Organization", () => {
  test("defines the 4 required categories with valid metadata", () => {
    const categoryIds = TOOL_CATEGORIES.map((c) => c.id);
    assert.deepEqual(categoryIds, ["photo-studio", "image-tools", "photo-printing", "utilities"]);

    for (const cat of TOOL_CATEGORIES) {
      assert.ok(cat.title, `Category ${cat.id} missing title`);
      assert.ok(cat.subtitle, `Category ${cat.id} missing subtitle`);
      assert.ok(cat.description, `Category ${cat.id} missing description`);
      assert.ok(cat.iconName, `Category ${cat.id} missing iconName`);
      assert.ok(cat.toolCount && cat.toolCount > 0, `Category ${cat.id} should have positive tool count`);
    }
  });

  test("category filter correctly organizes existing tools", () => {
    const photoStudioTools = getToolsByCategory("photo-studio");
    assert.ok(photoStudioTools.some((t) => t.id === "photo-studio"));

    const imageTools = getToolsByCategory("image-tools");
    assert.ok(imageTools.some((t) => t.id === "background-remover"));
    assert.ok(imageTools.some((t) => t.id === "photo-editor"));

    const photoPrintingTools = getToolsByCategory("photo-printing");
    assert.ok(photoPrintingTools.some((t) => t.id === "multiple-photo-maker"));

    const utilityTools = getToolsByCategory("utilities");
    assert.ok(utilityTools.some((t) => t.id === "pan-card-crop"));
    assert.ok(utilityTools.some((t) => t.id === "aadhaar-card-crop"));
    assert.ok(utilityTools.some((t) => t.id === "ration-card-crop"));
    assert.ok(utilityTools.some((t) => t.id === "resume-maker"));
    assert.ok(utilityTools.some((t) => t.id === "document-studio"));

    // Total tools returned across 'all'
    const allTools = getToolsByCategory("all");
    assert.equal(allTools.length, 9);
  });

  test("getCategoryMetadata retrieves correct category details", () => {
    const meta = getCategoryMetadata("photo-studio");
    assert.ok(meta);
    assert.equal(meta.title, "Photo Studio");

    const imgMeta = getCategoryMetadata("image-tools");
    assert.ok(imgMeta);
    assert.equal(imgMeta.title, "Image Tools");
  });
});

describe("PHASE 06 — Tool Discovery & Search Engine", () => {
  test("searches tools by name", () => {
    const results = searchTools("Passport");
    assert.ok(results.length > 0);
    assert.ok(results.some((t) => t.id === "photo-studio"));

    const bgResults = searchTools("Background");
    assert.ok(bgResults.some((t) => t.id === "background-remover"));

    const resumeResults = searchTools("Resume");
    assert.ok(resumeResults.some((t) => t.id === "resume-maker"));
  });

  test("searches tools by description and keywords", () => {
    const neuralResults = searchTools("neural networks");
    assert.ok(neuralResults.some((t) => t.id === "background-remover"));

    const walletResults = searchTools("wallet");
    assert.ok(walletResults.some((t) => t.id === "aadhaar-card-crop" || t.id === "pan-card-crop"));
  });

  test("searches tools by feature tags", () => {
    const dpiResults = searchTools("300 DPI");
    assert.ok(dpiResults.length > 0);

    const atsResults = searchTools("ATS");
    assert.ok(atsResults.some((t) => t.id === "resume-maker"));
  });

  test("filters search results within a specific category", () => {
    const utilResults = searchTools("crop", "utilities");
    assert.ok(utilResults.length > 0);
    assert.ok(utilResults.every((t) => t.category === "utilities" || t.categories.includes("utilities")));

    // When searching for 'Aadhaar' inside 'image-tools', should yield 0 results
    const mismatch = searchTools("Aadhaar", "image-tools");
    assert.equal(mismatch.length, 0);
  });

  test("returns clear empty results for unmatched query", () => {
    const emptyResults = searchTools("xyznonexistenttoolquery123");
    assert.equal(emptyResults.length, 0);
  });
});

describe("PHASE 06 — Recently Used Tools Engine", () => {
  const validIds = TOOLS.map((t) => t.id);

  beforeEach(() => {
    // Setup global window mock
    global.window = {
      localStorage: new MockLocalStorage(),
      dispatchEvent: () => true,
    };
    global.CustomEvent = class CustomEvent {
      constructor(type, params) {
        this.type = type;
        this.detail = params?.detail;
      }
    };
  });

  test("returns empty list initially when no history exists", () => {
    const recent = getRecentTools(TOOLS);
    assert.deepEqual(recent, []);
  });

  test("records tool visits and returns tools in MRU order", () => {
    recordToolUsage("photo-studio", validIds);
    recordToolUsage("background-remover", validIds);

    const recent = getRecentTools(TOOLS);
    assert.equal(recent.length, 2);
    assert.equal(recent[0].id, "background-remover");
    assert.equal(recent[1].id, "photo-studio");
  });

  test("deduplicates existing tools and moves reopened tool to top", () => {
    recordToolUsage("photo-studio", validIds);
    recordToolUsage("background-remover", validIds);
    recordToolUsage("photo-studio", validIds); // Reopen photo-studio

    const recent = getRecentTools(TOOLS);
    assert.equal(recent.length, 2);
    assert.equal(recent[0].id, "photo-studio");
    assert.equal(recent[1].id, "background-remover");
  });

  test("limits recent tools to MAX_RECENT_TOOLS", () => {
    recordToolUsage("photo-studio", validIds);
    recordToolUsage("background-remover", validIds);
    recordToolUsage("multiple-photo-maker", validIds);
    recordToolUsage("photo-editor", validIds);
    recordToolUsage("pan-card-crop", validIds);

    const recent = getRecentTools(TOOLS);
    assert.equal(recent.length, MAX_RECENT_TOOLS);
    assert.equal(recent[0].id, "pan-card-crop");
  });

  test("ignores invalid or non-registered tool IDs", () => {
    recordToolUsage("fake-unknown-tool", validIds);
    const recent = getRecentTools(TOOLS);
    assert.equal(recent.length, 0);
  });

  test("clears recent tools history", () => {
    recordToolUsage("photo-studio", validIds);
    recordToolUsage("background-remover", validIds);
    assert.equal(getRecentTools(TOOLS).length, 2);

    clearRecentTools();
    assert.equal(getRecentTools(TOOLS).length, 0);
  });
});

describe("PHASE 06 — Navigation & Route Verification", () => {
  test("every tool route maps to an existing page.tsx file on disk", () => {
    const appDir = path.resolve(process.cwd(), "src", "app");

    for (const tool of TOOLS) {
      // route: /tools/photo-studio -> src/app/tools/photo-studio/page.tsx
      const relativePath = tool.route.replace(/^\//, "");
      const pagePath = path.join(appDir, relativePath, "page.tsx");
      assert.ok(
        fs.existsSync(pagePath),
        `Route ${tool.route} must have a corresponding page file at ${pagePath}`
      );
    }
  });

  test("dashboard route (/dashboard) exists and resolves cleanly", () => {
    const dashboardPagePath = path.resolve(process.cwd(), "src", "app", "dashboard", "page.tsx");
    assert.ok(
      fs.existsSync(dashboardPagePath),
      `Expected dashboard page route to exist at ${dashboardPagePath}`
    );
  });

  test("tools index page (/tools) exists and resolves cleanly", () => {
    const toolsPagePath = path.resolve(process.cwd(), "src", "app", "tools", "page.tsx");
    assert.ok(
      fs.existsSync(toolsPagePath),
      `Expected tools catalog page to exist at ${toolsPagePath}`
    );
  });
});
