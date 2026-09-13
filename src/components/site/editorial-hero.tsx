import Image from "next/image";
import type { ReactNode } from "react";
import styles from "./editorial-pages.module.css";

export function EditorialHero({ eyebrow, title, description, image, imageAlt }: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  image: string;
  imageAlt: string;
}) {
  return (
    <section data-editorial-hero className={styles.hero}>
      <Image src={image} alt={imageAlt} fill preload sizes="100vw" className={styles.heroImage} />
      <div className={styles.heroShade} />
      <div className={`${styles.container} ${styles.heroContent}`}>
        <p className={styles.kicker}>{eyebrow}</p>
        <h1>{title}</h1>
        <span className={styles.rule} aria-hidden="true" />
        <p className={styles.heroDescription}>{description}</p>
      </div>
    </section>
  );
}
