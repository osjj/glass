import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import type { PublicProduct } from "@/lib/public-products";

export function ProductCard({ product }: { product: PublicProduct; index?: number }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,42,89,0.12)]">
      <Link href={`/products/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-[var(--navy)]" aria-label={`View ${product.name}`}>
        <Image src={product.primaryImage} alt={product.primaryImageAlt} fill unoptimized sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.15em] text-[var(--blue)]">{product.categoryLabel}</p>
        <h3 className="mt-3 text-2xl font-bold leading-tight tracking-[-0.04em] text-[var(--navy)]">
          <Link href={`/products/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">{product.summary}</p>
        <div className="mt-5 flex items-end justify-between gap-4 text-sm">
          <div>
            <span className="block text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--ink-muted)]">Price</span>
            <strong className="mt-1 block text-lg text-[var(--navy)]">{product.price > 0 ? `${product.currency} ${product.price.toFixed(2)}` : "Request pricing"}</strong>
          </div>
          <span className="text-right text-xs font-semibold text-[var(--ink-muted)]">MOQ {product.moq} {product.unit}</span>
        </div>
        <Link href={`/products/${product.slug}`} className="mt-6 inline-flex items-center justify-between border-t border-[var(--line)] pt-5 text-sm font-bold text-[var(--navy)]">
          View product
          <span className="grid size-9 place-items-center rounded-full bg-[var(--surface-blue)] transition group-hover:bg-[var(--lime)]">
            <ArrowUpRight size={17} weight="bold" aria-hidden="true" />
          </span>
        </Link>
      </div>
    </article>
  );
}
