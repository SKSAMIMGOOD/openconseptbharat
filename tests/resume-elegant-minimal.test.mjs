import test, { describe } from "node:test";
import assert from "node:assert/strict";
import zlib from "node:zlib";
import { generateResumePdf } from "../src/lib/resume/resume-pdf.ts";
import { SAMPLE_RESUME_DATA, RESUME_TEMPLATES, TEMPLATE_DEFAULT_COLORS } from "../src/constants/resume-defaults.ts";
import { PDFDocument } from "pdf-lib";

function hexString(str) {
  return Buffer.from(str).toString("hex").toUpperCase();
}

function extractAllTextStreams(pdfDoc) {
  let combined = "";
  for (const page of pdfDoc.getPages()) {
    const contentsRef = page.node.Contents();
    if (!contentsRef) continue;
    const refs = contentsRef.asArray ? contentsRef.asArray() : [contentsRef];
    for (const r of refs) {
      const s = page.node.context.lookup(r);
      if (s && typeof s.getContents === "function") {
        let raw = Buffer.from(s.getContents());
        try {
          raw = zlib.inflateSync(raw);
        } catch {
          // uncompressed
        }
        combined += raw.toString("latin1") + "\n";
      }
    }
  }
  return combined.toUpperCase();
}

describe("Resume Maker — Elegant Minimal Template Replacement Verification", () => {
  test("Template Registry & Default Colors for Elegant Minimal", () => {
    const tmpl = RESUME_TEMPLATES.find((t) => t.id === "elegant-minimal");
    assert.ok(tmpl, "elegant-minimal must exist in RESUME_TEMPLATES");
    assert.strictEqual(tmpl.name, "Elegant Minimal");

    const colors = TEMPLATE_DEFAULT_COLORS["elegant-minimal"];
    assert.ok(colors, "Default colors must be defined for elegant-minimal");
    assert.strictEqual(colors.primaryAccent.toUpperCase(), "#94B0D5");
    assert.strictEqual(colors.headingColor.toUpperCase(), "#2D3748");
  });

  test("PDF Generation for Elegant Minimal contains all reference sections and details", async () => {
    const testData = {
      ...SAMPLE_RESUME_DATA,
      templateId: "elegant-minimal",
      personalInfo: {
        ...SAMPLE_RESUME_DATA.personalInfo,
        fullName: "Sk Md Samim",
        email: "sksamimgoodboy@gmail.com",
        phone: "7384836811",
        location: "BOLPUR, West Bengal, 731215",
        linkedIn: "https://linkedin.com/in/skmdsamimgoodboy",
        dob: "18 April 2004",
        nationality: "Indian",
        maritalStatus: "Single",
      },
    };

    const pdfBytes = await generateResumePdf(testData);
    assert.ok(pdfBytes && pdfBytes.length > 0, "PDF bytes must be generated");

    const doc = await PDFDocument.load(pdfBytes);
    assert.ok(doc.getPageCount() >= 1, "PDF must have at least 1 page");

    const pageSize = doc.getPages()[0].getSize();
    assert.ok(Math.abs(pageSize.width - 595.28) < 1.0, "Must be A4 width");
    assert.ok(Math.abs(pageSize.height - 841.89) < 1.0, "Must be A4 height");

    const streamText = extractAllTextStreams(doc);

    // Section headings
    assert.ok(streamText.includes(hexString("SUMMARY")), "Must include SUMMARY heading");
    assert.ok(streamText.includes(hexString("EDUCATION")), "Must include EDUCATION heading");
    assert.ok(streamText.includes(hexString("EXPERIENCE")), "Must include EXPERIENCE heading");
    assert.ok(streamText.includes(hexString("SKILLS")), "Must include SKILLS heading");
    assert.ok(streamText.includes(hexString("LANGUAGE")), "Must include LANGUAGE heading");
    assert.ok(streamText.includes(hexString("PERSONAL INFORMATION")), "Must include PERSONAL INFORMATION heading");

    // Candidate details
    assert.ok(streamText.includes(hexString("SK MD SAMIM")), "Must include candidate name");
    assert.ok(streamText.includes(hexString("7384836811")), "Must include phone number");
    assert.ok(streamText.includes(hexString("sksamimgoodboy@gmail.com")), "Must include email");
    assert.ok(streamText.includes(hexString("linkedin.com/in/skmdsamimgoodboy")), "Must include clean LinkedIn URL");
    assert.ok(streamText.includes(hexString("18 April 2004")), "Must include Date of Birth");
    assert.ok(streamText.includes(hexString("Indian")), "Must include Nationality");
    assert.ok(streamText.includes(hexString("Single")), "Must include Marital Status");
  });

  test("PDF Generation for Elegant Minimal handles multi-page document smoothly", async () => {
    const manyExp = Array.from({ length: 8 }, (_, i) => ({
      id: `exp-${i}`,
      company: `Enterprise Company ${i + 1}`,
      jobTitle: `Senior Software Architect ${i + 1}`,
      location: "Kolkata, India",
      startDate: "2018-01",
      endDate: "2020-01",
      current: false,
      responsibilities: `• Key responsibility item A for role ${i + 1}\n• Key responsibility item B with architecture design and microservices\n• Key responsibility item C with performance optimization`,
    }));

    const multiData = {
      ...SAMPLE_RESUME_DATA,
      templateId: "elegant-minimal",
      experiences: manyExp,
    };

    const pdfBytes = await generateResumePdf(multiData);
    const doc = await PDFDocument.load(pdfBytes);
    assert.ok(doc.getPageCount() >= 2, "Multi-page resume must paginate cleanly");
  });

  test("CORRECTION 1: Professional title and Candidate name both render cleanly in PDF", async () => {
    const testData = {
      ...SAMPLE_RESUME_DATA,
      templateId: "elegant-minimal",
      personalInfo: {
        ...SAMPLE_RESUME_DATA.personalInfo,
        fullName: "Sk Md Samim",
        jobTitle: "Lead Full-Stack Software Engineer",
      },
    };

    const pdfBytes = await generateResumePdf(testData);
    const doc = await PDFDocument.load(pdfBytes);
    const streamText = extractAllTextStreams(doc);

    assert.ok(
      streamText.includes(hexString("LEAD FULL-STACK SOFTWARE ENGINEER")),
      "PDF must include full professional title"
    );
    assert.ok(
      streamText.includes(hexString("SK MD SAMIM")),
      "PDF must include candidate full name"
    );
  });

  test("CORRECTION 2: Long Education degree text wraps to line 2 without cutting off", async () => {
    const testData = {
      ...SAMPLE_RESUME_DATA,
      templateId: "elegant-minimal",
      education: [
        {
          id: "edu-1",
          institution: "National Institute of Technology (NIT)",
          degree: "Bachelor of Technology (B.Tech)",
          fieldOfStudy: "Computer Science and Engineering",
          graduationYear: "2017",
          additionalDetails: "First Class with Distinction (CGPA: 8.9/10). President of Coding & Algorithms Society.",
        },
      ],
    };

    const pdfBytes = await generateResumePdf(testData);
    const doc = await PDFDocument.load(pdfBytes);
    const streamText = extractAllTextStreams(doc);

    // Both lines from the wrapped degree text must exist in stream text (shifted to line 2, not cut off!)
    assert.ok(
      streamText.includes(hexString("BACHELOR OF TECHNOLOGY (B.TECH) - COMPUTER SCIENCE AND")),
      "Line 1 of long degree must be present"
    );
    assert.ok(
      streamText.includes(hexString("ENGINEERING")),
      "Line 2 (wrapped part) must be present and not cut off"
    );
  });
});
