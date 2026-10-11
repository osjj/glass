import { z } from "zod";
import { SALES_EMAIL } from "./inquiries";
import { getSiteUrl } from "./site-url";

export type InquiryEmailRecord = {
  id: string;
  email: string;
  countryCode: string;
  phone: string;
  name: string;
  companyName: string;
  message: string;
  sourcePath: string;
  productName: string | null;
  productSku: string | null;
  createdAt: Date;
};

const smtpConfigSchema = z.object({
  host: z.string().trim().min(1).regex(/^[^\s/]+$/),
  port: z.coerce.number().int().min(1).max(65535),
  secure: z.enum(["true", "false"]).optional(),
  user: z.string().trim().min(1),
  pass: z.string().min(1),
  from: z.email(),
  to: z.email(),
});

export function getInquirySmtpConfig(env: Record<string, string | undefined>) {
  if (![env.SMTP_HOST, env.SMTP_USER, env.SMTP_PASS, env.SMTP_FROM].some((value) => value?.trim())) return null;
  const parsed = smtpConfigSchema.safeParse({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT?.trim() || "587",
    secure: env.SMTP_SECURE?.trim() || undefined,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.SMTP_FROM?.trim(),
    to: env.INQUIRY_NOTIFICATION_EMAIL?.trim() || SALES_EMAIL,
  });
  // Never include credentials or addresses in configuration errors.
  if (!parsed.success) throw new Error("Invalid or incomplete inquiry SMTP configuration.");
  const { secure, ...config } = parsed.data;
  return { ...config, secure: secure ? secure === "true" : config.port === 465 };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

function headerText(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
}

export function buildInquiryEmail(record: InquiryEmailRecord, siteUrl = getSiteUrl()) {
  const origin = new URL(siteUrl).origin;
  const adminUrl = origin + "/admin/inquiries/" + encodeURIComponent(record.id);
  // Stored paths have already passed the public inquiry schema.
  const sourceUrl = origin + record.sourcePath;
  const fields = [
    ["Inquiry ID", record.id],
    ["Received (UTC)", record.createdAt.toISOString()],
    ["Name", record.name],
    ["Email", record.email],
    ["Mobile / WhatsApp", record.phone ? record.countryCode + " " + record.phone : "Not provided"],
    ["Company", record.companyName || "Not provided"],
    ["Product", record.productName || "General inquiry"],
    ["Item No.", record.productSku || "Not provided"],
  ];
  return {
    subject: "[Glarivo] New inquiry" + (record.productSku ? " - " + headerText(record.productSku) : "") + " - " + headerText(record.companyName || record.name),
    replyTo: { name: headerText(record.name), address: record.email },
    text: [
      "A new customer inquiry has been saved in the Glarivo admin.",
      ...fields.map(([label, value]) => label + ": " + value),
      "", "Message:", record.message, "",
      "Source page: " + sourceUrl,
      "View and follow up: " + adminUrl,
    ].join("\n"),
    html: [
      '<div style="font-family:Arial,sans-serif;color:#202b35;line-height:1.6;max-width:680px">',
      "<h1>New customer inquiry</h1>",
      "<p>This inquiry has been saved in the Glarivo admin.</p>",
      '<table style="border-collapse:collapse;width:100%">',
      ...fields.map(([label, value]) => '<tr><th style="text-align:left;vertical-align:top;padding:6px 16px 6px 0">' + escapeHtml(label) + '</th><td style="padding:6px 0;overflow-wrap:anywhere">' + escapeHtml(value) + "</td></tr>"),
      "</table><h2>Message</h2>",
      '<p style="white-space:pre-wrap;overflow-wrap:anywhere">' + escapeHtml(record.message) + "</p>",
      '<p>Source page: <a href="' + escapeHtml(sourceUrl) + '">' + escapeHtml(record.sourcePath) + "</a></p>",
      '<p><a href="' + escapeHtml(adminUrl) + '">View inquiry in admin</a></p>',
      "</div>",
    ].join(""),
  };
}
