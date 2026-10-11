# 连锁咖啡店玻璃杯采购新内容

- 日期：2026-10-06。
- 英文标题：Custom Glassware for Coffee Chains: Store Trials, Rollouts & Reorders。
- 分类：Coffee & Tea Glassware。
- Slug：custom-glassware-coffee-chains-store-trials-rollouts-reorders。
- 本次增加一篇新文章，保存为后台 DRAFT，publishedAt=null，featured=false。

## 内容分工

现有 Coffee & Tea 总指南负责容量、单双层、设备适配和茶具选型。新文章负责门店试用记录、批准版本、门店按款配货、收货与补单。

Dawn Coffee 案例仅引用已核实的 20 店、两店七天试用、三处区域仓库及后续扩充品类。不移用其检测数字、破损率、价格折扣、付款条件或交期。

## 配套文件

英文 Excel 空白模板包含 Store trials 和 Store allocation 两个工作表。只对实际填写的服务、周转和备用数量求和。输入缺失时总数为空；零是有效输入。不预设库存比例、MOQ、箱规、数量或价格。

正文使用当前 CMS 支持的段落、标题和列表，并提供工作簿下载链接，不新增网站表格渲染功能。

封面使用内置 image_gen 生成的通用示意，并明确标注非真实项目摄影。完整提示词、素材 hash 和验证记录保存在同名 image-prompts.json 与 verification.json。

## 已完成验证

- 后台草稿：https://www.glarivoglass.com/admin/blog/cmuw7xv7z0000wkumon83i1tc。
- 正文 1,309 词，6 分钟阅读。
- DRAFT、publishedAt=null、featured=false、publiclyEligible=0；数据库读回正文 hash 一致。
- 6 个相关页面返回 200；封面和 Excel 返回 200，公开下载内容 hash 与本地一致。
- 公开文章为 404，sitemap 未收录；未部署或提交索引。
- 桌面 1,440px 与手机 390px 正文无横向溢出，封面加载。两个工作表均完成渲染检查，数量公式完成零值与缺失输入检查。
- 原始封面：output/coffee-chain-20261006/hero-original.png；网页素材：public/images/blog/custom-glassware-coffee-chains-store-trials-rollouts-reorders/hero.webp。
- 本地预览是用于内容审阅的静态页面，导航不执行生产站交互。
