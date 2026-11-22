import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import robots from "../src/app/robots.ts";
import sitemap from "../src/app/sitemap.ts";
import nextConfig from "../next.config.mjs";
import { getWebsiteStructuredData } from "../src/lib/seo/structured-data.ts";

describe("Phase 4: Technical SEO Audit & Verification Test Suite", () => {
  const officialDomain = "https://www.printreadydesigns.in";

  describe("1. Crawlability & Indexing Directives", () => {
    test("robots() returns compliant robots.txt configuration", () => {
      const robotsData = robots();
      assert.ok(robotsData);
      assert.equal(robotsData.sitemap, `${officialDomain}/sitemap.xml`);
      assert.ok(Array.isArray(robotsData.rules));

      const defaultRule = robotsData.rules[0];
      assert.equal(defaultRule.userAgent, "*");
      assert.equal(defaultRule.allow, "/");
      assert.deepEqual(defaultRule.disallow, ["/test-engine"]);
    });

    test("sitemap() contains only canonical, public indexable URLs", () => {
      const sitemapEntries = sitemap();
      assert.ok(Array.isArray(sitemapEntries));
      assert.equal(sitemapEntries.length, 24); // 8 core + 10 tools + 6 guides

      for (const entry of sitemapEntries) {
        assert.ok(
          entry.url.startsWith(officialDomain),
          `Sitemap URL must start with official domain: ${entry.url}`
        );
        assert.notEqual(entry.url, `${officialDomain}/test-engine`);
        assert.notEqual(entry.url, `${officialDomain}/dashboard`);
        assert.notEqual(entry.url, `${officialDomain}/tools/multiple-photos`);
      }
    });

    test("internal test harness /test-engine layout has explicit noindex", () => {
      const p = path.resolve(process.cwd(), "src/app/test-engine/layout.tsx");
      assert.ok(fs.existsSync(p));
      const content = fs.readFileSync(p, "utf8");
      assert.ok(content.includes("index: false"));
      assert.ok(content.includes("follow: false"));
    });

    test("legacy alias /tools/multiple-photos layout has explicit noindex and canonical", () => {
      const p = path.resolve(process.cwd(), "src/app/tools/multiple-photos/layout.tsx");
      assert.ok(fs.existsSync(p));
      const content = fs.readFileSync(p, "utf8");
      assert.ok(content.includes("index: false"));
      assert.ok(content.includes("follow: true"));
      assert.ok(content.includes('canonical: "/tools/multiple-photo-maker"'));
    });

    test("404 error page has explicit noindex and proper Link import", () => {
      const p = path.resolve(process.cwd(), "src/app/not-found.tsx");
      assert.ok(fs.existsSync(p));
      const content = fs.readFileSync(p, "utf8");
      assert.ok(content.includes('import Link from "next/link"'));
      assert.ok(content.includes("index: false"));
      assert.ok(content.includes("follow: false"));
    });
  });

  describe("2. Canonical URLs & Permanent Redirects", () => {
    const coreRoutes = ["about", "contact", "privacy", "terms", "settings", "tools"];

    for (const route of coreRoutes) {
      test(`${route} layout declares self-referencing canonical '/${route}'`, () => {
        const p = path.resolve(process.cwd(), `src/app/${route}/layout.tsx`);
        assert.ok(fs.existsSync(p));
        const content = fs.readFileSync(p, "utf8");
        assert.ok(content.includes(`canonical: "/${route}"`));
      });
    }

    test("next.config.mjs enforces 301/308 permanent redirects to official www domain", async () => {
      const redirects = await nextConfig.redirects();
      assert.ok(Array.isArray(redirects));

      // Non-www apex redirect
      const apexRedirect = redirects.find(
        (r) => r.has && r.has.some((h) => h.value === "printreadydesigns.in")
      );
      assert.ok(apexRedirect);
      assert.equal(apexRedirect.destination, "https://www.printreadydesigns.in/:path*");
      assert.equal(apexRedirect.permanent, true);

      // Legacy domain redirects
      const legacyRedirect = redirects.find(
        (r) => r.has && r.has.some((h) => h.value === "browserutilitystudio.com")
      );
      assert.ok(legacyRedirect);
      assert.equal(legacyRedirect.destination, "https://www.printreadydesigns.in/:path*");
      assert.equal(legacyRedirect.permanent, true);

      // Alias route redirect
      const aliasRedirect = redirects.find(
        (r) => r.source === "/tools/multiple-photos"
      );
      assert.ok(aliasRedirect);
      assert.equal(aliasRedirect.destination, "/tools/multiple-photo-maker");
      assert.equal(aliasRedirect.permanent, true);
    });
  });

  describe("3. Brand Consistency in Core Metadata & Navigation", () => {
    const coreRoutes = ["about", "contact", "privacy", "terms", "settings", "tools"];

    for (const route of coreRoutes) {
      test(`${route} layout metadata uses official brand Print Ready Designs`, () => {
        const p = path.resolve(process.cwd(), `src/app/${route}/layout.tsx`);
        const content = fs.readFileSync(p, "utf8");

        assert.ok(
          content.includes('siteName: "Print Ready Designs"'),
          `${route} must define siteName as Print Ready Designs`
        );
        assert.ok(
          content.includes("Print Ready Designs"),
          `${route} must reference Print Ready Designs`
        );
        assert.ok(
          !content.includes("Browser Utility Studio"),
          `${route} must not reference legacy brand Browser Utility Studio`
        );
      });
    }

    test("Header component displays Print Ready Designs brand", () => {
      const headerPath = path.resolve(process.cwd(), "src/components/layout/Header.tsx");
      const content = fs.readFileSync(headerPath, "utf8");
      assert.ok(content.includes("Print Ready Designs"));
    });

    test("Footer component displays Print Ready Designs brand and copyright", () => {
      const footerPath = path.resolve(process.cwd(), "src/components/layout/Footer.tsx");
      const content = fs.readFileSync(footerPath, "utf8");
      assert.ok(content.includes("Print Ready Designs"));
      assert.ok(content.includes("© {new Date().getFullYear()} Print Ready Designs"));
    });
  });

  describe("4. Structured Data Validation", () => {
    test("getWebsiteStructuredData() generates valid WebSite and Organization schema", () => {
      const data = getWebsiteStructuredData(officialDomain);
      assert.equal(data["@context"], "https://schema.org");
      assert.ok(Array.isArray(data["@graph"]));
      assert.equal(data["@graph"].length, 2);

      const website = data["@graph"].find((item) => item["@type"] === "WebSite");
      assert.ok(website);
      assert.equal(website.name, "Print Ready Designs");
      assert.equal(website.url, officialDomain);
      assert.equal(website["@id"], `${officialDomain}/#website`);

      const org = data["@graph"].find((item) => item["@type"] === "Organization");
      assert.ok(org);
      assert.equal(org.name, "Print Ready Designs");
      assert.equal(org.url, officialDomain);
      assert.equal(org.logo.url, `${officialDomain}/tab_logo1.png`);
    });
  });

  describe("5. Performance & Resource Loading Optimization", () => {
    test("RootLayout includes font preconnect links in <head>", () => {
      const layoutPath = path.resolve(process.cwd(), "src/app/layout.tsx");
      const content = fs.readFileSync(layoutPath, "utf8");
      assert.ok(content.includes('<link rel="preconnect" href="https://fonts.googleapis.com" />'));
      assert.ok(content.includes('<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />'));
    });

    test("RootLayout includes themeInitScript to prevent FOUC / CLS", () => {
      const layoutPath = path.resolve(process.cwd(), "src/app/layout.tsx");
      const content = fs.readFileSync(layoutPath, "utf8");
      assert.ok(content.includes("themeInitScript"));
      assert.ok(content.includes("dangerouslySetInnerHTML={{ __html: themeInitScript }}"));
    });

    test("HTML root element specifies lang='en'", () => {
      const layoutPath = path.resolve(process.cwd(), "src/app/layout.tsx");
      const content = fs.readFileSync(layoutPath, "utf8");
      assert.ok(content.includes('<html lang="en"'));
    });
  });
});
