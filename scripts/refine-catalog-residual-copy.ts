import "dotenv/config";

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import type { Prisma } from "../src/generated/prisma/client";
import { getCategoryBuyingContent } from "../src/data/category-buying-content";
import { cleanCatalogLabel, hasSupplierVoice } from "../src/lib/catalog-public-copy";
import { prisma } from "../src/lib/prisma";

const productInclude = {
  overviewFields: { orderBy: { sortOrder: "asc" as const } },
  attributes: { orderBy: { sortOrder: "asc" as const } },
  specifications: { orderBy: { sortOrder: "asc" as const } },
  features: { orderBy: { sortOrder: "asc" as const } },
  images: { orderBy: [{ role: "asc" as const }, { sortOrder: "asc" as const }] },
  contentSections: { orderBy: { sortOrder: "asc" as const } },
  categories: {
    orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
    take: 1,
    include: { category: true },
  },
  importCandidates: {
    where: { provider: "GARBO" as const },
    select: { normalizedPayload: true },
  },
} satisfies Prisma.ProductInclude;

type ProductRecord = Prisma.ProductGetPayload<{ include: typeof productInclude }>;
type CatalogField = { label: string; value: string };
type TextUpdate = { id: string; value: string };

const thirdPartyPattern = /\b(?:garbo(?:glass)?(?:\s+international)?|oasis creations?|amazon|ebay|walmart|anchor hocking|urban bar|ikea|pyrex|libbey|luminarc|pasabahce|duralex|bormioli(?: rocco)?)\b/gi;
const thirdPartyTest = /\b(?:garbo(?:glass)?(?:\s+international)?|oasis creations?|amazon|ebay|walmart|anchor hocking|urban bar|ikea|pyrex|libbey|luminarc|pasabahce|duralex|bormioli(?: rocco)?)\b/i;
const titleResidualTest = /\b(?:garbo(?:glass)?(?:\s+international)?|oasis creations?|amazon|ebay|walmart|anchor hocking|urban bar|ikea|pyrex|libbey|luminarc|pasabahce|duralex|bormioli(?: rocco)?|factory price|china factory)\b/i;
const bodyResidualTest = /\b(?:garbo(?:glass)?(?:\s+international)?|oasis creations?|amazon|ebay|walmart|anchor hocking|urban bar|ikea|pyrex|libbey|luminarc|pasabahce|duralex|bormioli(?: rocco)?|factory price|china factory|we|our|ours|us)\b/i;

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

function cleanThirdPartyTerms(value: string) {
  return normalize(cleanCatalogLabel(value)
    .replace(thirdPartyPattern, "")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,+/g, ",")
    .replace(/^[\s,;:/-]+|[\s,;:/-]+$/g, ""));
}

function cleanPublicReference(value: string, categoryLabel: string) {
  const cleaned = cleanThirdPartyTerms(value)
    .replace(/\b(?:high[- ]?quality|cheap price|low price|hot sale|hot selling|best selling|popular|new arrival|new product|in stock|china factory|factory price|famous brand|lead[- ]?free|food[- ]?safe|dishwasher[- ]?safe|microwave[- ]?safe|oven[- ]?safe|heat[- ]?resistant|promotion(?:al)?|for sale|made in china)\b/gi, "")
    .replace(/\bwholesale\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,;:/-]+|[\s,;:/-]+$/g, "")
    .replace(/\b(?:with|for|and|of)\s*$/i, "")
    .trim();
  return cleaned || cleanThirdPartyTerms(categoryLabel) || "Glassware product";
}

function cleanSeoTitle(value: string, categoryLabel: string) {
  return truncateAtWord(cleanPublicReference(value, categoryLabel), 68);
}

function fieldKey(value: string) {
  return value.trim().toLowerCase().replace(/[:：]\s*$/, "").replace(/[^a-z0-9]+/g, "_");
}

function cleanFactValue(value: string) {
  const cleaned = cleanThirdPartyTerms(value)
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

function measuredValue(value: string) {
  return value;
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

function buildBuyerCopy(product: ProductRecord, publicName: string) {
  const category = product.categories[0]?.category;
  assert(category, `Missing primary category: ${product.slug}`);
  const categoryContent = getCategoryBuyingContent(category.slug);
  assert(categoryContent, `Missing category buying content: ${category.slug}`);
  const safeCategoryName = cleanPublicReference(category.name, "glassware");
  const fields = collectFields(product);
  const facts = factDetails(fields);
  const displayName = truncateAtWord(cleanPublicReference(publicName, category.name), 96);
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
  const description = [
    `${publishedFacts} These values identify the current listing and should be reconfirmed on the selected model before order approval.`,
    `For ${scenario}, use the selected model and sample to confirm fit rather than relying on the category image alone.`,
    `Prepare the inquiry with ${inquiry}. Any decoration, performance or compliance requirement should be confirmed for this specific product rather than assumed from the category.`,
  ].join("\n");
  const featureCandidates = [
    facts.capacity ? `Capacity check: use the listed ${measuredValue(facts.capacity)} as a comparison point and confirm the intended fill level on the selected sample.` : null,
    facts.measurements ? `Fit check: compare the published ${facts.measurements} with trays, shelves, equipment and packing space.` : null,
    facts.material ? `Material check: confirm the listed ${facts.material} and any required test documentation for the exact model.` : null,
    facts.packing ? `Packing check: treat ${facts.packing} as the current reference and confirm unit, inner and master-carton details.` : null,
    bodyResidualTest.test(categoryContent.comparisonPoints[0])
      ? "Confirm the actual glass specification and intended use conditions for the selected model."
      : categoryContent.comparisonPoints[0],
    `Inquiry check: provide ${inquiry}.`,
  ].filter((value): value is string => Boolean(value));
  const features = [...new Set(featureCandidates)].slice(0, 5);
  const seoTitle = cleanSeoTitle(publicName, category.name);
  const seoDescription = truncateAtWord(summary, 158);
  assert(features.length >= 2, `Insufficient buyer guidance: ${product.slug}`);
  for (const value of [summary, description, seoTitle, seoDescription, ...features]) {
    assert(value && !hasSupplierVoice(value) && !bodyResidualTest.test(value), `Residual supplier or third-party term: ${product.slug}: ${value}`);
  }
  return { summary, description, seoTitle, seoDescription, features };
}

function normalizedSource(product: ProductRecord) {
  const payload = product.importCandidates[0]?.normalizedPayload as {
    name?: string; summary?: string; description?: string; detailBullets?: string[];
  } | null;
  return [payload?.name, payload?.summary, payload?.description, ...(payload?.detailBullets ?? [])]
    .filter((value): value is string => Boolean(value)).join(" ");
}

function sourceSummary(product: ProductRecord) {
  const payload = product.importCandidates[0]?.normalizedPayload as { summary?: string } | null;
  return payload?.summary ?? "";
}

function hasSubstantialCopiedLead(product: ProductRecord, candidateSummary = product.summary) {
  const source = normalize(sourceSummary(product)).toLowerCase();
  const candidate = normalize(candidateSummary).toLowerCase();
  if (source.length < 300 || candidate.length < 300) return false;
  return source.startsWith(candidate) || candidate.startsWith(source);
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

function currentBody(product: ProductRecord) {
  return [product.summary, product.description, ...product.features.map((feature) => feature.value)].join(" ");
}

function cleanedRelationValue(value: string) {
  const cleaned = cleanThirdPartyTerms(value);
  return cleaned || "Glassware product";
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
    const category = product.categories[0]?.category;
    assert(category, `Missing primary category: ${product.slug}`);
    const similarityBefore = jaccard(normalizedSource(product), [product.name, currentBody(product)].join(" "));
    const exactSourceSummary = Boolean(sourceSummary(product)) && normalize(product.summary).toLowerCase() === normalize(sourceSummary(product)).toLowerCase();
    const substantialCopiedLead = hasSubstantialCopiedLead(product);
    const residualBody = bodyResidualTest.test(currentBody(product));
    const residualTitle = titleResidualTest.test(product.name);
    const rewriteBody = exactSourceSummary || substantialCopiedLead || similarityBefore >= 0.8 || residualBody;
    const publicName = residualTitle ? cleanPublicReference(product.name, category.name) : product.name;
    const generated = rewriteBody ? buildBuyerCopy(product, publicName) : null;
    const data = {
      name: publicName,
      summary: generated?.summary ?? product.summary,
      description: generated?.description ?? product.description,
      seoTitle: generated?.seoTitle ?? (residualTitle ? cleanSeoTitle(publicName, category.name) : product.seoTitle),
      seoDescription: generated?.seoDescription ?? product.seoDescription,
      detailsHeading: thirdPartyTest.test(product.detailsHeading) ? cleanedRelationValue(product.detailsHeading) : product.detailsHeading,
      specificationHeading: residualTitle || thirdPartyTest.test(product.specificationHeading)
        ? `Specification of ${publicName}`
        : product.specificationHeading,
    };
    const features = generated?.features ?? product.features.map((feature) => feature.value);
    const imageUpdates: TextUpdate[] = product.images
      .filter((image) => thirdPartyTest.test(image.alt))
      .map((image) => ({ id: image.id, value: cleanedRelationValue(image.alt) }));
    const overviewUpdates: TextUpdate[] = product.overviewFields
      .filter((field) => thirdPartyTest.test(field.value))
      .map((field) => ({ id: field.id, value: cleanedRelationValue(field.value) }));
    const attributeUpdates: TextUpdate[] = product.attributes
      .filter((field) => thirdPartyTest.test(field.value))
      .map((field) => ({ id: field.id, value: cleanedRelationValue(field.value) }));
    const specificationUpdates: TextUpdate[] = product.specifications
      .filter((field) => thirdPartyTest.test(field.value))
      .map((field) => ({ id: field.id, value: cleanedRelationValue(field.value) }));
    const sectionUpdates = product.contentSections.flatMap((section) => {
      const title = thirdPartyTest.test(section.title) ? cleanedRelationValue(section.title) : section.title;
      const body = thirdPartyTest.test(section.body) ? cleanedRelationValue(section.body) : section.body;
      return title === section.title && body === section.body ? [] : [{ id: section.id, title, body }];
    });
    const changed = rewriteBody || residualTitle || imageUpdates.length > 0 || overviewUpdates.length > 0 || attributeUpdates.length > 0 || specificationUpdates.length > 0 || sectionUpdates.length > 0 || data.detailsHeading !== product.detailsHeading || data.specificationHeading !== product.specificationHeading;
    const similarityAfter = jaccard(normalizedSource(product), [data.name, data.summary, data.description, ...features].join(" "));
    return {
      id: product.id,
      slug: product.slug,
      expected: product.updatedAt,
      before: product,
      data,
      features,
      imageUpdates,
      overviewUpdates,
      attributeUpdates,
      specificationUpdates,
      sectionUpdates,
      exactSourceSummary,
      substantialCopiedLead,
      residualBody,
      residualTitle,
      highSimilarity: similarityBefore >= 0.8,
      rewriteBody,
      changed,
      similarityBefore,
      similarityAfter,
    };
  });

  const changed = plans.filter((plan) => plan.changed);
  const rewritten = plans.filter((plan) => plan.rewriteBody);
  assert(changed.length > 0, "No residual catalog changes were found");
  assert.equal(new Set(plans.map((plan) => plan.data.summary)).size, plans.length, "Product summaries must remain unique");
  assert.equal(new Set(plans.map((plan) => plan.data.description)).size, plans.length, "Product descriptions must remain unique");
  assert.equal(plans.filter((plan) => plan.exactSourceSummary && normalize(plan.data.summary).toLowerCase() === normalize(sourceSummary(plan.before)).toLowerCase()).length, 0, "Exact-source summaries remain in plan");
  assert.equal(plans.filter((plan) => plan.substantialCopiedLead && hasSubstantialCopiedLead(plan.before, plan.data.summary)).length, 0, "Substantial copied summary lead remains in plan");
  for (const plan of plans) {
    for (const value of [plan.data.name, plan.data.summary, plan.data.description, plan.data.seoTitle ?? "", plan.data.seoDescription ?? "", plan.data.detailsHeading, plan.data.specificationHeading, ...plan.features]) {
      assert(!thirdPartyTest.test(value), `Third-party term remains in planned public product text: ${plan.slug}`);
    }
  }

  const directory = `output/catalog-residual-copy/${new Date().toISOString().replace(/[:.]/g, "-")}`;
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/review-and-backup.json`, JSON.stringify({ plans: changed }, null, 2), { flag: "wx" });
  await writeFile(`${directory}/review.md`, [
    "# Glarivo residual catalog-copy cleanup",
    "",
    "This pass preserves URLs, source records, media files, categories, SKU, prices and objective specifications.",
    "",
    ...changed.flatMap((plan) => [
      `## ${plan.before.name}`,
      "",
      `URL: https://www.glarivoglass.com/products/${plan.slug}`,
      "",
      `Reasons: ${[
        plan.exactSourceSummary ? "exact source summary" : null,
        plan.substantialCopiedLead ? "substantial copied summary lead" : null,
        plan.highSimilarity ? "similarity >= 0.8" : null,
        plan.residualBody ? "body residual" : null,
        plan.residualTitle ? "title residual" : null,
        plan.imageUpdates.length ? `${plan.imageUpdates.length} image alt updates` : null,
      ].filter(Boolean).join(", ")}`,
      "",
      `Name: ${plan.before.name} -> ${plan.data.name}`,
      "",
      `Summary before: ${plan.before.summary}`,
      "",
      `Summary after: ${plan.data.summary}`,
      "",
    ]),
  ].join("\n"), { flag: "wx" });

  const summary = {
    directory,
    mode: apply ? "apply" : "review",
    products: products.length,
    affectedProducts: changed.length,
    rewrittenBodies: rewritten.length,
    renamedProducts: plans.filter((plan) => plan.residualTitle).length,
    imageAltUpdates: plans.reduce((total, plan) => total + plan.imageUpdates.length, 0),
    overviewUpdates: plans.reduce((total, plan) => total + plan.overviewUpdates.length, 0),
    exactSourceSummaryTargets: plans.filter((plan) => plan.exactSourceSummary).length,
    substantialCopiedLeadTargets: plans.filter((plan) => plan.substantialCopiedLead).length,
    highSimilarityTargets: plans.filter((plan) => plan.highSimilarity).length,
    bodyResidualTargets: plans.filter((plan) => plan.residualBody).length,
    predictedAverageTokenJaccard: Number((plans.reduce((total, plan) => total + plan.similarityAfter, 0) / plans.length).toFixed(3)),
    predictedHighSimilarityProducts: plans.filter((plan) => plan.similarityAfter >= 0.8).length,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (!apply) return;

  await prisma.$transaction(async (tx) => {
    const productUpdates = changed.map((plan) => ({ id: plan.id, expected: plan.expected, patch: plan.data }));
    const updatedProducts = await tx.$executeRawUnsafe(
      `UPDATE "Product" p SET
         "name" = x.patch->>'name',
         "summary" = x.patch->>'summary',
         "description" = x.patch->>'description',
         "seoTitle" = x.patch->>'seoTitle',
         "seoDescription" = x.patch->>'seoDescription',
         "detailsHeading" = x.patch->>'detailsHeading',
         "specificationHeading" = x.patch->>'specificationHeading',
         "updatedAt" = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
       FROM jsonb_to_recordset($1::jsonb) AS x(id text, expected timestamp(3), patch jsonb)
       WHERE p.id = x.id AND p."updatedAt" = x.expected`,
      JSON.stringify(productUpdates),
    );
    assert.equal(updatedProducts, changed.length, "Concurrent product edit detected; rolling back");

    await tx.productFeature.deleteMany({ where: { productId: { in: rewritten.map((plan) => plan.id) } } });
    await tx.productFeature.createMany({
      data: rewritten.flatMap((plan) => plan.features.map((value, sortOrder) => ({ productId: plan.id, value, sortOrder }))),
    });

    const imageUpdates = changed.flatMap((plan) => plan.imageUpdates);
    if (imageUpdates.length) {
      const updated = await tx.$executeRawUnsafe(
        `UPDATE "ProductImage" p SET "alt" = x.value
         FROM jsonb_to_recordset($1::jsonb) AS x(id text, value text)
         WHERE p.id = x.id`,
        JSON.stringify(imageUpdates),
      );
      assert.equal(updated, imageUpdates.length, "Image alt update count mismatch");
    }

    for (const [table, updates] of [
      ["ProductOverviewField", changed.flatMap((plan) => plan.overviewUpdates)],
      ["ProductAttribute", changed.flatMap((plan) => plan.attributeUpdates)],
      ["ProductSpecification", changed.flatMap((plan) => plan.specificationUpdates)],
    ] as const) {
      if (!updates.length) continue;
      const updated = await tx.$executeRawUnsafe(
        `UPDATE "${table}" p SET "value" = x.value
         FROM jsonb_to_recordset($1::jsonb) AS x(id text, value text)
         WHERE p.id = x.id`,
        JSON.stringify(updates),
      );
      assert.equal(updated, updates.length, `${table} update count mismatch`);
    }

    const sectionUpdates = changed.flatMap((plan) => plan.sectionUpdates);
    if (sectionUpdates.length) {
      const updated = await tx.$executeRawUnsafe(
        `UPDATE "ProductContentSection" p SET "title" = x.title, "body" = x.body, "updatedAt" = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
         FROM jsonb_to_recordset($1::jsonb) AS x(id text, title text, body text)
         WHERE p.id = x.id`,
        JSON.stringify(sectionUpdates),
      );
      assert.equal(updated, sectionUpdates.length, "Content section update count mismatch");
    }
  }, { maxWait: 15_000, timeout: 120_000, isolationLevel: "Serializable" });

  const after = await prisma.product.findMany({
    where: { sourceProvider: "GARBO", status: "PUBLISHED" },
    orderBy: { slug: "asc" },
    include: productInclude,
  });
  assert.equal(after.length, 420);
  const afterById = new Map(after.map((product) => [product.id, product]));
  for (const plan of changed) {
    const product = afterById.get(plan.id);
    assert(product, `Missing product after apply: ${plan.slug}`);
    assert.equal(product.name, plan.data.name);
    assert.equal(product.summary, plan.data.summary);
    assert.equal(product.description, plan.data.description);
    assert.equal(product.seoTitle, plan.data.seoTitle);
    assert.equal(product.seoDescription, plan.data.seoDescription);
    assert.deepEqual(product.features.map((feature) => feature.value), plan.features);
    const expectedImageAlt = new Map(plan.imageUpdates.map((update) => [update.id, update.value]));
    for (const image of product.images) assert.equal(image.alt, expectedImageAlt.get(image.id) ?? plan.before.images.find((before) => before.id === image.id)?.alt);
    for (const key of ["slug", "sku", "price", "moq", "stock", "status", "sourceUrl"] as const) {
      assert.equal(String(product[key]), String(plan.before[key]), `Protected field changed: ${plan.slug}/${key}`);
    }
    assert.deepEqual(product.categories, plan.before.categories);
    assert.deepEqual(product.images.map((image) => [image.id, image.url, image.sourceUrl, image.storageKey]), plan.before.images.map((image) => [image.id, image.url, image.sourceUrl, image.storageKey]));
  }

  const publicValues = after.flatMap((product) => [
    product.name,
    product.summary,
    product.description,
    product.seoTitle ?? "",
    product.seoDescription ?? "",
    product.detailsHeading,
    product.specificationHeading,
    ...product.features.map((feature) => feature.value),
    ...product.images.map((image) => image.alt),
    ...product.overviewFields.map((field) => field.value),
    ...product.attributes.map((field) => field.value),
    ...product.specifications.map((field) => field.value),
    ...product.contentSections.flatMap((section) => [section.title, section.body]),
  ]);
  assert.equal(publicValues.filter((value) => thirdPartyTest.test(value)).length, 0, "Third-party terms remain after apply");
  const exactSummariesAfter = after.filter((product) => Boolean(sourceSummary(product)) && normalize(product.summary).toLowerCase() === normalize(sourceSummary(product)).toLowerCase());
  assert.equal(exactSummariesAfter.length, 0, "Exact-source summaries remain after apply");
  const copiedLeadsAfter = after.filter((product) => hasSubstantialCopiedLead(product));
  assert.equal(copiedLeadsAfter.length, 0, "Substantial copied summary leads remain after apply");
  console.log(`Applied and verified residual cleanup for ${changed.length} products.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
