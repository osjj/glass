import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { CategoryMenu } from "@/components/site/category-menu";
import { CategoryBuyingNotes } from "@/components/site/category-buying-notes";
import { ProductCard } from "@/components/site/product-card";
import { ProductPagination } from "@/components/product-pagination";
import { getCategoryBuyingContent } from "@/data/category-buying-content";
import { getPageNumber, productPageHref } from "@/lib/product-pagination";
import { getPublicCategoryPage, getPublicCategoryTree } from "@/lib/public-products";
import { getClustersForCategory } from "@/data/guide-clusters";

export const dynamic = "force-dynamic";

type CategoryPageProps = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string | string[] }> };

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicCategoryPage(slug, getPageNumber((await searchParams).page));
  if (!data) return { title: "Category not found", robots: { index: false, follow: false } };
  const buyingContent = getCategoryBuyingContent(data.category.slug);
  return {
    title: buyingContent?.seoTitle ?? data.category.label,
    description: buyingContent?.seoDescription ?? `Browse ${data.category.label} glassware products and related Glarivo collections.`,
    alternates: { canonical: productPageHref(`/products/category/${data.category.slug}`, data.pagination.page) },
  };
}

export default async function ProductCategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const [data, categoryTree] = await Promise.all([
    getPublicCategoryPage(slug, getPageNumber((await searchParams).page)),
    getPublicCategoryTree(),
  ]);
  if (!data) notFound();
  const { category, breadcrumbs, products, pagination } = data;
  const buyingGuides = getClustersForCategory(category.slug);
  const buyingContent = getCategoryBuyingContent(category.slug);

  return (
    <>
      <section className="relative overflow-hidden bg-[var(--navy)] text-white">
        <Image src={category.image} alt="" fill unoptimized preload sizes="100vw" className="object-cover opacity-55" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,22,52,0.96),rgba(5,22,52,0.35))]" />
        <div className="site-container relative flex min-h-52 flex-col justify-center py-8 sm:py-10">
          <nav className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-white/65" aria-label="Breadcrumb">
            <Link href="/products" className="hover:text-[var(--lime)]">Products</Link>
            {breadcrumbs.map((item) => (
              <span key={item.id} className="flex items-center gap-2">
                <ArrowRight size={12} aria-hidden="true" />
                {item.id === category.id ? <span className="text-white">{item.label}</span> : <Link href={`/products/category/${item.slug}`} className="hover:text-[var(--lime)]">{item.label}</Link>}
              </span>
            ))}
          </nav>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--lime)]">Glarivo collection</p>
          <h1 className="mt-3 max-w-4xl text-balance text-4xl font-bold leading-none tracking-[-0.045em] sm:text-5xl">{category.label}</h1>
          <p className="mt-4 text-sm font-semibold text-white/72">{category.productCount} {category.productCount === 1 ? "product" : "products"}{category.children.length ? ` across ${category.children.length} subcategories` : ""}.</p>
        </div>
      </section>

      <section className="site-container grid items-start gap-6 py-8 sm:py-10 lg:grid-cols-[16.625rem_minmax(0,1fr)] lg:gap-8">
        <CategoryMenu categories={categoryTree} activeSlug={category.slug} />
        <div className="min-w-0">
          {buyingGuides.length > 0 && <nav aria-label="Related buying guides" className="mb-6 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4"><p className="text-sm font-semibold text-[var(--navy)]">Need help choosing?</p><div className="mt-2 flex flex-wrap gap-3">{buyingGuides.map((guide) => <Link key={guide.slug} href={`/guides/${guide.slug}`} className="text-sm font-bold text-[var(--blue)] underline underline-offset-4">{guide.title} guide →</Link>)}</div></nav>}
          {buyingContent ? <CategoryBuyingNotes categoryLabel={category.label} content={buyingContent} /> : null}
          <div className="flex flex-col gap-3 border-b border-[var(--line)] pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-[-0.035em] text-[var(--navy)]">{category.label}</h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">{pagination.total} {pagination.total === 1 ? "product" : "products"}</p>
            </div>
            <Link href="/products" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--navy)]"><ArrowLeft size={16} weight="bold" /> All products</Link>
          </div>

          {products.length ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-20 text-center">
              <h2 className="text-2xl font-bold tracking-[-0.04em] text-[var(--navy)]">This collection is being prepared.</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--ink-muted)]">Explore another category to discover more glassware, or browse our full product collection.</p>
              <Link href="/products" className="button-primary mt-7">Browse all products</Link>
            </div>
          )}
          <ProductPagination pagination={pagination} path={`/products/category/${category.slug}`} />
        </div>
      </section>
    </>
  );
}
