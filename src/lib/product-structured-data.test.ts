import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProductPageStructuredData,
  getProductCategoryTrail,
} from "./product-structured-data";

const product = {
  slug: "clear-shot-glass",
  sku: " SG-100 ",
  name: "Clear Shot Glass",
  category: "shot-glass",
  categoryLabel: "Shot Glass",
  summary: "A clear wholesale shot glass.",
  seoDescription: null,
  images: [
    { url: "/products/shot-glass.webp", alt: "Clear shot glass", width: 800, height: 800 },
    { url: "/products/shot-glass.webp", alt: "Duplicate", width: 800, height: 800 },
  ],
  overviewFields: [{ label: " Capacity ", value: " 50 ml " }],
  specifications: [
    { label: "Capacity", value: "50 ml" },
    { label: "Material", value: "Soda-lime glass" },
  ],
};

const categories = [
  { id: "drinkware-id", slug: "drinkware", label: "Drinkware", parentId: null },
  { id: "shot-id", slug: "shot-glass", label: "Shot Glass", parentId: "drinkware-id" },
];

test("builds accurate Product and nested BreadcrumbList data without commercial claims", () => {
  const trail = getProductCategoryTrail(product, categories);
  assert.deepEqual(trail.map(({ slug }) => slug), ["drinkware", "shot-glass"]);

  const schema = buildProductPageStructuredData(product, trail, "https://www.glarivoglass.com");
  const productSchema = schema["@graph"].find((node) => node["@type"] === "Product");
  const breadcrumbSchema = schema["@graph"].find((node) => node["@type"] === "BreadcrumbList");
  assert.ok(productSchema && "sku" in productSchema);
  assert.ok(breadcrumbSchema && "itemListElement" in breadcrumbSchema);

  assert.equal(productSchema["@type"], "Product");
  assert.equal(productSchema.sku, "SG-100");
  assert.deepEqual(productSchema.image, ["https://www.glarivoglass.com/products/shot-glass.webp"]);
  assert.deepEqual(productSchema.additionalProperty, [
    { "@type": "PropertyValue", name: "Capacity", value: "50 ml" },
    { "@type": "PropertyValue", name: "Material", value: "Soda-lime glass" },
  ]);
  assert.equal("offers" in productSchema, false);
  assert.equal("brand" in productSchema, false);
  assert.equal("aggregateRating" in productSchema, false);
  assert.deepEqual(
    breadcrumbSchema.itemListElement.map((item) => item.name),
    ["Home", "Products", "Drinkware", "Shot Glass", "Clear Shot Glass"],
  );
});

test("uses the published product category when the category tree has no matching node", () => {
  const trail = getProductCategoryTrail(product, []);
  assert.deepEqual(trail.map(({ slug, label }) => ({ slug, label })), [
    { slug: "shot-glass", label: "Shot Glass" },
  ]);
});
