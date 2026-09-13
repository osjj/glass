import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ArticleCard } from "@/components/site/article-card";
import { getGuideCluster, guideClusters } from "@/data/guide-clusters";
import { getPublishedBlogPosts } from "@/lib/public-blog";
import { getSiteUrl } from "@/lib/site-url";
import { ReadingHeader } from "@/components/site/reading-header";
import theme from "@/components/site/editorial-pages.module.css";
import styles from "@/components/site/reading-pages.module.css";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cluster = getGuideCluster((await params).slug);
  if (!cluster) return { title: "Guide not found", robots: { index: false } };
  return { title: `${cluster.title} | Wholesale Buying Guides`, description: cluster.description, alternates: { canonical: `/guides/${cluster.slug}` } };
}

export default async function GuideClusterPage({ params }: Props) {
  const cluster = getGuideCluster((await params).slug);
  if (!cluster) notFound();
  const articles = (await getPublishedBlogPosts()).filter((article) => article.category === cluster.title);
  const baseUrl = getSiteUrl();
  const schema = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
    { "@type": "ListItem", position: 2, name: "Blog", item: `${baseUrl}/blog` },
    { "@type": "ListItem", position: 3, name: cluster.title, item: `${baseUrl}/guides/${cluster.slug}` },
  ] };
  return <div className={theme.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <ReadingHeader title={cluster.title} eyebrow={cluster.eyebrow} description={cluster.description}
      navigation={<nav aria-label="Breadcrumb"><Link href="/blog">Blog</Link><span aria-hidden="true"> / </span><span aria-current="page">{cluster.title}</span></nav>}>
      <p className={styles.audience}>{cluster.audience}</p>
      <div className={styles.heroActions}><a href="#buying-decisions">What to compare</a><a href="#collections">Explore products</a></div>
    </ReadingHeader>
    {articles.length > 0 && <section className={`${theme.container} ${styles.section}`} aria-labelledby="in-depth">
      <h2 id="in-depth">Read the full buying guide</h2>
      <div className={`${theme.articleGrid} ${styles.guideArticles}`}>{articles.map((article) => <ArticleCard article={article} key={article.slug} />)}</div>
    </section>}
    <section id="buying-decisions" className={`${theme.container} ${styles.section}`}>
      <h2>Three decisions to make first</h2>
      <div className={styles.decisions}>{cluster.decisions.map((decision, index) => <div key={decision.title} className={styles.decision}>
        <span>0{index + 1}</span><h3>{decision.title}</h3><p>{decision.text}</p>
      </div>)}</div>
    </section>
    <section className={styles.checklist}><div className={theme.container}>
      <h2>Prepare your buying brief</h2><p>Record these details before requesting a model-specific quotation.</p>
      <ul>{cluster.checklist.map((item) => <li key={item}>{item}</li>)}</ul>
    </div></section>
    <section id="collections" className={`${theme.container} ${styles.section}`}>
      <h2>Explore the related collections</h2><p>Use the product pages to compare individual specifications, then confirm your shortlist against samples.</p>
      <div className={styles.collectionGrid}>{cluster.categories.map((category) => <Link key={category.slug} href={`/products/category/${category.slug}`}>
        {category.label}<ArrowRight size={18} aria-hidden="true" />
      </Link>)}</div>
    </section>
    <nav aria-label="More buying topics" className={styles.moreTopics}><div className={theme.container}>
      <h2>More buying topics</h2><div>{guideClusters.filter((item) => item.slug !== cluster.slug).map((item) => <Link key={item.slug} href={`/guides/${item.slug}`}>{item.title}</Link>)}</div>
    </div></nav>
  </div>;
}
