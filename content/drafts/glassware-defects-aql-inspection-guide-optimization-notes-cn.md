# 《Common Glassware Defects and Acceptable AQL Levels》优化审查

## 归类建议

- **主题：** `Glassware Quality Control`
- **内容类型：** Cross-category quality control / inspection guide
- **建议 URL：** `/blog/glassware-defects-aql-inspection-guide`
- **建议标题：** `Glassware Defects & AQL Guide for Wholesale Buyers`
- **建议摘要：** `Learn how to classify glassware defects, choose an AQL sampling plan, write measurable acceptance criteria and review a pre-shipment inspection report.`
- **建议阅读时长：** 12 minutes
- **建议封面：** `/images/blog/glassware-defects-aql-inspection-guide/hero-glassware-quality-inspection.webp`
- **封面 Alt：** `A quality inspector examining clear drinking glasses under neutral inspection lights, with selected samples, a loupe, caliper and inspection sheet.`
- **定位：** 跨品类的批量玻璃制品验货指南，不硬塞进现有产品场景主题；可从多个相关主题页导入，并链接回 Blog、Restaurant & Bar、Wine & Spirits、Kitchen Storage。

## 原稿的主要问题

1. **引用版本已过期。** 原稿写 ISO 2859-1:1999；该版本已于 2026-01-22 撤销，由 ISO 2859-1:2026 第三版取代。
2. **把 AQL 解释成“批次允许的最坏缺陷率”不够准确。** AQL 是连续批次抽样体系中的索引值和满意过程平均的界限，不是某一批实际允许的缺陷百分比，也不是质量目标。
3. **忽略连续批次与孤立批次的区别。** ISO 2859-1 依赖连续批次及正常、加严、放宽等转换规则；孤立批次应评估 ISO 2859-2 的 LQ 方案。
4. **固定抽样表存在误导风险。** 原稿只列批量、样本量和 AQL，没有完整说明检验水平、严重度、单双/多次方案、转换历史和标准版本，无法唯一确定接收/拒收数。
5. **“Critical 一律零缺陷”概念混淆。** 样本中的接收数为零，不代表整批零缺陷；高风险项目可能需要额外过程控制或 100% 筛选。
6. **把 1.5/2.5、4.0/6.5 写成玻璃行业标准。** 这些可以是采购双方采用的商业参数，但不是所有玻璃制品强制适用的统一值。
7. **缺陷分类和阈值过于武断。** “接缝高于 1 mm”“装饰偏移 1 mm”“晃动超过 1 mm”等必须来自具体产品、样品、工艺和协议，不能作为全品类规则。
8. **存在不安全检查动作。** 原稿建议用手指划过杯口检查锋利边缘，可能造成割伤；应使用经批准的安全、可重复方法。
9. **成本结论无依据。** “收紧 AQL 会增加 10%–20% 单价”等数字缺乏可验证来源，已删除。
10. **“所有重要订单都必须第三方验货”过度绝对。** 应基于供应商历史、产品风险、订单价值、复杂度和晚发现成本决定；如需要正式能力和独立性，应在委托前明确要求。
11. **包装跌落测试缺少完整测试条件。** 只有“做跌落测试”无法复现；需写明成品包装、预处理、跌落高度、姿态、顺序和判定标准。
12. **HTML 页面缺少完整 SEO 元数据和真实图片资源。** 只有 title/viewport，未见 description、canonical、Open Graph、Article schema；正文图片为内嵌 SVG，无法作为独立图片资源管理。

## 已完成的优化

- 更新为 ISO 2859-1:2026，并注明 1999 版已撤销。
- 增加 ISO 2859-2:2020 的孤立批次边界。
- 将 AQL、抽样结果、零接收数和整批缺陷率明确分开。
- 删除可能失真的固定抽样接收数表，改为完整参数和选表流程。
- 将缺陷分类改为产品、用途和合同驱动，不虚构通用阈值。
- 增加检验单位、批次划分、随机抽样、分阶段检验、测量项目和报告字段。
- 将手指划杯口改为经批准的安全检查方法。
- 将包装跌落测试绑定到完整方法和条件，并引用 ISO 2248。
- 将第三方验货改为风险决策，并引用 ISO/IEC 17020 的能力、独立性和一致性边界。
- 增加跨主题站内链接以及现有 About 页询盘入口。
- 生成 5 张无品牌 WebP 配图；均注明为流程/外观参考，不代表具体工厂、检测结果、样本量、缺陷阈值或认证。

## 发布前仍需确认

- 最终采用的质量主题名称；目前建议新增 Blog 分类字符串 `Glassware Quality Control`，不改产品目录分类。
- 目标客户实际采用的标准、版本和抽样体系；不能仅从本文复制数值进采购订单。
- 关键、主要、次要缺陷定义及每个 SKU 的判定阈值。
- 由谁出具检验计划、谁进行抽样，以及是否要求具有认可资质的检验机构。
- 任何容量、尺寸、耐久、包装或合规测试的正式方法和验收标准。
- 发布时补齐 meta description、canonical、Open Graph 图片和 Article 结构化数据（页面模板若已自动生成，则在上线后核查实际 HTML）。

## 事实来源

- ISO 2859-1:2026（当前第三版）：https://www.iso.org/standard/85464.html
- ISO 2859-1:1999（已撤销）：https://www.iso.org/standard/1141.html
- ISO 2859-2:2020（孤立批次 LQ）：https://www.iso.org/standard/64505.html
- ASQ Quality Glossary（AQL、接收抽样、随机抽样定义）：https://asq.org/quality-resources/quality-glossary
- NIST Acceptance Sampling Handbook：https://www.itl.nist.gov/div898/handbook/pmc/section2/pmc21.htm
- ISO 2248:1985（完整运输包装垂直冲击/跌落）：https://www.iso.org/standard/7062.html
- ISO/IEC 17020:2026（检验机构能力、公正性和一致运行）：https://www.iso.org/standard/17020

## 当前状态

- 仅生成本地审阅稿和项目配图。
- 未写入 Prisma / BlogPost 数据库。
- 未发布、未提交、未推送。
