import Image from "next/image";
import Link from "next/link";
import styles from "./home-shell.module.css";

const columns = [
  { title: "Explore", links: [{ href: "/", label: "Home" }, { href: "/products", label: "Products" }, { href: "/case-studies", label: "Case Studies" }] },
  { title: "Resources", links: [{ href: "/blog", label: "Blog" }, { href: "/about", label: "About" }] },
  { title: "Collections", links: [
    { href: "/products?q=glass+cup", label: "Glass Cups" }, { href: "/products?q=shot+glass", label: "Shot Glass" },
    { href: "/products?q=glass+mug", label: "Glass Mugs" }, { href: "/products?q=glass+pitcher", label: "Glass Pitchers & Teapots" },
  ] },
];

export function HomeFooter() {
  return <footer className={styles.footer}>
    <div className={styles.footerContainer}>
      <div className={styles.footerGrid}>
        <div className={styles.brand}>
          <Link href="/" aria-label="Glarivo Glassware home"><Image src="/brand/glarivo-logo-white.png" width={1378} height={748} alt="Glarivo Glassware" className={styles.footerLogo} /></Link>
          <p>Clear glassware collections and practical information for confident sourcing.</p>
        </div>
        {columns.map((column) => <nav key={column.title} aria-label={column.title + " footer links"}>
          <h2>{column.title}</h2>
          {column.links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </nav>)}
      </div>
      <div className={styles.footerBottom}><span>© {new Date().getFullYear()} Glarivo Glassware</span><span>www.glarivoglass.com</span></div>
    </div>
  </footer>;
}
