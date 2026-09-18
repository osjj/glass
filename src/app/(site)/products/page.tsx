import type { Metadata } from "next";
import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { CategoryMenu } from "@/components/site/category-menu";
import { ProductCard } from "@/components/site/product-card";
import { ProductPagination } from "@/components/product-pagination";
import { getPublishedProductPage } from "@/lib/public-products";
import { getPageNumber, productBrowseCanonical } from "@/lib/product-pagination";
import { EditorialHero } from "@/components/site/editorial-hero";
import styles from "@/components/site/editorial-pages.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = firstParam(params.q).trim();
  const { pagination, selectedCategory } = await getPublishedProductPage(getPageNumber(params.page), firstParam(params.category).trim(), query);
  return {
    title: "Products",
    description: "Explore Glarivo glassware by category, browse product images, and find specifications for your next collection.",
    alternates: { canonical: productBrowseCanonical(pagination.page, selectedCategory?.slug, query) },
    robots: query ? { index: false, follow: true } : { index: true, follow: true },
  };
}

type ProductsPageProps = { searchParams: Promise<{ category?: string | string[]; q?: string | string[]; page?: string | string[] }> };
const firstParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const category = firstParam(params.category).trim();
  const query = firstParam(params.q).trim();
  const { products, pagination, categoryTree, selectedCategory } = await getPublishedProductPage(getPageNumber(params.page), category, query);
  const knownCategory = selectedCategory?.slug ?? "";

  return (
    <div className={styles.page}>
      <EditorialHero
        eyebrow="Product catalog"
        title={<>Glassware collections,<br />clearly organized.</>}
        description="Explore glassware by category. Open a product to view its images, specifications, and customization options."
        image="/images/home/showroom-hero-v2.webp"
        imageAlt="Glassware collections arranged on warm, illuminated showroom shelves"
      />

      <section className={`${styles.container} ${styles.catalog}`} aria-label="Browse glassware products">
        <CategoryMenu categories={categoryTree} activeSlug={knownCategory} query={query} />
        <div className={styles.catalogResults}>
          <div className={styles.toolbar}>
            <div>
              <h2>{selectedCategory?.label ?? "All glassware"}</h2>
              <p>{pagination.total} {pagination.total === 1 ? "product" : "products"}</p>
            </div>
            <form action="/products" method="get" role="search" className={styles.search}>
              {knownCategory ? <input type="hidden" name="category" value={knownCategory} /> : null}
              <label>
                <span className="sr-only">Search products</span>
                <MagnifyingGlass size={18} aria-hidden="true" />
                <input type="search" name="q" defaultValue={query} placeholder="Search products" />
              </label>
              <button type="submit" className={styles.button}>Search</button>
            </form>
          </div>

          {query || selectedCategory ? (
            <div className={styles.filters}>
              {selectedCategory ? <span>Category: <strong className="text-[var(--navy)]">{selectedCategory.label}</strong></span> : null}
              {query ? <span>Search: “{query}”</span> : null}
              <Link href="/products" className="font-bold text-[var(--blue)] hover:underline">Clear filters</Link>
            </div>
          ) : null}

          {products.length ? (
            <div className={styles.productGrid}>
              {products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
            </div>
          ) : (
            <div className={styles.empty}>
              <h2>{query || knownCategory ? "No matching products." : "Published products are being prepared."}</h2>
              <p>{query || knownCategory ? "Try another search or return to all products." : "Products will appear here as soon as they are published from the catalog."}</p>
              {query || knownCategory ? <Link href="/products" className={styles.button}>View all products</Link> : null}
            </div>
          )}
          <ProductPagination pagination={pagination} path="/products" filters={{ category: knownCategory, q: query }} nofollow={Boolean(query)} />
        </div>
      </section>
    </div>
  );
}
