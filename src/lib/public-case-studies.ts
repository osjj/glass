import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { caseStudies, retiredCaseStudySlugs, type CaseStudy } from "@/data/case-studies";
import type { CustomerCaseStudy } from "@/data/shangri-la-case-study";
import { caseStudyContentSchema, isCasePublished } from "./case-study-content";
import type { CaseStudy as CaseRecord } from "@/generated/prisma/client";

export function serializeCaseStudy(record: CaseRecord): CustomerCaseStudy {
  const content = caseStudyContentSchema.parse(record.content);
  return {
    kind: "customer-project", slug: record.slug, title: record.title,
    excerpt: record.excerpt, category: record.category, updatedAt: record.updatedAt.toISOString(),
    ...content,
    relatedLinks: content.relatedLinks.map(link => retiredCaseStudySlugs.some(slug => link.href === `/case-studies/${slug}`)
      ? { href: "/blog/hotel-glassware-guestrooms-lounges", label: "Hotel glassware buying guide" } : link),
    coverImage: record.coverImage ?? undefined, coverImageAlt: record.coverImageAlt ?? undefined,
  };
}

export const getPublishedCaseStudies = cache(async (): Promise<CaseStudy[]> => {
  const records = await prisma.caseStudy.findMany({ orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }] });
  const slugs = new Set(records.map(record => record.slug));
  return [...records.filter(record => isCasePublished(record) && !retiredCaseStudySlugs.includes(record.slug)).map(serializeCaseStudy), ...caseStudies.filter(study => !slugs.has(study.slug))];
});

export const getPublishedCaseStudy = cache(async (slug: string): Promise<CaseStudy | null> => {
  if (retiredCaseStudySlugs.includes(slug)) return null;
  const record = await prisma.caseStudy.findUnique({ where: { slug } });
  // An unpublished database record must never reveal a static fallback.
  if (record) return isCasePublished(record) ? serializeCaseStudy(record) : null;
  return caseStudies.find(study => study.slug === slug) ?? null;
});
