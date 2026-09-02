"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import type { CategoryFormState } from "@/types/admin-category";

const categoryIdSchema = z.string().trim().min(1).max(100);
const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(120),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  parentId: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    categoryIdSchema.optional(),
  ),
  sortOrder: z.coerce.number().int().min(0, "Sort order cannot be negative").max(999999),
  isActive: z.boolean(),
});

function parseCategoryForm(formData: FormData) {
  return categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    parentId: formData.get("parentId"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive") === "on",
  });
}

function categoryDatabaseError(error: unknown): CategoryFormState {
  if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
    return { errors: { slug: ["This slug is already used by another category."] } };
  }
  return { error: "The category could not be saved. Please try again." };
}

async function validateParentChain(
  parentId: string | undefined,
  categoryId?: string,
  requireActiveAncestors = false,
): Promise<CategoryFormState | null> {
  if (!parentId) return null;
  if (parentId === categoryId) {
    return { errors: { parentId: ["A category cannot be its own parent."] } };
  }

  const visited = new Set<string>();
  let currentId: string | null = parentId;
  while (currentId) {
    if (visited.has(currentId) || currentId === categoryId) {
      return { errors: { parentId: ["This parent would create a category cycle."] } };
    }
    visited.add(currentId);
    const current: { parentId: string | null; isActive: boolean } | null = await prisma.category.findUnique({
      where: { id: currentId },
      select: { parentId: true, isActive: true },
    });
    if (!current) {
      return { errors: { parentId: ["Select an existing parent category."] } };
    }
    if (requireActiveAncestors && !current.isActive) {
      return { errors: { parentId: ["An active category must use an entirely active parent path."] } };
    }
    currentId = current.parentId;
  }
  return null;
}

function revalidateCategoryPaths(categoryId?: string) {
  revalidatePath("/admin/categories");
  if (categoryId) revalidatePath(`/admin/categories/${categoryId}`);
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
  revalidatePath("/products");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
}

export async function createCategory(
  _previousState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();
  const result = parseCategoryForm(formData);
  if (!result.success) return { errors: result.error.flatten().fieldErrors };

  const parentError = await validateParentChain(
    result.data.parentId,
    undefined,
    result.data.isActive,
  );
  if (parentError) return parentError;

  let categoryId: string;
  try {
    const category = await prisma.category.create({
      data: {
        name: result.data.name,
        slug: result.data.slug,
        parentId: result.data.parentId ?? null,
        sortOrder: result.data.sortOrder,
        isActive: result.data.isActive,
      },
      select: { id: true },
    });
    categoryId = category.id;
  } catch (error) {
    return categoryDatabaseError(error);
  }

  revalidateCategoryPaths(categoryId);
  redirect(`/admin/categories/${categoryId}?saved=created`);
}

export async function updateCategory(
  categoryId: string,
  _previousState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();
  const idResult = categoryIdSchema.safeParse(categoryId);
  if (!idResult.success) return { error: "This category identifier is invalid." };
  const result = parseCategoryForm(formData);
  if (!result.success) return { errors: result.error.flatten().fieldErrors };

  const parentError = await validateParentChain(
    result.data.parentId,
    idResult.data,
    result.data.isActive,
  );
  if (parentError) return parentError;

  try {
    const current = await prisma.category.findUnique({
      where: { id: idResult.data },
      select: {
        slug: true,
        isActive: true,
        _count: { select: { productLinks: true } },
        children: { where: { isActive: true }, select: { id: true }, take: 1 },
      },
    });
    if (!current) return { error: "This category no longer exists." };

    if (current.isActive && !result.data.isActive && current._count.productLinks > 0) {
      return {
        errors: {
          isActive: ["Reassign linked products before deactivating this category."],
        },
      };
    }
    if (current.isActive && !result.data.isActive && current.children.length > 0) {
      return {
        errors: {
          isActive: ["Deactivate or move active child categories first."],
        },
      };
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.category.update({
        where: { id: idResult.data },
        data: {
          name: result.data.name,
          slug: result.data.slug,
          parentId: result.data.parentId ?? null,
          sortOrder: result.data.sortOrder,
          isActive: result.data.isActive,
        },
      });

      if (current.slug !== result.data.slug) {
        await transaction.product.updateMany({
          where: {
            categories: {
              some: { categoryId: idResult.data, isPrimary: true },
            },
          },
          data: { legacyCategory: result.data.slug },
        });
      }
    });
  } catch (error) {
    return categoryDatabaseError(error);
  }

  revalidateCategoryPaths(idResult.data);
  redirect(`/admin/categories/${idResult.data}?saved=updated`);
}

export async function deleteCategory(categoryId: string, formData: FormData) {
  await requireAdmin();
  const idResult = categoryIdSchema.safeParse(categoryId);
  if (!idResult.success) redirect("/admin/categories?error=invalid-id");
  if (formData.get("confirmDelete") !== "yes") {
    redirect(`/admin/categories/${idResult.data}?error=confirm-delete`);
  }

  const category = await prisma.category.findUnique({
    where: { id: idResult.data },
    select: {
      _count: { select: { children: true, productLinks: true, externalMappings: true } },
    },
  });
  if (!category) redirect("/admin/categories?error=not-found");

  if (
    category._count.children > 0 ||
    category._count.productLinks > 0 ||
    category._count.externalMappings > 0
  ) {
    redirect(`/admin/categories/${idResult.data}?error=delete-blocked`);
  }

  try {
    await prisma.category.delete({ where: { id: idResult.data } });
  } catch {
    redirect(`/admin/categories/${idResult.data}?error=delete-failed`);
  }

  revalidateCategoryPaths();
  redirect("/admin/categories?saved=deleted");
}
