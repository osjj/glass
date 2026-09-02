# Design QA

**Source visual truth**

- Desktop: `qa/reference-desktop.png`
- Mobile: `qa/reference-mobile.png`
- Live source state: Garbo Shot Glass product detail, gallery image 2 selected, cookie notice present only on the source page.

**Rendered implementation**

- Desktop: `qa/implementation-desktop-pass1-top.png`
- Mobile: `qa/implementation-mobile-pass1.png`
- Desktop comparison: `qa/compare-desktop-pass1.png`
- Mobile comparison: `qa/compare-mobile-pass1.png`

**Capture normalization**

- Desktop CSS viewport: 1280 x 720; source and implementation DPR: 1.5; both screenshots: 1265 x 712 px. The top 700 px from each image were placed in one side-by-side comparison without rescaling.
- Mobile CSS viewport: 390 x 844; source and implementation DPR: 1.5; both screenshots: 375 x 812 px. Both images were placed in one side-by-side comparison without rescaling.
- State was matched to gallery image 2 for the mobile comparison. Source cookie consent was treated as an external site overlay and excluded from fidelity findings.

**Findings**

- No actionable P0, P1, or P2 differences remain in the product-detail body.
- Fonts and typography: Arial/Segoe UI fallback, heading weights, line heights, title wrapping, and small specification text track the source closely at both breakpoints.
- Spacing and layout rhythm: desktop hero height, sidebar/gallery/summary proportions, product-top alignment, and mobile vertical ordering match the source. The Glarivo header is an intentional product constraint.
- Colors and visual tokens: source-style teal-blue is preserved for the product body; Glarivo navy and lime remain in global navigation and the inquiry conversion path.
- Image quality and asset fidelity: all visible product, hero, detail, and share assets are copied source assets rather than placeholders or CSS approximations.
- Copy and content: title, six summary fields, eight detail statements, specification rows, and long-form section order match the captured source.

**Focused region evidence**

- `qa/compare-mobile-pass1.png` verifies the gallery, title, social row, summary list, and breakpoint ordering at readable scale.
- `qa/compare-desktop-pass1.png` verifies the three-column body proportions, hero transition, sidebar styling, gallery crop, and summary density.

**Interaction checks**

- Previous/next gallery selection changes the displayed image.
- Inquiry CTA opens and closes the inquiry drawer.
- Mobile menu opens.
- Browser console warnings/errors checked: none.

**Comparison history**

- Pass 1: no actionable P0/P1/P2 differences after matching viewport, gallery state, pointer state, and device density. No visual code fixes were required after the normalized comparison.

**Follow-up polish**

- Source-only cookie controls and floating third-party contact widgets are intentionally omitted.
- The production implementation should render the full category tree from the category relation rather than hard-code the prototype's visible sample rows.

final result: passed
