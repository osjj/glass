# Glassware content clusters

Local implementation prepared on 2026-09-05. No database writes, remote asset uploads or deployment were performed for this change.

## Entrances and rollout order

The primary navigation and footer use a single `Blog` entry at `/blog`, which contains the five topic entrances and articles. `/guides` permanently redirects to `/blog` and is excluded from the sitemap. Topic pages retain their `/guides/[slug]` URLs, link back to Blog, and highlight Blog in the main navigation. Each topic page has buying decisions, a purchasing checklist and real category links. Matching category pages link back to the topic. Unwritten articles are not rendered as links.

| Batch | Topic route | CMS article category |
| --- | --- | --- |
| 1 | `/guides/shot-glass-sourcing` | `Shot Glass Sourcing` |
| 1 | `/guides/restaurant-bar-glassware` | `Restaurant & Bar Glassware` |
| 2 | `/guides/coffee-tea-glassware` | `Coffee & Tea Glassware` |
| 2 | `/guides/wine-spirits-gifting` | `Wine, Spirits & Gift Sets` |
| 3 | `/guides/kitchen-storage-bakeware` | `Kitchen Storage & Bakeware` |

Topic definitions and category links: `src/data/guide-clusters.ts`. Existing catalog taxonomy is unchanged. Existing placeholder blog content is preserved and is not assigned to the new clusters.

## First article

Route: `/blog/shot-glass-buying-guide-for-wholesale-buyers`.

The versioned article is in `src/data/editorial-posts.ts`, using the existing Editor.js block format. The blog list, article lookup and sitemap include it. It is currently repository-backed, not a newly created CMS database record. Subsequent articles may be created normally in the existing CMS using the exact category labels above; only published, due articles appear on the topic pages.

A database record with the same slug takes precedence over the repository version. Draft, archived and future-dated records suppress the fallback, so editorial content cannot bypass CMS publication status. Deleting that database record entirely restores the repository fallback; use archived status to suppress it, or remove the repository definition when migrating permanently. Cover images use `contain` for this illustrated repository article; if migrating to CMS, preserve the full composition when configuring its presentation.

## Evidence and images

Product examples were checked against public Glarivo pages on 2026-09-05: GB073502, GB070203H-TH-QT-580A and GB095002. Catalog figures are explicitly identified as catalog values, not independently measured results. Pricing, stock, MOQ and certification promises are not inferred.

`public/images/guides/shot-glass/buying-guide.svg` is an original schematic cover; the PNG derivative is used for rendering and social metadata. `capacity-check.svg` is an original measurement illustration without product-specific dimensions. `mini-mug.webp` is an unchanged image from the existing GB095002 public gallery:

https://media.glarivoglass.com/products/garbo-shot-glass/assets/0eb343c4d2f510611728d673cc572e2f26fcb4e75a38d5c887110a5d84b5ac04.webp

The photograph depicts several glasses and is captioned as a shape illustration, not a verified set configuration or measured comparison. The cover and inline diagram are explicitly schematic. Two inspected images bearing Garbo branding were excluded from published assets and retained only under ignored `output/seo-reference/`.

Article references: NIST's US customary-to-metric conversion table and Libbey's glassware handling guide. These support only general conversion/handling guidance, not model-specific certification claims.

## Verification

Check the five hubs, article, blog listing, category backlinks and sitemap. Verify article outline anchors, all three images, mobile width and the unknown-topic 404. Typecheck and lint apply to the changed code. Use production build results from the current run, not the existence of a development preview, to assess build readiness.
