import type { Metadata } from "next";
import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { ProductCard } from "@/components/site/product-card";
import { productCategories, products } from "@/data/catalog";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse the initial Glarivo glassware catalog.",
  alternates: { canonical: "/products" },
};

type ProductsPageProps = { searchParams: Promise<{ category?: string; q?: string }> };

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const category = params.category?.trim() ?? "";
  const query = params.q?.trim() ?? "";
  const normalizedQuery = query.toLowerCase();
  const knownCategory = productCategories.some((item) => item.slug === category) ? category : "";
  const filteredProducts = products.filter((product) => {
    const matchesCategory = !knownCategory || product.category === knownCategory;
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
          <p className="max-w-2xl text-lg leading-8 text-[var(--ink-muted)] lg:pb-2">Browse the initial Glarivo structure for drinkware, tableware, serveware, storage, bakeware, and colored glassware.</p>
        </div>
      </section>

      <section className="site-container py-10 sm:py-14">
        <div className="flex flex-col gap-5 border-b border-[var(--line)] pb-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" aria-label="Product categories">
            <Link href={query ? `/products?q=${encodeURIComponent(query)}` : "/products"} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${!knownCategory ? "bg-[var(--navy)] text-white" : "border border-[var(--line)] bg-white"}`}>All</Link>
            {productCategories.map((item) => (
              <Link key={item.slug} href={`/products?category=${item.slug}${query ? `&q=${encodeURIComponent(query)}` : ""}`} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${knownCategory === item.slug ? "bg-[var(--navy)] text-white" : "border border-[var(--line)] bg-white hover:border-[var(--navy)]"}`}>{item.shortLabel}</Link>
            ))}
          </div>
          <form action="/products" method="get" className="flex min-w-0 max-w-md flex-1 lg:justify-end">
            {knownCategory ? <input type="hidden" name="category" value={knownCategory} /> : null}
            <label className="relative block w-full max-w-sm">
              <span className="sr-only">Search products</span>
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" size={18} aria-hidden="true" />
              <input type="search" name="q" defaultValue={query} placeholder="Search products" className="h-12 w-full rounded-lg border border-[var(--line)] bg-white pl-11 pr-4 text-sm font-semibold text-[var(--ink)] placeholder:text-[var(--ink-muted)]" />
            </label>
          </form>
        </div>

        <div className="mt-8 flex items-center justify-between text-sm text-[var(--ink-muted)]">
          <p><strong className="text-[var(--navy)]">{filteredProducts.length}</strong> {filteredProducts.length === 1 ? "product" : "products"}</p>
          {query ? <p>Search: “{query}”</p> : null}
        </div>

        {filteredProducts.length ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-20 text-center">
            <h2 className="text-2xl font-bold tracking-[-0.04em] text-[var(--navy)]">No matching products yet.</h2>
            <p className="mt-3 text-[var(--ink-muted)]">Try another search or return to all products.</p>
            <Link href="/products" className="button-primary mt-7">View all products</Link>
          </div>
        )}
      </section>
    </>
  );
}
