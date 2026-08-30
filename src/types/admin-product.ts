export type ProductPairInput = {
  label: string;
  value: string;
};

export type AdminProductInput = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  category: string;
  summary: string;
  description: string;
  content: string;
  price: number;
  comparePrice: number | null;
  cost: number | null;
  currency: string;
  moq: number;
  unit: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  sortOrder: number;
  images: Array<{ url: string; alt: string }>;
  attributes: ProductPairInput[];
  specifications: ProductPairInput[];
  features: string[];
};

export type ProductFormState = {
  error?: string;
  errors?: Record<string, string[]>;
};
