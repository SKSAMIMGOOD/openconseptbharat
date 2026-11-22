import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { TOOLS } from "../src/constants/tools.ts";
import {
  HOMEPAGE_TOOLS,
  VOTER_ID_TOOL,
  CUSTOM_DOCUMENT_TOOL,
} from "../src/constants/homepage-tools.ts";

describe("Homepage Tool Cards: Voter ID and Custom Document Integration", () => {
  test("central TOOLS registry remains untouched with exactly 10 tools", () => {
    assert.equal(TOOLS.length, 10, "Central TOOLS registry must not be modified");
    assert.ok(TOOLS.find((t) => t.id === "document-studio"), "document-studio must remain in central registry");
  });

  test("HOMEPAGE_TOOLS removes document-studio card from homepage display", () => {
    const hasDocStudio = HOMEPAGE_TOOLS.some((t) => t.id === "document-studio");
    assert.equal(hasDocStudio, false, "document-studio should not appear as a standalone card on homepage");
  });

  test("HOMEPAGE_TOOLS contains Free Voter ID Card Crop Tool with exact specs", () => {
    const voterTool = HOMEPAGE_TOOLS.find((t) => t.id === "voter-id-crop");
    assert.ok(voterTool, "Voter ID card must be present on homepage");
    assert.equal(voterTool.name, "Free Voter ID Card Crop Tool");
    assert.equal(
      voterTool.shortDescription,
      "Crop and prepare Voter ID / e-EPIC documents for clean, print-ready output."
    );
    assert.equal(voterTool.route, "/tools/document-studio?type=voter-id");
    assert.equal(voterTool.category, "utilities");
    assert.ok(voterTool.categories.includes("utilities"));
    assert.ok(voterTool.features.length >= 2);
  });

  test("HOMEPAGE_TOOLS contains Free Custom Document Crop Tool with exact specs", () => {
    const customTool = HOMEPAGE_TOOLS.find((t) => t.id === "custom-document-crop");
    assert.ok(customTool, "Custom Document card must be present on homepage");
    assert.equal(customTool.name, "Free Custom Document Crop Tool");
    assert.equal(
      customTool.shortDescription,
      "Crop and prepare custom ID cards, certificates and other documents for printing."
    );
    assert.equal(customTool.route, "/tools/document-studio?type=custom");
    assert.equal(customTool.category, "utilities");
    assert.ok(customTool.categories.includes("utilities"));
    assert.ok(customTool.features.length >= 2);
  });

  test("HOMEPAGE_TOOLS total count is 11 (10 original - 1 document-studio + 2 separate cards)", () => {
    assert.equal(HOMEPAGE_TOOLS.length, 11, "Expected 11 tools on the homepage");
  });

  test("Document Studio page handles ?type=voter-id and ?type=custom query parameters", () => {
    const docStudioPagePath = path.resolve(
      process.cwd(),
      "src/app/tools/document-studio/page.tsx"
    );
    const code = fs.readFileSync(docStudioPagePath, "utf-8");

    assert.ok(
      code.includes("useSearchParams"),
      "DocumentStudioPage must read search parameters for deep-linking"
    );
    assert.ok(
      code.includes("voter-id"),
      "DocumentStudioPage must map voter-id parameter"
    );
    assert.ok(
      code.includes("custom"),
      "DocumentStudioPage must map custom parameter"
    );
    assert.ok(
      code.includes("<Suspense"),
      "useSearchParams must be wrapped in Suspense boundary"
    );
  });
});
