import Link from "next/link";
import { InquiryButton } from "@/components/site/inquiry-contact";
import type { CategoryBuyingContent } from "@/data/category-buying-content";
import styles from "./product-pages.module.css";

function NoteList({ items }: { items: string[] }) {
  return (
    <ul className={styles.noteList}>
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

export function CategoryBuyingNotes({ content }: { content: CategoryBuyingContent }) {
  return (
    <section className={styles.notePanel} aria-labelledby="category-buying-notes-title">
      <p className={styles.noteEyebrow}>Buying notes</p>
      <h2 id="category-buying-notes-title">How to choose {content.label}</h2>

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
          <InquiryButton className={styles.noteAsk} product={{ name: content.label }}>Request a quote</InquiryButton>
        </div>
      </div>
    </section>
  );
}
