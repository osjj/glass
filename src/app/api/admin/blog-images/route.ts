import { randomUUID } from "node:crypto";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { R2_IMAGE_FORMATS, type R2ImageFormat, uploadImageToR2 } from "@/lib/r2";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_AI_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_UPLOAD_REQUEST_BYTES = 26 * 1024 * 1024;
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return errorResponse("Your admin session has expired. Sign in again.", 401);

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_UPLOAD_REQUEST_BYTES) {
    return errorResponse("The image upload request is too large.", 413);
  }

  try {
    const formData = await request.formData();
    const image = formData.get("image");
    if (!(image instanceof File) || image.size === 0) {
      return errorResponse("Select an image to upload.", 400);
    }
    const aiGenerated = formData.get("aiGenerated") === "true";
    const requestedOutputFormat = String(formData.get("outputFormat") ?? "").trim().toLowerCase();
    if (aiGenerated && !R2_IMAGE_FORMATS.includes(requestedOutputFormat as R2ImageFormat)) {
      return errorResponse("Select a valid AI image output format.", 400);
    }
    if (image.size > (aiGenerated ? MAX_AI_IMAGE_BYTES : MAX_IMAGE_BYTES)) {
      return errorResponse(aiGenerated
        ? "The generated image must be 25 MB or smaller."
        : "The source image must be 12 MB or smaller.", 413);
    }
    if (image.type && !image.type.startsWith("image/")) {
      return errorResponse("Only image files can be uploaded.", 415);
    }

    const requestedSlug = String(formData.get("slug") ?? "").trim().toLowerCase();
    const folder = SAFE_SLUG.test(requestedSlug) ? requestedSlug : "unassigned";
    const requestedAlt = String(formData.get("alt") ?? "").trim().slice(0, 200);
    const fallbackAlt = image.name.replace(/\.[^.]+$/, "").trim().slice(0, 200);
    const uploaded = await uploadImageToR2({
      data: Buffer.from(await image.arrayBuffer()),
      key: `blog/${folder}/${Date.now()}-${randomUUID()}.webp`,
    });

    return Response.json({
      image: {
        url: uploaded.url,
        alt: requestedAlt || fallbackAlt || "Article cover image",
        width: uploaded.width,
        height: uploaded.height,
        storageKey: uploaded.key,
        mimeType: uploaded.contentType,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Blog image upload failed", error instanceof Error ? error.name : "UnknownError");
    return errorResponse(
      "The image could not be uploaded. Check the file and try again.",
      500,
    );
  }
}
