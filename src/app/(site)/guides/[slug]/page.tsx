import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ArticleCard } from "@/components/site/article-card";
import { getGuideCluster, guideClusters } from "@/data/guide-clusters";
import { getPublishedBlogPosts } from "@/lib/public-blog";
import { getSiteUrl } from "@/lib/site-url";

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
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <section className="border-b border-[var(--line)] bg-[var(--surface)] py-12 sm:py-16"><div className="site-container">
      <nav aria-label="Breadcrumb" className="text-sm font-semibold text-[var(--blue)]"><Link href="/blog">Blog</Link><span className="mx-3" aria-hidden="true">/</span><span aria-current="page">{cluster.title}</span></nav>
      <p className="eyebrow mt-8">{cluster.eyebrow}</p><h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-[var(--navy)] sm:text-6xl">{cluster.title}</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--ink-muted)]">{cluster.description}</p><p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--ink-muted)]">{cluster.audience}</p>
      <div className="mt-7 flex flex-wrap gap-3"><a href="#buying-decisions" className="button-primary">What to compare</a><a href="#collections" className="button-secondary">Explore products</a></div>
    </div></section>
    {articles.length > 0 && <section className="site-container py-12" aria-labelledby="in-depth"><h2 id="in-depth" className="mb-6 text-3xl font-bold text-[var(--navy)]">Read the full buying guide</h2><div className="grid gap-6 lg:grid-cols-2">{articles.map((article) => <ArticleCard article={article} key={article.slug} />)}</div></section>}
    <section id="buying-decisions" className="site-container scroll-mt-28 py-12"><h2 className="text-3xl font-bold tracking-tight text-[var(--navy)]">Three decisions to make first</h2><div className="mt-7 grid gap-6 lg:grid-cols-3">{cluster.decisions.map((decision, index) => <div key={decision.title} className="rounded-2xl border border-[var(--line)] p-6"><span className="text-sm font-bold text-[var(--blue)]">0{index + 1}</span><h3 className="mt-4 text-xl font-bold text-[var(--navy)]">{decision.title}</h3><p className="mt-3 text-base leading-8 text-[var(--ink-muted)]">{decision.text}</p></div>)}</div></section>
    <section className="site-container pb-12"><div className="rounded-2xl bg-[var(--navy)] p-7 text-white sm:p-10"><h2 className="text-2xl font-bold">Prepare your buying brief</h2><p className="mt-3 text-white/75">Record these details before requesting a model-specific quotation.</p><ul className="mt-6 grid list-disc gap-4 pl-5 text-white/90 md:grid-cols-2">{cluster.checklist.map((item) => <li key={item} className="pr-5 leading-7">{item}</li>)}</ul></div></section>
    <section id="collections" className="site-container scroll-mt-28 pb-14"><h2 className="text-3xl font-bold text-[var(--navy)]">Explore the related collections</h2><p className="mt-3 text-[var(--ink-muted)]">Use the product pages to compare individual specifications, then confirm your shortlist against samples.</p><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cluster.categories.map((category) => <Link key={category.slug} href={`/products/category/${category.slug}`} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] p-5 font-bold text-[var(--blue)] transition hover:bg-[var(--surface)]">{category.label}<ArrowRight size={18} aria-hidden="true" /></Link>)}</div></section>
    <nav aria-label="More buying topics" className="border-t border-[var(--line)] py-10"><div className="site-container"><h2 className="text-xl font-bold text-[var(--navy)]">More buying topics</h2><div className="mt-5 flex flex-wrap gap-4">{guideClusters.filter((item) => item.slug !== cluster.slug).map((item) => <Link className="text-sm font-semibold text-[var(--blue)] underline underline-offset-4" key={item.slug} href={`/guides/${item.slug}`}>{item.title}</Link>)}</div></div></nav>
  </>;
}
