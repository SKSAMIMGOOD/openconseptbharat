import { describe, test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import nextConfig from "../next.config.mjs";
import {
  PRIVACY_GUARANTEES,
  TOOL_PRIVACY_MATRIX,
  THIRD_PARTY_DISCLOSURES,
} from "../src/constants/privacy.ts";

describe("Phase 5: Privacy, Security & Trust Optimization Test Suite", () => {
  // 1. HTTP Security Headers
  describe("1. HTTP Security Headers in next.config.mjs", () => {
    test("defines async headers() configuration", async () => {
      assert.strictEqual(typeof nextConfig.headers, "function");
      const headersList = await nextConfig.headers();
      assert.ok(Array.isArray(headersList) && headersList.length > 0);
    });

    test("configures essential security headers on /:path*", async () => {
      const headersList = await nextConfig.headers();
      const globalHeader = headersList.find((h) => h.source === "/:path*");
      assert.ok(globalHeader, "Must define headers for /:path*");

      const headerMap = new Map(globalHeader.headers.map((h) => [h.key, h.value]));
      assert.strictEqual(headerMap.get("X-Frame-Options"), "SAMEORIGIN");
      assert.strictEqual(headerMap.get("X-Content-Type-Options"), "nosniff");
      assert.strictEqual(headerMap.get("Referrer-Policy"), "strict-origin-when-cross-origin");
      assert.ok(headerMap.get("Permissions-Policy")?.includes("camera=()"));
      assert.ok(headerMap.get("Permissions-Policy")?.includes("microphone=()"));
      assert.ok(headerMap.get("Permissions-Policy")?.includes("geolocation=()"));
    });
  });

  // 2. Legal & Trust Page Brand Consistency
  describe("2. Legal & Trust Page Brand Consistency", () => {
    const pagesToCheck = [
      { file: "src/app/privacy/page.tsx", name: "Privacy Policy" },
      { file: "src/app/terms/page.tsx", name: "Terms of Use" },
      { file: "src/app/about/page.tsx", name: "About Page" },
      { file: "src/app/contact/page.tsx", name: "Contact Page" },
      { file: "src/components/dashboard/PrivacyHighlights.tsx", name: "Privacy Highlights" },
      { file: "src/components/support/SupportButton.tsx", name: "Support Button" },
    ];

    for (const { file, name } of pagesToCheck) {
      test(`${name} (${file}) uses 'Print Ready Designs' and zero legacy brand mentions`, () => {
        const fullPath = path.resolve(process.cwd(), file);
        assert.ok(fs.existsSync(fullPath), `${file} must exist`);
        const content = fs.readFileSync(fullPath, "utf-8");

        assert.ok(
          content.includes("Print Ready Designs"),
          `${file} must reference the official brand 'Print Ready Designs'`
        );
        assert.ok(
          !content.includes("Browser Utility Studio"),
          `${file} must not contain legacy brand 'Browser Utility Studio'`
        );
        assert.ok(
          !content.includes("browserutilitystudio.com"),
          `${file} must not contain legacy domain 'browserutilitystudio.com'`
        );
      });
    }
  });

  // 3. Privacy Specifications & Tool Matrix
  describe("3. Privacy Specifications & Tool-by-Tool Matrix", () => {
    test("PRIVACY_GUARANTEES covers 6 core architectural principles", () => {
      assert.ok(PRIVACY_GUARANTEES.length >= 6);
      const titles = PRIVACY_GUARANTEES.map((g) => g.title);
      assert.ok(titles.some((t) => t.includes("Zero Document Uploads")));
      assert.ok(titles.some((t) => t.includes("No Cloud Storage")));
      assert.ok(titles.some((t) => t.includes("Ephemeral Document Memory")));
      assert.ok(titles.some((t) => t.includes("Zero Behavioral Trackers")));
      assert.ok(titles.some((t) => t.includes("Client-Side WebAssembly")));
      assert.ok(titles.some((t) => t.includes("Transparent Local Storage")));
    });

    test("TOOL_PRIVACY_MATRIX covers all 10 tools with zero upload verification", () => {
      assert.strictEqual(TOOL_PRIVACY_MATRIX.length, 10);
      const expectedIds = [
        "aadhaar-card-crop",
        "pan-card-crop",
        "ration-card-crop",
        "document-studio",
        "photo-studio",
        "multiple-photo-maker",
        "document-straightener",
        "photo-editor",
        "background-remover",
        "resume-maker",
      ];

      for (const expectedId of expectedIds) {
        const tool = TOOL_PRIVACY_MATRIX.find((t) => t.id === expectedId);
        assert.ok(tool, `Tool ${expectedId} must exist in TOOL_PRIVACY_MATRIX`);
        assert.ok(
          tool.networkTransmission.includes("0") || tool.networkTransmission.includes("Zero"),
          `${expectedId} networkTransmission must state zero file uploads`
        );
        assert.ok(tool.supportedFormats.length > 0, `${expectedId} must declare supported formats`);
        assert.ok(tool.maxFileSize.length > 0, `${expectedId} must declare file size limits`);
      }
    });

    test("THIRD_PARTY_DISCLOSURES specifies Google Fonts and Hugging Face static assets", () => {
      assert.ok(THIRD_PARTY_DISCLOSURES.length >= 2);
      const services = THIRD_PARTY_DISCLOSURES.map((d) => d.service);
      assert.ok(services.some((s) => s.includes("Google Fonts")));
      assert.ok(services.some((s) => s.includes("Hugging Face")));
    });
  });

  // 4. Tool-Page Trust Signals & Links
  describe("4. Tool-Page Trust Signals & Navigation", () => {
    test("ToolSeoSection component implements client-side trust card linking to privacy & terms", () => {
      const seoSectionPath = path.resolve(process.cwd(), "src/components/seo/ToolSeoSection.tsx");
      const content = fs.readFileSync(seoSectionPath, "utf-8");

      assert.ok(
        content.includes("100% Client-Side Privacy & Security Guarantee"),
        "Must render trust card heading"
      );
      assert.ok(content.includes('href="/privacy"'), "Must link to /privacy");
      assert.ok(content.includes('href="/terms"'), "Must link to /terms");
      assert.ok(content.includes("Zero Server Uploads"), "Must highlight zero server uploads");
      assert.ok(content.includes("Ephemeral In-Memory Lifecycle"), "Must highlight ephemeral lifecycle");
    });
  });

  // 5. Zero Sensitive Data Exposure & Backend Isolation
  describe("5. Zero Sensitive Data Exposure & Backend Isolation", () => {
    test("confirms absence of backend API routes (zero /api endpoints)", () => {
      const apiPath = path.resolve(process.cwd(), "src/app/api");
      assert.ok(!fs.existsSync(apiPath), "src/app/api must not exist");
    });

    test("confirms zero console.log statements across src/", () => {
      const srcDir = path.resolve(process.cwd(), "src");
      function checkDir(dir) {
        const files = fs.readdirSync(dir);
        for (const f of files) {
          const fullPath = path.join(dir, f);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            checkDir(fullPath);
          } else if (/\.(ts|tsx|js|mjs)$/.test(f)) {
            const content = fs.readFileSync(fullPath, "utf-8");
            // Match console.log (exclude commented lines if any)
            const lines = content.split("\n");
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim();
              if (line.startsWith("//") || line.startsWith("*")) continue;
              assert.ok(
                !line.includes("console.log("),
                `Found console.log in ${fullPath}:${i + 1}`
              );
            }
          }
        }
      }
      checkDir(srcDir);
    });

    test("confirms zero third-party tracker scripts in root layout", () => {
      const layoutPath = path.resolve(process.cwd(), "src/app/layout.tsx");
      const content = fs.readFileSync(layoutPath, "utf-8");

      assert.ok(!content.includes("googletagmanager.com"), "No Google Tag Manager");
      assert.ok(!content.includes("google-analytics.com"), "No Google Analytics");
      assert.ok(!content.includes("connect.facebook.net"), "No Facebook Pixel");
      assert.ok(!content.includes("hotjar.com"), "No Hotjar");
    });
  });
});
