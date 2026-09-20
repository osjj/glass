import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminCaseStudy } from "@/actions/case-studies";
import { AdminHeader } from "@/components/admin/admin-header";
import { CaseStudyForm } from "@/components/admin/case-study-form";

export default async function EditCaseStudyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; conflict?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const post = await getAdminCaseStudy(id);
  if (!post) notFound();
  return <div className="mx-auto max-w-6xl"><AdminHeader eyebrow="Case Studies" title="Edit case study" description={post.title} action={<Link className="button-secondary" href={`/admin/case-studies/${id}/preview`}>Preview saved draft</Link>} />
    {query.saved && <p role="status" className="mt-5 rounded-xl bg-green-50 p-4 text-green-900">Case study saved.</p>}
    {query.conflict && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-900">This case changed in another tab. Review the latest version before deleting.</p>}
    <CaseStudyForm key={post.updatedAt} post={post} />
  </div>;
}
