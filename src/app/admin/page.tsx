import Link from "next/link";
import { ArrowRight, BookOpenText, Boxes, CircleCheck, MessageSquareText } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { SetupNotice } from "@/components/admin/setup-notice";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [productCount, publishedProductCount, blogPostCount, publishedBlogPostCount, newInquiryCount] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
    prisma.inquiry.count({ where: { status: "NEW" } }),
  ]);
  const metrics = [
    { label: "New inquiries", value: newInquiryCount, icon: MessageSquareText, href: "/admin/inquiries" },
    { label: "Products", value: productCount, icon: Boxes, href: "/admin/products" },
    { label: "Blog posts", value: blogPostCount, icon: BookOpenText, href: "/admin/blog" },
    { label: "Published products", value: publishedProductCount, icon: CircleCheck, href: "/products" },
    { label: "Published articles", value: publishedBlogPostCount, icon: CircleCheck, href: "/blog" },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl">
      <AdminHeader
        eyebrow="Glarivo admin"
        title="Dashboard"
        description="Manage the product catalog, blog, and customer inquiries."
      />
      <div className="mt-6">
        <SetupNotice />
      </div>

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="group rounded-3xl border border-[#d7dcd8] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <span className="grid size-10 place-items-center rounded-2xl bg-[var(--acid)]">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <ArrowRight className="size-4 text-[var(--ink-muted)] transition group-hover:translate-x-1" aria-hidden="true" />
            </div>
            <strong className="mt-8 block text-4xl font-black tracking-[-0.06em]">{value}</strong>
            <span className="mt-1 block text-sm font-bold text-[var(--ink-muted)]">{label}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
