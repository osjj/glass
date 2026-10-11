# Product fact corrections — 2026-10-10

User scope: correct the three reviewed product pages, retain images and identifiers, and verify public results. These corrections use current public pages, the import-source snapshot, supplier pages and the existing gallery images. Supplier text is listing evidence, not independent product testing.

## GB66015

Source: https://www.garboglass.com/whiskey-decanter-set/borosilicate-whiskey-decanter-set-with-wooden-base-ak-47-gun-shape-decanters-with-four-bullet-glasses.html

- Supplier title/body say borosilicate; overview says soda-lime. The material subtype is unresolved. Public material becomes `Glass`; preserve the conflict in the copy revision and keep `copyNeedsReview=true`.
- Supplier description identifies an 800 mL decanter and four 300 mL glasses, with a wooden base; packing is 4 sets/carton. Existing gallery shows the rifle-shaped assembly and four glasses.
- Proposed name: Rifle-Shaped Glass Decanter Set with Four Glasses.
- Correct component capacity wording without changing quantities, commercial fields, product slug or image files.

## Wine decanter at the existing 2L URL

Source: https://www.garboglass.com/whiskey-decanter-set/2l-glass-red-wine-decanter-with-customized-gift-box-set.html

- The supplier heading is 2L; overview identifies GB3013, 12 pieces/carton and a customizable capacity range. Its table identifies GB3002-2, 1700 mL, dimensions and 6 pieces/carton. These cannot establish one model's capacity, dimensions or carton quantity.
- Omit Capacity, Top diameter, Height, Bottom diameter and Package from public overview/specification fields; keep the complete originals in the scoped backup and retain `copyNeedsReview=true`. Do not invent or assign a SKU.
- Normalize the existing material spelling from Sodelime Glass to Soda-lime glass.
- Existing gallery supports a broad base and integrated handle. Do not promise an included gift box or a fixed set composition.
- Proposed name: Glass Wine Decanter with Handle.

## GB631020950-DR-582

Source: https://www.garboglass.com/borosilicate-glass-teapot/1l-borosilicate-glass-tea-jug-glass-juice-pitcher-exporting-from-china.html

- Supplier heading is 1L; overview says 950–1000 mL. The specification table explicitly identifies the same SKU and 950 mL, 95/200/95 mm and 24 pieces/carton.
- Use a name without a capacity claim, preserve 950 mL as the model's listed specification and add the source-declared mm units to the individual dimension fields.
- Existing gallery supports the handle and pouring spout. Do not add lid-material, thermal, dishwasher or food-contact claims.
- Proposed name: Borosilicate Glass Tea Jug with Handle.

## Boundaries and records

Raw before-records, source rows, exact proposed values and readback are stored in `output/content-update-20261010/`. Image URLs/order, SKU/slug, product publication, source URLs, prices, MOQ, stock, variants and category membership are protected. Product changes use the site's copy-revision mechanism and the original `updatedAt` guard.


## Completed verification

All three product corrections and the two public internal-link additions were saved on 2026-10-10 and verified on the live site. Protected source, commercial, publication and media fields matched the scoped before-records. Two articles remain DRAFT with no publication timestamp and no public page or sitemap entry. Mobile product checks found no horizontal overflow, missing visible images or missing inquiry entry.
