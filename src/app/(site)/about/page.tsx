import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Files, GridFour, Path } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = { title: "About", description: "Learn why Glarivo starts with clear glassware collections and source-led product information.", alternates: { canonical: "/about" } };

const principles = [
  { icon: Files, title: "Clarity before claims", text: "Product information should remain easy to review, compare, and verify." },
  { icon: GridFour, title: "A focused first release", text: "Start with the collections buyers need, then add workflows only when they have a clear purpose." },
  { icon: Path, title: "Room to grow", text: "The structure supports richer media, more categories, and deeper glassware content later." },
] as const;

export default function AboutPage() {
  return (
    <>
      <section className="overflow-hidden border-b border-[var(--line)] bg-[var(--surface)] py-16 sm:py-20">
        <div className="site-container grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div><p className="eyebrow">About Glarivo</p><h1 className="mt-5 text-balance text-5xl font-bold leading-[0.98] tracking-[-0.055em] text-[var(--navy)] sm:text-7xl">A clearer foundation for useful glassware information.</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--ink-muted)]">Glarivo is being built as a focused independent glassware site: clear collections, practical articles, and a lightweight way to maintain both.</p></div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[var(--navy)]"><Image src="/images/home/hero-glassware.webp" alt="Glarivo glassware collection in a modern showroom" fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover object-right" /></div>
        </div>
      </section>

      <section className="site-container py-20 sm:py-24"><div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]"><div><p className="eyebrow">Why this structure</p><h2 className="mt-5 text-4xl font-bold leading-[1.02] tracking-[-0.05em] text-[var(--navy)] sm:text-5xl">Small enough to manage. Strong enough to build on.</h2></div><div className="grid gap-4 sm:grid-cols-3">{principles.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-xl border border-[var(--line)] bg-white p-6 shadow-[0_14px_38px_rgba(15,42,89,0.06)] sm:p-7"><span className="grid size-12 place-items-center rounded-lg bg-[var(--surface-blue)] text-[var(--blue)]"><Icon size={27} weight="duotone" /></span><h3 className="mt-8 text-xl font-bold leading-tight tracking-[-0.035em] text-[var(--navy)]">{title}</h3><p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">{text}</p></article>)}</div></div></section>

      <section className="bg-[var(--surface)] py-20 sm:py-24"><div className="site-container grid gap-12 lg:grid-cols-2 lg:items-center"><div className="relative aspect-[16/10] overflow-hidden rounded-2xl"><Image src="/images/home/glassware-production.webp" alt="Glassware production, quality inspection, and packing" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" /></div><div className="lg:pl-8"><p className="eyebrow">Initial workflow</p><h2 className="mt-5 text-balance text-4xl font-bold leading-[1.02] tracking-[-0.05em] text-[var(--navy)] sm:text-6xl">From source data to a clean public page.</h2><div className="mt-9 space-y-5">{["Create or update the basic product or article record.", "Review copy, media, and structured details before publishing.", "Publish only the approved version to the public catalog."].map((item, index) => <div key={item} className="flex gap-4 border-t border-[var(--line)] pt-5"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--navy)] text-xs font-bold text-[var(--lime)]">{index + 1}</span><p className="pt-1 text-base font-bold leading-7 text-[var(--ink-muted)]">{item}</p></div>)}</div><div className="mt-9 flex flex-wrap gap-3"><Link href="/products" className="button-primary">Explore products<ArrowRight size={17} weight="bold" /></Link><Link href="/blog" className="button-secondary">Visit the blog</Link></div></div></div></section>

      <section className="site-container py-16 sm:py-20"><div className="grid gap-6 rounded-2xl bg-[var(--navy)] p-7 text-white sm:p-12 lg:grid-cols-[1fr_auto] lg:items-center"><div><div className="flex items-center gap-2 text-[var(--lime)]"><Check size={21} weight="bold" /><span className="text-xs font-bold uppercase tracking-[0.15em]">MVP scope</span></div><h2 className="mt-4 text-balance text-3xl font-bold tracking-[-0.045em] sm:text-5xl">Home, Products, Blog, and About — without unnecessary extras.</h2></div><Link href="/" className="inline-flex min-h-12 items-center rounded-lg bg-white px-5 text-sm font-bold text-[var(--navy)]">Return home</Link></div></section>
    </>
  );
}
