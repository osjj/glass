"use client";

import { useActionState } from "react";
import { updateInquiry } from "@/actions/inquiries";
import { inquiryStatusLabels, inquiryStatuses } from "@/lib/inquiries";

export function InquiryFollowUp({ id, status, notes, updatedAt }: { id: string; status: typeof inquiryStatuses[number]; notes: string; updatedAt: string }) {
  const [state, action, pending] = useActionState(updateInquiry, {});
  return <form action={action} className="space-y-5 rounded-2xl border border-[var(--line)] bg-white p-6">
    <h2 className="text-xl font-bold">Follow-up</h2>
    <input type="hidden" name="id" value={id} />
    <input type="hidden" name="updatedAt" value={updatedAt} />
    <label className="block text-sm font-bold">Status<select name="status" defaultValue={status} className="mt-2 block w-full rounded-lg border border-[var(--line)] p-3">{inquiryStatuses.map((value) => <option key={value} value={value}>{inquiryStatusLabels[value]}</option>)}</select></label>
    <label className="block text-sm font-bold">Internal notes<textarea name="notes" defaultValue={notes} maxLength={5000} rows={7} placeholder="Record contact attempts, requirements and next steps…" className="mt-2 block w-full rounded-lg border border-[var(--line)] p-3 font-normal" /></label>
    <p className="text-xs text-[var(--ink-muted)]">Internal only. Saving a status or note does not send a message to the customer.</p>
    {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
    {state.success && <p role="status" className="text-sm text-green-700">Changes saved.</p>}
    <button type="submit" disabled={pending} className="button-primary disabled:opacity-50">{pending ? "Saving…" : "Save changes"}</button>
  </form>;
}
