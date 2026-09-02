import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { CategoryForm } from "@/components/admin/category-form";
import { getAdminCategoryEditorData } from "@/lib/admin-categories";

export default async function NewCategoryPage() {
  const { parentOptions } = await getAdminCategoryEditorData();

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/categories" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[var(--ink-muted)] hover:text-[var(--ink)]">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to categories
      </Link>
      <AdminHeader
        eyebrow="Catalog structure"
        title="Add Category"
        description="Create a category and place it in the product catalog hierarchy."
      />
      <CategoryForm parentOptions={parentOptions} />
    </div>
  );
}
