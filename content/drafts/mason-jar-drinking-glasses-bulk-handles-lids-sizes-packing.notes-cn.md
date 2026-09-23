# Mason Jar 饮用杯文章交付记录

- 标题：Mason Jar Drinking Glasses in Bulk: Handles, Lids, Sizes & Packing
- 分类：Restaurant & Bar Glassware；沿用现有博客架构。
- 内容：约 2,300 个英文单词；完整配件报价、饮品与容量、把手宽度、盖子和吸管、三个产品参考、装箱计算、样品批准、RFQ 清单及六个 FAQ。
- 与旧文区别：旧文关注储存、盖子密封和成本；新文关注餐饮饮用场景与成套采购，并通过内链衔接。
- 事实边界：容量换算采用 NIST；960/24=40、960/48=20 是假设包装方案算例。GB2517J 的 480 mL、24pcs/ctn 来自当日产品页，最终采购仍确认容量口径。宽口款标题写塑料盖、材质字段写金属盖，文中保留该冲突，不擅自选定材质。
- 配图：内置 image_gen 生成三张 1536×1024 图，保存到项目 public/images/blog/mason-jar-drinking-glasses-bulk-handles-lids-sizes-packing/；转换为 WebP，合计约 454 KB。正文注明为示意，不代表特定 SKU 或通过运输测试的包装。
- 来源快照：output/mason-drinking-20260922/source-pages.json；当日类目、旧文、五个产品页均返回 200。
- 内容检查：当前 CMS 内容验证通过；68 个正文块、2 张正文图，加封面共 3 张；8 个唯一站内链接均返回 200。
- 图片检查：R2 上传前已对已有对象进行签名 GET；上传后每张均完成签名读取、独立公开 HTTP 200 image/webp 与 SHA-256 比对。
- 视觉检查：独立本地预览的 1440px 桌面和 390px 手机截图已查看；手机无横向溢出，三张图片加载成功。不是已登录后台的编辑器界面 QA。
- 数据库：新建单条 DRAFT，featured=false、publishedAt=null；逐字段读取核对成功，publiclyEligible=0，公开文章路径 HTTP 404。没有修改其他文章。
- 后台地址：https://www.glarivoglass.com/admin/blog/cmucidsq400000sumh32a59hu
- 公开发布：未执行。
