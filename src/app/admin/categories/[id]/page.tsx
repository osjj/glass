import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleAlert, CircleCheck, ExternalLink, Trash2 } from "lucide-react";
import { deleteCategory } from "@/actions/categories";
import { AdminHeader } from "@/components/admin/admin-header";
import { CategoryForm } from "@/components/admin/category-form";
import { getAdminCategoryEditorData } from "@/lib/admin-categories";

type EditCategoryPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
};

function editError(error: string | undefined) {
  if (error === "confirm-delete") return "Confirm permanent deletion before continuing.";
  if (error === "delete-blocked") return "This category is still in use. Remove its children, product assignments, and source mappings before deleting it.";
  if (error === "delete-failed") return "The category could not be deleted. Its relationships may have changed; refresh and try again.";
  return null;
}

export default async function EditCategoryPage({ params, searchParams }: EditCategoryPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { category, parentOptions } = await getAdminCategoryEditorData(id);
  if (!category) notFound();

  const canDelete = category.childCount === 0 && category.productCount === 0 && category.mappingCount === 0;
  const errorMessage = editError(query.error);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/categories" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[var(--ink-muted)] hover:text-[var(--ink)]">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to categories
      </Link>
      <AdminHeader
        eyebrow="Catalog structure"
        title="Edit Category"
        description={`Maintain ${category.name}, its hierarchy, and its catalog availability.`}
      />

      {query.saved ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#acd3b0] bg-[#edf9ee] p-4 text-sm font-bold text-[#286a31]" role="status">
          <CircleCheck className="size-5" aria-hidden="true" />
          {query.saved === "created" ? "Category created successfully." : "Category changes saved successfully."}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#e4a69f] bg-[#fff0ee] p-4 text-sm font-bold text-[#8d2f27]" role="alert">
          <CircleAlert className="size-5" aria-hidden="true" /> {errorMessage}
        </div>
      ) : null}

      <CategoryForm category={category} parentOptions={parentOptions} />

      <section className="mt-6 rounded-3xl border border-[#d7dcd8] bg-white p-5 sm:p-6">
        <h2 className="text-lg font-black">Relationships</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--ink-muted)]">
          Relationships are protected so a category cannot be removed while catalog data still depends on it.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ["Products", category.productCount],
            ["Child categories", category.childCount],
            ["Source mappings", category.mappingCount],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-[#f5f7f4] p-4">
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[var(--ink-muted)]">{label}</span>
              <strong className="mt-2 block text-2xl font-black">{value}</strong>
            </div>
          ))}
        </div>

        {category.linkedProducts.length ? (
          <div className="mt-5 border-t border-[#e4e7e3] pt-5">
            <h3 className="text-sm font-black">Linked products</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {category.linkedProducts.map((product) => (
                <Link key={product.id} href={`/admin/products/${product.id}`} className="inline-flex items-center gap-2 rounded-full border border-[#d7dcd8] px-3 py-2 text-xs font-bold hover:border-[var(--accent-dark)]">
                  {product.name} · {product.status.toLowerCase()}{product.isPrimary ? " · primary" : ""}
                  <ExternalLink className="size-3" aria-hidden="true" />
                </Link>
              ))}
            </div>
            {category.productCount > category.linkedProducts.length ? (
              <p className="mt-3 text-xs text-[var(--ink-muted)]">Showing the first {category.linkedProducts.length} assignments.</p>
            ) : null}
          </div>
        ) : null}

        {category.mappings.length ? (
          <div className="mt-5 border-t border-[#e4e7e3] pt-5">
            <h3 className="text-sm font-black">Source mappings</h3>
            <div className="mt-3 space-y-2">
              {category.mappings.map((mapping) => (
                <div key={mapping.id} className="rounded-xl border border-[#d7dcd8] bg-[#f8f9f7] px-4 py-3 text-sm">
                  <strong>{mapping.provider}</strong>
                  <code className="ml-3 text-xs text-[var(--ink-muted)]">{mapping.sourcePath}</code>
                  {mapping.sourceName ? <span className="mt-1 block text-xs text-[var(--ink-muted)]">{mapping.sourceName}</span> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-6 rounded-3xl border border-[#e4a69f] bg-[#fff8f7] p-5 sm:p-6">
        <h2 className="text-lg font-black text-[#8d2f27]">Delete category</h2>
        {canDelete ? (
          <form action={deleteCategory.bind(null, category.id)} className="mt-3 sm:flex sm:items-end sm:justify-between sm:gap-6">
            <label className="flex max-w-2xl items-start gap-3 text-sm leading-6 text-[#6f3a35]">
              <input className="mt-1 size-5 accent-[#8d2f27]" type="checkbox" name="confirmDelete" value="yes" required />
              <span>I understand this permanently deletes the category and cannot be undone.</span>
            </label>
            <button type="submit" className="mt-4 inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#8d2f27] px-5 text-sm font-black text-white hover:bg-[#6f241e] sm:mt-0">
              <Trash2 className="size-4" aria-hidden="true" /> Delete permanently
            </button>
          </form>
        ) : (
          <p className="mt-3 text-sm leading-6 text-[#6f3a35]">
            Deletion is locked while this category has products, child categories, or source mappings. Reassign or remove those relationships first.
          </p>
        )}
      </section>
    </div>
  );
}
