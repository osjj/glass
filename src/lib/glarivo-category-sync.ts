import { GARBO_CATEGORY_SNAPSHOT } from "@/lib/garbo-category-data";
import { prisma } from "@/lib/prisma";

const GARBO = "GARBO" as const;
const LEGACY_CATEGORY_SLUGS = [
  "drinkware",
  "tableware",
  "serveware",
  "storage",
  "bakeware",
] as const;

export async function syncGlarivoCategoriesFromGarbo() {
  const categoryIdByPath = new Map<string, string>();
  const categorySlugByPath = new Map<string, string>();
  let created = 0;
  let updated = 0;
  let mapped = 0;

  for (const item of GARBO_CATEGORY_SNAPSHOT) {
    const parentId = item.parentPath ? categoryIdByPath.get(item.parentPath) : undefined;
    if (item.parentPath && !parentId) {
      throw new Error(`Glarivo category parent is missing from the snapshot: ${item.parentPath}`);
    }
    const existing = await prisma.category.findUnique({
      where: { slug: item.sourceSlug },
      select: { id: true },
    });
    const category = await prisma.category.upsert({
      where: { slug: item.sourceSlug },
      create: {
        name: item.sourceName,
        slug: item.sourceSlug,
        parentId: parentId ?? null,
        sortOrder: item.sortOrder,
        isActive: true,
      },
      update: {
        name: item.sourceName,
        parentId: parentId ?? null,
        sortOrder: item.sortOrder,
        isActive: true,
      },
      select: { id: true },
    });
    categoryIdByPath.set(item.sourcePath, category.id);
    categorySlugByPath.set(item.sourcePath, item.sourceSlug);
    if (existing) updated += 1;
    else created += 1;

    await prisma.externalCategoryMapping.upsert({
      where: { provider_sourcePath: { provider: GARBO, sourcePath: item.sourcePath } },
      create: {
        provider: GARBO,
        sourceSlug: item.sourceSlug,
        sourcePath: item.sourcePath,
        sourceName: item.sourceName,
        categoryId: category.id,
      },
      update: {
        sourceSlug: item.sourceSlug,
        sourceName: item.sourceName,
        categoryId: category.id,
      },
    });
    mapped += 1;
  }

  const sourcedProducts = await prisma.product.findMany({
    where: { sourceProvider: GARBO, sourceCategoryPath: { not: null } },
    select: {
      id: true,
      sourceCategoryPath: true,
      categories: { where: { isPrimary: true }, select: { categoryId: true } },
    },
  });
  let reassignedProducts = 0;
  for (const product of sourcedProducts) {
    if (!product.sourceCategoryPath) continue;
    const categoryId = categoryIdByPath.get(product.sourceCategoryPath);
    const categorySlug = categorySlugByPath.get(product.sourceCategoryPath);
    if (!categoryId || !categorySlug) continue;
    const currentPrimaryId = product.categories[0]?.categoryId;
    await prisma.$transaction([
      prisma.productCategory.updateMany({
        where: { productId: product.id, isPrimary: true, categoryId: { not: categoryId } },
        data: { isPrimary: false },
      }),
      prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: product.id, categoryId } },
        create: { productId: product.id, categoryId, isPrimary: true, sortOrder: 0 },
        update: { isPrimary: true, sortOrder: 0 },
      }),
      prisma.product.update({
        where: { id: product.id },
        data: { legacyCategory: categorySlug },
      }),
    ]);
    if (currentPrimaryId !== categoryId) reassignedProducts += 1;
  }

  const retainedLegacyCategories: string[] = [];
  let deactivatedLegacyCategories = 0;
  for (const slug of LEGACY_CATEGORY_SLUGS) {
    const legacy = await prisma.category.findUnique({
      where: { slug },
      select: {
        id: true,
        isActive: true,
        _count: { select: { children: true, productLinks: true, externalMappings: true } },
      },
    });
    if (!legacy) continue;
    if (
      legacy._count.children > 0 ||
      legacy._count.productLinks > 0 ||
      legacy._count.externalMappings > 0
    ) {
      retainedLegacyCategories.push(slug);
      continue;
    }
    if (legacy.isActive) {
      await prisma.category.update({ where: { id: legacy.id }, data: { isActive: false } });
      deactivatedLegacyCategories += 1;
    }
  }

  return {
    total: GARBO_CATEGORY_SNAPSHOT.length,
    created,
    updated,
    mapped,
    reassignedProducts,
    deactivatedLegacyCategories,
    retainedLegacyCategories,
  };
}

export async function verifyGlarivoCategoryAlignment() {
  const snapshotSlugs = new Set(GARBO_CATEGORY_SNAPSHOT.map((item) => item.sourceSlug));
  const [activeCategories, mappingCount, sourcedProducts] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, parentId: true },
    }),
    prisma.externalCategoryMapping.count({ where: { provider: GARBO } }),
    prisma.product.findMany({
      where: { sourceProvider: GARBO, sourceCategoryPath: { not: null } },
      select: {
        sourceCategoryPath: true,
        categories: {
          where: { isPrimary: true },
          select: { category: { select: { slug: true } } },
        },
      },
    }),
  ]);
  const activeSlugs = new Set(activeCategories.map((category) => category.slug));
  const missingSlugs = [...snapshotSlugs].filter((slug) => !activeSlugs.has(slug));
  const extraSlugs = [...activeSlugs].filter((slug) => !snapshotSlugs.has(slug));
  const sourceSlugByPath = new Map(
    GARBO_CATEGORY_SNAPSHOT.map((item) => [item.sourcePath, item.sourceSlug]),
  );
  const misassignedProducts = sourcedProducts.filter((product) => {
    const expected = product.sourceCategoryPath
      ? sourceSlugByPath.get(product.sourceCategoryPath)
      : undefined;
    return expected && product.categories[0]?.category.slug !== expected;
  }).length;
  return {
    activeTotal: activeCategories.length,
    topLevel: activeCategories.filter((category) => !category.parentId).length,
    children: activeCategories.filter((category) => category.parentId).length,
    mappingCount,
    missingSlugs,
    extraSlugs,
    sourcedProductCount: sourcedProducts.length,
    misassignedProducts,
  };
}
