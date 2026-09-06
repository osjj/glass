import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { InquiryFollowUp } from "@/components/admin/inquiry-follow-up";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export default async function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const record = await prisma.inquiry.findUnique({ where: { id } });
  if (!record) notFound();
  const phone = `${record.countryCode}${record.phone.replace(/\D/g, "")}`;
  return <div className="mx-auto max-w-6xl">
    <AdminHeader eyebrow="Sales / Inquiries" title="Inquiry details" description={`Received ${record.createdAt.toISOString().slice(0, 19).replace("T", " ")} UTC`} action={<Link href="/admin/inquiries" className="button-secondary">Back to inquiries</Link>} />
    <div className="mt-7 grid items-start gap-6 xl:grid-cols-[1.2fr_1fr]">
      <section className="min-w-0 space-y-6 rounded-2xl border border-[var(--line)] bg-white p-6">
        <h2 className="text-xl font-bold">Customer request</h2>
        <dl className="grid gap-5 sm:grid-cols-2">{[["Name", record.name], ["Email", record.email], ["Mobile / WhatsApp", record.phone ? `${record.countryCode} ${record.phone}` : "Not provided"], ["Company", record.companyName || "Not provided"], ["Product", record.productName || "General inquiry"], ["Item No.", record.productSku || "—"]].map(([label, value]) => <div key={label}><dt className="text-xs font-bold uppercase tracking-wide text-[var(--ink-muted)]">{label}</dt><dd className="mt-2 break-words text-sm">{value}</dd></div>)}</dl>
        <div><h3 className="text-xs font-bold uppercase tracking-wide text-[var(--ink-muted)]">Message</h3><p className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-[var(--surface)] p-4 text-sm leading-7">{record.message}</p></div>
        <div className="text-sm"><strong>Source page</strong><Link href={record.sourcePath} target="_blank" className="mt-1 block break-all text-[var(--blue)] hover:underline">{record.sourcePath}</Link></div>
        <div className="flex flex-wrap gap-3"><a className="button-primary" href={`mailto:${record.email}?subject=${encodeURIComponent(`Re: Your glassware inquiry${record.productSku ? ` - ${record.productSku}` : ""}`)}`}>Reply by email</a>{record.phone && <a className="button-secondary" href={`https://wa.me/${phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">Open WhatsApp</a>}</div>
      </section>
      <InquiryFollowUp id={record.id} status={record.status} notes={record.notes} updatedAt={record.updatedAt.toISOString()} />
    </div>
  </div>;
}
