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
  | "database-error";

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

async function persistCandidate(parsed: GarboParsedProduct) {
  const existing = await prisma.productImportCandidate.findUnique({
    where: {
      provider_sourceUrl: {
        provider: GARBO_PROVIDER,
        sourceUrl: parsed.sourceUrl,
      },
    },
    include: { fields: true },
  });
  const fetchedAt = new Date();

  if (!existing) {
    await prisma.productImportCandidate.create({
      data: {
        provider: GARBO_PROVIDER,
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
        sourceLastModifiedAt: parsed.sourceLastModifiedAt,
        status: "PENDING",
        fields: { create: parsed.fields.map(candidateFieldData) },
      },
    });
    return "created" as const;
  }

  if (existing.sourceHash === parsed.sourceHash) {
    await prisma.productImportCandidate.update({
      where: { id: existing.id },
      data: {
        sourceCategorySlug: parsed.normalizedPayload.sourceCategorySlug,
        sourceCategoryPath: parsed.normalizedPayload.sourceCategoryPath,
        sourceTitle: parsed.sourceTitle,
        sourceSku: parsed.sourceSku,
        fetchedAt,
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

  await prisma.$transaction(
    async (transaction) => {
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
          sourceLastModifiedAt: parsed.sourceLastModifiedAt,
          status: existing.productId ? "IMPORTED" : "IN_REVIEW",
          reviewedAt: existing.productId ? existing.reviewedAt : null,
          fields: { create: mergedFields },
        },
      });
    },
    { maxWait: 10_000, timeout: 20_000 },
  );
  return "updated" as const;
}

async function flagDuplicateItemNumbers(sourceCategoryPath: string) {
  const candidates = await prisma.productImportCandidate.findMany({
    where: {
      provider: GARBO_PROVIDER,
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
      ? `Item No. is shared by ${group.length} Garbo source pages and is already used by a catalog product.`
      : matchesCandidate
        ? `Item No. is shared by ${group.length} Garbo source pages; confirm whether these are duplicate listings or distinct products.`
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
  const discovery = await discoverGarboProductUrls(source);
  const result: GarboCategorySyncResult = {
    discovered: discovery.productUrls.length,
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
        const parsed = await fetchAndParseGarboProduct(sourceUrl, source);
        const outcome = await persistCandidate(parsed);
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
    Array.from({ length: Math.min(SYNC_CONCURRENCY, discovery.productUrls.length) }, () => worker()),
  );
  await flagDuplicateItemNumbers(source.path);
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

function assertAuthorizedGarboMediaUrl(value: string) {
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

function uploadAuthorizedGarboMedia(sourceUrl: string, cache: GarboMediaCache) {
  const cached = cache.get(sourceUrl);
  if (cached) return cached;
  const pending = (async () => {
    const data = await downloadAuthorizedGarboMedia(sourceUrl);
    const sha256 = createHash("sha256").update(data).digest("hex");
    const uploaded = await uploadImageToR2({ data, key: authorizedMediaKey(sha256) });
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

async function refreshImportedCandidateFromAuthorizedSource(
  candidateId: string,
  mediaCache: GarboMediaCache,
): Promise<
  | { ok: true; changed: boolean; mediaFailed: number }
  | { ok: false; error: CandidateImportError }
> {
  const candidate = await prisma.productImportCandidate.findUnique({
    where: { id: candidateId },
    select: {
      id: true,
      sourceUrl: true,
      sourceCategorySlug: true,
      sourceCategoryPath: true,
      normalizedPayload: true,
      reviewNotes: true,
      product: {
        select: {
          id: true,
          slug: true,
          summary: true,
          description: true,
          features: { orderBy: { sortOrder: "asc" }, select: { value: true } },
          images: {
            where: { sourceUrl: { startsWith: "https://www.garboglass.com/" } },
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
            where: { sourceKey: "garbo_product_details" },
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
  const preserveReviewedCopy = candidate.reviewNotes?.includes(CATALOG_REVIEWED_COPY_MARKER) ?? false;
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
  expectedImages.forEach((image) => assertAuthorizedGarboMediaUrl(image.sourceUrl));

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
  if (mediaIsCurrent && textIsCurrent) return { ok: true, changed: false, mediaFailed: 0 };

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
        const uploaded = await uploadAuthorizedGarboMedia(image.sourceUrl, mediaCache);
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
    if (mediaFailed) {
      console.warn("Some authorized Garbo source images remained unavailable after retries", {
        candidateId,
        mediaFailed,
        expectedImages: expectedImages.length,
      });
    }

    await prisma.$transaction(
      async (transaction) => {
        const section = await transaction.productContentSection.upsert({
          where: {
            productId_sourceKey: {
              productId: candidate.product!.id,
              sourceKey: "garbo_product_details",
            },
          },
          update: preserveReviewedCopy ? {} : { title: "Product Details", body: "", sortOrder: 0 },
          create: {
            productId: candidate.product!.id,
            sourceKey: "garbo_product_details",
            title: "Product Details",
            body: "",
            sortOrder: 0,
          },
          select: { id: true },
        });
        await transaction.productImage.deleteMany({
          where: {
            productId: candidate.product!.id,
            sourceUrl: { startsWith: "https://www.garboglass.com/" },
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
  mode: "reviewed-draft" | "deferred-publish",
): Promise<DraftImportResult> {
  const candidate = await prisma.productImportCandidate.findUnique({
    where: { id: candidateId },
    include: { fields: true },
  });
  if (!candidate) return { ok: false, error: "not-found" };
  const deferredPublish = mode === "deferred-publish";
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

  const mapping = await prisma.externalCategoryMapping.findUnique({
    where: {
      provider_sourcePath: {
        provider: GARBO_PROVIDER,
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
      ? prisma.product.findFirst({
          where: { sku: { equals: sku, mode: "insensitive" } },
          select: { id: true },
        })
      : null,
    sku
      ? prisma.productVariant.findFirst({
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
    ? `[Deferred verification ${importedAt.toISOString()}] Source text and specifications were quick-published before field verification. Existing field statuses and conflicts were preserved. Conflicting or duplicate Item No. values were not copied, certificate claims remain unverified, and source images were not attached.`
    : null;

  try {
    const product = await prisma.$transaction(
      async (transaction) => {
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
            sourceProvider: "GARBO",
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
            status: deferredPublish ? "PUBLISHED" : "DRAFT",
            featured: false,
            sortOrder: 0,
            publishedAt: deferredPublish ? importedAt : null,
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
  const discoveredCandidates = await prisma.productImportCandidate.findMany({
    where: {
      provider: GARBO_PROVIDER,
      sourceCategoryPath: source.path,
    },
    orderBy: [{ sourceUrl: "asc" }],
    select: { id: true, sourceTitle: true, productId: true },
  });
  discoveredCandidates.sort((left, right) => {
    const linkOrder = Number(Boolean(left.productId)) - Number(Boolean(right.productId));
    return linkOrder || left.sourceTitle.localeCompare(right.sourceTitle);
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
    if (candidate.productId) {
      const refreshed = await refreshImportedCandidateFromAuthorizedSource(candidate.id, mediaCache);
      if (!refreshed.ok) {
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
    const imported = await importCandidate(candidate.id, reviewerId, "deferred-publish");
    if (imported.ok) {
      result.imported += 1;
      const refreshed = await refreshImportedCandidateFromAuthorizedSource(candidate.id, mediaCache);
      if (!refreshed.ok) {
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
    options,
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
