export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  summary: string;
  description: string;
  features: string[];
  specifications: Array<{ label: string; value: string }>;
  featured: boolean;
  image: string;
  imageAlt: string;
};

export const productCategories = [
  { slug: "drinkware", label: "Drinkware", shortLabel: "Drinkware", image: "/images/home/category-drinkware.webp" },
  { slug: "tableware", label: "Tableware", shortLabel: "Tableware", image: "/images/home/category-tableware.webp" },
  { slug: "serveware", label: "Serveware", shortLabel: "Serveware", image: "/images/home/category-serveware.webp" },
  { slug: "storage", label: "Glass Storage", shortLabel: "Storage", image: "/images/home/category-storage.webp" },
  { slug: "bakeware", label: "Bakeware", shortLabel: "Bakeware", image: "/images/home/category-bakeware.webp" },
  { slug: "colored-glassware", label: "Colored Glassware", shortLabel: "Colored", image: "/images/home/category-colored.webp" },
] as const;

export const products: Product[] = [
  {
    id: "demo-drinkware-01",
    slug: "clear-ribbed-tumbler-collection",
    name: "Clear Ribbed Tumbler Collection",
    category: "drinkware",
    categoryLabel: "Drinkware",
    summary: "A clean, contemporary tumbler family prepared for a concise wholesale presentation.",
    description: "This demonstration record shows how Glarivo can present glass profile, finish, capacity options, and packing information once the final product data is confirmed.",
    features: ["Coordinated tumbler profiles", "Clear and textured finish options", "Custom packing fields ready"],
    specifications: [
      { label: "Product family", value: "Drinking tumblers" },
      { label: "Material", value: "Glass type to be confirmed" },
      { label: "Capacity options", value: "To be confirmed per selected model" },
    ],
    featured: true,
    image: "/images/home/category-drinkware.webp",
    imageAlt: "Collection of clear drinking tumblers on a dark showroom surface",
  },
  {
    id: "demo-tableware-01",
    slug: "pressed-glass-tableware-set",
    name: "Pressed Glass Tableware Set",
    category: "tableware",
    categoryLabel: "Tableware",
    summary: "A coordinated plate-and-bowl family with a structured texture and clear finish.",
    description: "Use this page structure for confirmed dimensions, piece count, decoration, carton details, and other order-specific information.",
    features: ["Coordinated plate and bowl profiles", "Textured clear-glass concept", "Set configuration can be documented"],
    specifications: [
      { label: "Product family", value: "Glass plates and bowls" },
      { label: "Set configuration", value: "To be confirmed" },
      { label: "Decoration", value: "Options to be confirmed" },
    ],
    featured: true,
    image: "/images/home/category-tableware.webp",
    imageAlt: "Clear pressed-glass bowls and plates arranged in a showroom",
  },
  {
    id: "demo-serveware-01",
    slug: "ribbed-glass-pitcher-and-carafe",
    name: "Ribbed Glass Pitcher & Carafe",
    category: "serveware",
    categoryLabel: "Serveware",
    summary: "A matched serving family for water, juice, table service, and retail collections.",
    description: "The layout keeps vessel shape, handle construction, capacity, and packaging fields easy to review without turning unconfirmed options into fixed claims.",
    features: ["Coordinated serving profiles", "Clear ribbed finish concept", "Capacity fields ready for source data"],
    specifications: [
      { label: "Product family", value: "Pitchers and carafes" },
      { label: "Capacity", value: "To be confirmed" },
      { label: "Packing", value: "To be confirmed" },
    ],
    featured: true,
    image: "/images/home/category-serveware.webp",
    imageAlt: "Clear glass pitcher, carafe, and serving bowls on a dark surface",
  },
  {
    id: "demo-storage-01",
    slug: "glass-storage-jar-collection",
    name: "Glass Storage Jar Collection",
    category: "storage",
    categoryLabel: "Glass Storage",
    summary: "Three storage-jar proportions presented as a coordinated retail-ready family.",
    description: "This demonstration entry is ready for confirmed glass composition, lid material, sealing method, sizes, and packing details.",
    features: ["Coordinated size family", "Wood-lid concept", "Retail and bulk packing fields ready"],
    specifications: [
      { label: "Product family", value: "Glass storage jars" },
      { label: "Lid and seal", value: "To be confirmed" },
      { label: "Available sizes", value: "To be confirmed" },
    ],
    featured: false,
    image: "/images/home/category-storage.webp",
    imageAlt: "Three clear storage jars with wood lids in a showroom",
  },
  {
    id: "demo-bakeware-01",
    slug: "clear-glass-bakeware-set",
    name: "Clear Glass Bakeware Set",
    category: "bakeware",
    categoryLabel: "Bakeware",
    summary: "A practical family of baking and casserole forms for sourced product data.",
    description: "The product page separates visual presentation from the heat-resistance, temperature, and material claims that must be confirmed from source documents.",
    features: ["Rectangular and round forms", "Handled bakeware concept", "Source-backed performance fields ready"],
    specifications: [
      { label: "Product family", value: "Glass bakeware" },
      { label: "Glass composition", value: "To be confirmed" },
      { label: "Temperature guidance", value: "To be confirmed from source data" },
    ],
    featured: false,
    image: "/images/home/category-bakeware.webp",
    imageAlt: "Clear glass baking dish and casserole forms on a dark surface",
  },
  {
    id: "demo-colored-01",
    slug: "colored-tumbler-collection",
    name: "Colored Tumbler Collection",
    category: "colored-glassware",
    categoryLabel: "Colored Glassware",
    summary: "A restrained cobalt, smoke, and amber collection for brand-led assortments.",
    description: "Use this entry to record the selected coloring process, finish, size, decoration, and packaging after each option is verified.",
    features: ["Coordinated color direction", "Multiple glass profiles", "Decoration options can be documented"],
    specifications: [
      { label: "Product family", value: "Colored drinking glasses" },
      { label: "Color process", value: "To be confirmed" },
      { label: "Available profiles", value: "To be confirmed" },
    ],
    featured: false,
    image: "/images/home/category-colored.webp",
    imageAlt: "Cobalt, smoke, and amber colored glasses in a modern showroom",
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}
