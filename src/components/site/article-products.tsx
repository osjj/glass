import Image from "next/image";
import Link from "next/link";
import { InquiryButton } from "@/components/site/inquiry-contact";
import type { getArticleProducts } from "@/lib/article-products";
import { getArticleProductSection } from "@/data/article-products";
import styles from "./article-products.module.css";

export function ArticleProducts({ products, articleSlug }: {
  products: Awaited<ReturnType<typeof getArticleProducts>>;
  articleSlug: string;
}) {
  const section = getArticleProductSection(articleSlug);
  if (!products.length || !section) return null;
  return <section className={styles.comparison} aria-labelledby="compare-shot-glasses" id="shot-glass-product-comparison">
    <p className={styles.eyebrow}>From guide to shortlist</p>
    <h3 id="compare-shot-glasses">{section.title}</h3>
    <p className={styles.intro}>{section.intro}</p>
    <div className={styles.grid}>
      {products.map((product) => <article key={product.slug} className={styles.card}>
        <Link className={styles.image} href={`/products/${product.slug}?fromArticle=${articleSlug}`} aria-label={`View ${product.sku || product.name}`}>
          <Image src={product.image.url} alt={product.image.alt || product.name} width={640} height={480} unoptimized sizes="(max-width: 640px) 90vw, 420px" />
        </Link>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>{product.label}</p>
          <h4>{product.name}</h4>
          {product.sku && <p className={styles.sku}>Item No. {product.sku}</p>}
          <dl>{product.facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
          <p className={styles.note}>{product.buyingNote}</p>
          <div className={styles.actions}>
            <Link href={`/products/${product.slug}?fromArticle=${articleSlug}`}>View product</Link>
            <InquiryButton className={styles.button} product={{ name: product.name, sku: product.sku, slug: product.slug, brief: section.brief }}>{section.inquiryLabel}</InquiryButton>
          </div>
        </div>
      </article>)}
    </div>
    <p className={styles.caption}>Product images show the corresponding catalog models. Values are catalog specifications, not sample measurements. Custom decoration or packaging may change order requirements.</p>
  </section>;
}

export function ShotGlassInquiry() {
  return <section className={styles.inquiry} aria-labelledby="shot-glass-quote-title" id="shot-glass-quote">
    <div>
      <p className={styles.eyebrow}>Your next order</p>
      <h2 id="shot-glass-quote-title">Need help choosing a shot glass?</h2>
      <p>Tell us your quantity, target capacity, destination country, and logo or packaging requirements. Include a product reference if you have one.</p>
    </div>
    <InquiryButton className={styles.button} product={{ name: "Shot glass sourcing inquiry", brief: "shot-glass" }}>Request a Shot Glass Quote</InquiryButton>
  </section>;
}
