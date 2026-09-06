import Image from "next/image";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { getAdminProducts } from "@/actions/products";
import { AdminHeader } from "@/components/admin/admin-header";
import { ProductPagination } from "@/components/product-pagination";
import { getPageNumber } from "@/lib/product-pagination";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  const { products, pagination } = await getAdminProducts(getPageNumber((await searchParams).page));

  return (
    <div className="mx-auto max-w-7xl">
      <AdminHeader
        eyebrow="Catalog"
        title="Products"
        description="Create and maintain database-backed wholesale product records."
        action={
          <Link href="/admin/products/new" className="button-primary">
            <Plus className="size-4" aria-hidden="true" />
            Add product
          </Link>
        }
      />

      <div className="mt-7 overflow-hidden rounded-3xl border border-[#d7dcd8] bg-white">
        {products.length ? (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead className="border-b border-[#d7dcd8] bg-[#f5f7f4] text-[0.68rem] font-black uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Price / MOQ</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e7e3]">
              {products.map((product) => (
                <tr key={product.id} className="text-sm">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-[#eef0ed]">
                        {product.images[0] ? <Image src={product.images[0].url} alt={product.images[0].alt} fill sizes="48px" className="object-cover" /> : null}
                      </div>
                      <div>
                        <strong className="block text-[var(--ink)]">{product.name}</strong>
                        <span className="mt-1 block text-xs text-[var(--ink-muted)]">{product.sku || `/${product.slug}`}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[var(--ink-muted)]">{product.categoryName}</td>
                  <td className="px-5 py-4">
                    <strong>{product.price === null ? "Request quote" : `${product.currency} ${product.price.toFixed(2)}`}</strong>
                    <span className="mt-1 block text-xs text-[var(--ink-muted)]">{product.moq === null ? "MOQ not confirmed" : `MOQ ${product.moq}${product.unit ? ` ${product.unit}` : ""}`}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${product.status === "PUBLISHED" ? "bg-[#e8f5e6] text-[#286a31]" : product.status === "ARCHIVED" ? "bg-[#eceeed] text-[#68706a]" : "bg-[#fff5e8] text-[#82522d]"}`}>
                      {product.status.charAt(0) + product.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/admin/products/${product.id}`} className="inline-flex items-center gap-2 font-black text-[var(--accent-dark)] hover:underline">
                      <Pencil className="size-4" aria-hidden="true" /> Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        ) : (
          <div className="px-6 py-20 text-center">
            <h2 className="text-2xl font-black tracking-[-0.04em]">No database products yet.</h2>
            <p className="mt-3 text-sm text-[var(--ink-muted)]">Create the first product to test the complete entry and editing workflow.</p>
            <Link href="/admin/products/new" className="button-primary mt-7"><Plus className="size-4" /> Add product</Link>
          </div>
        )}
      </div>
      <ProductPagination pagination={pagination} path="/admin/products" />
    </div>
  );
}
