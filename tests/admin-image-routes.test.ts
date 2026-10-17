import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import test from "node:test";
import sharp from "sharp";
import ts from "typescript";

type UploadInput = { data: Buffer; key: string; outputFormat?: string };
type Route = { POST: (request: Request) => Promise<Response> };
const requireDependency = createRequire(join(process.cwd(), "package.json"));

// Execute the real route with isolated authentication, network and storage dependencies.
// No database, provider or R2 connection can be reached by these tests.
function loadRoute(name: string, options: {
  authenticated?: boolean;
  fetch?: typeof fetch;
  upload?: (input: UploadInput) => Promise<unknown>;
  logo?: Buffer;
} = {}): Route {
  const filename = join(process.cwd(), "src", "app", "api", "admin", name, "route.ts");
  const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const loadedModule = { exports: {} };
  const dependencies = (id: string) => {
    if (id === "server-only") return {};
    if (id === "@/lib/admin-auth") return {
      getCurrentAdmin: async () => options.authenticated === false ? null : { id: "test-admin" },
    };
    if (id === "@/lib/r2") return {
      R2_IMAGE_FORMATS: ["webp", "png", "jpeg"],
      uploadImageToR2: options.upload ?? (() => { throw new Error("Unexpected storage request"); }),
    };
    if (id === "node:fs/promises") return {
      readFile: async () => {
        assert.ok(options.logo, "Unexpected logo read");
        return options.logo;
      },
    };
    if (["node:path", "node:crypto", "next/server", "sharp", "zod"].includes(id)) return requireDependency(id);
    throw new Error(`Unexpected dependency: ${id}`);
  };
  const execute = new Function("require", "module", "exports", "fetch", "process", "console", compiled.outputText);
  execute(dependencies, loadedModule, loadedModule.exports,
    options.fetch ?? (() => { throw new Error("Unexpected network request"); }),
    { cwd: () => process.cwd(), env: {
      OPENAI_API_KEY: "mock-only-key",
      OPENAI_API_ENDPOINT: "https://provider.test",
      NEXT_PUBLIC_SITE_URL: "https://site.test",
      R2_PUBLIC_URL: "https://media.test",
    } },
    { error: () => {} },
  );
  return loadedModule.exports as Route;
}

const defaultInput = {
  prompt: "A glassware scene",
  size: "1024x1024",
  quality: "medium",
  outputFormat: "png",
  referenceImage: "none",
};

function generationRequest(input: Record<string, unknown> = {}, signal?: AbortSignal) {
  return new Request("https://site.test/api/admin/product-image-ai", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...defaultInput, ...input }), signal,
  });
}

async function imageFixture() {
  return sharp({ create: { width: 2, height: 3, channels: 3, background: "blue" } }).png().toBuffer();
}

test("no reference generates from JSON without fetching a current image", async () => {
  const image = await imageFixture();
  const calls: string[] = [];
  const route = loadRoute("product-image-ai", { fetch: async (url, init) => {
    calls.push(String(url));
    assert.equal(url, "https://provider.test/v1/images/generations");
    assert.equal(new Headers(init?.headers).get("Content-Type"), "application/json");
    assert.deepEqual(JSON.parse(String(init?.body)), {
      model: "gpt-image-2", prompt: defaultInput.prompt, n: 1,
      size: defaultInput.size, quality: defaultInput.quality, output_format: "png",
    });
    return Response.json({ data: [{ b64_json: image.toString("base64") }] });
  } });
  const response = await route.POST(generationRequest());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), { image: {
    b64Json: image.toString("base64"), mimeType: "image/png", format: "png", width: 2, height: 3,
  } });
  assert.equal(calls.length, 1);
});

test("current image and optional logo use multipart edits in reference order", async () => {
  const image = await imageFixture();
  for (const withLogo of [false, true]) {
    const calls: string[] = [];
    const route = loadRoute("product-image-ai", { logo: image, fetch: async (url, init) => {
      calls.push(String(url));
      if (url === "https://media.test/current.png") {
        assert.equal(init?.redirect, "manual");
        assert.equal(init?.credentials, "omit");
        return new Response(new Uint8Array(image), { headers: { "Content-Type": "image/png" } });
      }
      assert.equal(url, "https://provider.test/v1/images/edits");
      assert.ok(init?.body instanceof FormData);
      const images = init.body.getAll("image[]") as File[];
      assert.equal(images.length, withLogo ? 2 : 1);
      assert.equal(images[0].name, "source.png");
      assert.deepEqual(Buffer.from(await images[0].arrayBuffer()), image);
      if (withLogo) assert.equal(images[1].name, "glarivo-logo-blue.png");
      assert.equal(new Headers(init.headers).has("Content-Type"), false);
      return Response.json({ data: [{ b64_json: image.toString("base64") }] });
    } });
    const response = await route.POST(generationRequest({
      sourceUrl: "https://media.test/current.png",
      referenceImage: withLogo ? "glarivo-blue-logo" : "none",
    }));
    assert.equal(response.status, 200);
    assert.equal(calls.length, 2);
  }
});

test("logo-only generation sends no current image and identifies the logo correctly", async () => {
  const image = await imageFixture();
  let calls = 0;
  const route = loadRoute("product-image-ai", { logo: image, fetch: async (url, init) => {
    calls += 1;
    assert.equal(url, "https://provider.test/v1/images/edits");
    assert.ok(init?.body instanceof FormData);
    const images = init.body.getAll("image[]") as File[];
    assert.equal(images.length, 1);
    assert.equal(images[0].name, "glarivo-logo-blue.png");
    assert.match(String(init.body.get("prompt")), /not the scene to edit/);
    return Response.json({ data: [{ b64_json: image.toString("base64") }] });
  } });
  assert.equal((await route.POST(generationRequest({ referenceImage: "glarivo-blue-logo" }))).status, 200);
  assert.equal(calls, 1);
});

test("image routes reject unauthorized users before network or storage access", async () => {
  for (const name of ["product-image-ai", "blog-images", "case-study-images"]) {
    assert.equal((await loadRoute(name, { authenticated: false }).POST(generationRequest())).status, 401);
  }
});

test("source allowlist and strict request validation remain enforced", async () => {
  const route = loadRoute("product-image-ai");
  for (const sourceUrl of ["https://other.test/image.png", "http://169.254.169.254/image", "https://user:pass@media.test/image.png", "", "data:image/png;base64,AAAA"]) {
    assert.equal((await route.POST(generationRequest({ sourceUrl }))).status, 400, sourceUrl);
  }
  for (const input of [{ sourceUrl: null }, { prompt: "" }, { quality: "invalid" }, { unexpected: true }]) {
    assert.equal((await route.POST(generationRequest(input))).status, 400);
  }
});

test("redirecting and invalid reference images never reach the image provider", async () => {
  for (const sourceResponse of [
    new Response(null, { status: 302, headers: { Location: "https://other.test/image.png" } }),
    new Response("bad image", { headers: { "Content-Type": "image/png" } }),
  ]) {
    let calls = 0;
    const route = loadRoute("product-image-ai", { fetch: async (url) => {
      calls += 1;
      assert.equal(url, "https://media.test/current.png");
      return sourceResponse;
    } });
    const response = await route.POST(generationRequest({ sourceUrl: "https://media.test/current.png" }));
    assert.ok([400, 415].includes(response.status));
    assert.equal(calls, 1);
  }
});

test("no-reference generation preserves cancellation and output validation", async () => {
  const controller = new AbortController();
  controller.abort();
  const cancelled = loadRoute("product-image-ai", { fetch: async (_url, init) => {
    assert.equal(init?.signal?.aborted, true);
    throw new DOMException("Aborted", "AbortError");
  } });
  assert.equal((await cancelled.POST(generationRequest({}, controller.signal))).status, 499);
  const invalid = loadRoute("product-image-ai", { fetch: async () => Response.json({ data: [{ b64_json: "AAAA" }] }) });
  assert.equal((await invalid.POST(generationRequest())).status, 502);
});

function uploadRequest(name: string, size: number, options: { ai?: boolean; format?: string; slug?: string } = {}) {
  const form = new FormData();
  form.set("image", new File([new Uint8Array(size)], "image.png", { type: "image/png" }));
  form.set("slug", options.slug ?? "article-slug");
  form.set("alt", "Preserve this image description");
  if (options.ai) form.set("aiGenerated", "true");
  if (options.format) form.set("outputFormat", options.format);
  return new Request(`https://site.test/api/admin/${name}`, { method: "POST", body: form });
}

test("blog and case uploads accept large AI images in their own folders and preserve alt", async () => {
  for (const [name, folder] of [["blog-images", "blog"], ["case-study-images", "case-studies"]]) {
    let calls = 0;
    let savedKey = "";
    const route = loadRoute(name, { upload: async (input) => {
      calls += 1;
      assert.equal(input.data.byteLength, 12 * 1024 * 1024 + 1);
      assert.match(input.key, new RegExp(`^${folder}/article-slug/[^/]+\\.webp$`));
      savedKey = input.key;
      return { url: "https://media.test/result.webp", width: 1536, height: 1024, key: input.key, contentType: "image/webp" };
    } });
    const response = await route.POST(uploadRequest(name, 12 * 1024 * 1024 + 1, { ai: true, format: "png" }));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(await response.json(), { image: {
      url: "https://media.test/result.webp", alt: "Preserve this image description",
      width: 1536, height: 1024, storageKey: savedKey, mimeType: "image/webp",
    } });
    assert.equal(calls, 1);
  }
});

test("blog and case uploads enforce regular and AI size and format limits before storage", async () => {
  for (const name of ["blog-images", "case-study-images"]) {
    const route = loadRoute(name);
    assert.equal((await route.POST(uploadRequest(name, 12 * 1024 * 1024 + 1))).status, 413);
    assert.equal((await route.POST(uploadRequest(name, 25 * 1024 * 1024 + 1, { ai: true, format: "png" }))).status, 413);
    assert.equal((await route.POST(uploadRequest(name, 1, { ai: true, format: "gif" }))).status, 400);
  }
});
