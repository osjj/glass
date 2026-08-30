# Glarivo 独立站 MVP 建设与上线操作文档

> 文档版本：2026-08-29  
> 目标域名：`glarivo.com`  
> 本地项目目录：`D:\glarivo`  
> 参考项目：`D:\project\b2c-store`（本方案只读参考，不直接复制整个项目）

## 1. 结论与项目边界

Glarivo 第一版建议定位为“企业产品目录 + Blog 内容管理系统”，而不是完整电商平台。

公开站顶部只保留四个菜单：

- Home
- Products
- Blog
- About

第一版包含：

- Home、Products、Blog、About 四类公开页面；
- 产品列表、产品详情；
- Blog 列表、文章详情；
- 只供管理员使用的后台；
- Products、Blog 的新增、编辑、保存草稿、发布、撤回、归档；
- 产品和 Blog 图片上传；
- 基础 SEO：title、description、canonical、robots、sitemap、Open Graph；
- 腾讯云 Linux + 宝塔 + Nginx + PostgreSQL + 单个 Next.js 生产进程；
- Cloudflare DNS、代理、HTTPS、基础缓存与安全配置；
- 数据库、上传图片、环境配置的备份与恢复流程。

第一版明确不包含：

- 购物车、订单、支付、结账；
- 价格阶梯、库存、SKU 变体、复杂属性体系；
- 前台会员注册、会员中心；
- 询盘邮件、邮件发送、SMTP；
- AI、聊天、自动生成内容或图片；
- 评论、评分、复杂搜索、标签系统；
- 多语言、多币种；
- Cloudflare R2、腾讯云 COS 作为在线图片存储；
- Home、About 的后台页面编辑；
- 1688、Notion、ERP、CRM、第三方同步；
- Redis、Docker 集群、多机负载均衡。

这样可以保留 `b2c-store` 已验证的核心技术路线，同时避免把它现有的订单、报价、AI、邮件、聊天、购物车、R2、采集器等复杂功能带入首版。

## 2. 推荐架构

```text
访客 / 管理员
      |
      v
Cloudflare
DNS、代理、边缘 HTTPS、基础 WAF、静态资源缓存
      |
      v
腾讯云安全组或轻量应用服务器防火墙
公网只开放 80/443；SSH 和宝塔端口限制管理员 IP
      |
      v
宝塔 Nginx
  |-- /uploads/*  -> /www/wwwroot/glarivo/shared/uploads/
  `-- 其他请求    -> http://127.0.0.1:3000
                              |
                              v
                    单个 Next.js 生产进程
                              |
                              v
                 PostgreSQL 127.0.0.1:5432
```

首版采用单服务器、单应用进程、单 PostgreSQL 实例。对当前规模来说，这比 Docker、Redis、集群或独立数据库服务器更容易部署、备份和排错。

建议唯一规范域名为：

```text
https://glarivo.com
```

`https://www.glarivo.com/*` 永久 301 到 `https://glarivo.com/*`，必须保留原路径和查询参数。

## 3. 与现有 b2c-store 的复用范围

只复用以下实现思路：

- Next.js App Router + React + TypeScript；
- Tailwind CSS 和少量通用 UI 组件；
- Prisma + PostgreSQL；
- 管理员账号、密码哈希、角色检查；
- `/admin` 布局和每次写操作都重新鉴权的模式；
- Products、Blog 的列表、表单、slug、发布状态和分页思路；
- `robots.ts`、`sitemap.ts`、metadata、canonical 的实现方式；
- Nginx 反代到本机 Next.js 端口的部署方式。

不要直接复制：

- 原项目完整 `prisma/schema.prisma`；
- Cart、Order、Quote、Quotation、Customer、Chat、Email 等模型；
- ProductVariant、PriceTier、复杂 Category/Attribute/Collection；
- AI Quote、Embedding、OpenAI/Gemini、Pusher、1688、IndexNow；
- R2 上传、复杂图片采集和自动化脚本；
- 原站品牌、域名、SEO 文案、环境变量和密钥。

现有 `b2c-store` 的产品模型已经包含价格、成本、库存、变体、属性、集合、报价、向量等内容；新项目应重新建立最小 schema，不应通过“删除看似无用的字段”来裁剪原 schema。

另外，参考项目当前工作树包含其他尚未提交的报价工作台改动，不是适合复制的干净模板。因此 Glarivo 必须从新脚手架开始，并按白名单逐项移植；禁止复制参考项目的 `.env`、`.next`、`node_modules`、临时输出或未提交报价模块。

## 4. 技术版本基线

新项目建议使用：

| 组件 | 建议 |
|---|---|
| Linux | 宝塔镜像当前受支持的 Ubuntu 或 Debian 版本 |
| Node.js | Node.js 24 LTS |
| Next.js | 当前有安全修复的 Next.js 16 稳定版，并提交 lockfile |
| React | 与所选 Next.js 版本匹配的 React 19 |
| TypeScript | 5.x |
| Prisma | Prisma ORM 7 稳定版 |
| PostgreSQL | 16 或宝塔当前稳定支持的更高主版本 |
| CSS | Tailwind CSS 4 |
| 内容 | Markdown，不启用原始 HTML |
| 图片处理 | Sharp，统一重编码为 WebP |
| 进程管理 | 宝塔 Node 项目管理器/PM2，单个 fork 进程 |
| Web 入口 | 宝塔 Nginx |

截至本文日期，已核对的 npm 稳定版本是 Next.js `16.3.3`、React `19.2.8`、Prisma Client `7.10.0`。若马上开始开发，可以此为初始锁定版本；若晚于本文日期实施，应先重新检查安全公告和兼容性，再更新本文中的版本号。不要在生产部署时无审查地执行全量 `latest` 升级。

Node.js 24 LTS 是新生产项目的优先选择。Next.js 16 的最低要求虽然低于 Node 24，但“最低可运行”不等于适合新生产环境。

## 5. 页面与路由

### 5.1 公开路由

| 路由 | 功能 | 数据来源 |
|---|---|---|
| `/` | Home：品牌介绍、精选产品、最新文章 | 静态模块 + 已发布数据 |
| `/products` | 产品列表，每页建议 12 条 | 已发布 Product |
| `/products/[slug]` | 产品详情 | 已发布 Product |
| `/blog` | Blog 列表，每页建议 10 条 | 已发布 BlogPost |
| `/blog/[slug]` | Blog 详情 | 已发布 BlogPost |
| `/about` | 公司简介 | 首版代码内静态维护 |
| `/robots.txt` | 搜索引擎规则 | Next.js 动态生成 |
| `/sitemap.xml` | 公开 URL 清单 | 静态页 + 已发布内容 |
| `/healthz` | 应用/数据库健康检查，只返回简单状态 | 应用与数据库 |

### 5.2 后台路由

| 路由 | 功能 |
|---|---|
| `/admin/login` | 管理员登录 |
| `/admin` | 简洁仪表盘和快捷入口 |
| `/admin/products` | 产品列表、搜索、状态筛选 |
| `/admin/products/new` | 新建产品 |
| `/admin/products/[id]/edit` | 编辑产品 |
| `/admin/blog` | Blog 列表、搜索、状态筛选 |
| `/admin/blog/new` | 新建文章 |
| `/admin/blog/[id]/edit` | 编辑文章 |
| `/api/admin/uploads` | 管理员图片上传 |

后台不出现在公开导航中。`/admin/*` 设置 `noindex, nofollow`，但 robots、隐藏链接或改后台路径都不能代替登录和服务端授权。

Products 与 Blog 的写入优先使用 Server Actions；无需另建公开 CRUD REST API。每个 Server Action、上传路由和敏感查询都必须在服务端再次验证管理员身份，不能只依赖页面跳转或 Proxy。

## 6. 建议代码目录

```text
D:\glarivo\
  src\
    app\
      (site)\
        layout.tsx
        page.tsx
        products\
          page.tsx
          [slug]\page.tsx
        blog\
          page.tsx
          [slug]\page.tsx
        about\page.tsx
      admin\
        login\page.tsx
        layout.tsx
        page.tsx
        products\
        blog\
      api\
        admin\uploads\route.ts
      healthz\route.ts
      robots.ts
      sitemap.ts
    actions\
      admin-products.ts
      admin-blog.ts
      auth.ts
    components\
      site\
      admin\
      ui\
    generated\prisma\
    lib\
      auth.ts
      dal.ts
      prisma.ts
      storage.ts
      validation.ts
      markdown.ts
  prisma\
    schema.prisma
    migrations\
    seed-admin.ts
  public\
  docs\
  .env.example
  prisma.config.ts
  package.json
  package-lock.json
```

## 7. 最小数据模型

### 7.1 AdminUser

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | String/UUID | 主键 |
| `email` | String unique | 登录邮箱，保存统一小写值 |
| `name` | String? | 管理员名称 |
| `passwordHash` | String | 只保存强密码哈希 |
| `role` | Enum | 首版仅 `ADMIN` |
| `isActive` | Boolean | 是否允许登录 |
| `sessionVersion` | Int | 修改密码或强制退出时递增 |
| `lastLoginAt` | DateTime? | 最近登录时间 |
| `createdAt` | DateTime | 创建时间 |
| `updatedAt` | DateTime | 更新时间 |

不提供公开注册接口。管理员通过一次性 seed 命令创建，密码从交互输入或临时环境变量读取，不能把明文密码写入 seed 文件或 Git。

### 7.2 Product

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | String/UUID | 主键 |
| `name` | String | 产品名称 |
| `slug` | String unique | 公开 URL |
| `sku` | String? unique | 可选产品编号 |
| `category` | String? | 首版可选文本分类，不另建分类后台 |
| `shortDescription` | Text? | 列表摘要 |
| `description` | Text? | Markdown 详情 |
| `coverImage` | String? | 主图的相对 URL |
| `status` | Enum | `DRAFT/PUBLISHED/ARCHIVED` |
| `isFeatured` | Boolean | 首页精选 |
| `sortOrder` | Int | 手工排序 |
| `seoTitle` | String? | SEO 标题 |
| `seoDescription` | String? | SEO 描述 |
| `publishedAt` | DateTime? | 首次发布时间 |
| `createdAt` | DateTime | 创建时间 |
| `updatedAt` | DateTime | 更新时间及并发保护依据 |

### 7.3 ProductImage

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | String/UUID | 主键 |
| `productId` | String | 所属产品，删除产品时级联处理数据库引用 |
| `url` | String | 相对 URL，例如 `/uploads/products/uuid.webp` |
| `alt` | String? | 替代文本 |
| `sortOrder` | Int | 图片顺序 |
| `createdAt` | DateTime | 创建时间 |

### 7.4 ProductSpecification

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | String/UUID | 主键 |
| `productId` | String | 所属产品 |
| `label` | String | 参数名 |
| `value` | String | 参数值 |
| `sortOrder` | Int | 显示顺序 |

规格使用独立表，后台以“参数名 + 参数值”行编辑。它比把全部参数塞进富文本更容易维护，也方便以后增加筛选或导出。

### 7.5 BlogPost

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | String/UUID | 主键 |
| `title` | String | 标题 |
| `slug` | String unique | 公开 URL |
| `excerpt` | Text? | 摘要 |
| `coverImage` | String? | 封面相对 URL |
| `content` | Text | Markdown 正文 |
| `status` | Enum | `DRAFT/PUBLISHED/ARCHIVED` |
| `publishedAt` | DateTime? | 首次发布时间 |
| `authorId` | String? | 管理员 |
| `seoTitle` | String? | SEO 标题 |
| `seoDescription` | String? | SEO 描述 |
| `createdAt` | DateTime | 创建时间 |
| `updatedAt` | DateTime | 更新时间及并发保护依据 |

建议索引：

- Product：`status + sortOrder + createdAt`；
- ProductImage：`productId + sortOrder`；
- ProductSpecification：`productId + sortOrder`；
- BlogPost：`status + publishedAt`；
- Product、BlogPost 的 slug 唯一索引；
- AdminUser 的 email 唯一索引。

## 8. 内容、状态与删除规则

### 8.1 发布状态

- `DRAFT`：后台可见，前台列表和详情不可见；
- `PUBLISHED`：前台可见；
- `ARCHIVED`：保留数据但前台不可见。

第一版不提供一键硬删除。归档用于日常移除；永久删除必须在以后另做二次确认、备份和文件回收流程。

### 8.2 发布校验

产品发布至少要求：

- 名称；
- 合法且唯一的 slug；
- 摘要；
- 主图；
- 至少一项可展示正文或规格。

Blog 发布至少要求：

- 标题；
- 合法且唯一的 slug；
- 正文；
- SEO 描述可由 excerpt 回退生成。

### 8.3 Slug

slug 只允许小写英文字母、数字和连字符：

```text
^[a-z0-9]+(?:-[a-z0-9]+)*$
```

草稿可以修改 slug；第一次发布后默认锁定。以后若确需修改，再增加 redirect 表和 301 逻辑。首版不要在没有重定向记录的情况下随意改已发布 slug。

### 8.4 Markdown

首版采用 Markdown 文本框 + 预览，不复制原项目的 EditorJS：

- 渲染时不启用原始 HTML；
- 不安装或启用 `rehype-raw`；
- 禁止 script、iframe、事件属性和危险 URL；
- 外链按需要增加 `rel="noopener noreferrer"`；
- 后台预览与前台使用同一个渲染组件；
- 输入和输出都做长度限制。

### 8.5 并发编辑

编辑表单提交原 `updatedAt`。保存时将 `id + updatedAt` 作为更新条件；若记录已被另一个操作修改，应提示用户重新加载，不能静默覆盖更新后的内容。

产品主记录、图片顺序和规格保存应放在一个 Prisma 事务中。

## 9. 管理员认证与授权

首版只有一个或少量管理员，不提供前台用户注册、找回密码和邮件验证。

可以复用现项目“邮箱 + 密码哈希 + ADMIN 角色”的模式。为避免依赖不稳定的 OAuth/邮件流程，首版可按 Next.js 官方建议使用 `jose` 管理签名会话 cookie：

- 密码使用 bcrypt/Argon2 等强哈希，只保存 hash；
- 会话只包含 `userId`、`role`、`sessionVersion`、签发和过期时间；
- cookie 使用 `Secure`、`HttpOnly`、`SameSite=Lax`、`Path=/`；
- 会话有效期建议 8 至 12 小时；
- 每个敏感 Server Action 在数据访问层查询当前用户并确认 `isActive`、`role` 和 `sessionVersion`；
- 修改密码或强制退出时递增 `sessionVersion`；
- 登录失败统一返回“邮箱或密码错误”，不暴露账号是否存在；
- 服务端和 Cloudflare 同时限制登录尝试频率；
- `proxy.ts` 只能做快速跳转，不能作为唯一授权层。

若编码阶段决定继续使用现项目的 Auth.js/NextAuth Credentials 实现，也必须遵守相同边界，并锁定已验证版本；不能顺带开启 GitHub、Google、邮件或公开注册。

## 10. 图片上传方案

首版图片保存在服务器共享目录：

```text
/www/wwwroot/glarivo/shared/uploads/products/
/www/wwwroot/glarivo/shared/uploads/blog/
/www/wwwroot/glarivo/shared/uploads/.trash/
```

数据库保存相对路径，例如：

```text
/uploads/products/550e8400-e29b-41d4-a716-446655440000.webp
```

不要保存源站 IP、绝对磁盘路径或带域名的完整 URL。以后迁移到 R2/COS 时，只需替换存储适配器和公开 URL 生成逻辑。

上传规则：

- 上传路由必须验证 ADMIN；
- 只接受 JPEG、PNG、WebP；首版禁止 SVG 和任意附件；
- 同时校验扩展名、请求 MIME 和真实文件内容；
- 单文件上限建议 5 MB，Nginx 可设 10 MB 作为协议余量；
- Sharp 解码后重新编码为 WebP，删除 EXIF；
- 限制最长边，例如 2400 px；
- 生成 UUID 文件名，不使用用户文件名作为服务器路径；
- 防止 `../`、绝对路径、软链接逃逸和重复覆盖；
- 限制一次上传数量和单产品图片总数；
- 物理文件先写临时文件，成功后原子改名；
- 数据库保存失败时清理刚上传的新文件；
- 归档或移除图片引用时先移到 `.trash`，保留 30 天再清理；
- 数据库和 uploads 必须在同一备份批次中保存。

## 11. 本地开发环境

### 11.1 前置软件

Windows 本地准备：

- Git；
- Node.js 24 LTS；
- npm；
- PostgreSQL 16（本机安装或本地 Docker 容器，二选一）；
- VS Code 或现有编辑器。

生产不用 Docker。若本地已稳定使用 Docker Desktop，可以只用它运行本地 PostgreSQL；否则安装 Windows 版 PostgreSQL，确保开发和生产使用相同主版本。

### 11.2 初始化命令

当前 `D:\glarivo` 已包含本操作文档，`create-next-app .` 可能拒绝非空目录，也不应为了脚手架而删除 `docs`。因此以下命令先在一个明确的新临时目录生成脚手架，本轮文档阶段不执行：

```powershell
$glarivoScaffoldPath = 'D:\glarivo-scaffold'
if (Test-Path -LiteralPath $glarivoScaffoldPath) {
    throw "Scaffold path already exists: $glarivoScaffoldPath"
}
New-Item -ItemType Directory -Path $glarivoScaffoldPath | Out-Null
Set-Location $glarivoScaffoldPath
npx create-next-app@16.3.3 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
npm install @prisma/client@7.10.0 @prisma/adapter-pg@7.10.0 pg dotenv zod bcryptjs jose react-markdown remark-gfm sharp
npm install --save-dev prisma@7.10.0 tsx @types/pg
npx prisma init --datasource-provider postgresql --output ../src/generated/prisma
```

生成后先检查脚手架，再把生成内容有选择地合并到 `D:\glarivo`，保留现有 `docs`，并把 package 名改为 `glarivo`。不要用整目录覆盖或先删除 `D:\glarivo` 的方式合并；具体合并应作为正式编码阶段的第一项受控操作。

完成后提交 `package-lock.json`。后续本地使用 `npm ci`，生产构建使用 `npm ci --include=dev`，确保 Prisma CLI、TypeScript 和构建工具没有因 `NODE_ENV=production` 被省略；不使用会在服务器改动 lockfile 的安装方式。

### 11.3 本地环境变量

`.env.example` 只保留变量名和无敏感示例：

```dotenv
DATABASE_URL="postgresql://glarivo_dev:CHANGE_ME@127.0.0.1:5432/glarivo_dev"
SESSION_SECRET="CHANGE_ME"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
UPLOAD_DIR="D:/glarivo/.data/uploads"
UPLOAD_PUBLIC_BASE="/uploads"
```

要求：

- `.env`、`.env.local`、`.env.production` 永不提交 Git；
- `.data/`、uploads、数据库 dump 永不提交 Git；
- 开发库与生产库使用不同数据库、不同用户、不同密码；
- 生产连接串不复制到本地日常环境；
- 日志不得输出完整环境变量。

生成 session secret 时应在本机安全终端执行，并立即保存到密码管理器：

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

不要把生成结果发到聊天、工单或 Git。

### 11.4 Prisma 7 注意事项

Prisma 7 使用 `prisma.config.ts` 管理 CLI 数据源，并通过 `@prisma/adapter-pg` 连接 PostgreSQL。编码时应遵循当前 Prisma 7 官方模板，不要直接复制参考项目 Prisma 6 的初始化文件。

开发环境：

```powershell
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed
```

生产环境只运行：

```bash
npx prisma generate
npx prisma migrate deploy
```

生产禁止：

- `prisma migrate dev`；
- `prisma migrate reset`；
- 用 `prisma db push` 代替正式迁移；
- 为了“修复”错误而删除生产 migration 记录。

## 12. 实施顺序

### 阶段 A：项目骨架

1. 初始化独立 Git 仓库；
2. 建立 Next.js、TypeScript、Tailwind；
3. 建立 `.env.example`、`.gitignore`、Node 版本说明；
4. 建立四个菜单和公开布局；
5. 将站点名、metadataBase、canonical 统一为 Glarivo / `https://glarivo.com`；
6. 确认项目中不存在 LAIFAPPE、旧域名或旧密钥。

### 阶段 B：公开页面

1. Home 静态结构；
2. About 静态结构；
3. Products 列表和详情；
4. Blog 列表和详情；
5. 移动端导航；
6. 空状态、404、错误页；
7. title、description、canonical、OG；
8. robots 和 sitemap。

### 阶段 C：数据库与后台

1. 最小 Prisma schema；
2. 初始 migration；
3. 一次性管理员 seed；
4. 登录、退出、会话校验；
5. `/admin` 保护；
6. Product 列表、表单、发布/撤回/归档；
7. Blog 列表、表单、Markdown 预览、发布/撤回/归档；
8. 图片上传；
9. 产品图片和规格排序；
10. 服务端 Zod 校验和并发保护。

### 阶段 D：本地验证

至少通过：

```powershell
npm run lint
npx tsc --noEmit
npm run build
npx prisma migrate status
```

同时验证：

- 未登录不能访问后台或调用写操作；
- 草稿、归档内容前台 404；
- 发布后立即可见；
- 重复/非法 slug 被拒绝；
- 非法图片、超大图片被拒绝；
- Markdown 不执行脚本或原始 HTML；
- 移动端菜单可用；
- sitemap 只含已发布内容；
- 随机不存在 URL 返回真实 404；
- 浏览器控制台无错误。

### 阶段 E：服务器与正式部署

按本文第 13 至 21 节执行。

## 13. 上线前必须确认的信息

真正开始服务器配置前，先记录：

- 腾讯云产品类型：CVM 还是轻量应用服务器 Lighthouse；
- 服务器地域：是否在中国大陆；
- Linux 发行版和版本；
- 宝塔版本和实际面板端口；
- CPU、内存、系统盘、数据盘和公网 IPv4；
- 是否有固定管理员公网 IP；
- 域名注册商、实名认证、当前 NS 和 DNSSEC 状态；
- 是否已完成 ICP 备案/腾讯云接入备案；
- 首版语言、Logo、首页文案、About 文案、首批产品和文章数量。

建议服务器最低资源：

- 2 vCPU；
- 4 GB RAM；
- 40 GB 以上 SSD；
- 有自动快照能力。

2 GB 内存可以运行低流量站点，但服务器上执行 Next.js production build 时更容易内存不足。若现有实例只有 2 GB，应先检查资源并选择 Linux 构建机/CI 构建，或在确认磁盘空间后通过宝塔配置适当 swap；不要在资源未知时盲目加 swap。

## 14. 中国大陆服务器合规分支

### 14.1 如果服务器在中国大陆

- 正式对外提供网站服务前，必须先完成腾讯云 ICP 备案或接入备案；
- Cloudflare 代理、灰云或更换 NS 都不能代替备案；
- 网站开通后按当前要求办理公安联网备案，并在页脚显示相应备案信息；
- 备案类型和经营性许可应以腾讯云备案系统、主管部门和实际业务为准；
- 首版没有在线交易，但不能仅凭“展示站”三个字自行断定所有许可类型。

### 14.2 如果服务器在香港或境外

- 不走中国大陆服务器的 ICP 备案流程；
- 不能用境外实例申请中国大陆接入备案；
- 仍要完成域名实名认证、TLS、隐私与目标市场的合规检查。

### 14.3 Cloudflare 在中国大陆的现实限制

普通 Cloudflare Free/Pro 全球网络不等于 Cloudflare China Network。Cloudflare China Network 是 Enterprise 的独立订阅并要求有效 ICP。若目标访客主要在中国大陆，不应假设开橙云一定更快。

建议在完成备案后分别测试：

1. Cloudflare 灰云，访客直连腾讯云；
2. Cloudflare 橙云，流量经过全球代理。

若大陆访问在橙云下明显变慢，可先保留 Cloudflare 权威 DNS、将记录设为 DNS only，后续再评估腾讯云 CDN/EdgeOne 或 Cloudflare China Network。若主要服务海外采购商，Cloudflare 全球代理通常更符合本项目目标。

## 15. 腾讯云与宝塔安全基线

先确定实例类型：

- CVM 使用“安全组”；
- Lighthouse 使用“实例防火墙”；
- 宝塔“系统防火墙”是服务器内第二层；
- 腾讯云侧与服务器侧两层规则都要正确，任一层未放行都会不通。

### 15.1 端口矩阵

| 端口 | 用途 | 腾讯云来源 | 宝塔/系统防火墙 | 说明 |
|---|---|---|---|---|
| 22 或实际 SSH 端口 | SSH | 仅管理员 IP/CIDR | 同样限制 | 优先密钥登录 |
| 宝塔实际端口 | 面板 | 仅管理员 IP/CIDR | 同样限制 | 以镜像实际值为准 |
| 80 | HTTP | 初期公网 | 放行 | HTTPS 跳转和证书验证 |
| 443 | HTTPS | 初期公网 | 放行 | 正式业务入口 |
| 3000 | Next.js | 不放行 | 不放行 | 只监听 `127.0.0.1` |
| 5432 | PostgreSQL | 不放行 | 不放行 | 只监听 localhost |
| 21/FTP | FTP | 不放行 | 不放行 | 使用 SFTP/宝塔文件管理 |
| 其他数据库管理端口 | 管理工具 | 不放行 | 不放行 | 不因示例教程而全开 |

不要使用“全部端口、全部来源”规则。修改 SSH 或宝塔端口时，应先放行新端口并测试成功，再关闭旧端口，防止把自己锁在服务器外。

### 15.2 SSH

- 使用腾讯云 SSH 密钥；
- 创建非 root 的部署用户，例如 `glarivo`；
- 确认密钥登录成功后，再关闭 root 密码远程登录；
- 只允许管理员公网 IP 访问 SSH；
- 开启失败登录防护；
- 不把私钥上传到服务器、Git 或网盘公开目录。

### 15.3 宝塔面板

- 修改默认用户名、强密码和安全入口；
- 面板开启 HTTPS；
- 开启 TOTP 动态口令；
- 面板端口仅允许管理员 IP；
- 关闭不需要的 API、FTP、phpMyAdmin 和插件；
- 定期查看登录记录与安全检测；
- 不在站点备注或脚本名称中写密码。

### 15.4 系统和应用用户

- 更新系统安全补丁；
- Nginx、PostgreSQL 使用各自低权限用户；
- Next.js 以 `glarivo` 用户运行，不以 root 运行；
- `.env.production` 仅应用用户可读；
- uploads 允许应用写入、Nginx 读取，不对所有用户开放写权限。

## 16. 服务器软件与目录

通过宝塔软件商店安装：

- Nginx；
- PostgreSQL；
- Node.js 24 LTS / Node 项目管理器；
- PM2（若 Node 项目管理器未自动提供）；
- 日志轮转和计划任务能力。

不要安装 PHP、MySQL、Redis、Docker、邮件服务器等本项目不需要的组件。

服务器目录：

```text
/www/wwwroot/glarivo/
  releases/
    20260829-120000/
  current -> /www/wwwroot/glarivo/releases/20260829-120000
  shared/
    .env.production
    uploads/
      products/
      blog/
      .trash/
  backups/
    database/
    uploads/
    config/
```

创建目录后确认：

- `releases` 和 `current` 由部署用户管理；
- `shared/.env.production` 权限为 `600`；
- uploads 由应用用户可写，Nginx 可读；
- backups 不在 Nginx 网站根目录之下，不可通过 URL 下载；
- release 删除或回滚不会删除 shared。

## 17. PostgreSQL 配置

### 17.1 数据库与用户

不要让应用使用 `postgres` 超级用户。可通过宝塔 PostgreSQL 管理界面创建，也可用交互命令：

```bash
sudo -u postgres createuser --pwprompt --no-superuser --no-createdb --no-createrole glarivo_app
sudo -u postgres createdb --owner=glarivo_app --encoding=UTF8 glarivo
```

`--pwprompt` 会交互读取密码，避免把数据库密码写进 shell history。

### 17.2 网络

- `listen_addresses` 保持 `localhost` 或 `127.0.0.1`；
- `pg_hba.conf` 只允许本机的 `glarivo_app` 访问 `glarivo`；
- 腾讯云和系统防火墙均不开放 5432；
- 远程维护数据库通过 SSH 隧道，不能临时把 5432 对全网开放。

### 17.3 生产连接串

```dotenv
DATABASE_URL="postgresql://glarivo_app:URL_ENCODED_PASSWORD@127.0.0.1:5432/glarivo?schema=public"
```

特殊字符必须 URL 编码。实际密码只保存在密码管理器和服务器私有环境文件中。

## 18. 生产环境变量

`/www/wwwroot/glarivo/shared/.env.production` 建议只包含：

```dotenv
NODE_ENV="production"
PORT="3000"
DATABASE_URL="postgresql://glarivo_app:CHANGE_ME@127.0.0.1:5432/glarivo?schema=public"
SESSION_SECRET="CHANGE_ME"
NEXT_PUBLIC_SITE_URL="https://glarivo.com"
UPLOAD_DIR="/www/wwwroot/glarivo/shared/uploads"
UPLOAD_PUBLIC_BASE="/uploads"
```

首版不应出现：

- OpenAI/Gemini/任何 AI key；
- SMTP、Gmail、邮件服务 key；
- R2/COS 在线图片 key；
- 支付、聊天、Pusher、IndexNow、1688 等变量。

注意 `NEXT_PUBLIC_*` 会进入浏览器构建结果，只能放公开值。数据库密码、session secret 永远不能使用 `NEXT_PUBLIC_` 前缀。

## 19. 首次部署

### 19.1 发布包

推荐把 `D:\glarivo` 放入用户选择的私有 Git 仓库，并给服务器配置只读 deploy key。若暂时不用远程 Git，可通过 SFTP/宝塔上传压缩包，但仍应保留本地 Git 提交作为发布版本依据。

### 19.2 每次发布顺序

1. 记录当前 `current` 指向；
2. 立即备份数据库与 uploads；
3. 建立新的时间戳 release；
4. 拉取指定 Git commit，不能拉取不明确的工作区状态；
5. 将 shared 环境文件链接为 release 的 `.env.production`；
6. 执行 `npm ci --include=dev`；
7. 执行 `npx prisma generate`；
8. 执行 `npx prisma migrate deploy`；
9. 执行 `npm run build`；
10. 用未占用的临时端口（例如 `127.0.0.1:3001`）启动新 release 并检查 `/healthz`，成功后停止临时进程；
11. 将 `current` 切到新 release；
12. 重启单个 PM2 进程；
13. 通过 Nginx 和正式域名做冒烟测试；
14. 保留至少两个上一版本 release；
15. 验证完成后再清理更旧 release。

使用 `npm ci --include=dev` 是为了严格按 `package-lock.json` 安装，并保留 production build 所需工具。若 lockfile 与 package.json 不一致，部署应失败，而不是在服务器自动改依赖。构建完成后是否执行 `npm prune --omit=dev`，应先在测试 release 验证 Prisma、Sharp 和运行时依赖完整，再决定是否启用。

### 19.3 PM2

首版运行一个 fork 进程，不用 `-i max`：

```text
应用名：glarivo
工作目录：/www/wwwroot/glarivo/current
启动命令：node_modules/next/dist/bin/next
启动参数：start -H 127.0.0.1 -p 3000
实例数：1
watch：关闭
```

生产不能使用 `next dev`。

执行并验证开机自启：

```bash
pm2 startup
# 执行 PM2 返回的、与本机用户和路径匹配的命令
pm2 save
pm2 status
```

最后必须真实重启一次服务器，确认 PostgreSQL、Nginx 和 PM2 自动恢复。不能只看到“已设置开机自启”就视为验证成功。

## 20. 宝塔 Nginx 配置

宝塔的“Node 项目外网映射”和“网站反向代理”二选一，同一域名不要重复代理。

站点包含 `glarivo.com` 和 `www.glarivo.com`。反代核心配置至少应等价于：

```nginx
server {
    listen 80;
    server_name glarivo.com www.glarivo.com;

    location ^~ /.well-known/acme-challenge/ {
        # 替换为宝塔为该站点实际配置的证书验证目录
        root /www/wwwroot/glarivo-acme;
    }

    location / {
        return 301 https://glarivo.com$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name www.glarivo.com;

    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/private.key;

    return 301 https://glarivo.com$request_uri;
}

server {
    listen 443 ssl http2;
    server_name glarivo.com;

    ssl_certificate     /path/to/fullchain.pem;
    ssl_certificate_key /path/to/private.key;

    client_max_body_size 10m;

    location ^~ /uploads/ {
        alias /www/wwwroot/glarivo/shared/uploads/;
        access_log off;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
        add_header X-Content-Type-Options "nosniff" always;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 60s;
    }
}
```

注意：

- ACME 验证目录和证书路径由宝塔生成，不能照抄占位值；优先让宝塔维护证书配置，再把反代段合并进去；
- `proxy_pass` 只指向 `127.0.0.1:3000`，不能写成公开域名，否则可能形成代理循环；
- 初期不要在 Nginx 开启全页缓存；
- `proxy_buffering off` 有利于 Next.js App Router 的流式响应；
- 10 MB 是传输上限，应用仍按 5 MB 做更严格校验；
- 对 uploads 使用 UUID 不可变文件名，替换图片时生成新 URL；
- 配置完成后先运行 `nginx -t`，成功后才 reload。

接入 Cloudflare 后，Nginx 默认看到 Cloudflare 节点 IP。若要恢复真实访客 IP，必须从 Cloudflare 官方 IP 列表生成可信代理配置，并设置 `real_ip_header CF-Connecting-IP`。不能无条件信任来自任意源的该请求头，否则访客可以伪造 IP。

## 21. Cloudflare 配置步骤

### 21.1 域名接入前

1. 确认 `glarivo.com` 已实名认证；
2. 记录现有 NS、A、AAAA、CNAME、TXT、CAA 和 DNSSEC；
3. 若旧 DNSSEC 已启用，换 NS 前先在注册商关闭并等待旧 DS 失效；
4. Cloudflare 账号开启 2FA，并保存恢复码；
5. 添加 `glarivo.com` Zone，先选 Free 计划即可。

### 21.2 DNS

检查 Cloudflare 自动扫描结果，不要盲目全部保留或全部删除。首版不配置邮件时，最低记录为：

| Type | Name | Content | 初始状态 |
|---|---|---|---|
| A | `@` | 腾讯云公网 IPv4 | DNS only（灰云） |
| CNAME | `www` | `glarivo.com` | DNS only（灰云） |

没有稳定 IPv6 时不要添加 AAAA。不能把 A 记录指向 Cloudflare 的 IP，必须指向腾讯云源站 IP。

若域名在腾讯云注册，在腾讯云域名管理中修改 DNS 服务器为 Cloudflare 分配的两条 Nameserver。NS 生效并显示 Cloudflare `Active` 后，再继续下一步。

### 21.3 源站证书

推荐顺序：

1. 保持灰云；
2. 在宝塔为 `glarivo.com` 和 `www.glarivo.com` 申请公开可信的 Let’s Encrypt/LiteSSL 证书；
3. 验证 443 直接访问和自动续签配置；
4. Cloudflare SSL/TLS 设置为 `Full (strict)`；
5. 再将 `@`、`www` 切为 Proxied（橙云）。

公开 CA 证书的优点是暂停 Cloudflare 或临时灰云时，浏览器仍信任源站。

Cloudflare Origin CA 可作为备选，但仅在始终橙云时使用：它兼容 Full (strict)，却不受普通浏览器直接信任；暂停代理会出现证书错误，而且 Cloudflare 不主动发送 Origin CA 到期通知。

禁止使用 `Flexible`。它不会加密 Cloudflare 到源站的连接，并容易与源站 HTTPS 跳转形成循环。

### 21.4 HTTPS 和规范域名

确认 Full (strict) 正常后：

- 开启 Cloudflare `Always Use HTTPS`；
- 建立 Single Redirect：`www.glarivo.com/*` 301 到 `https://glarivo.com/${path}`，保留 query string；
- 验证 HTTP 到 HTTPS 只有一次跳转；
- 验证 www 到 apex 只有一次跳转；
- HSTS 延后至少一周，确认续签、重启、代理、所有子域均正常后再逐步开启；
- 初期不要直接设置超长 `includeSubDomains; preload`。

### 21.5 缓存

第一版保持 Cloudflare 默认缓存，不创建全站 `Cache Everything`。

明确要求：

- `/_next/static/*` 可长期缓存；
- `/uploads/*` 可缓存 30 天；
- `/admin*` 绕过缓存；
- `/api*` 绕过缓存；
- `/admin/login`、认证、预览、带 session cookie 请求不缓存；
- HTML 尊重 Next.js 的 `Cache-Control`；
- 不用 Cloudflare Edge TTL 覆盖 `private/no-store`。

可以建立一条防御性 Bypass Cache Rule，匹配：

```text
URI path starts with /admin
OR URI path starts with /api
OR URI path equals /healthz
```

后台保存后，第一版前台直接动态读取数据库，不依赖 ISR 和全页 Cloudflare 缓存，因此应立即看到新内容。

### 21.6 登录保护

若当前 Cloudflare 计划支持合适的 Rate Limiting Rule：

- 只匹配实际登录 POST 路径；
- 初始值可从单 IP 每分钟 10 次、超限短时阻止开始；
- 上线后根据正常流量调整；
- Cloudflare 限速是附加保护，应用仍必须做服务端失败次数限制。

不要对全部 `/admin` GET 页面设置过低频率，否则管理员正常编辑会被误伤。

### 21.7 DNSSEC

Zone 激活且 DNS/HTTPS 稳定后：

1. 在 Cloudflare 开启 DNSSEC；
2. 复制 Cloudflare 生成的 DS 信息；
3. 在腾讯云域名注册商添加/更新 DS；
4. 等 Cloudflare 显示 Active；
5. 用多个公共解析器验证。

更换 NS 前若未删除旧 DS，可能导致全域名 `SERVFAIL`，这是必须避免的故障。

### 21.8 源站防绕过

橙云稳定后可进行第二阶段加固：

- 腾讯云 80/443 只允许 Cloudflare 官方 IP 段；
- 宝塔系统防火墙同步限制；
- 其他来源拒绝；
- Cloudflare IP 段需要定期同步，不能一次手抄后永久不管；
- 需要更高安全时再评估 Authenticated Origin Pulls。

这项加固应在完整测试和保留应急管理通道后实施，避免因遗漏 Cloudflare 新 IP 段导致全站不可访问。

## 22. SEO 基线

- `metadataBase = new URL('https://glarivo.com')`；
- 每页自 canonical，不产生 www/apex 双版本；
- Products、Blog 详情只为 `PUBLISHED` 输出 200 和 sitemap 项；
- 草稿、归档返回真实 404；
- `robots.txt` 允许公开页，禁止 `/admin/` 和不需要抓取的 `/api/`；
- `sitemap.xml` 包含 Home、Products、Blog、About 与已发布详情；
- Product 图片有准确 alt；
- Blog 输出 Article 结构化数据；
- Product 首版可输出 Product 或更保守的网页结构化数据，但不能虚构价格、库存、评分；
- 页面标题和描述均由后台字段或可靠回退逻辑生成；
- 不在首版配置 GSC、GA4、IndexNow 或额外统计，等用户后续确认。

## 23. 安全响应头与应用安全

至少设置并测试：

- `X-Content-Type-Options: nosniff`；
- `Referrer-Policy: strict-origin-when-cross-origin`；
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`；
- 合理的 Content Security Policy；
- HTTPS 稳定后再逐步启用 HSTS；
- 管理和动态页面 `Cache-Control: private, no-store`；
- 上传响应不返回服务器绝对路径；
- 错误页不暴露 stack、数据库、版本或环境变量。

每个 Server Action 都验证 auth、role 和输入；不能因按钮在 UI 中隐藏就省略服务端授权。日志禁止记录：密码、session cookie、Authorization、数据库连接串、完整表单中的敏感值。

## 24. 备份与恢复

同一块服务器磁盘中的 `/www/backup` 不是完整备份。

### 24.1 最小备份

每日：

- `pg_dump -Fc` 备份 `glarivo`；
- `pg_dumpall --globals-only` 备份数据库角色；
- 备份 shared/uploads；
- 备份 `.env.production`、Nginx 站点配置和 PM2 配置；
- 本机保留 7 份日备份和 4 份周备份。

每次部署、迁移前额外立即备份。

至少一份备份必须离开同一系统盘。推荐后续使用腾讯云 COS 或等效离线目标，并配合腾讯云定期快照。包含 `.env.production` 的配置备份必须单独加密、严格限制访问，不能与公开媒体包混放。快照是第二层保护，不能代替 PostgreSQL 逻辑备份。

### 24.2 示例数据库备份

```bash
sudo -u postgres pg_dump -Fc -d glarivo -f /var/backups/glarivo/glarivo_YYYYMMDD_HHMM.dump
sudo -u postgres pg_dumpall --globals-only -f /var/backups/glarivo/globals_YYYYMMDD_HHMM.sql
```

路径和权限要先按服务器实际情况建立。不要把 dump 存在 Web 可访问目录。

### 24.3 恢复演练

每月至少一次：

1. 建立隔离测试数据库；
2. 使用 `pg_restore` 恢复 dump；
3. 恢复对应 uploads 备份；
4. 用测试环境连接；
5. 检查产品、Blog、图片和管理员登录；
6. 删除隔离测试数据。

只有实际恢复成功的备份才算可用备份。

## 25. 更新与回滚

### 25.1 常规更新

1. 本地创建并测试 migration；
2. 提交代码、migration 和 lockfile；
3. 服务器备份数据库与 uploads；
4. 建新 release；
5. `npm ci --include=dev`、generate、migrate deploy、build；
6. 切换 current；
7. PM2 reload/restart；
8. 检查 healthz、公开页、后台和日志。

### 25.2 回滚

- 代码问题：将 `current` 指回上一 release，重启 PM2；
- 图片问题：恢复对应 uploads 备份或 `.trash` 文件；
- 数据库 schema/data 问题：按部署前备份恢复；
- 不能假设“代码回滚”会自动回滚数据库；
- 数据库 migration 优先使用向前兼容的 expand/contract 方式，减少回滚风险。

## 26. 上线验收清单

### 26.1 前台

- [ ] 桌面和移动端 Header 只有 Home、Products、Blog、About；
- [ ] `/`、`/products`、`/blog`、`/about` 返回 200；
- [ ] 产品列表只显示已发布产品；
- [ ] 草稿、归档产品直接访问返回 404；
- [ ] Blog 只显示已发布文章；
- [ ] 草稿、归档文章直接访问返回 404；
- [ ] 分页无重复或遗漏；
- [ ] 图片有 alt，移动端不溢出；
- [ ] canonical 全部指向 `https://glarivo.com`；
- [ ] sitemap 只含公开内容；
- [ ] 随机不存在路径返回真实 404；
- [ ] 页面刷新和直接打开详情均正常；
- [ ] 浏览器控制台无错误。

### 26.2 后台

- [ ] 未登录不能进入 `/admin`；
- [ ] 未登录请求不能调用任何写操作或上传接口；
- [ ] 正确管理员可登录和退出；
- [ ] 错误密码不暴露账号状态；
- [ ] 可创建产品草稿、上传主图、添加图片和规格；
- [ ] 产品发布后立即出现在前台；
- [ ] 修改后前台立即更新；
- [ ] 撤回/归档后前台不可访问；
- [ ] 可创建、预览、发布、编辑、归档 Blog；
- [ ] 重复或非法 slug 被拒绝；
- [ ] 脚本、危险链接和非法 Markdown 不执行；
- [ ] 并发编辑不会静默覆盖新内容；
- [ ] 后台没有未经确认的硬删除。

### 26.3 服务器与 Cloudflare

- [ ] Node.js 为 24 LTS；
- [ ] production build 无错误；
- [ ] Prisma migration 状态正常；
- [ ] PM2 只有一个应用实例且状态 online；
- [ ] `127.0.0.1:3000/healthz` 正常；
- [ ] `nginx -t` 成功；
- [ ] 3000、5432 从公网不可访问；
- [ ] SSH、宝塔端口只允许管理员 IP；
- [ ] Cloudflare SSL/TLS 为 Full (strict)；
- [ ] HTTP 到 HTTPS 单次跳转；
- [ ] www 到 apex 单次 301 并保留路径；
- [ ] `/admin`、`/api`、登录响应没有被 Cloudflare 缓存；
- [ ] `/_next/static` 和 `/uploads` 缓存正常；
- [ ] Nginx 日志可记录真实访客 IP；
- [ ] 重启服务器后 Nginx、PostgreSQL、PM2 自动恢复；
- [ ] 手动备份成功并在隔离库恢复成功；
- [ ] 中国大陆服务器已完成所需备案并显示备案信息；
- [ ] 生产环境不存在 AI、邮件、支付等未使用密钥。

## 27. 建议时间安排

不含视觉品牌设计、内容编写、ICP 审核等待时间，单人开发的合理估算为：

| 工作 | 估算 |
|---|---|
| 项目骨架、公开布局、四菜单 | 0.5–1 天 |
| Home/About、Products/Blog 前台 | 1–2 天 |
| 数据库、认证、Products 后台 | 1.5–2 天 |
| Blog 后台、Markdown、图片上传 | 1.5–2 天 |
| SEO、安全、测试、修正 | 1–2 天 |
| 腾讯云、宝塔、Cloudflare、上线验收 | 0.5–1 天 |

合计约 6–10 个工作日。若需要重新设计 Logo、大量录入产品/文章、办理备案或等待域名/证书生效，应单独计算。

## 28. 开始实施前需要用户确认的清单

在下一阶段真正生成代码前，只需确认：

1. 服务器是 CVM 还是 Lighthouse；
2. 服务器地域、系统、CPU、内存、磁盘；
3. 是否已完成 ICP 备案或是否需要先办理；
4. 域名是否在腾讯云注册，当前是否启用 DNSSEC；
5. 首版默认语言；
6. 是否接受 `glarivo.com` 为主域、`www` 301 到主域；
7. 首页和 About 是否先使用占位英文文案；
8. 首批产品是否只展示内容，不展示价格、库存和询盘按钮；
9. 管理员邮箱（密码不能发在普通聊天中）；
10. 是否接受本地图片存储方案和每日备份方案。

## 29. 官方参考资料

### Next.js / Node.js

- [Next.js Installation](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js Deploying](https://nextjs.org/docs/app/getting-started/deploying)
- [Next.js Self-Hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Next.js CDN Caching](https://nextjs.org/docs/app/guides/cdn-caching)
- [Next.js Authentication](https://nextjs.org/docs/app/guides/authentication)
- [Node.js release schedule](https://nodejs.org/en/about/previous-releases)

### 腾讯云 / 宝塔

- [腾讯云 ICP 备案云资源要求](https://cloud.tencent.com/document/product/243/18908)
- [腾讯云网站阻断与备案说明](https://cloud.tencent.com/document/product/243/20220)
- [腾讯云公安联网备案流程](https://cloud.tencent.com/document/product/243/19142)
- [腾讯云 CVM 安全组](https://cloud.tencent.com/document/product/213/112610)
- [腾讯云 Lighthouse 防火墙](https://cloud.tencent.com/document/product/1207/44577)
- [腾讯云 SSH 密钥](https://cloud.tencent.com/document/product/213/6092)
- [腾讯云修改域名 DNS 服务器](https://cloud.tencent.com/document/product/242/62106)
- [宝塔 Next.js 部署](https://docs.bt.cn/practical-tutorials/nextjs-deployment)
- [宝塔反向代理](https://docs.bt.cn/user-guide/site/php/site-config/reverse-proxy)
- [宝塔站点 SSL](https://docs.bt.cn/user-guide/site/php/site-config/ssl)
- [宝塔端口规则](https://docs.bt.cn/user-guide/security/firewall/port-rule)
- [宝塔服务器安全](https://docs.bt.cn/user-guide/security/server-safe)

### Cloudflare

- [Cloudflare Full DNS setup](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)
- [Cloudflare DNS records](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/)
- [Cloudflare Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/)
- [Cloudflare Origin CA](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/)
- [Cloudflare Always Use HTTPS](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/)
- [Cloudflare Cache Rules](https://developers.cloudflare.com/cache/how-to/cache-rules/settings/)
- [Cloudflare DNSSEC](https://developers.cloudflare.com/dns/dnssec/)
- [Cloudflare 恢复真实访客 IP](https://developers.cloudflare.com/support/troubleshooting/restoring-visitor-ips/restoring-original-visitor-ips/)
- [Cloudflare IP ranges and origin protection](https://developers.cloudflare.com/fundamentals/concepts/cloudflare-ip-addresses/)
- [Cloudflare China Network](https://developers.cloudflare.com/china-network/)

### Prisma / PostgreSQL / PM2

- [Prisma 7 + Next.js](https://www.prisma.io/docs/guides/v7/frameworks/nextjs)
- [Prisma migrate deploy](https://www.prisma.io/docs/cli/v7/migrate/deploy)
- [Prisma production migration practices](https://docs.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate)
- [PostgreSQL pg_hba.conf](https://www.postgresql.org/docs/current/auth-pg-hba-conf.html)
- [PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
- [PostgreSQL pg_restore](https://www.postgresql.org/docs/current/app-pgrestore.html)
- [PM2 Quick Start](https://pm2.keymetrics.io/docs/usage/quick-start/)

## 30. 本文档当前状态

本文是实施和上线操作方案，不代表代码、服务器、DNS 或生产环境已经完成。

截至本文生成时：

- `D:\glarivo` 尚未初始化应用代码；
- `D:\project\b2c-store` 只做了只读参考，没有修改；
- 没有登录腾讯云、宝塔或 Cloudflare；
- 没有修改 Nameserver、DNS、SSL、防火墙或备案状态；
- 没有创建数据库、管理员账号或生产密钥；
- 没有配置 AI、邮件、支付或其他第三方服务。
