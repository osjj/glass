import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { flattenPublicCategoryTree, type PublicCategory } from "@/lib/public-products";

type CategoryMenuProps = {
  categories: PublicCategory[];
  activeSlug?: string;
  query?: string;
};

export function CategoryMenu({ categories, activeSlug = "", query = "" }: CategoryMenuProps) {
  const items = flattenPublicCategoryTree(categories);
  const activeCategory = items.find((category) => category.slug === activeSlug);
  const allProductsHref = query ? `/products?${new URLSearchParams({ q: query })}` : "/products";
  const navigation = (
    <nav className="max-h-[55dvh] overflow-y-auto overscroll-contain lg:max-h-[calc(100dvh-13rem)]" aria-label="Product categories">
      <ul>
        <li>
          <Link
            href={allProductsHref}
            aria-current={!activeSlug ? "page" : undefined}
            className={`flex min-h-12 items-center justify-between gap-3 border-b border-[#eef0f1] px-5 py-3 text-sm font-semibold transition ${!activeSlug ? "bg-[#e8f1f6] text-[#075989]" : "text-[#4e565c] hover:bg-[#f1f6f9] hover:text-[#075989]"}`}
          >
            All products
            <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
          </Link>
        </li>
        {items.map((category) => {
          const active = category.slug === activeSlug;
          const href = query
            ? `/products?${new URLSearchParams({ category: category.slug, q: query })}`
            : `/products/category/${category.slug}`;

          return (
            <li key={category.id}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                style={{ paddingLeft: `${20 + category.depth * 14}px` }}
                className={`flex min-h-11 items-center justify-between gap-3 border-b border-[#eef0f1] py-3 pr-4 text-sm transition ${active ? "bg-[#e8f1f6] font-semibold text-[#075989]" : "text-[#4e565c] hover:bg-[#f1f6f9] hover:text-[#075989]"}`}
              >
                <span className={`min-w-0 break-words ${category.depth === 0 ? "font-medium" : "text-[0.8125rem]"}`}>{category.label}</span>
                <span className="shrink-0 text-xs tabular-nums text-[#667782]">{category.productCount}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <aside className="min-w-0 self-start border border-[#edf0f2] bg-white shadow-[0_10px_28px_rgba(24,48,66,0.06)] lg:sticky lg:top-28">
      <div className="hidden lg:block">
        <h2 className="bg-[#075989] px-4 py-4 text-lg font-medium uppercase text-white">Product Categories</h2>
        {navigation}
      </div>
      <details key={activeSlug} className="group lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-[#075989] px-4 py-3 text-white [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-sm font-semibold uppercase tracking-wide">Product categories</span>
            <span className="mt-1 block text-xs text-white/80">{activeCategory?.label ?? "All products"}</span>
          </span>
          <ChevronDown className="size-5 shrink-0 transition group-open:rotate-180" aria-hidden="true" />
        </summary>
        {navigation}
      </details>
    </aside>
  );
}
