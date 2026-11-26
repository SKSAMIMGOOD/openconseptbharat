import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { TOOLS, TOOL_CATEGORIES } from "../src/constants/tools.ts";
import {
  getToolBreadcrumbName,
  getToolCategoryBreadcrumb,
  getToolVisualBreadcrumbs,
  getToolBreadcrumbListSchema,
  getBreadcrumbListSchema,
  safeJsonLdStringify,
  SITE_URL,
} from "../src/lib/seo/breadcrumbs.ts";

describe("SEO Breadcrumb Navigation & BreadcrumbList Structured Data", () => {
  const EXPECTED_HIERARCHIES = [
    {
      toolId: "photo-studio",
      expectedCategory: "Photo Studio",
      expectedToolName: "Free Passport Photo Studio",
      expectedCategoryPath: "/tools?category=photo-studio",
      expectedToolPath: "/tools/photo-studio",
    },
    {
      toolId: "background-remover",
      expectedCategory: "Image Tools",
      expectedToolName: "Free Background Remover",
      expectedCategoryPath: "/tools?category=image-tools",
      expectedToolPath: "/tools/background-remover",
    },
    {
      toolId: "photo-editor",
      expectedCategory: "Image Tools",
      expectedToolName: "Free Advanced Photo Editor",
      expectedCategoryPath: "/tools?category=image-tools",
      expectedToolPath: "/tools/photo-editor",
    },
    {
      toolId: "multiple-photo-maker",
      expectedCategory: "Photo Printing",
      expectedToolName: "Free Multiple Photo Maker",
      expectedCategoryPath: "/tools?category=photo-printing",
      expectedToolPath: "/tools/multiple-photo-maker",
    },
    {
      toolId: "pan-card-crop",
      expectedCategory: "Utilities",
      expectedToolName: "Free PAN Card Crop Tool",
      expectedCategoryPath: "/tools?category=utilities",
      expectedToolPath: "/tools/pan-card-crop",
    },
    {
      toolId: "aadhaar-card-crop",
      expectedCategory: "Utilities",
      expectedToolName: "Free Aadhaar Card Crop Tool",
      expectedCategoryPath: "/tools?category=utilities",
      expectedToolPath: "/tools/aadhaar-card-crop",
    },
    {
      toolId: "ration-card-crop",
      expectedCategory: "Utilities",
      expectedToolName: "Free Ration Card Crop Tool",
      expectedCategoryPath: "/tools?category=utilities",
      expectedToolPath: "/tools/ration-card-crop",
    },
    {
      toolId: "resume-maker",
      expectedCategory: "Utilities",
      expectedToolName: "Free Resume / CV Maker",
      expectedCategoryPath: "/tools?category=utilities",
      expectedToolPath: "/tools/resume-maker",
    },
    {
      toolId: "document-studio",
      expectedCategory: "Utilities",
      expectedToolName: "Free Document Studio",
      expectedCategoryPath: "/tools?category=utilities",
      expectedToolPath: "/tools/document-studio",
    },
    {
      toolId: "document-straightener",
      expectedCategory: "Utilities",
      expectedToolName: "Document Straightener",
      expectedCategoryPath: "/tools?category=utilities",
      expectedToolPath: "/tools/document-straightener",
    },
    {
      toolId: "raw-image-to-pdf",
      expectedCategory: "Utilities",
      expectedToolName: "Raw Image to Clean PDF",
      expectedCategoryPath: "/tools?category=utilities",
      expectedToolPath: "/tools/raw-image-to-pdf",
    },
    {
      toolId: "design-studio",
      expectedCategory: "Design Studio",
      expectedToolName: "Design Studio",
      expectedCategoryPath: "/tools?category=design-studio",
      expectedToolPath: "/tools/design-studio",
    },
  ];

  test("contains all verified tools in TOOLS registry", () => {
    assert.ok(TOOLS.length >= 11, "Expected at least 11 registered tools");
    for (const item of EXPECTED_HIERARCHIES) {
      const tool = TOOLS.find((t) => t.id === item.toolId);
      assert.ok(tool, `Tool ${item.toolId} must be present in registry`);
    }
  });

  test("uses official production domain as SITE_URL", () => {
    assert.equal(SITE_URL, "https://www.printreadydesigns.in");
  });

  for (const item of EXPECTED_HIERARCHIES) {
    describe(`Tool: ${item.toolId}`, () => {
      const tool = TOOLS.find((t) => t.id === item.toolId);

      test(`resolves correct breadcrumb display name "${item.expectedToolName}"`, () => {
        const name = getToolBreadcrumbName(tool);
        assert.equal(name, item.expectedToolName);
      });

      test(`resolves correct category breadcrumb "${item.expectedCategory}" and path "${item.expectedCategoryPath}"`, () => {
        const catInfo = getToolCategoryBreadcrumb(tool);
        assert.equal(catInfo.name, item.expectedCategory);
        assert.equal(catInfo.href, item.expectedCategoryPath);
      });

      test("generates 2-level visual breadcrumb array for ModuleLayout", () => {
        const visual = getToolVisualBreadcrumbs(tool);
        assert.equal(visual.length, 2);
        assert.equal(visual[0].label, item.expectedCategory);
        assert.equal(visual[0].href, item.expectedCategoryPath);
        assert.equal(visual[1].label, item.expectedToolName);
        assert.equal(visual[1].href, undefined);
      });

      test("generates Google-compliant BreadcrumbList Schema.org structured data", () => {
        const schema = getToolBreadcrumbListSchema(tool);

        assert.equal(schema["@context"], "https://schema.org");
        assert.equal(schema["@type"], "BreadcrumbList");
        assert.ok(Array.isArray(schema.itemListElement));
        assert.equal(schema.itemListElement.length, 3);

        // Position 1: Home
        assert.deepEqual(schema.itemListElement[0], {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://www.printreadydesigns.in",
        });

        // Position 2: Category
        assert.deepEqual(schema.itemListElement[1], {
          "@type": "ListItem",
          position: 2,
          name: item.expectedCategory,
          item: `https://www.printreadydesigns.in${item.expectedCategoryPath}`,
        });

        // Position 3: Tool
        assert.deepEqual(schema.itemListElement[2], {
          "@type": "ListItem",
          position: 3,
          name: item.expectedToolName,
          item: `https://www.printreadydesigns.in${item.expectedToolPath}`,
        });
      });
    });
  }

  test("safeJsonLdStringify escapes HTML tags and special entities", () => {
    const dangerousPayload = {
      name: "</script><script>alert('xss')</script>&foo",
    };
    const serialized = safeJsonLdStringify(dangerousPayload);
    assert.ok(!serialized.includes("<"));
    assert.ok(!serialized.includes(">"));
    assert.ok(!serialized.includes("&"));
    assert.ok(serialized.includes("\\u003c/script\\u003e"));
    assert.ok(serialized.includes("\\u0026foo"));
  });

  test("getBreadcrumbListSchema handles generic path inputs gracefully", () => {
    const generic = getBreadcrumbListSchema([
      { name: "Documentation", path: "/docs" },
      { name: "Getting Started", path: "/docs/getting-started" },
    ]);
    assert.equal(generic.itemListElement.length, 3);
    assert.equal(generic.itemListElement[0].name, "Home");
    assert.equal(generic.itemListElement[0].item, "https://www.printreadydesigns.in");
    assert.equal(generic.itemListElement[1].name, "Documentation");
    assert.equal(generic.itemListElement[1].item, "https://www.printreadydesigns.in/docs");
    assert.equal(generic.itemListElement[2].name, "Getting Started");
    assert.equal(generic.itemListElement[2].item, "https://www.printreadydesigns.in/docs/getting-started");
  });
});
