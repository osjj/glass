import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedCaseStudy } from "@/lib/public-case-studies";
import { CaseStudyArticle } from "@/components/site/case-study-page";
import { SITE_NAME } from "@/lib/site-identity";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const study = await getPublishedCaseStudy((await params).slug);
  if (!study) return { title: "Case study not found", robots: { index: false } };
  return {
    title: study.title,
    description: study.excerpt,
    alternates: { canonical: `/case-studies/${study.slug}` },
    openGraph: { title: study.title, description: study.excerpt, type: "article", siteName: SITE_NAME, url: `/case-studies/${study.slug}`, modifiedTime: study.updatedAt },
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const study = await getPublishedCaseStudy((await params).slug);
  if (!study) notFound();
  return <CaseStudyArticle study={study} />;
}
