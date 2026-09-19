import { z } from "zod";
import { getArticleProductSection, isArticleProduct } from "@/data/article-products";

export const SALES_EMAIL = "sales@glarivoglass.com";
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
  productSlug: z.string().max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid product reference.").optional(),
  website: z.string().max(0, "Unable to submit this request."),
}).refine((value) => !value.phone || !!value.countryCode, { path: ["countryCode"], message: "Choose a country code for your mobile number." });

export type InquiryContext = { name: string; sku?: string | null; slug?: string; brief?: "shot-glass" };
export type InquiryFormState = { error?: string; success?: boolean };

export function inquiryMessage(product?: InquiryContext) {
  if (!product) return "";
  if (product.brief === "shot-glass") return [
    product.slug ? `Product: ${product.sku || product.name}` : "Shot glass sourcing inquiry",
    "Quantity:", "Destination country:", "Target capacity:", "Logo / decoration:", "Packaging:",
  ].join("\n");
  return `I am interested in ${product.name}${product.sku ? ` (Item No. ${product.sku})` : ""}. Quantity: `;
}

export function inquiryAttribution(pathname: string, search: string, product?: InquiryContext) {
  const pageProduct = /^\/products\/([^/]+)$/.exec(pathname)?.[1];
  const articleSlug = new URLSearchParams(search).get("fromArticle");
  const articlePath = articleSlug ? `/blog/${articleSlug}` : "";
  const fromArticle = !!pageProduct && isArticleProduct(articlePath, pageProduct);
  return {
    sourcePath: fromArticle ? articlePath : pathname,
    productSlug: product?.slug || pageProduct,
    brief: product?.brief || (fromArticle && articleSlug ? getArticleProductSection(articleSlug)?.brief : undefined),
  };
}
