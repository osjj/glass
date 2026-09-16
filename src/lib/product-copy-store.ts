import type { Prisma } from "@/generated/prisma/client";
import { changedCopyFields, copySnapshot, type CopyField, type ProductCopy } from "@/lib/product-copy";

// Call before modifying any product relation. Sync takes the same row lock.
export async function recordCopyChange(transaction: Prisma.TransactionClient, input: {
  productId: string; expectedUpdatedAt: string; next: ProductCopy; adopted: CopyField[];
  reason: string; adminId: string; reviewed: boolean;
}) {
  await transaction.$queryRaw`SELECT "id" FROM "Product" WHERE "id" = ${input.productId} FOR UPDATE`;
  const current = await transaction.product.findUniqueOrThrow({ where: { id: input.productId }, include: {
    features: { orderBy: { sortOrder: "asc" } }, contentSections: { orderBy: { sortOrder: "asc" }, include: { images: { orderBy: { sortOrder: "asc" } } } },
    images: { where: { role: "GALLERY" }, orderBy: { sortOrder: "asc" } },
    attributes: { orderBy: { sortOrder: "asc" } }, overviewFields: { orderBy: { sortOrder: "asc" } },
    specifications: { where: { variantId: null, componentId: null }, orderBy: { sortOrder: "asc" } },
    categories: { where: { isPrimary: true } },
  } });
  if (current.updatedAt.toISOString() !== input.expectedUpdatedAt) {
    throw new Error("商品已被其他编辑或同步更新。请先保留当前改写结果，再刷新页面后重试。");
  }
  const snapshot = copySnapshot(current);
  const changedFields = changedCopyFields(snapshot, input.next);
  if (changedFields.length) await transaction.productCopyRevision.create({ data: {
    productId: input.productId, snapshot, changedFields, reason: input.reason, adminId: input.adminId,
  } });
  await transaction.product.update({ where: { id: input.productId }, data: {
    copyProtectedFields: [...new Set([...current.copyProtectedFields, ...changedFields, ...input.adopted])],
    ...(input.reviewed ? { copyNeedsReview: false } : {}),
  } });
  return current;
}
