# Sunwin 化妆品玻璃同步

## 分类对应

网站大类：`Cosmetic Glass Packaging`，slug 为 `cosmetic-glass-packaging`。

| 网站小类 | slug | Sunwin 来源路径 |
| --- | --- | --- |
| Essential Oil Bottles | essential-oil-bottles | /product_category/10.html |
| Perfume Bottles | perfume-bottles | /product_category/9.html |
| Foundation Bottles | foundation-bottles | /product_category/11.html |

来源域名固定为 `https://www.sunwin2001.com`，不包含公模产品分类 `/2.html`。

## 后台使用

打开 `/admin/imports?provider=SUNWIN`，选择来源小类；目标分类自动按已保存映射填写。
选择 5 / 10 / 25 / 50 / 全部，以及草稿或发布模式，再执行扫描预览和导入。
Sunwin 默认导入草稿；Garbo 保留默认发布模式。

扫描会覆盖该分类所有分页，批量选项限制之后处理的商品数量。
只处理本次成功读取的候选记录，优先新商品，再处理有变化的 Sunwin 商品。
发布模式下，Sunwin 新商品先创建为草稿，图片处理完整成功后再发布。
已存在的已发布商品在草稿模式下不会被下架。

相同来源商品按 provider + sourceUrl 去重。跨分类发现会记录多个来源分类，保留原主分类。
系列型号和混合单位原样保留到待检查字段，不推测型号与容量的一一对应关系。
商品图库与工艺详情图片分别处理，排除站点 Logo、二维码和横幅路径。
来源发生变化时更新受来源管理的文案和未人工确认的容量字段；人工修改的文案、已确认容量、商品名称及主分类保留。
图片失败时保留完整旧图库，不提交部分替换。

## 数据库和部署

迁移 `20260913100000_sunwin_catalog` 增加 SUNWIN 来源、候选记录多分类信息和上次同步内容基线。
分类初始化脚本幂等；遇到现有 slug / 分类父级 / 来源映射冲突会回滚，而不是覆盖。

```powershell
npm run db:deploy
npm run db:generate
npm run catalog:sunwin:categories -- --apply
npm run build
```

2026-09-13 已向当前项目连接的数据库执行迁移并创建 4 个分类、3 条来源记录和 3 条映射。
原有分类和映射逐条对比未变；未批量导入商品。
本次代码尚未推送或部署，线上新同步入口需随应用部署生效。

## 验证

- `npm run test:catalog`：分类网址、分页、标题分类、系列单位、图片和来源身份测试。
- `npm run catalog:sunwin:check`：实际源站分页及三个分类的各一条商品解析，不写数据库、不上传图片。
- `tsx scripts/test-sunwin-transaction.ts`：真实数据库事务验证重复导入、分类归属、草稿、容量刷新、人工编辑保护及图片失败；最终全部回滚。媒体上传使用模拟结果。
- `tsx scripts/check-catalog-admin.ts`：本地 3107 端口的认证后台页面、真实扫描预览操作及错误映射拒绝；只更新扫描统计，不提交导入操作。

已通过类型检查、定向 ESLint、生产构建及上述验证。浏览器自动化连接不可用，因此未进行浏览器点击/视觉验收，也未执行真实 R2 上传测试。
