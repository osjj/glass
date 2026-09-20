import { config } from "dotenv";
import { hotelGlasswareGuide as article } from "../src/data/hotel-glassware-guide";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  try {
    const existing = await prisma.blogPost.findMany({
      where: { OR: [{ slug: article.slug }, { title: article.title }] },
      select: { id: true, slug: true, title: true, status: true },
    });
    if (existing.length) {
      console.log(JSON.stringify({ action: "No changes: a matching record already exists", existing }, null, 2));
      return;
    }
    const { title, slug, excerpt, category, readTimeMinutes, content, coverImage, coverImageAlt, featured } = article;
    const data = { title, slug, excerpt, category, readTimeMinutes, content, coverImage, coverImageAlt, featured,
      status: "PUBLISHED" as const, publishedAt: new Date(article.publishedAt) };
    if (!process.argv.includes("--apply")) {
      console.log(JSON.stringify({ mode: "dry-run", title, slug, category, status: data.status, images: 4,
        next: "After deploying the article and its assets, run the same command with --apply to import this one article." }, null, 2));
      return;
    }
    const origin = "https://www.glarivoglass.com";
    const response = await fetch(`${origin}/blog/${slug}`, { redirect: "manual" });
    if (response.status !== 200 || !(await response.text()).includes(coverImage)) throw new Error("Deployment preflight failed");
    for (const name of ["hero", "rooms-and-lounges", "logo-sample", "packaging"]) {
      const image = await fetch(`${origin}/images/blog/${slug}/${name}.webp`, { method: "HEAD", redirect: "manual" });
      if (image.status !== 200 || !image.headers.get("content-type")?.includes("image/webp")) throw new Error("Image preflight failed");
    }
    // The unique slug plus the serializable duplicate check prevents parallel imports.
    const post = await prisma.$transaction(async tx => {
      if (await tx.blogPost.count({ where: { OR: [{ slug }, { title }] } })) throw new Error("Duplicate found");
      return tx.blogPost.create({ data });
    }, { isolationLevel: "Serializable" });
    console.log(JSON.stringify({ id: post.id, slug: post.slug, status: post.status, adminPath: `/admin/blog/${post.id}` }, null, 2));
  } finally { await prisma.$disconnect(); }
}

main().catch(() => { console.error("Import stopped. Check connectivity, deployed assets and duplicate records; no existing content was overwritten."); process.exitCode = 1; });
