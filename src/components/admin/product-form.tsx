"use client";

import { useActionState, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  CircleDollarSign,
  FileText,
  ImageIcon,
  ListChecks,
  Loader2,
  Plus,
  Save,
  Shapes,
  Tags,
  Trash2,
} from "lucide-react";
import { createProduct, updateProduct } from "@/actions/products";
import { ContentEditor, type ContentEditorRef } from "@/components/admin/content-editor";
import { productCategories } from "@/data/catalog";
import { parseStoredArticleContent } from "@/lib/article-content";
import type {
  AdminProductInput,
  ProductFormState,
  ProductPairInput,
} from "@/types/admin-product";

const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-[#ccd3ce] bg-white px-4 text-sm text-[var(--ink)] shadow-sm transition focus:border-[var(--accent)]";
const textareaClass =
  "mt-2 w-full rounded-xl border border-[#ccd3ce] bg-white p-4 text-sm text-[var(--ink)] shadow-sm transition focus:border-[var(--accent)]";
const emptyPair = (): ProductPairInput => ({ label: "", value: "" });

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

function PairEditor({
  rows,
  onChange,
  labelPlaceholder,
  valuePlaceholder,
  addLabel,
}: {
  rows: ProductPairInput[];
  onChange: (rows: ProductPairInput[]) => void;
  labelPlaceholder: string;
  valuePlaceholder: string;
  addLabel: string;
}) {
  const visibleRows = rows.length ? rows : [emptyPair()];

  function update(index: number, key: keyof ProductPairInput, value: string) {
    const next = visibleRows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, [key]: value } : row,
    );
    onChange(next);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= visibleRows.length) return;
    const next = [...visibleRows];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {visibleRows.map((row, index) => (
        <div key={index} className="grid gap-3 rounded-2xl border border-[#e1e5e1] bg-[#fafbfa] p-3 sm:grid-cols-[0.8fr_1.2fr_auto] sm:items-center">
          <input
            className="h-11 rounded-xl border border-[#ccd3ce] bg-white px-3 text-sm"
            value={row.label}
            onChange={(event) => update(index, "label", event.target.value)}
            placeholder={labelPlaceholder}
            aria-label={`${labelPlaceholder} ${index + 1}`}
          />
          <input
            className="h-11 rounded-xl border border-[#ccd3ce] bg-white px-3 text-sm"
            value={row.value}
            onChange={(event) => update(index, "value", event.target.value)}
            placeholder={valuePlaceholder}
            aria-label={`${valuePlaceholder} ${index + 1}`}
          />
          <div className="flex justify-end gap-1">
            <button type="button" className="rounded-lg p-2 text-[var(--ink-muted)] hover:bg-white hover:text-[var(--ink)]" onClick={() => move(index, -1)} aria-label={`Move row ${index + 1} up`} disabled={index === 0}>
              <ArrowUp className="size-4" />
            </button>
            <button type="button" className="rounded-lg p-2 text-[var(--ink-muted)] hover:bg-white hover:text-[var(--ink)]" onClick={() => move(index, 1)} aria-label={`Move row ${index + 1} down`} disabled={index === visibleRows.length - 1}>
              <ArrowDown className="size-4" />
            </button>
            <button type="button" className="rounded-lg p-2 text-[#a33c32] hover:bg-[#fff0ee]" onClick={() => onChange(visibleRows.filter((_, rowIndex) => rowIndex !== index))} aria-label={`Delete row ${index + 1}`}>
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="button-secondary" onClick={() => onChange([...visibleRows, emptyPair()])}>
        <Plus className="size-4" aria-hidden="true" />
        {addLabel}
      </button>
    </div>
  );
}

export function ProductForm({ product }: { product?: AdminProductInput }) {
  const formAction = useMemo(
    () => (product ? updateProduct.bind(null, product.id) : createProduct),
    [product],
  );
  const [state, action, actionPending] = useActionState<ProductFormState, FormData>(formAction, {});
  const [transitionPending, startTransition] = useTransition();
  const pending = actionPending || transitionPending;
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [images, setImages] = useState(product?.images ?? []);
  const [attributes, setAttributes] = useState<ProductPairInput[]>(product?.attributes ?? []);
  const [specifications, setSpecifications] = useState<ProductPairInput[]>(product?.specifications ?? []);
  const [features, setFeatures] = useState<string[]>(product?.features ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [contentSaveError, setContentSaveError] = useState<string | null>(null);
  const contentEditorRef = useRef<ContentEditorRef>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const initialContent = useMemo(
    () => parseStoredArticleContent(product?.content),
    [product?.content],
  );

  const submittedImages = images.filter((image) => image.url.trim() || image.alt.trim());
  const submittedAttributes = attributes.filter((row) => row.label.trim() || row.value.trim());
  const submittedSpecifications = specifications.filter((row) => row.label.trim() || row.value.trim());
  const submittedFeatures = features.map((value) => value.trim()).filter(Boolean);
  const validationMessages = Object.entries(state.errors ?? {}).flatMap(([field, messages]) =>
    messages.map((message) => `${field}: ${message}`),
  );

  function updateImage(index: number, key: "url" | "alt", value: string) {
    setImages((current) => current.map((image, imageIndex) => imageIndex === index ? { ...image, [key]: value } : image));
  }

  function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next);
  }

  async function uploadImages(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    input.value = "";
    if (files.length === 0) return;

    if (images.length + files.length > 12) {
      setUploadError(`You can add ${12 - images.length} more image${12 - images.length === 1 ? "" : "s"}.`);
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      for (const [index, file] of files.entries()) {
        setUploadProgress(`Uploading ${index + 1} of ${files.length}…`);
        const uploadData = new FormData();
        uploadData.set("image", file);
        uploadData.set("slug", slug);
        uploadData.set("alt", name || file.name.replace(/\.[^.]+$/, ""));

        const response = await fetch("/api/admin/product-images", {
          method: "POST",
          body: uploadData,
        });
        const payload = await response.json().catch(() => null) as {
          image?: { url: string; alt: string };
          error?: string;
        } | null;

        if (!response.ok || !payload?.image) {
          throw new Error(payload?.error || "The image could not be uploaded.");
        }
        setImages((current) => [...current, payload.image!]);
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "The image could not be uploaded.");
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  }

  async function submitProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = formRef.current;
    if (!form) return;

    try {
      const content = await contentEditorRef.current?.save();
      if (!content) throw new Error("Wait for the product content editor to finish loading.");
      const contentInput = form.elements.namedItem("content") as HTMLInputElement | null;
      if (!contentInput) throw new Error("The product rich-content field is unavailable.");
      contentInput.value = JSON.stringify(content);
      setContentSaveError(null);
      startTransition(() => action(new FormData(form)));
    } catch (error) {
      setContentSaveError(
        error instanceof Error ? error.message : "The product rich content could not be prepared.",
      );
    }
  }

  return (
    <form ref={formRef} onSubmit={submitProduct} className="mt-7 space-y-6">
      <input type="hidden" name="images" value={JSON.stringify(submittedImages)} />
      <input type="hidden" name="attributes" value={JSON.stringify(submittedAttributes)} />
      <input type="hidden" name="specifications" value={JSON.stringify(submittedSpecifications)} />
      <input type="hidden" name="features" value={JSON.stringify(submittedFeatures)} />
      <input type="hidden" name="content" defaultValue="" />

      {(state.error || validationMessages.length > 0) && (
        <div role="alert" className="rounded-2xl border border-[#e7aaa3] bg-[#fff1ef] p-4 text-sm text-[#7d2e27]">
          <p className="font-black">Please review the product information.</p>
          {state.error ? <p className="mt-1">{state.error}</p> : null}
          {validationMessages.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {validationMessages.map((message) => <li key={message}>{message}</li>)}
            </ul>
          ) : null}
        </div>
      )}

      <SectionCard title="Basic Information" description="Core catalog identity, publication state, and ordering." icon={FileText}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-black sm:col-span-2">
            Product name <span className="text-[#a33c32]">*</span>
            <input className={inputClass} name="name" value={name} onChange={(event) => {
              const value = event.target.value;
              setName(value);
              if (!slug || slug === buildSlug(name)) setSlug(buildSlug(value));
            }} required />
          </label>
          <label className="text-sm font-black">
            Slug <span className="text-[#a33c32]">*</span>
            <input className={inputClass} name="slug" value={slug} onChange={(event) => setSlug(event.target.value)} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
          </label>
          <label className="text-sm font-black">
            SKU
            <input className={inputClass} name="sku" defaultValue={product?.sku ?? ""} placeholder="GLA-DW-001" />
          </label>
          <label className="text-sm font-black sm:col-span-2">
            Short summary <span className="text-[#a33c32]">*</span>
            <textarea className={`${textareaClass} min-h-28`} name="summary" defaultValue={product?.summary ?? ""} required maxLength={500} />
          </label>
          <label className="text-sm font-black">
            Status
            <select className={inputClass} name="status" defaultValue={product?.status ?? "DRAFT"}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          <label className="text-sm font-black">
            Sort order
            <input className={inputClass} type="number" min="0" step="1" name="sortOrder" defaultValue={product?.sortOrder ?? 0} />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-[#d7dcd8] bg-[#f8f9f7] p-4 text-sm font-black sm:col-span-2">
            <input className="size-5 accent-[var(--accent-dark)]" type="checkbox" name="featured" defaultChecked={product?.featured ?? false} />
            Feature this product in curated catalog areas
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Images" description="Upload up to 12 gallery images directly to R2, then arrange their display order." icon={ImageIcon}>
        <label className="block rounded-2xl border border-dashed border-[#aeb8b0] bg-[#f8f9f7] p-5 text-sm font-black">
          Select image files
          <input
            className="mt-3 block w-full text-sm font-normal file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--ink)] file:px-4 file:py-2 file:font-bold file:text-white disabled:opacity-50"
            type="file"
            accept="image/*"
            multiple
            onChange={uploadImages}
            disabled={uploading || images.length >= 12}
          />
          <span className="mt-2 block text-xs font-normal leading-5 text-[var(--ink-muted)]">
            Each file can be up to 12 MB. Images are converted to WebP and uploaded immediately. {images.length}/12 images added.
          </span>
          {uploading ? (
            <span className="mt-3 flex items-center gap-2 text-xs text-[var(--accent-dark)]" aria-live="polite">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> {uploadProgress}
            </span>
          ) : null}
        </label>
        {uploadError ? <p className="mt-3 rounded-xl bg-[#fff1ef] px-4 py-3 text-sm font-bold text-[#7d2e27]" role="alert">{uploadError}</p> : null}
        <div className="mt-5 space-y-3">
          {images.map((image, index) => (
            <div key={image.url} className="grid gap-3 rounded-2xl border border-[#e1e5e1] bg-[#fafbfa] p-3 sm:grid-cols-[5rem_1fr_auto] sm:items-center">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-[#e8ece8]">
                <Image src={image.url} alt={image.alt} fill sizes="80px" className="object-cover" />
              </div>
              <input className="h-11 rounded-xl border border-[#ccd3ce] bg-white px-3 text-sm" value={image.alt} onChange={(event) => updateImage(index, "alt", event.target.value)} placeholder="Image alt text" aria-label={`Image alt text ${index + 1}`} />
              <div className="flex justify-end gap-1">
                <button type="button" className="rounded-lg p-2 text-[var(--ink-muted)] hover:bg-white" onClick={() => moveImage(index, -1)} disabled={index === 0} aria-label={`Move image ${index + 1} up`}><ArrowUp className="size-4" /></button>
                <button type="button" className="rounded-lg p-2 text-[var(--ink-muted)] hover:bg-white" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} aria-label={`Move image ${index + 1} down`}><ArrowDown className="size-4" /></button>
                <button type="button" className="rounded-lg p-2 text-[#a33c32] hover:bg-[#fff0ee]" onClick={() => setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))} aria-label={`Delete image ${index + 1}`}><Trash2 className="size-4" /></button>
              </div>
            </div>
          ))}
          {images.length === 0 ? <p className="rounded-2xl border border-[#e1e5e1] bg-[#fafbfa] px-5 py-8 text-center text-sm text-[var(--ink-muted)]">No product images uploaded yet.</p> : null}
        </div>
      </SectionCard>

      <SectionCard title="Pricing" description="Simple base price and minimum-order information." icon={CircleDollarSign}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-black">Base price <span className="text-[#a33c32]">*</span><input className={inputClass} name="price" type="number" min="0" step="0.01" defaultValue={product?.price ?? 0} required /></label>
          <label className="text-sm font-black">Compare price<input className={inputClass} name="comparePrice" type="number" min="0" step="0.01" defaultValue={product?.comparePrice ?? ""} /></label>
          <label className="text-sm font-black">Cost<input className={inputClass} name="cost" type="number" min="0" step="0.01" defaultValue={product?.cost ?? ""} /></label>
          <label className="text-sm font-black">Currency<select className={inputClass} name="currency" defaultValue={product?.currency ?? "USD"}><option value="USD">USD</option><option value="EUR">EUR</option><option value="CNY">CNY</option></select></label>
          <label className="text-sm font-black">Minimum order quantity<input className={inputClass} name="moq" type="number" min="1" step="1" defaultValue={product?.moq ?? 1} required /></label>
          <label className="text-sm font-black">Unit<input className={inputClass} name="unit" defaultValue={product?.unit ?? "piece"} placeholder="piece, set, carton" required /></label>
        </div>
      </SectionCard>

      <SectionCard title="Attributes" description="Buyer-facing filter values such as material, color, finish, or shape." icon={Tags}>
        <PairEditor rows={attributes} onChange={setAttributes} labelPlaceholder="Attribute name" valuePlaceholder="Attribute value" addLabel="Add attribute" />
      </SectionCard>

      <SectionCard title="Specifications" description="Technical product parameters such as capacity, dimensions, weight, and packing." icon={ListChecks}>
        <PairEditor rows={specifications} onChange={setSpecifications} labelPlaceholder="Specification name" valuePlaceholder="Specification value" addLabel="Add specification" />
      </SectionCard>

      <SectionCard title="Category" description="Place the product in the correct public catalog family." icon={Shapes}>
        <label className="block max-w-xl text-sm font-black">
          Product category <span className="text-[#a33c32]">*</span>
          <select className={inputClass} name="category" defaultValue={product?.category ?? ""} required>
            <option value="" disabled>Select a category</option>
            {productCategories.map((category) => <option key={category.slug} value={category.slug}>{category.label}</option>)}
          </select>
        </label>
      </SectionCard>

      <SectionCard title="Product Details" description="Long-form product copy and concise selling-point highlights." icon={FileText}>
        <label className="text-sm font-black">
          Detailed description
          <textarea className={`${textareaClass} min-h-56`} name="description" defaultValue={product?.description ?? ""} placeholder="Materials, design, use, customization, packing, and other confirmed details…" />
        </label>
        <div className="mt-6 border-t border-[#e4e7e3] pt-6">
          <h3 className="font-black">Highlights</h3>
          <div className="mt-3 space-y-3">
            {(features.length ? features : [""]).map((feature, index) => (
              <div key={index} className="flex gap-2">
                <input className="h-11 min-w-0 flex-1 rounded-xl border border-[#ccd3ce] bg-white px-3 text-sm" value={feature} onChange={(event) => {
                  const next = features.length ? [...features] : [""];
                  next[index] = event.target.value;
                  setFeatures(next);
                }} placeholder="Add a concise product highlight" aria-label={`Product highlight ${index + 1}`} />
                <button type="button" className="rounded-lg p-2 text-[#a33c32] hover:bg-[#fff0ee]" onClick={() => setFeatures((current) => current.filter((_, featureIndex) => featureIndex !== index))} aria-label={`Delete highlight ${index + 1}`}><Trash2 className="size-4" /></button>
              </div>
            ))}
            <button type="button" className="button-secondary" onClick={() => setFeatures((current) => [...current, ""])}><Plus className="size-4" /> Add highlight</button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Rich Product Content"
        description="Add structured product storytelling with editable text, headings, lists, quotes, dividers, links, and detail images."
        icon={ImageIcon}
      >
        <ContentEditor
          ref={contentEditorRef}
          value={initialContent}
          slug={slug}
          imageAlt={name}
          placeholder="Add detailed product text and images…"
          uploadEndpoint="/api/admin/product-images"
          contentLabel="product"
        />
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

      <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-[#c9d0ca] bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--ink-muted)]">{product ? "Saving updates this product record and all ordered child fields." : "The new product will be saved to PostgreSQL."}</p>
        <div className="flex justify-end gap-3">
          <Link href="/admin/products" className="button-secondary">Cancel</Link>
          <button type="submit" className="button-primary" disabled={pending || uploading}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            {pending ? "Saving…" : product ? "Save changes" : "Create product"}
          </button>
        </div>
      </div>
    </form>
  );
}
