"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { FolderTree, Loader2, Save } from "lucide-react";
import { createCategory, updateCategory } from "@/actions/categories";
import type {
  AdminCategoryInput,
  AdminCategoryParentOption,
  CategoryFormState,
} from "@/types/admin-category";

const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-[#ccd3ce] bg-white px-4 text-sm text-[var(--ink)] shadow-sm transition focus:border-[var(--accent)]";

function buildSlug(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

function FieldError({ messages }: { messages?: string[] }) {
  return messages?.[0] ? (
    <span className="mt-2 block text-xs font-bold text-[#a33c32]">{messages[0]}</span>
  ) : null;
}

export function CategoryForm({
  category,
  parentOptions,
}: {
  category?: AdminCategoryInput;
  parentOptions: AdminCategoryParentOption[];
}) {
  const action = category ? updateCategory.bind(null, category.id) : createCategory;
  const [state, formAction, pending] = useActionState<CategoryFormState, FormData>(action, {});
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const slugWasEdited = useRef(Boolean(category));

  return (
    <form action={formAction} className="mt-7 space-y-6">
      {state.error ? (
        <div className="rounded-2xl border border-[#e4a69f] bg-[#fff0ee] p-4 text-sm font-bold text-[#8d2f27]" role="alert">
          {state.error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-[#d7dcd8] bg-white">
        <div className="flex items-start gap-4 border-b border-[#e4e7e3] bg-[#f5f7f4] p-5 sm:p-6">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--ink)] text-white">
            <FolderTree className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-black">Category details</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--ink-muted)]">
              Use the parent and sort order to control the hierarchy shown in product entry.
            </p>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <label className="text-sm font-black">
            Category name <span className="text-[#a33c32]">*</span>
            <input
              className={inputClass}
              name="name"
              value={name}
              onChange={(event) => {
                const value = event.target.value;
                setName(value);
                if (!slugWasEdited.current) setSlug(buildSlug(value));
              }}
              maxLength={120}
              required
              autoFocus
            />
            <FieldError messages={state.errors?.name} />
          </label>

          <label className="text-sm font-black">
            Slug <span className="text-[#a33c32]">*</span>
            <input
              className={inputClass}
              name="slug"
              value={slug}
              onChange={(event) => {
                slugWasEdited.current = true;
                setSlug(event.target.value);
              }}
              maxLength={180}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              placeholder="shot-glass"
              required
            />
            <FieldError messages={state.errors?.slug} />
          </label>

          <label className="text-sm font-black">
            Parent category
            <select className={inputClass} name="parentId" defaultValue={category?.parentId ?? ""}>
              <option value="">Top-level category</option>
              {parentOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}{option.isActive ? "" : " (inactive)"}
                </option>
              ))}
            </select>
            <FieldError messages={state.errors?.parentId} />
          </label>

          <label className="text-sm font-black">
            Sort order
            <input
              className={inputClass}
              type="number"
              name="sortOrder"
              min="0"
              max="999999"
              step="1"
              defaultValue={category?.sortOrder ?? 0}
              required
            />
            <FieldError messages={state.errors?.sortOrder} />
          </label>

          <div className="sm:col-span-2">
            <label className="flex items-start gap-3 rounded-2xl border border-[#d7dcd8] bg-[#f8f9f7] p-4 text-sm">
              <input
                className="mt-0.5 size-5 accent-[var(--accent-dark)]"
                type="checkbox"
                name="isActive"
                defaultChecked={category?.isActive ?? true}
              />
              <span>
                <strong className="block">Active category</strong>
                <span className="mt-1 block leading-5 text-[var(--ink-muted)]">
                  Active categories are available in product forms and public catalog filters when they contain published products.
                </span>
              </span>
            </label>
            <FieldError messages={state.errors?.isActive} />
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-2xl border border-[#d7dcd8] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-[var(--ink-muted)]">
          {category
            ? "Slug changes are synchronized to linked products that use this as their primary category."
            : "The category will be available immediately according to its active state."}
        </p>
        <div className="flex shrink-0 gap-3">
          <Link href="/admin/categories" className="button-secondary">Cancel</Link>
          <button type="submit" className="button-primary" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            {pending ? "Saving…" : "Save category"}
          </button>
        </div>
      </div>
    </form>
  );
}
