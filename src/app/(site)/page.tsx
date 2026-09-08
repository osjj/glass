import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, ChatCircleDots, ClipboardText, Coffee, Factory,
  Jar, MagnifyingGlass, Package, PenNib, ShieldCheck, Wine,
} from "@phosphor-icons/react/dist/ssr";
import { caseStudies } from "@/data/case-studies";
import { shotGlassGuideSlug } from "@/data/editorial-posts";
import { guideClusters } from "@/data/guide-clusters";
import {
  homeBuyerScenarios, homeCollections, homeExhibitions, homeServices,
  homeSourcingPrinciples, homeSourcingSteps, homeSourcingStrengths, homeTopicDescriptions,
} from "@/data/homepage";
import { getPublishedBlogPosts } from "@/lib/public-blog";
import { getPublicCategoryTree, type PublicCategory } from "@/lib/public-products";
import styles from "./home.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: "Glarivo Glassware | Crafted for everyday elegance" },
  description: "Explore Glarivo glassware collections, practical buying guides, and glassware sourcing inspiration.",
  alternates: { canonical: "/" },
};

const sourcingIcons = [ChatCircleDots, PenNib, Factory, Package];
const topicIcons = [Wine, Wine, Coffee, Wine, Jar];
const workflow = [
  { label: "Select", icon: MagnifyingGlass }, { label: "Sample", icon: Package },
  { label: "Confirm", icon: ClipboardText }, { label: "Produce", icon: Factory },
  { label: "Inspect", icon: ShieldCheck }, { label: "Pack", icon: Package },
];

async function withTimeout<T>(promise: Promise<T>, fallback: T, timeoutMs = 3500) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => { timeout = setTimeout(() => resolve(fallback), timeoutMs); }),
    ]);
  } catch { return fallback; }
  finally { if (timeout) clearTimeout(timeout); }
}

function flattenCategories(categories: PublicCategory[]): PublicCategory[] {
  return categories.flatMap((category) => [category, ...flattenCategories(category.children)]);
}
function Rule() { return <span className={styles.rule} aria-hidden="true" />; }
function Photo({ src, alt, className = "", sizes = "(min-width: 900px) 45vw, 100vw", aspectRatio }: {
  src: string; alt: string; className?: string; sizes?: string; aspectRatio?: string;
}) {
  return <div className={styles.photo + " " + className} style={aspectRatio ? { aspectRatio } : undefined}><Image src={src} alt={alt} fill sizes={sizes} /></div>;
}

export default async function HomePage() {
  const [articles, categoryTree] = await Promise.all([
    withTimeout(getPublishedBlogPosts(), []),
    withTimeout(getPublicCategoryTree(), []),
  ]);
  const categories = flattenCategories(categoryTree);
  const featuredArticle = articles[0];
  // A slow request must not bypass an administrator's publication status.
  // The permanent guide hub provides a useful fallback without exposing drafts.
  const guideHref = featuredArticle ? "/blog/" + featuredArticle.slug : "/guides/shot-glass-sourcing";
  const useShotGlassImage = !featuredArticle || featuredArticle.slug === shotGlassGuideSlug;
  const study = caseStudies[0];

  return (
    <div className={styles.home}>
      <section data-home-hero className={styles.hero}>
        <Image src="/images/home/showroom-hero-v2.webp" alt="Warm glassware showroom with illuminated wood displays and glass collections" fill preload sizes="100vw" className={styles.heroImage} />
        <div className={styles.heroShade} />
        <div className={styles.container + " " + styles.heroContent}>
          <div>
            <p className={styles.heroKicker}>Glassware for modern living</p>
            <h1 className={styles.heroTitle}>Crafted for<br />everyday elegance.</h1>
            <p className={styles.heroDescription}>Clear collections, thoughtful customization,<br className={styles.desktopBreak} /> and dependable sourcing for global<br className={styles.desktopBreak} /> glassware buyers.</p>
            <div className={styles.actions}>
              <Link href="#collections" className={styles.button}>Explore collections</Link>
              <Link href="#custom-glassware" className={styles.heroLink}>Start a custom project</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="collections" aria-labelledby="collections-heading" className={styles.collections}>
        <div className={styles.container}>
          <header className={styles.centered}>
            <h2 id="collections-heading" className={styles.heading}>Explore our collections</h2><Rule />
          </header>
          <div className={styles.collectionGrid}>
            {homeCollections.map((collection) => {
              const category = categories.find((item) => item.slug === collection.category);
              const href = category ? "/products/category/" + category.slug : "/products?q=" + encodeURIComponent(collection.query);
              return <Link key={collection.label} href={href} className={styles.collectionCard}>
                <Photo src={"/images/home/editorial/category-" + collection.image + ".webp"} alt={collection.label + " glassware collection"} className={styles.collectionPhoto} sizes="(min-width: 900px) 15vw, (min-width: 540px) 30vw, 45vw" />
                <h3>{collection.label}</h3><ArrowRight size={25} weight="light" aria-hidden="true" />
              </Link>;
            })}
          </div>
        </div>
      </section>

      <section id="custom-glassware" aria-labelledby="custom-heading" className={styles.custom}>
        <Photo src="/images/home/glass-forming-process-v2.webp" alt="Gloved hands inspecting a glass vessel beside forming equipment" className={styles.customPhoto} sizes="(min-width: 900px) 50vw, 100vw" />
        <div className={styles.customContent}>
          <h2 id="custom-heading" className={styles.heading}>From concept to glass</h2><Rule />
          <p className={styles.intro}>We help global buyers turn ideas into collections with clarity, precision, and care.</p>
          <ol className={styles.sourcingSteps}>
            {homeSourcingSteps.map((step, index) => {
              const Icon = sourcingIcons[index];
              return <li key={step.title}>
                <span className={styles.sourcingIcon}><Icon size={31} weight="light" aria-hidden="true" /></span>
                <div><h3><span>{String(index + 1).padStart(2, "0")}</span> {step.title}</h3><p>{step.description}</p></div>
              </li>;
            })}
          </ol>
          <Link href="/about" className={styles.button}>Start a custom project</Link>
        </div>
      </section>

      <section id="insights" aria-labelledby="insights-heading" className={styles.insights + " " + styles.dark}>
        <div className={styles.container}>
          <p className={styles.kicker + " " + styles.lightKicker}>Curated insights</p>
          <h2 id="insights-heading" className={styles.heading}>Ideas and inspiration<br />for growing your business.</h2><Rule />
          <article className={styles.featuredGuide}>
            <Link href={guideHref} aria-label={featuredArticle?.title ?? "Explore shot glass sourcing"}>
              <Photo src={useShotGlassImage ? "/images/home/editorial/shot-glass-guide.webp" : featuredArticle.coverImage}
                alt={useShotGlassImage ? "Editorial illustration of clear shot glasses in different profiles under warm light" : featuredArticle.coverImageAlt}
                className={styles.guidePhoto} sizes="(min-width: 900px) 55vw, 100vw" />
            </Link>
            <div className={styles.guideCopy}>
              <p className={styles.kicker}>{featuredArticle?.category ?? "Buying guide hub"}</p>
              <h3 className={styles.subheading}><Link href={guideHref}>{featuredArticle?.title ?? "Shot glass sourcing, from selection to sample."}</Link></h3>
              {featuredArticle && <time dateTime={featuredArticle.publishedAt}>{featuredArticle.publishedLabel}</time>}
              <p>{featuredArticle?.excerpt ?? "Compare capacity, glass profiles, decoration and packaging. Prepare a practical wholesale brief and sample checklist."}</p>
              <Link href={guideHref} className={styles.goldLink}>{featuredArticle ? "Read the guide" : "Explore the guide hub"}<ArrowRight size={24} weight="light" aria-hidden="true" /></Link>
            </div>
          </article>
          <nav className={styles.topicGrid} aria-label="Glassware buying topics">
            {guideClusters.map((cluster, index) => {
              const Icon = topicIcons[index];
              return <Link href={"/guides/" + cluster.slug} className={styles.topic} key={cluster.slug}>
                <Icon size={47} weight="thin" aria-hidden="true" /><div><h3>{cluster.title}</h3><p>{homeTopicDescriptions[index]}</p></div>
              </Link>;
            })}
          </nav>
        </div>
      </section>

      <section aria-labelledby="capabilities-heading" className={styles.capabilities}>
        <div className={styles.container}>
          <p className={styles.kicker}>Catalog capabilities</p>
          <h2 id="capabilities-heading" className={styles.heading}>A clearer way to source glassware.</h2><Rule />
          <dl className={styles.capabilityGrid}>
            <div><dt>{categories.length || "56"}</dt><dd>Glassware categories</dd></div>
            <div><dt>Clear</dt><dd>Source-led information</dd></div>
            <div><dt>Ready</dt><dd>Structured product details</dd></div>
            <div><dt>Flexible</dt><dd>A growing catalog</dd></div>
          </dl>
          <p className={styles.specLine}>Model · Material · Capacity · Decoration · Packing</p>
        </div>
      </section>

      <section aria-labelledby="workflow-heading" className={styles.workflow + " " + styles.dark}>
        <div className={styles.container}>
          <p className={styles.kicker}>Workflow</p><h2 id="workflow-heading" className={styles.heading}>From selection to packing</h2>
          <ol className={styles.workflowGrid}>
            {workflow.map(({ label, icon: Icon }, index) => <li key={label}>
              <span className={styles.workflowIcon}><Icon size={39} weight="thin" aria-hidden="true" /></span>
              <span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span><h3>{label}</h3>
            </li>)}
          </ol>
        </div>
      </section>

      <section aria-labelledby="company-heading" className={styles.company}>
        <div className={styles.container}>
          <div className={styles.companyIntro}>
            <Photo src="/images/home/showroom-hero.webp" alt="Editorial glassware showroom scene with illuminated displays" className={styles.companyPhoto} sizes="(min-width: 900px) 55vw, 100vw" />
            <div><p className={styles.kicker}>Sourcing approach</p><h2 id="company-heading" className={styles.heading}>Glarivo Glassware</h2><p className={styles.companyTagline}>Clear choices for every glassware project.</p><Rule /></div>
          </div>
          <dl className={styles.companyStats}>
            {homeSourcingPrinciples.map((principle) => <div key={principle.label}><dt>{principle.value}</dt><dd>{principle.label}</dd></div>)}
          </dl>
          <p className={styles.sourceNote}>A practical framework for browsing, comparing and planning a glassware inquiry.</p>
          <div className={styles.strengths}>
            <div>
              <p className={styles.kicker}>How we help</p><h2 className={styles.heading}>A clearer path from idea to shortlist.</h2><Rule />
              <ol className={styles.strengthList}>
                {homeSourcingStrengths.map((strength, index) => <li key={strength.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span><div><h3>{strength.title}</h3><p>{strength.description}</p></div>
                </li>)}
              </ol>
            </div>
            <Photo src="/images/home/editorial/crystal-collection.webp" alt="Editorial glassware arrangement of wine glasses and a crystal decanter on a warm wood table" className={styles.strengthPhoto} />
          </div>
        </div>
      </section>

      <section id="services" aria-labelledby="services-heading" className={styles.services}>
        <div className={styles.container}>
          <header className={styles.centered}>
            <p className={styles.kicker}>Services</p><h2 id="services-heading" className={styles.heading}>Thoughtful services for<br />your glassware business.</h2><Rule />
            <p className={styles.sectionNote}>Support areas for shaping a clearer product and sourcing brief.</p>
          </header>
          <div className={styles.serviceGrid}>
            {homeServices.map((service, index) => <article className={styles.serviceCard} key={service.title}>
              <Photo src={"/images/home/editorial/" + service.image + ".webp"} alt={service.alt} className={styles.servicePhoto} sizes="(min-width: 900px) 30vw, (min-width: 540px) 45vw, 100vw" />
              <div className={styles.serviceTitle}><span>{String(index + 1).padStart(2, "0")}</span><h3>{service.title}</h3></div><p>{service.description}</p>
            </article>)}
          </div>
          <div className={styles.serviceEnding}><p>From design and sampling to production and delivery.</p><Link href="/products" className={styles.button}>Explore the collection</Link></div>
        </div>
      </section>

      <section id="exhibitions" aria-labelledby="exhibitions-heading" className={styles.exhibitions + " " + styles.dark}>
        <div className={styles.container}>
          <header className={styles.exhibitionHeader}>
            <div><p className={styles.kicker}>Exhibitions & connections</p><h2 id="exhibitions-heading" className={styles.heading}>Exhibitions &amp;<br />market conversations.</h2></div>
            <p className={styles.exhibitionIntro}>Glassware, shared ideas and<br />face-to-face conversations.</p>
          </header>
          <div className={styles.exhibitionGrid}>
            {[homeExhibitions.slice(0, 2), homeExhibitions.slice(2)].map((events, column) => <div className={styles.exhibitionColumn} key={column}>
              {events.map((event, index) => <figure key={event.image}>
                <Photo src={"/images/home/editorial/" + event.image + ".webp"} alt={event.alt} className={styles.exhibitionPhoto} aspectRatio={event.aspectRatio} />
                <figcaption><div className={styles.exhibitionTitle}><span>{String(column * 2 + index + 1).padStart(2, "0")}</span><h3>{event.title}</h3></div><p>{event.description}</p></figcaption>
              </figure>)}
            </div>)}
          </div>
          <p className={styles.sourceNote}>AI-generated scenes with fictional people, illustrating exhibitions and business conversations.</p>
        </div>
      </section>

      <section id="sourcing-scenarios" aria-labelledby="stories-heading" className={styles.stories}>
        <div className={styles.container}>
          <p className={styles.kicker}>Buyer planning</p><h2 id="stories-heading" className={styles.heading}>Sourcing scenarios,<br />clearly framed.</h2>
          <p className={styles.storyIntro}>Practical starting points for building a focused glassware inquiry.</p>
          <div className={styles.storyGrid}>
            {homeBuyerScenarios.map((scenario) => <article className={styles.storyCard} key={scenario.title}>
              <Photo src={"/images/home/editorial/" + scenario.image + ".webp"} alt={scenario.alt} className={styles.storyPhoto} sizes="(min-width: 900px) 30vw, (min-width: 540px) 45vw, 100vw" />
              <div className={styles.storyCopy}><p className={styles.kicker}>{scenario.segment}</p><h3>{scenario.title}</h3><p className={styles.storySummary}>{scenario.summary}</p><p className={styles.storyByline}>{scenario.focus}</p></div>
            </article>)}
          </div>
          <p className={styles.sourceNote}>Illustrative planning scenarios, not customer testimonials.</p>
        </div>
      </section>

      {study && <section aria-labelledby="case-heading" className={styles.caseStudy + " " + styles.dark}>
        <div className={styles.container + " " + styles.caseGrid}>
          <figure><Photo src="/images/home/editorial/hotel-glassware-case.webp" alt="Editorial illustration of blue and amber glassware with unbranded gift packaging" className={styles.casePhoto} /><figcaption>Editorial illustration</figcaption></figure>
          <div className={styles.caseCopy}><p className={styles.kicker}>Glarivo design study</p><h2 id="case-heading" className={styles.heading}>Hotel glassware,<br />considered in detail.</h2><Rule />
            <p>Our coordinated glassware concept for hotel rooms and lounges, from the first brief to sample approval.</p><p className={styles.caseTopics}>Color · Identity · Packaging</p>
            <p className={styles.caseDisclosure}>Explore our approach to product selection,<br />brand details and packaging.</p>
            <Link href={"/case-studies/" + study.slug} className={styles.outlineButton}>Explore the case study<ArrowRight size={25} weight="light" aria-hidden="true" /></Link>
          </div>
        </div>
      </section>}

      <section className={styles.closing}>
        <div className={styles.container + " " + styles.closingInner}>
          <div><h2 className={styles.heading}>Build your next glassware shortlist.</h2><Rule /><p>Explore products and practical guides<br className={styles.desktopBreak} /> to prepare a clearer sourcing brief.</p></div>
          <div className={styles.actions}><Link href="/products" className={styles.button}>Explore products</Link><Link href="/blog" className={styles.textLink}>Read buying guides<ArrowRight size={25} weight="light" aria-hidden="true" /></Link></div>
        </div>
      </section>
    </div>
  );
}
