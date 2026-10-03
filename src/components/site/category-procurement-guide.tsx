import Link from "next/link";
import type { CategoryProcurementContent } from "@/data/category-procurement-content";
import type { PublicProduct } from "@/lib/public-products";
import styles from "./product-pages.module.css";

export function CategoryProcurementSelection({ content }: { content: CategoryProcurementContent }) {
  return (
    <section className={styles.procurementSelection} aria-labelledby="category-selection-title">
      <div className={styles.procurementHeading}>
        <h2 id="category-selection-title">{content.selectionTitle}</h2>
        <Link href="#category-comparison">Compare models ↓</Link>
      </div>
      <div className={styles.selectionGrid}>
        {content.choices.map((choice) => (
          <div key={choice.title} className={styles.selectionChoice}>
            <h3>{choice.title}</h3>
            <p>{choice.text}</p>
            {choice.models.map((slug) => {
              const model = content.models.find((item) => item.slug === slug)!;
              return <Link key={slug} href={`/products/${slug}`}>{model.name} →</Link>;
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

export function CategoryProcurementComparison({ content, products }: { content: CategoryProcurementContent; products: PublicProduct[] }) {
  return (
    <section id="category-comparison" className={styles.procurementComparison} aria-labelledby="category-comparison-title">
      <h2 id="category-comparison-title">{content.comparisonTitle}</h2>
      <table className={styles.comparisonTable}>
        <caption className="sr-only">{content.comparisonTitle}</caption>
        <thead><tr><th scope="col">Model</th>{content.columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead>
        <tbody>
          {content.models.map((model) => {
            const product = products.find((item) => item.slug === model.slug)!;
            return (
              <tr key={model.slug}>
                <th scope="row"><Link href={`/products/${model.slug}`}>{model.name}</Link>{product.sku && <span>{product.sku}</span>}</th>
                {model.values.map((value, index) => <td key={content.columns[index]}><span className={styles.mobileColumn} aria-hidden="true">{content.columns[index]}</span>{value}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
      <nav className={styles.procurementGuides} aria-label="Related procurement guides">
        {content.guides.map((guide) => <Link key={guide.href} href={guide.href}>{guide.label} →</Link>)}
      </nav>
    </section>
  );
}
