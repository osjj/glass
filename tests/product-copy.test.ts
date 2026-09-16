import assert from "node:assert/strict";
import { test } from "node:test";
import { changedCopyFields, mergeSelectedCopy, validateRewrite, rewriteRequestSchema, type RewriteRequest } from "../src/lib/product-copy";
import { generateProductCopy } from "../src/lib/product-copy-ai";

const request: RewriteRequest = {
  copy: { name: "300 ml Glass Bottle", summary: "Clear glass bottle, 300 ml.", description: "Glass bottle.", features: ["Capacity: 300 ml"],
    contentSections: [{ sourceKey: "details", title: "Product Details", body: "Clear glass." }], seoTitle: "", seoDescription: "" },
  fields: ["summary"], facts: { sku: "B300", category: "Bottles", overview: [{ label: "Capacity", value: "300 ml" }], specifications: [] },
};
test("partial adoption changes only selected text and preserves section keys", () => {
  const proposal = { ...request.copy, summary: "A 300 ml glass bottle.", name: "Other name" };
  const actual = mergeSelectedCopy(request.copy, proposal, ["summary"]);
  assert.equal(actual.name, request.copy.name);
  assert.deepEqual(changedCopyFields(request.copy, actual), ["summary"]);
  assert.deepEqual(actual.contentSections, request.copy.contentSections);
});
test("rejects invented numbers, changed units and changed section structure", () => {
  for (const summary of ["Capacity 500 ml.", "Capacity 300 kg."]) {
    assert.throws(() => validateRewrite(request, { copy: { ...request.copy, summary }, warnings: [] }));
  }
  assert.throws(() => validateRewrite(request, { copy: { ...request.copy, contentSections: [] }, warnings: [] }));
});
test("ignores unselected AI edits and rejects supplier branding", () => {
  const result = validateRewrite(request, { copy: { ...request.copy, name: "999 kg", summary: "300 ml glass bottle." }, warnings: [] });
  assert.equal(result.copy.name, request.copy.name);
  assert.throws(() => validateRewrite(request, { copy: { ...request.copy, summary: "Sunwin 300 ml bottle." }, warnings: [] }));
  assert.throws(() => validateRewrite(request, { copy: { ...request.copy, summary: "Dishwasher-safe 300 ml bottle with free samples." }, warnings: [] }));
});
test("rejects unauthorized fields and absent required input", () => {
  assert.equal(rewriteRequestSchema.safeParse({ ...request, price: 10 }).success, false);
  assert.equal(rewriteRequestSchema.safeParse({ ...request, copy: { ...request.copy, summary: "" } }).success, false);
});
test("upstream request disables storage, uses structured output and does not expose upstream errors", async () => {
  const previous = { key: process.env.OPENAI_API_KEY, endpoint: process.env.OPENAI_API_ENDPOINT, fetch: globalThis.fetch };
  process.env.OPENAI_API_KEY = "test-only"; process.env.OPENAI_API_ENDPOINT = "https://api.openai.com";
  try {
    globalThis.fetch = async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      assert.equal(body.store, false); assert.equal(body.text.format.strict, true);
      return Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ copy: { ...request.copy, summary: "A 300 ml glass bottle." }, warnings: [] }) }] }] });
    };
    assert.equal((await generateProductCopy(request)).copy.summary, "A 300 ml glass bottle.");
    globalThis.fetch = async () => Response.json({ error: "secret-upstream-message" }, { status: 401 });
    await assert.rejects(generateProductCopy(request), (error: Error) => !error.message.includes("secret-upstream-message"));
    globalThis.fetch = async () => Response.json({ status: "incomplete", output: [] });
    await assert.rejects(generateProductCopy(request), /未完整/);
  } finally {
    globalThis.fetch = previous.fetch;
    if (previous.key === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous.key;
    if (previous.endpoint === undefined) delete process.env.OPENAI_API_ENDPOINT; else process.env.OPENAI_API_ENDPOINT = previous.endpoint;
  }
});
