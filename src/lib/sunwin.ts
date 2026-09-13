import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { load } from "cheerio";
import type { GarboCandidateField, GarboCategorySource, GarboParsedProduct } from "@/lib/garbo-shot-glass";

export const SUNWIN_BASE_URL = "https://www.sunwin2001.com";
export const SUNWIN_CATEGORIES = [
  { id: 10, name: "Essential Oil Bottles", sourceName: "精油瓶", slug: "essential-oil-bottles" },
  { id: 9, name: "Perfume Bottles", sourceName: "香水瓶", slug: "perfume-bottles" },
  { id: 11, name: "Foundation Bottles", sourceName: "粉底瓶", slug: "foundation-bottles" },
] as const;
export type CatalogProvider = "GARBO" | "SUNWIN";
export type SunwinSource = GarboCategorySource & { provider: "SUNWIN"; name: string; sourceName: string };

export function assertSunwinUrl(value: string, kind: "html" | "image" = "html") {
  const url = new URL(value);
  if (url.origin !== SUNWIN_BASE_URL || url.username || url.password || url.hash) {
    throw new Error("Only canonical Sunwin HTTPS URLs are allowed.");
  }
  const pathAllowed = kind === "image"
    ? /^\/upload\/images\/product\/[a-zA-Z0-9/_-]+\.(?:png|jpe?g|webp)$/i.test(url.pathname)
    : /^\/(?:product_category\/(?:9|10|11)|products\/\d+)\.html$/.test(url.pathname);
  const page = url.searchParams.get("page");
  if (!pathAllowed || [...url.searchParams.keys()].some((key) => key !== "page") ||
    (page !== null && (kind === "image" || !url.pathname.startsWith("/product_category/") || !/^[1-9]\d?$/.test(page)))) {
    throw new Error("The URL is outside the configured Sunwin catalog.");
  }
  return url;
}

export function parseSunwinCategorySource(value: string): SunwinSource {
  const url = assertSunwinUrl(value);
  const category = SUNWIN_CATEGORIES.find((item) => url.pathname === `/product_category/${item.id}.html`);
  if (!category || url.search) throw new Error("Choose one of the three configured Sunwin categories.");
  return { provider: "SUNWIN", url: url.href, path: url.pathname, slug: category.slug, name: category.name, sourceName: category.sourceName };
}

// No automatic redirects: a remote redirect must never expand the host/path allowlist.
export async function fetchSunwinResource(value: string, kind: "html" | "image" = "html") {
  const url = assertSunwinUrl(value, kind);
  const maxBytes = kind === "html" ? 2_000_000 : 12 * 1024 * 1024;
  const marker = "\n__SUNWIN_RESPONSE__";
  const executable = process.platform === "win32" ? "curl.exe" : "curl";
  return new Promise<Buffer>((resolve, reject) => {
    execFile(executable, ["--silent", "--show-error", "--fail", "--connect-timeout", "10", "--max-time", "30",
      "--max-filesize", String(maxBytes), "-H", "Cache-Control: no-cache", "-H", "Accept: */*",
      "-w", `${marker}%{http_code}|%{content_type}`, url.href],
    { encoding: "buffer", maxBuffer: maxBytes + 1024, windowsHide: true }, (error, stdout) => {
      if (error) { reject(new Error(`Sunwin download failed: ${url.pathname}`)); return; }
      const index = stdout.lastIndexOf(Buffer.from(marker));
      const meta = stdout.subarray(index + marker.length).toString("utf8");
      const [status, contentType] = meta.split("|");
      const expectedType = kind === "html" ? /^(?:text\/html|application\/xhtml\+xml)/ : /^image\//;
      if (index < 1 || index > maxBytes || status !== "200" || !expectedType.test(contentType || "")) {
        reject(new Error(`Unexpected Sunwin response for ${url.pathname}`)); return;
      }
      resolve(stdout.subarray(0, index));
    });
  });
}

export function extractSunwinCategoryLinks(html: string, pageUrl: string, source: SunwinSource) {
  const $ = load(html);
  if (!$('title').text().startsWith(`${source.sourceName}-`)) {
    throw new Error(`Sunwin returned the wrong category for ${source.path}; retry the scan.`);
  }
  const currentPage = $(".page.on").first().text().trim();
  const requestedPage = new URL(pageUrl).searchParams.get("page") || "1";
  if (currentPage && currentPage !== requestedPage) throw new Error("Sunwin returned a stale pagination page; retry the scan.");
  const productUrls = new Set<string>();
  const categoryPages = new Set<string>();
  $('a[href]').each((_, element) => {
    try {
      const url = assertSunwinUrl(new URL($(element).attr("href")!, pageUrl).href);
      if (/^\/products\/\d+\.html$/.test(url.pathname)) productUrls.add(url.href);
      if (url.pathname === source.path) {
        if (url.searchParams.get("page") === "1") url.search = "";
        categoryPages.add(url.href);
      }
    } catch { /* Navigation outside the selected catalog is not part of discovery. */ }
  });
  return { productUrls: [...productUrls], categoryPages: [...categoryPages] };
}

export async function discoverSunwinProductUrls(source: SunwinSource) {
  const queue = [source.url];
  const pages = new Set<string>();
  const products = new Set<string>();
  while (queue.length) {
    const url = queue.shift()!;
    if (pages.has(url)) continue;
    if (pages.size >= 30) throw new Error("Sunwin pagination exceeded 30 pages; no import started.");
    let links: ReturnType<typeof extractSunwinCategoryLinks> | undefined;
    let lastError: unknown;
    for (let attempt = 0; attempt < 3 && !links; attempt++) {
      try { links = extractSunwinCategoryLinks((await fetchSunwinResource(url)).toString("utf8"), url, source); }
      catch (error) { lastError = error; }
    }
    if (!links) throw lastError;
    pages.add(url);
    links.productUrls.forEach((item) => products.add(item));
    links.categoryPages.forEach((item) => { if (!pages.has(item) && !queue.includes(item)) queue.push(item); });
    if (products.size > 500) throw new Error("Sunwin discovery exceeded 500 products.");
  }
  if (!products.size) throw new Error("No Sunwin products found; check the source layout.");
  return { categoryPages: [...pages], productUrls: [...products] };
}

const clean = (value: string) => value.replace(/\s+/g, " ").trim();

export function parseSunwinProduct(sourceUrl: string, html: string, source: SunwinSource): GarboParsedProduct {
  assertSunwinUrl(sourceUrl);
  const $ = load(html);
  const sourceTitle = clean($(".pt").first().text());
  if (!sourceTitle || !$("title").text().startsWith(`${sourceTitle}-`)) throw new Error("Sunwin product title is missing or inconsistent.");
  // The SEO suffix mentions several categories; use only the category immediately after the product title.
  const categoryName = $("title").text().slice(sourceTitle.length + 1).split("-")[0];
  const sourceCategory = SUNWIN_CATEGORIES.find((item) => categoryName === item.sourceName);
  if (!sourceCategory) throw new Error("Sunwin product is outside the three configured categories.");
  const models = [...new Set(sourceTitle.match(/(?:SW-\d+|[SA]\d+)(?:[A-Z])?(?:[~～](?:[SA]\d+))?/gi) ?? [])];
  const shape = [["扁方", "Flat Square"], ["方形", "Square"], ["圆形", "Round"], ["楞形", "Faceted"]].find(([label]) => sourceTitle.includes(label))?.[1];
  const name = [models.join(" / ") || "Cosmetic Glass", shape, sourceCategory.name.replace(/Bottles$/, "Bottle")].filter(Boolean).join(" ");
  const rawCapacity = clean($(".xli").filter((_, e) => $(e).text().includes("容量规格")).first().text().replace(/^.*?容量规格[：:]/, ""));
  const capacity = rawCapacity.replace(/（内胆）|\(内胆\)/g, " (inner container)").replace(/毫升/g, " ml").replace(/克/g, " g").replace(/ML/g, "ml");
  const warnings: string[] = [];
  if (/[\u3400-\u9fff]/.test(capacity)) warnings.push("Capacity contains untranslated source text; review before publishing.");
  if (models.length !== 1 || /[~～]/.test(models[0] || "")) warnings.push("Multiple models or a model range: retained as a series; no individual variant sizes inferred.");
  if (!capacity) warnings.push("The source does not state capacity.");
  const galleryImages = new Set<string>();
  const detailImages = new Set<string>();
  $("header,footer,.nanner,.crumbs").remove();
  $("[data-src],img[src]").each((_, element) => {
    const value = $(element).attr("data-src") || $(element).attr("src");
    if (!value) return;
    try {
      const imageUrl = assertSunwinUrl(new URL(value, SUNWIN_BASE_URL).href, "image").href;
      ($(element).closest(".petmglis").length ? detailImages : galleryImages).add(imageUrl);
    } catch { /* Exclude logos, QR codes and site banners. */ }
  });
  if (!galleryImages.size) throw new Error("No Sunwin product images found; check the source layout.");
  const summary = `${name}${capacity ? `. Capacity / size options: ${capacity}` : ""}. Request a quotation for packaging and order details.`;
  const description = `${summary} Confirm the selected model, closure, dimensions and packaging before ordering.`;
  const sourceSku = models.length === 1 && !/[~～]/.test(models[0]) ? models[0] : null;
  const fields: GarboCandidateField[] = [];
  const add = (fieldKey: string, label: string, rawValue: string, normalizedValue = rawValue) => {
    if (rawValue) fields.push({ fieldKey, label, rawValue, normalizedValue, unit: null, status: "UNREVIEWED", note: null, sortOrder: fields.length * 10 });
  };
  add("name", "Product name", sourceTitle, name);
  if (sourceSku) add("item_no", "Item No.", sourceSku);
  add("summary", "Short summary", summary);
  add("description", "Description", description);
  add("capacity", "Capacity / size options", rawCapacity, capacity);
  add("gallery_images", "Source product images", [...galleryImages].join("\n"));
  add("detail_images", "Source detail images", [...detailImages].join("\n"));
  const normalizedPayload: GarboParsedProduct["normalizedPayload"] = {
    version: 1 as const, sourceCategorySlug: source.slug, sourceCategoryPath: source.path,
    slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${new URL(sourceUrl).pathname.match(/\d+/)![0]}`,
    name, sourceSku, summary, description, specificationValues: capacity ? { capacity } : {}, detailBullets: [] as string[], galleryImages: [...galleryImages],
    detailImages: [...detailImages].map((url, index) => ({ url, alt: `${name} - product detail ${index + 1}`, sectionKey: "sunwin_details" })),
  };
  const rawPayload = { parserVersion: 1, sourceUrl, sourceTitle, capacity: rawCapacity, galleryImages: [...galleryImages], detailImages: [...detailImages] };
  return { sourceUrl, sourceTitle, sourceSku, sourceLastModifiedAt: null, rawPayload, normalizedPayload, fields, warnings,
    sourceHash: createHash("sha256").update(JSON.stringify({ rawPayload, name, summary, description })).digest("hex"), conflictCount: 0 };
}

export async function fetchAndParseSunwinProduct(url: string, source: SunwinSource) {
  return parseSunwinProduct(url, (await fetchSunwinResource(url)).toString("utf8"), source);
}
