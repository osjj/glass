import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { COSMETIC_CATEGORY, syncSunwinCategories } from "../src/lib/sunwin-categories";

async function main() {
  if (process.argv.includes("--apply")) console.log(JSON.stringify(await syncSunwinCategories(), null, 2));
  const parent = await prisma.category.findUnique({
    where: { slug: COSMETIC_CATEGORY.slug },
    include: { children: { include: { externalMappings: true }, orderBy: { sortOrder: "asc" } } },
  });
  console.log(JSON.stringify({ category: parent, sourceCategories: await prisma.externalSourceCategory.findMany({ where: { provider: "SUNWIN" } }) }, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Sunwin category setup failed"); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
