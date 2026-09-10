import "dotenv/config";

import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import type { Prisma } from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";

const productInclude = {
  features: { orderBy: { sortOrder: "asc" as const } },
  images: { orderBy: [{ role: "asc" as const }, { sortOrder: "asc" as const }] },
  overviewFields: { orderBy: { sortOrder: "asc" as const } },
  attributes: { orderBy: { sortOrder: "asc" as const } },
  specifications: { orderBy: { sortOrder: "asc" as const } },
  contentSections: { orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.ProductInclude;

type ProductRecord = Prisma.ProductGetPayload<{ include: typeof productInclude }>;
type ValueUpdate = { id: string; before: string; value: string };
type SectionUpdate = { id: string; beforeTitle: string; beforeBody: string; title: string; body: string };

const unitMarker = /\s*\(?\s*unit\s+not(?:\s+stated|\s*…)\s*\)?/gi;
const unitMarkerTest = /\bunit\s+not\b/i;

function cleanUnitMarker(value: string) {
  const cleaned = value
    .replace(unitMarker, "")
    .replace(/[ \t]+([,;:.])/g, "$1")
    .replace(/([,;]){2,}/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
  assert.deepEqual(
    cleaned.match(/\d+(?:[.,]\d+)*/g) ?? [],
    value.match(/\d+(?:[.,]\d+)*/g) ?? [],
    "Numeric content changed while removing a unit marker",
  );
  return cleaned;
}

function countMarkers(value: string) {
  return value.match(new RegExp(unitMarker.source, unitMarker.flags))?.length ?? 0;
}

function valueUpdates<T extends { id: string }>(items: T[], read: (item: T) => string): ValueUpdate[] {
  return items.flatMap((item) => {
    const before = read(item);
    const value = cleanUnitMarker(before);
    return value === before ? [] : [{ id: item.id, before, value }];
  });
}

function publicValues(product: ProductRecord) {
  return [
    product.name,
    product.summary,
    product.description,
    product.content,
    product.seoTitle ?? "",
    product.seoDescription ?? "",
    product.detailsHeading,
    product.specificationHeading,
    ...product.features.map((item) => item.value),
    ...product.images.map((item) => item.alt),
    ...product.overviewFields.map((item) => item.value),
    ...product.attributes.map((item) => item.value),
    ...product.specifications.map((item) => item.value),
    ...product.contentSections.flatMap((item) => [item.title, item.body]),
  ];
}

async function main() {
  const apply = process.argv.includes("--apply");
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { slug: "asc" },
    include: productInclude,
  });

  const plans = products.map((product) => {
    const data = {
      name: cleanUnitMarker(product.name),
      summary: cleanUnitMarker(product.summary),
      description: cleanUnitMarker(product.description),
      content: cleanUnitMarker(product.content),
      seoTitle: product.seoTitle === null ? null : cleanUnitMarker(product.seoTitle),
      seoDescription: product.seoDescription === null ? null : cleanUnitMarker(product.seoDescription),
      detailsHeading: cleanUnitMarker(product.detailsHeading),
      specificationHeading: cleanUnitMarker(product.specificationHeading),
    };
    const featureUpdates = valueUpdates(product.features, (item) => item.value);
    const imageUpdates = valueUpdates(product.images, (item) => item.alt);
    const overviewUpdates = valueUpdates(product.overviewFields, (item) => item.value);
    const attributeUpdates = valueUpdates(product.attributes, (item) => item.value);
    const specificationUpdates = valueUpdates(product.specifications, (item) => item.value);
    const sectionUpdates: SectionUpdate[] = product.contentSections.flatMap((section) => {
      const title = cleanUnitMarker(section.title);
      const body = cleanUnitMarker(section.body);
      return title === section.title && body === section.body
        ? []
        : [{ id: section.id, beforeTitle: section.title, beforeBody: section.body, title, body }];
    });
    const productTextChanged = Object.entries(data).some(([key, value]) => value !== product[key as keyof typeof data]);
    const changed = productTextChanged || featureUpdates.length > 0 || imageUpdates.length > 0
      || overviewUpdates.length > 0 || attributeUpdates.length > 0
      || specificationUpdates.length > 0 || sectionUpdates.length > 0;
    return {
      id: product.id,
      slug: product.slug,
      expectedUpdatedAt: product.updatedAt,
      before: {
        name: product.name,
        summary: product.summary,
        description: product.description,
        content: product.content,
        seoTitle: product.seoTitle,
        seoDescription: product.seoDescription,
        detailsHeading: product.detailsHeading,
        specificationHeading: product.specificationHeading,
      },
      data,
      featureUpdates,
      imageUpdates,
      overviewUpdates,
      attributeUpdates,
      specificationUpdates,
      sectionUpdates,
      productTextChanged,
      changed,
      occurrences: publicValues(product).reduce((total, value) => total + countMarkers(value), 0),
    };
  });

  const changed = plans.filter((plan) => plan.changed);
  const occurrences = changed.reduce((total, plan) => total + plan.occurrences, 0);
  assert(changed.length > 0, "No published unit markers were found");
  assert(occurrences > 0, "No unit-marker occurrences were counted");

  const directory = `output/unit-marker-cleanup/${new Date().toISOString().replace(/[:.]/g, "-")}`;
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/review-and-backup.json`, JSON.stringify({ plans: changed }, null, 2), { flag: "wx" });
  await writeFile(`${directory}/review.md`, [
    "# Remove public unit-not-stated markers",
    "",
    "Numbers and all other product data are preserved. No measurement unit is inferred.",
    "",
    ...changed.flatMap((plan) => [
      `## ${plan.slug}`,
      "",
      `Occurrences removed: ${plan.occurrences}`,
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
    publishedProducts: products.length,
    affectedProducts: changed.length,
    occurrencesRemoved: occurrences,
    productRows: changed.filter((plan) => plan.productTextChanged).length,
    featureRows: changed.reduce((total, plan) => total + plan.featureUpdates.length, 0),
    imageRows: changed.reduce((total, plan) => total + plan.imageUpdates.length, 0),
    overviewRows: changed.reduce((total, plan) => total + plan.overviewUpdates.length, 0),
    attributeRows: changed.reduce((total, plan) => total + plan.attributeUpdates.length, 0),
    specificationRows: changed.reduce((total, plan) => total + plan.specificationUpdates.length, 0),
    contentSectionRows: changed.reduce((total, plan) => total + plan.sectionUpdates.length, 0),
  };
  console.log(JSON.stringify(summary, null, 2));
  if (!apply) return;

  await prisma.$transaction(async (tx) => {
    const productUpdates = changed.filter((plan) => plan.productTextChanged).map((plan) => ({
      id: plan.id,
      expected: plan.expectedUpdatedAt,
      patch: plan.data,
    }));
    if (productUpdates.length) {
      const updated = await tx.$executeRawUnsafe(
        `UPDATE "Product" p SET
           "name" = x.patch->>'name',
           "summary" = x.patch->>'summary',
           "description" = x.patch->>'description',
           "content" = x.patch->>'content',
           "seoTitle" = x.patch->>'seoTitle',
           "seoDescription" = x.patch->>'seoDescription',
           "detailsHeading" = x.patch->>'detailsHeading',
           "specificationHeading" = x.patch->>'specificationHeading',
           "updatedAt" = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
         FROM jsonb_to_recordset($1::jsonb) AS x(id text, expected timestamp(3), patch jsonb)
         WHERE p.id = x.id AND p."updatedAt" = x.expected`,
        JSON.stringify(productUpdates),
      );
      assert.equal(updated, productUpdates.length, "Concurrent product edit detected; rolling back");
    }

    for (const [table, column, updates] of [
      ["ProductFeature", "value", changed.flatMap((plan) => plan.featureUpdates)],
      ["ProductImage", "alt", changed.flatMap((plan) => plan.imageUpdates)],
      ["ProductOverviewField", "value", changed.flatMap((plan) => plan.overviewUpdates)],
      ["ProductAttribute", "value", changed.flatMap((plan) => plan.attributeUpdates)],
      ["ProductSpecification", "value", changed.flatMap((plan) => plan.specificationUpdates)],
    ] as const) {
      if (!updates.length) continue;
      const updated = await tx.$executeRawUnsafe(
        `UPDATE "${table}" p SET "${column}" = x.value
         FROM jsonb_to_recordset($1::jsonb) AS x(id text, before text, value text)
         WHERE p.id = x.id AND p."${column}" = x.before`,
        JSON.stringify(updates),
      );
      assert.equal(updated, updates.length, `${table} concurrent edit detected; rolling back`);
    }

    const sectionUpdates = changed.flatMap((plan) => plan.sectionUpdates);
    if (sectionUpdates.length) {
      const updated = await tx.$executeRawUnsafe(
        `UPDATE "ProductContentSection" p SET
           "title" = x.title,
           "body" = x.body,
           "updatedAt" = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
         FROM jsonb_to_recordset($1::jsonb) AS x(id text, "beforeTitle" text, "beforeBody" text, title text, body text)
         WHERE p.id = x.id AND p."title" = x."beforeTitle" AND p."body" = x."beforeBody"`,
        JSON.stringify(sectionUpdates),
      );
      assert.equal(updated, sectionUpdates.length, "Content-section concurrent edit detected; rolling back");
    }
  }, { maxWait: 15_000, timeout: 120_000, isolationLevel: "Serializable" });

  const after = await prisma.product.findMany({ where: { status: "PUBLISHED" }, include: productInclude });
  const residuals = after.flatMap((product) => publicValues(product).filter((value) => unitMarkerTest.test(value)));
  assert.equal(residuals.length, 0, "Unit-not-stated markers remain after apply");
  console.log(`Applied and verified ${occurrences} removals across ${changed.length} products.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
