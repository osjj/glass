import { z } from "zod";

export const SALES_EMAIL = "sales@garboglass.com";
export const SALES_WHATSAPP = "https://wa.me/8618825913441";
export const inquiryStatuses = ["NEW", "CONTACTED", "CLOSED", "SPAM"] as const;
export const inquiryStatusLabels = { NEW: "New", CONTACTED: "Contacted", CLOSED: "Closed", SPAM: "Spam" };

export const inquirySchema = z.object({
  submissionId: z.uuid(),
  email: z.email("Enter a valid email address.").max(100).transform((value) => value.toLowerCase()),
  countryCode: z.string().trim().regex(/^(?:\+[1-9]\d{0,3})?$/, "Enter a valid country code, e.g. +86."),
  phone: z.string().trim().max(100).refine((value) => !value || (/^[\d\s().-]+$/.test(value) && value.replace(/\D/g, "").length >= 4 && value.replace(/\D/g, "").length <= 15), "Enter a valid mobile number."),
  name: z.string().trim().min(1, "Enter your name.").max(100),
  companyName: z.string().trim().max(200),
  message: z.string().trim().min(1, "Tell us which products and quantity you need.").max(1000),
  sourcePath: z.string().max(500).regex(/^\/(?!\/)[^?#\\\s]*$/, "Invalid source page."),
  website: z.string().max(0, "Unable to submit this request."),
}).refine((value) => !value.phone || !!value.countryCode, { path: ["countryCode"], message: "Choose a country code for your mobile number." });

export type InquiryContext = { name: string; sku?: string | null };
export type InquiryFormState = { error?: string; success?: boolean };
