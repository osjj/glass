"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import {
  prepareArticleContentForStorage,
  serializeStoredArticleContentForEditor,
} from "@/lib/article-content-server";
import { prisma } from "@/lib/prisma";
import type { AdminBlogPostInput, BlogPostFormState } from "@/types/admin-blog";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

const imageUrlSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z
    .string()
    .trim()
    .max(2000)
    .refine(
      (value) => value.startsWith("/") || /^https?:\/\//i.test(value),
      "Use an absolute URL or a site path beginning with /",
    )
    .optional(),
);

const articleContentSchema = z
  .string()
  .trim()
  .min(1, "Article content is required")
  .max(500000, "Article content is too large")
  .superRefine((value, context) => {
    const prepared = prepareArticleContentForStorage(value);
    if (!prepared.success) {
      context.addIssue({ code: "custom", message: prepared.error });
    }
  })
  .transform((value) => {
    const prepared = prepareArticleContentForStorage(value);
    return prepared.success ? prepared.value : value;
  });

const blogPostSchema = z
  .object({
    title: z.string().trim().min(1, "Article title is required").max(180),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required")
      .max(180)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
    excerpt: z.string().trim().min(1, "Excerpt is required").max(500),
    category: z.string().trim().min(1, "Category is required").max(80),
    readTimeMinutes: z.coerce.number().int().min(1).max(120),
    content: articleContentSchema,
    coverImage: imageUrlSchema,
    coverImageAlt: optionalText(200),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
    featured: z.boolean(),
    publishedDate: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid publication date").optional(),
    ),
  })
  .superRefine((data, context) => {
    if (data.coverImage && !data.coverImageAlt) {
      context.addIssue({
        code: "custom",
        path: ["coverImageAlt"],
        message: "Cover image alt text is required when an image is provided",
      });
    }
  });

function parseBlogPost(formData: FormData) {
  return blogPostSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    category: formData.get("category"),
    readTimeMinutes: formData.get("readTimeMinutes"),
    content: formData.get("content"),
    coverImage: formData.get("coverImage"),
    coverImageAlt: formData.get("coverImageAlt"),
    status: formData.get("status"),
    featured: formData.get("featured") === "on",
    publishedDate: formData.get("publishedDate"),
  });
}

function publicationDate(value?: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : new Date();
}

function blogPostData(
  data: z.infer<typeof blogPostSchema>,
  currentPublishedAt?: Date | null,
) {
  return {
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    category: data.category,
    readTimeMinutes: data.readTimeMinutes,
    content: data.content,
    coverImage: data.coverImage ?? null,
    coverImageAlt: data.coverImageAlt ?? null,
    status: data.status,
    featured: data.status === "PUBLISHED" && data.featured,
    publishedAt:
      data.status === "PUBLISHED"
        ? data.publishedDate
          ? publicationDate(data.publishedDate)
          : currentPublishedAt ?? new Date()
        : null,
  };
}

function databaseError(error: unknown): BlogPostFormState {
  if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
    return { error: "The slug is already used by another article." };
  }

  return { error: error instanceof Error ? error.message : "The article could not be saved." };
}

function revalidateBlog(previousSlug?: string, nextSlug?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/blog");
  revalidatePath("/");
  revalidatePath("/blog");
  if (previousSlug) revalidatePath(`/blog/${previousSlug}`);
  if (nextSlug && nextSlug !== previousSlug) revalidatePath(`/blog/${nextSlug}`);
  revalidatePath("/sitemap.xml");
}

export async function createBlogPost(
  _previousState: BlogPostFormState,
  formData: FormData,
): Promise<BlogPostFormState> {
  await requireAdmin();
  const result = parseBlogPost(formData);
  if (!result.success) return { errors: result.error.flatten().fieldErrors };

  let postId: string;
  try {
    const post = await prisma.$transaction(async (transaction) => {
      if (result.data.status === "PUBLISHED" && result.data.featured) {
        await transaction.blogPost.updateMany({ data: { featured: false } });
      }
      return transaction.blogPost.create({ data: blogPostData(result.data) });
    });
    postId = post.id;
  } catch (error) {
    return databaseError(error);
  }

  revalidateBlog(undefined, result.data.slug);
  redirect(`/admin/blog/${postId}?saved=created`);
}

export async function updateBlogPost(
  postId: string,
  _previousState: BlogPostFormState,
  formData: FormData,
): Promise<BlogPostFormState> {
  await requireAdmin();
  const result = parseBlogPost(formData);
  if (!result.success) return { errors: result.error.flatten().fieldErrors };

  let previousSlug = result.data.slug;
  try {
    const current = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: { slug: true, publishedAt: true },
    });
    if (!current) return { error: "This article no longer exists." };
    previousSlug = current.slug;

    await prisma.$transaction(async (transaction) => {
      if (result.data.status === "PUBLISHED" && result.data.featured) {
        await transaction.blogPost.updateMany({
          where: { id: { not: postId } },
          data: { featured: false },
        });
      }
      await transaction.blogPost.update({
        where: { id: postId },
        data: blogPostData(result.data, current.publishedAt),
      });
    });
  } catch (error) {
    return databaseError(error);
  }

  revalidateBlog(previousSlug, result.data.slug);
  redirect(`/admin/blog/${postId}?saved=updated`);
}

export async function deleteBlogPost(postId: string) {
  await requireAdmin();
  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: { slug: true },
  });
  if (!post) redirect("/admin/blog");

  await prisma.blogPost.delete({ where: { id: postId } });
  revalidateBlog(post.slug);
  redirect("/admin/blog?deleted=1");
}

export async function getAdminBlogPost(postId: string): Promise<AdminBlogPostInput | null> {
  await requireAdmin();
  const post = await prisma.blogPost.findUnique({ where: { id: postId } });
  if (!post) return null;

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    category: post.category,
    readTimeMinutes: post.readTimeMinutes,
    content: serializeStoredArticleContentForEditor(post.content),
    coverImage: post.coverImage,
    coverImageAlt: post.coverImageAlt,
    status: post.status,
    featured: post.featured,
    publishedDate: post.publishedAt?.toISOString().slice(0, 10) ?? "",
  };
}

export async function getAdminBlogPosts() {
  await requireAdmin();
  return prisma.blogPost.findMany({
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      category: true,
      coverImage: true,
      coverImageAlt: true,
      status: true,
      featured: true,
      publishedAt: true,
      updatedAt: true,
    },
  });
}
