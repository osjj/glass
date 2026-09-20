"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { caseStudies } from "@/data/case-studies";
import { caseStudyContentSchema, caseImageUrl, type AdminCaseStudy, type CaseFormState } from "@/lib/case-study-content";

const schema = z.object({
  title: z.string().trim().min(1).max(180),
  slug: z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().trim().min(1).max(500), category: z.string().trim().min(1).max(80),
  coverImage: z.union([z.literal(""), caseImageUrl]), coverImageAlt: z.string().trim().max(200),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  publishedDate: z.string().refine(value => !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value), "Invalid publication date."),
  content: caseStudyContentSchema,
}).refine(value => !value.coverImage || !!value.coverImageAlt, "Add cover image alt text.")
  .refine(value => !caseStudies.some(study => study.slug === value.slug), "That URL belongs to an existing design study.");

function invalidate(slugs: string[] = []) {
  for (const path of ["/admin/case-studies", "/case-studies", "/sitemap.xml", ...slugs.map(slug => `/case-studies/${slug}`)]) revalidatePath(path);
}

export async function saveCaseStudy(id: string | null, _state: CaseFormState, form: FormData): Promise<CaseFormState> {
  await requireAdmin();
  let raw: unknown;
  try { raw = JSON.parse(String(form.get("content") ?? "")); } catch { return { error: "The case content could not be read." }; }
  const parsed = schema.safeParse({ ...Object.fromEntries(form), content: raw });
  if (!parsed.success) return { error: parsed.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("\n") };
  const { publishedDate, ...values } = parsed.data;
  let savedId: string;
  let oldSlug: string | undefined;
  try {
    const current = id ? await prisma.caseStudy.findUnique({ where: { id } }) : null;
    if (id && !current) return { error: "This case study no longer exists." };
    oldSlug = current?.slug;
    const data = { ...values, coverImage: values.coverImage || null, coverImageAlt: values.coverImageAlt || null,
      publishedAt: values.status === "PUBLISHED" ? (publishedDate ? new Date(`${publishedDate}T00:00:00.000Z`) : current?.publishedAt ?? new Date()) : null };
    if (current) {
      const stamp = String(form.get("updatedAt"));
      if (stamp !== current.updatedAt.toISOString()) return { error: "This case was changed in another tab. Reload before saving." };
      const changed = await prisma.caseStudy.updateMany({ where: { id: current.id, updatedAt: current.updatedAt }, data });
      if (changed.count !== 1) return { error: "This case changed while you were saving. Reload and try again." };
      savedId = current.id;
    } else savedId = (await prisma.caseStudy.create({ data })).id;
  } catch (error) {
    return { error: typeof error === "object" && error && "code" in error && error.code === "P2002" ? "This case URL is already in use." : "The case study could not be saved. Please try again." };
  }
  invalidate([values.slug, ...(oldSlug ? [oldSlug] : [])]);
  revalidatePath(`/admin/case-studies/${savedId}`);
  revalidatePath(`/admin/case-studies/${savedId}/preview`);
  redirect(`/admin/case-studies/${savedId}?saved=1`);
}

export async function deleteCaseStudy(id: string, form: FormData) {
  await requireAdmin();
  const current = await prisma.caseStudy.findUnique({ where: { id } });
  if (!current) redirect("/admin/case-studies");
  if (String(form.get("updatedAt")) !== current.updatedAt.toISOString()) redirect(`/admin/case-studies/${id}?conflict=1`);
  const deleted = await prisma.caseStudy.deleteMany({ where: { id, updatedAt: current.updatedAt } });
  if (!deleted.count) redirect(`/admin/case-studies/${id}?conflict=1`);
  invalidate([current.slug]);
  redirect("/admin/case-studies?deleted=1");
}

export async function getAdminCaseStudy(id: string): Promise<AdminCaseStudy | null> {
  await requireAdmin();
  const record = await prisma.caseStudy.findUnique({ where: { id } });
  if (!record) return null;
  return { ...record, content: caseStudyContentSchema.parse(record.content), publishedDate: record.publishedAt?.toISOString().slice(0, 10) ?? "", updatedAt: record.updatedAt.toISOString() };
}
