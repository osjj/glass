export type ProductPairInput = {
  label: string;
  value: string;
};

export type AdminProductImageInput = {
  url: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  storageKey?: string | null;
  mimeType?: string | null;
};

export type AdminProductContentSectionInput = {
  sourceKey: string;
  title: string;
  body: string;
  images: AdminProductImageInput[];
};

export type AdminCategoryOption = {
  id: string;
  slug: string;
  name: string;
  label: string;
  depth: number;
};

export type AdminProductInput = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  summary: string;
  description: string;
  content: string;
  sourceProvider: "GARBO" | "MANUAL" | null;
  sourceUrl: string | null;
  sourceCategoryPath: string | null;
  detailsHeading: string;
  specificationHeading: string;
  pricingMode: "REQUEST_QUOTE" | "FIXED" | "TIERED";
  price: number | null;
  comparePrice: number | null;
  cost: number | null;
  currency: string;
  moq: number | null;
  unit: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  sortOrder: number;
  images: AdminProductImageInput[];
  overviewFields: ProductPairInput[];
  contentSections: AdminProductContentSectionInput[];
  attributes: ProductPairInput[];
  specifications: ProductPairInput[];
  features: string[];
};

export type ProductFormState = {
  error?: string;
  errors?: Record<string, string[]>;
};
