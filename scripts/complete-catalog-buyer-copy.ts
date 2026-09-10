import "dotenv/config";

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import type { Prisma } from "../src/generated/prisma/client";
import { getCategoryBuyingContent, getCategoryBuyingContentSlugs } from "../src/data/category-buying-content";
import { CATALOG_REVIEWED_COPY_MARKER, cleanCatalogLabel, hasSupplierVoice } from "../src/lib/catalog-public-copy";
import { prisma } from "../src/lib/prisma";

const productInclude = {
  overviewFields: { orderBy: { sortOrder: "asc" as const } },
  attributes: { orderBy: { sortOrder: "asc" as const } },
  specifications: { orderBy: { sortOrder: "asc" as const } },
  features: { orderBy: { sortOrder: "asc" as const } },
  images: { orderBy: { sortOrder: "asc" as const } },
  contentSections: { orderBy: { sortOrder: "asc" as const } },
  categories: {
    orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
    take: 1,
    include: { category: true },
  },
  importCandidates: {
    where: { provider: "GARBO" as const },
    select: { id: true, updatedAt: true, reviewNotes: true, normalizedPayload: true },
  },
} satisfies Prisma.ProductInclude;

type ProductRecord = Prisma.ProductGetPayload<{ include: typeof productInclude }>;
type ProductPatch = Pick<ProductRecord, "summary" | "description" | "seoTitle" | "seoDescription">;
type CatalogField = { label: string; value: string };

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function lowerFirst(value: string) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function truncateAtWord(value: string, maximum: number) {
  const clean = normalize(value);
  if (clean.length <= maximum) return clean;
  const shortened = clean.slice(0, maximum - 1).replace(/\s+\S*$/, "").replace(/[,:;\s-]+$/, "");
  return `${shortened || clean.slice(0, maximum - 1).trim()}…`;
}

function cleanPublicReference(value: string, categoryLabel: string) {
  const cleaned = cleanCatalogLabel(value)
    .replace(/\b(?:amazon|anchor hocking|ikea|pyrex|oasis creations?)\b/gi, "")
    .replace(/\b(?:high[- ]?quality|cheap price|low price|hot sale|hot selling|best selling|popular|new arrival|new product|in stock|china factory|factory price|famous brand|lead[- ]?free|food[- ]?safe|dishwasher[- ]?safe|microwave[- ]?safe|oven[- ]?safe|heat[- ]?resistant|promotion(?:al)?|for sale|made in china)\b/gi, "")
    .replace(/\bwholesale\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,;:/-]+|[\s,;:/-]+$/g, "")
    .replace(/\b(?:with|for|and|of)\s*$/i, "")
    .trim();
  return cleaned || categoryLabel;
}

function cleanSeoTitle(value: string, categoryLabel: string) {
  return truncateAtWord(cleanPublicReference(value, categoryLabel), 68);
}

function fieldKey(value: string) {
  return value.trim().toLowerCase().replace(/[:：]\s*$/, "").replace(/[^a-z0-9]+/g, "_");
}

function cleanFactValue(value: string) {
  const cleaned = cleanCatalogLabel(value)
    .replace(/\b(?:lead[- ]?free|food[- ]?safe|dishwasher[- ]?safe|microwave[- ]?safe|oven[- ]?safe|heat[- ]?resistant)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/^[\s,;]+|[\s,;]+$/g, "");
  const parts = cleaned.split(",").map(normalize).filter(Boolean);
  return [...new Map(parts.map((part) => [part.toLowerCase(), part])).values()].join(", ");
}

function collectFields(product: ProductRecord) {
  const result = new Map<string, string>();
  for (const field of [...product.overviewFields, ...product.attributes, ...product.specifications] as CatalogField[]) {
    const key = fieldKey(field.label);
    const value = normalize(cleanFactValue(field.value));
    if (key && value && !result.has(key)) result.set(key, value);
  }
  return result;
}

function firstField(fields: Map<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = fields.get(key);
    if (value) return value;
  }
  return null;
}

function hasMeasurementUnit(value: string) {
  return /(?:^|\d\s*)(?:ml|cl|l|oz|mm|cm|m|g|kg|lb|inch|inches|pcs?|ctn)\b|["″]/i.test(value);
}

function measuredValue(value: string) {
  return hasMeasurementUnit(value) ? value : `${value} (unit not stated)`;
}

function factDetails(fields: Map<string, string>) {
  const material = firstField(fields, ["material"]);
  const capacity = firstField(fields, ["capacity", "volume"]);
  const productSize = firstField(fields, ["product_size", "size"]);
  const top = firstField(fields, ["top_diameter", "top_dia"]);
  const height = firstField(fields, ["height"]);
  const bottom = firstField(fields, ["bottom_diameter", "bottom_dia"]);
  const weight = firstField(fields, ["weight"]);
  const packing = firstField(fields, ["package", "packaging", "packing"]);
  const measurements = productSize
    ? measuredValue(productSize)
    : [top ? `top ${measuredValue(top)}` : null, height ? `height ${measuredValue(height)}` : null, bottom ? `base ${measuredValue(bottom)}` : null]
    .filter(Boolean).join(", ") || null;
  return { material, capacity, measurements, weight, packing };
}

function hashVariant(value: string, count: number) {
  return Number.parseInt(createHash("sha256").update(value).digest("hex").slice(0, 8), 16) % count;
}

function buildBuyerCopy(product: ProductRecord) {
  const category = product.categories[0]?.category;
  assert(category, `Missing primary category: ${product.slug}`);
  const categoryContent = getCategoryBuyingContent(category.slug);
  assert(categoryContent, `Missing category buying content: ${category.slug}`);
  const safeCategoryName = cleanPublicReference(category.name, "glassware");
  const fields = collectFields(product);
  const facts = factDetails(fields);
  const displayName = truncateAtWord(cleanPublicReference(product.name, category.name), 96);
  assert(displayName, `Empty public product name: ${product.slug}`);

  const factFragments = [
    facts.material ? `material ${facts.material}` : null,
    facts.capacity ? `capacity ${measuredValue(facts.capacity)}` : null,
    facts.measurements ? `dimensions ${facts.measurements}` : null,
    facts.weight ? `weight ${measuredValue(facts.weight)}` : null,
    facts.packing ? `packing reference ${facts.packing}` : null,
  ].filter((value): value is string => Boolean(value));
  const leadFacts = factFragments.slice(0, 2).join(", ");
  const scenario = lowerFirst(categoryContent.useCases[0].replace(/[.]$/, ""));
  const inquiry = categoryContent.inquiryChecklist.slice(0, 3).map(lowerFirst).join(", ");
  const shortInquiry = lowerFirst(categoryContent.inquiryChecklist[0]);
  const variants = factFragments.length ? [
    `${displayName} is cataloged with ${leadFacts}. Compare the published values with the intended use and confirm ${shortInquiry} before quotation.`,
    `Published data for ${displayName} includes ${leadFacts}. Check fit on the selected model and sample, then confirm ${shortInquiry}.`,
    `Shortlist ${displayName} using ${leadFacts}. Reconfirm the model, sample, ${shortInquiry} before order approval.`,
  ] : [
    `${displayName} is listed in the ${safeCategoryName} collection, but its dimensions, material and packing data are not yet published. Confirm the selected sample and provide ${shortInquiry} before quotation.`,
    `This ${safeCategoryName.toLowerCase()} entry requires a product-specific specification sheet before selection. Use the linked images to identify ${displayName}, then confirm ${shortInquiry}.`,
  ];
  const summary = truncateAtWord(variants[hashVariant(product.slug, variants.length)], 300);

  const publishedFacts = factFragments.length
    ? `Published catalog data for ${displayName} lists ${factFragments.join("; ")}.`
    : `Detailed dimensions, capacity, material and packing data are not yet published for ${displayName}.`;
  const usageNote = `For ${scenario}, use the selected model and sample to confirm fit rather than relying on the category image alone.`;
  const description = [
    `${publishedFacts} These values identify the current listing and should be reconfirmed on the selected model before order approval.`,
    usageNote,
    `Prepare the inquiry with ${inquiry}. Any decoration, performance or compliance requirement should be confirmed for this specific product rather than assumed from the category.`,
  ].join("\n");

  const featureCandidates = [
    facts.capacity ? `Capacity check: use the listed ${measuredValue(facts.capacity)} as a comparison point and confirm the intended fill level on the selected sample.` : null,
    facts.measurements ? `Fit check: compare the published ${facts.measurements} with trays, shelves, equipment and packing space.` : null,
    facts.material ? `Material check: confirm the listed ${facts.material} and any required test documentation for the exact model.` : null,
    facts.packing ? `Packing check: treat ${facts.packing} as the current reference and confirm unit, inner and master-carton details.` : null,
    categoryContent.comparisonPoints[0],
    `Inquiry check: provide ${inquiry}.`,
  ].filter((value): value is string => Boolean(value));
  const features = [...new Set(featureCandidates)].slice(0, 5);
  assert(features.length >= 2, `Insufficient buyer guidance: ${product.slug}`);

  const seoTitle = cleanSeoTitle(product.name, category.name);
  const seoDescription = truncateAtWord(summary, 158);
  for (const value of [summary, description, seoTitle, seoDescription, ...features]) {
    assert(value && !hasSupplierVoice(value), `Supplier voice in generated copy: ${product.slug}`);
  }
  assert(normalize(summary) !== normalize(product.name), `Summary still equals name: ${product.slug}`);
  return { summary, description, seoTitle, seoDescription, features };
}

function normalizedSourceText(product: ProductRecord) {
  const payload = product.importCandidates[0]?.normalizedPayload as {
    name?: string; summary?: string; description?: string; detailBullets?: string[];
  } | null;
  return [payload?.name, payload?.summary, payload?.description, ...(payload?.detailBullets ?? [])]
    .filter((value): value is string => Boolean(value)).join(" ");
}

function tokenSet(value: string) {
  return new Set(value.toLowerCase().match(/[a-z0-9]+/g) ?? []);
}

function jaccard(left: string, right: string) {
  const a = tokenSet(left);
  const b = tokenSet(right);
  const union = new Set([...a, ...b]);
  if (!union.size) return 1;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / union.size;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const products = await prisma.product.findMany({
    where: { sourceProvider: "GARBO", status: "PUBLISHED" },
    orderBy: { slug: "asc" },
    include: productInclude,
  });
  assert.equal(products.length, 420, "Expected the complete 420-product public Garbo catalog");

  const plans = products.map((product) => {
    const reviewed = product.importCandidates.some((candidate) => candidate.reviewNotes?.includes(CATALOG_REVIEWED_COPY_MARKER));
    const generated = reviewed ? null : buildBuyerCopy(product);
    const data: ProductPatch = {
      summary: generated?.summary ?? product.summary,
      description: generated?.description ?? product.description,
      seoTitle: generated?.seoTitle ?? cleanSeoTitle(product.name, product.categories[0]?.category.name ?? "Glassware"),
      seoDescription: generated?.seoDescription ?? truncateAtWord(product.summary, 158),
    };
    const features = generated?.features ?? product.features.map((feature) => feature.value);
    const predictedText = [product.name, data.summary, data.description, ...features].join(" ");
    const candidates = reviewed ? [] : product.importCandidates.map((candidate) => ({
      id: candidate.id,
      expected: candidate.updatedAt,
      reviewNotes: candidate.reviewNotes?.includes(CATALOG_REVIEWED_COPY_MARKER)
        ? candidate.reviewNotes
        : [candidate.reviewNotes, CATALOG_REVIEWED_COPY_MARKER].filter(Boolean).join("\n"),
    }));
    return {
      id: product.id,
      slug: product.slug,
      reviewed,
      expected: product.updatedAt,
      before: product,
      data,
      features,
      candidates,
      sourceSimilarity: jaccard(normalizedSourceText(product), predictedText),
    };
  });

  const rewritten = plans.filter((plan) => !plan.reviewed);
  assert.equal(rewritten.length, 305, "Expected 305 remaining products");
  assert.equal(new Set(plans.map((plan) => plan.data.summary)).size, plans.length, "Product summaries must be unique");
  assert.equal(new Set(plans.map((plan) => plan.data.description)).size, plans.length, "Product descriptions must be unique");
  assert(rewritten.every((plan) => plan.data.summary !== plan.before.summary || plan.data.description !== plan.before.description));
  const categorySlugs = new Set(products.map((product) => product.categories[0]?.category.slug));
  assert.equal(categorySlugs.size, 48, "Expected all product-bearing categories");
  assert.equal(getCategoryBuyingContentSlugs().length, 56, "Expected buying content for all 56 categories");

  const directory = `output/catalog-buyer-copy/${new Date().toISOString().replace(/[:.]/g, "-")}`;
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/review-and-backup.json`, JSON.stringify({ plans }, null, 2), { flag: "wx" });
  await writeFile(`${directory}/review.md`, [
    "# Glarivo full-catalog buyer-copy plan",
    "",
    "The plan preserves product URLs, source records, images, categories, objective fields and specifications.",
    "",
    ...rewritten.flatMap((plan) => [
      `## ${plan.before.name}`,
      "",
      `URL: https://www.glarivoglass.com/products/${plan.slug}`,
      "",
      `Category: ${plan.before.categories[0]?.category.name}`,
      "",
      "### Summary",
      "",
      `Before: ${plan.before.summary}`,
      "",
      `After: ${plan.data.summary}`,
      "",
      "### Buyer details",
      "",
      plan.data.description,
      "",
      ...plan.features.flatMap((feature) => [`- ${feature}`]),
      "",
    ]),
  ].join("\n"), { flag: "wx" });

  const averageSimilarity = plans.reduce((total, plan) => total + plan.sourceSimilarity, 0) / plans.length;
  const remainingAverage = rewritten.reduce((total, plan) => total + plan.sourceSimilarity, 0) / rewritten.length;
  console.log(JSON.stringify({
    directory,
    mode: apply ? "apply" : "review",
    products: plans.length,
    rewritten: rewritten.length,
    metadataUpdated: plans.filter((plan) => plan.before.seoTitle !== plan.data.seoTitle || plan.before.seoDescription !== plan.data.seoDescription).length,
    replacementFeatures: rewritten.reduce((total, plan) => total + plan.features.length, 0),
    predictedAverageTokenJaccard: Number(averageSimilarity.toFixed(3)),
    predictedRemainingTokenJaccard: Number(remainingAverage.toFixed(3)),
  }, null, 2));
  if (!apply) return;

  await prisma.$transaction(async (tx) => {
    const changed = await tx.$executeRawUnsafe(
      `UPDATE "Product" p SET
         "summary" = x.patch->>'summary',
         "description" = x.patch->>'description',
         "seoTitle" = x.patch->>'seoTitle',
         "seoDescription" = x.patch->>'seoDescription',
         "updatedAt" = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
       FROM jsonb_to_recordset($1::jsonb) AS x(id text, expected timestamp(3), patch jsonb)
       WHERE p.id = x.id AND p."updatedAt" = x.expected`,
      JSON.stringify(plans.map((plan) => ({ id: plan.id, expected: plan.expected, patch: plan.data }))),
    );
    assert.equal(changed, plans.length, "Concurrent product edit detected; rolling back");

    await tx.productFeature.deleteMany({ where: { productId: { in: rewritten.map((plan) => plan.id) } } });
    await tx.productFeature.createMany({
      data: rewritten.flatMap((plan) => plan.features.map((value, sortOrder) => ({ productId: plan.id, value, sortOrder }))),
    });

    const candidates = rewritten.flatMap((plan) => plan.candidates);
    const marked = await tx.$executeRawUnsafe(
      `UPDATE "ProductImportCandidate" p SET
         "reviewNotes" = x."reviewNotes",
         "updatedAt" = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
       FROM jsonb_to_recordset($1::jsonb) AS x(id text, expected timestamp(3), "reviewNotes" text)
       WHERE p.id = x.id AND p."updatedAt" = x.expected`,
      JSON.stringify(candidates),
    );
    assert.equal(marked, candidates.length, "Concurrent candidate edit detected; rolling back");
  }, { maxWait: 15_000, timeout: 120_000 });

  const after = await prisma.product.findMany({
    where: { id: { in: plans.map((plan) => plan.id) } },
    include: productInclude,
  });
  const afterById = new Map(after.map((product) => [product.id, product]));
  for (const plan of plans) {
    const product = afterById.get(plan.id);
    assert(product, `Missing product after apply: ${plan.slug}`);
    assert.equal(product.summary, plan.data.summary);
    assert.equal(product.description, plan.data.description);
    assert.equal(product.seoTitle, plan.data.seoTitle);
    assert.equal(product.seoDescription, plan.data.seoDescription);
    assert.deepEqual(product.features.map((feature) => feature.value), plan.features);
    assert.deepEqual(product.images, plan.before.images);
    assert.deepEqual(product.contentSections, plan.before.contentSections);
    assert.deepEqual(product.overviewFields, plan.before.overviewFields);
    assert.deepEqual(product.attributes, plan.before.attributes);
    assert.deepEqual(product.specifications, plan.before.specifications);
    assert.deepEqual(product.categories, plan.before.categories);
    for (const key of ["name", "slug", "sku", "price", "moq", "stock", "status", "sourceUrl"] as const) {
      assert.equal(String(product[key]), String(plan.before[key]), `Unrelated field changed: ${plan.slug}/${key}`);
    }
    if (!plan.reviewed) {
      assert(product.importCandidates.every((candidate) => candidate.reviewNotes?.includes(CATALOG_REVIEWED_COPY_MARKER)));
    }
  }
  console.log(`Applied and verified ${rewritten.length} buyer-copy rewrites plus metadata for ${plans.length} products.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
