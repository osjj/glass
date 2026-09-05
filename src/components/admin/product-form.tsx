"use client";

import { useActionState, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  FileInput,
  FileText,
  ImageIcon,
  Layers3,
  ListChecks,
  Loader2,
  Plus,
  Save,
  Shapes,
  Sparkles,
  Trash2,
} from "lucide-react";
import { createProduct, updateProduct } from "@/actions/products";
import { AiImageEditorModal } from "@/components/admin/ai-image-editor-modal";
import {
  PRODUCT_DETAIL_STATEMENT_MAX_ITEMS,
  PRODUCT_DETAIL_STATEMENT_MAX_LENGTH,
} from "@/lib/product-limits";
import type {
  AdminCategoryOption,
  AdminProductContentSectionInput,
  AdminProductImageInput,
  AdminProductInput,
  ProductFormState,
  ProductPairInput,
} from "@/types/admin-product";

const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-[#ccd3ce] bg-white px-4 text-sm text-[var(--ink)] shadow-sm transition focus:border-[var(--accent)]";
const textareaClass =
  "mt-2 w-full rounded-xl border border-[#ccd3ce] bg-white p-4 text-sm text-[var(--ink)] shadow-sm transition focus:border-[var(--accent)]";
const emptyPair = (): ProductPairInput => ({ label: "", value: "" });
const emptySection = (index: number): AdminProductContentSectionInput => ({
  sourceKey: `content_section_${index + 1}`,
  title: "Content Section",
  body: "",
  images: [],
});
const defaultOverviewFields = (): ProductPairInput[] => [
  { label: "Material", value: "" },
  { label: "Package", value: "" },
  { label: "Usage", value: "" },
  { label: "Capacity", value: "" },
  { label: "Size", value: "" },
];
const defaultContentSections = (): AdminProductContentSectionInput[] => [
  { sourceKey: "product_description", title: "Product Description", body: "", images: [] },
  { sourceKey: "more_size", title: "More Size", body: "", images: [] },
  { sourceKey: "oem_and_odm", title: "OEM and ODM", body: "", images: [] },
  { sourceKey: "production_processing", title: "Production Processing", body: "", images: [] },
  { sourceKey: "different_package", title: "Different Package", body: "", images: [] },
];
const emptyEditorContent = JSON.stringify({ time: 0, blocks: [], version: "2.31.6" });

type AiImageTarget =
  | { kind: "gallery"; imageIndex: number }
  | { kind: "section"; sectionIndex: number; imageIndex: number };

function buildSlug(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

function buildSectionKey(value: string, fallbackIndex: number) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || `content_section_${fallbackIndex + 1}`;
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
    onChange(visibleRows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
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
          <input className="h-11 rounded-xl border border-[#ccd3ce] bg-white px-3 text-sm" value={row.label} onChange={(event) => update(index, "label", event.target.value)} placeholder={labelPlaceholder} aria-label={`${labelPlaceholder} ${index + 1}`} />
          <input className="h-11 rounded-xl border border-[#ccd3ce] bg-white px-3 text-sm" value={row.value} onChange={(event) => update(index, "value", event.target.value)} placeholder={valuePlaceholder} aria-label={`${valuePlaceholder} ${index + 1}`} />
          <div className="flex justify-end gap-1">
            <button type="button" className="rounded-lg p-2 text-[var(--ink-muted)] hover:bg-white hover:text-[var(--ink)]" onClick={() => move(index, -1)} aria-label={`Move row ${index + 1} up`} disabled={index === 0}><ArrowUp className="size-4" /></button>
            <button type="button" className="rounded-lg p-2 text-[var(--ink-muted)] hover:bg-white hover:text-[var(--ink)]" onClick={() => move(index, 1)} aria-label={`Move row ${index + 1} down`} disabled={index === visibleRows.length - 1}><ArrowDown className="size-4" /></button>
            <button type="button" className="rounded-lg p-2 text-[#a33c32] hover:bg-[#fff0ee]" onClick={() => onChange(visibleRows.filter((_, rowIndex) => rowIndex !== index))} aria-label={`Delete row ${index + 1}`}><Trash2 className="size-4" /></button>
          </div>
        </div>
      ))}
      <button type="button" className="button-secondary" onClick={() => onChange([...visibleRows, emptyPair()])}><Plus className="size-4" />{addLabel}</button>
    </div>
  );
}

function ImageRows({
  images,
  onChange,
  onAiEdit,
  imageLabel,
}: {
  images: AdminProductImageInput[];
  onChange: (images: AdminProductImageInput[]) => void;
  onAiEdit: (imageIndex: number) => void;
  imageLabel: string;
}) {
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {images.map((image, index) => (
        <div key={`${image.url}-${index}`} className="grid gap-3 rounded-2xl border border-[#e1e5e1] bg-[#fafbfa] p-3 sm:grid-cols-[5rem_1fr_auto] sm:items-center">
          <div className="group relative aspect-square overflow-hidden rounded-xl bg-[#e8ece8]">
            <Image src={image.url} alt={image.alt} fill unoptimized sizes="80px" className="object-cover" />
            <button
              type="button"
              className="absolute right-1.5 top-1.5 z-10 inline-flex h-8 items-center gap-1 rounded-lg border border-white/40 bg-[var(--ink)] px-2 text-[var(--acid)] opacity-100 shadow-lg transition hover:scale-105 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
              onClick={() => onAiEdit(index)}
              aria-label={"Edit " + imageLabel + " " + (index + 1) + " with AI"}
              title="Edit image with AI"
            >
              <Sparkles className="size-3.5" aria-hidden="true" />
              <span className="text-[10px] font-black tracking-wide">AI</span>
            </button>
          </div>
          <input className="h-11 rounded-xl border border-[#ccd3ce] bg-white px-3 text-sm" value={image.alt} onChange={(event) => onChange(images.map((item, imageIndex) => imageIndex === index ? { ...item, alt: event.target.value } : item))} placeholder="Image alt text" aria-label={`Image alt text ${index + 1}`} />
          <div className="flex justify-end gap-1">
            <button type="button" className="rounded-lg p-2 text-[var(--ink-muted)] hover:bg-white" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move image ${index + 1} up`}><ArrowUp className="size-4" /></button>
            <button type="button" className="rounded-lg p-2 text-[var(--ink-muted)] hover:bg-white" onClick={() => move(index, 1)} disabled={index === images.length - 1} aria-label={`Move image ${index + 1} down`}><ArrowDown className="size-4" /></button>
            <button type="button" className="rounded-lg p-2 text-[#a33c32] hover:bg-[#fff0ee]" onClick={() => onChange(images.filter((_, imageIndex) => imageIndex !== index))} aria-label={`Delete image ${index + 1}`}><Trash2 className="size-4" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductForm({
  product,
  categories,
}: {
  product?: AdminProductInput;
  categories: AdminCategoryOption[];
}) {
  const formAction = useMemo(() => product ? updateProduct.bind(null, product.id) : createProduct, [product]);
  const [state, action, actionPending] = useActionState<ProductFormState, FormData>(formAction, {});
  const [transitionPending, startTransition] = useTransition();
  const pending = actionPending || transitionPending;
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [images, setImages] = useState<AdminProductImageInput[]>(product?.images ?? []);
  const [overviewFields, setOverviewFields] = useState<ProductPairInput[]>(product?.overviewFields.length ? product.overviewFields : defaultOverviewFields());
  const [specifications, setSpecifications] = useState<ProductPairInput[]>(product?.specifications ?? []);
  const [features, setFeatures] = useState<string[]>(product?.features ?? []);
  const [contentSections, setContentSections] = useState<AdminProductContentSectionInput[]>(product?.contentSections.length ? product.contentSections : defaultContentSections());
  const [pricingMode, setPricingMode] = useState(product?.pricingMode ?? "REQUEST_QUOTE");
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [aiImageTarget, setAiImageTarget] = useState<AiImageTarget | null>(null);

  const aiSourceImage = aiImageTarget?.kind === "gallery"
    ? images[aiImageTarget.imageIndex] ?? null
    : aiImageTarget?.kind === "section"
      ? contentSections[aiImageTarget.sectionIndex]?.images[aiImageTarget.imageIndex] ?? null
      : null;

  function finishAiImageEdit(replacement: AdminProductImageInput) {
    if (!aiImageTarget) return;
    if (aiImageTarget.kind === "gallery") {
      setImages((current) =>
        current.map((image, index) =>
          index === aiImageTarget.imageIndex ? replacement : image,
        ),
      );
    } else {
      setContentSections((current) =>
        current.map((section, sectionIndex) =>
          sectionIndex === aiImageTarget.sectionIndex
            ? {
                ...section,
                images: section.images.map((image, imageIndex) =>
                  imageIndex === aiImageTarget.imageIndex ? replacement : image,
                ),
              }
            : section,
        ),
      );
    }
    setAiImageTarget(null);
  }

  const submittedImages = images.filter((image) => image.url.trim());
  const submittedOverview = overviewFields.filter((row) => row.label.trim() && row.value.trim());
  const submittedSpecifications = specifications.filter((row) => row.label.trim() && row.value.trim());
  const submittedFeatures = features.map((value) => value.trim()).filter(Boolean);
  const submittedSections = contentSections
    .map((section, index) => ({
      ...section,
      sourceKey: buildSectionKey(section.sourceKey || section.title, index),
      title: section.title.trim(),
      body: section.body.trim(),
      images: section.images.filter((image) => image.url.trim()),
    }))
    .filter((section) => section.title || section.body || section.images.length);
  const validationMessages = Object.entries(state.errors ?? {}).flatMap(([field, messages]) => messages.map((message) => `${field}: ${message}`));

  async function uploadFiles(files: File[], target: string) {
    if (!files.length) return [];
    setUploadingTarget(target);
    setUploadError(null);
    const uploadedImages: AdminProductImageInput[] = [];
    try {
      for (const [index, file] of files.entries()) {
        setUploadProgress(`Uploading ${index + 1} of ${files.length}…`);
        const uploadData = new FormData();
        uploadData.set("image", file);
        uploadData.set("slug", slug);
        uploadData.set("alt", name || file.name.replace(/\.[^.]+$/, ""));
        const response = await fetch("/api/admin/product-images", { method: "POST", body: uploadData });
        const payload = await response.json().catch(() => null) as { image?: AdminProductImageInput; error?: string } | null;
        if (!response.ok || !payload?.image) throw new Error(payload?.error || "The image could not be uploaded.");
        uploadedImages.push(payload.image);
      }
      return uploadedImages;
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "The image could not be uploaded.");
      return [];
    } finally {
      setUploadingTarget(null);
      setUploadProgress("");
    }
  }

  async function uploadGallery(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    input.value = "";
    if (images.length + files.length > 20) {
      setUploadError("The product gallery supports up to 20 images.");
      return;
    }
    const uploaded = await uploadFiles(files, "gallery");
    if (uploaded.length) setImages((current) => [...current, ...uploaded]);
  }

  async function uploadSectionImages(sectionIndex: number, event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    input.value = "";
    const section = contentSections[sectionIndex];
    if (!section || section.images.length + files.length > 12) {
      setUploadError("Each content section supports up to 12 images.");
      return;
    }
    const uploaded = await uploadFiles(files, `section-${sectionIndex}`);
    if (!uploaded.length) return;
    setContentSections((current) => current.map((item, index) => index === sectionIndex ? { ...item, images: [...item.images, ...uploaded] } : item));
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= contentSections.length) return;
    const next = [...contentSections];
    [next[index], next[target]] = [next[target], next[index]];
    setContentSections(next);
  }

  function submitProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = formRef.current;
    if (!form) return;
    startTransition(() => action(new FormData(form)));
  }

  return (
    <form ref={formRef} onSubmit={submitProduct} className="mt-7 space-y-6">
      <input type="hidden" name="images" value={JSON.stringify(submittedImages)} />
      <input type="hidden" name="overviewFields" value={JSON.stringify(submittedOverview)} />
      <input type="hidden" name="specifications" value={JSON.stringify(submittedSpecifications)} />
      <input type="hidden" name="features" value={JSON.stringify(submittedFeatures)} />
      <input type="hidden" name="contentSections" value={JSON.stringify(submittedSections)} />
      <input type="hidden" name="attributes" value="[]" />
      <input type="hidden" name="content" value={product?.content || emptyEditorContent} />

      {(state.error || validationMessages.length > 0) ? (
        <div role="alert" className="rounded-2xl border border-[#e7aaa3] bg-[#fff1ef] p-4 text-sm text-[#7d2e27]">
          <p className="font-black">Please review the product information.</p>
          {state.error ? <p className="mt-1">{state.error}</p> : null}
          {validationMessages.length ? <ul className="mt-2 list-disc space-y-1 pl-5">{validationMessages.map((message) => <li key={message}>{message}</li>)}</ul> : null}
        </div>
      ) : null}

      <SectionCard title="1. Source and identity" description="The fields Garbo exposes at the top of a product page, plus Glarivo publication controls." icon={FileInput}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-black sm:col-span-2">Product name <span className="text-[#a33c32]">*</span><input className={inputClass} name="name" value={name} onChange={(event) => { const value = event.target.value; setName(value); if (!slug || slug === buildSlug(name)) setSlug(buildSlug(value)); }} required /></label>
          <label className="text-sm font-black">Slug <span className="text-[#a33c32]">*</span><input className={inputClass} name="slug" value={slug} onChange={(event) => setSlug(event.target.value)} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label>
          <label className="text-sm font-black">Item No. / SKU<input className={inputClass} name="sku" defaultValue={product?.sku ?? ""} placeholder="GB070103H" /></label>
          <label className="text-sm font-black">Source<select className={inputClass} name="sourceProvider" defaultValue={product?.sourceProvider ?? "MANUAL"}><option value="MANUAL">Manual</option><option value="GARBO">Garbo</option></select></label>
          <label className="text-sm font-black">Source category path<input className={inputClass} name="sourceCategoryPath" defaultValue={product?.sourceCategoryPath ?? ""} placeholder="/shot-glass/" /></label>
          <label className="text-sm font-black sm:col-span-2">Source URL<input className={inputClass} type="url" name="sourceUrl" defaultValue={product?.sourceUrl ?? ""} placeholder="https://www.garboglass.com/shot-glass/...html" /></label>
          <label className="text-sm font-black sm:col-span-2">Catalog summary <span className="text-[#a33c32]">*</span><textarea className={`${textareaClass} min-h-24`} name="summary" defaultValue={product?.summary ?? ""} required maxLength={500} /></label>
        </div>
      </SectionCard>

      <SectionCard title="2. Top overview fields" description="These ordered rows appear beside the product gallery exactly like Garbo's Material, Package, Usage, Capacity, and Size list." icon={ListChecks}>
        <PairEditor rows={overviewFields} onChange={setOverviewFields} labelPlaceholder="Field label" valuePlaceholder="Field value" addLabel="Add overview field" />
      </SectionCard>

      <SectionCard title="3. Product gallery" description="Upload the main product views in display order. The first image is the primary image." icon={ImageIcon}>
        <label className="block rounded-2xl border border-dashed border-[#aeb8b0] bg-[#f8f9f7] p-5 text-sm font-black">
          Select gallery images
          <input className="mt-3 block w-full text-sm font-normal file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--ink)] file:px-4 file:py-2 file:font-bold file:text-white disabled:opacity-50" type="file" accept="image/*" multiple onChange={uploadGallery} disabled={Boolean(uploadingTarget) || images.length >= 20} />
          <span className="mt-2 block text-xs font-normal leading-5 text-[var(--ink-muted)]">Images are converted to WebP and uploaded to R2. {images.length}/20 images added.</span>
        </label>
        {uploadingTarget === "gallery" ? <p className="mt-3 flex items-center gap-2 text-xs font-bold text-[var(--accent-dark)]"><Loader2 className="size-4 animate-spin" />{uploadProgress}</p> : null}
        {uploadError ? <p className="mt-3 rounded-xl bg-[#fff1ef] px-4 py-3 text-sm font-bold text-[#7d2e27]" role="alert">{uploadError}</p> : null}
        <div className="mt-5">
          <ImageRows
            images={images}
            onChange={setImages}
            imageLabel="gallery image"
            onAiEdit={(imageIndex) => setAiImageTarget({ kind: "gallery", imageIndex })}
          />
        </div>
      </SectionCard>

      <SectionCard title="4. Details" description="Garbo's Details heading and ordered selling-point statements." icon={FileText}>
        <label className="block text-sm font-black">Section heading<input className={inputClass} name="detailsHeading" defaultValue={product?.detailsHeading ?? "Details"} required /></label>
        <label className="mt-5 block text-sm font-black">Fallback description<textarea className={`${textareaClass} min-h-32`} name="description" defaultValue={product?.description ?? ""} placeholder="Used only when no detail bullets are present." /></label>
        <div className="mt-6 space-y-3">
          {(features.length ? features : [""]).map((feature, index) => (
            <div key={index} className="flex gap-2">
              <div className="min-w-0 flex-1">
                <textarea className="min-h-20 w-full rounded-xl border border-[#ccd3ce] bg-white p-3 text-sm" value={feature} onChange={(event) => { const next = features.length ? [...features] : [""]; next[index] = event.target.value; setFeatures(next); }} placeholder="Add one source detail statement" aria-label={`Detail statement ${index + 1}`} maxLength={PRODUCT_DETAIL_STATEMENT_MAX_LENGTH} />
                <p className="mt-1 text-right text-xs text-[var(--ink-muted)]">{feature.length}/{PRODUCT_DETAIL_STATEMENT_MAX_LENGTH} characters</p>
              </div>
              <button type="button" className="self-start rounded-lg p-2 text-[#a33c32] hover:bg-[#fff0ee]" onClick={() => setFeatures((current) => current.filter((_, featureIndex) => featureIndex !== index))} aria-label={`Delete detail statement ${index + 1}`}><Trash2 className="size-4" /></button>
            </div>
          ))}
          <button type="button" className="button-secondary" onClick={() => setFeatures((current) => [...current, ""])} disabled={features.length >= PRODUCT_DETAIL_STATEMENT_MAX_ITEMS}><Plus className="size-4" />Add detail statement</button>
        </div>
      </SectionCard>

      <SectionCard title="5. Specification table" description="An ordered two-column table matching the Garbo product specification block." icon={ListChecks}>
        <label className="mb-5 block text-sm font-black">Section heading<input className={inputClass} name="specificationHeading" defaultValue={product?.specificationHeading ?? "Specifications"} required /></label>
        <PairEditor rows={specifications} onChange={setSpecifications} labelPlaceholder="Specification label" valuePlaceholder="Specification value" addLabel="Add specification row" />
      </SectionCard>

      <SectionCard title="6. Ordered content sections" description="These sections render after the specification table, matching Garbo's More Size, OEM and ODM, Production Processing, and packaging blocks." icon={Layers3}>
        <div className="space-y-5">
          {contentSections.map((section, sectionIndex) => (
            <article key={`${section.sourceKey}-${sectionIndex}`} className="rounded-2xl border border-[#dfe4df] bg-[#fafbfa] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--ink-muted)]">Section {sectionIndex + 1}</p><h3 className="mt-1 font-black">{section.title || "Untitled section"}</h3></div>
                <div className="flex gap-1">
                  <button type="button" className="rounded-lg p-2 text-[var(--ink-muted)] hover:bg-white" onClick={() => moveSection(sectionIndex, -1)} disabled={sectionIndex === 0} aria-label={`Move section ${sectionIndex + 1} up`}><ArrowUp className="size-4" /></button>
                  <button type="button" className="rounded-lg p-2 text-[var(--ink-muted)] hover:bg-white" onClick={() => moveSection(sectionIndex, 1)} disabled={sectionIndex === contentSections.length - 1} aria-label={`Move section ${sectionIndex + 1} down`}><ArrowDown className="size-4" /></button>
                  <button type="button" className="rounded-lg p-2 text-[#a33c32] hover:bg-[#fff0ee]" onClick={() => setContentSections((current) => current.filter((_, index) => index !== sectionIndex))} aria-label={`Delete section ${sectionIndex + 1}`}><Trash2 className="size-4" /></button>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-black">Title<input className={inputClass} value={section.title} onChange={(event) => setContentSections((current) => current.map((item, index) => index === sectionIndex ? { ...item, title: event.target.value } : item))} /></label>
                <label className="text-sm font-black">Stable section key<input className={inputClass} value={section.sourceKey} onChange={(event) => setContentSections((current) => current.map((item, index) => index === sectionIndex ? { ...item, sourceKey: buildSectionKey(event.target.value, sectionIndex) } : item))} /></label>
                <label className="text-sm font-black sm:col-span-2">Optional text<textarea className={`${textareaClass} min-h-24`} value={section.body} onChange={(event) => setContentSections((current) => current.map((item, index) => index === sectionIndex ? { ...item, body: event.target.value } : item))} /></label>
              </div>
              <label className="mt-4 block rounded-xl border border-dashed border-[#aeb8b0] bg-white p-4 text-sm font-black">
                Add section images
                <input className="mt-3 block w-full text-sm font-normal file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--ink)] file:px-4 file:py-2 file:font-bold file:text-white disabled:opacity-50" type="file" accept="image/*" multiple onChange={(event) => uploadSectionImages(sectionIndex, event)} disabled={Boolean(uploadingTarget) || section.images.length >= 12} />
              </label>
              {uploadingTarget === `section-${sectionIndex}` ? <p className="mt-3 flex items-center gap-2 text-xs font-bold text-[var(--accent-dark)]"><Loader2 className="size-4 animate-spin" />{uploadProgress}</p> : null}
              <div className="mt-4">
                <ImageRows
                  images={section.images}
                  onChange={(nextImages) => setContentSections((current) => current.map((item, index) => index === sectionIndex ? { ...item, images: nextImages } : item))}
                  imageLabel="detail image"
                  onAiEdit={(imageIndex) => setAiImageTarget({ kind: "section", sectionIndex, imageIndex })}
                />
              </div>
            </article>
          ))}
          <button type="button" className="button-secondary" onClick={() => setContentSections((current) => [...current, emptySection(current.length)])}><Plus className="size-4" />Add content section</button>
        </div>
      </SectionCard>

      <SectionCard title="7. Category and commercial settings" description="Category membership is selected here but maintained by the separate category-management task." icon={Shapes}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-black sm:col-span-2 lg:col-span-3">Product category <span className="text-[#a33c32]">*</span><select className={inputClass} name="categoryId" defaultValue={product?.categoryId ?? ""} required><option value="" disabled>Select a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.depth ? `${"— ".repeat(category.depth)}${category.name}` : category.name}</option>)}</select></label>
          <label className="text-sm font-black">Pricing mode<select className={inputClass} name="pricingMode" value={pricingMode} onChange={(event) => setPricingMode(event.target.value as typeof pricingMode)}><option value="REQUEST_QUOTE">Request quote</option><option value="FIXED">Fixed price</option><option value="TIERED">Tiered pricing</option></select></label>
          <label className="text-sm font-black">Base price<input className={inputClass} name="price" type="number" min="0" step="0.01" defaultValue={product?.price ?? ""} required={pricingMode === "FIXED"} placeholder={pricingMode === "REQUEST_QUOTE" ? "Leave empty" : "0.00"} /></label>
          <label className="text-sm font-black">Currency<select className={inputClass} name="currency" defaultValue={product?.currency ?? "USD"}><option value="USD">USD</option><option value="EUR">EUR</option><option value="CNY">CNY</option></select></label>
          <label className="text-sm font-black">Compare price<input className={inputClass} name="comparePrice" type="number" min="0" step="0.01" defaultValue={product?.comparePrice ?? ""} /></label>
          <label className="text-sm font-black">Cost<input className={inputClass} name="cost" type="number" min="0" step="0.01" defaultValue={product?.cost ?? ""} /></label>
          <label className="text-sm font-black">MOQ<input className={inputClass} name="moq" type="number" min="1" step="1" defaultValue={product?.moq ?? ""} /></label>
          <label className="text-sm font-black">Unit<input className={inputClass} name="unit" defaultValue={product?.unit ?? ""} placeholder="piece, set, carton" /></label>
          <label className="text-sm font-black">Status<select className={inputClass} name="status" defaultValue={product?.status ?? "DRAFT"}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></label>
          <label className="text-sm font-black">Sort order<input className={inputClass} type="number" min="0" step="1" name="sortOrder" defaultValue={product?.sortOrder ?? 0} /></label>
          <label className="flex items-center gap-3 rounded-2xl border border-[#d7dcd8] bg-[#f8f9f7] p-4 text-sm font-black sm:col-span-2 lg:col-span-3"><input className="size-5 accent-[var(--accent-dark)]" type="checkbox" name="featured" defaultChecked={product?.featured ?? false} />Feature this product in curated catalog areas</label>
        </div>
      </SectionCard>

      <div className="sticky bottom-4 z-30 flex flex-col gap-3 rounded-2xl border border-[#c9d0ca] bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--ink-muted)]">Saving replaces this product&apos;s ordered page sections. Category records are not modified.</p>
        <div className="flex justify-end gap-3">
          <Link href="/admin/products" className="button-secondary">Cancel</Link>
          <button type="submit" className="button-primary" disabled={pending || Boolean(uploadingTarget)}>{pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{pending ? "Saving…" : product ? "Save changes" : "Create product"}</button>
        </div>
      </div>

      {aiSourceImage ? (
        <AiImageEditorModal
          open
          sourceImage={aiSourceImage}
          slug={slug}
          onClose={() => setAiImageTarget(null)}
          onFinish={finishAiImageEdit}
        />
      ) : null}
    </form>
  );
}
