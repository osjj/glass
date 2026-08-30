"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ImagePlus, Link2, Loader2 } from "lucide-react";
import type EditorJS from "@editorjs/editorjs";
import type { ArticleEditorData } from "@/lib/article-content";

export type ContentEditorRef = {
  save: () => Promise<ArticleEditorData | null>;
};

type ContentEditorProps = {
  value: ArticleEditorData;
  slug: string;
  imageAlt: string;
  placeholder?: string;
  uploadEndpoint?: "/api/admin/blog-images" | "/api/admin/product-images";
  contentLabel?: string;
};

function validImageUrl(value: string) {
  return value.startsWith("/") || /^https?:\/\//i.test(value);
}

export const ContentEditor = forwardRef<ContentEditorRef, ContentEditorProps>(
  function ContentEditor(
    {
      value,
      slug,
      imageAlt,
      placeholder = "Start writing your article…",
      uploadEndpoint = "/api/admin/blog-images",
      contentLabel = "article",
    },
    ref,
  ) {
    const holderId = useId().replaceAll(":", "-");
    const editorRef = useRef<EditorJS | null>(null);
    const initialValueRef = useRef(value);
    const uploadContextRef = useRef({ slug, imageAlt });
    const [ready, setReady] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [imageError, setImageError] = useState<string | null>(null);

    useEffect(() => {
      uploadContextRef.current = { slug, imageAlt };
    }, [slug, imageAlt]);

    useImperativeHandle(ref, () => ({
      async save() {
        if (!editorRef.current) return null;
        return (await editorRef.current.save()) as ArticleEditorData;
      },
    }));

    useEffect(() => {
      let editor: EditorJS | null = null;
      let cancelled = false;

      async function initialize() {
        await new Promise((resolve) => window.setTimeout(resolve, 0));
        if (cancelled || !document.getElementById(holderId)) return;

        const Editor = (await import("@editorjs/editorjs")).default;
        const Header = (await import("@editorjs/header")).default;
        const List = (await import("@editorjs/list")).default;
        const Paragraph = (await import("@editorjs/paragraph")).default;
        const Delimiter = (await import("@editorjs/delimiter")).default;
        const Quote = (await import("@editorjs/quote")).default;
        const ImageTool = (await import("@editorjs/image")).default;
        if (cancelled) return;

        editor = new Editor({
          holder: holderId,
          placeholder,
          data: initialValueRef.current,
          minHeight: 360,
          tools: {
            header: {
              class: Header as never,
              config: {
                placeholder: "Enter a heading",
                levels: [2, 3, 4],
                defaultLevel: 2,
              },
            },
            paragraph: { class: Paragraph as never, inlineToolbar: true },
            list: {
              class: List as never,
              inlineToolbar: true,
              config: { defaultStyle: "unordered" },
            },
            quote: {
              class: Quote as never,
              inlineToolbar: true,
              config: {
                quotePlaceholder: "Enter a quote",
                captionPlaceholder: "Quote source (optional)",
              },
            },
            delimiter: Delimiter as never,
            image: {
              class: ImageTool as never,
              config: {
                features: { caption: "optional" },
                uploader: {
                  async uploadByFile(file: File) {
                    try {
                      const formData = new FormData();
                      formData.set("image", file);
                      formData.set("slug", uploadContextRef.current.slug);
                      formData.set(
                        "alt",
                        uploadContextRef.current.imageAlt || file.name.replace(/\.[^.]+$/, ""),
                      );
                      const response = await fetch(uploadEndpoint, {
                        method: "POST",
                        body: formData,
                      });
                      const payload = (await response.json().catch(() => null)) as
                        | { image?: { url: string }; error?: string }
                        | null;
                      if (!response.ok || !payload?.image?.url) {
                        throw new Error(
                          payload?.error || `The ${contentLabel} image could not be uploaded.`,
                        );
                      }
                      setImageError(null);
                      return { success: 1, file: { url: payload.image.url } };
                    } catch (error) {
                      setImageError(
                        error instanceof Error
                          ? error.message
                          : `The ${contentLabel} image could not be uploaded.`,
                      );
                      return { success: 0, file: { url: "" } };
                    }
                  },
                  async uploadByUrl(url: string) {
                    const trimmed = url.trim();
                    if (!validImageUrl(trimmed)) {
                      setImageError("Use an http(s) image URL or a site path beginning with /.");
                      return { success: 0, file: { url: "" } };
                    }
                    setImageError(null);
                    return { success: 1, file: { url: trimmed } };
                  },
                },
              },
            },
          },
        });

        await editor.isReady;
        if (cancelled) {
          editor.destroy();
          return;
        }
        editorRef.current = editor;
        setReady(true);
      }

      void initialize().catch((error) => {
        console.error(`${contentLabel} editor failed to initialize`, error);
        setImageError(`The ${contentLabel} editor could not be loaded. Refresh the page and try again.`);
      });

      return () => {
        cancelled = true;
        setReady(false);
        if (editor) {
          try {
            editor.destroy();
          } catch {
            // EditorJS may already have torn down during Fast Refresh.
          }
        }
        editorRef.current = null;
      };
    }, [contentLabel, holderId, placeholder, uploadEndpoint]);

    const insertImageUrl = useCallback(() => {
      const trimmed = imageUrl.trim();
      if (!validImageUrl(trimmed)) {
        setImageError("Use an http(s) image URL or a site path beginning with /.");
        return;
      }
      if (!editorRef.current) {
        setImageError("Wait for the editor to finish loading.");
        return;
      }

      editorRef.current.blocks.insert("image", {
        file: { url: trimmed },
        caption: "",
        withBorder: false,
        withBackground: false,
        stretched: false,
      });
      setImageUrl("");
      setImageError(null);
    }, [imageUrl]);

    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-[#d7dcd8] bg-[#f8f9f7] p-4 lg:flex-row lg:items-end">
          <label className="min-w-0 flex-1 text-sm font-black">
            Add {contentLabel} image from URL
            <span className="relative mt-2 block">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--ink-muted)]" />
              <input
                className="h-11 w-full rounded-xl border border-[#ccd3ce] bg-white pl-10 pr-3 text-sm shadow-sm focus:border-[var(--accent)]"
                type="url"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    insertImageUrl();
                  }
                }}
                placeholder="https://example.com/detail-image.jpg"
              />
            </span>
          </label>
          <button
            type="button"
            className="button-secondary h-11 shrink-0"
            onClick={insertImageUrl}
            disabled={!ready}
          >
            <ImagePlus className="size-4" /> Add to content
          </button>
        </div>

        {imageError ? (
          <p role="alert" className="text-sm font-bold text-[#a33c32]">
            {imageError}
          </p>
        ) : null}

        <div className="article-editor-shell relative min-h-[28rem] rounded-2xl border border-[#ccd3ce] bg-white px-3 py-5 shadow-sm sm:px-6">
          {!ready ? (
            <div className="absolute inset-x-0 top-6 flex items-center justify-center gap-2 text-sm font-bold text-[var(--ink-muted)]">
              <Loader2 className="size-4 animate-spin" /> Loading article editor…
            </div>
          ) : null}
          <div id={holderId} />
        </div>

        <p className="text-xs leading-5 text-[var(--ink-muted)]">
          Select text for bold, italic, or link tools. Use the + button for headings, lists,
          quotes, dividers, and image upload. Image files are converted to WebP and require R2;
          image URLs work without R2.
        </p>
      </div>
    );
  },
);
