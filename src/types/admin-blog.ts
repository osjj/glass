export type BlogPostFormState = {
  error?: string;
  errors?: Record<string, string[] | undefined>;
};

export type AdminBlogPostInput = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  readTimeMinutes: number;
  content: string;
  coverImage: string | null;
  coverImageAlt: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  publishedDate: string;
};
