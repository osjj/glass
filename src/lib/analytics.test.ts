import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { isAnalyticsEnabled, trackContactClick, trackGenerateLead } from "./analytics";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalEnvironment = process.env.NODE_ENV;
let calls: unknown[][];
let browser: { location: { hostname: string; pathname: string }; gtag?: (...args: unknown[]) => void };

beforeEach(() => {
  calls = [];
  browser = { location: { hostname: "www.glarivoglass.com", pathname: "/products/glass-cup" }, gtag: (...args) => { calls.push(args); } };
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  Object.assign(process.env, { NODE_ENV: "production" });
});

afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else Reflect.deleteProperty(globalThis, "window");
  if (originalEnvironment === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
  else Object.assign(process.env, { NODE_ENV: originalEnvironment });
});

test("only production visits on the two exact official hosts can use analytics", () => {
  for (const hostname of ["glarivoglass.com", "www.glarivoglass.com"]) {
    browser.location.hostname = hostname;
    assert.equal(isAnalyticsEnabled(), true);
  }
  for (const hostname of ["localhost", "127.0.0.1", "43.172.79.90", "preview.glarivoglass.com", "www.guoyaometal.com", "glarivoglass.com.evil.test", "evilglarivoglass.com"]) {
    browser.location.hostname = hostname;
    assert.equal(isAnalyticsEnabled(), false, hostname);
    trackContactClick({ contactMethod: "email", contactLocation: "header" });
  }
  assert.deepEqual(calls, []);
  browser.location.hostname = "www.glarivoglass.com";
  for (const environment of ["development", "test"]) {
    Object.assign(process.env, { NODE_ENV: environment });
    assert.equal(isAnalyticsEnabled(), false);
  }
  Reflect.deleteProperty(globalThis, "window");
  Object.assign(process.env, { NODE_ENV: "production" });
  assert.equal(isAnalyticsEnabled(), false);
});

test("a saved product lead sends only approved fields to Glarivo, once per submission", () => {
  const input = { submissionId: "lead-product-1", sourcePath: "/blog/buying-guide?email=buyer@example.com#private", productSlug: "glass-cup", email: "buyer@example.com", name: "Private Buyer", phone: "+12345678", companyName: "Private Co", message: "Private message" };
  assert.equal(trackGenerateLead(input), true);
  assert.equal(trackGenerateLead(input), false);
  assert.deepEqual(calls, [["event", "generate_lead", { send_to: "G-ZN5MYTQSBP", form_id: "inquiry_form", lead_type: "product", source_path: "/blog/buying-guide", product_slug: "glass-cup" }]]);
});

test("separate accepted general inquiries are counted separately", () => {
  assert.equal(trackGenerateLead({ submissionId: "lead-general-1", sourcePath: "/about" }), true);
  assert.equal(trackGenerateLead({ submissionId: "lead-general-2", sourcePath: "/about" }), true);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0], ["event", "generate_lead", { send_to: "G-ZN5MYTQSBP", form_id: "inquiry_form", lead_type: "general", source_path: "/about" }]);
});

test("admin visits and unsafe source paths cannot send business events", () => {
  for (const pathname of ["/admin", "/admin/login", "/admin/blog/entry"]) {
    browser.location.pathname = pathname;
    trackGenerateLead({ submissionId: pathname, sourcePath: "/" });
    trackContactClick({ contactMethod: "phone", contactLocation: "footer" });
  }
  browser.location.pathname = "/";
  for (const sourcePath of ["https://outside.test", "//outside.test", "/\\outside.test", "/admin/blog/entry"]) {
    trackGenerateLead({ submissionId: sourcePath, sourcePath });
  }
  assert.deepEqual(calls, []);
});

test("contact intent records method and location without contact addresses or query strings", () => {
  browser.location.pathname = "/products/glass-cup";
  assert.equal(trackContactClick({ contactMethod: "whatsapp", contactLocation: "rail" }), true);
  assert.deepEqual(calls, [["event", "contact_click", { send_to: "G-ZN5MYTQSBP", contact_method: "whatsapp", contact_location: "rail", source_path: "/products/glass-cup" }]]);
});

test("unavailable or throwing analytics cannot break inquiry success or consume deduplication", () => {
  const input = { submissionId: "lead-retry-1", sourcePath: "/" };
  browser.gtag = undefined;
  assert.equal(trackGenerateLead(input), false);
  browser.gtag = () => { throw new Error("Blocked analytics"); };
  assert.equal(trackGenerateLead(input), false);
  assert.equal(trackContactClick({ contactMethod: "email", contactLocation: "header" }), false);
  browser.gtag = (...args) => { calls.push(args); };
  assert.equal(trackGenerateLead(input), true);
  assert.equal(calls.length, 1);
});
