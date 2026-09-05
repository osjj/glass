import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { guideClusters } from "@/data/guide-clusters";

export function GuideClusterCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {guideClusters.map((cluster, index) => (
        <Link key={cluster.slug} href={`/guides/${cluster.slug}`} className="group flex h-full flex-col rounded-2xl border border-[var(--line)] bg-white p-6 transition hover:border-[var(--blue)] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--blue)]">
          <div className="flex items-start justify-between gap-4"><span className="text-xs font-bold uppercase tracking-wider text-[var(--blue)]">{cluster.eyebrow}</span><span className="text-sm font-semibold text-[var(--ink-muted)]">0{index + 1}</span></div>
          <h3 className="mt-5 text-2xl font-bold tracking-tight text-[var(--navy)]">{cluster.title}</h3>
          <p className="mt-3 flex-1 text-sm leading-7 text-[var(--ink-muted)]">{cluster.description}</p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--blue)]">Explore the guide hub <ArrowRight size={17} aria-hidden="true" /></span>
        </Link>
      ))}
    </div>
  );
}
