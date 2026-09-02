import Link from "next/link";
import { ArrowLeft, CircleAlert, CircleCheck, ExternalLink, RefreshCw } from "lucide-react";
import {
  setGarboCategoryImportable,
  syncGarboCategories,
} from "@/actions/garbo-source-categories";
import { AdminHeader } from "@/components/admin/admin-header";
import { GARBO_CATEGORY_SNAPSHOT_DATE } from "@/lib/garbo-category-data";
import { getGarboSourceCategoryAdminList } from "@/lib/garbo-source-category-admin";

type PageProps = {
  searchParams: Promise<{ saved?: string; count?: string; error?: string }>;
};

function formatDate(value: Date | null) {
  if (!value) return "Not yet";
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "2-digit" }).format(value);
}

export default async function GarboCategoriesPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const categories = await getGarboSourceCategoryAdminList();
  const parentCount = categories.filter((category) => category.depth === 0).length;
  const mappedCount = categories.filter((category) => category.mapping).length;
  const importableCount = categories.filter((category) => category.isActive && category.isImportable).length;

  return (
    <div className="mx-auto max-w-7xl">
      <AdminHeader
        eyebrow="Independent source taxonomy"
        title="Garbo Categories"
        description="Garbo's source hierarchy is stored independently. A mapping only decides which Glarivo category receives products; it does not change either category tree."
        action={
          <form action={syncGarboCategories}>
            <button type="submit" className="button-primary"><RefreshCw className="size-4" /> Sync official snapshot</button>
          </form>
        }
      />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/imports" className="inline-flex items-center gap-2 text-sm font-black text-[var(--accent-dark)] hover:underline">
          <ArrowLeft className="size-4" /> Back to product import
        </Link>
        <p className="text-xs font-bold text-[var(--ink-muted)]">Official category-page snapshot: {GARBO_CATEGORY_SNAPSHOT_DATE}</p>
      </div>

      {query.saved === "synced" ? (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#acd3b0] bg-[#edf9ee] p-4 text-sm font-bold text-[#286a31]" role="status">
          <CircleCheck className="size-5" /> Synced {query.count || categories.length} Garbo source categories without changing Glarivo categories or mappings.
        </div>
      ) : null}
      {query.saved === "updated" ? (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#acd3b0] bg-[#edf9ee] p-4 text-sm font-bold text-[#286a31]" role="status">
          <CircleCheck className="size-5" /> Import availability updated.
        </div>
      ) : null}
      {query.error ? (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#e7aaa3] bg-[#fff1ef] p-4 text-sm font-bold text-[#7d2e27]" role="alert">
          <CircleAlert className="size-5" /> The Garbo category could not be updated.
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[["Source categories", categories.length], ["Top-level groups", parentCount], ["Mapped to Glarivo", mappedCount]].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-[#d7dcd8] bg-white p-5">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-[var(--ink-muted)]">{label}</p>
            <strong className="mt-2 block text-3xl font-black tracking-[-0.05em]">{value}</strong>
          </div>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-[#d7dcd8] bg-white">
        <div className="border-b border-[#e4e7e3] px-6 py-4 text-sm text-[var(--ink-muted)]">
          {importableCount} active choices are available in the importer. Product/page counts are filled after that category is previewed.
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-left">
            <thead className="border-b border-[#d7dcd8] bg-[#f5f7f4] text-[0.68rem] font-black uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              <tr><th className="px-5 py-4">Garbo source category</th><th className="px-5 py-4">Hierarchy</th><th className="px-5 py-4">Glarivo mapping</th><th className="px-5 py-4">Scan data</th><th className="px-5 py-4 text-right">Importer</th></tr>
            </thead>
            <tbody className="divide-y divide-[#e4e7e3]">
              {categories.map((category) => (
                <tr key={category.id} className="text-sm align-top">
                  <td className="px-5 py-4">
                    <div style={{ paddingLeft: `${category.depth * 18}px` }}>
                      <strong className="block">{category.sourceName}</strong>
                      <a href={category.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[var(--accent-dark)] hover:underline">
                        {category.sourcePath} <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-[var(--ink-muted)]">{category.parent?.sourceName ?? "Top level"}</td>
                  <td className="px-5 py-4">
                    {category.mapping ? <><strong className="block">{category.mapping.name}</strong><code className="mt-1 block text-xs text-[var(--ink-muted)]">/{category.mapping.slug}</code></> : <span className="text-xs font-bold text-[#82522d]">Not mapped yet</span>}
                  </td>
                  <td className="px-5 py-4 text-xs leading-5 text-[var(--ink-muted)]">
                    <strong className="block text-[var(--ink)]">{category.productCount ?? category.candidateCount} products · {category.pageCount ?? "—"} pages</strong>
                    Last scan: {formatDate(category.lastScannedAt)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <form action={setGarboCategoryImportable.bind(null, category.id)}>
                      <input type="hidden" name="enabled" value={category.isImportable ? "false" : "true"} />
                      <button type="submit" className={category.isImportable ? "text-xs font-black text-[#9a3d34] hover:underline" : "text-xs font-black text-[#286a31] hover:underline"}>
                        {category.isImportable ? "Disable" : "Enable"}
                      </button>
                    </form>
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
