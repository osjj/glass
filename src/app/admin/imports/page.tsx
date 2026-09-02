import Link from "next/link";
import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  DatabaseZap,
  ExternalLink,
  FileSearch,
  FolderTree,
  PackageCheck,
} from "lucide-react";
import {
  previewGarboCategoryImport,
  syncAndPublishGarboCategory,
} from "@/actions/catalog-imports";
import { AdminHeader } from "@/components/admin/admin-header";
import { ImportSubmitButton } from "@/components/admin/import-submit-button";
import { getGarboImportSetup, getImportCandidates } from "@/lib/catalog-imports";

type ImportsPageProps = {
  searchParams: Promise<{
    error?: string;
    mappedCategory?: string;
    preview?: string;
    sourceCategoryId?: string;
    sourceUrl?: string;
    sourcePath?: string;
    sourceSlug?: string;
    categoryId?: string;
    categoryName?: string;
    products?: string;
    pages?: string;
    limit?: string;
    completed?: string;
    discovered?: string;
    created?: string;
    updated?: string;
    unchanged?: string;
    imported?: string;
    refreshed?: string;
    skipped?: string;
    failed?: string;
    mediaFailed?: string;
  }>;
};

const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-[#ccd3ce] bg-white px-4 text-sm text-[var(--ink)] shadow-sm transition focus:border-[var(--accent)]";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function importErrorMessage(error?: string, mappedCategory?: string) {
  if (error === "invalid-input") return "Select a maintained Garbo source category and an active Glarivo target category.";
  if (error === "invalid-source") return "That Garbo source category is missing, disabled, or no longer importable. Refresh the Garbo category library.";
  if (error === "inactive-category") return "The selected Glarivo category is missing or inactive.";
  if (error === "mapping-conflict") return `This Garbo source is already mapped to ${mappedCategory || "another category"}. Open category maintenance if the mapping needs to change.`;
  if (error === "preview-failed") return "Garbo could not be scanned. Check the category URL and network, then try again.";
  if (error === "mapping-failed") return "The source-to-category mapping could not be saved. No product import was started.";
  if (error === "one-click-failed") return "The import stopped unexpectedly. Completed products were kept, so it is safe to retry.";
  return null;
}

export default async function ImportsPage({ searchParams }: ImportsPageProps) {
  const query = await searchParams;
  const sourceFilter = /^\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(query.sourcePath || "")
    ? query.sourcePath
    : undefined;
  const [{ categoryOptions, sourceCategoryOptions, mappings }, { candidates }] = await Promise.all([
    getGarboImportSetup(),
    getImportCandidates(undefined, sourceFilter, 200),
  ]);
  const selectedMapping = mappings.find(
    (mapping) => mapping.sourcePath === query.sourcePath || mapping.sourceUrl === query.sourceUrl,
  );
  const selectedSourceCategory = sourceCategoryOptions.find(
    (category) => category.id === query.sourceCategoryId || category.sourcePath === selectedMapping?.sourcePath,
  );
  const defaultSourceCategoryId = query.sourceCategoryId || selectedSourceCategory?.id || "";
  const defaultCategoryId = query.categoryId || selectedMapping?.categoryId || "";
  const publishedCount = candidates.filter((candidate) => candidate.product).length;
  const waitingCount = candidates.length - publishedCount;
  const errorMessage = importErrorMessage(query.error, query.mappedCategory);
  const previewReady = query.preview === "ready" && query.sourceCategoryId && query.sourceUrl && query.categoryId;

  return (
    <div className="mx-auto max-w-7xl">
      <AdminHeader
        eyebrow="Reusable catalog intake"
        title="Garbo Category Import"
        description="Choose a maintained Garbo source category, map it to an active Glarivo category, preview the source count, then copy and publish the products."
      />

      {errorMessage ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#e7aaa3] bg-[#fff1ef] p-4 text-sm font-bold leading-6 text-[#7d2e27]" role="alert">
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {query.completed ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#acd3b0] bg-[#edf9ee] p-4 text-sm font-bold leading-6 text-[#286a31]" role="status">
          <CircleCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <span>
            {query.categoryName || query.completed} import finished: {query.discovered || "0"} found, {query.created || "0"} new source records, {query.updated || "0"} refreshed, {query.unchanged || "0"} unchanged; {query.imported || "0"} products published, {query.refreshed || "0"} product pages/media refreshed, {query.skipped || "0"} already current, {query.failed || "0"} failed, {query.mediaFailed || "0"} unavailable source images skipped.
          </span>
        </div>
      ) : null}

      <section className="mt-7 overflow-hidden rounded-3xl border border-[#d7dcd8] bg-white">
        <div className="border-b border-[#e4e7e3] bg-[#f5f7f4] p-6 lg:p-8">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--ink)] text-[var(--acid)]">
              <DatabaseZap className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--accent-dark)]">Step 1</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">Choose a source category</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--ink-muted)]">
                Garbo and Glarivo categories remain independent. Previewing only scans Garbo and updates this source category&apos;s page/product counts; it does not create products.
              </p>
              <Link href="/admin/imports/garbo-categories" className="mt-2 inline-flex text-xs font-black text-[var(--accent-dark)] hover:underline">Maintain Garbo source categories</Link>
            </div>
          </div>
        </div>

        {categoryOptions.length && sourceCategoryOptions.length ? (
          <form action={previewGarboCategoryImport} className="grid gap-5 p-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_180px_auto] lg:items-end lg:p-8">
            <label className="text-sm font-black">
              Garbo source category
              <select className={inputClass} name="sourceCategoryId" defaultValue={defaultSourceCategoryId} required>
                <option value="" disabled>Select a maintained source category</option>
                {sourceCategoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label} ({category.sourcePath})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-black">
              Target Glarivo category
              <select className={inputClass} name="categoryId" defaultValue={defaultCategoryId} required>
                <option value="" disabled>Select a category</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>{category.label}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-black">
              Import batch
              <select className={inputClass} name="limit" defaultValue={query.limit || "25"}>
                <option value="25">25 products (recommended)</option>
                <option value="50">50 products</option>
                <option value="all">All products</option>
              </select>
            </label>
            <ImportSubmitButton mode="preview" className="button-secondary h-12 min-w-44 justify-center" />
          </form>
        ) : (
          <div className="p-6 text-sm leading-6 text-[var(--ink-muted)] lg:p-8">
            Create an active Glarivo target category and sync the Garbo source-category library before importing products. <Link href="/admin/imports/garbo-categories" className="font-black text-[var(--accent-dark)] hover:underline">Open Garbo categories</Link>
          </div>
        )}
      </section>

      {previewReady ? (
        <section className="mt-6 overflow-hidden rounded-3xl border border-[#9bc6a0] bg-white">
          <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:p-8">
            <div>
              <div className="flex items-center gap-3 text-[#286a31]">
                <CircleCheck className="size-6" aria-hidden="true" />
                <p className="text-xs font-black uppercase tracking-[0.14em]">Step 2 · Preview ready</p>
              </div>
              <h2 className="mt-3 text-2xl font-black">{query.sourcePath} → {query.categoryName}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">
                Found <strong className="text-[var(--ink)]">{query.products || "0"} products</strong> across {query.pages || "0"} category pages. Importing will save this mapping, copy authorized text and images, upload WebP media to R2, and publish new products with request-quote pricing.
              </p>
              <p className="mt-2 text-xs font-bold leading-5 text-[#82522d]">
                Re-running the same category is safe: changed products are refreshed and current products are skipped. A limited batch prioritizes products not imported yet.
              </p>
            </div>
            <form action={syncAndPublishGarboCategory}>
              <input type="hidden" name="sourceCategoryId" value={query.sourceCategoryId} />
              <input type="hidden" name="categoryId" value={query.categoryId} />
              <input type="hidden" name="limit" value={query.limit || "25"} />
              <ImportSubmitButton />
            </form>
          </div>
        </section>
      ) : null}

      {mappings.length ? (
        <section className="mt-6 overflow-hidden rounded-3xl border border-[#d7dcd8] bg-white">
          <div className="border-b border-[#e4e7e3] px-6 py-5">
            <h2 className="text-lg font-black">Saved category mappings</h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">Load an existing mapping to scan it again or continue an interrupted batch.</p>
          </div>
          <div className="grid gap-px bg-[#e4e7e3] sm:grid-cols-2 xl:grid-cols-3">
            {mappings.map((mapping) => {
              const sourceCategory = sourceCategoryOptions.find((item) => item.sourcePath === mapping.sourcePath);
              const loadQuery = new URLSearchParams({
                sourcePath: mapping.sourcePath,
                categoryId: mapping.categoryId,
                limit: "25",
              });
              if (sourceCategory) loadQuery.set("sourceCategoryId", sourceCategory.id);
              loadQuery.set("sourceUrl", mapping.sourceUrl);
              return (
                <div key={mapping.id} className="bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <strong className="block text-sm">{mapping.sourcePath}</strong>
                      <span className="mt-1 block text-xs text-[var(--ink-muted)]">{mapping.category.name} · {mapping.candidateCount} source records</span>
                    </div>
                    <FolderTree className="size-5 shrink-0 text-[var(--accent-dark)]" aria-hidden="true" />
                  </div>
                  <Link href={`/admin/imports?${loadQuery.toString()}`} className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[var(--accent-dark)] hover:underline">
                    Load mapping <ArrowRight className="size-3" aria-hidden="true" />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-3xl border border-[#d7dcd8] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#e4e7e3] px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-black">{query.sourcePath ? `${query.sourcePath} source records` : "Recent source records"}</h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">Open a published product to edit it, or use the source link to verify a value.</p>
          </div>
          <div className="flex gap-5 text-xs font-bold text-[var(--ink-muted)]">
            <span><FileSearch className="mr-1 inline size-4" />{candidates.length} shown</span>
            <span><PackageCheck className="mr-1 inline size-4" />{publishedCount} published</span>
            <span><DatabaseZap className="mr-1 inline size-4" />{waitingCount} waiting</span>
          </div>
        </div>
        {candidates.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left">
              <thead className="border-b border-[#d7dcd8] bg-[#f5f7f4] text-[0.68rem] font-black uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                <tr><th className="px-5 py-4">Source product</th><th className="px-5 py-4">Source category</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Last fetched</th><th className="px-5 py-4 text-right">Product</th></tr>
              </thead>
              <tbody className="divide-y divide-[#e4e7e3]">
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="text-sm align-top">
                    <td className="px-5 py-4">
                      <strong className="block max-w-xl text-[var(--ink)]">{candidate.sourceTitle}</strong>
                      <span className="mt-1 block text-xs text-[var(--ink-muted)]">{candidate.sourceSku || "No unique Item No."}</span>
                      <a href={candidate.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[var(--accent-dark)] hover:underline">Open source <ExternalLink className="size-3" aria-hidden="true" /></a>
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-[var(--ink-muted)]">{candidate.sourceCategoryPath}</td>
                    <td className="px-5 py-4 text-xs leading-5 text-[var(--ink-muted)]">
                      <strong className="block text-[var(--ink)]">{candidate._count.fields} factual fields</strong>
                      {candidate.conflictCount} conflicts · {candidate.warningCount} warnings
                    </td>
                    <td className="px-5 py-4 text-xs text-[var(--ink-muted)]">{formatDate(candidate.fetchedAt)}</td>
                    <td className="px-5 py-4 text-right">
                      {candidate.product ? (
                        <Link href={`/admin/products/${candidate.product.id}`} className="inline-flex items-center gap-2 font-black text-[var(--accent-dark)] hover:underline">Edit product <ArrowRight className="size-4" aria-hidden="true" /></Link>
                      ) : (
                        <span className="rounded-full bg-[#fff5e8] px-3 py-1 text-xs font-black text-[#82522d]">Waiting</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center text-sm text-[var(--ink-muted)]">No source records for this view. Scan a category above to begin.</div>
        )}
      </section>
    </div>
  );
}
