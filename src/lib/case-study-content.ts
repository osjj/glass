import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);
export const caseImageUrl = z.string().trim().max(2000).refine(value =>
  /^https?:\/\//i.test(value) || (value.startsWith("/") && !value.startsWith("//")), "Use an http(s) URL or a site path.");
const image = z.object({ url: caseImageUrl, alt: text(200), caption: z.string().trim().max(500) });
export const caseStudyContentSchema = z.object({
  introduction: text(3000),
  stats: z.array(z.object({ value: text(80), label: text(120) })).max(8),
  sections: z.array(z.object({
    id: text(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).refine(value => value !== "your-project", "This section ID is reserved."),
    title: text(240), navLabel: text(80),
    paragraphs: z.array(text(12000)).min(1).max(30),
    image: image.optional(),
    points: z.array(z.object({ title: text(240), text: text(5000) })).max(30).optional(),
    table: z.object({ caption: text(300), headings: z.array(text(200)).min(1).max(8), rows: z.array(z.array(z.string().max(2000)).min(1).max(8)).min(1).max(50) })
      .refine(table => table.rows.every(row => row.length === table.headings.length), "All table rows must match the heading count.").optional(),
  })).min(1).max(20),
  conclusion: text(5000),
  relatedLinks: z.array(z.object({ href: caseImageUrl, label: text(150) })).max(12),
}).refine(value => new Set(value.sections.map(section => section.id)).size === value.sections.length, "Section IDs must be unique.");

export type CaseStudyContent = z.infer<typeof caseStudyContentSchema>;
export type CaseFormState = { error?: string };
export type AdminCaseStudy = {
  id: string; title: string; slug: string; excerpt: string; category: string;
  content: CaseStudyContent; coverImage: string | null; coverImageAlt: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; publishedDate: string; updatedAt: string;
};

export function isCasePublished(study: { status: string; publishedAt: Date | null }, now = new Date()) {
  return study.status === "PUBLISHED" && study.publishedAt !== null && study.publishedAt <= now;
}
