"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { syncGlarivoCategoriesFromGarbo } from "@/lib/glarivo-category-sync";

export async function syncGlarivoCategories(): Promise<void> {
  await requireAdmin();
  const result = await syncGlarivoCategoriesFromGarbo();
  revalidatePath("/admin/categories");
  revalidatePath("/admin/imports");
  revalidatePath("/admin/imports/garbo-categories");
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/sitemap.xml");
  const query = new URLSearchParams({
    saved: "garbo-aligned",
    total: String(result.total),
    created: String(result.created),
    mapped: String(result.mapped),
    reassigned: String(result.reassignedProducts),
  });
  redirect(`/admin/categories?${query.toString()}`);
}
