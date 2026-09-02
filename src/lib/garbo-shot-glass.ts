import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { load } from "cheerio";
import { z } from "zod";

export const GARBO_PROVIDER = "GARBO" as const;
export const GARBO_BASE_URL = "https://www.garboglass.com";
export const GARBO_SHOT_GLASS_PATH = "/shot-glass/";
export const GARBO_SHOT_GLASS_SLUG = "shot-glass";
export const GARBO_SHOT_GLASS_URL = `${GARBO_BASE_URL}${GARBO_SHOT_GLASS_PATH}`;

const GARBO_HOSTS = new Set(["garboglass.com", "www.garboglass.com"]);
const MAX_CATEGORY_PAGES = 50;
const MAX_PRODUCT_URLS = 500;
const MAX_HTML_BYTES = 2_000_000;
const MAX_REVIEW_VALUE_LENGTH = 2_000;
const IMAGE_PATTERN = /\.(?:avif|gif|jpe?g|png|webp)(?:$|\?)/i;

const fieldLabels: Record<string, string> = {
  name: "Product name",
  item_no: "Item No.",
  summary: "Short summary",
  description: "Description",
  material: "Material",
  usage: "Usage",
  capacity: "Capacity",
  product_size: "Product size",
  top_diameter: "Top diameter",
  height: "Height",
  bottom_diameter: "Bottom diameter",
  weight: "Weight",
  package: "Package",
  delivery_time: "Delivery time",
  certificate: "Certificate claim",
  technique: "Technique",
  gallery_images: "Source gallery images",
  detail_images: "Source detail images",
};

const fieldSortOrder: Record<string, number> = {
  name: 0,
  item_no: 10,
  summary: 20,
  description: 30,
  material: 40,
  usage: 50,
  technique: 60,
  capacity: 70,
  product_size: 80,
  top_diameter: 90,
  height: 100,
  bottom_diameter: 110,
  weight: 120,
  package: 130,
  delivery_time: 140,
  certificate: 150,
  gallery_images: 900,
  detail_images: 910,
};

export type GarboReviewStatus = "UNREVIEWED" | "CONFLICT";

export type GarboCategorySource = {
  url: string;
  path: string;
  slug: string;
};

export const GARBO_SHOT_GLASS_SOURCE: GarboCategorySource = {
  url: GARBO_SHOT_GLASS_URL,
  path: GARBO_SHOT_GLASS_PATH,
  slug: GARBO_SHOT_GLASS_SLUG,
};

export type GarboCandidateField = {
  fieldKey: string;
  label: string;
  rawValue: string;
  normalizedValue: string | null;
  unit: string | null;
  status: GarboReviewStatus;
  note: string | null;
  sortOrder: number;
};

export const garboNormalizedProductSchema = z.object({
  version: z.literal(1),
  sourceCategorySlug: z.string().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sourceCategoryPath: z.string().min(3).max(190).regex(/^\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/),
  slug: z.string().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1).max(500),
  sourceSku: z.string().max(200).nullable(),
  summary: z.string().max(5_000),
  description: z.string().max(50_000),
  detailBullets: z.array(z.string().max(5_000)).max(100),
  galleryImages: z.array(z.string().url()).max(100),
  detailImages: z
    .array(
      z.object({
        url: z.string().url(),
        alt: z.string().max(500),
        sectionKey: z.string().max(200),
      }),
    )
    .max(200),
});

export type GarboNormalizedProduct = z.infer<typeof garboNormalizedProductSchema>;

export type GarboParsedProduct = {
  sourceUrl: string;
  sourceTitle: string;
  sourceSku: string | null;
  sourceLastModifiedAt: Date | null;
  rawPayload: Record<string, unknown>;
  normalizedPayload: GarboNormalizedProduct;
  fields: GarboCandidateField[];
  warnings: string[];
  sourceHash: string;
  conflictCount: number;
};

type GarboHtmlResult = {
  html: string;
  finalUrl: string;
  lastModifiedAt: Date | null;
};

type SourceValue = {
  source: string;
  value: string;
};

type DetailImage = GarboNormalizedProduct["detailImages"][number];

function cleanText(value: string) {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function uniqueBy<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const itemKey = key(item);
    if (seen.has(itemKey)) return false;
    seen.add(itemKey);
    return true;
  });
}

function canonicalKey(label: string) {
  const normalized = cleanText(label)
    .toLowerCase()
    .replace(/[.:]+$/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  const aliases: Record<string, string> = {
    item: "item_no",
    item_no: "item_no",
    item_number: "item_no",
    material: "material",
    package: "package",
    packing: "package",
    usage: "usage",
    use: "usage",
    capacity: "capacity",
    size: "product_size",
    product_size: "product_size",
    top_dia: "top_diameter",
    top_diameter: "top_diameter",
    height: "height",
    bottom_dia: "bottom_diameter",
    bottom_diameter: "bottom_diameter",
    weight: "weight",
    delivery_time: "delivery_time",
    certificate: "certificate",
    certificates: "certificate",
    certification: "certificate",
    technique: "technique",
    technology: "technique",
  };

  return aliases[normalized] ?? `source_${normalized || "field"}`;
}

function displayLabel(fieldKey: string, sourceLabel?: string) {
  if (fieldLabels[fieldKey]) return fieldLabels[fieldKey];
  return cleanText(sourceLabel || fieldKey.replace(/^source_/, "").replace(/_/g, " "));
}

function compareValue(value: string) {
  return cleanText(value).toLowerCase().replace(/\s+/g, "");
}

function splitLabelValue(text: string) {
  const separator = text.search(/[:：]/);
  if (separator < 1) return null;
  const label = cleanText(text.slice(0, separator));
  const value = cleanText(text.slice(separator + 1));
  if (!label || !value) return null;
  return { label, value };
}

function normalizeNumberAndUnit(fieldKey: string, value: string) {
  if (!["capacity", "top_diameter", "height", "bottom_diameter", "weight"].includes(fieldKey)) {
    return { value: cleanText(value), unit: null };
  }

  const match = cleanText(value).match(/^(-?\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
  if (!match) return { value: cleanText(value), unit: null };
  const units: Record<string, string> = {
    ml: "ml",
    cl: "cl",
    l: "l",
    mm: "mm",
    cm: "cm",
    m: "m",
    g: "g",
    kg: "kg",
  };
  const unit = units[match[2].toLowerCase()];
  if (!unit) return { value: cleanText(value), unit: null };
  return { value: match[1], unit };
}

function reviewValue(value: string, warnings: string[], label: string) {
  if (value.length <= MAX_REVIEW_VALUE_LENGTH) return value;
  warnings.push(`${label} exceeded ${MAX_REVIEW_VALUE_LENGTH} characters and its review suggestion was truncated.`);
  return value.slice(0, MAX_REVIEW_VALUE_LENGTH);
}

function safeImageListValue(urls: string[], warnings: string[], label: string) {
  const accepted: string[] = [];
  for (const url of urls) {
    const next = [...accepted, url].join("\n");
    if (next.length > MAX_REVIEW_VALUE_LENGTH) {
      warnings.push(`${label} contains more URLs than the field reviewer can display; all URLs remain in the captured payload.`);
      break;
    }
    accepted.push(url);
  }
  return accepted.join("\n");
}

function slugFromSourceUrl(sourceUrl: string) {
  const encodedFilename = new URL(sourceUrl).pathname.split("/").filter(Boolean).at(-1) ?? "shot-glass";
  let filename = encodedFilename;
  try {
    filename = decodeURIComponent(encodedFilename);
  } catch {
    // Keep the encoded filename when a legacy source URL contains malformed escapes.
  }
  const withoutExtension = filename.replace(/\.html?$/i, "");
  return withoutExtension
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180) || "shot-glass";
}

function resolveGarboUrl(value: string | undefined, baseUrl: string) {
  if (!value) return null;
  try {
    const url = new URL(value, baseUrl);
    if (!GARBO_HOSTS.has(url.hostname.toLowerCase())) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function parseGarboCategorySource(value: string): GarboCategorySource {
  const trimmed = value.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Enter a valid Garbo category URL.");
  }
  if (
    url.protocol !== "https:" ||
    !GARBO_HOSTS.has(url.hostname.toLowerCase()) ||
    url.username ||
    url.password ||
    url.port
  ) {
    throw new Error("Only Garbo HTTPS category URLs are allowed.");
  }

  const match = url.pathname.toLowerCase().match(/^\/([a-z0-9]+(?:-[a-z0-9]+)*)\/(?:index\.html?)?$/);
  if (!match) {
    throw new Error("Use a Garbo category URL such as https://www.garboglass.com/shot-glass/.");
  }
  const slug = match[1];
  const path = `/${slug}/`;
  return { slug, path, url: `${GARBO_BASE_URL}${path}` };
}

function assertAllowedGarboUrl(value: string, source: GarboCategorySource) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !GARBO_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("The requested source is not an allowed Garbo HTTPS URL.");
  }
  if (!url.pathname.toLowerCase().startsWith(source.path)) {
    throw new Error(`The requested source is outside ${source.path}.`);
  }
  return url;
}

function parseLastModified(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function fetchGarboHtml(
  sourceUrl: string,
  source: GarboCategorySource = GARBO_SHOT_GLASS_SOURCE,
): Promise<GarboHtmlResult> {
  assertAllowedGarboUrl(sourceUrl, source);
  let response: Response;
  try {
    response = await fetch(sourceUrl, {
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(30_000),
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
      },
    });
  } catch {
    return fetchGarboHtmlWithCurl(sourceUrl, source);
  }
  assertAllowedGarboUrl(response.url, source);
  if (!response.ok) {
    await response.body?.cancel();
    if (response.status === 403) return fetchGarboHtmlWithCurl(sourceUrl, source);
    throw new Error(`Garbo returned HTTP ${response.status} for ${sourceUrl}.`);
  }
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    throw new Error(`Garbo returned an unsupported content type for ${sourceUrl}.`);
  }
  const html = await response.text();
  if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) {
    throw new Error(`Garbo returned a page larger than ${MAX_HTML_BYTES} bytes.`);
  }
  return {
    html,
    finalUrl: response.url,
    lastModifiedAt: parseLastModified(response.headers.get("last-modified")),
  };
}

async function fetchGarboHtmlWithCurl(
  sourceUrl: string,
  source: GarboCategorySource,
): Promise<GarboHtmlResult> {
  assertAllowedGarboUrl(sourceUrl, source);
  const marker = "\n__GLARIVO_CURL_META__";
  const executable = process.platform === "win32" ? "curl.exe" : "curl";
  const args = [
    ...(process.platform === "win32" ? ["--ssl-no-revoke"] : []),
    "-L",
    "-sS",
    "--http1.1",
    "--connect-timeout",
    "20",
    "--max-time",
    "60",
    "--retry",
    "4",
    "--retry-all-errors",
    "--retry-delay",
    "2",
    "--max-filesize",
    String(MAX_HTML_BYTES),
    "-A",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    "-H",
    "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "-H",
    "Accept-Language: en-US,en;q=0.9",
    "-w",
    `${marker}%{http_code}\t%{url_effective}\t%{content_type}`,
    sourceUrl,
  ];

  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { windowsHide: true });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let outputBytes = 0;
    let settled = false;
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    child.stdout.on("data", (chunk: Buffer) => {
      outputBytes += chunk.byteLength;
      if (outputBytes > MAX_HTML_BYTES + 4096) {
        child.kill();
        fail(new Error(`Garbo returned a page larger than ${MAX_HTML_BYTES} bytes.`));
        return;
      }
      stdout.push(chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("error", (error) => fail(new Error(`Unable to start curl fallback: ${error.message}`)));
    child.on("close", (code) => {
      if (settled) return;
      if (code !== 0) {
        fail(new Error(`Garbo curl fallback failed (${code}): ${Buffer.concat(stderr).toString("utf8").trim()}`));
        return;
      }
      const output = Buffer.concat(stdout).toString("utf8");
      const markerIndex = output.lastIndexOf(marker);
      if (markerIndex < 0) {
        fail(new Error("Garbo curl fallback returned no response metadata."));
        return;
      }
      const html = output.slice(0, markerIndex);
      const [statusText, finalUrl, contentType = ""] = output.slice(markerIndex + marker.length).trim().split("\t");
      const status = Number.parseInt(statusText, 10);
      assertAllowedGarboUrl(finalUrl, source);
      if (status < 200 || status >= 300) {
        fail(new Error(`Garbo returned HTTP ${status} for ${sourceUrl}.`));
        return;
      }
      const normalizedContentType = contentType.toLowerCase();
      if (!normalizedContentType.includes("text/html") && !normalizedContentType.includes("application/xhtml+xml")) {
        fail(new Error(`Garbo returned an unsupported content type for ${sourceUrl}.`));
        return;
      }
      settled = true;
      resolve({ html, finalUrl, lastModifiedAt: null });
    });
  });
}

function categoryPageNumber(url: string) {
  const match = new URL(url).pathname.match(/\/index_(\d+)\.html$/i);
  return match ? Number.parseInt(match[1], 10) : 1;
}

export function extractGarboCategoryLinks(
  html: string,
  pageUrl: string,
  source: GarboCategorySource,
) {
  const $ = load(html);
  const productUrls: string[] = [];
  const categoryPages: string[] = [];

  $("a[href]").each((_, element) => {
    const resolved = resolveGarboUrl($(element).attr("href"), pageUrl);
    if (!resolved) return;
    const pathname = new URL(resolved).pathname.toLowerCase();
    const relativePath = pathname.startsWith(source.path)
      ? pathname.slice(source.path.length)
      : "";
    if (/^index_\d+\.html$/i.test(relativePath)) {
      categoryPages.push(resolved);
      return;
    }
    if (/^index\.html$/i.test(relativePath)) return;
    if (/^test(?:[-_]?\d+)?\.html$/i.test(relativePath)) return;
    if (/^[^/]+\.html$/i.test(relativePath)) productUrls.push(resolved);
  });

  return {
    productUrls: unique(productUrls),
    categoryPages: unique(categoryPages),
  };
}

export function extractShotGlassCategoryLinks(html: string, pageUrl: string) {
  return extractGarboCategoryLinks(html, pageUrl, GARBO_SHOT_GLASS_SOURCE);
}

export async function discoverGarboProductUrls(source: GarboCategorySource) {
  const pages = new Map<string, GarboHtmlResult>();
  const queue = [source.url];

  while (queue.length && pages.size < MAX_CATEGORY_PAGES) {
    const pageUrl = queue.shift();
    if (!pageUrl || pages.has(pageUrl)) continue;
    const result = await fetchGarboHtml(pageUrl, source);
    pages.set(pageUrl, result);
    const links = extractGarboCategoryLinks(result.html, result.finalUrl, source);
    for (const categoryPage of links.categoryPages) {
      if (!pages.has(categoryPage) && !queue.includes(categoryPage)) queue.push(categoryPage);
    }
  }

  const orderedPages = [...pages.entries()].sort(
    ([left], [right]) => categoryPageNumber(left) - categoryPageNumber(right),
  );
  const productUrls = unique(
    orderedPages.flatMap(([pageUrl, result]) =>
      extractGarboCategoryLinks(result.html, result.finalUrl || pageUrl, source).productUrls,
    ),
  );
  if (productUrls.length > MAX_PRODUCT_URLS) {
    throw new Error(`${source.path} discovery exceeded the ${MAX_PRODUCT_URLS}-product safety limit.`);
  }

  return {
    categoryPages: orderedPages.map(([url]) => url),
    productUrls,
  };
}

export function discoverShotGlassProductUrls() {
  return discoverGarboProductUrls(GARBO_SHOT_GLASS_SOURCE);
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, stableValue(item)]),
  );
}

function sourceHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex");
}

function sectionKey(value: string) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 200) || "detail";
}

export function parseGarboProduct(
  sourceUrl: string,
  html: string,
  sourceLastModifiedAt: Date | null = null,
  source: GarboCategorySource = GARBO_SHOT_GLASS_SOURCE,
): GarboParsedProduct {
  assertAllowedGarboUrl(sourceUrl, source);
  const $ = load(html);
  const warnings: string[] = [];
  const sourceTitle = cleanText($(".d-topr-title").first().text() || $("h1").first().text());
  if (!sourceTitle) throw new Error(`No product title was found on ${sourceUrl}.`);

  const summaryRows: Array<{ label: string; value: string }> = [];
  $(".detail-topr-list p").each((_, element) => {
    const pair = splitLabelValue($(element).text());
    if (pair) summaryRows.push(pair);
  });

  const specificationRows: Array<{ label: string; value: string }> = [];
  $(".pro-content table tr").each((_, row) => {
    const cells = $(row)
      .find("th,td")
      .map((__, cell) => cleanText($(cell).text()))
      .get()
      .filter(Boolean);
    if (cells.length >= 2) specificationRows.push({ label: cells[0], value: cells[1] });
  });

  const detailsHeading = $(".pro-content h2")
    .filter((_, element) => /^details\s*:?$/i.test(cleanText($(element).text())))
    .first();
  const detailRegion = detailsHeading.length ? detailsHeading.nextUntil("h2") : $(".pro-content");
  const detailBullets = unique(
    detailRegion
      .find("li")
      .map((_, element) => cleanText($(element).text()))
      .get()
      .filter(Boolean),
  );

  const galleryImages: string[] = [];
  $(".prob-pic-item a[href], .prob-pic-item img[src], .prob-pic-item img[data-src]").each(
    (_, element) => {
      const value = $(element).attr("href") || $(element).attr("data-src") || $(element).attr("src");
      const resolved = resolveGarboUrl(value, sourceUrl);
      if (resolved && IMAGE_PATTERN.test(resolved)) galleryImages.push(resolved);
    },
  );

  const detailImages: DetailImage[] = [];
  $(".pro-content img[src], .pro-content img[data-src]").each((_, element) => {
    const image = $(element);
    const resolved = resolveGarboUrl(image.attr("data-src") || image.attr("src"), sourceUrl);
    if (!resolved || !IMAGE_PATTERN.test(resolved)) return;
    const block = image.closest("p,div,li");
    const heading = cleanText(block.prevAll("h2").first().text());
    detailImages.push({
      url: resolved,
      alt: cleanText(image.attr("alt") || ""),
      sectionKey: sectionKey(heading || "detail"),
    });
  });

  const normalizedGalleryImages = unique(galleryImages);
  const normalizedDetailImages = uniqueBy(detailImages, (image) => image.url);
  if (!normalizedGalleryImages.length && normalizedDetailImages.length) {
    normalizedGalleryImages.push(normalizedDetailImages[0].url);
    warnings.push("No dedicated source gallery image was extracted; the first detail image is reused as the product cover.");
  }
  if (!normalizedGalleryImages.length) warnings.push("No source gallery or detail image was extracted for a product cover.");
  if (!normalizedDetailImages.length) warnings.push("No source detail images were extracted.");

  const sourceValues = new Map<string, SourceValue[]>();
  const sourceLabels = new Map<string, string>();
  const addSourceValue = (source: string, label: string, value: string) => {
    const cleanValue = cleanText(value);
    if (!cleanValue) return;
    const key = canonicalKey(label);
    sourceValues.set(key, [...(sourceValues.get(key) ?? []), { source, value: cleanValue }]);
    if (!sourceLabels.has(key)) sourceLabels.set(key, label);
  };
  for (const row of summaryRows) addSourceValue("Summary", row.label, row.value);
  for (const row of specificationRows) addSourceValue("Specification", row.label, row.value);

  const fields: GarboCandidateField[] = [];
  const addSimpleField = (
    fieldKey: string,
    rawValue: string,
    normalizedValue: string,
    note: string | null = null,
  ) => {
    fields.push({
      fieldKey,
      label: fieldLabels[fieldKey],
      rawValue,
      normalizedValue: reviewValue(normalizedValue, warnings, fieldLabels[fieldKey]),
      unit: null,
      status: "UNREVIEWED",
      note,
      sortOrder: fieldSortOrder[fieldKey],
    });
  };

  addSimpleField("name", sourceTitle, sourceTitle);
  const description = detailBullets.join("\n");
  const summary = detailBullets.slice(0, 2).join(" ") || sourceTitle;
  addSimpleField("summary", summary, summary, detailBullets.length ? "Suggested from the first source detail statements." : "No detail statements were found; the source title is used as the review suggestion.");
  addSimpleField("description", description, description, "Source detail statements joined as plain text; edit before verification if needed.");

  let dynamicSortOrder = 300;
  for (const [fieldKey, values] of sourceValues) {
    const distinct = uniqueBy(values, (item) => compareValue(item.value));
    const conflict = distinct.length > 1;
    const firstValue = distinct[0]?.value ?? "";
    const normalized = normalizeNumberAndUnit(fieldKey, firstValue);
    const label = displayLabel(fieldKey, sourceLabels.get(fieldKey));
    const rawValue = conflict
      ? distinct.map((item) => `[${item.source}] ${item.value}`).join("\n")
      : firstValue;
    const matchedSources = unique(values.map((item) => item.source));
    const note = conflict
      ? `Conflicting values were extracted from ${matchedSources.join(" and ")}.`
      : matchedSources.length > 1
        ? `The value matched across ${matchedSources.join(" and ")}.`
        : null;
    if (conflict) warnings.push(`${label} has conflicting source values.`);
    fields.push({
      fieldKey,
      label,
      rawValue,
      normalizedValue: conflict ? null : reviewValue(normalized.value, warnings, label),
      unit: conflict ? null : normalized.unit,
      status: conflict ? "CONFLICT" : "UNREVIEWED",
      note,
      sortOrder: fieldSortOrder[fieldKey] ?? dynamicSortOrder++,
    });
  }

  if (!sourceValues.has("item_no")) warnings.push("No Item No. was extracted; SKU must remain blank unless a reviewer confirms one.");
  if (!detailBullets.length) warnings.push("No source detail statements were extracted.");
  if (sourceValues.has("certificate")) {
    warnings.push("Certificate names are source claims only and require evidence before they can be marked verified.");
  }
  warnings.push("Source media retains its Garbo URL as provenance and is copied to Glarivo R2 under the current company authorization.");

  if (normalizedGalleryImages.length) {
    const value = safeImageListValue(normalizedGalleryImages, warnings, "Source gallery images");
    addSimpleField("gallery_images", value, value, "Authorized source references. The importer copies these assets to Glarivo R2 instead of hotlinking them.");
  }
  if (normalizedDetailImages.length) {
    const value = safeImageListValue(normalizedDetailImages.map((image) => image.url), warnings, "Source detail images");
    addSimpleField("detail_images", value, value, "Authorized source references. The importer copies these assets to Glarivo R2 and attaches them to Product Details.");
  }

  fields.sort((left, right) => left.sortOrder - right.sortOrder || left.label.localeCompare(right.label));
  const sourceSkuField = fields.find((field) => field.fieldKey === "item_no" && field.status !== "CONFLICT");
  const normalizedPayload: GarboNormalizedProduct = {
    version: 1,
    sourceCategorySlug: source.slug,
    sourceCategoryPath: source.path,
    slug: slugFromSourceUrl(sourceUrl),
    name: sourceTitle,
    sourceSku: sourceSkuField?.normalizedValue || null,
    summary,
    description,
    detailBullets,
    galleryImages: normalizedGalleryImages,
    detailImages: normalizedDetailImages,
  };
  const rawPayload = {
    parserVersion: 1,
    sourceUrl,
    sourceTitle,
    summaryRows,
    specificationRows,
    detailBullets,
    galleryImages: normalizedGalleryImages,
    detailImages: normalizedDetailImages,
  };
  const conflictCount = fields.filter((field) => field.status === "CONFLICT").length;

  return {
    sourceUrl,
    sourceTitle,
    sourceSku: sourceSkuField?.normalizedValue || null,
    sourceLastModifiedAt,
    rawPayload,
    normalizedPayload,
    fields,
    warnings: unique(warnings),
    sourceHash: sourceHash({ rawPayload, normalizedPayload }),
    conflictCount,
  };
}

export function parseGarboShotGlassProduct(
  sourceUrl: string,
  html: string,
  sourceLastModifiedAt: Date | null = null,
) {
  return parseGarboProduct(sourceUrl, html, sourceLastModifiedAt, GARBO_SHOT_GLASS_SOURCE);
}

export async function fetchAndParseGarboProduct(
  sourceUrl: string,
  source: GarboCategorySource,
) {
  const result = await fetchGarboHtml(sourceUrl, source);
  return parseGarboProduct(result.finalUrl, result.html, result.lastModifiedAt, source);
}

export function fetchAndParseGarboShotGlassProduct(sourceUrl: string) {
  return fetchAndParseGarboProduct(sourceUrl, GARBO_SHOT_GLASS_SOURCE);
}
