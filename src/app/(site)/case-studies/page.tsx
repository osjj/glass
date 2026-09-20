import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { CaseStudyArtwork } from "@/components/site/case-study-artwork";
import { getPublishedCaseStudies } from "@/lib/public-case-studies";
import { EditorialHero } from "@/components/site/editorial-hero";
import styles from "@/components/site/editorial-pages.module.css";
import { SITE_NAME } from "@/lib/site-identity";

export const metadata: Metadata = {
  title: "Glassware Case Studies",
  description: "Explore Glarivo customer projects and design studies, covering hotel glassware, sample approval, customization, packaging and delivery.",
  alternates: { canonical: "/case-studies" },
  openGraph: {
    title: `Glassware Case Studies | ${SITE_NAME}`,
    siteName: SITE_NAME,
    description: "Glarivo customer projects and design studies for hospitality glassware, customization and packaging.",
    url: "/case-studies",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function CaseStudiesPage() {
  const caseStudies = await getPublishedCaseStudies();
  return (
    <div className={styles.page}>
      <EditorialHero
        eyebrow="Case studies"
        title={<>Glarivo glassware,<br />from brief to delivery.</>}
        description="Explore customer projects and design studies covering product selection, sample revisions, brand details and delivery planning."
        image="/images/home/editorial/hotel-glassware-case.webp"
        imageAlt="Illustrative hospitality glassware setting for a design concept"
      />
      <section className={`${styles.container} ${styles.section}`} aria-label="Published case studies">
        {caseStudies.map((study) => (
          <article key={study.slug} className={styles.study}>
            {study.kind === "customer-project" ? study.coverImage ? <Image src={study.coverImage} alt={study.coverImageAlt ?? ""} width={1536} height={1024} sizes="(min-width: 900px) 50vw, 100vw" className="h-auto w-full" /> : <div className="grid min-h-64 place-items-center bg-[#eee8de] text-[var(--navy)]">Customer case study</div> : <CaseStudyArtwork />}
            <div className={styles.studyCopy}>
              <p className={styles.kicker}>{study.kind === "customer-project" ? "Customer case study" : "Glarivo design study"}</p>
              <h2><Link href={`/case-studies/${study.slug}`}>{study.title}</Link></h2>
              <p>{study.excerpt}</p>
              <p>{study.category}</p>
              <Link href={`/case-studies/${study.slug}`} className={styles.textLink}>Explore the case study<ArrowRight size={18} aria-hidden="true" /></Link>
            </div>
          </article>
        ))}
      </section>
      <section className={styles.cta}>
        <div className={styles.container}>
          <h2>Turn the reading into a product shortlist.</h2>
          <Link href="/blog" className={styles.textLink}>Explore buying guides<ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
      </section>
    </div>
  );
}
