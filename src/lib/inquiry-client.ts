import type { z } from "zod";
import type { inquirySchema } from "./inquiries";
import { trackGenerateLead } from "./analytics";

export async function submitInquiry(payload: z.infer<typeof inquirySchema>): Promise<void> {
  const response = await fetch("/api/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20000),
  });
  const data: unknown = await response.json();
  const result = data !== null && typeof data === "object" && !Array.isArray(data)
    ? data as Record<string, unknown>
    : null;
  if (!response.ok || result?.success !== true) {
    throw new Error(typeof result?.error === "string" && result.error
      ? result.error
      : "Your request could not be saved. Please try again.");
  }
  trackGenerateLead({
    submissionId: payload.submissionId,
    sourcePath: payload.sourcePath,
    productSlug: payload.productSlug,
  });
}
