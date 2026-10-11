import "server-only";
import nodemailer from "nodemailer";
import { buildInquiryEmail, getInquirySmtpConfig, type InquiryEmailRecord } from "./inquiry-email";

export async function notifyInquiryByEmail(record: InquiryEmailRecord) {
  try {
    const config = getInquirySmtpConfig(process.env);
    if (!config) {
      console.warn("Inquiry email notification skipped: SMTP is not configured.");
      return;
    }
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      requireTLS: !config.secure,
      auth: { user: config.user, pass: config.pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      dnsTimeout: 10000,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    const result = await transporter.sendMail({
      from: { name: "Glarivo website", address: config.from },
      to: config.to,
      ...buildInquiryEmail(record),
    });
    if (!result.accepted.length || result.rejected.length) throw new Error("SMTP did not accept the notification.");
  } catch {
    // SMTP errors can contain credentials and customer data. Keep logs generic.
    // The inquiry is already committed; mail failure must not fail the submission.
    console.error("Inquiry email notification failed. Check SMTP configuration and delivery service. Inquiry ID: " + record.id);
  }
}
