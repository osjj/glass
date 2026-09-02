import {
  GARBO_CATEGORY_SNAPSHOT,
  GARBO_CATEGORY_SNAPSHOT_DATE,
} from "@/lib/garbo-category-data";
import { prisma } from "@/lib/prisma";

const GARBO = "GARBO" as const;

export async function syncGarboSourceCategorySnapshot() {
  const syncedAt = new Date();
  const idByPath = new Map<string, string>();
  let created = 0;
  let updated = 0;

  for (const item of GARBO_CATEGORY_SNAPSHOT) {
    const parentId = item.parentPath ? idByPath.get(item.parentPath) : undefined;
    if (item.parentPath && !parentId) {
      throw new Error(`Garbo category parent is missing from the snapshot: ${item.parentPath}`);
    }
    const existing = await prisma.externalSourceCategory.findUnique({
      where: { provider_sourcePath: { provider: GARBO, sourcePath: item.sourcePath } },
      select: { id: true },
    });
    const category = await prisma.externalSourceCategory.upsert({
      where: { provider_sourcePath: { provider: GARBO, sourcePath: item.sourcePath } },
      create: {
        provider: GARBO,
        sourceSlug: item.sourceSlug,
        sourcePath: item.sourcePath,
        sourceUrl: item.sourceUrl,
        sourceName: item.sourceName,
        parentId: parentId ?? null,
        depth: item.depth,
        sortOrder: item.sortOrder,
        isActive: true,
        isImportable: true,
        lastSyncedAt: syncedAt,
      },
      update: {
        sourceSlug: item.sourceSlug,
        sourceUrl: item.sourceUrl,
        sourceName: item.sourceName,
        parentId: parentId ?? null,
        depth: item.depth,
        sortOrder: item.sortOrder,
        isActive: true,
        lastSyncedAt: syncedAt,
      },
      select: { id: true },
    });
    idByPath.set(item.sourcePath, category.id);
    if (existing) updated += 1;
    else created += 1;
  }

  return { total: GARBO_CATEGORY_SNAPSHOT.length, created, updated, snapshotDate: GARBO_CATEGORY_SNAPSHOT_DATE };
}
