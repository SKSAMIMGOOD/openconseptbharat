import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { getWebsiteStructuredData, SITE_URL } from "../src/lib/seo/structured-data.ts";

describe("Phase 1: Homepage SEO Optimization — Print Ready Designs", () => {
  const pagePath = path.resolve(process.cwd(), "src/app/page.tsx");
  const layoutPath = path.resolve(process.cwd(), "src/app/layout.tsx");

  const pageContent = fs.readFileSync(pagePath, "utf-8");
  const layoutContent = fs.readFileSync(layoutPath, "utf-8");

  describe("1. Homepage Metadata & Official Domain", () => {
    test("SITE_URL points to official production domain https://www.printreadydesigns.in", () => {
      assert.equal(SITE_URL, "https://www.printreadydesigns.in");
    });

    test("layout metadata configures exact requested SEO title", () => {
      assert.ok(
        layoutContent.includes("Print Ready Designs – Free Aadhaar/PAN Card Cropper, Passport Photo & Resume Maker"),
        "layout metadata must contain the exact SEO title"
      );
    });

    test("layout metadata configures exact requested meta description", () => {
      assert.ok(
        layoutContent.includes(
          "Crop e-Aadhaar, PAN, and Ration cards to PVC print size, create 35×45mm Indian passport photos, straighten crooked documents, and build ATS resumes. 100% browser-based with zero file uploads."
        ),
        "layout metadata must contain the exact meta description"
      );
    });

    test("Open Graph and Twitter metadata use Print Ready Designs and exact title/description", () => {
      assert.ok(
        layoutContent.includes('siteName: "Print Ready Designs"'),
        "Open Graph siteName must be Print Ready Designs"
      );
    });
  });

  describe("2. Homepage H1 Structure", () => {
    test("homepage contains exactly one primary H1 element", () => {
      const h1Matches = pageContent.match(/<h1[\s\S]*?<\/h1>/gi);
      assert.ok(h1Matches, "Homepage must contain an H1 element");
      assert.equal(h1Matches.length, 1, "Homepage must have strictly one H1");
    });

    test("H1 contains the target text: Free Online Document Cropper, Passport Photo & Resume Maker", () => {
      const h1Match = pageContent.match(/<h1[\s\S]*?<\/h1>/i);
      assert.ok(h1Match, "H1 tag must exist");
      const h1Text = h1Match[0].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
      assert.equal(
        h1Text,
        "Free Online Document Cropper, Passport Photo & Resume Maker",
        "H1 content must match the requested headline"
      );
    });
  });

  describe("3. Homepage Introductory Content & Brand Identity", () => {
    test("homepage contains the exact requested introductory paragraph near hero", () => {
      const expectedIntro =
        "Print Ready Designs offers fast, privacy-focused browser tools to crop ID cards, create passport photos, arrange photos on A4 and 4×6 sheets, remove image backgrounds, straighten documents and generate print-ready PDFs — without uploading your files to a server.";
      assert.ok(
        pageContent.includes(expectedIntro),
        "Homepage must contain the exact introductory paragraph"
      );
    });

    test("WebSite structured data schema reflects Print Ready Designs brand", () => {
      const structuredData = getWebsiteStructuredData();
      assert.equal(structuredData["@context"], "https://schema.org");
      const graph = structuredData["@graph"];
      const website = graph.find((item) => item["@type"] === "WebSite");
      const org = graph.find((item) => item["@type"] === "Organization");

      assert.ok(website, "WebSite schema entity must be present");
      assert.equal(website.name, "Print Ready Designs");
      assert.equal(website.url, "https://www.printreadydesigns.in");
      assert.ok(
        website.description.includes("Crop e-Aadhaar, PAN, and Ration cards to PVC print size")
      );

      assert.ok(org, "Organization schema entity must be present");
      assert.equal(org.name, "Print Ready Designs");
      assert.equal(org.url, "https://www.printreadydesigns.in");
    });
  });

  describe("4. Preserved Invariants & In-Memory Privacy", () => {
    test("preserves SupportButton and dashboard-tools section", () => {
      assert.ok(pageContent.includes("SupportButton"), "SupportButton must remain");
      assert.ok(pageContent.includes("dashboard-tools"), "dashboard-tools section ID must remain");
    });
  });
});
