import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import {
  publishAllShotGlassCandidatesWithDeferredReview,
  syncAndPublishShotGlassCatalog,
} from "../src/lib/garbo-shot-glass-sync";

function argumentValue(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  const clearProducts = process.argv.includes("--clear-products");
  const skipSync = process.argv.includes("--skip-sync");
  const limitValue = argumentValue("limit");
  const limit = limitValue ? Number.parseInt(limitValue, 10) : undefined;
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 150)) {
    throw new Error("Use --limit=1 through --limit=150.");
  }
  const expectedProductCount = Number.parseInt(argumentValue("confirm-product-count") ?? "", 10);
  const beforeCount = await prisma.product.count();

  if (clearProducts) {
    if (!Number.isInteger(expectedProductCount) || expectedProductCount !== beforeCount) {
      throw new Error(
        `Refusing to clear products: expected confirmation count ${beforeCount}, received ${Number.isNaN(expectedProductCount) ? "none" : expectedProductCount}.`,
      );
    }
    const deleted = await prisma.product.deleteMany();
    console.log(`Cleared ${deleted.count} existing product records. Categories, admins, blogs, and R2 objects were not deleted.`);
  }

  const admin = await prisma.adminUser.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  const result = skipSync
    ? {
        sync: null,
        publish: await publishAllShotGlassCandidatesWithDeferredReview(admin?.id ?? null, { limit }),
      }
    : await syncAndPublishShotGlassCatalog(admin?.id ?? null, { limit });
  const afterCount = await prisma.product.count();
  console.log(JSON.stringify({ beforeCount, clearProducts, afterCount, ...result }, null, 2));
  if ((result.sync?.failed ?? 0) || result.publish.failed) process.exitCode = 2;
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Shot Glass import failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
