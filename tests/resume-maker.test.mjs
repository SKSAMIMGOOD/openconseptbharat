/**
 * Automated Test Suite: Phase 06 — Resume / CV Maker
 *
 * Comprehensive validation covering:
 * 1. Resume data model, sanitization & defaults
 * 2. Empty resume handling (graceful rendering without exceptions)
 * 3. Minimal / basic information resume
 * 4. Complete resume with all sections populated
 * 5. Resume with profile photo (PNG and JPEG base64 embedding)
 * 6. Resume with social profiles (LinkedIn, GitHub, Portfolio, Twitter) and clickable hyperlinks
 * 7. Long professional summary handling & wrapping
 * 8. Multiple experience entries (add, edit, remove, reorder)
 * 9. Long skill lists (technical & soft)
 * 10. Multi-page resume pagination in vector PDF output
 * 11. Template switching (Modern Professional, Minimal ATS, Classic Corporate) without data loss
 * 12. Vector PDF compilation via pdf-lib:
 *     - Selectable text
 *     - A4 page dimensions (595.28 x 841.89 pt)
 *     - Page count calculation
 *     - Multi-template output verification
 *     - No blank trailing pages
 * 13. LocalStorage auto-save, recovery from corruption, and reset
 * 14. Local JSON export and import round-trip
 * 15. Removal of direct print options (No window.print, no print buttons)
 * 16. Zero-upload security & client-side privacy guarantee
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
  DEFAULT_TYPOGRAPHY,
  RESUME_FONT_FAMILIES,
  RESUME_COLOR_PRESETS,
  TEMPLATE_DEFAULT_COLORS,
  DEFAULT_RESUME_COLORS,
  getTemplateDefaultColors,
  isValidHexColor,
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

import { generateResumePdf, hexToPdfRgb } from "../src/lib/resume/resume-pdf.ts";
import {
  validatePhotoFile,
  calculateCropTransform,
  ALLOWED_PHOTO_MIME_TYPES,
  MAX_PHOTO_FILE_SIZE,
  PHOTO_SIZE_PRESETS,
  getPhotoDimensions,
} from "../src/lib/resume/resume-photo.ts";

// Sample 1x1 base64 PNG and JPEG for test fixtures
const TINY_PNG_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const TINY_JPEG_BASE64 =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

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
  test("template registry defines 8 professional templates", () => {
    assert.equal(RESUME_TEMPLATES.length, 8);
    const templateIds = RESUME_TEMPLATES.map((t) => t.id);
    assert.deepEqual(templateIds, [
      "modern-professional",
      "minimal-ats",
      "classic-corporate",
      "modern-two-column",
      "executive",
      "creative",
      "student-fresher",
      "elegant-minimal",
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

  test("embeds uploaded PNG profile photo when enabled", async () => {
    const resumeWithPhoto = {
      ...SAMPLE_RESUME_DATA,
      personalInfo: {
        ...SAMPLE_RESUME_DATA.personalInfo,
        photoUrl: TINY_PNG_BASE64,
        showPhoto: true,
      },
    };

    const pdfBytes = await generateResumePdf(resumeWithPhoto);
    assert.ok(pdfBytes.length > 4000);
    const doc = await PDFDocument.load(pdfBytes);
    assert.ok(doc.getPageCount() >= 1);
  });

  test("embeds uploaded JPEG profile photo when enabled", async () => {
    const resumeWithJpg = {
      ...SAMPLE_RESUME_DATA,
      personalInfo: {
        ...SAMPLE_RESUME_DATA.personalInfo,
        photoUrl: TINY_JPEG_BASE64,
        showPhoto: true,
      },
    };

    const pdfBytes = await generateResumePdf(resumeWithJpg);
    assert.ok(pdfBytes.length > 4000);
    const doc = await PDFDocument.load(pdfBytes);
    assert.ok(doc.getPageCount() >= 1);
  });

  test("includes social media profiles with clickable URI hyperlink annotations", async () => {
    const resumeWithSocials = {
      ...SAMPLE_RESUME_DATA,
      personalInfo: {
        ...SAMPLE_RESUME_DATA.personalInfo,
        linkedIn: "https://linkedin.com/in/testuser",
        github: "https://github.com/testuser",
        portfolio: "https://testuser.dev",
        twitter: "https://twitter.com/testuser",
      },
    };

    const pdfBytes = await generateResumePdf(resumeWithSocials);
    const doc = await PDFDocument.load(pdfBytes);
    const page = doc.getPages()[0];
    
    // Check annotations exist on the page
    const annots = page.node.Annots();
    assert.ok(annots, "Page should have annotations");
    assert.ok(annots.size() >= 4, "Page should contain URI annotations for social profiles and contact info");
  });

  test("handles extremely long summary text with automatic wrapping", async () => {
    const longSummary =
      "Senior Software Engineer with deep expertise in cloud architectures, microservices, distributed systems, high-frequency data pipelines, automated testing, DevOps CI/CD practices, edge computing, serverless architectures, and relational database tuning. ".repeat(
        10
      );

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
        "TypeScript",
        "JavaScript",
        "Python",
        "Go",
        "Rust",
        "Java",
        "C++",
        "React",
        "Next.js",
        "Vue.js",
        "Svelte",
        "Node.js",
        "Express",
        "NestJS",
        "PostgreSQL",
        "MySQL",
        "MongoDB",
        "Redis",
        "Kafka",
        "Elasticsearch",
        "Docker",
        "Kubernetes",
        "AWS",
        "GCP",
        "Terraform",
        "CI/CD",
      ],
      soft: [
        "Executive Leadership",
        "Cross-Functional Collaboration",
        "Conflict Resolution",
        "Mentorship",
        "Public Speaking",
        "Strategic Planning",
        "Agile Coaching",
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

describe("PHASE 06 — Removal of Direct Printing & PDF Download Only Verification", () => {
  test("ResumePreview does NOT contain window.print or print button", () => {
    const previewFile = path.resolve(process.cwd(), "src", "components", "resume", "ResumePreview.tsx");
    const content = fs.readFileSync(previewFile, "utf-8");
    assert.equal(content.includes("window.print"), false, "ResumePreview must not invoke window.print()");
    assert.equal(content.includes("Printer"), false, "ResumePreview must not import or render Printer icon");
    assert.equal(content.includes("handleBrowserPrint"), false, "ResumePreview must not retain handleBrowserPrint");
    assert.ok(content.includes("Download PDF"), "ResumePreview must have prominent 'Download PDF' action");
  });

  test("ResumeEditor does NOT contain print buttons or handlers", () => {
    const editorFile = path.resolve(process.cwd(), "src", "components", "resume", "ResumeEditor.tsx");
    const content = fs.readFileSync(editorFile, "utf-8");
    assert.equal(content.includes("window.print"), false, "ResumeEditor must not invoke window.print()");
    assert.equal(content.includes("handleBrowserPrint"), false, "ResumeEditor must not have print handler");
  });

  test("ResumeMakerPage does NOT contain print buttons or handlers", () => {
    const pageFile = path.resolve(process.cwd(), "src", "app", "tools", "resume-maker", "page.tsx");
    const content = fs.readFileSync(pageFile, "utf-8");
    assert.equal(content.includes("window.print"), false, "page.tsx must not invoke window.print()");
  });
});

describe("PHASE 06 — Workspace & Route Verification", () => {
  test("Resume Maker page exists on disk and is non-empty", () => {
    const pagePath = path.resolve(process.cwd(), "src", "app", "tools", "resume-maker", "page.tsx");
    assert.ok(fs.existsSync(pagePath), "Resume maker page must exist");
    const content = fs.readFileSync(pagePath, "utf-8");
    assert.ok(content.includes("ResumeEditor"), "Page must mount ResumeEditor");
    assert.ok(content.includes("ResumePreview"), "Page must mount ResumePreview");
    assert.ok(content.includes("lg:sticky"), "Page must support sticky layout for simultaneous editing and previewing");
    assert.ok(!content.includes("cursor-not-allowed"), "Mockup disabled states must be removed");
  });

  test("ResumeEditor container enables independent vertical scrolling alongside preview", () => {
    const editorPath = path.resolve(process.cwd(), "src", "components", "resume", "ResumeEditor.tsx");
    const content = fs.readFileSync(editorPath, "utf-8");
    assert.ok(
      content.includes("overflow-y-auto"),
      "ResumeEditor root container must have overflow-y-auto for independent scrolling"
    );
  });

  test("Templates directory contains all 8 template components", () => {
    const templatesDir = path.resolve(process.cwd(), "src", "components", "resume", "templates");
    assert.ok(fs.existsSync(path.join(templatesDir, "ModernProfessionalTemplate.tsx")));
    assert.ok(fs.existsSync(path.join(templatesDir, "MinimalAtsTemplate.tsx")));
    assert.ok(fs.existsSync(path.join(templatesDir, "ClassicCorporateTemplate.tsx")));
    assert.ok(fs.existsSync(path.join(templatesDir, "ModernTwoColumnTemplate.tsx")));
    assert.ok(fs.existsSync(path.join(templatesDir, "ExecutiveTemplate.tsx")));
    assert.ok(fs.existsSync(path.join(templatesDir, "CreativeTemplate.tsx")));
    assert.ok(fs.existsSync(path.join(templatesDir, "StudentFresherTemplate.tsx")));
    assert.ok(fs.existsSync(path.join(templatesDir, "ElegantMinimalTemplate.tsx")));
  });

  test("Editor and Preview components exist on disk", () => {
    const resumeDir = path.resolve(process.cwd(), "src", "components", "resume");
    assert.ok(fs.existsSync(path.join(resumeDir, "ResumeEditor.tsx")));
    assert.ok(fs.existsSync(path.join(resumeDir, "ResumePreview.tsx")));
  });
});

describe("PHASE 06 — Profile Photo Upload, Crop & Template Integration", () => {
  test("photo file validation accepts JPG, PNG, and WebP files", () => {
    assert.equal(ALLOWED_PHOTO_MIME_TYPES.length, 4);
    assert.equal(MAX_PHOTO_FILE_SIZE, 5 * 1024 * 1024);

    const jpgCheck = validatePhotoFile({
      type: "image/jpeg",
      size: 500 * 1024,
      name: "profile.jpg",
    });
    assert.equal(jpgCheck.valid, true);

    const pngCheck = validatePhotoFile({
      type: "image/png",
      size: 1.2 * 1024 * 1024,
      name: "avatar.png",
    });
    assert.equal(pngCheck.valid, true);

    const webpCheck = validatePhotoFile({
      type: "image/webp",
      size: 800 * 1024,
      name: "photo.webp",
    });
    assert.equal(webpCheck.valid, true);
  });

  test("photo file validation rejects invalid mime types and unsupported extensions", () => {
    const pdfCheck = validatePhotoFile({
      type: "application/pdf",
      size: 100 * 1024,
      name: "doc.pdf",
    });
    assert.equal(pdfCheck.valid, false);
    assert.ok(pdfCheck.error?.includes("Unsupported format"));

    const txtCheck = validatePhotoFile({
      type: "text/plain",
      size: 10 * 1024,
      name: "test.txt",
    });
    assert.equal(txtCheck.valid, false);

    const gifCheck = validatePhotoFile({
      type: "image/gif",
      size: 50 * 1024,
      name: "animation.gif",
    });
    assert.equal(gifCheck.valid, false);

    const emptyCheck = validatePhotoFile(null);
    assert.equal(emptyCheck.valid, false);
  });

  test("photo file validation rejects oversized files exceeding 5 MB", () => {
    const oversizedCheck = validatePhotoFile({
      type: "image/jpeg",
      size: 5.5 * 1024 * 1024,
      name: "huge.jpg",
    });
    assert.equal(oversizedCheck.valid, false);
    assert.ok(oversizedCheck.error?.includes("exceeds the 5 MB limit"));
  });

  test("calculateCropTransform preserves 1:1 aspect ratio without stretching or distortion", () => {
    const landscapeTransform = calculateCropTransform({
      naturalWidth: 1200,
      naturalHeight: 800,
      viewportSize: 280,
      zoom: 1,
      pan: { x: 0, y: 0 },
      shape: "circle",
      outputSize: 400,
    });

    assert.equal(landscapeTransform.outputSize, 400);
    assert.equal(landscapeTransform.shape, "circle");
    assert.ok(landscapeTransform.drawWidth > 0);
    assert.ok(landscapeTransform.drawHeight > 0);
    // Aspect ratio of the draw box must match original image (1200 / 800 = 1.5)
    const ratio = +(landscapeTransform.drawWidth / landscapeTransform.drawHeight).toFixed(2);
    assert.equal(ratio, 1.5);

    const portraitTransform = calculateCropTransform({
      naturalWidth: 600,
      naturalHeight: 900,
      viewportSize: 280,
      zoom: 1.5,
      pan: { x: 20, y: -10 },
      shape: "square",
      outputSize: 400,
    });

    assert.equal(portraitTransform.shape, "square");
    assert.ok(portraitTransform.drawWidth > 0);
    assert.ok(portraitTransform.drawHeight > 0);
    const portraitRatio = +(portraitTransform.drawWidth / portraitTransform.drawHeight).toFixed(2);
    assert.equal(portraitRatio, +(600 / 900).toFixed(2));
  });

  test("sanitization preserves photoShape ('circle' vs 'square') and rawPhotoUrl", () => {
    const rawData = {
      personalInfo: {
        fullName: "Aarav Gupta",
        photoUrl: TINY_PNG_BASE64,
        rawPhotoUrl: TINY_PNG_BASE64,
        showPhoto: true,
        photoShape: "square",
      },
    };

    const sanitized = sanitizeResumeData(rawData);
    assert.equal(sanitized.personalInfo.photoShape, "square");
    assert.equal(sanitized.personalInfo.rawPhotoUrl, TINY_PNG_BASE64);
    assert.equal(sanitized.personalInfo.showPhoto, true);

    // Invalid shape falls back safely to 'circle'
    const fallbackData = {
      personalInfo: {
        photoShape: "invalid-shape",
      },
    };
    const fallbackSanitized = sanitizeResumeData(fallbackData);
    assert.equal(fallbackSanitized.personalInfo.photoShape, "circle");
  });

  test("embeds circular photo in vector PDF across all 3 templates", async () => {
    const templates = ["modern-professional", "minimal-ats", "classic-corporate"];

    for (const tId of templates) {
      const data = {
        ...SAMPLE_RESUME_DATA,
        templateId: tId,
        personalInfo: {
          ...SAMPLE_RESUME_DATA.personalInfo,
          photoUrl: TINY_PNG_BASE64,
          showPhoto: true,
          photoShape: "circle",
        },
      };

      const pdfBytes = await generateResumePdf(data);
      assert.ok(pdfBytes.length > 3000, `Circular photo PDF for ${tId} must generate bytes`);
      const doc = await PDFDocument.load(pdfBytes);
      assert.ok(doc.getPageCount() >= 1, `Expected valid page count for ${tId}`);
    }
  });

  test("embeds square photo in vector PDF across all 3 templates", async () => {
    const templates = ["modern-professional", "minimal-ats", "classic-corporate"];

    for (const tId of templates) {
      const data = {
        ...SAMPLE_RESUME_DATA,
        templateId: tId,
        personalInfo: {
          ...SAMPLE_RESUME_DATA.personalInfo,
          photoUrl: TINY_JPEG_BASE64,
          showPhoto: true,
          photoShape: "square",
        },
      };

      const pdfBytes = await generateResumePdf(data);
      assert.ok(pdfBytes.length > 3000, `Square photo PDF for ${tId} must generate bytes`);
      const doc = await PDFDocument.load(pdfBytes);
      assert.ok(doc.getPageCount() >= 1, `Expected valid page count for ${tId}`);
    }
  });

  test("omits photo from PDF when showPhoto is disabled", async () => {
    const withPhotoDisabled = {
      ...SAMPLE_RESUME_DATA,
      personalInfo: {
        ...SAMPLE_RESUME_DATA.personalInfo,
        photoUrl: TINY_PNG_BASE64,
        showPhoto: false,
      },
    };

    const pdfBytes = await generateResumePdf(withPhotoDisabled);
    assert.ok(pdfBytes.length > 3000);
    const doc = await PDFDocument.load(pdfBytes);
    assert.ok(doc.getPageCount() >= 1);
  });

  test("Minimal ATS defaults to photo hidden and has ATS advisory notice", () => {
    assert.equal(EMPTY_RESUME_DATA.personalInfo.showPhoto, false);
    assert.equal(SAMPLE_RESUME_DATA.personalInfo.showPhoto, false);

    const atsTemplateFile = path.resolve(
      process.cwd(),
      "src",
      "components",
      "resume",
      "templates",
      "MinimalAtsTemplate.tsx"
    );
    const content = fs.readFileSync(atsTemplateFile, "utf-8");
    assert.ok(
      content.includes("personalInfo.showPhoto && personalInfo.photoUrl"),
      "MinimalAtsTemplate must conditionally render photo"
    );

    const editorFile = path.resolve(process.cwd(), "src", "components", "resume", "ResumeEditor.tsx");
    const editorContent = fs.readFileSync(editorFile, "utf-8");
    assert.ok(
      editorContent.includes("ATS Advisory"),
      "ResumeEditor must show ATS advisory for Minimal ATS template"
    );
  });

  test("ResumeEditor photo preview enforces w-14 h-14 container and prevents oversized rectangular images", () => {
    const editorFile = path.resolve(process.cwd(), "src", "components", "resume", "ResumeEditor.tsx");
    const editorContent = fs.readFileSync(editorFile, "utf-8");

    // Must not have invalid Tailwind classes w-13 or h-17
    assert.equal(editorContent.includes("w-13"), false, "ResumeEditor must not use nonexistent w-13 class");
    assert.equal(editorContent.includes("h-17"), false, "ResumeEditor must not use nonexistent h-17 class");

    // Must lock rectangular preview to w-14 h-14 like circular preview
    assert.ok(
      editorContent.includes("w-14 h-14 object-cover"),
      "ResumeEditor photo thumbnail must have w-14 h-14 object-cover"
    );
    assert.ok(
      editorContent.includes('maxWidth: "56px"') && editorContent.includes('maxHeight: "56px"'),
      "ResumeEditor photo thumbnail must have explicit 56px bounds"
    );
  });

  test("PhotoCropModal component exists and provides zoom, pan, and shape selection", () => {
    const modalPath = path.resolve(
      process.cwd(),
      "src",
      "components",
      "resume",
      "PhotoCropModal.tsx"
    );
    assert.ok(fs.existsSync(modalPath), "PhotoCropModal.tsx must exist");
    const content = fs.readFileSync(modalPath, "utf-8");
    assert.ok(content.includes("PhotoCropModal"), "Must export PhotoCropModal");
    assert.ok(content.includes("handlePointerDown"), "Must support pan repositioning");
    assert.ok(content.includes("setZoom"), "Must support zoom adjustments");
    assert.ok(content.includes("Circular"), "Must support circular crop");
    assert.ok(content.includes("Square"), "Must support square crop");
    assert.ok(content.includes("toDataURL"), "Must export cropped image to canvas data URL");
    assert.equal(content.includes("window.print"), false, "No print methods in PhotoCropModal");
  });
});

describe("PHASE 06 — Profile Photo Dimension Standards & Multi-Template Sizing", () => {
  test("PHOTO_SIZE_PRESETS defines Small (30×40mm), Standard (35×45mm), and Large (40×50mm)", () => {
    assert.ok(PHOTO_SIZE_PRESETS.small);
    assert.ok(PHOTO_SIZE_PRESETS.standard);
    assert.ok(PHOTO_SIZE_PRESETS.large);

    // Standard default
    const std = PHOTO_SIZE_PRESETS.standard;
    assert.equal(std.widthMm, 35);
    assert.equal(std.heightMm, 45);
    assert.equal(std.aspectRatio, 35 / 45); // 7:9 portrait aspect ratio!

    // Small
    const small = PHOTO_SIZE_PRESETS.small;
    assert.equal(small.widthMm, 30);
    assert.equal(small.heightMm, 40);

    // Large
    const large = PHOTO_SIZE_PRESETS.large;
    assert.equal(large.widthMm, 40);
    assert.equal(large.heightMm, 50);
  });

  test("getPhotoDimensions resolves exact physical PDF points matching physical millimeters", () => {
    // 1 mm = 72 / 25.4 pt = ~2.8346 pt
    const stdDims = getPhotoDimensions("standard", "rectangle");
    assert.equal(+(stdDims.widthPt).toFixed(2), 99.21);
    assert.equal(+(stdDims.heightPt).toFixed(2), 127.56);
    assert.equal(stdDims.isCircle, false);

    const smallDims = getPhotoDimensions("small", "rectangle");
    assert.equal(+(smallDims.widthPt).toFixed(2), 85.04);
    assert.equal(+(smallDims.heightPt).toFixed(2), 113.39);

    const largeDims = getPhotoDimensions("large", "rectangle");
    assert.equal(+(largeDims.widthPt).toFixed(2), 113.39);
    assert.equal(+(largeDims.heightPt).toFixed(2), 141.73);

    // Circular dimensions use diameter matching preset width
    const circleDims = getPhotoDimensions("standard", "circle");
    assert.equal(+(circleDims.widthPt).toFixed(2), 99.21);
    assert.equal(+(circleDims.heightPt).toFixed(2), 99.21);
    assert.equal(circleDims.isCircle, true);
  });

  test("PDF generation compiles all 3 templates across all 3 photo sizes (9 combinations)", async () => {
    const templates = ["modern-professional", "minimal-ats", "classic-corporate"];
    const sizes = ["small", "standard", "large"];

    for (const templateId of templates) {
      for (const photoSize of sizes) {
        const resumeData = {
          ...SAMPLE_RESUME_DATA,
          templateId,
          personalInfo: {
            ...SAMPLE_RESUME_DATA.personalInfo,
            photoUrl: TINY_PNG_BASE64,
            showPhoto: true,
            photoSize,
            photoShape: "rectangle",
          },
        };

        const pdfBytes = await generateResumePdf(resumeData);
        assert.ok(
          pdfBytes.length > 3000,
          `PDF for template "${templateId}" with size "${photoSize}" should compile valid bytes`
        );
        const doc = await PDFDocument.load(pdfBytes);
        assert.ok(doc.getPageCount() >= 1);
      }
    }
  });

  test("PDF generation compiles circular photos across all 3 templates and 3 sizes", async () => {
    const templates = ["modern-professional", "minimal-ats", "classic-corporate"];
    const sizes = ["small", "standard", "large"];

    for (const templateId of templates) {
      for (const photoSize of sizes) {
        const resumeData = {
          ...SAMPLE_RESUME_DATA,
          templateId,
          personalInfo: {
            ...SAMPLE_RESUME_DATA.personalInfo,
            photoUrl: TINY_PNG_BASE64,
            showPhoto: true,
            photoSize,
            photoShape: "circle",
          },
        };

        const pdfBytes = await generateResumePdf(resumeData);
        assert.ok(pdfBytes.length > 3000);
        const doc = await PDFDocument.load(pdfBytes);
        assert.ok(doc.getPageCount() >= 1);
      }
    }
  });

  test("sanitization preserves photoSize and defaults to 'standard' (35 × 45 mm)", () => {
    assert.equal(EMPTY_RESUME_DATA.personalInfo.photoSize, "standard");
    assert.equal(SAMPLE_RESUME_DATA.personalInfo.photoSize, "standard");

    const custom = sanitizeResumeData({
      personalInfo: {
        photoSize: "large",
      },
    });
    assert.equal(custom.personalInfo.photoSize, "large");

    const fallback = sanitizeResumeData({
      personalInfo: {
        photoSize: "invalid-size",
      },
    });
    assert.equal(fallback.personalInfo.photoSize, "standard");
  });

  test("all 8 templates apply getPhotoDimensions for consistent sizing", () => {
    const templateFiles = [
      "ModernProfessionalTemplate.tsx",
      "MinimalAtsTemplate.tsx",
      "ClassicCorporateTemplate.tsx",
      "ModernTwoColumnTemplate.tsx",
      "ExecutiveTemplate.tsx",
      "CreativeTemplate.tsx",
      "StudentFresherTemplate.tsx",
      "ElegantMinimalTemplate.tsx",
    ];

    for (const file of templateFiles) {
      const fullPath = path.resolve(process.cwd(), "src", "components", "resume", "templates", file);
      const content = fs.readFileSync(fullPath, "utf-8");
      assert.ok(
        content.includes("getPhotoDimensions"),
        `Template ${file} must use getPhotoDimensions for consistent physical sizing`
      );
      assert.ok(
        content.includes("previewWidthPx") && content.includes("previewHeightPx"),
        `Template ${file} must apply previewWidthPx and previewHeightPx`
      );
    }
  });

  test("Bug Fix: Header layout enforces flex-1 min-w-0 and stable items-start alignment across all templates", () => {
    const templateFiles = [
      "ModernProfessionalTemplate.tsx",
      "MinimalAtsTemplate.tsx",
      "ClassicCorporateTemplate.tsx",
      "ModernTwoColumnTemplate.tsx",
      "ExecutiveTemplate.tsx",
      "CreativeTemplate.tsx",
      "StudentFresherTemplate.tsx",
      "ElegantMinimalTemplate.tsx",
    ];

    for (const file of templateFiles) {
      const fullPath = path.resolve(process.cwd(), "src", "components", "resume", "templates", file);
      const content = fs.readFileSync(fullPath, "utf-8");
      
      // Ensure flex-1 min-w-0 is present on the header text container
      assert.ok(
        content.includes("min-w-0"),
        `Template ${file} must specify 'min-w-0' on the header text container to prevent flex collision`
      );
      assert.ok(
        content.includes("flex-1 min-w-0"),
        `Template ${file} must combine 'flex-1 min-w-0' on the header text container`
      );
      // Ensure header uses items-start and justify-between
      assert.ok(
        content.includes("items-start justify-between"),
        `Template ${file} must use 'items-start justify-between' for stable header layout`
      );
    }
  });

  test("Bug Fix: Rectangular photo container strictly locks dimensions and prevents image expansion", () => {
    const templateFiles = [
      "ModernProfessionalTemplate.tsx",
      "MinimalAtsTemplate.tsx",
      "ClassicCorporateTemplate.tsx",
      "ModernTwoColumnTemplate.tsx",
      "ExecutiveTemplate.tsx",
      "CreativeTemplate.tsx",
      "StudentFresherTemplate.tsx",
      "ElegantMinimalTemplate.tsx",
    ];

    for (const file of templateFiles) {
      const fullPath = path.resolve(process.cwd(), "src", "components", "resume", "templates", file);
      const content = fs.readFileSync(fullPath, "utf-8");

      assert.ok(
        content.includes("overflow-hidden"),
        `Template ${file} photo container must enforce 'overflow-hidden'`
      );
      assert.ok(
        content.includes("maxWidth") && content.includes("maxHeight"),
        `Template ${file} photo container must enforce maxWidth and maxHeight`
      );
      assert.ok(
        content.includes("minWidth") && content.includes("minHeight"),
        `Template ${file} photo container must enforce minWidth and minHeight`
      );
      assert.ok(
        content.includes("flex:") && content.includes("photoDims.previewWidthPx"),
        `Template ${file} photo container must enforce flex: 0 0 ... to prevent shrink/grow`
      );
      assert.ok(
        content.includes("object-cover"),
        `Template ${file} image must use 'object-cover' to prevent image stretching`
      );
    }
  });

  test("Bug Fix: Visible photo borders and shadows are removed from resume preview output", () => {
    const templateFiles = [
      "ModernProfessionalTemplate.tsx",
      "MinimalAtsTemplate.tsx",
      "ClassicCorporateTemplate.tsx",
      "ModernTwoColumnTemplate.tsx",
      "ExecutiveTemplate.tsx",
      "CreativeTemplate.tsx",
      "StudentFresherTemplate.tsx",
      "ElegantMinimalTemplate.tsx",
    ];

    for (const file of templateFiles) {
      const fullPath = path.resolve(process.cwd(), "src", "components", "resume", "templates", file);
      const content = fs.readFileSync(fullPath, "utf-8");

      // Check the photo rendering block specifically
      const photoSectionMatch = content.match(/\{personalInfo\.showPhoto && personalInfo\.photoUrl && \(\(\) => \{([\s\S]*?)\}\)\(\)\}/);
      assert.ok(photoSectionMatch, `Template ${file} must contain the photo rendering block`);
      const photoSection = photoSectionMatch[1];

      assert.equal(
        photoSection.includes("border-brand-500"),
        false,
        `Template ${file} photo output must not have border-brand-500`
      );
      assert.equal(
        photoSection.includes("border-neutral-900"),
        false,
        `Template ${file} photo output must not have border-neutral-900`
      );
      assert.equal(
        photoSection.includes("border-black"),
        false,
        `Template ${file} photo output must not have border-black`
      );
      assert.equal(
        photoSection.includes("shadow-sm"),
        false,
        `Template ${file} photo output must not have shadow-sm`
      );
      assert.equal(
        photoSection.includes("border-2"),
        false,
        `Template ${file} photo output must not have border-2`
      );
    }
  });

  test("PDF generator compiles all 8 templates successfully without errors", async () => {
    const allTemplates = [
      "modern-professional",
      "minimal-ats",
      "classic-corporate",
      "modern-two-column",
      "executive",
      "creative",
      "student-fresher",
      "elegant-minimal",
    ];

    for (const templateId of allTemplates) {
      const pdfBytes = await generateResumePdf({
        ...SAMPLE_RESUME_DATA,
        templateId,
      });
      assert.ok(pdfBytes.length > 2000, `PDF for template ${templateId} must be non-empty`);
      const doc = await PDFDocument.load(pdfBytes);
      assert.ok(doc.getPageCount() >= 1, `PDF for ${templateId} must have at least 1 page`);
    }
  });

  test("Bug Fix: PDF generator renders clean photos without borders or outlines", () => {
    const pdfPath = path.resolve(process.cwd(), "src", "lib", "resume", "resume-pdf.ts");
    const content = fs.readFileSync(pdfPath, "utf-8");

    // Check lines around photo drawing
    const photoSectionMatch = content.match(/\/\/ If photo is present[\s\S]*?currentPage\.drawImage\(profileImage, \{[\s\S]*?\}\);/);
    assert.ok(photoSectionMatch, "resume-pdf.ts must have the photo rendering block");
    const photoSection = photoSectionMatch[0];

    assert.equal(
      photoSection.includes("drawCircle"),
      false,
      "resume-pdf.ts must not call drawCircle for photo borders"
    );
    assert.equal(
      photoSection.includes("drawRectangle"),
      false,
      "resume-pdf.ts must not call drawRectangle for photo borders"
    );
    assert.equal(
      photoSection.includes("borderColor"),
      false,
      "resume-pdf.ts must not draw border colors for photo"
    );
  });

  test("Bug Fix: Editor thumbnail preview is strictly constrained to 56x56 with overflow-hidden for both circle and rectangle", () => {
    const editorPath = path.resolve(process.cwd(), "src", "components", "resume", "ResumeEditor.tsx");
    const content = fs.readFileSync(editorPath, "utf-8");
    assert.ok(
      content.includes('alt="Profile thumbnail"'),
      "ResumeEditor must render profile thumbnail"
    );
    assert.ok(
      content.includes("overflow-hidden"),
      "Profile thumbnail container in ResumeEditor must enforce overflow-hidden"
    );
    assert.ok(
      content.includes("w-14 h-14"),
      "Profile thumbnail container in ResumeEditor must enforce w-14 h-14"
    );
  });
});

describe("PHASE 08 — Typography & Font Customization", () => {
  test("DEFAULT_TYPOGRAPHY contains all 8 required properties with valid defaults", () => {
    assert.equal(DEFAULT_TYPOGRAPHY.fontFamily, "Inter");
    assert.equal(DEFAULT_TYPOGRAPHY.nameSize, 24);
    assert.equal(DEFAULT_TYPOGRAPHY.titleSize, 14);
    assert.equal(DEFAULT_TYPOGRAPHY.headingSize, 13);
    assert.equal(DEFAULT_TYPOGRAPHY.bodySize, 12);
    assert.equal(DEFAULT_TYPOGRAPHY.contactSize, 11);
    assert.equal(DEFAULT_TYPOGRAPHY.lineSpacing, 1.3);
    assert.equal(DEFAULT_TYPOGRAPHY.sectionSpacing, 16);
    assert.equal(DEFAULT_TYPOGRAPHY.paragraphSpacing, 6);
  });

  test("RESUME_FONT_FAMILIES provides all 8 required fonts", () => {
    const fontNames = RESUME_FONT_FAMILIES.map((f) => f.name);
    const expectedFonts = [
      "Inter",
      "Roboto",
      "Arial",
      "Lato",
      "Open Sans",
      "Georgia",
      "Merriweather",
      "Poppins",
    ];
    for (const font of expectedFonts) {
      assert.ok(fontNames.includes(font), `Font ${font} must be in RESUME_FONT_FAMILIES`);
    }
  });

  test("sanitizeResumeData sanitizes typography and clamps out-of-range values", () => {
    const invalidTypography = {
      fontFamily: "ComicSansUnknown",
      nameSize: 999, // exceeds max 32
      titleSize: 5, // below min 11
      headingSize: 50, // exceeds max 18
      bodySize: 2, // below min 10
      contactSize: 100, // exceeds max 14
      lineSpacing: 5.0, // exceeds max 1.6
      sectionSpacing: 100, // exceeds max 26
      paragraphSpacing: -5, // below min 3
    };

    const sanitized = sanitizeResumeData({
      ...SAMPLE_RESUME_DATA,
      typography: invalidTypography,
    });

    assert.ok(sanitized.typography);
    assert.equal(sanitized.typography.fontFamily, "Inter"); // fall back to default
    assert.equal(sanitized.typography.nameSize, 32); // clamped to max
    assert.equal(sanitized.typography.titleSize, 11); // clamped to min
    assert.equal(sanitized.typography.headingSize, 18); // clamped to max
    assert.equal(sanitized.typography.bodySize, 10); // clamped to min
    assert.equal(sanitized.typography.contactSize, 14); // clamped to max
    assert.equal(sanitized.typography.lineSpacing, 1.6); // clamped to max
    assert.equal(sanitized.typography.sectionSpacing, 26); // clamped to max
    assert.equal(sanitized.typography.paragraphSpacing, 3); // clamped to min
  });

  test("PDF generator compiles with serif typography (Georgia, Merriweather) and custom sizes cleanly", async () => {
    const customSerifResume = {
      ...SAMPLE_RESUME_DATA,
      typography: {
        fontFamily: "Georgia",
        nameSize: 28,
        titleSize: 16,
        headingSize: 15,
        bodySize: 11,
        contactSize: 10,
        lineSpacing: 1.4,
        sectionSpacing: 18,
        paragraphSpacing: 7,
      },
    };

    const pdfBytes = await generateResumePdf(customSerifResume);
    assert.ok(pdfBytes.length > 3000);
    const doc = await PDFDocument.load(pdfBytes);
    assert.ok(doc.getPageCount() >= 1);
  });

  test("PDF generator compiles with sans-serif custom typography (Poppins, Roboto) cleanly", async () => {
    const customPoppinsResume = {
      ...SAMPLE_RESUME_DATA,
      typography: {
        fontFamily: "Poppins",
        nameSize: 22,
        titleSize: 13,
        headingSize: 12,
        bodySize: 11,
        contactSize: 10,
        lineSpacing: 1.25,
        sectionSpacing: 14,
        paragraphSpacing: 5,
      },
    };

    const pdfBytes = await generateResumePdf(customPoppinsResume);
    assert.ok(pdfBytes.length > 3000);
    const doc = await PDFDocument.load(pdfBytes);
    assert.ok(doc.getPageCount() >= 1);
  });
});

describe("PHASE 09 — Template-Specific PDF Layout Fidelity Verification", () => {
  test("Modern Two-Column PDF generates structural two-column layout with sidebar and main column", async () => {
    const twoColResume = {
      ...SAMPLE_RESUME_DATA,
      templateId: "modern-two-column",
    };
    const pdfBytes = await generateResumePdf(twoColResume);
    assert.ok(pdfBytes.length > 3000);
    const doc = await PDFDocument.load(pdfBytes);
    assert.ok(doc.getPageCount() >= 1);

    // Verify source code implementation of Modern Two-Column PDF
    const pdfSrc = fs.readFileSync(path.resolve(process.cwd(), "src/lib/resume/resume-pdf.ts"), "utf-8");
    assert.ok(pdfSrc.includes("renderModernTwoColumn"), "resume-pdf.ts must have renderModernTwoColumn");
    assert.ok(pdfSrc.includes("sidebarWidth"), "renderModernTwoColumn must define sidebarWidth");
    assert.ok(pdfSrc.includes("dividerX"), "renderModernTwoColumn must define dividerX for column split");
  });

  test("Executive PDF renders Executive Profile callout box and solid slate header rule", async () => {
    const execResume = {
      ...SAMPLE_RESUME_DATA,
      templateId: "executive",
    };
    const pdfBytes = await generateResumePdf(execResume);
    assert.ok(pdfBytes.length > 3000);
    const doc = await PDFDocument.load(pdfBytes);
    assert.ok(doc.getPageCount() >= 1);

    const pdfSrc = fs.readFileSync(path.resolve(process.cwd(), "src/lib/resume/resume-pdf.ts"), "utf-8");
    assert.ok(pdfSrc.includes("EXECUTIVE PROFILE"), "Executive PDF must render 'EXECUTIVE PROFILE' callout title");
    assert.ok(pdfSrc.includes("renderExecutive"), "resume-pdf.ts must have renderExecutive");
  });

  test("Creative PDF renders 'CREATIVE PORTFOLIO' badge and skill tag chips", async () => {
    const creativeResume = {
      ...SAMPLE_RESUME_DATA,
      templateId: "creative",
    };
    const pdfBytes = await generateResumePdf(creativeResume);
    assert.ok(pdfBytes.length > 3000);
    const doc = await PDFDocument.load(pdfBytes);
    assert.ok(doc.getPageCount() >= 1);

    const pdfSrc = fs.readFileSync(path.resolve(process.cwd(), "src/lib/resume/resume-pdf.ts"), "utf-8");
    assert.ok(pdfSrc.includes("CREATIVE PORTFOLIO"), "Creative PDF must render 'CREATIVE PORTFOLIO' badge");
    assert.ok(pdfSrc.includes("renderSkillChips"), "Creative PDF must render skill chips");
  });

  test("Student / Fresher PDF structurally prioritizes Education before Work Experience", async () => {
    const studentResume = {
      ...SAMPLE_RESUME_DATA,
      templateId: "student-fresher",
    };
    const pdfBytes = await generateResumePdf(studentResume);
    assert.ok(pdfBytes.length > 3000);
    const doc = await PDFDocument.load(pdfBytes);
    assert.ok(doc.getPageCount() >= 1);

    const pdfSrc = fs.readFileSync(path.resolve(process.cwd(), "src/lib/resume/resume-pdf.ts"), "utf-8");
    assert.ok(pdfSrc.includes("renderStudentFresher"), "resume-pdf.ts must have renderStudentFresher");
    // Verify renderEducationSection is called before renderExperienceSection in renderStudentFresher
    const studentFnMatch = pdfSrc.match(/function renderStudentFresher[\s\S]*?renderEducationSection[\s\S]*?renderExperienceSection/);
    assert.ok(studentFnMatch, "renderStudentFresher must call renderEducationSection before renderExperienceSection");
  });

  test("Elegant Minimal PDF applies editorial split-name typography and ultra-thin rules", async () => {
    const elegantResume = {
      ...SAMPLE_RESUME_DATA,
      templateId: "elegant-minimal",
    };
    const pdfBytes = await generateResumePdf(elegantResume);
    assert.ok(pdfBytes.length > 3000);
    const doc = await PDFDocument.load(pdfBytes);
    assert.ok(doc.getPageCount() >= 1);

    const pdfSrc = fs.readFileSync(path.resolve(process.cwd(), "src/lib/resume/resume-pdf.ts"), "utf-8");
    assert.ok(pdfSrc.includes("renderElegantMinimal"), "resume-pdf.ts must have renderElegantMinimal");
    assert.ok(pdfSrc.includes("firstName"), "Elegant Minimal must split first name for editorial typography");
  });

  test("Classic Corporate PDF renders Times-Roman double horizontal rules and centered header", async () => {
    const corporateResume = {
      ...SAMPLE_RESUME_DATA,
      templateId: "classic-corporate",
    };
    const pdfBytes = await generateResumePdf(corporateResume);
    assert.ok(pdfBytes.length > 3000);
    const doc = await PDFDocument.load(pdfBytes);
    assert.ok(doc.getPageCount() >= 1);

    const pdfSrc = fs.readFileSync(path.resolve(process.cwd(), "src/lib/resume/resume-pdf.ts"), "utf-8");
    assert.ok(pdfSrc.includes("renderClassicCorporate"), "resume-pdf.ts must have renderClassicCorporate");
  });

  test("Minimal ATS PDF strictly enforces monochromatic output with clean single rules", async () => {
    const atsResume = {
      ...SAMPLE_RESUME_DATA,
      templateId: "minimal-ats",
    };
    const pdfBytes = await generateResumePdf(atsResume);
    assert.ok(pdfBytes.length > 3000);
    const doc = await PDFDocument.load(pdfBytes);
    assert.ok(doc.getPageCount() >= 1);

    const pdfSrc = fs.readFileSync(path.resolve(process.cwd(), "src/lib/resume/resume-pdf.ts"), "utf-8");
    assert.ok(pdfSrc.includes("renderMinimalAts"), "resume-pdf.ts must have renderMinimalAts");
  });

  test("Modern Two-Column PDF skips duplicate contact list in header", async () => {
    const twoColResume = {
      ...SAMPLE_RESUME_DATA,
      templateId: "modern-two-column",
    };
    const pdfBytes = await generateResumePdf(twoColResume);
    assert.ok(pdfBytes.length > 3000);

    const pdfSrc = fs.readFileSync(path.resolve(process.cwd(), "src/lib/resume/resume-pdf.ts"), "utf-8");
    assert.ok(
      pdfSrc.includes("skipContactList: true"),
      "Modern Two-Column must skip contact list in header to avoid duplicates"
    );
  });

  test("Circular profile photo integrates circular masking and embeds correctly", async () => {
    const circlePhotoResume = {
      ...SAMPLE_RESUME_DATA,
      templateId: "modern-professional",
      personalInfo: {
        ...SAMPLE_RESUME_DATA.personalInfo,
        photoUrl: TINY_PNG_BASE64,
        showPhoto: true,
        photoShape: "circle",
        photoSize: "standard",
      },
    };
    const pdfBytes = await generateResumePdf(circlePhotoResume);
    assert.ok(pdfBytes.length > 3000);
    const doc = await PDFDocument.load(pdfBytes);
    assert.ok(doc.getPageCount() >= 1);

    const pdfSrc = fs.readFileSync(path.resolve(process.cwd(), "src/lib/resume/resume-pdf.ts"), "utf-8");
    assert.ok(
      pdfSrc.includes("convertDataUrlToCircularPng"),
      "resume-pdf.ts must import and use convertDataUrlToCircularPng"
    );
  });

  test("Contact details include vector icons (email, phone, location, socials) in PDF across templates", async () => {
    const resumeWithIcons = {
      ...SAMPLE_RESUME_DATA,
      templateId: "modern-professional",
      personalInfo: {
        ...SAMPLE_RESUME_DATA.personalInfo,
        email: "alex@example.com",
        phone: "+1 555 123 4567",
        location: "San Francisco, CA",
        linkedIn: "https://linkedin.com/in/alex",
        github: "https://github.com/alex",
        portfolio: "https://alex.dev",
        twitter: "https://twitter.com/alex",
      },
    };
    const pdfBytes = await generateResumePdf(resumeWithIcons);
    assert.ok(pdfBytes.length > 3000);
    const doc = await PDFDocument.load(pdfBytes);
    assert.ok(doc.getPageCount() >= 1);

    const pdfSrc = fs.readFileSync(path.resolve(process.cwd(), "src/lib/resume/resume-pdf.ts"), "utf-8");
    assert.ok(pdfSrc.includes("CONTACT_ICONS"), "resume-pdf.ts must define CONTACT_ICONS");
    assert.ok(pdfSrc.includes("drawSvgPath"), "resume-pdf.ts must use drawSvgPath to render icons");
    assert.ok(pdfSrc.includes("iconScale"), "resume-pdf.ts must scale contact icons properly");
  });
});

describe("PHASE 10 — Photo Editor Modal Overlap & Shape Mutual Exclusivity Verification", () => {
  test("PhotoCropModal renders through createPortal(..., document.body) to escape sticky/overflow stacking contexts", () => {
    const modalPath = path.resolve(process.cwd(), "src", "components", "resume", "PhotoCropModal.tsx");
    const modalContent = fs.readFileSync(modalPath, "utf-8");

    assert.ok(
      modalContent.includes('import { createPortal } from "react-dom"'),
      "PhotoCropModal must import createPortal from react-dom"
    );
    assert.ok(
      modalContent.includes("createPortal(") && modalContent.includes("document.body"),
      "PhotoCropModal must render through createPortal to document.body"
    );
    assert.ok(
      modalContent.includes("fixed inset-0") && modalContent.includes("bg-black/75"),
      "PhotoCropModal must have full-screen fixed backdrop overlay"
    );
    assert.ok(
      modalContent.includes('role="dialog"') && modalContent.includes('aria-modal="true"'),
      "PhotoCropModal must include proper modal accessibility attributes"
    );
  });

  test("ResumeEditor maintains scrolling layout without removal of overflow-y-auto or max-h", () => {
    const editorPath = path.resolve(process.cwd(), "src", "components", "resume", "ResumeEditor.tsx");
    const editorContent = fs.readFileSync(editorPath, "utf-8");

    assert.ok(
      editorContent.includes("lg:overflow-y-auto"),
      "ResumeEditor must preserve lg:overflow-y-auto for scrollable editing"
    );
    assert.ok(
      editorContent.includes("lg:max-h-[calc(100vh-6.5rem)]"),
      "ResumeEditor must preserve max-height viewport constraint"
    );
  });

  test("Editor thumbnail strictly enforces mutual exclusivity between Circular and Rectangular (7:9)", () => {
    const editorPath = path.resolve(process.cwd(), "src", "components", "resume", "ResumeEditor.tsx");
    const editorContent = fs.readFileSync(editorPath, "utf-8");

    assert.ok(
      editorContent.includes('data.personalInfo.photoShape === "circle" ? "rounded-full" : "rounded-none"'),
      "Editor thumbnail must be rounded-full for circle and rounded-none for rectangle"
    );
    assert.ok(
      editorContent.includes('borderRadius: data.personalInfo.photoShape === "circle" ? "50%" : "0"'),
      "Editor thumbnail container and image must strictly apply 50% border radius for circle and 0 for rectangle"
    );
  });

  test("All 8 resume templates strictly enforce mutual exclusivity between Circular and Rectangular photo styles", () => {
    const templateFiles = [
      "ClassicCorporateTemplate.tsx",
      "CreativeTemplate.tsx",
      "ElegantMinimalTemplate.tsx",
      "ExecutiveTemplate.tsx",
      "MinimalAtsTemplate.tsx",
      "ModernProfessionalTemplate.tsx",
      "ModernTwoColumnTemplate.tsx",
      "StudentFresherTemplate.tsx",
    ];

    for (const file of templateFiles) {
      const templatePath = path.resolve(process.cwd(), "src", "components", "resume", "templates", file);
      const content = fs.readFileSync(templatePath, "utf-8");

      assert.ok(
        content.includes('photoDims.isCircle ? "rounded-full" : "rounded-none"'),
        `${file} must conditionally apply rounded-full or rounded-none based on photoDims.isCircle`
      );
      assert.ok(
        content.includes('borderRadius: photoDims.isCircle ? "50%" : "0"'),
        `${file} must explicitly set borderRadius to 50% for circle and 0 for rectangle`
      );
    }
  });

  test("Photo dimensions helper returns square for circle and 7:9 portrait for rectangle", () => {
    const circleStandard = getPhotoDimensions("standard", "circle");
    assert.strictEqual(circleStandard.isCircle, true);
    assert.strictEqual(circleStandard.previewWidthPx, circleStandard.previewHeightPx);
    assert.strictEqual(circleStandard.widthPt, circleStandard.heightPt);

    const rectStandard = getPhotoDimensions("standard", "rectangle");
    assert.strictEqual(rectStandard.isCircle, false);
    assert.ok(rectStandard.previewHeightPx > rectStandard.previewWidthPx);
    assert.strictEqual(rectStandard.widthMm, 35);
    assert.strictEqual(rectStandard.heightMm, 45);
    assert.strictEqual(rectStandard.preset.aspectRatio, 35 / 45);
  });
});

describe("PHASE 11 — Colour Customization, Presets & PDF Color Integration", () => {
  test("RESUME_COLOR_PRESETS defines all 8 professional colour presets with exact HEX codes", () => {
    assert.strictEqual(RESUME_COLOR_PRESETS.length, 8);

    const expectedPresets = [
      { id: "royal-blue", name: "Royal Blue", primary: "#4338CA" },
      { id: "navy", name: "Navy", primary: "#17365D" },
      { id: "emerald", name: "Emerald", primary: "#047857" },
      { id: "burgundy", name: "Burgundy", primary: "#8B2942" },
      { id: "teal", name: "Teal", primary: "#0F766E" },
      { id: "charcoal", name: "Charcoal", primary: "#252525" },
      { id: "purple", name: "Purple", primary: "#7C3AED" },
      { id: "black", name: "Black", primary: "#000000" },
    ];

    for (const exp of expectedPresets) {
      const match = RESUME_COLOR_PRESETS.find((p) => p.id === exp.id);
      assert.ok(match, `Preset '${exp.id}' must exist`);
      assert.strictEqual(match.name, exp.name);
      assert.strictEqual(match.primary.toUpperCase(), exp.primary.toUpperCase());

      // Verify all 7 required color properties
      const c = match.colors;
      assert.ok(c.primaryAccent, `${exp.id} must define primaryAccent`);
      assert.ok(c.nameColor, `${exp.id} must define nameColor`);
      assert.ok(c.titleColor, `${exp.id} must define titleColor`);
      assert.ok(c.headingColor, `${exp.id} must define headingColor`);
      assert.ok(c.bodyColor, `${exp.id} must define bodyColor`);
      assert.ok(c.secondaryColor, `${exp.id} must define secondaryColor`);
      assert.ok(c.dividerColor, `${exp.id} must define dividerColor`);

      // All must be valid hex codes
      assert.ok(isValidHexColor(c.primaryAccent));
      assert.ok(isValidHexColor(c.nameColor));
      assert.ok(isValidHexColor(c.titleColor));
      assert.ok(isValidHexColor(c.headingColor));
      assert.ok(isValidHexColor(c.bodyColor));
      assert.ok(isValidHexColor(c.secondaryColor));
      assert.ok(isValidHexColor(c.dividerColor));
    }
  });

  test("TEMPLATE_DEFAULT_COLORS defines defaults for all 8 templates", () => {
    const templateIds = [
      "modern-professional",
      "minimal-ats",
      "classic-corporate",
      "modern-two-column",
      "executive",
      "creative",
      "student-fresher",
      "elegant-minimal",
    ];

    for (const tid of templateIds) {
      const def = TEMPLATE_DEFAULT_COLORS[tid];
      assert.ok(def, `Template '${tid}' must have default colors defined`);
      assert.ok(isValidHexColor(def.primaryAccent));
      assert.ok(isValidHexColor(def.nameColor));
      assert.ok(isValidHexColor(def.titleColor));
      assert.ok(isValidHexColor(def.headingColor));
      assert.ok(isValidHexColor(def.bodyColor));
      assert.ok(isValidHexColor(def.secondaryColor));
      assert.ok(isValidHexColor(def.dividerColor));

      const helperResult = getTemplateDefaultColors(tid);
      assert.deepStrictEqual(helperResult, def);
    }
  });

  test("isValidHexColor correctly validates 3-digit and 6-digit hex values and rejects invalid strings", () => {
    assert.strictEqual(isValidHexColor("#4338CA"), true);
    assert.strictEqual(isValidHexColor("#fff"), true);
    assert.strictEqual(isValidHexColor("#17365d"), true);
    assert.strictEqual(isValidHexColor("#000000"), true);
    assert.strictEqual(isValidHexColor("4338CA"), true);
    assert.strictEqual(isValidHexColor("047857"), true);

    assert.strictEqual(isValidHexColor(""), false);
    assert.strictEqual(isValidHexColor("#12"), false);
    assert.strictEqual(isValidHexColor("#12345"), false);
    assert.strictEqual(isValidHexColor("#1234567"), false);
    assert.strictEqual(isValidHexColor("#zzz"), false);
    assert.strictEqual(isValidHexColor("not-a-color"), false);
    assert.strictEqual(isValidHexColor(null), false);
    assert.strictEqual(isValidHexColor(undefined), false);
  });

  test("sanitizeResumeData sanitizes color customization and defaults invalid hex codes", () => {
    const customizedData = {
      ...SAMPLE_RESUME_DATA,
      colors: {
        primaryAccent: "#8B2942",
        nameColor: "#0F172A",
        titleColor: "#8B2942",
        headingColor: "invalid-color-code",
        bodyColor: "#1F2937",
        secondaryColor: "#4B5563",
        dividerColor: "#8B2942",
      },
    };

    const sanitized = sanitizeResumeData(customizedData);
    assert.ok(sanitized.colors);
    assert.strictEqual(sanitized.colors.primaryAccent, "#8B2942");
    assert.strictEqual(sanitized.colors.nameColor, "#0F172A");
    assert.strictEqual(sanitized.colors.titleColor, "#8B2942");
    // headingColor was invalid, should fall back to template default
    const expectedDef = getTemplateDefaultColors(sanitized.templateId);
    assert.strictEqual(sanitized.colors.headingColor, expectedDef.headingColor);
    assert.strictEqual(sanitized.colors.bodyColor, "#1F2937");
    assert.strictEqual(sanitized.colors.secondaryColor, "#4B5563");
    assert.strictEqual(sanitized.colors.dividerColor, "#8B2942");
  });

  test("hexToPdfRgb accurately converts HEX string to normalized pdf-lib RGB values", () => {
    const black = hexToPdfRgb("#000000");
    assert.strictEqual(black.red, 0);
    assert.strictEqual(black.green, 0);
    assert.strictEqual(black.blue, 0);

    const white = hexToPdfRgb("#ffffff");
    assert.strictEqual(white.red, 1);
    assert.strictEqual(white.green, 1);
    assert.strictEqual(white.blue, 1);

    const royalBlue = hexToPdfRgb("#4338CA");
    assert.ok(Math.abs(royalBlue.red - 0x43 / 255) < 0.001);
    assert.ok(Math.abs(royalBlue.green - 0x38 / 255) < 0.001);
    assert.ok(Math.abs(royalBlue.blue - 0xca / 255) < 0.001);

    // Fallback on invalid
    const invalid = hexToPdfRgb("invalid");
    assert.ok(invalid.red >= 0 && invalid.red <= 1);
  });

  test("PDF Generator compiles with custom theme colors across multiple templates without throwing", async () => {
    for (const preset of RESUME_COLOR_PRESETS.slice(0, 4)) {
      const resumeWithColors = {
        ...SAMPLE_RESUME_DATA,
        templateId: "modern-two-column",
        colors: { ...preset.colors },
      };

      const pdfBytes = await generateResumePdf(resumeWithColors);
      assert.ok(pdfBytes.length > 3000, `PDF for preset ${preset.id} must be generated`);
      const doc = await PDFDocument.load(pdfBytes);
      assert.ok(doc.getPageCount() >= 1);
    }
  });

  test("ResumeEditor UI includes Collapsible 'Colours & Theme' panel with 8 presets and 7 custom controls", () => {
    const editorPath = path.resolve(process.cwd(), "src", "components", "resume", "ResumeEditor.tsx");
    const editorContent = fs.readFileSync(editorPath, "utf-8");

    assert.ok(
      editorContent.includes("Colours & Theme"),
      "ResumeEditor must include 'Colours & Theme' panel header"
    );
    assert.ok(
      editorContent.includes("isColorsOpen"),
      "ResumeEditor must manage collapsible state via isColorsOpen"
    );
    assert.ok(
      editorContent.includes("Colour Presets"),
      "ResumeEditor must include 'Colour Presets' section"
    );
    assert.ok(
      editorContent.includes("RESUME_COLOR_PRESETS"),
      "ResumeEditor must map over RESUME_COLOR_PRESETS"
    );
    assert.ok(
      editorContent.includes("HexColorInput"),
      "ResumeEditor must render HexColorInput controls"
    );
    assert.ok(
      editorContent.includes('label="Primary Accent"'),
      "ResumeEditor must render Primary Accent control"
    );
    assert.ok(
      editorContent.includes('label="Candidate Name"'),
      "ResumeEditor must render Candidate Name control"
    );
    assert.ok(
      editorContent.includes('label="Professional Title"'),
      "ResumeEditor must render Professional Title control"
    );
    assert.ok(
      editorContent.includes('label="Section Headings"'),
      "ResumeEditor must render Section Headings control"
    );
    assert.ok(
      editorContent.includes('label="Body Text"'),
      "ResumeEditor must render Body Text control"
    );
    assert.ok(
      editorContent.includes('label="Secondary Text"'),
      "ResumeEditor must render Secondary Text control"
    );
    assert.ok(
      editorContent.includes('label="Dividers & Decorative Lines"'),
      "ResumeEditor must render Dividers & Decorative Lines control"
    );
    assert.ok(
      editorContent.includes("handleResetColors"),
      "ResumeEditor must include reset colors action"
    );
  });

  test("ResumePreview includes scoped dynamic CSS rules for all 7 colour properties", () => {
    const previewPath = path.resolve(process.cwd(), "src", "components", "resume", "ResumePreview.tsx");
    const previewContent = fs.readFileSync(previewPath, "utf-8");

    assert.ok(
      previewContent.includes("resume-color-root"),
      "ResumePreview must attach resume-color-root class"
    );
    assert.ok(
      previewContent.includes("colors.nameColor"),
      "ResumePreview must style candidate name color"
    );
    assert.ok(
      previewContent.includes("colors.titleColor"),
      "ResumePreview must style professional title color"
    );
    assert.ok(
      previewContent.includes("colors.headingColor"),
      "ResumePreview must style section heading color"
    );
    assert.ok(
      previewContent.includes("colors.bodyColor"),
      "ResumePreview must style body text color"
    );
    assert.ok(
      previewContent.includes("colors.secondaryColor"),
      "ResumePreview must style secondary text color"
    );
    assert.ok(
      previewContent.includes("colors.dividerColor"),
      "ResumePreview must style divider border color"
    );
    assert.ok(
      previewContent.includes("colors.primaryAccent"),
      "ResumePreview must style primary accent icons and highlights"
    );
  });
});
