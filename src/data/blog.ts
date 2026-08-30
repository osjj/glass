export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readTime: string;
  featured: boolean;
  image: string;
  imageAlt: string;
  content: Array<{ heading?: string; paragraphs: string[] }>;
};

export const articles: Article[] = [
  {
    slug: "how-to-build-a-clear-glassware-shortlist",
    title: "How to build a clear glassware product shortlist",
    excerpt: "Turn a broad buying request into a comparable collection before discussing decoration or packing.",
    category: "Buying guide",
    publishedAt: "2026-08-30",
    readTime: "5 min read",
    featured: true,
    image: "/images/home/hero-glassware.webp",
    imageAlt: "Assorted clear glassware displayed inside a modern warehouse showroom",
    content: [
      {
        paragraphs: [
          "A useful glassware shortlist starts with the intended market and use case, not a long list of shapes. Record the product family, target capacity range, decoration needs, packing format, and expected order scale before comparing options.",
          "Keep confirmed requirements separate from preferences. This makes it easier to request missing information without turning an early concept into a fixed product claim.",
        ],
      },
      { heading: "Start with the collection role", paragraphs: ["Group items by the role they play in the assortment: core drinkware, statement pieces, serving items, or supporting storage and bakeware. A clear role helps control overlap and keeps the collection easier to merchandise."] },
      { heading: "Use the same comparison fields", paragraphs: ["For each candidate, capture the same fields: glass type, dimensions, capacity, weight, finish, decoration, packing, available documents, and lead-time information. Leave unknown fields open until the source is confirmed."] },
    ],
  },
  {
    slug: "machine-made-and-handmade-glassware",
    title: "Machine-made and handmade glassware: what changes",
    excerpt: "A practical comparison of consistency, finish, assortment flexibility, and the data buyers should confirm.",
    category: "Product knowledge",
    publishedAt: "2026-08-27",
    readTime: "4 min read",
    featured: false,
    image: "/images/home/glassware-production.webp",
    imageAlt: "Glassware production, inspection, and packing in a modern factory",
    content: [
      { paragraphs: ["Production method influences shape consistency, surface character, available decoration, and order planning. The right choice depends on the collection goal rather than a simple quality ranking."] },
      { heading: "Compare the finished result", paragraphs: ["Review the exact approved sample and define which visual variations are acceptable. Record the selected finish and tolerance expectations in a form that can be checked again during production."] },
      { heading: "Keep process claims source-backed", paragraphs: ["Do not infer the manufacturing method from a product photograph alone. Connect each claim to supplier documentation or a confirmed production record."] },
    ],
  },
  {
    slug: "questions-before-a-custom-glassware-order",
    title: "Questions to confirm before a custom glassware order",
    excerpt: "Align shape, decoration, packing, sample approval, and order assumptions before comparing offers.",
    category: "Sourcing notes",
    publishedAt: "2026-08-24",
    readTime: "6 min read",
    featured: false,
    image: "/images/home/category-colored.webp",
    imageAlt: "Cobalt, smoke, and amber colored glassware in a showroom",
    content: [
      { paragraphs: ["Custom glassware comparisons become unreliable when every offer is based on a different interpretation of the shape, color, decoration, or packaging. Align the product definition before requesting final commercial terms."] },
      { heading: "Confirm the approved reference", paragraphs: ["Identify which drawing, sample, color reference, and artwork file controls the order. Keep revisions traceable so production and packing reviews use the same approved version."] },
      { heading: "Record what changed", paragraphs: ["If the profile, quantity, decoration, packaging, or delivery assumption changes, update the comparison before choosing an offer. This keeps the final decision reviewable."] },
    ],
  },
];

export function getArticleBySlug(slug: string) {
  return articles.find((article) => article.slug === slug);
}
