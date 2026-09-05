import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { editorialPosts } from "@/data/editorial-posts";

const DEFAULT_COVER_IMAGE = "/images/home/category-colored.webp";

type PublishedBlogPostRecord = Awaited<
  ReturnType<typeof prisma.blogPost.findFirst>
>;

export type PublicBlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  readTime: string;
  readTimeMinutes: number;
  content: string;
  coverImage: string;
  coverImageAlt: string;
  coverImageFit?: "contain" | "cover";
  featured: boolean;
  publishedAt: string;
  publishedLabel: string;
  updatedAt: Date;
};

function serializeBlogPost(post: NonNullable<PublishedBlogPostRecord>): PublicBlogPost {
  const publishedAt = post.publishedAt ?? post.updatedAt;

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    category: post.category,
    readTime: `${post.readTimeMinutes} min read`,
    readTimeMinutes: post.readTimeMinutes,
    content: post.content,
    coverImage: post.coverImage || DEFAULT_COVER_IMAGE,
    coverImageAlt: post.coverImageAlt || post.title,
    featured: post.featured,
    publishedAt: publishedAt.toISOString(),
    publishedLabel: new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(publishedAt),
    updatedAt: post.updatedAt,
  };
}

export const getPublishedBlogPosts = cache(async (): Promise<PublicBlogPost[]> => {
  const now = new Date();
  const posts = await prisma.blogPost.findMany({
    where: { OR: [
      { status: "PUBLISHED", publishedAt: { lte: now } },
      { slug: { in: editorialPosts.map((post) => post.slug) } },
    ] },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
  });

  const databaseSlugs = new Set(posts.map((post) => post.slug));
  const published = posts.filter((post) => post.status === "PUBLISHED" && post.publishedAt && post.publishedAt <= now);
  return [
    ...editorialPosts.filter((post) => !databaseSlugs.has(post.slug) && new Date(post.publishedAt) <= now),
    ...published.map(serializeBlogPost),
  ].sort((a, b) => Number(b.featured) - Number(a.featured) || Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
});

export const getPublishedBlogPostBySlug = cache(
  async (slug: string): Promise<PublicBlogPost | null> => {
    const post = await prisma.blogPost.findFirst({
      where: { slug },
    });

    const now = new Date();
    if (post) return post.status === "PUBLISHED" && post.publishedAt && post.publishedAt <= now
      ? serializeBlogPost(post) : null;
    return editorialPosts.find((article) => article.slug === slug && new Date(article.publishedAt) <= now) ?? null;
  },
);

export async function getPublishedBlogSitemapEntries() {
  return (await getPublishedBlogPosts()).map(({ slug, updatedAt }) => ({ slug, updatedAt }));
}
