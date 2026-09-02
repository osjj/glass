import { GARBO_BASE_URL } from "@/lib/garbo-shot-glass";

export type GarboSourceCategoryDefinition = {
  sourceName: string;
  sourceSlug: string;
  sourcePath: string;
  sourceUrl: string;
  parentPath: string | null;
  depth: number;
  sortOrder: number;
};

type CategoryBranch = {
  name: string;
  slug: string;
  children?: readonly { name: string; slug: string }[];
};

const branches: readonly CategoryBranch[] = [
  { name: "Glass Cups", slug: "glass-tumblers" },
  { name: "Engraved Glass Cups", slug: "engraved-glass-cups" },
  { name: "Shot Glass", slug: "shot-glass" },
  { name: "Glass Mugs", slug: "glass-mugs", children: [
    { name: "Glass Coffee Mugs", slug: "glass-coffee-mugs" },
    { name: "Glass Beer Mugs", slug: "glass-beer-mugs" },
    { name: "Glass Cup And Saucer", slug: "glass-cup-and-saucer" },
    { name: "Double Wall Glass Mug", slug: "double-wall-glass-mug" },
    { name: "Glass Tea Mug", slug: "glass-tea-mug" },
  ] },
  { name: "Glass Pitchers&Teapot", slug: "glass-pitchers-teapot", children: [
    { name: "Glass Pitchers", slug: "glass-pitchers" },
    { name: "Glass Teapots", slug: "glass-teapots" },
    { name: "Borosilicate Glass Teapot", slug: "borosilicate-glass-teapot" },
    { name: "Borosilicate Glass Pitcher", slug: "borosilicate-glass-pitcher" },
  ] },
  { name: "Glass Decanters", slug: "glass-decanters", children: [
    { name: "Glass Wine Decanter", slug: "glass-wine-decanter" },
    { name: "Glass Whiskey Decanter", slug: "glass-whiskey-decanter" },
    { name: "Whiskey Decanter Set", slug: "whiskey-decanter-set" },
  ] },
  { name: "Glassware Set", slug: "glassware-set" },
  { name: "Glass Bowls", slug: "glass-bowls" },
  { name: "Glass Plates", slug: "glass-plates" },
  { name: "Glass Candy Jars", slug: "glass-candy-jars" },
  { name: "Glass Vases", slug: "glass-vases" },
  { name: "Glass Ice Cream Cups", slug: "glass-ice-cream-cups" },
  { name: "Glass Ice Buckets", slug: "glass-ice-buckets" },
  { name: "Glass Bottles", slug: "glass-bottles-wholesale" },
  { name: "Glass Jars", slug: "glass-jars", children: [
    { name: "Glass Storage Jars", slug: "glass-storage-jars" },
    { name: "Glass Storage Jars Set", slug: "glass-storage-jars-set" },
    { name: "Mason Jar Glasses", slug: "mason-jar-glasses" },
    { name: "Glass Bathroom Accessory", slug: "glass-bathroom-accessory" },
  ] },
  { name: "Baking Glassware", slug: "baking-glassware", children: [
    { name: "Glass Baking Dish", slug: "glass-baking-dish" },
    { name: "Glass Baking Bowls", slug: "glass-baking-bowls" },
    { name: "Glass Casserole Dish", slug: "glass-casserole-dish" },
  ] },
  { name: "Borosilicate Glassware", slug: "borosilicate-glassware", children: [
    { name: "Borosilicate Glass Bottle", slug: "borosilicate-glass-bottle" },
    { name: "Borosilicate Glass Jar", slug: "borosilicate-glass-jar" },
    { name: "Borosilicate Glass Cup", slug: "borosilicate-glass-cup" },
    { name: "Glass Coffee Maker", slug: "glass-coffee-maker" },
    { name: "Pyrex Glassware", slug: "pyrex-glassware" },
  ] },
  { name: "Glass Stemware", slug: "glass-stemware", children: [
    { name: "Cheap Wine Glasses", slug: "cheap-wine-glasses" },
    { name: "Cheap Champagne Glasses", slug: "cheap-champagne-glasses" },
    { name: "Vintage Goblet", slug: "vintage-wine-glasses" },
    { name: "Cocktail Glassware", slug: "cocktail-glassware" },
  ] },
  { name: "Glass Ashtray", slug: "glass-ashtray" },
  { name: "Glass Napkin Holders", slug: "glass-napkin-holders" },
  { name: "Glass Fruit bowl & Plates", slug: "glass-fruit-bowl-plates", children: [
    { name: "Glass Fruit Bowl", slug: "glass-fruit-bowl" },
    { name: "Glass Fruit Plate", slug: "glass-fruit-plate" },
  ] },
  { name: "Glass Candle Holders", slug: "glass-candle-holders" },
  { name: "Glass Food Containers", slug: "glass-food-containers" },
  { name: "Opal Glassware", slug: "opal-glassware" },
  { name: "Colored Glassware", slug: "colored-glassware" },
  { name: "Glass Beverage Dispenser", slug: "glass-beverage-dispenser" },
];

function sourceRecord(
  name: string,
  slug: string,
  parentPath: string | null,
  depth: number,
  sortOrder: number,
): GarboSourceCategoryDefinition {
  const sourcePath = `/${slug}/`;
  return {
    sourceName: name,
    sourceSlug: slug,
    sourcePath,
    sourceUrl: `${GARBO_BASE_URL}${sourcePath}`,
    parentPath,
    depth,
    sortOrder,
  };
}

export const GARBO_CATEGORY_SNAPSHOT: readonly GarboSourceCategoryDefinition[] = branches.flatMap(
  (branch, branchIndex) => {
    const sourcePath = `/${branch.slug}/`;
    const parent = sourceRecord(branch.name, branch.slug, null, 0, branchIndex * 100);
    const children = (branch.children ?? []).map((child, childIndex) =>
      sourceRecord(child.name, child.slug, sourcePath, 1, branchIndex * 100 + childIndex + 1),
    );
    return [parent, ...children];
  },
);

export const GARBO_CATEGORY_SNAPSHOT_DATE = "2026-09-02";
