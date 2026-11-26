/**
 * Design Studio Dashboard Integration & Discoverability Test Suite
 *
 * Validates:
 * 1. Design Studio registration in TOOLS central registry.
 * 2. Presence in HOMEPAGE_TOOLS.
 * 3. Dedicated "design-studio" category tab and category filtering.
 * 4. Search query discovery for "Design Studio", "visiting card", "invitation", "ID card".
 * 5. Route accuracy: clicking tool opens /tools/design-studio.
 * 6. Badge configuration: "New" badge and Local processing badge.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { TOOLS, TOOL_CATEGORIES, getToolsByCategory, searchTools } from "../src/constants/tools.ts";
import { HOMEPAGE_TOOLS } from "../src/constants/homepage-tools.ts";

test("Design Studio — Central Registry & Dashboard Discoverability", async (t) => {
  const tool = TOOLS.find((t) => t.id === "design-studio");
  assert.ok(tool, "Design Studio must be registered in TOOLS");

  await t.test("tool metadata matches required specifications", () => {
    assert.equal(tool.name, "Design Studio");
    assert.equal(tool.route, "/tools/design-studio");
    assert.equal(tool.badge, "New");
    assert.equal(tool.iconName, "Palette");
    assert.equal(tool.category, "design-studio");
    assert.ok(tool.categories.includes("design-studio"));
  });

  await t.test("appears in HOMEPAGE_TOOLS for dashboard display", () => {
    const hpTool = HOMEPAGE_TOOLS.find((t) => t.id === "design-studio");
    assert.ok(hpTool, "Design Studio must be present in HOMEPAGE_TOOLS");
    assert.equal(hpTool.route, "/tools/design-studio");
  });

  await t.test("has dedicated category filter in TOOL_CATEGORIES", () => {
    const cat = TOOL_CATEGORIES.find((c) => c.id === "design-studio");
    assert.ok(cat, "design-studio category must exist in TOOL_CATEGORIES");
    assert.equal(cat.title, "Design Studio");
    assert.equal(cat.iconName, "Palette");
  });

  await t.test("category filter retrieves Design Studio cleanly", () => {
    const designStudioTools = getToolsByCategory("design-studio");
    assert.equal(designStudioTools.length, 1);
    assert.equal(designStudioTools[0].id, "design-studio");
  });

  await t.test("is discoverable via search engine", () => {
    const byName = searchTools("Design Studio");
    assert.ok(byName.some((t) => t.id === "design-studio"));

    const byCard = searchTools("visiting cards");
    assert.ok(byCard.some((t) => t.id === "design-studio"));

    const byInvite = searchTools("wedding invitations");
    assert.ok(byInvite.some((t) => t.id === "design-studio"));

    const byIdCard = searchTools("ID cards");
    assert.ok(byIdCard.some((t) => t.id === "design-studio"));
  });
});
