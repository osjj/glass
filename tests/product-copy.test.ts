import assert from "node:assert/strict";
import { test } from "node:test";
import { changedCopyFields, mergeSelectedCopy, suggestedSectionKeys, validateRewrite, rewriteRequestSchema, type RewriteRequest } from "../src/lib/product-copy";
import { authorizedCopyImageUrl, generateProductCopy } from "../src/lib/product-copy-ai";

const request: RewriteRequest = {
  mode: "rewrite", buyerFocus: "", verifiedNotes: "", images: [],
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
test("optimization may append only approved text sections and retains existing keys", () => {
  const optimized: RewriteRequest = { ...request, mode: "optimize", fields: ["features", "contentSections"] };
  const section = { sourceKey: "ai_product_use", title: "Where this bottle fits", body: "For bar and restaurant service." };
  const proposal = { ...optimized.copy, features: [...optimized.copy.features, "Clear glass bottle for bar service."],
    contentSections: [...optimized.copy.contentSections, section] };
  assert.deepEqual(validateRewrite(optimized, { copy: proposal, warnings: [] }).copy.contentSections.at(-1), section);
  assert.throws(() => validateRewrite(request, { copy: proposal, warnings: [] }));
  assert.throws(() => validateRewrite(optimized, { copy: { ...proposal, contentSections: [section, ...optimized.copy.contentSections] }, warnings: [] }));
  assert.throws(() => validateRewrite(optimized, { copy: { ...proposal, contentSections: [...optimized.copy.contentSections, { ...section, sourceKey: "unexpected" }] }, warnings: [] }));
  assert.throws(() => validateRewrite(optimized, { copy: { ...proposal, features: ["Rewritten existing feature", ...proposal.features.slice(1)] }, warnings: [] }));
  assert.throws(() => validateRewrite(optimized, { copy: { ...proposal, contentSections: [{ ...optimized.copy.contentSections[0], body: "Rewritten existing section" }, section] }, warnings: [] }));
  assert.deepEqual(suggestedSectionKeys(proposal), ["ai_buying_considerations"]);
});
test("optimization can append beyond five existing features and respects storage limit", () => {
  const input: RewriteRequest = { ...request, mode: "optimize", fields: ["features"],
    copy: { ...request.copy, features: Array.from({ length: 5 }, () => "Glass bottle") } };
  const proposal = { ...input.copy, features: [...input.copy.features, "Clear glass body."] };
  assert.equal(validateRewrite(input, { copy: proposal, warnings: [] }).copy.features.length, 6);
  assert.throws(() => validateRewrite(input, { copy: { ...proposal, features: [...proposal.features, ...Array.from({ length: 5 }, () => "Clear body")] }, warnings: [] }));
  input.copy.features = Array.from({ length: 100 }, () => "Glass bottle");
  assert.throws(() => validateRewrite(input, { copy: { ...input.copy, features: [...input.copy.features, "Clear body"] }, warnings: [] }));
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
  assert.equal(rewriteRequestSchema.safeParse({ ...request, images: [{ url: "https://www.glarivoglass.com/images/a.webp", role: "gallery" }] }).success, false);
  assert.equal(rewriteRequestSchema.safeParse({ ...request, mode: "optimize", images: Array.from({ length: 6 }, () => ({ url: "https://www.glarivoglass.com/images/a.webp", role: "gallery" })) }).success, false);
});
test("reference images must come from public site or configured media", () => {
  const previous = process.env.R2_PUBLIC_URL;
  process.env.R2_PUBLIC_URL = "https://media.glarivoglass.com";
  try {
    assert.equal(authorizedCopyImageUrl("/images/products/bottle.webp"), "https://www.glarivoglass.com/images/products/bottle.webp");
    assert.equal(authorizedCopyImageUrl("https://media.glarivoglass.com/products/bottle.webp"), "https://media.glarivoglass.com/products/bottle.webp");
    for (const value of ["https://example.com/a.webp", "http://media.glarivoglass.com/a.webp", "https://www.glarivoglass.com/api/admin/secret.png", "https://media.glarivoglass.com/a.webp?token=secret"]) {
      assert.throws(() => authorizedCopyImageUrl(value));
    }
  } finally {
    if (previous === undefined) delete process.env.R2_PUBLIC_URL; else process.env.R2_PUBLIC_URL = previous;
  }
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
test("optimization sends selected photos with text and accepts a text-only section", async () => {
  const previous = { key: process.env.OPENAI_API_KEY, endpoint: process.env.OPENAI_API_ENDPOINT, fetch: globalThis.fetch };
  process.env.OPENAI_API_KEY = "test-only"; process.env.OPENAI_API_ENDPOINT = "https://api.openai.com";
  const input: RewriteRequest = { ...request, mode: "optimize", fields: ["features", "contentSections"], buyerFocus: "Restaurant buyers",
    copy: { ...request.copy, features: Array.from({ length: 5 }, () => "Glass bottle") },
    images: [{ url: "https://www.glarivoglass.com/images/products/bottle.webp", role: "gallery" }] };
  try {
    globalThis.fetch = async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      assert.match(body.instructions, /Mode: supplement/);
      assert.match(body.instructions, /and 5 new features/);
      assert.equal(body.text.format.name, "product_copy_supplement");
      assert.equal(body.store, false);
      assert.equal(body.input[0].content[1].type, "input_text");
      assert.deepEqual(body.input[0].content[2], { type: "input_image", image_url: input.images[0].url, detail: "high" });
      assert.ok(!body.input[0].content[0].text.includes(input.images[0].url));
      const supplement = { name: "Suggested replacement name", summary: request.copy.summary,
        description: request.copy.description, seoTitle: request.copy.seoTitle, seoDescription: request.copy.seoDescription,
        featureAdditions: ["Clear bottle for restaurant service."],
        sectionAdditions: [{ title: "Service use", body: "For restaurant service." }], warnings: [] };
      return Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(supplement) }] }] });
    };
    const result = await generateProductCopy(input);
    assert.equal(result.copy.contentSections.length, 2);
    assert.equal(result.copy.contentSections[0].body, request.copy.contentSections[0].body);
    assert.equal(result.copy.contentSections[1].sourceKey, "ai_product_use");
    assert.deepEqual(result.copy.features, [...input.copy.features, "Clear bottle for restaurant service."]);
    assert.equal(result.copy.name, request.copy.name);
    input.copy.features.push("Clear bottle for restaurant service.");
    const unchanged = await generateProductCopy(input);
    assert.deepEqual(unchanged.copy.features, input.copy.features);
    assert.ok(unchanged.warnings.some((warning) => warning.includes("详情卖点未新增")));
  } finally {
    globalThis.fetch = previous.fetch;
    if (previous.key === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous.key;
    if (previous.endpoint === undefined) delete process.env.OPENAI_API_ENDPOINT; else process.env.OPENAI_API_ENDPOINT = previous.endpoint;
  }
});
