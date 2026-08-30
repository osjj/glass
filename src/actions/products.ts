"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { productCategories } from "@/data/catalog";
import { requireAdmin } from "@/lib/admin-auth";
import {
  prepareProductContentForStorage,
  serializeStoredProductContentForEditor,
} from "@/lib/article-content-server";
import { prisma } from "@/lib/prisma";
import type { AdminProductInput, ProductFormState } from "@/types/admin-product";

const pairSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(100),
  value: z.string().trim().min(1, "Value is required").max(500),
});

const imageSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1)
    .refine(
      (value) => value.startsWith("/") || /^https?:\/\//i.test(value),
      "Use an absolute URL or a site path beginning with /",
    ),
  alt: z.string().trim().max(200).default(""),
});

const optionalMoney = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().min(0).optional(),
);

const productContentSchema = z
  .string()
  .trim()
  .max(500000, "Product rich content is too large")
  .superRefine((value, context) => {
    const prepared = prepareProductContentForStorage(value);
    if (!prepared.success) context.addIssue({ code: "custom", message: prepared.error });
  })
  .transform((value) => {
    const prepared = prepareProductContentForStorage(value);
    return prepared.success ? prepared.value : value;
  });

const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(180),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  sku: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(80).optional(),
  ),
  summary: z.string().trim().min(1, "Short summary is required").max(500),
  description: z.string().trim().max(20000).default(""),
  content: productContentSchema,
  category: z.string().refine(
    (value) => productCategories.some((category) => category.slug === value),
    "Select a valid category",
  ),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  comparePrice: optionalMoney,
  cost: optionalMoney,
  currency: z.enum(["USD", "EUR", "CNY"]),
  moq: z.coerce.number().int().min(1, "MOQ must be at least 1"),
  unit: z.string().trim().min(1).max(40),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  featured: z.boolean(),
  sortOrder: z.coerce.number().int().min(0),
  images: z.array(imageSchema).max(12),
  attributes: z.array(pairSchema).max(30),
  specifications: z.array(pairSchema).max(60),
  features: z.array(z.string().trim().min(1).max(240)).max(20),
});

function parseJsonField<T>(formData: FormData, name: string, fallback: T): unknown {
  const value = formData.get(name);
  if (typeof value !== "string" || value.trim() === "") return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return Symbol.for(`invalid-${name}`);
  }
}

function parseFormData(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    sku: formData.get("sku"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    content: formData.get("content"),
    category: formData.get("category"),
    price: formData.get("price"),
    comparePrice: formData.get("comparePrice"),
    cost: formData.get("cost"),
    currency: formData.get("currency"),
    moq: formData.get("moq"),
    unit: formData.get("unit"),
    status: formData.get("status"),
    featured: formData.get("featured") === "on",
    sortOrder: formData.get("sortOrder"),
    images: parseJsonField(formData, "images", []),
    attributes: parseJsonField(formData, "attributes", []),
    specifications: parseJsonField(formData, "specifications", []),
    features: parseJsonField(formData, "features", []),
  });
}

function relationData(data: z.infer<typeof productSchema>) {
  return {
    images: { create: data.images.map((image, sortOrder) => ({ ...image, sortOrder })) },
    attributes: {
      create: data.attributes.map((attribute, sortOrder) => ({ ...attribute, sortOrder })),
    },
    specifications: {
      create: data.specifications.map((specification, sortOrder) => ({ ...specification, sortOrder })),
    },
    features: {
      create: data.features.map((value, sortOrder) => ({ value, sortOrder })),
    },
  };
}

function productData(data: z.infer<typeof productSchema>) {
  return {
    name: data.name,
    slug: data.slug,
    sku: data.sku ?? null,
    summary: data.summary,
    description: data.description,
    content: data.content,
    category: data.category,
    price: data.price,
    comparePrice: data.comparePrice ?? null,
    cost: data.cost ?? null,
    currency: data.currency,
    moq: data.moq,
    unit: data.unit,
    status: data.status,
    featured: data.featured,
    sortOrder: data.sortOrder,
    publishedAt: data.status === "PUBLISHED" ? new Date() : null,
  };
}

function databaseError(error: unknown): ProductFormState {
  if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
    return { error: "The slug or SKU is already used by another product." };
  }
  return { error: error instanceof Error ? error.message : "The product could not be saved." };
}

export async function createProduct(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();
  const result = parseFormData(formData);
  if (!result.success) return { errors: result.error.flatten().fieldErrors };

  let productId: string;
  try {
    const product = await prisma.product.create({
      data: {
        ...productData(result.data),
        ...relationData(result.data),
      },
    });
    productId = product.id;
  } catch (error) {
    return databaseError(error);
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${result.data.slug}`);
  revalidatePath("/sitemap.xml");
  redirect(`/admin/products/${productId}?saved=created`);
}

export async function updateProduct(
  productId: string,
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();
  const result = parseFormData(formData);
  if (!result.success) return { errors: result.error.flatten().fieldErrors };

  let previousSlug = result.data.slug;
  try {
    const current = await prisma.product.findUnique({
      where: { id: productId },
      select: { publishedAt: true, slug: true },
    });
    if (!current) return { error: "This product no longer exists." };
    previousSlug = current.slug;

    await prisma.$transaction(
      async (transaction) => {
        await Promise.all([
          transaction.productImage.deleteMany({ where: { productId } }),
          transaction.productAttribute.deleteMany({ where: { productId } }),
          transaction.productSpecification.deleteMany({ where: { productId } }),
          transaction.priceTier.deleteMany({ where: { productId } }),
          transaction.productFeature.deleteMany({ where: { productId } }),
        ]);
        await transaction.product.update({
          where: { id: productId },
          data: {
            ...productData(result.data),
            publishedAt:
              result.data.status === "PUBLISHED" ? current.publishedAt ?? new Date() : null,
            ...relationData(result.data),
          },
        });
      },
      { maxWait: 10_000, timeout: 20_000 },
    );
  } catch (error) {
    return databaseError(error);
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${previousSlug}`);
  revalidatePath(`/products/${result.data.slug}`);
  revalidatePath("/sitemap.xml");
  redirect(`/admin/products/${productId}?saved=updated`);
}

export async function getAdminProduct(productId: string): Promise<AdminProductInput | null> {
  await requireAdmin();
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      attributes: { orderBy: { sortOrder: "asc" } },
      specifications: { orderBy: { sortOrder: "asc" } },
      features: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!product) return null;

  return {
    ...product,
    content: serializeStoredProductContentForEditor(product.content),
    price: Number(product.price),
    comparePrice: product.comparePrice === null ? null : Number(product.comparePrice),
    cost: product.cost === null ? null : Number(product.cost),
    images: product.images.map(({ url, alt }) => ({ url, alt })),
    attributes: product.attributes.map(({ label, value }) => ({ label, value })),
    specifications: product.specifications.map(({ label, value }) => ({ label, value })),
    features: product.features.map(({ value }) => value),
  };
}

export async function getAdminProducts() {
  await requireAdmin();
  const products = await prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });

  return products.map((product) => ({
    ...product,
    price: Number(product.price),
    comparePrice: product.comparePrice === null ? null : Number(product.comparePrice),
    cost: product.cost === null ? null : Number(product.cost),
  }));
}
