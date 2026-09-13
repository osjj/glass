import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { persistCatalogCandidate, importCandidateAsUnreviewedDraft, refreshImportedCandidateFromAuthorizedSource } from "../src/lib/garbo-shot-glass-sync";
import { parseSunwinCategorySource, parseSunwinProduct, SUNWIN_BASE_URL } from "../src/lib/sunwin";

// Integration test: all test rows live inside one transaction that always rolls back.
async function main() {
  const oil = parseSunwinCategorySource(`${SUNWIN_BASE_URL}/product_category/10.html`);
  const perfume = parseSunwinCategorySource(`${SUNWIN_BASE_URL}/product_category/9.html`);
  const url = `${SUNWIN_BASE_URL}/products/999999991.html`;
  const fixture = `<title>S99991 S99992-精油瓶-包装</title><div class="pt">S99991 S99992</div><div class="xli">容量规格：30ml 15ml</div><div data-src="/upload/images/product/20260101/123.jpg"></div>`;
  const before = await prisma.productImportCandidate.count({ where: { provider: "SUNWIN", sourceUrl: url } });
  assert.equal(before, 0, "Test source URL must be unused");
  const rollback = new Error("ROLL_BACK_SUNWIN_TEST");
  let passed = false;
  try {
    await prisma.$transaction(async (transaction) => {
      const database = new Proxy(prisma, {
        get(_target, key) {
          if (key === "$transaction") return (operation: (tx: typeof transaction) => Promise<unknown>) => operation(transaction);
          return Reflect.get(transaction, key);
        },
      });
      assert.equal(await persistCatalogCandidate(parseSunwinProduct(url, fixture, oil), "SUNWIN", database), "created");
      assert.equal(await persistCatalogCandidate(parseSunwinProduct(url, fixture, oil), "SUNWIN", database), "unchanged");
      assert.equal(await persistCatalogCandidate(parseSunwinProduct(url, fixture, perfume), "SUNWIN", database), "unchanged");
      const candidate = await transaction.productImportCandidate.findUniqueOrThrow({ where: { provider_sourceUrl: { provider: "SUNWIN", sourceUrl: url } } });
      assert.deepEqual(new Set(candidate.sourceCategoryPaths), new Set([oil.path, perfume.path]));
      assert.equal(candidate.sourceCategoryPath, oil.path);
      await transaction.productImportField.update({ where: { candidateId_fieldKey: { candidateId: candidate.id, fieldKey: "name" } }, data: { status: "VERIFIED", normalizedValue: "Reviewed Cosmetic Bottle Series" } });
      assert.equal(await persistCatalogCandidate(parseSunwinProduct(url, fixture.replace("30ml", "35ml"), oil), "SUNWIN", database), "updated");
      const reviewedName = await transaction.productImportField.findUniqueOrThrow({ where: { candidateId_fieldKey: { candidateId: candidate.id, fieldKey: "name" } } });
      assert.equal(reviewedName.normalizedValue, "Reviewed Cosmetic Bottle Series");
      assert.equal(reviewedName.status, "VERIFIED");
      const imported = await importCandidateAsUnreviewedDraft(candidate.id, null, database);
      if (!imported.ok) throw new Error(imported.error);
      const product = await transaction.product.findUniqueOrThrow({ where: { id: imported.productId }, include: { categories: true } });
      assert.equal(product.status, "DRAFT");
      assert.equal(product.publishedAt, null);
      assert.equal(product.sourceProvider, "SUNWIN");
      assert.equal(product.name, "Reviewed Cosmetic Bottle Series");
      assert.equal(product.categories.filter((category) => category.isPrimary).length, 1);
      const mediaCache = new Map([[`${SUNWIN_BASE_URL}/upload/images/product/20260101/123.jpg`, Promise.resolve({
        key: "products/sunwin/assets/test.webp", url: "https://example.com/test.webp", width: 100, height: 100, size: 100,
        contentType: "image/webp" as const, sha256: "test-only",
      })]]);
      assert.equal((await refreshImportedCandidateFromAuthorizedSource(candidate.id, mediaCache, database)).ok, true);
      await persistCatalogCandidate(parseSunwinProduct(url, fixture.replace("30ml", "40ml"), oil), "SUNWIN", database);
      assert.equal((await refreshImportedCandidateFromAuthorizedSource(candidate.id, mediaCache, database)).ok, true);
      const capacity = await transaction.productSpecification.findFirstOrThrow({ where: { productId: product.id, key: "capacity" } });
      assert.equal(capacity.value, "40ml 15ml");
      await transaction.product.update({ where: { id: product.id }, data: { summary: "Manually edited summary" } });
      await transaction.productSpecification.update({ where: { id: capacity.id }, data: { value: "Reviewed capacity", reviewStatus: "VERIFIED" } });
      await persistCatalogCandidate(parseSunwinProduct(url, fixture.replace("30ml", "45ml"), oil), "SUNWIN", database);
      assert.equal((await refreshImportedCandidateFromAuthorizedSource(candidate.id, mediaCache, database)).ok, true);
      assert.equal((await transaction.product.findUniqueOrThrow({ where: { id: product.id } })).summary, "Manually edited summary");
      assert.equal((await transaction.productSpecification.findUniqueOrThrow({ where: { id: capacity.id } })).value, "Reviewed capacity");
      const missingImage = `${SUNWIN_BASE_URL}/upload/images/product/20260101/missing.jpg`;
      const changed = parseSunwinProduct(url, fixture.replace("30ml", "50ml"), oil);
      changed.normalizedPayload.galleryImages.push(missingImage);
      changed.sourceHash = "test-image-failure";
      await persistCatalogCandidate(changed, "SUNWIN", database);
      const failedImage = Promise.reject(new Error("Simulated image failure"));
      void failedImage.catch(() => undefined);
      mediaCache.set(missingImage, failedImage);
      const failedRefresh = await refreshImportedCandidateFromAuthorizedSource(candidate.id, mediaCache, database);
      assert.equal(failedRefresh.ok, false);
      if (failedRefresh.ok) throw new Error("Expected image failure");
      assert.equal(failedRefresh.error, "media-failed");
      assert.equal(await transaction.productImage.count({ where: { productId: product.id } }), 1, "Image failure preserves the existing gallery");
      assert.equal((await transaction.product.findUniqueOrThrow({ where: { id: product.id } })).status, "DRAFT");
      const repeated = await importCandidateAsUnreviewedDraft(candidate.id, null, database);
      assert.deepEqual(repeated, { ok: false, error: "already-imported" });
      assert.equal(await transaction.product.count({ where: { sourceProvider: "SUNWIN", sourceUrl: url } }), 1);
      passed = true;
      throw rollback;
    }, { timeout: 120_000 });
  } catch (error) { if (error !== rollback) throw error; }
  assert.ok(passed);
  assert.equal(await prisma.productImportCandidate.count({ where: { provider: "SUNWIN", sourceUrl: url } }), 0);
  assert.equal(await prisma.product.count({ where: { sourceProvider: "SUNWIN", sourceUrl: url } }), 0);
  console.log("PASS: deduplication, category membership, reviewer edits, draft creation, capacity refresh, manual-edit preservation, atomic image failure and repeat-import protection; transaction rolled back. Media was mocked; no upload performed.");
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Integration test failed"); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
