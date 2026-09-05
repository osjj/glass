import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";
import { ArticleContentRenderer, headingId } from "@/components/site/article-content-renderer";
import { getPublishedBlogPostBySlug } from "@/lib/public-blog";
import { guideClusters } from "@/data/guide-clusters";
import { plainTextFromEditorHtml, readStoredArticleContent } from "@/lib/article-content-server";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

type BlogPostPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedBlogPostBySlug(slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt.toISOString(),
      images: [{ url: article.coverImage, alt: article.coverImageAlt }],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const article = await getPublishedBlogPostBySlug(slug);
  if (!article) notFound();
  const cluster = guideClusters.find((item) => item.title === article.category);
  const outline = readStoredArticleContent(article.content).blocks.flatMap((block, index) =>
    block.type === "header" && Number(block.data.level) === 2
      ? [{ id: headingId(String(block.data.text), index), title: plainTextFromEditorHtml(block.data.text) }] : []);
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org", "@type": "Article",
    headline: article.title, description: article.excerpt,
    image: new URL(article.coverImage, siteUrl).href,
    datePublished: article.publishedAt, dateModified: article.updatedAt.toISOString(),
    mainEntityOfPage: `${siteUrl}/blog/${article.slug}`,
    publisher: { "@type": "Organization", name: "Glarivo", url: siteUrl },
    articleSection: article.category,
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <header className="site-container py-10 sm:py-16">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--ink-muted)] hover:text-[var(--navy)]"><ArrowLeft size={17} weight="bold" />Back to blog</Link>
        {cluster && <nav aria-label="Guide topic" className="mt-4 text-sm font-semibold text-[var(--blue)]"><Link href="/blog">Blog</Link><span className="mx-2" aria-hidden="true">/</span><Link href={`/guides/${cluster.slug}`}>{cluster.title}</Link></nav>}
        <div className="mx-auto mt-12 max-w-4xl text-center"><div className="flex flex-wrap items-center justify-center gap-3 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[var(--blue)]"><span>{article.category}</span><span className="size-1 rounded-full bg-[var(--lime-strong)]" /><time dateTime={article.publishedAt}>{article.publishedLabel}</time><span className="size-1 rounded-full bg-[var(--lime-strong)]" /><span>{article.readTime}</span></div><h1 className="mt-6 text-balance text-5xl font-bold leading-[0.98] tracking-[-0.055em] text-[var(--navy)] sm:text-7xl">{article.title}</h1><p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[var(--ink-muted)]">{article.excerpt}</p></div>
      </header>
      <div className="site-container"><div className={`relative mx-auto ${article.coverImageFit === "contain" ? "aspect-[20/11]" : "aspect-[16/8]"} max-w-5xl overflow-hidden rounded-2xl bg-[var(--navy)]`}><Image src={article.coverImage} alt={article.coverImageAlt} fill priority unoptimized sizes="(min-width: 1024px) 1000px, 100vw" className={article.coverImageFit === "contain" ? "object-contain" : "object-cover"} /></div></div>
      {cluster && outline.length > 0 && <nav aria-label="On this page" className="site-container mt-10"><div className="mx-auto max-w-3xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6"><h2 className="text-lg font-bold text-[var(--navy)]">In this buying guide</h2><ul className="mt-4 grid gap-3 sm:grid-cols-2">{outline.map((item) => <li key={item.id}><a href={`#${item.id}`} className="text-sm font-semibold leading-6 text-[var(--blue)] underline-offset-4 hover:underline">{item.title}</a></li>)}</ul></div></nav>}
      <div className="site-container py-14 sm:py-20">
        <div className="prose-glarivo mx-auto max-w-3xl">
          <ArticleContentRenderer content={article.content} />
        </div>
      </div>
      <footer className="border-t border-[var(--line)] py-14 sm:py-20"><div className="site-container flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--blue)]">Keep reading</p><h2 className="mt-2 text-3xl font-bold tracking-[-0.045em] text-[var(--navy)]">Explore more Glarivo notes.</h2></div><Link href="/blog" className="button-primary self-start sm:self-auto">All articles<ArrowRight size={17} weight="bold" /></Link></div></footer>
    </article>
  );
}
