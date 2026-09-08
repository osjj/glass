import type { Metadata } from "next";
import Image from "next/image";
import { InquiryButton } from "@/components/site/inquiry-contact";
import { ExhibitionCarousel } from "@/components/site/exhibition-carousel";
import { glarivoCompanyProfile } from "@/data/about-company-profile";
import { factoryPhotos } from "@/data/factory-gallery";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About",
  description: "Meet Glarivo, a sales partner of Sihui Jingbao Glass Co., Ltd. Explore our glassware sourcing approach and manufacturing partner in Guangdong, China.",
  alternates: { canonical: "/about" },
};
const conversations = [
  { title: "Collection discussions", text: "Align glass shapes and product ranges with your target market and intended use." },
  { title: "Customization reviews", text: "Discuss decoration, sample details, and packaging options before confirming the next steps." },
  { title: "Factory visits", text: "Plan an on-site exchange around product and process questions." },
];

const compactFactoryPhotoTitles = [
  "Glass batch materials",
  "Decorative components",
  "Glassware molds",
  "Inspection and packing area",
] as const;
const compactFactoryPhotoTitleSet = new Set<string>(compactFactoryPhotoTitles);
const compactFactoryPhotos = compactFactoryPhotoTitles.flatMap((title) => factoryPhotos.filter((photo) => photo.title === title));
const finishedGoodsPhoto = factoryPhotos.find((photo) => photo.title === "Finished goods warehouse");
const primaryFactoryPhotos = factoryPhotos.filter((photo) => (
  !compactFactoryPhotoTitleSet.has(photo.title) && photo.title !== "Finished goods warehouse"
));

type FactoryPhoto = (typeof factoryPhotos)[number];

function FactoryPhotoCard({ photo, sizes, className }: { photo: FactoryPhoto; sizes: string; className?: string }) {
  return <figure data-factory-title={photo.title} className={className ? `${styles.factoryCard} ${className}` : styles.factoryCard}>
    <a href={photo.src} target="_blank" rel="noopener noreferrer" aria-label={`Enlarge: ${photo.title} (opens in a new tab)`}>
      <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes={sizes} className={styles.factoryImage} />
    </a>
    <figcaption><h3>{photo.title}</h3><p>{photo.caption}</p></figcaption>
  </figure>;
}

export default function AboutPage() {
  return <div className={styles.about}>
    <section data-about-hero className={styles.hero} aria-labelledby="about-heading">
      <Image src="/images/about/glassware-hero.webp" alt="Illustrative clear glassware collection under warm showroom lighting" fill preload sizes="100vw" className={styles.heroImage} />
      <div className={styles.heroShade} />
      <div className={`${styles.container} ${styles.heroContent}`}>
        <p className={styles.kicker}>About Glarivo</p>
        <h1 id="about-heading">Connecting<br />glassware expertise<br />with your market.</h1>
        <span className={styles.rule} aria-hidden="true" />
        <p className={styles.heroDescription}>Glassware sourcing, supported by a manufacturing partner in Guangdong, China.</p>
      </div>
    </section>
    <section id="company-profile" className={`${styles.container} ${styles.profile}`} aria-labelledby="profile-heading">
      <div className={styles.profileCopy}>
        <p className={styles.kicker}>01 Company profile</p>
        <h2 id="profile-heading">About Glarivo Glass</h2>
        {glarivoCompanyProfile.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>
          {paragraph.map((segment, segmentIndex) => segment.highlight
            ? <strong key={segmentIndex} className={styles.profileHighlight}>{segment.text}</strong>
            : segment.text)}
        </p>)}
      </div>
      <div className={styles.profilePhoto}><Image src="/images/about/glarivo-showroom-profile-user-20260908.webp" alt="Glarivo glassware showroom reception with illuminated displays and a logo wall" width={1672} height={941} sizes="(min-width: 900px) 46vw, 90vw" /></div>
    </section>
    <section id="exhibition-gallery" className={`${styles.container} ${styles.gallery}`} aria-labelledby="exhibition-heading">
      <p className={styles.kicker}>02 Exhibition gallery</p><h2 id="exhibition-heading">Glassware, in conversation.</h2>
      <p className={styles.galleryIntro}>Across multiple editions of the Canton Fair, our team has welcomed buyers from different markets to explore our glassware collections in person. These conversations bring product selection, decoration, and packaging requirements into focus, helping us understand each customer&apos;s needs and turn initial ideas into practical sourcing plans.</p>
      <ExhibitionCarousel />
    </section>
    <section id="factory-gallery" className={`${styles.container} ${styles.gallery}`} aria-labelledby="factory-heading">
      <p className={styles.kicker}>03 Factory gallery</p><h2 id="factory-heading">A closer look at the production setting.</h2>
      <p className={styles.galleryIntro}>Glassware production moves from raw material preparation and melting to mold forming, controlled cooling, finishing, inspection, and protective packing. Our manufacturing partner brings together production equipment, a broad range of molds, hands-on packing teams, and warehouse space to support batch manufacturing and repeat orders. The photographs below offer a closer look at the materials, workshop activity, and storage behind this manufacturing capability.</p>
      <div className={styles.factoryGrid}>
        {primaryFactoryPhotos.map((photo) => <FactoryPhotoCard key={photo.src} photo={photo} sizes="(max-width: 539px) calc(100vw - 40px), (max-width: 899px) 44vw, (max-width: 1466px) 29vw, 424px" />)}
      </div>
      <div className={styles.factoryFeatureRow}>
        <div className={styles.factoryCompactGrid}>
          {compactFactoryPhotos.map((photo) => <FactoryPhotoCard key={photo.src} photo={photo} sizes="(max-width: 539px) calc(100vw - 40px), (max-width: 899px) 21vw, (max-width: 1466px) 29vw, 424px" className={`${styles.factoryFeatureCard} ${styles.factoryCompactCard}`} />)}
        </div>
        {finishedGoodsPhoto ? <FactoryPhotoCard photo={finishedGoodsPhoto} sizes="(max-width: 539px) calc(100vw - 40px), (max-width: 899px) 44vw, (max-width: 1466px) 29vw, 424px" className={`${styles.factoryFeatureCard} ${styles.factoryTallCard}`} /> : null}
      </div>
    </section>
    <section id="quality-documentation" className={styles.quality} aria-labelledby="quality-heading"><div className={`${styles.container} ${styles.qualityGrid}`}>
      <div><p className={styles.kicker}>04 Quality documentation</p><h2 id="quality-heading">Quality, supported<br />by documentation.</h2><p className={styles.qualityCopy}>Supplier-reported milestone: Jingbao obtained ISO 9001:2008 quality management system certification in 2016. The certificate holder, scope, and current status require verification against formal documentation.</p></div>
      <figure><Image src="/images/about/certificate-display-user-20260908.webp" alt="Six framed patent, inspection, and trademark documents displayed under warm lights" width={1778} height={885} sizes="(min-width: 900px) 52vw, 90vw" className={styles.galleryImage} /><figcaption>Patent, inspection, and trademark documentation display.</figcaption></figure>
    </div></section>
    <section id="partner-conversations" className={`${styles.container} ${styles.partners}`} aria-labelledby="partners-heading">
      <p className={styles.kicker}>05 Partner conversations</p><h2 id="partners-heading">From first conversation to shared understanding.</h2>
      <figure>
        <a href="/images/about/partner-conversations-user-20260908.png" aria-label="Enlarge the illustrative partner conversation gallery"><Image src="/images/about/partner-conversations-user-20260908.png" alt="Glassware collection discussions in a sample room, a sample and packaging review in the workshop, and a group factory visit" width={2172} height={724} sizes="90vw" className={styles.galleryImage} /></a>
        <div className={styles.conversationGrid}>{conversations.map((item) => <div key={item.title}><h3>{item.title}</h3><p>{item.text}</p></div>)}</div>
        <figcaption>Illustrative scenarios — not documented client cases. <span className={styles.enlargeHint}>Select the image to enlarge.</span></figcaption>
      </figure>
    </section>
    <section className={styles.cta} aria-labelledby="contact-heading"><div className={styles.container}><h2 id="contact-heading">Tell us about your next collection.</h2><InquiryButton className={styles.button}>Request a quote</InquiryButton></div></section>
  </div>;
}
