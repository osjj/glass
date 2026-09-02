import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CircleAlert, CircleCheck, ExternalLink, PackagePlus, Rocket, Save, ShieldCheck } from "lucide-react";
import { importCandidateAsDraft, quickPublishImportCandidate, updateImportCandidate, updateImportField } from "@/actions/catalog-imports";
import { AdminHeader } from "@/components/admin/admin-header";
import { getImportCandidate } from "@/lib/catalog-imports";

type ImportCandidatePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string; count?: string }>;
};

const inputClass = "mt-2 h-11 w-full rounded-xl border border-[#ccd3ce] bg-white px-3 text-sm text-[var(--ink)]";
const textareaClass = "mt-2 w-full rounded-xl border border-[#ccd3ce] bg-white p-3 text-sm text-[var(--ink)]";

const statusLabels = {
  PENDING: "Pending",
  IN_REVIEW: "In review",
  APPROVED: "Approved for import",
  IMPORTED: "Imported",
  REJECTED: "Rejected",
  ERROR: "Error",
} as const;

function messageForError(error: string | undefined, count: string | undefined) {
  if (error === "review-required") return `${count || "Some"} unresolved or conflicting fields must be reviewed before approval.`;
  if (error === "imported-locked") return "An imported candidate cannot change workflow state. You can still review its fields, but edit the linked product to change live content.";
  if (error === "field-not-found") return "That field no longer belongs to this candidate.";
  if (error === "invalid-field") return "The field review contains an invalid value or is too long.";
  if (error === "invalid-candidate") return "The candidate review contains an invalid value or is too long.";
  if (error === "no-fields") return "A candidate with no extracted fields cannot be approved.";
  if (error === "no-verified-fields") return "At least one field must be verified before approval.";
  if (error === "name-required") return "The product name must be verified before the candidate can be approved.";
  if (error === "not-approved") return "Approve the fully reviewed candidate before importing it.";
  if (error === "not-eligible") return "Rejected or error candidates cannot use quick publishing. Move the candidate back to Pending or In review first.";
  if (error === "already-imported") return "This candidate is already linked to a product and cannot be imported twice.";
  if (error === "invalid-payload") return "The normalized source payload is incomplete or no longer matches the Garbo category importer.";
  if (error === "missing-name") return "A verified product name is required for draft import.";
  if (error === "invalid-name") return "The verified product name is too long for the product catalog.";
  if (error === "invalid-summary") return "The verified short summary is too long for the product catalog.";
  if (error === "invalid-sku") return "The verified Item No. is too long for the product catalog.";
  if (error === "missing-category") return "The active Garbo source-to-category mapping is missing.";
  if (error === "duplicate-sku") return "The verified Item No. is already used by another product or variant.";
  if (error === "duplicate-slug") return "A product already uses this source-derived slug.";
  if (error === "database-error") return "The draft could not be created. No partial product was kept; check the server log.";
  return null;
}

function formatDate(value: Date | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function ImportCandidatePage({ params, searchParams }: ImportCandidatePageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const candidate = await getImportCandidate(id);
  if (!candidate) notFound();

  const decisionLocked = candidate.status === "IMPORTED";
  const unresolvedCount = candidate.fields.filter((field) => field.status === "UNREVIEWED" || field.status === "CONFLICT").length;
  const verifiedCount = candidate.fields.filter((field) => field.status === "VERIFIED").length;
  const nameVerified = candidate.fields.some((field) => field.fieldKey === "name" && field.status === "VERIFIED");
  const errorMessage = messageForError(query.error, query.count);

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/imports" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[var(--ink-muted)] hover:text-[var(--ink)]">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to catalog review
      </Link>
      <AdminHeader
        eyebrow={`${candidate.provider} · ${candidate.sourceCategoryPath}`}
        title={candidate.sourceTitle}
        description="Compare each source value with its normalized catalog value. Once every field is resolved and the candidate is approved, it can be imported as a private draft."
      />

      {query.saved ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#acd3b0] bg-[#edf9ee] p-4 text-sm font-bold text-[#286a31]" role="status">
          <CircleCheck className="size-5" aria-hidden="true" /> {query.saved === "field" ? "Field review saved." : "Candidate review state saved."}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#e7aaa3] bg-[#fff1ef] p-4 text-sm font-bold text-[#7d2e27]" role="alert">
          <CircleAlert className="size-5" aria-hidden="true" /> {errorMessage}
        </div>
      ) : null}

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.55fr)] lg:items-start">
        <div className="space-y-6">
          {candidate.warnings.length ? (
            <section className="rounded-3xl border border-[#e6c48f] bg-[#fff9ef] p-5 sm:p-6">
              <div className="flex items-center gap-3"><CircleAlert className="size-5 text-[#82522d]" aria-hidden="true" /><h2 className="font-black">Source warnings</h2></div>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-[#6f512f]">{candidate.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
            </section>
          ) : null}

          <section className="overflow-hidden rounded-3xl border border-[#d7dcd8] bg-white">
            <div className="border-b border-[#e4e7e3] bg-[#f8f9f7] px-5 py-5 sm:px-6">
              <h2 className="text-lg font-black">Extracted fields</h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">{candidate.fields.length} fields · {unresolvedCount} still require resolution</p>
              {candidate.product ? <p className="mt-2 text-xs font-bold leading-5 text-[#82522d]">Later field reviews remain part of the source audit. To change the live page, edit the linked product separately.</p> : null}
            </div>
            {candidate.fields.length ? (
              <div className="divide-y divide-[#e4e7e3]">
                {candidate.fields.map((field) => (
                  <form key={field.id} action={updateImportField.bind(null, candidate.id, field.id)} className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black">{field.label}</h3>
                        <code className="mt-1 block text-xs text-[var(--ink-muted)]">{field.fieldKey}</code>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${field.status === "VERIFIED" ? "bg-[#e8f5e6] text-[#286a31]" : field.status === "CONFLICT" ? "bg-[#fff0ee] text-[#8b342b]" : field.status === "REJECTED" ? "bg-[#eceeed] text-[#68706a]" : "bg-[#fff5e8] text-[#82522d]"}`}>{field.status.toLowerCase().replace("_", " ")}</span>
                    </div>
                    <div className="mt-4 rounded-2xl bg-[#f4f6f4] p-4">
                      <span className="text-[0.65rem] font-black uppercase tracking-[0.12em] text-[var(--ink-muted)]">Raw source value</span>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{field.rawValue || "(empty)"}</p>
                    </div>
                    <fieldset className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="text-sm font-black">Normalized value<textarea className={`${textareaClass} min-h-24`} name="normalizedValue" defaultValue={field.normalizedValue ?? ""} placeholder="Confirmed catalog value" /></label>
                      <div className="grid gap-4">
                        <label className="text-sm font-black">Unit<input className={inputClass} name="unit" defaultValue={field.unit ?? ""} placeholder="ml, mm, g, pcs/carton" /></label>
                        <label className="text-sm font-black">Review status<select className={inputClass} name="status" defaultValue={field.status}><option value="UNREVIEWED">Unreviewed</option><option value="VERIFIED">Verified</option><option value="CONFLICT">Conflict</option><option value="REJECTED">Exclude field</option></select></label>
                      </div>
                      <label className="text-sm font-black sm:col-span-2">Reviewer note<textarea className={`${textareaClass} min-h-20`} name="note" defaultValue={field.note ?? ""} placeholder="Explain normalization, conflict, or exclusion" /></label>
                      <button type="submit" className="button-secondary justify-self-start sm:col-span-2"><Save className="size-4" aria-hidden="true" /> Save field review</button>
                    </fieldset>
                  </form>
                ))}
              </div>
            ) : <p className="px-6 py-12 text-center text-sm text-[var(--ink-muted)]">No extracted fields are attached to this candidate.</p>}
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-8">
          <section className="rounded-3xl border border-[#e6c48f] bg-[#fff9ef] p-5 sm:p-6">
            <div className="flex items-center gap-3"><Rocket className="size-5 text-[#82522d]" aria-hidden="true" /><h2 className="font-black">Quick copy &amp; publish</h2></div>
            <p className="mt-3 text-sm leading-6 text-[#6f512f]">
              Publish the source name, copy, attributes and specifications now without reviewing every field. Existing conflicts stay recorded for later review; certificate claims remain unverified and source images are not attached.
            </p>
            {candidate.product ? (
              <Link href={`/admin/products/${candidate.product.id}`} className="button-secondary mt-5 w-full justify-center">
                Open linked product <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : ["PENDING", "IN_REVIEW", "APPROVED"].includes(candidate.status) ? (
              <form action={quickPublishImportCandidate.bind(null, candidate.id)} className="mt-5">
                <button type="submit" className="button-primary w-full justify-center">
                  <Rocket className="size-4" aria-hidden="true" /> Copy source data &amp; publish now
                </button>
              </form>
            ) : (
              <p className="mt-4 rounded-xl bg-white/70 p-3 text-xs font-bold leading-5 text-[#82522d]">
                Quick publishing is unavailable for rejected or error candidates.
              </p>
            )}
            <p className="mt-4 text-xs font-bold leading-5 text-[#82522d]">
              Conflict rule: use the specification-table value where available. A conflicting or duplicate Item No. is left blank instead of inventing a SKU.
            </p>
          </section>

          <section className="rounded-3xl border border-[#d7dcd8] bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3"><ShieldCheck className="size-5 text-[var(--accent-dark)]" aria-hidden="true" /><h2 className="font-black">Candidate decision</h2></div>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">Current: <strong className="text-[var(--ink)]">{statusLabels[candidate.status]}</strong></p>
            <form action={updateImportCandidate.bind(null, candidate.id)} className="mt-5 space-y-4">
              <fieldset disabled={decisionLocked} className="space-y-4">
                <label className="text-sm font-black">Workflow state<select className={inputClass} name="status" defaultValue={candidate.status === "ERROR" ? "IN_REVIEW" : candidate.status}><option value="PENDING">Pending</option><option value="IN_REVIEW">In review</option><option value="APPROVED">Approved for import</option><option value="REJECTED">Rejected</option></select></label>
                <label className="text-sm font-black">Review notes<textarea className={`${textareaClass} min-h-32`} name="reviewNotes" defaultValue={candidate.reviewNotes ?? ""} placeholder="Record the approval or rejection rationale" /></label>
                <button type="submit" className="button-primary w-full justify-center"><Save className="size-4" aria-hidden="true" /> Save decision</button>
              </fieldset>
            </form>
            {unresolvedCount || verifiedCount === 0 || !nameVerified ? <p className="mt-4 rounded-xl bg-[#fff5e8] p-3 text-xs font-bold leading-5 text-[#82522d]">Approval requires every unreviewed/conflicting field to be resolved, the product name to be verified, and at least one verified field.</p> : <p className="mt-4 rounded-xl bg-[#edf9ee] p-3 text-xs font-bold leading-5 text-[#286a31]">All fields are resolved; this candidate can be approved for draft import.</p>}
          </section>

          <section className="rounded-3xl border border-[#d7dcd8] bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3"><PackagePlus className="size-5 text-[var(--accent-dark)]" aria-hidden="true" /><h2 className="font-black">Draft import</h2></div>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">
              Import creates a <strong className="text-[var(--ink)]">DRAFT</strong> product with request-quote pricing. Price, MOQ, stock claims and source images are not copied automatically.
            </p>
            {candidate.product ? (
              <Link href={`/admin/products/${candidate.product.id}`} className="button-secondary mt-5 w-full justify-center">
                Open linked draft <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : candidate.status === "APPROVED" ? (
              <form action={importCandidateAsDraft.bind(null, candidate.id)} className="mt-5">
                <button type="submit" className="button-primary w-full justify-center">
                  <PackagePlus className="size-4" aria-hidden="true" /> Import approved candidate as draft
                </button>
              </form>
            ) : (
              <p className="mt-4 rounded-xl bg-[#f4f6f4] p-3 text-xs font-bold leading-5 text-[var(--ink-muted)]">
                Complete field review and save the candidate as “Approved for import” to enable this action.
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-[#d7dcd8] bg-white p-5 sm:p-6">
            <h2 className="font-black">Source trace</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div><dt className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--ink-muted)]">Item No.</dt><dd className="mt-1 break-words font-bold">{candidate.sourceSku || "Not extracted"}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--ink-muted)]">Fetched</dt><dd className="mt-1">{formatDate(candidate.fetchedAt)}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--ink-muted)]">Source modified</dt><dd className="mt-1">{formatDate(candidate.sourceLastModifiedAt)}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--ink-muted)]">Source hash</dt><dd className="mt-1 break-all font-mono text-xs">{candidate.sourceHash}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--ink-muted)]">Captured sections</dt><dd className="mt-1 break-words">{candidate.rawPayloadKeys.join(", ") || "No top-level keys"}</dd></div>
            </dl>
            <a href={candidate.sourceUrl} target="_blank" rel="noreferrer" className="button-secondary mt-5 w-full justify-center">Open source page <ExternalLink className="size-4" aria-hidden="true" /></a>
            {candidate.reviewer ? <p className="mt-4 text-xs leading-5 text-[var(--ink-muted)]">Last reviewer: {candidate.reviewer.name || candidate.reviewer.email}{candidate.reviewedAt ? ` · ${formatDate(candidate.reviewedAt)}` : ""}</p> : null}
            {candidate.product ? <Link href={`/admin/products/${candidate.product.id}`} className="mt-4 block text-sm font-black text-[var(--accent-dark)] hover:underline">Open linked product: {candidate.product.name}</Link> : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
