import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/admin-auth";

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/products" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[var(--ink-muted)] hover:text-[var(--ink)]">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to products
      </Link>
      <AdminHeader
        eyebrow="Catalog"
        title="Add Product"
        description="Create a complete product record for the Glarivo wholesale catalog."
      />
      <ProductForm />
    </div>
  );
}
