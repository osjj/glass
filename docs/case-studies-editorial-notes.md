# Case Studies — first editorial review

Reviewed: 2026-09-05. Implementation is local source content, with no database migration, import or production deployment.

## Scope

- Add Case Studies to desktop/mobile navigation and footer.
- Add `/case-studies` and `/case-studies/garbo-hotel-glassware-color-customization` with canonical metadata and sitemap entries.
- Keep existing Buying Guides and Blog work intact. Content is maintained in `src/data/case-studies.ts`; this task does not add an admin CRUD interface.
- Use an original editorial diagram, labelled as an illustration rather than project photography. No supplier photographs or customer logos are republished.

## Sources and evidence

1. https://www.garboglass.com/news/capturing-global-drinkware-demand-the-competitive-edge-of-spray-colored-glassware.html — dated August 29, 2025; reviewed September 5, 2026. Reports a hotel glassware customization example but does not identify the hotel or attach customer/order evidence. Treat it as a supplier account, not an independently verified delivery.
2. https://www.garboglass.com/services/service/ — reviewed September 5, 2026. General service description, not corroboration of the hotel project.
3. https://www.garboglass.com/news/how-do-we-ship-our-glassware-by-pallets.html — researched as an alternative process example; not used as evidence for the hotel case.

## Editorial rules applied

- Attribute the account to Garbo in the list, title, introduction and sources. Do not imply a Glarivo customer, partnership or delivery.
- Omit unsupported commercial results, reorder counts, certification assertions, tariff claims and manufacturing-performance figures.
- Clearly label selection/approval recommendations as Glarivo analysis, not events reconstructed from the project.
- Related catalog links are a buyer shortlist, not a claim that the linked products were used in the reported project.
- Recheck sources before changing any supplier-reported claim to a verified fact.

## 中文内容说明

标题：酒店玻璃杯定制：对 Garbo 公开案例的研究。

正文先概括 Garbo 对酒店杯具定制需求的自述，再从采购者角度分析颜色确认、完整成品审核和包装识别，最后提供采购需求、成品样、书面订单和到货核对的记录建议。客户未具名，订单与效果未独立核验；页面不会将此项目作为 Glarivo 业绩，也不会使用未经证实的收益或复购数据。

## Verification

- TypeScript `tsc --noEmit`: passed.
- ESLint for new case-study files and the changed header, footer and sitemap: passed.
- `git diff --check`: passed.
- Default Turbopack build: blocked by Windows `os error 5` while spawning the CSS compilation process, including outside the sandbox. No production build configuration was changed.
- `next build --webpack`: passed, including TypeScript, page generation and build traces.
- Local HTTP: listing and detail return 200; an unknown case slug returns 404; sitemap returns 200 and includes both case URLs.
- Browser: list-to-detail navigation, mobile Case Studies menu click and menu close verified. Desktop and 390px mobile layouts visually inspected; 390px/1024px widths have no document horizontal overflow. Canonical and Article/BreadcrumbList JSON-LD read back from the rendered page.
- Browser preview uses the existing local development server. No production deployment, database write or Git push was performed.
