import assert from "node:assert/strict";
import test from "node:test";
import { inquiryAttribution, inquiryMessage, inquirySchema } from "./inquiries";
import { articleProductSelections, isArticleProduct, shotGlassArticleSlug, shotGlassCapacityArticleSlug } from "../data/article-products";

const valid = { submissionId: "07c172ed-dbea-4882-9551-a9d9199c21f0", email: "buyer@example.com", countryCode: "", phone: "", name: "Buyer", companyName: "", message: "Please quote 100 glasses.", sourcePath: "/", website: "" };

test("accepts required fields without optional contact details", () => {
  assert.equal(inquirySchema.safeParse(valid).success, true);
  assert.equal(inquirySchema.parse({ ...valid, email: "Buyer@Example.com" }).email, "buyer@example.com");
});

test("enforces lengths and requires real content and an email", () => {
  for (const override of [{ email: "bad" }, { name: "  " }, { message: "  " }, { name: "a".repeat(101) }, { companyName: "a".repeat(201) }, { message: "a".repeat(1001) }, { submissionId: "bad" }]) {
    assert.equal(inquirySchema.safeParse({ ...valid, ...override }).success, false);
  }
});

test("requires an international prefix with a valid optional phone", () => {
  assert.equal(inquirySchema.safeParse({ ...valid, phone: "18825913441" }).success, false);
  assert.equal(inquirySchema.safeParse({ ...valid, countryCode: "+86", phone: "188 2591 3441" }).success, true);
  for (const countryCode of ["86", "+0", "+12345", "javascript:"]) assert.equal(inquirySchema.safeParse({ ...valid, countryCode }).success, false);
});

test("rejects honeypot content and unsafe source links", () => {
  assert.equal(inquirySchema.safeParse({ ...valid, website: "spam" }).success, false);
  for (const sourcePath of ["https://example.com", "//example.com", "/\\example.com", "/?email=private", "/#fragment"]) assert.equal(inquirySchema.safeParse({ ...valid, sourcePath }).success, false);
  assert.equal(inquirySchema.safeParse({ ...valid, sourcePath: "/products/glass-cup" }).success, true);
});

test("keeps article attribution only for a configured article-product pair", () => {
  const slug = articleProductSelections[shotGlassArticleSlug][0].slug;
  const sourcePath = `/blog/${shotGlassArticleSlug}`;
  assert.deepEqual(inquiryAttribution(`/products/${slug}`, `?fromArticle=${shotGlassArticleSlug}`), { sourcePath, productSlug: slug, brief: "shot-glass" });
  for (const article of ["unrelated-article", "constructor", "https://outside.example"]) {
    assert.equal(inquiryAttribution(`/products/${slug}`, `?fromArticle=${article}`).sourcePath, `/products/${slug}`);
  }
  assert.equal(inquiryAttribution("/products/unrelated", `?fromArticle=${shotGlassArticleSlug}`).sourcePath, "/products/unrelated");
  assert.equal(inquiryAttribution(sourcePath, "", { name: "Glass", slug }).productSlug, slug);
});

test("article inquiries carry validated product references without accepting forged product facts", () => {
  const parsed = inquirySchema.parse({ ...valid, productSlug: "glass-cup", productSku: "FORGED" });
  assert.equal(parsed.productSlug, "glass-cup");
  assert.equal("productSku" in parsed, false);
  for (const productSlug of ["", "../admin", "/products/cup", "https://example.com", "x".repeat(201)]) {
    assert.equal(inquirySchema.safeParse({ ...valid, productSlug }).success, false);
  }
  assert.match(inquiryMessage({ name: "Glass", sku: "GL-1", slug: "glass", brief: "shot-glass" }), /GL-1/);
  assert.match(inquiryMessage({ name: "Sourcing", brief: "shot-glass" }), /Destination country:/);
  assert.equal(inquiryMessage(), "");
});

test("capacity article keeps its source and sample brief through either selected product", () => {
  const sourcePath = `/blog/${shotGlassCapacityArticleSlug}`;
  for (const { slug } of articleProductSelections[shotGlassCapacityArticleSlug]) {
    assert.equal(isArticleProduct(sourcePath, slug), true);
    const product = { name: "Selected glass", slug, brief: "shot-glass" as const };
    const expected = { sourcePath, productSlug: slug, brief: "shot-glass" };
    assert.deepEqual(inquiryAttribution(sourcePath, "", product), expected);
    assert.deepEqual(inquiryAttribution(`/products/${slug}`, `?fromArticle=${shotGlassCapacityArticleSlug}`, { name: product.name, slug }), expected);
    assert.match(inquiryMessage({ ...product, brief: expected.brief as "shot-glass" }), /Target capacity:/);
  }
  assert.equal(isArticleProduct(sourcePath, "unrelated"), false);
  assert.equal(inquiryAttribution("/products/unrelated", `?fromArticle=${shotGlassCapacityArticleSlug}`).sourcePath, "/products/unrelated");
});
