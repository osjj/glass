import type { CategoryBuyingContent } from "@/data/category-buying-content";

function NoteList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--ink-muted)]">
      {items.map((item) => (
        <li key={item} className="grid grid-cols-[0.5rem_1fr] gap-3">
          <span className="mt-[0.55rem] size-1.5 rounded-full bg-[var(--blue)]" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function CategoryBuyingNotes({
  categoryLabel,
  content,
}: {
  categoryLabel: string;
  content: CategoryBuyingContent;
}) {
  return (
    <section className="mb-7 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6" aria-labelledby="category-buying-notes-title">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--blue)]">Wholesale buying notes</p>
      <h2 id="category-buying-notes-title" className="mt-2 text-2xl font-bold tracking-[-0.035em] text-[var(--navy)]">
        Plan your {categoryLabel.toLowerCase()} inquiry
      </h2>
      <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--ink-muted)]">{content.introduction}</p>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <article className="rounded-xl border border-[var(--line)] bg-white p-5">
          <h3 className="text-base font-bold text-[var(--navy)]">Suitable buying scenarios</h3>
          <NoteList items={content.useCases} />
        </article>
        <article className="rounded-xl border border-[var(--line)] bg-white p-5">
          <h3 className="text-base font-bold text-[var(--navy)]">What to compare</h3>
          <NoteList items={content.comparisonPoints} />
        </article>
        <article className="rounded-xl border border-[var(--line)] bg-white p-5">
          <h3 className="text-base font-bold text-[var(--navy)]">Prepare your inquiry</h3>
          <NoteList items={content.inquiryChecklist} />
        </article>
      </div>
    </section>
  );
}
