import "server-only";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const importStatuses = [
  "PENDING",
  "IN_REVIEW",
  "APPROVED",
  "IMPORTED",
  "REJECTED",
  "ERROR",
] as const;

export type ImportStatusFilter = (typeof importStatuses)[number];

export function parseImportStatus(value: string | undefined): ImportStatusFilter | undefined {
  return importStatuses.find((status) => status === value);
}

function warningList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").slice(0, 50);
}

function payloadKeys(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.keys(value).slice(0, 100);
}

export async function getImportCandidates(
  status?: ImportStatusFilter,
  sourceCategoryPath?: string,
  limit = 100,
) {
  await requireAdmin();
  const where = {
    ...(status ? { status } : {}),
    ...(sourceCategoryPath ? { sourceCategoryPath } : {}),
  };
  const [candidates, grouped] = await Promise.all([
    prisma.productImportCandidate.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { sourceTitle: "asc" }],
      take: Math.min(Math.max(limit, 1), 500),
      select: {
        id: true,
        provider: true,
        sourceUrl: true,
        sourceCategorySlug: true,
        sourceCategoryPath: true,
        sourceTitle: true,
        sourceSku: true,
        conflictCount: true,
        warningCount: true,
        fetchedAt: true,
        status: true,
        updatedAt: true,
        product: { select: { id: true, slug: true, name: true } },
        _count: { select: { fields: true } },
      },
    }),
    prisma.productImportCandidate.groupBy({
      by: ["status"],
      where: sourceCategoryPath ? { sourceCategoryPath } : undefined,
      _count: { _all: true },
    }),
  ]);

  const counts = Object.fromEntries(importStatuses.map((item) => [item, 0])) as Record<
    ImportStatusFilter,
    number
  >;
  for (const group of grouped) counts[group.status] = group._count._all;

  return { candidates, counts };
}

type CategoryOptionRecord = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  isActive: boolean;
};

function categoryOptionLabels(categories: CategoryOptionRecord[]) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const labelFor = (category: CategoryOptionRecord) => {
    const names = [category.name];
    const visited = new Set([category.id]);
    let parentId = category.parentId;
    while (parentId) {
      if (visited.has(parentId)) break;
      visited.add(parentId);
      const parent = byId.get(parentId);
      if (!parent) break;
      names.unshift(parent.name);
      parentId = parent.parentId;
    }
    return names.join(" / ");
  };
  return categories
    .filter((category) => category.isActive)
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      label: labelFor(category),
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

export async function getGarboImportSetup() {
  await requireAdmin();
  const [categories, sourceCategories, mappings, candidateCounts] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, parentId: true, isActive: true },
    }),
    prisma.externalSourceCategory.findMany({
      where: { provider: "GARBO", isActive: true, isImportable: true },
      orderBy: [{ sortOrder: "asc" }, { sourceName: "asc" }],
      select: {
        id: true,
        sourceName: true,
        sourcePath: true,
        sourceUrl: true,
        depth: true,
        productCount: true,
        pageCount: true,
        parent: { select: { sourceName: true } },
      },
    }),
    prisma.externalCategoryMapping.findMany({
      where: { provider: "GARBO" },
      orderBy: [{ sourcePath: "asc" }],
      select: {
        id: true,
        sourceName: true,
        sourcePath: true,
        categoryId: true,
        category: { select: { name: true, slug: true, isActive: true } },
      },
    }),
    prisma.productImportCandidate.groupBy({
      by: ["sourceCategoryPath"],
      where: { provider: "GARBO" },
      _count: { _all: true },
    }),
  ]);
  const countByPath = new Map(
    candidateCounts.map((item) => [item.sourceCategoryPath, item._count._all]),
  );
  return {
    categoryOptions: categoryOptionLabels(categories),
    sourceCategoryOptions: sourceCategories.map((category) => ({
      ...category,
      label: category.parent
        ? `${category.parent.sourceName} / ${category.sourceName}`
        : category.sourceName,
      candidateCount: countByPath.get(category.sourcePath) ?? 0,
    })),
    mappings: mappings.map((mapping) => ({
      ...mapping,
      sourceUrl: `https://www.garboglass.com${mapping.sourcePath}`,
      candidateCount: countByPath.get(mapping.sourcePath) ?? 0,
    })),
  };
}

export async function getImportCandidate(candidateId: string) {
  await requireAdmin();
  const candidate = await prisma.productImportCandidate.findUnique({
    where: { id: candidateId },
    select: {
      id: true,
      provider: true,
      sourceUrl: true,
      sourceCategorySlug: true,
      sourceCategoryPath: true,
      sourceTitle: true,
      sourceSku: true,
      rawPayload: true,
      warnings: true,
      sourceHash: true,
      conflictCount: true,
      warningCount: true,
      fetchedAt: true,
      sourceLastModifiedAt: true,
      status: true,
      reviewNotes: true,
      reviewedAt: true,
      createdAt: true,
      updatedAt: true,
      reviewer: { select: { id: true, name: true, email: true } },
      product: { select: { id: true, name: true, slug: true } },
      fields: {
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
        select: {
          id: true,
          fieldKey: true,
          label: true,
          rawValue: true,
          normalizedValue: true,
          unit: true,
          status: true,
          note: true,
          sortOrder: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!candidate) return null;
  const { rawPayload, warnings, ...safeCandidate } = candidate;
  return {
    ...safeCandidate,
    warnings: warningList(warnings),
    rawPayloadKeys: payloadKeys(rawPayload),
  };
}
