"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import {
  importApprovedCandidateAsDraft,
  publishCandidateWithDeferredReview,
  syncAndPublishGarboCategoryCatalog,
} from "@/lib/garbo-shot-glass-sync";
import {
  discoverGarboProductUrls,
  GARBO_PROVIDER,
  parseGarboCategorySource,
  type GarboCategorySource,
} from "@/lib/garbo-shot-glass";
import { prisma } from "@/lib/prisma";

const idSchema = z.string().trim().min(1).max(100);

const categoryImportSchema = z.object({
  sourceCategoryId: idSchema,
  categoryId: idSchema,
  limit: z.enum(["5", "10", "25", "50", "all"]).default("25"),
});

const fieldReviewSchema = z.object({
  status: z.enum(["UNREVIEWED", "VERIFIED", "CONFLICT", "REJECTED"]),
  normalizedValue: z.string().trim().max(2000).optional(),
  unit: z.string().trim().max(40).optional(),
  note: z.string().trim().max(2000).optional(),
});

const candidateReviewSchema = z.object({
  status: z.enum(["PENDING", "IN_REVIEW", "APPROVED", "REJECTED"]),
  reviewNotes: z.string().trim().max(5000).optional(),
});

function optionalFormString(formData: FormData, name: string) {
  const value = formData.get(name);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function candidatePath(candidateId: string, query?: string) {
  return `/admin/imports/${encodeURIComponent(candidateId)}${query ? `?${query}` : ""}`;
}

function categoryInput(formData: FormData) {
  return categoryImportSchema.safeParse({
    sourceCategoryId: formData.get("sourceCategoryId"),
    categoryId: formData.get("categoryId"),
    limit: formData.get("limit") || "25",
  });
}

function importQueryBase(sourceCategoryId?: string, categoryId?: string, sourceUrl?: string) {
  const query = new URLSearchParams();
  if (sourceCategoryId) query.set("sourceCategoryId", sourceCategoryId);
  if (sourceUrl) query.set("sourceUrl", sourceUrl);
  if (categoryId) query.set("categoryId", categoryId);
  return query;
}

async function resolveGarboSourceCategory(sourceCategoryId: string) {
  const sourceCategory = await prisma.externalSourceCategory.findFirst({
    where: {
      id: sourceCategoryId,
      provider: GARBO_PROVIDER,
      isActive: true,
      isImportable: true,
    },
    select: { id: true, sourceName: true, sourceUrl: true },
  });
  if (!sourceCategory) return null;
  try {
    return { ...sourceCategory, source: parseGarboCategorySource(sourceCategory.sourceUrl) };
  } catch {
    return null;
  }
}

async function validateImportTarget(source: GarboCategorySource, categoryId: string) {
  const [category, mapping] = await Promise.all([
    prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true, slug: true, isActive: true },
    }),
    prisma.externalCategoryMapping.findUnique({
      where: {
        provider_sourcePath: { provider: GARBO_PROVIDER, sourcePath: source.path },
      },
      select: { categoryId: true, category: { select: { name: true } } },
    }),
  ]);
  if (!category?.isActive) return { ok: false as const, error: "inactive-category" };
  if (mapping && mapping.categoryId !== category.id) {
    return {
      ok: false as const,
      error: "mapping-conflict",
      mappedCategoryName: mapping.category.name,
    };
  }
  return { ok: true as const, category, mapping };
}

export async function previewGarboCategoryImport(formData: FormData): Promise<void> {
  await requireAdmin();
  const input = categoryInput(formData);
  const rawSourceCategoryId = optionalFormString(formData, "sourceCategoryId");
  const rawCategoryId = optionalFormString(formData, "categoryId");
  if (!input.success) {
    const query = importQueryBase(rawSourceCategoryId, rawCategoryId);
    query.set("error", "invalid-input");
    redirect(`/admin/imports?${query.toString()}`);
  }

  const sourceRecord = await resolveGarboSourceCategory(input.data.sourceCategoryId);
  if (!sourceRecord) {
    const query = importQueryBase(input.data.sourceCategoryId, input.data.categoryId);
    query.set("error", "invalid-source");
    redirect(`/admin/imports?${query.toString()}`);
  }
  const source = sourceRecord.source;

  const target = await validateImportTarget(source, input.data.categoryId);
  if (!target.ok) {
    const query = importQueryBase(sourceRecord.id, input.data.categoryId, source.url);
    query.set("error", target.error);
    if ("mappedCategoryName" in target && target.mappedCategoryName) {
      query.set("mappedCategory", target.mappedCategoryName);
    }
    redirect(`/admin/imports?${query.toString()}`);
  }

  let discovery: Awaited<ReturnType<typeof discoverGarboProductUrls>>;
  try {
    discovery = await discoverGarboProductUrls(source);
  } catch (error) {
    console.error("Garbo category preview failed", {
      sourceCategoryPath: source.path,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    const query = importQueryBase(sourceRecord.id, input.data.categoryId, source.url);
    query.set("error", "preview-failed");
    redirect(`/admin/imports?${query.toString()}`);
  }

  await prisma.externalSourceCategory.update({
    where: { id: sourceRecord.id },
    data: {
      productCount: discovery.productUrls.length,
      pageCount: discovery.categoryPages.length,
      lastScannedAt: new Date(),
    },
  });

  const query = importQueryBase(sourceRecord.id, target.category.id, source.url);
  query.set("preview", "ready");
  query.set("sourcePath", source.path);
  query.set("sourceSlug", source.slug);
  query.set("categoryName", target.category.name);
  query.set("products", String(discovery.productUrls.length));
  query.set("pages", String(discovery.categoryPages.length));
  query.set("limit", input.data.limit);
  redirect(`/admin/imports?${query.toString()}`);
}

export async function syncAndPublishGarboCategory(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const input = categoryInput(formData);
  if (!input.success) redirect("/admin/imports?error=invalid-input");

  const sourceRecord = await resolveGarboSourceCategory(input.data.sourceCategoryId);
  if (!sourceRecord) {
    redirect("/admin/imports?error=invalid-source");
  }
  const source = sourceRecord.source;

  const target = await validateImportTarget(source, input.data.categoryId);
  if (!target.ok) {
    const query = importQueryBase(sourceRecord.id, input.data.categoryId, source.url);
    query.set("error", target.error);
    if ("mappedCategoryName" in target && target.mappedCategoryName) {
      query.set("mappedCategory", target.mappedCategoryName);
    }
    redirect(`/admin/imports?${query.toString()}`);
  }

  if (!target.mapping) {
    try {
      await prisma.externalCategoryMapping.create({
        data: {
          provider: GARBO_PROVIDER,
          sourceSlug: source.slug,
          sourceName: sourceRecord.sourceName,
          sourcePath: source.path,
          categoryId: target.category.id,
        },
      });
    } catch (error) {
      console.error("Garbo category mapping creation failed", {
        sourceCategoryPath: source.path,
        categoryId: target.category.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      const query = importQueryBase(sourceRecord.id, target.category.id, source.url);
      query.set("error", "mapping-failed");
      redirect(`/admin/imports?${query.toString()}`);
    }
  }

  const limit = input.data.limit === "all" ? undefined : Number.parseInt(input.data.limit, 10);
  let result: Awaited<ReturnType<typeof syncAndPublishGarboCategoryCatalog>>;
  try {
    result = await syncAndPublishGarboCategoryCatalog(source, admin.id, { limit });
  } catch (error) {
    console.error("Garbo category one-click import failed", {
      sourceCategoryPath: source.path,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    const query = importQueryBase(sourceRecord.id, target.category.id, source.url);
    query.set("sourcePath", source.path);
    query.set("error", "one-click-failed");
    redirect(`/admin/imports?${query.toString()}`);
  }

  revalidatePath("/admin/imports");
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/sitemap.xml");
  const query = importQueryBase(sourceRecord.id, target.category.id, source.url);
  query.set("sourcePath", source.path);
  query.set("categoryName", target.category.name);
  query.set("completed", source.slug);
  Object.entries({
    discovered: String(result.sync.discovered),
    created: String(result.sync.created),
    updated: String(result.sync.updated),
    unchanged: String(result.sync.unchanged),
    imported: String(result.publish.imported),
    refreshed: String(result.publish.refreshed),
    skipped: String(result.publish.skipped),
    failed: String(result.sync.failed + result.publish.failed),
    mediaFailed: String(result.publish.mediaFailed),
  }).forEach(([key, value]) => query.set(key, value));
  redirect(`/admin/imports?${query.toString()}`);
}

export async function importCandidateAsDraft(
  candidateIdValue: string,
): Promise<void> {
  const admin = await requireAdmin();
  const candidateId = idSchema.safeParse(candidateIdValue);
  if (!candidateId.success) redirect("/admin/imports?error=not-found");

  const result = await importApprovedCandidateAsDraft(candidateId.data, admin.id);
  if (!result.ok) {
    if (result.error === "not-found") redirect("/admin/imports?error=not-found");
    redirect(candidatePath(candidateId.data, `error=${result.error}`));
  }

  revalidatePath("/admin/imports");
  revalidatePath(candidatePath(candidateId.data));
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${result.productId}`);
  redirect(`/admin/products/${result.productId}?saved=imported`);
}

export async function quickPublishImportCandidate(
  candidateIdValue: string,
): Promise<void> {
  const admin = await requireAdmin();
  const candidateId = idSchema.safeParse(candidateIdValue);
  if (!candidateId.success) redirect("/admin/imports?error=not-found");

  const result = await publishCandidateWithDeferredReview(candidateId.data, admin.id);
  if (!result.ok) {
    if (result.error === "not-found") redirect("/admin/imports?error=not-found");
    redirect(candidatePath(candidateId.data, `error=${result.error}`));
  }

  revalidatePath("/admin/imports");
  revalidatePath(candidatePath(candidateId.data));
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${result.productId}`);
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${result.slug}`);
  revalidatePath("/sitemap.xml");
  redirect(`/admin/products/${result.productId}?saved=quick-published`);
}

export async function updateImportField(
  candidateIdValue: string,
  fieldIdValue: string,
  formData: FormData,
): Promise<void> {
  const admin = await requireAdmin();
  const candidateId = idSchema.safeParse(candidateIdValue);
  const fieldId = idSchema.safeParse(fieldIdValue);
  const data = fieldReviewSchema.safeParse({
    status: formData.get("status"),
    normalizedValue: optionalFormString(formData, "normalizedValue"),
    unit: optionalFormString(formData, "unit"),
    note: optionalFormString(formData, "note"),
  });

  if (!candidateId.success || !fieldId.success || !data.success) {
    redirect(candidatePath(candidateIdValue, "error=invalid-field"));
  }

  const candidate = await prisma.productImportCandidate.findUnique({
    where: { id: candidateId.data },
    select: { status: true },
  });
  if (!candidate) redirect("/admin/imports?error=not-found");
  const imported = candidate.status === "IMPORTED";

  const updated = await prisma.$transaction(async (transaction) => {
    const field = await transaction.productImportField.updateMany({
      where: { id: fieldId.data, candidateId: candidateId.data },
      data: {
        status: data.data.status,
        normalizedValue: data.data.normalizedValue ?? null,
        unit: data.data.unit ?? null,
        note: data.data.note ?? null,
      },
    });
    if (field.count !== 1) return false;

    const conflictCount = await transaction.productImportField.count({
      where: { candidateId: candidateId.data, status: "CONFLICT" },
    });
    await transaction.productImportCandidate.update({
      where: { id: candidateId.data },
      data: {
        conflictCount,
        status: imported ? "IMPORTED" : "IN_REVIEW",
        reviewerId: admin.id,
        reviewedAt: imported ? new Date() : null,
      },
    });
    return true;
  });

  if (!updated) redirect(candidatePath(candidateId.data, "error=field-not-found"));
  revalidatePath("/admin/imports");
  revalidatePath(candidatePath(candidateId.data));
  redirect(candidatePath(candidateId.data, "saved=field"));
}

export async function updateImportCandidate(
  candidateIdValue: string,
  formData: FormData,
): Promise<void> {
  const admin = await requireAdmin();
  const candidateId = idSchema.safeParse(candidateIdValue);
  const data = candidateReviewSchema.safeParse({
    status: formData.get("status"),
    reviewNotes: optionalFormString(formData, "reviewNotes"),
  });
  if (!candidateId.success || !data.success) {
    redirect(candidatePath(candidateIdValue, "error=invalid-candidate"));
  }

  const candidate = await prisma.productImportCandidate.findUnique({
    where: { id: candidateId.data },
    select: { status: true },
  });
  if (!candidate) redirect("/admin/imports?error=not-found");
  if (candidate.status === "IMPORTED") {
    redirect(candidatePath(candidateId.data, "error=imported-locked"));
  }

  if (data.data.status === "APPROVED") {
    const [totalFields, unresolved, verifiedFields, verifiedName] = await Promise.all([
      prisma.productImportField.count({ where: { candidateId: candidateId.data } }),
      prisma.productImportField.count({
        where: {
          candidateId: candidateId.data,
          status: { in: ["UNREVIEWED", "CONFLICT"] },
        },
      }),
      prisma.productImportField.count({
        where: { candidateId: candidateId.data, status: "VERIFIED" },
      }),
      prisma.productImportField.count({
        where: { candidateId: candidateId.data, fieldKey: "name", status: "VERIFIED" },
      }),
    ]);
    if (totalFields === 0) {
      redirect(candidatePath(candidateId.data, "error=no-fields"));
    }
    if (unresolved > 0) {
      redirect(candidatePath(candidateId.data, `error=review-required&count=${unresolved}`));
    }
    if (verifiedFields === 0) {
      redirect(candidatePath(candidateId.data, "error=no-verified-fields"));
    }
    if (verifiedName === 0) {
      redirect(candidatePath(candidateId.data, "error=name-required"));
    }
  }

  const isFinalReview = data.data.status === "APPROVED" || data.data.status === "REJECTED";
  await prisma.productImportCandidate.update({
    where: { id: candidateId.data },
    data: {
      status: data.data.status,
      reviewNotes: data.data.reviewNotes ?? null,
      reviewerId: admin.id,
      reviewedAt: isFinalReview ? new Date() : null,
    },
  });

  revalidatePath("/admin/imports");
  revalidatePath(candidatePath(candidateId.data));
  redirect(candidatePath(candidateId.data, "saved=candidate"));
}
