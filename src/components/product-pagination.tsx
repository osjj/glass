import { Fragment } from "react";
import Link from "next/link";
import { getVisiblePages, productPageHref, type getProductPagination } from "@/lib/product-pagination";

type ProductPaginationProps = {
  pagination: ReturnType<typeof getProductPagination>;
  path: string;
  filters?: Record<string, string>;
};

export function ProductPagination({ pagination, path, filters }: ProductPaginationProps) {
  const { page, total, totalPages, start, end } = pagination;
  if (!total) return null;
  const pages = getVisiblePages(page, totalPages);
  const href = (target: number) => productPageHref(path, target, filters);
  const button = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[var(--line)] px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]";

  return (
    <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-[var(--line)] pt-5 sm:flex-row sm:flex-wrap">
      <p className="text-sm text-[var(--ink-muted)]">Showing {start}–{end} of {total} products</p>
      <nav aria-label="Product pagination" className="flex flex-wrap items-center justify-center gap-1.5">
        {page > 1 ? <Link href={href(page - 1)} rel="prev" className={`${button} hover:bg-[var(--surface)]`}>Previous</Link> : <span aria-disabled="true" className={`${button} text-[var(--ink-muted)] opacity-50`}>Previous</span>}
        {pages.map((target, index) => (
          <Fragment key={target}>
            {index > 0 && target - pages[index - 1] > 1 ? <span aria-hidden="true" className="px-1 text-[var(--ink-muted)]">…</span> : null}
            <Link href={href(target)} aria-label={`Page ${target}`} aria-current={target === page ? "page" : undefined} className={`${button} ${target === page ? "border-[var(--navy)] bg-[var(--navy)] text-white" : "hover:bg-[var(--surface)]"}`}>{target}</Link>
          </Fragment>
        ))}
        {page < totalPages ? <Link href={href(page + 1)} rel="next" className={`${button} hover:bg-[var(--surface)]`}>Next</Link> : <span aria-disabled="true" className={`${button} text-[var(--ink-muted)] opacity-50`}>Next</span>}
      </nav>
      <form key={href(page)} action={path} method="get" aria-label="Jump to page" className="flex flex-wrap items-center justify-center gap-2 text-sm">
        {Object.entries(filters ?? {}).map(([name, value]) => value && name !== "page" ? <input key={name} type="hidden" name={name} value={value} /> : null)}
        <label className="flex items-center gap-2 text-[var(--ink-muted)]">
          Go to page
          <input type="number" name="page" min={1} max={totalPages} step={1} required defaultValue={page} className="min-h-11 w-20 rounded-lg border border-[var(--line)] bg-white px-2 text-center text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]" />
        </label>
        <span className="text-[var(--ink-muted)]">of {totalPages}</span>
        <button type="submit" className={`${button} hover:bg-[var(--surface)]`}>Go</button>
      </form>
    </div>
  );
}
