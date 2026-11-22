import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  GUIDES,
  getGuideBySlug,
  getGuidesByCategory,
  getAllGuideCategories,
} from "../src/constants/guides.ts";
import { getToolById } from "../src/constants/tools.ts";
import {
  getGuideBreadcrumbSchema,
  getGuidesIndexBreadcrumbSchema,
  getGuideArticleSchema,
  getGuideHowToSchema,
  getGuideFaqSchema,
} from "../src/lib/seo/guide-structured-data.ts";
import sitemap from "../src/app/sitemap.ts";

describe("Phase 3: Helpful Content & SEO Guides Test Suite", () => {
  const expectedSlugs = [
    "crop-aadhaar-card-pvc-printing",
    "crop-pan-card-pvc-printing",
    "indian-passport-size-photo-guide",
    "print-multiple-passport-photos-a4",
    "straighten-crooked-document-photo",
    "create-ats-friendly-resume",
  ];

  describe("1. Guide Registry & Content Quality", () => {
    test("defines exactly 6 prioritized educational guides", () => {
      assert.equal(GUIDES.length, 6);
      const slugs = GUIDES.map((g) => g.slug);
      assert.deepEqual(slugs, expectedSlugs);
    });

    for (const slug of expectedSlugs) {
      test(`Guide '${slug}' has complete and authoritative content`, () => {
        const guide = getGuideBySlug(slug);
        assert.ok(guide, `Guide not found for slug: ${slug}`);

        // URLs & Titles
        assert.ok(guide.title.length >= 10, "Title must be descriptive");
        assert.ok(
          guide.seoTitle.endsWith("| Print Ready Designs"),
          `SEO title must end with '| Print Ready Designs': ${guide.seoTitle}`
        );
        assert.ok(
          guide.metaDescription.length >= 80 && guide.metaDescription.length <= 320,
          `Meta description length (${guide.metaDescription.length}) must be between 80-320 chars`
        );
        assert.ok(guide.primaryKeyword.length > 5);

        // Metadata
        assert.ok(guide.readTime.includes("min read"));
        assert.match(guide.publishedAt, /^\d{4}-\d{2}-\d{2}$/);
        assert.match(guide.updatedAt, /^\d{4}-\d{2}-\d{2}$/);
        assert.ok(guide.author.includes("Print Ready Designs"));

        // Content
        assert.ok(guide.summary.length >= 50, "Summary must be substantive");
        assert.ok(guide.introduction.length >= 120, "Introduction must be detailed");
        assert.ok(guide.keySpecs.length >= 4, "Must define at least 4 key technical specs");
        for (const spec of guide.keySpecs) {
          assert.ok(spec.label.length > 2);
          assert.ok(spec.value.length > 2);
        }

        // Steps
        assert.ok(guide.steps.length >= 4, "Must provide at least 4 detailed steps");
        guide.steps.forEach((step, idx) => {
          assert.equal(step.stepNumber, idx + 1);
          assert.ok(step.title.length > 5);
          assert.ok(step.description.length > 20);
        });

        // Common mistakes
        assert.ok(guide.commonMistakes.length >= 3, "Must list at least 3 common mistakes and fixes");
        for (const item of guide.commonMistakes) {
          assert.ok(item.mistake.length > 5);
          assert.ok(item.fix.length > 10);
        }

        // FAQs
        assert.ok(guide.faqs.length >= 3, "Must list at least 3 guide FAQs");
        for (const faq of guide.faqs) {
          assert.ok(faq.question.endsWith("?"));
          assert.ok(faq.answer.length > 20);
        }

        // Companion Tool Link
        assert.ok(guide.relatedTool, "Must have a companion tool");
        const toolInRegistry = getToolById(guide.relatedTool.id);
        assert.ok(toolInRegistry, `Related tool ${guide.relatedTool.id} must exist in TOOLS registry`);
        assert.equal(guide.relatedTool.route, toolInRegistry.route);

        // Related Guides
        assert.ok(guide.relatedGuides.length >= 2, "Must link to at least 2 related guides");
        for (const relSlug of guide.relatedGuides) {
          assert.notEqual(relSlug, guide.slug, "Guide must not link to itself");
          const relGuide = getGuideBySlug(relSlug);
          assert.ok(relGuide, `Related guide ${relSlug} must exist in GUIDES`);
        }
      });
    }
  });

  describe("2. Category and Retrieval Helpers", () => {
    test("getAllGuideCategories returns unique non-empty categories", () => {
      const categories = getAllGuideCategories();
      assert.ok(categories.length >= 3);
      assert.ok(categories.includes("ID Card Printing"));
      assert.ok(categories.includes("Passport Photos"));
      assert.ok(categories.includes("Document Processing"));
      assert.ok(categories.includes("Career Tools"));
    });

    test("getGuidesByCategory retrieves matching items", () => {
      const idCardGuides = getGuidesByCategory("ID Card Printing");
      assert.equal(idCardGuides.length, 2);
      assert.ok(idCardGuides.some((g) => g.slug === "crop-aadhaar-card-pvc-printing"));
      assert.ok(idCardGuides.some((g) => g.slug === "crop-pan-card-pvc-printing"));
    });
  });

  describe("3. Schema.org Structured Data Generation", () => {
    const sampleGuide = GUIDES[0];

    test("generates compliant BreadcrumbList schema for guide page", () => {
      const schema = getGuideBreadcrumbSchema(sampleGuide, "https://www.printreadydesigns.in");
      assert.equal(schema["@context"], "https://schema.org");
      assert.equal(schema["@type"], "BreadcrumbList");
      assert.equal(schema.itemListElement.length, 3);

      assert.equal(schema.itemListElement[0].name, "Home");
      assert.equal(schema.itemListElement[0].item, "https://www.printreadydesigns.in");

      assert.equal(schema.itemListElement[1].name, "Guides");
      assert.equal(schema.itemListElement[1].item, "https://www.printreadydesigns.in/guides");

      assert.equal(schema.itemListElement[2].name, sampleGuide.title);
      assert.equal(
        schema.itemListElement[2].item,
        `https://www.printreadydesigns.in/guides/${sampleGuide.slug}`
      );
    });

    test("generates compliant BreadcrumbList schema for guides directory", () => {
      const schema = getGuidesIndexBreadcrumbSchema("https://www.printreadydesigns.in");
      assert.equal(schema.itemListElement.length, 2);
      assert.equal(schema.itemListElement[0].name, "Home");
      assert.equal(schema.itemListElement[1].name, "Guides");
    });

    test("generates compliant Article schema for guide", () => {
      const schema = getGuideArticleSchema(sampleGuide, "https://www.printreadydesigns.in");
      assert.equal(schema["@context"], "https://schema.org");
      assert.equal(schema["@type"], "Article");
      assert.equal(schema.headline, sampleGuide.title);
      assert.equal(schema.datePublished, sampleGuide.publishedAt);
      assert.equal(schema.dateModified, sampleGuide.updatedAt);
      assert.equal(
        schema.mainEntityOfPage,
        `https://www.printreadydesigns.in/guides/${sampleGuide.slug}`
      );
      assert.equal(schema.author.name, "Print Ready Designs Editorial Team");
      assert.equal(schema.publisher.name, "Print Ready Designs");
    });

    test("generates compliant HowTo schema for step-by-step instructions", () => {
      const schema = getGuideHowToSchema(sampleGuide, "https://www.printreadydesigns.in");
      assert.equal(schema["@context"], "https://schema.org");
      assert.equal(schema["@type"], "HowTo");
      assert.equal(schema.name, sampleGuide.title);
      assert.equal(schema.step.length, sampleGuide.steps.length);
      assert.equal(schema.step[0]["@type"], "HowToStep");
      assert.equal(schema.step[0].position, 1);
      assert.ok(schema.step[0].itemListElement[0].text.length > 10);
    });

    test("generates compliant FAQPage schema for guide FAQs", () => {
      const schema = getGuideFaqSchema(sampleGuide);
      assert.ok(schema);
      assert.equal(schema["@context"], "https://schema.org");
      assert.equal(schema["@type"], "FAQPage");
      assert.equal(schema.mainEntity.length, sampleGuide.faqs.length);
      assert.equal(schema.mainEntity[0]["@type"], "Question");
      assert.ok(schema.mainEntity[0].name.endsWith("?"));
      assert.equal(schema.mainEntity[0].acceptedAnswer["@type"], "Answer");
    });
  });

  describe("4. Sitemap Inclusion & URL Accuracy", () => {
    test("sitemap includes /guides index and all 6 guide URLs with production domain", () => {
      const entries = sitemap();
      const urls = entries.map((e) => e.url);

      assert.ok(
        urls.includes("https://www.printreadydesigns.in/guides"),
        "Sitemap must include /guides directory"
      );

      for (const slug of expectedSlugs) {
        const expectedUrl = `https://www.printreadydesigns.in/guides/${slug}`;
        assert.ok(
          urls.includes(expectedUrl),
          `Sitemap must include guide URL: ${expectedUrl}`
        );
      }
    });
  });

  describe("5. Internal Navigation & Page Files", () => {
    test("Guides Index page file exists", () => {
      const p = path.resolve(process.cwd(), "src/app/guides/page.tsx");
      assert.ok(fs.existsSync(p), "src/app/guides/page.tsx must exist");
      const content = fs.readFileSync(p, "utf8");
      assert.ok(content.includes("Printing Guides & Document Utilities Tutorials"));
      assert.ok(content.includes("GUIDES.map"));
    });

    test("Individual Guide page file exists with generateStaticParams", () => {
      const p = path.resolve(process.cwd(), "src/app/guides/[slug]/page.tsx");
      assert.ok(fs.existsSync(p), "src/app/guides/[slug]/page.tsx must exist");
      const content = fs.readFileSync(p, "utf8");
      assert.ok(content.includes("generateStaticParams"));
      assert.ok(content.includes("generateMetadata"));
      assert.ok(content.includes("GuidePage"));
    });

    test("Header component links to /guides", () => {
      const p = path.resolve(process.cwd(), "src/components/layout/Header.tsx");
      const content = fs.readFileSync(p, "utf8");
      assert.ok(
        content.includes('href: "/guides"'),
        "Header must include /guides link"
      );
    });

    test("Footer component links to /guides", () => {
      const p = path.resolve(process.cwd(), "src/components/layout/Footer.tsx");
      const content = fs.readFileSync(p, "utf8");
      assert.ok(
        content.includes('href="/guides"'),
        "Footer must include /guides link"
      );
    });

    test("ToolSeoSection links tools to their companion guides", () => {
      const p = path.resolve(process.cwd(), "src/components/seo/ToolSeoSection.tsx");
      const content = fs.readFileSync(p, "utf8");
      assert.ok(
        content.includes("TOOL_TO_GUIDE_MAP"),
        "ToolSeoSection must have companion guide mapping"
      );
      assert.ok(
        content.includes("/guides/${companionGuide.slug}"),
        "ToolSeoSection must render link to companion guide"
      );
    });
  });
});
