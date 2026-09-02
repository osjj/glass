import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ProductCard } from "@/components/site/product-card";
import { getPublicCategoryPage } from "@/lib/public-products";

export const dynamic = "force-dynamic";

type CategoryPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicCategoryPage(slug);
  if (!data) return { title: "Category not found", robots: { index: false, follow: false } };
  return {
    title: data.category.label,
    description: `Browse ${data.category.label} glassware products and related Glarivo collections.`,
    alternates: { canonical: `/products/category/${data.category.slug}` },
  };
}

export default async function ProductCategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const data = await getPublicCategoryPage(slug);
  if (!data) notFound();
  const { category, breadcrumbs, products } = data;

  return (
    <>
      <section className="relative min-h-[360px] overflow-hidden bg-[var(--navy)] text-white">
        <Image src={category.image} alt="" fill unoptimized preload sizes="100vw" className="object-cover opacity-55" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,22,52,0.96),rgba(5,22,52,0.35))]" />
        <div className="site-container relative flex min-h-[360px] flex-col justify-end py-12 sm:py-16">
          <nav className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-white/65" aria-label="Breadcrumb">
            <Link href="/products" className="hover:text-[var(--lime)]">Products</Link>
            {breadcrumbs.map((item) => (
              <span key={item.id} className="flex items-center gap-2">
                <ArrowRight size={12} aria-hidden="true" />
                {item.id === category.id ? <span className="text-white">{item.label}</span> : <Link href={`/products/category/${item.slug}`} className="hover:text-[var(--lime)]">{item.label}</Link>}
              </span>
            ))}
          </nav>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-[var(--lime)]">Glarivo collection</p>
          <h1 className="mt-3 max-w-4xl text-balance text-5xl font-bold leading-none tracking-[-0.055em] sm:text-7xl">{category.label}</h1>
          <p className="mt-5 text-base font-semibold text-white/72">{category.productCount} published {category.productCount === 1 ? "product" : "products"}{category.children.length ? ` across ${category.children.length} subcategories` : ""}.</p>
        </div>
      </section>

      {category.children.length ? (
        <section className="border-b border-[var(--line)] bg-[var(--surface)] py-10 sm:py-14">
          <div className="site-container">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Subcategories</p>
                <h2 className="mt-3 text-3xl font-bold tracking-[-0.045em] text-[var(--navy)]">Explore {category.label}</h2>
              </div>
              <Link href="/products" className="hidden items-center gap-2 text-sm font-bold text-[var(--navy)] sm:inline-flex">All categories <ArrowRight size={16} weight="bold" /></Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {category.children.map((child) => (
                <Link key={child.id} href={`/products/category/${child.slug}`} className="group flex items-center justify-between gap-4 rounded-xl border border-[var(--line)] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[var(--blue)] hover:shadow-[0_12px_30px_rgba(15,42,89,0.08)]">
                  <span>
                    <strong className="block text-lg tracking-[-0.025em] text-[var(--navy)]">{child.label}</strong>
                    <span className="mt-1 block text-xs font-semibold text-[var(--ink-muted)]">{child.productCount} products</span>
                  </span>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--surface-blue)] text-[var(--navy)] transition group-hover:bg-[var(--lime)]"><ArrowRight size={16} weight="bold" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="site-container py-12 sm:py-16">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Published catalog</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.045em] text-[var(--navy)]">{category.label} products</h2>
          </div>
          <Link href="/products" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--navy)]"><ArrowLeft size={16} weight="bold" /> Back to category directory</Link>
        </div>

        {products.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-20 text-center">
            <h2 className="text-2xl font-bold tracking-[-0.04em] text-[var(--navy)]">This collection is being prepared.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--ink-muted)]">The category is active and ready for products. Published items will appear here automatically after import.</p>
            <Link href="/products" className="button-primary mt-7">Browse all categories</Link>
          </div>
        )}
      </section>
    </>
  );
}
