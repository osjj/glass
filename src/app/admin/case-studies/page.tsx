import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { AdminHeader } from "@/components/admin/admin-header";
import { isCasePublished } from "@/lib/case-study-content";

export default async function AdminCaseStudiesPage() {
  await requireAdmin();
  const cases = await prisma.caseStudy.findMany({ orderBy: { updatedAt: "desc" } });
  return <div className="mx-auto max-w-7xl">
    <AdminHeader eyebrow="Content" title="Case Studies" description="Manage customer cases, images and publication separately from the blog." action={<Link className="button-primary" href="/admin/case-studies/new">Add case study</Link>} />
    <div className="mt-7 space-y-4">{cases.length ? cases.map(study => <article key={study.id} className="flex flex-wrap items-center gap-5 rounded-2xl border border-[#d7dcd8] bg-white p-5">
      {study.coverImage && <Image src={study.coverImage} alt={study.coverImageAlt ?? ""} width={144} height={96} unoptimized className="rounded-lg object-cover" />}
      <div className="min-w-0 flex-1"><p className="text-xs font-bold text-[var(--accent-dark)]">{study.status}{study.status === "PUBLISHED" && !isCasePublished(study) ? " · Scheduled" : ""}</p><h2 className="mt-2 text-lg font-bold">{study.title}</h2><p className="mt-2 break-all text-xs text-[var(--ink-muted)]">/case-studies/{study.slug}</p><p className="mt-1 text-xs text-[var(--ink-muted)]">Updated {study.updatedAt.toISOString().slice(0, 10)}</p></div>
      <div className="flex flex-wrap gap-4 text-sm font-bold"><Link href={`/admin/case-studies/${study.id}`}>Edit</Link><Link href={`/admin/case-studies/${study.id}/preview`}>Preview</Link>{isCasePublished(study) && <Link href={`/case-studies/${study.slug}`}>View public case</Link>}</div>
    </article>) : <p className="rounded-2xl border bg-white p-10">No customer case studies yet. Add your first case and save it as a draft.</p>}</div>
    <p className="mt-6 text-sm text-[var(--ink-muted)]">The existing hotel design study remains available on the public site. Customer project drafts are managed here.</p>
  </div>;
}
