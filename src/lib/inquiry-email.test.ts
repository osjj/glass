import assert from "node:assert/strict";
import test from "node:test";
import { buildInquiryEmail, getInquirySmtpConfig, type InquiryEmailRecord } from "./inquiry-email";

const smtp = { SMTP_HOST: "smtp.example.test", SMTP_USER: "smtp-user", SMTP_PASS: "secret-password", SMTP_FROM: "website@example.test" };
const record: InquiryEmailRecord = {
  id: "inquiry-123", email: "buyer@example.test", name: "Buyer", companyName: "Buyer Ltd",
  countryCode: "+86", phone: "188 0000 0000", message: "Please quote 100 glasses.\nLogo: custom",
  sourcePath: "/blog/glass-guide", productName: "Glass cup", productSku: "GL-100",
  createdAt: new Date("2026-10-08T02:00:00Z"),
};

test("SMTP configuration defaults to the sales inbox and selects TLS for port 465", () => {
  assert.equal(getInquirySmtpConfig({}), null);
  assert.equal(getInquirySmtpConfig({ INQUIRY_NOTIFICATION_EMAIL: "sales@example.test" }), null);
  const defaults = getInquirySmtpConfig(smtp)!;
  assert.equal(defaults.to, "sales@glarivoglass.com");
  assert.equal(defaults.port, 587);
  assert.equal(defaults.secure, false);
  assert.equal(getInquirySmtpConfig({ ...smtp, SMTP_PORT: "465" })!.secure, true);
  assert.equal(getInquirySmtpConfig({ ...smtp, INQUIRY_NOTIFICATION_EMAIL: "alerts@example.test" })!.to, "alerts@example.test");
  assert.equal(getInquirySmtpConfig({ ...smtp, SMTP_PASS: "  exact password  " })!.pass, "  exact password  ");
});

test("partial or invalid SMTP configuration fails without exposing secrets", () => {
  for (const changes of [
    { SMTP_HOST: "" }, { SMTP_USER: "" }, { SMTP_PASS: "" }, { SMTP_FROM: "" },
    { SMTP_PORT: "0" }, { SMTP_PORT: "65536" }, { SMTP_PORT: "587oops" },
    { SMTP_SECURE: "yes" }, { SMTP_FROM: "invalid" },
    { INQUIRY_NOTIFICATION_EMAIL: "one@example.test,two@example.test" },
    { SMTP_HOST: "smtp.example.test\ninjected" },
  ]) {
    assert.throws(() => getInquirySmtpConfig({ ...smtp, ...changes }), (error: unknown) => {
      assert.equal((error as Error).message, "Invalid or incomplete inquiry SMTP configuration.");
      return true;
    });
  }
});

test("notifications preserve contacts, product snapshots, multiline message and source/admin links", () => {
  const mail = buildInquiryEmail(record, "https://www.glarivoglass.com");
  assert.equal(mail.subject, "[Glarivo] New inquiry - GL-100 - Buyer Ltd");
  assert.deepEqual(mail.replyTo, { name: "Buyer", address: "buyer@example.test" });
  for (const value of [
    record.email, record.name, record.companyName, record.productName!, record.productSku!,
    record.message, "+86 188 0000 0000", "2026-10-08T02:00:00.000Z",
    "https://www.glarivoglass.com/blog/glass-guide", "https://www.glarivoglass.com/admin/inquiries/inquiry-123",
  ]) assert.ok(mail.text.includes(value), value);
  assert.ok(mail.html.includes("https://www.glarivoglass.com/admin/inquiries/inquiry-123"));
});

test("general inquiries render missing optional data and escape customer HTML/header content", () => {
  const mail = buildInquiryEmail({
    ...record, name: 'Buyer\r\nBcc: "injected"', companyName: "", phone: "", productName: null, productSku: null,
    message: '<img src=x onerror="alert(1)"> & quote\nSecond line',
  }, "https://www.glarivoglass.com");
  assert.ok(mail.text.includes("General inquiry"));
  assert.ok(mail.text.includes("Not provided"));
  assert.ok(mail.html.includes("&lt;img"));
  assert.ok(mail.html.includes("&amp; quote\nSecond line"));
  assert.ok(!mail.html.includes("<img"));
  assert.ok(!/[\r\n]/.test(mail.subject));
  assert.ok(!/[\r\n]/.test(mail.replyTo.name));
});
