import Image from "next/image";
import Link from "next/link";
import { CircleCheck, Eye, FileText, Pencil, Plus, Star } from "lucide-react";
import { getAdminBlogPosts } from "@/actions/blog";
import { AdminHeader } from "@/components/admin/admin-header";

type AdminBlogPageProps = {
  searchParams: Promise<{ deleted?: string }>;
};

function formatDate(date: Date | null) {
  if (!date) return "Not published";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default async function AdminBlogPage({ searchParams }: AdminBlogPageProps) {
  const [posts, query] = await Promise.all([getAdminBlogPosts(), searchParams]);

  return (
    <div className="mx-auto max-w-7xl">
      <AdminHeader
        eyebrow="Content"
        title="Blog"
        description="Create, edit, publish, and archive database-backed articles for the Glarivo journal."
        action={
          <Link href="/admin/blog/new" className="button-primary">
            <Plus className="size-4" aria-hidden="true" />
            Add article
          </Link>
        }
      />

      {query.deleted ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#acd3b0] bg-[#edf9ee] p-4 text-sm font-bold text-[#286a31]" role="status">
          <CircleCheck className="size-5" aria-hidden="true" />
          Article deleted successfully.
        </div>
      ) : null}

      <div className="mt-7 overflow-hidden rounded-3xl border border-[#d7dcd8] bg-white">
        {posts.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-left">
              <thead className="border-b border-[#d7dcd8] bg-[#f5f7f4] text-[0.68rem] font-black uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                <tr>
                  <th className="px-5 py-4">Article</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Publication</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4e7e3]">
                {posts.map((post) => (
                  <tr key={post.id} className="text-sm">
                    <td className="max-w-xl px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-[#eef0ed]">
                          {post.coverImage ? (
                            <Image src={post.coverImage} alt={post.coverImageAlt || post.title} fill unoptimized sizes="56px" className="object-cover" />
                          ) : (
                            <FileText className="absolute inset-0 m-auto size-5 text-[var(--ink-muted)]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <strong className="flex items-center gap-2 text-[var(--ink)]">
                            <span className="truncate">{post.title}</span>
                            {post.featured ? <Star className="size-4 shrink-0 fill-[var(--acid)] text-[#78930d]" aria-label="Featured" /> : null}
                          </strong>
                          <span className="mt-1 block truncate text-xs text-[var(--ink-muted)]">/blog/{post.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[var(--ink-muted)]">{post.category}</td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-[var(--ink)]">{formatDate(post.publishedAt)}</span>
                      <span className="mt-1 block text-xs text-[var(--ink-muted)]">Updated {formatDate(post.updatedAt)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${post.status === "PUBLISHED" ? "bg-[#e8f5e6] text-[#286a31]" : post.status === "ARCHIVED" ? "bg-[#eceeed] text-[#68706a]" : "bg-[#fff5e8] text-[#82522d]"}`}>
                        {post.status.charAt(0) + post.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-4">
                        {post.status === "PUBLISHED" ? (
                          <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-1.5 font-black text-[var(--ink-muted)] hover:text-[var(--ink)]">
                            <Eye className="size-4" /> View
                          </Link>
                        ) : null}
                        <Link href={`/admin/blog/${post.id}`} className="inline-flex items-center gap-1.5 font-black text-[var(--accent-dark)] hover:underline">
                          <Pencil className="size-4" /> Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-20 text-center">
            <FileText className="mx-auto size-9 text-[var(--ink-muted)]" />
            <h2 className="mt-5 text-2xl font-black tracking-[-0.04em]">No database articles yet.</h2>
            <p className="mt-3 text-sm text-[var(--ink-muted)]">Create the first article and choose Published when it is ready for the public blog.</p>
            <Link href="/admin/blog/new" className="button-primary mt-7"><Plus className="size-4" /> Add article</Link>
          </div>
        )}
      </div>
    </div>
  );
}
