import test, { describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { PDFDocument } from "pdf-lib";
import {
  CAREER_OBJECTIVE_CATEGORIES,
  QUICK_TECHNICAL_SKILLS,
  QUICK_SOFT_SKILLS,
  SAMPLE_RESUME_DATA,
} from "../src/constants/resume-defaults.ts";
import { generateResumePdf } from "../src/lib/resume/resume-pdf.ts";

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

describe("Resume Maker — Quick Selection Presets Enhancement", () => {
  test("1. Career Objective Presets structure and content validation", () => {
    assert.strictEqual(
      CAREER_OBJECTIVE_CATEGORIES.length,
      10,
      "Must have exactly 10 objective categories"
    );

    const categoryNames = CAREER_OBJECTIVE_CATEGORIES.map((c) => c.category);
    assert.ok(categoryNames.includes("A. Fresher"));
    assert.ok(categoryNames.includes("B. Experienced"));
    assert.ok(categoryNames.includes("C. Software / Web Development"));
    assert.ok(categoryNames.includes("D. Graphic / UI-UX Design"));
    assert.ok(categoryNames.includes("E. Digital Marketing"));
    assert.ok(categoryNames.includes("F. Teaching / Education"));
    assert.ok(categoryNames.includes("G. Banking / Finance"));
    assert.ok(categoryNames.includes("I. Healthcare / Nursing"));
    assert.ok(categoryNames.includes("J. Human Resources (HR)"));
    assert.ok(categoryNames.includes("M. Hospitality / Hotel"));

    const totalObjectives = CAREER_OBJECTIVE_CATEGORIES.reduce(
      (sum, c) => sum + c.options.length,
      0
    );
    assert.strictEqual(
      totalObjectives,
      24,
      "Must provide exactly 24 predefined objective templates"
    );

    // Verify sample objective contents
    const fresherGeneral = CAREER_OBJECTIVE_CATEGORIES.find(
      (c) => c.category === "A. Fresher"
    ).options.find((o) => o.label === "Fresher — General Job");
    assert.ok(fresherGeneral);
    assert.ok(
      fresherGeneral.text.startsWith(
        "Motivated and quick-learning graduate seeking an entry-level position"
      )
    );

    const sweExp = CAREER_OBJECTIVE_CATEGORIES.find(
      (c) => c.category === "C. Software / Web Development"
    ).options.find((o) => o.label === "Experienced");
    assert.ok(sweExp);
    assert.ok(
      sweExp.text.startsWith(
        "Skilled Software Developer with experience in building scalable web applications"
      )
    );
  });

  test("2. Quick Skills Presets lists validation", () => {
    assert.strictEqual(
      QUICK_TECHNICAL_SKILLS.length,
      9,
      "Must provide 9 predefined technical skills"
    );
    assert.deepStrictEqual(QUICK_TECHNICAL_SKILLS, [
      "Computer Basics",
      "MS Word",
      "MS Excel",
      "MS PowerPoint",
      "Internet & Email",
      "Data Entry",
      "Typing",
      "Tally / Accounting Basics",
      "Basic Hardware / Technical Support",
    ]);

    assert.strictEqual(
      QUICK_SOFT_SKILLS.length,
      10,
      "Must provide 10 predefined soft skills"
    );
    assert.deepStrictEqual(QUICK_SOFT_SKILLS, [
      "Communication",
      "Teamwork",
      "Time Management",
      "Problem Solving",
      "Quick Learner",
      "Leadership",
      "Multitasking",
      "Customer Service",
      "Sales & Marketing",
      "Office Administration",
    ]);
  });

  test("3. ResumeEditor.tsx contains Quick Objective dropdown and Quick Skills checkboxes", () => {
    const editorFilePath = path.resolve(
      process.cwd(),
      "src",
      "components",
      "resume",
      "ResumeEditor.tsx"
    );
    const content = fs.readFileSync(editorFilePath, "utf-8");

    // Check Career Objective Dropdown
    assert.ok(
      content.includes("Quick Objective – Select a sample"),
      "Editor must contain 'Quick Objective – Select a sample' label"
    );
    assert.ok(
      content.includes("CAREER_OBJECTIVE_CATEGORIES"),
      "Editor must render CAREER_OBJECTIVE_CATEGORIES"
    );
    assert.ok(
      content.includes("<optgroup"),
      "Editor must group objective options into <optgroup> categories"
    );

    // Check Quick Skills section
    assert.ok(
      content.includes("Quick Skills – Select skills to add"),
      "Editor must contain 'Quick Skills – Select skills to add' section"
    );
    assert.ok(
      content.includes("QUICK_TECHNICAL_SKILLS"),
      "Editor must render QUICK_TECHNICAL_SKILLS"
    );
    assert.ok(
      content.includes("QUICK_SOFT_SKILLS"),
      "Editor must render QUICK_SOFT_SKILLS"
    );
    assert.ok(
      content.includes("handleToggleQuickSkill"),
      "Editor must implement handleToggleQuickSkill function"
    );

    // Verify raw input state prevents stripping spaces/commas while typing
    assert.ok(
      content.includes("technicalSkillsInput"),
      "Editor must track technicalSkillsInput state for natural typing"
    );
    assert.ok(
      content.includes("softSkillsInput"),
      "Editor must track softSkillsInput state for natural typing"
    );
  });

  test("4. PDF generation accurately reflects populated career objective and quick skills", async () => {
    const selectedObjective =
      "Skilled Software Developer with experience in building scalable web applications, writing clean code, and collaborating in agile teams. Focused on delivering high-performance, user-friendly solutions.";

    const testData = {
      ...SAMPLE_RESUME_DATA,
      summary: selectedObjective,
      skills: {
        technical: [
          "Computer Basics",
          "MS Word",
          "MS Excel",
          "Tally / Accounting Basics",
          "Next.js", // manual entry alongside quick skills
        ],
        soft: [
          "Communication",
          "Teamwork",
          "Quick Learner",
          "Customer Service",
          "System Architecture", // manual entry alongside quick skills
        ],
      },
    };

    const pdfBytes = await generateResumePdf(testData);
    assert.ok(pdfBytes && pdfBytes.length > 0, "PDF bytes must be generated");

    const doc = await PDFDocument.load(pdfBytes);
    const streamText = extractAllTextStreams(doc);

    // Verify summary is in PDF
    assert.ok(
      streamText.includes(hexString("Skilled Software Developer")),
      "PDF must contain selected career objective"
    );

    // Verify skills are in PDF
    assert.ok(
      streamText.includes(hexString("MS Word")) ||
        streamText.includes(hexString("Computer Basics")),
      "PDF must contain quick technical skills"
    );
    assert.ok(
      streamText.includes(hexString("Next.js")),
      "PDF must contain manually entered technical skill"
    );
    assert.ok(
      streamText.includes(hexString("Communication")) ||
        streamText.includes(hexString("Teamwork")),
      "PDF must contain quick soft skills"
    );
  });
});
