import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { PublicCategory } from "@/lib/public-products";

export function CategoryDirectory({ categories }: { categories: PublicCategory[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {categories.map((category, index) => (
        <article key={category.id} className="group overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_12px_35px_rgba(15,42,89,0.06)]">
          <Link href={`/products/category/${category.slug}`} className="relative block h-36 overflow-hidden bg-[var(--navy)]">
            <Image src={category.image} alt="" fill unoptimized loading={index < 3 ? "eager" : "lazy"} sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover opacity-75 transition duration-500 group-hover:scale-[1.04]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,22,52,0.9),rgba(5,22,52,0.18))]" />
            <div className="absolute inset-0 flex items-end justify-between gap-4 p-5 text-white">
              <div>
                <h2 className="text-2xl font-bold tracking-[-0.04em]">{category.label}</h2>
                <p className="mt-1 text-xs font-semibold text-white/70">{category.productCount} published {category.productCount === 1 ? "product" : "products"}</p>
              </div>
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-white/35 bg-white/10 transition group-hover:border-[var(--lime)] group-hover:bg-[var(--lime)] group-hover:text-[var(--navy)]">
                <ArrowRight size={17} weight="bold" aria-hidden="true" />
              </span>
            </div>
          </Link>
          <div className="p-5">
            {category.children.length ? (
              <div className="flex flex-wrap gap-2">
                {category.children.map((child) => (
                  <Link key={child.id} href={`/products/category/${child.slug}`} className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-bold text-[var(--navy)] transition hover:border-[var(--blue)] hover:text-[var(--blue)]">
                    {child.label} <span className="text-[var(--ink-muted)]">{child.productCount}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <Link href={`/products/category/${category.slug}`} className="inline-flex items-center gap-2 text-sm font-bold text-[var(--navy)]">
                View collection <ArrowRight size={15} weight="bold" />
              </Link>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
