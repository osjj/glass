import assert from "node:assert/strict";
import test from "node:test";
import { getPageNumber, getProductPagination, getVisiblePages, productPageHref } from "./product-pagination";

test("invalid and repeated URL page values are normalized", () => {
  for (const value of [undefined, "", "0", "-1", "1.5", "2abc", "Infinity", "9007199254740992"]) {
    assert.equal(getPageNumber(value), 1);
  }
  assert.equal(getPageNumber(["2", "3"]), 2);
});

test("30-item pages cover the complete list without overlaps", () => {
  for (const total of [0, 1, 29, 30, 31, 60, 61, 300]) {
    const seen: number[] = [];
    const totalPages = getProductPagination(total, 1).totalPages;
    for (let page = 1; page <= totalPages; page++) {
      const result = getProductPagination(total, page);
      assert.ok(result.end - result.skip <= 30);
      for (let index = result.skip; index < result.end; index++) seen.push(index);
    }
    assert.deepEqual(seen, Array.from({ length: total }, (_, index) => index));
    assert.equal(getProductPagination(total, 999).page, totalPages);
  }
  assert.equal(getProductPagination(0, 1).start, 0);
});

test("pagination preserves encoded filters and omits page=1", () => {
  const filters = { category: "shot-glass", q: "glass & cup" };
  const next = new URL(productPageHref("/products", 2, filters), "http://localhost");
  assert.equal(next.searchParams.get("q"), filters.q);
  assert.equal(next.searchParams.get("category"), filters.category);
  assert.equal(next.searchParams.get("page"), "2");
  assert.equal(new URL(productPageHref("/products", 1, filters), next).searchParams.has("page"), false);
  assert.equal(productPageHref("/admin/products", 1), "/admin/products");
});

test("visible page numbers include current and endpoints and remain bounded", () => {
  for (const total of [1, 2, 3, 4, 10, 100]) {
    for (let page = 1; page <= total; page++) {
      const visible = getVisiblePages(page, total);
      assert.ok(visible.includes(1) && visible.includes(page) && visible.includes(total));
      assert.ok(visible.length <= 5);
      assert.ok(visible.every((value) => value >= 1 && value <= total));
    }
  }
});
