import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import {
  syncGlarivoCategoriesFromGarbo,
  verifyGlarivoCategoryAlignment,
} from "../src/lib/glarivo-category-sync";

async function main() {
  const sync = process.argv.includes("--verify-only")
    ? null
    : await syncGlarivoCategoriesFromGarbo();
  const verification = await verifyGlarivoCategoryAlignment();
  if (
    verification.activeTotal !== 56 ||
    verification.topLevel !== 26 ||
    verification.children !== 30 ||
    verification.mappingCount !== 56 ||
    verification.missingSlugs.length ||
    verification.extraSlugs.length ||
    verification.misassignedProducts
  ) {
    throw new Error(`Glarivo category verification failed: ${JSON.stringify(verification)}`);
  }
  console.log(JSON.stringify({ sync, verification }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Glarivo category sync failed.");
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
