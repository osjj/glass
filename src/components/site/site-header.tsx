"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, BookOpen, List, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./logo";
import { InquiryButton } from "./inquiry-contact";
import styles from "./home-shell.module.css";
import { DirectoryContent, ProductDirectory, type HeaderCategory } from "./product-directory";
import { GLARIVO_CATALOG_URL } from "@/lib/catalog-download";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
] as const;

export function SiteHeader({ categories }: { categories: HeaderCategory[] }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigationRef = useRef<HTMLDivElement>(null);
  const editorial = ["/", "/about", "/products", "/case-studies", "/blog"].includes(pathname)
    || ["/products/", "/case-studies/", "/guides/", "/blog/"].some((prefix) => pathname.startsWith(prefix));
  const overlay = editorial && !scrolled;

  useEffect(() => {
    const onScroll = () => {
      const homeHero = document.querySelector<HTMLElement>("[data-home-hero], [data-about-hero], [data-editorial-hero]");
      const threshold = homeHero ? homeHero.offsetHeight - (navigationRef.current?.offsetHeight ?? 88) : 48;
      setScrolled(window.scrollY >= threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return (
    <header
      className={`${editorial ? styles.header : ""} fixed inset-x-0 top-0 z-50 flex max-h-dvh flex-col border-b transition duration-300 ${
        overlay
          ? "border-transparent bg-transparent text-white shadow-none"
          : editorial
            ? "border-white/30 bg-white/45 text-[var(--navy)] shadow-[0_8px_30px_rgba(10,30,70,0.08)] backdrop-blur-2xl backdrop-saturate-150"
            : "border-[var(--line)] bg-white/95 text-[var(--navy)] shadow-[0_8px_30px_rgba(10,30,70,0.06)] backdrop-blur-xl"
      }`}
    >
      {pathname === "/" && !scrolled ? (
        <div className={`${styles.topContactBar} shrink-0`} aria-label="Homepage contact details">
          <div className={styles.topContactInner}>
            <a href="mailto:sales@glarivoglass.com">sales@glarivoglass.com</a>
            <span className={styles.topContactPhones}>
              <a href="tel:+8618688757773">+86 186 8875 7773</a>
              <a href="tel:+8618825913441">+86 188 2591 3441</a>
            </span>
          </div>
        </div>
      ) : null}
      <div ref={navigationRef} className={`site-container flex h-[88px] shrink-0 items-center justify-between gap-6 ${styles.headerNav}`}>
        <Logo variant="blue" compact />

        <nav className="hidden items-center gap-7 xl:flex" aria-label="Primary navigation">
          <Link
            href="/"
            className={`relative py-3 text-sm font-semibold transition after:absolute after:inset-x-0 after:bottom-1 after:h-0.5 after:origin-left after:transition ${
              pathname === "/"
                ? "after:scale-x-100 after:bg-[var(--lime)]"
                : "after:scale-x-0 hover:after:scale-x-100 hover:after:bg-[var(--lime)]"
            } ${overlay ? "text-white/90 hover:text-white" : "text-[var(--navy)]"}`}
          >
            Home
          </Link>
          <ProductDirectory key={pathname} categories={categories} active={pathname.startsWith("/products")} overlay={overlay} />
          {navigation.slice(1).map((item) => {
            const routeHref = item.href.split("#")[0];
            const active = routeHref !== "/" && (pathname === routeHref || pathname.startsWith(`${routeHref}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative py-3 text-sm font-semibold transition after:absolute after:inset-x-0 after:bottom-1 after:h-0.5 after:origin-left after:transition ${
                  active
                    ? "after:scale-x-100 after:bg-[var(--lime)]"
                    : "after:scale-x-0 hover:after:scale-x-100 hover:after:bg-[var(--lime)]"
                } ${overlay ? "text-white/90 hover:text-white" : "text-[var(--navy)]"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 xl:flex">
          <a
            href={GLARIVO_CATALOG_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Glarivo catalog PDF in a new tab"
            className={`group inline-flex min-h-11 items-center gap-2 whitespace-nowrap px-1 py-3 text-sm font-medium outline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-current ${overlay ? "text-white/90 hover:text-white" : "text-[var(--navy)]/80 hover:text-[var(--navy)]"}`}
          >
            <BookOpen size={18} aria-hidden="true" />
            <span className="underline-offset-4 group-hover:underline">View Catalog</span>
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
          <InquiryButton
            className={`${styles.quoteButton} inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-bold transition hover:-translate-y-0.5 ${
              overlay
                ? "bg-[var(--navy)] text-white shadow-[0_10px_28px_rgba(4,14,32,0.22)] hover:bg-[var(--navy-soft)]"
                : "bg-[var(--navy)] text-white hover:bg-[var(--navy-soft)]"
            }`}
          >
            Request a quote
            <ArrowUpRight size={17} weight="bold" aria-hidden="true" />
          </InquiryButton>
        </div>

        <button
          type="button"
          className={`grid size-11 place-items-center rounded-lg border xl:hidden ${
            overlay ? "border-white/35 bg-transparent text-white" : "border-[var(--line)] text-[var(--navy)]"
          }`}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X size={23} /> : <List size={23} />}
          <span className="sr-only">Toggle navigation</span>
        </button>
      </div>

      {open ? (
        <nav
          id="mobile-navigation"
          className="min-h-0 max-h-[calc(100dvh-88px)] overflow-y-auto border-t border-[var(--line)] bg-white p-4 text-[var(--navy)] shadow-2xl xl:hidden"
          aria-label="Mobile navigation"
        >
          <div className="site-container grid gap-1">
            <Link href="/" onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-base font-bold hover:bg-[var(--surface)]">Home</Link>
            <Link href="/products" onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-base font-bold hover:bg-[var(--surface)]">Products</Link>
            {categories.length ? <DirectoryContent categories={categories} mobile onNavigate={() => setOpen(false)} /> : null}
            {navigation.slice(1).map((item) => (
              <Link key={item.href} href={item.href} aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined} onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-base font-bold hover:bg-[var(--surface)]">
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-4">
              <a href={GLARIVO_CATALOG_URL} target="_blank" rel="noopener noreferrer" aria-label="Open Glarivo catalog PDF in a new tab" onClick={() => setOpen(false)} className="group inline-flex min-h-11 items-center gap-2 px-1 py-3 text-sm font-medium text-[var(--navy)] outline-offset-4 focus-visible:outline-2 focus-visible:outline-current">
                <BookOpen size={18} aria-hidden="true" />
                <span className="underline-offset-4 group-hover:underline">View Catalog</span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
              <InquiryButton className="inline-flex min-h-11 items-center gap-2 bg-[var(--navy)] px-3 text-sm font-semibold text-white">
                Request a quote
                <ArrowUpRight size={17} aria-hidden="true" />
              </InquiryButton>
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
