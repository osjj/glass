import type { Metadata } from "next";
import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { CategoryMenu } from "@/components/site/category-menu";
import { ProductCard } from "@/components/site/product-card";
import {
  flattenPublicCategoryTree,
  getPublicCategoryTree,
  getPublishedProducts,
} from "@/lib/public-products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Products",
  description: "Explore Glarivo glassware by category, browse product images, and find specifications for your next collection.",
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
      <section className="border-b border-[var(--line)] bg-[var(--surface)] py-9 sm:py-12">
        <div className="site-container grid gap-5 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div>
            <p className="eyebrow">Product catalog</p>
            <h1 className="mt-4 max-w-3xl text-balance text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-[var(--navy)] sm:text-5xl">Glassware collections, clearly organized.</h1>
          </div>
          <p className="max-w-xl text-base leading-7 text-[var(--ink-muted)] lg:pb-1">Explore glassware by category. Open a product to view its images, specifications, and customization options.</p>
        </div>
      </section>

      <section className="site-container grid items-start gap-6 py-8 sm:py-10 lg:grid-cols-[16.625rem_minmax(0,1fr)] lg:gap-8">
        <CategoryMenu categories={categoryTree} activeSlug={knownCategory} query={query} />
        <div className="min-w-0">
          <div className="flex flex-col gap-4 border-b border-[var(--line)] pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-[-0.035em] text-[var(--navy)]">{selectedCategory?.label ?? "All glassware"}</h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">{filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}</p>
            </div>
            <form action="/products" method="get" className="flex w-full min-w-0 gap-2 sm:w-auto sm:max-w-sm sm:flex-1">
              {knownCategory ? <input type="hidden" name="category" value={knownCategory} /> : null}
              <label className="relative block min-w-0 flex-1">
                <span className="sr-only">Search products</span>
                <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" size={18} aria-hidden="true" />
                <input type="search" name="q" defaultValue={query} placeholder="Search products" className="h-12 w-full rounded-lg border border-[var(--line)] bg-white pl-11 pr-4 text-sm font-semibold text-[var(--ink)] placeholder:text-[var(--ink-muted)]" />
              </label>
              <button type="submit" className="button-primary h-12 shrink-0">Search</button>
            </form>
          </div>

          {query || selectedCategory ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--ink-muted)]">
              {selectedCategory ? <span>Category: <strong className="text-[var(--navy)]">{selectedCategory.label}</strong></span> : null}
              {query ? <span>Search: “{query}”</span> : null}
              <Link href="/products" className="font-bold text-[var(--blue)] hover:underline">Clear filters</Link>
            </div>
          ) : null}

          {filteredProducts.length ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
            </div>
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
