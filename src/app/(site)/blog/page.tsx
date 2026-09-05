import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ArticleCard } from "@/components/site/article-card";
import { getPublishedBlogPosts } from "@/lib/public-blog";
import { GuideClusterCards } from "@/components/site/guide-cluster-cards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description: "Practical glassware buying guides covering product selection, capacity, decoration, packaging and wholesale sourcing.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const articles = await getPublishedBlogPosts();
  const featuredArticle = articles.find((article) => article.featured) ?? articles[0];
  const remainingArticles = featuredArticle
    ? articles.filter((article) => article.id !== featuredArticle.id)
    : [];

  return (
    <>
      <section className="border-b border-[var(--line)] bg-[var(--surface)] py-16 sm:py-20">
        <div className="site-container grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div><p className="eyebrow">Glarivo journal</p><h1 className="mt-5 max-w-4xl text-balance text-5xl font-bold leading-[0.98] tracking-[-0.055em] text-[var(--navy)] sm:text-7xl">Clear notes for better glassware decisions.</h1></div>
          <p className="max-w-2xl text-lg leading-8 text-[var(--ink-muted)] lg:pb-2">Practical guidance for comparing glassware, confirming product specifications and preparing your next wholesale order.</p>
        </div>
      </section>

      <section className="site-container py-10" aria-labelledby="buying-topics"><h2 id="buying-topics" className="mb-6 text-3xl font-bold text-[var(--navy)]">Explore buying topics</h2><GuideClusterCards /></section>

      {featuredArticle ? (
        <section className="site-container py-12 sm:py-16">
          <Link href={`/blog/${featuredArticle.slug}`} className="group grid overflow-hidden rounded-2xl bg-[var(--navy)] text-white lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative min-h-64 lg:min-h-[28rem]"><Image src={featuredArticle.coverImage} alt={featuredArticle.coverImageAlt} fill priority unoptimized sizes="(min-width: 1024px) 55vw, 100vw" className={`${featuredArticle.coverImageFit === "contain" ? "object-contain" : "object-cover"} transition duration-500 group-hover:scale-[1.02]`} /></div>
            <div className="flex flex-col justify-between p-7 sm:p-10 lg:p-12">
              <div><div className="flex items-center gap-3 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[var(--lime)]"><span>Featured article</span><span className="size-1 rounded-full bg-current" /><span>{featuredArticle.readTime}</span></div><h2 className="mt-7 text-balance text-4xl font-bold leading-[1.02] tracking-[-0.05em] sm:text-5xl">{featuredArticle.title}</h2><p className="mt-6 text-base leading-7 text-white/68 sm:text-lg">{featuredArticle.excerpt}</p></div>
              <span className="mt-10 inline-flex items-center gap-2 text-sm font-bold text-[var(--lime)]">Read the article<ArrowRight size={17} weight="bold" className="transition group-hover:translate-x-1" /></span>
            </div>
          </Link>
        </section>
      ) : (
        <section className="site-container py-16 sm:py-24">
          <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-20 text-center">
            <h2 className="text-3xl font-bold tracking-[-0.045em] text-[var(--navy)]">New articles are being prepared.</h2>
            <p className="mx-auto mt-4 max-w-xl text-[var(--ink-muted)]">Published Glarivo guides will appear here as soon as they are ready.</p>
          </div>
        </section>
      )}

      {featuredArticle ? (
        <section className="site-container pb-20 sm:pb-28">
          <div className="flex items-end justify-between border-b border-[var(--line)] pb-6"><div><p className="eyebrow">All articles</p><h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-[var(--navy)] sm:text-4xl">The latest from Glarivo</h2></div><span className="text-sm font-bold text-[var(--ink-muted)]">{articles.length} {articles.length === 1 ? "article" : "articles"}</span></div>
          {remainingArticles.length ? <div className="mt-7 grid gap-5 lg:grid-cols-2">{remainingArticles.map((article) => <ArticleCard key={article.id} article={article} />)}</div> : <p className="mt-8 text-sm text-[var(--ink-muted)]">More practical notes are on the way.</p>}
        </section>
      ) : null}
    </>
  );
}
