import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import { GARBO_CATEGORY_SNAPSHOT } from "../src/lib/garbo-category-data";
import { syncGarboSourceCategorySnapshot } from "../src/lib/garbo-source-categories";

async function main() {
  const sync = process.argv.includes("--verify-only")
    ? null
    : await syncGarboSourceCategorySnapshot();
  const [total, topLevel, children, shotGlass] = await Promise.all([
    prisma.externalSourceCategory.count({ where: { provider: "GARBO" } }),
    prisma.externalSourceCategory.count({ where: { provider: "GARBO", parentId: null } }),
    prisma.externalSourceCategory.count({ where: { provider: "GARBO", parentId: { not: null } } }),
    prisma.externalSourceCategory.findUnique({
      where: { provider_sourcePath: { provider: "GARBO", sourcePath: "/shot-glass/" } },
      select: { sourceName: true, sourceUrl: true, isActive: true, isImportable: true },
    }),
  ]);
  if (total !== GARBO_CATEGORY_SNAPSHOT.length || !shotGlass) {
    throw new Error(`Garbo category verification failed: expected ${GARBO_CATEGORY_SNAPSHOT.length}, found ${total}.`);
  }
  console.log(JSON.stringify({ sync, database: { total, topLevel, children, shotGlass } }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Garbo category sync failed.");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
