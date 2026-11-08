// These SUNWIN listings represent the same S20172 30 ml product.
const s20172CanonicalSlug = "s20172-foundation-bottle-58";

export const retiredProductSlugs = [
  "s20172-foundation-bottle-9",
  "s20172-foundation-bottle-57",
];

export const productRedirects = retiredProductSlugs.map((slug) => ({
  source: `/products/${slug}`,
  destination: `/products/${s20172CanonicalSlug}`,
  permanent: true,
}));
