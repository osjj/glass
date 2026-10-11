import { config as loadEnv } from "dotenv";
import nodemailer from "nodemailer";
import { getInquirySmtpConfig } from "../src/lib/inquiry-email";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

async function main() {
  const config = getInquirySmtpConfig(process.env);
  if (!config) throw new Error("SMTP is not configured.");
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
  });
  await transporter.verify();
  console.log("SMTP connection, TLS and authentication verified. No email was sent; inbox delivery still needs a form submission check.");
}

main().catch(() => {
  console.error("SMTP verification failed. Check SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS and SMTP_FROM.");
  process.exitCode = 1;
});
