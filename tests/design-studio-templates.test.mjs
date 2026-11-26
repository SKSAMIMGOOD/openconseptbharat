import test from "node:test";
import assert from "node:assert/strict";

import {
  ALL_DESIGN_TEMPLATES,
  VISITING_CARD_TEMPLATES,
  WEDDING_CARD_TEMPLATES,
  PROJECT_COVER_TEMPLATES,
  ID_CARD_TEMPLATES,
  getTemplatesByCategory,
  getTemplateById,
  instantiateTemplate,
} from "../src/lib/design-studio/template-registry.ts";
import { validateDesignDocument } from "../src/lib/design-studio/template-foundation.ts";

test("Design Studio Templates — All 4 categories provide exactly 4 distinct templates (16 total)", () => {
  assert.equal(ALL_DESIGN_TEMPLATES.length, 16);
  assert.equal(VISITING_CARD_TEMPLATES.length, 4);
  assert.equal(WEDDING_CARD_TEMPLATES.length, 4);
  assert.equal(PROJECT_COVER_TEMPLATES.length, 4);
  assert.equal(ID_CARD_TEMPLATES.length, 4);

  assert.equal(getTemplatesByCategory("visiting-card").length, 4);
  assert.equal(getTemplatesByCategory("wedding-card").length, 4);
  assert.equal(getTemplatesByCategory("project-cover").length, 4);
  assert.equal(getTemplatesByCategory("id-card").length, 4);
});

test("Design Studio Templates — Every template produces a valid, compliant DesignDocument", () => {
  ALL_DESIGN_TEMPLATES.forEach((tpl) => {
    const doc = tpl.createDocument();
    const validation = validateDesignDocument(doc);
    assert.equal(
      validation.isValid,
      true,
      `Template "${tpl.id}" failed schema validation: ${validation.errors.join(", ")}`
    );
    assert.equal(doc.category, tpl.category);
    assert.ok(doc.pages.length >= 1);
    assert.ok(doc.dimensions.widthMm > 0);
    assert.ok(doc.dimensions.heightMm > 0);
  });
});

test("Design Studio Templates — instantiateTemplate generates unique IDs and protects original definitions", () => {
  const template = getTemplateById("vc-corporate-classic");
  assert.ok(template);

  // Instantiation 1
  const doc1 = instantiateTemplate(template);
  // Instantiation 2
  const doc2 = instantiateTemplate(template);

  // Document IDs must be unique
  assert.notEqual(doc1.id, doc2.id);
  assert.ok(doc1.id.startsWith("doc-"));
  assert.ok(doc2.id.startsWith("doc-"));

  // Page IDs must be unique
  assert.notEqual(doc1.pages[0].id, doc2.pages[0].id);

  // Element IDs must be unique across instantiations
  assert.equal(doc1.pages[0].elements.length, doc2.pages[0].elements.length);
  for (let i = 0; i < doc1.pages[0].elements.length; i++) {
    const el1 = doc1.pages[0].elements[i];
    const el2 = doc2.pages[0].elements[i];
    assert.notEqual(el1.id, el2.id);
    assert.equal(el1.type, el2.type);
    assert.equal(el1.name, el2.name);
  }

  // Mutating doc1 must NOT alter template factory or doc2
  doc1.pages[0].elements[0].name = "MUTATED_TEST_NAME";
  assert.notEqual(doc2.pages[0].elements[0].name, "MUTATED_TEST_NAME");

  const freshDoc = template.createDocument();
  assert.notEqual(freshDoc.pages[0].elements[0].name, "MUTATED_TEST_NAME");
});

test("Design Studio Templates — ID Cards category uses standard CR80 dimensions and remains independent", () => {
  const idTemplates = getTemplatesByCategory("id-card");
  idTemplates.forEach((tpl) => {
    const doc = tpl.createDocument();
    // CR80: 85.6mm x 53.98mm (or orientation inverted)
    const shortSide = Math.min(doc.dimensions.widthMm, doc.dimensions.heightMm);
    const longSide = Math.max(doc.dimensions.widthMm, doc.dimensions.heightMm);

    assert.equal(Math.round(shortSide * 10) / 10, 54.0);
    assert.equal(Math.round(longSide * 10) / 10, 85.6);
  });
});

test("Design Studio Templates — Visiting Card and ID Card support Front and Back dual-page layout", () => {
  const corporateCard = getTemplateById("vc-corporate-classic");
  assert.ok(corporateCard);
  const vcDoc = corporateCard.createDocument();
  assert.equal(vcDoc.pages.length, 2);
  assert.equal(vcDoc.pages[0].name, "Front Side");
  assert.equal(vcDoc.pages[1].name, "Back Side");

  const corporateId = getTemplateById("id-corporate-badge");
  assert.ok(corporateId);
  const idDoc = corporateId.createDocument();
  assert.equal(idDoc.pages.length, 2);
});
