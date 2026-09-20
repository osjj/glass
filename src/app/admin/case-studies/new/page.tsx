import { requireAdmin } from "@/lib/admin-auth";
import { AdminHeader } from "@/components/admin/admin-header";
import { CaseStudyForm } from "@/components/admin/case-study-form";

export default async function NewCaseStudyPage() {
  await requireAdmin();
  return <div className="mx-auto max-w-6xl"><AdminHeader eyebrow="Case Studies" title="Add case study" description="Build a customer case with an introduction, project metrics, chapters, images and outcomes." /><CaseStudyForm /></div>;
}
