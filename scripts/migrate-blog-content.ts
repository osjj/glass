import "dotenv/config";

import { parseArticleEditorJson, parseStoredArticleContent } from "../src/lib/article-content";
import { prisma } from "../src/lib/prisma";

async function main() {
  const posts = await prisma.blogPost.findMany({ select: { id: true, content: true } });
  let migrated = 0;

  for (const post of posts) {
    if (parseArticleEditorJson(post.content)) continue;
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { content: JSON.stringify(parseStoredArticleContent(post.content)) },
    });
    migrated += 1;
  }

  console.log(`Blog content migration complete: ${migrated} article${migrated === 1 ? "" : "s"} converted.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Unable to migrate blog content");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
