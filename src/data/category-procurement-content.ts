import type { ProductCardDisplay } from "@/components/site/product-card";
import type { InquiryContext } from "@/lib/inquiries";
import type { PublicProduct } from "@/lib/public-products";

type Model = {
  slug: string;
  name: string;
  values: string[];
  expected: Array<[string, string]>;
  display?: ProductCardDisplay;
};

export type CategoryProcurementContent = {
  brief: InquiryContext["brief"];
  selectionTitle: string;
  choices: Array<{ title: string; text: string; models: string[] }>;
  comparisonTitle: string;
  columns: string[];
  models: Model[];
  guides: Array<{ href: string; label: string }>;
};

// Checked against the published catalog and its original product pages on 2026-10-03.
// Conflicting capacities, lid materials and carton counts are excluded.
const procurementContent: Record<string, CategoryProcurementContent> = {
  "mason-jar-glasses": {
    brief: "mason-jar",
    selectionTitle: "Choose a mason jar format",
    choices: [
      { title: "Handled drinking jars", text: "Check the grip and the space needed for the jar and handle.", models: ["16oz-county-fair-mason-jar-drinking-glasses-with-handle"] },
      { title: "Sports-pattern jars", text: "Compare the soccer-ball motif with the multi-design sports series.", models: ["18oz-old-fashioned-soccer-ball-mason-jar-drinking-glasses-mugs-with-handles", "18oz-new-multi-design-hot-sell-in-south-america-football-glass-mason-jar-drinking-glasses"] },
      { title: "Storage jars", text: "Match the opening and jar height to filling, access and shelf space.", models: ["32-oz-wide-mouth-smooth-sided-glass-canning-manson-jar-with-screw-plastic-lid", "0-38-gallon-mason-jars-glass-kitchen-mason-jars-with-multi-size-150ml-300ml-500ml-700ml-1000ml"] },
    ],
    comparisonTitle: "Compare jar dimensions",
    columns: ["Top diameter", "Height", "Base diameter"],
    models: [
      {
        slug: "16oz-county-fair-mason-jar-drinking-glasses-with-handle", name: "County Fair handled jar",
        values: ["67 mm", "128 mm", "68 mm"], expected: [["Product size", "T:67mm B:68mm H:128mm"]],
        display: { name: "County Fair handled mason jar", capacity: null, material: "Soda-lime glass", packing: null },
      },
      {
        slug: "18oz-old-fashioned-soccer-ball-mason-jar-drinking-glasses-mugs-with-handles", name: "Soccer-ball handled jar",
        values: ["65 mm", "125 mm", "60 mm"], expected: [["Product size", "T:65mm B:60mm H:125mm"], ["Capacity", "520"], ["Package", "48pcs/ctn"]],
        display: { name: "Soccer-ball handled mason jar", capacity: "520 ml", material: "Soda-lime glass", packing: "48 pcs/ctn" },
      },
      {
        slug: "18oz-new-multi-design-hot-sell-in-south-america-football-glass-mason-jar-drinking-glasses", name: "Multi-design sports jar",
        values: ["65 mm", "122 mm", "56 mm"], expected: [["Product size", "T:65mm B:56mm H:122mm"], ["Capacity", "520"], ["Package", "48pcs/ctn"]],
        display: { name: "Multi-design sports mason jar", capacity: "520 ml", material: "Soda-lime glass", packing: "48 pcs/ctn" },
      },
      {
        slug: "32-oz-wide-mouth-smooth-sided-glass-canning-manson-jar-with-screw-plastic-lid", name: "Smooth-sided storage jar",
        values: ["90 mm", "142 mm", "84 mm"], expected: [["Product size", "T:90mm B:84mm H:142mm"], ["Capacity", "900"], ["Package", "36pcs/ctn"]],
        display: { name: "Smooth-sided screw-lid storage jar", capacity: "900 ml", material: "Soda-lime glass", packing: "36 pcs/ctn" },
      },
      {
        slug: "0-38-gallon-mason-jars-glass-kitchen-mason-jars-with-multi-size-150ml-300ml-500ml-700ml-1000ml", name: "Small storage jar",
        values: ["50 mm", "86 mm", "35 mm"], expected: [["Product size", "T:50mm B:35mm H:86mm"], ["Capacity", "150"], ["Package", "48pcs/ctn"]],
        display: { name: "150 ml storage jar", capacity: "150 ml", material: "Soda-lime glass", packing: "48 pcs/ctn" },
      },
    ],
    guides: [
      { href: "/blog/mason-jar-drinking-glasses-bulk-handles-lids-sizes-packing", label: "Drinking jars: handles, lids, sizes and packing" },
      { href: "/blog/mason-jar-glass-storage-buying-guide", label: "Storage jars: lids, closures and packing" },
    ],
  },
  "glass-tumblers": {
    brief: "glass-cups",
    selectionTitle: "Choose cups around your drink menu",
    choices: [
      { title: "Water and juice", text: "Compare smaller servings with a larger water tumbler.", models: ["7oz-water-and-juice-drinking-pressed-glass-cup", "300ml-rock-water-drinking-tumbler"] },
      { title: "Highballs", text: "Allow room for the drink, ice and garnish.", models: ["420ml-highball-glass-tumbler-new-design-clear-glass-beverage-cup"] },
      { title: "Decorated cups", text: "Choose the pattern and specify the retail or carton pack.", models: ["475ml-juice-water-cup-with-new-uv-decal-design", "6oz-moroccan-style-colored-glass-tea-cups-gold-tea-glasses-for-middle-east"] },
    ],
    comparisonTitle: "Compare selected glass cups",
    columns: ["Capacity", "Rim diameter", "Packing"],
    models: [
      {
        slug: "7oz-water-and-juice-drinking-pressed-glass-cup", name: "Pressed water and juice cup",
        values: ["190 ml", "72 mm", "72 pcs/ctn"], expected: [["Capacity", "190ml"], ["Top diameter", "72"], ["Package", "72pcs/Ctn"]],
        display: { name: "190 ml pressed water and juice cup" },
      },
      {
        slug: "300ml-rock-water-drinking-tumbler", name: "Water tumbler",
        values: ["300 ml", "72 mm", "72 pcs/ctn"], expected: [["Capacity", "300ml"], ["Top diameter", "72"], ["Package", "72pcs/ctn"]],
        display: { name: "300 ml water tumbler" },
      },
      {
        slug: "420ml-highball-glass-tumbler-new-design-clear-glass-beverage-cup", name: "Clear highball tumbler",
        values: ["420 ml", "79 mm", "Color box"], expected: [["Capacity", "420ml"], ["Top diameter", "79"], ["Package", "Color Box"]],
        display: { name: "420 ml clear highball tumbler" },
      },
      {
        slug: "475ml-juice-water-cup-with-new-uv-decal-design", name: "UV-decal water and juice cup",
        values: ["475 ml", "88 mm", "36 pcs/ctn"], expected: [["Capacity", "475ml"], ["Top diameter", "88"], ["Package", "36pcs/ctn"]],
        display: { name: "475 ml UV-decal water and juice cup" },
      },
      {
        slug: "6oz-moroccan-style-colored-glass-tea-cups-gold-tea-glasses-for-middle-east", name: "Moroccan-style decorated tea glass",
        values: ["170 ml", "65 mm", "72 pcs/ctn"], expected: [["Capacity", "170"], ["Top diameter", "65"], ["Package", "72pcs/ctn"]],
        display: { name: "170 ml Moroccan-style decorated tea glass", capacity: "170 ml" },
      },
    ],
    guides: [
      { href: "/guides/restaurant-bar-glassware", label: "Restaurant and bar glassware selection" },
      { href: "/blog/essential-cocktail-glass-types-bars-restaurants", label: "Glass shapes for a cocktail menu" },
    ],
  },
};

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "").replace(/:$/, "");

function matchesProduct(model: Model, product: PublicProduct) {
  const fields = [...product.overviewFields, ...product.attributes, ...product.specifications];
  return model.expected.every(([label, value]) => {
    const matches = fields.filter((field) => normalize(field.label) === normalize(label));
    return matches.length > 0 && matches.every((field) => normalize(field.value) === normalize(value));
  });
}

export function getCategoryProcurementContent(slug: string, products: PublicProduct[]) {
  const content = procurementContent[slug];
  if (!content) return null;
  const models = content.models.filter((model) => products.some((product) => product.slug === model.slug && matchesProduct(model, product)));
  if (!models.length) return null;
  const available = new Set(models.map((model) => model.slug));
  return {
    ...content,
    models,
    choices: content.choices.map((choice) => ({ ...choice, models: choice.models.filter((model) => available.has(model)) })).filter((choice) => choice.models.length),
  };
}

export function getCategoryProductDisplay(categorySlug: string, product: PublicProduct): ProductCardDisplay | undefined {
  const model = procurementContent[categorySlug]?.models.find((item) => item.slug === product.slug);
  if (model && matchesProduct(model, product)) return model.display;
  if (categorySlug !== "glass-tumblers") return undefined;
  // Both sources show different capacities for these models; do not pick one.
  if (product.slug === "7oz-new-design-water-glass-tumblers") return { name: "Water glass tumbler", capacity: null };
  if (product.slug === "6oz-round-shape-whisky-drinking-glass-cup") return { name: "Round whisky glass", capacity: null };
  return undefined;
}
