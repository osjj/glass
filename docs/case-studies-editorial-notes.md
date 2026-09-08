# Case Studies — Glarivo hotel glassware concept

Updated: 2026-09-07. Content is maintained locally in `src/data/case-studies.ts`.

## Current direction

The case study is an original Glarivo hospitality proposal written in our voice: a shared tumbler silhouette for guest-room trays and lounge tables, coordinated brand details, packaging and sample approval. It is presented as a design study. No customer identity, completed order, delivery history or commercial result is asserted.

The listing, detail page, homepage teaser, Article metadata and sitemap use `/case-studies/glarivo-hotel-glassware-customization`. The previous article URL has a permanent redirect to this route. The old supplier account, source links and citations have been removed from the public case-study content.

The illustration remains a concept visual. Related collections support a product shortlist. The final call to action opens the existing inquiry dialog.

## Content maintenance

- Keep the proposal in present or conditional language until actual project records are supplied.
- Add customer names, quantities, delivery dates or outcomes only when supported by those records.
- Keep product dimensions, decoration methods and care requirements subject to confirmation for the selected finished item.
- No database mutation, publication, deployment or Git push is part of this local content revision.

## Verification for this revision

- TypeScript and targeted ESLint: passed. Full-repository ESLint reports five existing `no-require-imports` errors in `output/imagegen/exhibitions-v2/save-assets.cjs` and `output/imagegen/exhibitions-v3/save-assets.cjs`.
- `npm run build -- --webpack`: passed, including TypeScript and page generation.
- Local listing and new detail: HTTP 200, with no supplier-brand matches in their HTML. Old URL: HTTP 308 to the new detail. Unknown case slug: HTTP 404.
- Canonical, Article/BreadcrumbList JSON-LD and the case-study sitemap entries use the new URL. All detail table-of-contents targets exist.
- Browser list-to-detail navigation and inquiry dialog opening/closing: passed. No inquiry was submitted.
- At 390px, document width equals viewport width. Desktop and mobile screenshots are in `output/playwright/case-rewrite/`.
