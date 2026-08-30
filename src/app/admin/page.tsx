import Link from "next/link";
import { ArrowRight, BookOpenText, Boxes, CircleCheck, Clock3 } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { SetupNotice } from "@/components/admin/setup-notice";
import { articles } from "@/data/blog";
import { products } from "@/data/catalog";

export default function AdminDashboardPage() {
  const metrics = [
    { label: "Products", value: products.length, icon: Boxes, href: "/admin/products" },
    { label: "Blog posts", value: articles.length, icon: BookOpenText, href: "/admin/blog" },
    { label: "Published demo items", value: products.length + articles.length, icon: CircleCheck, href: "/" },
    { label: "Pending integration", value: 4, icon: Clock3, href: "#next-steps" },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl">
      <AdminHeader
        eyebrow="Glarivo admin"
        title="Dashboard"
        description="A compact workspace for the product catalog and blog."
      />
      <div className="mt-6">
        <SetupNotice />
      </div>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="group rounded-3xl border border-[#d7dcd8] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <span className="grid size-10 place-items-center rounded-2xl bg-[var(--acid)]">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <ArrowRight className="size-4 text-[var(--ink-muted)] transition group-hover:translate-x-1" aria-hidden="true" />
            </div>
            <strong className="mt-8 block text-4xl font-black tracking-[-0.06em]">{value}</strong>
            <span className="mt-1 block text-sm font-bold text-[var(--ink-muted)]">{label}</span>
          </Link>
        ))}
      </section>

      <section id="next-steps" className="mt-7 rounded-3xl border border-[#d7dcd8] bg-white p-6 sm:p-8">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[var(--accent-dark)]">Next implementation stage</p>
        <h2 className="mt-3 text-2xl font-black tracking-[-0.04em]">Connect the interface to real maintenance workflows.</h2>
        <ol className="mt-6 grid gap-3 md:grid-cols-2">
          {["Admin login and session protection", "PostgreSQL and Prisma queries", "Product and blog save actions", "Local image upload and WebP processing"].map((item, index) => (
            <li key={item} className="flex items-center gap-3 rounded-2xl bg-[#f4f6f3] p-4 text-sm font-bold">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--ink)] text-xs text-[var(--acid)]">{index + 1}</span>
              {item}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
