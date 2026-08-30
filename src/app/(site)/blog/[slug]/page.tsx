import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";
import { articles, getArticleBySlug } from "@/data/blog";

type BlogPostPageProps = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return articles.map((article) => ({ slug: article.slug })); }
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return { title: article.title, description: article.excerpt, alternates: { canonical: `/blog/${article.slug}` }, openGraph: { type: "article", title: article.title, description: article.excerpt, publishedTime: article.publishedAt } };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();
  return (
    <article>
      <header className="site-container py-10 sm:py-16">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--ink-muted)] hover:text-[var(--navy)]"><ArrowLeft size={17} weight="bold" />Back to blog</Link>
        <div className="mx-auto mt-12 max-w-4xl text-center"><div className="flex flex-wrap items-center justify-center gap-3 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[var(--blue)]"><span>{article.category}</span><span className="size-1 rounded-full bg-[var(--lime-strong)]" /><time dateTime={article.publishedAt}>{article.publishedAt}</time><span className="size-1 rounded-full bg-[var(--lime-strong)]" /><span>{article.readTime}</span></div><h1 className="mt-6 text-balance text-5xl font-bold leading-[0.98] tracking-[-0.055em] text-[var(--navy)] sm:text-7xl">{article.title}</h1><p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[var(--ink-muted)]">{article.excerpt}</p></div>
      </header>
      <div className="site-container"><div className="relative mx-auto aspect-[16/8] max-w-5xl overflow-hidden rounded-2xl bg-[var(--navy)]"><Image src={article.image} alt={article.imageAlt} fill priority sizes="(min-width: 1024px) 1000px, 100vw" className="object-cover" /></div></div>
      <div className="prose-glarivo site-container mx-auto max-w-3xl py-14 sm:py-20">{article.content.map((section, index) => <section key={section.heading ?? index}>{section.heading ? <h2>{section.heading}</h2> : null}{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}</div>
      <footer className="border-t border-[var(--line)] py-14 sm:py-20"><div className="site-container flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--blue)]">Keep reading</p><h2 className="mt-2 text-3xl font-bold tracking-[-0.045em] text-[var(--navy)]">Explore more Glarivo notes.</h2></div><Link href="/blog" className="button-primary self-start sm:self-auto">All articles<ArrowRight size={17} weight="bold" /></Link></div></footer>
    </article>
  );
}
