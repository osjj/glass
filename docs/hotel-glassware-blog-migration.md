# Hotel glassware guide migration — 2026-09-20

## Result

- Title: **Hotel Glassware for Guestrooms & Lounges: Buying Guide**.
- Destination: `/blog/hotel-glassware-guestrooms-lounges`.
- Topic: **Restaurant & Bar Glassware**, using the existing Blog renderer, outline and topic page.
- Source: `content/drafts/hotel-glassware-guestrooms-lounges.md`; 10 sections, five FAQs, 59 EditorJS blocks, approximately 2,000 words.
- Four previously generated and visually reviewed illustrations: a cover, room/lounge comparison, logo sample and packing options. They are WebP assets under `public/images/blog/hotel-glassware-guestrooms-lounges/` (approximately 580 KiB combined).
- The existing customer project and its publication status are unchanged. No link to the private Shangri-La draft is introduced.

## Publication boundary

The source-code migration remains local, consistent with the owner's decision to deploy later. On September 20 the owner additionally requested a database write: the article was inserted into the shared Blog database as **PUBLISHED**, with four verified R2 image URLs. Record ID: `cmu97wo0g00002wumbftahc5i`; admin path: `/admin/blog/cmu97wo0g00002wumbftahc5i`. No Git push, server deployment or Search Console submission was made.

The guide is registered in `src/data/editorial-posts.ts`, following the existing versioned editorial fallback. The new same-slug CMS record takes precedence and serves its R2 images without requiring the new local assets to be deployed. Deploying the local code still supplies the updated homepage, case-list cleanup and permanent redirects. A same-slug CMS record remains authoritative, including a draft or archived record. Duplicate preflight found no matching Blog record before insertion.

The article can now be edited in the Blog admin. The one-record import script detects the existing record and leaves it unchanged; there is no need to import again. Before insertion, all existing BlogPost records were backed up in the ignored `output/hotel-blog-migration-20260920/before-blog-database.json`. The transfer used content-hash object keys, signed R2 readback, independent public HTTP/hash checks, a serializable duplicate check and full field readback. Existing products and cases were not changed.

## SEO migration

Both historical case paths permanently redirect **directly** to the new Blog page (308):

- `/case-studies/glarivo-hotel-glassware-customization`
- `/case-studies/garbo-hotel-glassware-color-customization`

The old article is removed from the Case Studies data and sitemap. Its retired slugs stay reserved in the case editor. Stored case related-links to these addresses are normalized to the new guide at rendering time, without changing database content.

The guide has one H1, ten H2 sections, a working contents list, a descriptive title/excerpt, a self-referencing canonical URL, Article and BreadcrumbList JSON-LD, an article-specific Open Graph URL/image, a Twitter large-image card and descriptive image alternatives. Only the new article URL appears in the sitemap. Homepage, Blog and the Restaurant & Bar topic link directly to it. Body links lead to existing glass-tumbler/colored-glassware collections and the topic hub.

The redirect, canonical, internal-link and sitemap approach follows [Google's URL-migration guidance](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes). Next.js `permanent: true` uses 308, as documented in the installed Next.js redirect guide. Ranking or indexing outcomes have not been measured or promised.

## Release

Deploy the changed source and **all four new files in `public/images/blog/hotel-glassware-guestrooms-lounges/`** together using the normal release process. No database migration or new environment variable is required for this article move.

After deploying, check the new article returns 200, both old routes return a single 308 to it, images load, Blog/topic/homepage links reach it, and the sitemap contains only the new URL. Keep the permanent redirects. Keep the CMS record published for this migration; intentionally setting it to Draft or Archived hides the article and the redirect destination.

## Content and images

The brief covers service settings, collection coordination, usable capacity, equipment fit, washing, artwork approval, opening stock, replacement planning, packing and an RFQ checklist. The 120-room/324-piece calculation is explicitly an illustrative planning example, not a customer result or universal reserve rule. Model-specific performance and decoration claims require supplier confirmation. General handling guidance links to [Libbey's glassware handling guide](https://www.libbey.com/catalogs/Libbey-Glassware-handling-guide-2017.pdf).

Images reuse the four built-in image generation outputs from September 19; no new generation or API charge was needed. The prompt set and original asset manifest are preserved in `content/drafts/hotel-glassware-guestrooms-lounges.images.json`. The original image files remain unchanged.

## Verification

HTTP/DOM checks: `output/hotel-blog-migration-20260920/seo-verification.json`.
Browser screenshots: `output/playwright/hotel-blog-desktop.png`, `hotel-blog-mobile.png`, `hotel-blog-mobile-sample.png`.
Passed before the database import: TypeScript, scoped ESLint, all three case visibility/validation tests and the production webpack build. All four images decoded in the browser; the 1440px desktop and 390px mobile views had no horizontal overflow. The table of contents reaches the corresponding section. The database import subsequently passed record and image checks; its result and public verification are in `output/hotel-blog-migration-20260920/database-result.json` and `database-public-verification.json`.
