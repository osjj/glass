import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { inquiryStatuses, inquiryStatusLabels } from "@/lib/inquiries";
import type { Prisma } from "@/generated/prisma/client";

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  await requireAdmin();
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q.trim().slice(0, 200) : "";
  const status = inquiryStatuses.find((value) => value === query.status);
  const where: Prisma.InquiryWhereInput = {
    ...(status ? { status } : {}),
    ...(q ? { OR: ["name", "email", "companyName", "phone", "message", "productName", "productSku"].map((key) => ({ [key]: { contains: q, mode: "insensitive" } })) } : {}),
  };
  const [count, newCount] = await Promise.all([prisma.inquiry.count({ where }), prisma.inquiry.count({ where: { status: "NEW" } })]);
  const pages = Math.max(1, Math.ceil(count / 20));
  const page = Math.min(pages, Math.max(1, Number.parseInt(query.page || "1", 10) || 1));
  const records = await prisma.inquiry.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 20, take: 20 });
  function pageUrl(value: number) { return `/admin/inquiries?${new URLSearchParams({ q, status: status || "", page: String(value) })}`; }
  return <div className="mx-auto max-w-7xl">
    <AdminHeader eyebrow="Sales" title="Inquiries" description={`Customer requests and follow-up records. ${newCount} new inquiries awaiting follow-up.`} />
    <form className="my-6 flex flex-wrap gap-3" action="/admin/inquiries">
      <input name="q" aria-label="Search inquiries" defaultValue={q} maxLength={200} placeholder="Search name, email, company, product or message" className="min-w-0 flex-1 basis-72 rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm" />
      <select name="status" aria-label="Filter by status" defaultValue={status || ""} className="rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm"><option value="">All statuses</option>{inquiryStatuses.map((value) => <option key={value} value={value}>{inquiryStatusLabels[value]}</option>)}</select>
      <button className="button-primary" type="submit">Search</button><Link className="self-center px-3 text-sm font-bold" href="/admin/inquiries">Reset</Link>
    </form>
    <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
      <table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[var(--surface)] text-xs uppercase text-[var(--ink-muted)]"><tr>{["Customer", "Request", "Received (UTC)", "Status", ""].map((label) => <th key={label} className="px-5 py-4">{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-[var(--line)]">{records.map((record) => <tr key={record.id}>
          <td className="max-w-[260px] px-5 py-5"><strong className="block truncate">{record.name}</strong><span className="mt-1 block truncate">{record.email}</span><span className="mt-1 block truncate text-xs text-[var(--ink-muted)]">{record.companyName || "No company provided"}</span></td>
          <td className="max-w-sm px-5 py-5"><p className="line-clamp-2 whitespace-pre-wrap break-words">{record.message}</p>{record.productSku && <p className="mt-1 text-xs text-[var(--ink-muted)]">Item: {record.productSku}</p>}</td>
          <td className="whitespace-nowrap px-5 py-5 text-xs">{record.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td>
          <td className="px-5 py-5"><span className={`rounded-full px-3 py-1 text-xs font-bold ${record.status === "NEW" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"}`}>{inquiryStatusLabels[record.status]}</span></td>
          <td className="px-5 py-5"><Link href={`/admin/inquiries/${record.id}`} className="font-bold text-[var(--blue)] hover:underline">View details</Link></td>
        </tr>)}</tbody>
      </table>
      {!records.length && <p className="p-12 text-center text-sm text-[var(--ink-muted)]">{q || status ? "No inquiries match these filters." : "No inquiries yet. Customer submissions will appear here."}</p>}
    </div>
    <nav aria-label="Inquiry pagination" className="mt-5 flex items-center justify-between gap-3 text-sm"><span>{count} records · Page {page} of {pages}</span><div className="flex gap-4">{page > 1 && <Link href={pageUrl(page - 1)}>Previous</Link>}{page < pages && <Link href={pageUrl(page + 1)}>Next</Link>}</div></nav>
  </div>;
}
