import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleCheck } from "lucide-react";
import { getAdminCategories, getAdminProduct } from "@/actions/products";
import { AdminHeader } from "@/components/admin/admin-header";
import { ProductForm } from "@/components/admin/product-form";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function EditProductPage({ params, searchParams }: EditProductPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [product, categories] = await Promise.all([
    getAdminProduct(id),
    getAdminCategories(),
  ]);
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
          <div>
            <p>{query.saved === "created"
              ? "Testable product record created successfully."
              : query.saved === "imported"
                ? "Approved candidate imported as a private draft. Review its commercial fields and add authorized R2 media before publishing."
                : query.saved === "quick-published"
                  ? "Source content was copied and published with deferred verification. Field conflicts remain traceable; certificate claims are unverified and source images were not attached."
                  : "Product changes saved successfully."}</p>
            {query.saved === "quick-published" ? (
              <Link href={`/products/${product.slug}`} target="_blank" className="mt-2 inline-block underline underline-offset-4">
                Open live product page
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
