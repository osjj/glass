import { loadEnvConfig } from "@next/env";
import { Client } from "pg";
import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { copySnapshot } from "../src/lib/product-copy";

loadEnvConfig(process.cwd());
const stateFile = ".data/product-copy-check.json";
const mode = process.argv[2];

async function main() {
  const baseUrl = process.env.DATABASE_URL!;
  if (mode === "setup") {
    const schema = `copy_check_${Date.now()}`;
    const pg = new Client({ connectionString: baseUrl });
    await pg.connect();
    try {
      await pg.query(`CREATE SCHEMA "${schema}"`);
      await pg.query(`SET search_path TO "${schema}"`);
      for (const directory of (await readdir("prisma/migrations")).sort()) {
        if (!/^\d/.test(directory)) continue;
        const sql = (await readFile(`prisma/migrations/${directory}/migration.sql`, "utf8")).replace('CREATE SCHEMA IF NOT EXISTS "public";', "");
        await pg.query(sql);
      }
      await mkdir(".data", { recursive: true });
      await writeFile(stateFile, JSON.stringify({ schema }));
    } finally { await pg.end(); }
  }
  const state = JSON.parse(await readFile(stateFile, "utf8")) as { schema: string; productId?: string };
  assert.match(state.schema, /^copy_check_\d+$/);
  const url = new URL(baseUrl);
  url.searchParams.set("schema", state.schema);
  url.searchParams.set("options", `-c search_path=${state.schema}`);
  process.env.DATABASE_URL = url.href;
  if (mode === "cleanup") {
    const pg = new Client({ connectionString: baseUrl }); await pg.connect();
    try { await pg.query(`DROP SCHEMA "${state.schema}" CASCADE`); await unlink("output/playwright/product-copy/storage.json"); await unlink(stateFile); console.log("Removed isolated copy-check schema and temporary authentication state only."); }
    finally { await pg.end(); }
    return;
  }
  if (mode === "server" || mode === "build" || mode === "catalog") {
    const args = mode === "server" ? ["node_modules/next/dist/bin/next", "start", "--port", "3117"] : mode === "build" ? ["node_modules/next/dist/bin/next", "build"] : ["node_modules/tsx/dist/cli.mjs", "scripts/test-sunwin-transaction.ts"];
    const child = spawn(process.execPath, args, { env: process.env, stdio: "inherit", windowsHide: true });
    child.on("exit", (code) => process.exit(code ?? 1));
    return;
  }
  const { prisma } = await import("../src/lib/prisma");
  try {
    if (mode === "setup") {
      const category = await prisma.category.create({ data: { name: "Essential Oil Bottles", slug: "essential-oil-bottles" } });
      await prisma.externalCategoryMapping.create({ data: { categoryId: category.id, provider: "SUNWIN", sourceSlug: "essential-oil-bottles", sourcePath: "/product_category/10.html" } });
      const perfume = await prisma.category.create({ data: { name: "Perfume Bottles", slug: "perfume-bottles" } });
      await prisma.externalCategoryMapping.create({ data: { categoryId: perfume.id, provider: "SUNWIN", sourceSlug: "perfume-bottles", sourcePath: "/product_category/9.html" } });
      const admin = await prisma.adminUser.create({ data: { email: "copy-check@example.invalid", passwordHash: randomUUID(), name: "Copy Check" } });
      const product = await prisma.product.create({ data: {
        name: "300 ml Glass Bottle", slug: "copy-check-glass-bottle", sku: "COPY-300", legacyCategory: category.slug,
        summary: "Garbo offers a clear 300 ml glass bottle with free samples and fast delivery.",
        description: "A clear glass bottle with a capacity of 300 ml.", sourceProvider: "GARBO", sourceUrl: "https://www.garboglass.com/test-copy.html",
        categories: { create: { categoryId: category.id, isPrimary: true } },
        overviewFields: { create: [{ key: "capacity", label: "Capacity", value: "300 ml", rawValue: "300 ml", reviewStatus: "UNREVIEWED", sortOrder: 0 }, { label: "Material", value: "Glass", sortOrder: 1 }] },
        specifications: { create: { key: "capacity", label: "Capacity", value: "300 ml", rawValue: "300 ml", unit: "ml", reviewStatus: "UNREVIEWED" } },
        features: { create: [{ value: "Clear glass body with a stated capacity of 300 ml.", sortOrder: 0 }, { value: "Our factory offers free samples and fast delivery.", sortOrder: 1 }] },
        images: { create: { url: "/brand/glarivo-logo-blue.png", alt: "Test image", sourceUrl: "https://www.garboglass.com/test-image.png", sha256: "fixture", role: "GALLERY", rightsStatus: "AUTHORIZED" } },
        contentSections: { create: { sourceKey: "garbo_product_details", title: "Product Details", body: "Garbo glass bottle, 300 ml. Confirm packaging requirements." } },
      } });
      const { signAdminSession, ADMIN_SESSION_COOKIE } = await import("../src/lib/admin-session-token");
      const token = await signAdminSession({ userId: admin.id, role: admin.role, sessionVersion: admin.sessionVersion });
      await mkdir("output/playwright/product-copy", { recursive: true });
      await writeFile("output/playwright/product-copy/storage.json", JSON.stringify({ cookies: [{ name: ADMIN_SESSION_COOKIE, value: token, domain: "127.0.0.1", path: "/", expires: Math.floor(Date.now() / 1000) + 3600, httpOnly: true, secure: false, sameSite: "Strict" }], origins: [] }));
      await writeFile(stateFile, JSON.stringify({ ...state, productId: product.id }));
      await writeFile("output/playwright/product-copy/baseline.json", JSON.stringify(await prisma.product.findUniqueOrThrow({ where: { id: product.id }, include: { images: true, specifications: true, overviewFields: true } })));
      console.log(`Isolated schema migrated and seeded. Product page: http://127.0.0.1:3117/admin/products/${product.id}`);
    } else if (mode === "integration") {
      const { recordCopyChange } = await import("../src/lib/product-copy-store");
      const { persistCatalogCandidate, importCandidateAsUnreviewedDraft, refreshImportedCandidateFromAuthorizedSource } = await import("../src/lib/garbo-shot-glass-sync");
      const { parseSunwinProduct, parseSunwinCategorySource } = await import("../src/lib/sunwin");
      const rollback = new Error("ROLLBACK");
      try { await prisma.$transaction(async (tx) => {
        const database = new Proxy(prisma, { get(_target, key) { if (key === "$transaction") return (operation: (t: typeof tx) => Promise<unknown>) => operation(tx); return Reflect.get(tx, key); } });
        const source = parseSunwinCategorySource("https://www.sunwin2001.com/product_category/10.html");
        const fixture = '<title>S987654-精油瓶-包装</title><div class="pt">S987654</div><div class="xli">容量规格：30ml</div><div data-src="/upload/images/product/20260101/123.jpg"></div>';
        const parsed = parseSunwinProduct("https://www.sunwin2001.com/products/987654.html", fixture, source);
        await persistCatalogCandidate(parsed, "SUNWIN", database);
        const candidate = await tx.productImportCandidate.findUniqueOrThrow({ where: { provider_sourceUrl: { provider: "SUNWIN", sourceUrl: parsed.sourceUrl } } });
        const imported = await importCandidateAsUnreviewedDraft(candidate.id, null, database);
        if (!imported.ok) throw new Error(imported.error);
        let current = await tx.product.findUniqueOrThrow({ where: { id: imported.productId }, include: { features: true, contentSections: true } });
        const original = copySnapshot(current);
        const next = { ...original, summary: "Glarivo reviewed summary." };
        await recordCopyChange(tx, { productId: current.id, expectedUpdatedAt: current.updatedAt.toISOString(), next, adopted: ["summary"], reason: "AI assisted", adminId: "check", reviewed: false });
        await tx.product.update({ where: { id: current.id }, data: { summary: next.summary } });
        const revision = await tx.productCopyRevision.findFirstOrThrow({ where: { productId: current.id } });
        assert.deepEqual(revision.snapshot, original);
        await assert.rejects(recordCopyChange(tx, { productId: current.id, expectedUpdatedAt: "2000-01-01T00:00:00.000Z", next, adopted: [], reason: "Manual", adminId: "check", reviewed: true }), /商品已被/);
        const changed = parseSunwinProduct(parsed.sourceUrl, fixture.replace("30ml", "40ml"), source);
        await persistCatalogCandidate(changed, "SUNWIN", database);
        assert.equal((await tx.product.findUniqueOrThrow({ where: { id: current.id } })).copyNeedsReview, true);
        const cache = new Map([["https://www.sunwin2001.com/upload/images/product/20260101/123.jpg", Promise.resolve({ key: "test.webp", url: "https://example.com/test.webp", width: 100, height: 100, size: 100, contentType: "image/webp" as const, sha256: "test" })]]);
        assert.equal((await refreshImportedCandidateFromAuthorizedSource(candidate.id, cache, database)).ok, true);
        current = await tx.product.findUniqueOrThrow({ where: { id: current.id }, include: { features: true, contentSections: true } });
        assert.equal(current.summary, next.summary);
        assert.match(current.description, /40ml/);
        await recordCopyChange(tx, { productId: current.id, expectedUpdatedAt: current.updatedAt.toISOString(), next: original, adopted: ["summary"], reason: "Restore", adminId: "check", reviewed: true });
        await tx.product.update({ where: { id: current.id }, data: { summary: original.summary } });
        const restored = await tx.product.findUniqueOrThrow({ where: { id: current.id } });
        assert.equal(restored.summary, original.summary); assert.equal(restored.copyNeedsReview, false);
        assert.equal(await tx.productCopyRevision.count({ where: { productId: current.id } }), 2);
        const garboImage = "https://www.garboglass.com/data/upload/copy-check.jpg";
        await tx.productImportCandidate.update({ where: { id: candidate.id }, data: {
          provider: "GARBO", sourceUrl: "https://www.garboglass.com/shot-glass/copy-check.html",
          normalizedPayload: { ...changed.normalizedPayload, galleryImages: [garboImage] },
        } });
        await tx.product.update({ where: { id: current.id }, data: {
          sourceProvider: "GARBO", description: "Reviewed description", copyProtectedFields: ["summary", "description", "features", "contentSections"],
        } });
        await tx.productFeature.create({ data: { productId: current.id, value: "Reviewed detail" } });
        await tx.productContentSection.create({ data: { productId: current.id, sourceKey: "garbo_product_details", title: "Reviewed title", body: "Reviewed body" } });
        cache.set(garboImage, Promise.resolve({ key: "test-garbo.webp", url: "https://example.com/test-garbo.webp", width: 100, height: 100, size: 100, contentType: "image/webp", sha256: "test-garbo" }));
        assert.equal((await refreshImportedCandidateFromAuthorizedSource(candidate.id, cache, database)).ok, true);
        const garbo = await tx.product.findUniqueOrThrow({ where: { id: current.id }, include: { features: true, contentSections: true } });
        assert.equal(garbo.summary, original.summary); assert.equal(garbo.description, "Reviewed description");
        assert.ok(garbo.features.some((f) => f.value === "Reviewed detail"));
        assert.equal(garbo.contentSections.find((s) => s.sourceKey === "garbo_product_details")?.body, "Reviewed body");
        throw rollback;
      }, { timeout: 60000 }); } catch (error) { if (error !== rollback) throw error; }
      console.log("PASS: saved revision, stale-save rejection, SUNWIN partial/GARBO full copy protection, source-change warning, restore and review acknowledgement. Transaction rolled back.");
    } else if (mode === "live") {
      const { generateProductCopy } = await import("../src/lib/product-copy-ai");
      const { COPY_FIELDS } = await import("../src/lib/product-copy");
      const product = await prisma.product.findUniqueOrThrow({ where: { id: state.productId }, include: { features: { orderBy: { sortOrder: "asc" } }, contentSections: { orderBy: { sortOrder: "asc" } }, overviewFields: true, specifications: true } });
      const result = await generateProductCopy({ mode: "rewrite", buyerFocus: "", verifiedNotes: "", images: [], copy: copySnapshot(product), fields: [...COPY_FIELDS], facts: { sku: product.sku ?? "", category: "Glass Bottles", overview: product.overviewFields.map(({ label, value }) => ({ label, value })), specifications: product.specifications.map(({ label, value }) => ({ label, value })) } });
      await writeFile("output/playwright/product-copy/live-result.json", JSON.stringify(result, null, 2));
      console.log(`PASS: real AI generation and validation, ${result.warnings.length} review notes; product unchanged.`);
    } else if (mode === "http") {
      const base = "http://127.0.0.1:3117";
      assert.equal((await fetch(`${base}/api/admin/product-copy`)).status, 401);
      assert.equal((await fetch(`${base}/api/admin/product-copy`, { method: "POST" })).status, 401);
      const storage = JSON.parse(await readFile("output/playwright/product-copy/storage.json", "utf8"));
      const cookie = storage.cookies.map((c: { name: string; value: string }) => `${c.name}=${c.value}`).join("; ");
      const headers = { Cookie: cookie, Origin: "https://example.invalid", "Content-Type": "application/json" };
      assert.equal((await fetch(`${base}/api/admin/product-copy`, { method: "POST", headers, body: "{}" })).status, 403);
      headers.Origin = base;
      assert.equal((await fetch(`${base}/api/admin/product-copy`, { method: "POST", headers, body: "{}" })).status, 400);
      assert.equal((await fetch(`${base}/api/admin/product-copy`, { method: "POST", headers, body: "{}" })).status, 429);
      console.log("PASS: unauthenticated access, cross-origin POST, invalid payload and repeated request rejected.");
    } else if (mode === "verify") {
      const before = JSON.parse(await readFile("output/playwright/product-copy/baseline.json", "utf8"));
      const after = await prisma.product.findUniqueOrThrow({ where: { id: state.productId }, include: { images: true, specifications: true, overviewFields: true, copyRevisions: true } });
      for (const field of ["images", "specifications", "overviewFields"] as const) assert.equal(JSON.stringify(after[field]), JSON.stringify(before[field]), `${field} records and metadata unchanged`);
      assert.equal(after.slug, before.slug); assert.equal(after.sku, before.sku);
      assert.ok(after.copyRevisions.length >= 2); assert.ok(after.copyProtectedFields.length);
      assert.equal(after.summary, before.summary, "Selected historical summary restored");
      assert.ok(after.seoTitle, "Unselected SEO title retained during partial restore");
      console.log(`PASS: ${after.copyRevisions.length} saved revisions; SKU, URL, image records and factual records preserved exactly.`);
    }
  } finally { await prisma.$disconnect(); }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Copy check failed"); process.exitCode = 1; });
