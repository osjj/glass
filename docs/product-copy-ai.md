# 商品 AI 文案改写与产品页优化

商品编辑页顶部的“AI 商品文案”提供两个模式：“一键改写”润色已有字段；“产品页优化”可从表单中的文案、概览和规格补充买家相关的卖点与最多两个纯文字详情区块。优化模式还可输入目标买家与已核实的补充事实，并从现有主图、详情图选择最多五张公开图片作为视觉参考。两个模式都先生成英文建议、对照、逐字段或全部采用，再通过底部保存按钮保存。生成及预览均不写商品数据库。复用现有 `OPENAI_API_KEY` 和 `OPENAI_API_ENDPOINT`；`OPENAI_COPY_MODEL` 默认 `gpt-5.6-luna`，若另行配置模型须支持视觉输入和 Structured Outputs。

范围：名称、摘要、卖点、备用描述、详情区块标题/正文、SEO 标题/描述。网址、SKU、参数、类别、商业字段和图片不作为可修改字段。发送模型的数据包括当前文案、SKU、分类、概览、规格，以及优化模式中管理员输入的买家重点、已核实备注和所选图片；不包含价格成本、凭据或客户数据。只接受本站 `/images/` 或配置的 R2 公开媒体域名下的 HTTPS PNG/JPEG/WebP 图片。图片 URL 作为 `input_image` 传给 Responses API，不改动原图片；使用 `store: false`。视觉内容仅用于判断可见外观，不能证明容量、材质、工艺、认证或性能，管理员仍须核对生成文案。

## 使用与保护

- 详情页有卖点时显示卖点，没有卖点才显示备用描述；卡片仍显示参数。SEO 字段留空时前台回退到名称和摘要。
- 建议必须经后台采用并保存后才生效。已发布商品保存后会更新公开页面，不另外改变发布状态。
- 保存文字变化时，在同一事务中保留修改前快照并保护修改字段；历史入口显示最近 30 个快照。恢复同样先预览，再采用、保存；恢复前版本也会留档。
- 区块结构已变化时，历史恢复跳过区块文字，保留现有区块和图片。
- AI/手工修改字段均锁定，Garbo 和 Sunwin 后续同步保留。来源哈希变化时显示复核提示，管理员核查后勾选清除。旧版审核标记仍受保护。
- 用商品行锁与 `updatedAt` 阻止过期表单覆盖并发保存或同步。仅修改文案时只更新文本，不重建规格和图片记录。
- 模型输入输出有大小、字段、数值、单位和来源品牌检查；检查无法证明每个语义事实正确，仍需人工核对。数字校验不做单位换算。超限、拒绝、超时、错误均不改变表单或商品。
- 仅管理员访问，POST 检查同源；每个应用进程内同一管理员只允许一个生成请求，间隔至少 10 秒。多副本部署如需全局额度限制，应使用共享限流存储。
- 优化模式只允许在原区块后追加固定键名的纯文字区块；再次优化会改写这些区块，不会反复追加。仅增加文字区块的保存路径保留原图片和规格记录及其 ID。后台生成无法替代完整的人工产品核实与图片检查流程。
- 参考图只在“产品页优化”模式发送，可逐张取消。默认勾选最多两张主图和一张详情图，最多五张；无可用图时仍可生成文字。图片计入模型输入用量，可能增加费用。

## 上线

新增迁移 `20260916100000_product_copy_revisions`：两个 Product 管理字段和文案历史表；不修改现有文案。部署应用前执行 `npm run db:deploy` 和 `npm run db:generate`，再构建并重启应用。不要使用 `prisma db push` 绕过迁移。

当前实现及自动验证不等于线上已部署。测试工具使用独立 `copy_check_<timestamp>` PostgreSQL schema；`public` 商品数据保持原样。

## 验证命令

```powershell
npx tsx --test tests/product-copy.test.ts tests/sunwin.test.ts
npm run typecheck
npx tsx scripts/check-product-copy.ts setup
npx tsx scripts/check-product-copy.ts integration
npx tsx scripts/check-product-copy.ts catalog
npx tsx scripts/check-product-copy.ts build
npx tsx scripts/check-product-copy.ts server
# 使用隔离 schema 的本地 3117 端口和输出的测试商品地址。
# 浏览器测试专用认证保存在忽略的 output/playwright/product-copy/storage.json，不可提交。
# 完成至少两次保存（包括恢复）后：
npx tsx scripts/check-product-copy.ts verify
# 停止测试服务后删除本次隔离 schema：
npx tsx scripts/check-product-copy.ts cleanup
```

## 2026-09-16 本地验收

- 11 项单元测试、类型检查、本次修改文件的 ESLint、生产构建通过。
- 隔离数据库事务验证通过：修改前快照、过期保存拒绝、Sunwin 部分字段保护、Garbo 完整文案保护、来源变化提示、历史恢复与复核确认。事务测试全部回滚，媒体上传使用模拟结果。
- 当前网关真实 AI 请求通过，浏览器实际完成生成、全部采用、保存、历史预览、取消选择 SEO 标题后恢复其他 5 个字段并再次保存。
- 保存后独立查询确认：2 个历史版本，恢复的摘要与原始值一致，未选择的 SEO 标题仍保留；SKU、URL、图片、规格和概览记录（含 ID 和来源/审核元数据）完全未变。
- 桌面和 390px 手机布局已检查，手机页面宽度等于视口宽度。截图位于 `output/playwright/product-copy/`。
- 全仓 `npm run lint` 被已有 `output/` 临时脚本中的 18 个错误阻挡；本次修改文件均通过。
- 正式数据库迁移、Git 推送和线上部署尚未执行。
