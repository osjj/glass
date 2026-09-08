import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { CaseStudyArtwork } from "@/components/site/case-study-artwork";
import { InquiryButton } from "@/components/site/inquiry-contact";
import { getCaseStudy } from "@/data/case-studies";
import { getSiteUrl } from "@/lib/site-url";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const study = getCaseStudy((await params).slug);
  if (!study) return { title: "Case study not found", robots: { index: false } };
  return {
    title: study.title,
    description: study.excerpt,
    alternates: { canonical: `/case-studies/${study.slug}` },
    openGraph: { title: study.title, description: study.excerpt, type: "article", url: `/case-studies/${study.slug}`, modifiedTime: study.updatedAt },
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const study = getCaseStudy((await params).slug);
  if (!study) notFound();
  const baseUrl = getSiteUrl();
  const url = `${baseUrl}/case-studies/${study.slug}`;
  const reviewedLabel = new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(new Date(study.updatedAt));
  const schema = [
    {
      "@context": "https://schema.org", "@type": "Article",
      headline: study.title, description: study.excerpt, mainEntityOfPage: url,
      dateModified: study.updatedAt, articleSection: "Glarivo design study",
      author: { "@type": "Organization", name: "Glarivo", url: baseUrl },
      publisher: { "@type": "Organization", name: "Glarivo", url: baseUrl },
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
        { "@type": "ListItem", position: 2, name: "Case Studies", item: `${baseUrl}/case-studies` },
        { "@type": "ListItem", position: 3, name: study.title, item: url },
      ],
    },
  ];

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <header className="site-container py-10 sm:py-14">
        <Link href="/case-studies" className="flex w-fit items-center gap-2 text-sm font-bold text-[var(--blue)]"><ArrowLeft size={17} aria-hidden="true" />All case studies</Link>
        <p className="eyebrow mt-10">Glarivo design study</p>
        <h1 className="mt-5 max-w-5xl text-balance text-4xl font-bold leading-[1.08] tracking-[-0.045em] text-[var(--navy)] sm:text-6xl">{study.title}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--ink-muted)]">{study.excerpt}</p>
        <p className="mt-5 text-sm leading-6 text-[var(--ink-muted)]">By Glarivo · Updated <time dateTime={study.updatedAt}>{reviewedLabel}</time></p>
        <aside aria-label="Study introduction" className="mt-8 max-w-4xl rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 text-sm leading-7 text-[var(--ink-muted)]">
          {study.introduction}
        </aside>
      </header>

      <div className="site-container"><div className="max-w-4xl"><CaseStudyArtwork /></div></div>

      <div className="site-container grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16 sm:py-16">
        <div className="min-w-0 max-w-3xl">
          <section id="project-brief" className="scroll-mt-28">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--blue)]">The design brief</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--navy)]">A shared identity for rooms and lounges</h2>
            <p className="mt-5 text-base leading-8 text-[var(--ink-muted)]">{study.brief}</p>
            <p className="mt-4 text-base leading-8 text-[var(--ink-muted)]">{study.objective}</p>
          </section>

          <section id="our-approach" className="mt-12 scroll-mt-28 border-t border-[var(--line)] pt-10">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--blue)]">Our approach</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--navy)]">The glass, the brand and the pack</h2>
            <p className="mt-5 text-base leading-8 text-[var(--ink-muted)]">Our proposal connects three parts of the collection, with each choice developed around the intended service setting.</p>
            {study.decisions.map((decision, index) => (
              <div key={decision.title} className="mt-8">
                <h3 className="text-xl font-bold leading-7 text-[var(--navy)]"><span className="mr-3 text-[var(--blue)]">0{index + 1}</span>{decision.title}</h3>
                <p className="mt-3 text-base leading-8 text-[var(--ink-muted)]">{decision.text}</p>
              </div>
            ))}
          </section>

          <section id="approval-record" className="mt-12 scroll-mt-28 rounded-2xl bg-[var(--navy)] p-6 text-white sm:p-8">
            <h2 className="text-2xl font-bold">From proposal to an agreed specification</h2>
            <p className="mt-4 text-sm leading-7 text-white/80">For a project following this concept, we would use four review stages to keep product, artwork and packaging decisions connected.</p>
            <ol className="mt-7 grid gap-6 sm:grid-cols-2">
              {study.approvalSteps.map((step, index) => <li key={step.title}><h3 className="font-bold text-[var(--lime)]">0{index + 1} / {step.title}</h3><p className="mt-2 text-sm leading-7 text-white/85">{step.text}</p></li>)}
            </ol>
          </section>

          <section id="your-project" className="mt-12 scroll-mt-28">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--navy)]">Develop your hotel glassware brief with Glarivo</h2>
            <p className="mt-5 text-base leading-8 text-[var(--ink-muted)]">{study.conclusion}</p>
            <InquiryButton className="button-primary mt-7">Discuss your project<ArrowRight size={18} aria-hidden="true" /></InquiryButton>
          </section>
        </div>

        <aside className="self-start rounded-2xl border border-[var(--line)] p-6 lg:sticky lg:top-28">
          <nav aria-label="On this page"><h2 className="text-lg font-bold text-[var(--navy)]">In this study</h2><ul className="mt-4 space-y-3 text-sm font-semibold text-[var(--blue)]"><li><a href="#project-brief">The design brief</a></li><li><a href="#our-approach">Our approach</a></li><li><a href="#approval-record">Sample & approval</a></li><li><a href="#your-project">Your project</a></li></ul></nav>
          <div className="mt-7 border-t border-[var(--line)] pt-6"><h2 className="text-lg font-bold text-[var(--navy)]">Explore related collections</h2><p className="mt-3 text-xs leading-6 text-[var(--ink-muted)]">Start a shortlist for your hotel glassware brief.</p><ul className="mt-4 space-y-4">{study.relatedLinks.map((link) => <li key={link.href}><Link href={link.href} className="flex items-center justify-between gap-3 text-sm font-semibold leading-6 text-[var(--blue)]">{link.label}<ArrowRight size={17} className="shrink-0" aria-hidden="true" /></Link></li>)}</ul></div>
        </aside>
      </div>
    </article>
  );
}
