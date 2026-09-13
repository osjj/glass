import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ArticleCard } from "@/components/site/article-card";
import { getPublishedBlogPosts } from "@/lib/public-blog";
import { GuideClusterCards } from "@/components/site/guide-cluster-cards";
import { EditorialHero } from "@/components/site/editorial-hero";
import styles from "@/components/site/editorial-pages.module.css";

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
    <div className={styles.page}>
      <EditorialHero
        eyebrow="Glarivo journal"
        title="Clear notes for better glassware decisions."
        description="Practical guidance for comparing glassware, confirming product specifications and preparing your next wholesale order."
        image="/images/home/editorial/shot-glass-guide.webp"
        imageAlt="Glassware selection arranged for a closer look at shape and proportions"
      />

      {featuredArticle ? (
        <section className={styles.featuredSection} aria-label="Featured article">
          <Link href={`/blog/${featuredArticle.slug}`} className={`${styles.container} ${styles.featured}`}>
            <div className={styles.featuredImage}>
              <Image src={featuredArticle.coverImage} alt={featuredArticle.coverImageAlt} fill unoptimized sizes="(min-width: 900px) 50vw, 100vw" className={featuredArticle.coverImageFit === "contain" ? "object-contain" : "object-cover"} />
            </div>
            <div className={styles.featuredCopy}>
              <div className={styles.kicker}><span>Featured article</span><span>{featuredArticle.readTime}</span></div>
              <h2>{featuredArticle.title}</h2>
              <p>{featuredArticle.excerpt}</p>
              <span className={styles.textLink}>Read the article<ArrowRight size={18} aria-hidden="true" /></span>
            </div>
          </Link>
        </section>
      ) : (
        <section className={`${styles.container} ${styles.section}`}>
          <div className={styles.empty}>
            <h2>New articles are being prepared.</h2>
            <p>Published Glarivo guides will appear here as soon as they are ready.</p>
          </div>
        </section>
      )}

      <section className={styles.topics} aria-labelledby="buying-topics">
        <div className={styles.container}>
          <h2 id="buying-topics">Explore buying topics</h2>
          <GuideClusterCards />
        </div>
      </section>

      {featuredArticle ? (
        <section className={`${styles.container} ${styles.section}`}>
          <div className={styles.sectionHeading}>
            <div><p className={styles.kicker}>All articles</p><h2>The latest from Glarivo</h2></div>
            <span>{articles.length} {articles.length === 1 ? "article" : "articles"}</span>
          </div>
          {remainingArticles.length ? (
            <div className={styles.articleGrid}>{remainingArticles.map((article) => <ArticleCard key={article.id} article={article} />)}</div>
          ) : <p className={styles.moreNotes}>More practical notes are on the way.</p>}
        </section>
      ) : null}
    </div>
  );
}
