import type { PublicCategory, PublicProduct } from "@/lib/public-products";

type StructuredProduct = Pick<
  PublicProduct,
  | "slug"
  | "sku"
  | "name"
  | "category"
  | "categoryLabel"
  | "summary"
  | "seoDescription"
  | "images"
  | "overviewFields"
  | "specifications"
>;

type StructuredCategory = Pick<PublicCategory, "id" | "slug" | "label" | "parentId">;

function absoluteHttpUrl(value: string, siteUrl: string) {
  try {
    const url = new URL(value, `${siteUrl}/`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export function getProductCategoryTrail(
  product: Pick<StructuredProduct, "category" | "categoryLabel">,
  categories: StructuredCategory[],
) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const trail: StructuredCategory[] = [];
  const visited = new Set<string>();
  let current = categories.find((category) => category.slug === product.category);

  while (current && !visited.has(current.id)) {
    trail.unshift(current);
    visited.add(current.id);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return trail.length
    ? trail
    : [{ id: product.category, slug: product.category, label: product.categoryLabel, parentId: null }];
}

export function buildProductPageStructuredData(
  product: StructuredProduct,
  categoryTrail: StructuredCategory[],
  siteUrl: string,
) {
  const canonicalUrl = new URL(`/products/${product.slug}`, `${siteUrl}/`).href;
  const images = Array.from(new Set(
    product.images.flatMap((image) => {
      const url = absoluteHttpUrl(image.url, siteUrl);
      return url ? [url] : [];
    }),
  ));
  const propertyKeys = new Set<string>();
  const additionalProperty = [...product.overviewFields, ...product.specifications].flatMap((field) => {
    const name = field.label.trim();
    const value = field.value.trim();
    const key = `${name.toLocaleLowerCase()}\u0000${value.toLocaleLowerCase()}`;
    if (!name || !value || propertyKeys.has(key)) return [];
    propertyKeys.add(key);
    return [{ "@type": "PropertyValue", name, value }];
  });
  const description = (product.seoDescription || product.summary).trim();
  const sku = product.sku?.trim();

  const productSchema = {
    "@type": "Product",
    "@id": `${canonicalUrl}#product`,
    url: canonicalUrl,
    name: product.name,
    ...(description ? { description } : {}),
    ...(images.length ? { image: images } : {}),
    ...(sku ? { sku } : {}),
    category: product.categoryLabel,
    ...(additionalProperty.length ? { additionalProperty } : {}),
    mainEntityOfPage: canonicalUrl,
  };

  const breadcrumbEntries = [
    { name: "Home", item: `${siteUrl}/` },
    { name: "Products", item: `${siteUrl}/products` },
    ...categoryTrail.map((category) => ({
      name: category.label,
      item: `${siteUrl}/products/category/${category.slug}`,
    })),
    { name: product.name, item: canonicalUrl },
  ];

  return {
    "@context": "https://schema.org",
    "@graph": [
      productSchema,
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        itemListElement: breadcrumbEntries.map((entry, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: entry.name,
          item: entry.item,
        })),
      },
    ],
  };
}

