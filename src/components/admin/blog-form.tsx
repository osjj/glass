"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useMemo, useRef, useState, useTransition } from "react";
import {
  CalendarDays,
  FileText,
  ImageIcon,
  Loader2,
  Save,
  Settings2,
  Trash2,
  Upload,
} from "lucide-react";
import { createBlogPost, deleteBlogPost, updateBlogPost } from "@/actions/blog";
import { ContentEditor, type ContentEditorRef } from "@/components/admin/content-editor";
import { parseStoredArticleContent } from "@/lib/article-content";
import type { AdminBlogPostInput, BlogPostFormState } from "@/types/admin-blog";

const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-[#ccd3ce] bg-white px-4 text-sm text-[var(--ink)] shadow-sm transition focus:border-[var(--accent)]";
const textareaClass =
  "mt-2 w-full rounded-xl border border-[#ccd3ce] bg-white p-4 text-sm text-[var(--ink)] shadow-sm transition focus:border-[var(--accent)]";

function buildSlug(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: typeof FileText;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-[#d7dcd8] bg-white shadow-sm">
      <div className="flex gap-4 border-b border-[#e4e7e3] bg-[#f8f9f7] px-5 py-5 sm:px-7">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--ink)] text-[var(--acid)]">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-black tracking-[-0.025em]">{title}</h2>
          <p className="mt-1 text-sm leading-5 text-[var(--ink-muted)]">{description}</p>
        </div>
      </div>
      <div className="p-5 sm:p-7">{children}</div>
    </section>
  );
}

export function BlogForm({ post }: { post?: AdminBlogPostInput }) {
  const formAction = useMemo(
    () => (post ? updateBlogPost.bind(null, post.id) : createBlogPost),
    [post],
  );
  const deleteAction = useMemo(
    () => (post ? deleteBlogPost.bind(null, post.id) : null),
    [post],
  );
  const [state, action, actionPending] = useActionState<BlogPostFormState, FormData>(formAction, {});
  const [transitionPending, startTransition] = useTransition();
  const pending = actionPending || transitionPending;
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugWasEdited, setSlugWasEdited] = useState(Boolean(post));
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
  const [coverImageAlt, setCoverImageAlt] = useState(post?.coverImageAlt ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [contentSaveError, setContentSaveError] = useState<string | null>(null);
  const contentEditorRef = useRef<ContentEditorRef>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const initialContent = useMemo(
    () => parseStoredArticleContent(post?.content),
    [post?.content],
  );

  const validationMessages = Object.entries(state.errors ?? {}).flatMap(([field, messages]) =>
    (messages ?? []).map((message) => `${field}: ${message}`),
  );

  function updateTitle(value: string) {
    setTitle(value);
    if (!slugWasEdited) setSlug(buildSlug(value));
  }

  async function uploadCover(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const uploadData = new FormData();
      uploadData.set("image", file);
      uploadData.set("slug", slug);
      uploadData.set("alt", coverImageAlt || title || file.name.replace(/\.[^.]+$/, ""));

      const response = await fetch("/api/admin/blog-images", {
        method: "POST",
        body: uploadData,
      });
      const payload = (await response.json().catch(() => null)) as {
        image?: { url: string; alt: string };
        error?: string;
      } | null;

      if (!response.ok || !payload?.image) {
        throw new Error(payload?.error || "The cover image could not be uploaded.");
      }

      setCoverImage(payload.image.url);
      if (!coverImageAlt) setCoverImageAlt(payload.image.alt);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "The cover image could not be uploaded.");
    } finally {
      setUploading(false);
    }
  }

  async function submitArticle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = formRef.current;
    if (!form) return;

    try {
      const content = await contentEditorRef.current?.save();
      if (!content) throw new Error("Wait for the article editor to finish loading.");
      const contentInput = form.elements.namedItem("content") as HTMLInputElement | null;
      if (!contentInput) throw new Error("The article content field is unavailable.");
      contentInput.value = JSON.stringify(content);
      setContentSaveError(null);

      const data = new FormData(form);
      startTransition(() => action(data));
    } catch (error) {
      setContentSaveError(
        error instanceof Error ? error.message : "The article content could not be prepared.",
      );
    }
  }

  return (
    <div className="mt-7 space-y-6">
      <form ref={formRef} onSubmit={submitArticle} className="space-y-6">
        {(state.error || validationMessages.length > 0) && (
          <div role="alert" className="rounded-2xl border border-[#e7aaa3] bg-[#fff1ef] p-4 text-sm text-[#7d2e27]">
            <p className="font-black">Please review the article information.</p>
            {state.error ? <p className="mt-1">{state.error}</p> : null}
            {validationMessages.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {validationMessages.map((message) => <li key={message}>{message}</li>)}
              </ul>
            ) : null}
          </div>
        )}

        <SectionCard
          title="Article information"
          description="Set the public title, URL, category, and summary used in article cards and search metadata."
          icon={FileText}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-black sm:col-span-2">
              Article title <span className="text-[#a33c32]">*</span>
              <input
                className={inputClass}
                type="text"
                name="title"
                value={title}
                onChange={(event) => updateTitle(event.target.value)}
                maxLength={180}
                required
              />
            </label>
            <label className="text-sm font-black">
              Slug <span className="text-[#a33c32]">*</span>
              <input
                className={inputClass}
                type="text"
                name="slug"
                value={slug}
                onChange={(event) => {
                  setSlugWasEdited(true);
                  setSlug(event.target.value.toLowerCase());
                }}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="article-url-slug"
                required
              />
            </label>
            <label className="text-sm font-black">
              Category <span className="text-[#a33c32]">*</span>
              <input className={inputClass} name="category" defaultValue={post?.category ?? "Buying guide"} maxLength={80} required />
            </label>
            <label className="text-sm font-black sm:col-span-2">
              Excerpt <span className="text-[#a33c32]">*</span>
              <textarea
                className={`${textareaClass} min-h-28`}
                name="excerpt"
                defaultValue={post?.excerpt ?? ""}
                maxLength={500}
                placeholder="A concise summary for the blog list and search results."
                required
              />
            </label>
          </div>
        </SectionCard>

        <SectionCard
          title="Cover image"
          description="Use a site image path or public URL, or upload a WebP cover when R2 is configured."
          icon={ImageIcon}
        >
          <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-[#d7dcd8] bg-[#eef0ed]">
              {coverImage ? (
                <Image src={coverImage} alt={coverImageAlt || title || "Article cover preview"} fill unoptimized sizes="(min-width: 1024px) 36vw, 100vw" className="object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-center text-sm text-[var(--ink-muted)]">
                  <div><ImageIcon className="mx-auto size-7" /><p className="mt-2 font-bold">No cover selected</p></div>
                </div>
              )}
            </div>
            <div className="space-y-5">
              <label className="text-sm font-black">
                Cover image URL
                <input className={inputClass} name="coverImage" value={coverImage} onChange={(event) => setCoverImage(event.target.value)} placeholder="https://… or /images/…" />
              </label>
              <label className="text-sm font-black">
                Cover image alt text
                <input className={inputClass} name="coverImageAlt" value={coverImageAlt} onChange={(event) => setCoverImageAlt(event.target.value)} maxLength={200} placeholder="Describe the image for accessibility" />
              </label>
              <label className="block rounded-2xl border border-dashed border-[#aeb8b0] bg-[#f8f9f7] p-4 text-sm font-black">
                <span className="flex items-center gap-2"><Upload className="size-4" /> Upload cover to R2</span>
                <input className="mt-3 block w-full text-sm font-normal file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--ink)] file:px-4 file:py-2 file:font-bold file:text-white" type="file" accept="image/*" onChange={uploadCover} disabled={uploading} />
                <span className="mt-2 block text-xs font-normal leading-5 text-[var(--ink-muted)]">Images are converted to WebP. Without R2 credentials, enter an image URL above.</span>
              </label>
              {uploading ? <p className="flex items-center gap-2 text-sm font-bold text-[var(--accent-dark)]"><Loader2 className="size-4 animate-spin" /> Uploading and converting image…</p> : null}
              {uploadError ? <p role="alert" className="text-sm font-bold text-[#a33c32]">{uploadError}</p> : null}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Publishing"
          description="Control visibility, the public date, reading time, and the featured position."
          icon={CalendarDays}
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-black">
              Status
              <select className={inputClass} name="status" defaultValue={post?.status ?? "DRAFT"}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
            <label className="text-sm font-black">
              Publication date
              <input className={inputClass} type="date" name="publishedDate" defaultValue={post?.publishedDate ?? ""} />
            </label>
            <label className="text-sm font-black">
              Reading time (minutes)
              <input className={inputClass} type="number" name="readTimeMinutes" min="1" max="120" step="1" defaultValue={post?.readTimeMinutes ?? 5} required />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-[#d7dcd8] bg-[#f8f9f7] p-4 text-sm font-black sm:col-span-2 lg:col-span-3">
              <input className="size-5 accent-[var(--accent-dark)]" type="checkbox" name="featured" defaultChecked={post?.featured ?? false} />
              Feature this article at the top of the public blog
            </label>
          </div>
        </SectionCard>

        <SectionCard
          title="Article content"
          description="Build the article with editable text, headings, lists, quotes, dividers, links, and images."
          icon={Settings2}
        >
          <ContentEditor
            ref={contentEditorRef}
            value={initialContent}
            slug={slug}
            imageAlt={title}
            placeholder="Start with an introduction…"
          />
          <input type="hidden" name="content" defaultValue="" />
          {contentSaveError ? (
            <p role="alert" className="mt-4 text-sm font-bold text-[#a33c32]">
              {contentSaveError}
            </p>
          ) : null}
          {state.errors?.content?.[0] ? (
            <p role="alert" className="mt-4 text-sm font-bold text-[#a33c32]">
              {state.errors.content[0]}
            </p>
          ) : null}
        </SectionCard>

        <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-[#cfd6d0] bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-[var(--ink-muted)]">Draft and archived articles are visible only in this admin area.</p>
          <div className="flex flex-wrap justify-end gap-3">
            <Link href="/admin/blog" className="button-secondary">Cancel</Link>
            <button type="submit" className="button-primary" disabled={pending || uploading}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {pending ? "Saving…" : post ? "Save changes" : "Create article"}
            </button>
          </div>
        </div>
      </form>

      {post && deleteAction ? (
        <section className="rounded-3xl border border-[#e7aaa3] bg-[#fff8f7] p-5 sm:p-7">
          <h2 className="font-black text-[#7d2e27]">Delete article</h2>
          <p className="mt-2 text-sm leading-6 text-[#8c4b45]">This permanently removes the article from the database and public site.</p>
          <form
            action={deleteAction}
            className="mt-4"
            onSubmit={(event) => {
              if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) event.preventDefault();
            }}
          >
            <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#a33c32] px-4 text-sm font-black text-white hover:bg-[#812e27]">
              <Trash2 className="size-4" /> Delete article
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
