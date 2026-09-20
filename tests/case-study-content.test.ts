import assert from "node:assert/strict";
import test from "node:test";
import { caseStudyContentSchema, isCasePublished } from "../src/lib/case-study-content";
import { shangriLaCaseStudy } from "../src/data/shangri-la-case-study";

test("draft, archived, undated and future cases remain private", () => {
  const now = new Date("2026-09-19T00:00:00Z");
  for (const status of ["DRAFT", "ARCHIVED"]) assert.equal(isCasePublished({ status, publishedAt: new Date("2026-09-01") }, now), false);
  assert.equal(isCasePublished({ status: "PUBLISHED", publishedAt: null }, now), false);
  assert.equal(isCasePublished({ status: "PUBLISHED", publishedAt: new Date("2026-09-20") }, now), false);
  assert.equal(isCasePublished({ status: "PUBLISHED", publishedAt: now }, now), true);
});
test("case content keeps tables and rejects duplicate anchors and unsafe links", () => {
  const content = caseStudyContentSchema.parse(shangriLaCaseStudy);
  assert.equal(content.sections.filter(section => section.table).length, 2);
  assert.equal(caseStudyContentSchema.safeParse({ ...content, sections: [content.sections[0], content.sections[0]] }).success, false);
  assert.equal(caseStudyContentSchema.safeParse({ ...content, relatedLinks: [{ label: "Unsafe", href: "javascript:alert(1)" }] }).success, false);
  assert.equal(caseStudyContentSchema.safeParse({ ...content, relatedLinks: [{ label: "Unsafe", href: "//external.example" }] }).success, false);
});
test("images require descriptive alt text and table rows match column count", () => {
  const content = caseStudyContentSchema.parse(shangriLaCaseStudy);
  content.sections[0].image = { url: "/images/example.webp", alt: "", caption: "" };
  assert.equal(caseStudyContentSchema.safeParse(content).success, false);
  delete content.sections[0].image;
  content.sections[1].table!.rows[0].pop();
  assert.equal(caseStudyContentSchema.safeParse(content).success, false);
});
