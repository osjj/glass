import assert from "node:assert/strict";
import test from "node:test";
import { inquirySchema } from "./inquiries";

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
