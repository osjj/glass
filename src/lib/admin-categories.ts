import "server-only";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import type {
  AdminCategoryEditorData,
  AdminCategoryListItem,
  AdminCategoryParentOption,
} from "@/types/admin-category";

type CategoryTreeRecord = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
};

function flattenCategoryTree<T extends CategoryTreeRecord>(
  categories: T[],
  excludedIds = new Set<string>(),
): Array<T & { label: string; depth: number }> {
  const included = categories.filter((category) => !excludedIds.has(category.id));
  const includedIds = new Set(included.map((category) => category.id));
  const childrenByParent = new Map<string | null, T[]>();

  for (const category of included) {
    const parentId = category.parentId && includedIds.has(category.parentId)
      ? category.parentId
      : null;
    const siblings = childrenByParent.get(parentId) ?? [];
    siblings.push(category);
    childrenByParent.set(parentId, siblings);
  }

  const result: Array<T & { label: string; depth: number }> = [];
  const visited = new Set<string>();
  const visit = (parentId: string | null, depth: number, parentLabel = "") => {
    for (const category of childrenByParent.get(parentId) ?? []) {
      if (visited.has(category.id)) continue;
      visited.add(category.id);
      const label = parentLabel ? `${parentLabel} / ${category.name}` : category.name;
      result.push({ ...category, label, depth });
      visit(category.id, depth + 1, label);
    }
  };

  visit(null, 0);

  // Keep malformed legacy rows visible instead of silently losing them from admin.
  for (const category of included) {
    if (visited.has(category.id)) continue;
    visited.add(category.id);
    result.push({ ...category, label: category.name, depth: 0 });
  }

  return result;
}

function collectDescendantIds(categories: CategoryTreeRecord[], categoryId: string) {
  const childrenByParent = new Map<string, string[]>();
  for (const category of categories) {
    if (!category.parentId) continue;
    const children = childrenByParent.get(category.parentId) ?? [];
    children.push(category.id);
    childrenByParent.set(category.parentId, children);
  }

  const descendants = new Set<string>([categoryId]);
  const pending = [categoryId];
  while (pending.length) {
    const parentId = pending.pop();
    if (!parentId) continue;
    for (const childId of childrenByParent.get(parentId) ?? []) {
      if (descendants.has(childId)) continue;
      descendants.add(childId);
      pending.push(childId);
    }
  }
  return descendants;
}

export async function getAdminCategoryTree(): Promise<AdminCategoryListItem[]> {
  await requireAdmin();
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      sortOrder: true,
      isActive: true,
      parent: { select: { name: true } },
      _count: { select: { productLinks: true, children: true, externalMappings: true } },
    },
  });

  return flattenCategoryTree(categories).map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    parentId: category.parentId,
    parentName: category.parent?.name ?? null,
    label: category.label,
    depth: category.depth,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    productCount: category._count.productLinks,
    childCount: category._count.children,
    mappingCount: category._count.externalMappings,
  }));
}

export async function getAdminCategoryEditorData(
  categoryId?: string,
): Promise<AdminCategoryEditorData> {
  await requireAdmin();
  const [categories, category] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        sortOrder: true,
        isActive: true,
      },
    }),
    categoryId
      ? prisma.category.findUnique({
          where: { id: categoryId },
          select: {
            id: true,
            name: true,
            slug: true,
            parentId: true,
            sortOrder: true,
            isActive: true,
            _count: {
              select: { productLinks: true, children: true, externalMappings: true },
            },
            externalMappings: {
              orderBy: [{ provider: "asc" }, { sourcePath: "asc" }],
              select: {
                id: true,
                provider: true,
                sourceName: true,
                sourcePath: true,
              },
            },
            productLinks: {
              orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
              take: 12,
              select: {
                isPrimary: true,
                product: { select: { id: true, name: true, status: true } },
              },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  const excludedIds = categoryId
    ? collectDescendantIds(categories, categoryId)
    : new Set<string>();
  const parentOptions: AdminCategoryParentOption[] = flattenCategoryTree(
    categories,
    excludedIds,
  ).map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    label: item.label,
    depth: item.depth,
    isActive: item.isActive,
  }));

  return {
    parentOptions,
    category: category
      ? {
          id: category.id,
          name: category.name,
          slug: category.slug,
          parentId: category.parentId,
          sortOrder: category.sortOrder,
          isActive: category.isActive,
          productCount: category._count.productLinks,
          childCount: category._count.children,
          mappingCount: category._count.externalMappings,
          mappings: category.externalMappings.map((mapping) => ({
            ...mapping,
            provider: mapping.provider,
          })),
          linkedProducts: category.productLinks.map((link) => ({
            id: link.product.id,
            name: link.product.name,
            status: link.product.status,
            isPrimary: link.isPrimary,
          })),
        }
      : null,
  };
}
