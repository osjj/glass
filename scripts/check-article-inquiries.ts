// Integration checks use an isolated local test database and a local Next server.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../src/lib/prisma";
import { articleProductSelections, shotGlassArticleSlug } from "../src/data/article-products";

async function main() {
  const db = new URL(process.env.DATABASE_URL || "");
  const base = process.env.INQUIRY_TEST_BASE_URL || "http://127.0.0.1:3017";
  assert.ok(["localhost", "127.0.0.1"].includes(db.hostname) && db.pathname.endsWith("_test"), "Dedicated local test database required");
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "Local Next server required");
  const [first, second] = articleProductSelections[shotGlassArticleSlug];
  const email = `article-qa-${randomUUID().slice(0, 8)}@example.test`;
  const body = { submissionId: randomUUID(), email, name: "Article QA", countryCode: "", phone: "", companyName: "", message: "Quantity: 144. Destination: UK. Please confirm capacity and packing.", sourcePath: `/blog/${shotGlassArticleSlug}`, productSlug: first.slug, website: "" };
  const send = (data: unknown) => fetch(`${base}/api/inquiries`, { method: "POST", headers: { "Content-Type": "application/json", origin: new URL(base).origin }, body: JSON.stringify(data) });
  try {
    assert.equal((await send({ ...body, productName: "FORGED", productSku: "FORGED" })).status, 201);
    const record = await prisma.inquiry.findUniqueOrThrow({ where: { submissionId: body.submissionId } });
    assert.equal(record.productSku, "GB073502");
    assert.notEqual(record.productName, "FORGED");
    assert.equal(record.sourcePath, body.sourcePath);
    const retries = await Promise.all([send(body), send(body)]);
    assert.ok(retries.every((response) => response.status === 201));
    assert.equal(await prisma.inquiry.count({ where: { submissionId: body.submissionId } }), 1);
    assert.equal((await send({ ...body, productSlug: second.slug })).status, 409);
    assert.equal((await send({ ...body, submissionId: randomUUID(), productSlug: "missing-product" })).status, 400);
    assert.equal((await send({ ...body, submissionId: randomUUID(), sourcePath: "/blog/unrelated" })).status, 400);
    const general = { ...body, submissionId: randomUUID(), productSlug: undefined };
    assert.equal((await send(general)).status, 201);
    assert.equal((await prisma.inquiry.findUniqueOrThrow({ where: { submissionId: general.submissionId } })).productSku, null);
    const direct = { ...body, submissionId: randomUUID(), sourcePath: `/products/${first.slug}`, productSlug: undefined };
    assert.equal((await send(direct)).status, 201);
    assert.equal((await prisma.inquiry.findUniqueOrThrow({ where: { submissionId: direct.submissionId } })).productSku, "GB073502");
    // A product that is unpublished after the article was loaded must not be accepted.
    const product = await prisma.product.findUniqueOrThrow({ where: { slug: second.slug } });
    try {
      await prisma.product.update({ where: { id: product.id }, data: { status: "DRAFT" } });
      assert.equal((await send({ ...body, submissionId: randomUUID(), productSlug: second.slug })).status, 400);
    } finally {
      await prisma.product.update({ where: { id: product.id }, data: { status: product.status, updatedAt: product.updatedAt } });
    }
    console.log("PASS: article/model persistence, forged data rejection, retries, changed-product conflict, invalid/unpublished products, general inquiries, legacy product inquiries.");
  } finally {
    await prisma.inquiry.deleteMany({ where: { email } });
  }
}
main().finally(() => prisma.$disconnect());
