import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ArticleCard } from "@/components/site/article-card";
import { articles } from "@/data/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Practical Glarivo notes on glassware products, catalog planning, and sourcing.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  const featuredArticle = articles.find((article) => article.featured) ?? articles[0];
  const remainingArticles = articles.filter((article) => article.slug !== featuredArticle.slug);
  return (
    <>
      <section className="border-b border-[var(--line)] bg-[var(--surface)] py-16 sm:py-20">
        <div className="site-container grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div><p className="eyebrow">Glarivo journal</p><h1 className="mt-5 max-w-4xl text-balance text-5xl font-bold leading-[0.98] tracking-[-0.055em] text-[var(--navy)] sm:text-7xl">Clear notes for better glassware decisions.</h1></div>
          <p className="max-w-2xl text-lg leading-8 text-[var(--ink-muted)] lg:pb-2">Short, practical articles about organizing collections, confirming product information, and preparing a more reliable sourcing process.</p>
        </div>
      </section>

      <section className="site-container py-12 sm:py-16">
        <Link href={`/blog/${featuredArticle.slug}`} className="group grid overflow-hidden rounded-2xl bg-[var(--navy)] text-white lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-80 lg:min-h-[34rem]"><Image src={featuredArticle.image} alt={featuredArticle.imageAlt} fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.02]" /></div>
          <div className="flex flex-col justify-between p-7 sm:p-10 lg:p-12">
            <div><div className="flex items-center gap-3 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[var(--lime)]"><span>Featured article</span><span className="size-1 rounded-full bg-current" /><span>{featuredArticle.readTime}</span></div><h2 className="mt-7 text-balance text-4xl font-bold leading-[1.02] tracking-[-0.05em] sm:text-5xl">{featuredArticle.title}</h2><p className="mt-6 text-base leading-7 text-white/68 sm:text-lg">{featuredArticle.excerpt}</p></div>
            <span className="mt-10 inline-flex items-center gap-2 text-sm font-bold text-[var(--lime)]">Read the article<ArrowRight size={17} weight="bold" className="transition group-hover:translate-x-1" /></span>
          </div>
        </Link>
      </section>

      <section className="site-container pb-20 sm:pb-28">
        <div className="flex items-end justify-between border-b border-[var(--line)] pb-6"><div><p className="eyebrow">All articles</p><h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-[var(--navy)] sm:text-4xl">The latest from Glarivo</h2></div><span className="text-sm font-bold text-[var(--ink-muted)]">{articles.length} articles</span></div>
        <div className="mt-7 grid gap-5 lg:grid-cols-2">{remainingArticles.map((article) => <ArticleCard key={article.slug} article={article} />)}</div>
      </section>
    </>
  );
}
