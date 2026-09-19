export const shotGlassArticleSlug = "shot-glass-buying-guide-for-wholesale-buyers";
export const shotGlassCapacityArticleSlug = "shot-glass-capacity-check-ml-fl-oz-fill-levels";

type ArticleProductSection = {
  beforeHeadingId: string;
  title: string;
  intro: string;
  inquiryLabel: string;
  brief: "shot-glass";
};

const articleProductSections: Record<string, ArticleProductSection> = {
  [shotGlassArticleSlug]: {
    beforeHeadingId: "4-specify-the-glass-and-decoration-separately",
    title: "Compare shot glass profiles",
    intro: "Use these catalog examples to prepare your shortlist. Confirm capacity, dimensions and packing for your selected glass and decoration.",
    inquiryLabel: "Quote this glass",
    brief: "shot-glass",
  },
  [shotGlassCapacityArticleSlug]: {
    beforeHeadingId: "7-request-comparable-samples-and-a-quotation",
    title: "Shot Glasses to Compare for Your Capacity Check",
    intro: "Choose a catalog model for your sample check. Confirm its capacity convention, intended fill and headspace using the approval record above.",
    inquiryLabel: "Request a Sample / Quote",
    brief: "shot-glass",
  },
};

export function getArticleProductSection(articleSlug: string) {
  return Object.hasOwn(articleProductSections, articleSlug) ? articleProductSections[articleSlug] : undefined;
}

export const articleProductSelections: Record<string, Array<{
  slug: string;
  label: string;
  buyingNote: string;
}>> = {
  [shotGlassArticleSlug]: [
    {
      slug: "wholesale-1-7oz-transparent-shot-glass",
      label: "Short, clear profile",
      buyingNote: "Compare the rim, base and usable fill on a sample. Confirm the capacity convention and dimensions before choosing the pack.",
    },
    {
      slug: "personalized-shot-glasses-greece-beaches-decal-promotional-tall-shot-glasses",
      label: "Tall, decorated profile",
      buyingNote: "Compare artwork space and shelf height. Confirm your design, print area and protective packaging on a decorated sample.",
    },
  ],
  [shotGlassCapacityArticleSlug]: [
    {
      slug: "wholesale-1-7oz-transparent-shot-glass",
      label: "Short, clear profile",
      buyingNote: "Ask for capacity in mL and the brimful measurement method. Check your intended fill and measure the remaining space below the rim on the sample.",
    },
    {
      slug: "personalized-shot-glasses-greece-beaches-decal-promotional-tall-shot-glasses",
      label: "Tall, decorated profile",
      buyingNote: "Verify the catalog capacity on the selected sample. Check the intended liquid level against the rim and artwork; a decorative line is not a confirmed volume mark.",
    },
  ],
};

export function isArticleProduct(articlePath: string, productSlug: string) {
  const articleSlug = /^\/blog\/([^/]+)$/.exec(articlePath)?.[1];
  const selections = articleSlug ? articleProductSelections[articleSlug] : undefined;
  return Array.isArray(selections) && selections.some((item) => item.slug === productSlug);
}
