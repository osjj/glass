# Garbo-aligned product page structure

The product editor and public detail page use one ordered structure that mirrors a Garbo product page while keeping Glarivo branding and category ownership.

| Garbo page area | Glarivo storage | Admin editor section |
| --- | --- | --- |
| Product title | `Product.name` | Source and identity |
| Item No. | `Product.sku` | Source and identity |
| Source page metadata | `Product.sourceProvider`, `sourceUrl`, `sourceCategoryPath` | Source and identity |
| Material, Package, Usage, Capacity, Size | `ProductOverviewField[]` | Top overview fields |
| Product image carousel | `ProductImage[]` with role `GALLERY` | Product gallery |
| Details statements | `ProductFeature[]` | Details |
| Two-column specification table | `ProductSpecification[]` | Specification table |
| More Size, OEM and ODM, Production Processing, packaging, and other ordered blocks | `ProductContentSection[]` with related `ProductImage[]` | Ordered content sections |
| Category sidebar and breadcrumb | existing `ProductCategory` / `Category` relations | Category selection only |

`Category`, category tree maintenance, and category administration remain outside this product-page migration. Saving a product can select its primary category relation but does not create, rename, reorder, or delete categories.

Imported Garbo candidates map their source metadata and top overview fields into the same structure. Certificate claims stay in `ProductCertificationClaim` and are not shown as verified product specifications unless evidence is verified separately. Source images are not hotlinked automatically; approved files must be uploaded to R2 so width, height, storage key, and MIME type are retained.

Migration file: `prisma/migrations/20260901130000_garbo_product_page_structure/migration.sql`.
