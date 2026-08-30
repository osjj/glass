import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { SetupNotice } from "@/components/admin/setup-notice";

const fieldClass = "mt-2 h-12 w-full rounded-xl border border-[#ccd3ce] bg-white px-4 text-sm text-[var(--ink)]";

export default function NewBlogPostPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/blog" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[var(--ink-muted)] hover:text-[var(--ink)]">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to blog
      </Link>
      <AdminHeader
        eyebrow="Content"
        title="Add article"
        description="Initial form layout for a Markdown-based blog post."
      />
      <div className="mt-6">
        <SetupNotice />
      </div>

      <form className="mt-7 grid gap-6 rounded-3xl border border-[#d7dcd8] bg-white p-6 sm:p-8" aria-label="New article interface preview">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-black">
            Article title
            <input className={fieldClass} type="text" name="title" placeholder="Enter article title" />
          </label>
          <label className="text-sm font-black">
            Slug
            <input className={fieldClass} type="text" name="slug" placeholder="article-slug" />
          </label>
        </div>
        <label className="text-sm font-black">
          Excerpt
          <textarea className="mt-2 min-h-28 w-full rounded-xl border border-[#ccd3ce] bg-white p-4 text-sm" name="excerpt" placeholder="Short article summary" />
        </label>
        <label className="text-sm font-black">
          Content (Markdown)
          <textarea className="mt-2 min-h-80 w-full rounded-xl border border-[#ccd3ce] bg-white p-4 font-mono text-sm leading-6" name="content" placeholder="# Article heading" />
        </label>
        <div className="flex items-center justify-end gap-3 border-t border-[#e4e7e3] pt-6">
          <Link href="/admin/blog" className="button-secondary">Cancel</Link>
          <button type="button" disabled className="button-primary cursor-not-allowed opacity-50" title="Database integration is not connected yet">
            Save draft
          </button>
        </div>
      </form>
    </div>
  );
}
