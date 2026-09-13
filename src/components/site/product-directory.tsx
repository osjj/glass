"use client";

import Link from "next/link";
import { ArrowUpRight, CaretDown, MagnifyingGlass, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import styles from "./product-directory.module.css";

export type HeaderCategory = {
  slug: string;
  label: string;
  productCount: number;
  children: Array<{ slug: string; label: string; productCount: number }>;
};

export function DirectoryContent({ categories, onNavigate, mobile = false }: {
  categories: HeaderCategory[];
  onNavigate: () => void;
  mobile?: boolean;
}) {
  const [query, setQuery] = useState("");
  const search = query.trim().toLocaleLowerCase();
  const filtered = categories.flatMap((category) => {
    if (!search || category.label.toLocaleLowerCase().includes(search)) return [category];
    const children = category.children.filter((child) => child.label.toLocaleLowerCase().includes(search));
    return children.length ? [{ ...category, children }] : [];
  });
  const categoryCount = new Set(categories.flatMap((category) => [category.slug, ...category.children.map((child) => child.slug)])).size;

  return (
    <div className={`${styles.content} ${mobile ? styles.mobileContent : ""}`}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>Product directory</p>
        <p className={styles.title}>Glassware,<br />by collection.</p>
        <p className={styles.description}>Explore glassware for the table, the bar and beyond.</p>
        <Link href="/products" onClick={onNavigate} className={styles.allProducts}>
          View all products <ArrowUpRight size={19} aria-hidden="true" />
        </Link>
        <p className={styles.total}>{categoryCount} categories to explore</p>
      </div>
      <div className={styles.catalog}>
        <div className={styles.toolbar}>
          <p>Browse collections <span>Product counts shown</span></p>
          <div className={styles.search}>
            <MagnifyingGlass size={18} aria-hidden="true" />
            <input type="search" aria-label="Find a product category" placeholder="Find a category" value={query} onChange={(event) => setQuery(event.target.value)} />
            {query ? <button type="button" aria-label="Clear category search" onClick={() => setQuery("")}><X size={16} aria-hidden="true" /></button> : null}
          </div>
        </div>
        <div className={styles.scrollArea}>
          <p className="sr-only" role="status">{search ? `${filtered.length} matching collections` : `${categoryCount} categories`}</p>
          {filtered.length ? (
            <ul className={styles.collections}>
              {filtered.map((category) => (
                <li key={category.slug} className={styles.collection}>
                  <Link href={`/products/category/${category.slug}`} onClick={onNavigate} className={styles.parentLink}>
                    <span>{category.label}</span><span className={styles.count}>{category.productCount}</span>
                  </Link>
                  {category.children.length ? (
                    <ul className={styles.children}>
                      {category.children.map((child) => (
                        <li key={child.slug}>
                          <Link href={`/products/category/${child.slug}`} onClick={onNavigate}>
                            <span>{child.label}</span><span className={styles.count}>{child.productCount}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.empty}>
              <p>No matching categories</p>
              <span>Try another glass type or browse the full directory.</span>
              <button type="button" onClick={() => setQuery("")}>Show all categories <ArrowUpRight size={17} aria-hidden="true" /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductDirectory({ categories, active, overlay }: {
  categories: HeaderCategory[];
  active: boolean;
  overlay: boolean;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 1280px)");
    const resize = () => { if (!desktop.matches) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    desktop.addEventListener("change", resize);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      desktop.removeEventListener("change", resize);
    };
  }, [open]);

  return (
    <div ref={container} className={styles.triggerGroup}
      onMouseLeave={() => { if (!container.current?.contains(document.activeElement)) setOpen(false); }}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <Link href="/products" onClick={() => setOpen(false)} onMouseEnter={() => setOpen(true)}
        aria-current={active ? "page" : undefined}
        className={`relative py-3 text-sm font-semibold transition after:absolute after:inset-x-0 after:bottom-1 after:h-0.5 after:origin-left after:transition ${active ? "after:scale-x-100 after:bg-[var(--lime)]" : "after:scale-x-0 hover:after:scale-x-100 hover:after:bg-[var(--lime)]"} ${overlay ? "text-white/90 hover:text-white" : "text-[var(--navy)]"}`}>
        Products
      </Link>
      {categories.length ? <>
        <button ref={toggle} type="button" className={styles.toggle} aria-label="Toggle product directory" aria-expanded={open} aria-controls="product-directory" onClick={() => setOpen((current) => !current)}>
          <CaretDown size={13} aria-hidden="true" />
        </button>
        {open ? <div id="product-directory" className={styles.panel} role="region" aria-label="Product directory">
          <DirectoryContent categories={categories} onNavigate={() => setOpen(false)} />
        </div> : null}
      </> : null}
    </div>
  );
}
