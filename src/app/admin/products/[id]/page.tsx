import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleCheck } from "lucide-react";
import { getAdminProduct } from "@/actions/products";
import { AdminHeader } from "@/components/admin/admin-header";
import { ProductForm } from "@/components/admin/product-form";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function EditProductPage({ params, searchParams }: EditProductPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const product = await getAdminProduct(id);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/products" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[var(--ink-muted)] hover:text-[var(--ink)]">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to products
      </Link>
      <AdminHeader
        eyebrow="Catalog"
        title="Edit Product"
        description={`Maintain ${product.name} and its related catalog fields.`}
      />
      {query.saved ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#acd3b0] bg-[#edf9ee] p-4 text-sm font-bold text-[#286a31]" role="status">
          <CircleCheck className="size-5" aria-hidden="true" />
          {query.saved === "created" ? "Testable product record created successfully." : "Product changes saved successfully."}
        </div>
      ) : null}
      <ProductForm product={product} />
    </div>
  );
}
