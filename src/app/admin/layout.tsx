import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText, Boxes, LayoutDashboard, MoveUpRight } from "lucide-react";
import { Logo } from "@/components/site/logo";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const adminNavigation = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/blog", label: "Blog", icon: BookOpenText },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#eef0ed] text-[var(--ink)] lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="border-b border-[var(--line)] bg-[var(--ink)] p-5 text-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:border-white/10 lg:p-6">
        <div className="rounded-2xl bg-[var(--paper)] px-4 py-3">
          <Logo />
        </div>
        <div className="mt-6 flex gap-2 overflow-x-auto lg:flex-col">
          {adminNavigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </div>
        <div className="mt-6 border-t border-white/15 pt-6 lg:absolute lg:bottom-6 lg:left-6 lg:right-6">
          <Link href="/" className="flex items-center justify-between rounded-2xl border border-white/15 px-4 py-3 text-sm font-bold text-white/70 hover:text-[var(--acid)]">
            View public site
            <MoveUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-7 lg:p-10">{children}</main>
    </div>
  );
}
