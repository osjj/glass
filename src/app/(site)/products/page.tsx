import type { Metadata } from "next";
import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { CategoryDirectory } from "@/components/site/category-directory";
import { ProductCard } from "@/components/site/product-card";
import {
  flattenPublicCategoryTree,
  getPublicCategoryTree,
  getPublishedProducts,
} from "@/lib/public-products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse Glarivo's published glassware products, specifications, pricing, and minimum-order information.",
  alternates: { canonical: "/products" },
};

type ProductsPageProps = { searchParams: Promise<{ category?: string; q?: string }> };

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const category = params.category?.trim() ?? "";
  const query = params.q?.trim() ?? "";
  const normalizedQuery = query.toLowerCase();
  const [products, categoryTree] = await Promise.all([
    getPublishedProducts(),
    getPublicCategoryTree(),
  ]);
  const categories = flattenPublicCategoryTree(categoryTree);
  const selectedCategory = categories.find((item) => item.slug === category);
  const knownCategory = selectedCategory?.slug ?? "";
  const selectedSlugs = new Set(
    selectedCategory
      ? flattenPublicCategoryTree([selectedCategory]).map((item) => item.slug)
      : [],
  );
  const filteredProducts = products.filter((product) => {
    const matchesCategory = !knownCategory || selectedSlugs.has(product.category);
    const matchesQuery = !normalizedQuery || `${product.name} ${product.summary} ${product.categoryLabel}`.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });

  return (
    <>
      <section className="border-b border-[var(--line)] bg-[var(--surface)] py-16 sm:py-20">
        <div className="site-container grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div>
            <p className="eyebrow">Product catalog</p>
            <h1 className="mt-5 max-w-4xl text-balance text-5xl font-bold leading-[0.98] tracking-[-0.055em] text-[var(--navy)] sm:text-7xl">Glassware collections, clearly organized.</h1>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-[var(--ink-muted)] lg:pb-2">Browse current glassware products with published images, specifications, pricing, and order information maintained by Glarivo.</p>
        </div>
      </section>

      <section className="site-container py-10 sm:py-14">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Complete category directory</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.045em] text-[var(--navy)]">Browse 56 glassware categories.</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[var(--ink-muted)]">Open a collection to see its subcategories and published products. Empty collections remain visible while their catalog is being prepared.</p>
        </div>
        <CategoryDirectory categories={categoryTree} />
      </section>

      <section className="border-t border-[var(--line)] bg-[var(--surface)]">
        <div className="site-container py-10 sm:py-14">
          <div className="flex flex-col gap-5 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_12px_35px_rgba(15,42,89,0.05)] lg:flex-row lg:items-end">
            <label className="block min-w-0 flex-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Category
              <select name="category" form="catalog-filter" defaultValue={knownCategory} className="mt-2 h-12 w-full rounded-lg border border-[var(--line)] bg-white px-4 text-sm font-semibold normal-case tracking-normal text-[var(--ink)]">
                <option value="">All categories</option>
                {categoryTree.map((parent) => (
                  <optgroup key={parent.id} label={parent.label}>
                    <option value={parent.slug}>{parent.label}</option>
                    {parent.children.map((child) => <option key={child.id} value={child.slug}>{child.label}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
            <form id="catalog-filter" action="/products" method="get" className="flex min-w-0 flex-1 gap-3">
              <label className="relative block w-full max-w-sm">
                <span className="sr-only">Search products</span>
                <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" size={18} aria-hidden="true" />
                <input type="search" name="q" defaultValue={query} placeholder="Search products" className="h-12 w-full rounded-lg border border-[var(--line)] bg-white pl-11 pr-4 text-sm font-semibold text-[var(--ink)] placeholder:text-[var(--ink-muted)]" />
              </label>
              <button type="submit" className="button-primary h-12 shrink-0">Filter</button>
          </form>
        </div>

          <div className="mt-8 flex flex-col gap-3 border-b border-[var(--line)] pb-6 text-sm text-[var(--ink-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p><strong className="text-[var(--navy)]">{filteredProducts.length}</strong> {filteredProducts.length === 1 ? "product" : "products"}</p>
            <div className="flex flex-wrap items-center gap-3">
              {selectedCategory ? <span>Category: <strong className="text-[var(--navy)]">{selectedCategory.label}</strong></span> : null}
              {query ? <span>Search: “{query}”</span> : null}
              {query || selectedCategory ? <Link href="/products" className="font-bold text-[var(--blue)] hover:underline">Clear filters</Link> : null}
            </div>
        </div>

        {filteredProducts.length ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filteredProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-20 text-center">
            <h2 className="text-2xl font-bold tracking-[-0.04em] text-[var(--navy)]">{query || knownCategory ? "No matching products." : "Published products are being prepared."}</h2>
            <p className="mt-3 text-[var(--ink-muted)]">{query || knownCategory ? "Try another search or return to all products." : "Products will appear here as soon as they are published from the catalog."}</p>
            {query || knownCategory ? <Link href="/products" className="button-primary mt-7">View all products</Link> : null}
          </div>
        )}
        </div>
      </section>
    </>
  );
}
