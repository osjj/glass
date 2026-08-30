import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleCheck, Eye } from "lucide-react";
import { getAdminBlogPost } from "@/actions/blog";
import { AdminHeader } from "@/components/admin/admin-header";
import { BlogForm } from "@/components/admin/blog-form";

type EditBlogPostPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function EditBlogPostPage({ params, searchParams }: EditBlogPostPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const post = await getAdminBlogPost(id);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/blog" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[var(--ink-muted)] hover:text-[var(--ink)]">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to blog
      </Link>
      <AdminHeader
        eyebrow="Content"
        title="Edit Article"
        description={`Maintain ${post.title}, its publication settings, cover, and rich article content.`}
        action={post.status === "PUBLISHED" ? (
          <Link href={`/blog/${post.slug}`} className="button-secondary"><Eye className="size-4" /> View article</Link>
        ) : undefined}
      />
      {query.saved ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#acd3b0] bg-[#edf9ee] p-4 text-sm font-bold text-[#286a31]" role="status">
          <CircleCheck className="size-5" aria-hidden="true" />
          {query.saved === "created" ? "Article created successfully." : "Article changes saved successfully."}
        </div>
      ) : null}
      <BlogForm post={post} />
    </div>
  );
}
