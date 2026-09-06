import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getPublicCategoryTree } from "@/lib/public-products";

type HeaderCategories = Awaited<ReturnType<typeof getPublicCategoryTree>>;

async function getHeaderCategories(): Promise<HeaderCategories> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      getPublicCategoryTree(),
      new Promise<HeaderCategories>((resolve) => {
        timeout = setTimeout(() => resolve([]), 3500);
      }),
    ]);
  } catch {
    return [];
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const categories = await getHeaderCategories();
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
      <main className="site-main flex-1 pt-[88px]">{children}</main>
      <SiteFooter />
    </div>
  );
}
