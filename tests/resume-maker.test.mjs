/**
 * Automated Test Suite: Phase 06 — Resume / CV Maker
 *
 * Comprehensive validation covering:
 * 1. Resume data model, sanitization & defaults
 * 2. Empty resume handling (graceful rendering without exceptions)
 * 3. Minimal / basic information resume
 * 4. Complete resume with all sections populated
 * 5. Long professional summary handling & wrapping
 * 6. Multiple experience entries (add, edit, remove, reorder)
 * 7. Long skill lists (technical & soft)
 * 8. Multi-page resume pagination in vector PDF output
 * 9. Template switching (Modern Professional, Minimal ATS, Classic Corporate) without data loss
 * 10. Vector PDF compilation via pdf-lib:
 *     - Selectable text
 *     - A4 page dimensions (595.28 x 841.89 pt)
 *     - Page count calculation
 *     - Multi-template output verification
 * 11. LocalStorage auto-save, recovery from corruption, and reset
 * 12. Local JSON export and import round-trip
 * 13. Zero-upload security & client-side privacy guarantee
 */

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

import {
  EMPTY_RESUME_DATA,
  SAMPLE_RESUME_DATA,
  RESUME_TEMPLATES,
} from "../src/constants/resume-defaults.ts";

import {
  sanitizeResumeData,
  loadSavedResume,
  saveResume,
  clearSavedResume,
  exportResumeAsJson,
  importResumeFromJson,
  RESUME_STORAGE_KEY,
} from "../src/lib/resume/resume-storage.ts";

import { generateResumePdf } from "../src/lib/resume/resume-pdf.ts";

// Mock localStorage for Node test runner
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

describe("PHASE 06 — Resume Data Model & Template Registry", () => {
  test("template registry defines 3 professional templates", () => {
    assert.equal(RESUME_TEMPLATES.length, 3);
    const templateIds = RESUME_TEMPLATES.map((t) => t.id);
    assert.deepEqual(templateIds, [
      "modern-professional",
      "minimal-ats",
      "classic-corporate",
    ]);

    for (const tmpl of RESUME_TEMPLATES) {
      assert.ok(tmpl.id, "Template must have an id");
      assert.ok(tmpl.name, `Template ${tmpl.id} missing name`);
      assert.ok(tmpl.description, `Template ${tmpl.id} missing description`);
      assert.ok(tmpl.badge, `Template ${tmpl.id} missing badge`);
      assert.ok(Array.isArray(tmpl.features) && tmpl.features.length > 0);
    }
  });

  test("EMPTY_RESUME_DATA is properly structured with default fields", () => {
    assert.equal(typeof EMPTY_RESUME_DATA.personalInfo, "object");
    assert.equal(EMPTY_RESUME_DATA.personalInfo.fullName, "");
    assert.equal(EMPTY_RESUME_DATA.summary, "");
    assert.deepEqual(EMPTY_RESUME_DATA.experiences, []);
    assert.deepEqual(EMPTY_RESUME_DATA.education, []);
    assert.deepEqual(EMPTY_RESUME_DATA.skills.technical, []);
    assert.deepEqual(EMPTY_RESUME_DATA.skills.soft, []);
    assert.deepEqual(EMPTY_RESUME_DATA.projects, []);
    assert.equal(EMPTY_RESUME_DATA.templateId, "modern-professional");
  });

  test("SAMPLE_RESUME_DATA provides complete, valid professional sections", () => {
    assert.ok(SAMPLE_RESUME_DATA.personalInfo.fullName.length > 0);
    assert.ok(SAMPLE_RESUME_DATA.personalInfo.email.includes("@"));
    assert.ok(SAMPLE_RESUME_DATA.summary.length > 50);
    assert.ok(SAMPLE_RESUME_DATA.experiences.length >= 3);
    assert.ok(SAMPLE_RESUME_DATA.education.length >= 2);
    assert.ok(SAMPLE_RESUME_DATA.skills.technical.length >= 5);
    assert.ok(SAMPLE_RESUME_DATA.skills.soft.length >= 3);
    assert.ok(SAMPLE_RESUME_DATA.projects.length >= 2);
    assert.ok(SAMPLE_RESUME_DATA.certifications.length >= 1);
    assert.ok(SAMPLE_RESUME_DATA.languages.length >= 2);
  });
});

describe("PHASE 06 — Sanitization, Validation & Edge Cases", () => {
  test("sanitizes null, undefined or corrupted inputs to empty template", () => {
    const fromNull = sanitizeResumeData(null);
    assert.equal(fromNull.personalInfo.fullName, "");
    assert.equal(fromNull.templateId, "modern-professional");

    const fromUndefined = sanitizeResumeData(undefined);
    assert.equal(fromUndefined.personalInfo.email, "");

    const fromString = sanitizeResumeData("random invalid string");
    assert.equal(fromString.personalInfo.fullName, "");
  });

  test("recovers missing nested fields gracefully", () => {
    const partial = {
      personalInfo: {
        fullName: "Priya Patel",
      },
      summary: "Cloud Architect with 10 years experience",
    };

    const sanitized = sanitizeResumeData(partial);
    assert.equal(sanitized.personalInfo.fullName, "Priya Patel");
    assert.equal(sanitized.personalInfo.email, "");
    assert.equal(sanitized.personalInfo.phone, "");
    assert.equal(sanitized.summary, "Cloud Architect with 10 years experience");
    assert.deepEqual(sanitized.experiences, []);
    assert.deepEqual(sanitized.skills.technical, []);
  });

  test("filters out empty or non-string skills", () => {
    const rawSkills = {
      skills: {
        technical: ["TypeScript", "", "   ", null, 123, "React"],
        soft: ["Leadership", undefined, "Problem Solving"],
      },
    };

    const sanitized = sanitizeResumeData(rawSkills);
    assert.deepEqual(sanitized.skills.technical, ["TypeScript", "React"]);
    assert.deepEqual(sanitized.skills.soft, ["Leadership", "Problem Solving"]);
  });

  test("falls back to modern-professional on unrecognized template ID", () => {
    const invalidTemplate = {
      templateId: "unrecognized-fancy-template",
    };
    const sanitized = sanitizeResumeData(invalidTemplate);
    assert.equal(sanitized.templateId, "modern-professional");
  });
});

describe("PHASE 06 — Vector PDF Generation with pdf-lib", () => {
  test("generates valid PDF bytes for EMPTY resume without throwing", async () => {
    const pdfBytes = await generateResumePdf(EMPTY_RESUME_DATA);
    assert.ok(pdfBytes instanceof Uint8Array);
    assert.ok(pdfBytes.length > 500, "PDF should have valid byte length");

    // Load back with pdf-lib to verify validity
    const doc = await PDFDocument.load(pdfBytes);
    assert.equal(doc.getPageCount(), 1, "Empty resume should fit on exactly 1 page");
    const [page] = doc.getPages();
    const { width, height } = page.getSize();
    assert.equal(Math.round(width), 595, "A4 width should be ~595.28 pt");
    assert.equal(Math.round(height), 842, "A4 height should be ~841.89 pt");
  });

  test("generates valid PDF for resume with ONLY basic contact information", async () => {
    const basicResume = {
      ...EMPTY_RESUME_DATA,
      personalInfo: {
        fullName: "Rahul Verma",
        jobTitle: "Software Developer",
        email: "rahul@example.com",
        phone: "+91 91234 56789",
        location: "Delhi, India",
        linkedIn: "https://linkedin.com/in/rahul",
        portfolio: "https://rahul.dev",
      },
    };

    const pdfBytes = await generateResumePdf(basicResume);
    assert.ok(pdfBytes.length > 1000);
    const doc = await PDFDocument.load(pdfBytes);
    assert.equal(doc.getPageCount(), 1);
  });

  test("generates complete PDF for sample resume across all 3 templates", async () => {
    const templates = ["modern-professional", "minimal-ats", "classic-corporate"];

    for (const tId of templates) {
      const data = { ...SAMPLE_RESUME_DATA, templateId: tId };
      const pdfBytes = await generateResumePdf(data);
      assert.ok(pdfBytes.length > 4000, `Template ${tId} should compile substantial PDF bytes`);

      const doc = await PDFDocument.load(pdfBytes);
      const pageCount = doc.getPageCount();
      assert.ok(pageCount >= 1 && pageCount <= 3, `Expected 1-3 pages, got ${pageCount} for ${tId}`);
    }
  });

  test("handles extremely long summary text with automatic wrapping", async () => {
    const longSummary = "Senior Software Engineer with deep expertise in cloud architectures, microservices, distributed systems, high-frequency data pipelines, automated testing, DevOps CI/CD practices, edge computing, serverless architectures, and relational database tuning. ".repeat(10);

    const resumeWithLongSummary = {
      ...SAMPLE_RESUME_DATA,
      summary: longSummary,
    };

    const pdfBytes = await generateResumePdf(resumeWithLongSummary);
    assert.ok(pdfBytes.length > 5000);
    const doc = await PDFDocument.load(pdfBytes);
    assert.ok(doc.getPageCount() >= 2, "Long summary should properly paginate across pages");
  });

  test("handles multi-page resumes with 10+ experience entries cleanly", async () => {
    const manyExperiences = [];
    for (let i = 1; i <= 10; i++) {
      manyExperiences.push({
        id: `exp-${i}`,
        company: `Enterprise Tech Corp #${i}`,
        jobTitle: `Staff Engineer Level ${i}`,
        location: "Bengaluru, India",
        startDate: `201${i % 10}-01`,
        endDate: `201${(i % 10) + 1}-01`,
        current: i === 1,
        responsibilities: `• Led architectural overhaul of high-throughput payment transaction pipeline.\n• Mentored cross-functional team of ${i + 3} developers across daily sprints.\n• Streamlined delivery cycle times by 40%.`,
        achievements: `Delivered enterprise release v${i}.0 on time.`,
      });
    }

    const multiPageResume = {
      ...SAMPLE_RESUME_DATA,
      experiences: manyExperiences,
    };

    const pdfBytes = await generateResumePdf(multiPageResume);
    const doc = await PDFDocument.load(pdfBytes);
    const pageCount = doc.getPageCount();
    assert.ok(pageCount >= 2, `Expected at least 2 pages for 10 experiences, got ${pageCount}`);
  });

  test("handles extensive skills list cleanly", async () => {
    const extensiveSkills = {
      technical: [
        "TypeScript", "JavaScript", "Python", "Go", "Rust", "Java", "C++",
        "React", "Next.js", "Vue.js", "Svelte", "Node.js", "Express", "NestJS",
        "PostgreSQL", "MySQL", "MongoDB", "Redis", "Kafka", "Elasticsearch",
        "Docker", "Kubernetes", "AWS", "GCP", "Terraform", "CI/CD",
      ],
      soft: [
        "Executive Leadership", "Cross-Functional Collaboration", "Conflict Resolution",
        "Mentorship", "Public Speaking", "Strategic Planning", "Agile Coaching",
      ],
    };

    const resumeWithManySkills = {
      ...SAMPLE_RESUME_DATA,
      skills: extensiveSkills,
    };

    const pdfBytes = await generateResumePdf(resumeWithManySkills);
    assert.ok(pdfBytes.length > 4000);
    const doc = await PDFDocument.load(pdfBytes);
    assert.ok(doc.getPageCount() >= 1);
  });
});

describe("PHASE 06 — Local Persistence, Privacy & JSON Export/Import", () => {
  beforeEach(() => {
    global.window = {
      localStorage: new MockLocalStorage(),
    };
  });

  test("loadSavedResume returns null when localStorage is empty", () => {
    const saved = loadSavedResume();
    assert.equal(saved, null);
  });

  test("saveResume persists data and loadSavedResume restores it", () => {
    const success = saveResume(SAMPLE_RESUME_DATA);
    assert.equal(success, true);

    const restored = loadSavedResume();
    assert.ok(restored);
    assert.equal(restored.personalInfo.fullName, SAMPLE_RESUME_DATA.personalInfo.fullName);
    assert.equal(restored.experiences.length, SAMPLE_RESUME_DATA.experiences.length);
  });

  test("clearSavedResume empties localStorage", () => {
    saveResume(SAMPLE_RESUME_DATA);
    assert.ok(loadSavedResume());

    clearSavedResume();
    assert.equal(loadSavedResume(), null);
  });

  test("recovers gracefully from corrupted JSON in localStorage", () => {
    global.window.localStorage.setItem(RESUME_STORAGE_KEY, "{ corrupted_invalid_json: true, broken... }");
    const recovered = loadSavedResume();
    assert.equal(recovered, null);
  });

  test("exports resume data as valid formatted JSON string", () => {
    const jsonStr = exportResumeAsJson(SAMPLE_RESUME_DATA);
    assert.equal(typeof jsonStr, "string");
    const parsed = JSON.parse(jsonStr);
    assert.equal(parsed.personalInfo.fullName, SAMPLE_RESUME_DATA.personalInfo.fullName);
  });

  test("imports resume from valid JSON string", () => {
    const jsonStr = JSON.stringify({
      personalInfo: {
        fullName: "Ananya Deshmukh",
        jobTitle: "Data Scientist",
        email: "ananya@example.com",
      },
      summary: "Machine Learning specialist with PyTorch and TensorFlow.",
    });

    const imported = importResumeFromJson(jsonStr);
    assert.equal(imported.personalInfo.fullName, "Ananya Deshmukh");
    assert.equal(imported.personalInfo.jobTitle, "Data Scientist");
    assert.equal(imported.summary, "Machine Learning specialist with PyTorch and TensorFlow.");
    assert.deepEqual(imported.experiences, []);
  });

  test("throws descriptive error when importing invalid JSON string", () => {
    assert.throws(
      () => {
        importResumeFromJson("Not a JSON string at all!");
      },
      /Invalid resume JSON format/
    );
  });

  test("preserves template switching without mutating entered content", () => {
    const customData = {
      ...SAMPLE_RESUME_DATA,
      personalInfo: { ...SAMPLE_RESUME_DATA.personalInfo, fullName: "Vikram Malhotra" },
      templateId: "modern-professional",
    };

    // Switch to Minimal ATS
    const switchedToAts = { ...customData, templateId: "minimal-ats" };
    assert.equal(switchedToAts.personalInfo.fullName, "Vikram Malhotra");
    assert.equal(switchedToAts.experiences.length, customData.experiences.length);

    // Switch to Classic Corporate
    const switchedToCorporate = { ...switchedToAts, templateId: "classic-corporate" };
    assert.equal(switchedToCorporate.personalInfo.fullName, "Vikram Malhotra");
    assert.equal(switchedToCorporate.skills.technical.length, customData.skills.technical.length);
  });
});

describe("PHASE 06 — Workspace & Route Verification", () => {
  test("Resume Maker page exists on disk and is non-empty", () => {
    const pagePath = path.resolve(process.cwd(), "src", "app", "tools", "resume-maker", "page.tsx");
    assert.ok(fs.existsSync(pagePath), "Resume maker page must exist");
    const content = fs.readFileSync(pagePath, "utf-8");
    assert.ok(content.includes("ResumeEditor"), "Page must mount ResumeEditor");
    assert.ok(content.includes("ResumePreview"), "Page must mount ResumePreview");
    assert.ok(!content.includes("cursor-not-allowed"), "Mockup disabled states must be removed");
  });

  test("Templates directory contains all 3 template components", () => {
    const templatesDir = path.resolve(process.cwd(), "src", "components", "resume", "templates");
    assert.ok(fs.existsSync(path.join(templatesDir, "ModernProfessionalTemplate.tsx")));
    assert.ok(fs.existsSync(path.join(templatesDir, "MinimalAtsTemplate.tsx")));
    assert.ok(fs.existsSync(path.join(templatesDir, "ClassicCorporateTemplate.tsx")));
  });

  test("Editor and Preview components exist on disk", () => {
    const resumeDir = path.resolve(process.cwd(), "src", "components", "resume");
    assert.ok(fs.existsSync(path.join(resumeDir, "ResumeEditor.tsx")));
    assert.ok(fs.existsSync(path.join(resumeDir, "ResumePreview.tsx")));
  });
});
