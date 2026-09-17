import assert from "node:assert/strict";
import test from "node:test";
import { articleProductFacts } from "./article-product-facts";

test("does not invent units for bare catalog dimensions or capacity", () => {
  const result = articleProductFacts([{ label: "Capacity", value: "48" }, { label: "Height", value: "59" }]);
  assert.match(result[0].value, /Confirm/);
  assert.match(result[1].value, /Confirm/);
});

test("uses explicit units and follows changed catalog values", () => {
  const fields = [{ label: "Capacity", value: "65ml" }, { label: "Product size", value: "Height: 102mm" }, { label: "Package", value: "144pcs/ctn" }];
  assert.deepEqual(articleProductFacts(fields).map((item) => item.value), ["65ml", "Height: 102mm", "144pcs/ctn"]);
  fields[0].value = "70ml";
  assert.equal(articleProductFacts(fields)[0].value, "70ml");
  assert.equal(articleProductFacts([{ label: "Capacity", value: "48", unit: "mL" }])[0].value, "48 mL");
});
