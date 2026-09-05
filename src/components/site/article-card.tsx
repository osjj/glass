import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { PublicBlogPost } from "@/lib/public-blog";

export function ArticleCard({ article }: { article: PublicBlogPost }) {
  return (
    <article className="group grid overflow-hidden rounded-xl border border-[var(--line)] bg-white sm:grid-cols-[0.82fr_1.18fr]">
      <Link href={`/blog/${article.slug}`} className="relative min-h-64 overflow-hidden bg-[var(--navy)]">
        <Image src={article.coverImage} alt={article.coverImageAlt} fill unoptimized sizes="(min-width: 1024px) 40vw, 100vw" className={`${article.coverImageFit === "contain" ? "object-contain" : "object-cover"} transition duration-500 group-hover:scale-[1.03]`} />
      </Link>
      <div className="flex flex-col p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--blue)]">
          <span>{article.category}</span><span className="size-1 rounded-full bg-[var(--lime-strong)]" /><time dateTime={article.publishedAt}>{article.publishedLabel}</time>
        </div>
        <h3 className="mt-5 text-balance text-2xl font-bold leading-tight tracking-[-0.04em] text-[var(--navy)] sm:text-3xl">
          <Link href={`/blog/${article.slug}`}>{article.title}</Link>
        </h3>
        <p className="mt-4 text-sm leading-6 text-[var(--ink-muted)]">{article.excerpt}</p>
        <Link href={`/blog/${article.slug}`} className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[var(--navy)]">
          Read article <ArrowRight size={17} weight="bold" className="transition group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
