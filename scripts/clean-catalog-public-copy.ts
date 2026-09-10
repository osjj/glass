import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { prisma } from "../src/lib/prisma";
import { cleanCatalogBody, cleanCatalogLabel, hasSupplierVoice } from "../src/lib/catalog-public-copy";

async function main() {
  const products = await prisma.product.findMany({
    where: { sourceProvider: "GARBO" }, orderBy: { id: "asc" },
    include: { features: true, images: true, contentSections: true },
  });
  const changes = products.flatMap((product) => {
    if (product.content && hasSupplierVoice(product.content)) throw new Error(`Rich content requires manual review: ${product.id}`);
    const name = cleanCatalogLabel(product.name);
    if (!name) throw new Error(`Empty cleaned name: ${product.id}`);
    const fields = {
      name,
      summary: hasSupplierVoice(product.summary) ? name : product.summary,
      description: cleanCatalogBody(product.description),
      detailsHeading: cleanCatalogLabel(product.detailsHeading),
      specificationHeading: cleanCatalogLabel(product.specificationHeading),
      seoTitle: product.seoTitle === null ? null : cleanCatalogLabel(product.seoTitle),
      seoDescription: product.seoDescription === null ? null : hasSupplierVoice(product.seoDescription) ? name : product.seoDescription,
    };
    const data = Object.fromEntries(Object.entries(fields).filter(([key, value]) => product[key as keyof typeof fields] !== value));
    const features = product.features.filter((item) => hasSupplierVoice(item.value));
    const images = product.images.flatMap((item) => {
      const alt = cleanCatalogLabel(item.alt);
      return alt !== item.alt ? [{ id: item.id, alt: alt || name }] : [];
    });
    const sections = product.contentSections.flatMap((item) => {
      const title = cleanCatalogLabel(item.title) || "Product Details";
      const body = cleanCatalogBody(item.body);
      return title !== item.title || body !== item.body ? [{ id: item.id, title, body }] : [];
    });
    return Object.keys(data).length || features.length || images.length || sections.length
      ? [{ id: product.id, slug: product.slug, before: product, data, removeFeatures: features, images, sections }] : [];
  });
  const directory = `output/catalog-copy-cleanup/${new Date().toISOString().replace(/[:.]/g, "-")}`;
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/review-and-backup.json`, JSON.stringify(changes, null, 2), { flag: "wx" });
  console.log(JSON.stringify({ directory, mode: process.argv.includes("--apply") ? "apply" : "review", scanned: products.length,
    changedProducts: changes.length, names: changes.filter(x => "name" in x.data).length,
    summaries: changes.filter(x => "summary" in x.data).length,
    descriptions: changes.filter(x => "description" in x.data).length,
    removedFeatures: changes.reduce((n,x) => n+x.removeFeatures.length,0),
    imageAlts: changes.reduce((n,x) => n+x.images.length,0),
    sections: changes.reduce((n,x) => n+x.sections.length,0),
  }, null, 2));
  if (!process.argv.includes("--apply")) return;
  if (!changes.length) return;
  await prisma.$transaction(async (tx) => {
    // Fixed column names only; all content and IDs are bound JSON parameters.
    const columns = ["name", "summary", "description", "detailsHeading", "specificationHeading", "seoTitle", "seoDescription"];
    const assignments = columns.map((key) => `"${key}" = CASE WHEN x.patch ? '${key}' THEN x.patch->>'${key}' ELSE p."${key}" END`).join(", ");
    const changed = await tx.$executeRawUnsafe(
      `UPDATE "Product" p SET ${assignments}, "updatedAt" = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
       FROM jsonb_to_recordset($1::jsonb) AS x(id text, expected timestamp(3), patch jsonb)
       WHERE p.id = x.id AND p."updatedAt" = x.expected`,
      JSON.stringify(changes.map(x => ({ id: x.id, expected: x.before.updatedAt, patch: x.data }))),
    );
    if (changed !== changes.length) throw new Error("Concurrent product edits detected; rolling back cleanup.");
    await tx.productFeature.deleteMany({ where: { id: { in: changes.flatMap(x => x.removeFeatures.map(f => f.id)) } } });
    await tx.$executeRawUnsafe(
      `UPDATE "ProductImage" p SET alt = x.alt FROM jsonb_to_recordset($1::jsonb) AS x(id text, alt text) WHERE p.id = x.id`,
      JSON.stringify(changes.flatMap(x => x.images)),
    );
    await tx.$executeRawUnsafe(
      `UPDATE "ProductContentSection" p SET title = x.title, body = x.body FROM jsonb_to_recordset($1::jsonb) AS x(id text, title text, body text) WHERE p.id = x.id`,
      JSON.stringify(changes.flatMap(x => x.sections)),
    );
  }, { maxWait: 15000, timeout: 120000 });
  console.log("Applied cleanup with timestamp guards. Backup: " + directory + "/review-and-backup.json");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
