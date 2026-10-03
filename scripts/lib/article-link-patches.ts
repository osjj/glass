import { parseArticleEditorJson, type ArticleEditorData } from "../../src/lib/article-content";

export const articleSlugs = {
  buying: "shot-glass-buying-guide-for-wholesale-buyers",
  capacity: "shot-glass-capacity-check-ml-fl-oz-fill-levels",
  logo: "custom-logo-shot-glasses-artwork-sample-approval-checklist",
  packaging: "shot-glass-packaging-bulk-dividers-gift-boxes-carton-checks",
  moq: "shot-glass-moq-wholesale-quote-comparison",
  coffee: "coffee-tea-glassware-buying-guide",
} as const;

const link = (slug: string, label: string) => `<a href="/blog/${slug}">${label}</a>`;
const insertions: Record<string, Array<{ before: string; text: string }>> = {
  [articleSlugs.buying]: [
    { before: "3. Compare cup profiles using actual products", text: `For a repeatable sample record, use the ${link(articleSlugs.capacity, "shot glass capacity-check guide")} to distinguish nominal size, brimful capacity and the intended fill level.` },
    { before: "5. Confirm care instructions and supporting documents", text: `Use the ${link(articleSlugs.logo, "custom logo artwork and sample approval checklist")} to record the proof revision, printable area and decorated-sample findings before approval.` },
    { before: "7. Approve a sample that represents the order", text: `Review divider fit, gift-box scope and carton counts with the ${link(articleSlugs.packaging, "shot glass packaging checklist")}. Then use the ${link(articleSlugs.moq, "MOQ and wholesale quote comparison guide")} to separate quantities per design, included packing and one-time charges.` },
  ],
  [articleSlugs.logo]: [
    { before: "7. Sign off a specific version and define change control", text: `Use the ${link(articleSlugs.packaging, "shot glass packaging checklist")} to record divider fit, gift-box contents and carton counts for the decorated sample.` },
    { before: "Frequently asked questions", text: `Before comparing prices, use the ${link(articleSlugs.moq, "shot glass MOQ and quotation guide")} to separate quantities per artwork, decoration charges and packing scope.` },
  ],
  [articleSlugs.packaging]: [
    { before: "Frequently asked questions", text: `For a like-for-like commercial comparison, use the ${link(articleSlugs.moq, "shot glass MOQ and quotation checklist")} to record quantities per model, included packing and separately charged setup work.` },
  ],
};

const repairs: Record<string, [string, string]> = {
  [articleSlugs.packaging]: ["https://www.ista.org/getting<i>started</i>with_design.php", "https://www.ista.org/getting_started_with_design.php"],
  [articleSlugs.coffee]: ["https://global.hario.com/faq/glass<i>1</i>en.pdf", "https://global.hario.com/faq/glass_1_en.pdf"],
};

export const patchSlugs = [articleSlugs.buying, articleSlugs.logo, articleSlugs.packaging, articleSlugs.coffee];

export function patchArticleLinks(slug: string, content: string) {
  const parsed = parseArticleEditorJson(content);
  if (!parsed) throw new Error(`Expected existing EditorJS content: ${slug}`);
  let data: ArticleEditorData = structuredClone(parsed);
  let repaired = 0;
  const repair = repairs[slug];
  if (repair) {
    let serialized = JSON.stringify(data);
    // Existing CMS sanitization may have escaped the corrupt emphasis tags.
    for (const broken of [repair[0], repair[0].replaceAll("<", "&lt;").replaceAll(">", "&gt;")]) {
      repaired += serialized.split(broken).length - 1;
      serialized = serialized.replaceAll(broken, repair[1]);
    }
    if (!repaired && !serialized.includes(repair[1])) throw new Error(`Reference URL not recognized: ${slug}`);
    data = JSON.parse(serialized);
  }
  let added = 0;
  for (const addition of insertions[slug] ?? []) {
    if (data.blocks.some(b => b.type === "paragraph" && b.data.text === addition.text)) continue;
    const headings = data.blocks.map((b, i) => b.type === "header" && b.data.text === addition.before ? i : -1).filter(i => i >= 0);
    if (headings.length !== 1) throw new Error(`Expected one insertion heading: ${slug} / ${addition.before}`);
    data.blocks.splice(headings[0], 0, { type: "paragraph", data: { text: addition.text } });
    added += 1;
  }
  return { content: added || repaired ? JSON.stringify(data) : content, added, repaired };
}
