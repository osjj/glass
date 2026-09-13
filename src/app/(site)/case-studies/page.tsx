import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { CaseStudyArtwork } from "@/components/site/case-study-artwork";
import { caseStudies } from "@/data/case-studies";
import { EditorialHero } from "@/components/site/editorial-hero";
import styles from "@/components/site/editorial-pages.module.css";

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
    <div className={styles.page}>
      <EditorialHero
        eyebrow="Case studies"
        title={<>Glarivo glassware,<br />from brief to concept.</>}
        description="Explore our approach to glassware through design studies that bring product selection, brand details and packaging into one considered proposal."
        image="/images/home/editorial/hotel-glassware-case.webp"
        imageAlt="Illustrative hospitality glassware setting for a design concept"
      />
      <section className={`${styles.container} ${styles.section}`} aria-label="Published case studies">
        {caseStudies.map((study) => (
          <article key={study.slug} className={styles.study}>
            <CaseStudyArtwork />
            <div className={styles.studyCopy}>
              <p className={styles.kicker}>Glarivo design study</p>
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
