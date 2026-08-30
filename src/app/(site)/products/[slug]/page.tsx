import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CaretRight, Check } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";
import { RichContentRenderer } from "@/components/site/article-content-renderer";
import { productCategories } from "@/data/catalog";
import { getPublishedProductBySlug } from "@/lib/public-products";

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

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);
  if (!product) notFound();

  const gallery = product.images.length
    ? product.images
    : [{ url: product.primaryImage, alt: product.primaryImageAlt }];
  const categoryLinks: Array<{ slug: string; label: string }> = productCategories.map((category) => ({
    slug: category.slug,
    label: category.label,
  }));

  if (!categoryLinks.some((category) => category.slug === product.category)) {
    categoryLinks.push({ slug: product.category, label: product.categoryLabel });
  }

  const categoryMenu = (
    <nav aria-label="Product categories" className="p-2">
      <Link
        href="/products"
        className="flex items-center justify-between rounded-lg px-4 py-3 text-sm font-bold text-[var(--navy)] transition-colors hover:bg-[var(--surface-blue)]"
      >
        All Products
        <CaretRight size={15} weight="bold" />
      </Link>
      {categoryLinks.map((category) => {
        const isActive = category.slug === product.category;

        return (
          <Link
            key={category.slug}
            href={`/products?category=${category.slug}`}
            aria-current={isActive ? "page" : undefined}
            className={`mt-1 flex items-center justify-between rounded-lg px-4 py-3 text-sm font-bold transition-colors ${
              isActive
                ? "bg-[var(--navy)] text-white"
                : "text-[var(--ink-muted)] hover:bg-[var(--surface-blue)] hover:text-[var(--navy)]"
            }`}
          >
            {category.label}
            <CaretRight size={15} weight="bold" className={isActive ? "text-[var(--lime)]" : ""} />
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <section className="site-container py-8 sm:py-12">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--ink-muted)]">
          <Link href="/" className="font-bold hover:text-[var(--navy)]">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/products" className="font-bold hover:text-[var(--navy)]">
            Products
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/products?category=${product.category}`} className="font-bold hover:text-[var(--navy)]">
            {product.categoryLabel}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="max-w-full truncate text-[var(--navy)]" aria-current="page">
            {product.name}
          </span>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)]">
          <aside className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <details className="group rounded-xl border border-[var(--line)] bg-white lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-bold text-[var(--navy)] marker:content-none">
                Product Categories
                <CaretRight size={17} weight="bold" className="transition-transform group-open:rotate-90" />
              </summary>
              <div className="border-t border-[var(--line)]">{categoryMenu}</div>
            </details>

            <div className="hidden overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-[0_16px_42px_rgba(15,42,89,0.06)] lg:block">
              <div className="border-b border-[var(--line)] bg-[var(--navy)] px-5 py-5">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-[var(--lime)]">Browse catalog</p>
                <h2 className="mt-2 text-lg font-bold text-white">Product Categories</h2>
              </div>
              {categoryMenu}
            </div>
          </aside>

          <div className="min-w-0">
            <div className="grid gap-9 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] xl:items-start">
              <div className="min-w-0 space-y-4">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[var(--surface)]">
                  <Image
                    src={gallery[0].url}
                    alt={gallery[0].alt}
                    fill
                    priority
                    unoptimized
                    sizes="(min-width: 1280px) 42vw, (min-width: 1024px) 70vw, 100vw"
                    className="object-cover"
                  />
                </div>
                {gallery.length > 1 ? (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {gallery.slice(1, 5).map((image, index) => (
                      <div
                        key={`${image.url}-${index}`}
                        className="relative aspect-square overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]"
                      >
                        <Image
                          src={image.url}
                          alt={image.alt}
                          fill
                          unoptimized
                          sizes="(min-width: 1280px) 10vw, (min-width: 640px) 18vw, 30vw"
                          className="object-cover"
                        />
                        <span className="sr-only">Gallery image {index + 2}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="min-w-0 py-1 xl:pl-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-md bg-[var(--lime)] px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--navy)]">
                    Published product
                  </span>
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--blue)]">
                    {product.categoryLabel}
                  </span>
                </div>

                <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.02] tracking-[-0.05em] text-[var(--navy)] sm:text-5xl xl:text-6xl">
                  {product.name}
                </h1>
                <p className="mt-6 text-lg leading-8 text-[var(--ink-muted)]">{product.summary}</p>

                <div className="mt-8 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]">
                  <div className="border-b border-[var(--line)] p-5">
                    <span className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--ink-muted)]">Price</span>
                    <strong className="mt-2 block text-3xl tracking-[-0.04em] text-[var(--navy)]">
                      {product.price > 0 ? `${product.currency} ${product.price.toFixed(2)}` : "Request pricing"}
                    </strong>
                    {product.comparePrice !== null && product.comparePrice > product.price ? (
                      <span className="mt-1 block text-sm text-[var(--ink-muted)] line-through">
                        {product.currency} {product.comparePrice.toFixed(2)}
                      </span>
                    ) : null}
                  </div>
                  <dl className="grid sm:grid-cols-2">
                    <div className="border-b border-[var(--line)] p-5 sm:border-r sm:border-b-0">
                      <dt className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--ink-muted)]">Minimum order</dt>
                      <dd className="mt-2 text-lg font-bold text-[var(--navy)]">
                        {product.moq} {product.unit}
                      </dd>
                    </div>
                    <div className="p-5">
                      <dt className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--ink-muted)]">Item No.</dt>
                      <dd className="mt-2 break-words text-sm font-bold text-[var(--navy)]">{product.sku || "Contact us"}</dd>
                    </div>
                  </dl>
                </div>

                <a href="#product-details" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--blue)] hover:text-[var(--navy)]">
                  View product details
                  <ArrowRight size={16} weight="bold" className="rotate-90" />
                </a>
              </div>
            </div>

            <section id="product-details" className="mt-12 scroll-mt-28 border-t border-[var(--line)] pt-10 sm:mt-16 sm:pt-12">
              <div className="max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--blue)]">Full information</p>
                <h2 className="mt-3 text-3xl font-bold tracking-[-0.045em] text-[var(--navy)] sm:text-4xl">Product Details</h2>
                <p className="mt-5 whitespace-pre-line text-base leading-8 text-[var(--ink-muted)]">
                  {product.description || product.summary}
                </p>
              </div>

              {product.features.length ? (
                <ul className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 rounded-xl bg-[var(--surface)] p-4 text-sm font-bold leading-6 text-[var(--navy)]">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[var(--lime)]">
                        <Check size={13} weight="bold" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              ) : null}

              {product.attributes.length || product.specifications.length ? (
                <div className="mt-10 grid gap-8 xl:grid-cols-2">
                  {product.attributes.length ? (
                    <div>
                      <h3 className="text-xl font-bold tracking-[-0.035em] text-[var(--navy)]">Attributes</h3>
                      <dl className="mt-4 divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)]">
                        {product.attributes.map((attribute) => (
                          <div key={`${attribute.label}-${attribute.value}`} className="grid gap-2 p-4 sm:grid-cols-[9rem_1fr]">
                            <dt className="text-sm font-bold text-[var(--navy)]">{attribute.label}</dt>
                            <dd className="text-sm leading-6 text-[var(--ink-muted)]">{attribute.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ) : null}

                  {product.specifications.length ? (
                    <div>
                      <h3 className="text-xl font-bold tracking-[-0.035em] text-[var(--navy)]">Specifications</h3>
                      <dl className="mt-4 divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)]">
                        {product.specifications.map((specification) => (
                          <div key={`${specification.label}-${specification.value}`} className="grid gap-2 p-4 sm:grid-cols-[9rem_1fr]">
                            <dt className="text-sm font-bold text-[var(--navy)]">{specification.label}</dt>
                            <dd className="text-sm leading-6 text-[var(--ink-muted)]">{specification.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {product.hasRichContent ? (
                <div className="mt-14 border-t border-[var(--line)] pt-12">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--blue)]">
                    Detailed presentation
                  </p>
                  <h2 className="mt-3 text-3xl font-bold tracking-[-0.045em] text-[var(--navy)] sm:text-4xl">
                    More Product Details
                  </h2>
                  <div className="prose-glarivo mt-8 max-w-4xl">
                    <RichContentRenderer
                      content={product.content}
                      fallbackImageAlt={`${product.name} detail image`}
                    />
                  </div>
                </div>
              ) : null}
            </section>

            <Link href="/products" className="mt-10 inline-flex items-center gap-2 text-sm font-bold text-[var(--navy)] hover:text-[var(--blue)]">
              <ArrowLeft size={17} weight="bold" />
              Back to all products
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-8 bg-[var(--navy)] py-16 text-white sm:py-20">
        <div className="site-container flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--lime)]">Continue exploring</p>
            <h2 className="mt-4 text-balance text-4xl font-bold leading-tight tracking-[-0.05em]">
              Compare the rest of the current glassware catalog.
            </h2>
          </div>
          <Link href="/products" className="inline-flex items-center gap-2 self-start rounded-lg bg-white px-5 py-3 text-sm font-bold text-[var(--navy)] sm:self-auto">
            All products
            <ArrowRight size={17} weight="bold" />
          </Link>
        </div>
      </section>
    </>
  );
}
