import "server-only";

import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { productCategories } from "@/data/catalog";
import { hasRenderableStoredContent } from "@/lib/article-content-server";
import { prisma } from "@/lib/prisma";

const publicProductInclude = {
  images: { where: { role: "GALLERY" as const }, orderBy: { sortOrder: "asc" as const } },
  attributes: { orderBy: { sortOrder: "asc" } },
  overviewFields: { orderBy: { sortOrder: "asc" } },
  specifications: {
    where: { variantId: null, componentId: null },
    orderBy: { sortOrder: "asc" },
  },
  contentSections: {
    orderBy: { sortOrder: "asc" },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  },
  features: { orderBy: { sortOrder: "asc" } },
  categories: {
    orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
    take: 1,
    include: { category: true },
  },
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
  categoryHeroImage: string;
  summary: string;
  description: string;
  content: string;
  hasRichContent: boolean;
  sourceUrl: string | null;
  detailsHeading: string;
  specificationHeading: string;
  pricingMode: "REQUEST_QUOTE" | "FIXED" | "TIERED";
  price: number | null;
  comparePrice: number | null;
  currency: string;
  moq: number | null;
  unit: string | null;
  featured: boolean;
  images: Array<{ url: string; alt: string; width: number | null; height: number | null }>;
  overviewFields: Array<{ label: string; value: string }>;
  contentSections: Array<{
    sourceKey: string;
    title: string;
    body: string;
    images: Array<{ url: string; alt: string; width: number | null; height: number | null }>;
  }>;
  primaryImage: string;
  primaryImageAlt: string;
  attributes: Array<{ label: string; value: string }>;
  specifications: Array<{ label: string; value: string }>;
  features: string[];
  updatedAt: Date;
};

function serializeProduct(product: PublicProductRecord): PublicProduct {
  const normalizedCategory = product.categories[0]?.category;
  const categorySlug = normalizedCategory?.slug ?? product.legacyCategory;
  const fallbackCategory = productCategories.find((item) => item.slug === categorySlug);
  const primaryImage = product.images[0];
  const overviewPriority = ["material", "package", "usage", "capacity", "product_size"];
  const legacyOverview = [...product.attributes, ...product.specifications]
    .filter((field) => field.key && overviewPriority.includes(field.key))
    .sort(
      (left, right) =>
        overviewPriority.indexOf(left.key ?? "") - overviewPriority.indexOf(right.key ?? ""),
    )
    .map(({ label, value }) => ({ label, value }));

  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    name: product.name,
    category: categorySlug,
    categoryLabel: normalizedCategory?.name ?? fallbackCategory?.label ?? categorySlug,
    categoryHeroImage: fallbackCategory?.image ?? "/images/home/category-drinkware.webp",
    summary: product.summary,
    description: product.description,
    content: product.content,
    hasRichContent: hasRenderableStoredContent(product.content),
    sourceUrl: product.sourceUrl,
    detailsHeading: product.detailsHeading,
    specificationHeading: product.specificationHeading,
    pricingMode: product.pricingMode,
    price: product.price === null ? null : Number(product.price),
    comparePrice: product.comparePrice === null ? null : Number(product.comparePrice),
    currency: product.currency,
    moq: product.moq,
    unit: product.unit,
    featured: product.featured,
    images: product.images.map(({ url, alt, width, height }) => ({ url, alt, width, height })),
    overviewFields: product.overviewFields.length
      ? product.overviewFields.map(({ label, value }) => ({ label, value }))
      : legacyOverview,
    contentSections: product.contentSections.map((section) => ({
      sourceKey: section.sourceKey,
      title: section.title,
      body: section.body,
      images: section.images.map(({ url, alt, width, height }) => ({ url, alt, width, height })),
    })),
    primaryImage: primaryImage?.url ?? fallbackCategory?.image ?? "/images/home/category-drinkware.webp",
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

export type PublicCategory = {
  id: string;
  slug: string;
  label: string;
  parentId: string | null;
  depth: number;
  sortOrder: number;
  directProductCount: number;
  productCount: number;
  image: string;
  children: PublicCategory[];
};

const fallbackCategoryImages = productCategories.map((category) => category.image);

export function flattenPublicCategoryTree(categories: PublicCategory[]): PublicCategory[] {
  return categories.flatMap((category) => [category, ...flattenPublicCategoryTree(category.children)]);
}

export const getPublicCategoryTree = cache(async (): Promise<PublicCategory[]> => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      parentId: true,
      sortOrder: true,
      _count: {
        select: {
          productLinks: { where: { product: { status: "PUBLISHED" } } },
        },
      },
      productLinks: {
        where: { product: { status: "PUBLISHED" } },
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        take: 1,
        select: {
          product: {
            select: {
              images: {
                where: { role: "GALLERY" },
                orderBy: { sortOrder: "asc" },
                take: 1,
                select: { url: true },
              },
            },
          },
        },
      },
    },
  });

  type MutableCategory = Omit<PublicCategory, "productCount" | "image" | "children"> & {
    directImage: string | null;
    children: MutableCategory[];
  };
  const nodes = new Map<string, MutableCategory>();
  for (const category of categories) {
    nodes.set(category.id, {
      id: category.id,
      slug: category.slug,
      label: category.name,
      parentId: category.parentId,
      depth: 0,
      sortOrder: category.sortOrder,
      directProductCount: category._count.productLinks,
      directImage: category.productLinks[0]?.product.images[0]?.url ?? null,
      children: [],
    });
  }

  const roots: MutableCategory[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const byOrder = (left: MutableCategory, right: MutableCategory) =>
    left.sortOrder - right.sortOrder || left.label.localeCompare(right.label);
  roots.sort(byOrder);
  for (const node of nodes.values()) node.children.sort(byOrder);

  let fallbackIndex = 0;
  const finalize = (node: MutableCategory, depth: number): PublicCategory => {
    const children = node.children.map((child) => finalize(child, depth + 1));
    const productCount = node.directProductCount + children.reduce((total, child) => total + child.productCount, 0);
    const productChildImage = children.find((child) => child.productCount > 0)?.image;
    const image = node.directImage ?? productChildImage ?? fallbackCategoryImages[fallbackIndex++ % fallbackCategoryImages.length];
    return {
      id: node.id,
      slug: node.slug,
      label: node.label,
      parentId: node.parentId,
      depth,
      sortOrder: node.sortOrder,
      directProductCount: node.directProductCount,
      productCount,
      image,
      children,
    };
  };
  return roots.map((root) => finalize(root, 0));
});

export const getPublicCategories = cache(async (): Promise<PublicCategory[]> =>
  flattenPublicCategoryTree(await getPublicCategoryTree()),
);

export const getPublicCategoryPage = cache(async (slug: string) => {
  const [categoryTree, products] = await Promise.all([
    getPublicCategoryTree(),
    getPublishedProducts(),
  ]);
  const categories = flattenPublicCategoryTree(categoryTree);
  const category = categories.find((item) => item.slug === slug);
  if (!category) return null;
  const descendantSlugs = new Set(
    flattenPublicCategoryTree([category]).map((item) => item.slug),
  );
  const byId = new Map(categories.map((item) => [item.id, item]));
  const breadcrumbs: PublicCategory[] = [];
  const visited = new Set<string>();
  let current: PublicCategory | undefined = category;
  while (current && !visited.has(current.id)) {
    breadcrumbs.unshift(current);
    visited.add(current.id);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return {
    category,
    breadcrumbs,
    products: products.filter((product) => descendantSlugs.has(product.category)),
  };
});

export async function getPublicCategorySitemapEntries() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { slug: true, updatedAt: true },
  });
}

export async function getPublishedProductSitemapEntries() {
  return prisma.product.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    select: { slug: true, updatedAt: true },
  });
}
