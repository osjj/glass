import "server-only";

import { NextResponse } from "next/server";
import sharp from "sharp";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const maxDuration = 180;

const OPENAI_IMAGE_MODEL = "gpt-image-2";
const SOURCE_FETCH_ATTEMPTS = 3;
const SOURCE_FETCH_ATTEMPT_TIMEOUT_MS = 6_000;
const SOURCE_FETCH_RETRY_DELAY_MS = 350;
const GENERATION_TIMEOUT_MS = 145_000;
const MAX_SOURCE_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_GENERATED_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_UPSTREAM_RESPONSE_BYTES = 36 * 1024 * 1024;
const MAX_INPUT_PIXELS = 40_000_000;

const imageSizeSchema = z.enum([
  "auto",
  "1024x1024",
  "1024x1536",
  "1536x1024",
  "2048x2048",
  "2048x1152",
]);
const imageQualitySchema = z.enum(["auto", "low", "medium", "high"]);
const imageFormatSchema = z.enum(["webp", "png", "jpeg"]);
const requestSchema = z
  .object({
    sourceUrl: z.string().trim().min(1).max(2_048),
    prompt: z.string().trim().min(1).max(4_000),
    size: imageSizeSchema,
    quality: imageQualitySchema,
    outputFormat: imageFormatSchema,
  })
  .strict();

type ImageFormat = z.infer<typeof imageFormatSchema>;

const MIME_TYPE_BY_FORMAT: Record<ImageFormat, string> = {
  webp: "image/webp",
  png: "image/png",
  jpeg: "image/jpeg",
};

const FORMAT_BY_SHARP_FORMAT: Partial<Record<string, ImageFormat>> = {
  webp: "webp",
  png: "png",
  jpeg: "jpeg",
};

class RouteError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function createOperationSignal(parentSignal: AbortSignal, timeoutMs: number) {
  const controller = new AbortController();
  let timedOut = false;
  const abortFromParent = () => controller.abort();
  if (parentSignal.aborted) {
    controller.abort();
  } else {
    parentSignal.addEventListener("abort", abortFromParent, { once: true });
  }
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    cleanup: () => {
      clearTimeout(timeout);
      parentSignal.removeEventListener("abort", abortFromParent);
    },
  };
}

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function isLoopbackHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function configuredOrigin(value: string | undefined) {
  if (!value?.trim()) return null;

  try {
    const url = new URL(value.trim());
    if (url.username || url.password) return null;
    if (url.protocol === "https:") return url.origin;
    if (url.protocol === "http:" && isLoopbackHostname(url.hostname)) return url.origin;
    return null;
  } catch {
    return null;
  }
}

function authorizedSourceUrl(value: string, requestUrl: string) {
  const requestLocation = new URL(requestUrl);
  const requestOrigin = requestLocation.origin;
  const allowedOrigins = new Set(
    [configuredOrigin(process.env.NEXT_PUBLIC_SITE_URL), configuredOrigin(process.env.R2_PUBLIC_URL)]
      .filter((origin): origin is string => Boolean(origin)),
  );
  if (allowedOrigins.has(requestOrigin) || isLoopbackHostname(requestLocation.hostname)) {
    allowedOrigins.add(requestOrigin);
  }

  let sourceUrl: URL;
  try {
    sourceUrl = new URL(value, requestOrigin);
  } catch {
    throw new RouteError("Select a valid product image URL.", 400);
  }

  if (
    (sourceUrl.protocol !== "https:" && sourceUrl.protocol !== "http:") ||
    sourceUrl.username ||
    sourceUrl.password ||
    !allowedOrigins.has(sourceUrl.origin)
  ) {
    throw new RouteError("That product image source is not allowed.", 400);
  }

  return sourceUrl.toString();
}

function normalizedMimeType(value: string | null) {
  return value?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}

function formatForMimeType(mimeType: string): ImageFormat | null {
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") return "jpeg";
  return null;
}

async function readLimitedBody(response: Response, maximumBytes: number) {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    throw new RouteError("The image response is too large.", 413);
  }
  if (!response.body) throw new RouteError("The image service returned an empty response.", 502);

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maximumBytes) {
        await reader.cancel();
        throw new RouteError("The image response is too large.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), totalBytes);
}

function waitForSourceRetry(requestSignal: AbortSignal, delayMs: number) {
  return new Promise<void>((resolve, reject) => {
    if (requestSignal.aborted) {
      reject(new RouteError("The image edit request was cancelled.", 499));
      return;
    }

    const abort = () => {
      clearTimeout(timeout);
      reject(new RouteError("The image edit request was cancelled.", 499));
    };
    const timeout = setTimeout(() => {
      requestSignal.removeEventListener("abort", abort);
      resolve();
    }, delayMs);
    requestSignal.addEventListener("abort", abort, { once: true });
  });
}

async function fetchSourceImage(sourceUrl: string, requestSignal: AbortSignal) {
  for (let attempt = 1; attempt <= SOURCE_FETCH_ATTEMPTS; attempt += 1) {
    const operation = createOperationSignal(requestSignal, SOURCE_FETCH_ATTEMPT_TIMEOUT_MS);

    try {
      const response = await fetch(sourceUrl, {
        cache: "no-store",
        credentials: "omit",
        headers: { Accept: "image/webp,image/png,image/jpeg" },
        redirect: "manual",
        signal: operation.signal,
      });

      if (response.status >= 300 && response.status < 400) {
        throw new RouteError("The product image URL redirects and cannot be used.", 400);
      }
      if (!response.ok) {
        throw new RouteError("The original product image could not be loaded.", 400);
      }

      const responseMimeType = normalizedMimeType(response.headers.get("content-type"));
      const responseFormat = formatForMimeType(responseMimeType);
      if (!responseFormat) {
        throw new RouteError("The product image must be a WebP, PNG, or JPEG file.", 415);
      }

      const data = await readLimitedBody(response, MAX_SOURCE_IMAGE_BYTES);
      if (!data.byteLength) throw new RouteError("The original product image is empty.", 400);

      let metadata: sharp.Metadata;
      try {
        metadata = await sharp(data, { failOn: "error", limitInputPixels: MAX_INPUT_PIXELS }).metadata();
      } catch {
        throw new RouteError("The original product image is invalid or too large.", 415);
      }
      const detectedFormat = metadata.format ? FORMAT_BY_SHARP_FORMAT[metadata.format] : undefined;
      if (!metadata.width || !metadata.height || !detectedFormat || detectedFormat !== responseFormat) {
        throw new RouteError("The original product image type could not be verified.", 415);
      }

      return {
        data,
        mimeType: MIME_TYPE_BY_FORMAT[detectedFormat],
        extension: detectedFormat === "jpeg" ? "jpg" : detectedFormat,
      };
    } catch (error) {
      if (error instanceof RouteError) throw error;
      if (requestSignal.aborted) {
        throw new RouteError("The image edit request was cancelled.", 499);
      }
      if (attempt === SOURCE_FETCH_ATTEMPTS) {
        if (operation.timedOut() || (error instanceof Error && error.name === "AbortError")) {
          throw new RouteError("Loading the original product image timed out.", 504);
        }
        throw new RouteError("The original product image could not be loaded.", 502);
      }
      await waitForSourceRetry(requestSignal, SOURCE_FETCH_RETRY_DELAY_MS * attempt);
    } finally {
      operation.cleanup();
    }
  }

  throw new RouteError("The original product image could not be loaded.", 502);
}

function openAiConfiguration() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const endpoint = process.env.OPENAI_API_ENDPOINT?.trim().replace(/\/+$/, "");
  if (!apiKey || !endpoint) {
    throw new RouteError("The AI image service is not configured.", 503);
  }

  let endpointUrl: URL;
  try {
    endpointUrl = new URL(endpoint);
  } catch {
    throw new RouteError("The AI image service endpoint is invalid.", 503);
  }
  if (
    endpointUrl.username ||
    endpointUrl.password ||
    endpointUrl.pathname !== "/" ||
    endpointUrl.search ||
    endpointUrl.hash ||
    (endpointUrl.protocol !== "https:" &&
      !(endpointUrl.protocol === "http:" && isLoopbackHostname(endpointUrl.hostname)))
  ) {
    throw new RouteError("The AI image service endpoint is invalid.", 503);
  }

  return { apiKey, endpoint: endpointUrl.origin };
}

function parseUpstreamJson(data: Buffer) {
  try {
    return JSON.parse(data.toString("utf8")) as unknown;
  } catch {
    throw new RouteError("The AI image service returned an invalid response.", 502);
  }
}

function resultBase64(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("data" in payload) || !Array.isArray(payload.data)) {
    return null;
  }
  const first = payload.data[0];
  if (!first || typeof first !== "object" || !("b64_json" in first)) return null;
  return typeof first.b64_json === "string" ? first.b64_json.trim() : null;
}

async function validateGeneratedImage(base64: string) {
  if (
    !base64 ||
    base64.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)
  ) {
    throw new RouteError("The AI image service returned invalid image data.", 502);
  }

  const data = Buffer.from(base64, "base64");
  if (!data.byteLength || data.byteLength > MAX_GENERATED_IMAGE_BYTES) {
    throw new RouteError("The generated image is empty or too large.", 502);
  }

  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(data, { failOn: "error", limitInputPixels: MAX_INPUT_PIXELS }).metadata();
  } catch {
    throw new RouteError("The AI image service returned an invalid image.", 502);
  }
  const detectedFormat = metadata.format ? FORMAT_BY_SHARP_FORMAT[metadata.format] : undefined;
  if (!metadata.width || !metadata.height || !detectedFormat) {
    throw new RouteError("The AI image output format could not be verified.", 502);
  }

  return {
    b64Json: base64,
    mimeType: MIME_TYPE_BY_FORMAT[detectedFormat],
    format: detectedFormat,
    width: metadata.width,
    height: metadata.height,
  };
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return errorResponse("Your admin session has expired. Sign in again.", 401);

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > 32 * 1024) {
    return errorResponse("The AI image request is too large.", 413);
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return errorResponse("Send the AI image request as JSON.", 415);
  }

  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return errorResponse("Check the image prompt and output options.", 400);

    const sourceUrl = authorizedSourceUrl(parsed.data.sourceUrl, request.url);
    const [sourceImage, configuration] = await Promise.all([
      fetchSourceImage(sourceUrl, request.signal),
      Promise.resolve(openAiConfiguration()),
    ]);

    const body = new FormData();
    body.set(
      "image[]",
      new Blob([Uint8Array.from(sourceImage.data)], { type: sourceImage.mimeType }),
      `product.${sourceImage.extension}`,
    );
    body.set("model", OPENAI_IMAGE_MODEL);
    body.set("prompt", parsed.data.prompt);
    body.set("n", "1");
    body.set("size", parsed.data.size);
    body.set("quality", parsed.data.quality);
    body.set("output_format", parsed.data.outputFormat);

    const generation = createOperationSignal(request.signal, GENERATION_TIMEOUT_MS);
    let response: Response;
    let responseData: Buffer;
    try {
      response = await fetch(`${configuration.endpoint}/v1/images/edits`, {
        method: "POST",
        headers: { Authorization: `Bearer ${configuration.apiKey}` },
        body,
        cache: "no-store",
        redirect: "manual",
        signal: generation.signal,
      });
      responseData = await readLimitedBody(response, MAX_UPSTREAM_RESPONSE_BYTES);
    } catch (error) {
      if (error instanceof RouteError) throw error;
      if (request.signal.aborted) {
        throw new RouteError("The image edit request was cancelled.", 499);
      }
      if (generation.timedOut() || (error instanceof Error && error.name === "AbortError")) {
        throw new RouteError("AI image generation timed out. Try again.", 504);
      }
      throw new RouteError("The AI image service could not be reached.", 502);
    } finally {
      generation.cleanup();
    }

    const payload = parseUpstreamJson(responseData);
    if (!response.ok) {
      console.error("AI product image edit rejected", {
        status: response.status,
        requestId: response.headers.get("x-request-id"),
      });
      const status = response.status === 429
        ? 429
        : response.status === 400 || response.status === 422
          ? 400
          : 502;
      const message = response.status === 429
        ? "The AI image service is busy. Wait a moment and try again."
        : response.status === 400 || response.status === 422
          ? "The AI image request was rejected. Check the prompt and source image."
          : "The AI image service rejected the request.";
      return errorResponse(message, status);
    }

    const base64 = resultBase64(payload);
    if (!base64) throw new RouteError("The AI image service did not return an image.", 502);
    const image = await validateGeneratedImage(base64);

    return NextResponse.json(
      { image },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof RouteError) return errorResponse(error.message, error.status);
    if (error instanceof SyntaxError) return errorResponse("Send a valid JSON request.", 400);
    console.error("AI product image edit failed", error);
    return errorResponse("The product image could not be edited.", 500);
  }
}
