import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { serializeCaseStudy } from "@/lib/public-case-studies";
import { CaseStudyArticle } from "@/components/site/case-study-page";
import { InquiryProvider } from "@/components/site/inquiry-contact";

export const metadata: Metadata = { title: "Case study draft preview", robots: { index: false, follow: false, noarchive: true } };
export const dynamic = "force-dynamic";

export default async function PreviewCaseStudyPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const record = await prisma.caseStudy.findUnique({ where: { id } });
  if (!record) notFound();
  return <><div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4 text-sm"><p><strong>{record.status}</strong> · Saved preview · Administrator access only</p><Link href={`/admin/case-studies/${id}`} className="font-bold underline">Back to edit</Link></div><InquiryProvider><CaseStudyArticle study={serializeCaseStudy(record)} preview /></InquiryProvider></>;
}
