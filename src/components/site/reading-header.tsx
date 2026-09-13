import Image from "next/image";
import type { ReactNode } from "react";
import theme from "./editorial-pages.module.css";
import styles from "./reading-pages.module.css";

export function ReadingHeader({ title, eyebrow, description, image, imageAlt = "", navigation, children }: {
  title: string;
  eyebrow: string;
  description: string;
  image?: string;
  imageAlt?: string;
  navigation: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header data-editorial-hero className={styles.hero}>
      {image ? <><Image src={image} alt={imageAlt} fill preload sizes="100vw" className={theme.heroImage} /><div className={theme.heroShade} /></> : null}
      <div className={`${theme.container} ${styles.heroContent}`}>
        <div className={styles.breadcrumb}>{navigation}</div>
        <p className={styles.kicker}>{eyebrow}</p>
        <h1>{title}</h1>
        <span className={theme.rule} aria-hidden="true" />
        <p className={styles.description}>{description}</p>
        {children}
      </div>
    </header>
  );
}
