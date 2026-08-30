import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/site/logo";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-[var(--line)] bg-white p-8 text-center shadow-xl sm:p-14">
        <div className="flex justify-center">
          <Logo />
        </div>
        <p className="mt-12 text-sm font-bold uppercase tracking-[0.18em] text-[var(--blue)]">404</p>
        <h1 className="mt-3 text-5xl font-bold tracking-[-0.06em] text-[var(--navy)] sm:text-6xl">Page not found.</h1>
        <p className="mx-auto mt-5 max-w-lg leading-7 text-[var(--ink-muted)]">
          The page may have moved, or the address may be incomplete.
        </p>
        <Link href="/" className="button-primary mt-8">
          <ArrowLeft size={17} weight="bold" aria-hidden="true" />
          Return home
        </Link>
      </div>
    </main>
  );
}
