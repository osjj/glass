import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Info } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";
import { getProductBySlug, products } from "@/data/catalog";

type ProductDetailPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return products.map((product) => ({ slug: product.slug })); }

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  return { title: product.name, description: product.summary, alternates: { canonical: `/products/${product.slug}` } };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return (
    <>
      <section className="site-container py-9 sm:py-14">
        <Link href="/products" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--ink-muted)] hover:text-[var(--navy)]"><ArrowLeft size={17} weight="bold" />Back to products</Link>
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[var(--navy)] lg:sticky lg:top-28">
            <Image src={product.image} alt={product.imageAlt} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="py-2 lg:pl-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-md bg-[var(--lime)] px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--navy)]">Initial catalog entry</span>
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--blue)]">{product.categoryLabel}</span>
            </div>
            <h1 className="mt-6 text-balance text-5xl font-bold leading-[0.98] tracking-[-0.055em] text-[var(--navy)] sm:text-7xl">{product.name}</h1>
            <p className="mt-7 text-xl leading-8 text-[var(--ink-muted)]">{product.summary}</p>
            <div className="mt-8 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <div className="flex gap-3"><Info className="mt-0.5 shrink-0 text-[var(--blue)]" size={21} /><p className="text-sm leading-6 text-[var(--ink-muted)]">This initial entry uses demonstration content. Final model data, capacities, images, packing, and documents should be added only after their source information is confirmed.</p></div>
            </div>
            <div className="mt-10 border-t border-[var(--line)] pt-8">
              <h2 className="text-2xl font-bold tracking-[-0.04em] text-[var(--navy)]">Product overview</h2>
              <p className="mt-4 leading-7 text-[var(--ink-muted)]">{product.description}</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">{product.features.map((feature) => <li key={feature} className="flex items-start gap-3 rounded-lg bg-[var(--surface)] p-4 text-sm font-bold"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[var(--lime)]"><Check size={13} weight="bold" /></span>{feature}</li>)}</ul>
            </div>
            <div className="mt-10 border-t border-[var(--line)] pt-8">
              <h2 className="text-2xl font-bold tracking-[-0.04em] text-[var(--navy)]">Specifications</h2>
              <dl className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">{product.specifications.map((specification) => <div key={specification.label} className="grid gap-2 py-4 sm:grid-cols-[10rem_1fr]"><dt className="text-sm font-bold text-[var(--navy)]">{specification.label}</dt><dd className="text-sm leading-6 text-[var(--ink-muted)]">{specification.value}</dd></div>)}</dl>
            </div>
          </div>
        </div>
      </section>
      <section className="mt-12 bg-[var(--navy)] py-16 text-white sm:py-20"><div className="site-container flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--lime)]">Continue exploring</p><h2 className="mt-4 text-balance text-4xl font-bold leading-tight tracking-[-0.05em]">Compare the rest of the initial glassware catalog.</h2></div><Link href="/products" className="inline-flex items-center gap-2 self-start rounded-lg bg-white px-5 py-3 text-sm font-bold text-[var(--navy)] sm:self-auto">All products<ArrowRight size={17} weight="bold" /></Link></div></section>
    </>
  );
}
