"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { ImageIcon, Loader2, Sparkles, X } from "lucide-react";
import type { AdminProductImageInput } from "@/types/admin-product";

const SIZE_OPTIONS = [
  "1024x1024",
  "1024x1536",
  "1536x1024",
  "2048x2048",
  "2048x1152",
  "auto",
] as const;
const QUALITY_OPTIONS = ["low", "medium", "high", "auto"] as const;
const OUTPUT_FORMAT_OPTIONS = ["jpeg", "png", "webp"] as const;

type ImageSize = (typeof SIZE_OPTIONS)[number];
type ImageQuality = (typeof QUALITY_OPTIONS)[number];
type OutputFormat = (typeof OUTPUT_FORMAT_OPTIONS)[number];

type GeneratedImage = {
  b64Json: string;
  mimeType: string;
  format: OutputFormat;
  width: number;
  height: number;
};

type AiImageEditorModalProps = {
  open: boolean;
  sourceImage: AdminProductImageInput | null;
  slug: string;
  onClose: () => void;
  onFinish: (image: AdminProductImageInput) => void;
};

const REMOVE_ICON_PROMPT =
  "去除图片中的品牌 Logo、文字水印和其他图标，保持产品主体、颜色、材质、比例、背景和构图不变，自然修复被遮挡区域。";

function isOutputFormat(value: unknown): value is OutputFormat {
  return OUTPUT_FORMAT_OPTIONS.includes(value as OutputFormat);
}

function normalizeBase64(value: string) {
  if (!value.startsWith("data:")) return value;
  const separator = value.indexOf(",");
  return separator >= 0 ? value.slice(separator + 1) : value;
}

function base64ToFile(image: GeneratedImage) {
  const binary = window.atob(normalizeBase64(image.b64Json));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  const extension = image.format === "jpeg" ? "jpg" : image.format;
  return new File([bytes], "ai-edited-" + Date.now() + "." + extension, {
    type: image.mimeType,
  });
}

export function AiImageEditorModal({
  open,
  sourceImage,
  slug,
  onClose,
  onFinish,
}: AiImageEditorModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const operationAbortRef = useRef<AbortController | null>(null);
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<ImageSize>("auto");
  const [quality, setQuality] = useState<ImageQuality>("auto");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("webp");
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [generating, setGenerating] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => promptRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open, sourceImage?.url]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        operationAbortRef.current?.abort();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      operationAbortRef.current?.abort();
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open]);

  function dismiss() {
    operationAbortRef.current?.abort();
    onClose();
  }

  async function generateImage() {
    if (!sourceImage || !prompt.trim()) return;
    operationAbortRef.current?.abort();
    const controller = new AbortController();
    operationAbortRef.current = controller;
    setGenerating(true);
    setGeneratedImage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/product-image-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: sourceImage.url,
          prompt: prompt.trim(),
          size,
          quality,
          outputFormat,
        }),
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            image?: {
              b64Json?: unknown;
              mimeType?: unknown;
              format?: unknown;
              width?: unknown;
              height?: unknown;
            };
            error?: unknown;
          }
        | null;
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string" ? payload.error : "The image could not be generated.",
        );
      }
      if (
        typeof payload?.image?.b64Json !== "string" ||
        !payload.image.b64Json ||
        typeof payload.image.mimeType !== "string" ||
        !isOutputFormat(payload.image.format) ||
        typeof payload.image.width !== "number" ||
        typeof payload.image.height !== "number"
      ) {
        throw new Error("The image service returned an incomplete result.");
      }

      setGeneratedImage({
        b64Json: normalizeBase64(payload.image.b64Json),
        mimeType: payload.image.mimeType,
        format: payload.image.format,
        width: payload.image.width,
        height: payload.image.height,
      });
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
      setError(
        caughtError instanceof Error ? caughtError.message : "The image could not be generated.",
      );
    } finally {
      if (operationAbortRef.current === controller) {
        operationAbortRef.current = null;
        setGenerating(false);
      }
    }
  }

  async function finishEditing() {
    if (!sourceImage || !generatedImage) return;
    operationAbortRef.current?.abort();
    const controller = new AbortController();
    operationAbortRef.current = controller;
    setFinishing(true);
    setError(null);

    try {
      const uploadData = new FormData();
      uploadData.set("image", base64ToFile(generatedImage));
      uploadData.set("slug", slug);
      uploadData.set("alt", sourceImage.alt || "Product image");
      uploadData.set("aiGenerated", "true");
      uploadData.set("outputFormat", generatedImage.format);

      const response = await fetch("/api/admin/product-images", {
        method: "POST",
        body: uploadData,
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => null)) as
        | { image?: AdminProductImageInput; error?: unknown }
        | null;
      if (!response.ok || !payload?.image) {
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : "The generated image could not be saved.",
        );
      }

      onFinish({
        ...payload.image,
        alt: payload.image.alt || sourceImage.alt,
      });
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The generated image could not be saved.",
      );
    } finally {
      if (operationAbortRef.current === controller) {
        operationAbortRef.current = null;
        setFinishing(false);
      }
    }
  }

  if (!open || !sourceImage) return null;

  const generatedPreview = generatedImage
    ? "data:" + generatedImage.mimeType + ";base64," + generatedImage.b64Json
    : null;
  const busy = generating || finishing;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071427]/70 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={busy}
        className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_30px_100px_rgba(0,0,0,0.35)] sm:max-h-[calc(100vh-3rem)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#e4e7e3] bg-[#f8f9f7] px-5 py-4 sm:px-7 sm:py-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--ink)] text-[var(--acid)]">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="text-xl font-black tracking-[-0.03em]">
                AI image editor
              </h2>
              <p className="mt-1 text-sm leading-5 text-[var(--ink-muted)]">
                Edit this product image with gpt-image-2, then finish to replace it in the form.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-xl text-[var(--ink-muted)] transition hover:bg-white hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            onClick={dismiss}
            aria-label="Close AI image editor"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
          <div className="grid gap-5 lg:grid-cols-2">
            <figure>
              <figcaption className="mb-2 text-sm font-black">Original image</figcaption>
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-[#d7dcd8] bg-[#eef0ed]">
                <Image
                  src={sourceImage.url}
                  alt={sourceImage.alt || "Original product image"}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  className="object-contain"
                />
              </div>
            </figure>

            <figure>
              <figcaption className="mb-2 flex items-center justify-between gap-3 text-sm font-black">
                <span>Generated image</span>
                {generatedImage ? (
                  <span className="text-xs font-bold text-[var(--ink-muted)]">
                    {generatedImage.width} × {generatedImage.height} · {generatedImage.format}
                  </span>
                ) : null}
              </figcaption>
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-[#d7dcd8] bg-[#eef0ed]">
                {generatedPreview ? (
                  <Image
                    src={generatedPreview}
                    alt="AI-generated product image preview"
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 40vw, 90vw"
                    className="object-contain"
                  />
                ) : (
                  <div className="grid h-full place-items-center p-6 text-center text-sm text-[var(--ink-muted)]">
                    <div>
                      {generating ? (
                        <Loader2 className="mx-auto size-8 animate-spin text-[var(--accent-dark)]" />
                      ) : (
                        <ImageIcon className="mx-auto size-8" aria-hidden="true" />
                      )}
                      <p className="mt-3 font-bold">
                        {generating ? "Generating image…" : "Your generated preview will appear here."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </figure>
          </div>

          <label className="mt-6 block text-sm font-black">
            Editing instructions
            <textarea
              ref={promptRef}
              className="mt-2 min-h-28 w-full rounded-xl border border-[#ccd3ce] bg-white p-4 text-sm font-normal leading-6 text-[var(--ink)] shadow-sm transition focus:border-[var(--accent)]"
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                setGeneratedImage(null);
              }}
              placeholder="Describe what should change and what must remain unchanged…"
              maxLength={4000}
              disabled={busy}
            />
          </label>

          <div className="mt-3">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              Prompt templates
            </p>
            <button
              type="button"
              className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#c9d0ca] bg-[#f8f9f7] px-3 text-sm font-black text-[var(--ink)] transition hover:border-[var(--accent)] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              onClick={() => {
                setPrompt(REMOVE_ICON_PROMPT);
                setGeneratedImage(null);
                promptRef.current?.focus();
              }}
              disabled={busy}
            >
              <Sparkles className="size-4 text-[var(--accent-dark)]" aria-hidden="true" />
              去除图标
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-black">
              Image size
              <select
                className="mt-2 h-11 w-full rounded-xl border border-[#ccd3ce] bg-white px-3 text-sm font-normal shadow-sm focus:border-[var(--accent)]"
                value={size}
                onChange={(event) => {
                  setSize(event.target.value as ImageSize);
                  setGeneratedImage(null);
                }}
                disabled={busy}
              >
                {SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-black">
              Quality
              <select
                className="mt-2 h-11 w-full rounded-xl border border-[#ccd3ce] bg-white px-3 text-sm font-normal shadow-sm focus:border-[var(--accent)]"
                value={quality}
                onChange={(event) => {
                  setQuality(event.target.value as ImageQuality);
                  setGeneratedImage(null);
                }}
                disabled={busy}
              >
                {QUALITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-black">
              Output format
              <select
                className="mt-2 h-11 w-full rounded-xl border border-[#ccd3ce] bg-white px-3 text-sm font-normal shadow-sm focus:border-[var(--accent)]"
                value={outputFormat}
                onChange={(event) => {
                  setOutputFormat(event.target.value as OutputFormat);
                  setGeneratedImage(null);
                }}
                disabled={busy}
              >
                {OUTPUT_FORMAT_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-[#e7aaa3] bg-[#fff1ef] px-4 py-3 text-sm font-bold text-[#7d2e27]"
            >
              {error}
            </p>
          ) : null}
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-[#e4e7e3] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-xs leading-5 text-[var(--ink-muted)]">
            The selected format controls the AI preview. Finish uploads an optimized WebP to R2
            and replaces only this image in the form. Save the product to persist the change.
          </p>
          <div className="flex shrink-0 flex-wrap justify-end gap-3">
            <button type="button" className="button-secondary" onClick={dismiss}>
              Cancel
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={generateImage}
              disabled={!prompt.trim() || busy}
            >
              {generating ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="size-4" aria-hidden="true" />
              )}
              {generating ? "Generating…" : generatedImage ? "Generate again" : "Generate"}
            </button>
            <button
              type="button"
              className="button-primary"
              onClick={finishEditing}
              disabled={!generatedImage || busy}
            >
              {finishing ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {finishing ? "Saving…" : "Finish"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
