import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { CategoryMenu } from "@/components/site/category-menu";
import { CategoryBuyingNotes } from "@/components/site/category-buying-notes";
import { ProductCard } from "@/components/site/product-card";
import { ProductPagination } from "@/components/product-pagination";
import { getCategoryBuyingContent } from "@/data/category-buying-content";
import { getPageNumber, productPageHref } from "@/lib/product-pagination";
import { getPublicCategoryPage, getPublicCategoryTree } from "@/lib/public-products";
import { getClustersForCategory } from "@/data/guide-clusters";
import styles from "@/components/site/editorial-pages.module.css";
import productStyles from "@/components/site/product-pages.module.css";

export const dynamic = "force-dynamic";

type CategoryPageProps = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string | string[] }> };

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicCategoryPage(slug, getPageNumber((await searchParams).page));
  if (!data) return { title: "Category not found", robots: { index: false, follow: false } };
  const buyingContent = getCategoryBuyingContent(data.category.slug);
  return {
    title: buyingContent?.seoTitle ?? data.category.label,
    description: buyingContent?.seoDescription ?? `Browse ${data.category.label} glassware products and related Glarivo collections.`,
    alternates: { canonical: productPageHref(`/products/category/${data.category.slug}`, data.pagination.page) },
  };
}

export default async function ProductCategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const [data, categoryTree] = await Promise.all([
    getPublicCategoryPage(slug, getPageNumber((await searchParams).page)),
    getPublicCategoryTree(),
  ]);
  if (!data) notFound();
  const { category, breadcrumbs, products, pagination } = data;
  const buyingGuides = getClustersForCategory(category.slug);
  const buyingContent = getCategoryBuyingContent(category.slug);

  return (
    <div className={styles.page}>
      <section data-editorial-hero className={`${styles.hero} ${productStyles.categoryHero}`}>
        <Image src={category.image} alt="" fill unoptimized preload sizes="100vw" className={styles.heroImage} />
        <div className={styles.heroShade} />
        <div className={`${styles.container} ${styles.heroContent}`}>
          <nav className={productStyles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/products" className="hover:text-[var(--lime)]">Products</Link>
            {breadcrumbs.map((item) => (
              <span key={item.id} className="flex items-center gap-2">
                <ArrowRight size={12} aria-hidden="true" />
                {item.id === category.id ? <span aria-current="page">{item.label}</span> : <Link href={`/products/category/${item.slug}`} className="hover:text-[var(--lime)]">{item.label}</Link>}
              </span>
            ))}
          </nav>
          <p className={styles.kicker}>Glarivo collection</p>
          <h1>{category.label}</h1>
          <span className={styles.rule} aria-hidden="true" />
          <p className={styles.heroDescription}>{category.productCount} {category.productCount === 1 ? "product" : "products"}{category.children.length ? ` across ${category.children.length} subcategories` : ""}.</p>
        </div>
      </section>

      <section className={`${styles.container} ${styles.catalog}`}>
        <CategoryMenu categories={categoryTree} activeSlug={category.slug} />
        <div className={styles.catalogResults}>
          {buyingGuides.length > 0 && <nav aria-label="Related buying guides" className={productStyles.guideLinks}><p>Need help choosing?</p><div>{buyingGuides.map((guide) => <Link key={guide.slug} href={`/guides/${guide.slug}`}>{guide.title} guide →</Link>)}</div></nav>}
          {buyingContent ? <CategoryBuyingNotes content={buyingContent} /> : null}
          <div id="category-products" className={`${styles.toolbar} ${productStyles.categoryProducts}`}>
            <div>
              <h2>{category.label}</h2>
              <p>{pagination.total} {pagination.total === 1 ? "product" : "products"}</p>
            </div>
            <Link href="/products" className={styles.textLink}><ArrowLeft size={16} aria-hidden="true" /> All products</Link>
          </div>

          {products.length ? (
            <div className={styles.productGrid}>
              {products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
            </div>
          ) : (
            <div className={styles.empty}>
              <h2>This collection is being prepared.</h2>
              <p>Explore another category to discover more glassware, or browse our full product collection.</p>
              <Link href="/products" className={styles.button}>Browse all products</Link>
            </div>
          )}
          <ProductPagination pagination={pagination} path={`/products/category/${category.slug}`} />
        </div>
      </section>
    </div>
  );
}
