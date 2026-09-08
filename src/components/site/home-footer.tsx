import Image from "next/image";
import Link from "next/link";
import { EnvelopeSimple, Globe, MapPin, Phone } from "@phosphor-icons/react/dist/ssr";
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
        <section className={styles.contactColumn} aria-labelledby="footer-contact-heading">
          <h2 id="footer-contact-heading">Contact Us</h2>
          <address className={styles.contactList}>
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}><Phone size={19} aria-hidden="true" /></span>
              <span className={styles.contactPhoneList}>
                <a href="tel:+8618688757773">+86 186 8875 7773</a>
                <a href="tel:+8618825913441">+86 188 2591 3441</a>
              </span>
            </div>
            <a href="mailto:sales@glarivoglass.com" className={styles.contactItem}>
              <span className={styles.contactIcon}><EnvelopeSimple size={19} aria-hidden="true" /></span>
              <span>sales@glarivoglass.com</span>
            </a>
            <a href="https://www.glarivoglass.com" className={styles.contactItem}>
              <span className={styles.contactIcon}><Globe size={19} aria-hidden="true" /></span>
              <span>www.glarivoglass.com</span>
            </a>
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}><MapPin size={19} aria-hidden="true" /></span>
              <span>GuangDong, China</span>
            </div>
          </address>
        </section>
      </div>
      <div className={styles.footerBottom}><span>© {new Date().getFullYear()} Glarivo Glassware</span><span>www.glarivoglass.com</span></div>
    </div>
  </footer>;
}
