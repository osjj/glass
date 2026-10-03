# 内容内链与新选题执行记录

日期：2026-09-28。范围：用户确认的 SEO 行动第 3、4 点。

## 本地已完成

- Shot Glass 总指南：在容量、装饰、包装与报价段落新增 4 个子文章链接。
- Logo 样品文章：新增包装与 MOQ 文章入口；同步 Markdown 和 CMS Markdown 稿。
- 包装文章：新增 MOQ 入口，修复当前可复用导入稿中的 ISTA 地址。
- Coffee & Tea 文章：修复当前可复用导入稿中的 Hario PDF 地址。
- Markdown 转换：在处理斜体和粗体前保护链接和行内代码，避免 URL 下划线再次变成标签。
- 新建约 1,077 词的英文杯架适配检查草稿、EditorJS 文件、本地预览和中文选题说明。没有创建 CMS 记录或发布。

## 校验

- 3 项转换回归测试通过：真实参考 URL、含查询参数的 URL、格式与代码、输入转义。
- 修改的代码及更新脚本通过 ESLint；git diff --check 通过。
- 本地内容补丁重复执行不再添加相同段落；原有图片块保持一致。
- 两个正确的外部链接均于本次检查返回 200：ISTA HTML，Hario PDF。

## 尚未完成的线上部分

数据库 TCP 与认证成功，但包括 SELECT 1 在内的读取查询超时，Prisma 读取也报告连接被终止。后台浏览器连接恢复尝试同样超时。没有执行数据库更新，没有部署、提交索引或更改 GSC/GA4。

因此上面的完成状态仅代表本地源文件与审阅材料；线上文章仍需保存和验证。仅部署代码不会自动覆盖数据库内已有文章的正文。

## 恢复连接后的执行入口

先执行：

```powershell
npx tsx scripts/update-shot-glass-content-links.ts
```

检查 dry-run 输出和带时间戳的 before/proposed 备份后，在本次已授权范围内执行：

```powershell
npx tsx scripts/update-shot-glass-content-links.ts --apply
```

脚本仅修改指定的已发布文章 content 字段；保存备份，检查目标文章已发布，在事务中以原内容和 updatedAt 防止覆盖并发编辑，再回读内容与元数据。若总指南来自源文件 fallback，脚本会提示它需要代码部署。代码部署仍需按现有发布流程进行。

最后逐页访问不带查询参数的正式 URL，核对 7 个新增链接、2 个参考地址、标题、canonical、图片和原发布日期。新草稿的反向入口只在正式发布之后加入。

## 第 4 点交付

见 content/drafts/restaurant-glassware-dishwasher-rack-fit-storage-checklist.notes-cn.md：选题边界、资料要求、未来两周的 70/30 工作安排和效果观察口径。没有创建自动监控或计划任务。
