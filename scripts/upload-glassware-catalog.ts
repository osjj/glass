import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ path: ".env", quiet: true, override: false });

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value || value === "CHANGE_ME") throw new Error(`Missing ${name}`);
  return value;
}

const hash = (data: Uint8Array) => createHash("sha256").update(data).digest("hex");

async function main() {
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${required("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: required("R2_ACCESS_KEY_ID"),
      secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
    },
  });
  const Bucket = required("R2_BUCKET_NAME");
  const publicBase = required("R2_PUBLIC_URL").replace(/\/+$/, "");
  // Existing verified asset: establish signed read access before writing anything.
  const known = await client.send(new GetObjectCommand({
    Bucket,
    Key: "site/blog/essential-cocktail-glass-types-bars-restaurants-revision-20260913/hero-ae1b775eee12.webp",
  }));
  const knownBytes = await known.Body?.transformToByteArray();
  if (!knownBytes?.length || known.ContentType !== "image/webp") throw new Error("Signed R2 preflight failed");
  const data = await readFile("output/pdf/Glarivo-Glassware-Catalog-2026-Restored.pdf");
  if (data.subarray(0, 5).toString() !== "%PDF-") throw new Error("Invalid PDF signature");
  const sha256 = hash(data);
  const audit = JSON.parse(await readFile("output/catalog-restored/audit.json", "utf8"));
  if (audit.output_sha256 !== sha256 || audit.pages !== 56 || audit.logical_pages !== 112 || audit.original_full_spreads_restored !== 51 || !audit.all_original_images_preserved || audit.specification_lines_verified < 800) {
    throw new Error("PDF does not match its verified original-spread restoration manifest");
  }
  const key = `catalogs/glarivo-glassware-catalog-2026-${sha256.slice(0, 12)}.pdf`;
  const url = `${publicBase}/${key}`;
  console.log(JSON.stringify({ signedPreflight: true, apply: process.argv.includes("--apply"), key, bytes: data.length }));
  if (!process.argv.includes("--apply")) return;
  await client.send(new PutObjectCommand({
    Bucket, Key: key, Body: data, ContentType: "application/pdf",
    ContentDisposition: 'inline; filename="Glarivo-Glassware-Catalog-2026.pdf"',
    CacheControl: "public, max-age=31536000, immutable",
    Metadata: { sha256 },
  }));
  const stored = await client.send(new GetObjectCommand({ Bucket, Key: key }));
  const storedBytes = await stored.Body?.transformToByteArray();
  if (!storedBytes || hash(storedBytes) !== sha256 || stored.ContentType !== "application/pdf") {
    throw new Error("Signed PDF readback mismatch");
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  const publicBytes = new Uint8Array(await response.arrayBuffer());
  if (!response.ok || response.headers.get("content-type")?.split(";")[0] !== "application/pdf" || hash(publicBytes) !== sha256) {
    throw new Error(`Public PDF readback mismatch (${response.status})`);
  }
  const result = { url, key, sha256, bytes: data.length, pages: audit.pages, publicStatus: response.status, contentDisposition: response.headers.get("content-disposition"), verifiedAt: new Date().toISOString() };
  await writeFile("output/catalog-restored/r2-upload.json", `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Catalog upload failed");
  process.exitCode = 1;
});
