# 《How to Read Glassware Spec Sheets》优化审查

## 归类与发布字段

- **主题：** `Glassware Quality Control`
- **内容类型：** Cross-category specification / procurement guide
- **建议 URL：** `/blog/glassware-spec-sheet-guide-wholesale`
- **建议标题：** `How to Read Glassware Spec Sheets for Wholesale`
- **建议摘要：** `Learn how to verify glassware capacity, dimensions, weight, tolerances, material, decoration and packing before approving a wholesale specification.`
- **建议阅读时长：** 12 minutes
- **建议封面：** `/images/blog/glassware-spec-sheet-guide-wholesale/hero-glassware-spec-sheet-review.webp`
- **封面 Alt：** `A wholesale buyer reviewing a clear glass tumbler, an unbranded specification drawing and measurement tools at a neutral product-development desk.`
- **定位：** 跨品类规格表审查指南，与 AQL 验货文章同属质量控制主题，但本篇聚焦采购规格定义，AQL 文章聚焦抽样和批次接收。

## 原稿主要问题

1. **把 working capacity 写成固定比例。** `stemware 60%–75%`、`jars and tumblers 85%–90%` 没有全行业统一依据，应按具体用途、杯型、冰、泡沫、封盖和留空要求确认。
2. **将 400 mL 与 150 mL/65% 的示例混为采购结论。** 算术本身也不一致，且不能用于推断某款杯子的适用倒酒量。
3. **“1 g water = 1 mL”写得过于绝对。** 只能用于近似；精确测量需要考虑测量温度下的水密度、仪器和方法。
4. **虚构通用公差表。** 高度、口径、容量、重量和壁厚公差必须来自具体图纸、工艺能力、用途和双方协议。
5. **无依据的成本增幅。** “重量公差从 ±5% 收紧到 ±3% 会增加 5%–10% 单价”已删除。
6. **工厂/贸易公司文件质量判断武断。** 不能默认工厂表一定有真实公差、贸易公司表一定只是转抄。
7. **模具老化数字没有依据。** “三年前的表可能高 4 mm、重 10 g”等示例已删除，改为版本核对和变更说明。
8. **重量用途被过度简化。** 产品净重不是普遍的关税计算依据；运费也不一定只按毛重，可能比较实际重量和体积重量并按服务规则计费。
9. **把重量等同于品质和破损风险。** 单件重量不能单独证明耐用性、品质或破损率。
10. **把 tempering 当成材料。** 钢化是处理/性能描述，应与基础玻璃材料、成型工艺和表面处理分开。
11. **商业洗碗机要求写成统一强制规则。** 不是所有进入商业洗碗机的玻璃都必须钢化；钢化也不能单独证明洗碗机适用。
12. **将 FDA、LFGB、Prop 65 当成并列认证徽章。** 三者的法律体系、对象和义务不同，必须从目的市场、成品配置、装饰和进口商责任出发。
13. **装饰与包装字段不足。** 原稿缺少 artwork revision、参照点、成品测试范围、纸箱尺寸、托盘数据和包装样品版本。
14. **HTML SEO 信息不完整。** 只有 title/viewport，未见 meta description、canonical、Open Graph、Article schema；配图为两个内嵌 SVG，没有独立图片资源。

## 已完成优化

- 将每个规格拆为 characteristic、value/unit、method、acceptance range 四个字段。
- 增加文件版本、产品/模具/图纸引用、批准人和实体样品的版本控制。
- 明确 brimful、rated/nominal、fill-line、working/serving 和 usable volume 的区别。
- 增加容量测量的温度、水密度、仪器、液面和样本规则。
- 将直径拆为内径、外径、最大体径、底径、颈口或配合尺寸。
- 将 unit、set、net carton、gross carton、palletized gross mass 分开。
- 增加体积重量和承运人计费规则边界。
- 删除通用公差和成本增幅，改为功能要求和工艺能力驱动。
- 将基础材料、成型、钢化/退火、表面处理、装饰和组件分开。
- 补充装饰后成品文件、完整包装层级、实物包装验证和变更控制。
- 增加 Blog、三个相关主题页以及 About 页询盘入口。
- 生成 5 张无品牌 WebP 配图；不显示真实规格数值、认证或具体供应商身份。

## 发布前检查边界

- 本篇不提供任何 Glarivo 在售型号的实际容量、尺寸、重量、公差、材料或合规结论。
- 如需要链接上一篇 AQL 草稿，应等该文章公开后再添加，避免先发布本篇产生 404。
- 产品规格、使用条件和文件必须在最终报价、样品及采购订单中再次确认。
- 发布模板需实际检查 meta description、canonical、Open Graph 图片和 Article schema 是否正确输出。

## 事实来源

- NIST Density definition：https://www.nist.gov/glossary-term/21726
- NIST Handbook 145，水质量换算体积需使用测量温度下的水密度：https://nvlpubs.nist.gov/nistpubs/Legacy/hb/nbshandbook145.pdf
- DHL Global Forwarding chargeable weight：https://www.dhl.com/us-en/home/global-forwarding/freight-forwarding-education-center/calculating-chargeable-weights.html
- European Commission Food Contact Materials：https://food.ec.europa.eu/food-safety/chemical-safety/food-contact-materials_en
- Regulation (EC) No 1935/2004 legislation overview：https://food.ec.europa.eu/food-safety/chemical-safety/food-contact-materials/legislation_en

## 当前状态

- 本地优化稿及配图准备中。
- 将按用户本次授权写入 BlogPost 数据库，状态固定为 `DRAFT`。
- 不设置 featured，不设置 publishedAt，不公开发布。
- 不自动提交或推送代码。
