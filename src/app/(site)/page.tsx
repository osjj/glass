import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Factory,
  GlobeHemisphereWest,
  MagnifyingGlass,
  Package,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import { ArticleCard } from "@/components/site/article-card";
import { ProductCard } from "@/components/site/product-card";
import { articles } from "@/data/blog";
import { productCategories, products } from "@/data/catalog";

export const metadata: Metadata = {
  title: { absolute: "Glarivo Glassware | Clear collections for confident sourcing" },
  description: "Explore Glarivo drinkware, tableware, serveware, storage, bakeware, and colored glassware collections.",
  alternates: { canonical: "/" },
};

const capabilityItems = [
  { icon: Package, value: "6", label: "Focused glassware collections" },
  { icon: ShieldCheck, value: "Clear", label: "Source-led product information" },
  { icon: Factory, value: "Ready", label: "Structured production details" },
  { icon: GlobeHemisphereWest, value: "Flexible", label: "Catalog built to grow" },
] as const;

const processSteps = ["Select", "Sample", "Confirm", "Produce", "Inspect", "Pack"];

export default function HomePage() {
  const featuredProducts = products.filter((product) => product.featured).slice(0, 3);

  return (
    <>
      <section className="relative -mt-[88px] min-h-[610px] overflow-hidden bg-[var(--navy)] pt-[88px] text-white sm:min-h-[500px] lg:min-h-[420px]">
        <Image
          src="/images/home/hero-glassware.webp"
          alt="Clear glassware collection displayed in a modern warehouse showroom"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,22,52,0.98)_0%,rgba(8,31,68,0.92)_35%,rgba(8,31,68,0.25)_72%,rgba(8,31,68,0.05)_100%)]" />
        <div className="site-container relative flex min-h-[522px] min-w-0 items-center py-12 sm:min-h-[412px] sm:py-8 lg:min-h-[332px]">
          <div className="min-w-0 max-w-[760px]">
            <p className="inline-flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[var(--lime)]">
              <span className="h-0.5 w-7 rounded-full bg-current" />
              Focused glassware catalog
            </p>
            <h1 className="mt-5 max-w-[calc(100vw-2rem)] break-words text-[2.72rem] font-bold leading-[0.98] tracking-[-0.05em] sm:max-w-3xl sm:text-[3.45rem] lg:text-[3.8rem]">
              One clear source for everyday glassware.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/72">
              Focused collections. Practical product data. Straightforward sourcing.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/products" className="inline-flex min-h-12 items-center gap-3 rounded-lg bg-[var(--lime)] px-6 text-sm font-bold text-[var(--navy)] transition hover:-translate-y-0.5 hover:bg-[var(--lime-strong)]">
                View products
                <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </Link>
              <Link href="/blog" className="inline-flex min-h-12 items-center rounded-lg border border-white/50 px-6 text-sm font-bold text-white transition hover:bg-white/10">
                Read our guides
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-4 pb-4">
        <div className="site-container">
          <form action="/products" method="get" className="grid min-w-0 max-w-full gap-3 overflow-hidden rounded-xl border border-[var(--line)] bg-white p-4 shadow-[0_24px_60px_rgba(15,42,89,0.14)] sm:p-5 lg:grid-cols-[1.45fr_0.8fr_auto]">
            <label className="relative block min-w-0">
              <span className="sr-only">Find a product or category</span>
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--navy)]" size={20} aria-hidden="true" />
              <input
                type="search"
                name="q"
                placeholder="Find a product or category"
                className="h-13 w-full min-w-0 max-w-full rounded-lg border border-[var(--line)] bg-white pl-12 pr-4 text-sm font-semibold text-[var(--ink)] placeholder:text-[var(--ink-muted)]"
              />
            </label>
            <label>
              <span className="sr-only">Choose a category</span>
              <select name="category" defaultValue="" className="h-13 w-full rounded-lg border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--ink-muted)]">
                <option value="">All categories</option>
                {productCategories.map((category) => (
                  <option key={category.slug} value={category.slug}>{category.label}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="inline-flex h-13 items-center justify-center gap-2 rounded-lg bg-[var(--navy)] px-8 text-sm font-bold text-white hover:bg-[var(--navy-soft)]">
              Search
              <ArrowRight size={17} weight="bold" />
            </button>
          </form>
        </div>
      </section>

      <section className="site-container py-8 sm:py-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="text-xl font-bold tracking-[-0.035em] text-[var(--navy)] sm:text-2xl">Browse glassware collections</h2>
          <Link href="/products" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--navy)]">
            View all products <ArrowRight size={17} weight="bold" />
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {productCategories.map((category) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className="group relative min-h-36 overflow-hidden rounded-xl bg-[var(--navy)] text-white"
            >
              <Image src={category.image} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,22,48,0.88),rgba(6,22,48,0.12))]" />
              <div className="relative flex min-h-36 items-center justify-between p-6">
                <h3 className="max-w-44 text-2xl font-bold tracking-[-0.035em]">{category.label}</h3>
                <span className="grid size-10 place-items-center rounded-full border border-white/40 bg-white/10 transition group-hover:border-[var(--lime)] group-hover:bg-[var(--lime)] group-hover:text-[var(--navy)]">
                  <ArrowRight size={18} weight="bold" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="site-container pb-16 sm:pb-24">
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_18px_55px_rgba(15,42,89,0.08)]">
          <div className="grid border-b border-[var(--line)] lg:grid-cols-[1.05fr_2.95fr]">
            <div className="p-7 sm:p-9">
              <p className="eyebrow">Built for a clear catalog</p>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.045em] text-[var(--navy)]">Capabilities that keep information useful.</h2>
              <p className="mt-4 text-sm leading-6 text-[var(--ink-muted)]">The first release organizes products, sourcing details, and editorial guidance without adding unnecessary workflows.</p>
            </div>
            <div className="grid border-t border-[var(--line)] sm:grid-cols-2 lg:grid-cols-4 lg:border-l lg:border-t-0">
              {capabilityItems.map(({ icon: Icon, value, label }) => (
                <article key={label} className="border-b border-[var(--line)] p-6 last:border-b-0 sm:border-r sm:last:border-r-0 lg:border-b-0">
                  <Icon size={29} weight="duotone" className="text-[var(--blue)]" aria-hidden="true" />
                  <p className="mt-5 text-3xl font-bold tracking-[-0.05em] text-[var(--navy)]">{value}</p>
                  <p className="mt-2 text-sm leading-5 text-[var(--ink-muted)]">{label}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="grid lg:grid-cols-[1.35fr_0.65fr]">
            <div className="relative min-h-72 overflow-hidden">
              <Image src="/images/home/glassware-production.webp" alt="Glassware production, inspection, and packing process" fill sizes="(min-width: 1024px) 70vw, 100vw" className="object-cover" />
            </div>
            <div className="bg-[var(--surface)] p-7 sm:p-9">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[var(--blue)]">Catalog workflow</p>
              <ol className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
                {processSteps.map((step, index) => (
                  <li key={step} className="flex items-center gap-3 border-t border-[var(--line)] pt-3 text-sm font-bold text-[var(--navy)]">
                    <span className="text-[0.68rem] text-[var(--blue)]">0{index + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-sm leading-6 text-[var(--ink-muted)]">Each public page is ready to receive verified model, material, capacity, decoration, and packing information.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface)] py-16 sm:py-24">
        <div className="site-container">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Featured products</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-[var(--navy)] sm:text-5xl">A focused first collection</h2>
            </div>
            <Link href="/products" className="button-secondary">View catalog <ArrowRight size={17} weight="bold" /></Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </section>

      <section className="site-container py-16 sm:py-24">
        <div className="mb-8">
          <p className="eyebrow">Latest guides</p>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-[var(--navy)] sm:text-5xl">Practical notes for better product decisions</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {articles.slice(0, 2).map((article) => <ArticleCard key={article.slug} article={article} />)}
        </div>
      </section>
    </>
  );
}
