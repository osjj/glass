export type ArticleEditorBlock = {
  id?: string;
  type: string;
  data: Record<string, unknown>;
};

export type ArticleEditorData = {
  time?: number;
  version?: string;
  blocks: ArticleEditorBlock[];
};

export type ArticleListItem = string | {
  content?: string;
  items?: ArticleListItem[];
};

export const ARTICLE_EDITOR_VERSION = "2.31.1";
export const ARTICLE_BLOCK_TYPES = new Set([
  "paragraph",
  "header",
  "list",
  "image",
  "quote",
  "delimiter",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isArticleEditorData(value: unknown): value is ArticleEditorData {
  if (!isRecord(value) || !Array.isArray(value.blocks)) return false;

  return value.blocks.every(
    (block) =>
      isRecord(block) &&
      typeof block.type === "string" &&
      isRecord(block.data),
  );
}

export function parseArticleEditorJson(value: string): ArticleEditorData | null {
  try {
    const parsed: unknown = JSON.parse(value);
    return isArticleEditorData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function markdownInlineToEditorHtml(value: string) {
  let html = escapeHtml(value);
  html = html.replace(
    /\[([^\]]+)]\(((?:https?:\/\/|\/)[^)\s]+)\)/g,
    '<a href="$2">$1</a>',
  );
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  html = html.replace(/__([^_]+)__/g, "<b>$1</b>");
  html = html.replace(/\*([^*]+)\*/g, "<i>$1</i>");
  html = html.replace(/_([^_]+)_/g, "<i>$1</i>");
  return html.replaceAll("\n", "<br>");
}

function isSafeImageUrl(value: string) {
  return value.startsWith("/") || /^https?:\/\//i.test(value);
}

export function markdownToArticleEditorData(markdown: string): ArticleEditorData {
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  const blocks: ArticleEditorBlock[] = [];
  let index = 0;

  const addParagraph = (paragraphLines: string[]) => {
    const text = paragraphLines.join("\n").trim();
    if (text) {
      blocks.push({ type: "paragraph", data: { text: markdownInlineToEditorHtml(text) } });
    }
  };

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      blocks.push({
        type: "header",
        data: {
          text: markdownInlineToEditorHtml(heading[2]),
          level: Math.max(2, Math.min(4, heading[1].length)),
        },
      });
      index += 1;
      continue;
    }

    const image = line.match(/^!\[([^\]]*)]\(([^)\s]+)\)$/);
    if (image && isSafeImageUrl(image[2])) {
      blocks.push({
        type: "image",
        data: { file: { url: image[2] }, caption: markdownInlineToEditorHtml(image[1]) },
      });
      index += 1;
      continue;
    }

    if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push({ type: "delimiter", data: {} });
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({
        type: "quote",
        data: { text: markdownInlineToEditorHtml(quoteLines.join("\n")), caption: "", alignment: "left" },
      });
      continue;
    }

    const listMatch = line.match(/^\s*(?:([-+*])|(\d+)\.)\s+(.+)$/);
    if (listMatch) {
      const ordered = Boolean(listMatch[2]);
      const items: string[] = [];
      while (index < lines.length) {
        const next = lines[index].match(/^\s*(?:([-+*])|(\d+)\.)\s+(.+)$/);
        if (!next || Boolean(next[2]) !== ordered) break;
        items.push(markdownInlineToEditorHtml(next[3]));
        index += 1;
      }
      blocks.push({
        type: "list",
        data: { style: ordered ? "ordered" : "unordered", items },
      });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length && lines[index].trim()) {
      if (
        paragraphLines.length > 0 &&
        (/^(#{1,6})\s+/.test(lines[index]) ||
          /^!\[[^\]]*]\([^)]+\)$/.test(lines[index]) ||
          /^>\s?/.test(lines[index]) ||
          /^\s*(?:[-+*]|\d+\.)\s+/.test(lines[index]))
      ) {
        break;
      }
      paragraphLines.push(lines[index]);
      index += 1;
    }
    addParagraph(paragraphLines);
  }

  return { blocks, version: ARTICLE_EDITOR_VERSION };
}

export function parseStoredArticleContent(value: string | null | undefined): ArticleEditorData {
  if (!value?.trim()) return { blocks: [], version: ARTICLE_EDITOR_VERSION };
  return parseArticleEditorJson(value) ?? markdownToArticleEditorData(value);
}

export function articleSectionsToEditorData(
  sections: Array<{ heading?: string; paragraphs: string[] }>,
): ArticleEditorData {
  return {
    version: ARTICLE_EDITOR_VERSION,
    blocks: sections.flatMap((section) => [
      ...(section.heading
        ? [{ type: "header", data: { text: escapeHtml(section.heading), level: 2 } }]
        : []),
      ...section.paragraphs.map((paragraph) => ({
        type: "paragraph",
        data: { text: escapeHtml(paragraph) },
      })),
    ]),
  };
}

export function isSafeArticleImageUrl(value: string) {
  return isSafeImageUrl(value.trim());
}
