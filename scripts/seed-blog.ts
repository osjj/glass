import "dotenv/config";

import { articles } from "../src/data/blog";
import { articleSectionsToEditorData } from "../src/lib/article-content";
import { prisma } from "../src/lib/prisma";

async function main() {
  const result = await prisma.blogPost.createMany({
    data: articles.map((article) => ({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      category: article.category,
      readTimeMinutes: Number.parseInt(article.readTime, 10) || 5,
      content: JSON.stringify(articleSectionsToEditorData(article.content)),
      coverImage: article.image,
      coverImageAlt: article.imageAlt,
      status: "PUBLISHED" as const,
      featured: article.featured,
      publishedAt: new Date(`${article.publishedAt}T00:00:00.000Z`),
    })),
    skipDuplicates: true,
  });

  console.log(`Blog seed complete: ${result.count} article${result.count === 1 ? "" : "s"} created.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Unable to seed blog articles");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
