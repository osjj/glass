import "server-only";

import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { productCategories } from "@/data/catalog";
import { hasRenderableStoredContent } from "@/lib/article-content-server";
import { prisma } from "@/lib/prisma";

const publicProductInclude = {
  images: { orderBy: { sortOrder: "asc" } },
  attributes: { orderBy: { sortOrder: "asc" } },
  specifications: { orderBy: { sortOrder: "asc" } },
  features: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.ProductInclude;

type PublicProductRecord = Prisma.ProductGetPayload<{
  include: typeof publicProductInclude;
}>;

export type PublicProduct = {
  id: string;
  slug: string;
  sku: string | null;
  name: string;
  category: string;
  categoryLabel: string;
  summary: string;
  description: string;
  content: string;
  hasRichContent: boolean;
  price: number;
  comparePrice: number | null;
  currency: string;
  moq: number;
  unit: string;
  featured: boolean;
  images: Array<{ url: string; alt: string }>;
  primaryImage: string;
  primaryImageAlt: string;
  attributes: Array<{ label: string; value: string }>;
  specifications: Array<{ label: string; value: string }>;
  features: string[];
  updatedAt: Date;
};

function serializeProduct(product: PublicProductRecord): PublicProduct {
  const category = productCategories.find((item) => item.slug === product.category);
  const primaryImage = product.images[0];

  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    name: product.name,
    category: product.category,
    categoryLabel: category?.label ?? product.category,
    summary: product.summary,
    description: product.description,
    content: product.content,
    hasRichContent: hasRenderableStoredContent(product.content),
    price: Number(product.price),
    comparePrice: product.comparePrice === null ? null : Number(product.comparePrice),
    currency: product.currency,
    moq: product.moq,
    unit: product.unit,
    featured: product.featured,
    images: product.images.map(({ url, alt }) => ({ url, alt })),
    primaryImage: primaryImage?.url ?? category?.image ?? "/images/home/category-drinkware.webp",
    primaryImageAlt: primaryImage?.alt || product.name,
    attributes: product.attributes.map(({ label, value }) => ({ label, value })),
    specifications: product.specifications.map(({ label, value }) => ({ label, value })),
    features: product.features.map(({ value }) => value),
    updatedAt: product.updatedAt,
  };
}

export const getPublishedProducts = cache(async (): Promise<PublicProduct[]> => {
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
    include: publicProductInclude,
  });

  return products.map(serializeProduct);
});

export const getPublishedProductBySlug = cache(
  async (slug: string): Promise<PublicProduct | null> => {
    const product = await prisma.product.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: publicProductInclude,
    });

    return product ? serializeProduct(product) : null;
  },
);

export async function getPublishedProductSitemapEntries() {
  return prisma.product.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    select: { slug: true, updatedAt: true },
  });
}
