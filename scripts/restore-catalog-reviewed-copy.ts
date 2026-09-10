import "dotenv/config";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import type { Prisma } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";
import { CATALOG_REVIEWED_COPY_MARKER, hasSupplierVoice } from "../src/lib/catalog-public-copy";
import { catalogCopyRewrites, catalogSummaryRewrites } from "./data/catalog-copy-rewrites-2026-09-09";

const BACKUP = "output/catalog-copy-cleanup/2026-09-09T02-14-50-632Z/review-and-backup.json";
type Product = Prisma.ProductGetPayload<{ include: { features: true; images: true; contentSections: true } }>;
type BackupEntry = {
  id: string; slug: string; before: Product;
  data: Partial<Pick<Product, "name" | "summary" | "description" | "seoDescription">>;
  removeFeatures: Product["features"];
};
const normalized = (value: string) => value.trim().replace(/\s+/g, " ");

async function main() {
  const backupText = await readFile(BACKUP, "utf8");
  const backup = JSON.parse(backupText) as BackupEntry[];
  const sourceIndexes = new Map<string, number>();
  for (const entry of backup) for (const feature of entry.removeFeatures) {
    const key = normalized(feature.value);
    if (!sourceIndexes.has(key)) sourceIndexes.set(key, sourceIndexes.size);
  }
  assert.equal(sourceIndexes.size, 216, "Unexpected source backup");
  assert.equal(Object.keys(catalogCopyRewrites).length, sourceIndexes.size);
  for (const text of Object.values(catalogCopyRewrites)) {
    assert(text.trim() && text.length <= 5000 && !hasSupplierVoice(text), "Invalid reviewed paragraph");
  }
  for (const text of Object.values(catalogSummaryRewrites)) {
    assert(text.length <= 500 && !hasSupplierVoice(text), "Invalid reviewed summary");
  }
  const rewrite = (source: string) => {
    const index = sourceIndexes.get(normalized(source));
    assert(index !== undefined, "Unmapped source paragraph: " + source);
    return catalogCopyRewrites[index];
  };
  const current = await prisma.product.findMany({
    where: { id: { in: backup.map(x => x.id) } },
    include: { features: true, images: true, contentSections: true, importCandidates: true },
  });
  const byId = new Map(current.map(x => [x.id, x]));
  const plans = backup.flatMap(entry => {
    const product = byId.get(entry.id);
    assert(product, "Product missing: " + entry.id);
    const data: { summary?: string; description?: string; seoDescription?: string } = {};
    const summary = catalogSummaryRewrites[entry.id];
    if (summary && product.summary !== summary) {
      assert.equal(product.summary, entry.data.summary, "Summary edited since cleanup: " + entry.id);
      data.summary = summary;
    }
    if (entry.data.description !== undefined) {
      const description = entry.before.description.split(/\r?\n/)
        .map(line => hasSupplierVoice(line) ? rewrite(line) : line).join("\n");
      assert(description.trim() && description.length <= 20000 && !hasSupplierVoice(description));
      if (product.description !== description) {
        assert.equal(product.description, entry.data.description, "Description edited since cleanup: " + entry.id);
        data.description = description;
      }
    }
    if (entry.data.seoDescription !== undefined && summary && product.seoDescription !== summary) {
      assert.equal(product.seoDescription, entry.data.seoDescription);
      data.seoDescription = summary;
    }
    const restoreFeatures = entry.removeFeatures.flatMap(feature => {
      const value = rewrite(feature.value);
      const existing = product.features.find(x => x.id === feature.id);
      if (existing) {
        assert.equal(existing.value, value, "Feature changed since cleanup: " + feature.id);
        assert.equal(existing.sortOrder, feature.sortOrder);
        return [];
      }
      return [{ ...feature, value }];
    });
    // Preserve unrelated edits and all surviving original detail rows.
    const removedIds = new Set(entry.removeFeatures.map(x => x.id));
    for (const feature of entry.before.features.filter(x => !removedIds.has(x.id))) {
      const existing = product.features.find(x => x.id === feature.id);
      assert(existing && existing.value === feature.value && existing.sortOrder === feature.sortOrder,
        "Surviving detail changed since cleanup: " + feature.id);
    }
    if (!Object.keys(data).length && !restoreFeatures.length) return [];
    return [{ id: entry.id, slug: product.slug, before: product, original: entry.before,
      data, restoreFeatures,
      candidates: product.importCandidates.map(candidate => ({
        id: candidate.id, expected: candidate.updatedAt,
        reviewNotes: candidate.reviewNotes?.includes(CATALOG_REVIEWED_COPY_MARKER)
          ? candidate.reviewNotes
          : [candidate.reviewNotes, CATALOG_REVIEWED_COPY_MARKER].filter(Boolean).join("\n"),
      })),
    }];
  });
  const directory = `output/catalog-copy-rewrite/${new Date().toISOString().replace(/[:.]/g, "-")}`;
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/review-and-backup.json`, JSON.stringify({
    sourceBackup: BACKUP, sourceSha256: createHash("sha256").update(backupText).digest("hex"), plans,
  }, null, 2), { flag: "wx" });
  const markdown = ["# 商品文案恢复与改写", "", "保留原有产品信息；将供应商宣传和承诺改为客观介绍及采购确认事项。", "",
    ...plans.flatMap(plan => [
      `## ${plan.before.name}`, "", `页面：https://www.glarivoglass.com/products/${plan.slug}`, "",
      ...(plan.data.summary ? ["### 摘要", "", `修改前：${plan.before.summary}`, "", `修改后：${plan.data.summary}`, ""] : []),
      ...plan.restoreFeatures.flatMap(feature => [
        `### 恢复详情第 ${feature.sortOrder + 1} 条`, "",
        `原文：${plan.original.features.find(x => x.id === feature.id)?.value}`, "",
        `改写：${feature.value}`, "",
      ]),
    ]),
  ].join("\n");
  await writeFile(`${directory}/review.md`, markdown, { flag: "wx" });
  console.log(JSON.stringify({ directory, mode: process.argv.includes("--apply") ? "apply" : "review",
    products: plans.length, summaries: plans.filter(x => x.data.summary).length,
    descriptions: plans.filter(x => x.data.description).length,
    restoredFeatures: plans.reduce((n,x) => n + x.restoreFeatures.length, 0),
    protectCandidates: plans.reduce((n,x) => n + x.candidates.length, 0),
    formerlyEmptyDescriptions: plans.filter(x => !x.before.description && x.data.description).length,
  }, null, 2));
  if (!process.argv.includes("--apply") || !plans.length) return;
  await prisma.$transaction(async tx => {
    const fields = ["summary", "description", "seoDescription"];
    const assignments = fields.map(key => `"${key}" = CASE WHEN x.patch ? '${key}' THEN x.patch->>'${key}' ELSE p."${key}" END`).join(", ");
    const count = await tx.$executeRawUnsafe(
      `UPDATE "Product" p SET ${assignments}, "updatedAt" = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
       FROM jsonb_to_recordset($1::jsonb) AS x(id text, expected timestamp(3), patch jsonb)
       WHERE p.id = x.id AND p."updatedAt" = x.expected`,
      JSON.stringify(plans.map(x => ({ id: x.id, expected: x.before.updatedAt, patch: x.data }))),
    );
    assert.equal(count, plans.length, "Concurrent product change; rolling back");
    await tx.productFeature.createMany({ data: plans.flatMap(x => x.restoreFeatures) });
    const candidates = plans.flatMap(x => x.candidates);
    const marked = await tx.$executeRawUnsafe(
      `UPDATE "ProductImportCandidate" p SET "reviewNotes" = x."reviewNotes", "updatedAt" = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
       FROM jsonb_to_recordset($1::jsonb) AS x(id text, expected timestamp(3), "reviewNotes" text)
       WHERE p.id = x.id AND p."updatedAt" = x.expected`, JSON.stringify(candidates),
    );
    assert.equal(marked, candidates.length, "Concurrent import change; rolling back");
  }, { maxWait: 15000, timeout: 60000 });
  const after = await prisma.product.findMany({ where: { id: { in: plans.map(x => x.id) } },
    include: { features: true, images: true, contentSections: true, importCandidates: true },
  });
  for (const plan of plans) {
    const product = after.find(x => x.id === plan.id)!;
    for (const [key, value] of Object.entries(plan.data)) assert.equal(product[key as keyof typeof plan.data], value);
    const expected = [...plan.before.features, ...plan.restoreFeatures].sort((a,b) => a.id.localeCompare(b.id));
    assert.deepEqual([...product.features].sort((a,b) => a.id.localeCompare(b.id)), expected);
    for (const key of ["name", "slug", "sku", "price", "moq", "stock", "status"] as const) {
      assert.equal(String(product[key]), String(plan.before[key]), "Unrelated field changed: " + key);
    }
    assert.deepEqual(product.images, plan.before.images);
    assert.deepEqual(product.contentSections, plan.before.contentSections);
    assert(product.importCandidates.every(x => x.reviewNotes?.includes(CATALOG_REVIEWED_COPY_MARKER)));
  }
  console.log(`Verified ${after.length} restored products against the saved before/after plan.`);
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
