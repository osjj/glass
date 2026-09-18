import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Facebook,
  House,
  MessageSquareText,
  Share2,
  Twitter,
} from "lucide-react";
import { notFound } from "next/navigation";
import { RichContentRenderer } from "@/components/site/article-content-renderer";
import { ProductDetailGallery } from "@/components/site/product-detail-gallery";
import { InquiryButton } from "@/components/site/inquiry-contact";
import { getPublicCategories, getPublishedProductBySlug } from "@/lib/public-products";
import {
  buildProductPageStructuredData,
  getProductCategoryTrail,
} from "@/lib/product-structured-data";
import { getSiteUrl } from "@/lib/site-url";
import styles from "@/components/site/editorial-pages.module.css";
import productStyles from "@/components/site/product-pages.module.css";

export const dynamic = "force-dynamic";

type ProductDetailPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.summary,
    alternates: { canonical: `/products/${product.slug}` },
  };
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className={productStyles.sectionTitle}>
      {children}
      <span className={styles.rule} aria-hidden="true" />
    </h2>
  );
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const [product, publicCategories] = await Promise.all([
    getPublishedProductBySlug(slug),
    getPublicCategories(),
  ]);
  if (!product) notFound();

  const gallery = product.images.length
    ? product.images
    : [{
        url: product.primaryImage,
        alt: product.primaryImageAlt,
        width: null,
        height: null,
      }];
  const categoryLinks: Array<{ slug: string; label: string }> = publicCategories.map(
    ({ slug: categorySlug, label }) => ({ slug: categorySlug, label }),
  );
  if (!categoryLinks.some((category) => category.slug === product.category)) {
    categoryLinks.push({ slug: product.category, label: product.categoryLabel });
  }

  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/products/${product.slug}`;
  const categoryTrail = getProductCategoryTrail(product, publicCategories);
  const structuredData = buildProductPageStructuredData(product, categoryTrail, siteUrl);
  const shareUrl = encodeURIComponent(canonicalUrl);
  const shareText = encodeURIComponent(product.name);

  return (
    <div className={`${styles.page} ${productStyles.detail}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <section data-editorial-hero className={`${styles.hero} ${productStyles.detailHero}`}>
        <Image
          src={product.categoryHeroImage}
          alt=""
          fill
          preload
          sizes="100vw"
          className={styles.heroImage}
        />
        <div className={styles.heroShade} />
        <div className={`${styles.container} ${productStyles.detailHeroContent}`}>
          <p className={styles.kicker}>Glarivo collection</p>
          <p className={productStyles.collectionTitle}>{product.categoryLabel}</p>
          <nav className={productStyles.breadcrumb} aria-label="Breadcrumb">
            <House className="size-4" aria-hidden="true" />
            <Link href="/">Home</Link>
            <ChevronRight className="size-4" aria-hidden="true" />
            <Link href="/products">Products</Link>
            {categoryTrail.map((category) => (
              <Fragment key={category.id}>
                <ChevronRight className="size-4" aria-hidden="true" />
                <Link href={`/products/category/${category.slug}`}>{category.label}</Link>
              </Fragment>
            ))}
            <ChevronRight className="size-4" aria-hidden="true" />
            <span aria-current="page">{product.name}</span>
          </nav>
        </div>
      </section>

      <section className={`${styles.container} ${styles.catalog} ${productStyles.detailCatalog}`}>
        <aside className={productStyles.categories}>
          <h2>Product Categories</h2>
          <nav className="max-h-[calc(100vh-12rem)] overflow-y-auto" aria-label="Product categories">
            {categoryLinks.map((category) => {
              const active = category.slug === product.category;
              return (
                <Link
                  key={category.slug}
                  href={`/products/category/${category.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-12 items-center justify-between border-b border-[#eef0f1] px-5 text-sm transition ${
                    active ? "bg-[#dedede] text-[#144f74]" : "text-[#4e565c] hover:bg-[#f1f6f9] hover:text-[#075989]"
                  }`}
                >
                  {category.label}
                  {!active ? <ChevronRight className="size-4" aria-hidden="true" /> : null}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className={productStyles.productIntro}>
          <div className={productStyles.gallery}><ProductDetailGallery images={gallery} /></div>

          <article className={productStyles.productInfo}>
              <p className={styles.kicker}>{product.categoryLabel}</p>
              <h1>
                {product.name}
              </h1>
            <div className={productStyles.share} aria-label="Share product">
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noreferrer" aria-label="Share on Facebook" className="grid size-7 place-items-center bg-black text-white"><Facebook className="size-4" /></a>
              <a href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`} target="_blank" rel="noreferrer" aria-label="Share on X" className="grid size-7 place-items-center bg-black text-white"><Twitter className="size-4" /></a>
              <a href={`mailto:?subject=${shareText}&body=${shareUrl}`} aria-label="Share by email" className="grid size-7 place-items-center bg-black text-white"><Share2 className="size-4" /></a>
            </div>

            <dl className={productStyles.overview}>
              {product.sku ? (
                <div className="grid grid-cols-[max-content_1fr] gap-1">
                  <dt className="flex items-start gap-1"><ChevronRight className="mt-0.5 size-4 fill-[#1e489f] text-[#1e489f]" />Item No.:</dt>
                  <dd className="m-0">{product.sku}</dd>
                </div>
              ) : null}
              {product.overviewFields.map((field) => (
                <div key={`${field.label}-${field.value}`} className="grid grid-cols-[max-content_1fr] gap-1">
                  <dt className="flex items-start gap-1"><ChevronRight className="mt-0.5 size-4 fill-[#1e489f] text-[#1e489f]" />{field.label}:</dt>
                  <dd className="m-0">{field.value}</dd>
                </div>
              ))}
            </dl>

            <div className={productStyles.actions}>
              <InquiryButton product={{ name: product.name, sku: product.sku }} className={styles.button}>
                <MessageSquareText className="size-5" /> Inquire now
              </InquiryButton>
              <Link href="/products" className={productStyles.outlineButton}>
                All products <ArrowRight className="size-4" />
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className={`${styles.container} ${productStyles.detailsLayout}`}>
        <aside className={productStyles.inquiryCard} id="inquiry">
          <p className={styles.kicker}>Need a custom glass?</p>
          <h2>Talk to our sourcing team</h2>
          <InquiryButton product={{ name: product.name, sku: product.sku }} className={productStyles.outlineButton}>
            Send inquiry <ArrowRight className="size-4" />
          </InquiryButton>
        </aside>

        <article className={productStyles.detailsContent}>
          {product.features.length || product.description ? (
            <section className="mb-10">
              <SectionTitle>{product.detailsHeading}</SectionTitle>
              {product.features.length ? (
                <ul className="mt-6 space-y-3 text-sm leading-7 text-[#4b5359]">
                  {product.features.map((feature) => (
                    <li key={feature} className="grid grid-cols-[1.1rem_1fr] gap-2">
                      <Check className="mt-1.5 size-4 text-[#075989]" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-6 whitespace-pre-line text-sm leading-7 text-[#4b5359]">{product.description}</p>
              )}
            </section>
          ) : null}

          {product.specifications.length ? (
            <section className="mb-10">
              <SectionTitle>{product.specificationHeading}</SectionTitle>
              <div className={productStyles.specifications}>
                <table>
                  <tbody>
                    {product.specifications.map((specification) => (
                      <tr key={`${specification.label}-${specification.value}`} className="border-b border-[#d9dddf] last:border-b-0">
                        <th scope="row" className="w-[31%] border-r border-[#d9dddf] bg-[#f5f6f6] px-4 py-3 font-semibold text-[#3f4a52]">{specification.label}</th>
                        <td className="px-4 py-3 leading-6 text-[#50585e]">{specification.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {product.contentSections.map((section) => (
            <section key={section.sourceKey} className="mb-10 text-center">
              <SectionTitle>{section.title}</SectionTitle>
              {section.body ? <p className="mx-auto mt-5 max-w-3xl whitespace-pre-line text-left text-sm leading-7 text-[#4b5359]">{section.body}</p> : null}
              {section.images.length ? (
                <div className="mt-6 grid gap-6">
                  {section.images.map((image, index) => (
                    <Image
                      key={`${image.url}-${index}`}
                      src={image.url}
                      alt={image.alt}
                      width={image.width ?? 1200}
                      height={image.height ?? 900}
                      unoptimized
                      sizes="(min-width: 1280px) 900px, 100vw"
                      className="mx-auto h-auto w-auto max-w-full"
                    />
                  ))}
                </div>
              ) : null}
            </section>
          ))}

          {!product.contentSections.length && product.hasRichContent ? (
            <div className="prose-glarivo mt-10 border-t border-[var(--line)] pt-2">
              <RichContentRenderer content={product.content} />
            </div>
          ) : null}
        </article>
      </section>
    </div>
  );
}
