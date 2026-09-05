import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "./logo";

const links = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-[var(--navy)] text-white">
      <div className="site-container py-14 sm:py-20">
        <div className="grid gap-12 border-b border-white/15 pb-12 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <Logo variant="white" />
            <p className="mt-6 max-w-xl text-balance text-2xl font-semibold leading-snug text-white/90 sm:text-3xl">
              Clear glassware collections and practical product information for confident sourcing.
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-3 self-end" aria-label="Footer navigation">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-lg border border-white/15 px-4 py-3 text-sm font-bold text-white/80 transition hover:border-[var(--lime)] hover:text-[var(--lime)]"
              >
                {link.label}
                <ArrowUpRight size={17} weight="bold" aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-3 pt-7 text-xs font-medium uppercase tracking-[0.14em] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Glarivo Glassware</span>
          <span>Focused catalog · Initial release</span>
        </div>
      </div>
    </footer>
  );
}
