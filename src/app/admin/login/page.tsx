import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { AdminLoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/site/logo";
import { getCurrentAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Admin Login",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");

  const { next } = await searchParams;
  const nextPath = next?.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";

  return (
    <div className="grid min-h-screen bg-[#eef0ed] lg:grid-cols-[0.9fr_1.1fr]">
      <section className="hidden bg-[var(--ink)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="w-56 rounded-2xl bg-white px-5 py-4"><Logo /></div>
        <div className="max-w-xl">
          <span className="grid size-12 place-items-center rounded-2xl bg-[var(--acid)] text-[var(--ink)]"><ShieldCheck className="size-6" /></span>
          <h1 className="mt-7 text-5xl font-black leading-[1.02] tracking-[-0.055em]">Protected catalog administration.</h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-white/65">Only active users with the ADMIN role can access product and content maintenance.</p>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/45">Glarivo management access</p>
      </section>
      <main className="grid place-items-center p-5 sm:p-10">
        <div className="w-full max-w-md rounded-3xl border border-[#d7dcd8] bg-white p-6 shadow-xl sm:p-9">
          <div className="grid size-12 place-items-center rounded-2xl bg-[var(--ink)] text-[var(--acid)]"><LockKeyhole className="size-6" /></div>
          <p className="mt-7 text-[0.68rem] font-black uppercase tracking-[0.16em] text-[var(--accent-dark)]">Administrator only</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.045em]">Sign in</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">Use an active Glarivo administrator account to continue.</p>
          <AdminLoginForm nextPath={nextPath} />
        </div>
      </main>
    </div>
  );
}
