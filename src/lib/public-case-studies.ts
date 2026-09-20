import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { caseStudies, type CaseStudy } from "@/data/case-studies";
import type { CustomerCaseStudy } from "@/data/shangri-la-case-study";
import { caseStudyContentSchema, isCasePublished } from "./case-study-content";
import type { CaseStudy as CaseRecord } from "@/generated/prisma/client";

export function serializeCaseStudy(record: CaseRecord): CustomerCaseStudy {
  return {
    kind: "customer-project", slug: record.slug, title: record.title,
    excerpt: record.excerpt, category: record.category, updatedAt: record.updatedAt.toISOString(),
    ...caseStudyContentSchema.parse(record.content),
    coverImage: record.coverImage ?? undefined, coverImageAlt: record.coverImageAlt ?? undefined,
  };
}

export const getPublishedCaseStudies = cache(async (): Promise<CaseStudy[]> => {
  const records = await prisma.caseStudy.findMany({ orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }] });
  const slugs = new Set(records.map(record => record.slug));
  return [...records.filter(record => isCasePublished(record)).map(serializeCaseStudy), ...caseStudies.filter(study => !slugs.has(study.slug))];
});

export const getPublishedCaseStudy = cache(async (slug: string): Promise<CaseStudy | null> => {
  const record = await prisma.caseStudy.findUnique({ where: { slug } });
  // An unpublished database record must never reveal a static fallback.
  if (record) return isCasePublished(record) ? serializeCaseStudy(record) : null;
  return caseStudies.find(study => study.slug === slug) ?? null;
});
