import { z } from "zod";

export const COPY_FIELDS = ["name", "summary", "features", "description", "contentSections", "seoTitle", "seoDescription"] as const;
export type CopyField = typeof COPY_FIELDS[number];
export const COPY_LABELS: Record<CopyField, string> = {
  name: "商品名称", summary: "商品摘要", features: "详情卖点", description: "备用描述",
  contentSections: "详情区块", seoTitle: "SEO 标题", seoDescription: "SEO 描述",
};
export const copySchema = z.object({
  name: z.string().trim().min(1).max(180),
  summary: z.string().trim().min(1).max(500),
  features: z.array(z.string().trim().min(1).max(5000)).max(100),
  description: z.string().trim().max(20000),
  contentSections: z.array(z.object({
    sourceKey: z.string().min(1).max(120), title: z.string().trim().min(1).max(180), body: z.string().trim().max(20000),
  }).strict()).max(20),
  seoTitle: z.string().trim().max(180),
  seoDescription: z.string().trim().max(500),
}).strict();
export type ProductCopy = z.infer<typeof copySchema>;
export const MAX_COPY_REFERENCE_IMAGES = 5;
export function featureAdditionLimit(copy: ProductCopy): number {
  return Math.max(0, Math.min(5, 100 - copy.features.length));
}
const copyReferenceImageSchema = z.object({
  url: z.string().trim().min(1).max(2048),
  role: z.enum(["gallery", "detail"]),
}).strict();
export type CopyReferenceImage = z.infer<typeof copyReferenceImageSchema>;
const pair = z.object({ label: z.string().max(100), value: z.string().max(500) }).strict();
export const rewriteRequestSchema = z.object({
  mode: z.enum(["rewrite", "optimize"]).default("rewrite"),
  copy: copySchema,
  fields: z.array(z.enum(COPY_FIELDS)).min(1).max(COPY_FIELDS.length),
  facts: z.object({ sku: z.string().max(80), category: z.string().max(300), overview: z.array(pair).max(30), specifications: z.array(pair).max(60) }).strict(),
  buyerFocus: z.string().trim().max(500).default(""),
  verifiedNotes: z.string().trim().max(2000).default(""),
  images: z.array(copyReferenceImageSchema).max(MAX_COPY_REFERENCE_IMAGES).default([]),
}).strict().superRefine((input, context) => {
  if (input.mode === "rewrite" && input.images.length) context.addIssue({
    code: "custom", path: ["images"], message: "Only product-page optimization accepts reference images.",
  });
});
export type RewriteRequest = z.infer<typeof rewriteRequestSchema>;
export const rewriteResultSchema = z.object({
  copy: copySchema,
  warnings: z.array(z.string().max(1000)).max(30),
}).strict();
export type RewriteResult = z.infer<typeof rewriteResultSchema>;
export const supplementResultSchema = z.object({
  name: z.string().trim().min(1).max(180),
  summary: z.string().trim().min(1).max(500),
  description: z.string().trim().max(20000),
  seoTitle: z.string().trim().max(180),
  seoDescription: z.string().trim().max(500),
  featureAdditions: z.array(z.string().trim().min(1).max(5000)).max(5),
  sectionAdditions: z.array(z.object({ title: z.string().trim().min(1).max(180), body: z.string().trim().min(1).max(20000) }).strict()).max(2),
  warnings: z.array(z.string().max(1000)).max(30),
}).strict();

export function copySnapshot(value: {
  name: string; summary: string; description: string; seoTitle?: string | null; seoDescription?: string | null;
  features: (string | { value: string })[];
  contentSections: { sourceKey: string; title: string; body: string }[];
}): ProductCopy {
  return { name: value.name, summary: value.summary, description: value.description,
    seoTitle: value.seoTitle ?? "", seoDescription: value.seoDescription ?? "",
    features: value.features.map((feature) => typeof feature === "string" ? feature : feature.value),
    contentSections: value.contentSections.map(({ sourceKey, title, body }) => ({ sourceKey, title, body })),
  };
}
export function changedCopyFields(before: ProductCopy, after: ProductCopy): CopyField[] {
  return COPY_FIELDS.filter((field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]));
}
export function mergeSelectedCopy(current: ProductCopy, proposal: ProductCopy, fields: CopyField[]): ProductCopy {
  return Object.fromEntries(COPY_FIELDS.map((field) => [field, fields.includes(field) ? proposal[field] : current[field]])) as ProductCopy;
}
export function sameSectionKeys(a: ProductCopy, b: ProductCopy) {
  return JSON.stringify(a.contentSections.map((s) => s.sourceKey)) === JSON.stringify(b.contentSections.map((s) => s.sourceKey));
}
export function suggestedSectionKeys(copy: ProductCopy): string[] {
  const used = new Set(copy.contentSections.map((section) => section.sourceKey));
  return ["ai_product_use", "ai_buying_considerations"].filter((base) =>
    ![...used].some((key) => key === base || key.startsWith(`${base}_`)));
}
export function validateRewrite(request: RewriteRequest, result: RewriteResult): RewriteResult {
  const original = request.copy.contentSections;
  const proposed = result.copy.contentSections;
  const existingKeysMatch = original.every((section, index) => proposed[index]?.sourceKey === section.sourceKey);
  const added = proposed.slice(original.length);
  const allowedKeys = suggestedSectionKeys(request.copy);
  const canAppend = request.mode === "optimize" && request.fields.includes("contentSections") &&
    added.length <= Math.min(allowedKeys.length, 20 - original.length) &&
    added.every((section, index) => section.sourceKey === allowedKeys[index] && section.body.trim());
  if (!existingKeysMatch || (request.mode === "rewrite" ? added.length > 0 : added.length > 0 && !canAppend) ||
    proposed.length < original.length) throw new Error("AI 改变了详情区块结构，请重新生成。");
  const copy = mergeSelectedCopy(request.copy, result.copy, request.fields);
  if (request.mode === "optimize") {
    if (request.copy.features.some((feature, index) => copy.features[index] !== feature) ||
      copy.features.length > request.copy.features.length + featureAdditionLimit(request.copy) ||
      original.some((section, index) => copy.contentSections[index]?.title !== section.title ||
        copy.contentSections[index]?.body !== section.body)) {
      throw new Error("产品页优化改动了已有卖点或区块原文，请重新生成或使用一键改写。");
    }
  }
  const source = JSON.stringify({ copy: request.copy, facts: request.facts, verifiedNotes: request.verifiedNotes });
  const output = JSON.stringify(copy);
  const numbers = (text: string): string[] => text.match(/\d+(?:[.,]\d+)*/g) ?? [];
  const knownNumbers = new Set(numbers(source));
  if (numbers(output).some((n) => !knownNumbers.has(n))) throw new Error("AI 产生了原资料没有的数字，已阻止采用，请重新生成。");
  const measures = (text: string) => (text.match(/\d+(?:\.\d+)?\s*(?:ml|cl|litres?|liters?|mm|cm|kg|oz|°c|°f|g|l)\b/gi) ?? []).map((v) => v.replace(/\s/g, "").toLowerCase());
  const knownMeasures = new Set(measures(source));
  if (measures(output).some((v) => !knownMeasures.has(v))) throw new Error("AI 改变或补充了未经确认的单位，已阻止采用。");
  const rewrittenText = request.fields.flatMap((field) => {
    if (field === "features") return copy.features.filter((feature, index) => feature !== request.copy.features[index]);
    if (field === "contentSections") return copy.contentSections.flatMap((section, index) => {
      const before = request.copy.contentSections[index];
      return !before || section.title !== before.title || section.body !== before.body ? [section.title, section.body] : [];
    });
    return JSON.stringify(copy[field]) !== JSON.stringify(request.copy[field]) ? [JSON.stringify(copy[field])] : [];
  }).join("\n");
  if (/\b(?:garbo(?:glass)?|sunwin|oasis creations)\b/i.test(rewrittenText)) throw new Error("AI 仍保留来源品牌，请重新生成。");
  if (/\b(?:FDA[- ]approved|food[- ]safe|dishwasher[- ]safe|BPA[- ]free|heat[- ]resistant|free samples?|fast delivery|certified)\b/i.test(rewrittenText)) {
    throw new Error("建议文案包含需要证据支持的性能或服务承诺，请缩小改写范围后重试。");
  }
  const missing = [...new Set(numbers(source))].filter((n) => !numbers(output).includes(n));
  return { copy, warnings: [...result.warnings, ...(missing.length ? ["部分原始数字未出现在建议文案中，请对照参数核查。"] : [])] };
}
