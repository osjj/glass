import Link from "next/link";
import { InquiryButton } from "@/components/site/inquiry-contact";
import type { CategoryBuyingContent } from "@/data/category-buying-content";
import type { InquiryContext } from "@/lib/inquiries";
import styles from "./product-pages.module.css";

function NoteList({ items }: { items: string[] }) {
  return (
    <ul className={styles.noteList}>
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

export function CategoryBuyingNotes({ content, brief }: { content: CategoryBuyingContent; brief?: InquiryContext["brief"] }) {
  return (
    <section className={styles.notePanel} aria-labelledby="category-buying-notes-title">
      <p className={styles.noteEyebrow}>Buying notes</p>
      <h2 id="category-buying-notes-title">How to choose {content.label}</h2>
      {content.introduction && !brief ? <p className={styles.noteIntroduction}>{content.introduction}</p> : null}
      {content.models ? <div className={styles.modelTableScroll} tabIndex={0} role="region" aria-label="Napkin holder model comparison">
        <table className={styles.modelTable}>
          <caption>Model dimensions and packing</caption>
          <thead><tr><th scope="col">Item number</th><th scope="col">Top size / height / base size</th><th scope="col">Packing</th></tr></thead>
          <tbody>{content.models.map(model => <tr key={model.sku}>
            <th scope="row"><Link href={`/products/${model.slug}`}>{model.sku}</Link></th>
            <td>{model.dimensions ?? "Provided with quotation"}</td><td>{model.packing ?? "Quoted per order"}</td>
          </tr>)}</tbody>
        </table>
      </div> : null}

      <div className={styles.noteGrid}>
        <div>
          <h3>Check before shortlisting</h3>
          <NoteList items={content.comparisonPoints} />
        </div>
        <div>
          <h3>Tell us for a quote</h3>
          <NoteList items={content.inquiryChecklist} />
        </div>
      </div>

      <div className={styles.noteActions}>
        <p>Send item numbers and quantities for the exact models.</p>
        <div>
          <Link href="#category-products" className={styles.noteBrowse}>View products</Link>
          <InquiryButton className={styles.noteAsk} product={{ name: content.label, brief }}>Request a quote</InquiryButton>
        </div>
      </div>
    </section>
  );
}
