export type CategoryFormState = {
  error?: string;
  errors?: Record<string, string[]>;
};

export type AdminCategoryParentOption = {
  id: string;
  name: string;
  slug: string;
  label: string;
  depth: number;
  isActive: boolean;
};

export type AdminCategoryListItem = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parentName: string | null;
  label: string;
  depth: number;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  childCount: number;
  mappingCount: number;
};

export type AdminCategoryInput = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  childCount: number;
  mappingCount: number;
  mappings: Array<{
    id: string;
    provider: string;
    sourceName: string | null;
    sourcePath: string;
  }>;
  linkedProducts: Array<{
    id: string;
    name: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    isPrimary: boolean;
  }>;
};

export type AdminCategoryEditorData = {
  category: AdminCategoryInput | null;
  parentOptions: AdminCategoryParentOption[];
};
