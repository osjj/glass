import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Factory,
  GlobeHemisphereWest,
  MagnifyingGlass,
  Package,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import { ArticleCard } from "@/components/site/article-card";
import { ProductCard } from "@/components/site/product-card";
import { productCategories } from "@/data/catalog";
import { getPublishedBlogPosts } from "@/lib/public-blog";
import { getPublishedProducts } from "@/lib/public-products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Glarivo Glassware | Clear collections for confident sourcing" },
  description: "Explore Glarivo drinkware, tableware, serveware, storage, bakeware, and colored glassware collections.",
  alternates: { canonical: "/" },
};

const capabilityItems = [
  { icon: Package, value: "6", label: "Focused glassware collections" },
  { icon: ShieldCheck, value: "Clear", label: "Source-led product information" },
  { icon: Factory, value: "Ready", label: "Structured production details" },
  { icon: GlobeHemisphereWest, value: "Flexible", label: "Catalog built to grow" },
] as const;

const processSteps = ["Select", "Sample", "Confirm", "Produce", "Inspect", "Pack"];

// Temporary reference copy from garboglass.com. Keep this content isolated so
// company claims and image URLs can be replaced together before publication.
const companyStats = [
  { value: "30+", label: "Experience" },
  { value: "50,000+", label: "Products" },
  { value: "140+", label: "Countries and Regions" },
  { value: "85,000 ㎡", label: "Factory Area" },
] as const;

const whyChooseItems = [
  "Specialized in daily glassware manufacture, trading, design and development since 1993, with 85,000 ㎡ warehouses in Southern and Northern China.",
  "With 3,000 ㎡ showrooms and more than 50,000 items at the Guangzhou headquarters, more than 10,000 global customers find satisfactory products here.",
  "With a 40+ person sales team, 20+ person design team, and 300+ workers, at least 600 new items are developed for different market demands every year.",
  "Focused on face-to-face communication for in-depth product development and market maintenance, with two Canton Fair appearances, overseas exhibitions, and market research in more than 20 countries every year.",
  "Strong production and delivery capacity, with an annual output of 100 million pieces, 200 tons per day, and about eight high-cube containers per day.",
] as const;

const serviceItems = [
  {
    title: "Pattern Design",
    description: "A variety of patterns, shapes & sizes.",
    image: "/images/home/garbo-reference/service-pattern-design.jpg",
  },
  {
    title: "Custom Model",
    description: "A variety of patterns, shapes & sizes.",
    image: "/images/home/garbo-reference/service-custom-model.jpg",
  },
  {
    title: "Bulk Manufacturing",
    description: "Professional factory production saves you costs.",
    image: "/images/home/garbo-reference/service-bulk-manufacturing.jpg",
  },
  {
    title: "Fast Delivery",
    description: "We have enough stock and you can get the glassware quickly.",
    image: "/images/home/garbo-reference/service-fast-delivery.jpg",
  },
  {
    title: "Free Samples",
    description: "The samples can be provided within seven workdays.",
    image: "/images/home/garbo-reference/service-free-samples.jpg",
  },
  {
    title: "Product Design",
    description: "We can laser engrave or print your logo for a more stable result.",
    image: "/images/home/garbo-reference/service-product-design.jpg",
  },
] as const;

const exhibitionImages = [
  { src: "/images/home/garbo-reference/exhibition-01.jpg", alt: "Garbo exhibition booth and glassware display" },
  { src: "/images/home/garbo-reference/exhibition-02.jpg", alt: "Glassware trade-show meetings and displays" },
  { src: "/images/home/garbo-reference/exhibition-03.jpg", alt: "Garbo market research and customer visits" },
  { src: "/images/home/garbo-reference/exhibition-04.jpg", alt: "International glassware exhibition meetings" },
] as const;

const testimonials = [
  {
    title: "We produced glass jars for one US supermarket",
    quote: "We have worked with this factory since Sep 2016, and never worried about our goods, because they always deliver quality goods on time with the best service.",
    attribution: "Purchase Manager — Lace",
    image: "/images/home/garbo-reference/testimonial-01.jpg",
  },
  {
    title: "We produced glass bowls for one India wholesaler",
    quote: "This glassware manufacturer’s designs follow the fashion trends. The products we import from them are popular in our market and generate a lot of profit for us.",
    attribution: "President Buyer — Srikrushna Sahu",
    image: "/images/home/garbo-reference/testimonial-02.jpg",
  },
  {
    title: "We produced opal glassware for an Egypt importer",
    quote: "We are satisfied with the design and price of the opal glassware from Garbo. They provide the best support for each step from inquiry to order delivery, and we have enjoyed working together for many years.",
    attribution: "Sourcing Specialist — Abdelrahim Elwan",
    image: "/images/home/garbo-reference/testimonial-03.jpg",
  },
  {
    title: "We produced glass mugs for a Brazil distributor",
    quote: "The delivery time is very punctual, and there has never been a delay, which is very important for us in the gift promotion industry. The products and gift-box packaging help make sure we have a successful promotion.",
    attribution: "Importer — Marta Lopez",
    image: "/images/home/garbo-reference/testimonial-04.jpg",
  },
  {
    title: "We produced glass cups for a South Africa chain store",
    quote: "We started our cooperation in 2011, importing tableware from pressed glass to blown glass, which has continuously expanded the product categories for my business. It is our ideal partner for long-term cooperation.",
    attribution: "Company Boss — Marinda Nel",
    image: "/images/home/garbo-reference/testimonial-05.jpg",
  },
] as const;

export default async function HomePage() {
  const [products, articles] = await Promise.all([
    getPublishedProducts(),
    getPublishedBlogPosts(),
  ]);
  const featuredProducts = products.filter((product) => product.featured).slice(0, 3);

  return (
    <>
      <section className="relative -mt-[88px] min-h-[610px] overflow-hidden bg-[var(--navy)] pt-[88px] text-white sm:min-h-[500px] lg:min-h-[420px]">
        <Image
          src="/images/home/hero-glassware.webp"
          alt="Clear glassware collection displayed in a modern warehouse showroom"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,22,52,0.98)_0%,rgba(8,31,68,0.92)_35%,rgba(8,31,68,0.25)_72%,rgba(8,31,68,0.05)_100%)]" />
        <div className="site-container relative flex min-h-[522px] min-w-0 items-center py-12 sm:min-h-[412px] sm:py-8 lg:min-h-[332px]">
          <div className="min-w-0 max-w-[760px]">
            <p className="inline-flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[var(--lime)]">
              <span className="h-0.5 w-7 rounded-full bg-current" />
              Focused glassware catalog
            </p>
            <h1 className="mt-5 max-w-[calc(100vw-2rem)] break-words text-[2.72rem] font-bold leading-[0.98] tracking-[-0.05em] sm:max-w-3xl sm:text-[3.45rem] lg:text-[3.8rem]">
              One clear source for everyday glassware.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/72">
              Focused collections. Practical product data. Straightforward sourcing.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/products" className="inline-flex min-h-12 items-center gap-3 rounded-lg bg-[var(--lime)] px-6 text-sm font-bold text-[var(--navy)] transition hover:-translate-y-0.5 hover:bg-[var(--lime-strong)]">
                View products
                <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </Link>
              <Link href="/blog" className="inline-flex min-h-12 items-center rounded-lg border border-white/50 px-6 text-sm font-bold text-white transition hover:bg-white/10">
                Read our guides
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-4 pb-4">
        <div className="site-container">
          <form action="/products" method="get" className="grid min-w-0 max-w-full gap-3 overflow-hidden rounded-xl border border-[var(--line)] bg-white p-4 shadow-[0_24px_60px_rgba(15,42,89,0.14)] sm:p-5 lg:grid-cols-[1.45fr_0.8fr_auto]">
            <label className="relative block min-w-0">
              <span className="sr-only">Find a product or category</span>
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--navy)]" size={20} aria-hidden="true" />
              <input
                type="search"
                name="q"
                placeholder="Find a product or category"
                className="h-13 w-full min-w-0 max-w-full rounded-lg border border-[var(--line)] bg-white pl-12 pr-4 text-sm font-semibold text-[var(--ink)] placeholder:text-[var(--ink-muted)]"
              />
            </label>
            <label>
              <span className="sr-only">Choose a category</span>
              <select name="category" defaultValue="" className="h-13 w-full rounded-lg border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--ink-muted)]">
                <option value="">All categories</option>
                {productCategories.map((category) => (
                  <option key={category.slug} value={category.slug}>{category.label}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="inline-flex h-13 items-center justify-center gap-2 rounded-lg bg-[var(--navy)] px-8 text-sm font-bold text-white hover:bg-[var(--navy-soft)]">
              Search
              <ArrowRight size={17} weight="bold" />
            </button>
          </form>
        </div>
      </section>

      <section className="site-container py-8 sm:py-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="text-xl font-bold tracking-[-0.035em] text-[var(--navy)] sm:text-2xl">Browse glassware collections</h2>
          <Link href="/products" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--navy)]">
            View all products <ArrowRight size={17} weight="bold" />
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {productCategories.map((category) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className="group relative min-h-36 overflow-hidden rounded-xl bg-[var(--navy)] text-white"
            >
              <Image src={category.image} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,22,48,0.88),rgba(6,22,48,0.12))]" />
              <div className="relative flex min-h-36 items-center justify-between p-6">
                <h3 className="max-w-44 text-2xl font-bold tracking-[-0.035em]">{category.label}</h3>
                <span className="grid size-10 place-items-center rounded-full border border-white/40 bg-white/10 transition group-hover:border-[var(--lime)] group-hover:bg-[var(--lime)] group-hover:text-[var(--navy)]">
                  <ArrowRight size={18} weight="bold" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="site-container pb-16 sm:pb-24">
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_18px_55px_rgba(15,42,89,0.08)]">
          <div className="grid border-b border-[var(--line)] lg:grid-cols-[1.05fr_2.95fr]">
            <div className="p-7 sm:p-9">
              <p className="eyebrow">Built for a clear catalog</p>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.045em] text-[var(--navy)]">Capabilities that keep information useful.</h2>
              <p className="mt-4 text-sm leading-6 text-[var(--ink-muted)]">The first release organizes products, sourcing details, and editorial guidance without adding unnecessary workflows.</p>
            </div>
            <div className="grid border-t border-[var(--line)] sm:grid-cols-2 lg:grid-cols-4 lg:border-l lg:border-t-0">
              {capabilityItems.map(({ icon: Icon, value, label }) => (
                <article key={label} className="border-b border-[var(--line)] p-6 last:border-b-0 sm:border-r sm:last:border-r-0 lg:border-b-0">
                  <Icon size={29} weight="duotone" className="text-[var(--blue)]" aria-hidden="true" />
                  <p className="mt-5 text-3xl font-bold tracking-[-0.05em] text-[var(--navy)]">{value}</p>
                  <p className="mt-2 text-sm leading-5 text-[var(--ink-muted)]">{label}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="grid lg:grid-cols-[1.35fr_0.65fr]">
            <div className="relative min-h-72 overflow-hidden">
              <Image src="/images/home/glassware-production.webp" alt="Glassware production, inspection, and packing process" fill sizes="(min-width: 1024px) 70vw, 100vw" className="object-cover" />
            </div>
            <div className="bg-[var(--surface)] p-7 sm:p-9">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[var(--blue)]">Catalog workflow</p>
              <ol className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
                {processSteps.map((step, index) => (
                  <li key={step} className="flex items-center gap-3 border-t border-[var(--line)] pt-3 text-sm font-bold text-[var(--navy)]">
                    <span className="text-[0.68rem] text-[var(--blue)]">0{index + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-sm leading-6 text-[var(--ink-muted)]">Each public page is ready to receive verified model, material, capacity, decoration, and packing information.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface)] py-16 sm:py-24">
        <div className="site-container">
          <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-stretch">
            <div className="flex flex-col justify-center rounded-2xl border border-[var(--line)] bg-white p-7 sm:p-10">
              <p className="eyebrow">Company snapshot</p>
              <h2 className="mt-5 text-3xl font-bold tracking-[-0.045em] text-[var(--navy)] sm:text-5xl">
                Garbo Glassware
              </h2>
              <p className="mt-3 text-lg font-semibold text-[var(--blue)]">
                Making Glassware Since 1993
              </p>
            </div>
            <dl className="grid overflow-hidden rounded-2xl bg-[var(--navy)] text-white sm:grid-cols-2 xl:grid-cols-4">
              {companyStats.map((stat) => (
                <div key={stat.label} className="border-b border-white/12 p-6 last:border-b-0 sm:odd:border-r sm:[&:nth-child(n+3)]:border-b-0 xl:border-b-0 xl:border-r xl:last:border-r-0">
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-white/58">
                    {stat.label}
                  </dt>
                  <dd className="mt-4 text-3xl font-bold tracking-[-0.05em] text-white">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-7 grid overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_18px_55px_rgba(15,42,89,0.08)] lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-7 sm:p-10 lg:p-12">
              <p className="eyebrow">Why choose us?</p>
              <h2 className="mt-5 max-w-xl text-3xl font-bold leading-tight tracking-[-0.045em] text-[var(--navy)] sm:text-4xl">
                Built around glassware sourcing at scale.
              </h2>
              <ol className="mt-8 space-y-5">
                {whyChooseItems.map((item, index) => (
                  <li key={item} className="grid grid-cols-[2rem_1fr] gap-3 text-sm leading-6 text-[var(--ink-muted)]">
                    <span className="grid size-8 place-items-center rounded-full bg-[var(--surface-blue)] text-xs font-bold text-[var(--blue)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="relative min-h-80 bg-[var(--navy)] lg:min-h-full">
              <Image
                src="/images/home/garbo-reference/company-showroom.jpg"
                alt="Garbo glassware showroom and reception area"
                fill
                sizes="(min-width: 1024px) 48vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(5,22,52,0.72)_100%)]" />
              <p className="absolute bottom-7 left-7 right-7 text-sm font-semibold leading-6 text-white/85 sm:bottom-10 sm:left-10 sm:right-10">
                Design, manufacturing, inspection, packing, and delivery support in one sourcing workflow.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="site-container py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Services</p>
          <h2 className="mt-5 text-3xl font-bold leading-tight tracking-[-0.045em] text-[var(--navy)] sm:text-5xl">
            Our advantageous services fulfill your business needs
          </h2>
          <p className="mt-5 text-base leading-7 text-[var(--ink-muted)]">
            As a manufacturer and exporter of glassware, every step from design to manufacturing improves your custom glassware experience.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {serviceItems.map((service, index) => (
            <article key={service.title} className="group overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_12px_38px_rgba(15,42,89,0.07)]">
              <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface)]">
                <Image
                  src={service.image}
                  alt={`${service.title} glassware service`}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <span className="absolute left-5 top-5 grid size-10 place-items-center rounded-full bg-[var(--navy)] text-xs font-bold text-white shadow-lg">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold tracking-[-0.035em] text-[var(--navy)]">
                  {service.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">
                  {service.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="overflow-hidden bg-[var(--navy)] py-16 text-white sm:py-24">
        <div className="site-container">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[var(--lime)]">
              <span className="h-0.5 w-7 rounded-full bg-current" />
              Global presence
            </p>
            <h2 className="mt-5 text-3xl font-bold tracking-[-0.045em] sm:text-5xl">
              Exhibition &amp; market research
            </h2>
            <p className="mt-5 text-base leading-7 text-white/68">
              We attend all kinds of exhibitions and conduct market research since 2011.
            </p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.15fr_0.9fr_1.15fr]">
            <div className="relative min-h-72 overflow-hidden rounded-2xl sm:min-h-96 lg:min-h-[430px]">
              <Image src={exhibitionImages[0].src} alt={exhibitionImages[0].alt} fill sizes="(min-width: 1024px) 36vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="grid min-h-72 gap-3 sm:min-h-96 lg:min-h-[430px]">
              {exhibitionImages.slice(1, 3).map((image) => (
                <div key={image.src} className="relative min-h-0 overflow-hidden rounded-2xl">
                  <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 28vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                </div>
              ))}
            </div>
            <div className="relative min-h-72 overflow-hidden rounded-2xl sm:col-span-2 sm:min-h-96 lg:col-span-1 lg:min-h-[430px]">
              <Image src={exhibitionImages[3].src} alt={exhibitionImages[3].alt} fill sizes="(min-width: 1024px) 36vw, 100vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface)] py-16 sm:py-24">
        <div className="site-container">
          <div className="mx-auto max-w-4xl text-center">
            <p className="eyebrow">Customer stories</p>
            <h2 className="mt-5 text-3xl font-bold tracking-[-0.045em] text-[var(--navy)] sm:text-5xl">
              What Our Clients Are Saying
            </h2>
            <p className="mt-5 text-base leading-7 text-[var(--ink-muted)]">
              We are honored to provide glass tableware design, research and development, manufacturing, and supply services to more than 10,000 enterprises in 140 countries, including brand owners, wholesalers, manufacturers, and suppliers.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article key={testimonial.title} className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_12px_38px_rgba(15,42,89,0.07)]">
                <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface-blue)]">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.title}
                    fill
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <span aria-hidden="true" className="text-5xl font-bold leading-none text-[var(--lime-strong)]">
                    “
                  </span>
                  <h3 className="-mt-2 text-xl font-bold leading-7 tracking-[-0.035em] text-[var(--navy)]">
                    {testimonial.title}
                  </h3>
                  <blockquote className="mt-4 flex flex-1 flex-col">
                    <p className="text-sm leading-6 text-[var(--ink-muted)]">
                      {testimonial.quote}
                    </p>
                    <footer className="mt-6 border-t border-[var(--line)] pt-4 text-sm font-bold text-[var(--navy)]">
                      {testimonial.attribution}
                    </footer>
                  </blockquote>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {featuredProducts.length ? <section className="bg-[var(--surface)] py-16 sm:py-24">
        <div className="site-container">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Featured products</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-[var(--navy)] sm:text-5xl">Selected glassware products</h2>
            </div>
            <Link href="/products" className="button-secondary">View catalog <ArrowRight size={17} weight="bold" /></Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </section> : null}

      {articles.length ? <section className="site-container py-16 sm:py-24">
        <div className="mb-8">
          <p className="eyebrow">Latest guides</p>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-[var(--navy)] sm:text-5xl">Practical notes for better product decisions</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {articles.slice(0, 2).map((article) => <ArticleCard key={article.slug} article={article} />)}
        </div>
      </section> : null}
    </>
  );
}
