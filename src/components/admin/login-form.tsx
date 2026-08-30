"use client";

import { useActionState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { loginAdmin, type AdminLoginState } from "@/actions/admin-auth";

const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-[#ccd3ce] bg-white px-4 text-sm text-[var(--ink)] shadow-sm transition focus:border-[var(--accent)]";

export function AdminLoginForm({ nextPath }: { nextPath: string }) {
  const [state, action, pending] = useActionState<AdminLoginState, FormData>(loginAdmin, {});

  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="next" value={nextPath} />
      {state.error ? (
        <div className="rounded-xl border border-[#e7aaa3] bg-[#fff1ef] px-4 py-3 text-sm font-bold text-[#7d2e27]" role="alert">
          {state.error}
        </div>
      ) : null}
      <label className="block text-sm font-black">
        Admin email
        <input className={inputClass} type="email" name="email" autoComplete="username" required autoFocus />
        {state.errors?.email ? <span className="mt-2 block text-xs text-[#a33c32]">{state.errors.email[0]}</span> : null}
      </label>
      <label className="block text-sm font-black">
        Password
        <input className={inputClass} type="password" name="password" autoComplete="current-password" required />
        {state.errors?.password ? <span className="mt-2 block text-xs text-[#a33c32]">{state.errors.password[0]}</span> : null}
      </label>
      <button type="submit" className="button-primary w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <LogIn className="size-4" aria-hidden="true" />}
        {pending ? "Signing in…" : "Sign in to admin"}
      </button>
    </form>
  );
}
