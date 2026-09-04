import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import {
  R2_IMAGE_FORMATS,
  type R2ImageFormat,
  uploadImageToR2,
} from "@/lib/r2";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_AI_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_UPLOAD_REQUEST_BYTES = 26 * 1024 * 1024;
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function isR2ImageFormat(value: string): value is R2ImageFormat {
  return R2_IMAGE_FORMATS.includes(value as R2ImageFormat);
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
    const requestedOutputFormat = String(formData.get("outputFormat") ?? "")
      .trim()
      .toLowerCase();
    const outputFormat: R2ImageFormat = "webp";
    if (aiGenerated) {
      if (!isR2ImageFormat(requestedOutputFormat)) {
        return errorResponse("Select a valid AI image output format.", 400);
      }
    }
    const maxImageBytes = aiGenerated ? MAX_AI_IMAGE_BYTES : MAX_IMAGE_BYTES;
    if (image.size > maxImageBytes) {
      return errorResponse(
        aiGenerated
          ? "The generated image must be 25 MB or smaller."
          : "Each source image must be 12 MB or smaller.",
        413,
      );
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
      key: `products/${folder}/${Date.now()}-${randomUUID()}.${outputFormat}`,
      outputFormat,
    });

    return NextResponse.json({
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
    return errorResponse("The image could not be uploaded.", 500);
  }
}
