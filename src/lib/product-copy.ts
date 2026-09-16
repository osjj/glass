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
const pair = z.object({ label: z.string().max(100), value: z.string().max(500) }).strict();
export const rewriteRequestSchema = z.object({
  copy: copySchema,
  fields: z.array(z.enum(COPY_FIELDS)).min(1).max(COPY_FIELDS.length),
  facts: z.object({ sku: z.string().max(80), category: z.string().max(300), overview: z.array(pair).max(30), specifications: z.array(pair).max(60) }).strict(),
}).strict();
export type RewriteRequest = z.infer<typeof rewriteRequestSchema>;
export const rewriteResultSchema = z.object({
  copy: copySchema,
  warnings: z.array(z.string().max(1000)).max(30),
}).strict();
export type RewriteResult = z.infer<typeof rewriteResultSchema>;

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
export function validateRewrite(request: RewriteRequest, result: RewriteResult): RewriteResult {
  if (!sameSectionKeys(request.copy, result.copy)) throw new Error("AI 改变了详情区块结构，请重新生成。");
  const copy = mergeSelectedCopy(request.copy, result.copy, request.fields);
  const source = JSON.stringify({ copy: request.copy, facts: request.facts });
  const output = JSON.stringify(copy);
  const numbers = (text: string): string[] => text.match(/\d+(?:[.,]\d+)*/g) ?? [];
  const knownNumbers = new Set(numbers(source));
  if (numbers(output).some((n) => !knownNumbers.has(n))) throw new Error("AI 产生了原资料没有的数字，已阻止采用，请重新生成。");
  const measures = (text: string) => (text.match(/\d+(?:\.\d+)?\s*(?:ml|cl|litres?|liters?|mm|cm|kg|oz|°c|°f|g|l)\b/gi) ?? []).map((v) => v.replace(/\s/g, "").toLowerCase());
  const knownMeasures = new Set(measures(source));
  if (measures(output).some((v) => !knownMeasures.has(v))) throw new Error("AI 改变或补充了未经确认的单位，已阻止采用。");
  const rewrittenText = request.fields.map((f) => JSON.stringify(copy[f])).join("\n");
  if (/\b(?:garbo(?:glass)?|sunwin|oasis creations)\b/i.test(rewrittenText)) throw new Error("AI 仍保留来源品牌，请重新生成。");
  if (/\b(?:FDA[- ]approved|food[- ]safe|dishwasher[- ]safe|BPA[- ]free|heat[- ]resistant|free samples?|fast delivery|certified)\b/i.test(rewrittenText)) {
    throw new Error("建议文案包含需要证据支持的性能或服务承诺，请缩小改写范围后重试。");
  }
  const missing = [...new Set(numbers(source))].filter((n) => !numbers(output).includes(n));
  return { copy, warnings: [...result.warnings, ...(missing.length ? ["部分原始数字未出现在建议文案中，请对照参数核查。"] : [])] };
}
