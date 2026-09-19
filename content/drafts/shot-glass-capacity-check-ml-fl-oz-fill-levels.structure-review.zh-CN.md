# 第二篇：容量核对——内容结构审核与交付说明

核对时间：2026-09-19。依据：当前代码、只读数据库查询和线上页面实际响应。此文件是编辑说明，不属于英文文章正文。

## 审核结论

现有「Blog → 主题页 → 具体文章」结构可以承接第二篇，不需要新建栏目或调整数据库。第二篇应作为 Shot Glass Sourcing 下的容量核对专题，与总指南、Logo 审批专题形成分工。

线上已确认：

- `/blog` 返回 200，保留五个主题入口。
- `/guides/shot-glass-sourcing` 返回 200，当前列出总指南与第一篇 Logo 审批清单。
- 第一篇 `Custom Logo Shot Glasses: Artwork & Sample Approval Checklist` 已是 PUBLISHED，公开页面返回 200；与此前保存草稿时的状态不同。
- 总指南返回 200，`#shot-glass-product-comparison` 和 `#shot-glass-quote` 两个锚点均存在。
- 本次新 slug 公开页面目前返回 404；只读查询未发现同 slug 或容量主题的 CMS 条目。新文章尚未上传。

本地仍存在早期 `shot-glass-sizes-guide-for-wholesale-buyers.md`。它覆盖尺寸选择等宽泛话题，不能当作已发布文章。本次保留原文件，另建专注「容量核对」的新稿，避免再次写一篇总指南。

## 文章分工

| 内容 | 主要回答的问题 | 第二篇如何衔接 |
| --- | --- | --- |
| Shot Glass Buying Guide for Wholesale Buyers | 如何整体选型、比较产品与准备询盘 | 开头链接总指南，结尾链接其产品比较与询盘区 |
| Custom Logo Shot Glasses: Artwork & Sample Approval Checklist | 如何确认稿件、印刷位置及装饰样品 | 在填充线与装饰位置的讨论中链接第一篇 |
| Shot Glass Capacity: How to Check mL, fl oz & Fill Levels | 容量写法如何核对，怎样记录样品结果 | 提供换算、方法、示例和可复制记录字段 |

新稿主分类为 **Shot Glass Sourcing**。它适用于酒吧采购，但现有模型只有一个 category 字段，因此不同时归入 Restaurant & Bar。日后餐饮酒吧文章讨论份量、器具选择时，可以通过正文内链引用本篇，无需再发布内容相同的另一篇。

## 已适配的当前结构

1. **分类匹配**：使用精确的 `Shot Glass Sourcing`。主题页按 category 与主题 title 相等筛选，正式发布且发布日期生效后会自动归入主题页，不需要新增静态文章条目。
2. **编辑器格式**：正文转换为当前 EditorJS 格式，共 54 个 block。只使用 paragraph、header、list、image，已通过项目现有存储校验函数。容量对照和审批记录采用原生列表，没有把 Markdown 表格当成已支持的表格块。
3. **页面标题和目录**：title 字段负责 H1；正文不重复 H1。9 个 H2 生成目录，5 个 FAQ 使用 H3，不占据主目录。
4. **图片**：独立封面 + 两张正文图；每张都有说明/替代文本。PNG 原图与 WebP 均保留，网页用图总计约 294 KiB。AI 示意图不作为具体 SKU、测试或校准结果的证据。
5. **视觉**：本地预览采用当前深蓝、暖金与米白配色，遵循标题区 → 独立封面 → 目录 → 正文顺序。预览为独立 HTML，不是实际 Next.js 页面或线上截图。
6. **产品与询盘**：当前代码仅为总指南 slug 插入产品比较卡和专用询盘区。第二篇通过已验证锚点连接这些模块，没有假定普通文章自动具有同样的卡片或独立询盘归因。
7. **SEO 字段**：当前实现直接使用 title 和 excerpt 生成页面标题与描述，本稿 excerpt 为 151 个英文字符。未新增不存在的 metaTitle、metaDescription 或 keywords 数据库字段。
8. **发布状态**：交付 JSON 为本地 DRAFT，featured=false，publishedAt=null；未改变总指南的精选地位，未写入数据库。

## 新稿内容

- 标题：Shot Glass Capacity: How to Check mL, fl oz & Fill Levels
- slug：`shot-glass-capacity-check-ml-fl-oz-fill-levels`
- 分类：Shot Glass Sourcing
- 约 1,777 个英文词；阅读时间字段 9 分钟。
- 摘要：Check shot glass capacity in mL and fl oz, distinguish brimful from intended fill, and document sample measurements before approving a wholesale order.

主目录：

1. Quick checklist: what to confirm before sample approval
2. Separate nominal size, brimful capacity and intended fill
3. Specify mL and identify the fluid-ounce system
4. Agree a sample-check method before measuring
5. Check the rim endpoint and intended fill separately
6. Record individual results before deciding acceptance
7. Copy this capacity approval record into your brief
8. Request comparable samples and a quotation
9. Frequently asked questions

内容明确区分标称容量、满杯容量、计划注液量，以及 mL 余量和 mm 高度余量。50/51/52 mL 样品数据仅为算术示例，已在文中明确标注；没有推断实际产品容量、通用公差或固定抽样数量。

## 发布时应补的两条回链

新稿已经有向总指南、第一篇和主题页的链接。正式发布后，再为已有文章补充以下上下文链接，会让这组内容更容易连续阅读。不要在目标页仍为 404 时提前加入线上回链。

- 总指南第 2 节容量段落后可加入：For a step-by-step sample check, use our [shot glass capacity checklist](https://www.glarivoglass.com/blog/shot-glass-capacity-check-ml-fl-oz-fill-levels) to confirm units, fill levels and measurement records.
- 第一篇检查实体样品的段落后可加入：Confirm the glass blank's volume separately with the [shot glass capacity checklist](https://www.glarivoglass.com/blog/shot-glass-capacity-check-ml-fl-oz-fill-levels) before approving the finished sample.

这两条是待发布时执行的编辑建议，本次没有修改既有线上文章。

## 交付文件与使用方式

- `.preview.html`：自包含图片的本地阅读预览，双击可打开。
- `.md`：完整英文正文，第一行是文章标题，导入正文时不应重复该 H1。
- `.draft.json`：匹配当前 BlogPost 字段的本地草稿包；content 是已校验的 EditorJS JSON 字符串。
- `.editorjs.json`：便于检查的展开版正文 blocks。
- `.image-prompts.json`：三张图的生成提示。
- `.verification.json`：格式、块数、图片和内链核验记录。
- `public/images/blog/shot-glass-capacity-check-ml-fl-oz-fill-levels/`：三个 PNG 原图和三个 WebP。

草稿中的图片地址是项目本地 `/images/blog/...` 路径，**尚未上传线上存储**。若沿用上一篇的上传流程，应先上传 WebP、验证线上图片可读，再替换 coverImage 与正文图片 URL 后保存 CMS 草稿。仅把现有 JSON 写入线上数据库不会自动上传图片。

## 核验依据与范围

- 当前代码：`prisma/schema.prisma`、`src/lib/article-content.ts`、`src/lib/article-content-server.ts`、`src/app/(site)/blog/[slug]/page.tsx`、`src/app/(site)/guides/[slug]/page.tsx`、`src/data/article-products.ts`、`src/components/site/reading-pages.module.css`。
- 只读数据与线上响应记录：`output/shot-capacity-20260919/existing-posts-readonly.json`、`live-structure.json`。
- 换算依据：[NIST SP 811 conversion factors](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8)。已独立用 Decimal 复算 US/Imperial 换算。
- 方法边界：[NIST volumetric calibration procedures](https://nvlpubs.nist.gov/nistpubs/ir/2019/NIST.IR.7383-2019.pdf) 与 [NIST meniscus guidance](https://www.nist.gov/document/gmp-3-reading-meniscus-20190507pdf)。本文是采购样品核对指南，不声称提供完整校准程序。
- 内链目标已逐一验证 HTTP 200；总指南两个锚点均存在。新文章未发布，因此不声称已验证线上新页面或搜索收录。

本次未改数据库结构、网站业务代码或已有文章；未进行数据库写入、R2 上传、Git 提交、推送或部署。
