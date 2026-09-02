import {
  discoverShotGlassProductUrls,
  fetchAndParseGarboShotGlassProduct,
} from "../src/lib/garbo-shot-glass";

function parseLimit() {
  const argument = process.argv.find((item) => item.startsWith("--limit="));
  const value = Number.parseInt(argument?.split("=")[1] ?? "3", 10);
  if (!Number.isInteger(value) || value < 1 || value > 20) {
    throw new Error("Use --limit=1 through --limit=20 for this read-only dry run.");
  }
  return value;
}

function parseOffset() {
  const argument = process.argv.find((item) => item.startsWith("--offset="));
  const value = Number.parseInt(argument?.split("=")[1] ?? "0", 10);
  if (!Number.isInteger(value) || value < 0 || value > 149) {
    throw new Error("Use --offset=0 through --offset=149 for this read-only dry run.");
  }
  return value;
}

async function main() {
  const limit = parseLimit();
  const offset = parseOffset();
  const discovery = await discoverShotGlassProductUrls();
  if (!discovery.productUrls.length) throw new Error("No Shot Glass product URLs were discovered.");

  const parsed = [];
  for (const sourceUrl of discovery.productUrls.slice(offset, offset + limit)) {
    parsed.push(await fetchAndParseGarboShotGlassProduct(sourceUrl));
  }

  for (const candidate of parsed) {
    if (!candidate.sourceTitle || !candidate.normalizedPayload.slug || candidate.fields.length < 3) {
      throw new Error(`Parser produced an incomplete candidate for ${candidate.sourceUrl}.`);
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: "read-only-dry-run",
        categoryPages: discovery.categoryPages.length,
        discoveredProducts: discovery.productUrls.length,
        offset,
        parsedProducts: parsed.map((candidate) => ({
          sourceUrl: candidate.sourceUrl,
          title: candidate.sourceTitle,
          itemNo: candidate.sourceSku,
          slug: candidate.normalizedPayload.slug,
          fieldCount: candidate.fields.length,
          conflictCount: candidate.conflictCount,
          warningCount: candidate.warnings.length,
          galleryImageCount: candidate.normalizedPayload.galleryImages.length,
          detailImageCount: candidate.normalizedPayload.detailImages.length,
          fields: candidate.fields.map((field) => ({
            key: field.fieldKey,
            status: field.status,
            value: field.normalizedValue,
            unit: field.unit,
          })),
        })),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
