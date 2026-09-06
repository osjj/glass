# Glarivo homepage image-swap QA — 2026-09-06

## Scope and result

- Request: use the supplied showroom image as the homepage hero; move the previous homepage hero into the Garbo Glassware image slot; stop displaying the previous Garbo image.
- Local implementation: http://127.0.0.1:3000/
- Source image: C:/Users/osjj/AppData/Local/Temp/codex-clipboard-3079cc0f-3dee-4b82-8245-5236fc3132dd.png
- Source pixels: 1672 x 941.
- Desktop CSS viewport: 1440 x 1000, density 1x.
- Mobile CSS viewport: 390 x 844, density 1x.
- State: loaded homepage at the hero and scrolled Garbo Glassware section.

final result: passed

## Findings

- No actionable P0, P1, or P2 mismatch remains for the requested image swap.
- The supplied image is displayed as the hero with the existing text, header, overlay and calls to action intact.
- The former hero image is displayed in the Garbo Glassware company image slot.
- The former Garbo image at public/images/home/garbo-reference/company-showroom.jpg is no longer referenced by the homepage. The file was retained on disk to avoid destructive deletion.
- P3: the hero uses object-fit cover, so edge content is intentionally cropped at different viewport ratios. The central showroom and glass displays remain visible on desktop and mobile.

## Visual evidence

- Desktop hero: D:/glarivo/output/design-qa/home-20260906/image-swap/hero-desktop.png
- Mobile hero: D:/glarivo/output/design-qa/home-20260906/image-swap/hero-mobile.png
- Desktop Garbo section: D:/glarivo/output/design-qa/home-20260906/image-swap/company-desktop.png
- Mobile Garbo section: D:/glarivo/output/design-qa/home-20260906/image-swap/company-mobile.png
- Side-by-side hero comparison: D:/glarivo/output/design-qa/home-20260906/image-swap/hero-comparison.jpg
- Side-by-side Garbo comparison: D:/glarivo/output/design-qa/home-20260906/image-swap/company-comparison.jpg

The comparison files place the source asset on the left and the browser-rendered implementation on the right. Both were opened together and inspected. The full hero state confirms layout and text contrast; the focused Garbo state confirms the former hero occupies the requested company slot.

## Required fidelity surfaces

- Fonts and typography: unchanged; Cormorant display type and Manrope body type remain intact with no new wrapping or clipping.
- Spacing and layout: unchanged; both image containers retain their original dimensions and surrounding rhythm.
- Colors and visual tokens: unchanged; the hero overlay preserves white-text contrast over the brighter supplied image.
- Image quality and fidelity: the supplied 1672 x 941 image was converted to a 394 KB WebP at quality 90 without enlargement. The former hero is reused directly, not duplicated or regenerated.
- Copy and content: unchanged. Image alt text was updated to describe the displayed scenes accurately.
- Responsive behavior: no horizontal overflow at 390 px; all images loaded with nonzero intrinsic dimensions.
- Accessibility: semantic image alt text remains present; header and hero controls remain usable.

## Verification

- Browser-rendered desktop and mobile screenshots inspected.
- Clean homepage image loading check: passed.
- Browser console errors in final state: none.
- npm run typecheck: passed.
- npm run lint -- --quiet: passed.
- npm run build: passed; compilation, TypeScript and all 20 static pages completed successfully.
- No deployment, database write, commit or push performed.

## Comparison history

- First implementation pass used the exact supplied image for the hero and the previous hero for the Garbo slot.
- Desktop review found both focal areas visible and text contrast acceptable.
- Mobile review found the central showroom retained and no overflow. No P0/P1/P2 fix iteration was required.
