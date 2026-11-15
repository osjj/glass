import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, test } from "node:test";
import { submitInquiry } from "./inquiry-client";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalFetch = Object.getOwnPropertyDescriptor(globalThis, "fetch");
const originalEnvironment = process.env.NODE_ENV;
const fallbackError = "Your request could not be saved. Please try again.";
let calls: unknown[][];
let payload: Parameters<typeof submitInquiry>[0];
let browser: { location: { hostname: string; pathname: string }; gtag?: (...args: unknown[]) => void };

beforeEach(() => {
  calls = [];
  payload = {
    submissionId: randomUUID(), email: "buyer@example.test", countryCode: "+1", phone: "202 555 0100",
    name: "Private Buyer", companyName: "Private Company", message: "Please quote 100 glasses.",
    sourcePath: "/products/glass-cup", productSlug: "glass-cup", website: "",
  };
  browser = {
    location: { hostname: "www.glarivoglass.com", pathname: "/products/glass-cup" },
    gtag: (...args) => { calls.push(args); },
  };
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  Object.defineProperty(globalThis, "fetch", {
    configurable: true, writable: true,
    value: async () => { throw new Error("A test attempted an unexpected fetch."); },
  });
  Object.assign(process.env, { NODE_ENV: "production" });
});

afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else Reflect.deleteProperty(globalThis, "window");
  if (originalFetch) Object.defineProperty(globalThis, "fetch", originalFetch);
  else Reflect.deleteProperty(globalThis, "fetch");
  if (originalEnvironment === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
  else Object.assign(process.env, { NODE_ENV: originalEnvironment });
});

function respondWith(body: unknown, status = 201) {
  globalThis.fetch = async () => Response.json(body, { status });
}

test("only a confirmed saved response emits a lead, using the existing request contract without a returned ID", async () => {
  let release: (response: Response) => void = () => { throw new Error("Fetch did not start."); };
  let requestUrl: Parameters<typeof fetch>[0] | undefined;
  let requestOptions: RequestInit | undefined;
  globalThis.fetch = (url, options) => {
    requestUrl = url;
    requestOptions = options;
    return new Promise<Response>((resolve) => { release = resolve; });
  };

  const submission = submitInquiry(payload);
  assert.deepEqual(calls, []);
  assert.equal(requestUrl, "/api/inquiries");
  assert.equal(requestOptions?.method, "POST");
  assert.deepEqual(requestOptions?.headers, { "Content-Type": "application/json" });
  assert.deepEqual(JSON.parse(String(requestOptions?.body)), payload);
  assert.ok(requestOptions?.signal instanceof AbortSignal);
  assert.equal(requestOptions.signal.aborted, false);
  release(Response.json({ success: true }, { status: 201 }));
  assert.equal(await submission, undefined);

  assert.deepEqual(calls, [["event", "generate_lead", {
    send_to: "G-ZN5MYTQSBP", form_id: "inquiry_form", lead_type: "product",
    source_path: "/products/glass-cup", product_slug: "glass-cup",
  }]]);
});

test("repeating one saved submission counts one lead", async () => {
  respondWith({ success: true });
  await submitInquiry(payload);
  await submitInquiry(payload);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1], "generate_lead");
});

test("different saved submission UUIDs count separately, including a general inquiry", async () => {
  respondWith({ success: true });
  await submitInquiry(payload);
  await submitInquiry({ ...payload, submissionId: randomUUID(), sourcePath: "/about", productSlug: undefined });
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1], ["event", "generate_lead", {
    send_to: "G-ZN5MYTQSBP", form_id: "inquiry_form", lead_type: "general", source_path: "/about",
  }]);
});

for (const status of [400, 403, 409, 429, 503]) {
  test(`HTTP ${status} rejects with the server message and never emits a lead, even with success true`, async () => {
    respondWith({ success: true, error: `Server rejected ${status}.` }, status);
    await assert.rejects(submitInquiry(payload), { message: `Server rejected ${status}.` });
    assert.deepEqual(calls, []);
  });
}

for (const [label, body] of [
  ["success false", { success: false }],
  ["missing success", {}],
  ["string success", { success: "true" }],
  ["null success", { success: null }],
  ["null JSON", null],
  ["array JSON", [{ success: true }]],
] as const) {
  test(`HTTP 200 with ${label} rejects without an analytics event`, async () => {
    respondWith(body, 200);
    await assert.rejects(submitInquiry(payload), { message: fallbackError });
    assert.deepEqual(calls, []);
  });
}

test("a failed success flag preserves a string error from an otherwise OK response", async () => {
  respondWith({ success: false, error: "Please try again later." }, 200);
  await assert.rejects(submitInquiry(payload), { message: "Please try again later." });
  assert.deepEqual(calls, []);
});

test("missing, non-string, and empty server errors use the existing fallback", async () => {
  for (const body of [{}, { error: null }, { error: 123 }, { error: "" }]) {
    respondWith(body, 400);
    await assert.rejects(submitInquiry(payload), { message: fallbackError });
  }
  assert.deepEqual(calls, []);
});

test("malformed response JSON rejects before any analytics event", async () => {
  globalThis.fetch = async () => new Response("not valid JSON", { status: 201 });
  await assert.rejects(submitInquiry(payload), SyntaxError);
  assert.deepEqual(calls, []);
});

test("a fetch timeout keeps its error identity for the UI and emits no lead", async () => {
  const failure = new DOMException("The request timed out.", "TimeoutError");
  globalThis.fetch = async () => { throw failure; };
  await assert.rejects(submitInquiry(payload), (cause) => cause === failure);
  assert.deepEqual(calls, []);
});

test("a network failure keeps its error identity and emits no lead", async () => {
  const failure = new TypeError("Failed to fetch");
  globalThis.fetch = async () => { throw failure; };
  await assert.rejects(submitInquiry(payload), (cause) => cause === failure);
  assert.deepEqual(calls, []);
});

test("an accepted inquiry still resolves when gtag is unavailable", async () => {
  respondWith({ success: true });
  browser.gtag = undefined;
  await assert.doesNotReject(submitInquiry(payload));
  assert.deepEqual(calls, []);
});

test("an accepted inquiry still resolves when gtag throws", async () => {
  respondWith({ success: true });
  browser.gtag = () => { throw new Error("Analytics is blocked."); };
  await assert.doesNotReject(submitInquiry(payload));
  assert.deepEqual(calls, []);
});
