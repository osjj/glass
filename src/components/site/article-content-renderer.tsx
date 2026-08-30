import type { JSX } from "react";
import Image from "next/image";
import {
  plainTextFromEditorHtml,
  readStoredArticleContent,
  sanitizeArticleInlineHtml,
} from "@/lib/article-content-server";
import { isSafeArticleImageUrl, type ArticleListItem } from "@/lib/article-content";

function headingId(value: string, index: number) {
  const base = plainTextFromEditorHtml(value)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || `section-${index + 1}`;
}

function listItems(items: ArticleListItem[], ordered: boolean): JSX.Element[] {
  return items.map((item, index) => {
    const content = typeof item === "string" ? item : item.content || "";
    const nested = typeof item === "string" ? undefined : item.items;
    const NestedTag = ordered ? "ol" : "ul";

    return (
      <li key={index}>
        <span dangerouslySetInnerHTML={{ __html: sanitizeArticleInlineHtml(content) }} />
        {nested?.length ? <NestedTag>{listItems(nested, ordered)}</NestedTag> : null}
      </li>
    );
  });
}

export function RichContentRenderer({
  content,
  fallbackImageAlt = "Article illustration",
}: {
  content: string;
  fallbackImageAlt?: string;
}) {
  const data = readStoredArticleContent(content);
  const usedHeadingIds = new Set<string>();

  return data.blocks.map((block, index) => {
    const key = block.id || `${block.type}-${index}`;

    if (block.type === "paragraph") {
      return (
        <p
          key={key}
          dangerouslySetInnerHTML={{ __html: sanitizeArticleInlineHtml(block.data.text) }}
        />
      );
    }

    if (block.type === "header") {
      const html = sanitizeArticleInlineHtml(block.data.text);
      const level = Math.max(2, Math.min(4, Number(block.data.level) || 2));
      const baseId = headingId(String(block.data.text ?? ""), index);
      let id = baseId;
      let suffix = 2;
      while (usedHeadingIds.has(id)) id = `${baseId}-${suffix++}`;
      usedHeadingIds.add(id);

      if (level === 3) {
        return <h3 key={key} id={id} dangerouslySetInnerHTML={{ __html: html }} />;
      }
      if (level === 4) {
        return <h4 key={key} id={id} dangerouslySetInnerHTML={{ __html: html }} />;
      }
      return <h2 key={key} id={id} dangerouslySetInnerHTML={{ __html: html }} />;
    }

    if (block.type === "list") {
      const items = (block.data.items as ArticleListItem[]) || [];
      return block.data.style === "ordered" ? (
        <ol key={key}>{listItems(items, true)}</ol>
      ) : (
        <ul key={key}>{listItems(items, false)}</ul>
      );
    }

    if (block.type === "quote") {
      const caption = sanitizeArticleInlineHtml(block.data.caption);
      return (
        <blockquote
          key={key}
          className={block.data.alignment === "center" ? "text-center" : undefined}
        >
          <p dangerouslySetInnerHTML={{ __html: sanitizeArticleInlineHtml(block.data.text) }} />
          {caption ? <cite dangerouslySetInnerHTML={{ __html: caption }} /> : null}
        </blockquote>
      );
    }

    if (block.type === "delimiter") {
      return <hr key={key} />;
    }

    if (block.type === "image") {
      const file = block.data.file as { url?: unknown } | undefined;
      const url = typeof file?.url === "string" ? file.url.trim() : "";
      if (!url || !isSafeArticleImageUrl(url)) return null;
      const captionHtml = sanitizeArticleInlineHtml(block.data.caption);
      const captionText = plainTextFromEditorHtml(block.data.caption);
      return (
        <figure
          key={key}
          className={block.data.withBackground ? "article-image-with-background" : undefined}
        >
          <div className={block.data.withBorder ? "article-image-with-border" : undefined}>
            <Image
              src={url}
              alt={captionText || fallbackImageAlt}
              width={1200}
              height={800}
              unoptimized
              sizes="(max-width: 768px) 100vw, 768px"
              className="h-auto w-full rounded-xl object-cover"
            />
          </div>
          {captionHtml ? (
            <figcaption dangerouslySetInnerHTML={{ __html: captionHtml }} />
          ) : null}
        </figure>
      );
    }

    return null;
  });
}

export const ArticleContentRenderer = RichContentRenderer;
