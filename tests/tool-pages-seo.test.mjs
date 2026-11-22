import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { TOOLS, getToolById } from "../src/constants/tools.ts";
import {
  TOOL_SEO_MAP,
  getToolSeoData,
  generateToolMetadata,
} from "../src/constants/tool-seo.ts";
import { getToolFaqStructuredData } from "../src/lib/seo/structured-data.ts";

describe("Phase 2: Individual Tool-Page SEO Optimization Test Suite", () => {
  const targetTools = [
    {
      id: "aadhaar-card-crop",
      expectedH1: "Free Online e-Aadhaar Card Cropper – PVC Card Print Size",
      expectedTitle:
        "Free e-Aadhaar Card Cropper Online – PVC Print Size PDF Tool | Print Ready Designs",
      primaryKeyword: "e-Aadhaar card cropper online",
    },
    {
      id: "pan-card-crop",
      expectedH1: "Free Online PAN Card Crop Tool – NSDL & UTI Card Size",
      expectedTitle:
        "Free PAN Card Crop Tool Online – NSDL & UTI PVC Print Size | Print Ready Designs",
      primaryKeyword: "PAN card crop tool online",
    },
    {
      id: "ration-card-crop",
      expectedH1: "Free Online Digital Ration Card Crop Tool",
      expectedTitle:
        "Free Digital Ration Card Cropper Online – PVC & Lamination Print Size | Print Ready Designs",
      primaryKeyword: "digital ration card PVC print",
    },
    {
      id: "photo-studio",
      expectedH1: "Free Indian Passport Size Photo Maker – 35×45mm",
      expectedTitle:
        "Indian Passport Photo Maker (35×45mm) & A4 Print Sheet | Print Ready Designs",
      primaryKeyword: "Indian passport size photo maker 35x45mm",
    },
    {
      id: "multiple-photo-maker",
      expectedH1: "Free Multiple Passport Photo Maker – A4 & 4×6 Sheets",
      expectedTitle:
        "Free Passport Photo Sheet Maker – A4 & 4×6 Printing | Print Ready Designs",
      primaryKeyword: "passport photo sheet maker A4 4x6",
    },
    {
      id: "document-straightener",
      expectedH1:
        "Free Document Straightener – Turn Crooked Photos into Print-Ready Documents",
      expectedTitle:
        "Free Document Straightener – Fix Crooked Photos & Create PDF | Print Ready Designs",
      primaryKeyword: "crooked document photo to straight PDF",
    },
    {
      id: "background-remover",
      expectedH1: "Free Online AI Background Remover",
      expectedTitle: "Free AI Image Background Remover Online – Print Ready Designs",
      primaryKeyword: "free AI image background remover",
    },
    {
      id: "resume-maker",
      expectedH1: "Free ATS-Friendly Resume & CV Maker",
      expectedTitle:
        "Free ATS-Friendly Resume Maker Online India – PDF Builder | Print Ready Designs",
      primaryKeyword: "free ATS-friendly resume maker online India",
    },
    {
      id: "photo-editor",
      expectedH1: "Free Online Advanced Photo Editor",
      expectedTitle:
        "Free Advanced Photo Editor Online – Crop, Adjust & Compress | Print Ready Designs",
      primaryKeyword: "free online photo editor crop compress",
    },
    {
      id: "document-studio",
      expectedH1:
        "Free Online Document Studio – All-in-One ID & Certificate Cropper",
      expectedTitle:
        "Free Document Studio Online – Crop Voter ID, PAN, Aadhaar & Custom Docs | Print Ready Designs",
      primaryKeyword: "document studio crop id cards online",
    },
  ];

  describe("1. Target Tool SEO Configuration Integrity", () => {
    for (const target of targetTools) {
      test(`Tool '${target.id}' has complete and accurate SEO metadata`, () => {
        const seoData = getToolSeoData(target.id);
        assert.ok(seoData, `Missing SEO data for tool: ${target.id}`);

        assert.equal(seoData.h1, target.expectedH1);
        assert.equal(seoData.seoTitle, target.expectedTitle);
        assert.equal(seoData.primaryKeyword, target.primaryKeyword);
        assert.ok(
          seoData.metaDescription.length >= 80 &&
            seoData.metaDescription.length <= 320,
          `Description length ${seoData.metaDescription.length} out of bounds for ${target.id}`
        );
        assert.ok(
          seoData.keywords.length >= 3,
          `Must have at least 3 keywords for ${target.id}`
        );
        assert.ok(
          seoData.intro.length >= 50,
          `Intro copy must be substantive for ${target.id}`
        );
      });
    }
  });

  describe("2. Educational Content: How-To-Use Guides", () => {
    for (const target of targetTools) {
      test(`Tool '${target.id}' has 4 clear, ordered step-by-step instructions`, () => {
        const seoData = getToolSeoData(target.id);
        assert.ok(seoData);
        assert.equal(seoData.howToUse.length, 4);

        seoData.howToUse.forEach((step, idx) => {
          assert.equal(step.step, idx + 1);
          assert.ok(step.title.trim().length > 3, "Step title must not be empty");
          assert.ok(
            step.description.trim().length > 15,
            "Step description must be detailed"
          );
        });
      });
    }
  });

  describe("3. Frequently Asked Questions (FAQs) & Structured Data", () => {
    for (const target of targetTools) {
      test(`Tool '${target.id}' has 4 tool-specific visible FAQs`, () => {
        const seoData = getToolSeoData(target.id);
        assert.ok(seoData);
        assert.equal(seoData.faqs.length, 4);

        for (const faq of seoData.faqs) {
          assert.ok(faq.question.endsWith("?"), "FAQ question should end with '?'");
          assert.ok(
            faq.answer.trim().length > 20,
            "FAQ answer should be substantive"
          );
        }
      });

      test(`Tool '${target.id}' generates valid Schema.org FAQPage structured data`, () => {
        const faqSchema = getToolFaqStructuredData(target.id);
        assert.ok(faqSchema, `FAQ schema should be generated for ${target.id}`);
        assert.equal(faqSchema["@context"], "https://schema.org");
        assert.equal(faqSchema["@type"], "FAQPage");
        assert.equal(faqSchema.mainEntity.length, 4);

        faqSchema.mainEntity.forEach((entity, index) => {
          assert.equal(entity["@type"], "Question");
          assert.ok(entity.name.length > 5);
          assert.equal(entity.acceptedAnswer["@type"], "Answer");
          assert.ok(entity.acceptedAnswer.text.length > 10);
        });
      });
    }
  });

  describe("4. Contextual Internal Cross-Linking Verification", () => {
    for (const target of targetTools) {
      test(`Tool '${target.id}' has 4 valid internal related-tool links`, () => {
        const seoData = getToolSeoData(target.id);
        assert.ok(seoData);
        assert.equal(seoData.relatedTools.length, 4);

        for (const link of seoData.relatedTools) {
          assert.notEqual(
            link.toolId,
            target.id,
            "Tool should not link to itself in related tools"
          );
          assert.ok(
            link.href.startsWith("/tools/"),
            `Link href must start with /tools/: ${link.href}`
          );
          // Verify linked tool exists in registry
          const linkedTool = getToolById(link.toolId);
          assert.ok(linkedTool, `Linked tool ${link.toolId} must exist in registry`);
          assert.equal(link.href, linkedTool.route);
          assert.ok(link.title.length > 3);
          assert.ok(link.description.length > 10);
        }
      });
    }
  });

  describe("5. Next.js Metadata Generator Verification", () => {
    for (const target of targetTools) {
      test(`generateToolMetadata('${target.id}') generates compliant Next.js metadata`, () => {
        const meta = generateToolMetadata(target.id);
        assert.ok(meta);
        assert.equal(meta.title.absolute, target.expectedTitle);
        assert.ok(meta.description);
        assert.equal(meta.alternates.canonical, `/tools/${target.id}`);
        assert.equal(meta.openGraph.title, target.expectedTitle);
        assert.equal(meta.openGraph.url, `/tools/${target.id}`);
        assert.equal(meta.openGraph.siteName, "Print Ready Designs");
        assert.equal(meta.twitter.title, target.expectedTitle);
      });
    }
  });

  describe("6. Layout Files Integration & Absence of Legacy Domain", () => {
    for (const target of targetTools) {
      test(`Layout file for '${target.id}' exists and uses Print Ready Designs metadata`, () => {
        const layoutFilePath = path.resolve(
          process.cwd(),
          `src/app/tools/${target.id}/layout.tsx`
        );
        assert.ok(
          fs.existsSync(layoutFilePath),
          `Layout file must exist at ${layoutFilePath}`
        );

        const content = fs.readFileSync(layoutFilePath, "utf8");
        assert.ok(
          content.includes("generateToolMetadata"),
          `Layout for ${target.id} should use generateToolMetadata`
        );
        assert.ok(
          !content.includes("Browser Utility Studio"),
          `Layout for ${target.id} must not reference old brand 'Browser Utility Studio'`
        );
        assert.ok(
          !content.includes("browserutilitystudio.com"),
          `Layout for ${target.id} must not reference old domain 'browserutilitystudio.com'`
        );
      });
    }
  });

  describe("7. ModuleLayout & Visible SEO Content Components", () => {
    test("ModuleLayout source imports and renders ToolSeoSection and displayH1", () => {
      const moduleLayoutPath = path.resolve(
        process.cwd(),
        "src/components/layout/ModuleLayout.tsx"
      );
      const content = fs.readFileSync(moduleLayoutPath, "utf8");

      assert.ok(content.includes("getToolSeoData"));
      assert.ok(content.includes("getToolFaqStructuredData"));
      assert.ok(content.includes("ToolSeoSection"));
      assert.ok(content.includes("displayH1"));
      assert.ok(content.includes("<ToolSeoSection toolId={tool.id} />"));
    });

    test("ToolSeoSection component file exists and implements all sections", () => {
      const seoSectionPath = path.resolve(
        process.cwd(),
        "src/components/seo/ToolSeoSection.tsx"
      );
      assert.ok(fs.existsSync(seoSectionPath));

      const content = fs.readFileSync(seoSectionPath, "utf8");
      assert.ok(content.includes("How to Use"));
      assert.ok(content.includes("Frequently Asked Questions"));
      assert.ok(content.includes("Related Free Online Tools"));
      assert.ok(content.includes("getToolSeoData"));
    });
  });
});
