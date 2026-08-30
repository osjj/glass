"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, List, X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Logo } from "./logo";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const overlay = pathname === "/" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition duration-300 ${
        overlay
          ? "border-white/10 bg-transparent text-white"
          : "border-[var(--line)] bg-white/95 text-[var(--navy)] shadow-[0_8px_30px_rgba(10,30,70,0.06)] backdrop-blur-xl"
      }`}
    >
      <div className="site-container flex h-[88px] items-center justify-between gap-6">
        <Logo variant={overlay ? "white" : "blue"} compact />

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
          {navigation.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
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

        <Link
          href="/products"
          className={`hidden min-h-11 items-center gap-2 rounded-lg px-5 text-sm font-bold transition hover:-translate-y-0.5 md:inline-flex ${
            overlay
              ? "border border-white/40 text-white hover:bg-white/10"
              : "bg-[var(--navy)] text-white hover:bg-[var(--navy-soft)]"
          }`}
        >
          View catalog
          <ArrowUpRight size={17} weight="bold" aria-hidden="true" />
        </Link>

        <button
          type="button"
          className={`grid size-11 place-items-center rounded-lg border md:hidden ${
            overlay ? "border-white/35 text-white" : "border-[var(--line)] text-[var(--navy)]"
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
          className="border-t border-[var(--line)] bg-white p-4 text-[var(--navy)] shadow-2xl md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="site-container grid gap-1">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-base font-bold hover:bg-[var(--surface)]">
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
