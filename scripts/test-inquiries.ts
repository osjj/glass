// Run against a dedicated local test database and local Next server only.
// DATABASE_URL=... INQUIRY_TEST_BASE_URL=http://localhost:3000 npx tsx scripts/test-inquiries.ts
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../src/lib/prisma";

async function main() {
  const db = new URL(process.env.DATABASE_URL || "");
  const base = process.env.INQUIRY_TEST_BASE_URL || "http://localhost:3000";
  assert.ok(["localhost", "127.0.0.1"].includes(db.hostname) && db.pathname.endsWith("_test"), "Use a dedicated local _test database");
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname), "Use a local Next server");
  const email = `qa-${randomUUID().slice(0, 8)}@example.test`;
  const body = { submissionId: randomUUID(), email, name: "API test", countryCode: "+86", phone: "18825913441", companyName: "Local QA", message: "Please quote 100 glasses.", sourcePath: "/", website: "" };
  const send = (payload: unknown, headers = {}) => fetch(`${base}/api/inquiries`, { method: "POST", headers: { "Content-Type": "application/json", origin: new URL(base).origin, ...headers }, body: JSON.stringify(payload) });
  try {
    assert.equal((await send({ ...body, email: "bad" })).status, 400);
    assert.equal((await send({ ...body, message: "a".repeat(1001) })).status, 400);
    assert.equal((await send({ ...body, website: "spam" })).status, 400);
    assert.equal((await send(body, { origin: "https://external.example" })).status, 403);
    assert.equal((await send({ ...body, message: "a".repeat(17000) })).status, 413);
    assert.equal((await send(body)).status, 201);
    const retries = await Promise.all([send(body), send(body), send(body)]);
    assert.ok(retries.every((result) => result.status === 201));
    assert.equal(await prisma.inquiry.count({ where: { email } }), 1, "Retries must not create duplicates");
    assert.equal((await send({ ...body, message: "Changed payload" })).status, 409);
    const attempts = await Promise.all(Array.from({ length: 6 }, () => send({ ...body, submissionId: randomUUID() })));
    assert.equal(attempts.filter((result) => result.status === 201).length, 4);
    assert.equal(attempts.filter((result) => result.status === 429).length, 2);
    assert.equal(await prisma.inquiry.count({ where: { email } }), 5);
    const record = await prisma.inquiry.findFirstOrThrow({ where: { email } });
    for (const path of ["/admin/inquiries", `/admin/inquiries/${record.id}`]) {
      const response = await fetch(`${base}${path}`, { redirect: "manual" });
      assert.equal(response.status, 307);
      assert.ok(response.headers.get("location")?.includes("/admin/login"));
    }
    assert.equal((await fetch(`${base}/api/inquiries`)).status, 405, "No public read endpoint");
    console.log("PASS: validation, request size, cross-origin rejection, persistence, concurrent deduplication, rate limit, and admin privacy.");
  } finally {
    await prisma.inquiry.deleteMany({ where: { email } });
  }
}
main().finally(() => prisma.$disconnect());
