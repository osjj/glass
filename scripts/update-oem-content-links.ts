import { config } from "dotenv";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { oemArticleSlugs, patchOemArticleLinks } from "./lib/oem-link-patches";

config({ path: ".env", quiet: true });
config({ path: ".env.local", quiet: true, override: true });

type Plan = {
  version: 1;
  createdAt: string;
  database: { host: string; database: string };
  changes: Array<{ slug: string; id: string; updatedAt: string; beforeSha256: string; afterSha256: string; added: number }>;
};
type Snapshot = {
  id: string; slug: string; content: string; updatedAt: string;
  [key: string]: unknown;
};
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const articleSlugs = Object.values(oemArticleSlugs);
const relatedTargets = ["restaurant-glassware-dishwasher-rack-fit-storage-checklist", "whiskey-decanter-sets-wholesale-components-stoppers-gift-boxes"];
const immutableKeys = ["title", "slug", "excerpt", "category", "coverImage", "coverImageAlt", "featured", "status", "publishedAt", "createdAt", "readTimeMinutes"] as const;

function databaseIdentity() {
  const url = new URL(process.env.DATABASE_URL ?? "");
  return { host: url.host, database: url.pathname };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length && !(args.length === 2 && args[0] === "--apply")) {
    throw new Error("Usage: tsx scripts/update-oem-content-links.ts [--apply path/to/plan.json]");
  }
  const { prisma } = await import("../src/lib/prisma");
  try {
    const now = new Date();
    const targets = await prisma.blogPost.findMany({ where: { slug: { in: [...articleSlugs, ...relatedTargets] } } });
    for (const slug of [...articleSlugs, ...relatedTargets]) {
      const post = targets.find((post) => post.slug === slug);
      if (!post || post.status !== "PUBLISHED" || !post.publishedAt || post.publishedAt > now) {
        throw new Error(`Expected an already published article: ${slug}`);
      }
    }
    const posts = articleSlugs.map((slug) => targets.find((post) => post.slug === slug)!);

    if (!args.length) {
      const proposed = posts.map((post) => ({ slug: post.slug, ...patchOemArticleLinks(post.slug, post.content) }));
      const directory = path.resolve("output", "content-links-2026-11-15", now.toISOString().replace(/[:.]/g, "-"));
      await mkdir(directory, { recursive: true });
      const plan: Plan = {
        version: 1,
        createdAt: now.toISOString(),
        database: databaseIdentity(),
        changes: posts.flatMap((post) => {
          const after = proposed.find((item) => item.slug === post.slug)!;
          return post.content === after.content ? [] : [{
            slug: post.slug, id: post.id, updatedAt: post.updatedAt.toISOString(),
            beforeSha256: hash(post.content), afterSha256: hash(after.content), added: after.added,
          }];
        }),
      };
      await writeFile(path.join(directory, "before.json"), JSON.stringify(posts, null, 2), { flag: "wx" });
      await writeFile(path.join(directory, "proposed.json"), JSON.stringify(proposed, null, 2), { flag: "wx" });
      await writeFile(path.join(directory, "plan.json"), JSON.stringify(plan, null, 2), { flag: "wx" });
      console.log(JSON.stringify({ mode: "dry-run", planPath: path.join(directory, "plan.json"), changes: plan.changes.map(({ slug, added }) => ({ slug, added })) }, null, 2));
      return;
    }

    const planPath = path.resolve(args[1]);
    const directory = path.dirname(planPath);
    const plan = JSON.parse(await readFile(planPath, "utf8")) as Plan;
    const before = JSON.parse(await readFile(path.join(directory, "before.json"), "utf8")) as Snapshot[];
    const proposed = JSON.parse(await readFile(path.join(directory, "proposed.json"), "utf8")) as Array<{ slug: string; content: string }>;
    assert.equal(plan.version, 1, "Unsupported plan version");
    assert.deepEqual(plan.database, databaseIdentity(), "Database differs from the reviewed plan");
    const allowed = new Set<string>(articleSlugs);
    assert.equal(new Set(plan.changes.map((change) => change.slug)).size, plan.changes.length, "Duplicate sources in plan");
    for (const change of plan.changes) {
      assert(allowed.has(change.slug), `Unexpected source: ${change.slug}`);
      const current = posts.find((post) => post.slug === change.slug);
      const original = before.find((post) => post.slug === change.slug);
      const after = proposed.find((post) => post.slug === change.slug);
      assert(current && original && after, `Incomplete plan: ${change.slug}`);
      assert.equal(current.id, change.id, `Source ID changed: ${change.slug}`);
      assert.equal(original.id, change.id, `Backup ID changed: ${change.slug}`);
      assert.equal(original.updatedAt, change.updatedAt, `Backup version changed: ${change.slug}`);
      assert.equal(current.updatedAt.toISOString(), change.updatedAt, `Concurrent edit: ${change.slug}`);
      assert.equal(hash(current.content), change.beforeSha256, `Current content changed: ${change.slug}`);
      assert.equal(hash(original.content), change.beforeSha256, `Backup content changed: ${change.slug}`);
      assert.equal(hash(after.content), change.afterSha256, `Proposed content changed: ${change.slug}`);
      assert.equal(patchOemArticleLinks(change.slug, original.content).content, after.content, `Proposal differs from the current patch: ${change.slug}`);
      for (const key of immutableKeys) {
        assert.deepEqual(JSON.parse(JSON.stringify(current[key])), original[key], `Metadata changed since review: ${change.slug}/${key}`);
      }
    }

    if (plan.changes.length) {
      await prisma.$transaction(async (tx) => {
        for (const change of plan.changes) {
          const original = before.find((post) => post.slug === change.slug)!;
          const after = proposed.find((post) => post.slug === change.slug)!;
          const result = await tx.blogPost.updateMany({
            where: { id: change.id, content: original.content, updatedAt: new Date(change.updatedAt), status: "PUBLISHED", publishedAt: { lte: now } },
            data: { content: after.content },
          });
          assert.equal(result.count, 1, `Concurrent edit detected: ${change.slug}`);
        }
      }, { isolationLevel: "Serializable", timeout: 30_000 });
    }
    const readback = await prisma.blogPost.findMany({ where: { id: { in: plan.changes.map((change) => change.id) } } });
    for (const change of plan.changes) {
      const current = readback.find((post) => post.id === change.id);
      const original = before.find((post) => post.id === change.id)!;
      assert(current, `Readback missing: ${change.slug}`);
      assert.equal(hash(current.content), change.afterSha256, `Readback content differs: ${change.slug}`);
      for (const key of immutableKeys) {
        assert.deepEqual(JSON.parse(JSON.stringify(current[key])), original[key], `Unexpected metadata change: ${change.slug}/${key}`);
      }
    }
    await writeFile(path.join(directory, "readback.json"), JSON.stringify(readback, null, 2));
    console.log(JSON.stringify({ mode: "applied", verified: readback.length, planPath, publicHtmlVerificationRequired: true }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: Error) => {
  console.error(error.message.replaceAll(process.env.DATABASE_URL || "__NO_DATABASE_URL__", "[redacted]").replace(/postgres(?:ql)?:\/\/\S+/g, "[redacted]"));
  process.exitCode = 1;
});
