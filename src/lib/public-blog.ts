import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";

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
  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
  });

  return posts.map(serializeBlogPost);
});

export const getPublishedBlogPostBySlug = cache(
  async (slug: string): Promise<PublicBlogPost | null> => {
    const post = await prisma.blogPost.findFirst({
      where: { slug, status: "PUBLISHED", publishedAt: { lte: new Date() } },
    });

    return post ? serializeBlogPost(post) : null;
  },
);

export async function getPublishedBlogSitemapEntries() {
  return prisma.blogPost.findMany({
    where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    select: { slug: true, updatedAt: true },
  });
}
