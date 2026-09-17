import "server-only";

import { articleProductSelections } from "@/data/article-products";
import { prisma } from "@/lib/prisma";
import { articleProductFacts } from "@/lib/article-product-facts";

export async function getArticleProducts(articleSlug: string) {
  const selections = articleProductSelections[articleSlug];
  if (!selections) return [];
  const products = await prisma.product.findMany({
    where: { slug: { in: selections.map((item) => item.slug) }, status: "PUBLISHED" },
    select: {
      slug: true, name: true, sku: true,
      images: { where: { role: "GALLERY", reviewStatus: "VERIFIED", rightsStatus: "AUTHORIZED" }, orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
      overviewFields: { where: { reviewStatus: "VERIFIED" }, orderBy: { sortOrder: "asc" }, select: { label: true, value: true } },
      specifications: { where: { reviewStatus: "VERIFIED", variantId: null, componentId: null }, orderBy: { sortOrder: "asc" }, select: { label: true, value: true, unit: true } },
    },
  });
  return selections.flatMap((selection) => {
    const product = products.find((item) => item.slug === selection.slug);
    if (!product || !product.images[0]) return [];
    return [{ ...selection, name: product.name, sku: product.sku, image: product.images[0], facts: articleProductFacts([...product.specifications, ...product.overviewFields]) }];
  });
}
