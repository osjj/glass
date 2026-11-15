import { parseArticleEditorJson } from "../../src/lib/article-content";

export const oemArticleSlugs = {
  oem: "oem-glassware-design-from-brief-to-shelf",
  spec: "glassware-spec-sheet-guide-wholesale",
  aql: "glassware-defects-aql-inspection-guide",
  packaging: "private-label-glassware-packaging-barcodes",
} as const;

type LinkAddition = {
  beforeHeading: string;
  to: string;
  anchor: string;
  text: string;
};

const link = (slug: string, anchor: string) => `<a href="/blog/${slug}">${anchor}</a>`;

// These headings were checked against the published EditorJS export. Insertions
// stay in the relevant body section and leave every existing block untouched.
const additions: Record<string, readonly LinkAddition[]> = {
  [oemArticleSlugs.oem]: [
    {
      beforeHeading: "03Weight and hand feel",
      to: oemArticleSlugs.spec,
      anchor: "glassware specification-sheet guide",
      text: `Agree the fill convention, measurement method and tolerance for the exact model before sample approval; a generic percentage is not a requirement for every model. Use the ${link(oemArticleSlugs.spec, "glassware specification-sheet guide")} to record those definitions alongside the drawing and approved sample.`,
    },
    {
      beforeHeading: "07Compliance and market",
      to: oemArticleSlugs.packaging,
      anchor: "private-label glassware packaging and barcode guide",
      text: `For retail projects, use the ${link(oemArticleSlugs.packaging, "private-label glassware packaging and barcode guide")} to define the retail unit, any inner pack and shipping carton, and record the packed-sample, label and artwork approvals.`,
    },
    {
      beforeHeading: "07Common Pitfalls and a Checklist",
      to: oemArticleSlugs.aql,
      anchor: "glassware defects and AQL inspection guide",
      text: `Reference AQL figures alone are not a complete inspection plan. Define the inspection unit, lot size, defect classes and acceptance rules, then use the ${link(oemArticleSlugs.aql, "glassware defects and AQL inspection guide")} to document the applicable sampling inputs and decision process.`,
    },
  ],
  [oemArticleSlugs.spec]: [
    {
      beforeHeading: "Capacity: define the fill point before comparing millilitres",
      to: oemArticleSlugs.oem,
      anchor: "OEM glassware design workflow",
      text: `For a custom project, keep this specification record alongside the brief, drawings and sample approvals in the ${link(oemArticleSlugs.oem, "OEM glassware design workflow")}.`,
    },
  ],
  [oemArticleSlugs.aql]: [
    {
      beforeHeading: "Inspect the finished pack, not only loose glass",
      to: oemArticleSlugs.oem,
      anchor: "OEM glassware design workflow",
      text: `For a new custom design, place these inspection stages alongside the development and sample approvals in the ${link(oemArticleSlugs.oem, "OEM glassware design workflow")}.`,
    },
  ],
  [oemArticleSlugs.packaging]: [
    {
      beforeHeading: "7. Use a launch approval checklist",
      to: oemArticleSlugs.oem,
      anchor: "OEM glassware design workflow",
      text: `Use the ${link(oemArticleSlugs.oem, "OEM glassware design workflow")} to coordinate this packing schedule with the glass, decoration and sample approvals.`,
    },
  ],
};

export function patchOemArticleLinks(slug: string, content: string) {
  if (!Object.hasOwn(additions, slug)) throw new Error(`Unsupported OEM link source: ${slug}`);
  const parsed = parseArticleEditorJson(content);
  if (!parsed) throw new Error(`Expected existing EditorJS content: ${slug}`);

  // The parser validates without rebuilding the document. Clone it rather than
  // sanitizing it, so unknown document fields, blocks, data and IDs survive.
  const data = structuredClone(parsed);
  let added = 0;
  for (const addition of additions[slug]) {
    const headings = data.blocks.flatMap((block, index) =>
      block.type === "header" && block.data.text === addition.beforeHeading ? [index] : [],
    );
    if (headings.length !== 1) {
      throw new Error(`Expected one insertion heading: ${slug} / ${addition.beforeHeading}`);
    }
    const existing = data.blocks.filter(block =>
      block.type === "paragraph" && block.data.text === addition.text,
    );
    if (existing.length > 1) throw new Error(`Duplicate OEM link paragraph: ${slug} / ${addition.to}`);
    if (existing.length === 1) continue;

    data.blocks.splice(headings[0], 0, { type: "paragraph", data: { text: addition.text } });
    added += 1;
  }

  return {
    content: added ? JSON.stringify(data) : content,
    added,
    links: additions[slug].map(({ to, anchor }) => ({ from: slug, to, targetSlug: to, anchor, href: `/blog/${to}` })),
  };
}
