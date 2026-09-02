"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { syncGarboSourceCategorySnapshot } from "@/lib/garbo-source-categories";
import { prisma } from "@/lib/prisma";

const idSchema = z.string().trim().min(1).max(100);

export async function syncGarboCategories(): Promise<void> {
  await requireAdmin();
  const result = await syncGarboSourceCategorySnapshot();
  revalidatePath("/admin/imports");
  revalidatePath("/admin/imports/garbo-categories");
  redirect(`/admin/imports/garbo-categories?saved=synced&count=${result.total}`);
}

export async function setGarboCategoryImportable(idValue: string, formData: FormData): Promise<void> {
  await requireAdmin();
  const id = idSchema.safeParse(idValue);
  const enabled = formData.get("enabled") === "true";
  if (!id.success) redirect("/admin/imports/garbo-categories?error=invalid-id");
  const result = await prisma.externalSourceCategory.updateMany({
    where: { id: id.data, provider: "GARBO" },
    data: { isImportable: enabled },
  });
  if (result.count !== 1) redirect("/admin/imports/garbo-categories?error=not-found");
  revalidatePath("/admin/imports");
  revalidatePath("/admin/imports/garbo-categories");
  redirect("/admin/imports/garbo-categories?saved=updated");
}
