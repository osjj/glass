import { loadEnvConfig } from "@next/env";
import { load } from "cheerio";
import assert from "node:assert/strict";

loadEnvConfig(process.cwd());

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const { ADMIN_SESSION_COOKIE, signAdminSession } = await import("../src/lib/admin-session-token");
  const base = "http://127.0.0.1:3107";
  try {
    const admin = await prisma.adminUser.findFirstOrThrow({ where: { isActive: true, role: "ADMIN" }, select: { id: true, role: true, sessionVersion: true } });
    const token = await signAdminSession({ userId: admin.id, role: admin.role, sessionVersion: admin.sessionVersion });
    const headers = { Cookie: `${ADMIN_SESSION_COOKIE}=${token}`, Origin: base };
    const before = { products: await prisma.product.count(), candidates: await prisma.productImportCandidate.count() };
    const source = await prisma.externalSourceCategory.findUniqueOrThrow({ where: { provider_sourcePath: { provider: "SUNWIN", sourcePath: "/product_category/10.html" } } });
    const target = await prisma.externalCategoryMapping.findUniqueOrThrow({ where: { provider_sourcePath: { provider: "SUNWIN", sourcePath: source.sourcePath } } });
    for (const provider of ["GARBO", "SUNWIN"]) {
      const response = await fetch(`${base}/admin/imports?provider=${provider}`, { headers, signal: AbortSignal.timeout(120_000) });
      assert.equal(response.status, 200);
      assert.ok(!response.url.includes("login"), "Authenticated admin render required");
      const $ = load(await response.text());
      assert.equal($("h1").text(), "Catalog Import");
      assert.equal($("select[name=mode] option[selected]").val(), provider === "SUNWIN" ? "draft" : "publish");
      const sourceCount = $("select[name=sourceCategoryId] option[value]").filter((_, element) => Boolean($(element).attr("value"))).length;
      if (provider === "SUNWIN") assert.equal(sourceCount, 3);
      else assert.ok(sourceCount > 3);
      console.log(`${provider}: authenticated page rendered, ${sourceCount} source options, correct default import mode.`);
      if (provider !== "SUNWIN") continue;
      const form = $("form").filter((_, element) => $(element).find("select[name=sourceCategoryId]").length > 0).first();
      const data = new FormData();
      form.find("input[type=hidden]").each((_, element) => { data.append($(element).attr("name")!, $(element).attr("value") || ""); });
      assert.ok([...data.keys()].some((key) => key.startsWith("$ACTION_")), "Use the rendered Next.js server action");
      data.set("sourceCategoryId", source.id);
      data.set("categoryId", target.categoryId);
      data.set("limit", "5");
      data.set("mode", "draft");
      const preview = await fetch(`${base}/admin/imports?provider=SUNWIN`, { method: "POST", headers, body: data, redirect: "manual", signal: AbortSignal.timeout(120_000) });
      assert.equal(preview.status, 303);
      const destination = new URL(preview.headers.get("location")!, base);
      assert.equal(destination.searchParams.get("preview"), "ready", destination.searchParams.get("error") || "Preview failed");
      assert.equal(destination.searchParams.get("provider"), "SUNWIN");
      assert.equal(destination.searchParams.get("mode"), "draft");
      const ready = await fetch(destination, { headers, signal: AbortSignal.timeout(120_000) });
      assert.match(await ready.text(), /Import as drafts/);
      console.log(`SUNWIN: actual scan-preview server action passed; ${destination.searchParams.get("products")} products across ${destination.searchParams.get("pages")} pages. No import action submitted.`);
      const wrongTarget = await prisma.category.findUniqueOrThrow({ where: { slug: "perfume-bottles" } });
      data.set("categoryId", wrongTarget.id);
      const rejected = await fetch(`${base}/admin/imports?provider=SUNWIN`, { method: "POST", headers, body: data, redirect: "manual", signal: AbortSignal.timeout(30_000) });
      assert.equal(new URL(rejected.headers.get("location")!, base).searchParams.get("error"), "mapping-conflict");
      console.log("SUNWIN: a mismatched target category was rejected.");
    }
    assert.equal(await prisma.product.count(), before.products);
    assert.equal(await prisma.productImportCandidate.count(), before.candidates);
    console.log("PASS: product and candidate counts unchanged. No credentials or session token were saved.");
  } finally { await prisma.$disconnect(); }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Admin check failed"); process.exitCode = 1; });
