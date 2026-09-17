export const shotGlassArticleSlug = "shot-glass-buying-guide-for-wholesale-buyers";

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
};

export function isArticleProduct(articlePath: string, productSlug: string) {
  const articleSlug = /^\/blog\/([^/]+)$/.exec(articlePath)?.[1];
  const selections = articleSlug ? articleProductSelections[articleSlug] : undefined;
  return Array.isArray(selections) && selections.some((item) => item.slug === productSlug);
}
