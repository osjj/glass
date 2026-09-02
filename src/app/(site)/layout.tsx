import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getPublicCategoryTree } from "@/lib/public-products";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const categories = await getPublicCategoryTree();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader categories={categories.map((category) => ({
        slug: category.slug,
        label: category.label,
        productCount: category.productCount,
        children: category.children.map((child) => ({
          slug: child.slug,
          label: child.label,
          productCount: child.productCount,
        })),
      }))} />
      <main className="flex-1 pt-[88px]">{children}</main>
      <SiteFooter />
    </div>
  );
}
