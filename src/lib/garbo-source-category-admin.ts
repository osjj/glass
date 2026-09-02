import "server-only";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function getGarboSourceCategoryAdminList() {
  await requireAdmin();
  const [categories, mappings, candidateCounts] = await Promise.all([
    prisma.externalSourceCategory.findMany({
      where: { provider: "GARBO" },
      orderBy: [{ sortOrder: "asc" }, { sourceName: "asc" }],
      select: {
        id: true,
        sourceName: true,
        sourceSlug: true,
        sourcePath: true,
        sourceUrl: true,
        depth: true,
        sortOrder: true,
        isActive: true,
        isImportable: true,
        productCount: true,
        pageCount: true,
        lastSyncedAt: true,
        lastScannedAt: true,
        parent: { select: { sourceName: true } },
      },
    }),
    prisma.externalCategoryMapping.findMany({
      where: { provider: "GARBO" },
      select: { sourcePath: true, category: { select: { id: true, name: true, slug: true } } },
    }),
    prisma.productImportCandidate.groupBy({
      by: ["sourceCategoryPath"],
      where: { provider: "GARBO" },
      _count: { _all: true },
    }),
  ]);
  const mappingByPath = new Map(mappings.map((item) => [item.sourcePath, item.category]));
  const candidatesByPath = new Map(candidateCounts.map((item) => [item.sourceCategoryPath, item._count._all]));
  return categories.map((category) => ({
    ...category,
    mapping: mappingByPath.get(category.sourcePath) ?? null,
    candidateCount: candidatesByPath.get(category.sourcePath) ?? 0,
  }));
}
