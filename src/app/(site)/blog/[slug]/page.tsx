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
import { SITE_NAME } from "@/lib/site-identity";
import { ReadingHeader } from "@/components/site/reading-header";
import { ArticleProducts, ShotGlassInquiry } from "@/components/site/article-products";
import { getArticleProducts } from "@/lib/article-products";
import { getArticleProductSection, shotGlassArticleSlug } from "@/data/article-products";
import theme from "@/components/site/editorial-pages.module.css";
import styles from "@/components/site/reading-pages.module.css";

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
      siteName: SITE_NAME,
      url: `/blog/${article.slug}`,
      title: article.title,
      description: article.excerpt,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt.toISOString(),
      images: [{ url: article.coverImage, alt: article.coverImageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: [{ url: article.coverImage, alt: article.coverImageAlt }],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const article = await getPublishedBlogPostBySlug(slug);
  if (!article) notFound();
  const isShotGlassGuide = slug === shotGlassArticleSlug;
  const productSection = getArticleProductSection(slug);
  const comparisonProducts = productSection ? await getArticleProducts(slug) : [];
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
    publisher: {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: SITE_NAME,
      url: `${siteUrl}/`,
    },
    articleSection: article.category,
  };
  const breadcrumbItems = [
    { name: "Home", item: siteUrl },
    { name: "Blog", item: `${siteUrl}/blog` },
    ...(cluster ? [{ name: cluster.title, item: `${siteUrl}/guides/${cluster.slug}` }] : []),
    { name: article.title, item: `${siteUrl}/blog/${article.slug}` },
  ];
  const breadcrumbs = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({ "@type": "ListItem", position: index + 1, ...item })),
  };

  return (
    <article className={theme.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, "\\u003c") }} />
      <ReadingHeader title={article.title} eyebrow={article.category} description={article.excerpt}
        navigation={<><Link href="/blog"><ArrowLeft size={17} aria-hidden="true" />Back to blog</Link>{cluster && <nav aria-label="Guide topic"><span aria-hidden="true">/ </span><Link href={`/guides/${cluster.slug}`}>{cluster.title}</Link></nav>}</>}>
        <div className={styles.meta}><time dateTime={article.publishedAt}>{article.publishedLabel}</time><span>{article.readTime}</span></div>
      </ReadingHeader>
      <div className={`${theme.container} ${styles.cover}`}>
        <div className={`${styles.coverImage} ${article.coverImageFit === "contain" ? styles.containCover : ""}`}>
          <Image src={article.coverImage} alt={article.coverImageAlt} fill preload unoptimized sizes="(min-width: 1280px) 1100px, 90vw" className={article.coverImageFit === "contain" ? "object-contain" : "object-cover"} />
        </div>
      </div>
      {cluster && outline.length > 0 && <div className={theme.container}><nav aria-label="On this page" className={styles.outline}>
        <h2>In this buying guide</h2><ul>{outline.map((item) => <li key={item.id}><a href={`#${item.id}`}>{item.title}</a></li>)}</ul>
      </nav></div>}
      <div className={`${theme.container} ${styles.section}`}>
        <div className={`prose-glarivo ${styles.prose}`}>
          <ArticleContentRenderer content={article.content} insertBeforeHeading={productSection && comparisonProducts.length ? {
            id: productSection.beforeHeadingId,
            content: <ArticleProducts products={comparisonProducts} articleSlug={slug} />,
          } : undefined} />
        </div>
      </div>
      {isShotGlassGuide && <div className={theme.container}><ShotGlassInquiry /></div>}
      <footer className={styles.articleEnd}><div className={theme.container}><div><p>Keep reading</p><h2>Explore more Glarivo notes.</h2></div><Link href="/blog">All articles<ArrowRight size={17} aria-hidden="true" /></Link></div></footer>
    </article>
  );
}
