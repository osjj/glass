import type { MetadataRoute } from "next";
import { getPublishedBlogSitemapEntries } from "@/lib/public-blog";
import { getPublicCategorySitemapEntries, getPublishedProductSitemapEntries } from "@/lib/public-products";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const [products, categories, articles] = await Promise.all([
    getPublishedProductSitemapEntries(),
    getPublicCategorySitemapEntries(),
    getPublishedBlogSitemapEntries(),
  ]);

  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/products`, changeFrequency: "weekly", priority: 0.9 },
    ...categories.map((category) => ({
      url: `${baseUrl}/products/category/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...products.map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${baseUrl}/blog`, changeFrequency: "weekly", priority: 0.8 },
    ...articles.map((article) => ({
      url: `${baseUrl}/blog/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.6 },
  ];
}
