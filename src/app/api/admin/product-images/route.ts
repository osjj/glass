import { randomUUID } from "node:crypto";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { uploadImageToR2 } from "@/lib/r2";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return errorResponse("Your admin session has expired. Sign in again.", 401);

  try {
    const formData = await request.formData();
    const image = formData.get("image");
    if (!(image instanceof File) || image.size === 0) {
      return errorResponse("Select an image to upload.", 400);
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return errorResponse("Each source image must be 12 MB or smaller.", 413);
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
      key: `products/${folder}/${Date.now()}-${randomUUID()}.webp`,
    });

    return Response.json({
      image: {
        url: uploaded.url,
        alt: requestedAlt || fallbackAlt || "Product image",
        width: uploaded.width,
        height: uploaded.height,
        storageKey: uploaded.key,
        mimeType: uploaded.contentType,
      },
    });
  } catch (error) {
    console.error("Product image upload failed", error);
    return errorResponse(
      error instanceof Error ? error.message : "The image could not be uploaded.",
      500,
    );
  }
}
