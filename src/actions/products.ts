"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import {
  prepareProductContentForStorage,
  serializeStoredProductContentForEditor,
} from "@/lib/article-content-server";
import { prisma } from "@/lib/prisma";
import { getProductPagination, PRODUCTS_PER_PAGE } from "@/lib/product-pagination";
import {
  PRODUCT_DETAIL_STATEMENT_MAX_ITEMS,
  PRODUCT_DETAIL_STATEMENT_MAX_LENGTH,
} from "@/lib/product-limits";
import type {
  AdminCategoryOption,
  AdminProductInput,
  ProductFormState,
} from "@/types/admin-product";

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
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  storageKey: z.string().trim().max(1000).nullable().optional(),
  mimeType: z.string().trim().max(120).nullable().optional(),
});

const contentSectionSchema = z.object({
  sourceKey: z
    .string()
    .trim()
    .min(1, "Section key is required")
    .max(120)
    .regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/, "Use lowercase letters, numbers, and underscores"),
  title: z.string().trim().min(1, "Section title is required").max(180),
  body: z.string().trim().max(20000).default(""),
  images: z.array(imageSchema).max(12),
});

const optionalMoney = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.number().min(0).optional(),
);

const optionalPositiveInteger = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.number().int().min(1, "MOQ must be at least 1").optional(),
);

const optionalShortText = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().max(40).optional(),
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

const productFeaturesSchema = z
  .array(z.string().trim().min(1, "Detail statement cannot be empty"))
  .max(
    PRODUCT_DETAIL_STATEMENT_MAX_ITEMS,
    `Details support up to ${PRODUCT_DETAIL_STATEMENT_MAX_ITEMS} statements`,
  )
  .superRefine((features, context) => {
    features.forEach((feature, index) => {
      if (feature.length <= PRODUCT_DETAIL_STATEMENT_MAX_LENGTH) return;
      context.addIssue({
        code: "too_big",
        maximum: PRODUCT_DETAIL_STATEMENT_MAX_LENGTH,
        origin: "string",
        inclusive: true,
        path: [index],
        message: `Detail statement ${index + 1} is too long (${feature.length}/${PRODUCT_DETAIL_STATEMENT_MAX_LENGTH} characters)`,
      });
    });
  });

const productSchema = z
  .object({
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
  sourceProvider: z.enum(["GARBO", "MANUAL"]).nullable(),
  sourceUrl: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().url("Use a complete source URL").max(2000).optional(),
  ),
  sourceCategoryPath: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(500).optional(),
  ),
  detailsHeading: z.string().trim().min(1).max(180),
  specificationHeading: z.string().trim().min(1).max(240),
  categoryId: z.string().trim().min(1, "Select a valid category").max(100),
  pricingMode: z.enum(["REQUEST_QUOTE", "FIXED", "TIERED"]),
  price: optionalMoney,
  comparePrice: optionalMoney,
  cost: optionalMoney,
  currency: z.enum(["USD", "EUR", "CNY"]),
  moq: optionalPositiveInteger,
  unit: optionalShortText,
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  featured: z.boolean(),
  sortOrder: z.coerce.number().int().min(0),
  images: z.array(imageSchema).max(20),
  overviewFields: z.array(pairSchema).max(30),
  contentSections: z.array(contentSectionSchema).max(20),
  attributes: z.array(pairSchema).max(30),
  specifications: z.array(pairSchema).max(60),
  features: productFeaturesSchema,
  })
  .superRefine((data, context) => {
    if (data.pricingMode === "FIXED" && data.price === undefined) {
      context.addIssue({
        code: "custom",
        path: ["price"],
        message: "Price is required when pricing mode is Fixed price",
      });
    }
    const sectionKeys = new Set<string>();
    data.contentSections.forEach((section, index) => {
      if (sectionKeys.has(section.sourceKey)) {
        context.addIssue({
          code: "custom",
          path: ["contentSections", index, "sourceKey"],
          message: "Section keys must be unique",
        });
      }
      sectionKeys.add(section.sourceKey);
    });
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
  sourceProvider: formData.get("sourceProvider") || null,
  sourceUrl: formData.get("sourceUrl"),
  sourceCategoryPath: formData.get("sourceCategoryPath"),
  detailsHeading: formData.get("detailsHeading"),
  specificationHeading: formData.get("specificationHeading"),
  categoryId: formData.get("categoryId"),
    pricingMode: formData.get("pricingMode"),
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
  overviewFields: parseJsonField(formData, "overviewFields", []),
  contentSections: parseJsonField(formData, "contentSections", []),
  attributes: parseJsonField(formData, "attributes", []),
    specifications: parseJsonField(formData, "specifications", []),
    features: parseJsonField(formData, "features", []),
  });
}

function relationData(data: z.infer<typeof productSchema>) {
  return {
    images: {
      create: data.images.map((image, sortOrder) => ({
        ...image,
        role: "GALLERY" as const,
        rightsStatus: "AUTHORIZED" as const,
        reviewStatus: "VERIFIED" as const,
        sortOrder,
      })),
    },
    overviewFields: {
      create: data.overviewFields.map((field, sortOrder) => ({
        ...field,
        reviewStatus: "VERIFIED" as const,
        sortOrder,
      })),
    },
    attributes: {
      create: data.attributes.map((attribute, sortOrder) => ({
        ...attribute,
        reviewStatus: "VERIFIED" as const,
        sortOrder,
      })),
    },
    specifications: {
      create: data.specifications.map((specification, sortOrder) => ({
        ...specification,
        reviewStatus: "VERIFIED" as const,
        sortOrder,
      })),
    },
    features: {
      create: data.features.map((value, sortOrder) => ({ value, sortOrder })),
    },
  };
}

function defaultVariantData(data: z.infer<typeof productSchema>) {
  return {
    sku: data.sku ?? null,
    label: data.sku ?? "Default",
    isDefault: true,
    price: data.price ?? null,
    moq: data.moq ?? null,
    unit: data.unit ?? null,
    reviewStatus: "VERIFIED" as const,
  };
}

function productData(data: z.infer<typeof productSchema>, categorySlug: string) {
  return {
    name: data.name,
    slug: data.slug,
    sku: data.sku ?? null,
    summary: data.summary,
    description: data.description,
    content: data.content,
    pageTemplate: "GARBO_DETAIL" as const,
    sourceProvider: data.sourceProvider,
    sourceUrl: data.sourceUrl ?? null,
    sourceCategoryPath: data.sourceCategoryPath ?? null,
    detailsHeading: data.detailsHeading,
    specificationHeading: data.specificationHeading,
    legacyCategory: categorySlug,
    pricingMode: data.pricingMode,
    price: data.price ?? null,
    comparePrice: data.comparePrice ?? null,
    cost: data.cost ?? null,
    currency: data.currency,
    moq: data.moq ?? null,
    unit: data.unit ?? null,
    status: data.status,
    featured: data.featured,
    sortOrder: data.sortOrder,
    publishedAt: data.status === "PUBLISHED" ? new Date() : null,
  };
}

async function createContentSections(
  transaction: Prisma.TransactionClient,
  productId: string,
  sections: z.infer<typeof productSchema>["contentSections"],
) {
  for (const [sortOrder, section] of sections.entries()) {
    const created = await transaction.productContentSection.create({
      data: {
        productId,
        sourceKey: section.sourceKey,
        title: section.title,
        body: section.body,
        sortOrder,
      },
      select: { id: true },
    });
    if (section.images.length) {
      await transaction.productImage.createMany({
        data: section.images.map((image, imageSortOrder) => ({
          ...image,
          productId,
          contentSectionId: created.id,
          role: "DETAIL" as const,
          sectionKey: section.sourceKey,
          rightsStatus: "AUTHORIZED" as const,
          reviewStatus: "VERIFIED" as const,
          sortOrder: imageSortOrder,
        })),
      });
    }
  }
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
    const category = await prisma.category.findFirst({
      where: { id: result.data.categoryId, isActive: true },
      select: { id: true, slug: true },
    });
    if (!category) return { errors: { categoryId: ["Select an active category"] } };

    const product = await prisma.$transaction(
      async (transaction) => {
        const created = await transaction.product.create({
          data: {
            ...productData(result.data, category.slug),
            ...relationData(result.data),
            categories: {
              create: { categoryId: category.id, isPrimary: true, sortOrder: 0 },
            },
            variants: { create: defaultVariantData(result.data) },
          },
        });
        await createContentSections(
          transaction,
          created.id,
          result.data.contentSections,
        );
        return created;
      },
      { maxWait: 10_000, timeout: 20_000 },
    );
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
    const category = await prisma.category.findFirst({
      where: { id: result.data.categoryId, isActive: true },
      select: { id: true, slug: true },
    });
    if (!category) return { errors: { categoryId: ["Select an active category"] } };

    const current = await prisma.product.findUnique({
      where: { id: productId },
      select: { publishedAt: true, slug: true },
    });
    if (!current) return { error: "This product no longer exists." };
    previousSlug = current.slug;

    await prisma.$transaction(
      async (transaction) => {
        await transaction.productSpecification.deleteMany({
          where: { productId, variantId: null, componentId: null },
        });
        await transaction.productImage.deleteMany({
          where: {
            productId,
            role: {
              in: ["GALLERY", "DETAIL", "SIZE_GUIDE", "PRODUCTION", "PACKAGING", "OEM_ODM"],
            },
          },
        });
        await Promise.all([
          transaction.productOverviewField.deleteMany({ where: { productId } }),
          transaction.productContentSection.deleteMany({ where: { productId } }),
          transaction.productAttribute.deleteMany({ where: { productId } }),
          transaction.priceTier.deleteMany({ where: { productId } }),
          transaction.productFeature.deleteMany({ where: { productId } }),
          transaction.productCategory.deleteMany({ where: { productId, isPrimary: true } }),
        ]);
        const defaultVariant = await transaction.productVariant.findFirst({
          where: { productId, isDefault: true },
          select: { id: true },
        });
        if (defaultVariant) {
          await transaction.productVariant.update({
            where: { id: defaultVariant.id },
            data: defaultVariantData(result.data),
          });
        } else {
          await transaction.productVariant.create({
            data: { productId, ...defaultVariantData(result.data) },
          });
        }
        await transaction.productCategory.upsert({
          where: {
            productId_categoryId: { productId, categoryId: category.id },
          },
          create: { productId, categoryId: category.id, isPrimary: true, sortOrder: 0 },
          update: { isPrimary: true, sortOrder: 0 },
        });
        await transaction.product.update({
          where: { id: productId },
          data: {
            ...productData(result.data, category.slug),
            publishedAt:
              result.data.status === "PUBLISHED" ? current.publishedAt ?? new Date() : null,
            ...relationData(result.data),
          },
        });
        await createContentSections(
          transaction,
          productId,
          result.data.contentSections,
        );
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
      images: { where: { role: "GALLERY" }, orderBy: { sortOrder: "asc" } },
      attributes: { orderBy: { sortOrder: "asc" } },
      overviewFields: { orderBy: { sortOrder: "asc" } },
      specifications: {
        where: { variantId: null, componentId: null },
        orderBy: { sortOrder: "asc" },
      },
      contentSections: {
        orderBy: { sortOrder: "asc" },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
        },
      },
      features: { orderBy: { sortOrder: "asc" } },
      categories: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        include: { category: true },
      },
    },
  });
  if (!product) return null;

  const primaryCategory = product.categories[0]?.category;
  const overviewPriority = ["material", "package", "usage", "capacity", "product_size"];
  const legacyOverview = [...product.attributes, ...product.specifications]
    .filter((field) => field.key && overviewPriority.includes(field.key))
    .sort(
      (left, right) =>
        overviewPriority.indexOf(left.key ?? "") - overviewPriority.indexOf(right.key ?? ""),
    )
    .map(({ label, value }) => ({ label, value }));

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    categoryId: primaryCategory?.id ?? "",
    categorySlug: primaryCategory?.slug ?? product.legacyCategory,
    categoryName: primaryCategory?.name ?? product.legacyCategory,
    summary: product.summary,
    description: product.description,
    content: serializeStoredProductContentForEditor(product.content),
    sourceProvider: product.sourceProvider,
    sourceUrl: product.sourceUrl,
    sourceCategoryPath: product.sourceCategoryPath,
    detailsHeading: product.detailsHeading,
    specificationHeading: product.specificationHeading,
    pricingMode: product.pricingMode,
    price: product.price === null ? null : Number(product.price),
    comparePrice: product.comparePrice === null ? null : Number(product.comparePrice),
    cost: product.cost === null ? null : Number(product.cost),
    currency: product.currency,
    moq: product.moq,
    unit: product.unit,
    status: product.status,
    featured: product.featured,
    sortOrder: product.sortOrder,
    images: product.images.map(({ url, alt, width, height, storageKey, mimeType }) => ({
      url,
      alt,
      width,
      height,
      storageKey,
      mimeType,
    })),
    overviewFields: product.overviewFields.length
      ? product.overviewFields.map(({ label, value }) => ({ label, value }))
      : legacyOverview,
    contentSections: product.contentSections.map((section) => ({
      sourceKey: section.sourceKey,
      title: section.title,
      body: section.body,
      images: section.images.map(({ url, alt, width, height, storageKey, mimeType }) => ({
        url,
        alt,
        width,
        height,
        storageKey,
        mimeType,
      })),
    })),
    attributes: product.attributes.map(({ label, value }) => ({ label, value })),
    specifications: product.specifications.map(({ label, value }) => ({ label, value })),
    features: product.features.map(({ value }) => value),
  };
}

export async function getAdminProducts(requestedPage = 1) {
  await requireAdmin();
  const pagination = getProductPagination(await prisma.product.count(), requestedPage);
  const products = await prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }, { id: "asc" }],
    skip: pagination.skip,
    take: PRODUCTS_PER_PAGE,
    include: {
      images: { where: { role: "GALLERY" }, orderBy: { sortOrder: "asc" }, take: 1 },
      categories: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        take: 1,
        include: { category: true },
      },
    },
  });

  return { pagination, products: products.map((product) => ({
    ...product,
    categoryName: product.categories[0]?.category.name ?? product.legacyCategory,
    categorySlug: product.categories[0]?.category.slug ?? product.legacyCategory,
    price: product.price === null ? null : Number(product.price),
    comparePrice: product.comparePrice === null ? null : Number(product.comparePrice),
    cost: product.cost === null ? null : Number(product.cost),
  })) };
}

export async function getAdminCategories(): Promise<AdminCategoryOption[]> {
  await requireAdmin();
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, slug: true, name: true, parentId: true, sortOrder: true },
  });

  const childrenByParent = new Map<string | null, typeof categories>();
  for (const category of categories) {
    const siblings = childrenByParent.get(category.parentId) ?? [];
    siblings.push(category);
    childrenByParent.set(category.parentId, siblings);
  }

  const result: AdminCategoryOption[] = [];
  const visit = (parentId: string | null, depth: number, parentLabel = "") => {
    for (const category of childrenByParent.get(parentId) ?? []) {
      const label = parentLabel ? `${parentLabel} / ${category.name}` : category.name;
      result.push({ id: category.id, slug: category.slug, name: category.name, label, depth });
      visit(category.id, depth + 1, label);
    }
  };
  visit(null, 0);
  return result;
}
