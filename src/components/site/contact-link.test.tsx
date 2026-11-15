import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import type { MouseEvent } from "react";
import { ContactLink } from "./contact-link";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalEnvironment = process.env.NODE_ENV;
let calls: unknown[][];

beforeEach(() => {
  calls = [];
  Object.defineProperty(globalThis, "window", { configurable: true, value: { location: { hostname: "www.glarivoglass.com", pathname: "/" }, gtag: (...args: unknown[]) => { calls.push(args); } } });
  Object.assign(process.env, { NODE_ENV: "production" });
});
afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
  else Reflect.deleteProperty(globalThis, "window");
  if (originalEnvironment === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
  else Object.assign(process.env, { NODE_ENV: originalEnvironment });
});

test("sales links preserve native navigation and emit one explicit contact intent", () => {
  const link = ContactLink({ href: "https://wa.me/8618825913441", target: "_blank", rel: "noopener noreferrer", className: "original", children: "WhatsApp", contactMethod: "whatsapp", contactLocation: "rail" });
  const event = { defaultPrevented: false } as MouseEvent<HTMLAnchorElement>;
  link.props.onClick(event);
  assert.equal(event.defaultPrevented, false);
  assert.equal(link.props.href, "https://wa.me/8618825913441");
  assert.equal(link.props.target, "_blank");
  assert.equal(link.props.rel, "noopener noreferrer");
  assert.equal(link.props.className, "original");
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1], "contact_click");
  assert.equal("contactMethod" in link.props, false);
});

test("a prevented link activation is not counted as contact intent", () => {
  const link = ContactLink({ href: "mailto:sales@glarivoglass.com", children: "Email", contactMethod: "email", contactLocation: "header", onClick: (event) => event.preventDefault() });
  const event = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
  link.props.onClick(event as unknown as MouseEvent<HTMLAnchorElement>);
  assert.equal(event.defaultPrevented, true);
  assert.deepEqual(calls, []);
});
