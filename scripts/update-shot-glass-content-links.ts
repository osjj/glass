import { config } from "dotenv";
import { mkdirSync, writeFileSync } from "node:fs";
import { articleSlugs, patchArticleLinks, patchSlugs } from "./lib/article-link-patches";

config({ path: ".env", quiet: true });
config({ path: ".env.local", quiet: true });

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  try {
    const posts = await prisma.blogPost.findMany({ where: { slug: { in: Object.values(articleSlugs) } } });
    const now = new Date();
    for (const slug of Object.values(articleSlugs).filter(s => s !== articleSlugs.buying)) {
      const p = posts.find(p => p.slug === slug);
      if (!p || p.status !== "PUBLISHED" || !p.publishedAt || p.publishedAt > now) throw new Error(`Published target missing: ${slug}`);
    }
    const planned = posts.filter(p => patchSlugs.includes(p.slug as typeof patchSlugs[number])).map(p => {
      if (p.status !== "PUBLISHED" || !p.publishedAt || p.publishedAt > now) throw new Error(`Source is not published: ${p.slug}`);
      return { before: p, after: patchArticleLinks(p.slug, p.content) };
    });
    const changed = planned.filter(p => p.before.content !== p.after.content);
    const directory = `output/content-links-20260928/${now.toISOString().replace(/[:.]/g, "-")}`;
    mkdirSync(directory, { recursive: true });
    writeFileSync(`${directory}/before.json`, JSON.stringify(planned.map(p => p.before), null, 2));
    writeFileSync(`${directory}/proposed.json`, JSON.stringify(planned.map(p => ({ slug: p.before.slug, ...p.after })), null, 2));
    console.log(JSON.stringify({ mode: process.argv.includes("--apply") ? "apply" : "dry-run", directory,
      changes: changed.map(p => ({ slug: p.before.slug, paragraphsAdded: p.after.added, urlsRepaired: p.after.repaired })),
      buyingGuideUsesSourceFallback: !posts.some(p => p.slug === articleSlugs.buying) }, null, 2));
    if (!process.argv.includes("--apply") || !changed.length) return;
    await prisma.$transaction(async tx => {
      for (const item of changed) {
        const result = await tx.blogPost.updateMany({
          where: { id: item.before.id, content: item.before.content, updatedAt: item.before.updatedAt, status: "PUBLISHED" },
          data: { content: item.after.content },
        });
        if (result.count !== 1) throw new Error(`Concurrent edit detected: ${item.before.slug}`);
      }
    }, { isolationLevel: "Serializable", timeout: 15000 });
    const readback = await prisma.blogPost.findMany({ where: { id: { in: changed.map(p => p.before.id) } } });
    for (const item of changed) {
      const p = readback.find(p => p.id === item.before.id);
      if (!p || p.content !== item.after.content) throw new Error(`Content readback failed: ${item.before.slug}`);
      for (const key of ["title", "slug", "excerpt", "category", "coverImage", "coverImageAlt", "featured", "status", "publishedAt", "createdAt", "readTimeMinutes"] as const) {
        if (JSON.stringify(p[key]) !== JSON.stringify(item.before[key])) throw new Error(`Unexpected metadata change: ${key}`);
      }
    }
    writeFileSync(`${directory}/readback.json`, JSON.stringify(readback, null, 2));
    console.log(`Verified ${readback.length} content-only database updates. Canonical public HTML must still be checked separately.`);
  } finally { await prisma.$disconnect(); }
}

main().catch(error => {
  console.error(String(error.message).replaceAll(process.env.DATABASE_URL || "__NO_DATABASE_URL__", "[redacted]").replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]"));
  process.exitCode = 1;
});
