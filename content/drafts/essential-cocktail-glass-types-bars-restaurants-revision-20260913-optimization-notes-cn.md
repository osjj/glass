# 六种鸡尾酒杯型：2026-09-13 修订草稿

## 归类与版本关系

- 主题：Restaurant & Bar Glassware（餐厅与酒吧玻璃器皿）。后台 category 与现有主题名称完全匹配。
- 英文标题：Cocktail Glassware Buying Guide: Six Types & Stock Planning。
- 原 HTML 讲六种鸡尾酒杯型，保留原主线，未扩写成无关的规格书文章。
- 数据库已存在同题已发布文章 `essential-cocktail-glass-types-bars-restaurants`。本次建立独立修订草稿，便于审核，原文章内容、状态、更新时间未变。
- 修订草稿 ID：`cmtzj71vu0000icumgyldcjxs`；状态 DRAFT，featured=false，publishedAt=null。
- 后台：https://www.glarivoglass.com/admin/blog/cmtzj71vu0000icumgyldcjxs

## 原稿问题与优化

1. 六种杯型是鸡尾酒采购范围，不能代表整个餐厅的水杯、葡萄酒杯、啤酒杯及热饮器皿需求。正文已明确范围。
2. 六种库存比例上限相加为 113%，并且若干段落的固定只数、容量范围与表格不一致。删除通用比例与一刀切数量，改用菜单、峰值需求、清洗周转和实际损耗。
3. 删除无出处的市场规模、80% 订单覆盖、月度及年度破损率，以及厚底延缓融冰、某杯型必然更耐用等绝对性能推断。
4. 明确 brimful / nominal / intended fill 三种容量口径，注明 US fluid ounce 换算及 oz 需说明单位体系。重新查阅 NIST，保留原链接直接支持的美制换算。
5. 区分工作库存与替换储备，例子 24+12+6=42；新增储备触发补货示例 4+2=6，避免重复计算备用杯。
6. 沿用已整理的六种杯型采购核对点，并复核 IBA 配方来源；补齐实际冰块、饮品、托盘、货架、洗杯架适配与样品确认。
7. 保留 RFQ、FAQ、现有主题及分类内链。原 `/contact` 实测 HTTP 404，正文改用站点现有 “Request a quote” 按钮指引。
8. 四张新生成图片采用一张 1600×900 封面、三张 1200×900 正文图；合并相近杯型对比，缩短页面。封面只用于 coverImage，正文不重复封面。全部转 WebP、上传 R2 并核对公网下载状态、类型、尺寸和长度。
9. 图片为 AI 生成的杯型示意，未宣称对应实际在售型号、尺寸、容量或性能。完整提示词见同名前缀 image-prompts.md。

## 来源复核

- IBA Old Fashioned / Negroni：支持古典杯服务示例。
- IBA Paloma / Tequila Sunrise：支持高球杯服务示例。
- IBA Daiquiri：官方用语为 chilled cocktail glass，正文未把它扩张成只能使用 Coupe。
- NIST Appendix B.8：支持 1 US fl oz 约 29.57 mL。
- Libbey Glassware Handling Guide：提供通用操作参考，不能作为 Glarivo 型号的性能证明。
- 所有来源链接保留在英文正文相关段落。

## 审核后建议

- 同题已发布版本存在。若采用修订内容，后续宜在原文章 URL 上更新，避免同时发布两篇高度相似的文章；本次未执行发布或替换。
- 可进一步补充已核实的在售产品示例，但需有具体型号与参数支持，本次未虚构 SKU、容量、MOQ 或库存。
- 本地代码另发现 `src/lib/inquiries.ts` 的 SALES_EMAIL 仍为 `sales@garboglass.com`。这是站点联系配置的独立问题，本次未变更；应另行核对实际对外联系邮箱与询盘流程。

## 验证边界

- 数据库回读与本地草稿逐字段一致：68 个正文块、3 个正文图片块，加独立封面共 4 张。
- 修订公开路径 HTTP 404；旧文章路径 HTTP 200；主题页和 Shot Glass 分类 HTTP 200。
- 提供独立本地 HTML 预览用于排版审核，不等同于已登录后台编辑器的端到端验证。
- 未部署、提交或推送代码，未改动产品及其他文章。
