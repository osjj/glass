import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText, Boxes, LayoutDashboard, LogOut, MoveUpRight, ShieldCheck } from "lucide-react";
import { logoutAdmin } from "@/actions/admin-auth";
import { Logo } from "@/components/site/logo";
import { getCurrentAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const adminNavigation = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/blog", label: "Blog", icon: BookOpenText },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return <>{children}</>;
  }

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
        <div className="mt-6 space-y-3 border-t border-white/15 pt-6 lg:absolute lg:bottom-6 lg:left-6 lg:right-6">
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
            <ShieldCheck className="size-4 shrink-0 text-[var(--acid)]" aria-hidden="true" />
            <div className="min-w-0">
              <strong className="block truncate text-xs">{admin.name || "Administrator"}</strong>
              <span className="block truncate text-[0.68rem] text-white/55">{admin.email}</span>
            </div>
          </div>
          <Link href="/" className="flex items-center justify-between rounded-2xl border border-white/15 px-4 py-3 text-sm font-bold text-white/70 hover:text-[var(--acid)]">
            View public site
            <MoveUpRight className="size-4" aria-hidden="true" />
          </Link>
          <form action={logoutAdmin}>
            <button type="submit" className="flex w-full items-center justify-between rounded-2xl border border-white/15 px-4 py-3 text-sm font-bold text-white/70 hover:text-[var(--acid)]">
              Sign out
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-7 lg:p-10">{children}</main>
    </div>
  );
}
