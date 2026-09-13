# 钢化与退火玻璃：内容审核与优化说明

审核日期：2026-09-13。已完整读取原 HTML，保留原文件。优化稿为本地英文文章，未写入数据库或发布。后续按用户“帮我上传”的指令，已将三张配图上传 R2，并替换本地草稿中的图片引用。

## 分类与定位

- 主主题：**Restaurant & Bar Glassware**。
- 主题路径：`/guides/restaurant-bar-glassware`，已核对当前 `src/data/guide-clusters.ts` 中确实存在。
- 内容定位：餐厅、酒吧采购人员的玻璃处理工艺、耐用性与破损风险选型指南。
- 文章标题：**Tempered vs Annealed Glassware: Durability & Buying Guide**。
- 建议 URL：`/blog/tempered-vs-annealed-glassware`。
- 摘要：Compare tempered and annealed glassware for restaurant and bar service, including breakage, dishwasher care, decoration and sample approval.
- 分类原因：文章主要回答餐饮使用与采购决策，适合归入现有餐厅酒吧主题。质量控制作为文内议题，不新建主主题。

## 必须修正的问题

| 原文问题 | 已采取的处理 |
| --- | --- |
| 前面说钢化必须在装饰前，后面多次说必须在装饰后；第 6 节因果也自相矛盾 | 删除统一先后规则，要求提供具体坯体、装饰和热处理的经验证工艺顺序。Duralex 定制服务证明部分工艺可行，但不证明所有供应商都适用 |
| 通用 4–5 倍强度、40–50°C / 150–200°C 热冲击，以及其他材料温差条形图 | 删除无出处的数值表和图；性能须对应具体型号、试验方法与条件。温差不是最高使用温度 |
| 15–35% 钢化溢价、较高报废率以及相关成本结论 | 删除无来源比例和必然性结论，改为同规格报价及实际补货成本对比 |
| 商用洗碗机只能用钢化玻璃、退火玻璃必然不适合 | 改为成品型号与装饰适用说明；不能从处理工艺名称推断 |
| 发白、雾化、细裂都归因于非钢化和热冲击 | 区分表面蚀刻、沉积和破损，不能凭雾化判断需要钢化。附 Libbey 资料 |
| 小碎片钝、通常原地坍塌、不飞散 | 删除安全保证，说明碎片仍可能扩散，需依现场破玻璃流程检查周围食物、冰和设备 |
| 只要偏光膜见应力就能可靠确认；圆润杯口有鉴别意义 | 改为工艺文件与适用测试组合；偏光解释需要方法、厚度和经验，不是通用钢化认证 |
| 打碎一只即可定论；冷热水反复冲击即可判断批次 | 改为具备防护的专业试验及约定抽样；单件结果不能代表整批 |
| 固定 20 次洗碗循环作为通用验收 | 改为与目标用途匹配的协议，记录设备、程序、水和洗涤剂条件、周期与判定标准 |
| 镍硫化物热浸证书作为高价值杯具通用要求 | 删除通用采购要求；NGA 所引用热浸资料明确属于建筑玻璃范围 |
| 钢化、局部热处理、材料成分混在一起 | 区分成分、全钢化、局部处理、几何外形与装饰；引用 Libbey 具体产品作局部处理例子 |
| 激光钢化前后都可用、后装饰一律失去钢化 | 改为具体工艺验证；没有证据时不承诺强度保持或必然退火 |

## 结构与搜索优化

保留原文工艺、耐用性、破损、成本、装饰、样品及采购清单的核心；调整顺序以减少重复，新增简短 FAQ。英文正文使用明确小标题、两条已存在的相关主题/产品路径和贴近论断的一手来源链接。没有加入不存在的产品型号、认证、MOQ 或供货承诺。

正文按当前 EditorJS 支持的段落、标题、列表、图片组织；原 HTML 的不可靠温差图不移入新稿。标题、摘要、分类、封面和正文数据另存于配套 draft.json，方便后续后台导入。本次没有改线上 SEO、sitemap 或网站代码，也没有做关键词排名分析。

## 新配图

使用内置 ImageGen 生成三张独立图片，保存 WebP 于 `public/images/blog/tempered-vs-annealed-glassware/`：

1. `hero.webp`：两种外观正常的透明饮用杯，1600 × 900；不暗示外形可判断钢化。
2. `dishwasher-rack.webp`：杯具分格放置的洗杯架，1200 × 900；不表示实测通过。
3. `decoration-samples.webp`：无装饰、印花、磨砂效果样品概念，1200 × 900；不表示真实型号或工艺已获批准。

已查看三张生成图，杯口、底部及主要场景可用，无水印、品牌或伪造检测文字。正文各图均有 AI 示意说明。完整提示词见配套 image-prompts.md。

## 资料与边界

- [Duralex 钢化原理](https://uk.duralex.com/pages/the-secret-to-solidity)：仅用于原理解释；不采纳跨型号通用数值或绝对安全保证。
- [Libbey 局部热处理杯实例](https://libbeyfoodservice.com/product/libbey/restaurant-basics-heat-treated-mixing-glass/1639ht)：证明局部处理需要单独说明，不作为 Glarivo 产品证据。
- [Libbey 使用维护](https://mkt.libbey.com/hubfs/care--handling-brochure-2019.pdf)：温差与操作指导。
- [Libbey 玻璃蚀刻说明](https://help.libbey.com/hc/en-us/articles/360037760851-Etching-of-glassware)：雾化成因及洗涤条件。
- [Libbey 2017–2018 产品册](https://www.libbey.com/catalogs/Libbey-for-Life-EMEA-catalog-2017_2018.pdf)：仅引用碎片可能扩散的说明，不代表当前产品范围或其他营销判断。
- [Duralex 定制工艺](https://www.duralex.com/en/pages/verre-a-personnaliser)：说明特定产品存在获厂家支持的装饰方案，未据此推断统一顺序。
- [ASTM C149 公开范围](https://store.astm.org/c0149-14.html)及 [C148 公开范围](https://store.astm.org/c0148-00.html)：仅核查公开摘要，不声称已阅读全文或某杯具符合标准；链接页面可能展示旧版，可从页面查看 active 版本。
- [NGA 热浸测试范围](https://members.glass.org/cvweb/cgi-bin/msascartdll.dll/ProductInfo?productcd=HEATSOAKING)：明确建筑应用边界。

未获得任何具体 Glarivo 型号的性能报告、报价或装饰工艺文件；正文不作此类产品承诺。后续如决定后台入稿或发布，再核对同标题/slug 是否已存在，以及真实后台和网站显示效果。

## 本次验证结果

分类名称与当前主题配置匹配；正文转换为 53 个受支持的 EditorJS 内容块，其中 3 个图片块；3 张 WebP 的引用、尺寸和文件存在性均验证通过，总计约 334 KiB，已查看最终图片。配套 JSON 标记 DRAFT、featured=false、publishedAt=null，且只保存在本地。未执行数据库写入。

HTML 预览文件已生成并提交 Codex 文件面板打开。浏览器安全策略拒绝访问本地 file URL，因此没有完成浏览器页面或移动端排版检查；文件面板返回 queued 也不视为视觉验证通过。当前已核验的视觉范围为图片本身。

## 配图上传结果

已上传至 `glarivoglass-media`，使用 `https://media.glarivoglass.com` 公开访问。三张图片的签名读取及公网 GET 均通过，HTTP 200、image/webp，远程内容 SHA-256 与本地原文件完全一致。使用带内容哈希的新文件名，未覆盖旧素材。

Markdown 正文、draft.json 的封面与正文、HTML 预览均已换用远程图片地址。保留本地 WebP 文件。文章仍为本地草稿，没有数据库写入、发布或部署。完整图片链接和校验值见 `tempered-vs-annealed-glassware.r2-upload.json`。
