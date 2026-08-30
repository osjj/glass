import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { SetupNotice } from "@/components/admin/setup-notice";
import { products } from "@/data/catalog";

export default function AdminProductsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <AdminHeader
        eyebrow="Catalog"
        title="Products"
        description="Review the initial product records and prepare the database-backed maintenance flow."
        action={
          <Link href="/admin/products/new" className="button-primary">
            <Plus className="size-4" aria-hidden="true" />
            Add product
          </Link>
        }
      />
      <div className="mt-6">
        <SetupNotice />
      </div>

      <div className="mt-7 overflow-hidden rounded-3xl border border-[#d7dcd8] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="border-b border-[#d7dcd8] bg-[#f5f7f4] text-[0.68rem] font-black uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Featured</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4e7e3]">
              {products.map((product) => (
                <tr key={product.id} className="text-sm">
                  <td className="px-5 py-4">
                    <strong className="block text-[var(--ink)]">{product.name}</strong>
                    <span className="mt-1 block text-xs text-[var(--ink-muted)]">/{product.slug}</span>
                  </td>
                  <td className="px-5 py-4 text-[var(--ink-muted)]">{product.categoryLabel}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-[#e8f5e6] px-3 py-1 text-xs font-black text-[#286a31]">Demo</span>
                  </td>
                  <td className="px-5 py-4 text-[var(--ink-muted)]">{product.featured ? "Yes" : "No"}</td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/products/${product.slug}`} className="font-black text-[var(--accent-dark)] hover:underline">
                      Preview
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
