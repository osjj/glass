import { prisma } from "@/lib/prisma";
import { SUNWIN_BASE_URL, SUNWIN_CATEGORIES } from "@/lib/sunwin";

export const COSMETIC_CATEGORY = { name: "Cosmetic Glass Packaging", slug: "cosmetic-glass-packaging" };

export async function syncSunwinCategories() {
  return prisma.$transaction(async (tx) => {
    const highest = await tx.category.aggregate({ _max: { sortOrder: true }, where: { parentId: null } });
    const parent = await tx.category.upsert({
      where: { slug: COSMETIC_CATEGORY.slug },
      create: { ...COSMETIC_CATEGORY, sortOrder: (highest._max.sortOrder ?? 0) + 10, isActive: true },
      update: {},
    });
    if (parent.parentId || !parent.isActive) throw new Error("The cosmetic category exists with an incompatible parent or inactive state.");
    const children = [];
    for (const [index, item] of SUNWIN_CATEGORIES.entries()) {
      const sourcePath = `/product_category/${item.id}.html`;
      const child = await tx.category.upsert({
        where: { slug: item.slug },
        create: { name: item.name, slug: item.slug, parentId: parent.id, sortOrder: index * 10, isActive: true },
        update: {},
      });
      if (child.parentId !== parent.id || !child.isActive) throw new Error(`Existing category conflicts with ${item.slug}; no categories changed.`);
      const existingMapping = await tx.externalCategoryMapping.findUnique({ where: { provider_sourcePath: { provider: "SUNWIN", sourcePath } } });
      if (existingMapping && existingMapping.categoryId !== child.id) throw new Error(`Sunwin mapping conflict: ${sourcePath}`);
      await tx.externalCategoryMapping.upsert({
        where: { provider_sourcePath: { provider: "SUNWIN", sourcePath } },
        create: { provider: "SUNWIN", sourceSlug: item.slug, sourcePath, sourceName: item.sourceName, categoryId: child.id }, update: {},
      });
      await tx.externalSourceCategory.upsert({
        where: { provider_sourcePath: { provider: "SUNWIN", sourcePath } },
        create: { provider: "SUNWIN", sourceSlug: item.slug, sourcePath, sourceUrl: `${SUNWIN_BASE_URL}${sourcePath}`, sourceName: item.name,
          sortOrder: index * 10, isActive: true, isImportable: true, lastSyncedAt: new Date() }, update: {},
      });
      children.push({ id: child.id, name: child.name, slug: child.slug, parentId: child.parentId, sourcePath });
    }
    return { parent: { id: parent.id, name: parent.name, slug: parent.slug }, children };
  }, { timeout: 20_000 });
}
