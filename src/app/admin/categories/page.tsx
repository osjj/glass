import Link from "next/link";
import { CircleAlert, CircleCheck, Pencil, Plus, RefreshCw } from "lucide-react";
import { syncGlarivoCategories } from "@/actions/glarivo-categories";
import { AdminHeader } from "@/components/admin/admin-header";
import { getAdminCategoryTree } from "@/lib/admin-categories";

type CategoriesPageProps = {
  searchParams: Promise<{ saved?: string; error?: string; total?: string; created?: string; mapped?: string; reassigned?: string }>;
};

function pageError(error: string | undefined) {
  if (error === "invalid-id") return "That category identifier is invalid.";
  if (error === "not-found") return "That category no longer exists.";
  return null;
}

export default async function AdminCategoriesPage({ searchParams }: CategoriesPageProps) {
  const query = await searchParams;
  const categories = await getAdminCategoryTree();
  const activeCount = categories.filter((category) => category.isActive).length;
  const productCount = categories.reduce((total, category) => total + category.productCount, 0);
  const mappingCount = categories.reduce((total, category) => total + category.mappingCount, 0);
  const errorMessage = pageError(query.error);

  return (
    <div className="mx-auto max-w-7xl">
      <AdminHeader
        eyebrow="Catalog structure"
        title="Product Categories"
        description="Maintain category names, URLs, hierarchy, order, and availability from one place."
        action={
          <div className="flex flex-wrap gap-3">
            <form action={syncGlarivoCategories}>
              <button type="submit" className="button-secondary">
                <RefreshCw className="size-4" aria-hidden="true" /> Align with Garbo
              </button>
            </form>
            <Link href="/admin/categories/new" className="button-primary">
              <Plus className="size-4" aria-hidden="true" />
              Add category
            </Link>
          </div>
        }
      />

      {query.saved === "garbo-aligned" ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#acd3b0] bg-[#edf9ee] p-4 text-sm font-bold leading-6 text-[#286a31]" role="status">
          <CircleCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <span>Glarivo now has {query.total || "56"} active Garbo-aligned categories: {query.created || "0"} created, {query.mapped || "56"} mappings saved, and {query.reassigned || "0"} sourced products reassigned.</span>
        </div>
      ) : null}
      {query.saved === "deleted" ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#acd3b0] bg-[#edf9ee] p-4 text-sm font-bold text-[#286a31]" role="status">
          <CircleCheck className="size-5" aria-hidden="true" /> Category deleted successfully.
        </div>
      ) : null}
      {errorMessage ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#e4a69f] bg-[#fff0ee] p-4 text-sm font-bold text-[#8d2f27]" role="alert">
          <CircleAlert className="size-5" aria-hidden="true" /> {errorMessage}
        </div>
      ) : null}

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {[
          ["Active categories", activeCount],
          ["Product assignments", productCount],
          ["Source mappings", mappingCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-[#d7dcd8] bg-white p-5">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-[var(--ink-muted)]">{label}</p>
            <strong className="mt-2 block text-3xl font-black tracking-[-0.05em]">{value}</strong>
          </div>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-[#d7dcd8] bg-white">
        {categories.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead className="border-b border-[#d7dcd8] bg-[#f5f7f4] text-[0.68rem] font-black uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                <tr>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Hierarchy</th>
                  <th className="px-5 py-4">Usage</th>
                  <th className="px-5 py-4">Status / order</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4e7e3]">
                {categories.map((category) => (
                  <tr key={category.id} className="text-sm">
                    <td className="px-5 py-4">
                      <div style={{ paddingLeft: `${Math.min(category.depth, 5) * 18}px` }}>
                        <strong className="block text-[var(--ink)]">{category.name}</strong>
                        <code className="mt-1 block text-xs text-[var(--ink-muted)]">/{category.slug}</code>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[var(--ink-muted)]">
                      <span className="block">{category.parentName ?? "Top level"}</span>
                      <span className="mt-1 block max-w-xs truncate text-xs" title={category.label}>{category.label}</span>
                    </td>
                    <td className="px-5 py-4">
                      <strong>{category.productCount} product{category.productCount === 1 ? "" : "s"}</strong>
                      <span className="mt-1 block text-xs text-[var(--ink-muted)]">
                        {category.childCount} children · {category.mappingCount} mappings
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${category.isActive ? "bg-[#e8f5e6] text-[#286a31]" : "bg-[#eceeed] text-[#68706a]"}`}>
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="ml-3 text-xs font-bold text-[var(--ink-muted)]">#{category.sortOrder}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/admin/categories/${category.id}`} className="inline-flex items-center gap-2 font-black text-[var(--accent-dark)] hover:underline">
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
            <h2 className="text-2xl font-black tracking-[-0.04em]">No categories yet.</h2>
            <p className="mt-3 text-sm text-[var(--ink-muted)]">Create the first category before entering catalog products.</p>
            <Link href="/admin/categories/new" className="button-primary mt-7"><Plus className="size-4" /> Add category</Link>
          </div>
        )}
      </div>
    </div>
  );
}
