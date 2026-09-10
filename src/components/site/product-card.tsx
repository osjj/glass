import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import type { PublicProduct } from "@/lib/public-products";

export function ProductCard({ product, index }: { product: PublicProduct; index?: number }) {
  const fields = [...product.overviewFields, ...product.attributes, ...product.specifications];
  const fieldValue = (labels: string[]) => fields.find((field) =>
    labels.includes(field.label.trim().toLowerCase().replace(/:$/, "")) && field.value.trim(),
  )?.value.trim();
  const capacity = fieldValue(["capacity", "volume"]);
  const material = fieldValue(["material"]);
  const packing = fieldValue(["package", "packaging", "packing"]);
  const specifications = [capacity ? `Capacity: ${capacity}` : null, material].filter(Boolean).join(" · ");

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,42,89,0.1)]">
      <Link href={`/products/${product.slug}`} className="relative block aspect-[4/3] max-h-60 w-full shrink-0 overflow-hidden bg-white" aria-label={`View ${product.name}`}>
        <Image src={product.primaryImage} alt={product.primaryImageAlt} fill unoptimized loading={index === 0 ? "eager" : "lazy"} sizes="(min-width: 1280px) 330px, (min-width: 1024px) 35vw, (min-width: 640px) 50vw, 100vw" className="object-contain p-3 transition duration-500 group-hover:scale-[1.03]" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <p className="truncate text-[0.625rem] font-bold uppercase tracking-[0.12em] text-[var(--blue)]">{product.categoryLabel}</p>
        <h3 className="mt-2 h-12 text-lg font-bold leading-6 tracking-[-0.025em] text-[var(--navy)]">
          <Link href={`/products/${product.slug}`} className="line-clamp-2 break-words" title={product.name}>{product.name}</Link>
        </h3>
        <div className="mt-2 h-10 text-[0.8125rem] leading-5 text-[var(--ink-muted)]">
          {specifications ? <p className="truncate" title={specifications}>{specifications}</p> : null}
          {packing ? <p className="truncate" title={`Packing: ${packing}`}>Packing: {packing}</p> : null}
        </div>
        <Link href={`/products/${product.slug}`} className="mt-3 inline-flex min-h-11 items-center justify-between border-t border-[var(--line)] pt-2 text-xs font-bold text-[var(--navy)]">
          View product
          <span className="grid size-7 place-items-center rounded-full bg-[var(--surface-blue)] transition group-hover:bg-[var(--lime)]">
            <ArrowUpRight size={15} weight="bold" aria-hidden="true" />
          </span>
        </Link>
      </div>
    </article>
  );
}
