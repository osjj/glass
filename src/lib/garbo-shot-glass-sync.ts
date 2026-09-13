import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import type { Prisma } from "@/generated/prisma/client";
import {
  discoverGarboProductUrls,
  fetchAndParseGarboProduct,
  GARBO_PROVIDER,
  GARBO_SHOT_GLASS_SOURCE,
  garboNormalizedProductSchema,
  type GarboCategorySource,
  type GarboCandidateField,
  type GarboParsedProduct,
} from "@/lib/garbo-shot-glass";
import { assertSunwinUrl, fetchSunwinResource, discoverSunwinProductUrls, fetchAndParseSunwinProduct, parseSunwinCategorySource, type CatalogProvider } from "@/lib/sunwin";
import { prisma } from "@/lib/prisma";
import { CATALOG_REVIEWED_COPY_MARKER, cleanCatalogBody, cleanCatalogLabel, hasSupplierVoice } from "@/lib/catalog-public-copy";
import { uploadImageToR2, type UploadedR2Image } from "@/lib/r2";

const SYNC_CONCURRENCY = 5;
const MEDIA_CONCURRENCY = 2;
const MAX_SOURCE_MEDIA_BYTES = 12 * 1024 * 1024;
const GARBO_MEDIA_HOSTS = new Set(["garboglass.com", "www.garboglass.com"]);

export type GarboCategorySyncResult = {
  discovered: number;
  created: number;
  updated: number;
  unchanged: number;
  locked: number;
  failed: number;
  sourceUrls?: string[];
};

export type ShotGlassSyncResult = GarboCategorySyncResult;

type CandidateImportError =
  | "not-found"
  | "not-approved"
  | "not-eligible"
  | "already-imported"
  | "review-required"
  | "invalid-payload"
  | "missing-name"
  | "invalid-name"
  | "invalid-summary"
  | "invalid-sku"
  | "missing-category"
  | "duplicate-sku"
  | "duplicate-slug"
  | "database-error"
  | "media-failed";

export type DraftImportResult =
  | { ok: true; productId: string; slug: string }
  | { ok: false; error: CandidateImportError };

export type DeferredPublishResult =
  | { ok: true; productId: string; slug: string }
  | { ok: false; error: CandidateImportError };

export type GarboCategoryBulkPublishResult = {
  candidates: number;
  imported: number;
  refreshed: number;
  skipped: number;
  failed: number;
  mediaFailed: number;
  failures: Array<{ candidateId: string; sourceTitle: string; error: CandidateImportError }>;
};

export type ShotGlassBulkPublishResult = GarboCategoryBulkPublishResult;

type GarboMediaCacheEntry = UploadedR2Image & {
  sha256: string;
};

type GarboMediaCache = Map<string, Promise<GarboMediaCacheEntry>>;

export type GarboCategoryBulkPublishOptions = {
  limit?: number;
  mode?: "draft" | "publish";
  sourceUrls?: string[];
};

export type GarboCategoryOneClickImportResult = {
  sync: GarboCategorySyncResult;
  publish: GarboCategoryBulkPublishResult;
};

export type ShotGlassOneClickImportResult = GarboCategoryOneClickImportResult;

function jsonValue(value: unknown) {
  return value as Prisma.InputJsonValue;
}

function candidateFieldData(field: GarboCandidateField) {
  return {
    fieldKey: field.fieldKey,
    label: field.label,
    rawValue: field.rawValue,
    normalizedValue: field.normalizedValue,
    unit: field.unit,
    status: field.status,
    note: field.note,
    sortOrder: field.sortOrder,
  };
}

export async function persistCatalogCandidate(parsed: GarboParsedProduct, provider: CatalogProvider = GARBO_PROVIDER, database: typeof prisma = prisma) {
  return database.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${provider}:${parsed.sourceUrl}`}, 0))::text`;
    return persistCandidateInTransaction(parsed, provider, transaction);
  }, { maxWait: 15_000, timeout: 30_000 });
}

async function persistCandidateInTransaction(parsed: GarboParsedProduct, provider: CatalogProvider, transaction: Prisma.TransactionClient) {
  const existing = await transaction.productImportCandidate.findUnique({
    where: {
      provider_sourceUrl: {
        provider,
        sourceUrl: parsed.sourceUrl,
      },
    },
    include: { fields: true },
  });
  const selectedPath = parsed.normalizedPayload.sourceCategoryPath;
  const sourceCategoryPaths = [...new Set([...(existing?.sourceCategoryPaths ?? []), ...(existing ? [existing.sourceCategoryPath] : []), selectedPath])];
  if (existing && provider === "SUNWIN") {
    // A second category adds membership without moving the original source/primary category.
    parsed.normalizedPayload.sourceCategoryPath = existing.sourceCategoryPath;
    parsed.normalizedPayload.sourceCategorySlug = existing.sourceCategorySlug;
  }
  const fetchedAt = new Date();

  if (!existing) {
    await transaction.productImportCandidate.create({
      data: {
        provider,
        sourceUrl: parsed.sourceUrl,
        sourceCategorySlug: parsed.normalizedPayload.sourceCategorySlug,
        sourceCategoryPath: parsed.normalizedPayload.sourceCategoryPath,
        sourceTitle: parsed.sourceTitle,
        sourceSku: parsed.sourceSku,
        rawPayload: jsonValue(parsed.rawPayload),
        normalizedPayload: jsonValue(parsed.normalizedPayload),
        warnings: jsonValue(parsed.warnings),
        sourceHash: parsed.sourceHash,
        conflictCount: parsed.conflictCount,
        warningCount: parsed.warnings.length,
        fetchedAt,
        sourceCategoryPaths,
        sourceLastModifiedAt: parsed.sourceLastModifiedAt,
        status: "PENDING",
        fields: { create: parsed.fields.map(candidateFieldData) },
      },
    });
    return "created" as const;
  }

  if (existing.sourceHash === parsed.sourceHash) {
    await transaction.productImportCandidate.update({
      where: { id: existing.id },
      data: {
        sourceCategorySlug: parsed.normalizedPayload.sourceCategorySlug,
        sourceCategoryPath: parsed.normalizedPayload.sourceCategoryPath,
        sourceTitle: parsed.sourceTitle,
        sourceSku: parsed.sourceSku,
        fetchedAt,
        sourceCategoryPaths,
        sourceLastModifiedAt: parsed.sourceLastModifiedAt,
      },
    });
    return "unchanged" as const;
  }

  const existingFields = new Map(existing.fields.map((field) => [field.fieldKey, field]));
  const mergedFields = parsed.fields.map((field) => {
    const previous = existingFields.get(field.fieldKey);
    if (!previous || previous.rawValue !== field.rawValue) return candidateFieldData(field);
    return {
      ...candidateFieldData(field),
      normalizedValue: previous.normalizedValue,
      unit: previous.unit,
      status: previous.status,
      note: previous.note,
    };
  });
  const conflictCount = mergedFields.filter((field) => field.status === "CONFLICT").length;

      await transaction.productImportField.deleteMany({ where: { candidateId: existing.id } });
      await transaction.productImportCandidate.update({
        where: { id: existing.id },
        data: {
          sourceCategorySlug: parsed.normalizedPayload.sourceCategorySlug,
          sourceCategoryPath: parsed.normalizedPayload.sourceCategoryPath,
          sourceTitle: parsed.sourceTitle,
          sourceSku: parsed.sourceSku,
          rawPayload: jsonValue(parsed.rawPayload),
          normalizedPayload: jsonValue(parsed.normalizedPayload),
          warnings: jsonValue(parsed.warnings),
          sourceHash: parsed.sourceHash,
          conflictCount,
          warningCount: parsed.warnings.length,
          fetchedAt,
          sourceCategoryPaths,
          sourceLastModifiedAt: parsed.sourceLastModifiedAt,
          status: existing.productId ? "IMPORTED" : provider === "SUNWIN" && existing.status === "REJECTED" ? "REJECTED" : "IN_REVIEW",
          reviewedAt: existing.productId ? existing.reviewedAt : null,
          fields: { create: mergedFields },
        },
      });
  return "updated" as const;
}

async function flagDuplicateItemNumbers(sourceCategoryPath: string, provider: CatalogProvider = GARBO_PROVIDER) {
  const candidates = await prisma.productImportCandidate.findMany({
    where: {
      provider,
      sourceCategoryPath,
      productId: null,
      sourceSku: { not: null },
      status: { not: "IMPORTED" },
    },
    select: { id: true, sourceSku: true },
  });
  const grouped = new Map<string, Array<{ id: string; sourceSku: string }>>();
  for (const candidate of candidates) {
    const sourceSku = candidate.sourceSku?.trim();
    if (!sourceSku) continue;
    const key = sourceSku.toLowerCase();
    grouped.set(key, [...(grouped.get(key) ?? []), { id: candidate.id, sourceSku }]);
  }

  const sourceSkus = uniqueCaseInsensitive(candidates.flatMap((candidate) => candidate.sourceSku ? [candidate.sourceSku] : []));
  const [existingProducts, existingVariants] = sourceSkus.length
    ? await Promise.all([
        prisma.product.findMany({
          where: { sku: { in: sourceSkus, mode: "insensitive" } },
          select: { sku: true },
        }),
        prisma.productVariant.findMany({
          where: { sku: { in: sourceSkus, mode: "insensitive" } },
          select: { sku: true },
        }),
      ])
    : [[], []];
  const productSkus = new Set(
    [...existingProducts, ...existingVariants].flatMap((item) =>
      item.sku ? [item.sku.toLowerCase()] : [],
    ),
  );
  const affectedCandidateIds = new Set<string>();

  for (const [key, group] of grouped) {
    const matchesCandidate = group.length > 1;
    const matchesProduct = productSkus.has(key);
    if (!matchesCandidate && !matchesProduct) continue;
    const note = matchesCandidate && matchesProduct
      ? `Item No. is shared by ${group.length} source pages and is already used by a catalog product.`
      : matchesCandidate
        ? `Item No. is shared by ${group.length} source pages; confirm whether these are duplicate listings or distinct products.`
        : "Item No. is already used by a catalog product.";
    const ids = group.map((candidate) => candidate.id);
    const updated = await prisma.productImportField.updateMany({
      where: {
        candidateId: { in: ids },
        fieldKey: "item_no",
        status: "UNREVIEWED",
      },
      data: { status: "CONFLICT", note },
    });
    if (updated.count) ids.forEach((id) => affectedCandidateIds.add(id));
  }

  for (const candidateId of affectedCandidateIds) {
    const conflictCount = await prisma.productImportField.count({
      where: { candidateId, status: "CONFLICT" },
    });
    await prisma.productImportCandidate.update({
      where: { id: candidateId },
      data: { conflictCount },
    });
  }
}

function uniqueCaseInsensitive(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function syncGarboCategoryCatalog(
  source: GarboCategorySource,
): Promise<GarboCategorySyncResult> {
  const provider = source.provider ?? GARBO_PROVIDER;
  const discovery = provider === "SUNWIN" ? await discoverSunwinProductUrls(parseSunwinCategorySource(source.url)) : await discoverGarboProductUrls(source);
  const result: GarboCategorySyncResult = {
    discovered: discovery.productUrls.length,
    sourceUrls: [],
    created: 0,
    updated: 0,
    unchanged: 0,
    locked: 0,
    failed: 0,
  };
  let index = 0;

  async function worker() {
    while (index < discovery.productUrls.length) {
      const sourceUrl = discovery.productUrls[index++];
      try {
        const parsed = provider === "SUNWIN"
          ? await fetchAndParseSunwinProduct(sourceUrl, parseSunwinCategorySource(source.url))
          : await fetchAndParseGarboProduct(sourceUrl, source);
        const outcome = await persistCatalogCandidate(parsed, provider);
        result.sourceUrls!.push(sourceUrl);
        result[outcome] += 1;
      } catch (error) {
        result.failed += 1;
        console.error("Garbo category candidate sync failed", {
          sourceCategoryPath: source.path,
          sourceUrl,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(provider === "SUNWIN" ? 2 : SYNC_CONCURRENCY, discovery.productUrls.length) }, () => worker()),
  );
  await flagDuplicateItemNumbers(source.path, provider);
  return result;
}

export function syncShotGlassCatalog(): Promise<ShotGlassSyncResult> {
  return syncGarboCategoryCatalog(GARBO_SHOT_GLASS_SOURCE);
}

function reviewedValue(
  fields: Array<{
    fieldKey: string;
    rawValue: string;
    normalizedValue: string | null;
    status: string;
  }>,
  fieldKey: string,
) {
  const field = fields.find((item) => item.fieldKey === fieldKey && item.status === "VERIFIED");
  return (field?.normalizedValue || field?.rawValue || "").trim();
}

function deferredValue(
  fields: Array<{
    fieldKey: string;
    rawValue: string;
    normalizedValue: string | null;
    status: string;
  }>,
  fieldKey: string,
) {
  const field = fields.find((item) => item.fieldKey === fieldKey && item.status !== "REJECTED");
  if (!field) return "";
  const normalizedValue = field.normalizedValue?.trim();
  if (normalizedValue) return normalizedValue;

  if (field.status === "CONFLICT") {
    const specificationValue = field.rawValue.match(/^\[Specification\]\s*(.+)$/im)?.[1]?.trim();
    if (specificationValue) return specificationValue;
    const firstSourceValue = field.rawValue
      .split(/\r?\n/)
      .map((value) => value.replace(/^\[[^\]]+\]\s*/, "").trim())
      .find(Boolean);
    return firstSourceValue || "";
  }

  return field.rawValue.trim();
}

function truncateSourceValue(value: string, maxLength: number) {
  const normalized = value.trim();
  if (normalized.length <= maxLength) return normalized;
  const prefix = normalized.slice(0, maxLength);
  const lastSpace = prefix.lastIndexOf(" ");
  return (lastSpace >= Math.floor(maxLength * 0.7) ? prefix.slice(0, lastSpace) : prefix).trim();
}

function mappingLabel(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "glassware";
}

function withSlugSuffix(slug: string, suffix: string) {
  const available = Math.max(1, 180 - suffix.length - 1);
  return `${slug.slice(0, available).replace(/-+$/g, "")}-${suffix}`;
}

async function availableProductSlug(
  proposedSlug: string,
  sourceCategorySlug: string,
  sourceUrl: string,
) {
  const categoryCandidate = withSlugSuffix(proposedSlug, sourceCategorySlug);
  const sourceCandidate = withSlugSuffix(
    proposedSlug,
    createHash("sha256").update(sourceUrl).digest("hex").slice(0, 8),
  );
  const candidates = [...new Set([proposedSlug, categoryCandidate, sourceCandidate])];
  const matches = await prisma.product.findMany({
    where: { slug: { in: candidates } },
    select: { slug: true },
  });
  const used = new Set(matches.map((match) => match.slug));
  return candidates.find((candidate) => !used.has(candidate)) ?? null;
}

function assertAuthorizedGarboMediaUrl(value: string, provider: CatalogProvider = GARBO_PROVIDER) {
  if (provider === "SUNWIN") return assertSunwinUrl(value, "image").href;
  const url = new URL(value);
  if (url.protocol !== "https:" || !GARBO_MEDIA_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("The media source is not an authorized Garbo HTTPS URL.");
  }
  if (!url.pathname.startsWith("/data/upload/") && !url.pathname.startsWith("/data/watermark/")) {
    throw new Error("The media source is outside the authorized Garbo upload directory.");
  }
  return url.toString();
}

async function downloadAuthorizedGarboMedia(sourceUrl: string, attempt = 1): Promise<Buffer> {
  const allowedUrl = assertAuthorizedGarboMediaUrl(sourceUrl);
  const executable = process.platform === "win32" ? "curl.exe" : "curl";
  const args = [
    ...(process.platform === "win32" ? ["--ssl-no-revoke"] : []),
    "-L",
    "-sS",
    "--fail",
    "--http1.1",
    "--connect-timeout",
    "20",
    "--max-time",
    "45",
    "--retry",
    "4",
    "--retry-all-errors",
    "--retry-delay",
    "2",
    "--max-filesize",
    String(MAX_SOURCE_MEDIA_BYTES),
    "-A",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    "-H",
    "Accept: image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    allowedUrl,
  ];

  try {
    return await new Promise<Buffer>((resolve, reject) => {
      const child = spawn(executable, args, { windowsHide: true });
      const stdout: Buffer[] = [];
      const stderr: Buffer[] = [];
      let outputBytes = 0;
      let settled = false;
      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        reject(error);
      };

      child.stdout.on("data", (chunk: Buffer) => {
        outputBytes += chunk.byteLength;
        if (outputBytes > MAX_SOURCE_MEDIA_BYTES) {
          child.kill();
          fail(new Error(`Garbo media exceeded ${MAX_SOURCE_MEDIA_BYTES} bytes.`));
          return;
        }
        stdout.push(chunk);
      });
      child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
      child.on("error", (error) => fail(new Error(`Unable to start curl for Garbo media: ${error.message}`)));
      child.on("close", (code) => {
        if (settled) return;
        if (code !== 0) {
          fail(new Error(`Garbo media download failed (${code}): ${Buffer.concat(stderr).toString("utf8").trim()}`));
          return;
        }
        const data = Buffer.concat(stdout);
        if (!data.byteLength) {
          fail(new Error("Garbo media download returned an empty file."));
          return;
        }
        settled = true;
        resolve(data);
      });
    });
  } catch (error) {
    if (attempt < 3) return downloadAuthorizedGarboMedia(sourceUrl, attempt + 1);
    throw error;
  }
}

function authorizedMediaKey(sha256: string) {
  return `products/garbo/assets/${sha256}.webp`;
}

function uploadAuthorizedGarboMedia(sourceUrl: string, cache: GarboMediaCache, provider: CatalogProvider = GARBO_PROVIDER) {
  const cached = cache.get(sourceUrl);
  if (cached) return cached;
  const pending = (async () => {
    const data = provider === "SUNWIN" ? await fetchSunwinResource(sourceUrl, "image") : await downloadAuthorizedGarboMedia(sourceUrl);
    const sha256 = createHash("sha256").update(data).digest("hex");
    const uploaded = await uploadImageToR2({ data, key: provider === "SUNWIN" ? `products/sunwin/assets/${sha256}.webp` : authorizedMediaKey(sha256) });
    return { ...uploaded, sha256 };
  })();
  cache.set(sourceUrl, pending);
  pending.catch(() => cache.delete(sourceUrl));
  return pending;
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  worker: (value: T, index: number) => Promise<R>,
) {
  const results = new Array<R>(values.length);
  let index = 0;
  async function run() {
    while (index < values.length) {
      const current = index++;
      results[current] = await worker(values[current], current);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => run()));
  return results;
}

function fieldByKey<T extends { fieldKey: string }>(fields: T[], fieldKey: string) {
  return fields.find((field) => field.fieldKey === fieldKey);
}

function specificationGroup(fieldKey: string) {
  if (["capacity", "product_size", "top_diameter", "height", "bottom_diameter", "weight"].includes(fieldKey)) {
    return "DIMENSION" as const;
  }
  if (fieldKey === "material") return "MATERIAL" as const;
  if (fieldKey === "package") return "PACKAGING" as const;
  if (fieldKey === "delivery_time") return "COMMERCIAL" as const;
  return "GENERAL" as const;
}

export async function refreshImportedCandidateFromAuthorizedSource(
  candidateId: string,
  mediaCache: GarboMediaCache,
  database: typeof prisma = prisma,
): Promise<
  | { ok: true; changed: boolean; mediaFailed: number }
  | { ok: false; error: CandidateImportError; mediaFailed?: number }
> {
  const identity = await database.productImportCandidate.findUnique({ where: { id: candidateId }, select: { provider: true } });
  if (!identity || (identity.provider !== "SUNWIN" && identity.provider !== "GARBO")) return { ok: false, error: "not-found" };
  const provider = identity.provider;
  const sourcePrefix = provider === "SUNWIN" ? "https://www.sunwin2001.com/" : "https://www.garboglass.com/";
  const sectionKey = provider === "SUNWIN" ? "sunwin_product_details" : "garbo_product_details";
  const candidate = await database.productImportCandidate.findUnique({
    where: { id: candidateId },
    select: {
      id: true,
      sourceUrl: true,
      sourceCategorySlug: true,
      sourceCategoryPath: true,
      normalizedPayload: true,
      appliedPayload: true,
      fields: { select: { fieldKey: true, rawValue: true, normalizedValue: true, status: true, unit: true } },
      reviewNotes: true,
      product: {
        select: {
          id: true,
          slug: true,
          summary: true,
          description: true,
          specifications: { where: { key: "capacity" }, select: { id: true, value: true, reviewStatus: true } },
          overviewFields: { where: { key: "capacity" }, select: { id: true, value: true, reviewStatus: true } },
          features: { orderBy: { sortOrder: "asc" }, select: { value: true } },
          images: {
            where: { sourceUrl: { startsWith: sourcePrefix } },
            select: {
              url: true,
              alt: true,
              role: true,
              sourceUrl: true,
              storageKey: true,
              sha256: true,
              mimeType: true,
              width: true,
              height: true,
              sectionKey: true,
              rightsStatus: true,
              reviewStatus: true,
              sortOrder: true,
            },
          },
          contentSections: {
            where: { sourceKey: sectionKey },
            select: { id: true, title: true, body: true },
          },
        },
      },
    },
  });
  if (!candidate?.product) return { ok: false, error: "not-found" };
  const normalizedPayload = garboNormalizedProductSchema.safeParse(candidate.normalizedPayload);
  if (!normalizedPayload.success) return { ok: false, error: "invalid-payload" };
  if (
    normalizedPayload.data.sourceCategoryPath !== candidate.sourceCategoryPath ||
    normalizedPayload.data.sourceCategorySlug !== candidate.sourceCategorySlug
  ) {
    return { ok: false, error: "invalid-payload" };
  }

  const source = normalizedPayload.data;
  const baseline = garboNormalizedProductSchema.safeParse(candidate.appliedPayload);
  const preserveReviewedCopy = (candidate.reviewNotes?.includes(CATALOG_REVIEWED_COPY_MARKER) ?? false) ||
    (provider === "SUNWIN" && baseline.success &&
      (candidate.product.summary !== baseline.data.summary || candidate.product.description !== baseline.data.description));
  const summary = truncateSourceValue(hasSupplierVoice(source.summary) ? cleanCatalogLabel(source.name) : source.summary || cleanCatalogLabel(source.name), 500);
  const description = truncateSourceValue(cleanCatalogBody(source.description), 20_000);
  const features = source.detailBullets
    .filter((value) => !hasSupplierVoice(value))
    .map((value) => truncateSourceValue(value, 5_000))
    .filter(Boolean)
    .slice(0, 100);
  const expectedImages = [
    ...source.galleryImages.map((sourceUrl, sortOrder) => ({
      role: "GALLERY" as const,
      sourceUrl,
      alt: `${cleanCatalogLabel(source.name)} - image ${sortOrder + 1}`,
      sectionKey: "gallery",
      sortOrder,
    })),
    ...source.detailImages.map((image, sortOrder) => ({
      role: "DETAIL" as const,
      sourceUrl: image.url,
      alt: cleanCatalogLabel(image.alt) || `${cleanCatalogLabel(source.name)} - product detail ${sortOrder + 1}`,
      sectionKey: image.sectionKey,
      sortOrder,
    })),
  ];
  expectedImages.forEach((image) => assertAuthorizedGarboMediaUrl(image.sourceUrl, provider));

  const expectedImageKeys = expectedImages.map((image) => `${image.role}|${image.sourceUrl}`).sort();
  const currentImageKeys = candidate.product.images
    .map((image) => `${image.role}|${image.sourceUrl ?? ""}`)
    .sort();
  const currentFeatures = candidate.product.features.map((feature) => feature.value);
  const detailsSection = candidate.product.contentSections[0];
  const mediaIsCurrent =
    expectedImageKeys.length === currentImageKeys.length &&
    expectedImageKeys.every((key, index) => key === currentImageKeys[index]) &&
    candidate.product.images.every(
      (image) => image.storageKey && image.sha256 && image.rightsStatus === "AUTHORIZED",
    );
  const textIsCurrent = preserveReviewedCopy || (
    candidate.product.summary === summary &&
    candidate.product.description === description &&
    currentFeatures.length === features.length &&
    currentFeatures.every((value, index) => value === features[index]) &&
    detailsSection?.title === "Product Details" &&
    detailsSection.body === "");
  const capacityField = candidate.fields.find((field) => field.fieldKey === "capacity" && field.status !== "REJECTED");
  const capacity = capacityField ? (capacityField.normalizedValue || capacityField.rawValue) : undefined;
  const previousCapacity = baseline.success ? baseline.data.specificationValues?.capacity : undefined;
  const capacityChanged = provider === "SUNWIN" && capacity !== previousCapacity;
  if (mediaIsCurrent && textIsCurrent && !capacityChanged) return { ok: true, changed: false, mediaFailed: 0 };

  try {
    const existingMedia = new Map(
      candidate.product.images.map((image) => [`${image.role}|${image.sourceUrl ?? ""}`, image]),
    );
    const attemptedMedia = await mapWithConcurrency(expectedImages, MEDIA_CONCURRENCY, async (image) => {
      const existing = existingMedia.get(`${image.role}|${image.sourceUrl}`);
      if (
        existing?.storageKey &&
        existing.sha256 &&
        existing.mimeType === "image/webp" &&
        existing.width &&
        existing.height
      ) {
        return {
          ...image,
          url: existing.url,
          storageKey: existing.storageKey,
          sha256: existing.sha256,
          mimeType: existing.mimeType,
          width: existing.width,
          height: existing.height,
        };
      }
      try {
        const uploaded = await uploadAuthorizedGarboMedia(image.sourceUrl, mediaCache, provider);
        return {
          ...image,
          url: uploaded.url,
          storageKey: uploaded.key,
          sha256: uploaded.sha256,
          mimeType: uploaded.contentType,
          width: uploaded.width,
          height: uploaded.height,
        };
      } catch {
        return null;
      }
    });
    const media = attemptedMedia.filter((image): image is NonNullable<typeof image> => Boolean(image));
    const mediaFailed = expectedImages.length - media.length;
    if (mediaFailed && provider === "SUNWIN") return { ok: false, error: "media-failed", mediaFailed };
    if (mediaFailed) {
      console.warn("Some authorized Garbo source images remained unavailable after retries", {
        candidateId,
        mediaFailed,
        expectedImages: expectedImages.length,
      });
    }

    await database.$transaction(
      async (transaction) => {
        const section = await transaction.productContentSection.upsert({
          where: {
            productId_sourceKey: {
              productId: candidate.product!.id,
              sourceKey: sectionKey,
            },
          },
          update: preserveReviewedCopy ? {} : { title: "Product Details", body: "", sortOrder: 0 },
          create: {
            productId: candidate.product!.id,
            sourceKey: sectionKey,
            title: "Product Details",
            body: "",
            sortOrder: 0,
          },
          select: { id: true },
        });
        await transaction.productImage.deleteMany({
          where: {
            productId: candidate.product!.id,
            sourceUrl: { startsWith: sourcePrefix },
          },
        });
        if (media.length) {
          await transaction.productImage.createMany({
            data: media.map((image) => ({
              productId: candidate.product!.id,
              contentSectionId: image.role === "DETAIL" ? section.id : null,
              url: image.url,
              alt: truncateSourceValue(image.alt, 500),
              role: image.role,
              sourceUrl: image.sourceUrl,
              storageKey: image.storageKey,
              sha256: image.sha256,
              mimeType: image.mimeType,
              width: image.width,
              height: image.height,
              sectionKey: image.sectionKey,
              rightsStatus: "AUTHORIZED",
              reviewStatus: "VERIFIED",
              sortOrder: image.sortOrder,
            })),
          });
        }
        if (provider === "SUNWIN") {
          // Only source-owned, unreviewed values follow source changes; manual edits remain intact.
          if (capacityChanged && capacityField && capacity) {
            for (const spec of candidate.product!.specifications) {
              if (spec.value === previousCapacity && spec.reviewStatus === "UNREVIEWED") {
                await transaction.productSpecification.updateMany({ where: { id: spec.id, value: spec.value, reviewStatus: "UNREVIEWED" },
                  data: { value: capacity, rawValue: capacityField.rawValue, unit: capacityField.unit } });
              }
            }
            for (const overview of candidate.product!.overviewFields) {
              if (overview.value === previousCapacity && overview.reviewStatus === "UNREVIEWED") {
                await transaction.productOverviewField.updateMany({ where: { id: overview.id, value: overview.value, reviewStatus: "UNREVIEWED" },
                  data: { value: capacity, rawValue: capacityField.rawValue, normalizedValue: capacityField.normalizedValue } });
              }
            }
          }
          await transaction.productImportCandidate.update({ where: { id: candidate.id }, data: {
            appliedPayload: jsonValue({ ...source, specificationValues: capacity ? { capacity } : {} }),
          } });
        }
        if (!preserveReviewedCopy) {
          await transaction.productFeature.deleteMany({ where: { productId: candidate.product!.id } });
          if (features.length) {
            await transaction.productFeature.createMany({
              data: features.map((value, sortOrder) => ({
                productId: candidate.product!.id,
                value,
                sortOrder,
              })),
            });
          }
          await transaction.product.update({
            where: { id: candidate.product!.id },
            data: {
              summary,
              description,
              detailsHeading: "Details",
            },
          });
        }
      },
      { maxWait: 15_000, timeout: 30_000 },
    );
    return { ok: true, changed: true, mediaFailed };
  } catch (error) {
    console.error("Authorized Garbo product content/media refresh failed", {
      candidateId,
      productId: candidate.product.id,
      sourceUrl: candidate.sourceUrl,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { ok: false, error: "database-error" };
  }
}

async function importCandidate(
  candidateId: string,
  reviewerId: string | null,
  mode: "reviewed-draft" | "deferred-publish" | "deferred-draft",
  database: typeof prisma = prisma,
): Promise<DraftImportResult> {
  const candidate = await database.productImportCandidate.findUnique({
    where: { id: candidateId },
    include: { fields: true },
  });
  if (!candidate) return { ok: false, error: "not-found" };
  const deferredPublish = mode !== "reviewed-draft";
  const publishNow = mode === "deferred-publish";
  if (candidate.provider !== "GARBO" && candidate.provider !== "SUNWIN") return { ok: false, error: "invalid-payload" };
  if (candidate.provider === "SUNWIN" && ["REJECTED", "ERROR"].includes(candidate.status)) return { ok: false, error: "not-eligible" };
  if (candidate.productId || (!deferredPublish && candidate.status === "IMPORTED")) {
    return { ok: false, error: "already-imported" };
  }
  if (deferredPublish) {
    // The one-click importer deliberately accepts every unlinked source record.
    // Review and conflict metadata remains available for later correction.
  } else {
    if (candidate.status !== "APPROVED") return { ok: false, error: "not-approved" };
    if (candidate.fields.some((field) => field.status === "UNREVIEWED" || field.status === "CONFLICT")) {
      return { ok: false, error: "review-required" };
    }
  }

  const normalizedPayload = garboNormalizedProductSchema.safeParse(candidate.normalizedPayload);
  if (!normalizedPayload.success) return { ok: false, error: "invalid-payload" };
  if (
    normalizedPayload.data.sourceCategoryPath !== candidate.sourceCategoryPath ||
    normalizedPayload.data.sourceCategorySlug !== candidate.sourceCategorySlug
  ) {
    return { ok: false, error: "invalid-payload" };
  }

  const sourceValue = deferredPublish ? deferredValue : reviewedValue;
  const proposedName = cleanCatalogLabel(sourceValue(candidate.fields, "name") || normalizedPayload.data.name);
  const name = deferredPublish ? truncateSourceValue(proposedName, 180) : proposedName;
  if (!name) return { ok: false, error: "missing-name" };
  if (name.length > 180) return { ok: false, error: "invalid-name" };
  const sourceFact = (fieldKey: string) => {
    const field = fieldByKey(candidate.fields, fieldKey);
    const value = truncateSourceValue(sourceValue(candidate.fields, fieldKey), 500);
    if (!field || field.status === "REJECTED" || !value) return null;
    return `${truncateSourceValue(field.label, 100)}: ${value}${field.unit ? ` ${field.unit}` : ""}`;
  };
  const catalogFacts = [
    sourceFact("capacity"),
    sourceFact("material"),
    sourceFact("product_size"),
    sourceFact("usage"),
    sourceFact("technique"),
    sourceFact("package"),
  ].filter((value): value is string => Boolean(value));
  const sourceSummary = sourceValue(candidate.fields, "summary") || name;
  const proposedSummary = hasSupplierVoice(sourceSummary) ? name : sourceSummary;
  const summary = deferredPublish
    ? truncateSourceValue(
        catalogFacts.length
          ? `${name}. ${catalogFacts.slice(0, 3).join(" · ")}. Request wholesale pricing and final order details.`
          : `${name}. Request wholesale pricing and final order details.`,
        500,
      )
    : proposedSummary;
  if (summary.length > 500) return { ok: false, error: "invalid-summary" };
  const description = deferredPublish
    ? truncateSourceValue(
        [
          `Wholesale ${mappingLabel(candidate.sourceCategorySlug)} product available for quotation.`,
          catalogFacts.join(". "),
          "Please reconfirm dimensions, packing, customization, minimum order quantity, pricing, and delivery terms before ordering.",
        ].filter(Boolean).join(" "),
        20_000,
      )
    : truncateSourceValue(cleanCatalogBody(sourceValue(candidate.fields, "description")), 20_000);
  const itemNumberField = fieldByKey(candidate.fields, "item_no");
  const proposedSku = sourceValue(candidate.fields, "item_no") || null;
  let sku = deferredPublish && itemNumberField?.status === "CONFLICT" ? null : proposedSku;
  if (sku && sku.length > 80) {
    if (!deferredPublish) return { ok: false, error: "invalid-sku" };
    sku = null;
  }

  const mapping = await database.externalCategoryMapping.findUnique({
    where: {
      provider_sourcePath: {
        provider: candidate.provider,
        sourcePath: candidate.sourceCategoryPath,
      },
    },
    include: { category: { select: { id: true, slug: true, isActive: true } } },
  });
  if (!mapping?.category.isActive) return { ok: false, error: "missing-category" };

  const [slug, productSkuMatch, variantSkuMatch] = await Promise.all([
    availableProductSlug(
      normalizedPayload.data.slug,
      candidate.sourceCategorySlug,
      candidate.sourceUrl,
    ),
    sku
      ? database.product.findFirst({
          where: { sku: { equals: sku, mode: "insensitive" } },
          select: { id: true },
        })
      : null,
    sku
      ? database.productVariant.findFirst({
          where: { sku: { equals: sku, mode: "insensitive" } },
          select: { id: true },
        })
      : null,
  ]);
  if (!slug) return { ok: false, error: "duplicate-slug" };
  if (productSkuMatch || variantSkuMatch) {
    if (!deferredPublish) return { ok: false, error: "duplicate-sku" };
    sku = null;
  }

  const attributeKeys = ["material", "usage", "technique"];
  const specificationKeys = [
    "capacity",
    "product_size",
    "top_diameter",
    "height",
    "bottom_diameter",
    "weight",
    "package",
    "delivery_time",
  ];
  const attributes = attributeKeys.flatMap((fieldKey, sortOrder) => {
    const field = fieldByKey(candidate.fields, fieldKey);
    const value = truncateSourceValue(sourceValue(candidate.fields, fieldKey), 500);
    if (!field || field.status === "REJECTED" || !value) return [];
    return [{
      key: fieldKey,
      label: truncateSourceValue(field.label, 100),
      value,
      rawValue: field.rawValue,
      normalizedValue: field.normalizedValue,
      reviewStatus: deferredPublish ? field.status : "VERIFIED" as const,
      sortOrder,
    }];
  });
  const specifications = specificationKeys.flatMap((fieldKey, sortOrder) => {
    const field = fieldByKey(candidate.fields, fieldKey);
    const value = truncateSourceValue(sourceValue(candidate.fields, fieldKey), 500);
    if (!field || field.status === "REJECTED" || !value) return [];
    return [{
      key: fieldKey,
      label: truncateSourceValue(field.label, 100),
      value,
      rawValue: field.rawValue,
      unit: field.unit,
      group: specificationGroup(fieldKey),
      reviewStatus: deferredPublish ? field.status : "VERIFIED" as const,
      sortOrder,
    }];
  });
  const overviewKeys = ["material", "package", "usage", "capacity", "product_size"];
  const overviewFields = overviewKeys.flatMap((fieldKey, sortOrder) => {
    const field = fieldByKey(candidate.fields, fieldKey);
    const value = truncateSourceValue(sourceValue(candidate.fields, fieldKey), 500);
    if (!field || field.status === "REJECTED" || !value) return [];
    return [{
      key: fieldKey,
      label: truncateSourceValue(field.label, 100),
      value,
      rawValue: field.rawValue,
      normalizedValue: field.normalizedValue,
      reviewStatus: deferredPublish ? field.status : "VERIFIED" as const,
      sortOrder,
    }];
  });
  const certificateField = fieldByKey(candidate.fields, "certificate");
  const certificateValue = sourceValue(candidate.fields, "certificate");
  const certifications = certificateValue
    ? certificateValue
        .split(/[;\n]+/)
        .map((claimName) => claimName.trim())
        .filter(Boolean)
        .slice(0, 30)
        .map((claimName, sortOrder) => ({
          claimName,
          sourceText: certificateField?.rawValue || certificateValue,
          sourceUrl: candidate.sourceUrl,
          status: "UNVERIFIED" as const,
          sortOrder,
        }))
    : [];
  const features = deferredPublish
    ? [
        "Pricing, MOQ, customization, and delivery terms are available on request.",
        "Please reconfirm all specifications and packaging before order placement.",
      ].map((value, sortOrder) => ({ value, sortOrder }))
    : [];
  const importedAt = new Date();
  const deferredReviewNote = deferredPublish
    ? `[Deferred verification ${importedAt.toISOString()}] Source text and specifications were imported before field verification. Existing field statuses and conflicts were preserved. Conflicting or duplicate Item No. values were not copied, certificate claims remain unverified, and source images were not attached.`
    : null;

  try {
    const product = await database.$transaction(
      async (transaction) => {
        const locked = await transaction.$queryRaw<Array<{ productId: string | null }>>`SELECT "productId" FROM "ProductImportCandidate" WHERE "id" = ${candidate.id} FOR UPDATE`;
        if (!locked.length || locked[0].productId) throw new Error("Candidate already imported by another operation.");
        const created = await transaction.product.create({
          data: {
            name,
            slug,
            sku,
            legacyCategory: mapping.category.slug,
            summary,
            description,
            content: "",
            pageTemplate: "GARBO_DETAIL",
            sourceProvider: candidate.provider,
            sourceUrl: candidate.sourceUrl,
            sourceCategoryPath: candidate.sourceCategoryPath,
            detailsHeading: "Details",
            specificationHeading: `Specification of ${name}`,
            pricingMode: "REQUEST_QUOTE",
            price: null,
            comparePrice: null,
            cost: null,
            currency: "USD",
            moq: null,
            unit: null,
            stock: 0,
            status: publishNow ? "PUBLISHED" : "DRAFT",
            featured: false,
            sortOrder: 0,
            publishedAt: publishNow ? importedAt : null,
            categories: {
              create: { categoryId: mapping.category.id, isPrimary: true, sortOrder: 0 },
            },
            variants: {
              create: {
                sku,
                label: sku || "Default",
                isDefault: true,
                price: null,
                moq: null,
                unit: null,
                stock: null,
                reviewStatus: deferredPublish ? "UNREVIEWED" : "VERIFIED",
                sortOrder: 0,
              },
            },
            attributes: { create: attributes },
            overviewFields: { create: overviewFields },
            specifications: { create: specifications },
            certifications: { create: certifications },
            features: { create: features },
          },
          select: { id: true, slug: true },
        });
        await transaction.productImportCandidate.update({
          where: { id: candidate.id },
          data: {
            productId: created.id,
            status: "IMPORTED",
            reviewerId,
            reviewedAt: importedAt,
            reviewNotes: deferredReviewNote
              ? [candidate.reviewNotes?.trim(), deferredReviewNote].filter(Boolean).join("\n\n")
              : candidate.reviewNotes,
          },
        });
        return created;
      },
      { maxWait: 10_000, timeout: 20_000 },
    );
    return { ok: true, productId: product.id, slug: product.slug };
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      const target = JSON.stringify("meta" in error ? error.meta : "");
      return { ok: false, error: target.includes("slug") ? "duplicate-slug" : "duplicate-sku" };
    }
    console.error("Approved catalog candidate import failed", {
      candidateId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { ok: false, error: "database-error" };
  }
}

export async function importCandidateAsUnreviewedDraft(candidateId: string, reviewerId: string | null, database: typeof prisma = prisma): Promise<DraftImportResult> {
  return importCandidate(candidateId, reviewerId, "deferred-draft", database);
}

export async function importApprovedCandidateAsDraft(
  candidateId: string,
  reviewerId: string,
) {
  return importCandidate(candidateId, reviewerId, "reviewed-draft");
}

export async function publishCandidateWithDeferredReview(
  candidateId: string,
  reviewerId: string | null,
): Promise<DeferredPublishResult> {
  return importCandidate(candidateId, reviewerId, "deferred-publish");
}

export async function publishAllGarboCategoryCandidatesWithDeferredReview(
  source: GarboCategorySource,
  reviewerId: string | null,
  options: GarboCategoryBulkPublishOptions = {},
): Promise<GarboCategoryBulkPublishResult> {
  const provider = source.provider ?? GARBO_PROVIDER;
  const discoveredCandidates = await prisma.productImportCandidate.findMany({
    where: {
      provider,
      ...(options.sourceUrls ? { sourceUrl: { in: options.sourceUrls } } : { sourceCategoryPath: source.path }),
      ...(provider === "SUNWIN" ? { status: { notIn: ["REJECTED", "ERROR"] as ("REJECTED" | "ERROR")[] } } : {}),
    },
    orderBy: [{ sourceUrl: "asc" }],
    select: { id: true, sourceTitle: true, productId: true, normalizedPayload: true, appliedPayload: true, product: { select: { status: true } } },
  });
  discoveredCandidates.sort((left, right) => {
    const linkOrder = Number(Boolean(left.productId)) - Number(Boolean(right.productId));
    const pending = (item: typeof left) => provider === "SUNWIN" &&
      (JSON.stringify(item.appliedPayload) !== JSON.stringify(item.normalizedPayload) || (options.mode === "publish" && item.product?.status === "DRAFT"));
    return linkOrder || Number(pending(right)) - Number(pending(left)) || left.sourceTitle.localeCompare(right.sourceTitle);
  });
  const candidates = options.limit
    ? discoveredCandidates.slice(0, Math.max(0, options.limit))
    : discoveredCandidates;
  const result: GarboCategoryBulkPublishResult = {
    candidates: candidates.length,
    imported: 0,
    refreshed: 0,
    skipped: 0,
    failed: 0,
    mediaFailed: 0,
    failures: [],
  };
  const mediaCache: GarboMediaCache = new Map();

  for (const candidate of candidates) {
    if (provider === "SUNWIN" && candidate.productId) {
      const mapping = await prisma.externalCategoryMapping.findUnique({ where: { provider_sourcePath: { provider, sourcePath: source.path } } });
      if (mapping) await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: candidate.productId, categoryId: mapping.categoryId } },
        create: { productId: candidate.productId, categoryId: mapping.categoryId, isPrimary: false }, update: {},
      });
    }
    if (candidate.productId) {
      const refreshed = await refreshImportedCandidateFromAuthorizedSource(candidate.id, mediaCache);
      if (refreshed.ok && options.mode === "publish") {
        await prisma.product.updateMany({ where: { id: candidate.productId, status: "DRAFT" }, data: { status: "PUBLISHED", publishedAt: new Date() } });
      }
      if (!refreshed.ok) {
        result.mediaFailed += refreshed.mediaFailed ?? 0;
        result.failed += 1;
        if (result.failures.length < 20) {
          result.failures.push({
            candidateId: candidate.id,
            sourceTitle: candidate.sourceTitle,
            error: refreshed.error,
          });
        }
      } else if (refreshed.changed) {
        result.refreshed += 1;
        result.mediaFailed += refreshed.mediaFailed;
      } else {
        result.skipped += 1;
      }
      continue;
    }
    const imported = await importCandidate(candidate.id, reviewerId, options.mode === "draft" || provider === "SUNWIN" ? "deferred-draft" : "deferred-publish");
    if (imported.ok) {
      result.imported += 1;
      if (provider === "SUNWIN") {
        const record = await prisma.productImportCandidate.findUnique({ where: { id: candidate.id }, select: { sourceCategoryPaths: true } });
        const mappings = await prisma.externalCategoryMapping.findMany({ where: { provider, sourcePath: { in: record?.sourceCategoryPaths ?? [source.path] }, category: { isActive: true } } });
        await prisma.productCategory.createMany({ data: mappings.map((mapping) => ({ productId: imported.productId, categoryId: mapping.categoryId, isPrimary: false })), skipDuplicates: true });
      }
      const refreshed = await refreshImportedCandidateFromAuthorizedSource(candidate.id, mediaCache);
      if (refreshed.ok && options.mode === "publish") {
        await prisma.product.updateMany({ where: { id: imported.productId, status: "DRAFT" }, data: { status: "PUBLISHED", publishedAt: new Date() } });
      }
      if (!refreshed.ok) {
        result.mediaFailed += refreshed.mediaFailed ?? 0;
        result.failed += 1;
        if (result.failures.length < 20) {
          result.failures.push({
            candidateId: candidate.id,
            sourceTitle: candidate.sourceTitle,
            error: refreshed.error,
          });
        }
      } else if (refreshed.changed) {
        result.refreshed += 1;
        result.mediaFailed += refreshed.mediaFailed;
      }
    } else {
      result.failed += 1;
      if (result.failures.length < 20) {
        result.failures.push({
          candidateId: candidate.id,
          sourceTitle: candidate.sourceTitle,
          error: imported.error,
        });
      }
    }
  }

  return result;
}

export async function syncAndPublishGarboCategoryCatalog(
  source: GarboCategorySource,
  reviewerId: string | null,
  options: GarboCategoryBulkPublishOptions = {},
): Promise<GarboCategoryOneClickImportResult> {
  const sync = await syncGarboCategoryCatalog(source);
  const publish = await publishAllGarboCategoryCandidatesWithDeferredReview(
    source,
    reviewerId,
    { ...options, sourceUrls: sync.sourceUrls },
  );
  return { sync, publish };
}

export function publishAllShotGlassCandidatesWithDeferredReview(
  reviewerId: string | null,
  options: GarboCategoryBulkPublishOptions = {},
): Promise<ShotGlassBulkPublishResult> {
  return publishAllGarboCategoryCandidatesWithDeferredReview(
    GARBO_SHOT_GLASS_SOURCE,
    reviewerId,
    options,
  );
}

export function syncAndPublishShotGlassCatalog(
  reviewerId: string | null,
  options: GarboCategoryBulkPublishOptions = {},
): Promise<ShotGlassOneClickImportResult> {
  return syncAndPublishGarboCategoryCatalog(GARBO_SHOT_GLASS_SOURCE, reviewerId, options);
}
