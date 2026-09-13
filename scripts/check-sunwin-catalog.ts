import { mkdir, writeFile } from "node:fs/promises";
import { discoverSunwinProductUrls, fetchAndParseSunwinProduct, parseSunwinCategorySource, SUNWIN_BASE_URL, SUNWIN_CATEGORIES } from "../src/lib/sunwin";
import { garboNormalizedProductSchema } from "../src/lib/garbo-shot-glass";

async function main() {
  const report = [];
  for (const item of SUNWIN_CATEGORIES) {
    const source = parseSunwinCategorySource(`${SUNWIN_BASE_URL}/product_category/${item.id}.html`);
    const discovery = await discoverSunwinProductUrls(source);
    const sample = await fetchAndParseSunwinProduct(discovery.productUrls[0], source);
    garboNormalizedProductSchema.parse(sample.normalizedPayload);
    report.push({ category: item.name, source: source.url, pages: discovery.categoryPages.length, products: discovery.productUrls.length,
      sample: { url: sample.sourceUrl, name: sample.normalizedPayload.name, fields: sample.fields, images: sample.normalizedPayload.galleryImages.length, warnings: sample.warnings } });
  }
  await mkdir("output/sunwin", { recursive: true });
  await writeFile("output/sunwin/source-check.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Source check failed"); process.exitCode = 1; });
