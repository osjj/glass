import { inquirySchema } from "@/lib/inquiries";
import { storeInquiry } from "@/lib/inquiry-storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  // Next may normalize request.url to localhost. Compare the browser's origin
  // with the original HTTP host/scheme preserved by Next/the reverse proxy.
  const host = request.headers.get("x-forwarded-host")?.split(",")[0].trim() || request.headers.get("host") || new URL(request.url).host;
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || new URL(request.url).protocol.replace(":", "");
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== `${protocol}://${host}`)) {
    return Response.json({ error: "Please submit from this website." }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return Response.json({ error: "Expected JSON." }, { status: 415 });
  }
  let payload: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Missing body");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) {
        await reader.cancel();
        return Response.json({ error: "Request is too large." }, { status: 413 });
      }
      chunks.push(value);
    }
    payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = inquirySchema.safeParse(payload);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  try {
    const result = await storeInquiry(parsed.data);
    if (result === "limited") return Response.json({ error: "Too many requests. Please try again in an hour or contact us directly." }, { status: 429, headers: { "Retry-After": "3600" } });
    if (result === "conflict") return Response.json({ error: "This request has already been submitted. Close and reopen the form to send a new inquiry." }, { status: 409 });
    return Response.json({ success: true }, { status: 201 });
  } catch {
    // Do not log customer contact details or return database errors.
    console.error("Inquiry submission could not be saved.");
    return Response.json({ error: "We could not save your request. Please try again or contact us by Email or WhatsApp." }, { status: 503 });
  }
}
