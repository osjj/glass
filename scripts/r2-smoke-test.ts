import { readFile } from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { uploadImageToR2, verifyR2Object } from "../src/lib/r2";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ path: ".env", quiet: true, override: false });

const assets = [
  {
    source: "public/images/home/category-drinkware.webp",
    key: "site/products/clear-ribbed-tumbler-collection/cover-v1.webp",
  },
  {
    source: "public/images/home/hero-glassware.webp",
    key: "site/blog/how-to-build-a-clear-glassware-shortlist/cover-v1.webp",
  },
] as const;

async function retry<T>(label: string, operation: () => Promise<T>) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 750));
      }
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`${label} failed after three attempts: ${message}`, { cause: lastError });
}

async function main() {
  const uploadedUrls: string[] = [];

  for (const asset of assets) {
    const data = await readFile(path.resolve(asset.source));
    const uploaded = await retry(`Upload ${asset.key}`, () =>
      uploadImageToR2({ data, key: asset.key }),
    );
    const stored = await retry(`Verify ${asset.key}`, () => verifyR2Object(asset.key));
    const response = await retry(`Fetch ${uploaded.url}`, () =>
      fetch(uploaded.url, { method: "HEAD", cache: "no-store" }),
    );

    if (!response.ok || response.headers.get("content-type") !== "image/webp") {
      throw new Error(
        `Public verification failed for ${asset.key}: ${response.status} ${response.headers.get("content-type")}`,
      );
    }

    if (stored.contentType !== "image/webp" || stored.size !== uploaded.size) {
      throw new Error(`R2 metadata verification failed for ${asset.key}`);
    }

    uploadedUrls.push(uploaded.url);
  }

  console.log(JSON.stringify({ ok: true, uploadedUrls }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
