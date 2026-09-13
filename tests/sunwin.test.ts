import assert from "node:assert/strict";
import test from "node:test";
import { assertSunwinUrl, extractSunwinCategoryLinks, parseSunwinCategorySource, parseSunwinProduct, SUNWIN_BASE_URL } from "../src/lib/sunwin";
import { garboNormalizedProductSchema, parseGarboCategorySource } from "../src/lib/garbo-shot-glass";

const oil = parseSunwinCategorySource(`${SUNWIN_BASE_URL}/product_category/10.html`);
const perfume = parseSunwinCategorySource(`${SUNWIN_BASE_URL}/product_category/9.html`);
const productUrl = `${SUNWIN_BASE_URL}/products/2.html`;
const imageUrl = "/upload/images/product/20260101/123.jpg";
const productHtml = `<title>S20303 S20305-精油瓶-包装</title><div class="pt">S20303 S20305</div>
  <div class="xli">容量规格：30ml 15ml 50g（内胆）</div><div data-src="${imageUrl}"><img src=""></div>
  <div data-src="${imageUrl}"></div><img src="/upload/images/slides/logo.jpg"><img src="/upload/images/site/qr.png">`;

test("only the three exact canonical categories are accepted", () => {
  assert.equal(oil.slug, "essential-oil-bottles");
  for (const url of ["http://www.sunwin2001.com/product_category/10.html", `${SUNWIN_BASE_URL}/product_category/2.html`, `${oil.url}、`, `${oil.url}?page=2`, "https://www.sunwin2001.com.evil.test/product_category/9.html", "https://user@www.sunwin2001.com/product_category/9.html"]) {
    assert.throws(() => parseSunwinCategorySource(url));
  }
  assert.throws(() => assertSunwinUrl(`${SUNWIN_BASE_URL}/upload/images/site/logo.png`, "image"));
  assert.throws(() => assertSunwinUrl(`${productUrl}?page=2`));
  assert.throws(() => parseGarboCategorySource(oil.url));
});

test("pagination stays in the selected category and deduplicates page 1 and products", () => {
  const html = `<title>精油瓶-包装</title><a href="/products/2.html">A</a><a href="/products/2.html">A</a>
    <a href="${oil.path}?page=1">1</a><a href="${oil.path}?page=2">2</a><a href="${perfume.path}?page=2">Other</a>
    <a href="https://evil.test/products/3.html">External</a>`;
  const links = extractSunwinCategoryLinks(html, oil.url, oil);
  assert.deepEqual(links.productUrls, [productUrl]);
  assert.deepEqual(links.categoryPages, [oil.url, `${oil.url}?page=2`]);
  assert.throws(() => extractSunwinCategoryLinks(html.replace("精油瓶-", "公模产品-"), oil.url, oil));
  assert.throws(() => extractSunwinCategoryLinks(`${html}<a class="page on">1</a>`, `${oil.url}?page=2`, oil));
});

test("SEO keywords cannot change perfume or foundation classification", () => {
  const html = `<title>SW-302 方形香水瓶-香水瓶-化妆品包装-精油瓶-面膜瓶</title><div class="pt">SW-302 方形香水瓶</div><div data-src="${imageUrl}"></div>
    <div class="petmglis"><div data-src="/upload/images/product/20260101/456.jpg"></div></div>`;
  const parsed = parseSunwinProduct(`${SUNWIN_BASE_URL}/products/26.html`, html, perfume);
  assert.equal(parsed.normalizedPayload.name, "SW-302 Square Perfume Bottle");
  assert.equal(parsed.normalizedPayload.galleryImages.length, 1);
  assert.equal(parsed.normalizedPayload.detailImages.length, 1);
});

test("series models, mixed units and lazy product images survive normalization", () => {
  const parsed = parseSunwinProduct(productUrl, productHtml, oil);
  assert.equal(parsed.sourceSku, null);
  assert.match(parsed.normalizedPayload.name, /S20303 \/ S20305 Essential Oil Bottle/);
  assert.equal(parsed.fields.find((item) => item.fieldKey === "capacity")?.normalizedValue, "30ml 15ml 50g (inner container)");
  assert.deepEqual(parsed.normalizedPayload.galleryImages, [`${SUNWIN_BASE_URL}${imageUrl}`]);
  assert.ok(parsed.warnings.some((warning) => warning.includes("series")));
  assert.equal(garboNormalizedProductSchema.safeParse(parsed.normalizedPayload).success, true);
});

test("the same product retains its content identity across category discovery", () => {
  const first = parseSunwinProduct(productUrl, productHtml, oil);
  const second = parseSunwinProduct(productUrl, productHtml, perfume);
  assert.equal(first.sourceHash, second.sourceHash);
  assert.equal(first.normalizedPayload.slug, second.normalizedPayload.slug);
  assert.notEqual(first.sourceHash, parseSunwinProduct(productUrl, productHtml.replace("30ml", "35ml"), oil).sourceHash);
});

test("missing product images and mismatched product titles stop import", () => {
  assert.throws(() => parseSunwinProduct(productUrl, productHtml.replaceAll(imageUrl, "/upload/images/site/logo.png"), oil));
  assert.throws(() => parseSunwinProduct(productUrl, productHtml.replace('<div class="pt">S20303 S20305</div>', '<div class="pt">Other</div>'), oil));
});
