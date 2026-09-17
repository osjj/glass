import { prisma } from "@/lib/prisma";
import { inquirySchema } from "@/lib/inquiries";
import type { z } from "zod";
import { isArticleProduct } from "@/data/article-products";

export async function storeInquiry(input: z.infer<typeof inquirySchema>) {
  const { website: _website, productSlug, ...data } = input;
  void _website;
  // Look up product facts on the server; never trust customer-supplied names/SKUs.
  const pageSlug = /^\/products\/([^/]+)$/.exec(data.sourcePath)?.[1];
  if (productSlug && productSlug !== pageSlug && !isArticleProduct(data.sourcePath, productSlug)) return "invalid-product";
  const slug = productSlug || pageSlug;
  const product = slug ? await prisma.product.findFirst({
    where: { slug, status: "PUBLISHED" }, select: { name: true, sku: true },
  }) : null;
  if (productSlug && !product) return "invalid-product";

  return prisma.$transaction(async (tx) => {
    // Database locks and rate checks work across multiple app workers.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${data.email}, 0))`;
    const existing = await tx.inquiry.findUnique({ where: { submissionId: data.submissionId } });
    if (existing) {
      const sameProduct = !productSlug || (existing.productSku === product?.sku && existing.productName === product?.name);
      const matches = sameProduct && Object.entries(data).every(([key, value]) => existing[key as keyof typeof existing] === value);
      return matches ? "accepted" : "conflict";
    }
    const recent = await tx.inquiry.count({ where: { email: data.email, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } } });
    if (recent >= 5) return "limited";
    await tx.inquiry.create({ data: { ...data, productName: product?.name, productSku: product?.sku } });
    return "accepted";
  }, { maxWait: 10000, timeout: 15000 });
}
