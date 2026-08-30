import "server-only";

import sanitizeHtml from "sanitize-html";
import {
  ARTICLE_BLOCK_TYPES,
  ARTICLE_EDITOR_VERSION,
  isSafeArticleImageUrl,
  parseArticleEditorJson,
  parseStoredArticleContent,
  type ArticleEditorBlock,
  type ArticleEditorData,
  type ArticleListItem,
} from "@/lib/article-content";

const INLINE_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["a", "b", "strong", "i", "em", "u", "s", "mark", "code", "br"],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto"],
  allowProtocolRelative: false,
  transformTags: {
    a: (_tagName, attributes) => ({
      tagName: "a",
      attribs: {
        ...attributes,
        ...(attributes.target === "_blank" ? { rel: "noopener noreferrer" } : {}),
      },
    }),
  },
};

function cleanInline(value: unknown) {
  return sanitizeHtml(typeof value === "string" ? value : "", INLINE_SANITIZE_OPTIONS);
}

export function plainTextFromEditorHtml(value: unknown) {
  return sanitizeHtml(typeof value === "string" ? value : "", {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

function validateListItems(value: unknown, depth = 0): value is ArticleListItem[] {
  if (!Array.isArray(value) || value.length > 500 || depth > 5) return false;
  return value.every((item) => {
    if (typeof item === "string") return item.length <= 20_000;
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const record = item as Record<string, unknown>;
    return (
      (record.content === undefined ||
        (typeof record.content === "string" && record.content.length <= 20_000)) &&
      (record.items === undefined || validateListItems(record.items, depth + 1))
    );
  });
}

function validateBlock(block: ArticleEditorBlock) {
  if (!ARTICLE_BLOCK_TYPES.has(block.type)) return `Unsupported content block: ${block.type}`;

  if (block.type === "delimiter") return null;
  if (block.type === "paragraph") {
    return typeof block.data.text === "string" && block.data.text.length <= 50_000
      ? null
      : "A paragraph contains invalid text.";
  }
  if (block.type === "header") {
    return typeof block.data.text === "string" &&
      block.data.text.length <= 10_000 &&
      [2, 3, 4].includes(Number(block.data.level))
      ? null
      : "A heading contains invalid text or level.";
  }
  if (block.type === "quote") {
    return typeof block.data.text === "string" &&
      block.data.text.length <= 50_000 &&
      (block.data.caption === undefined ||
        (typeof block.data.caption === "string" && block.data.caption.length <= 10_000))
      ? null
      : "A quote contains invalid text.";
  }
  if (block.type === "list") {
    return ["ordered", "unordered"].includes(String(block.data.style)) &&
      validateListItems(block.data.items)
      ? null
      : "A list contains invalid items.";
  }

  const file = block.data.file;
  const url =
    file && typeof file === "object" && !Array.isArray(file)
      ? (file as Record<string, unknown>).url
      : undefined;
  return typeof url === "string" &&
    url.length <= 2_000 &&
    isSafeArticleImageUrl(url) &&
    (block.data.caption === undefined ||
      (typeof block.data.caption === "string" && block.data.caption.length <= 10_000))
    ? null
    : "An article image must use an http(s) URL or a site path beginning with /.";
}

function hasMeaningfulContent(data: ArticleEditorData) {
  return data.blocks.some((block) => {
    if (block.type === "image") return true;
    if (block.type === "list") return Array.isArray(block.data.items) && block.data.items.length > 0;
    if (block.type === "delimiter") return false;
    return plainTextFromEditorHtml(block.data.text).length > 0;
  });
}

export function hasRenderableStoredContent(value: string) {
  return hasMeaningfulContent(readStoredArticleContent(value));
}

function cleanListItems(items: ArticleListItem[]): ArticleListItem[] {
  return items.map((item) =>
    typeof item === "string"
      ? cleanInline(item)
      : {
          content: cleanInline(item.content),
          ...(item.items ? { items: cleanListItems(item.items) } : {}),
        },
  );
}

export function sanitizeArticleEditorData(data: ArticleEditorData): ArticleEditorData {
  return {
    version: ARTICLE_EDITOR_VERSION,
    ...(typeof data.time === "number" ? { time: data.time } : {}),
    blocks: data.blocks.map((block) => {
      const base = { ...(block.id ? { id: block.id } : {}), type: block.type };
      if (block.type === "delimiter") return { ...base, data: {} };
      if (block.type === "list") {
        return {
          ...base,
          data: {
            style: block.data.style === "ordered" ? "ordered" : "unordered",
            items: cleanListItems(block.data.items as ArticleListItem[]),
          },
        };
      }
      if (block.type === "image") {
        const file = block.data.file as { url: string };
        return {
          ...base,
          data: {
            file: { url: file.url.trim() },
            caption: cleanInline(block.data.caption),
            withBorder: Boolean(block.data.withBorder),
            withBackground: Boolean(block.data.withBackground),
            stretched: Boolean(block.data.stretched),
          },
        };
      }
      if (block.type === "header") {
        return {
          ...base,
          data: { text: cleanInline(block.data.text), level: Number(block.data.level) },
        };
      }
      if (block.type === "quote") {
        return {
          ...base,
          data: {
            text: cleanInline(block.data.text),
            caption: cleanInline(block.data.caption),
            alignment: block.data.alignment === "center" ? "center" : "left",
          },
        };
      }
      return { ...base, data: { text: cleanInline(block.data.text) } };
    }),
  };
}

function prepareEditorContentForStorage(
  value: string,
  options: { required: boolean; label: string },
):
  | { success: true; value: string; data: ArticleEditorData }
  | { success: false; error: string } {
  const data = parseArticleEditorJson(value);
  if (!data) {
    return {
      success: false,
      error: `${options.label} content could not be read by the editor.`,
    };
  }
  if (data.blocks.length > 2_000) {
    return { success: false, error: `${options.label} content contains too many blocks.` };
  }

  for (const block of data.blocks) {
    const error = validateBlock(block);
    if (error) return { success: false, error };
  }
  if (options.required && !hasMeaningfulContent(data)) {
    return { success: false, error: `${options.label} content is required.` };
  }

  const sanitized = sanitizeArticleEditorData(data);
  return { success: true, value: JSON.stringify(sanitized), data: sanitized };
}

export function prepareArticleContentForStorage(value: string) {
  return prepareEditorContentForStorage(value, { required: true, label: "Article" });
}

export function prepareProductContentForStorage(value: string) {
  return prepareEditorContentForStorage(value, { required: false, label: "Product" });
}

export function readStoredArticleContent(value: string) {
  const data = parseStoredArticleContent(value);
  const validBlocks = data.blocks.filter((block) => !validateBlock(block));
  return sanitizeArticleEditorData({ ...data, blocks: validBlocks });
}

export function serializeStoredArticleContentForEditor(value: string) {
  return JSON.stringify(readStoredArticleContent(value));
}

export const serializeStoredProductContentForEditor = serializeStoredArticleContentForEditor;

export function sanitizeArticleInlineHtml(value: unknown) {
  return cleanInline(value);
}
