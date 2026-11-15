# 移动端性能基线

使用生产构建比较同一机器、同一 Chrome/Lighthouse 版本、同一端口的代码修改前后。脚本只审计，不构建、不启动服务、不安装依赖、不清除服务器缓存。每页默认运行三次，依次执行，保存原始 Lighthouse JSON 和中位数。不要同时运行 build、其他性能测试或占用大量 CPU 的程序。

固定页面：`/`、`/products`、`/guides/cosmetic-glass-packaging`、`/products/category/shot-glass`、`/products/category/cosmetic-glass-packaging`、`/blog/restaurant-glassware-dishwasher-rack-fit-storage-checklist`。

## 准备 Lighthouse

优先使用已安装的 `lighthouse/cli/index.js`；脚本自动通过 Node 模块解析寻找它，也可传入绝对路径。复现 2026-11-15 的工具版本时使用 Lighthouse **13.6.0**。未安装时可先通过 npm 缓存获取，不修改项目依赖文件：

```powershell
npm exec --yes --package=lighthouse@13.6.0 -- lighthouse --version
$auditNpmCache = (npm config get cache).Trim()
$auditLighthouseCli = Get-ChildItem -LiteralPath (Join-Path $auditNpmCache '_npx') -Directory | ForEach-Object {
  $auditPackage = Join-Path $_.FullName 'node_modules/lighthouse/package.json'
  if ((Test-Path -LiteralPath $auditPackage) -and ((Get-Content -Raw -LiteralPath $auditPackage | ConvertFrom-Json).version -eq '13.6.0')) {
    Join-Path $_.FullName 'node_modules/lighthouse/cli/index.js'
  }
} | Select-Object -First 1
if (-not $auditLighthouseCli) { throw 'Lighthouse 13.6.0 was not found in the npm cache.' }
```

Chrome 默认由 `chrome-launcher` 自动发现；需要指定时设置 `$env:CHROME_PATH` 为本机 Chrome 可执行文件的绝对路径。不要把 Chrome 路径、npm 缓存路径或密钥写进仓库。

## 修改前后各测一次

先在修改前运行 `npm run build`，然后在单独终端启动生产服务：

```powershell
npm run start -- -H 127.0.0.1 -p 3008
```

在另一个终端运行：

```powershell
node scripts/audit-mobile-performance.mjs --base-url http://127.0.0.1:3008 --label before --runs 3 --output-dir output/mobile-performance/2026-11-15 --lighthouse-cli $auditLighthouseCli
```

完成修改后先停止旧服务，重新 `npm run build`，再用相同命令启动生产服务并审计：

```powershell
node scripts/audit-mobile-performance.mjs --base-url http://127.0.0.1:3008 --label after --runs 3 --output-dir output/mobile-performance/2026-11-15 --lighthouse-cli $auditLighthouseCli --compare output/mobile-performance/2026-11-15/before/summary.json
```

如果本地模块已能解析 Lighthouse，可省略 `--lighthouse-cli`。若复测，请使用 `before-2` 等新标签；脚本拒绝覆盖已有标签目录。运行 `node scripts/audit-mobile-performance.mjs --help` 只显示帮助，不启动浏览器。

只有首页发生后续修改时，可选择性复测，并与原来的六页基线中相同页面比较：

```powershell
node scripts/audit-mobile-performance.mjs --base-url http://127.0.0.1:3008 --label after-home-cls --pages home --runs 3 --output-dir output/mobile-performance/2026-11-15 --lighthouse-cli $auditLighthouseCli --compare output/mobile-performance/2026-11-15/before/summary.json
```

`--pages` 接受上述六个页面名称中的一个或多个（逗号分隔），按固定顺序执行，拒绝未知或重复名称。只复用其他页面结果时，应确保后续源码修改确实不影响那些页面，并保留各组构建标识与报告来源。

如果一组审计中断或个别运行无效，先等待原审计进程退出，保持原生产服务和构建不变，再用相同参数增加 `--resume`：

```powershell
node scripts/audit-mobile-performance.mjs --base-url http://127.0.0.1:3008 --label before --runs 3 --output-dir output/mobile-performance/2026-11-15 --lighthouse-cli $auditLighthouseCli --resume
```

续跑只接受相同标签、base URL、运行次数和固定页面。脚本重新验证已有原始 JSON，复用有效运行，每个缺失或无效运行在本次调用中最多尝试一次。原失败 JSON 保留，新尝试写入 `run-N-retry-<timestamp>.json`；每页完成即更新汇总，六页各三次全部有效后 `complete` 才为 `true`。没有 `finishedAt` 的旧汇总也可续跑；失败仍返回非零。

**续跑必须使用原 production build、相同内容与测量配置，不能在切换到修改后构建后给 `before` 续跑。** 脚本能核对 URL、Lighthouse/Chrome 版本与测量配置，不能自动证明远端服务仍是原构建；切换构建前应先把该组补齐。`--resume --compare <before/summary.json>` 可用于补齐 `after` 并重新生成比较。

输出结构为 `<output-dir>/<label>/<page>/run-1.json` 及 `<output-dir>/<label>/summary.json`。汇总记录每次 Lighthouse 版本、实际配置、Chrome 环境、分数、LCP/FCP/CLS/TBT、网络传输/资源字节、请求数、LCP 元素与资源候选证据、中位数及原始报告路径。资源能通过 insight 表关联到 LCP 节点时保存实际 URL；只有 HTML `src` 时明确标为候选，因为 `srcset` 最终选择可能不同；文本 LCP 没有图片资源属于正常情况。

脚本在标签输出目录生成 `lighthouse.config.mjs`，继承 `lighthouse:default`，仅将 `maxWaitForFcp` 与 `maxWaitForLoad` 放宽到 90,000ms，并在汇总中记录。目的是容忍已核实的本地跨网数据库读取延迟，避免等待首字节超过默认 30 秒导致 `NO_FCP`；这是审计容错，不是性能优化，不改变 mobile/Slow 4G/simulate 测量参数。续跑可复用原默认 30 秒等待上限下已成功的样本，两者的成功样本测量模型相同；每份原始 JSON 仍保留各自实际配置。不能把本地 TTFB 波动或放宽超时当作线上性能改善。

`runtimeError`、异常跳转、缺失指标、配置变化或命令失败会标为无效，该命令返回非零；无效运行不会被当作零分放入中位数。三次均有效才能作为完整基线。`--compare` 只在两组完整、页面/版本/配置/运行次数一致时输出 `after - before` 中位数差值：LCP/FCP/TBT/字节为负表示下降，分数为正表示上升。还需人工确认机器、后台负载、网络、内容与服务端缓存条件相同。

## 缓存与解释边界

Lighthouse 13.6.0 默认模拟 Moto G Power（412 × 823、DPR 1.75），mobile/Slow 4G，使用 `simulate`。每次 CLI 调用创建独立浏览器配置并保留默认存储重置，因此浏览器缓存按冷缓存处理。脚本不会重置 Next 图片优化器、数据库、源图片 CDN 或其他服务端缓存。

图片首次由 `/_next/image` 生成时，下载原图与 Sharp 编码会增加延迟；后续命中服务端缓存可能更快。比较前后应保持同样条件：可在每组审计前，以同样方式预热所有待测页面及实际移动端图片变体，然后比较服务端已预热、浏览器冷缓存的三次结果；若测首次优化成本，分别记录每组第一次请求和缓存头，单独解释，不把冷热差异算作代码收益。仅预热 HTML 不保证图片优化缓存已生成。不要为了测量清除生产缓存。

本地结果用于判断代码和资源变化，不能直接与 PageSpeed Insights 分数比较：机房、网络路径、服务器、数据库、缓存和 CPU 条件均不同。上线后应对正式 URL 再测，并核对图片返回状态、格式、尺寸、字节和 Nginx/Next 响应缓存。

Next 自托管的默认图片优化发生在运行时。启用原先 `unoptimized` 的远程图片前，应确认 URL 命中 `remotePatterns`、原图无需认证、Sharp 可用、服务器可访问源图、`/_next/image` 能穿过 Nginx，代理正确传递 `Accept` 且保留内容协商缓存差异；同时检查首次转换耗时、服务器内存及 `.next/cache/images` 可写。当前文档依据仓库内 `node_modules/next/dist/docs/01-app/02-guides/self-hosting.md` 与 `03-api-reference/02-components/image.md`，具体运行环境仍需实测。

## 原始 PSI 背景

本次 SEO 审计原始文件 `glarivo-seo-20261115/psi-summary.json` 记录 2026-11-15 的单次 PSI 移动端实验室测量（Lighthouse 13.6.0、Moto G Power、Slow 4G）。这里只保留来源说明，脚本不依赖原始报告所在的本机路径。

| 页面 | Performance | LCP（ms） | CLS | TBT（ms） |
| --- | ---: | ---: | ---: | ---: |
| Home | 74 | 6263 | 0 | 50 |
| Products | 77 | 6355 | 0 | 8 |
| Cosmetic guide | 100 | 927 | 0 | 43 |
| Shot glass category | 76 | 6120 | 0 | 99 |
| Cosmetic category | 77 | 6476 | 0 | 17 |
| Dishwasher article | 76 | 6479 | 0 | 33 |

六页真实用户数据面板均为 **No Data**，没有可用的 INP 或真实用户 p75 LCP/CLS。该背景是单次线上实验室快照，不是本地修改前后基线，也不能证明真实用户指标改善。

## 2026-11-15 本地验证结果

状态：当前工作区的修改尚未部署。生产构建、定向 ESLint、移动端实际取图和图片来源检查通过。导航 Logo 按显示尺寸取图，首屏大图/封面带高优先级提示；文章封面、产品缩略图恢复响应式优化，产品卡片保留原生延迟加载。分类背景原图与裁切保持不变。

每个页面修改前后均为三次有效 Lighthouse 13.6.0 移动端模拟 Slow 4G 运行的中位数。最初六份 `NO_FCP` 失败记录已原样保留，补测后基线有完整18份有效报告。等待上限由30秒延长到90秒只用于容忍本地跨网数据库读取，并非网站性能修复。最后一次修改仅涉及首页 CSS，另对首页补测三次；其他五页沿用图片修改后的结果。

| 页面 | 导航总传输量前 → 后（KB，1000 B） | 减少 | 模拟 LCP 前 → 后（秒） |
| --- | ---: | ---: | ---: |
| 首页 | 796 → 726 | 8.8% | 4.08 → 4.15 |
| Products | 1307 → 718 | 45.1% | 3.70 → 4.00 |
| Cosmetic guide | 657 → 587 | 10.7% | 0.74 → 0.71 |
| Shot Glass 分类 | 1007 → 598 | 40.7% | 3.70 → 4.15 |
| Cosmetic 分类 | 1364 → 721 | 47.1% | 3.70 → 4.29 |
| 最新 Dishwasher 文章 | 636 → 456 | 28.3% | 4.33 → 3.46 |

总传输量包含该次导航记录到的 HTML、脚本、字体和图片，不等于只有首屏图片。资源节省可重复观察到；模拟 LCP 没有一致改善，部分页面中位数上升。实际网络记录中主图发现/加载链路没有同幅度恶化，图片优化缓存热身也改变了模拟器纳入的请求依赖；不能仅依据本地模拟结果宣称线上或真实用户改善，也不能把原始 TTFB 与模拟 LCP 混成一条计时。应在正式部署后再对线上 URL 复测。

另修正了一个可独立复现的首页布局位移：字体从回退字体换为 Manrope 后，CTA 从一行换为两行，文案容器上移约63px。窄屏现在预先保持两行，固定容器宽度；412px屏宽的字体阻断/恢复检查中容器位置变化为0px。首页 CLS 从图片调整阶段三次均约0.126降到最终三次中位数约0.00113。原始基线也曾出现一次约0.125，因此这是已有字体切换风险的修正，不能将原始基线的CLS中位数0改写为0.126。

本地原始报告与汇总位于 `output/mobile-performance/2026-11-15/`（已被仓库忽略）：`before/summary.json`、`after/summary.json`、`after-home-cls/summary.json`、`final-summary.json`；各组 `build.json` 保留构建标识。`final-summary.json` 明确记录首页单独复测及其他页面报告的来源。复测新版本应使用新标签，保留旧样本。
