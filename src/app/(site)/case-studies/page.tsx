import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { CaseStudyArtwork } from "@/components/site/case-study-artwork";
import { caseStudies } from "@/data/case-studies";

export const metadata: Metadata = {
  title: "Glassware Case Studies",
  description: "Explore Glarivo glassware design studies, from hospitality concepts to product selection, brand details and packaging plans.",
  alternates: { canonical: "/case-studies" },
  openGraph: {
    title: "Glassware Case Studies | Glarivo",
    description: "Glarivo glassware concepts for hospitality, customization and packaging.",
    url: "/case-studies",
    type: "website",
  },
};

export default function CaseStudiesPage() {
  return (
    <>
      <section className="border-b border-[var(--line)] bg-[var(--surface)] py-14 sm:py-20">
        <div className="site-container">
          <p className="eyebrow">Case studies</p>
          <h1 className="mt-5 max-w-4xl text-balance text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-[var(--navy)] sm:text-6xl">Glarivo glassware,<br />from brief to concept.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--ink-muted)]">Explore our approach to glassware through design studies that bring product selection, brand details and packaging into one considered proposal.</p>
        </div>
      </section>
      <section className="site-container py-12 sm:py-20" aria-label="Published case studies">
        {caseStudies.map((study) => (
          <article key={study.slug} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <CaseStudyArtwork />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.13em] text-[var(--blue)]">Glarivo design study</p>
              <h2 className="mt-5 text-3xl font-bold leading-tight tracking-[-0.035em] text-[var(--navy)] sm:text-4xl"><Link href={`/case-studies/${study.slug}`} className="hover:text-[var(--blue)]">{study.title}</Link></h2>
              <p className="mt-5 text-base leading-8 text-[var(--ink-muted)]">{study.excerpt}</p>
              <p className="mt-5 text-sm font-semibold text-[var(--ink-muted)]">{study.category}</p>
              <Link href={`/case-studies/${study.slug}`} className="button-primary mt-8">Explore the case study<ArrowRight size={18} weight="bold" aria-hidden="true" /></Link>
            </div>
          </article>
        ))}
      </section>
      <section className="border-t border-[var(--line)] py-10">
        <div className="site-container flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-lg font-semibold text-[var(--navy)]">Turn the reading into a product shortlist.</p>
          <Link href="/blog" className="button-secondary self-start">Explore buying guides<ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
      </section>
    </>
  );
}
