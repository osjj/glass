import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { SetupNotice } from "@/components/admin/setup-notice";
import { productCategories } from "@/data/catalog";

const fieldClass = "mt-2 h-12 w-full rounded-xl border border-[#ccd3ce] bg-white px-4 text-sm text-[var(--ink)]";

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/products" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[var(--ink-muted)] hover:text-[var(--ink)]">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to products
      </Link>
      <AdminHeader
        eyebrow="Catalog"
        title="Add product"
        description="Initial form layout for a simple product record."
      />
      <div className="mt-6">
        <SetupNotice />
      </div>

      <form className="mt-7 grid gap-6 rounded-3xl border border-[#d7dcd8] bg-white p-6 sm:p-8" aria-label="New product interface preview">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-black">
            Product name
            <input className={fieldClass} type="text" name="name" placeholder="Enter product name" />
          </label>
          <label className="text-sm font-black">
            Slug
            <input className={fieldClass} type="text" name="slug" placeholder="product-slug" />
          </label>
        </div>
        <label className="text-sm font-black">
          Category
          <select className={fieldClass} name="category" defaultValue="">
            <option value="" disabled>Select a category</option>
            {productCategories.map((category) => (
              <option key={category.slug} value={category.slug}>{category.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-black">
          Short summary
          <textarea className="mt-2 min-h-28 w-full rounded-xl border border-[#ccd3ce] bg-white p-4 text-sm" name="summary" placeholder="Short product summary" />
        </label>
        <label className="text-sm font-black">
          Description
          <textarea className="mt-2 min-h-44 w-full rounded-xl border border-[#ccd3ce] bg-white p-4 text-sm" name="description" placeholder="Product description" />
        </label>
        <div className="flex items-center justify-end gap-3 border-t border-[#e4e7e3] pt-6">
          <Link href="/admin/products" className="button-secondary">Cancel</Link>
          <button type="button" disabled className="button-primary cursor-not-allowed opacity-50" title="Database integration is not connected yet">
            Save draft
          </button>
        </div>
      </form>
    </div>
  );
}
