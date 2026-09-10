export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readTime: string;
  featured: boolean;
  image: string;
  imageAlt: string;
  content: Array<{ heading?: string; paragraphs: string[] }>;
};

export const articles: Article[] = [];

export function getArticleBySlug(slug: string) {
  return articles.find((article) => article.slug === slug);
}
