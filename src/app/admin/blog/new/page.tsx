import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { BlogForm } from "@/components/admin/blog-form";
import { requireAdmin } from "@/lib/admin-auth";

export default async function NewBlogPostPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/blog" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[var(--ink-muted)] hover:text-[var(--ink)]">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to blog
      </Link>
      <AdminHeader
        eyebrow="Content"
        title="Add Article"
        description="Create rich article content with editable text, images, and structured blocks."
      />
      <BlogForm />
    </div>
  );
}
