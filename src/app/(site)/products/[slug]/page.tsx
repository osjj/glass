import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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
import { getPublicCategories, getPublishedProductBySlug } from "@/lib/public-products";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

type ProductDetailPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.summary,
    alternates: { canonical: `/products/${product.slug}` },
  };
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-center text-[clamp(1.55rem,3vw,2rem)] font-semibold leading-tight text-[#075989]">
      {children}
      <span className="mx-auto mt-3 block h-0.5 w-12 bg-[#075989]" aria-hidden="true" />
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

  const canonicalUrl = `${getSiteUrl()}/products/${product.slug}`;
  const shareUrl = encodeURIComponent(canonicalUrl);
  const shareText = encodeURIComponent(product.name);

  return (
    <>
      <section className="relative isolate grid min-h-44 place-items-center overflow-hidden text-white sm:min-h-[11.25rem]">
        <Image
          src={product.categoryHeroImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(6,46,76,0.68),rgba(10,47,72,0.2)_47%,rgba(11,42,60,0.48))]" />
        <div className="site-container py-8 text-center [text-shadow:0_2px_4px_rgba(0,0,0,0.34)]">
          <h1 className="text-3xl font-bold sm:text-5xl">{product.categoryLabel}</h1>
          <nav className="mt-4 flex flex-wrap items-center justify-center gap-1 text-xs sm:text-sm" aria-label="Breadcrumb">
            <House className="size-4" aria-hidden="true" />
            <Link href="/">Home</Link>
            <ChevronRight className="size-4" aria-hidden="true" />
            <Link href="/products">Products</Link>
            <ChevronRight className="size-4" aria-hidden="true" />
            <span aria-current="page">{product.categoryLabel}</span>
          </nav>
        </div>
      </section>

      <section className="mx-auto grid w-[calc(100%-2rem)] max-w-[1218px] gap-8 py-8 sm:w-[calc(100%-3rem)] sm:py-12 lg:grid-cols-[16.625rem_minmax(0,1fr)]">
        <aside className="hidden self-start border border-[#edf0f2] bg-white shadow-[0_10px_28px_rgba(24,48,66,0.08)] lg:block">
          <h2 className="bg-[#075989] px-4 py-4 text-xl font-medium uppercase text-white">Product Categories</h2>
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

        <div className="grid min-w-0 gap-7 xl:grid-cols-[minmax(24rem,1.08fr)_minmax(20rem,0.92fr)] xl:gap-14">
          <ProductDetailGallery images={gallery} />

          <article className="min-w-0 pt-1">
            <h2 className="border-b border-[#e8e9ea] pb-3 text-[clamp(1.55rem,3vw,2rem)] font-bold leading-[1.35] text-[#075989]">
              {product.name}
            </h2>
            <div className="mt-3 flex gap-2" aria-label="Share product">
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noreferrer" aria-label="Share on Facebook" className="grid size-7 place-items-center bg-black text-white"><Facebook className="size-4" /></a>
              <a href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`} target="_blank" rel="noreferrer" aria-label="Share on X" className="grid size-7 place-items-center bg-black text-white"><Twitter className="size-4" /></a>
              <a href={`mailto:?subject=${shareText}&body=${shareUrl}`} aria-label="Share by email" className="grid size-7 place-items-center bg-black text-white"><Share2 className="size-4" /></a>
            </div>

            <dl className="mt-4 space-y-4 text-sm text-[#4e555b]">
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

            <div className="mt-7 grid grid-cols-2 gap-3 max-sm:sticky max-sm:bottom-0 max-sm:z-20 max-sm:-mx-4 max-sm:gap-0 max-sm:shadow-[0_-7px_20px_rgba(12,42,64,0.12)]">
              <Link href="/about" className="flex min-h-12 items-center justify-center gap-2 bg-[#075989] px-4 text-sm font-bold uppercase text-white hover:bg-[#06496f]">
                <MessageSquareText className="size-5" /> Inquire now
              </Link>
              <Link href="/products" className="flex min-h-12 items-center justify-center gap-2 border border-[#075989] bg-white px-4 text-sm font-bold uppercase text-[#075989]">
                Next product <ArrowRight className="size-4" />
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto grid w-[calc(100%-2rem)] max-w-[1218px] gap-8 pb-20 sm:w-[calc(100%-3rem)] lg:grid-cols-[16.625rem_minmax(0,1fr)]">
        <aside className="hidden self-start bg-[linear-gradient(150deg,#0f345c,#075989)] p-6 text-white shadow-[0_16px_28px_rgba(15,52,92,0.15)] lg:sticky lg:top-28 lg:block" id="inquiry">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#bcd2df]">Need a custom glass?</p>
          <h2 className="mt-3 text-2xl font-bold leading-tight">Talk to our sourcing team</h2>
          <Link href="/about" className="mt-6 flex min-h-11 items-center justify-center gap-2 bg-[var(--lime)] px-4 text-sm font-extrabold uppercase text-[var(--navy)]">
            Send inquiry <ArrowRight className="size-4" />
          </Link>
        </aside>

        <article className="min-w-0">
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
              <div className="mt-6 overflow-x-auto border border-[#d9dddf]">
                <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
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
    </>
  );
}
